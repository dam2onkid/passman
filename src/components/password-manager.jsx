"use client";

import { useState } from "react";
import { PasswordList } from "@/components/password-list";
import { PasswordDetail } from "@/components/password-detail";
import { useSuiWallet } from "@/hooks/use-sui-wallet";

export function PasswordManager() {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const { isConnected } = useSuiWallet();

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
  };

  const handleItemDeleted = (itemId) => {
    setSelectedEntry(null);
  };

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-xs space-y-1">
          <p className="text-sm font-medium">
            Please connect your wallet to continue
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid h-full grid-cols-[350px_1fr]">
      <PasswordList
        onSelectEntry={handleSelectEntry}
        selectedEntryId={selectedEntry?.id}
      />
      {selectedEntry ? (
        <PasswordDetail
          entry={selectedEntry}
          onItemDeleted={handleItemDeleted}
        />
      ) : (
        <div className="flex h-full items-center justify-center p-8 text-center">
          <div className="max-w-xs space-y-1">
            <p className="text-sm font-medium">No password selected</p>
            <p className="text-sm text-muted-foreground">
              Select a password from the list to view its details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
