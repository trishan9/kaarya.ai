export enum Role {
  ADMIN,
  USER,
}

export type TUser = {
  id: string;
  name: string;
  role: Role;
};
