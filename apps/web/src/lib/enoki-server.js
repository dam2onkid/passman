import { EnokiClient } from "@mysten/enoki";

if (!process.env.ENOKI_PRIVATE_API_KEY) {
  throw new Error("ENOKI_PRIVATE_API_KEY is not set");
}

export const enokiServerClient = new EnokiClient({
  apiKey: process.env.ENOKI_PRIVATE_API_KEY,
});

