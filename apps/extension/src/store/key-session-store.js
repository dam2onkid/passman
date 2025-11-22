import { create } from "zustand";

const useKeySessionStore = create((set) => ({
  sessionKeys: new Map(),
  setSessionKey: (vaultId, key) =>
    set((state) => {
      const newKeys = new Map(state.sessionKeys);
      newKeys.set(vaultId, key);
      return { sessionKeys: newKeys };
    }),
  getSessionKey: (vaultId) => {
    const { sessionKeys } = useKeySessionStore.getState();
    return sessionKeys.get(vaultId);
  },
  clearSessionKey: (vaultId) =>
    set((state) => {
      const newKeys = new Map(state.sessionKeys);
      newKeys.delete(vaultId);
      return { sessionKeys: newKeys };
    }),
  clearAllSessionKeys: () => set({ sessionKeys: new Map() }),
}));

export default useKeySessionStore;

