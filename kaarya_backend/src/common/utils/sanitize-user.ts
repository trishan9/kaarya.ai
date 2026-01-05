import { UserSchemaDocument } from 'src/entities/user.schema';

type UserInput =
  | UserSchemaDocument
  | Record<string, unknown>
  | null
  | undefined;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const sanitizeUser = (user: UserInput) => {
  if (!user) return user;

  const raw =
    typeof (user as { toJSON?: () => unknown }).toJSON === 'function'
      ? (user as { toJSON: () => unknown }).toJSON()
      : ((user as { _doc?: unknown })._doc ?? user);

  if (!isObject(raw)) return raw;

  const data: Record<string, unknown> = { ...raw };
  const id =
    (data.id as string | undefined) ??
    (data._id as { toString?: () => string } | undefined)?.toString?.() ??
    (user as { _id?: { toString?: () => string } })._id?.toString?.();

  if (id) {
    data.id = id;
  }

  delete data._id;
  delete data.__v;
  delete data.password;

  return data;
};
