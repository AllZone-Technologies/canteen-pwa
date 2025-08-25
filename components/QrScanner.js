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
    const lastScannedCodeRef = useRef("");
    const scanCooldownRef = useRef(false);
    const lastScanTimeRef = useRef(0);

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
        const now = Date.now();

        // Prevent duplicate scans of the same code within a very short time (500ms)
        // This allows re-scanning for testing after a brief delay
        if (
          lastScannedCodeRef.current === decodedText &&
          now - lastScanTimeRef.current < 500
        ) {
          console.log(
            "Duplicate QR code scanned too quickly, ignoring:",
            decodedText
          );
          return;
        }

        // Prevent rapid re-scanning (minimum 1 second cooldown for same code)
        if (
          lastScannedCodeRef.current === decodedText &&
          now - lastScanTimeRef.current < 1000
        ) {
          console.log("Same QR code scanned too soon, ignoring:", decodedText);
          return;
        }

        // Prevent processing if already processing or scanning
        if (isProcessing || isScanningRef.current || scanCooldownRef.current) {
          console.log(
            "Scan ignored - already processing, scanning, or in cooldown"
          );
          return;
        }

        try {
          console.log("Processing QR scan:", decodedText);
          console.log("Current scanner state:", {
            lastScannedCode: lastScannedCodeRef.current,
            lastScanTime: lastScanTimeRef.current,
            scanCooldown: scanCooldownRef.current,
            isScanning: isScanningRef.current,
            isProcessing: isProcessing,
          });

          isScanningRef.current = true;
          scanCooldownRef.current = true;
          lastScanTimeRef.current = now;
          lastScannedCodeRef.current = decodedText;
          setIsProcessing(true);

          // Show immediate feedback
          showMessage("Processing QR code...", "info");

          // Add a small delay to prevent race conditions
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Make the check-in API call directly
          console.log("Making check-in API call for:", decodedText);
          const checkinResponse = await fetch("/api/checkin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              qrCodeData: decodedText,
              sourceType: "QR",
              checkOnly: false,
            }),
          });

          const checkinData = await checkinResponse.json();
          console.log("Check-in response status:", checkinResponse.status);
          console.log("Check-in response data:", checkinData);

          if (checkinResponse.ok && checkinData.success) {
            // Success - show success message
            const successMsg = checkinData.message || "Check-in successful!";
            console.log("=== CHECK-IN SUCCESS ===");
            console.log("Success message:", successMsg);
            console.log("Response data:", checkinData);
            showMessage(successMsg, "success");
            console.log("Success message displayed via showMessage");

            // Add a delay to ensure the success message is visible
            console.log("Waiting 1 second to ensure message visibility...");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Call onScanSuccess for any additional handling
            console.log("Calling onScanSuccess callback");
            onScanSuccess(decodedText);
            console.log("=== END CHECK-IN SUCCESS ===");

            // Shorter cooldown for success to allow testing
            setTimeout(() => {
              scanCooldownRef.current = false;
              console.log(
                "Scanner cooldown ended after success, ready for new scans"
              );
            }, 1500); // 1.5 second cooldown after success
          } else {
            // Handle error cases
            console.log("Check-in failed, handling error case...");
            console.log("Response status:", checkinResponse.status);
            console.log("Response data:", checkinData);

            let errorMsg = "Check-in failed";

            // Check for restriction error (already checked in)
            if (checkinData.isRestricted) {
              errorMsg =
                checkinData.message ||
                "Already checked in within the last hour";
              console.log("Showing restriction error:", errorMsg);
            }
            // Check for "Please wait" message (time restriction)
            else if (
              checkinData.message &&
              checkinData.message.includes("Please wait")
            ) {
              errorMsg = checkinData.message;
              console.log("Showing time restriction error:", errorMsg);
            }
            // Check for other error messages
            else if (checkinData.message) {
              errorMsg = checkinData.message;
              console.log("Showing general error:", errorMsg);
            }
            // Check for HTTP error status
            else if (!checkinResponse.ok) {
              errorMsg = `Check-in failed (${checkinResponse.status})`;
              console.log("Showing HTTP error:", errorMsg);
            }

            console.log("Displaying error message:", errorMsg);

            // Add a small delay to ensure the error message is not overridden
            await new Promise((resolve) => setTimeout(resolve, 100));
            console.log("About to call showMessage with error:", errorMsg);
            showMessage(errorMsg, "error");
            console.log("showMessage called for error");

            // Add a delay to ensure error message is visible
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Shorter cooldown for errors to allow retrying
            setTimeout(() => {
              scanCooldownRef.current = false;
              console.log(
                "Scanner cooldown ended after error, ready for new scans"
              );
            }, 1000); // 1 second cooldown after error
          }
        } catch (error) {
          console.error("Error during check-in:", error);
          const errorMsg = "Check-in failed. Please try again.";
          console.log("Showing catch block error message:", errorMsg);
          showMessage(errorMsg, "error");

          // Add a delay to ensure error message is visible
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Shorter cooldown for catch errors
          setTimeout(() => {
            scanCooldownRef.current = false;
            console.log(
              "Scanner cooldown ended after catch error, ready for new scans"
            );
          }, 1000); // 1 second cooldown after catch error
        } finally {
          // Always reset processing state
          setIsProcessing(false);
          isScanningRef.current = false;

          // Note: cooldown is now handled in the success/error blocks above
          // to provide different cooldown periods based on the outcome
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
      reset: () => {
        console.log("Reset method called via ref - clearing scanner state");
        lastScannedCodeRef.current = "";
        lastScanTimeRef.current = 0;
        scanCooldownRef.current = false;
        isScanningRef.current = false;
        console.log("Scanner state reset complete");
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

        // Reset scanner state when initializing
        lastScannedCodeRef.current = "";
        lastScanTimeRef.current = 0;
        scanCooldownRef.current = false;
        isScanningRef.current = false;

        const config = {
          fps: 10, // Reduced FPS to prevent rapid scanning
          qrbox: { width: 300, height: 300 }, // Smaller QR box for faster detection
          aspectRatio: 1,
          // Improved configuration for better performance
          disableFlip: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true, // Enable barcode detector if available
          },
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

        // Show success message
        showMessage("QR Scanner ready! Point camera at QR code", "success");
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
        {!isInitialized && (
          <p className={styles.statusMessage}>Initializing camera...</p>
        )}
      </div>
    );
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;
