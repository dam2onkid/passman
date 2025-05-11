"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { groupPasswordEntriesByCategory } from "@/lib/password-data";
import { cn } from "@/lib/utils";
import useActiveVault from "@/hooks/use-active-vault";
import useFetchItems from "@/hooks/use-fetch-items";

export function PasswordList({ onSelectEntry, selectedEntryId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const groupedEntries = groupPasswordEntriesByCategory();
  const { vaultId } = useActiveVault();
  const { items } = useFetchItems(vaultId);

  // Filter entries based on search query
  const filteredGroupedEntries = {};
  if (searchQuery.trim() === "") {
    // If no search query, use all entries
    Object.assign(filteredGroupedEntries, groupedEntries);
  } else {
    // Filter entries based on search query
    Object.keys(groupedEntries).forEach((category) => {
      const filteredEntries = groupedEntries[category].filter(
        (entry) =>
          entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredEntries.length > 0) {
        filteredGroupedEntries[category] = filteredEntries;
      }
    });
  }

  return (
    <div className="flex h-full flex-col border-r">
      {/* Search header */}
      <div className="flex items-center gap-2 border-b p-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search"
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Password entries list */}
      <div className="group h-[calc(100vh-134px)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden hover:[scrollbar-width:thin] hover:[-ms-overflow-style:auto] hover:[&::-webkit-scrollbar]:block hover:[&::-webkit-scrollbar]:w-1.5 hover:[&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-track]:bg-transparent">
        {Object.keys(filteredGroupedEntries)
          .sort()
          .map((category) => (
            <div key={category} className="border-b last:border-0">
              {/* Category header */}
              <div className="sticky top-0 z-10 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                {category}
              </div>

              {/* Category entries */}
              <div>
                {filteredGroupedEntries[category].map((entry) => (
                  <button
                    key={entry.id}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2 hover:bg-muted/50",
                      selectedEntryId === entry.id && "bg-muted"
                    )}
                    onClick={() => onSelectEntry(entry)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
                      <entry.icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{entry.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

        {/* Empty state */}
        {Object.keys(filteredGroupedEntries).length === 0 && (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-medium">No results found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search query to find what you're looking for.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
