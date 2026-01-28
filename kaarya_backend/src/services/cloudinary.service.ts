import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { AllConfigType } from 'src/types/config.type';

@Injectable()
export class CloudinaryService {
  private readonly isConfigured: boolean;
  private readonly folder?: string;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const cloudName = this.configService.get<string>(
      CONFIG_KEYS.CLOUDINARY.CLOUD_NAME,
      {
        infer: true,
      },
    );
    const apiKey = this.configService.get<string>(
      CONFIG_KEYS.CLOUDINARY.API_KEY,
      { infer: true },
    );
    const apiSecret = this.configService.get<string>(
      CONFIG_KEYS.CLOUDINARY.API_SECRET,
      { infer: true },
    );

    this.folder = this.configService.get<string>(
      CONFIG_KEYS.CLOUDINARY.FOLDER,
      { infer: true },
    );

    if (!cloudName || !apiKey || !apiSecret) {
      this.isConfigured = false;
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this.isConfigured = true;
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!this.isConfigured) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Cloudinary is not configured.',
      });
    }

    if (!file?.buffer) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid image upload.',
      });
    }

    const options: Record<string, unknown> = {
      resource_type: 'image',
    };

    if (this.folder) {
      options.folder = this.folder;
    }

    return await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed.'));
            return;
          }

          const url = result.secure_url || result.url;
          if (!url) {
            reject(new Error('Cloudinary did not return a URL.'));
            return;
          }

          resolve(url);
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}
