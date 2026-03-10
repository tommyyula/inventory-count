import type { User, LoginCredentials } from '@domain/value-objects';

export interface IAuthProvider {
  login(credentials: LoginCredentials): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  getUsers(): Promise<User[]>;
  logout(): Promise<void>;
}
