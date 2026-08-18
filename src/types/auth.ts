export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};
