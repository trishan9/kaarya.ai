import request from 'supertest';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import {
  createE2EApp,
  closeE2EApp,
  resetE2EDatabase,
  E2EApp,
} from '../helpers/e2e';

const base = `/api/v1/${ROUTES.ADMIN.BASE}/${ROUTES.USER.BASE}`;
const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;

describe('Admin user uploads (integration)', () => {
  let context: E2EApp;
  let adminToken = '';

  const seedAdmin = async () => {
    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Admin',
        email: 'admin.upload@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'admin',
      })
      .expect(200);

    const login = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'admin.upload@example.com',
        password: 'Password123',
      })
      .expect(200);

    return login.body.data.accessToken as string;
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
    adminToken = await seedAdmin();
  });

  it('should upload a photo when creating a user', async () => {
    const response = await request(context.app.getHttpServer())
      .post(base)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Managed User')
      .field('email', 'managed.upload@example.com')
      .field('password', 'Password123')
      .field('confirmPassword', 'Password123')
      .attach('photo', Buffer.from('fake-image'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(context.cloudinary.uploadImage).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.CREATE_SUCCESS,
        data: expect.objectContaining({
          id: expect.any(String),
          email: 'managed.upload@example.com',
          photo: 'https://img.test/photo',
        }),
      }),
    );
  });

  it('should reject non-image uploads on update', async () => {
    const created = await request(context.app.getHttpServer())
      .post(base)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Managed User')
      .field('email', 'managed.update@example.com')
      .field('password', 'Password123')
      .field('confirmPassword', 'Password123')
      .expect(200);

    const createdUserId = created.body.data.id as string;

    const response = await request(context.app.getHttpServer())
      .put(`${base}/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Managed Updated')
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
