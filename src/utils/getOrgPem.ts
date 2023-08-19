/* 
    这个util用于在组织账号注册的时候获取fabric文件夹中组织对应的文件夹下的pem文件
    保证组织账号在注册的时候已经在链上进行了联盟组织身份认证并加入了通道
    有效防止非联盟成员或未加入通道的成员尝试使用自己拼装的pem注册成为金融组织
*/

import path = require('path');
import fs = require('fs');
import encodeUTF8 from './encodeUTF8';
import { encodeBase64 } from 'tweetnacl-util';

const getOrgPem = (orgName:string) => {
    const pemPath = path.resolve('/home', 'zionlee', 'transaction-network', 'organizations', 'peerOrganizations', `${orgName}.example.com`, 'ca', `ca.${orgName}.example.com-cert.pem`);
    const pemBuffer = fs.readFileSync(pemPath);
    const pem = encodeUTF8(Uint8Array.from(pemBuffer));

    return pem;
}

export default getOrgPem;