import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';
import { MongoDatabaseModule } from './database/mongodb.module';
import appConfig from './config/app-config';
import authConfig from './config/auth-config';
import databaseConfig from './config/database-config';

const InfrastructureDatabaseModule = MongoDatabaseModule;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig],
      envFilePath: ['.env'],
    }),
    InfrastructureDatabaseModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
