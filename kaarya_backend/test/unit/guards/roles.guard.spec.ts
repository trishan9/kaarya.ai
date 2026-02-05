import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserRole } from 'src/types/user-role.enum';

describe('RolesGuard', () => {
  it('should allow access when no roles are required', () => {
    const guard = new RolesGuard(new Reflector());
    const context = {
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.USER } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    class TestController {
      @Roles(UserRole.ADMIN)
      handler() {
        return 'ok';
      }
    }

    const guard = new RolesGuard(new Reflector());
    const handler = TestController.prototype.handler;

    const context = {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.ADMIN } }),
      }),
    } as unknown as ExecutionContext;

    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([UserRole.ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should block access when user lacks required role', () => {
    class TestController {
      @Roles(UserRole.ADMIN)
      handler() {
        return 'ok';
      }
    }

    const guard = new RolesGuard(new Reflector());
    const handler = TestController.prototype.handler;

    const context = {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.USER } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should block access when user is missing', () => {
    class TestController {
      @Roles(UserRole.ADMIN)
      handler() {
        return 'ok';
      }
    }

    const guard = new RolesGuard(new Reflector());
    const handler = TestController.prototype.handler;

    const context = {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });
});
