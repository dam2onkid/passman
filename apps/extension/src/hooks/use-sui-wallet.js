"use client";

import { useSuiClient } from "@mysten/dapp-kit";
import { useMemo } from "react";
import { walrus } from "@mysten/walrus";
import { NETWORK } from "@passman/utils";
import { useZkLogin } from "@/hooks/use-zk-login";

export function useSuiWallet() {
  const baseClient = useSuiClient();
  const { isLoggedIn, zkLoginAddress, login, logout } = useZkLogin();

  const client = useMemo(() => {
    try {
      return baseClient.$extend(
        walrus({
          network: NETWORK,
          wasmUrl:
            "https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm",
          uploadRelay: {
            host: "https://upload-relay.testnet.walrus.space",
            sendTip: {
              max: 1_000,
            },
          },
        })
      );
    } catch (e) {
      console.error("Failed to initialize Walrus client extension:", e);
      return baseClient;
    }
  }, [baseClient]);

  // Mock signAndExecuteTransaction for read-only extension
  const signAndExecuteTransaction = () => {
    throw new Error("Transaction execution is not supported in the extension");
  };

  const isConnected = isLoggedIn;
  const walletAddress = zkLoginAddress;

  const currentAccount = isConnected ? { address: zkLoginAddress } : null;

  return {
    client,
    currentAccount,
    signAndExecuteTransaction,
    isConnected,
    walletAddress,
    connect: login,
    disconnect: logout,
  };
}
