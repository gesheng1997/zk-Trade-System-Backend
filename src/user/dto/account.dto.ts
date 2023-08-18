export class AccountDto{
    id:number;
    publicKey:string;
    pemCert?:string;
    balance:number
    type:number;
    alive:number;
}