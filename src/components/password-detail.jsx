"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Copy,
  Check,
  Trash2,
  Loader2,
  Share,
  Key,
  Mail,
  User,
  Globe,
  FileText,
  Lock,
  CreditCard,
  Calendar,
  Shield,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSealDecrypt, getSealId, useSealEncrypt } from "@/hooks/use-seal";
import { useNetworkVariable } from "@/lib/network-config";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import useActiveVault from "@/hooks/use-active-vault";
import {
  ownerSealApproveMoveCallTx,
  deleteItemMoveCallTx,
  editItemMoveCallTx,
} from "@/lib/construct-move-call";
import { ITEM_TYPE_DATA, getItemIcon } from "@/constants/source-type";
import { PasswordGenerator } from "@/components/password-generator";
import { ShareModal } from "@/components/share-modal";

export function PasswordDetail({ entry, onItemDeleted }) {
  const { encryptData } = useSealEncrypt();
  const isFetchingRef = useRef(false);
  const [showPassword, setShowPassword] = useState({});
  const [decryptedPassword, setDecryptedPassword] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [copiedFields, setCopiedFields] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [activePasswordField, setActivePasswordField] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const { vaultId, capId } = useActiveVault();
  const packageId = useNetworkVariable("passman");
  const {
    client: suiClient,
    isConnected: isWalletConnected,
    signAndExecuteTransaction,
  } = useSuiWallet();
  const { decryptData } = useSealDecrypt({ packageId });

  const togglePasswordVisibility = (fieldName) => {
    setShowPassword((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const openPasswordGenerator = (fieldName) => {
    setActivePasswordField(fieldName);
    setShowPasswordGenerator(true);
  };

  const handleUseGeneratedPassword = (password) => {
    if (activePasswordField) {
      setFormData({
        ...formData,
        [activePasswordField]: password,
      });
      setShowPasswordGenerator(false);
    }
  };

  const handleToggleEdit = async () => {
    if (isEditing) {
      const hasChanges = Object.keys(formData).some(
        (key) => formData[key] !== decryptedPassword?.[key]
      );
      if (!hasChanges) {
        setIsEditing(false);
        return;
      }
      if (!entry?.id?.id || !vaultId || !capId || !entry.nonce) {
        toast.error("Missing required data for editing");
        return;
      }

      try {
        setIsSaving(true);
        const { id } = getSealId(vaultId, entry.nonce);
        const dataBuffer = new TextEncoder().encode(JSON.stringify(formData));

        const { encryptedObject } = await encryptData({
          packageId,
          id,
          data: dataBuffer,
        });

        if (!encryptedObject) {
          toast.error("Failed to encrypt data");
          setIsSaving(false);
          return;
        }

        const tx = editItemMoveCallTx({
          capId,
          name: formData.itemName,
          encryptedObject,
          itemId: entry.id.id,
        });

        signAndExecuteTransaction(
          { transaction: tx },
          {
            onSuccess: async (result) => {
              await suiClient.waitForTransaction({
                digest: result.digest,
                options: { showEffects: true },
              });
              toast.success("Item edited successfully");
              setIsEditing(false);
              setIsSaving(false);
              setDecryptedPassword(formData);
            },
            onError: (error) => {
              toast.error(error?.message || "Failed to edit item");
              setIsEditing(false);
              setIsSaving(false);
            },
          }
        );
      } catch (error) {
        toast.error(
          `Failed to edit item: ${error?.message || "Unknown error"}`
        );
        setIsSaving(false);
      }
    } else {
      setIsEditing(true);
      setFormData(decryptedPassword || {});
    }
  };

  const handleCopyToClipboard = (fieldName, value) => {
    if (value) {
      navigator.clipboard.writeText(value).then(() => {
        setCopiedFields((prev) => ({ ...prev, [fieldName]: true }));
        setTimeout(() => {
          setCopiedFields((prev) => ({ ...prev, [fieldName]: false }));
        }, 2000);
        toast.success(`${fieldName} copied to clipboard`);
      });
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entry?.id?.id || !vaultId || !capId) {
      toast.error("Missing required data for deletion");
      return;
    }

    setIsDeleting(true);
    try {
      const tx = deleteItemMoveCallTx({
        vaultId,
        capId,
        itemId: entry.id.id,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await suiClient.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Item deleted successfully");
            setShowDeleteDialog(false);
            onItemDeleted && onItemDeleted(entry.id.id);
            setIsDeleting(false);
          },
          onError: (error) => {
            toast.error(error?.message || "Failed to delete item");
            setIsDeleting(false);
          },
        }
      );
    } catch (error) {
      toast.error(error?.message || "Failed to delete item");
      setIsDeleting(false);
    }
  };

  const decryptItem = async () => {
    if (!entry || !vaultId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsDecrypting(true);

    try {
      const { id } = getSealId(vaultId, entry.nonce);
      const txBytes = await ownerSealApproveMoveCallTx({
        id,
        vaultId,
        itemId: entry?.id?.id,
      }).build({ client: suiClient, onlyTransactionKind: true });

      const decrypted = await decryptData({
        encryptedObject: new Uint8Array(entry.data),
        txBytes,
      });
      const decodedData = new TextDecoder().decode(decrypted);
      const parsedData = JSON.parse(decodedData);
      setDecryptedPassword(parsedData);
      setFormData(parsedData);
    } catch (err) {
      toast.error(`Unexpected error: ${err?.message || "Unknown error"}`);
    } finally {
      isFetchingRef.current = false;
      setIsDecrypting(false);
    }
  };

  useEffect(() => {
    if (!entry?.id?.id || !isWalletConnected) {
      return;
    }
    decryptItem();
  }, [entry]);

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const renderFormFields = () => {
    if (!entry?.category) return null;
    if (!ITEM_TYPE_DATA[entry.category]) return null;
    if (!decryptedPassword) return null;

    const keys = Object.keys(decryptedPassword);
    const formFields = ITEM_TYPE_DATA[entry.category].formFields.filter(
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
          const isCopied = copiedFields[field.name];

          return (
            <div key={field.name} className="group">
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
              </div>

              {isEditing ? (
                <div className="relative">
                  {isPassword ? (
                    <div className="relative">
                      <Input
                        id={field.name}
                        name={field.name}
                        type={isVisible ? "text" : "password"}
                        value={formData[field.name] || ""}
                        onChange={handleInputChange}
                        className="pr-24 min-h-[44px] rounded-lg border-border bg-background/50 hover:bg-background transition-colors focus:border-primary"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button
                          type="button"
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => openPasswordGenerator(field.name)}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      className="w-full min-h-[200px] max-h-[500px] rounded-lg border border-border bg-background/50 hover:bg-background transition-colors px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2  "
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      className={`min-h-[44px] rounded-lg border-border bg-background/50 hover:bg-background transition-colors focus:border-primary ${
                        field.name === "walletAddress"
                          ? "font-mono text-sm"
                          : ""
                      }`}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center min-h-[44px] rounded-lg border border-border bg-background/50 hover:bg-background transition-colors group-hover:border-border/80">
                    <div className="flex-1 px-4 py-3">
                      {field.type === "textarea" ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-[300px] overflow-auto pr-2">
                          {fieldValue}
                        </div>
                      ) : field.name === "walletAddress" ? (
                        <div className="text-sm font-mono break-all">
                          {isPassword && !isVisible ? (
                            "••••••••••••••••"
                          ) : (
                            <>
                              <span className="block sm:hidden">
                                {fieldValue
                                  ? `${fieldValue.slice(
                                      0,
                                      8
                                    )}...${fieldValue.slice(-8)}`
                                  : ""}
                              </span>
                              <span className="hidden sm:block">
                                {fieldValue}
                              </span>
                            </>
                          )}
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
                          handleCopyToClipboard(field.name, fieldValue)
                        }
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {isCopied ? "Copied" : "Copy"} {field.label}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!entry) return null;

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header with actions */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              {getItemIcon(entry.category)}
            </div>
            <h2 className="text-lg font-semibold">{entry.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(decryptedPassword || {});
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="h-7 px-2"
              onClick={handleToggleEdit}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                <>
                  <Check className="h-4 w-4" />
                  Save
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShareClick}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleCopyToClipboard(
                      "All data",
                      JSON.stringify(decryptedPassword)
                    )
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy all data
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Password details - fixed height with scrolling */}
        <div className="flex-1 px-[10%] py-6 space-y-6 overflow-auto">
          {/* Form fields */}
          {isDecrypting ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            renderFormFields()
          )}

          {/* Saved on */}
          {entry.savedOn && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                SAVED ON
              </label>
              <div className="text-sm">{entry.savedOn}</div>
            </div>
          )}
        </div>

        {/* Last edited info */}
        {entry.lastEdited && (
          <div className="border-t p-4">
            <div className="flex items-center">
              <button className="flex items-center text-xs text-muted-foreground hover:underline">
                Last edited {entry.lastEdited.formattedString}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {decryptedPassword?.itemName || entry.name}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          entry={entry}
        />
      )}

      {/* Password Generator Dialog */}
      {showPasswordGenerator && (
        <Dialog
          open={showPasswordGenerator}
          onOpenChange={setShowPasswordGenerator}
        >
          <DialogContent
            className="sm:max-w-md bg-black border-zinc-800"
            hideCloseButton
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Password Generator</DialogTitle>
            </DialogHeader>
            <PasswordGenerator
              onCancel={() => setShowPasswordGenerator(false)}
              onUsePassword={handleUseGeneratedPassword}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
