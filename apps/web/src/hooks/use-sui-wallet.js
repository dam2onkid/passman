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
import { NETWORK } from "@passman/utils";
import { useZkLogin } from "./use-zk-login";

export function useSuiWallet() {
  const baseClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  // zkLogin hooks
  const {
    zkLoginAddress,
    isLoggedIn: isZkLoggedIn,
    executeZkLoginTransaction,
    login: loginZk,
    logout: logoutZk,
    isLoggingIn: isZkLoggingIn,
  } = useZkLogin();

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

  const { mutate: signAndExecuteWalletTransaction } =
    useSignAndExecuteTransaction();

  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  const isConnected = Boolean(currentAccount) || isZkLoggedIn;
  const walletAddress = currentAccount?.address || zkLoginAddress;

  // Normalize currentAccount to include zkLogin user if active
  const activeAccount =
    currentAccount ||
    (isZkLoggedIn ? { address: zkLoginAddress, label: "zkLogin" } : null);

  const handleConnect = useCallback(() => {
    if (!isConnected) {
      connect();
    }
  }, [connect, isConnected]);

  const handleDisconnect = useCallback(() => {
    if (currentAccount) {
      disconnect();
    }
    if (isZkLoggedIn) {
      logoutZk();
    }
  }, [disconnect, currentAccount, isZkLoggedIn, logoutZk]);

  const handleSignAndExecuteTransaction = useCallback(
    async (input, options) => {
      if (isZkLoggedIn) {
        // For zkLogin, input is expected to contain { transactionBlock }
        // Adapt if input is different or has transaction property
        const tx = input.transaction || input.transactionBlock;
        if (!tx) {
          throw new Error("Transaction block is required");
        }

        return executeZkLoginTransaction({ transactionBlock: tx })
          .then((result) => {
            if (options?.onSuccess) options.onSuccess(result);
            return result;
          })
          .catch((error) => {
            console.error("Error executing zkLogin transaction:", error);
            if (options?.onError) options.onError(error);
            throw error;
          });
      } else {
        // Wallet adapter
        return signAndExecuteWalletTransaction(input, options);
      }
    },
    [isZkLoggedIn, executeZkLoginTransaction, signAndExecuteWalletTransaction]
  );

  return {
    client,
    currentAccount: activeAccount,
    signAndExecuteTransaction: handleSignAndExecuteTransaction,
    isConnected,
    walletAddress,
    connect: handleConnect,
    disconnect: handleDisconnect,
    // Expose zkLogin specific methods/state if needed
    isZkLoggedIn,
    isZkLoggingIn,
    loginZk,
  };
}
