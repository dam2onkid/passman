import { useState, useEffect, useRef } from "react";
import { SealClient, getAllowlistedKeyServers, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
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

export const useSealDecrypt = ({ packageId, ttlMin = 10 } = {}) => {
  const { client: suiClient } = useSuiWallet();
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers(DEFAULT_NETWORK),
    verifyKeyServers: false,
  });

  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { exportedSessionKey } = useKeySessionStore();
  const account = useCurrentAccount();

  const decryptData = async ({ encryptedObject, txBytes }) => {
    if (!account.address) return null;

    try {
      // if (exportedSessionKey) {
      //   const importedKey = await SessionKey.import(
      //     JSON.parse(exportedSessionKey)
      //   );
      //   if (
      //     !importedKey.isExpired() &&
      //     importedKey.getAddress() === account.address
      //   ) {
      //     isFetchingRef.current = false;
      //     return importedKey;
      //   }
      // }

      const newSessionKey = new SessionKey({
        address: account.address,
        packageId,
        ttlMin,
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
                console.log("🚀 ~ decryptData:", {
                  newSessionKey,
                  txBytes,
                  encryptedObject,
                });
                const decrypted = await sealClient.decrypt({
                  data: encryptedObject,
                  sessionKey: newSessionKey,
                  txBytes,
                });
                console.log("🚀 ~ decryptData ~ decrypted:", decrypted);
                resolve(decrypted);
              } catch (error) {
                console.log("🚀 ~ decryptData ~ error:", error);
                reject(error);
              }
            },
            onError: (err) => {
              console.log("🚀 ~ decryptData ~ err:", err);
              reject(err);
            },
          }
        );
      });
    } catch (err) {
      throw err;
    }
  };

  return { decryptData };
};
