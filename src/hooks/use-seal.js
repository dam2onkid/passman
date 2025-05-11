import { useState, useCallback } from "react";
import { SealClient, getAllowlistedKeyServers, SessionKey } from "@mysten/seal";
import { fromHex } from "@mysten/sui/utils";

import { useSuiWallet } from "./use-sui-wallet";
import { DEFAULT_NETWORK } from "@/lib/network-config";

export const useSealEncrypt = ({ verifyKeyServers = false } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { client: suiClient } = useSuiWallet();

  const encryptData = async ({ threshold = 1, packageId, id, data }) => {
    setLoading(true);
    setError(null);

    try {
      const client = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers(DEFAULT_NETWORK),
        verifyKeyServers,
      });

      console.log("encryptData", {
        threshold,
        packageId,
        id,
        data,
        url: getAllowlistedKeyServers(DEFAULT_NETWORK),
      });

      const { encryptedObject, key } = await client.encrypt({
        threshold,
        packageId,
        id,
        data,
      });

      return { encryptedObject, key };
    } catch (err) {
      setError(err.message || "Failed to encrypt data");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    encryptData,
    loading,
    error,
  };
};

export const useSealDecrypt = ({ verifyKeyServers = false } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { client: suiClient } = useSuiWallet();

  const decryptData = useCallback(
    async ({ encryptedObject, packageId, id }) => {
      setLoading(true);
      setError(null);

      try {
        const client = new SealClient({
          suiClient,
          serverObjectIds: getAllowlistedKeyServers(DEFAULT_NETWORK),
          verifyKeyServers,
        });

        const decrypted = await client.decrypt({
          encryptedObject,
          packageId: fromHex(packageId),
          id: fromHex(id),
        });

        return decrypted;
      } catch (err) {
        setError(err.message || "Failed to decrypt data");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [suiClient, verifyKeyServers]
  );

  return {
    decryptData,
    loading,
    error,
  };
};

export const useSessionKey = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentAccount, client: suiClient } = useSuiWallet();
  const packageId = useNetworkVariable("passman");

  const createSessionKey = useCallback(
    async ({ ttlMin = 10 } = {}) => {
      if (!currentAccount?.address) {
        const err = new Error("Wallet not connected");
        setError(err.message);
        throw err;
      }

      setLoading(true);
      setError(null);

      try {
        const sessionKey = new SessionKey({
          address: currentAccount.address,
          packageId: fromHex(packageId),
          ttlMin: ttlMin,
        });

        const message = sessionKey.getPersonalMessage();

        // User confirms in wallet
        const { signature } = await currentAccount.signPersonalMessage({
          message,
        });

        // Initialization complete
        sessionKey.setPersonalMessageSignature(signature);

        return sessionKey;
      } catch (err) {
        setError(err.message || "Failed to create session key");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentAccount, packageId]
  );

  return {
    createSessionKey,
    loading,
    error,
  };
};
