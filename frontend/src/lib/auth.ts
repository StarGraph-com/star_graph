export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthResult = {
  user: AuthUser | null;
  message?: string;
};
