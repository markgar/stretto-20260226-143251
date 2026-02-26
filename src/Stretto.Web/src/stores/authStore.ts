import { create } from 'zustand';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Member';
  orgId: string;
  orgName: string;
};

type AuthStore = {
  user: AuthUser | null;
  setUser: (u: AuthUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    try {
      const raw = localStorage.getItem('stretto_user');
      return raw ? JSON.parse(raw) as AuthUser : null;
    } catch {
      return null;
    }
  })(),
  setUser: (u) => {
    localStorage.setItem('stretto_user', JSON.stringify(u));
    set({ user: u });
  },
  clearUser: () => {
    localStorage.removeItem('stretto_user');
    set({ user: null });
  },
}));
