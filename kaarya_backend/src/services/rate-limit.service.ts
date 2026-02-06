import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { RedisService } from 'src/services/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redisService: RedisService) {}

  async consume(key: string, max: number, windowSeconds: number) {
    const client = await this.redisService.getClient();
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, windowSeconds);
    }

    if (count > max) {
      throw new ApiError({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: AUTH_MESSAGES.TOO_MANY_REQUESTS,
      });
    }
  }
}
