"use client";

import { useNewItemModal } from "@/hooks/use-new-item-modal";
import { ItemSelectorModal } from "./item-selector-modal";
import { ItemFormModal } from "./item-form-modal";
import { ITEM_TYPE } from "@/constants/source-type";

export function NewItemModalManager() {
  const { modalState, closeModal, openItemForm, openModal } = useNewItemModal();

  // Function to save items to database
  const handleSaveItem = (itemType, data) => {
    console.log(`Saving ${itemType}:`, data);
    // API call to save the item would go here
    closeModal();
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
