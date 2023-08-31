import TransactionState from 'src/constant/transactionState';
import TransactionType from 'src/constant/transactionType';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
  

/* 交易表schema */
@Entity()
export class Transaction {
    //交易id
	@PrimaryGeneratedColumn({ type: 'int' })
	id: number;

	@CreateDateColumn({ type: 'timestamp' })
	gmt_create: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	gmt_modified: Date;

    //交易发起人的id
	@Column({ type: 'int' })
	from: number;

    //交易接收者的id
    @Column({ type: 'int' })
	to: number;

    //转账金额
    @Column({ type: 'int' })
	amount: number;

    //交易状态
    @Column({ type:'enum', enum: TransactionState })
    state:number;

    //交易类型
    @Column({ type:'enum', enum: TransactionType})
    type:number;

    @Column({ type:'timestamp' })
    initTime: Date;

    //发起方对交易留言
    @Column({ type:'varchar', length:1000 })
    comment:string;

    //交易摘要，发起方和服务器就对这个进行签名
    @Column({ type:'varchar', length:64 })
    digest:string;

    //发起方publicKey可以通过id查询其账户获取，此处不需要了

    //交易发起方对于凭证的签名Ed25519，不能为空
    @Column({ type:'varchar', length:1160})
	fromSignature:string;

    //本服务器对于凭证的签名ECDSA，可以为空，因为交易可能验证失败
    @Column({ type:'varchar', length:1160, nullable: true})
	serverVouchersig:string;

    //服务器pemCert很长，不适合放在数据库，需要时请求文件
}