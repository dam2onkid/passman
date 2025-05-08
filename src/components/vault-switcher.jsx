"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Vault } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useVaults from "@/hooks/use-fetch-vaults";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/constants/config";

export function VaultSwitcher() {
  const { isMobile } = useSidebar();
  const { signAndExecuteTransaction } = useSuiWallet();
  const [isAddVaultModalOpen, setIsAddVaultModalOpen] = React.useState(false);
  const [activeVaultCapPair, setActiveVaultCapPair] = React.useState(null);
  const { vaultCapPairs, loading, refetch } = useVaults();

  const handleCreateVault = (newVault) => {
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::vault::create_vault_entry`,
      arguments: [tx.pure.string(newVault.name)],
    });
    tx.setGasBudget(10000000);
    signAndExecuteTransaction(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          setIsAddVaultModalOpen(false);
          refetch();
        },
      }
    );
  };

  React.useEffect(() => {
    if (vaultCapPairs.length === 0 || loading) return;
    if (!activeVaultCapPair) {
      setActiveVaultCapPair(vaultCapPairs[0]);
    }
  }, [vaultCapPairs, activeVaultCapPair, loading]);

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

  if (vaultCapPairs.length === 0)
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <p className="text-sm font-bold text-white">
                <Plus className="size-4" />
              </p>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Add vault</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <p className="text-sm font-bold text-white">
                    {activeVaultCapPair?.vault?.name?.charAt(0)}
                  </p>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeVaultCapPair?.vault?.name}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Vaults
              </DropdownMenuLabel>
              {filteredVaultCapPairs.map(({ vault, cap }, index) => (
                <DropdownMenuItem
                  key={vault.name}
                  onClick={() => setActiveVaultCapPair({ vault, cap })}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <p className="text-xs font-bold text-white">
                      {vault.name.charAt(0)}
                    </p>
                  </div>
                  {vault.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setIsAddVaultModalOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add vault
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AddVaultModal
        isOpen={isAddVaultModalOpen}
        onClose={() => setIsAddVaultModalOpen(false)}
        onCreateVault={handleCreateVault}
      />
    </>
  );
}

function AddVaultModal({ isOpen, onClose, onCreateVault }) {
  const [vaultName, setVaultName] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (vaultName.trim()) {
      onCreateVault({
        name: vaultName.trim(),
        logo: Vault,
      });
      setVaultName("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Vault</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="vaultName"
                placeholder="Enter vault name"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!vaultName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
