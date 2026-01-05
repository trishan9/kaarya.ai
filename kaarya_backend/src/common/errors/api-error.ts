import { HttpException, HttpStatus } from '@nestjs/common';

type ApiErrorPayload = {
  message: string;
  statusCode?: HttpStatus;
};

export class ApiError extends HttpException {
  constructor({ message, statusCode }: ApiErrorPayload) {
    super(
      {
        message,
      },
      statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
