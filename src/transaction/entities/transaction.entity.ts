import transactionState from 'src/constant/transactionState';
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

	@Column({ type: 'int' })
	from: number;

    @Column({ type: 'int' })
	to: number;

    @Column({ type: 'int' })
	amount: number;

	@Column({ type:'varchar', length:1160 })
	signature:string;

    @Column({ type:'enum', enum: transactionState })
    state:number;
}