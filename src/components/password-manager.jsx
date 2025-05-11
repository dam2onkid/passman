"use client";

import { useState } from "react";
import { PasswordList } from "@/components/password-list";
import { PasswordDetail } from "@/components/password-detail";

export function PasswordManager() {
  const [selectedEntry, setSelectedEntry] = useState(null);

  const handleSelectEntry = (entry) => {
    console.log({ entry });
    setSelectedEntry(entry);
  };

  return (
    <div className="grid h-full grid-cols-[350px_1fr]">
      <PasswordList
        onSelectEntry={handleSelectEntry}
        selectedEntryId={selectedEntry?.id}
      />
      <PasswordDetail entry={selectedEntry} />
    </div>
  );
}
