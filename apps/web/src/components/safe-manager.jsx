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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import useActiveVault from "@/hooks/use-active-vault";
import {
  useFetchSafe,
  useFetchGuardianSafes,
  useFetchBeneficiarySafes,
} from "@/hooks/use-fetch-safe";
import { toast } from "sonner";
import {
  Heart,
  Shield,
  ShieldOff,
  ShieldCheck,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Vote,
  UserCheck,
  Hourglass,
  CalendarClock,
  ArrowRight,
  ExternalLink,
  Copy,
} from "lucide-react";
import {
  createSafeTx,
  disableSafeTx,
  heartbeatTx,
  claimTx,
  updateDeadmanTx,
  approveRecoveryTx,
  updateGuardiansTx,
  PACKAGE_ID,
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

// Helper function to format address
function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

// Helper function to format time remaining
function formatTimeRemaining(ms) {
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

// Copy to clipboard helper
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

export function SafeManager() {
  const { signAndExecuteTransaction, walletAddress, isConnected, client } =
    useSuiWallet();
  const { vaultId, capId } = useActiveVault();
  const { safe, isLoading, refetch } = useFetchSafe(vaultId);
  const {
    guardianSafes,
    isLoading: isLoadingGuardian,
    refetch: refetchGuardian,
  } = useFetchGuardianSafes(walletAddress);
  const {
    beneficiarySafes,
    isLoading: isLoadingBeneficiary,
    refetch: refetchBeneficiary,
  } = useFetchBeneficiarySafes(walletAddress);

  // Main tab state
  const [mainTab, setMainTab] = useState("my-safe");

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

  const updateGuardianValue = (index, value, list, setList) => {
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
    const finalBeneficiary =
      enableDeadman && beneficiary.trim() ? beneficiary.trim() : null;
    const inactivityPeriodMs = enableDeadman
      ? selectedPeriodDays * 24 * 60 * 60 * 1000
      : 0;

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

  // Generic Claim handler
  const handleClaimSafe = async (safeId, onSuccessCallback) => {
    setIsProcessing(true);
    try {
      const tx = claimTx({ safeId });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Vault claimed successfully!");
            if (onSuccessCallback) onSuccessCallback();
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

  // Generic Approve Recovery handler
  const handleApproveRecoverySafe = async (
    safeId,
    newOwner,
    onSuccessCallback
  ) => {
    if (!newOwner.trim()) {
      toast.error("Please enter the new owner address");
      return;
    }

    setIsProcessing(true);
    try {
      const tx = approveRecoveryTx({
        safeId,
        newOwner: newOwner.trim(),
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Recovery vote submitted!");
            if (onSuccessCallback) onSuccessCallback();
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
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium mt-4">
            Please connect your wallet to continue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Safe Protection</h1>
          <p className="text-muted-foreground mt-2">
            Protect your vault with Social Recovery and Deadman Switch
          </p>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="my-safe" className="gap-2">
              <Shield className="h-4 w-4" />
              My Safe
              {safe && <Badge variant="secondary" className="ml-1 text-xs">1</Badge>}
            </TabsTrigger>
            <TabsTrigger value="guardian" className="gap-2">
              <Users className="h-4 w-4" />
              Guardian
              {guardianSafes.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {guardianSafes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="beneficiary" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Beneficiary
              {beneficiarySafes.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {beneficiarySafes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* My Safe Tab */}
          <TabsContent value="my-safe">
            <MySafeContent
              safe={safe}
              isLoading={isLoading}
              isProcessing={isProcessing}
              isOwner={isOwner}
              isBeneficiary={isBeneficiary}
              isGuardian={isGuardian}
              canClaim={canClaim}
              daysRemaining={daysRemaining}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              vaultId={vaultId}
              capId={capId}
              // Form states
              guardians={guardians}
              setGuardians={setGuardians}
              threshold={threshold}
              setThreshold={setThreshold}
              beneficiary={beneficiary}
              setBeneficiary={setBeneficiary}
              selectedPeriodDays={selectedPeriodDays}
              setSelectedPeriodDays={setSelectedPeriodDays}
              enableDeadman={enableDeadman}
              setEnableDeadman={setEnableDeadman}
              enableRecovery={enableRecovery}
              setEnableRecovery={setEnableRecovery}
              recoveryNewOwner={recoveryNewOwner}
              setRecoveryNewOwner={setRecoveryNewOwner}
              updateBeneficiary={updateBeneficiary}
              setUpdateBeneficiary={setUpdateBeneficiary}
              updatePeriodDays={updatePeriodDays}
              setUpdatePeriodDays={setUpdatePeriodDays}
              updateGuardiansState={updateGuardians}
              setUpdateGuardians={setUpdateGuardians}
              updateThreshold={updateThreshold}
              setUpdateThreshold={setUpdateThreshold}
              // Handlers
              addGuardian={addGuardian}
              removeGuardian={removeGuardian}
              updateGuardianValue={updateGuardianValue}
              handleCreateSafe={handleCreateSafe}
              handleHeartbeat={handleHeartbeat}
              handleClaimSafe={() => handleClaimSafe(safe?.id, refetch)}
              handleUpdateDeadman={handleUpdateDeadman}
              handleApproveRecoverySafe={() =>
                handleApproveRecoverySafe(safe?.id, recoveryNewOwner, () => {
                  refetch();
                  setRecoveryNewOwner("");
                })
              }
              handleUpdateGuardians={handleUpdateGuardians}
              handleDisableSafe={handleDisableSafe}
              walletAddress={walletAddress}
            />
          </TabsContent>

          {/* Guardian Safes Tab */}
          <TabsContent value="guardian">
            <GuardianSafesContent
              guardianSafes={guardianSafes}
              isLoading={isLoadingGuardian}
              isProcessing={isProcessing}
              walletAddress={walletAddress}
              handleApproveRecoverySafe={handleApproveRecoverySafe}
              refetch={refetchGuardian}
              client={client}
            />
          </TabsContent>

          {/* Beneficiary Safes Tab */}
          <TabsContent value="beneficiary">
            <BeneficiarySafesContent
              beneficiarySafes={beneficiarySafes}
              isLoading={isLoadingBeneficiary}
              isProcessing={isProcessing}
              walletAddress={walletAddress}
              handleClaimSafe={handleClaimSafe}
              refetch={refetchBeneficiary}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ==========================================
// My Safe Content Component
// ==========================================
function MySafeContent({
  safe,
  isLoading,
  isProcessing,
  isOwner,
  isBeneficiary,
  isGuardian,
  canClaim,
  daysRemaining,
  activeTab,
  setActiveTab,
  vaultId,
  capId,
  // Form states
  guardians,
  setGuardians,
  threshold,
  setThreshold,
  beneficiary,
  setBeneficiary,
  selectedPeriodDays,
  setSelectedPeriodDays,
  enableDeadman,
  setEnableDeadman,
  enableRecovery,
  setEnableRecovery,
  recoveryNewOwner,
  setRecoveryNewOwner,
  updateBeneficiary,
  setUpdateBeneficiary,
  updatePeriodDays,
  setUpdatePeriodDays,
  updateGuardiansState,
  setUpdateGuardians,
  updateThreshold,
  setUpdateThreshold,
  // Handlers
  addGuardian,
  removeGuardian,
  updateGuardianValue,
  handleCreateSafe,
  handleHeartbeat,
  handleClaimSafe,
  handleUpdateDeadman,
  handleApproveRecoverySafe,
  handleUpdateGuardians,
  handleDisableSafe,
  walletAddress,
}) {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Create Safe
          </CardTitle>
          <CardDescription>
            Lock your vault Cap in a Safe to enable protection features. You can
            enable Social Recovery, Deadman Switch, or both.
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
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="enableRecovery"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Users className="h-4 w-4 text-blue-500" />
                Enable Social Recovery
              </label>
            </div>

            {enableRecovery && (
              <div className="pl-6 space-y-4 border-l-2 border-blue-200 dark:border-blue-800 ml-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Guardians</label>
                  {guardians.map((guardian, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="0x..."
                        value={guardian}
                        onChange={(e) =>
                          updateGuardianValue(
                            index,
                            e.target.value,
                            guardians,
                            setGuardians
                          )
                        }
                      />
                      {guardians.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeGuardian(index, guardians, setGuardians)
                          }
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
                        {
                          length:
                            guardians.filter((g) => g.trim()).length || 1,
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
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="enableDeadman"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Clock className="h-4 w-4 text-amber-500" />
                Enable Deadman Switch
              </label>
            </div>

            {enableDeadman && (
              <div className="pl-6 space-y-4 border-l-2 border-amber-200 dark:border-amber-800 ml-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Beneficiary Address
                  </label>
                  <Input
                    placeholder="0x..."
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Inactivity Period
                  </label>
                  <Select
                    value={selectedPeriodDays.toString()}
                    onValueChange={(value) =>
                      setSelectedPeriodDays(Number(value))
                    }
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
    );
  }

  // Safe exists - show management UI
  return (
    <div className="space-y-6">
      {/* Status Alert */}
      <Alert
        className={
          safe.deadman_claimed
            ? "border-destructive bg-destructive/10"
            : "border-green-500 bg-green-50 dark:bg-green-950/20"
        }
      >
        <Shield className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          Safe Active
          {safe.deadman_claimed && (
            <Badge variant="destructive">Claimed</Badge>
          )}
          {safe.isRecovered && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <UserCheck className="h-3 w-3 mr-1" />
              Recovered
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <strong>Owner:</strong>
              <code className="bg-muted px-1 rounded">
                {formatAddress(safe.owner)}
              </code>
              {isOwner && (
                <Badge variant="outline" className="text-xs">
                  You
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => copyToClipboard(safe.owner)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </p>
            {safe.guardians.length > 0 && (
              <p>
                <strong>Guardians:</strong> {safe.guardians.length} (
                {safe.threshold} required)
              </p>
            )}
            {safe.beneficiary && (
              <>
                <p className="flex items-center gap-2">
                  <strong>Beneficiary:</strong>
                  <code className="bg-muted px-1 rounded">
                    {formatAddress(safe.beneficiary)}
                  </code>
                  {isBeneficiary && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </p>
                <p>
                  <strong>Days remaining:</strong> {daysRemaining} days
                </p>
              </>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Recovery Ready Alert - for pending recoveries that have reached threshold */}
      {safe.recovery_votes && Object.entries(safe.recovery_votes).some(
        ([_, voters]) => voters.length >= safe.threshold
      ) && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">
            Recovery Pending Execution
          </AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-300">
            {Object.entries(safe.recovery_votes)
              .filter(([_, voters]) => voters.length >= safe.threshold)
              .map(([candidate, voters]) => (
                <div key={candidate} className="mt-2">
                  <strong>{formatAddress(candidate)}</strong> has{" "}
                  {voters.length}/{safe.threshold} guardian votes. The next
                  guardian vote will execute the recovery and transfer
                  ownership.
                </div>
              ))}
          </AlertDescription>
        </Alert>
      )}

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
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-green-500" />
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
                    className="w-full border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
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
              <Card
                className={
                  canClaim
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : ""
                }
              >
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
                    onClick={handleClaimSafe}
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
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Vote className="h-5 w-5 text-blue-500" />
                    Vote for Recovery
                  </CardTitle>
                  <CardDescription>
                    As a guardian, you can vote to recover this vault to a new
                    owner
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="New owner address (0x...)"
                    value={recoveryNewOwner}
                    onChange={(e) => setRecoveryNewOwner(e.target.value)}
                  />
                  <Button
                    onClick={handleApproveRecoverySafe}
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
                  <label className="text-sm font-medium">
                    Beneficiary Address
                  </label>
                  <Input
                    placeholder="0x... (leave empty to disable)"
                    value={updateBeneficiary}
                    onChange={(e) => setUpdateBeneficiary(e.target.value)}
                    disabled={isProcessing || safe.deadman_claimed}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Inactivity Period
                  </label>
                  <Select
                    value={updatePeriodDays.toString()}
                    onValueChange={(value) =>
                      setUpdatePeriodDays(Number(value))
                    }
                    disabled={isProcessing || safe.deadman_claimed}
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
                  {updateGuardiansState.map((guardian, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="0x..."
                        value={guardian}
                        onChange={(e) =>
                          updateGuardianValue(
                            index,
                            e.target.value,
                            updateGuardiansState,
                            setUpdateGuardians
                          )
                        }
                        disabled={isProcessing}
                      />
                      {updateGuardiansState.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeGuardian(
                              index,
                              updateGuardiansState,
                              setUpdateGuardians
                            )
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
                    onClick={() =>
                      addGuardian(updateGuardiansState, setUpdateGuardians)
                    }
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
                            updateGuardiansState.filter((g) => g.trim())
                              .length || 1,
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
          {safe.recovery_votes &&
            Object.keys(safe.recovery_votes).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Pending Recovery Votes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(safe.recovery_votes).map(
                      ([candidate, voters]) => (
                        <div
                          key={candidate}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="space-y-1">
                            <p className="font-mono text-sm">
                              {formatAddress(candidate)}
                            </p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(voters.length / safe.threshold) * 100}
                                className="w-24 h-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {voters.length} / {safe.threshold}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              voters.length >= safe.threshold
                                ? "default"
                                : "outline"
                            }
                          >
                            {voters.length >= safe.threshold
                              ? "Ready"
                              : "Pending"}
                          </Badge>
                        </div>
                      )
                    )}
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
                  Disable the Safe and return Cap to your wallet. This will
                  remove all protection features.
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
  );
}

// ==========================================
// Guardian Safes Content Component
// ==========================================
function GuardianSafesContent({
  guardianSafes,
  isLoading,
  isProcessing,
  walletAddress,
  handleApproveRecoverySafe,
  refetch,
  client,
}) {
  const [newOwnerInputs, setNewOwnerInputs] = useState({});
  const [expandedSafe, setExpandedSafe] = useState(null);
  const [recoveryHistory, setRecoveryHistory] = useState({});

  // Fetch recovery history for safes
  useEffect(() => {
    async function fetchRecoveryHistory() {
      if (!client || guardianSafes.length === 0) return;

      try {
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::safe::RecoveryExecuted`,
          },
          order: "descending",
          limit: 50,
        });

        const history = {};
        for (const event of events.data) {
          const safeId = event.parsedJson?.safe_id;
          if (safeId && guardianSafes.some((s) => s.id === safeId)) {
            if (!history[safeId]) {
              history[safeId] = [];
            }
            history[safeId].push({
              oldOwner: event.parsedJson.old_owner,
              newOwner: event.parsedJson.new_owner,
              timestamp: event.timestampMs,
            });
          }
        }
        setRecoveryHistory(history);
      } catch (e) {
        console.error("Failed to fetch recovery history:", e);
      }
    }

    fetchRecoveryHistory();
  }, [client, guardianSafes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (guardianSafes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No Guardian Roles</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            You are not assigned as a guardian for any Safe. When someone adds
            you as a guardian, their Safe will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Guardian Responsibilities</h2>
          <p className="text-muted-foreground text-sm">
            Vote to help recover vaults to new owners
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <Loader2 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {guardianSafes.map((safe) => {
          const hasVoted =
            safe.recovery_votes &&
            Object.values(safe.recovery_votes).some((voters) =>
              voters.includes(walletAddress)
            );
          const isExpanded = expandedSafe === safe.id;
          const safeRecoveryHistory = recoveryHistory[safe.id] || [];

          // Check if any recovery is ready to execute (threshold met)
          const readyRecoveries = safe.recovery_votes
            ? Object.entries(safe.recovery_votes).filter(
                ([_, voters]) => voters.length >= safe.threshold
              )
            : [];

          return (
            <Card
              key={safe.id}
              className={`transition-colors ${
                readyRecoveries.length > 0
                  ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                  : "hover:border-blue-300 dark:hover:border-blue-700"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      Safe
                      <code className="text-sm font-normal bg-muted px-2 py-0.5 rounded">
                        {formatAddress(safe.id)}
                      </code>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      Owner: {formatAddress(safe.owner)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => copyToClipboard(safe.owner)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {readyRecoveries.length > 0 && (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Recovery Ready!
                      </Badge>
                    )}
                    {hasVoted && readyRecoveries.length === 0 && (
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-600"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Voted
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {safe.threshold} / {safe.guardians.length} guardians
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Recovery Ready Alert */}
                {readyRecoveries.length > 0 && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700 dark:text-green-400">
                      Recovery Threshold Reached!
                    </AlertTitle>
                    <AlertDescription className="text-green-600 dark:text-green-300">
                      {readyRecoveries.map(([candidate, voters]) => (
                        <div key={candidate} className="mt-2">
                          <span className="font-medium">
                            {formatAddress(candidate)}
                          </span>{" "}
                          has received {voters.length}/{safe.threshold} votes.
                          The next vote will execute the recovery and transfer
                          ownership.
                        </div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Pending Votes Display */}
                {safe.recovery_votes &&
                  Object.keys(safe.recovery_votes).length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Vote className="h-4 w-4 text-blue-500" />
                        Active Recovery Proposals
                      </h4>
                      {Object.entries(safe.recovery_votes).map(
                        ([candidate, voters]) => {
                          const votedForThis = voters.includes(walletAddress);
                          const isReady = voters.length >= safe.threshold;
                          return (
                            <div
                              key={candidate}
                              className={`flex items-center justify-between p-3 rounded-md ${
                                isReady
                                  ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"
                                  : "bg-white dark:bg-gray-900"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <ArrowRight
                                  className={`h-4 w-4 ${
                                    isReady
                                      ? "text-green-600"
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <div>
                                  <p className="font-mono text-sm">
                                    {formatAddress(candidate)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Progress
                                      value={
                                        (voters.length / safe.threshold) * 100
                                      }
                                      className={`w-20 h-1.5 ${
                                        isReady ? "[&>div]:bg-green-500" : ""
                                      }`}
                                    />
                                    <span
                                      className={`text-xs ${
                                        isReady
                                          ? "text-green-600 font-medium"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {voters.length}/{safe.threshold} votes
                                      {isReady && " ✓"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {votedForThis ? (
                                <Badge
                                  variant="outline"
                                  className="border-green-500 text-green-600"
                                >
                                  Your vote
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant={isReady ? "default" : "outline"}
                                  className={
                                    isReady
                                      ? "bg-green-600 hover:bg-green-700"
                                      : ""
                                  }
                                  onClick={() =>
                                    handleApproveRecoverySafe(
                                      safe.id,
                                      candidate,
                                      refetch
                                    )
                                  }
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : isReady ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Execute Recovery
                                    </>
                                  ) : (
                                    <>Vote</>
                                  )}
                                </Button>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                {/* Recovery History */}
                {safeRecoveryHistory.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Recovery History
                    </h4>
                    {safeRecoveryHistory.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-muted-foreground flex items-center gap-2"
                      >
                        <span>{formatAddress(event.oldOwner)}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{formatAddress(event.newOwner)}</span>
                        {event.timestamp && (
                          <span className="ml-auto">
                            {new Date(Number(event.timestamp)).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* New Recovery Vote */}
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() =>
                      setExpandedSafe(isExpanded ? null : safe.id)
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Propose New Recovery
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </Button>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          New Owner Address
                        </label>
                        <Input
                          placeholder="0x..."
                          value={newOwnerInputs[safe.id] || ""}
                          onChange={(e) =>
                            setNewOwnerInputs((prev) => ({
                              ...prev,
                              [safe.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        onClick={() => {
                          handleApproveRecoverySafe(
                            safe.id,
                            newOwnerInputs[safe.id] || "",
                            () => {
                              refetch();
                              setNewOwnerInputs((prev) => ({
                                ...prev,
                                [safe.id]: "",
                              }));
                            }
                          );
                        }}
                        disabled={
                          isProcessing || !newOwnerInputs[safe.id]?.trim()
                        }
                        className="w-full"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Vote className="mr-2 h-4 w-4" />
                            Submit Recovery Vote
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// Beneficiary Safes Content Component
// ==========================================
function BeneficiarySafesContent({
  beneficiarySafes,
  isLoading,
  isProcessing,
  walletAddress,
  handleClaimSafe,
  refetch,
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (beneficiarySafes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No Beneficiary Roles</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            You are not assigned as a beneficiary for any Safe. When someone
            sets you as their beneficiary, their Safe will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Beneficiary Access</h2>
          <p className="text-muted-foreground text-sm">
            Claim vaults after inactivity period expires
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <Loader2 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {beneficiarySafes.map((safe) => {
          const now = Date.now();
          const expiresAt = safe.last_activity_ms + safe.inactivity_period_ms;
          const timeRemaining = expiresAt - now;
          const canClaim =
            !safe.deadman_claimed && safe.has_cap && timeRemaining <= 0;
          const progressPercent = Math.min(
            100,
            ((now - safe.last_activity_ms) / safe.inactivity_period_ms) * 100
          );

          return (
            <Card
              key={safe.id}
              className={`transition-all ${
                canClaim
                  ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 hover:shadow-lg"
                  : safe.deadman_claimed
                  ? "border-muted bg-muted/20"
                  : "hover:border-amber-300 dark:hover:border-amber-700"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-amber-500" />
                      Safe
                      <code className="text-sm font-normal bg-muted px-2 py-0.5 rounded">
                        {formatAddress(safe.id)}
                      </code>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      Owner: {formatAddress(safe.owner)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => copyToClipboard(safe.owner)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {safe.deadman_claimed ? (
                      <Badge variant="secondary">Already Claimed</Badge>
                    ) : canClaim ? (
                      <Badge
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ready to Claim
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Hourglass className="h-3 w-3" />
                        Waiting
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Timer Progress */}
                {!safe.deadman_claimed && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CalendarClock className="h-4 w-4" />
                        Inactivity Timer
                      </span>
                      <span
                        className={`font-medium ${
                          canClaim ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        {canClaim
                          ? "Expired"
                          : formatTimeRemaining(timeRemaining)}
                      </span>
                    </div>
                    <Progress
                      value={progressPercent}
                      className={`h-2 ${canClaim ? "[&>div]:bg-green-500" : ""}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Last activity:{" "}
                      {new Date(safe.last_activity_ms).toLocaleDateString()} •
                      Period:{" "}
                      {Math.floor(safe.inactivity_period_ms / 86400000)} days
                    </p>
                  </div>
                )}

                {/* Claim Button */}
                {!safe.deadman_claimed && (
                  <Button
                    onClick={() => handleClaimSafe(safe.id, refetch)}
                    disabled={!canClaim || isProcessing}
                    className={`w-full ${
                      canClaim
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }`}
                    size="lg"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : canClaim ? (
                      <>
                        <Shield className="mr-2 h-5 w-5" />
                        Claim This Vault
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Wait for Timer
                      </>
                    )}
                  </Button>
                )}

                {safe.deadman_claimed && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Already Claimed</AlertTitle>
                    <AlertDescription>
                      This vault has already been claimed. The Cap has been
                      transferred.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
