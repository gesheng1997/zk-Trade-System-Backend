import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
  
@Entity()
export class Organization{
	@PrimaryGeneratedColumn({ type: 'int' })
	id: number;

	@CreateDateColumn({ type: 'timestamp' })
	gmt_create: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	gmt_modified: Date;

	@Column({ type: 'int', unique: true })
	userId: number;

	@Column({ type: 'varchar', length: 200, unique: true })
	orgname: string;

	@Column({ type:'varchar', length:1160 })
	pemCert:string;

	//密码存储为明文的加盐哈希值----由于准备使用sha256 故只预留32byte大小
	@Column({ type: 'varchar', length: 100 })
	password: string;

	//公钥将会以base64字符串的形式存储在库中，之后通过tweetnacl-utils中的decodeBase64方法解码为Uint8Array
	@Column({ type: 'varchar', length: 100 })
	publicKey: string;
}