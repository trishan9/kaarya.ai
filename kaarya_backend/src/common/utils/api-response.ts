export const RESPONSE_STATUS = {
  SUCCESS: true,
  ERROR: false,
} as const;

export type ApiSuccessResponse<T> = {
  success: typeof RESPONSE_STATUS.SUCCESS;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: typeof RESPONSE_STATUS.ERROR;
  message: string;
  errors?: unknown;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const buildSuccessResponse = <T>(
  data: T,
  message: string,
): ApiSuccessResponse<T> => ({
  success: RESPONSE_STATUS.SUCCESS,
  message,
  data,
});

export const buildErrorResponse = (
  message: string,
  errors?: unknown,
): ApiErrorResponse => ({
  success: RESPONSE_STATUS.ERROR,
  message,
  ...(errors ? { errors } : {}),
});
