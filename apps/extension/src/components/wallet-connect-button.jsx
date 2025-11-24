"use client";

import { cn } from "@passman/utils";
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZkLogin } from "@/hooks/use-zk-login";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WalletConnectButton({ className }) {
  const { isLoggedIn, isLoggingIn, login, logout, zkLoginAddress } = useZkLogin();

  if (isLoggedIn && zkLoginAddress) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            variant="ghost"
            className={cn(
              "gap-2 px-2 hover:bg-accent hover:text-accent-foreground",
              "bg-primary text-primary-foreground",
              className
            )}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
              <Wallet className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {zkLoginAddress.slice(0, 6)}...{zkLoginAddress.slice(-4)}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={login}
      disabled={isLoggingIn}
      size="lg"
      variant="ghost"
      className={cn(
        "gap-2 px-2 hover:bg-accent hover:text-accent-foreground",
        "bg-primary text-primary-foreground",
        className
      )}
    >
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
        <Wallet className="size-4" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">
          {isLoggingIn ? "Connecting..." : "Connect Google"}
        </span>
      </div>
    </Button>
  );
}
