"use client";

import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import { EnokiFlow } from "@mysten/enoki";
import { useState, useEffect } from "react";

// Initialize EnokiFlow to access the shared session storage
const enokiFlow = new EnokiFlow({
  apiKey: process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY,
});

export function useZkLogin() {
  const currentAccount = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const [zkLoginJwt, setZkLoginJwt] = useState(null);
  const [isEnoki, setIsEnoki] = useState(false);

  useEffect(() => {
    const checkEnokiStatus = async () => {
      // 1. Try to get JWT from wallet features (Standard way)
      if (currentWallet?.features?.["enoki:getJwt"]) {
        setIsEnoki(true);
        try {
          const jwt = await currentWallet.features["enoki:getJwt"].getJwt();
          console.log("jwt", jwt);
          setZkLoginJwt(jwt);
          return;
        } catch (error) {
          console.error("Failed to get JWT from wallet features:", error);
        }
      }

      // 2. Fallback: Check localStorage for Enoki connection info
      // This handles cases where dapp-kit hasn't fully hydrated the wallet object yet
      try {
        const storage = localStorage.getItem(
          "sui-dapp-kit:wallet-connection-info"
        );
        console.log("storage", storage);
        if (storage) {
          const info = JSON.parse(storage);
          console.log("info", info);
          const lastConnectedWalletName =
            info?.state?.lastConnectedWalletName || "";

          const isGoogleLogin = lastConnectedWalletName
            .toLowerCase()
            .includes("google");
          if (isGoogleLogin) {
            setIsEnoki(true);
            // Try to get session directly from Enoki flow (shares localStorage)
            const session = await enokiFlow.getSession();
            if (session?.jwt) {
              setZkLoginJwt(session.jwt);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check Enoki fallback:", error);
      }
    };

    checkEnokiStatus();
  }, [currentWallet, currentAccount]);

  return {
    isZkLoggedIn: isEnoki,
    zkLoginAddress: isEnoki ? currentAccount?.address : null,
    zkLoginJwt,
  };
}
