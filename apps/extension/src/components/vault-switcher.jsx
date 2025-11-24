"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import useVaults from "@/hooks/use-fetch-vaults";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import useVaultStore from "@/store/vault-store";

export function VaultSwitcher() {
  const { isConnected } = useSuiWallet();
  const { activeVaultCapPair, setActiveVaultCapPair } = useVaultStore();
  const { vaultCapPairs, loading } = useVaults();

  React.useEffect(() => {
    if (vaultCapPairs.length === 0 || loading) return;
    if (!activeVaultCapPair) {
      setActiveVaultCapPair(vaultCapPairs[0]);
    }
  }, [vaultCapPairs, activeVaultCapPair, loading, setActiveVaultCapPair]);

  const filteredVaultCapPairs = vaultCapPairs
    .filter(({ vault }) => vault?.id !== activeVaultCapPair?.vault?.id)
    .map(({ vault, cap }) => ({
      vault,
      cap,
    }));

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="bg-gray-300 h-8 w-8 rounded-lg"></div>
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const activeVaultComponent =
    vaultCapPairs.length === 0 ? (
      <>
        <div className="bg-primary text-primary-foreground flex aspect-square size-6 items-center justify-center rounded-md">
          <Plus className="size-4" />
        </div>
        <span className="truncate font-medium ml-2">No vaults</span>
      </>
    ) : (
      <>
        <div className="bg-primary text-primary-foreground flex aspect-square size-6 items-center justify-center rounded-md">
          <span className="text-xs font-bold">
            {activeVaultCapPair?.vault?.name?.charAt(0)}
          </span>
        </div>
        <span className="truncate font-medium ml-2">
          {activeVaultCapPair?.vault?.name}
        </span>
      </>
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="w-48 justify-between px-2 hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex items-center truncate">
              {activeVaultComponent}
            </div>
            <ChevronsUpDown className="ml-2 size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        {isConnected && (
          <DropdownMenuContent className="w-48" align="start" sideOffset={4}>
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Vaults
            </DropdownMenuLabel>
            {filteredVaultCapPairs.map(({ vault, cap }, index) => (
              <DropdownMenuItem
                key={vault.name}
                onClick={() => setActiveVaultCapPair({ vault, cap })}
                className="gap-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <span className="text-xs font-bold">
                    {vault.name.charAt(0)}
                  </span>
                </div>
                {vault.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </>
  );
}
