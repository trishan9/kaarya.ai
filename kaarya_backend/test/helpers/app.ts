import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { GlobalExceptionFilter } from 'src/common/filters/global-exception.filter';
import validationOptions from 'src/utils/validation-options';
import { ResolvePromisesInterceptor } from 'src/utils/serializer.interceptor';
import { AllConfigType } from 'src/types/config.type';

export const configureTestApp = (app: INestApplication) => {
  app.useLogger(false);

  const configService = app.get(ConfigService<AllConfigType>);
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
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
};
