//通过正则表达式将pem文件中的开头和结尾去掉，获取中间BASE64的部分

const trimPem = (pem:string):string => {
    const regex = /-----BEGIN CERTIFICATE-----\n([A-Za-z0-9+/=\s]+)\n-----END CERTIFICATE-----/;
    const matches = pem.match(regex);

    if (matches && matches.length === 2) {
      const trimRes = matches[1].replace(/\s/g, ''); // Remove whitespace
      return trimRes;
    } else {
      console.log('No valid PEM content found.');
      throw new Error();
    }
}

export default trimPem;