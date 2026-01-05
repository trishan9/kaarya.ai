import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { Logger } from 'pino';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { AllConfigType } from 'src/types/config.type';

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const level =
      this.configService.get(CONFIG_KEYS.APP.LOG_LEVEL, { infer: true }) ??
      'info';

    this.logger = pino({ level });
  }

  log(message: string, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ context }, message);
  }

  getLogger() {
    return this.logger;
  }
}
