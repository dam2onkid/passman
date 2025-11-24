"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Clock,
  Shield,
  Calendar,
  Wallet,
  Key,
  Mail,
  User,
  Globe,
  FileText,
  Lock,
  CreditCard,
  Loader2,
} from "lucide-react";

import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import useFetchShareById from "@/hooks/use-fetch-share-by-id";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { getSealId, useSealDecrypt } from "@/hooks/use-seal";
import { useNetworkVariable } from "@passman/utils/network-config";
import { shareSealApproveMoveCallTx } from "@passman/utils";
import { ITEM_TYPE_DATA, getItemIcon } from "@passman/utils";
import { fetchFromWalrus } from "@passman/utils";

function ShareViewContent({ shareId, vaultId }) {
  const { shareData, loading, error } = useFetchShareById(shareId);
  const [showPassword, setShowPassword] = useState({});
  const {
    currentAccount,
    disconnect,
    client: suiClient,
    walletAddress,
  } = useSuiWallet();
  const packageId = useNetworkVariable("passman");
  const { decryptData } = useSealDecrypt({ packageId });
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState(null);

  const decryptItem = async () => {
    if (!shareData || !vaultId) return;
    setIsDecrypting(true);

    try {
      const encryptedData = await fetchFromWalrus(
        shareData.itemData.walrus_blob_id,
        suiClient
      );

      const { id } = getSealId(vaultId, shareData.itemData.nonce);
      const txBytes = await shareSealApproveMoveCallTx({
        id,
        shareId: shareData.id,
      }).build({ client: suiClient, onlyTransactionKind: true });

      const decrypted = await decryptData({
        packageId,
        encryptedObject: encryptedData,
        txBytes,
      });
      const decodedData = new TextDecoder().decode(decrypted);
      const parsedData = JSON.parse(decodedData);
      setDecryptedPassword(parsedData);
    } catch (err) {
      toast.error(`Unexpected error: ${err?.message || "Unknown error"}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  useEffect(() => {
    if (!shareData?.itemData?.walrus_blob_id || !walletAddress || !vaultId) {
      return;
    }
    decryptItem();
  }, [shareData, vaultId, walletAddress]);

  const handleCopyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPassword((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const renderFormFields = () => {
    const category = shareData?.itemData?.category;
    if (!category) return null;
    if (!ITEM_TYPE_DATA[category]) return null;
    if (!decryptedPassword) return null;

    const keys = Object.keys(decryptedPassword);
    const formFields = ITEM_TYPE_DATA[category].formFields.filter(
      (field) => keys.includes(field.name) && field.name !== "itemName"
    );

    if (formFields.length === 0) return null;

    const isPasswordField = (field) => {
      if (field.type === "password") {
        return true;
      }
      if (field.name === "recoveryPhrase") {
        return true;
      }
      return false;
    };

    const getFieldIcon = (field) => {
      const iconMap = {
        username: User,
        email: Mail,
        password: Key,
        url: Globe,
        website: Globe,
        notes: FileText,
        recoveryPhrase: Lock,
        cardNumber: CreditCard,
        expiryDate: Calendar,
        cvv: Shield,
        walletAddress: Wallet,
      };

      if (field.type === "password" || field.name === "recoveryPhrase") {
        return Key;
      }

      return iconMap[field.name] || FileText;
    };

    return (
      <div className="space-y-4">
        {formFields.map((field) => {
          const IconComponent = getFieldIcon(field);
          const fieldValue = decryptedPassword[field.name] || "";
          const isPassword = isPasswordField(field);
          const isVisible = showPassword[field.name];

          return (
            <div key={field.name} className="group">
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
              </div>

              <div className="relative">
                <div className="flex items-center min-h-[44px] rounded-lg border border-border bg-background/50 hover:bg-background transition-colors group-hover:border-border/80">
                  <div className="flex-1 px-4 py-3">
                    {field.type === "textarea" ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-[500px] overflow-auto pr-2">
                        {fieldValue}
                      </div>
                    ) : field.name === "walletAddress" ? (
                      <div className="text-sm font-mono break-all">
                        {isPassword && !isVisible ? (
                          "••••••••••••••••"
                        ) : (
                          <span className="block sm:hidden">
                            {fieldValue
                              ? `${fieldValue.slice(0, 8)}...${fieldValue.slice(
                                  -8
                                )}`
                              : ""}
                          </span>
                        )}
                        <span className="hidden sm:block">
                          {isPassword && !isVisible
                            ? "••••••••••••••••"
                            : fieldValue}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-mono">
                        {isPassword && !isVisible
                          ? "••••••••••••••••"
                          : fieldValue}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 px-2">
                    {isPassword && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => togglePasswordVisibility(field.name)}
                      >
                        {isVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {isVisible ? "Hide" : "Show"} {field.label}
                        </span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() =>
                        handleCopyToClipboard(fieldValue, field.label)
                      }
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy {field.label}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const DisconnectWallet = () => {
    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => {
            disconnect();
            window.location.reload();
          }}
          variant="outline"
        >
          Disconnect Wallet
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading shared account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              Current wallet: {formatAddress(walletAddress)}
            </div>
            <DisconnectWallet />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Share Not Found</CardTitle>
            <CardDescription>
              The requested share could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              Current wallet: {formatAddress(walletAddress)}
            </div>
            <DisconnectWallet />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { itemData, shareData: share, expiresAt, createdAt } = shareData;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header with Wallet Info */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Shared Account</h1>
            <p className="text-muted-foreground">
              You have been granted access to view this account information
            </p>
          </div>

          {/* Current Wallet Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Connected Wallet</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatAddress(walletAddress)}
                    </p>
                  </div>
                </div>
                <DisconnectWallet />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Share Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Shared on
                </div>
                <p className="font-mono text-sm">
                  {createdAt.toLocaleDateString()}{" "}
                  {createdAt.toLocaleTimeString()}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Expires on
                </div>
                <p className="font-mono text-sm">
                  {expiresAt.toLocaleDateString()}{" "}
                  {expiresAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>{itemData.name}</CardTitle>
            <CardDescription>
              Account credentials and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isDecrypting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              renderFormFields()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ShareViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { isConnected } = useSuiWallet();
  const shareId = params.shareId;
  const vaultId = searchParams.get("vault_id");

  if (!isConnected) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Wallet Connection Required</h1>
            <p className="text-muted-foreground">
              You need to connect your wallet to view this shared account.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Shield className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet or sign in with Google to securely access
                  the shared account information.
                </p>
                <div className="space-y-3">
                  <WalletConnectButton isSidebar={false} className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <ShareViewContent shareId={shareId} vaultId={vaultId} />;
}
