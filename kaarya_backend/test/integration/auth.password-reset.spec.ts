import request from 'supertest';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import {
  createE2EApp,
  closeE2EApp,
  resetE2EDatabase,
  E2EApp,
} from '../helpers/e2e';

const base = `/api/v1/${ROUTES.AUTH.BASE}`;

describe('Auth password reset (integration)', () => {
  let context: E2EApp;

  const seedUser = async () => {
    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Reset User',
        email: 'reset.integration@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(200);
  };

  beforeAll(async () => {
    context = await createE2EApp();
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  beforeEach(async () => {
    await resetE2EDatabase(context);
    context.email.sendPasswordResetOtp.mockClear();
    context.email.sendPasswordResetSuccess.mockClear();
    context.email.sendOnboardingEmail.mockClear();
    await seedUser();
    context.email.sendPasswordResetOtp.mockClear();
    context.email.sendPasswordResetSuccess.mockClear();
  });

  it('should complete the password reset flow', async () => {
    const requestReset = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_REQUEST}`)
      .send({ email: 'reset.integration@example.com' })
      .expect(200);

    expect(requestReset.body).toEqual(
      expect.objectContaining({
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_REQUESTED,
        data: { submitted: true },
      }),
    );

    expect(context.email.sendPasswordResetOtp).toHaveBeenCalledTimes(1);
    const otp = context.email.sendPasswordResetOtp.mock.calls[0][1] as string;
    const resetLink = context.email.sendPasswordResetOtp.mock.calls[0][3] as
      | string
      | undefined;
    expect(resetLink).toContain('/forgot-password?token=');

    const verify = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_VERIFY}`)
      .send({ email: 'reset.integration@example.com', otp })
      .expect(200);

    expect(verify.body).toEqual(
      expect.objectContaining({
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_VERIFIED,
      }),
    );

    const token = verify.body.data.resetToken as string;

    const confirm = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_CONFIRM}`)
      .send({
        token,
        password: 'NewPassword!123',
        confirmPassword: 'NewPassword!123',
      })
      .expect(200);

    expect(confirm.body).toEqual(
      expect.objectContaining({
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
        data: { reset: true },
      }),
    );
    expect(context.email.sendPasswordResetSuccess).toHaveBeenCalledTimes(1);
    expect(context.email.sendPasswordResetSuccess).toHaveBeenCalledWith(
      'reset.integration@example.com',
      expect.objectContaining({
        userName: 'Reset User',
        ipAddress: expect.any(String),
        occurredAt: expect.any(Date),
      }),
    );
  });

  it('should reset password directly with the link token from email', async () => {
    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_REQUEST}`)
      .send({ email: 'reset.integration@example.com' })
      .expect(200);

    const resetLink = context.email.sendPasswordResetOtp.mock.calls[0][3] as
      | string
      | undefined;
    expect(resetLink).toBeDefined();
    const resetToken = new URL(resetLink as string).searchParams.get('token');
    expect(resetToken).toBeTruthy();

    const confirm = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_CONFIRM}`)
      .send({
        token: resetToken,
        password: 'NewPassword!123',
        confirmPassword: 'NewPassword!123',
      })
      .expect(200);

    expect(confirm.body).toEqual(
      expect.objectContaining({
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
        data: { reset: true },
      }),
    );
  });

  it('should reject invalid reset codes', async () => {
    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_REQUEST}`)
      .send({ email: 'reset.integration@example.com' })
      .expect(200);

    const response = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_VERIFY}`)
      .send({ email: 'reset.integration@example.com', otp: '000000' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: AUTH_MESSAGES.INVALID_RESET_CODE,
      }),
    );
    expect(context.email.sendPasswordResetSuccess).not.toHaveBeenCalled();
  });
});
