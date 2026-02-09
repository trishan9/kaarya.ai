import request from 'supertest';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const HELLO_MESSAGE = 'Hello Worldsss!';

describe('AppController (e2e)', () => {
  let context: E2EApp;

  beforeAll(async () => {
    context = await createE2EApp();
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  it('should return the hello message', async () => {
    await request(context.app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(HELLO_MESSAGE);
  });
});
