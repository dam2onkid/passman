"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNewItemModal } from "@/hooks/use-new-item-modal";

export function NewItemButton() {
  const { openModal } = useNewItemModal();

  return (
    <Button
      variant="default"
      className="w-full justify-start gap-2 mb-2"
      onClick={openModal}
    >
      <Plus className="h-4 w-4" />
      <span>New Item</span>
    </Button>
  );
}
