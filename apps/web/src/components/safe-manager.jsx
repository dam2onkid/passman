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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import useActiveVault from "@/hooks/use-active-vault";
import { useFetchSafe } from "@/hooks/use-fetch-safe";
import { toast } from "sonner";
import {
  Heart,
  Shield,
  ShieldOff,
  UserPlus,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Vote,
} from "lucide-react";
import {
  createSafeTx,
  disableSafeTx,
  heartbeatTx,
  claimTx,
  updateDeadmanTx,
  approveRecoveryTx,
  updateGuardiansTx,
} from "@passman/utils";

const PERIOD_OPTIONS = [
  { label: "7 days (minimum)", days: 7 },
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
  { label: "2 years", days: 730 },
];

export function SafeManager() {
  const { signAndExecuteTransaction, walletAddress, isConnected, client } =
    useSuiWallet();
  const { activeVault, activeCap, vaultId, capId, activeSafe, hasSafe } =
    useActiveVault();
  const { safe, isLoading, refetch } = useFetchSafe(vaultId);

  // Form states
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("status");

  // Create Safe form
  const [guardians, setGuardians] = useState([""]);
  const [threshold, setThreshold] = useState(1);
  const [beneficiary, setBeneficiary] = useState("");
  const [selectedPeriodDays, setSelectedPeriodDays] = useState(30);
  const [enableDeadman, setEnableDeadman] = useState(false);
  const [enableRecovery, setEnableRecovery] = useState(false);

  // Recovery form
  const [recoveryNewOwner, setRecoveryNewOwner] = useState("");

  // Update forms
  const [updateBeneficiary, setUpdateBeneficiary] = useState("");
  const [updatePeriodDays, setUpdatePeriodDays] = useState(30);
  const [updateGuardians, setUpdateGuardians] = useState([""]);
  const [updateThreshold, setUpdateThreshold] = useState(1);

  // Initialize update forms when safe data loads
  useEffect(() => {
    if (safe) {
      setUpdateBeneficiary(safe.beneficiary || "");
      const days = Math.floor(safe.inactivity_period_ms / 86400000) || 30;
      setUpdatePeriodDays(days);
      setUpdateGuardians(safe.guardians.length > 0 ? safe.guardians : [""]);
      setUpdateThreshold(safe.threshold || 1);
    }
  }, [safe]);

  // Reset forms when vault changes
  useEffect(() => {
    setGuardians([""]);
    setThreshold(1);
    setBeneficiary("");
    setSelectedPeriodDays(30);
    setEnableDeadman(false);
    setEnableRecovery(false);
    setRecoveryNewOwner("");
  }, [vaultId]);

  // Guardian list management
  const addGuardian = (list, setList) => {
    setList([...list, ""]);
  };

  const removeGuardian = (index, list, setList) => {
    const newList = list.filter((_, i) => i !== index);
    setList(newList.length > 0 ? newList : [""]);
  };

  const updateGuardian = (index, value, list, setList) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  // Create Safe handler
  const handleCreateSafe = async () => {
    if (!vaultId || !capId) {
      toast.error("Please select a vault");
      return;
    }

    const validGuardians = enableRecovery
      ? guardians.filter((g) => g.trim() !== "")
      : [];
    const finalThreshold = enableRecovery ? threshold : 0;
    const finalBeneficiary = enableDeadman && beneficiary.trim() ? beneficiary.trim() : null;
    const inactivityPeriodMs = enableDeadman ? selectedPeriodDays * 24 * 60 * 60 * 1000 : 0;

    if (enableRecovery && validGuardians.length === 0) {
      toast.error("Please add at least one guardian for social recovery");
      return;
    }

    if (enableRecovery && finalThreshold > validGuardians.length) {
      toast.error("Threshold cannot exceed number of guardians");
      return;
    }

    if (enableDeadman && !finalBeneficiary) {
      toast.error("Please enter a beneficiary address for deadman switch");
      return;
    }

    setIsProcessing(true);
    try {
      const tx = createSafeTx({
        vaultId,
        capId,
        guardians: validGuardians,
        threshold: finalThreshold,
        beneficiary: finalBeneficiary,
        inactivityPeriodMs,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Safe created successfully");

            // Store safe ID in localStorage
            if (result?.objectChanges) {
              const createdSafe = result.objectChanges.find(
                (change) =>
                  change.type === "created" &&
                  change.objectType?.includes("Safe")
              );
              if (createdSafe) {
                localStorage.setItem(`safe_${vaultId}`, createdSafe.objectId);
              }
            }

            refetch();
            setIsProcessing(false);
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Heartbeat handler
  const handleHeartbeat = async () => {
    if (!safe) return;

    setIsProcessing(true);
    try {
      const tx = heartbeatTx({ safeId: safe.id });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Heartbeat sent successfully");
            refetch();
            setIsProcessing(false);
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Claim handler (for beneficiary)
  const handleClaim = async () => {
    if (!safe) return;

    setIsProcessing(true);
    try {
      const tx = claimTx({ safeId: safe.id });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Vault claimed successfully");
            refetch();
            setIsProcessing(false);
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Update Deadman handler
  const handleUpdateDeadman = async () => {
    if (!safe) return;

    const finalBeneficiary = updateBeneficiary.trim() || null;
    const inactivityPeriodMs = updatePeriodDays * 24 * 60 * 60 * 1000;

    setIsProcessing(true);
    try {
      const tx = updateDeadmanTx({
        safeId: safe.id,
        beneficiary: finalBeneficiary,
        inactivityPeriodMs,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Deadman switch updated");
            refetch();
            setIsProcessing(false);
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Approve Recovery handler (for guardians)
  const handleApproveRecovery = async () => {
    if (!safe || !recoveryNewOwner.trim()) {
      toast.error("Please enter the new owner address");
      return;
    }

    setIsProcessing(true);
    try {
      const tx = approveRecoveryTx({
        safeId: safe.id,
        newOwner: recoveryNewOwner.trim(),
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Recovery vote submitted");
            refetch();
            setIsProcessing(false);
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Update Guardians handler
  const handleUpdateGuardians = async () => {
    if (!safe) return;

    const validGuardians = updateGuardians.filter((g) => g.trim() !== "");

    if (validGuardians.length > 0 && updateThreshold > validGuardians.length) {
      toast.error("Threshold cannot exceed number of guardians");
      return;
    }

    const finalThreshold = validGuardians.length > 0 ? updateThreshold : 0;

    setIsProcessing(true);
    try {
      const tx = updateGuardiansTx({
        safeId: safe.id,
        guardians: validGuardians,
        threshold: finalThreshold,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Guardians updated");
            refetch();
            setIsProcessing(false);
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Disable Safe handler
  const handleDisableSafe = async () => {
    if (!safe) return;

    setIsProcessing(true);
    try {
      const tx = disableSafeTx({ safeId: safe.id });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Safe disabled, Cap returned to your wallet");
            localStorage.removeItem(`safe_${vaultId}`);
            refetch();
            setIsProcessing(false);
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Calculate status
  const isOwner = walletAddress && safe?.owner === walletAddress;
  const isBeneficiary = walletAddress && safe?.beneficiary === walletAddress;
  const isGuardian = walletAddress && safe?.guardians?.includes(walletAddress);
  const canClaim =
    isBeneficiary &&
    safe &&
    !safe.deadman_claimed &&
    safe.has_cap &&
    Date.now() >= safe.last_activity_ms + safe.inactivity_period_ms;

  const daysRemaining = safe?.beneficiary
    ? Math.max(
        0,
        Math.floor(
          (safe.last_activity_ms + safe.inactivity_period_ms - Date.now()) /
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
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // If no safe exists, show create form
  if (!safe) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Safe Protection</h1>
            <p className="text-muted-foreground mt-2">
              Protect your vault with Social Recovery and Deadman Switch features
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create Safe</CardTitle>
              <CardDescription>
                Lock your vault Cap in a Safe to enable protection features.
                You can enable Social Recovery, Deadman Switch, or both.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Social Recovery Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableRecovery"
                    checked={enableRecovery}
                    onChange={(e) => setEnableRecovery(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="enableRecovery" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Enable Social Recovery
                  </label>
                </div>

                {enableRecovery && (
                  <div className="pl-6 space-y-4 border-l-2 border-muted ml-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Guardians</label>
                      {guardians.map((guardian, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="0x..."
                            value={guardian}
                            onChange={(e) =>
                              updateGuardian(index, e.target.value, guardians, setGuardians)
                            }
                          />
                          {guardians.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGuardian(index, guardians, setGuardians)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addGuardian(guardians, setGuardians)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Guardian
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Threshold (votes needed for recovery)
                      </label>
                      <Select
                        value={threshold.toString()}
                        onValueChange={(value) => setThreshold(Number(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: guardians.filter((g) => g.trim()).length || 1 },
                            (_, i) => i + 1
                          ).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Deadman Switch Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableDeadman"
                    checked={enableDeadman}
                    onChange={(e) => setEnableDeadman(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="enableDeadman" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Enable Deadman Switch
                  </label>
                </div>

                {enableDeadman && (
                  <div className="pl-6 space-y-4 border-l-2 border-muted ml-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Beneficiary Address</label>
                      <Input
                        placeholder="0x..."
                        value={beneficiary}
                        onChange={(e) => setBeneficiary(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Inactivity Period</label>
                      <Select
                        value={selectedPeriodDays.toString()}
                        onValueChange={(value) => setSelectedPeriodDays(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERIOD_OPTIONS.map((option) => (
                            <SelectItem key={option.days} value={option.days.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateSafe}
                disabled={isProcessing || (!enableRecovery && !enableDeadman)}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Safe...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Create Safe
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Safe exists - show management UI
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Safe Protection</h1>
          <p className="text-muted-foreground mt-2">
            Manage your vault protection settings
          </p>
        </div>

        {/* Status Alert */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Safe Active
            {safe.deadman_claimed && (
              <Badge variant="destructive">Claimed</Badge>
            )}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <strong>Owner:</strong> {safe.owner.slice(0, 8)}...{safe.owner.slice(-6)}
                {isOwner && <Badge variant="outline" className="ml-2">You</Badge>}
              </p>
              {safe.guardians.length > 0 && (
                <p>
                  <strong>Guardians:</strong> {safe.guardians.length} ({safe.threshold} required)
                </p>
              )}
              {safe.beneficiary && (
                <>
                  <p>
                    <strong>Beneficiary:</strong> {safe.beneficiary.slice(0, 8)}...
                    {safe.beneficiary.slice(-6)}
                    {isBeneficiary && <Badge variant="outline" className="ml-2">You</Badge>}
                  </p>
                  <p>
                    <strong>Days remaining:</strong> {daysRemaining} days
                  </p>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="deadman">Deadman</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Heartbeat Card */}
              {isOwner && safe.beneficiary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      I'm Still Here
                    </CardTitle>
                    <CardDescription>
                      Send activity signal to reset the deadman timer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleHeartbeat}
                      disabled={isProcessing || safe.deadman_claimed}
                      variant="outline"
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Heart className="mr-2 h-4 w-4" />
                          Send Heartbeat
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Claim Card (for beneficiary) */}
              {isBeneficiary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Claim Vault
                    </CardTitle>
                    <CardDescription>
                      {canClaim
                        ? "Inactivity period has passed. You can claim now."
                        : `Wait ${daysRemaining} more days to claim.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleClaim}
                      disabled={!canClaim || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Claim Vault
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Guardian Vote Card */}
              {isGuardian && !isOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Vote className="h-5 w-5" />
                      Vote for Recovery
                    </CardTitle>
                    <CardDescription>
                      As a guardian, you can vote to recover this vault to a new owner
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="New owner address (0x...)"
                      value={recoveryNewOwner}
                      onChange={(e) => setRecoveryNewOwner(e.target.value)}
                    />
                    <Button
                      onClick={handleApproveRecovery}
                      disabled={isProcessing || !recoveryNewOwner.trim()}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Submit Vote
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Deadman Tab */}
          <TabsContent value="deadman" className="space-y-4">
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Deadman Switch</CardTitle>
                  <CardDescription>
                    Change beneficiary or inactivity period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Beneficiary Address</label>
                    <Input
                      placeholder="0x... (leave empty to disable)"
                      value={updateBeneficiary}
                      onChange={(e) => setUpdateBeneficiary(e.target.value)}
                      disabled={isProcessing || safe.deadman_claimed}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Inactivity Period</label>
                    <Select
                      value={updatePeriodDays.toString()}
                      onValueChange={(value) => setUpdatePeriodDays(Number(value))}
                      disabled={isProcessing || safe.deadman_claimed}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={option.days} value={option.days.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleUpdateDeadman}
                    disabled={isProcessing || safe.deadman_claimed}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update Deadman Switch"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recovery Tab */}
          <TabsContent value="recovery" className="space-y-4">
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Guardians</CardTitle>
                  <CardDescription>
                    Add or remove guardians for social recovery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Guardians</label>
                    {updateGuardians.map((guardian, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="0x..."
                          value={guardian}
                          onChange={(e) =>
                            updateGuardian(index, e.target.value, updateGuardians, setUpdateGuardians)
                          }
                          disabled={isProcessing}
                        />
                        {updateGuardians.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeGuardian(index, updateGuardians, setUpdateGuardians)
                            }
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addGuardian(updateGuardians, setUpdateGuardians)}
                      disabled={isProcessing}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Guardian
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Threshold</label>
                    <Select
                      value={updateThreshold.toString()}
                      onValueChange={(value) => setUpdateThreshold(Number(value))}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          {
                            length:
                              updateGuardians.filter((g) => g.trim()).length || 1,
                          },
                          (_, i) => i + 1
                        ).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleUpdateGuardians}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update Guardians"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pending Recovery Votes */}
            {safe.recovery_votes && Object.keys(safe.recovery_votes).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Recovery Votes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(safe.recovery_votes).map(([candidate, voters]) => (
                      <div key={candidate} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-mono text-sm">
                          {candidate.slice(0, 8)}...{candidate.slice(-6)}
                        </span>
                        <Badge>
                          {voters.length} / {safe.threshold} votes
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            {isOwner && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Disable the Safe and return Cap to your wallet. This will remove
                    all protection features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleDisableSafe}
                    disabled={isProcessing || safe.deadman_claimed}
                    variant="destructive"
                    className="w-full"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Disable Safe
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

