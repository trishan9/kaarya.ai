import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';
import { RESPONSE_MESSAGES } from 'src/constants/messages.constants';

export const asyncHandler = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new ApiError({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
};
