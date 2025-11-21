import { create } from 'zustand';

export const useZkLoginStore = create((set) => ({
  isLoggedIn: false,
  isLoggingIn: false,
  zkLoginAddress: null,
  userSalt: null,
  setLoggedIn: (status) => set({ isLoggedIn: status }),
  setLoggingIn: (status) => set({ isLoggingIn: status }),
  setZkLoginAddress: (address) => set({ zkLoginAddress: address }),
  setUserSalt: (salt) => set({ userSalt: salt }),
  reset: () => set({
    isLoggedIn: false,
    isLoggingIn: false,
    zkLoginAddress: null,
    // userSalt is usually persistent, but we can reset if needed
  }),
}));

