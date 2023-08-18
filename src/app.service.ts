import { Injectable } from '@nestjs/common';
import { encodeBase64, decodeBase64, decodeUTF8 } from 'tweetnacl-util';
import encodeUTF8 from './utils/encodeUTF8';
import SALT from './constant/salt';
import { sha256 } from '@hyperledger/fabric-gateway/dist/hash/hashes';
import getOrgPem from './utils/getOrgPem';
import path from 'path';
import fs from 'fs';
import { KEYUTIL, KJUR, X509 } from 'jsrsasign';

@Injectable()
export class AppService {
  async getHello(): Promise<string> {
    const ed = await import('@noble/ed25519');

    const privateKey = Buffer.from(ed.utils.randomPrivateKey()).toString('hex');
    console.log('private:',privateKey);
    const publicKeyA = await ed.getPublicKeyAsync(privateKey);
    const publicKey = Buffer.from(publicKeyA).toString('hex');
    console.log('public:',publicKey);
    const msgStr = 'WoAi===WenJun';
    const msg = Buffer.from(decodeUTF8(msgStr)).toString('hex');
    console.log('msg:',msg);
    const signatureA = await ed.signAsync(msg,privateKey);
    const signature = Buffer.from(signatureA).toString('hex');
    console.log('signature:',signature);
    // const isValid = await ed.verifyAsync(signature,msg,publicKey);

    const pemCert = getOrgPem('org3');
    console.log('pemCert:',pemCert);

    const ecPrivateKeyBuffer = fs.readFileSync(path.resolve('~', 'transaction-network', 'organizations', 'peerOrganizations', `org3.example.com`, 'ca', `priv_sk`));
    const ecprivateKey = ecPrivateKeyBuffer.toString('hex');
    console.log('ECDSAPrivateKey:',ecprivateKey);

    const ECDSAPublicKey = KEYUTIL.getKey(pemCert);
    console.log('ECDSAPublicKey:',ECDSAPublicKey);

    // const ECDSAverify = new KJUR.crypto.Signature({ alg:'SHA256withECDSA' });
    // ECDSAverify.init(ECDSApublicKey);
    // ECDSAverify.updateString(msg);
    // const isValid = ECDSAverify.verify(signature);

    // console.log('private:',privateKey);
    // console.log('public:',publicKey);
    // console.log('msg:',msg);
    // console.log('signature:',signature);
    // console.log('isValid:',isValid);

    // const password = '123456';
    // const passwordSalt = password + SALT;
    // const passwordSaltA = decodeUTF8(passwordSalt);
    // const passwordHashA = sha256(passwordSaltA);
    // const passwordHash = encodeBase64(passwordHashA);

    // console.log(passwordHash);
    // testX509();
    return 'Hello World!';
  }
}

function myEncodeUTF8(arr: Uint8Array) {
  const s: string[] = [];
  for (let i = 0; i < arr.length; i++) s.push(String.fromCharCode(arr[i]));
  return decodeURIComponent(s.join(''));
}

const verifyCertificateChain = (certificates) => {
  let valid = true;
  for (let i = 0; i < certificates.length; i++) {
    let issuerIndex = i + 1;
    // If i == certificates.length - 1, self signed root ca
    if (i == certificates.length - 1) issuerIndex = i;
    const issuerPubKey = KEYUTIL.getKey(certificates[issuerIndex]);
    const certificate = new X509(certificates[i]);
    valid = valid && certificate.verifySignature(issuerPubKey);
  }

  return valid;
};

const testX509 = () => {
  /* 将您的证书的 PEM 格式内容放在这里 */
  const certificatePem = myEncodeUTF8(
    decodeBase64(
      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNVRENDQWZlZ0F3SUJBZ0lRQk8wWVAzaG1lVnlRYy9WTkVGTVR3REFLQmdncWhrak9QUVFEQWpCek1Rc3cKQ1FZRFZRUUdFd0pWVXpFVE1CRUdBMVVFQ0JNS1EyRnNhV1p2Y201cFlURVdNQlFHQTFVRUJ4TU5VMkZ1SUVaeQpZVzVqYVhOamJ6RVpNQmNHQTFVRUNoTVFiM0puTXk1bGVHRnRjR3hsTG1OdmJURWNNQm9HQTFVRUF4TVRZMkV1CmIzSm5NeTVsZUdGdGNHeGxMbU52YlRBZUZ3MHlNekE0TVRNd05USXpNREJhRncwek16QTRNVEF3TlRJek1EQmEKTUhNeEN6QUpCZ05WQkFZVEFsVlRNUk13RVFZRFZRUUlFd3BEWVd4cFptOXlibWxoTVJZd0ZBWURWUVFIRXcxVApZVzRnUm5KaGJtTnBjMk52TVJrd0Z3WURWUVFLRXhCdmNtY3pMbVY0WVcxd2JHVXVZMjl0TVJ3d0dnWURWUVFECkV4TmpZUzV2Y21jekxtVjRZVzF3YkdVdVkyOXRNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUUKcVd6ZlZ3cUpjVUZUSmgvMkFnSG9XbzhVMFVERmNaQ0xsQnlQd1ZrZzZCaDduSy9hYTMwU3hzVVBRNDZJK1hiQwpSUDc1NkpySWlGNUJKNWNtZmZKNEJLTnRNR3N3RGdZRFZSMFBBUUgvQkFRREFnR21NQjBHQTFVZEpRUVdNQlFHCkNDc0dBUVVGQndNQ0JnZ3JCZ0VGQlFjREFUQVBCZ05WSFJNQkFmOEVCVEFEQVFIL01Da0dBMVVkRGdRaUJDRDAKUWNHc2IrVHNvVy9EZnk3Nmp1Z0ZmVGNHN3hLNTZTYjRZM0xkbC9UdlFEQUtCZ2dxaGtqT1BRUURBZ05IQURCRQpBaUFXZU1Gb2xDVzY2YU9jc1kwY1hJQnZCeDVieTFGY2luZ29wL3hGcmxIcmdBSWdlb0FWRTZua0VYQy9reWFmCmZvamFEVVkweDZRbzNrMjlDdi9EYTN4Yk92UT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=',
    ),
  );
  /* 可选：如果您有根证书，将其 PEM 格式内容放在这里 */
  const caCertificatePem = myEncodeUTF8(
    decodeBase64(
      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNVRENDQWZlZ0F3SUJBZ0lRQk8wWVAzaG1lVnlRYy9WTkVGTVR3REFLQmdncWhrak9QUVFEQWpCek1Rc3cKQ1FZRFZRUUdFd0pWVXpFVE1CRUdBMVVFQ0JNS1EyRnNhV1p2Y201cFlURVdNQlFHQTFVRUJ4TU5VMkZ1SUVaeQpZVzVqYVhOamJ6RVpNQmNHQTFVRUNoTVFiM0puTXk1bGVHRnRjR3hsTG1OdmJURWNNQm9HQTFVRUF4TVRZMkV1CmIzSm5NeTVsZUdGdGNHeGxMbU52YlRBZUZ3MHlNekE0TVRNd05USXpNREJhRncwek16QTRNVEF3TlRJek1EQmEKTUhNeEN6QUpCZ05WQkFZVEFsVlRNUk13RVFZRFZRUUlFd3BEWVd4cFptOXlibWxoTVJZd0ZBWURWUVFIRXcxVApZVzRnUm5KaGJtTnBjMk52TVJrd0Z3WURWUVFLRXhCdmNtY3pMbVY0WVcxd2JHVXVZMjl0TVJ3d0dnWURWUVFECkV4TmpZUzV2Y21jekxtVjRZVzF3YkdVdVkyOXRNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUUKcVd6ZlZ3cUpjVUZUSmgvMkFnSG9XbzhVMFVERmNaQ0xsQnlQd1ZrZzZCaDduSy9hYTMwU3hzVVBRNDZJK1hiQwpSUDc1NkpySWlGNUJKNWNtZmZKNEJLTnRNR3N3RGdZRFZSMFBBUUgvQkFRREFnR21NQjBHQTFVZEpRUVdNQlFHCkNDc0dBUVVGQndNQ0JnZ3JCZ0VGQlFjREFUQVBCZ05WSFJNQkFmOEVCVEFEQVFIL01Da0dBMVVkRGdRaUJDRDAKUWNHc2IrVHNvVy9EZnk3Nmp1Z0ZmVGNHN3hLNTZTYjRZM0xkbC9UdlFEQUtCZ2dxaGtqT1BRUURBZ05IQURCRQpBaUFXZU1Gb2xDVzY2YU9jc1kwY1hJQnZCeDVieTFGY2luZ29wL3hGcmxIcmdBSWdlb0FWRTZua0VYQy9reWFmCmZvamFEVVkweDZRbzNrMjlDdi9EYTN4Yk92UT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=',
    ),
  );

  const certificates = [certificatePem,caCertificatePem];

  const isValid = verifyCertificateChain(certificates);

  console.log('result:',isValid);
};
