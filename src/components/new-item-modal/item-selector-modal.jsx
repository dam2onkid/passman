// "use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemTypeButton } from "./item-type-button";
import { ITEM_TYPE_DATA } from "@/constants/source-type";

const itemTypeData = Object.values(ITEM_TYPE_DATA);

export function ItemSelectorModal({ isOpen, onClose, onSelectItemType }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            What would you like to add?
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-3 gap-4">
            {itemTypeData.map((itemType) => (
              <ItemTypeButton
                key={itemType.type}
                icon={itemType.icon}
                label={itemType.label}
                onClick={() => onSelectItemType(itemType.type)}
                className="bg-cyan-50"
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
