import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './authGuard/auth.module';
import { BullModule } from '@nestjs/bull';
import { TransactionModule } from './transaction/transaction.module';
import { ConfigModule } from '@nestjs/config';
import transQueueConfig from './config/transQueueConfig';
import verifyQueueConfig from './config/verifyQueueConfig';

@Module({
  imports: [
    UserModule,
    //数据库配置，应该使用ConfigModule重构
    TypeOrmModule.forRoot({
      type: 'mysql',
      username: 'root',
      password: '1234567LiZeyang',
      host: 'localhost',
      port: 3306,
      database: 'zk_transactions',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      retryDelay: 500,
      retryAttempts: 10,
      autoLoadEntities: true,
    }),
    AuthModule,
    //redis-bull队列注册，作为fabric和后端交互验证的缓冲区
    BullModule.forRoot({
      redis:{
        host:'localhost',
        port:6379,
      }
    }),
    //环境变量管理
    ConfigModule.forRoot({
      isGlobal:true,
      cache:true,
      load:[transQueueConfig,verifyQueueConfig],
    }),
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
