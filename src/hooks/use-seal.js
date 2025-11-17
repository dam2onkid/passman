import { useState, useMemo } from "react";
import { SealClient, SessionKey, EncryptedObject } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { useSignPersonalMessage, useCurrentAccount } from "@mysten/dapp-kit";

import { useSuiWallet } from "./use-sui-wallet";
import { DEFAULT_NETWORK } from "@/lib/network-config";
import useKeySessionStore from "@/store/key-session-store";
const KEY_SERVERS = {
  testnet: [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
    "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
  ],
  mainnet: [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
  ],
};

const getAllowlistedKeyServers = (network) => {
  return KEY_SERVERS[network] || KEY_SERVERS.testnet;
};

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

  const sealClient = useMemo(() => {
    if (!suiClient) return null;
    return new SealClient({
      suiClient,
      serverConfigs: getAllowlistedKeyServers(DEFAULT_NETWORK).map((id) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: false,
    });
  }, [suiClient, verifyKeyServers]);

  const encryptData = async ({ packageId, id, data }) => {
    if (!sealClient) {
      setError("SuiClient not initialized");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { encryptedObject, key } = await sealClient.encrypt({
        threshold: 2,
        packageId,
        id,
        data,
      });

      console.log(
        "[ENCRYPT] encryptedObject type:",
        encryptedObject.constructor.name
      );
      console.log("[ENCRYPT] encryptedObject length:", encryptedObject.length);
      console.log(
        "[ENCRYPT] First 50 bytes:",
        Array.from(encryptedObject.slice(0, 50))
      );

      if (!(encryptedObject instanceof Uint8Array)) {
        throw new Error(
          `Expected Uint8Array, got ${encryptedObject.constructor.name}`
        );
      }

      return { encryptedObject, key };
    } catch (err) {
      console.error("Encryption error:", err);
      setError(err.message || "Failed to encrypt data");
      return null;
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

  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { exportedSessionKey, setExportedSessionKey } = useKeySessionStore();
  const account = useCurrentAccount();

  const sealClient = useMemo(() => {
    if (!suiClient) return null;
    return new SealClient({
      suiClient,
      serverConfigs: getAllowlistedKeyServers(DEFAULT_NETWORK).map((id) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: false,
    });
  }, [suiClient]);

  const isValidSessionKey = (sessionKey) => {
    if (!sessionKey) return false;
    const expire = sessionKey.creationTimeMs + sessionKey.ttlMin * 60 * 1000;
    if (expire < Date.now()) return false;
    return sessionKey.address === account?.address;
  };

  const decryptData = async ({ encryptedObject, txBytes }) => {
    if (!account?.address || !sealClient) {
      throw new Error("Missing account or sealClient");
    }

    if (!encryptedObject || !(encryptedObject instanceof Uint8Array)) {
      throw new Error("Invalid encryptedObject: must be Uint8Array");
    }

    if (!txBytes) {
      throw new Error("txBytes is required for decryption");
    }

    if (encryptedObject.length === 0) {
      throw new Error("encryptedObject is empty");
    }

    let parsedEncryptedObject;
    try {
      console.log(
        "[DECRYPT] Before parsing - encryptedObject type:",
        encryptedObject?.constructor.name
      );
      console.log(
        "[DECRYPT] Before parsing - encryptedObject length:",
        encryptedObject?.length
      );
      console.log(
        "[DECRYPT] Before parsing - First 50 bytes:",
        Array.from(encryptedObject.slice(0, 50))
      );

      parsedEncryptedObject = EncryptedObject.parse(encryptedObject);
      console.log("[DECRYPT] Parsed encrypted object:", {
        threshold: parsedEncryptedObject.threshold,
        services: parsedEncryptedObject.services,
        id: parsedEncryptedObject.id,
      });

      const serverObjectIds = parsedEncryptedObject.services.map(
        ([serviceId]) => serviceId
      );
      console.log("[DECRYPT] Required key servers:", serverObjectIds);
      console.log(
        "[DECRYPT] Available key servers:",
        getAllowlistedKeyServers(DEFAULT_NETWORK)
      );
    } catch (parseError) {
      console.error("[DECRYPT] Failed to parse encrypted object:", parseError);
      throw new Error(`Invalid encrypted object format: ${parseError.message}`);
    }

    try {
      if (isValidSessionKey(exportedSessionKey)) {
        const sessionKey = await SessionKey.import(
          exportedSessionKey,
          suiClient
        );
        const decrypted = await sealClient.decrypt({
          data: encryptedObject,
          sessionKey,
          txBytes,
        });
        return decrypted;
      }

      setExportedSessionKey(null);
      const newSessionKey = await SessionKey.create({
        address: account.address,
        packageId,
        ttlMin,
        suiClient,
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
                console.error("Decryption error in success handler:", error);
                reject(error);
              }
            },
            onError: (err) => {
              console.error("Personal message signing error:", err);
              reject(err);
            },
          }
        );
      });
    } catch (err) {
      console.error("Decryption error:", err);
      throw err;
    }
  };

  return { decryptData };
};
