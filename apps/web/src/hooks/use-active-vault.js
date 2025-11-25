import useVaultStore from "@/store/vault-store";

export default function useActiveVault() {
  const { activeVaultCapPair, setActiveVaultCapPair, reset } = useVaultStore();

  // Determine cap source
  const capSource = activeVaultCapPair?.capSource || "direct";
  const isCapInSafe = capSource === "safe";

  return {
    // Active vault data
    activeVault: activeVaultCapPair?.vault || null,
    activeCap: activeVaultCapPair?.cap || null,
    activeVaultCapPair,

    // Safe data
    activeSafe: activeVaultCapPair?.safe || null,
    safeId: activeVaultCapPair?.safe?.id || null,
    capSource,
    isCapInSafe,

    // Helper functions
    setActiveVaultCapPair,
    resetVault: reset,

    // Derived properties
    hasActiveVault: !!activeVaultCapPair?.vault,
    vaultName: activeVaultCapPair?.vault?.name || "",
    vaultId: activeVaultCapPair?.vault?.id || null,
    capId: activeVaultCapPair?.cap?.id || null,

    // Safe helper properties
    hasSafe: !!activeVaultCapPair?.safe,
    hasGuardians: (activeVaultCapPair?.safe?.guardians?.length || 0) > 0,
    hasDeadman: !!activeVaultCapPair?.safe?.beneficiary,

    /**
     * Get cap ID for direct transactions
     * Returns null if cap is in safe (use safe-aware transactions instead)
     */
    getCapForTransaction: () => {
      if (capSource === "direct") {
        return activeVaultCapPair?.cap?.id || null;
      }
      // For safe, need PTB with borrow_cap/return_cap
      return null;
    },

    /**
     * Check if safe-aware transactions should be used
     */
    shouldUseSafeTransaction: () => {
      return isCapInSafe;
    },
  };
}
