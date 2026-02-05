import { AppService } from 'src/app.service';

describe('AppService', () => {
  it('should return the hello message', () => {
    const service = new AppService();

    expect(service.getHello()).toBe('Hello Worldsss!');
  });
});
