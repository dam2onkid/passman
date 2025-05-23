import { useState, useEffect } from "react";
import { get } from "lodash-es";

import { useSuiWallet } from "./use-sui-wallet";
import { useNetworkVariable } from "@/lib/network-config";

export default function useFetchShareItems(vaultId) {
  const { client: suiClient, currentAccount } = useSuiWallet();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const packageId = useNetworkVariable("passman");

  async function fetchShares() {
    if (!vaultId || !currentAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch Cap objects
      const capRes = await suiClient.getOwnedObjects({
        owner: currentAccount?.address,
        options: {
          showContent: true,
        },
        filter: {
          StructType: `${packageId}::share::Cap`,
        },
      });

      const promiseItems = get(capRes, "data", []).map(async (item) => {
        const cap = item?.data?.content?.fields;
        const shareRes = await suiClient.getObject({
          id: cap.share_id,
          options: { showContent: true },
        });
        const share = shareRes?.data?.content?.fields;
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

      const processedItems = await Promise.all(promiseItems);

      setItems(processedItems);
    } catch (err) {
      setError(err.message || "Failed to fetch shared items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchShares();
  }, []);

  return { items, loading, error, refetch: fetchShares };
}
