import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isBootstrapping: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setBootstrapping: (v: boolean) => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isBootstrapping: true,
  setUser: (user) => set({ user, isLoggedIn: true }),
  clearUser: () => set({ user: null, isLoggedIn: false }),
  setBootstrapping: (v) => set({ isBootstrapping: v }),
}));
