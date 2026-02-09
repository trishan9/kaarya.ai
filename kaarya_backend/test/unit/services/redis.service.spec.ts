import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { RedisService } from 'src/services/redis.service';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('RedisService', () => {
  it('should throw when redis is not configured', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const logger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<PinoLoggerService>;

    const service = new RedisService(configService, logger);

    await expect(service.getClient()).rejects.toBeInstanceOf(Error);
  });

  it('should connect and return the client when configured', async () => {
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
    const result = await service.getClient();

    expect(createClient).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(result).toBe(client);

    client.isOpen = true;
    await service.onModuleDestroy();
    expect(client.quit).toHaveBeenCalledTimes(1);
  });
});
