import mongooseAutoPopulate from 'mongoose-autopopulate';
import { ConfigService } from '@nestjs/config';
import { MongooseConfigService } from 'src/database/mongoose-config.service';

describe('MongooseConfigService', () => {
  it('should build options with auth when credentials are provided', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'database.url') return 'mongodb://localhost:27017';
        if (key === 'database.name') return 'db';
        if (key === 'database.username') return 'user';
        if (key === 'database.password') return 'pass';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new MongooseConfigService(configService);
    const options = service.createMongooseOptions();

    expect(options.uri).toBe('mongodb://localhost:27017');
    expect(options.dbName).toBe('db');
    expect(options.user).toBe('user');
    expect(options.pass).toBe('pass');

    const plugin = jest.fn();
    options.connectionFactory?.({ plugin } as never);
    expect(plugin).toHaveBeenCalledWith(mongooseAutoPopulate);
  });

  it('should omit auth when credentials are missing', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'database.url') return 'mongodb://localhost:27017';
        if (key === 'database.name') return 'db';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new MongooseConfigService(configService);
    const options = service.createMongooseOptions();

    expect(options.user).toBeUndefined();
    expect(options.pass).toBeUndefined();
  });
});
