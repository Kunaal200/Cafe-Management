import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('apiPrefix') ?? 'api';
  const apiVersion = config.get<string>('apiVersion') ?? 'v1';
  const globalPrefix = `${apiPrefix}/${apiVersion}`;
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  app.enableCors({
    origin: config.get<string>('corsOrigin') ?? '*',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cafe & Restaurant Management API')
    .setDescription('Multi-tenant SaaS API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API running at http://localhost:${port}/${globalPrefix} (docs at /${globalPrefix}/docs)`);
}

void bootstrap();
