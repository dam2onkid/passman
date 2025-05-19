import { create } from "zustand";
import { persist } from "zustand/middleware";

const useKeySessionStore = create(
  persist(
    (set) => ({
      exportedSessionKey: null,
      setExportedSessionKey: (exportedSessionKey) => {
        set({ exportedSessionKey: { ...exportedSessionKey } });
      },
      reset: () => set({ exportedSessionKey: null }),
    }),
    {
      name: "key-session-storage",
      partialize: (state) => ({ exportedSessionKey: state.exportedSessionKey }),
    }
  )
);

export default useKeySessionStore;
