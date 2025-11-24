"use client";

import { ChevronsUpDown, LogOut, Wallet } from "lucide-react";

import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useResolveSuiNSName } from "@mysten/dapp-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { WalletConnectButton } from "@/components/wallet-connect-button";
import useKeySessionStore from "@/store/key-session-store";
import useActiveVault from "@/hooks/use-active-vault";
import useVaultStore from "@/store/vault-store";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const { isConnected, walletAddress, disconnect } = useSuiWallet();
  const { reset: resetSessionKey } = useKeySessionStore();
  const { resetVault } = useActiveVault();
  const { data: walletNSName } = useResolveSuiNSName(walletAddress);

  const handleDisconnect = () => {
    disconnect();
    resetSessionKey();
    resetVault();
    useVaultStore.persist.clearStorage();
  };

  if (!isConnected) return <WalletConnectButton />;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Wallet className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {walletNSName || walletAddress}
                </span>
                <span className="truncate text-xs">
                  {walletNSName || walletAddress}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {walletNSName || walletAddress}
                  </span>
                  <span className="truncate font-normal text-xs">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/*<DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={handleDisconnect}>
              <LogOut />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
