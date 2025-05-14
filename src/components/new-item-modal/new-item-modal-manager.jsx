"use client";

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

export function NewItemModalManager() {
  const { modalState, closeModal, openItemForm, openModal } = useNewItemModal();
  const { signAndExecuteTransaction, walletAddress } = useSuiWallet();
  const packageId = useNetworkVariable("passman");
  const { vaultId, capId } = useActiveVault();
  const { encryptData } = useSealEncrypt();

  const handleSaveItem = async (itemType, data) => {
    const name = data.itemName || `New ${itemType}`;
    const { id, nonce } = getSealId(vaultId);

    const { encryptedObject } = await encryptData({
      packageId,
      id,
      data: new Uint8Array(data),
    });

    const tx = createItemMoveCallTx({
      vaultId,
      capId,
      name,
      itemType,
      nonce,
      encryptedObject,
    });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: async (result) => {
          toast.success("Item created successfully");
          closeModal();
        },
        onError: (error) => {
          toast.error("Failed to create item");
        },
      }
    );
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
          itemType={modalState}
          onSubmit={handleSaveItem}
          onBack={handleBackToItemSelector}
        />
      )}
    </>
  );
}
