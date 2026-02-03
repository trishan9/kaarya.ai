export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export type TUser = {
  id: string;
  name: string;
  email?: string | null;
  role: Role;
  provider?: string | null;
  photo?: string | null;
  socialId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
