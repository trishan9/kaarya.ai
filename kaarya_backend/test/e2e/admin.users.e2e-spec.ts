import request from 'supertest';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const base = `/api/v1/${ROUTES.ADMIN.BASE}/${ROUTES.USER.BASE}`;
const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;

describe('Admin user routes (e2e)', () => {
  let context: E2EApp;
  let adminToken = '';
  let userToken = '';
  let createdUserId = '';

  beforeAll(async () => {
    context = await createE2EApp();

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'admin',
      })
      .expect(200);

    const adminLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'admin@example.com',
        password: 'Password123',
      })
      .expect(200);

    adminToken = adminLogin.body.data.accessToken;

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'User',
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'user',
      })
      .expect(200);

    const userLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'user@example.com',
        password: 'Password123',
      })
      .expect(200);

    userToken = userLogin.body.data.accessToken;
  });

  beforeEach(() => {
    context.cloudinary.uploadImage.mockClear();
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  it('should block non-admin access', async () => {
    await request(context.app.getHttpServer())
      .get(base)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should create a user', async () => {
    const response = await request(context.app.getHttpServer())
      .post(base)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Managed User')
      .field('email', 'managed@example.com')
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
          photo: 'https://img.test/photo',
        }),
      }),
    );

    createdUserId = response.body.data.id;
    expect(createdUserId).toBeTruthy();
  });

  it('should list users with pagination', async () => {
    const response = await request(context.app.getHttpServer())
      .get(base)
      .query({ page: 1, size: 10 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.FETCH_ALL_SUCCESS,
        data: expect.objectContaining({
          users: expect.any(Array),
          meta: expect.objectContaining({
            page: 1,
            size: 10,
          }),
        }),
      }),
    );
  });

  it('should return user analytics', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${base}/analytics`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.FETCH_ALL_SUCCESS,
        data: expect.objectContaining({
          totalUsers: expect.any(Number),
          totalAdmins: expect.any(Number),
        }),
      }),
    );
  });

  it('should return a user by id', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${base}/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.FETCH_BY_ID_SUCCESS,
        data: expect.objectContaining({ id: createdUserId }),
      }),
    );
  });

  it('should update a user', async () => {
    const response = await request(context.app.getHttpServer())
      .put(`${base}/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Managed Updated')
      .field('password', 'Password123')
      .attach('photo', Buffer.from('fake-image'), 'avatar.png')
      .expect(200);

    expect(context.cloudinary.uploadImage).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.UPDATE_SUCCESS,
        data: expect.objectContaining({ id: createdUserId }),
      }),
    );
  });

  it('should reject non-image uploads on update', async () => {
    const response = await request(context.app.getHttpServer())
      .put(`${base}/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Invalid Update')
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

  it('should delete a user', async () => {
    const response = await request(context.app.getHttpServer())
      .delete(`${base}/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: USER_MESSAGES.DELETE_SUCCESS,
      }),
    );
  });

  it('should return auth errors for missing tokens', async () => {
    const response = await request(context.app.getHttpServer())
      .get(base)
      .expect(401);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
      }),
    );
  });
});
