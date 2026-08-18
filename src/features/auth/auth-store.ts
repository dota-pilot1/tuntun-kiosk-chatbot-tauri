import { create } from "zustand";
import { tokenStorage } from "../../shared/api/client";
import * as authApi from "./api";
import type { StaffUser } from "./api";

type AuthState = {
  user: StaffUser | null;
  /** 앱 시작 시 저장된 토큰으로 세션을 복구하는 동안 true. */
  restoring: boolean;
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  restoring: true,

  async restore() {
    if (!tokenStorage.access()) {
      set({ user: null, restoring: false });
      return;
    }
    try {
      set({ user: await authApi.me(), restoring: false });
    } catch {
      tokenStorage.clear();
      set({ user: null, restoring: false });
    }
  },

  async signIn(email, password) {
    set({ user: await authApi.login(email, password) });
  },

  async signOut() {
    await authApi.logout();
    set({ user: null });
  },
}));
