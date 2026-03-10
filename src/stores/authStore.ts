import { create } from 'zustand';
import type { User } from '@domain/value-objects';
import { ProviderRegistry } from '@providers/ProviderRegistry';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,

  login: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const auth = ProviderRegistry.get('auth');
      const user = await auth.login({ username });
      set({ currentUser: user, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '登录失败', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const auth = ProviderRegistry.get('auth');
    await auth.logout();
    set({ currentUser: null });
  },

  loadUser: async () => {
    try {
      const auth = ProviderRegistry.get('auth');
      const user = await auth.getCurrentUser();
      set({ currentUser: user });
    } catch {
      set({ currentUser: null });
    }
  },
}));
