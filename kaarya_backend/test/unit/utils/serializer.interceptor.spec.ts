import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ResolvePromisesInterceptor } from 'src/utils/serializer.interceptor';

describe('ResolvePromisesInterceptor', () => {
  it('should resolve promises from the response stream', async () => {
    const interceptor = new ResolvePromisesInterceptor();
    const next: CallHandler = {
      handle: () => of({ message: Promise.resolve('ok') }),
    };

    const result = await lastValueFrom(
      interceptor.intercept({} as ExecutionContext, next),
    );

    expect(result).toEqual({ message: 'ok' });
  });
});
