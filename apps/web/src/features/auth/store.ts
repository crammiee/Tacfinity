import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  rating: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isBootstrapping: boolean;
  setUser: (user: User, accessToken: string) => void;
  clearUser: () => void;
  setBootstrapping: (v: boolean) => void;
  updateRating: (delta: number) => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoggedIn: false,
  isBootstrapping: true,
  setUser: (user, accessToken) => set({ user, accessToken, isLoggedIn: true }),
  clearUser: () => set({ user: null, accessToken: null, isLoggedIn: false }),
  setBootstrapping: (v) => set({ isBootstrapping: v }),
  updateRating: (delta) =>
    set((s) => (s.user ? { user: { ...s.user, rating: s.user.rating + delta } } : s)),
}));
