const EMPLOYEES_CACHE_KEY = "canteen_employees_cache";
const CHECKIN_HISTORY_KEY = "canteen_checkin_history";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CHECKIN_RESTRICTION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

class CacheManager {
  constructor() {
    this.employees = [];
    this.checkinHistory = [];
    this.loadCache();
  }

  async loadCache() {
    try {
      // Load employees cache
      const storedCache = localStorage.getItem(EMPLOYEES_CACHE_KEY);
      if (storedCache) {
        const { data, timestamp } = JSON.parse(storedCache);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          this.employees = data;
        } else {
          this.employees = [];
          await this.saveCache();
        }
      }

      // Load check-in history
      const storedHistory = localStorage.getItem(CHECKIN_HISTORY_KEY);
      if (storedHistory) {
        this.checkinHistory = JSON.parse(storedHistory);
        // Clean up old check-in records
        this.cleanupCheckinHistory();
      }
    } catch (error) {
      console.error("Error loading cache:", error);
      this.employees = [];
      this.checkinHistory = [];
    }
  }

  async saveCache() {
    try {
      const cacheData = {
        data: this.employees,
        timestamp: Date.now(),
      };
      localStorage.setItem(EMPLOYEES_CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(
        CHECKIN_HISTORY_KEY,
        JSON.stringify(this.checkinHistory)
      );
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  }

  cleanupCheckinHistory() {
    const now = Date.now();
    this.checkinHistory = this.checkinHistory.filter(
      (record) =>
        now - new Date(record.timestamp).getTime() < CHECKIN_RESTRICTION
    );
    this.saveCache();
  }

  async addCheckinRecord(employeeId, sourceType) {
    const record = {
      employeeId,
      sourceType,
      timestamp: new Date().toISOString(),
    };
    this.checkinHistory.push(record);
    await this.saveCache();
  }

  isEmployeeCheckedIn(employeeId) {
    const now = new Date();
    return this.checkinHistory.some((record) => {
      const checkinTime = new Date(record.timestamp);
      const timeDiff = now - checkinTime;
      return record.employeeId === employeeId && timeDiff < CHECKIN_RESTRICTION;
    });
  }

  async getEmployeeCheckinStatus(employeeId) {
    const now = new Date();
    const lastCheckin = this.checkinHistory
      .filter((record) => record.employeeId === employeeId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!lastCheckin) {
      return { isCheckedIn: false };
    }

    const checkinTime = new Date(lastCheckin.timestamp);
    const timeDiff = now - checkinTime;
    const isCheckedIn = timeDiff < CHECKIN_RESTRICTION;
    const nextAvailableTime = new Date(
      checkinTime.getTime() + CHECKIN_RESTRICTION
    );

    return {
      isCheckedIn,
      lastCheckinTime: lastCheckin.timestamp,
      nextAvailableTime: nextAvailableTime.toISOString(),
      timeRemaining: isCheckedIn ? CHECKIN_RESTRICTION - timeDiff : 0,
    };
  }

  async cacheEmployees(employees) {
    this.employees = employees;
    await this.saveCache();
  }

  async getCachedEmployees() {
    return this.employees;
  }

  async searchEmployees(query) {
    if (!query) return this.employees;

    const searchTerm = query.toLowerCase();
    return this.employees.filter((employee) => {
      const name = `${employee.firstname} ${employee.lastname}`.toLowerCase();
      const employeeId = employee.employee_id.toString();
      return name.includes(searchTerm) || employeeId.includes(searchTerm);
    });
  }

  async clearCache() {
    this.employees = [];
    this.checkinHistory = [];
    await this.saveCache();
  }

  isCacheValid() {
    try {
      const storedCache = localStorage.getItem(EMPLOYEES_CACHE_KEY);
      if (storedCache) {
        const { timestamp } = JSON.parse(storedCache);
        return Date.now() - timestamp < CACHE_EXPIRY;
      }
      return false;
    } catch (error) {
      console.error("Error checking cache validity:", error);
      return false;
    }
  }
}

export const cacheManager = new CacheManager();
