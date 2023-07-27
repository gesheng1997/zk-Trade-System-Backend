import { PartialType } from '@nestjs/mapped-types';
import { CreateLoginRegisterDto } from './create-login-register.dto';

export class UpdateLoginRegisterDto extends PartialType(CreateLoginRegisterDto) {}
