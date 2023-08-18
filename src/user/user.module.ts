import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';

@Module({
  imports:[TypeOrmModule.forFeature([
    User,
    Organization,
  ])],
  controllers: [UserController],
  providers: [UserService,User,Organization],
  exports:[UserService],
})
export class UserModule {}
