import request from 'supertest';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import {
  createE2EApp,
  closeE2EApp,
  resetE2EDatabase,
  E2EApp,
} from '../helpers/e2e';

const base = `/api/v1/${ROUTES.AUTH.BASE}`;

describe('Auth uploads (integration)', () => {
  let context: E2EApp;
  let accessToken = '';
  let userId = '';

  const seedUser = async () => {
    const signup = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Integration User',
        email: 'integration.upload@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(200);

    const login = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'integration.upload@example.com',
        password: 'Password123',
      })
      .expect(200);

    return {
      accessToken: login.body.data.accessToken as string,
      userId: signup.body.data.id as string,
    };
  };

  beforeAll(async () => {
    context = await createE2EApp();
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  beforeEach(async () => {
    await resetE2EDatabase(context);
    context.cloudinary.uploadImage.mockClear();
    const seed = await seedUser();
    accessToken = seed.accessToken;
    userId = seed.userId;
  });

  it('should upload a profile photo when updating the current user', async () => {
    const response = await request(context.app.getHttpServer())
      .put(`${base}/${ROUTES.AUTH.UPDATE_ME}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', 'Integration Updated')
      .attach('photo', Buffer.from('fake-image'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(context.cloudinary.uploadImage).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.UPDATE_SUCCESS,
        data: expect.objectContaining({
          id: userId,
          name: 'Integration Updated',
          photo: 'https://img.test/photo',
        }),
      }),
    );
  });

  it('should skip uploads when no photo is provided', async () => {
    const response = await request(context.app.getHttpServer())
      .put(`${base}/${ROUTES.AUTH.UPDATE_ME}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', 'No Photo Update')
      .expect(200);

    expect(context.cloudinary.uploadImage).not.toHaveBeenCalled();
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.UPDATE_SUCCESS,
        data: expect.objectContaining({
          id: userId,
          name: 'No Photo Update',
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

  it('should upload certification image media for authenticated candidates', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.CERTIFICATION_UPLOAD}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('fake-cert-image'), {
        filename: 'cert.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(context.cloudinary.uploadImage).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          url: 'https://img.test/photo',
          mimeType: 'image/png',
          fileName: 'cert.png',
        }),
      }),
    );
  });

  it('should reject unsupported certification media mimetypes', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${base}/${ROUTES.AUTH.CERTIFICATION_UPLOAD}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('fake-cert-text'), {
        filename: 'cert.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(context.cloudinary.uploadImage).not.toHaveBeenCalled();
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'Only PDF, JPG, PNG, and WEBP files are allowed.',
      }),
    );
  });
});
