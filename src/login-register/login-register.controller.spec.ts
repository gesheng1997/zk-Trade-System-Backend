import { Test, TestingModule } from '@nestjs/testing';
import { LoginRegisterController } from './login-register.controller';
import { LoginRegisterService } from './login-register.service';

describe('LoginRegisterController', () => {
  let controller: LoginRegisterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginRegisterController],
      providers: [LoginRegisterService],
    }).compile();

    controller = module.get<LoginRegisterController>(LoginRegisterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
