import {
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { AllConfigType } from 'src/types/config.type';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client?: RedisClientType;
  private isConfigured = false;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly logger: PinoLoggerService,
  ) {
    const url = this.configService.get(CONFIG_KEYS.REDIS.URL, {
      infer: true,
    });

    if (!url) {
      return;
    }

    this.client = createClient({ url });
    this.client.on('error', (error) => {
      this.logger.error(
        `Redis connection error: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        RedisService.name,
      );
    });
    this.isConfigured = true;
  }

  async onModuleInit() {
    if (!this.isConfigured || !this.client) return;
    if (process.env.NODE_ENV === 'test') return;
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async onModuleDestroy() {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  async getClient(): Promise<RedisClientType> {
    if (!this.isConfigured || !this.client) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Redis is not configured.',
      });
    }
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    return this.client;
  }
}
