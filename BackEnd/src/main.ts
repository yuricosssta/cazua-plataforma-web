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
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-org-id, x-organization-id, x-org-role',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // --- ATIVA A VALIDAÇÃO DOS DTOs ---
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove campos que não estão no DTO (Segurança contra injeção de dados)
    forbidNonWhitelisted: true, // (Opcional) Retorna erro se o front mandar campo que não existe
    transform: true, // Transforma os dados automaticamente (ex: string '1' vira number 1 se o DTO pedir)
  }));

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Grupo Cazua')
    .setDescription('Gestão Inteligente de Serviços')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // A Vercel injeta a PORT automaticamente
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

// // src/main.ts
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.enableCors({
//     origin: true, // Permite todas as origens. Para restringir, substitua true por uma URL específica ou uma função de validação.
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     credentials: true, // Permite o envio de cookies e cabeçalhos de autorização
//     allowedHeaders: 'Content-Type, Accept, Authorization',
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   });

//   app.useGlobalFilters(new HttpExceptionFilter());

//   const config = new DocumentBuilder()
//     .setTitle('Grupo Cazua')
//     .setDescription('Gestão Inteligente de Serviços')
//     .setVersion('1.0')
//     .build();
//   const documentFactory = () => SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, documentFactory);

//   // A Vercel injeta a PORT automaticamente
//   await app.listen(process.env.PORT || 3000);
// }
// bootstrap();