"use client";

import { Lock, FileText, CreditCard, User, Key, File } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ItemTypeButton } from "./item-type-button";

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
            <ItemTypeButton
              icon={Lock}
              label="Login"
              onClick={() => onSelectItemType("login")}
              className="bg-cyan-50"
            />
            <ItemTypeButton
              icon={FileText}
              label="Secure Note"
              onClick={() => onSelectItemType("secure-note")}
              className="bg-amber-50"
            />
            <ItemTypeButton
              icon={CreditCard}
              label="Credit Card"
              onClick={() => onSelectItemType("credit-card")}
              className="bg-blue-50"
            />
            <ItemTypeButton
              icon={User}
              label="Identity"
              onClick={() => onSelectItemType("identity")}
              className="bg-green-50"
            />
            <ItemTypeButton
              icon={Key}
              label="Password"
              onClick={() => onSelectItemType("password")}
              className="bg-purple-50"
            />
            <ItemTypeButton
              icon={File}
              label="Document"
              onClick={() => onSelectItemType("document")}
              className="bg-indigo-50"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
