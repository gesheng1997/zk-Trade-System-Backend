import { Test, TestingModule } from '@nestjs/testing';
import { LoginRegisterService } from './login-register.service';

describe('LoginRegisterService', () => {
  let service: LoginRegisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoginRegisterService],
    }).compile();

    service = module.get<LoginRegisterService>(LoginRegisterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
