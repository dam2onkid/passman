import { useState, useEffect } from "react";
import { useSuiWallet } from "./use-sui-wallet";
import useVaultStore from "@/store/vault-store";
import { useNetworkVariable } from "@passman/utils/network-config";

const INTERVAL = 3000;

export default function useVaults() {
  const { currentAccount, client: suiClient, isConnected } = useSuiWallet();
  const packageId = useNetworkVariable("passman");
  const [vaultCapPairs, setVaultCapPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeVaultCapPair, setActiveVaultCapPair } = useVaultStore();

  async function fetchVaultsAndCaps() {
    if (!currentAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch Cap objects owned by user
      // Caps are still owned objects, each Cap references a vault_id
      const capRes = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
        },
        filter: {
          StructType: `${packageId}::vault::Cap`,
        },
      });

      // Process caps
      const caps = capRes.data.map((capObj) => {
        const capFields = capObj.data?.content?.fields || {};
        return {
          id: capObj.data?.objectId,
          vaultId: capFields.vault_id,
        };
      });

      // Fetch vault details for each cap (Vaults are now shared objects)
      const pairs = [];
      for (const cap of caps) {
        if (cap.vaultId) {
          try {
            const vaultDetails = await suiClient.getObject({
              id: cap.vaultId,
              options: { showContent: true },
            });

            if (vaultDetails.data?.content?.fields) {
              const vaultFields = vaultDetails.data.content.fields;
              const vault = {
                id: vaultDetails.data.objectId,
                name: vaultFields.name,
              };
              pairs.push({ vault, cap });
            }
          } catch (e) {
            console.log(`Failed to fetch vault ${cap.vaultId}:`, e);
          }
        }
      }

      setVaultCapPairs(pairs);

      // Update the active vault if needed
      if (pairs.length > 0) {
        // If there's no active vault or the active vault no longer exists
        const activeVaultExists =
          activeVaultCapPair &&
          pairs.some((pair) => pair.vault.id === activeVaultCapPair.vault?.id);

        if (!activeVaultExists) {
          setActiveVaultCapPair(pairs[0]);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to fetch vaults");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isConnected) {
      setVaultCapPairs([]);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchVaultsAndCaps();
  }, [currentAccount?.address, suiClient]);

  return {
    vaultCapPairs,
    loading,
    error,
    refetch: fetchVaultsAndCaps,
  };
}
