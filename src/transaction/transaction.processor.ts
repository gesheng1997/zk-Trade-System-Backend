import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectQueue, OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from "bull";
import batchCount from "src/constant/batchCount";
import { v4 as uuid } from 'uuid';
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from 'typeorm';
import { Transaction } from "./entities/transaction.entity";
import TransactionState from "src/constant/transactionState";
import Exception from "src/constant/exceptionType";
import getOrgPem from "src/utils/getOrgPem";
import envConfig from "src/config/envConfig";
import serverSignVouchers from "src/utils/serverSignVouchers";
import { TransactionService } from "./transaction.service";
import { User } from "src/user/entities/user.entity";
import snarkjs from 'snarkjs';
import fs from 'fs';
import path from 'path'

@Injectable()
@Processor('transaction')
export class TransactionProcessor{
    constructor(
      @InjectQueue('verify') private readonly verifyQueue: Queue,
      @InjectQueue('transaction') private readonly transactionQueue: Queue,
      @InjectRepository(Transaction) private readonly transaction: Repository<Transaction>,
	  @InjectRepository(User) private readonly user: Repository<User>,
      @InjectEntityManager() private readonly entityManager: EntityManager, 
	  private readonly transactionService: TransactionService,
    ){ }

    @Process('transCome')
    async handleTransaction(job:Job){
        // const tasksToProcess = 4; // 设定要一次性处理的任务数量
        const currentQueueSize = await this.transactionQueue.getCompletedCount();

        console.log(currentQueueSize);

        if (currentQueueSize >= batchCount.count) {

            console.log('\n*********************开始一次打包！*************************\n')

            const transactions = await this.transactionQueue.getJobs(['completed'],0,3,true);

			//声明零知识证明所需要的一些参数
			//使用Map可以做到在一次循环之内完成参数生成
			const userIds:Map<number,number> = new Map<number,number>();
			const batchTransactions:Array<Array<Array<number>>> = [];
			const initBalances:Array<number> = [];
			const finalBalances:Array<number> = [];
			//最后生成的数组的索引计数器
			let count = 0;

			//将即将被打包的交易移出二级队列，并生成零知识证明交易包所需的参数
            for(const trans of transactions){
				const {from,to,amount} = trans.data;
				const fromUserChange = [];
				const toUserChange = [];
				/* 				
					Map中已存在该交易的fromId的键，则取出其对应的值，
					即索引位置，并更新finalBalances数组在该索引位置上的值 
				*/
				if(userIds.has(from)){
					const idx = userIds.get(from);
					fromUserChange.push([from,idx,-amount]);
					finalBalances[idx] -= amount;
				}/* 
					不存在，则向Map中加一条，并查表将其余额初始状态写入initBalance数组，
					将initBalance中写入的值减去当前交易中from用户的扣款写入finalBalance
					并且这一条的键为fromId，值为当前count值，最后count自加 
				*/
				else{
					userIds.set(from,count);

					const res = await this.user.findOne({
						where:{id:from}
					});
					initBalances.push(res.balance);
					finalBalances.push(res.balance - amount);

					fromUserChange.push([from,count,-amount]);
					count++;
				}

				//对toId如法炮制
				if(userIds.has(to)){
					const idx = userIds.get(to)
					toUserChange.push([to,idx,amount]);
					finalBalances[idx] += amount;
				}else{
					userIds.set(to,count);

					const res = await this.user.findOne({
						where:{id:to}
					});
					initBalances.push(res.balance);
					finalBalances.push(res.balance + amount);

					toUserChange.push([to,count,amount]);
					count++;
				}

				//生成好fromUserChange和toUserChange之后，将它们打包成一个数组加入batchTransacitons数组
				batchTransactions.push([fromUserChange,toUserChange]);

				trans.remove();
            }

			const ids = Array.from(userIds.keys());
			const padding:number[] = Array(batchCount.count * 2 - ids.length).fill(0);
			//ids、initBalance以及finalBalance数组都应该填充到打包交易数量的两倍
			//因为电路代码的特点和要求，同时m笔打包交易最多涉及2*m个不同的用户
			ids.push(...padding);
			initBalances.push(...padding);
			finalBalances.push(...padding);

            //组装一个打包交易，此处使用uuid的原因是标识这笔打包交易，
			//保证一级队列完成验证事件发生时可以检测成功验证的打包交易是不是我这个processor发出的！
            const uuidValue = uuid();
            const batchTrans = {
				ids,
				initBalances,
				finalBalances,
				batchTransactions,
            }
			//使用snarkjs对打包交易生成零知识证明
			const { proof, publicSignals } = await snarkjs.plonk.fullProve(batchTrans,"../circuit/batchtransaction_js/batchtransaction.wasm","../circuit/batchtransaction_final.zkey")

			const vKey = JSON.parse(fs.readFileSync(path.resolve('..','circuit','verification_key.json')).toString('utf8'));

			const zkTrans = {
				uuid,
				ids,
				finalBalances,
				proof,
				publicSignals,
				vKey,
			}
			//打包交易加入一级队列
			this.verifyQueue.add('verifyCome',zkTrans);
            console.log('\n*********************打包交易处理完成！**********************\n')

            //加入一级队列
            this.verifyQueue.add('verifyCome',batchTrans);

            //加入一级队列之后，更新批量交易状态
            try {
				this.entityManager.transaction(async transacionalEntityManager => {
					for(const trans of transactions){
					transacionalEntityManager.getRepository(Transaction).update(trans.id,{state:TransactionState.VERIFYING});
					}
				})
            } catch (error) {
					throw new HttpException({
					code:Exception.UPDATE_TRANSACTION_STATE_FAIL,
					message:'Error When Trying To Update Batch Transactions\' State',
				},HttpStatus.INTERNAL_SERVER_ERROR);
            }


			//定义一级队列成功验证事件的监听器函数
			const successEventListener = (uuid) => {
				//说明当前一级队列上完成的打包交易验证任务，确实是这个processor之前发出的
				if(uuidValue === uuid){
					/*                 
					调用service更新交易数据库中的条目，修改成功后再调用userService更新用户表
					之后再调用凭证生成方法批量生成多笔交易的凭证
					关于这个uuid的强随机性和抗碰撞性，可以进行严格安全分析

					关于fabric上打包交易和链下交易的对应性，考虑在交易表中额外加上一个字段，标识每笔交易属于fabric上哪个id的打包交易
					*/
					
					try {
						this.entityManager.transaction(async transacionalEntityManager => {
							for(const trans of transactions){
								transacionalEntityManager.getRepository(Transaction).update(trans.data.id,{state:TransactionState.VERIFIED});
							}
						});
						//成功验证之后移除该对一级队列的监听器
						this.verifyQueue.removeListener('verifySuccessEvent',successEventListener);
					} catch (error) {
						//数据库更新失败之后也要移除该对一级队列的监听器
						this.verifyQueue.removeListener('verifySuccessEvent',successEventListener);

						throw new HttpException({
							code:Exception.UPDATE_TRANSACTION_STATE_FAIL,
							message:'Error When Trying To Update Batch Transactions\' State',
						},HttpStatus.INTERNAL_SERVER_ERROR);
					} 
					//验证成功之后，首先让服务器对凭证签名（即对digest签名）
					const transDigests = transactions.map(trans => ({
						id:trans.data.id,
						digest:trans.data.digest,
					}));

					serverSignVouchers(transDigests).then(signatures => {
						//最终调用更新涉及用户余额方法，方法中会更余额并最终将交易状态置为SETTLED
						this.transactionService.updateTransBalances(ids,finalBalances,signatures);
					});
				}
			}
	
			const failEventListener = (uuid) => {
				if(uuidValue === uuid){
					try {
						this.entityManager.transaction(async transacionalEntityManager => {
							for(const trans of transactions){
								transacionalEntityManager.getRepository(Transaction).update(trans.data.id,{state:TransactionState.FAILED});
							}
						});
						//成功验证之后移除该对一级队列的监听器
						this.verifyQueue.removeListener('verifySuccessEvent',successEventListener);
					} catch (error) {
						//数据库更新失败之后也要移除该对一级队列的监听器
						this.verifyQueue.removeListener('verifySuccessEvent',successEventListener);

						throw new HttpException({
							code:Exception.UPDATE_TRANSACTION_STATE_FAIL,
							message:'Error When Trying To Update Batch Transactions\' State',
						},HttpStatus.INTERNAL_SERVER_ERROR);
					}
				}
			}
	

            //订阅一级队列fabric验证完成事件，事件回调函数调用transactionService中的方法更新涉及的交易的状态
            this.verifyQueue.on('verifySuccessEvent',successEventListener);
			//订阅一级队列fabric验证完成事件，事件回调函数调用transactionService中的方法更新涉及的交易的状态
			this.verifyQueue.on('verifyFailEvent',failEventListener);
        }
    }
}