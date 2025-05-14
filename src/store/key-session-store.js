import { create } from "zustand";
import { persist } from "zustand/middleware";

const useKeySessionStore = create(
  persist(
    (set) => ({
      sessionKey: null,
      setSessionKey: (sessionKey) => set({ sessionKey }),

      // Reset the store
      reset: () => set({ sessionKey: null }),
    }),
    {
      name: "key-session-storage",
      partialize: (state) => ({
        // Only persist the vault data, not the functions
        sessionKey: state.sessionKey,
      }),
    }
  )
);

export default useKeySessionStore;
