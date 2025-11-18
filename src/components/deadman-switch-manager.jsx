"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import useActiveVault from "@/hooks/use-active-vault";
import { toast } from "sonner";
import { Heart, Shield, ShieldOff, UserPlus, Wallet } from "lucide-react";
import {
  setupDeadmanSwitchTx,
  updateDeadmanSwitchTx,
  heartbeatDeadmanSwitchTx,
  claimDeadmanSwitchTx,
  disableDeadmanSwitchTx,
} from "@/lib/construct-move-call";
import { useFetchDeadmanSwitch } from "@/hooks/use-fetch-deadman-switch";

const PERIOD_OPTIONS = [
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
  { label: "2 years", days: 730 },
  { label: "3 years", days: 1095 },
];

export function DeadmanSwitchManager() {
  const { signAndExecuteTransaction, walletAddress, isConnected, connect } =
    useSuiWallet();
  const { activeVault, activeCap, vaultId, capId } = useActiveVault();
  const { deadmanSwitch, isLoading, refetch } = useFetchDeadmanSwitch(vaultId);

  const [beneficiary, setBeneficiary] = useState("");
  const [selectedPeriodDays, setSelectedPeriodDays] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (deadmanSwitch) {
      setBeneficiary(deadmanSwitch.beneficiary);
      const days = Math.floor(deadmanSwitch.inactivity_period_ms / 86400000);
      setSelectedPeriodDays(days);
    } else {
      setBeneficiary("");
      setSelectedPeriodDays(30);
    }
  }, [deadmanSwitch]);

  useEffect(() => {
    setBeneficiary("");
    setSelectedPeriodDays(30);
  }, [vaultId]);

  const handleSetupOrUpdate = async () => {
    if (!beneficiary || !selectedPeriodDays) {
      toast.error("Please enter beneficiary address and select time period");
      return;
    }

    if (!vaultId || !capId) {
      toast.error("Please select a vault");
      return;
    }

    setIsProcessing(true);
    try {
      const inactivityPeriodMs = selectedPeriodDays * 24 * 60 * 60 * 1000;

      const tx = deadmanSwitch
        ? updateDeadmanSwitchTx({
            switchId: deadmanSwitch.id,
            vaultId,
            capId,
            beneficiary,
            inactivityPeriodMs,
          })
        : setupDeadmanSwitchTx({
            vaultId,
            capId,
            beneficiary,
            inactivityPeriodMs,
          });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            toast.success(
              deadmanSwitch
                ? "Deadman Switch updated"
                : "Deadman Switch activated"
            );

            if (!deadmanSwitch && result?.objectChanges) {
              const createdSwitch = result.objectChanges.find(
                (change) =>
                  change.type === "created" &&
                  change.objectType?.includes("DeadManSwitch")
              );
              if (createdSwitch) {
                localStorage.setItem(
                  `deadman_switch_${vaultId}`,
                  createdSwitch.objectId
                );
              }
            }

            refetch();
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHeartbeat = async () => {
    if (!deadmanSwitch) return;

    setIsProcessing(true);
    try {
      const tx = heartbeatDeadmanSwitchTx({
        switchId: deadmanSwitch.id,
        vaultId,
        capId,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => {
            toast.success("Heartbeat sent successfully");
            refetch();
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaim = async () => {
    if (!deadmanSwitch) return;

    setIsProcessing(true);
    try {
      const tx = claimDeadmanSwitchTx({
        switchId: deadmanSwitch.id,
        vaultId,
        capId,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => {
            toast.success("Vault claimed successfully");
            refetch();
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!deadmanSwitch) return;

    setIsProcessing(true);
    try {
      const tx = disableDeadmanSwitchTx({
        switchId: deadmanSwitch.id,
        vaultId,
        capId,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => {
            toast.success("Deadman Switch disabled");
            refetch();
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const isOwner =
    walletAddress &&
    (deadmanSwitch ? deadmanSwitch.vault_id === vaultId : capId);
  const isBeneficiary =
    walletAddress && deadmanSwitch?.beneficiary === walletAddress;
  const canClaim =
    isBeneficiary &&
    deadmanSwitch &&
    !deadmanSwitch.claimed &&
    Date.now() >=
      deadmanSwitch.last_activity_ms + deadmanSwitch.inactivity_period_ms;

  const daysRemaining = deadmanSwitch
    ? Math.max(
        0,
        Math.floor(
          (deadmanSwitch.last_activity_ms +
            deadmanSwitch.inactivity_period_ms -
            Date.now()) /
            86400000
        )
      )
    : 0;

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-xs space-y-1">
          <p className="text-sm font-medium">
            Please connect your wallet to continue
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Deadman Switch</h1>
          <p className="text-muted-foreground mt-2">
            Protect your assets with automatic inheritance feature
          </p>
        </div>

        {deadmanSwitch && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>
                  <strong>Status:</strong>{" "}
                  {deadmanSwitch.claimed ? "Claimed" : "Active"}
                </p>
                <p>
                  <strong>Beneficiary:</strong>{" "}
                  {deadmanSwitch.beneficiary.slice(0, 8)}...
                  {deadmanSwitch.beneficiary.slice(-6)}
                </p>
                <p>
                  <strong>Days remaining:</strong> {daysRemaining} days
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {deadmanSwitch
                ? "Update Deadman Switch"
                : "Activate Deadman Switch"}
            </CardTitle>
            <CardDescription>
              Choose beneficiary and inactivity period to automatically transfer
              ownership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Beneficiary Address</label>
              <Input
                placeholder="0x..."
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                disabled={isProcessing || deadmanSwitch?.claimed}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Inactivity Period</label>
              <Select
                value={selectedPeriodDays.toString()}
                onValueChange={(value) => setSelectedPeriodDays(Number(value))}
                disabled={isProcessing || deadmanSwitch?.claimed}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.days}
                      value={option.days.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSetupOrUpdate}
              disabled={isProcessing || !isOwner || deadmanSwitch?.claimed}
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {deadmanSwitch ? "Update" : "Activate"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">I'm Still Alive</CardTitle>
              <CardDescription>Send activity signal</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleHeartbeat}
                disabled={
                  !deadmanSwitch ||
                  isProcessing ||
                  !isOwner ||
                  deadmanSwitch?.claimed
                }
                variant="outline"
                className="w-full"
              >
                <Heart className="mr-2 h-4 w-4" />
                Heartbeat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Claim Vault</CardTitle>
              <CardDescription>Beneficiary claims ownership</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleClaim}
                disabled={!canClaim || isProcessing}
                className="w-full"
              >
                <Shield className="mr-2 h-4 w-4" />
                Claim
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Disable Switch</CardTitle>
              <CardDescription>Cancel this feature</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleDisable}
                disabled={
                  !deadmanSwitch ||
                  isProcessing ||
                  !isOwner ||
                  deadmanSwitch?.claimed
                }
                variant="destructive"
                className="w-full"
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
