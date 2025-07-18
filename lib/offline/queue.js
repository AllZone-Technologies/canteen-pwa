const QUEUE_STORAGE_KEY = "canteen_checkin_queue";

class QueueManager {
  constructor() {
    this.queue = [];
    this.loadQueue();
  }

  async loadQueue() {
    try {
      const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (storedQueue) {
        const parsedQueue = JSON.parse(storedQueue);
        // Clean up any invalid or expired items
        this.queue = parsedQueue.filter((item) => {
          if (!item.id || !item.timestamp) return false;
          // Remove items older than 24 hours
          const itemTime = new Date(item.timestamp).getTime();
          const now = Date.now();
          return now - itemTime < 24 * 60 * 60 * 1000;
        });
        await this.saveQueue();
      }
    } catch (error) {
      console.error("Error loading queue:", error);
      this.queue = [];
      await this.saveQueue();
    }
  }

  async saveQueue() {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Error saving queue:", error);
    }
  }

  async addToQueue(checkinData) {
    // Check if this exact check-in is already in the queue
    const isDuplicate = this.queue.some(
      (item) =>
        item.employeeId === checkinData.employeeId &&
        item.qrCode === checkinData.qrCode &&
        new Date().getTime() - new Date(item.timestamp).getTime() < 60000 // Within last minute
    );

    if (isDuplicate) {
      console.log("Duplicate check-in detected, skipping");
      return;
    }

    this.queue.push({
      ...checkinData,
      id: checkinData.id || Date.now().toString(),
      status: "pending",
    });
    await this.saveQueue();
  }

  async removeFromQueue(checkinData) {
    this.queue = this.queue.filter((item) => item.id !== checkinData.id);
    await this.saveQueue();
  }

  async updateQueueItemStatus(id, status, error = null) {
    const item = this.queue.find((item) => item.id === id);
    if (item) {
      item.status = status;
      if (error) {
        item.error = error;
      }
      await this.saveQueue();
    }
  }

  async getQueue() {
    // Clean up the queue before returning
    await this.loadQueue();
    return this.queue;
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
  }

  async getPendingItems() {
    return this.queue.filter((item) => item.status === "pending");
  }

  async getCompletedItems() {
    return this.queue.filter((item) => item.status === "completed");
  }

  async getFailedItems() {
    return this.queue.filter((item) => item.status === "failed");
  }

  async cleanupQueue() {
    const now = Date.now();
    this.queue = this.queue.filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      return now - itemTime < 24 * 60 * 60 * 1000; // Keep only last 24 hours
    });
    await this.saveQueue();
  }
}

export const queueManager = new QueueManager();
