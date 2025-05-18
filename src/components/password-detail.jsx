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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { useSealDecrypt, getSealId } from "@/hooks/use-seal";
import { useNetworkVariable } from "@/lib/network-config";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import useActiveVault from "@/hooks/use-active-vault";
import {
  ownerSealApproveMoveCallTx,
  deleteItemMoveCallTx,
} from "@/lib/construct-move-call";
import { ITEM_TYPE_DATA, getItemIcon } from "@/constants/source-type";

export function PasswordDetail({ entry, onItemDeleted }) {
  const isFetchingRef = useRef(false);
  const [showPassword, setShowPassword] = useState({});
  const [decryptedPassword, setDecryptedPassword] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [copiedFields, setCopiedFields] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save logic would go here
      setIsEditing(false);
      toast.success("Changes saved successfully!");
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

      await signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await suiClient.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Item deleted successfully");
            setShowDeleteDialog(false);

            // Notify parent component that item was deleted
            if (onItemDeleted) {
              onItemDeleted(entry.id.id);
            }
          },
          onError: (error) => {
            console.error("Delete error:", error);
            toast.error("Failed to delete item");
          },
          onFinally: () => {
            setIsDeleting(false);
          },
        }
      );
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        `Failed to delete item: ${error?.message || "Unknown error"}`
      );
      setIsDeleting(false);
    }
  };

  const decryptItem = async () => {
    if (!entry || !vaultId || isFetchingRef.current) return;
    isFetchingRef.current = true;

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
    }
  };

  useEffect(() => {
    if (!entry?.id?.id || !isWalletConnected) {
      return;
    }
    decryptItem();
  }, [entry]);

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

    return (
      <div className="space-y-6">
        {formFields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {field.label.toUpperCase()}
            </label>
            {isEditing ? (
              isPasswordField(field) ? (
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword[field.name] ? "text" : "password"}
                    value={formData[field.name] || ""}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility(field.name)}
                  >
                    {showPassword[field.name] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleInputChange}
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={formData[field.name] || ""}
                  onChange={handleInputChange}
                />
              )
            ) : (
              <div className="flex items-center justify-between rounded-md border p-2">
                <div className="text-sm">
                  {isPasswordField(field) && !showPassword[field.name] ? (
                    "••••••••••"
                  ) : field.type === "textarea" ? (
                    <div className="whitespace-pre-wrap">
                      {decryptedPassword[field.name] || ""}
                    </div>
                  ) : (
                    decryptedPassword[field.name] || ""
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isPasswordField(field) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => togglePasswordVisibility(field.name)}
                      >
                        {showPassword[field.name] ? (
                          <EyeOff className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 mr-1" />
                        )}
                        {showPassword[field.name] ? "Hide" : "Show"}
                      </Button>
                      <Separator orientation="vertical" className="h-4" />
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() =>
                      handleCopyToClipboard(
                        field.name,
                        decryptedPassword[field.name]
                      )
                    }
                  >
                    {copiedFields[field.name] ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    {copiedFields[field.name] ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
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
            <h2 className="text-lg font-semibold">
              {decryptedPassword?.itemName || entry.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="h-8 px-2"
              onClick={handleToggleEdit}
            >
              {isEditing ? (
                <Check className="h-4 w-4" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              {isEditing ? "Save" : "Edit"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
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
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Form fields */}
          {renderFormFields()}

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
    </>
  );
}
