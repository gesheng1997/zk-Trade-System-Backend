//服务器为凭证签名,这里需要获取私钥，这个操作实际上是有一些风险的
//本系统之后的一个方向是将一二级队列拆成两个服务器，到那个时候可以将这个签名凭证的操作
//交给一级队列服务器（和fabric部署在一起，且专门负责连接fabric gateway和fabric交互，具有更好的安全性）
//一级队列服务器用组织peer节点私钥签署完毕之后再交给二级服务器
import { KEYUTIL, KJUR, X509 } from 'jsrsasign';

import path from "path";
import { promises as fs } from 'fs';
import envConfig from "src/config/envConfig";
import * as crypto from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';
import Exception from 'src/constant/exceptionType';

//单笔签署
const serverSignVoucher = async (digest:string,privateKey:string):Promise<string> => {
    const ECDSASign = new KJUR.crypto.Signature({ alg:'SHA256withECDSA' });
    ECDSASign.init(privateKey);//开始签名入参为pem格式的私钥
    ECDSASign.updateString(digest);
    const ECDSASig = ECDSASign.sign();
    console.log('ECDSASig:',ECDSASig);

    return ECDSASig
}

//批量签署
const serverSignVouchers = async (transDigests:{id:number,digest:string}[]):Promise<Array<{id:number,signature:string}>> => {
    const files = await fs.readdir(envConfig.keyDirectoryPath);
    const keyPath = path.resolve(envConfig.keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = privateKeyPem.toString('utf8');



    const signatures:{id:number,signature:string}[] = [];

    try {
        for(const transDigest of transDigests){
            const signature = await serverSignVoucher(transDigest.digest,privateKey);
            signatures.push({
                id:transDigest.id,
                signature,
            });
        }
        return signatures;
    } catch (error) {
        console.log(error);
        throw new HttpException({
            code:Exception.GENERATE_VOUCHERS_FAIL,
            message:'Fail To Generate Vouchers For Batch Transaction'
        },HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

export default serverSignVouchers;