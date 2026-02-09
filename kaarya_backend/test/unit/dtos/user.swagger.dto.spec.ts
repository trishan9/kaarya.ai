import {
  CreateUserSwaggerDTO,
  CreateAdminUserSwaggerDTO,
  UpdateAdminUserSwaggerDTO,
  LoginSwaggerDTO,
  UpdateMeSwaggerDTO,
} from 'src/dtos/swagger/users/user.swagger.dto';

describe('Swagger DTOs', () => {
  it('should instantiate swagger dto classes', () => {
    expect(new CreateUserSwaggerDTO()).toBeInstanceOf(CreateUserSwaggerDTO);
    expect(new CreateAdminUserSwaggerDTO()).toBeInstanceOf(
      CreateAdminUserSwaggerDTO,
    );
    expect(new UpdateAdminUserSwaggerDTO()).toBeInstanceOf(
      UpdateAdminUserSwaggerDTO,
    );
    expect(new LoginSwaggerDTO()).toBeInstanceOf(LoginSwaggerDTO);
    expect(new UpdateMeSwaggerDTO()).toBeInstanceOf(UpdateMeSwaggerDTO);
  });
});
