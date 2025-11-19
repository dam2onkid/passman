"use client";

import { create } from "zustand";

// Modal states: "closed", "item-selector", "login", "secure-note", etc.
export const useNewItemModal = create((set) => ({
  modalState: "closed",
  setModalState: (state) => set({ modalState: state }),

  openModal: () => set({ modalState: "item-selector" }),
  closeModal: () => set({ modalState: "closed" }),

  openItemForm: (itemType) => set({ modalState: itemType }),
}));
