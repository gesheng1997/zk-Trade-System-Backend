import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Request() req): Promise<string> {
    console.log(req);
    return await this.appService.getHello();
  }

  @Post('/sign')
  async getSignTrans(@Body() signInfo:any): Promise<any>{
    return await this.appService.getSignTrans(signInfo);
  }
}
