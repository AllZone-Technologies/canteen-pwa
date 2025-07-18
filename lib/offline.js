// Offline queue management
const OFFLINE_QUEUE_KEY = "offline-checkin-queue";
const LAST_SYNC_KEY = "last-sync-timestamp";
const CACHED_EMPLOYEES_KEY = "cached-employees";

// Queue management
export const queueManager = {
  async addToQueue(checkinData) {
    const queue = await this.getQueue();
    queue.push({
      ...checkinData,
      timestamp: new Date().toISOString(),
      status: "pending",
    });
    await this.saveQueue(queue);
    return queue;
  },

  async getQueue() {
    if (typeof window === "undefined") return [];
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  },

  async saveQueue(queue) {
    if (typeof window === "undefined") return;
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  async clearQueue() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  async updateQueueItem(index, status) {
    const queue = await this.getQueue();
    if (queue[index]) {
      queue[index].status = status;
      await this.saveQueue(queue);
    }
  },
};

// Network status management
export const networkManager = {
  isOnline() {
    return typeof window !== "undefined" && navigator.onLine;
  },

  addOnlineListener(callback) {
    if (typeof window === "undefined") return;
    window.addEventListener("online", callback);
  },

  addOfflineListener(callback) {
    if (typeof window === "undefined") return;
    window.addEventListener("offline", callback);
  },

  removeOnlineListener(callback) {
    if (typeof window === "undefined") return;
    window.removeEventListener("online", callback);
  },

  removeOfflineListener(callback) {
    if (typeof window === "undefined") return;
    window.removeEventListener("offline", callback);
  },
};

// Data caching
export const cacheManager = {
  async cacheEmployees(employees) {
    if (typeof window === "undefined") return;
    localStorage.setItem(CACHED_EMPLOYEES_KEY, JSON.stringify(employees));
    await this.updateLastSync();
  },

  async getCachedEmployees() {
    if (typeof window === "undefined") return [];
    const employees = localStorage.getItem(CACHED_EMPLOYEES_KEY);
    return employees ? JSON.parse(employees) : [];
  },

  async updateLastSync() {
    if (typeof window === "undefined") return;
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  },

  getLastSync() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  },
};

// API wrapper with offline support
export const api = {
  async checkin(data) {
    try {
      if (!networkManager.isOnline()) {
        await queueManager.addToQueue(data);
        return {
          status: "queued",
          message: "Check-in queued for processing when online",
        };
      }

      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return {
        status: response.ok ? "success" : "error",
        data: result,
      };
    } catch (error) {
      if (!networkManager.isOnline()) {
        await queueManager.addToQueue(data);
        return {
          status: "queued",
          message: "Check-in queued for processing when online",
        };
      }
      throw error;
    }
  },

  async searchEmployees(searchQuery) {
    try {
      if (!networkManager.isOnline()) {
        const cachedEmployees = await cacheManager.getCachedEmployees();
        const filteredEmployees = cachedEmployees.filter((emp) => {
          const queryLower = searchQuery.toLowerCase();
          return (
            emp.firstname.toLowerCase().includes(queryLower) ||
            emp.lastname.toLowerCase().includes(queryLower) ||
            emp.employee_id.toLowerCase().includes(queryLower) ||
            emp.department.toLowerCase().includes(queryLower)
          );
        });
        return {
          status: "offline",
          data: filteredEmployees,
        };
      }

      const response = await fetch(
        `/api/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (response.ok) {
        await cacheManager.cacheEmployees(data);
      }

      const filteredEmployees = data.filter((emp) => {
        const queryLower = searchQuery.toLowerCase();
        return (
          emp.firstname.toLowerCase().includes(queryLower) ||
          emp.lastname.toLowerCase().includes(queryLower) ||
          emp.employee_id.toLowerCase().includes(queryLower) ||
          emp.department.toLowerCase().includes(queryLower)
        );
      });

      return {
        status: response.ok ? "success" : "error",
        data: filteredEmployees,
      };
    } catch (error) {
      if (!networkManager.isOnline()) {
        const cachedEmployees = await cacheManager.getCachedEmployees();
        const filteredEmployees = cachedEmployees.filter((emp) => {
          const queryLower = searchQuery.toLowerCase();
          return (
            emp.firstname.toLowerCase().includes(queryLower) ||
            emp.lastname.toLowerCase().includes(queryLower) ||
            emp.employee_id.toLowerCase().includes(queryLower) ||
            emp.department.toLowerCase().includes(queryLower)
          );
        });
        return {
          status: "offline",
          data: filteredEmployees,
        };
      }
      throw error;
    }
  },
};
