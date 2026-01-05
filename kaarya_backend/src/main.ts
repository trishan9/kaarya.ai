import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { CONFIG_KEYS } from './constants/config.constants';
import { PinoLoggerService } from './logger/pino-logger.service';
import validationOptions from './utils/validation-options';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import { AllConfigType } from './types/config.type';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const configService = app.get(ConfigService<AllConfigType>);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useLogger(app.get(PinoLoggerService));

  app.enableShutdownHooks();

  app.setGlobalPrefix(
    configService.getOrThrow(CONFIG_KEYS.APP.API_PREFIX, { infer: true }),
    {
      exclude: ['/'],
    },
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(new ValidationPipe(validationOptions));

  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(
    configService.getOrThrow(CONFIG_KEYS.APP.PORT, { infer: true }),
  );
}
void bootstrap();
