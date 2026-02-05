import { HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';

describe('ApiError', () => {
  it('should default to internal server error status', () => {
    const error = new ApiError({ message: 'Boom' });

    expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.getResponse()).toEqual({ message: 'Boom' });
  });

  it('should respect explicit status codes', () => {
    const error = new ApiError({
      message: 'Not allowed',
      statusCode: HttpStatus.FORBIDDEN,
    });

    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toEqual({ message: 'Not allowed' });
  });
});
