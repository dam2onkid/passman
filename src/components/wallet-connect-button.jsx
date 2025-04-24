"use client";

import { cn } from "@/lib/utils";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { Wallet } from "lucide-react";

export function WalletConnectButton({ className }) {
  const currentAccount = useCurrentAccount();

  return (
    <ConnectModal
      trigger={
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
            {currentAccount ? "Connected" : "Connect"}
          </span>
        </button>
      }
    />
  );
}
