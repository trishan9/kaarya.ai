import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordSwaggerDTO {
  @ApiProperty({ example: 'OldPassword!2026' })
  currentPassword: string;

  @ApiProperty({ example: 'NewStrongPassword!2026' })
  newPassword: string;

  @ApiProperty({ example: 'NewStrongPassword!2026' })
  confirmNewPassword: string;
}
