"use client";

import {
  useCurrentAccount,
  useSuiClient,
  useConnectWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useCallback, useMemo } from "react";
import { walrus } from "@mysten/walrus";
import { NETWORK } from "@/constants/config";

export function useSuiWallet() {
  const baseClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  const client = useMemo(() => {
    return baseClient.$extend(
      walrus({
        network: NETWORK,
        wasmUrl:
          "https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm",
        uploadRelay: {
          host: "https://upload-relay.testnet.walrus.space",
          sendTip: {
            max: 1_000, // MIST (very little SUI - we have this for gas!)
          },
        },
      })
    );
  }, [baseClient]);

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

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
