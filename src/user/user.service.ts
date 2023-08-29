import { HttpException, HttpStatus, Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { buffer2bits, chunkBigInt } from 'src/utils/mathUtils';

import {
  AdminRegisterDto,
  OrgRegisterDto,
  UserRegisterDto,
} from './dto/user-register.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { CheckUserLoginDto } from './dto/check-user-login.dto';
import { createAccount, createOrgAccount, deleteAccount, initLedger, readAllAccounts } from 'src/utils/chaincodeAccountMethods';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import getOrgPem from '../utils/getOrgPem';

import SALT from '../constant/salt';
import verifyX509Cert from 'src/utils/verifyX509Cert';
import verifyExtraECDSASig from 'src/utils/verifyExtraECDSASig';
import { UserInfoDto } from './dto/user-info.dto';
import { JwtService } from '@nestjs/jwt';
import { sha256 } from '@hyperledger/fabric-gateway/dist/hash/hashes';
import { AccountDto } from './dto/account.dto';
import userType from 'src/constant/userType';
import { Organization } from './entities/organization.entity';
import encodeUTF8 from 'src/utils/encodeUTF8';
import { v4 as uuid } from 'uuid';
import Exception from 'src/constant/exceptionType';

const TOKEN = 'ZHUZHUXIHUANNIWENJUN';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
    @InjectRepository(Organization) private readonly organization: Repository<Organization>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private jwtService:JwtService
  ) {}

    //创建普通用户账号的方法
    async createUser(userRegisterDto: UserRegisterDto):Promise<number> {
        const ed = await import('@noble/ed25519');
        const { username, password, publicKey, signature } = userRegisterDto;

        //查询数据库，如果当前欲注册的用户已经注册过了，
        //那么报错，这里要小心dos攻击，前端应该有失败注册次数检测机制
        const targetUser = await this.user.findOne({
            select: ['username','type'],
            where: { username, },
        });
        if (targetUser)
            //指定用户名的用户已存在且不是注销状态情况下报错
            if(targetUser.type !== userType.DELETED){ 
                throw new HttpException({
                    code:Exception.ALREADY_EXIST,
                    message:'User Already Exist',
                }, HttpStatus.BAD_REQUEST);
        }

        //对用户签名进行验证，保证用户具有公钥对应的私钥
        const isValid = await ed.verifyAsync(signature, password, publicKey);
        if (isValid) {
            //获取当前数据库中最大id值，将其+1作为写入链上的id
            //为什么要这样做？因为创建链上账号逻辑上必须在写入后端mysql之前！否则反过来若链上账号创建不成功可能mysql又要删除这个刚插入的数据
            const countId = await this.user.maximum('id');
            let newid:number;

            //若当前库中没有记录，说明处于系统初始化阶段，调用Initledger
            if(!countId){
                try {
                    initLedger();
                } catch (error) {
                    console.log(error);
                    throw new HttpException({
                        code:Exception.INIT_FAIL,
                        message:'Fabric Initialization Fail'
                    },HttpStatus.INTERNAL_SERVER_ERROR,);
                }
                newid = 1;
            }else newid = countId + 1;

            //访问gateway代码，创建链上账号
            try {
                createAccount(newid, userType.NORMAL, publicKey);
            } catch(error) {
                console.log(error);
                throw new HttpException({
                    code:Exception.CREATE_FAIL,
                    message:'Fabric Create Account Fail',
                },HttpStatus.INTERNAL_SERVER_ERROR,);
            }

            //创建链上账号没有报错的情况下，写入数据库
            const passwordSalt = decodeUTF8(password + SALT);
            const passwordHash = encodeBase64(sha256(passwordSalt));

            const resultEntity = await this.user.save({
                username,
                password: passwordHash,
                publicKey,
                balance: 0,
                type: userType.NORMAL,
                alive: 1,
            });
            console.log(resultEntity);
            return resultEntity.id;
        } else {
            throw new HttpException({
                code:Exception.VERIFY_FAIL,
                message:'Verify Signature Fail',
            }, HttpStatus.BAD_REQUEST);
        }
    }

    async createOrgUser(orgRegisterDto: OrgRegisterDto):Promise<number> {
        const ed = await import('@noble/ed25519');
        //输入的pemCert为base64字符串的形式，这是为了方便传输和对比
        const { username, password, publicKey, signature, pemCert, pemSignature } = orgRegisterDto;

        const targetUser = await this.user.findOne({
            select: ['username','type'],
            where: { username, },
        });
        if (targetUser)
            //指定用户名的用户已存在且不是注销状态情况下报错
            if(targetUser.type !== userType.DELETED){ 
                throw new HttpException({
                    code:Exception.ALREADY_EXIST,
                    message:'User Already Exist',
                }, HttpStatus.BAD_REQUEST);
        }

        try {
            //检查企业注册提供的pem证书和已加入联盟的同名组织的pem是否一致，此处pem格式为带开头结尾的BASE64字符串
            const pem = getOrgPem(username);//这里从链上文件中获取pem，返回格式为BASE64
            if(pem !== pemCert) throw new Error();//对比输入和获取的pem，输入的pem也是BASE64
            const pemCertUTF8 = encodeUTF8(decodeBase64(pemCert));//对比完后，再将base64格式的pem转为带begin end的一般格式，以适应后面的验证

            //验证pem证书
            const validCert = verifyX509Cert(pemCertUTF8);
            if(!validCert) throw new Error();

            //验证ECDSA额外签名，证明注册人确实具有证书中的公钥对应的私钥
            const validSig = verifyExtraECDSASig(pemCertUTF8,pemSignature,password);
            if(!validSig) throw new Error();
        } catch (error) {
            throw new HttpException({
                code:Exception.INVALID_PEMCERT,
                message:'Invalid X.509 Certification',
            },HttpStatus.BAD_REQUEST);
        }

        //验证ed25519签名
        const isValid = await ed.verifyAsync(signature, password, publicKey);
        if (isValid) {
            const countId = await this.user.maximum('id');
            let newid:number;

            if(!countId){
                try {
                    initLedger();
                } catch (error) {
                    console.log(error);
                    throw new HttpException({
                        code:Exception.INIT_FAIL,
                        message:'Fabric Initialization Fail'
                    },HttpStatus.INTERNAL_SERVER_ERROR,);
                }
                newid = 1;
            }else newid = countId + 1;

            try {
                createOrgAccount(newid, publicKey, pemCert);
            } catch {
                throw new HttpException({
                    code:Exception.CREATE_FAIL,
                    message:'Fabric Create Account Fail',
                },HttpStatus.INTERNAL_SERVER_ERROR,);
            }
            const passwordSalt = decodeUTF8(password + SALT);
            const passwordHash = encodeBase64(sha256(passwordSalt));

            const resultUser = await this.user.save({
                username,
                password: passwordHash,
                publicKey,
                balance: 0,
                type: userType.ORGANIZATION,
                alive: 1,
            });

            //对于组织，单独拥有组织表并写入
            const resultOrg = await this.organization.save({
                userId:resultUser.id,
                orgname:username,
                pemCert:pemCert,
                password:passwordHash,
                publicKey:publicKey,
            });
            console.log(resultUser);
            console.log(resultOrg);
            return resultUser.id;
        } else {
            throw new HttpException({
                code:Exception.VERIFY_FAIL,
                message:'Verify Signature Fail',
            }, HttpStatus.BAD_REQUEST);
        }
    }

    async createAdminUser(adminRegisterDto: AdminRegisterDto):Promise<number> {
        const ed = await import('@noble/ed25519');
        const { username, password, publicKey, signature, token } = adminRegisterDto;

        console.log(username,password,publicKey,signature,token);

        const targetUser = await this.user.findOne({
            select: ['username','type'],
            where: { username, },
        });
        if (targetUser)
            //指定用户名的用户已存在且不是注销状态情况下报错
            if(targetUser.type !== userType.DELETED){ 
                throw new HttpException({
                    code:Exception.ALREADY_EXIST,
                    message:'User Already Exist',
                }, HttpStatus.BAD_REQUEST);
        }

        //验证管理员注册所必需的token
        if(token !== TOKEN) throw new HttpException({
            code:Exception.WRONG_TOKEN,
            message:'Wrong Administrator Token',
        },HttpStatus.BAD_REQUEST);

        //对用户签名进行验证，保证用户具有公钥对应的私钥
        const isValid = await ed.verifyAsync(signature, password, publicKey);

        if (isValid) {
            const countId = await this.user.maximum('id');
            let newid:number;

            if(!countId){
                try {
                    await initLedger();
                } catch (error) {
                    console.log(error);
                    throw new HttpException({
                        code:Exception.INIT_FAIL,
                        message:'Fabric Initialization Fail'
                    },HttpStatus.INTERNAL_SERVER_ERROR,);
                }
                newid = 1;
            }else newid = countId + 1;

            //访问gateway代码，创建链上账号 
            try {
                await createAccount(newid, userType.ADMIN, publicKey);
            } catch(error) {
                console.log('@',error);
                throw new HttpException({
                    code:Exception.CREATE_FAIL,
                    message:'Fabric Create Account Fail',
                },HttpStatus.INTERNAL_SERVER_ERROR,);
            }

            //创建链上账号没有报错的情况下，写入数据库
            //此处的操作是使用fabric-gateway包提供的sha256函数对加盐密码进行哈希并转为base64存放，该函数要求输入一个Uint8Array
            const passwordSalt = decodeUTF8(password + SALT);
            const passwordHash = encodeBase64(sha256(passwordSalt));

            const resultEntity = await this.user.save({
                username,
                password: passwordHash,
                publicKey,
                balance: 0,
                type: userType.ADMIN,
                alive: 1,
            });
            console.log(resultEntity);
            return resultEntity.id;
        } else {
            throw new HttpException({
                code:Exception.VERIFY_FAIL,
                message:'Verify Signature Fail',
            }, HttpStatus.BAD_REQUEST);
        }
    }

    //用于进行登陆验证的方法
    async checkUser(checkUserLoginDto: CheckUserLoginDto):Promise<UserInfoDto>{
        const { username, phone, email, password } = checkUserLoginDto;
        let findRes:User | null;

        if('username' in checkUserLoginDto){
            findRes = await this.user.findOne({
                where:{ username },
            })
        }else if('phone' in checkUserLoginDto){
            findRes = await this.user.findOne({
                where:{ phone },
            })
        }else if('email' in checkUserLoginDto){
            findRes = await this.user.findOne({
                where:{ email },
            })
        }else{
            //登录时三者都没有提供，报错
            throw new HttpException({
                code:Exception.INVALID_LOGIN,
                message:'Invalid User Login',
            },HttpStatus.BAD_REQUEST);
        }

        //未查询到用户或者用户已经注销，返回null
        if(!findRes || findRes.type === userType.DELETED) return null;
        
        //验证密码
        const passwordSalt = decodeUTF8(password + SALT);
        const passwordHash = encodeBase64(sha256(passwordSalt));
        if(passwordHash != findRes.password){
            throw new HttpException({
                code:Exception.WRONG_PASSWORD,
                message:'Wrong Password',
            },HttpStatus.UNAUTHORIZED);
        }else{
            //登陆成功，为用户签发token
            const payload = {
                userId:findRes.id,
                username:findRes.username,
                userType:findRes.type,
            }
            const access_token = await this.jwtService.signAsync(payload);

            //包装返回对象：
            const userInfo:UserInfoDto = {
                ...findRes,
                access_token,
            }
            return userInfo;
        }
    }

    async findAllTypeUsers(type: number):Promise<Array<User>> {
        const typeUsers = this.user.find({
            where:{type},
        });
        return typeUsers;
    }

    async getUserInfo(id: number):Promise<User> {
        const targetUser = this.user.findOne({
            where:{id},
        })
        return targetUser;
    }

    //更新账户相关的信息，不涉及账户余额以及公私钥的更新
    async updateUserInfo(id:number,updateUserInfoDto:UpdateUserInfoDto):Promise<boolean>{
        const success = await this.user.update(id,updateUserInfoDto);
        console.log(success);

        if(success) return true;
        else return false; 
    }

    /*   
        批量更新余额方法，在缓冲队列中间件检测到交易数量达到chunk大小时，
        会先调用交易接口中的批量验证交易的方法，那个方法会验证并更新链上账户中的余额，
        验证并更新成功之后调用这边的批量更新方法更新后端数据库

        删除这个方法，不需要了，因为批量更新用户余额和批量更新交易状态应该是一个事务，
        如果在这里加这个方法就成了两个事务，故这部分逻辑移到transactionService中一起做
    */
    // async updateAccountBalances(ids:number[],balances:number[]):Promise<boolean>{
    //     //开启事务更新批量交易中涉及的用户的余额
    //     try {
    //         this.entityManager.transaction(async transactionalEntityManager => {
    //             for(const [idx,id] of ids.entries() ){
    //                 await transactionalEntityManager.getRepository(User).update(id,{balance:balances[idx]});
    //             }
    //         });
    //     } catch (error) {
    //         throw new HttpException({
    //             code:Exception.UPDATE_BALANCES_FAIL,
    //             message:'Error When Update Balances In Batch In User Table'
    //         },HttpStatus.INTERNAL_SERVER_ERROR)
    //     }

    //     return true;
    //     // ids.forEach((id,idx) => {
    //     //     this.user.transaction(id,{balance:balances[idx]}).then(success => {
    //     //         if(!success)
    //     //     })
    //     // })
    // }

    //更新单个账户的余额是一个私有方法，被批量更新余额方法调用
    // private async updateAccountBalance(id: number, balance:number):Promise<boolean> {
    //     const success = this.user.update(id,{balance});

    //     if(success) return true;
    //     else return false;
    // }

    async deleteUser(id: number):Promise<boolean> {
        try {
            await deleteAccount(id);
        } catch (error) {
            throw new HttpException({
                code:Exception.DELETE_FAIL,
                message:'Fabric Delete Fail',
            },HttpStatus.INTERNAL_SERVER_ERROR);
        }

        //这里对于删除的用户，需要将他们的所有信息置为空，并且将用户名设为随机uuid
        const deleteUserObj = {
            username:uuid(),
            password:'',
            publicKey:'',
            balance:0,
            type:userType.DELETED,
            avatar:'',
            alive:0,
        }

        const success = this.user.update(id,deleteUserObj);

        if(success) return true;
        else return false;
    }

    async getAllAccounts():Promise<Array<AccountDto>>{
        try {
            const resultJson = await readAllAccounts();
            const Accounts:Array<AccountDto> = JSON.parse(resultJson);

            return Accounts;
        } catch (error) {
            throw new HttpException({
                code:Exception.QUERY_FAIL,
                message:'Fabric Query Fail',
            },HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}