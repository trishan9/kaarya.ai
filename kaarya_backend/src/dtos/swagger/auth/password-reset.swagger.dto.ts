import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetSwaggerDTO {
  @ApiProperty({ example: 'trishan@example.com' })
  email: string;
}

export class VerifyPasswordResetOtpSwaggerDTO {
  @ApiProperty({ example: 'trishan@example.com' })
  email: string;

  @ApiProperty({ example: '492031' })
  otp: string;
}

export class ResetPasswordSwaggerDTO {
  @ApiProperty({ example: 'reset.jwt.token' })
  token: string;

  @ApiProperty({ example: 'VeryStrongPassword!2026' })
  password: string;

  @ApiProperty({ example: 'VeryStrongPassword!2026' })
  confirmPassword: string;
}
