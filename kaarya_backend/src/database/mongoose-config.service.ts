import { Injectable } from '@nestjs/common';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { AllConfigType } from 'src/types/all-config-type';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  constructor(private configService: AllConfigType) {}

  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: this.configService.database.url,
      dbName: this.configService.database.name,
      user: this.configService.database.username,
      pass: this.configService.database.password,
      connectionFactory(connection) {
        connection.plugin(mongooseAutoPopulate);
        return connection;
      },
    };
  }
}
