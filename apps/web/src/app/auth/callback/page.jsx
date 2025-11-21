"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useZkLogin } from "@/hooks/use-zk-login";
import { Loader2 } from "lucide-react";
import { enokiFlow } from "@/lib/enoki";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeLogin } = useZkLogin();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        // Let Enoki handle the hash parsing and session setup
        await enokiFlow.handleAuthCallback();

        // Force the hook to update its state
        await completeLogin();

        router.push("/dashboard");
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Failed to complete login");
        router.push("/");
      }
    };

    handleCallback();
  }, [completeLogin, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Completing secure login...</p>
      </div>
    </div>
  );
}

