import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { RedisService } from 'src/services/redis.service';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('RedisService', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('should throw when redis is not configured', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const logger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<PinoLoggerService>;

    const service = new RedisService(configService, logger);

    await expect(service.getClient()).rejects.toBeInstanceOf(Error);
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
  });

  it('should connect and return the client when configured', async () => {
    let errorHandler: ((error: unknown) => void) | undefined;
    const client = {
      on: jest.fn((event: string, handler: (error: unknown) => void) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      }),
      isOpen: false,
      connect: jest.fn(),
      quit: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(client);

    const configService = {
      get: jest.fn((key: string) =>
        key === CONFIG_KEYS.REDIS.URL ? 'redis://localhost:6379' : undefined,
      ),
    } as unknown as ConfigService;
    const logger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<PinoLoggerService>;

    const service = new RedisService(configService, logger);

    process.env.NODE_ENV = 'production';
    await service.onModuleInit();
    expect(client.connect).toHaveBeenCalledTimes(1);

    const result = await service.getClient();

    expect(createClient).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
    expect(client.connect).toHaveBeenCalledTimes(2);
    expect(result).toBe(client);

    errorHandler?.(new Error('boom'));
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Redis connection error: boom'),
      undefined,
      RedisService.name,
    );

    client.isOpen = true;
    await service.onModuleDestroy();
    expect(client.quit).toHaveBeenCalledTimes(1);
  });

  it('should skip connect in test env and when already open', async () => {
    const client = {
      on: jest.fn(),
      isOpen: false,
      connect: jest.fn(),
      quit: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(client);

    const configService = {
      get: jest.fn((key: string) =>
        key === CONFIG_KEYS.REDIS.URL ? 'redis://localhost:6379' : undefined,
      ),
    } as unknown as ConfigService;
    const logger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<PinoLoggerService>;

    const service = new RedisService(configService, logger);
    process.env.NODE_ENV = 'test';
    await service.onModuleInit();
    expect(client.connect).not.toHaveBeenCalled();

    client.isOpen = true;
    await service.getClient();
    expect(client.connect).not.toHaveBeenCalled();
  });
});
