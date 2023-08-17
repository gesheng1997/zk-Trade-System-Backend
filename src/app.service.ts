import { Injectable } from '@nestjs/common';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import * as jsrsasign from 'jsrsasign';

@Injectable()
export class AppService {
  getHello(): string {
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
    const issuerPubKey = jsrsasign.KEYUTIL.getKey(certificates[issuerIndex]);
    const certificate = new jsrsasign.X509(certificates[i]);
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
