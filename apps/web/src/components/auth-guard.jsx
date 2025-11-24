"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }) {
  const { isConnected } = useSuiWallet();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give a small delay for wallet adapter to initialize state
    const timer = setTimeout(() => {
      if (!isConnected) {
        // Redirect to login if not connected
        // We might want to save the intended destination to redirect back after login
        // For now, just simple redirect
        router.push("/login");
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isConnected, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

