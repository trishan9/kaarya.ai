import request from 'supertest';
import { AUTH_MESSAGES, USER_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const base = `/api/v1/${ROUTES.AUTH.BASE}`;

describe('Auth routes (e2e)', () => {
  let context: E2EApp;
  let accessToken = '';
  let userId = '';

  beforeAll(async () => {
    context = await createE2EApp();
  });

  beforeEach(() => {
    context.cloudinary.uploadImage.mockClear();
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  it('should reject invalid signup payloads', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: '',
        email: 'bad',
        password: 'short',
        confirmPassword: 'mismatch',
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
      }),
    );
  });

  it('should sign up a new user', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'E2E User',
        email: 'e2e.user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: AUTH_MESSAGES.SIGNUP_SUCCESS,
      }),
    );

    userId = response.body.data.id;
    expect(userId).toBeTruthy();
  });

  it('should log in and return a token', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'e2e.user@example.com',
        password: 'Password123',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
      }),
    );

    accessToken = response.body.data.accessToken;
    expect(accessToken).toBeTruthy();
  });

  it('should return the current user', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${base}/${ROUTES.AUTH.ME}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: AUTH_MESSAGES.CURRENT_USER_SUCCESS,
        data: expect.objectContaining({ id: userId }),
      }),
    );
  });

  it('should update the current user profile', async () => {
    const response = await request(context.app.getHttpServer())
      .put(`${base}/${ROUTES.AUTH.UPDATE_ME}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', 'E2E Updated')
      .attach('photo', Buffer.from('fake-image'), 'avatar.png')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.UPDATE_SUCCESS,
        data: expect.objectContaining({
          id: userId,
          name: 'E2E Updated',
          photo: 'https://img.test/photo',
        }),
      }),
    );
  });

  it('should update the current user without uploading a photo', async () => {
    const response = await request(context.app.getHttpServer())
      .put(`${base}/${ROUTES.AUTH.UPDATE_ME}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', 'E2E Updated Again')
      .expect(200);

    expect(context.cloudinary.uploadImage).not.toHaveBeenCalled();
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.UPDATE_SUCCESS,
        data: expect.objectContaining({
          id: userId,
          name: 'E2E Updated Again',
        }),
      }),
    );
  });

  it('should reject non-image uploads', async () => {
    const response = await request(context.app.getHttpServer())
      .put(`${base}/${ROUTES.AUTH.UPDATE_ME}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', 'Invalid Upload')
      .attach('photo', Buffer.from('not-an-image'), {
        filename: 'not-image.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(context.cloudinary.uploadImage).not.toHaveBeenCalled();
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'Only image files are allowed.',
      }),
    );
  });
});
