import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export type TestMongo = {
  server: MongoMemoryServer;
  uri: string;
};

export const startInMemoryMongo = async (): Promise<TestMongo> => {
  const server = await MongoMemoryServer.create();
  const uri = server.getUri();

  process.env.DATABASE_URL = uri;
  process.env.DATABASE_NAME = 'kaarya_test';

  return { server, uri };
};

export const stopInMemoryMongo = async (mongo: TestMongo) => {
  await mongoose.disconnect();
  await mongo.server.stop();
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
};
