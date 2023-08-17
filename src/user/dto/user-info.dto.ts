//作为查询或者登陆的返回对象
export class UserInfoDto{
    id:number;
    username:string;
    type:number;
    phone:string;
    email:string;
    birthday:Date;
    avatar:string;
    address:string;
    balance:number;//可以返回但不能被用户手动更新

    access_token?:string;//token
}