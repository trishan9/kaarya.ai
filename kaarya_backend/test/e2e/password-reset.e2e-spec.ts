import request from 'supertest';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const base = `/api/v1/${ROUTES.AUTH.BASE}`;

describe('Password reset routes (e2e)', () => {
  let context: E2EApp;

  beforeAll(async () => {
    context = await createE2EApp();
  });

  beforeEach(() => {
    context.email.sendPasswordResetOtp.mockClear();
    context.email.sendPasswordResetSuccess.mockClear();
    context.email.sendOnboardingEmail.mockClear();
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  it('should reset a password and allow login with the new password', async () => {
    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Reset E2E',
        email: 'reset.e2e@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(200);
    expect(context.email.sendOnboardingEmail).toHaveBeenCalledTimes(1);
    expect(context.email.sendOnboardingEmail).toHaveBeenCalledWith(
      'reset.e2e@example.com',
      { userName: 'Reset E2E' },
    );

    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_REQUEST}`)
      .send({ email: 'reset.e2e@example.com' })
      .expect(200);

    expect(context.email.sendPasswordResetOtp).toHaveBeenCalledTimes(1);
    const otp = context.email.sendPasswordResetOtp.mock.calls[0][1] as string;
    const resetLink = context.email.sendPasswordResetOtp.mock.calls[0][3] as
      | string
      | undefined;
    expect(resetLink).toContain('/forgot-password?token=');

    const verify = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_VERIFY}`)
      .send({ email: 'reset.e2e@example.com', otp })
      .expect(200);

    const token = verify.body.data.resetToken as string;

    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_CONFIRM}`)
      .send({
        token,
        password: 'NewPassword!123',
        confirmPassword: 'NewPassword!123',
      })
      .expect(200);

    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'reset.e2e@example.com',
        password: 'NewPassword!123',
      })
      .expect(200);
    expect(context.email.sendPasswordResetSuccess).toHaveBeenCalledTimes(1);
    expect(context.email.sendPasswordResetSuccess).toHaveBeenCalledWith(
      'reset.e2e@example.com',
      expect.objectContaining({
        userName: 'Reset E2E',
        ipAddress: expect.any(String),
        occurredAt: expect.any(Date),
      }),
    );
  });

  it('should allow resetting password directly from the emailed reset link token', async () => {
    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Reset Link E2E',
        email: 'reset.link.e2e@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(200);

    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_REQUEST}`)
      .send({ email: 'reset.link.e2e@example.com' })
      .expect(200);

    const resetLink = context.email.sendPasswordResetOtp.mock.calls[0][3] as
      | string
      | undefined;
    expect(resetLink).toBeDefined();
    const resetToken = new URL(resetLink as string).searchParams.get('token');
    expect(resetToken).toBeTruthy();

    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_CONFIRM}`)
      .send({
        token: resetToken,
        password: 'NewPassword!123',
        confirmPassword: 'NewPassword!123',
      })
      .expect(200);

    await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'reset.link.e2e@example.com',
        password: 'NewPassword!123',
      })
      .expect(200);
  });

  it('should reject invalid reset tokens', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.PASSWORD_RESET_CONFIRM}`)
      .send({
        token: 'invalid.token',
        password: 'NewPassword!123',
        confirmPassword: 'NewPassword!123',
      })
      .expect(401);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
      }),
    );
    expect(context.email.sendPasswordResetSuccess).not.toHaveBeenCalled();
  });
});
