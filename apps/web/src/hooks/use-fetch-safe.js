"use client";

import { useState, useEffect, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@passman/utils";

/**
 * Hook to fetch Safe object associated with a vault
 * @param {string} vaultId - The vault ID to find associated Safe
 * @returns {Object} - { safe, isLoading, error, refetch }
 */
export function useFetchSafe(vaultId) {
  const client = useSuiClient();
  const [safe, setSafe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSafe = useCallback(async () => {
    if (!vaultId) {
      setSafe(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check localStorage for cached safe ID
      const storedId = localStorage.getItem(`safe_${vaultId}`);

      if (storedId) {
        try {
          const safeDetails = await client.getObject({
            id: storedId,
            options: {
              showContent: true,
            },
          });

          if (safeDetails.data?.content?.fields) {
            const fields = safeDetails.data.content.fields;
            if (fields.vault_id === vaultId) {
              setSafe(parseSafeFields(safeDetails.data.objectId, fields));
              return;
            }
          }
        } catch (e) {
          console.log("Stored Safe ID not found, will search via events");
          localStorage.removeItem(`safe_${vaultId}`);
        }
      }

      // Query SafeCreated events to find Safe for this vault
      const events = await client.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::safe::SafeCreated`,
        },
        order: "descending",
      });

      const matchingEvent = events.data.find(
        (event) => event.parsedJson?.vault_id === vaultId
      );

      if (!matchingEvent) {
        setSafe(null);
        return;
      }

      // Get the Safe object ID from the event
      const safeId = matchingEvent.parsedJson?.safe_id;

      if (!safeId) {
        setSafe(null);
        return;
      }

      const safeDetails = await client.getObject({
        id: safeId,
        options: {
          showContent: true,
        },
      });

      if (safeDetails.data?.content?.fields) {
        const fields = safeDetails.data.content.fields;
        const safeData = parseSafeFields(safeDetails.data.objectId, fields);

        localStorage.setItem(`safe_${vaultId}`, safeData.id);
        setSafe(safeData);
      } else {
        setSafe(null);
      }
    } catch (err) {
      console.error("Error fetching safe:", err);
      setError(err);
      setSafe(null);
    } finally {
      setIsLoading(false);
    }
  }, [client, vaultId]);

  useEffect(() => {
    setSafe(null);
    setIsLoading(true);
    fetchSafe();
  }, [vaultId]);

  return {
    safe,
    isLoading,
    error,
    refetch: fetchSafe,
  };
}

/**
 * Parse Safe fields from on-chain data
 */
function parseSafeFields(objectId, fields) {
  return {
    id: objectId,
    vault_id: fields.vault_id,
    owner: fields.owner,
    has_cap: fields.cap !== null && fields.cap !== undefined,
    // Social Recovery
    guardians: fields.guardians || [],
    threshold: Number(fields.threshold || 0),
    recovery_votes: parseRecoveryVotes(fields.recovery_votes),
    // Deadman Switch
    beneficiary: fields.beneficiary?.fields?.some || fields.beneficiary || null,
    inactivity_period_ms: Number(fields.inactivity_period_ms || 0),
    last_activity_ms: Number(fields.last_activity_ms || 0),
    deadman_claimed: fields.deadman_claimed || false,
  };
}

/**
 * Parse recovery votes from VecMap structure
 */
function parseRecoveryVotes(recoveryVotes) {
  if (!recoveryVotes || !recoveryVotes.fields || !recoveryVotes.fields.contents) {
    return {};
  }

  const votes = {};
  for (const entry of recoveryVotes.fields.contents) {
    const key = entry.fields?.key;
    const value = entry.fields?.value || [];
    if (key) {
      votes[key] = value;
    }
  }
  return votes;
}

/**
 * Hook to fetch all Safes where user is a guardian
 * @param {string} userAddress - User's wallet address
 * @returns {Object} - { guardianSafes, isLoading, error, refetch }
 */
export function useFetchGuardianSafes(userAddress) {
  const client = useSuiClient();
  const [guardianSafes, setGuardianSafes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGuardianSafes = useCallback(async () => {
    if (!userAddress) {
      setGuardianSafes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Query all SafeCreated events
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
            const guardians = fields.guardians || [];

            // Check if user is a guardian
            if (guardians.includes(userAddress)) {
              safes.push(parseSafeFields(safeDetails.data.objectId, fields));
            }
          }
        } catch (e) {
          console.log(`Failed to fetch safe ${safeId}:`, e);
        }
      }

      setGuardianSafes(safes);
    } catch (err) {
      console.error("Error fetching guardian safes:", err);
      setError(err);
      setGuardianSafes([]);
    } finally {
      setIsLoading(false);
    }
  }, [client, userAddress]);

  useEffect(() => {
    fetchGuardianSafes();
  }, [userAddress]);

  return {
    guardianSafes,
    isLoading,
    error,
    refetch: fetchGuardianSafes,
  };
}

/**
 * Hook to fetch all Safes where user is a beneficiary
 * @param {string} userAddress - User's wallet address
 * @returns {Object} - { beneficiarySafes, isLoading, error, refetch }
 */
export function useFetchBeneficiarySafes(userAddress) {
  const client = useSuiClient();
  const [beneficiarySafes, setBeneficiarySafes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBeneficiarySafes = useCallback(async () => {
    if (!userAddress) {
      setBeneficiarySafes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Query all SafeCreated events
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
            const beneficiary = fields.beneficiary?.fields?.some || fields.beneficiary;

            // Check if user is the beneficiary
            if (beneficiary === userAddress) {
              safes.push(parseSafeFields(safeDetails.data.objectId, fields));
            }
          }
        } catch (e) {
          console.log(`Failed to fetch safe ${safeId}:`, e);
        }
      }

      setBeneficiarySafes(safes);
    } catch (err) {
      console.error("Error fetching beneficiary safes:", err);
      setError(err);
      setBeneficiarySafes([]);
    } finally {
      setIsLoading(false);
    }
  }, [client, userAddress]);

  useEffect(() => {
    fetchBeneficiarySafes();
  }, [userAddress]);

  return {
    beneficiarySafes,
    isLoading,
    error,
    refetch: fetchBeneficiarySafes,
  };
}

