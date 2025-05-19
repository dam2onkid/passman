import { useState } from "react";
import { SealClient, getAllowlistedKeyServers, SessionKey } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { useSignPersonalMessage, useCurrentAccount } from "@mysten/dapp-kit";

import { useSuiWallet } from "./use-sui-wallet";
import { DEFAULT_NETWORK } from "@/lib/network-config";
import useKeySessionStore from "@/store/key-session-store";

export const getSealId = (vaultId, nonce) => {
  nonce = nonce || crypto.getRandomValues(new Uint8Array(5));
  const policyObjectBytes = fromHex(vaultId);
  const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
  return { id, nonce };
};

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

      const { encryptedObject, key } = await client.encrypt({
        threshold,
        packageId,
        id,
        data,
      });

      return { encryptedObject, key };
    } catch (err) {
      setError(err.message || "Failed to encrypt data");
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

const MAX_RETRIES = 2;
export const useSealDecrypt = ({ packageId, ttlMin = 10 } = {}) => {
  const { client: suiClient } = useSuiWallet();
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers(DEFAULT_NETWORK),
    verifyKeyServers: false,
  });

  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { exportedSessionKey, setExportedSessionKey } = useKeySessionStore();
  const account = useCurrentAccount();

  const isValidSessionKey = (sessionKey) => {
    if (!sessionKey) return false;
    const expire = sessionKey.creationTimeMs + sessionKey.ttlMin * 60 * 1000;
    if (expire < Date.now()) return false;
    return sessionKey.getAddress() === account.address;
  };

  const decryptData = async ({ encryptedObject, txBytes, retry = false }) => {
    if (!account.address) return null;
    try {
      if (isValidSessionKey(exportedSessionKey)) {
        const sessionKey = await SessionKey.import(exportedSessionKey, {});
        const decrypted = await sealClient.decrypt({
          data: encryptedObject,
          sessionKey,
          txBytes,
        });
        return decrypted;
      }

      // New session key
      setExportedSessionKey(null);
      const newSessionKey = new SessionKey({
        address: account.address,
        packageId,
        ttlMin,
      });

      console.log("new-sessionKey", {
        isExpired: newSessionKey.isExpired(),
        getAddress: newSessionKey.getAddress(),
      });

      return new Promise((resolve, reject) => {
        signPersonalMessage(
          { message: newSessionKey.getPersonalMessage() },
          {
            onSuccess: async (result) => {
              try {
                await newSessionKey.setPersonalMessageSignature(
                  result.signature
                );
                setExportedSessionKey(newSessionKey.export());
                const decrypted = await sealClient.decrypt({
                  data: encryptedObject,
                  sessionKey: newSessionKey,
                  txBytes,
                });

                resolve(decrypted);
              } catch (error) {
                reject(error);
              }
            },
            onError: (err) => {
              reject(err);
            },
          }
        );
      });
    } catch (err) {
      if (retry) {
        throw err;
      }
      return decryptData({ encryptedObject, txBytes, retry: true });
    }
  };

  return { decryptData };
};
