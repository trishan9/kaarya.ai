import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from 'src/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { PasswordResetService } from 'src/services/password-reset.service';
import { ApiError } from 'src/common/errors/api-error';
import { AUTH_MESSAGES, USER_MESSAGES } from 'src/constants/messages.constants';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let cloudinaryService: { uploadImage: jest.Mock };
  let passwordResetService: {
    requestReset: jest.Mock;
    verifyOtp: jest.Mock;
    resetPassword: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
      me: jest.fn(),
      updateMe: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    cloudinaryService = {
      uploadImage: jest.fn(),
    };

    passwordResetService = {
      requestReset: jest.fn(),
      verifyOtp: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: PasswordResetService, useValue: passwordResetService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('should reject invalid signup payloads', async () => {
    const badPayload = {
      name: '',
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'mismatch',
    };

    await expect(controller.signup(badPayload as never)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('should sign up a user and returns a success response', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    authService.signup.mockResolvedValue({
      id: 'user-1',
      email: payload.email,
    });

    const response = await controller.signup(payload);

    expect(authService.signup).toHaveBeenCalledWith(
      expect.objectContaining({ email: payload.email }),
    );
    expect(response).toEqual({
      success: true,
      message: AUTH_MESSAGES.SIGNUP_SUCCESS,
      data: { id: 'user-1', email: payload.email },
    });
  });

  it('should reject invalid login payloads', async () => {
    const badPayload = {
      email: 'nope',
      password: 'short',
    };

    await expect(controller.login(badPayload as never)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('should log in and returns a success response', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'Password123',
    };

    authService.login.mockResolvedValue({
      user: { id: 'user-1', email: payload.email },
      accessToken: 'token',
    });

    const response = await controller.login(payload);

    expect(authService.login).toHaveBeenCalledWith(payload);
    expect(response).toEqual({
      success: true,
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      data: {
        user: { id: 'user-1', email: payload.email },
        accessToken: 'token',
      },
    });
  });

  it('should fetch the current user', async () => {
    authService.me.mockResolvedValue({ id: 'user-1' });

    const response = await controller.me({ user: { id: 'user-1' } });

    expect(authService.me).toHaveBeenCalledWith('user-1');
    expect(response).toEqual({
      success: true,
      message: AUTH_MESSAGES.CURRENT_USER_SUCCESS,
      data: { id: 'user-1' },
    });
  });

  it('should update the current user and uploads a photo when provided', async () => {
    cloudinaryService.uploadImage.mockResolvedValue('https://img.test/photo');
    authService.updateMe.mockResolvedValue({ id: 'user-1', name: 'Updated' });

    const response = await controller.updateMe(
      { user: { id: 'user-1' } },
      { name: 'Updated' },
      {
        buffer: Buffer.from('fake'),
        mimetype: 'image/png',
      } as Express.Multer.File,
    );

    expect(cloudinaryService.uploadImage).toHaveBeenCalled();
    expect(authService.updateMe).toHaveBeenCalledWith('user-1', {
      name: 'Updated',
      photo: 'https://img.test/photo',
    });

    expect(response).toEqual({
      success: true,
      message: USER_MESSAGES.UPDATE_SUCCESS,
      data: { id: 'user-1', name: 'Updated' },
    });
  });

  it('should update the current user without uploading when no photo is provided', async () => {
    authService.updateMe.mockResolvedValue({ id: 'user-1', name: 'Updated' });

    const response = await controller.updateMe(
      { user: { id: 'user-1' } },
      { name: 'Updated' },
      undefined,
    );

    expect(cloudinaryService.uploadImage).not.toHaveBeenCalled();
    expect(authService.updateMe).toHaveBeenCalledWith('user-1', {
      name: 'Updated',
    });

    expect(response).toEqual({
      success: true,
      message: USER_MESSAGES.UPDATE_SUCCESS,
      data: { id: 'user-1', name: 'Updated' },
    });
  });

  it('should reject invalid update payloads', async () => {
    await expect(
      controller.updateMe(
        { user: { id: 'user-1' } },
        { email: 'not-an-email' },
        undefined,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should preserve ApiError status codes', async () => {
    authService.me.mockRejectedValue(
      new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      }),
    );

    await expect(
      controller.me({ user: { id: 'user-1' } }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
