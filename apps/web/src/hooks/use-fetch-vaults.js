"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSuiWallet } from "./use-sui-wallet";
import useVaultStore from "@/store/vault-store";
import { useNetworkVariable } from "@passman/utils/network-config";
import { PACKAGE_ID } from "@passman/utils";
import { useSafeEventSubscription } from "./use-safe-event-subscription";

const POLL_INTERVAL = 5000;

export default function useVaults() {
  const { currentAccount, client: suiClient, isConnected } = useSuiWallet();
  const packageId = useNetworkVariable("passman");
  const [vaultCapPairs, setVaultCapPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeVaultCapPair, setActiveVaultCapPair } = useVaultStore();
  const fetchInProgressRef = useRef(false);
  const fetchVaultsRef = useRef(null);

  const handleVaultChange = useCallback(
    (eventType, data) => {
      console.log(`[VaultSync] Event: ${eventType}`, data);
      fetchVaultsRef.current?.();
    },
    []
  );

  useSafeEventSubscription(currentAccount?.address, handleVaultChange);

  const fetchVaultsAndCaps = useCallback(async () => {
    if (!currentAccount?.address || fetchInProgressRef.current) {
      if (!currentAccount?.address) setLoading(false);
      return;
    }

    fetchInProgressRef.current = true;

    try {
      setLoading(true);

      // Fetch Cap objects owned directly by user
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

      // Process caps (directly owned)
      const directCaps = capRes.data.map((capObj) => {
        const capFields = capObj.data?.content?.fields || {};
        return {
          id: capObj.data?.objectId,
          vaultId: capFields.vault_id,
        };
      });

      // Fetch Safe objects where user is owner (via events)
      // This includes Safes acquired via social recovery
      const safes = await fetchUserSafes(suiClient, currentAccount.address);

      // Collect all vault IDs we need to fetch (from caps and safes)
      const vaultIdsToFetch = new Set();

      // Add vault IDs from direct caps
      for (const cap of directCaps) {
        if (cap.vaultId) {
          vaultIdsToFetch.add(cap.vaultId);
        }
      }

      // Add vault IDs from safes
      for (const safe of safes) {
        if (safe.vault_id) {
          vaultIdsToFetch.add(safe.vault_id);
        }
      }

      // Fetch all vault details (Vaults are now shared objects)
      const vaultMap = new Map();
      for (const vaultId of vaultIdsToFetch) {
        try {
          const vaultDetails = await suiClient.getObject({
            id: vaultId,
            options: { showContent: true },
          });

          if (vaultDetails.data?.content?.fields) {
            const vaultFields = vaultDetails.data.content.fields;
            vaultMap.set(vaultId, {
              id: vaultDetails.data.objectId,
              name: vaultFields.name,
            });
          }
        } catch (e) {
          console.log(`Failed to fetch vault ${vaultId}:`, e);
        }
      }

      // Build vault-cap pairs
      const pairs = [];
      const processedVaultIds = new Set();

      // Process vaults from direct caps first
      for (const cap of directCaps) {
        const vault = vaultMap.get(cap.vaultId);
        if (vault) {
          processedVaultIds.add(vault.id);

          // Check if there's also a Safe for this vault
          const safe = safes.find((s) => s.vault_id === vault.id);

          pairs.push({
            vault,
            cap,
            capSource: "direct",
            safe: safe || null,
          });
        }
      }

      // Process vaults from safes (where user doesn't have direct cap)
      for (const safe of safes) {
        if (!processedVaultIds.has(safe.vault_id) && safe.has_cap) {
          const vault = vaultMap.get(safe.vault_id);
          if (vault) {
            processedVaultIds.add(vault.id);

            pairs.push({
              vault,
              cap: { id: null, vaultId: safe.vault_id },
              capSource: "safe",
              safe,
              isRecovered: true, // Vault accessed via Safe without direct cap = recovered
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
          if (
            updatedPair &&
            (updatedPair.capSource !== activeVaultCapPair.capSource ||
              updatedPair.safe?.id !== activeVaultCapPair.safe?.id)
          ) {
            setActiveVaultCapPair(updatedPair);
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to fetch vaults");
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [currentAccount?.address, suiClient, activeVaultCapPair, setActiveVaultCapPair]);

  useEffect(() => {
    fetchVaultsRef.current = fetchVaultsAndCaps;
  }, [fetchVaultsAndCaps]);

  useEffect(() => {
    if (!isConnected) {
      setVaultCapPairs([]);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchVaultsAndCaps();
  }, [fetchVaultsAndCaps]);

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
  // Check has_cap - Option<Cap> in Sui can be represented as:
  // - null/undefined when None
  // - An object with fields when Some
  const hasCap = fields.cap !== null && fields.cap !== undefined;

  return {
    id: objectId,
    vault_id: fields.vault_id,
    owner: fields.owner,
    has_cap: hasCap,
    // Social Recovery
    guardians: fields.guardians || [],
    threshold: Number(fields.threshold || 0),
    // Deadman Switch
    beneficiary: fields.beneficiary?.fields?.some || fields.beneficiary || null,
    inactivity_period_ms: Number(fields.inactivity_period_ms || 0),
    last_activity_ms: Number(fields.last_activity_ms || 0),
    deadman_claimed: fields.deadman_claimed || false,
  };
}
