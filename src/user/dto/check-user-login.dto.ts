import { PartialType, IntersectionType, PickType } from '@nestjs/mapped-types';
import { UserLoginDto } from './user-login.dto';

export class CheckUserLoginDto extends 
    IntersectionType(
        PartialType(
            PickType(UserLoginDto,['username','phone','email'])
        ),
        PickType(UserLoginDto,['password'])
    ) {
        randomMsg:string;
    }
