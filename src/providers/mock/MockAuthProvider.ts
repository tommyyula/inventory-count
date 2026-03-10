import type { IAuthProvider } from '../interfaces/IAuthProvider';
import type { User, LoginCredentials } from '@domain/value-objects';
import { mockUsers } from './data/users';

const STORAGE_KEY = 'inventory-count-current-user';

export class MockAuthProvider implements IAuthProvider {
  async login(credentials: LoginCredentials): Promise<User> {
    await this.delay();
    const user = mockUsers.find(u => u.username === credentials.username);
    if (!user) {
      throw new Error('用户名不存在');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
    return null;
  }

  async getUsers(): Promise<User[]> {
    await this.delay();
    return [...mockUsers];
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  private delay(ms = 200): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
