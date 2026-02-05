import {
  buildSuccessResponse,
  buildErrorResponse,
  RESPONSE_STATUS,
} from 'src/common/utils/api-response';

describe('api-response utils', () => {
  it('should build success responses', () => {
    const payload = { id: 'user-1' };
    const result = buildSuccessResponse(payload, 'ok');

    expect(result).toEqual({
      success: RESPONSE_STATUS.SUCCESS,
      message: 'ok',
      data: payload,
    });
  });

  it('should build error responses with optional errors', () => {
    const result = buildErrorResponse('failed', { field: 'error' });

    expect(result).toEqual({
      success: RESPONSE_STATUS.ERROR,
      message: 'failed',
      errors: { field: 'error' },
    });
  });

  it('should omit errors when not provided', () => {
    const result = buildErrorResponse('failed');

    expect(result).toEqual({
      success: RESPONSE_STATUS.ERROR,
      message: 'failed',
    });
  });
});
