import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Response } from './common/Response';
import { HttpFilter } from './common/filterException';
import fs from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'path';

async function bootstrap() {
	//https配置项
	const httpsOptions = {
		key: fs.readFileSync('src/https/https-private.key'),
		cert: fs.readFileSync('src/https/https-cert.pem'),
	}

	const app = await NestFactory.create<NestExpressApplication>(AppModule,
		// {
		/// 	httpsOptions,
		// }
		{
			// httpsOptions,
			cors:true,
		}
	);
	app.useGlobalInterceptors(new Response());
	app.useGlobalFilters(new HttpFilter());
	app.useStaticAssets(path.resolve('public'),{
		prefix:'/public'
	});
	await app.listen(8080);
}
bootstrap();
