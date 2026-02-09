export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export type AuthProvider = "email" | "google" | "github";

export type TLinkedAccount = {
  provider: AuthProvider;
  email?: string | null;
  emailVerified?: boolean;
  linkedAt?: string | null;
  lastLoginAt?: string | null;
};

export type TUser = {
  id: string;
  name: string;
  email?: string | null;
  role: Role;
  provider?: AuthProvider | null;
  linkedAccounts?: TLinkedAccount[];
  linkedProviders?: AuthProvider[];
  photo?: string | null;
  socialId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
