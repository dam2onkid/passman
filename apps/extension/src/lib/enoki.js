import { EnokiFlow, createLocalStorage } from "@mysten/enoki";

/**
 * Enoki Client Configuration
 *
 * Note: This should be the PUBLIC key.
 */
const ENOKI_API_KEY = import.meta.env.VITE_ENOKI_PUBLIC_KEY;

if (!ENOKI_API_KEY) {
  console.warn("VITE_ENOKI_PUBLIC_KEY is not set!");
}

export const enokiFlow = new EnokiFlow({
  apiKey: ENOKI_API_KEY || "enoki_public_placeholder",
  store: createLocalStorage(),
});
