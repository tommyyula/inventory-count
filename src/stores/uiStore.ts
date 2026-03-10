import { create } from 'zustand';

interface UIState {
  isOnline: boolean;
  isMobile: boolean;
  pendingSyncCount: number;
  setOnline: (isOnline: boolean) => void;
  setMobile: (isMobile: boolean) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOnline: navigator.onLine,
  isMobile: window.location.pathname.startsWith('/m/') || window.location.pathname.startsWith('/inventory-count/m/'),
  pendingSyncCount: 0,
  setOnline: (isOnline) => set({ isOnline }),
  setMobile: (isMobile) => set({ isMobile }),
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
}));
