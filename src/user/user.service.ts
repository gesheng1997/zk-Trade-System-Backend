import { HttpException, HttpStatus, Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { buffer2bits, chunkBigInt } from 'src/utils/mathUtils';
import { sha256 } from 'crypto-js';

import {
  AdminRegisterDto,
  OrgRegisterDto,
  UserRegisterDto,
} from './dto/user-register.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { CheckUserLoginDto } from './dto/check-user-login.dto';
import { createAdminAccount, createNormalAccount, createOrgAccount, initLedger } from 'src/utils/chaincodeAccountMethods';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import getOrgPem from '../utils/getOrgPem';

import SALT from '../constant/salt';
import verifyX509Cert from 'src/utils/verifyX509Cert';
import verifyExtraECDSASig from 'src/utils/verifyExtraECDSASig';
import { UserInfoDto } from './dto/user-info.dto';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly user: Repository<User>,
    private jwtService:JwtService
  ) {}

    //创建普通用户账号的方法
    async createUser(userRegisterDto: UserRegisterDto):Promise<number> {
        const ed = await import('@noble/ed25519');
        const { username, password, publicKey, signature } = userRegisterDto;

        //查询数据库，如果当前欲注册的用户已经注册过了，
        //那么报错，这里要小心dos攻击，前端应该有失败注册次数检测机制
        if (
            this.user.exist({
                select: ['username'],
                where: { username, },
            })
        ) {
            throw new HttpException('already exist', HttpStatus.BAD_REQUEST);
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
                    throw new HttpException(
                        'init fail',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
                newid = 1;
            }else newid = countId + 1;

            //访问gateway代码，创建链上账号
            try {
                createNormalAccount(newid, publicKey);
            } catch(error) {
                console.log(error);
                throw new HttpException(
                    'create fail',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            //创建链上账号没有报错的情况下，写入数据库
            const passwordSalt = password + SALT;
            const passwordHash = sha256(passwordSalt);

            const resultEntity = await this.user.save({
                username,
                password: passwordHash,
                publicKey,
                balance: 0,
                type: 0,
                alive: 1,
            });
            console.log(resultEntity);
            return resultEntity.id;
        } else {
            throw new HttpException('verify fail', HttpStatus.BAD_REQUEST);
        }
    }

    async createOrgUser(orgRegisterDto: OrgRegisterDto):Promise<number> {
        const ed = await import('@noble/ed25519');
        const { username, password, publicKey, signature, pemCert, pemSignature } = orgRegisterDto;

        if (
            this.user.exist({
                select: ['username'],
                where: { username, },
            })
        ) {        
            throw new HttpException('already exist', HttpStatus.BAD_REQUEST);
        }

        try {
            //检查企业注册提供的pem证书和已加入联盟的同名组织的pem是否一致，此处pem格式为带开头结尾的BASE64字符串
            const pem = getOrgPem(username);
            if(pem !== pemCert) throw new Error();

            //验证pem证书
            const validCert = verifyX509Cert(pemCert);
            if(!validCert) throw new Error();

            //验证ECDSA额外签名，证明注册人确实具有证书中的公钥对应的私钥
            const validSig = verifyExtraECDSASig(pemCert,pemSignature,password);
            if(!validSig) throw new Error();
        } catch (error) {
            throw new HttpException('Invalid pemCert',HttpStatus.BAD_REQUEST);
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
                    throw new HttpException(
                        'init fail',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
                newid = 1;
            }else newid = countId + 1;

            try {
                createOrgAccount(newid, publicKey, pemCert);
            } catch {
                throw new HttpException(
                    'create fail',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            const passwordSalt = password + SALT;
            const passwordHash = sha256(passwordSalt);

            const resultEntity = await this.user.save({
                username,
                password: passwordHash,
                publicKey,
                balance: 0,
                type: 0,
                alive: 1,
            });
            console.log(resultEntity);
            return resultEntity.id;
        } else {
            throw new HttpException('verify fail', HttpStatus.BAD_REQUEST);
        }
    }

    async createAdminUser(adminRegisterDto: AdminRegisterDto):Promise<number> {
        const ed = await import('@noble/ed25519');
        const { username, password, publicKey, signature, token } = adminRegisterDto;

        if (
            this.user.exist({
                select: ['username'],
                where: { username, },
            })
        ) {
            throw new HttpException('already exist', HttpStatus.BAD_REQUEST);
        }
        //对用户签名进行验证，保证用户具有公钥对应的私钥
        const isValid = await ed.verifyAsync(signature, password, publicKey);
        if (isValid) {
            const countId = await this.user.maximum('id');
            let newid:number;

            if(!countId){
                try {
                    initLedger();
                } catch (error) {
                    console.log(error);
                    throw new HttpException(
                        'init fail',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
                newid = 1;
            }else newid = countId + 1;

            //访问gateway代码，创建链上账号
            try {
                createAdminAccount(newid, publicKey, token);
            } catch(error) {
                console.log(error);
                throw new HttpException(
                    'create fail',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            //创建链上账号没有报错的情况下，写入数据库
            const passwordSalt = password + SALT;
            const passwordHash = sha256(passwordSalt);

            const resultEntity = await this.user.save({
                username,
                password: passwordHash,
                publicKey,
                balance: 0,
                type: 0,
                alive: 1,
            });
            console.log(resultEntity);
            return resultEntity.id;
        } else {
            throw new HttpException('verify fail', HttpStatus.BAD_REQUEST);
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
            throw new HttpException('Invalid Login',HttpStatus.BAD_REQUEST);
        }

        //未查询到用户，返回null
        if(!findRes) return null;
        
        //验证密码
        const passwordSalt = password + SALT;
        const passwordHash = sha256(passwordSalt);
        if(passwordHash != findRes.password){
            throw new UnauthorizedException();
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
        const success = this.user.update(id,updateUserInfoDto);
        console.log(success);

        if(success) return true;
        else return false; 
    }

    /*   
        批量更新余额方法，在缓冲队列中间件检测到交易数量达到chunk大小时，
        会先调用交易接口中的批量验证交易的方法，那个方法会验证并更新链上账户中的余额，
        验证并更新成功之后调用这边的批量更新方法更新后端数据库
    */
    // async updateBatchAccountBalance(ids:number[],balances:number[]){

    // }

    //更新单个账户的余额是一个私有方法，被批量更新余额方法调用
    private async updateAccountBalance(id: number, balance:number):Promise<boolean> {
        const success = this.user.update(id,{balance});

        if(success) return true;
        else return false;
    }

    async deleteUser(id: number):Promise<boolean> {
        const success = this.user.update(id,{alive:0});

        if(success) return true;
        else return false;
    }
}
