import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import Exception from 'src/constant/exceptionType';
import TransactionState from 'src/constant/transactionState';
import TransactionType from 'src/constant/transactionType';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Organization } from 'src/user/entities/organization.entity';
import { TransactionDto } from './dto/transaction.dto';
import { UserService } from 'src/user/user.service';
import { VoucherDto } from './dto/voucher.dto';
import getOrgPem from 'src/utils/getOrgPem';
import envConfig from 'src/config/envConfig';
import encodeUTF8 from 'src/utils/encodeUTF8';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(User) private readonly user:Repository<User>,
	@InjectRepository(Organization) private readonly organization:Repository<Organization>,
    @InjectRepository(Transaction) private readonly transaction: Repository<Transaction>,
	@InjectQueue('transaction') private readonly transactionQueue: Queue,
	@InjectEntityManager() private readonly entityManager: EntityManager,
	private readonly userService: UserService,
  ){}

  	//目前退款和一般交易都调用这个service方法！对于退款其实还应该有一些复杂判断，后面再完善
  	async createNormalTrans(createTransactionDto: CreateTransactionDto): Promise<number> {
		const ed = await import('@noble/ed25519');		
		const { from, to, amount, signature, comment, digest, timestamp } = createTransactionDto;

		//获取交易发起人详细信息
		const fromUser = await this.user.findOne({
			where:{id:from},
		});

		//不能发起转账金额小于0的交易,还应该加上时间戳和现在时间相减小于3s判断，防重放
		if(amount < 0){
			throw new HttpException({
				code:Exception.INVALID_TRANSACTION,
				message:'Invalid Transaction'
			},HttpStatus.BAD_REQUEST);
		}

		//用户余额不足，报错
		if(fromUser.balance < amount){
			throw new HttpException({
				code:Exception.NOT_ENOUGH_BALANCE,
				message:'Not Enough Balance to Pay'
			},HttpStatus.BAD_REQUEST);
		}

		//验证签名
		const publicKey = Buffer.from(decodeBase64(fromUser.publicKey)).toString('hex');
		const isValid = await ed.verifyAsync(signature, digest, publicKey);

		if(isValid){
			//将交易写入交易表
			const newTrans = await this.transaction.save({
				from,
				to,
				amount,
				state:TransactionState.LAUNCHED,
				type:TransactionType.NORMAL,
				fromSignature:signature,
				digest,
				initTime:timestamp,
				comment,
			});

			//单笔交易加入队列
			this.transactionQueue.add({
				transactionId:newTrans.id,
				from,
				to,
				amount,
				digest,
				type:TransactionType.NORMAL
			})

			//更新交易状态为排队中
			this.transaction.update(newTrans.id,{state:TransactionState.QUEUEING});

			return newTrans.id;
		}else{
			throw new HttpException({
				code:Exception.VERIFY_FAIL,
				message:'verify fail'
			},HttpStatus.UNAUTHORIZED);
		}
  	}

	//充值特殊交易
	async createDepositTrans(createTransactionDto: CreateTransactionDto):Promise<number>{
		const ed = await import('@noble/ed25519');		
		const { from, to, amount, signature, comment, digest, timestamp } = createTransactionDto;

		//timestamp检测,对于存钱交易amount必须<0
		if(amount >= 0) throw new HttpException({
			code:Exception.INVALID_TRANSACTION,
			message:'Amount Of Deposit Transaction Cannot Be Great Or Equal to 0'
		},HttpStatus.BAD_REQUEST);

		//查询金融组织详细信息
		const orgInfo = await this.organization.findOne({
			where:{userId:to}
		});
		//组织不存在，报错
		if(!orgInfo){
			throw new HttpException({
				code:Exception.INVALID_ORGANIZAITON,
				message:'Orgnization Does not Exist'
			},HttpStatus.UNAUTHORIZED);
		}

		//此处需要向组织发送请求查询用户余额是否充足？是否足够向系统中充入指定金额
		//此处示例代码，所有充值操作以及金额都是允许的

		//验证用户签名
		const fromUser = await this.user.findOne({
			where:{id:from},
		});

		const isValid = await ed.verifyAsync(signature, digest, fromUser.publicKey);

		if(isValid){
			//将交易写入交易表
			const newTrans = await this.transaction.save({ 
				from,
				to,
				amount,
				state:TransactionState.LAUNCHED,
				type:TransactionType.NORMAL,
				fromSignature:signature,
				digest,
				initTime:timestamp,
				comment,
			});

			//单笔交易加入队列
			this.transactionQueue.add('transCome',{
				transactionId:newTrans.id,
				from,
				to,
				amount,
				digest,
				type:TransactionType.DEPOSIT
			});

			this.transaction.update(newTrans.id,{state:TransactionState.QUEUEING});

			return newTrans.id;
		}else{
			throw new HttpException({
				code:Exception.VERIFY_FAIL,
				message:'verify fail'
			},HttpStatus.UNAUTHORIZED);
		}
	}

	async createWithdrawTrans(createTransactionDto: CreateTransactionDto):Promise<number>{
		const ed = await import('@noble/ed25519');		
		const { from, to, amount, signature, comment, digest, timestamp } = createTransactionDto;

		//timestamp检测,amount必须>0
		if(amount <= 0) throw new HttpException({
			code:Exception.INVALID_TRANSACTION,
			message:'Amount Of Deposit Transaction Cannot Be Less Or Equal to 0'
		},HttpStatus.BAD_REQUEST);

		//这里需要调用金融组织api将提现金额充入其中

		//查询金融组织详细信息
		const orgInfo = await this.organization.findOne({
			where:{id:to}
		});
		//组织不存在，报错
		if(!orgInfo){
			throw new HttpException({
				code:Exception.INVALID_ORGANIZAITON,
				message:'Orgnization Does not Exist'
			},HttpStatus.UNAUTHORIZED);
		}

		//验证用户签名
		const fromUser = await this.user.findOne({
			where:{id:from},
		});

		const publicKey = Buffer.from(decodeBase64(fromUser.publicKey)).toString('hex');
		const isValid = await ed.verifyAsync(signature, digest, publicKey);

		if(isValid){
			//将交易写入交易表
			const newTrans = await this.transaction.save({
				from,
				to,
				amount,
				state:TransactionState.LAUNCHED,
				type:TransactionType.NORMAL,
				fromSignature:signature,
				digest,
				initTime:timestamp,
				comment,
			});

			//单笔交易加入队列
			this.transactionQueue.add({
				transactionId:newTrans.id,
				from,
				to,
				amount,
				digest,
				type:TransactionType.WITHDRAW
			})

			this.transaction.update(newTrans.id,{state:TransactionState.QUEUEING});

			return newTrans.id;
		}else{
			throw new HttpException({
				code:Exception.VERIFY_FAIL,
				message:'verify fail'
			},HttpStatus.UNAUTHORIZED);
		}
	}

	async findAll():Promise<Array<TransactionDto>> {
		//查找所有交易并按创建时间降序排列
		const transactions = await this.transaction.find({
			order:{gmt_create:'DESC'}
		});

		const results = transactions.map((transaction) => {
			const { id, from, to, amount, comment, type, state, initTime, gmt_modified } = transaction;
			let fromUsername:string;
			let toUsername:string;

			this.user.findBy({id:In([from,to])}).then(users => {
				for(const user of users){
					if(user.id === from) fromUsername = user.username;
					else toUsername = user.username;
				}
			})

			const result:TransactionDto = {
				id,
				from,
				fromUsername,
				to,
				toUsername,
				amount,
				comment,
				state,
				type,
				initTime,
				gmt_modified,
			}

			return result;
		});
		return results;
	}

	async findAllMyTrans(id:number):Promise<Array<TransactionDto>> {
		const transactions = await
			this.transaction
				.createQueryBuilder()
				.from(Transaction,'transaction')
				.where('transaction.from = :id',{id})
				.orWhere('transaction.to = :id',{id})
				.orderBy('gmt_create','DESC')
				.getMany();

		const results = transactions.map((transaction) => {
			const { id, from, to, amount, comment, type, state, initTime, gmt_modified } = transaction;
			let fromUsername:string;
			let toUsername:string;

			this.user.findBy({id:In([from,to])}).then(users => {
				for(const user of users){
					if(user.id === from) fromUsername = user.username;
					else toUsername = user.username;
				}
			})
			const result:TransactionDto = {
				id,
				from,
				fromUsername,
				to,
				toUsername,
				amount,
				comment,
				state,
				type,
				initTime,
				gmt_modified,
			}

			return result;
		});
		return results;
	}
	

	async findOne(id: number) {
		return `This action returns a #${id} transaction`;
	}

	// private async updateTransState(id: number, state:TransactionState):Promise<boolean> {
	// 	const success = this.transaction.update(id,{state});

	// 	if(!success) return false;
	// 	return true;
	// }

	//批量更新验证完成的交易的状态以及批量交易涉及用户的余额，返回影响的用户个数
	async updateTransBalances(userIds: Array<number>, finalBalances: Array<number>, serverSignatures:Array<{id:number,signature:string}>):Promise<number> {
		//开启数据库事务，批量更新用户余额以及交易状态，更新过程中如果存在一个失败则全部回滚并报错
		try {
			this.entityManager.transaction(async transactionalEntityManager => {
                for(const [idx,id] of userIds.entries() ){
                    await transactionalEntityManager
						.getRepository(User)
						.update(id,{balance:finalBalances[idx]});
                }

				for(const serverSignature of serverSignatures){
					transactionalEntityManager
					.getRepository(Transaction)
					.update(serverSignature.id,{
						state:TransactionState.SETTLED,
						serverVouchersig:serverSignature.signature,
					});
				}
			});

			return userIds.length;
		} catch (error) {
			throw new HttpException({
                code:Exception.UPDATE_BALANCES_FAIL,
                message:'Error When Settle Balances In Batch In User Table'
            },HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	// remove(id: number) {
	// 	return `This action removes a #${id} transaction`;
	// }

	async generateVoucher(id:number):Promise<string>{
		const target = await this.transaction.findOne({
			where:{id}
		});

		const { from, to, amount, comment, fromSignature, serverVouchersig, initTime, digest } = target;

		const fromUser = await this.user.findOne({
			where:{id:from},
		});

		const toUser = await this.user.findOne({
			where:{id:to},
		});

		const voucherObj:VoucherDto = {
			from,
			fromUsername:fromUser.username,
			to,
			toUsername:toUser.username,
			amount,
			timestamp:initTime,
			comment,
			digest,
			transactionId:id,
			fromPublicKey:fromUser.publicKey,
			fromSignature,
			serverPemCert:getOrgPem(envConfig.orgname),
			serverSignature:serverVouchersig,
		};

		const voucherStr = JSON.stringify(voucherObj);
		const voucher = encodeBase64(Uint8Array.from(Buffer.from(voucherStr)));
		return voucher;
	}

	//用于做压力测试的一次性发大量交易的接口，发的交易都是同样的，并且count表示交易个数
	async createBatchNormalTrans(count:number,createTransactionDto: CreateTransactionDto):Promise<string>{
		for(let i = 0;i < count;i++){
			this.createNormalTrans(createTransactionDto);
		}

		return 'ok';
	}
}
