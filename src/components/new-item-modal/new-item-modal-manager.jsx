"use client";

import { useNewItemModal } from "@/hooks/use-new-item-modal";
import { ItemSelectorModal } from "./item-selector-modal";

export function NewItemModalManager() {
  const { modalState, closeModal, openItemForm } = useNewItemModal();

  // Function to save items to database
  const handleSaveItem = (itemType, data) => {
    console.log(`Saving ${itemType}:`, data);
    // API call to save the item would go here
    closeModal();
  };

  return (
    <>
      <ItemSelectorModal
        isOpen={modalState === "item-selector"}
        onClose={closeModal}
        onSelectItemType={openItemForm}
      />

      {/* Other form modals would be added here */}
      {/* For example: */}
      {/* <LoginFormModal */}
      {/*   isOpen={modalState === "login"} */}
      {/*   onClose={closeModal} */}
      {/*   onSave={(data) => handleSaveItem("login", data)} */}
      {/* /> */}
    </>
  );
}
