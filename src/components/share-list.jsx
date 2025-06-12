"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Copy,
  Trash2,
  Loader2,
  Pencil,
  Link,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import useFetchShareItems from "@/hooks/use-fetch-share-items";
import useActiveVault from "@/hooks/use-active-vault";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { deleteShareMoveCallTx } from "@/lib/construct-move-call";
import { UpdateShareModal } from "@/components/update-share-modal";

// Share item type definition
export const shareItemColumns = (
  handleDeleteClick,
  handleUpdateClick,
  handleCopyShareLink
) => [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Share ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const shareId = row.getValue("id");
      const truncatedId = shareId
        ? `${shareId.slice(0, 3)}...${shareId.slice(-3)}`
        : "N/A";

      return (
        <div className="flex items-center space-x-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {truncatedId}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(shareId);
              toast.success("Share ID copied to clipboard");
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "itemName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Item Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const itemName = row.getValue("itemName");

      return (
        <div className="flex items-center space-x-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {itemName}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(itemName);
              toast.success("Item name copied to clipboard");
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "recipients",
    header: "Recipients",
    cell: ({ row }) => {
      const recipients = row.getValue("recipients") || [];

      return (
        <div className="flex flex-wrap gap-1">
          {recipients.map((recipient, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {`${recipient.slice(0, 4)}...${recipient.slice(-4)}`}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{recipient}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Badge>
          ))}
          {recipients.length === 0 && (
            <span className="text-muted-foreground text-sm">No recipients</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const timestamp = row.getValue("created_at");
      const date = new Date(parseInt(timestamp));

      return (
        <div className="text-sm">
          {date.toLocaleDateString()} {date.toLocaleTimeString()}
        </div>
      );
    },
  },
  {
    accessorKey: "ttl",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Expiration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const ttl = parseInt(row.getValue("ttl"));
      const createdAt = parseInt(row.getValue("created_at"));
      const expirationDate = new Date(createdAt + ttl);
      return (
        <Badge variant="outline">
          {expirationDate.toLocaleDateString()}{" "}
          {expirationDate.toLocaleTimeString()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isExpired",
    header: "Status",
    cell: ({ row }) => {
      const isExpired = row.getValue("isExpired");
      return (
        <Badge
          variant="outline"
          className={
            isExpired
              ? "text-red-500 border-red-500"
              : "text-green-500 border-green-500"
          }
        >
          {isExpired ? "Expired" : "Active"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const isExpired = row.getValue("isExpired");
      const shareId = row.getValue("id");
      const shareItem = row.original;
      const vaultId = shareItem.vault_id;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isExpired}
              onClick={() => handleCopyShareLink(shareId, vaultId)}
            >
              <Link className="mr-2 h-4 w-4" />
              Copy share link
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={isExpired}
              onClick={() => handleUpdateClick(shareItem)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Update share
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              disabled={isExpired}
              onClick={() => handleDeleteClick(shareItem)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function ShareDataTable({
  columns,
  data = [],
  isLoading,
  onShareDeleted,
  pagination,
  onNextPage,
  onPreviousPage,
}) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shareToDelete, setShareToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [shareToUpdate, setShareToUpdate] = useState(null);

  const { signAndExecuteTransaction, client: suiClient } = useSuiWallet();

  const handleDeleteClick = (shareItem) => {
    setShareToDelete(shareItem);
    setShowDeleteDialog(true);
  };

  const handleUpdateClick = (shareItem) => {
    setShareToUpdate(shareItem);
    setShowUpdateModal(true);
  };

  const handleShareUpdated = (updatedShareId) => {
    // Refresh the share list after update
    onShareDeleted && onShareDeleted(updatedShareId);
  };

  const handleCopyShareLink = (shareId, vaultId) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/share/${shareId}?vault_id=${vaultId}`
    );
    toast.success("Share link copied to clipboard");
  };

  const handleDeleteConfirm = async () => {
    if (!shareToDelete?.capId || !shareToDelete?.id) {
      toast.error("Missing required data for deletion");
      return;
    }

    setIsDeleting(true);
    try {
      const tx = deleteShareMoveCallTx({
        capId: shareToDelete.capId,
        shareId: shareToDelete.id,
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await suiClient.waitForTransaction({
              digest: result.digest,
              options: { showEffects: true },
            });
            toast.success("Share deleted successfully");
            setShowDeleteDialog(false);
            setShareToDelete(null);
            onShareDeleted && onShareDeleted(shareToDelete.id);
            setIsDeleting(false);
          },
          onError: (error) => {
            toast.error(error?.message || "Failed to delete share");
            setIsDeleting(false);
          },
        }
      );
    } catch (error) {
      toast.error(error?.message || "Failed to delete share");
      setIsDeleting(false);
    }
  };

  const columnsArray = columns(
    handleDeleteClick,
    handleUpdateClick,
    handleCopyShareLink
  );

  const table = useReactTable({
    data,
    columns: columnsArray,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    manualPagination: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search shares..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          {/* <span className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </span> */}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          {isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={columnsArray.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center space-x-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Loading shares...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columnsArray.length}
                      className="h-24 text-center"
                    >
                      No shares found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </>
          )}
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {pagination.currentPage + 1}
          {pagination.hasNextPage && " of many"}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={!pagination.hasPreviousPage || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!pagination.hasNextPage || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Share</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the share for "
              {shareToDelete?.itemName || "this item"}"? This action cannot be
              undone and will revoke access for all recipients.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Share
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Share Modal */}
      <UpdateShareModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        shareItem={shareToUpdate}
        onShareUpdated={handleShareUpdated}
      />
    </div>
  );
}

export default function ShareList() {
  const { vaultId } = useActiveVault();
  const { isConnected } = useSuiWallet();
  const {
    items,
    loading,
    error,
    pagination,
    refetch,
    goToNextPage,
    goToPreviousPage,
  } = useFetchShareItems(vaultId);

  useEffect(() => {
    refetch();
  }, [isConnected, vaultId]);
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleShareDeleted = (deletedShareId) => {
    refetch();
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
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Shared Items</h2>
        <p className="text-muted-foreground">
          Manage and monitor your shared password items.
        </p>
      </div>
      <ShareDataTable
        columns={shareItemColumns}
        data={items}
        isLoading={loading}
        onShareDeleted={handleShareDeleted}
        pagination={pagination}
        onNextPage={goToNextPage}
        onPreviousPage={goToPreviousPage}
      />
    </div>
  );
}
