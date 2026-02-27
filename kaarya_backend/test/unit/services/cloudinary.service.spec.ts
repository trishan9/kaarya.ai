import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { CloudinaryService } from 'src/services/cloudinary.service';

type UploadResult = {
  secure_url?: string;
  url?: string;
  public_id?: string;
  original_filename?: string;
  bytes?: number;
  format?: string;
};

const uploadStreamMock = jest.fn();
const configMock = jest.fn();

jest.mock('cloudinary', () => ({
  v2: {
    config: (...args: unknown[]) => configMock(...args),
    uploader: {
      upload_stream: (...args: unknown[]) => uploadStreamMock(...args),
    },
  },
}));

describe('CloudinaryService', () => {
  const makeConfigService = (values: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as unknown as ConfigService;

  beforeEach(() => {
    uploadStreamMock.mockReset();
    configMock.mockReset();
  });

  it('should reject uploads when not configured', async () => {
    const configService = makeConfigService({});
    const service = new CloudinaryService(configService);

    try {
      await service.uploadImage({ buffer: Buffer.from('x') } as never);
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  });

  it('should reject invalid files', async () => {
    const configService = makeConfigService({
      [CONFIG_KEYS.CLOUDINARY.CLOUD_NAME]: 'cloud',
      [CONFIG_KEYS.CLOUDINARY.API_KEY]: 'key',
      [CONFIG_KEYS.CLOUDINARY.API_SECRET]: 'secret',
    });

    const service = new CloudinaryService(configService);

    try {
      await service.uploadImage({} as never);
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & { getStatus?: () => number };
      expect(apiError.getStatus?.()).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('should upload images and return secure urls', async () => {
    const configService = makeConfigService({
      [CONFIG_KEYS.CLOUDINARY.CLOUD_NAME]: 'cloud',
      [CONFIG_KEYS.CLOUDINARY.API_KEY]: 'key',
      [CONFIG_KEYS.CLOUDINARY.API_SECRET]: 'secret',
      [CONFIG_KEYS.CLOUDINARY.FOLDER]: 'folder',
    });

    uploadStreamMock.mockImplementation(
      (
        _options: unknown,
        callback: (error?: Error, result?: UploadResult) => void,
      ) => ({
        end: jest.fn(() =>
          callback(undefined, { secure_url: 'https://img.test/photo' }),
        ),
      }),
    );

    const service = new CloudinaryService(configService);

    const result = await service.uploadImage({
      buffer: Buffer.from('x'),
    } as never);

    expect(configMock).toHaveBeenCalled();
    expect(result).toBe('https://img.test/photo');
  });

  it('should upload images and fallback to plain url when secure_url is missing', async () => {
    const configService = makeConfigService({
      [CONFIG_KEYS.CLOUDINARY.CLOUD_NAME]: 'cloud',
      [CONFIG_KEYS.CLOUDINARY.API_KEY]: 'key',
      [CONFIG_KEYS.CLOUDINARY.API_SECRET]: 'secret',
    });

    uploadStreamMock.mockImplementation(
      (
        _options: unknown,
        callback: (error?: Error, result?: UploadResult) => void,
      ) => ({
        end: jest.fn(() => callback(undefined, { url: 'http://img.test/photo' })),
      }),
    );

    const service = new CloudinaryService(configService);
    await expect(
      service.uploadImage({ buffer: Buffer.from('x') } as never),
    ).resolves.toBe('http://img.test/photo');
  });

  it('should surface upload errors', async () => {
    const configService = makeConfigService({
      [CONFIG_KEYS.CLOUDINARY.CLOUD_NAME]: 'cloud',
      [CONFIG_KEYS.CLOUDINARY.API_KEY]: 'key',
      [CONFIG_KEYS.CLOUDINARY.API_SECRET]: 'secret',
    });

    uploadStreamMock.mockImplementation(
      (
        _options: unknown,
        callback: (error?: Error, result?: UploadResult) => void,
      ) => ({
        end: jest.fn(() => callback(new Error('fail'))),
      }),
    );

    const service = new CloudinaryService(configService);

    await expect(
      service.uploadImage({ buffer: Buffer.from('x') } as never),
    ).rejects.toThrow('fail');
  });

  it('should reject uploads without urls', async () => {
    const configService = makeConfigService({
      [CONFIG_KEYS.CLOUDINARY.CLOUD_NAME]: 'cloud',
      [CONFIG_KEYS.CLOUDINARY.API_KEY]: 'key',
      [CONFIG_KEYS.CLOUDINARY.API_SECRET]: 'secret',
    });

    uploadStreamMock.mockImplementation(
      (
        _options: unknown,
        callback: (error?: Error, result?: UploadResult) => void,
      ) => ({
        end: jest.fn(() => callback(undefined, { secure_url: '' })),
      }),
    );

    const service = new CloudinaryService(configService);

    await expect(
      service.uploadImage({ buffer: Buffer.from('x') } as never),
    ).rejects.toThrow('Cloudinary did not return a URL.');
  });

  it('should upload documents and return normalized payload', async () => {
    const configService = makeConfigService({
      [CONFIG_KEYS.CLOUDINARY.CLOUD_NAME]: 'cloud',
      [CONFIG_KEYS.CLOUDINARY.API_KEY]: 'key',
      [CONFIG_KEYS.CLOUDINARY.API_SECRET]: 'secret',
      [CONFIG_KEYS.CLOUDINARY.FOLDER]: 'folder',
    });

    uploadStreamMock.mockImplementation(
      (
        options: Record<string, unknown>,
        callback: (error?: Error, result?: UploadResult) => void,
      ) => ({
        end: jest.fn(() =>
          callback(undefined, {
            secure_url: 'https://cdn.test/resume.pdf',
            public_id: 'folder/resumes/resume-1',
            original_filename: 'resume',
            bytes: 100,
            format: 'pdf',
          }),
        ),
      }),
    );

    const service = new CloudinaryService(configService);
    const file = {
      buffer: Buffer.from('doc'),
      originalname: 'resume.pdf',
      size: 120,
    } as Express.Multer.File;

    const result = await service.uploadDocument(file);
    expect(uploadStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource_type: 'raw',
        folder: 'folder/resumes',
      }),
      expect.any(Function),
    );
    expect(result).toEqual({
      url: 'https://cdn.test/resume.pdf',
      publicId: 'folder/resumes/resume-1',
      originalFilename: 'resume',
      bytes: 100,
      format: 'pdf',
    });
  });

  it('should validate document uploads and handle cloudinary failures', async () => {
    const configured = makeConfigService({
      [CONFIG_KEYS.CLOUDINARY.CLOUD_NAME]: 'cloud',
      [CONFIG_KEYS.CLOUDINARY.API_KEY]: 'key',
      [CONFIG_KEYS.CLOUDINARY.API_SECRET]: 'secret',
    });
    const unconfigured = makeConfigService({});

    const unconfiguredService = new CloudinaryService(unconfigured);
    await expect(
      unconfiguredService.uploadDocument({
        buffer: Buffer.from('x'),
      } as never),
    ).rejects.toMatchObject({
      getStatus: expect.any(Function),
    });

    const service = new CloudinaryService(configured);
    await expect(service.uploadDocument({} as never)).rejects.toMatchObject({
      getStatus: expect.any(Function),
    });

    uploadStreamMock.mockImplementation(
      (
        _options: unknown,
        callback: (error?: Error, result?: UploadResult) => void,
      ) => ({
        end: jest.fn(() => callback(new Error('upload failed'))),
      }),
    );
    await expect(
      service.uploadDocument({
        buffer: Buffer.from('x'),
        originalname: 'resume.docx',
      } as never),
    ).rejects.toThrow('upload failed');

    uploadStreamMock.mockImplementation(
      (
        _options: unknown,
        callback: (error?: Error, result?: UploadResult) => void,
      ) => ({
        end: jest.fn(() =>
          callback(undefined, {
            secure_url: 'https://cdn.test/resume.docx',
          }),
        ),
      }),
    );
    await expect(
      service.uploadDocument({
        buffer: Buffer.from('x'),
        originalname: 'resume.docx',
      } as never),
    ).rejects.toThrow('Cloudinary did not return a valid document URL.');

    uploadStreamMock.mockImplementation(
      (
        _options: unknown,
        callback: (error?: Error, result?: UploadResult) => void,
      ) => ({
        end: jest.fn(() =>
          callback(undefined, {
            url: 'http://cdn.test/resume.docx',
            public_id: 'resumes/doc-2',
          }),
        ),
      }),
    );
    await expect(
      service.uploadDocument({
        buffer: Buffer.from('x'),
        originalname: 'resume.docx',
        size: 42,
      } as never),
    ).resolves.toEqual({
      url: 'http://cdn.test/resume.docx',
      publicId: 'resumes/doc-2',
      originalFilename: 'resume.docx',
      bytes: 42,
      format: undefined,
    });
  });
});
