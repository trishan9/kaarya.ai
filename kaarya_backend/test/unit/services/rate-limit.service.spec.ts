import { HttpStatus } from '@nestjs/common';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { RateLimitService } from 'src/services/rate-limit.service';
import { RedisService } from 'src/services/redis.service';
import { InMemoryRedis } from '../../helpers/in-memory-redis';

describe('RateLimitService', () => {
  it('should enforce rate limits and set TTLs', async () => {
    const redis = new InMemoryRedis();
    const redisService = {
      getClient: jest.fn().mockResolvedValue(redis),
    } as unknown as jest.Mocked<RedisService>;
    const service = new RateLimitService(redisService);

    await service.consume('rate:key', 2, 60);
    const ttl = await redis.ttl('rate:key');
    expect(ttl).toBeGreaterThan(0);

    await service.consume('rate:key', 2, 60);

    try {
      await service.consume('rate:key', 2, 60);
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.TOO_MANY_REQUESTS }),
      );
    }
  });
});
