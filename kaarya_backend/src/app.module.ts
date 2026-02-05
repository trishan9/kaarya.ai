import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';
import { MongoDatabaseModule } from './database/mongodb.module';
import appConfig from './config/app-config';
import authConfig from './config/auth-config';
import cloudinaryConfig from './config/cloudinary-config';
import databaseConfig from './config/database-config';
import { LoggerModule } from './logger/logger.module';

export const InfrastructureDatabaseModule = MongoDatabaseModule;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, cloudinaryConfig],
      envFilePath: process.env.NODE_ENV === 'test' ? [] : ['.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    InfrastructureDatabaseModule,
    LoggerModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
