import { UserRole } from './user-role.enum';

export type TAuthenticatedUser = {
  id: string;
  role: UserRole;
  email?: string;
};
