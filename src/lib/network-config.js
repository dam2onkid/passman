import { PACKAGE_ID } from "@/constants/config";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
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

const DEFAULT_NETWORK = "testnet";

export {
  useNetworkVariable,
  useNetworkVariables,
  networkConfig,
  DEFAULT_NETWORK,
};
