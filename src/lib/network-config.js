import { getFullnodeUrl } from "@mysten/sui/client";
import { PACKAGE_ID } from "../constants/config";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: PACKAGE_ID,
        gqlClient: "https://sui-testnet.mystenlabs.com/graphql",
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
