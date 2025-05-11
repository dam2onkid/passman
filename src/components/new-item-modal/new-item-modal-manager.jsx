"use client";

import { Transaction } from "@mysten/sui/transactions";
import { fromHex, toHex } from "@mysten/sui/utils";

import { useNewItemModal } from "@/hooks/use-new-item-modal";
import { ItemSelectorModal } from "./item-selector-modal";
import { ItemFormModal } from "./item-form-modal";
import { ITEM_TYPE } from "@/constants/source-type";
import { useSealEncrypt } from "@/hooks/use-seal";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { useNetworkVariable } from "@/lib/network-config";
import useActiveVault from "@/hooks/use-active-vault";

export function NewItemModalManager() {
  const { modalState, closeModal, openItemForm, openModal } = useNewItemModal();
  const { signAndExecuteTransaction, walletAddress } = useSuiWallet();
  const packageId = useNetworkVariable("passman");
  const { vaultId, capId } = useActiveVault();
  const { encryptData } = useSealEncrypt();

  const handleSaveItem = async (itemType, data) => {
    const name = data.itemName || `New ${itemType}`;
    const nonce = crypto.getRandomValues(new Uint8Array(5));
    const policyObjectBytes = fromHex(walletAddress);
    const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

    const { encryptedObject } = await encryptData({
      packageId,
      id,
      data: new Uint8Array(data),
    });

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::vault::create_item_entry`,
      arguments: [
        tx.object(capId),
        tx.pure.string(name),
        tx.pure.string(itemType),
        tx.object(vaultId),
        tx.pure.vector("u8", Array.from(nonce)),
        tx.pure.vector("u8", Array.from(encryptedObject)),
      ],
    });
    tx.setGasBudget(10000000);
    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: async (result) => {
          closeModal();
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
