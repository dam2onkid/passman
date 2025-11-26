import { create } from "zustand";
import { persist } from "zustand/middleware";

const useVaultStore = create(
  persist(
    (set, get) => ({
      activeVaultCapPair: null,
      setActiveVaultCapPair: (vaultCapPair) =>
        set({ activeVaultCapPair: vaultCapPair }),

      clearVaultIfOwnershipLost: (vaultId, newOwner) => {
        const current = get().activeVaultCapPair;
        if (current?.vault?.id === vaultId) {
          console.log(`[VaultStore] Ownership lost for vault ${vaultId}, clearing active vault`);
          set({ activeVaultCapPair: null });
          return true;
        }
        return false;
      },

      clearVaultBySafeId: (safeId) => {
        const current = get().activeVaultCapPair;
        if (current?.safe?.id === safeId) {
          console.log(`[VaultStore] Safe ${safeId} changed, clearing active vault`);
          set({ activeVaultCapPair: null });
          return true;
        }
        return false;
      },

      reset: () => set({ activeVaultCapPair: null }),
    }),
    {
      name: "vault-storage",
      partialize: (state) => ({
        activeVaultCapPair: state.activeVaultCapPair,
      }),
    }
  )
);

export default useVaultStore;
