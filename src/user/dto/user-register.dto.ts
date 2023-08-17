export class UserRegisterDto {
    username:string;
    password:string;
    publicKey:string;
    signature:string;//签名是对密码的签名
}

export class OrgRegisterDto extends UserRegisterDto{
    pemCert:string;
    pemSignature:string;
}

export class AdminRegisterDto extends UserRegisterDto{
    token:string;
}