import {
  useEffect,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import dynamic from "next/dynamic";
import { api } from "../lib/offline";
import styles from "../styles/QrScanner.module.css";
import { toast } from "react-hot-toast";

const Html5QrcodeScanner = dynamic(
  () =>
    import("html5-qrcode").then((mod) => mod.default || mod.Html5QrcodeScanner),
  { ssr: false }
);

const QrScanner = forwardRef(
  (
    {
      onScanSuccess,
      showMessage,
      isProcessing,
      setIsProcessing,
      isActive = true,
    },
    ref
  ) => {
    const scannerRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const isScanningRef = useRef(false);
    const restartScannerRef = useRef(null);

    // Mark as client-side on mount
    useEffect(() => {
      setIsClient(true);
    }, []);

    const handleScanSuccess = useCallback(
      async (decodedText) => {
        if (isProcessing || isScanningRef.current) {
          console.log("Scan ignored - already processing or scanning");
          return;
        }

        try {
          console.log("Processing QR scan:", decodedText);
          isScanningRef.current = true;
          setIsProcessing(true);

          // Stop the scanner immediately to prevent multiple scans
          console.log("Stopping scanner after successful scan");
          stopScanner();

          // Check if employee is already checked in
          const response = await fetch("/api/checkin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ qrCodeData: decodedText, checkOnly: true }),
          });

          console.log("Check-in response status:", response.status);
          const data = await response.json();
          console.log("Check-in response data:", data);

          if (data.alreadyCheckedIn) {
            showMessage(`${data.employeeId} already checked in`, "error");
            setIsProcessing(false);
            isScanningRef.current = false;

            // Ensure scanner is completely stopped before restarting
            stopScanner();

            // Wait longer for cleanup and then restart scanner
            setTimeout(() => {
              if (isActive && restartScannerRef.current) {
                console.log(
                  "Restarting scanner after already checked in message"
                );
                restartScannerRef.current();
              }
            }, 500); // Increased delay to ensure proper cleanup
            return;
          }

          // If not already checked in, proceed with normal check-in
          console.log("Proceeding with normal check-in");
          onScanSuccess(decodedText);
        } catch (error) {
          console.error("Error checking check-in status:", error);
          setIsProcessing(false);
          isScanningRef.current = false;
          showMessage("An error occurred. Please try again.", "error");

          // Ensure scanner is completely stopped before restarting
          stopScanner();

          // Wait longer for cleanup and then restart scanner
          setTimeout(() => {
            if (isActive && restartScannerRef.current) {
              console.log("Restarting scanner after error");
              restartScannerRef.current();
            }
          }, 500); // Increased delay to ensure proper cleanup
        }
      },
      [isProcessing, setIsProcessing, onScanSuccess, showMessage, isActive]
    );

    const stopScanner = useCallback(() => {
      if (scannerRef.current) {
        try {
          console.log("Stopping scanner...");
          // Stop the scanner properly
          scannerRef.current
            .stop()
            .then(() => {
              console.log("Scanner stopped successfully");
              // Clear the scanner reference after successful stop
              scannerRef.current = null;
              setIsInitialized(false);
            })
            .catch((error) => {
              console.warn("Error stopping scanner:", error);
              // Force cleanup even if stop fails
              scannerRef.current = null;
              setIsInitialized(false);
            });
          // Clear the DOM element
          const readerElement = document.getElementById("reader");
          if (readerElement) {
            readerElement.innerHTML = "";
          }
        } catch (error) {
          console.warn("Error stopping scanner:", error);
          // Force cleanup even if stop fails
          scannerRef.current = null;
          setIsInitialized(false);
        }
      }
    }, []);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      stop: () => {
        console.log("Stop method called via ref");
        stopScanner();
        isScanningRef.current = false;
      },
      restart: async () => {
        console.log("Restart method called via ref");
        // Force stop and reset all state
        stopScanner();
        setIsInitialized(false);
        isScanningRef.current = false;

        // Clear the DOM element
        const readerElement = document.getElementById("reader");
        if (readerElement) {
          readerElement.innerHTML = "";
        }

        // Wait for cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Force re-initialization if active
        if (isActive && isClient) {
          console.log("Forcing scanner re-initialization");
          initializeScanner();
        }
      },
    }));

    const initializeScanner = useCallback(async () => {
      console.log("initializeScanner called", {
        isActive,
        isInitialized,
        isProcessing,
        isScanning: isScanningRef.current,
      });

      // Basic checks - remove isProcessing check to allow restart during processing
      if (!isActive || !isClient) {
        console.log("Skipping initialization - not active or not client");
        return;
      }

      // Ensure we are on the client side
      if (typeof window === "undefined") {
        console.log("Skipping scanner initialization on server");
        return;
      }

      // Import scanner library
      let ScannerConstructor;
      try {
        const html5qrcode = await import("html5-qrcode");
        ScannerConstructor = html5qrcode.Html5Qrcode;

        if (!ScannerConstructor) {
          console.error("Html5Qrcode constructor not found");
          return;
        }
      } catch (error) {
        console.error("Error importing html5-qrcode:", error);
        return;
      }

      // Check for reader element
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        console.log("Reader element not found");
        return;
      }

      // Clear existing scanner and DOM
      stopScanner();

      // Clear the DOM element completely
      readerElement.innerHTML = "";

      // Wait a bit for cleanup
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Reset scanning state
      isScanningRef.current = false;

      // Create new scanner
      try {
        console.log("Creating new scanner instance");
        scannerRef.current = new ScannerConstructor("reader");

        const config = {
          fps: 10,
          qrbox: { width: 400, height: 400 },
          aspectRatio: 1,
        };

        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          handleScanSuccess,
          onScanError
        );

        setIsInitialized(true);
        isScanningRef.current = false;
        console.log("Scanner initialized successfully");
      } catch (error) {
        console.error("Error initializing scanner:", error);
        // Reset state on error
        setIsInitialized(false);
        isScanningRef.current = false;
        scannerRef.current = null;
      }
    }, [handleScanSuccess, isActive, isClient, stopScanner]);

    // Store initializeScanner in ref for access from handleScanSuccess
    useEffect(() => {
      restartScannerRef.current = initializeScanner;
    }, [initializeScanner]);

    const onScanError = useCallback((error) => {
      // Only log actual errors, not timeouts
      if (error?.includes?.("timeout")) return;
      console.warn(`QR Code scan error: ${error}`);
    }, []);

    const handleScan = useCallback(
      (result) => {
        if (result && !isInitialized) {
          onScanSuccess(result);
        }
      },
      [onScanSuccess, isInitialized]
    );

    const handleError = useCallback(
      (error) => {
        console.error("QR Scanner error:", error);
        onScanError(error);
      },
      [onScanError]
    );

    // Initialize scanner when active
    useEffect(() => {
      console.log("Scanner effect running", {
        isActive,
        isClient,
        isInitialized,
      });

      if (isActive && isClient) {
        // Add a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          initializeScanner();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        stopScanner();
      }

      return () => {
        console.log("Scanner cleanup running");
        stopScanner();
      };
    }, [isActive, isClient, initializeScanner, stopScanner]);

    if (!isActive || !isClient) {
      console.log("Not rendering scanner - not active or not client");
      return null;
    }

    return (
      <div className={styles.scannerContainer}>
        <div className={styles.cameraFrame}>
          <div id="reader"></div>
          <div className={styles.frameOverlay}>
            <span></span>
          </div>
        </div>
        <p className={styles.instruction}>
          Align your QR code within the frame
        </p>
      </div>
    );
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;
