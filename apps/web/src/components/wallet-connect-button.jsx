"use client";

import { cn } from "@passman/utils";
import { ConnectButton } from "@mysten/dapp-kit";
import { useSuiWallet } from "@/hooks/use-sui-wallet";

export function WalletConnectButton({ className, isSidebar = true }) {
  const { isConnected } = useSuiWallet();

  if (isConnected) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <ConnectButton
        className="w-full"
        connectText="Connect Wallet or Google"
      />
    </div>
  );
}
