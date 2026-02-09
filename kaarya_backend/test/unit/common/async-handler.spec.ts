import { BadRequestException, HttpStatus } from '@nestjs/common';
import { asyncHandler } from 'src/common/utils/async-handler';
import { RESPONSE_MESSAGES } from 'src/constants/messages.constants';

describe('asyncHandler', () => {
  it('should return the operation result', async () => {
    await expect(asyncHandler(async () => 'ok')).resolves.toBe('ok');
  });

  it('should rethrow HttpException instances', async () => {
    const error = new BadRequestException('Bad');

    await expect(
      asyncHandler(async () => {
        throw error;
      }),
    ).rejects.toBe(error);
  });

  it('should wrap unexpected errors as ApiError', async () => {
    try {
      await asyncHandler(async () => {
        throw new Error('boom');
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({
          message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
        }),
      );
    }
  });
});
