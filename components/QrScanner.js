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
    const shouldRestartRef = useRef(false);
    const isIOSRef = useRef(false);

    // Mark as client-side on mount and detect iOS
    useEffect(() => {
      setIsClient(true);
      // Detect iOS device for camera permission preservation
      isIOSRef.current =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      console.log("Device detected as iOS:", isIOSRef.current);

      // On iOS, preserve camera permissions by not clearing DOM elements
      if (isIOSRef.current) {
        console.log(
          "iOS device detected - enabling camera permission preservation"
        );
      }
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
          // Don't clear the DOM element on iOS to preserve camera permissions
          if (!isIOSRef.current) {
            const readerElement = document.getElementById("reader");
            if (readerElement) {
              readerElement.innerHTML = "";
            }
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

          // Don't pause the scanner - just let it continue running
          // This prevents the "paused" message from appearing
          console.log("Processing scan while scanner continues running");

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

          // Note: Scanner continues running - no need to pause/resume
        } catch (error) {
          console.error("Error checking check-in status:", error);
          setIsProcessing(false);
          isScanningRef.current = false;
          showMessage("An error occurred. Please try again.", "error");
        }
      },
      [isProcessing, setIsProcessing, onScanSuccess, showMessage]
    );

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      stop: async () => {
        console.log("Stop method called via ref");
        await stopScanner();
      },
      restart: async () => {
        console.log("Restart method called via ref");
        shouldRestartRef.current = true;
        await stopScanner();

        // Wait for cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force re-initialization if active
        if (isActive && isClient) {
          console.log("Forcing scanner re-initialization");
          shouldRestartRef.current = false;
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
        isIOS: isIOSRef.current,
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

        // On iOS, try to reuse existing scanner if possible
        if (isIOSRef.current && scannerRef.current) {
          try {
            // Check if scanner is still working
            const isRunning = await scannerRef.current.isScanning();
            if (isRunning) {
              console.log(
                "Reusing existing iOS scanner - no need to reinitialize"
              );
              setIsInitialized(true);
              isScanningRef.current = false;
              initializationInProgressRef.current = false;
              return;
            }
          } catch (error) {
            console.log("Existing scanner not working, creating new one");
          }
        }

        // Only clear existing scanner if we're not already initialized
        if (scannerRef.current) {
          console.log("Cleaning up existing scanner before creating new one");
          await stopScanner();
          // Wait for cleanup to complete
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Clear the DOM element completely (except on iOS)
        if (!isIOSRef.current) {
          readerElement.innerHTML = "";
        }

        // Create new scanner
        console.log("Creating new scanner instance");
        scannerRef.current = new ScannerConstructor("reader");

        const config = {
          fps: 10,
          qrbox: { width: 400, height: 400 },
          aspectRatio: 1,
          // iOS-specific optimizations
          ...(isIOSRef.current && {
            disableFlip: false,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: false,
            },
          }),
        };

        await scannerRef.current.start(
          { facingMode: "user" },
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
    }, [
      handleScanSuccess,
      isActive,
      isClient,
      stopScanner,
      onScanError,
      showMessage,
    ]);

    // Initialize scanner when active
    useEffect(() => {
      console.log("Scanner effect running", {
        isActive,
        isClient,
        isInitialized,
        isIOS: isIOSRef.current,
      });

      if (
        isActive &&
        isClient &&
        !isInitialized &&
        !initializationInProgressRef.current &&
        !scannerRef.current // Only initialize if no scanner exists
      ) {
        // Add a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          initializeScanner();
        }, 300);
        return () => clearTimeout(timer);
      } else if (!isActive && isInitialized) {
        stopScanner();
      }

      return () => {
        console.log("Scanner cleanup running");
        // Only cleanup on unmount, not on every effect run
        if (!isActive) {
          stopScanner();
        }
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
