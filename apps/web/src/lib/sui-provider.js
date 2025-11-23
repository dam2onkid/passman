"use client";

import { SuiClientProvider, WalletProvider, useSuiClientContext } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { networkConfig, DEFAULT_NETWORK } from "@passman/utils/network-config";
import { registerEnokiWallets, isEnokiNetwork } from "@mysten/enoki";
import "@mysten/dapp-kit/dist/index.css";

function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey: process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY,
      providers: {
        google: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        },
      },
      client,
      network,
    });

    return unregister;
  }, [client, network]);

  return null;
}

export function SuiProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            cacheTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={DEFAULT_NETWORK}
      >
        <RegisterEnokiWallets />
        <WalletProvider autoConnect={true}>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
