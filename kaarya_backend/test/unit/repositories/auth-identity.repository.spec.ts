import { Types } from 'mongoose';
import { AuthIdentityRepository } from 'src/repositories/auth-identity.repository';
import { AuthProvider } from 'src/types/auth-provider.enum';

const chainWithValue = <T>(value: T) => {
  const chain: any = {
    sort: jest.fn().mockImplementation(() => chain),
    exec: jest.fn().mockResolvedValue(value),
  };
  return chain;
};

describe('AuthIdentityRepository', () => {
  const userId = new Types.ObjectId().toString();
  const identityId = new Types.ObjectId().toString();

  it('should create and find by provider identity', async () => {
    const save = jest.fn().mockResolvedValue({ id: identityId });
    const ctor = jest.fn().mockImplementation(() => ({ save })) as any;
    ctor.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: identityId }) });
    const repository = new AuthIdentityRepository(ctor);

    expect(await repository.create({ provider: AuthProvider.GOOGLE } as never)).toEqual({
      id: identityId,
    });

    expect(
      await repository.findByProviderIdentity(
        AuthProvider.GOOGLE,
        '',
      ),
    ).toBeNull();
    expect(
      await repository.findByProviderIdentity(
        AuthProvider.GOOGLE,
        'google-user-1',
      ),
    ).toEqual({ id: identityId });
    expect(ctor.findOne).toHaveBeenCalledWith({
      provider: AuthProvider.GOOGLE,
      providerUserId: 'google-user-1',
    });
  });

  it('should find by user/provider and list by user', async () => {
    const findOneExec = jest.fn().mockResolvedValue({ id: identityId });
    const findChain = chainWithValue([{ id: identityId }]);
    const model = {
      findOne: jest.fn().mockReturnValue({ exec: findOneExec }),
      find: jest.fn().mockReturnValue(findChain),
    } as any;
    const repository = new AuthIdentityRepository(model);

    expect(await repository.findByUserAndProvider('', AuthProvider.GOOGLE)).toBeNull();
    expect(
      await repository.findByUserAndProvider(userId, AuthProvider.GOOGLE),
    ).toEqual({ id: identityId });

    expect(await repository.findByUserId('')).toEqual([]);
    expect(await repository.findByUserId(userId)).toEqual([{ id: identityId }]);
    expect(findChain.sort).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
  });

  it('should update/delete by id', async () => {
    const updateExec = jest.fn().mockResolvedValue({ id: identityId, provider: AuthProvider.GITHUB });
    const deleteExec = jest.fn().mockResolvedValue({ id: identityId });
    const model = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: updateExec }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: deleteExec }),
    } as any;
    const repository = new AuthIdentityRepository(model);

    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.updateById(identityId, { provider: AuthProvider.GITHUB })).toEqual({
      id: identityId,
      provider: AuthProvider.GITHUB,
    });

    expect(await repository.deleteById('')).toBeNull();
    expect(await repository.deleteById(identityId)).toEqual({ id: identityId });
  });
});
