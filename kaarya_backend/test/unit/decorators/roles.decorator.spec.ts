import 'reflect-metadata';
import { Roles, ROLES_KEY } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/types/user-role.enum';

describe('Roles decorator', () => {
  it('should attach roles metadata', () => {
    class TestController {
      @Roles(UserRole.ADMIN, UserRole.USER)
      handler() {
        return 'ok';
      }
    }

    const handler = TestController.prototype.handler;

    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      UserRole.ADMIN,
      UserRole.USER,
    ]);
  });
});
