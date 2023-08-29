import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return await this.appService.getHello();
  }

  @Post('/sign')
  async getSignTrans(@Body() signInfo:any): Promise<any>{
    return await this.appService.getSignTrans(signInfo);
  }
}
