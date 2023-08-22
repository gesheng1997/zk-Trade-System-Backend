//一级队列，即交给慢速的fabric验证零知识证明的缓冲队列，生产环境中会和fabric一起部署在远程

import { Injectable } from "@nestjs/common";
import { InjectQueue, OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from "bull";
import batchCount from "src/constant/batchCount";
import { v4 as uuid } from 'uuid';

@Injectable()
@Processor('transaction')
export class TransactionProcessor{
    constructor(
      @InjectQueue('verify') private readonly verifyQueue: Queue){}

    @Process('verifyCome')
    async handleVerification(job:Job){
       const { data } = job;

       //交由fabric进行零知识证明验证并获取结果
       const isValid = true;

       this.verifyQueue.emit('verifySuccessEvent',data.uuid);//告知指定uuid的二级队列订阅者验证完成
    }
}