import { Module, forwardRef } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { BullModule } from '@nestjs/bull';
import { TransactionProcessor } from './transaction.processor';
import { LevelQueueModule } from 'src/levelQueue/levelQueue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports:[
    //注册队列transVerify并注入transaction模块
    forwardRef(() => LevelQueueModule),
    //注册transaction模块需要用到的所有数据库表
    TypeOrmModule.forFeature([
			User,
      Transaction,
		]),
    UserModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionProcessor, User, Transaction],
})
export class TransactionModule {}
