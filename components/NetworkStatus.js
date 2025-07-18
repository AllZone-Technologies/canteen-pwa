import { useEffect, useState } from "react";
import { networkManager } from "../lib/offline";
import styles from "../styles/NetworkStatus.module.css";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true); // Default to true for SSR
  const [showBanner, setShowBanner] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);

    // Set initial state
    const updateNetworkStatus = () => {
      const online = networkManager.isOnline();
      setIsOnline(online);
      setShowBanner(true);
      if (online) {
        setTimeout(() => setShowBanner(false), 3000);
      }
    };

    // Set initial state
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  // Don't render anything until client-side
  if (!isClient) {
    return (
      <div className={styles.statusIndicator}>
        <span className={styles.dot} />
        Online
      </div>
    );
  }

  return (
    <>
      <div
        className={`${styles.statusIndicator} ${
          !isOnline ? styles.offline : ""
        }`}
      >
        <span className={styles.dot} />
        {isOnline ? "Online" : "Offline"}
      </div>

      {showBanner && (
        <div
          className={`${styles.banner} ${
            isOnline ? styles.online : styles.offline
          }`}
        >
          {isOnline
            ? "Back online! Syncing data..."
            : "You are offline. Changes will be synced when online."}
        </div>
      )}
    </>
  );
}
