const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const { Client } = require("ssh2");

const execAsync = promisify(exec);

class NetworkFileService {
  constructor() {
    this.remoteHost = "192.168.1.124";
    this.remotePath = "/shares/canteen";
    this.localTempPath = path.join(process.cwd(), "temp");
    // SSH credentials - you can set these via environment variables
    this.sshConfig = {
      host: this.remoteHost,
      username: process.env.SSH_USERNAME || "your_username",
      password: process.env.SSH_PASSWORD || "your_password",
      // Or use key-based authentication:
      // privateKey: require('fs').readFileSync('/path/to/private/key')
    };
  }

  async ensureLocalTempDir() {
    try {
      await fs.mkdir(this.localTempPath, { recursive: true });
    } catch (error) {
      console.error("Error creating temp directory:", error);
    }
  }

  async testNetworkConnection() {
    return new Promise((resolve) => {
      const conn = new Client();

      conn.on("ready", () => {
        console.log("SSH connection established");
        conn.end();
        resolve(true);
      });

      conn.on("error", (err) => {
        console.error("SSH connection failed:", err.message);
        console.log("Falling back to local storage...");
        resolve(false);
      });

      conn.connect(this.sshConfig);
    });
  }

  async uploadFileViaSFTP(localFilePath, filename) {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) {
            reject(err);
            return;
          }

          const remoteFilePath = `${this.remotePath}/${filename}`;

          sftp.fastPut(localFilePath, remoteFilePath, (err) => {
            conn.end();
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });

      conn.on("error", (err) => {
        reject(err);
      });

      conn.connect(this.sshConfig);
    });
  }

  async saveFileToNetwork(fileContent, filename) {
    try {
      await this.ensureLocalTempDir();

      // First save to local temp directory
      const localFilePath = path.join(this.localTempPath, filename);
      await fs.writeFile(localFilePath, fileContent, "utf8");

      // Test network connection
      const networkConnected = await this.testNetworkConnection();

      if (networkConnected) {
        // Try to save to remote server using SFTP
        await this.uploadFileViaSFTP(localFilePath, filename);
        console.log(
          `File ${filename} saved successfully to remote server: ${this.remoteHost}${this.remotePath}`
        );
      } else {
        // Network not accessible: Save to local output folder
        const localOutputPath = path.join(process.cwd(), "output", filename);
        await fs.mkdir(path.dirname(localOutputPath), { recursive: true });
        await fs.copyFile(localFilePath, localOutputPath);

        console.log(
          `File ${filename} saved to local output folder (network not accessible)`
        );
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
