"use client";

import { cn } from "@/lib/utils";

export function ItemTypeButton({ icon: Icon, label, onClick, className }) {
  return (
    <button
      className={cn(
        "flex flex-col items-center justify-center rounded-lg p-4 transition-all duration-200 hover:bg-accent/80 hover:scale-105 hover:shadow-md border border-gray-500 cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="mb-2 rounded-full bg-white p-3 shadow-sm dark:bg-blue-500 ">
        <Icon className="h-5 w-5 text-black dark:text-white" />
      </div>
      <span className="text-sm font-medium tracking-tight text-black dark:text-white">
        {label}
      </span>
    </button>
  );
}
