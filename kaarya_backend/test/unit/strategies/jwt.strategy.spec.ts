import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { UserService } from 'src/services/user.service';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';

describe('JwtStrategy', () => {
  it('should return the user when valid', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;

    const userService = {
      getUserByIdRaw: jest.fn().mockResolvedValue({ id: 'user-1' }),
    } as unknown as jest.Mocked<UserService>;

    const strategy = new JwtStrategy(configService, userService);

    const result = await strategy.validate({ sub: 'user-1' });

    expect(result).toEqual({ id: 'user-1' });
    expect(userService.getUserByIdRaw).toHaveBeenCalledWith('user-1');
  });

  it('should throw when the user is missing', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;

    const userService = {
      getUserByIdRaw: jest.fn().mockRejectedValue(new Error('Not found')),
    } as unknown as jest.Mocked<UserService>;

    const strategy = new JwtStrategy(configService, userService);

    try {
      await strategy.validate({ sub: 'missing' });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.UNAUTHORIZED);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.INVALID_TOKEN }),
      );
    }
  });
});
