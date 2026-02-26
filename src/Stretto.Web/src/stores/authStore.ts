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
  user: null,
  setUser: (u) => set({ user: u }),
  clearUser: () => set({ user: null }),
}));
