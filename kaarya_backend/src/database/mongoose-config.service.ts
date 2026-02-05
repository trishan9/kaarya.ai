import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { AllConfigType } from 'src/types/config.type';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  constructor(private configService: ConfigService<AllConfigType>) {}

  createMongooseOptions(): MongooseModuleOptions {
    const uri = this.configService.get('database.url', { infer: true });
    const username = this.configService.get('database.username', {
      infer: true,
    });
    const password = this.configService.get('database.password', {
      infer: true,
    });

    return {
      uri,
      dbName: this.configService.get('database.name', { infer: true }),
      ...(username && password ? { user: username, pass: password } : {}),
      connectionFactory(connection) {
        connection.plugin(mongooseAutoPopulate);
        return connection;
      },
    };
  }
}
