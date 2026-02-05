import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from 'src/common/filters/global-exception.filter';
import { RESPONSE_MESSAGES } from 'src/constants/messages.constants';
import { RESPONSE_STATUS } from 'src/common/utils/api-response';

type HostOverrides = {
  url?: string;
};

const createHost = (overrides: HostOverrides = {}) => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const request = {
    url: overrides.url ?? '/test',
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
};

describe('GlobalExceptionFilter', () => {
  it('should handle non-HttpException errors', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHost();

    filter.catch(new Error('Boom'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const payload = response.json.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        success: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
        path: '/test',
      }),
    );
    expect(typeof payload.timestamp).toBe('string');
  });

  it('should handle HttpException with string response', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHost({ url: '/auth' });

    filter.catch(new HttpException('Unauthorized', 401), host);

    expect(response.status).toHaveBeenCalledWith(401);
    const payload = response.json.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        success: RESPONSE_STATUS.ERROR,
        message: 'Unauthorized',
        path: '/auth',
      }),
    );
  });

  it('should handle HttpException with array messages', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHost();

    filter.catch(
      new HttpException({ message: ['a', 'b'] }, HttpStatus.BAD_REQUEST),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const payload = response.json.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        success: RESPONSE_STATUS.ERROR,
        message: 'a, b',
        errors: ['a', 'b'],
      }),
    );
  });

  it('should prefer explicit errors payloads', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHost();

    filter.catch(
      new HttpException(
        { message: ['invalid'], errors: { field: 'error' } },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    const payload = response.json.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        errors: { field: 'error' },
      }),
    );
  });
});
