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

const vaults = [
  {
    name: "Personal",
    logo: Vault,
  },
  {
    name: "Work",
    logo: Vault,
  },
];

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
          <DialogTitle>Add New Vault</DialogTitle>
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
              Create Vault
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VaultSwitcher() {
  const { isMobile } = useSidebar();
  const [activeVault, setActiveVault] = React.useState(vaults[0]);
  const [isAddVaultModalOpen, setIsAddVaultModalOpen] = React.useState(false);
  const [localVaults, setLocalVaults] = React.useState(vaults);

  const handleCreateVault = (newVault) => {
    setLocalVaults((prev) => [...prev, newVault]);
    setIsAddVaultModalOpen(false);
  };

  if (!activeVault) {
    return null;
  }

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
                    {activeVault.name.charAt(0)}
                  </p>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeVault.name}
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
              {localVaults.map((vault, index) => (
                <DropdownMenuItem
                  key={vault.name}
                  onClick={() => setActiveVault(vault)}
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
