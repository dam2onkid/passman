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

const useVaultStore = create((set, get) => ({
  activeVaultCapPair: null,
  isHydrated: false,

  setActiveVaultCapPair: (vaultCapPair) => {
    set({ activeVaultCapPair: vaultCapPair });
    chromeStorageAdapter.setItem(
      "vault-storage",
      JSON.stringify({ activeVaultCapPair: vaultCapPair })
    );
  },

  reset: () => {
    set({ activeVaultCapPair: null });
    chromeStorageAdapter.removeItem("vault-storage");
  },

  hydrate: async () => {
    const stored = await chromeStorageAdapter.getItem("vault-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        set({ activeVaultCapPair: parsed.activeVaultCapPair, isHydrated: true });
      } catch (error) {
        console.error("Failed to parse stored vault data", error);
        set({ isHydrated: true });
      }
    } else {
      set({ isHydrated: true });
    }
  },
}));

export default useVaultStore;

