"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { get } from "lodash-es";

import { cn } from "@/lib/utils";
import useActiveVault from "@/hooks/use-active-vault";
import useFetchItems from "@/hooks/use-fetch-items";
import { getItemIcon } from "@/constants/source-type";
import { NewItemModalManager } from "@/components/new-item-modal/new-item-modal-manager";
import { useRefreshTrigger } from "@/lib/refresh-trigger";

export const groupItemsByFirstLetter = (items) => {
  const grouped = {};

  items.forEach((item) => {
    const firstLetter = item.name.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(item);
  });

  return grouped;
};

// Get all categories
export const getAllCategories = (items) => {
  return [
    ...new Set(items.map((item) => item.name.charAt(0).toUpperCase())),
  ].sort();
};

export function PasswordList({ onSelectEntry, selectedEntryId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const { vaultId } = useActiveVault();
  const { items, loading, refetch } = useFetchItems(vaultId);
  const { subscribe } = useRefreshTrigger();

  useEffect(() => {
    refetch();
  }, [vaultId]);

  // Subscribe to refresh events
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      refetch();
    });
    return () => unsubscribe();
  }, [subscribe, refetch]);

  // Filter entries based on search query
  const filteredGroupedItems = {};
  const groupedItems = groupItemsByFirstLetter(items);
  if (searchQuery.trim() === "") {
    // If no search query, use all entries
    Object.assign(filteredGroupedItems, groupedItems);
  } else {
    // Filter entries based on search query
    Object.keys(groupedItems).forEach((category) => {
      const filteredItems = groupedItems[category].filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredItems.length > 0) {
        filteredGroupedItems[category] = filteredItems;
      }
    });
  }

  const handleNewItemCreated = (itemType, data) => {
    refetch();
  };

  return (
    <div className="flex h-full flex-col border-r">
      <NewItemModalManager onNewItemCreated={handleNewItemCreated} />
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
        {loading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 3 }).map((_, categoryIndex) => (
              <div key={categoryIndex} className="border-b last:border-0 pb-4">
                {/* Category header skeleton */}
                <div className="h-5 w-8 bg-muted/70 rounded mb-2"></div>

                {/* Category entries skeletons */}
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, entryIndex) => (
                    <div
                      key={entryIndex}
                      className="flex items-center gap-3 px-4 py-2"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted/70 animate-pulse"></div>
                      <div className="h-5 w-32 bg-muted/70 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {Object.keys(filteredGroupedItems)
              .sort()
              .map((firstLetter) => (
                <div key={firstLetter} className="border-b last:border-0">
                  {/* Category header */}
                  <div className="sticky top-0 z-10 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                    {firstLetter}
                  </div>

                  {/* Category entries */}
                  <div>
                    {get(filteredGroupedItems, firstLetter, []).map((item) => (
                      <button
                        key={item.id.id}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 hover:bg-muted/50",
                          selectedEntryId === item.id && "bg-muted"
                        )}
                        onClick={() => onSelectEntry(item)}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
                          {/* Item icon */}
                          {getItemIcon(item.category)}
                        </div>
                        <div className="flex flex-col items-start text-sm">
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

            {/* Empty state */}
            {items?.length === 0 && (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div className="max-w-xs space-y-1">
                  <p className="text-sm font-medium">No results found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query to find what you're looking
                    for.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
