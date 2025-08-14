import { networkManager } from "./network";
import { queueManager } from "./queue";
import { cacheManager } from "./cache";

class OfflineAPI {
  constructor() {
    this.baseUrl = "/api";
    this.processingCheckins = new Set();
  }

  async checkin({ qrCode, employeeId, contractorId, sourceType, guestCount }) {
    // Generate a unique key for this check-in attempt
    const checkinKey = `${employeeId || contractorId || qrCode}-${Date.now()}`;

    // Check if this check-in is already being processed
    if (this.processingCheckins.has(checkinKey)) {
      return {
        status: "error",
        data: {
          error: "This check-in is already being processed",
        },
      };
    }

    // For both QR and manual checkins, check server-side status first
    let serverCheckRequired = false;
    let checkPayload = {};

    if (qrCode) {
      checkPayload = { qrCodeData: qrCode, checkOnly: true };
      serverCheckRequired = true;
    } else if (employeeId) {
      checkPayload = { employeeId: employeeId, checkOnly: true };
      serverCheckRequired = true;
    } else if (contractorId) {
      checkPayload = { contractorId: contractorId, checkOnly: true };
      serverCheckRequired = true;
    }

    // Always check server-side status first if we're online
    if (serverCheckRequired && networkManager.isOnline()) {
      try {
        console.log("Checking server-side checkin status before proceeding...");

        const response = await fetch(`${this.baseUrl}/checkin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(checkPayload),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.alreadyCheckedIn) {
            console.log("Server check shows already checked in:", data);
            return {
              status: "error",
              data: {
                isRestricted: true,
                error:
                  data.message ||
                  `${data.employeeId} already checked in within the last hour`,
              },
            };
          } else {
            console.log("Server check shows not checked in, proceeding...");
          }
        } else {
          console.log("Server check failed with status:", response.status);
          const errorData = await response.json();

          // If server check fails but shows restriction, return that
          if (errorData.message && errorData.message.includes("Please wait")) {
            return {
              status: "error",
              data: {
                isRestricted: true,
                error: errorData.message,
              },
            };
          }
        }
      } catch (error) {
        console.warn(
          "Could not check server status, proceeding with checkin:",
          error
        );
      }
    }

    // Only check local cache if server check failed or we're offline
    if (employeeId && !networkManager.isOnline()) {
      const checkinStatus = await cacheManager.getEmployeeCheckinStatus(
        employeeId
      );
      if (checkinStatus.isCheckedIn) {
        const nextAvailable = new Date(checkinStatus.nextAvailableTime);
        const timeRemaining = Math.ceil(
          (nextAvailable - new Date()) / (60 * 1000)
        );
        return {
          status: "error",
          data: {
            isRestricted: true,
            error: `Already checked in. Please try again after ${timeRemaining} minutes.`,
          },
        };
      }
    }

    if (!networkManager.isOnline()) {
      // Queue the check-in for later
      const checkinData = {
        qrCode,
        employeeId,
        contractorId,
        sourceType,
        guestCount,
        timestamp: new Date().toISOString(),
        id: checkinKey,
      };
      await queueManager.addToQueue(checkinData);

      // Add to local check-in history
      if (employeeId) {
        await cacheManager.addCheckinRecord(employeeId, sourceType);
      }

      return {
        status: "queued",
        message: "Check-in queued for processing when online",
      };
    }

    try {
      this.processingCheckins.add(checkinKey);

      const response = await fetch(`${this.baseUrl}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode,
          employeeId,
          contractorId,
          sourceType,
          guestCount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle different error response formats
        const errorMessage =
          result.message || result.error || "Check-in failed";

        // Check if this is an "already checked in" response
        if (result.message && result.message.includes("Please wait")) {
          console.log(
            "Returning restricted error for manual checkin:",
            errorMessage
          );
          return {
            status: "error",
            data: {
              isRestricted: true,
              error: errorMessage,
            },
          };
        }

        console.log(
          "Returning general error for manual checkin:",
          errorMessage
        );
        return {
          status: "error",
          data: {
            error: errorMessage,
            isRestricted: false,
          },
        };
      }

      // Handle successful response
      if (result.success) {
        // Add successful check-in to local history
        if (employeeId) {
          await cacheManager.addCheckinRecord(employeeId, sourceType);
        }

        return {
          status: "success",
          data: result,
        };
      } else {
        // Handle other response formats
        return {
          status: "error",
          data: {
            error: result.message || "Check-in failed",
          },
        };
      }
    } catch (error) {
      // If the request fails, queue it for later
      const checkinData = {
        qrCode,
        employeeId,
        contractorId,
        sourceType,
        guestCount,
        timestamp: new Date().toISOString(),
        id: checkinKey,
      };
      await queueManager.addToQueue(checkinData);

      // Add to local check-in history
      if (employeeId) {
        await cacheManager.addCheckinRecord(employeeId, sourceType);
      }

      return {
        status: "queued",
        message: "Check-in queued for processing when online",
      };
    } finally {
      this.processingCheckins.delete(checkinKey);
    }
  }

  async searchEmployees(query) {
    if (!networkManager.isOnline()) {
      // Try to get results from cache
      const cachedResults = await cacheManager.searchEmployees(query);
      return {
        status: "offline",
        data: cachedResults,
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Search failed");
      }

      const data = await response.json();

      // Cache the results for offline use
      await cacheManager.cacheEmployees(data);

      return {
        status: "online",
        data,
      };
    } catch (error) {
      // If the request fails, try to get results from cache
      const cachedResults = await cacheManager.searchEmployees(query);
      return {
        status: "offline",
        data: cachedResults,
      };
    }
  }

  async syncQueue() {
    if (!networkManager.isOnline()) {
      return {
        status: "offline",
        message: "Cannot sync while offline",
      };
    }

    const queue = await queueManager.getQueue();
    const results = [];
    const processedIds = new Set();

    for (const item of queue) {
      // Skip if already processed in this sync
      if (processedIds.has(item.id)) {
        continue;
      }

      try {
        const response = await this.checkin(item);
        processedIds.add(item.id);

        if (response.status === "success") {
          await queueManager.removeFromQueue(item);
          results.push({
            status: "success",
            item,
          });
        } else if (response.status === "error" && response.data?.isRestricted) {
          // If check-in is restricted, remove from queue as it's already processed
          await queueManager.removeFromQueue(item);
          results.push({
            status: "skipped",
            item,
            reason: "Already checked in",
          });
        } else {
          results.push({
            status: "failed",
            item,
            error: response.data?.error || "Check-in failed",
          });
        }
      } catch (error) {
        results.push({
          status: "failed",
          item,
          error: error.message,
        });
      }
    }

    return {
      status: "completed",
      results,
    };
  }
}

export const api = new OfflineAPI();
