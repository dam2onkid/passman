"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@passman/utils";
import useVaultStore from "@/store/vault-store";

const SAFE_EVENTS = {
  RECOVERY_EXECUTED: `${PACKAGE_ID}::safe::RecoveryExecuted`,
  DEADMAN_CLAIMED: `${PACKAGE_ID}::safe::DeadmanClaimed`,
  SAFE_DISABLED: `${PACKAGE_ID}::safe::SafeDisabled`,
  SAFE_CREATED: `${PACKAGE_ID}::safe::SafeCreated`,
};

export function useSafeEventSubscription(userAddress, onVaultChange) {
  const client = useSuiClient();
  const { activeVaultCapPair, setActiveVaultCapPair, reset } = useVaultStore();
  const unsubscribeRefs = useRef([]);
  const lastEventCursors = useRef({});

  const handleRecoveryExecuted = useCallback(
    (event) => {
      const { safe_id, old_owner, new_owner } = event.parsedJson || {};

      if (old_owner === userAddress && new_owner !== userAddress) {
        if (activeVaultCapPair?.safe?.id === safe_id) {
          setActiveVaultCapPair(null);
        }
        onVaultChange?.("recovery_lost", { safe_id, new_owner });
      } else if (new_owner === userAddress) {
        onVaultChange?.("recovery_gained", { safe_id, old_owner });
      }
    },
    [userAddress, activeVaultCapPair, setActiveVaultCapPair, onVaultChange]
  );

  const handleDeadmanClaimed = useCallback(
    (event) => {
      const { safe_id, vault_id, beneficiary } = event.parsedJson || {};

      if (beneficiary === userAddress) {
        onVaultChange?.("deadman_gained", { safe_id, vault_id });
      } else if (activeVaultCapPair?.vault?.id === vault_id) {
        setActiveVaultCapPair(null);
        onVaultChange?.("deadman_lost", { safe_id, vault_id, beneficiary });
      }
    },
    [userAddress, activeVaultCapPair, setActiveVaultCapPair, onVaultChange]
  );

  const handleSafeDisabled = useCallback(
    (event) => {
      const { safe_id, vault_id } = event.parsedJson || {};

      if (activeVaultCapPair?.safe?.id === safe_id) {
        onVaultChange?.("safe_disabled", { safe_id, vault_id });
      }
    },
    [activeVaultCapPair, onVaultChange]
  );

  const pollEvents = useCallback(async () => {
    if (!userAddress) return;

    try {
      const eventTypes = [
        { type: SAFE_EVENTS.RECOVERY_EXECUTED, handler: handleRecoveryExecuted },
        { type: SAFE_EVENTS.DEADMAN_CLAIMED, handler: handleDeadmanClaimed },
        { type: SAFE_EVENTS.SAFE_DISABLED, handler: handleSafeDisabled },
      ];

      for (const { type, handler } of eventTypes) {
        const cursor = lastEventCursors.current[type];

        const result = await client.queryEvents({
          query: { MoveEventType: type },
          order: "descending",
          limit: 10,
          cursor,
        });

        if (result.data.length > 0) {
          if (result.nextCursor) {
            lastEventCursors.current[type] = result.nextCursor;
          }

          if (cursor) {
            for (const event of result.data) {
              handler(event);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error polling safe events:", err);
    }
  }, [client, userAddress, handleRecoveryExecuted, handleDeadmanClaimed, handleSafeDisabled]);

  useEffect(() => {
    if (!userAddress) return;

    pollEvents();

    const intervalId = setInterval(pollEvents, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [userAddress, pollEvents]);

  const checkOwnershipValidity = useCallback(
    async (vaultId, safeId) => {
      if (!vaultId || !userAddress) return { isValid: false };

      try {
        if (safeId) {
          const safeDetails = await client.getObject({
            id: safeId,
            options: { showContent: true },
          });

          if (safeDetails.data?.content?.fields) {
            const fields = safeDetails.data.content.fields;
            const isOwner = fields.owner === userAddress;
            const hasCap = fields.cap !== null && fields.cap !== undefined;

            return {
              isValid: isOwner && hasCap,
              owner: fields.owner,
              hasCap,
              deadmanClaimed: fields.deadman_claimed,
            };
          }
        }

        const capRes = await client.getOwnedObjects({
          owner: userAddress,
          options: { showContent: true },
          filter: { StructType: `${PACKAGE_ID}::vault::Cap` },
        });

        const hasCap = capRes.data.some((capObj) => {
          const capFields = capObj.data?.content?.fields || {};
          return capFields.vault_id === vaultId;
        });

        return { isValid: hasCap, hasCap };
      } catch (err) {
        console.error("Error checking ownership validity:", err);
        return { isValid: false, error: err };
      }
    },
    [client, userAddress]
  );

  return {
    checkOwnershipValidity,
    SAFE_EVENTS,
  };
}

export default useSafeEventSubscription;

