"use client";

import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { PACKAGE_ID } from "@/constants/config";

// Create a constant network configuration
const { networkConfig } = createNetworkConfig({
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      passman: PACKAGE_ID,
      gqlClient: "https://sui-testnet.mystenlabs.com/graphql",
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      passman: PACKAGE_ID,
      gqlClient: "https://sui-mainnet.mystenlabs.com/graphql",
    },
  },
});

// Default network to connect to
const DEFAULT_NETWORK = "testnet";

export function SuiProviders({ children }) {
  // Create a new QueryClient instance for each session
  // This helps with data isolation and avoiding stale data between page refreshes
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimize performance with stale time and caching
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false, // Disable refetching when window regains focus
            retry: 1, // Limit retry attempts
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
        <WalletProvider autoConnect={true}>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
