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

export class CreateAdminUserSwaggerDTO extends CreateUserSwaggerDTO {
  @ApiProperty({ example: 'user', required: false })
  role?: string;

  @ApiProperty({ example: 'email', required: false })
  provider?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  photo?: string;
}

export class UpdateAdminUserSwaggerDTO {
  @ApiProperty({ example: 'Trishan Wagle', required: false })
  name?: string;

  @ApiProperty({ example: 'trishan@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'Password123!', required: false })
  password?: string;

  @ApiProperty({ example: 'user', required: false })
  role?: string;

  @ApiProperty({ example: 'email', required: false })
  provider?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  photo?: string;
}

export class LoginSwaggerDTO {
  @ApiProperty({ example: 'trishan@example.com' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  password: string;
}

export class UpdateMeSwaggerDTO {
  @ApiProperty({ example: 'Trishan Wagle', required: false })
  name?: string;

  @ApiProperty({ example: 'trishan@example.com', required: false })
  email?: string;

  @ApiProperty({
    required: false,
    type: String,
    description:
      'Candidate profile payload as JSON string when using multipart form-data.',
    example:
      '{"headline":"Frontend Developer","skills":["React","TypeScript"],"experience":[{"id":"exp-1","jobTitle":"Frontend Engineer","companyName":"Acme","currentlyWorking":true}]}',
  })
  candidateProfile?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  photo?: string;
}
