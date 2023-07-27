import { Injectable } from '@nestjs/common';
import { CreateLoginRegisterDto } from './dto/create-login-register.dto';
import { UpdateLoginRegisterDto } from './dto/update-login-register.dto';

@Injectable()
export class LoginRegisterService {
  create(createLoginRegisterDto: CreateLoginRegisterDto) {
    return 'This action adds a new loginRegister';
  }

  findAll() {
    return `This action returns all loginRegister`;
  }

  findOne(id: number) {
    return `This action returns a #${id} loginRegister`;
  }

  update(id: number, updateLoginRegisterDto: UpdateLoginRegisterDto) {
    return `This action updates a #${id} loginRegister`;
  }

  remove(id: number) {
    return `This action removes a #${id} loginRegister`;
  }
}
