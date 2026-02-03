import { AppConfig } from './app-config.type';
import { AuthConfig } from './auth-config.type';
import { CloudinaryConfig } from './cloudinary-config.type';
import { DatabaseConfig } from './database-config.type';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  cloudinary: CloudinaryConfig;
  database: DatabaseConfig;
};
