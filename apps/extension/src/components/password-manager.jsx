"use client";

import { useState } from "react";
import { PasswordList } from "@/components/password-list";
import { PasswordDetail } from "@/components/password-detail";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { useRefreshTrigger } from "@/lib/refresh-trigger";

export function PasswordManager() {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const { isConnected } = useSuiWallet();
  const { trigger: triggerRefresh } = useRefreshTrigger();

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
  };

  const handleItemDeleted = (itemId) => {
    setSelectedEntry(null);
    triggerRefresh();
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
    <div className="grid h-full grid-cols-[250px_1fr]">
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
        <div className="flex h-full items-center justify-center p-4 text-center">
          <div className="max-w-xs space-y-1">
            <p className="text-sm font-medium">No password selected</p>
            <p className="text-xs text-muted-foreground">
              Select a password from the list to view its details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
