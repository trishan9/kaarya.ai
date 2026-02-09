import { Types } from 'mongoose';
import { sanitizeUser } from 'src/common/utils/sanitize-user';

describe('sanitizeUser', () => {
  it('should return null for empty inputs', () => {
    expect(sanitizeUser(null)).toBeNull();
    expect(sanitizeUser(undefined)).toBeNull();
  });

  it('should remove mongo metadata and sensitive fields', () => {
    const id = new Types.ObjectId();
    const result = sanitizeUser({
      _id: id,
      __v: 0,
      email: 'user@example.com',
      password: 'secret',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: id.toString(),
        email: 'user@example.com',
      }),
    );
    expect(result).not.toHaveProperty('_id');
    expect(result).not.toHaveProperty('__v');
    expect(result).not.toHaveProperty('password');
  });

  it('should support mongoose-style toJSON responses', () => {
    const id = new Types.ObjectId();
    const result = sanitizeUser({
      toJSON: () => ({ _id: id, email: 'json@example.com' }),
    });

    expect(result).toEqual(
      expect.objectContaining({ id: id.toString(), email: 'json@example.com' }),
    );
  });
});
