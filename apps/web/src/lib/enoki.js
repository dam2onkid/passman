import { EnokiFlow } from "@mysten/enoki";

/**
 * Enoki Client Configuration
 *
 * Note: This should be the PUBLIC key.
 */
const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY;

if (!ENOKI_API_KEY) {
  console.warn("NEXT_PUBLIC_ENOKI_PUBLIC_KEY is not set!");
}

export const enokiFlow = new EnokiFlow({
  apiKey: ENOKI_API_KEY || "enoki_public_placeholder",
});
