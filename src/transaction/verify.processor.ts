//一级队列，即交给慢速的fabric验证零知识证明的缓冲队列，生产环境中会和fabric一起部署在远程

import { Injectable } from "@nestjs/common";
import { InjectQueue, OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from "bull";
import batchCount from "src/constant/batchCount";
import { v4 as uuid } from 'uuid';
import { verifyBatchTransaction } from "src/utils/chaincodeAccountMethods";

@Injectable()
@Processor('verify')
export class VerifyProcessor{
    constructor(
      @InjectQueue('verify') private readonly verifyQueue: Queue){}

    @Process('verifyCome')
    async handleVerification(job:Job){
		const { data } = job;

		const zkProofStr = JSON.stringify(data);
		try {
			const batchTransInfo = await verifyBatchTransaction(zkProofStr);

			//验证成功则发布验证成功的事件
			if(batchTransInfo) this.verifyQueue.emit('verifySuccessEvent',data.uuid, batchTransInfo);//告知指定uuid的二级队列订阅者验证完成
			else throw new Error(batchTransInfo)
		} catch (error) {
			console.log(error);
			
			this.verifyQueue.emit('varifyFailEvent',data.uuid);
		}
		//否则发布验证失败事件
    }
}