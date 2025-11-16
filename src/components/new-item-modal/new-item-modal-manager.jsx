"use client";

import React from "react";
import { toast } from "sonner";

import { useNewItemModal } from "@/hooks/use-new-item-modal";
import { ItemSelectorModal } from "./item-selector-modal";
import { ItemFormModal } from "./item-form-modal";
import { ITEM_TYPE } from "@/constants/source-type";
import { useSealEncrypt, getSealId } from "@/hooks/use-seal";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { useNetworkVariable } from "@/lib/network-config";
import useActiveVault from "@/hooks/use-active-vault";
import { createItemMoveCallTx } from "@/lib/construct-move-call";
import { uploadToWalrus } from "@/lib/walrus-client";

export function NewItemModalManager({ onNewItemCreated }) {
  const [isCreatingItem, setIsCreatingItem] = React.useState(false);
  const { modalState, closeModal, openItemForm, openModal } = useNewItemModal();
  const { signAndExecuteTransaction, client, walletAddress } = useSuiWallet();
  const packageId = useNetworkVariable("passman");
  const { vaultId, capId } = useActiveVault();
  const { encryptData } = useSealEncrypt();

  const handleSaveItem = async (itemType, data) => {
    try {
      setIsCreatingItem(true);
      const name = data.itemName || `New ${itemType}`;
      const { id, nonce } = getSealId(vaultId);
      const dataBuffer = new TextEncoder().encode(JSON.stringify(data));
      const uint8Array = new Uint8Array(dataBuffer);

      const { encryptedObject } = await encryptData({
        packageId,
        id,
        data: uint8Array,
      });
      if (!encryptedObject) {
        toast.error("Failed to encrypt data");
        setIsCreatingItem(false);
        return;
      }

      const { blob_id } = await uploadToWalrus({
        encryptedData: encryptedObject,
        signAndExecuteTransaction,
        owner: walletAddress,
        client,
        epochs: 3,
      });

      if (!blob_id) {
        toast.error("Failed to upload to Walrus");
        setIsCreatingItem(false);
        return;
      }
      console.log("blob_id", blob_id);

      const tx = createItemMoveCallTx({
        vaultId,
        capId,
        name,
        itemType,
        nonce,
        walrusBlobId: blob_id,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await client.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Item created successfully");
            closeModal();
            onNewItemCreated(itemType, data);
            setIsCreatingItem(false);
          },
          onError: (error) => {
            toast.error("Failed to create item");
            setIsCreatingItem(false);
          },
        }
      );
    } catch (error) {
      console.error("Failed to create item", error);
      toast.error("Failed to create item");
      setIsCreatingItem(false);
    }
  };

  const handleBackToItemSelector = () => {
    openModal();
  };

  // Check if the current modal state is an item type
  const isItemFormOpen = Object.values(ITEM_TYPE).includes(modalState);

  return (
    <>
      <ItemSelectorModal
        isOpen={modalState === "item-selector"}
        onClose={closeModal}
        onSelectItemType={openItemForm}
      />

      {isItemFormOpen && (
        <ItemFormModal
          isOpen={true}
          onClose={closeModal}
          isCreating={isCreatingItem}
          itemType={modalState}
          onSubmit={handleSaveItem}
          onBack={handleBackToItemSelector}
        />
      )}
    </>
  );
}
