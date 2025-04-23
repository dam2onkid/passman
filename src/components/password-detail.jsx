"use client";

import { useState } from "react";
import { Eye, EyeOff, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PasswordDetail({ entry }) {
  const [showPassword, setShowPassword] = useState(false);

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-xs space-y-1">
          <p className="text-sm font-medium">No password selected</p>
          <p className="text-sm text-muted-foreground">
            Select a password from the list to view its details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">{entry.name}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Delete</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Copy to clipboard</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Password details - fixed height, no scrolling */}
      <div className="flex-1 p-6 space-y-6 overflow-hidden">
        {/* Service icon and name */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
            <entry.icon className="h-6 w-6" />
          </div>
          <div className="text-xl font-semibold">{entry.name}</div>
        </div>

        {/* Username/email */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            USERNAME
          </label>
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="text-sm">{entry.username}</div>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              Copy
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            PASSWORD
          </label>
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="text-sm">
              {showPassword ? "password123" : entry.password}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Eye className="h-3.5 w-3.5 mr-1" />
                )}
                {showPassword ? "Hide" : "Show"}
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="ghost" size="sm" className="h-7 px-2">
                Copy
              </Button>
            </div>
          </div>
        </div>

        {/* Website */}
        {entry.website && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              WEBSITE
            </label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="text-sm text-blue-600 hover:underline">
                <a
                  href={entry.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {entry.website.replace(/(https?:\/\/)?(www\.)?/, "")}
                </a>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                Copy
              </Button>
            </div>
          </div>
        )}

        {/* Saved on */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            SAVED ON
          </label>
          <div className="text-sm">{entry.savedOn}</div>
        </div>

        {/* First name and last name */}
        {(entry.firstName || entry.lastName) && (
          <>
            <Separator />

            {entry.firstName && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  FIRST NAME
                </label>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <div className="text-sm">{entry.firstName}</div>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {entry.lastName && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  LAST NAME
                </label>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <div className="text-sm">{entry.lastName}</div>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Last edited info */}
      <div className="border-t p-4">
        <div className="flex items-center">
          <button className="flex items-center text-xs text-muted-foreground hover:underline">
            Last edited {entry.lastEdited.formattedString}
          </button>
        </div>
      </div>
    </div>
  );
}
