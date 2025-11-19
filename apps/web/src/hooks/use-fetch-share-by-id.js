import { useState, useEffect, useCallback } from "react";
import { get } from "lodash-es";

import { useSuiWallet } from "./use-sui-wallet";
import { useNetworkVariable } from "@passman/utils";

export default function useFetchShareById(shareId) {
  const { client: suiClient, currentAccount } = useSuiWallet();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const packageId = useNetworkVariable("passman");

  const fetchShareData = useCallback(async () => {
    if (!shareId || !currentAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch the share object directly by ID
      const shareRes = await suiClient.getObject({
        id: shareId,
        options: { showContent: true },
      });

      if (!shareRes?.data) {
        throw new Error("Share not found");
      }

      const share = shareRes.data.content?.fields;
      if (!share) {
        throw new Error("Invalid share data");
      }

      // Check if current user is in recipients list
      const recipients = share.recipients || [];
      const isAuthorized = recipients.includes(currentAccount.address);

      if (!isAuthorized) {
        throw new Error("You are not authorized to view this share");
      }

      // Check if share is expired
      const isExpired =
        Date.now() > parseInt(share.created_at) + parseInt(share.ttl);
      if (isExpired) {
        throw new Error("This share has expired");
      }

      // Fetch the associated item
      const itemRes = await suiClient.getObject({
        id: share.item_id,
        options: { showContent: true },
      });

      const item = itemRes?.data?.content?.fields;
      if (!item) {
        throw new Error("Associated item not found");
      }

      const processedData = {
        id: shareId,
        shareData: share,
        itemData: item,
        isExpired,
        isAuthorized,
        expiresAt: new Date(parseInt(share.created_at) + parseInt(share.ttl)),
        createdAt: new Date(parseInt(share.created_at)),
      };

      setShareData(processedData);
    } catch (err) {
      setError(err.message || "Failed to fetch share data");
    } finally {
      setLoading(false);
    }
  }, [shareId, currentAccount?.address, suiClient]);

  useEffect(() => {
    fetchShareData();
  }, [fetchShareData]);

  return { shareData, loading, error, refetch: fetchShareData };
}
