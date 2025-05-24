import { useState, useEffect } from "react";
import { get } from "lodash-es";

import { useSuiWallet } from "./use-sui-wallet";
import { useNetworkVariable } from "@/lib/network-config";

export default function useFetchShareItems(vaultId) {
  const { client: suiClient, currentAccount } = useSuiWallet();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    hasPreviousPage: false,
    nextCursor: null,
    cursors: [],
    currentPage: 0,
  });
  const packageId = useNetworkVariable("passman");

  async function fetchShares(cursor = null, direction = "next") {
    if (!vaultId || !currentAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const requestOptions = {
        owner: currentAccount?.address,
        options: {
          showContent: true,
        },
        filter: {
          StructType: `${packageId}::share::Cap`,
        },
        limit: 20,
      };

      if (cursor) {
        requestOptions.cursor = cursor;
      }

      const capRes = await suiClient.getOwnedObjects(requestOptions);
      const promiseItems = get(capRes, "data", []).map(async (item) => {
        const cap = item?.data?.content?.fields;
        const shareRes = await suiClient.getObject({
          id: cap.share_id,
          options: { showContent: true },
        });
        const share = shareRes?.data?.content?.fields;

        if (share.vault_id !== vaultId) {
          return null;
        }

        const itemRes = await suiClient.getObject({
          id: share.item_id,
          options: { showContent: true },
        });
        const _item = itemRes?.data?.content?.fields;

        return {
          ...share,
          id: share?.id?.id,
          capId: cap?.id?.id,
          itemName: _item.name,
          isExpired: Date.now() > share.created_at + share.ttl,
        };
      });

      const allProcessedItems = await Promise.all(promiseItems);
      const processedItems = allProcessedItems.filter((item) => item !== null);

      setPagination((prev) => {
        const newCursors = [...prev.cursors];
        let newCurrentPage = prev.currentPage;

        if (direction === "next" && cursor) {
          newCursors.push(cursor);
          newCurrentPage += 1;
        } else if (direction === "previous") {
          newCursors.pop();
          newCurrentPage = Math.max(0, newCurrentPage - 1);
        } else if (!cursor) {
          newCursors.length = 0;
          newCurrentPage = 0;
        }

        return {
          hasNextPage: capRes.hasNextPage || false,
          hasPreviousPage: newCurrentPage > 0,
          nextCursor: capRes.nextCursor || null,
          cursors: newCursors,
          currentPage: newCurrentPage,
        };
      });

      setItems(processedItems);
    } catch (err) {
      setError(err.message || "Failed to fetch shared items");
    } finally {
      setLoading(false);
    }
  }

  const goToNextPage = () => {
    if (pagination.hasNextPage && pagination.nextCursor) {
      fetchShares(pagination.nextCursor, "next");
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPreviousPage) {
      const previousCursor =
        pagination.cursors[pagination.cursors.length - 1] || null;
      fetchShares(previousCursor, "previous");
    }
  };

  const resetPagination = () => {
    setPagination({
      hasNextPage: false,
      hasPreviousPage: false,
      nextCursor: null,
      cursors: [],
      currentPage: 0,
    });
    fetchShares();
  };

  useEffect(() => {
    resetPagination();
  }, [vaultId, currentAccount?.address]);

  return {
    items,
    loading,
    error,
    pagination,
    refetch: resetPagination,
    goToNextPage,
    goToPreviousPage,
  };
}
