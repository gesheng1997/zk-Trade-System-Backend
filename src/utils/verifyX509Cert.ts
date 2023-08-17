import { KEYUTIL, X509 } from 'jsrsasign';

//支持对单个X.509证书 此处由于组织提供的就是根CA证书，因此不用进行X.509证书链的验证
const verifyX509Cert = (pemCert:string):boolean => {
    let valid = true;
    // for (let i = 0; i < certificates.length; i++) {
    //   let issuerIndex = i + 1;
    //   // If i == certificates.length - 1, self signed root ca
    //   if (i == certificates.length - 1) issuerIndex = i;
    //   const issuerPubKey = jsrsasign.KEYUTIL.getKey(certificates[issuerIndex]);
    //   const certificate = new jsrsasign.X509(certificates[i]);
    //   valid = valid && certificate.verifySignature(issuerPubKey);
    // }
  
    const issuerPubKey = KEYUTIL.getKey(pemCert);
    const certificate = new X509(pemCert);
    valid = valid && certificate.verifySignature(issuerPubKey);
    return valid;
};

export default verifyX509Cert;