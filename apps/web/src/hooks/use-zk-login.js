"use client";

import { useCallback, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { fromB64, toB64 } from "@mysten/sui/utils";
import { toast } from "sonner";
import { NETWORK } from "@passman/utils";
import { enokiFlow } from "@/lib/enoki";
import { useZkLoginStore } from "@/store/zk-login-store";
import {
  getSponsoredTransaction,
  executeSponsoredTransaction,
} from "@/app/actions/enoki";

export function useZkLogin() {
  const client = useSuiClient();
  // We'll stick to the store for global state to ensure other components update
  const {
    isLoggedIn,
    isLoggingIn,
    zkLoginAddress,
    setLoggedIn,
    setLoggingIn,
    setZkLoginAddress,
    reset,
  } = useZkLoginStore();

  // Initialize session from Enoki on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await enokiFlow.getSession();
        if (session && session.jwt) {
          // We need the address. If it's not in the session object directly, we derive or fetch it.
          // The EnokiFlow session object usually contains ephemeralKeyPair, etc.
          // We can get the address via the JWT or EnokiClient if needed,
          // but let's see if we can get the keypair which implies a logged in user.

          // For now, we'll assume if we have a session, we are logged in.
          // However, we need the address.
          const keypair = await enokiFlow.getKeypair({ network: NETWORK });
          const address = keypair.toSuiAddress();

          setZkLoginAddress(address);
          setLoggedIn(true);
        }
      } catch (e) {
        console.error("Failed to restore Enoki session", e);
      }
    };
    checkSession();
  }, [setZkLoginAddress, setLoggedIn]);

  const login = useCallback(async () => {
    try {
      setLoggingIn(true);
      const protocol = window.location.protocol;
      const host = window.location.host;
      const redirectUrl = `${protocol}//${host}/auth/callback`;

      const authUrl = await enokiFlow.createAuthorizationURL({
        provider: "google",
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUrl: redirectUrl,
        network: NETWORK,
      });

      window.location.href = authUrl;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Failed to initiate login");
      setLoggingIn(false);
    }
  }, [setLoggingIn]);

  const completeLogin = useCallback(async () => {
    try {
      setLoggingIn(true);
      // handleAuthCallback should have been called in the callback page
      // Here we just ensure we have the session
      const session = await enokiFlow.getSession();
      if (!session) {
        throw new Error("No session found after callback");
      }

      const keypair = await enokiFlow.getKeypair({ network: NETWORK });
      const address = keypair.toSuiAddress();

      setZkLoginAddress(address);
      setLoggedIn(true);

      toast.success("Successfully logged in with Google!");
      return address;
    } catch (error) {
      console.error("Complete login failed:", error);
      toast.error(
        "Failed to complete login: " + (error.message || "Unknown error")
      );
      throw error;
    } finally {
      setLoggingIn(false);
    }
  }, [setLoggingIn, setZkLoginAddress, setLoggedIn]);

  const executeZkLoginTransaction = useCallback(
    async ({ transactionBlock }) => {
      try {
        const session = await enokiFlow.getSession();
        if (!session) {
          throw new Error("No active zkLogin session");
        }

        const keypair = await enokiFlow.getKeypair({ network: NETWORK });
        const address = keypair.toSuiAddress();

        // 1. Build the transaction bytes
        transactionBlock.setSender(address);
        const transactionBlockKindBytes = await transactionBlock.build({
          client,
          onlyTransactionKind: true,
        });

        // 2. Sponsor the transaction via Server Action
        const { sponsored } = await getSponsoredTransaction(
          toB64(transactionBlockKindBytes),
          address
        );

        // 3. Sign the sponsored transaction
        const { signature } = await keypair.signTransaction(
          await fromB64(sponsored.bytes)
        );

        // 4. Execute the transaction via Server Action
        const { result } = await executeSponsoredTransaction(
          sponsored.digest,
          signature
        );

        return result;
      } catch (error) {
        console.error("Transaction failed:", error);
        throw error;
      }
    },
    [client]
  );

  const logout = useCallback(async () => {
    try {
      await enokiFlow.logout();
      reset();
    } catch (e) {
      console.error("Logout failed", e);
    }
  }, [reset]);

  return {
    login,
    completeLogin,
    logout,
    executeZkLoginTransaction,
    zkLoginAddress,
    isLoggedIn,
    isLoggingIn,
  };
}
