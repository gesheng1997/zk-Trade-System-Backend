import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AdminRegisterDto, OrgRegisterDto, UserRegisterDto } from './dto/user-register.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { CheckUserLoginDto } from './dto/check-user-login.dto';
import { UserInfoDto } from './dto/user-info.dto';
import { AuthGuard } from 'src/authGuard/auth.guard';
import UserType from 'src/constant/userType';
import { AccountDto } from './dto/account.dto';
import Exception from 'src/constant/exceptionType';
import { OrgnizationDto } from './dto/organization.dto';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	//创建新普通用户
	@Post('register')
	async createUser(@Body() userRegisterDto: UserRegisterDto):Promise<number> {
		return this.userService.createUser(userRegisterDto);
	}

	//创建新的企业用户
	@Post('register/org')
	async createOrgUser(@Body() orgRegisterDto: OrgRegisterDto):Promise<number> {
		return this.userService.createOrgUser(orgRegisterDto);
	}

	//创建新的管理员用户
	@Post('register/admin')
	async createAdminUser(@Body() adminRegisterDto: AdminRegisterDto):Promise<number> {
		return this.userService.createAdminUser(adminRegisterDto);
	}

	//查询某个类型的所有用户的信息---主要给管理员使用
	@UseGuards(AuthGuard)
	@Get('all')
	async findAllUsers(@Request() req){
		// if(req.user.type !== UserType.ADMIN) throw new UnauthorizedException();
		return this.userService.findAllUsers();
	}

	//检查token
	@UseGuards(AuthGuard)
	@Get('checktoken')
	async checkToken(){
		// console.log('@');
	}

	//获取所有用户的信息
	// @UserGuards(AuthGuard)
	@Get()
	async getAllAccounts(@Request() req):Promise<Array<AccountDto>>{
		// if(!req.user)
		return this.userService.getAllAccounts();
	}

	@UseGuards(AuthGuard)
	@Get('commercial')
	async findAllCommercial():Promise<Array<OrgnizationDto>>{
		return this.userService.findAllCommercial();
	}

	//查询单个用户信息
	@UseGuards(AuthGuard)
	@Get(':id')
	async getUserInfo(@Param('id') id: string) {
		return this.userService.getUserInfo(+id);
	}

	//更新单个用户信息
	@UseGuards(AuthGuard)
	@Patch(':id')
	async updateUserInfo(
		@Param('id') id: string,
		@Body() updateUserInfoDto: UpdateUserInfoDto,
		@Request() req,
	) {
		if(req.user.userId !== +id)
			throw new HttpException({
				code:Exception.INVALID_UPDATE,
				message:'Cannot Update Other Users\' Personal Information'
			},HttpStatus.BAD_REQUEST);
		console.log('#');
		return this.userService.updateUserInfo(+id, updateUserInfoDto);
	}

	//注销用户---不是真正的删除
	@UseGuards(AuthGuard)
	@Delete(':id')
	async deleteUser(@Param('id') id: string,@Request() req) {
		if(req.user.userId !== +id) throw new HttpException({
			code:Exception.INVALID_DELETE,
			message:'Cannot Delete Other Users\' Account',
		},HttpStatus.BAD_REQUEST);
		return this.userService.deleteUser(+id);
	}

	//用户登录check
	@Post('login')
	async checkUser(@Body() checkUserLoginDto:CheckUserLoginDto):Promise<UserInfoDto>{
		return this.userService.checkUser(checkUserLoginDto);
	}
}
