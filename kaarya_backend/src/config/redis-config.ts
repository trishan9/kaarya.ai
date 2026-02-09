import { IsOptional, IsString } from 'class-validator';
import { registerAs } from '@nestjs/config';
import { CONFIG_NAMESPACE } from 'src/constants/config.constants';
import { RedisConfig } from 'src/types/redis-config.type';
import validateConfig from 'src/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  REDIS_KEY_PREFIX?: string;
}

export default registerAs<RedisConfig>(CONFIG_NAMESPACE.REDIS, () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    url: process.env.REDIS_URL ?? process.env.WORKER_HOST,
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'kaarya',
  };
});
