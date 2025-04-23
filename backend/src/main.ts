import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express'; // <-- Importa express si usas la opción con verify

async function bootstrap() {
  // 1. Añade la opción rawBody: true aquí
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // <--- ¡AÑADE ESTO!
  });

  const config = new DocumentBuilder()
    .setTitle('Ciclon ecommerce api docs')
    .setDescription('The ciclon ecommerce API description')
    .setVersion('1.0')
    .build();

  // Nota: Swagger no necesita el raw body, pero no interfiere
  const document = SwaggerModule.createDocument(app, config); // Genera el documento una vez
  SwaggerModule.setup('api', app, document); // Usa el documento generado

  app.setGlobalPrefix('api/v1');

  // 2. (Opcional pero recomendado) Configura express.json globalmente si lo necesitas
  //    PERO asegúrate de que no elimine el rawBody guardado por NestJS
  //    Si sólo necesitas JSON, NestJS con rawBody:true podría ser suficiente.
  //    Si añades esto, verifica que req.rawBody siga existiendo en tu webhook.
  /*
  app.use(express.json({
    limit: '5mb', // Ejemplo
    // La opción rawBody: true en NestFactory suele ser suficiente
    // y no necesitas el 'verify' aquí si esa opción está activa.
  }));
  */

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.enableCors();

  const port = process.env.PORT ?? 3001; // Buena práctica usar variable de entorno
  await app.listen(port);
  console.log(`Application is running on port ${port}`); // Log mejorado
}
void bootstrap();