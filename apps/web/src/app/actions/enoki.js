"use server";

import { enokiServerClient } from "@/lib/enoki-server";
import { NETWORK } from "@passman/utils";

export async function getSponsoredTransaction(transactionBlockKindBytes, sender) {
  try {
    const sponsored = await enokiServerClient.createSponsoredTransaction({
      network: NETWORK,
      transactionBlockKindBytes,
      sender,
    });
    return { sponsored };
  } catch (error) {
    console.error("Failed to sponsor transaction:", error);
    throw new Error("Failed to sponsor transaction");
  }
}

export async function executeSponsoredTransaction(digest, signature) {
  try {
    const result = await enokiServerClient.executeSponsoredTransaction({
      digest,
      signature,
    });
    return { result };
  } catch (error) {
    console.error("Failed to execute transaction:", error);
    throw new Error("Failed to execute transaction");
  }
}
