import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginRegisterModule } from './login-register/login-register.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    LoginRegisterModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      username: 'root',
      password: '1234567LiZeyang',
      host: 'localhost',
      port: 3306,
      database: 'zktransaction',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      retryDelay: 500,
      retryAttempts: 10,
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
