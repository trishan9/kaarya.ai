import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';
import { MongoDatabase } from './database/mongodb';

const infrastructureDatabaseModule = MongoDatabase;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    infrastructureDatabaseModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
