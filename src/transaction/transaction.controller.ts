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
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from 'src/authGuard/auth.guard';
import userType from 'src/constant/userType';
import Exception from 'src/constant/exceptionType';
import { CreateTransactionsDto } from './dto/create-transactions.dto';

@Controller('transaction')
export class TransactionController {
	constructor(private readonly transactionService: TransactionService) {}

	@UseGuards(AuthGuard)
	@Post('/normal')
	async createNormalTrans(@Body() createTransactionDto: CreateTransactionDto,@Request() req) {
		if(createTransactionDto.from !== req.user.userId){
			throw new HttpException({
				code:Exception.WRONG_IDENTITY,
				message:'Id Uncompatible',
			},HttpStatus.UNAUTHORIZED);
		}
		return this.transactionService.createNormalTrans(createTransactionDto);
	}

	@UseGuards(AuthGuard)
	@Post('/deposit')
	async createDepositTrans(@Body() createTransactionDto: CreateTransactionDto,@Request() req) {
		if(createTransactionDto.from !== req.user.userId){
			throw new HttpException({
				code:Exception.WRONG_IDENTITY,
				message:'Id Uncompatible',
			},HttpStatus.UNAUTHORIZED);
		}
		return this.transactionService.createDepositTrans(createTransactionDto);
	}

	@UseGuards(AuthGuard)
	@Post('/withdraw')
	async createWithdrawTrans(@Body() createTransactionDto: CreateTransactionDto,@Request() req) {
		if(createTransactionDto.from !== req.user.userId){
			throw new HttpException({
				code:Exception.WRONG_IDENTITY,
				message:'Id Uncompatible',
			},HttpStatus.UNAUTHORIZED);
		}
		return this.transactionService.createWithdrawTrans(createTransactionDto);
	}

	@UseGuards(AuthGuard)
	@Get()
	async findAll(@Request() req) {
		//管理员可以查询系统中所有交易信息
		if(req.user.type !== userType.ADMIN) throw new UnauthorizedException();
		return this.transactionService.findAll();
	}

	@UseGuards(AuthGuard)
	@Get(':id')
	async findAllMyTrans(@Request() req,@Param('id') id: string) {
		//用户只能查询和自己有关的所有交易信息！
		if(req.user.id !== +id) 
			throw new HttpException({
				code:Exception.WRONG_IDENTITY,
				message:'Can Only Get Your Own Transactions'
			},HttpStatus.UNAUTHORIZED)
		return this.transactionService.findAllMyTrans(+id);
	}

	@UseGuards(AuthGuard)
	@Get('/voucher/:id')
	async generateVoucher(@Param('id') id:string){
		return this.transactionService.generateVoucher(+id);
	}

	@UseGuards(AuthGuard)
	@Post('/batch/normal')
	async createBatchNormalTrans(@Request() req, @Body() createTransactionsDto: CreateTransactionsDto){
		if(req.user.type !== userType.ADMIN)
			throw new HttpException({
				code:Exception.WRONG_IDENTITY,
				message:'Only Admin Can Launch Transactions In Batch'
			},HttpStatus.UNAUTHORIZED)

		Reflect.deleteProperty(createTransactionsDto,'count');
		const createTransactionDto:CreateTransactionDto = {...createTransactionsDto}
		return this.transactionService.createBatchNormalTrans(createTransactionsDto.count,createTransactionDto);
	}

	//这个接口目前用不到，后面考虑前端先显示所有跟自己有关的交易摘要，想看哪个再点击展示详情才会用到这个
	// @UseGuards(AuthGuard)
	// @Get(':id')
	// async findOne(@Param('id') id: string) {
	// 	return this.transactionService.findOne(+id);
	// }

//用户没有任何途径可以更新交易的信息
//   @UseGuards(AuthGuard)
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
//     return this.transactionService.update(+id, updateTransactionDto);
//   }

//用户没有任何途径可以删除一笔交易，想要退款只能发起新的交易，交易类型为退款
//   @UseGuards(AuthGuard)
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.transactionService.remove(+id);
//   }
}
