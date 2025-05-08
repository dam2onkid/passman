"use client";

import {
  useCurrentAccount,
  useSuiClient,
  useConnectWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useCallback } from "react";
import "@mysten/dapp-kit/dist/index.css";

export function useSuiWallet() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  const isConnected = Boolean(currentAccount);
  const walletAddress = currentAccount?.address;

  const handleConnect = useCallback(() => {
    if (!isConnected) {
      connect();
    }
  }, [connect, isConnected]);

  const handleDisconnect = useCallback(() => {
    if (isConnected) {
      disconnect();
    }
  }, [disconnect, isConnected]);

  return {
    client,
    currentAccount,
    signAndExecuteTransaction,
    isConnected,
    walletAddress,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
}
