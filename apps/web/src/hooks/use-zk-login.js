"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { isEnokiWallet } from "@mysten/enoki";
import { useState, useEffect } from "react";

export function useZkLogin() {
  const currentAccount = useCurrentAccount();
  const isEnokiAccount = currentAccount?.wallet
    ? isEnokiWallet(currentAccount.wallet)
    : false;
  const [zkLoginJwt, setZkLoginJwt] = useState(null);

  useEffect(() => {
    if (isEnokiAccount && currentAccount?.wallet) {
      const getJwt = async () => {
        try {
          const features = currentAccount.wallet.features;
          if (features && features["enoki:getJwt"]) {
            const jwt = await features["enoki:getJwt"].getJwt();
            setZkLoginJwt(jwt);
          }
        } catch (error) {
          console.error("Failed to get zkLogin JWT:", error);
        }
      };
      getJwt();
    } else {
      setZkLoginJwt(null);
    }
  }, [isEnokiAccount, currentAccount]);

  return {
    isZkLoggedIn: isEnokiAccount,
    zkLoginAddress: isEnokiAccount ? currentAccount?.address : null,
    zkLoginJwt,
  };
}
