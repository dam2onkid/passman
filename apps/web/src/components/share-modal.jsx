"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, addHours } from "date-fns";
import { getItemIcon } from "@passman/utils";
import useActiveVault from "@/hooks/use-active-vault";
import { useNetworkVariable } from "@passman/utils";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { shareItemMoveCallTx } from "@passman/utils";

const TTL = {
  "1hour": 60 * 60 * 1000,
  "1day": 24 * 60 * 60 * 1000,
  "7days": 7 * 24 * 60 * 60 * 1000,
  "14days": 14 * 24 * 60 * 60 * 1000,
  "30days": 30 * 24 * 60 * 60 * 1000,
};

export function ShareModal({ isOpen, onClose, entry }) {
  const { vaultId, capId } = useActiveVault();
  const packageId = useNetworkVariable("passman");
  const {
    client: suiClient,
    isConnected: isWalletConnected,
    signAndExecuteTransaction,
  } = useSuiWallet();
  const [expiryType, setExpiryType] = useState("7days");
  const [expiryDate, setExpiryDate] = useState(addDays(new Date(), 7));
  const [walletAddresses, setWalletAddresses] = useState([]);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleExpiryTypeChange = (value) => {
    setExpiryType(value);

    // Set expiry date based on type
    switch (value) {
      case "1hour":
        setExpiryDate(addHours(new Date(), 1));
        break;
      case "1day":
        setExpiryDate(addDays(new Date(), 1));
        break;
      case "7days":
        setExpiryDate(addDays(new Date(), 7));
        break;
      case "14days":
        setExpiryDate(addDays(new Date(), 14));
        break;
      case "30days":
        setExpiryDate(addDays(new Date(), 30));
        break;
      default:
        setExpiryDate(addDays(new Date(), 1));
    }
  };

  const handleDateChange = (date) => {
    if (date) {
      setExpiryDate(date);
    }
  };

  const handleAddWalletAddress = () => {
    if (newWalletAddress.trim()) {
      // SUI wallet address validation - addresses must:
      // 1. Start with '0x'
      // 2. Be followed by 64 hexadecimal characters (32 bytes)
      const suiWalletRegex = /^0x[a-fA-F0-9]{64}$/;

      if (suiWalletRegex.test(newWalletAddress.trim())) {
        // Check if already exists
        if (walletAddresses.includes(newWalletAddress.trim())) {
          toast.error("This wallet address has already been added");
          return;
        }

        setWalletAddresses([...walletAddresses, newWalletAddress.trim()]);
        setNewWalletAddress("");
      } else {
        toast.error(
          "Please enter a valid SUI wallet address (0x followed by 64 hex characters)"
        );
      }
    }
  };

  const handleRemoveWalletAddress = (index) => {
    const updatedAddresses = [...walletAddresses];
    updatedAddresses.splice(index, 1);
    setWalletAddresses(updatedAddresses);
  };

  const handleShare = async () => {
    if (walletAddresses.length === 0) {
      toast.error("Please add at least one wallet address");
      return;
    }

    setIsSharing(true);

    try {
      const tx = shareItemMoveCallTx({
        vaultId,
        itemId: entry?.id?.id,
        ttl: TTL[expiryType],
        walletAddresses,
        createdAt: Date.now(),
      });
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await suiClient.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Item shared successfully");
            onClose();
            setIsSharing(false);
          },
          onError: (error) => {
            toast.error("Failed to share item");
            setIsSharing(false);
            onClose();
          },
        }
      );
    } catch (error) {
      toast.error("Failed to share item");
      setIsSharing(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share item</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-blue-950 flex items-center justify-center">
            <div className="text-white">{getItemIcon(entry?.category)}</div>
          </div>
          <div className="flex flex-col">
            <div className="font-medium">{entry?.name || "Expo - Cozrum"}</div>
            <div className="text-sm text-muted-foreground">namnguyencozrum</div>
          </div>
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="text-sm">Link expires after</div>
            <div className="flex gap-2">
              <Select value={expiryType} onValueChange={handleExpiryTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1hour">1 hour</SelectItem>
                  <SelectItem value="1day">1 day</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="14days">14 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Wallet Addresses</div>
            <div className="text-xs text-muted-foreground mb-2">
              Add SUI wallet addresses that can access this item
            </div>

            <div className="rounded-md border p-4 space-y-3">
              {walletAddresses.length > 0 && (
                <div className="space-y-2">
                  {walletAddresses.map((address, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                    >
                      <span className="text-sm truncate max-w-[200px] font-mono">
                        {address}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWalletAddress(index)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <form
                className="flex gap-2 items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddWalletAddress();
                }}
              >
                <Input
                  placeholder="Enter SUI wallet address (0x...)"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className="flex-1 font-mono"
                />
                <Button type="submit" variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add</span>
                </Button>
              </form>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            variant="default"
            className="w-full sm:w-auto"
            onClick={handleShare}
            disabled={isSharing || walletAddresses.length === 0}
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              "Share"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
