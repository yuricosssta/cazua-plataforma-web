// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common'; // <--- Importante

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-org-id, x-organization-id, x-org-role',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // --- ATIVA A VALIDAÇÃO DOS DTOs ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos que não estão no DTO (Segurança contra injeção de dados)
      forbidNonWhitelisted: true, // Retorna erro se o front mandar campo que não existe
      transform: true, // Transforma os dados automaticamente (ex: string '1' vira number 1 se o DTO pedir)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Grupo Cazua')
    .setDescription('Gestão Inteligente de Serviços')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT || 3000);
}

bootstrap();

// // src/main.ts
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
// import { ValidationPipe } from '@nestjs/common';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   const allowedOrigins = [
//     'http://localhost:3000',
//     'http://app.localhost:3000',
//     'https://www.grupocazua.com.br',
//     'https://app.grupocazua.com.br',
//   ];

//   const cazuaTenantRegex = /^https:\/\/([a-zA-Z0-9-]+)\.grupocazua\.com\.br$/;

//   app.enableCors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin) || cazuaTenantRegex.test(origin)) {
//         return callback(null, true);
//       }
//       callback(new Error('Bloqueado por CORS'), false);
//     },
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     credentials: true,
//     allowedHeaders:
//       'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-org-id, x-organization-id, x-org-role, x-cazua-tenant-slug',
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   });

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//     }),
//   );

//   app.useGlobalFilters(new HttpExceptionFilter());

//   const config = new DocumentBuilder()
//     .setTitle('Grupo Cazua')
//     .setDescription('Gestão Inteligente de Serviços')
//     .setVersion('1.0')
//     .build();
//   const documentFactory = () => SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, documentFactory);

//   await app.listen(process.env.PORT || 3000);
// }
// bootstrap();