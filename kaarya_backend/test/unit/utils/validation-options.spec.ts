import { HttpStatus, ValidationError } from '@nestjs/common';
import validationOptions from 'src/utils/validation-options';

describe('validationOptions', () => {
  it('should build nested validation error responses', () => {
    const errors: ValidationError[] = [
      {
        property: 'user',
        children: [
          {
            property: 'email',
            constraints: { isEmail: 'email must be an email' },
            children: [],
          } as ValidationError,
        ],
      } as ValidationError,
    ];

    const exception = validationOptions.exceptionFactory?.(errors);
    const response = exception?.getResponse() as {
      status: number;
      errors: Record<string, unknown>;
    };

    expect(exception?.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response).toEqual({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: { user: { email: 'email must be an email' } },
    });
  });

  it('should build flat constraint messages and handle missing constraints', () => {
    const errors: ValidationError[] = [
      {
        property: 'password',
        constraints: {
          minLength: 'password too short',
          isString: 'password must be string',
        },
        children: [],
      } as ValidationError,
      {
        property: 'metadata',
        constraints: undefined,
      } as ValidationError,
    ];

    const exception = validationOptions.exceptionFactory?.(errors);
    const response = exception?.getResponse() as {
      status: number;
      errors: Record<string, unknown>;
    };

    expect(exception?.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response).toEqual({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: {
        password: 'password too short, password must be string',
        metadata: '',
      },
    });
  });
});
