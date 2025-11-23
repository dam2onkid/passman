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
import { toB64, fromB64 } from "@mysten/sui/utils";
import {
  getSponsoredTransaction,
  executeSponsoredTransaction,
} from "@/app/actions/enoki";

export function useSuiWallet() {
  const baseClient = useSuiClient();
  const currentAccount = useCurrentAccount();
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
      if (isZkLoggedIn && zkLoginJwt) {
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

          const signatureResult = await currentAccount.wallet.features[
            "sui:signTransaction"
          ].signTransaction({
            transaction: sponsored.bytes,
            account: currentAccount,
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
