//本模块用于注册一级二级队列并将其导出，保证能够在其他模块中同时引用一级二级队列

import { BullModule, BullModuleOptions } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

//获取一二级队列的Redis配置信息
const getVerifyQueueConfig = (configService: ConfigService) => ({
    host: configService.get<string>('verifyQueueConfig.host'),
    port: configService.get<number>('verifyQueueConfig.port'),
});

const getTransQueueConfig = (configService: ConfigService) => ({
    host: configService.get<string>('transQueueConfig.host'),
    port: configService.get<number>('transQueueConfig.port'),
})

//组装一二级队列模块
const BullQueueModule = BullModule.registerQueueAsync(
    //一级队列——本地(生产环境中远程)
  {
    name: 'verify',
    useFactory: (configService: ConfigService): BullModuleOptions => {
      return {
        name: 'verify',
        redis:getVerifyQueueConfig(configService),
      }
    },
    inject:[ConfigService],
  },
  //二级队列——本地
  {
    name: 'transaction',
    useFactory: (configService: ConfigService): BullModuleOptions => {
      return {
        name: 'transaction',
        redis:getTransQueueConfig(configService),
      }
    },
    inject:[ConfigService],
  },
)

@Module({
  imports: [BullQueueModule],
  exports: [BullQueueModule],
})
export class LevelQueueModule { }