import { create } from "zustand";
import { persist } from "zustand/middleware";

const useVaultStore = create(
  persist(
    (set) => ({
      activeVaultCapPair: null,
      setActiveVaultCapPair: (vaultCapPair) =>
        set({ activeVaultCapPair: vaultCapPair }),

      // Reset the store
      reset: () => set({ activeVaultCapPair: null }),
    }),
    {
      name: "vault-storage",
      partialize: (state) => ({
        // Only persist the vault data, not the functions
        activeVaultCapPair: state.activeVaultCapPair,
      }),
    }
  )
);

export default useVaultStore;
