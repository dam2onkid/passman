import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { NETWORK } from "@passman/utils";
import { enokiFlow } from "@/lib/enoki";
import { useZkLoginStore } from "@/store/zk-login-store";

export function useZkLogin() {
  // We'll stick to the store for global state to ensure other components update
  const {
    isLoggedIn,
    isLoggingIn,
    zkLoginAddress,
    setLoggedIn,
    setLoggingIn,
    setZkLoginAddress,
    reset,
    hydrate,
    isHydrated,
  } = useZkLoginStore();

  // Initialize session from Enoki on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    const checkSession = async () => {
      try {
        // Check for pending auth url from service worker
        const { pending_auth_url } =
          await chrome.storage.local.get("pending_auth_url");
        if (pending_auth_url) {
          console.log(
            "[zkLogin] Processing pending auth URL:",
            pending_auth_url
          );
          setLoggingIn(true);
          toast.info("Processing login...");

          try {
            const urlObj = new URL(pending_auth_url);
            const hash = urlObj.hash;
            await enokiFlow.handleAuthCallback(hash);
            console.log("[zkLogin] handleAuthCallback successful");
            await chrome.storage.local.remove("pending_auth_url");

            const session = await enokiFlow.getSession();
            console.log(
              "[zkLogin] Session after callback:",
              session ? "exists" : "null"
            );

            if (session && session.jwt) {
              const keypair = await enokiFlow.getKeypair({ network: NETWORK });
              const address = keypair.toSuiAddress();
              console.log("[zkLogin] Address:", address);

              setZkLoginAddress(address);
              setLoggedIn(true);
              toast.success("Successfully logged in with Google!");
            } else {
              throw new Error("No session or JWT after callback");
            }
          } catch (callbackError) {
            console.error(
              "[zkLogin] Callback processing error:",
              callbackError
            );
            await chrome.storage.local.remove("pending_auth_url");
            throw callbackError;
          }

          setLoggingIn(false);
          return;
        }

        const session = await enokiFlow.getSession();
        if (session && session.jwt) {
          const keypair = await enokiFlow.getKeypair({ network: NETWORK });
          const address = keypair.toSuiAddress();

          setZkLoginAddress(address);
          setLoggedIn(true);
        }
      } catch (e) {
        console.error("[zkLogin] Failed to restore Enoki session:", e);
        console.error("[zkLogin] Error details:", {
          message: e.message,
          stack: e.stack,
          name: e.name,
        });
        setLoggingIn(false);
        toast.error(
          `Failed to complete login: ${e.message || "Unknown error"}`
        );
      }
    };
    checkSession();
  }, [setZkLoginAddress, setLoggedIn, setLoggingIn, isHydrated]);

  const login = useCallback(async () => {
    try {
      setLoggingIn(true);

      // Use the extension's ID to construct the redirect URL
      const extensionId = chrome.runtime.id;
      const redirectUrl = `https://${extensionId}.chromiumapp.org/auth/callback`;

      console.log("[zkLogin] Extension ID:", extensionId);
      console.log("[zkLogin] Redirect URL:", redirectUrl);
      console.log(
        "[zkLogin] Google Client ID:",
        import.meta.env.VITE_GOOGLE_CLIENT_ID
      );
      console.log(
        "[zkLogin] Enoki API Key:",
        import.meta.env.VITE_ENOKI_PUBLIC_KEY
      );
      console.log("[zkLogin] Network:", NETWORK);

      const authUrl = await enokiFlow.createAuthorizationURL({
        provider: "google",
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirectUrl: redirectUrl,
        network: NETWORK,
      });

      console.log("[zkLogin] Auth URL created:", authUrl);

      // Open the OAuth flow in a new tab
      // The service worker will detect the callback and handle it
      chrome.tabs.create({ url: authUrl });
    } catch (error) {
      console.error("[zkLogin] Login failed:", error);
      toast.error("Failed to initiate login");
      setLoggingIn(false);
    }
  }, [setLoggingIn]);

  const completeLogin = useCallback(async () => {
    try {
      setLoggingIn(true);

      const session = await enokiFlow.getSession();
      if (!session) {
        throw new Error("No session found after callback");
      }

      const keypair = await enokiFlow.getKeypair({ network: NETWORK });
      const address = keypair.toSuiAddress();

      setZkLoginAddress(address);
      setLoggedIn(true);

      toast.success("Successfully logged in with Google!");
      return address;
    } catch (error) {
      console.error("Complete login failed:", error);
      toast.error(
        "Failed to complete login: " + (error.message || "Unknown error")
      );
      throw error;
    } finally {
      setLoggingIn(false);
    }
  }, [setLoggingIn, setZkLoginAddress, setLoggedIn]);

  const logout = useCallback(async () => {
    try {
      await enokiFlow.logout();
      reset();
    } catch (e) {
      console.error("Logout failed", e);
    }
  }, [reset]);

  return {
    login,
    completeLogin,
    logout,
    zkLoginAddress,
    isLoggedIn,
    isLoggingIn,
  };
}
