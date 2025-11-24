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
          setLoggingIn(true);
          toast.info("Processing login...");

          try {
            const urlObj = new URL(pending_auth_url);
            const hash = urlObj.hash;
            await enokiFlow.handleAuthCallback(hash);
            await chrome.storage.local.remove("pending_auth_url");

            const session = await enokiFlow.getSession();

            if (session && session.jwt) {
              const keypair = await enokiFlow.getKeypair({ network: NETWORK });
              const address = keypair.toSuiAddress();

              setZkLoginAddress(address);
              setLoggedIn(true);
              toast.success("Successfully logged in with Google!");
            } else {
              throw new Error("No session or JWT after callback");
            }
          } catch (callbackError) {
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
      // Google OAuth for Chrome extensions requires base URL format: https://<extension-id>.chromiumapp.org/
      const extensionId = chrome.runtime.id;
      const redirectUrl = `https://${extensionId}.chromiumapp.org/`;

      const authUrl = await enokiFlow.createAuthorizationURL({
        provider: "google",
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirectUrl: redirectUrl,
        network: NETWORK,
      });

      // Use chrome.identity.launchWebAuthFlow for proper OAuth handling in extensions
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        async (callbackUrl) => {
          if (chrome.runtime.lastError) {
            toast.error(`Login failed: ${chrome.runtime.lastError.message}`);
            setLoggingIn(false);
            return;
          }

          if (callbackUrl) {
            try {
              const urlObj = new URL(callbackUrl);
              const hash = urlObj.hash;
              await enokiFlow.handleAuthCallback(hash);

              const session = await enokiFlow.getSession();
              if (session && session.jwt) {
                const keypair = await enokiFlow.getKeypair({
                  network: NETWORK,
                });
                const address = keypair.toSuiAddress();

                setZkLoginAddress(address);
                setLoggedIn(true);
                toast.success("Successfully logged in with Google!");
              } else {
                throw new Error("No session or JWT after callback");
              }
            } catch (callbackError) {
              toast.error(
                `Failed to complete login: ${callbackError.message || "Unknown error"}`
              );
            } finally {
              setLoggingIn(false);
            }
          }
        }
      );
    } catch (error) {
      toast.error("Failed to initiate login");
      setLoggingIn(false);
    }
  }, [setLoggingIn, setZkLoginAddress, setLoggedIn]);

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
