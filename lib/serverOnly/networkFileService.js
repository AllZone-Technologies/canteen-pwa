const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

class NetworkFileService {
  constructor() {
    this.networkPath = "\\\\192.168.1.155\\Canteen_Report";
    this.localTempPath = path.join(process.cwd(), "temp");
  }

  async ensureLocalTempDir() {
    try {
      await fs.mkdir(this.localTempPath, { recursive: true });
    } catch (error) {
      console.error("Error creating temp directory:", error);
    }
  }

  async testNetworkConnection() {
    try {
      if (process.platform === "win32") {
        await execAsync(`dir "${this.networkPath}"`);
        return true;
      } else {
        // On Mac/Linux, we can't access Windows network paths directly
        // This is for testing only - on Windows server it will work
        console.log(
          "Running on Mac/Linux - network path not accessible for testing"
        );
        return false;
      }
    } catch (error) {
      console.error("Network connection test failed:", error);
      console.log("Falling back to local storage for testing...");
      return false;
    }
  }

  async saveFileToNetwork(fileContent, filename) {
    try {
      await this.ensureLocalTempDir();

      // First save to local temp directory
      const localFilePath = path.join(this.localTempPath, filename);
      await fs.writeFile(localFilePath, fileContent, "utf8");

      // Test network connection
      const networkConnected = await this.testNetworkConnection();

      if (networkConnected && process.platform === "win32") {
        // Windows: Try to save to network location
        const networkFilePath = path.join(this.networkPath, filename);
        await execAsync(`copy "${localFilePath}" "${networkFilePath}"`);
        console.log(
          `File ${filename} saved successfully to network location: ${this.networkPath}`
        );
      } else {
        // Mac/Linux or network not accessible: Save to local output folder
        const localOutputPath = path.join(process.cwd(), "output", filename);
        await fs.mkdir(path.dirname(localOutputPath), { recursive: true });
        await fs.copyFile(localFilePath, localOutputPath);

        if (process.platform === "win32") {
          console.log(
            `File ${filename} saved to local output folder (network not accessible)`
          );
        } else {
          console.log(
            `File ${filename} saved to local output folder (Mac/Linux platform)`
          );
        }
      }

      // Clean up local temp file
      await fs.unlink(localFilePath);

      return true;
    } catch (error) {
      console.error("Error saving file:", error);
      // Even if network save fails, try to save locally
      try {
        const localOutputPath = path.join(process.cwd(), "output", filename);
        await fs.mkdir(path.dirname(localOutputPath), { recursive: true });
        await fs.writeFile(localOutputPath, fileContent, "utf8");
        console.log(
          `File ${filename} saved to local output folder as fallback`
        );
        return true;
      } catch (localError) {
        console.error("Error saving file locally:", localError);
        return false;
      }
    }
  }
}

module.exports = NetworkFileService;
