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
    const initializationInProgressRef = useRef(false);
    const cleanupInProgressRef = useRef(false);

    // Mark as client-side on mount
    useEffect(() => {
      setIsClient(true);
    }, []);

    const stopScanner = useCallback(async () => {
      if (cleanupInProgressRef.current) {
        console.log("Cleanup already in progress, skipping...");
        return;
      }

      if (scannerRef.current) {
        cleanupInProgressRef.current = true;
        try {
          console.log("Stopping scanner...");
          await scannerRef.current.stop();
          console.log("Scanner stopped successfully");
        } catch (error) {
          console.warn("Error stopping scanner:", error);
        } finally {
          // Clear the DOM element
          const readerElement = document.getElementById("reader");
          if (readerElement) {
            readerElement.innerHTML = "";
          }

          scannerRef.current = null;
          setIsInitialized(false);
          isScanningRef.current = false;
          cleanupInProgressRef.current = false;
        }
      }
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
          await stopScanner();

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
        }
      },
      [isProcessing, setIsProcessing, onScanSuccess, showMessage, stopScanner]
    );

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      stop: async () => {
        console.log("Stop method called via ref");
        await stopScanner();
      },
      restart: async () => {
        console.log("Restart method called via ref");
        await stopScanner();

        // Wait for cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force re-initialization if active
        if (isActive && isClient) {
          console.log("Forcing scanner re-initialization");
          initializeScanner();
        }
      },
    }));

    const onScanError = useCallback((error) => {
      // Only log actual errors, not timeouts
      if (error?.includes?.("timeout")) return;
      console.warn(`QR Code scan error: ${error}`);
    }, []);

    const initializeScanner = useCallback(async () => {
      console.log("initializeScanner called", {
        isActive,
        isInitialized,
        isProcessing,
        isScanning: isScanningRef.current,
        initializationInProgress: initializationInProgressRef.current,
      });

      // Prevent multiple simultaneous initializations
      if (initializationInProgressRef.current) {
        console.log("Initialization already in progress, skipping...");
        return;
      }

      // Basic checks
      if (!isActive || !isClient) {
        console.log("Skipping initialization - not active or not client");
        return;
      }

      // Ensure we are on the client side
      if (typeof window === "undefined") {
        console.log("Skipping scanner initialization on server");
        return;
      }

      initializationInProgressRef.current = true;

      try {
        // Import scanner library
        const html5qrcode = await import("html5-qrcode");
        const ScannerConstructor = html5qrcode.Html5Qrcode;

        if (!ScannerConstructor) {
          console.error("Html5Qrcode constructor not found");
          return;
        }

        // Check for reader element
        const readerElement = document.getElementById("reader");
        if (!readerElement) {
          console.log("Reader element not found");
          return;
        }

        // Clear existing scanner and DOM
        await stopScanner();

        // Clear the DOM element completely
        readerElement.innerHTML = "";

        // Wait for cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Create new scanner
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
        // Show user-friendly error message
        showMessage(
          "Failed to initialize camera. Please refresh the page.",
          "error"
        );
      } finally {
        initializationInProgressRef.current = false;
      }
    }, [handleScanSuccess, isActive, isClient, stopScanner, onScanError]);

    // Initialize scanner when active
    useEffect(() => {
      console.log("Scanner effect running", {
        isActive,
        isClient,
        isInitialized,
      });

      if (isActive && isClient && !isInitialized) {
        // Add a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          initializeScanner();
        }, 300);
        return () => clearTimeout(timer);
      } else if (!isActive) {
        stopScanner();
      }

      return () => {
        console.log("Scanner cleanup running");
        stopScanner();
      };
    }, [isActive, isClient, initializeScanner, stopScanner, isInitialized]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        console.log("Component unmounting, cleaning up scanner");
        stopScanner();
      };
    }, [stopScanner]);

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
