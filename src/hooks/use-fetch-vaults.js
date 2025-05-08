import { useState, useEffect } from "react";
import { useSuiWallet } from "./use-sui-wallet";
import { PACKAGE_ID } from "@/constants/config";

const INTERVAL = 3000;

export default function useFetchVaults() {
  const { currentAccount, client: suiClient, isConnected } = useSuiWallet();
  const [vaultCapPairs, setVaultCapPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchVaultsAndCaps() {
    if (!currentAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch Vault objects
      const vaultRes = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${PACKAGE_ID}::vault::Vault`,
        },
      });

      // Fetch Cap objects
      const capRes = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${PACKAGE_ID}::vault::Cap`,
        },
      });

      // Process vaults
      const vaults = vaultRes.data.map((vaultObj) => {
        const vaultFields = vaultObj.data?.content?.fields || {};
        return {
          id: vaultObj.data?.objectId,
          name: vaultFields.name,
        };
      });

      // Process caps
      const caps = capRes.data.map((capObj) => {
        const capFields = capObj.data?.content?.fields || {};
        return {
          id: capObj.data?.objectId,
          vaultId: capFields.vault_id,
        };
      });

      // Match vaults with their corresponding caps
      const pairs = [];
      for (const vault of vaults) {
        const matchingCap = caps.find((cap) => cap.vaultId === vault.id);
        if (matchingCap) {
          pairs.push({ vault, cap: matchingCap });
        }
      }

      setVaultCapPairs(pairs);
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

    // Set up polling interval for real-time updates
    // const intervalId = setInterval(fetchVaultsAndCaps, INTERVAL);

    // return () => clearInterval(intervalId);
  }, [currentAccount?.address, suiClient]);

  return { vaultCapPairs, loading, error, refetch: fetchVaultsAndCaps };
}
