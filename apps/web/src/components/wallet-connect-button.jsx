"use client";

import { cn } from "@passman/utils";
import { ConnectModal } from "@mysten/dapp-kit";
import { Wallet } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { ZkLoginButton } from "@/components/zk-login-button";

export function WalletConnectButton({ className, isSidebar = true, layout = "vertical" }) {
  const { isConnected, currentAccount } = useSuiWallet();

  // If connected, we usually don't render this component in NavUser, but if used elsewhere:
  if (isConnected) {
    if (isSidebar) {
        return (
            <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-sidebar-primary text-sidebar-primary-foreground cursor-pointer"
            >
            <div className=" flex aspect-square size-8 items-center justify-center rounded-lg">
                <Wallet className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                Connected
                </span>
            </div>
            </SidebarMenuButton>
        )
    }
    return (
        <button
            className={cn(
            "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
            "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            className
            )}
            disabled
        >
            <span className="hidden sm:inline-block">
            Connected
            </span>
        </button>
    )
  }

  const walletButton = isSidebar ? (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-sidebar-primary text-sidebar-primary-foreground cursor-pointer"
    >
      <div className=" flex aspect-square size-8 items-center justify-center rounded-lg">
        <Wallet className="size-4" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">
          Connect Wallet
        </span>
      </div>
    </SidebarMenuButton>
  ) : (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      <span className="hidden sm:inline-block">
        Connect Wallet
      </span>
    </button>
  );

  // Use vertical layout if sidebar OR if explicitly requested
  const isVertical = isSidebar || layout === "vertical";

  return (
    <div className={cn("flex gap-2 w-full", isVertical ? "flex-col" : "flex-row")}>
        <ConnectModal trigger={walletButton} />
        <div className="relative flex items-center py-1">
            <div className="grow border-t border-border"></div>
            <span className="mx-2 text-xs text-muted-foreground">OR</span>
            <div className="grow border-t border-border"></div>
        </div>
        <ZkLoginButton isSidebar={isSidebar} />
    </div>
  );
}
