"use client";

import { useState, useEffect } from "react";
import { useSuiWallet } from "./use-sui-wallet";
import useVaultStore from "@/store/vault-store";
import { useNetworkVariable } from "@passman/utils/network-config";
import { PACKAGE_ID } from "@passman/utils";

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

      // Fetch Vault objects
      const vaultRes = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
        },
        filter: {
          StructType: `${packageId}::vault::Vault`,
        },
      });

      // Fetch Cap objects owned directly by user
      const capRes = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
        },
        filter: {
          StructType: `${packageId}::vault::Cap`,
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

      // Process caps (directly owned)
      const directCaps = capRes.data.map((capObj) => {
        const capFields = capObj.data?.content?.fields || {};
        return {
          id: capObj.data?.objectId,
          vaultId: capFields.vault_id,
        };
      });

      // Fetch Safe objects where user is owner (via events)
      const safes = await fetchUserSafes(suiClient, currentAccount.address);

      // Match vaults with their corresponding caps (direct or in safe)
      const pairs = [];
      for (const vault of vaults) {
        // First check for direct cap
        const directCap = directCaps.find((cap) => cap.vaultId === vault.id);

        if (directCap) {
          pairs.push({
            vault,
            cap: directCap,
            capSource: "direct",
            safe: null,
          });
        } else {
          // Check if cap is in a Safe
          const safe = safes.find((s) => s.vault_id === vault.id && s.has_cap);
          if (safe) {
            pairs.push({
              vault,
              cap: { id: null, vaultId: vault.id }, // Cap is in safe, no direct ID
              capSource: "safe",
              safe,
            });
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
        } else {
          // Update the active vault with new Safe info
          const updatedPair = pairs.find(
            (pair) => pair.vault.id === activeVaultCapPair.vault?.id
          );
          if (updatedPair &&
              (updatedPair.capSource !== activeVaultCapPair.capSource ||
               updatedPair.safe?.id !== activeVaultCapPair.safe?.id)) {
            setActiveVaultCapPair(updatedPair);
          }
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

/**
 * Fetch all Safe objects where user is the owner
 */
async function fetchUserSafes(client, userAddress) {
  try {
    // Query SafeCreated events
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::safe::SafeCreated`,
      },
      order: "descending",
      limit: 100,
    });

    const safes = [];

    for (const event of events.data) {
      const safeId = event.parsedJson?.safe_id;
      if (!safeId) continue;

      try {
        const safeDetails = await client.getObject({
          id: safeId,
          options: {
            showContent: true,
          },
        });

        if (safeDetails.data?.content?.fields) {
          const fields = safeDetails.data.content.fields;

          // Check if user is the owner
          if (fields.owner === userAddress) {
            safes.push(parseSafeFields(safeDetails.data.objectId, fields));
          }
        }
      } catch (e) {
        console.log(`Failed to fetch safe ${safeId}:`, e);
      }
    }

    return safes;
  } catch (err) {
    console.error("Error fetching user safes:", err);
    return [];
  }
}

/**
 * Parse Safe fields from on-chain data
 */
function parseSafeFields(objectId, fields) {
  return {
    id: objectId,
    vault_id: fields.vault_id,
    owner: fields.owner,
    has_cap: fields.cap !== null && fields.cap !== undefined && fields.cap?.fields !== undefined,
    // Social Recovery
    guardians: fields.guardians || [],
    threshold: Number(fields.threshold || 0),
    // Deadman Switch
    beneficiary: fields.beneficiary?.fields?.some || null,
    inactivity_period_ms: Number(fields.inactivity_period_ms || 0),
    last_activity_ms: Number(fields.last_activity_ms || 0),
    deadman_claimed: fields.deadman_claimed || false,
  };
}
