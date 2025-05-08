import useVaultStore from "@/store/vault-store";

/**
 * Custom hook to access the active vault and capability data
 * @returns {Object} The active vault data and helper functions
 */
export default function useActiveVault() {
  const { activeVaultCapPair, setActiveVaultCapPair, reset } = useVaultStore();

  return {
    // Active vault data
    activeVault: activeVaultCapPair?.vault || null,
    activeCap: activeVaultCapPair?.cap || null,
    activeVaultCapPair,

    // Helper functions
    setActiveVaultCapPair,
    resetVault: reset,

    // Derived properties
    hasActiveVault: !!activeVaultCapPair?.vault,
    vaultName: activeVaultCapPair?.vault?.name || "",
    vaultId: activeVaultCapPair?.vault?.id || null,
    capId: activeVaultCapPair?.cap?.id || null,
  };
}
