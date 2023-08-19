import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'
import jwtSecret from 'src/constant/jwtSecret';

@Module({
    imports:[
        JwtModule.register({
            global:true,
            secret:jwtSecret,
            signOptions:{ expiresIn:'3000s' },
        })
    ]
})
export class AuthModule {}
