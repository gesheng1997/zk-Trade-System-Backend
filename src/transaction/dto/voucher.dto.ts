//凭证数据结构

export class VoucherDto{
    from:number;//交易发起人id
    fromUsername:string;//交易发起人用户名
    to:number;//交易收方id
    toUsername:string;//交易收方用户名
    amount:number;//转账金额
    timestamp:Date;//交易发起的时间，注意是发起时间
    comment:string;//交易留言

    digest:string;//对于签名所有这些信息的json字符串生成的sha256摘要
    transactionId:number;//交易id，同时也是凭证id，之后如果系统规模变大此处可以用uuid替换
    fromPublicKey:string;//发起方公钥
    fromSignature:string;//发起方对digest的签名
    serverPemCert:string;//服务器公钥证书
    serverSignature:string;//服务器在fabric验证交易成功之后对digest的签名
}