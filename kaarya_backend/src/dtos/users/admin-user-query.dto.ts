import z from 'zod';

export const AdminUsersQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
  search: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().min(1).optional()),
});

export type TAdminUsersQueryDTO = z.infer<typeof AdminUsersQueryDTO>;
