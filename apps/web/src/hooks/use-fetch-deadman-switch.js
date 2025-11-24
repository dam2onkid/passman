"use client";

import { useState, useEffect, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@passman/utils";

export function useFetchDeadmanSwitch(vaultId) {
  const client = useSuiClient();
  const [deadmanSwitch, setDeadmanSwitch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeadmanSwitch = useCallback(async () => {
    if (!vaultId) {
      setDeadmanSwitch(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const storedId = localStorage.getItem(`deadman_switch_${vaultId}`);

      if (storedId) {
        try {
          const switchDetails = await client.getObject({
            id: storedId,
            options: {
              showContent: true,
            },
          });

          if (switchDetails.data?.content?.fields) {
            const fields = switchDetails.data.content.fields;
            if (fields.vault_id === vaultId) {
              setDeadmanSwitch({
                id: switchDetails.data.objectId,
                vault_id: fields.vault_id,
                beneficiary: fields.beneficiary,
                inactivity_period_ms: Number(fields.inactivity_period_ms),
                last_activity_ms: Number(fields.last_activity_ms),
                claimed: fields.claimed,
              });
              return;
            }
          }
        } catch (e) {
          console.log("Stored ID not found, will search via events");
          localStorage.removeItem(`deadman_switch_${vaultId}`);
        }
      }

      const events = await client.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::deadman::SwitchCreated`,
        },
        order: "descending",
      });

      const matchingEvent = events.data.find(
        (event) => event.parsedJson?.vault_id === vaultId
      );

      if (!matchingEvent) {
        setDeadmanSwitch(null);
        return;
      }

      const txResponse = await client.getTransactionBlock({
        digest: matchingEvent.id.txDigest,
        options: {
          showObjectChanges: true,
        },
      });

      const createdObject = txResponse.objectChanges?.find(
        (change) =>
          change.type === "created" &&
          change.objectType?.includes("DeadManSwitch")
      );

      if (!createdObject) {
        setDeadmanSwitch(null);
        return;
      }

      const switchDetails = await client.getObject({
        id: createdObject.objectId,
        options: {
          showContent: true,
        },
      });

      if (switchDetails.data?.content?.fields) {
        const fields = switchDetails.data.content.fields;
        const switchData = {
          id: switchDetails.data.objectId,
          vault_id: fields.vault_id,
          beneficiary: fields.beneficiary,
          inactivity_period_ms: Number(fields.inactivity_period_ms),
          last_activity_ms: Number(fields.last_activity_ms),
          claimed: fields.claimed,
        };

        localStorage.setItem(`deadman_switch_${vaultId}`, switchData.id);
        setDeadmanSwitch(switchData);
      } else {
        setDeadmanSwitch(null);
      }
    } catch (err) {
      console.error("Error fetching deadman switch:", err);
      setError(err);
      setDeadmanSwitch(null);
    } finally {
      setIsLoading(false);
    }
  }, [client, vaultId]);

  useEffect(() => {
    setDeadmanSwitch(null);
    setIsLoading(true);
    fetchDeadmanSwitch();
  }, [vaultId]);

  return {
    deadmanSwitch,
    isLoading,
    error,
    refetch: fetchDeadmanSwitch,
  };
}
