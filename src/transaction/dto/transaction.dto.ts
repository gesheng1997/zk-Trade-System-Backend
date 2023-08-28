//查询交易返回的Dto

import TransactionState from "src/constant/TransactionState";
import TransactionType from "src/constant/TransactionType";

export class TransactionDto{
    id:number;
    from:number;
    fromUsername:string;
    to:number;
    toUsername:string;
    amount:number;
    comment:string;
    state:TransactionState;
    type:TransactionType;    
    initTime:Date;
    gmt_modified:Date;
}