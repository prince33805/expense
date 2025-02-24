import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
// import { AuthHeaderInterceptor } from './auth/auth-header.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply the interceptor globally
  // app.useGlobalInterceptors(new AuthHeaderInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();  // Enable CORS if needed
  
  const config = new DocumentBuilder()
    .setTitle('Expense Tracker API') // API Title
    .setDescription('API for managing personal expenses') // API Description
    .setVersion('1.0') // Version
    .addBearerAuth() // Enable JWT Authentication in Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Swagger UI at /api

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
