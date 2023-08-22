import { Injectable } from "@nestjs/common";
import { InjectQueue, OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from "bull";
import batchCount from "src/constant/batchCount";
import { v4 as uuid } from 'uuid';

@Injectable()
@Processor('transaction')
export class TransactionProcessor{
    constructor(
      @InjectQueue('verify') private readonly verifyQueue: Queue,
      @InjectQueue('transaction') private readonly transactionQueue: Queue
    ){
        this.tasksToProcess = batchCount.count;
    }

    tasksToProcess:number;

    @Process('transCome')
    async handleTransaction(job:Job){
        // const tasksToProcess = 4; // 设定要一次性处理的任务数量
        const currentQueueSize = await this.transactionQueue.getCompletedCount();

        console.log(currentQueueSize);

        if (currentQueueSize >= this.tasksToProcess) {

            console.log('\n*********************开始一次打包！*************************\n')

            const transactions = await this.transactionQueue.getJobs(['completed'],0,3,true);

            for(const trans of transactions){
              console.log({
                id:trans.id,
                data:trans.data,
                status:await trans.getState(),
              })
              trans.remove();
            }

            //组装一个打包交易，按照零知识证明电路需要的输入整合,这里写个示例 后面再细化
            //此处使用uuid的原因是标识这笔打包交易，保证一级队列完成验证事件发生时可以检测成功验证的打包交易是不是我这个processor发出的！
            const uuidValue = uuid();
            const batchTrans = {
              name:'batch',
              uuid:uuidValue,
            }
            console.log('\n*********************打包交易处理完成！**********************\n')

            //加入一级队列
            this.verifyQueue.add('verifyCome',batchTrans);

            //订阅一级队列fabric验证完成事件，事件回调函数调用transactionService中的方法更新涉及的交易的状态
            this.verifyQueue.on('verifySuccessEvent',(uuid) => {
              //说明当前一级队列上完成的打包交易验证任务，确实是我之前发出的
              if(uuidValue === uuid){
                    /*                 
                      调用service更新交易数据库中的条目，修改成功后再调用userService更新用户表
                      关于这个uuid的强随机性和抗碰撞性，可以进行严格安全分析
                    */              
              }
            })
        }
    }
}