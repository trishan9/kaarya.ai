import { ConfigService } from '@nestjs/config';
import pino from 'pino';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';

jest.mock('pino', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  })),
}));

describe('PinoLoggerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should proxy log methods to pino', () => {
    const configService = {
      get: jest.fn((key: string) =>
        key === CONFIG_KEYS.APP.LOG_LEVEL ? 'debug' : undefined,
      ),
    } as unknown as ConfigService;

    const service = new PinoLoggerService(configService);
    const logger = service.getLogger() as unknown as {
      info: jest.Mock;
      error: jest.Mock;
      warn: jest.Mock;
      debug: jest.Mock;
      trace: jest.Mock;
    };

    service.log('info', 'ctx');
    service.error('error', 'trace', 'ctx');
    service.warn('warn', 'ctx');
    service.debug('debug', 'ctx');
    service.verbose('trace', 'ctx');

    expect(pino).toHaveBeenCalledWith({ level: 'debug' });
    expect(logger.info).toHaveBeenCalledWith({ context: 'ctx' }, 'info');
    expect(logger.error).toHaveBeenCalledWith(
      { context: 'ctx', trace: 'trace' },
      'error',
    );
    expect(logger.warn).toHaveBeenCalledWith({ context: 'ctx' }, 'warn');
    expect(logger.debug).toHaveBeenCalledWith({ context: 'ctx' }, 'debug');
    expect(logger.trace).toHaveBeenCalledWith({ context: 'ctx' }, 'trace');
  });

  it('should fallback to info level when config is missing', () => {
    const configService = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;

    const service = new PinoLoggerService(configService);
    expect(service.getLogger()).toBeDefined();
    expect(pino).toHaveBeenCalledWith({ level: 'info' });
  });
});
