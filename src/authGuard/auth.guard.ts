import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Request } from 'express';
import jwtSecret from 'src/constant/jwtSecret';
import Exception from 'src/constant/exceptionType';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private jwtService: JwtService){ }

	async canActivate(
		context: ExecutionContext,
	): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		console.log(token);

		if(!token){
			throw new HttpException({
				code:Exception.WITHOUT_TOKEN,
				message:'Request Without Token!'
			},HttpStatus.UNAUTHORIZED);
		}
		try {
			console.log(token);
			const payload = await this.jwtService.verifyAsync(
				token,
				{
					secret:jwtSecret
				}
			)

			request['user'] = payload;
		} catch (error) {
			console.log(error);
			throw new HttpException({
				code:Exception.INVALID_TOKEN,
				message:'Token Out Of Date Or Invalid'
			},HttpStatus.UNAUTHORIZED);
		}

		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		console.log(request.headers);
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
