import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import { CONFIG_NAMESPACE } from 'src/constants/config.constants';
import { CloudinaryConfig } from 'src/types/cloudinary-config.type';
import validateConfig from 'src/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_FOLDER?: string;
}

export default registerAs<CloudinaryConfig>(CONFIG_NAMESPACE.CLOUDINARY, () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER,
  };
});
