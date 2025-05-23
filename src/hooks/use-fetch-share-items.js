import { useState, useEffect } from "react";
import { get } from "lodash-es";

import { useSuiWallet } from "./use-sui-wallet";

export default function useFetchShareItems(vaultId) {
  const { currentAccount, client: suiClient } = useSuiWallet();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchShares() {
    if (!currentAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const shareRes = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
        },
        filter: {
          StructType: `${packageId}::share::Share`,
        },
      });
      console.log(shareRes);

      // const promiseItems = get(vault, "data.content.fields.items", []).map(
      //   async (itemId) => {
      //     const item = await suiClient.getObject({
      //       id: itemId,
      //       options: { showContent: true },
      //     });
      //     const fields = item?.data?.content?.fields;
      //     return fields;
      //   }
      // );
      // const processedItems = await Promise.all(promiseItems);
      setItems(shareRes.data);
    } catch (err) {
      setError(err.message || "Failed to fetch shared items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchShares();
  }, [currentAccount?.address, suiClient]);

  return { items, loading, error, refetch: fetchShares };
}
