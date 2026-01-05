import { AllConfigType } from 'src/types/all-config-type';
import { authConfig } from './auth-config';
import { appConfig } from './app-config';
import { databaseConfig } from './database-config';

export const AllConfig: AllConfigType = {
  app: appConfig(),
  auth: authConfig(),
  database: databaseConfig(),
};
