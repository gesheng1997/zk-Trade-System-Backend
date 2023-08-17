export class UserLoginDto {
    username:string;
    phone:string;
    email:string;
    password:string;
    signature:string;//再三考虑之下决定登陆时不需要验证签名
}
