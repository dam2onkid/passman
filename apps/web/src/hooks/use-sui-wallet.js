"use client";

import {
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
  useConnectWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useCallback, useMemo } from "react";
import { walrus } from "@mysten/walrus";
import { NETWORK } from "@passman/utils";
import { useZkLogin } from "./use-zk-login";
import { toB64, fromB64 } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import {
  getSponsoredTransaction,
  executeSponsoredTransaction,
} from "@/app/actions/enoki";

export function useSuiWallet() {
  const baseClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const { isZkLoggedIn, zkLoginAddress, zkLoginJwt } = useZkLogin();

  const client = useMemo(() => {
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
  }, [baseClient]);

  const { mutateAsync: signAndExecuteWalletTransaction } =
    useSignAndExecuteTransaction();

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
    disconnect();
  }, [disconnect]);

  const handleSignAndExecuteTransaction = useCallback(
    async (input, options) => {
      if (isZkLoggedIn) {
        try {
          const transaction = input.transaction;

          transaction.setSender(walletAddress);
          const transactionBlockKindBytes = await transaction.build({
            client: baseClient,
            onlyTransactionKind: true,
          });

          const { sponsored } = await getSponsoredTransaction(
            toB64(transactionBlockKindBytes),
            walletAddress,
            zkLoginJwt
          );

          if (!currentWallet) {
            throw new Error("Wallet not connected");
          }

          const transactionBytes = fromB64(sponsored.bytes);
          const sponsoredTransaction = Transaction.from(transactionBytes);

          const signatureResult = await currentWallet.features[
            "sui:signTransaction"
          ].signTransaction({
            transaction: sponsoredTransaction,
            account: currentAccount,
            chain: `sui:${NETWORK}`,
          });

          const { result } = await executeSponsoredTransaction(
            sponsored.digest,
            signatureResult.signature
          );

          if (options?.onSuccess) {
            options.onSuccess(result);
          }

          return result;
        } catch (error) {
          console.error("Sponsored transaction failed:", error);
          if (options?.onError) {
            options.onError(error);
          }
          throw error;
        }
      } else {
        return signAndExecuteWalletTransaction(input, options);
      }
    },
    [
      isZkLoggedIn,
      zkLoginJwt,
      walletAddress,
      baseClient,
      currentAccount,
      currentWallet,
      signAndExecuteWalletTransaction,
    ]
  );

  return {
    client,
    currentAccount,
    signAndExecuteTransaction: handleSignAndExecuteTransaction,
    isConnected,
    walletAddress,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isZkLoggedIn,
  };
}
