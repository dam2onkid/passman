"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNewItemModal } from "@/hooks/use-new-item-modal";

export function HeaderNewItemButton() {
  const { openModal } = useNewItemModal();

  return (
    <Button
      variant="default"
      size="sm"
      className="ml-auto flex items-center gap-1"
      onClick={openModal}
    >
      <Plus className="h-4 w-4" />
      <span>New Item</span>
    </Button>
  );
}
