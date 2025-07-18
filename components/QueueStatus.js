import { useEffect, useState, useCallback } from "react";
import { queueManager, networkManager, api } from "../lib/offline";
import styles from "../styles/QueueStatus.module.css";

export default function QueueStatus() {
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [processedItems, setProcessedItems] = useState(new Set());
  const [isClient, setIsClient] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const pendingQueue = await queueManager.getQueue();
      // Filter out any items that are already processed
      const filteredQueue = pendingQueue.filter(
        (item) => !processedItems.has(item.id)
      );
      setQueue(filteredQueue);
    } catch (error) {
      console.error("Error loading queue:", error);
      setQueue([]);
    }
  }, [processedItems]);

  const processQueue = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSyncStatus("syncing");

    try {
      const pendingQueue = await queueManager.getQueue();
      const results = [];

      for (const checkin of pendingQueue) {
        // Skip if already processed
        if (processedItems.has(checkin.id)) {
          continue;
        }

        try {
          const result = await api.checkin(checkin);

          if (result.status === "success") {
            await queueManager.removeFromQueue(checkin);
            setProcessedItems((prev) => new Set([...prev, checkin.id]));
            results.push({
              status: "success",
              item: checkin,
            });
          } else if (result.status === "error" && result.data?.isRestricted) {
            // If check-in is restricted, remove from queue as it's already processed
            await queueManager.removeFromQueue(checkin);
            setProcessedItems((prev) => new Set([...prev, checkin.id]));
            results.push({
              status: "skipped",
              item: checkin,
              reason: "Already checked in",
            });
          } else {
            results.push({
              status: "failed",
              item: checkin,
              error: result.data?.error || "Check-in failed",
            });
          }
        } catch (error) {
          results.push({
            status: "failed",
            item: checkin,
            error: error.message,
          });
        }
      }

      // Reload queue after processing
      await loadQueue();

      // Show sync status for 3 seconds
      setSyncStatus("completed");
      setTimeout(() => {
        setSyncStatus(null);
      }, 3000);
    } catch (error) {
      console.error("Error processing queue:", error);
      setSyncStatus("error");
      setTimeout(() => {
        setSyncStatus(null);
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, loadQueue, processedItems]);

  // Mark as client-side on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load queue on mount and when network status changes
  useEffect(() => {
    if (isClient) {
      loadQueue();
    }
  }, [loadQueue, isClient]);

  // Handle online status changes
  useEffect(() => {
    if (!isClient) return;

    const handleOnline = async () => {
      const pendingQueue = await queueManager.getQueue();
      if (pendingQueue.length > 0) {
        await processQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [processQueue, isClient]);

  // Only show the sync status indicator when processing or when there's a sync status
  if (!isClient || (!isProcessing && !syncStatus)) return null;

  return (
    <div className={styles.queueStatus}>
      <div className={styles.syncIndicator}>
        {isProcessing ? (
          <>
            <div className={styles.spinner} />
            <span>Syncing check-ins...</span>
          </>
        ) : syncStatus === "completed" ? (
          <span className={styles.completed}>✓ Sync completed</span>
        ) : syncStatus === "error" ? (
          <span className={styles.error}>✕ Sync failed</span>
        ) : null}
      </div>
    </div>
  );
}
