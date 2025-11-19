"use client";

import { cn } from "@passman/utils";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { Wallet, ChevronsUpDown } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function WalletConnectButton({ className, isSidebar = true }) {
  const currentAccount = useCurrentAccount();
  const button = isSidebar ? (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-sidebar-primary text-sidebar-primary-foreground cursor-pointer"
    >
      <div className=" flex aspect-square size-8 items-center justify-center rounded-lg">
        <Wallet className="size-4" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">
          {currentAccount ? "Connected" : "Connect Wallet"}
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
      disabled={!!currentAccount}
    >
      <span className="hidden sm:inline-block">
        {currentAccount ? "Connected" : "Connect Wallet"}
      </span>
    </button>
  );

  return <ConnectModal trigger={button} />;
}
