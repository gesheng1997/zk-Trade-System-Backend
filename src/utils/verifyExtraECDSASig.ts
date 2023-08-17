/* 
    企业注册需要额外使用X.509证书中的ecdsa公私钥对密钥进行一次签名，
    这是为了防止恶意方针对某些企业加入联盟通道，但是还未在系统中注册的情况下，
    抢先重放企业X.509证书进行注册的行为
*/

import {KEYUTIL,KJUR} from 'jsrsasign';

const verifyExtraECDSASig = (
  pem: string,
  signature: string,
  password: string,
): boolean => {
    const ECDSApublicKey = KEYUTIL.getKey(pem);

    const ECDSAverify = new KJUR.crypto.Signature({ alg:'SHA256withECDSA' });
    ECDSAverify.init(ECDSApublicKey);
    ECDSAverify.updateString(password);
    const isValid = ECDSAverify.verify(signature);

    return isValid;
};

export default verifyExtraECDSASig;
