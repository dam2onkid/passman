"use client";

import { Button } from "@/components/ui/button";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { Loader2 } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function ZkLoginButton({ isSidebar = false }) {
  const { loginZk, isZkLoggingIn } = useSuiWallet();

  if (isSidebar) {
    return (
      <SidebarMenuButton
        onClick={loginZk}
        disabled={isZkLoggingIn}
        className="bg-sidebar-primary text-sidebar-primary-foreground cursor-pointer"
      >
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
            {isZkLoggingIn ? (
                 <Loader2 className="size-4 animate-spin" />
            ) : (
                 // Google "G" logo or similar
                 <span className="font-bold">G</span>
            )}
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">
            {isZkLoggingIn ? "Signing in..." : "Sign in with Google"}
          </span>
        </div>
      </SidebarMenuButton>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={loginZk}
      disabled={isZkLoggingIn}
      className="w-full gap-2"
    >
      {isZkLoggingIn ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
      )}
      {isZkLoggingIn ? "Signing in..." : "Google Login"}
    </Button>
  );
}

