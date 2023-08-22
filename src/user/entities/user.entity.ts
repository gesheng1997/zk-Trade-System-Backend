import userType from 'src/constant/userType';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/* 用户表schema */
@Entity()
export class User {
	@PrimaryGeneratedColumn({ type: 'int' })
	id: number;

	@CreateDateColumn({ type: 'timestamp' })
	gmt_create: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	gmt_modified: Date;

	@Column({ type: 'varchar', length: 200, unique: true })
	username: string;

	//密码存储为明文的加盐哈希值----由于准备使用sha256 故只预留32byte大小
	@Column({ type: 'varchar', length: 100 })
	password: string;

	//公钥将会以base64字符串的形式存储在库中，之后通过tweetnacl-utils中的decodeBase64方法解码为Uint8Array
	@Column({ type: 'varchar', length: 100 })
	publicKey: string;

	//账户余额，设计成纯整数
	@Column({ type: 'int' })
	balance: number;

	@Column({ type: 'enum', enum: userType })
	type: number;

	//这里不需要写@index()注解了！因为unique:true会自动创建唯一索引
	@Column({ type: 'varchar', nullable: true, length: 20, unique: true })
	phone: string;

	@Column({ type: 'varchar', nullable: true, length: 35, unique: true })
	email: string;

	@Column({ type: 'date', nullable: true })
	birthday: Date;

	@Column({ type: 'varchar', length:255 ,nullable: true })
	address: string;

	//头像文件的静态地址
	@Column({ type: 'varchar', length: 100, nullable: true  })
	avatar: string;

	//标识用户账户是否已经注销
	@Column({ type: 'enum', enum: { dead: 0, alive: 1 } })
	alive: number;
}
