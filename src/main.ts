import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Response } from './common/Response';
import { HttpFilter } from './common/filterException';
import fs from 'fs';

async function bootstrap() {
	const httpsOptions = {
		key: fs.readFileSync('./https/https-private.key'),
		cert: fs.readFileSync('./https/https-cert.pem'),
	}

	const app = await NestFactory.create(AppModule,{
		httpsOptions,
	});
	app.useGlobalInterceptors(new Response());
	app.useGlobalFilters(new HttpFilter());
	await app.listen(8080);
}
bootstrap();
