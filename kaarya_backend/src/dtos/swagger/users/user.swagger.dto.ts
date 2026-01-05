import { ApiProperty } from '@nestjs/swagger';

export class CreateUserSwaggerDTO {
  @ApiProperty({ example: 'Trishan Wagle' })
  name: string;

  @ApiProperty({ example: 'trishan@example.com' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  password: string;

  @ApiProperty({ example: 'Password123!' })
  confirmPassword: string;
}

export class LoginSwaggerDTO {
  @ApiProperty({ example: 'trishan@example.com' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  password: string;
}
