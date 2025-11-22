import { create } from "zustand";

const chromeStorageAdapter = {
  getItem: async (name) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([name], (result) => {
        resolve(result[name] || null);
      });
    });
  },
  setItem: async (name, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [name]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: async (name) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([name], () => {
        resolve();
      });
    });
  },
};

export const useZkLoginStore = create((set, get) => ({
  isLoggedIn: false,
  isLoggingIn: false,
  zkLoginAddress: null,
  userSalt: null,
  isHydrated: false,

  setLoggedIn: (status) => {
    set({ isLoggedIn: status });
    get().persist();
  },

  setLoggingIn: (status) => set({ isLoggingIn: status }),

  setZkLoginAddress: (address) => {
    set({ zkLoginAddress: address });
    get().persist();
  },

  setUserSalt: (salt) => {
    set({ userSalt: salt });
    get().persist();
  },

  reset: () => {
    set({
      isLoggedIn: false,
      isLoggingIn: false,
      zkLoginAddress: null,
      // userSalt is usually persistent, but we can reset if needed
    });
    chromeStorageAdapter.removeItem("zk-login-storage");
  },

  persist: () => {
    const { isLoggedIn, zkLoginAddress, userSalt } = get();
    chromeStorageAdapter.setItem(
      "zk-login-storage",
      JSON.stringify({ isLoggedIn, zkLoginAddress, userSalt })
    );
  },

  hydrate: async () => {
    const stored = await chromeStorageAdapter.getItem("zk-login-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        set({
          isLoggedIn: parsed.isLoggedIn || false,
          zkLoginAddress: parsed.zkLoginAddress || null,
          userSalt: parsed.userSalt || null,
          isHydrated: true,
        });
      } catch (error) {
        console.error("Failed to parse stored zkLogin data", error);
        set({ isHydrated: true });
      }
    } else {
      set({ isHydrated: true });
    }
  },
}));

