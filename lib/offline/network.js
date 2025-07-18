class NetworkManager {
  constructor() {
    this._isOnline = typeof window !== "undefined" ? navigator.onLine : true;
  }

  isOnline() {
    return this._isOnline;
  }

  updateStatus() {
    this._isOnline = navigator.onLine;
  }

  addOnlineListener(callback) {
    if (typeof window === "undefined") return;
    window.addEventListener("online", () => {
      this.updateStatus();
      callback();
    });
  }

  addOfflineListener(callback) {
    if (typeof window === "undefined") return;
    window.addEventListener("offline", () => {
      this.updateStatus();
      callback();
    });
  }

  removeOnlineListener(callback) {
    if (typeof window === "undefined") return;
    window.removeEventListener("online", callback);
  }

  removeOfflineListener(callback) {
    if (typeof window === "undefined") return;
    window.removeEventListener("offline", callback);
  }
}

export const networkManager = new NetworkManager();
