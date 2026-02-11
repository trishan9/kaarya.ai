import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export type TestMongo = {
  server: MongoMemoryServer;
  uri: string;
};

export const startInMemoryMongo = async (): Promise<TestMongo> => {
  const server = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 60_000,
    },
  });
  const uri = server.getUri();

  process.env.DATABASE_URL = uri;
  process.env.DATABASE_NAME = 'kaarya_test';
  delete process.env.DATABASE_USERNAME;
  delete process.env.DATABASE_PASSWORD;

  return { server, uri };
};

export const stopInMemoryMongo = async (mongo: TestMongo) => {
  await mongoose.disconnect();
  await mongo.server.stop({ doCleanup: true, force: true });
};

export const clearDatabase = async () => {
  const connections = mongoose.connections.length
    ? mongoose.connections
    : [mongoose.connection];

  await Promise.all(
    connections.map(async (connection) => {
      if (connection.readyState !== 1) return;
      const collections = Object.values(connection.collections);
      await Promise.all(
        collections.map((collection) => collection.deleteMany({})),
      );
    }),
  );
};
