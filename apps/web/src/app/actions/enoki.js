"use server";

import { enokiServerClient } from "@/lib/enoki-server";
import { NETWORK } from "@passman/utils";

export async function getSponsoredTransaction(
  transactionKindBytes,
  sender,
  zkLoginJwt
) {
  try {
    const sponsored = await enokiServerClient.createSponsoredTransaction({
      network: NETWORK,
      transactionKindBytes,
      sender,
      jwt: zkLoginJwt,
    });
    return { sponsored };
  } catch (error) {
    console.error("Failed to sponsor transaction:", error);
    const errorMessage =
      error.body?.message || error.message || JSON.stringify(error);
    throw new Error(`Failed to sponsor transaction: ${errorMessage}`);
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
    const errorMessage =
      error.body?.message || error.message || JSON.stringify(error);
    throw new Error(`Failed to execute transaction: ${errorMessage}`);
  }
}
