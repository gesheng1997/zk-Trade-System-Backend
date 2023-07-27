import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LoginRegisterService } from './login-register.service';
import { CreateLoginRegisterDto } from './dto/create-login-register.dto';
import { UpdateLoginRegisterDto } from './dto/update-login-register.dto';

@Controller('login-register')
export class LoginRegisterController {
  constructor(private readonly loginRegisterService: LoginRegisterService) {}

  @Post()
  create(@Body() createLoginRegisterDto: CreateLoginRegisterDto) {
    return this.loginRegisterService.create(createLoginRegisterDto);
  }

  @Get()
  findAll() {
    return this.loginRegisterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loginRegisterService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLoginRegisterDto: UpdateLoginRegisterDto,
  ) {
    return this.loginRegisterService.update(+id, updateLoginRegisterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loginRegisterService.remove(+id);
  }
}
