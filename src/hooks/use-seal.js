import { useState, useEffect } from "react";
import { SealClient, getAllowlistedKeyServers, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex, toHex } from "@mysten/sui/utils";
import { useSignPersonalMessage } from "@mysten/dapp-kit";

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

export const useSealDecrypt = ({ verifyKeyServers = false } = {}) => {
  const [loading, setLoading] = useState(false);
  const { client: suiClient } = useSuiWallet();

  const decryptData = async ({ encryptedObject, sessionKey, txBytes }) => {
    setLoading(true);

    console.log("decryptData-sessionKey", {
      sessionKey,
      keyServers: getAllowlistedKeyServers("testnet"),
    });
    if (!sessionKey || sessionKey?.isExpired()) {
      return { error: "Session key expired" };
    }
    try {
      const client = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers("testnet"),
        verifyKeyServers: false,
      });

      const decrypted = await client.decrypt({
        data: encryptedObject,
        sessionKey,
        txBytes,
      });

      return { data: decrypted };
    } catch (err) {
      return { error: err.message || "Failed to decrypt data" };
    } finally {
      setLoading(false);
    }
  };

  return {
    decryptData,
    loading,
  };
};

export const useSessionKey = ({
  packageId,
  ttlMin = 10,
  walletAddress,
} = {}) => {
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { sessionKey, setSessionKey } = useKeySessionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessionKey = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    if (
      sessionKey &&
      !sessionKey?.isExpired() &&
      sessionKey?.getAddress() === walletAddress
    ) {
      setLoading(false);
      return;
    }

    setSessionKey(null);
    try {
      console.log("fetchSessionKey", walletAddress);
      const _sessionKey = new SessionKey({
        address: walletAddress,
        packageId,
        ttlMin,
      });

      // User confirms in wallet
      signPersonalMessage(
        { message: _sessionKey.getPersonalMessage() },
        {
          onSuccess: async ({ signature }) => {
            await _sessionKey.setPersonalMessageSignature(signature);
            setSessionKey(_sessionKey);
          },
        }
      );
    } catch (err) {
      setError(err.message || "Failed to create session key");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSessionKey();
  }, []);

  return {
    refetch: fetchSessionKey,
    sessionKey,
    loading,
    error,
  };
};
