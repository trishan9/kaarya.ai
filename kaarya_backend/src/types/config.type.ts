import { AppConfig } from './app-config.type';
import { AuthConfig } from './auth-config.type';
import { CloudinaryConfig } from './cloudinary-config.type';
import { DatabaseConfig } from './database-config.type';
import { EmailConfig } from './email-config.type';
import { GeminiConfig } from './gemini-config.type';
import { RedisConfig } from './redis-config.type';
import { StreamConfig } from './stream-config.type';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  cloudinary: CloudinaryConfig;
  database: DatabaseConfig;
  email: EmailConfig;
  redis: RedisConfig;
  gemini: GeminiConfig;
  stream: StreamConfig;
};
