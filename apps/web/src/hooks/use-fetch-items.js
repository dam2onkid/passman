import { useState, useEffect } from "react";
import { get } from "lodash-es";

import { useSuiWallet } from "./use-sui-wallet";

export default function useFetchItems(vaultId) {
  const { currentAccount, client: suiClient } = useSuiWallet();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchItems() {
    if (!currentAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const vault = await suiClient.getObject({
        id: vaultId,
        options: { showContent: true },
      });

      const promiseItems = get(vault, "data.content.fields.items", []).map(
        async (itemId) => {
          const item = await suiClient.getObject({
            id: itemId,
            options: { showContent: true },
          });
          const fields = item?.data?.content?.fields;
          return fields;
        }
      );
      const processedItems = await Promise.all(promiseItems);
      setItems(processedItems);
    } catch (err) {
      setError(err.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, [currentAccount?.address, suiClient]);

  return { items, loading, error, refetch: fetchItems };
}
