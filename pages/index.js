import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { api, networkManager, cacheManager } from "../lib/offline";
import NetworkStatus from "../components/NetworkStatus";
import QueueStatus from "../components/QueueStatus";
import CheckInSuccess from "../components/CheckInSuccess";
import ThemeToggle from "../components/ThemeToggle";
import styles from "../styles/Home.module.css";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Image from "next/image";

const QrScanner = dynamic(() => import("../components/QrScanner"), {
  ssr: false,
});

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkedInEmployee, setCheckedInEmployee] = useState(null);
  const [entityType, setEntityType] = useState("employee");
  const [guestCounts, setGuestCounts] = useState({});
  const messageTimeoutRef = useRef(null);
  const router = useRouter();
  const [isScannerActive, setIsScannerActive] = useState(true);
  const scannerRef = useRef(null);

  // Monitor message state changes for debugging
  useEffect(() => {
    console.log("Message state changed:", { message, messageType });
  }, [message, messageType]);

  const showMessage = useCallback((msg, type) => {
    console.log(`showMessage called: "${msg}" (${type})`);

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      console.log("Cleared previous message timeout");
    }

    // Set message immediately without clearing first
    console.log(`Setting message state immediately: "${msg}" (${type})`);
    setMessage(msg);
    setMessageType(type);

    // Set longer timeout for better visibility
    // For error messages, show them longer to ensure visibility
    const timeoutDuration = type === "error" ? 10000 : 8000;
    messageTimeoutRef.current = setTimeout(() => {
      console.log("Clearing message due to timeout");
      setMessage("");
      setMessageType("");
    }, timeoutDuration);
  }, []);

  const incrementGuestCount = (employeeId) => {
    setGuestCounts((prev) => ({
      ...prev,
      [employeeId]: (prev[employeeId] || 0) + 1,
    }));
  };

  const decrementGuestCount = (employeeId) => {
    setGuestCounts((prev) => ({
      ...prev,
      [employeeId]: Math.max(0, (prev[employeeId] || 0) - 1),
    }));
  };

  const getGuestCount = (employeeId) => {
    return guestCounts[employeeId] || 0;
  };

  const handleCheckinResponse = useCallback(
    async (response) => {
      console.log("handleCheckinResponse called with:", response);

      // Handle restricted checkins (already checked in)
      if (response.data?.isRestricted) {
        console.log("Checkin is restricted:", response.data.error);
        showMessage(response.data.error, "error");
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Show error for 3 seconds
        return false;
      }

      // Handle successful checkins
      if (response.status === "success") {
        console.log("Checkin successful:", response.data);
        // Handle both employee and contractor data
        const entityData = response.data;

        if (response.data.entityType === "contractor") {
          setCheckedInEmployee({
            company_name: entityData.company_name,
            contact_person: entityData.contact_person,
            contractor_id: entityData.contractor_id,
          });
          setEntityType("contractor");
        } else {
          setCheckedInEmployee({
            firstname: entityData.firstname,
            lastname: entityData.lastname,
            employee_id: entityData.employee_id,
            department: entityData.department,
          });
          setEntityType("employee");
        }

        // Show success message
        showMessage(response.data.message || "Check-in successful!", "success");

        // Wait for success animation to complete
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setCheckedInEmployee(null);

        // Scanner continues running - no need to resume since we never paused it
        // This prevents the "paused" message from appearing

        return true;
      }

      // Handle queued checkins
      if (response.status === "queued") {
        console.log("Checkin queued:", response.message);
        showMessage(response.message, "info");
        return true;
      }

      // Handle error responses
      console.log("Checkin failed:", response.data);
      const errorMessage =
        response.data?.error || response.data?.message || "Check-in failed";
      showMessage(errorMessage, "error");

      // Show error message for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return false;
    },
    [showMessage]
  );

  const onScanSuccess = useCallback(
    async (decodedText) => {
      // This function is now called after the QR scanner has already processed the check-in
      // and shown the success message. We just need to handle any additional UI updates.
      console.log("onScanSuccess called with:", decodedText);

      // The QR scanner has already handled the check-in and success message
      // We can add any additional UI updates here if needed

      // Reset processing state after a short delay to allow the success message to be visible
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    },
    [setIsProcessing]
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(searchQuery)}`
      );
      const result = await response.json();
      if (response.ok) {
        setSearchResults(result || []);
      } else {
        showMessage(result.error || "Search failed", "error");
        setSearchResults([]);
      }
    } catch (error) {
      showMessage(error.message, "error");
      setSearchResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCheckin = async (item) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      let payload = { sourceType: "manual" };
      if (item.type === "employee") {
        payload.employeeId = item.employee_id;
        payload.guestCount = getGuestCount(item.employee_id);
      } else if (item.type === "contractor") {
        payload.contractorId = item.id;
      }

      console.log("Manual checkin payload:", payload);

      const result = await api.checkin(payload);
      console.log("Manual checkin API result:", result);

      // Check if this is a restricted checkin
      if (result.data?.isRestricted) {
        console.log("Manual checkin is restricted, showing error message");
        const errorMsg = result.data.error || "Check-in is restricted";
        showMessage(errorMsg, "error");
        setIsProcessing(false);
        return;
      }

      const success = await handleCheckinResponse(result);
      if (success) {
        setSearchResults([]);
        setSearchQuery("");
        // Clear guest count for this employee after successful check-in
        if (item.type === "employee") {
          setGuestCounts((prev) => {
            const newCounts = { ...prev };
            delete newCounts[item.employee_id];
            return newCounts;
          });
        }
      }
    } catch (error) {
      console.error("Manual checkin error:", error);
      showMessage(error.message || "Manual check-in failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
      setIsScannerActive(false);
      await new Promise((resolve) => setTimeout(resolve, 300));
      await router.push("/admin/login");
    } catch (error) {
      console.error("Error during admin login:", error);
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Image
              src="/logo.svg"
              alt="UHP Canteen Logo"
              width={120}
              height={60}
              className={styles.logoImage}
              priority
            />
          </div>
          <div className={styles.headerRight}>
            <NetworkStatus />
            <QueueStatus />
            <ThemeToggle />
            {/* <div className={styles.adminSection}>
              <button onClick={handleAdminLogin} className={styles.adminButton}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Admin Login
              </button>
            </div> */}
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <h1 className={styles.title}>QR Code Check-In</h1>
        {/* Message Display */}
        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
              DEBUG: {messageType} - {message}
            </div>
            {message}
            <div
              style={{ fontSize: "0.8rem", marginTop: "0.5rem", opacity: 0.8 }}
            >
              {messageType === "error"
                ? "❌"
                : messageType === "success"
                ? "✅"
                : "ℹ️"}{" "}
              {messageType.toUpperCase()}
            </div>
          </div>
        )}

        <div className={styles.contentWrapper}>
          <div className={styles.scannerSection}>
            <div className={styles.qrSection}>
              <QrScanner
                ref={scannerRef}
                onScanSuccess={onScanSuccess}
                showMessage={showMessage}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                isActive={isScannerActive}
              />

              {checkedInEmployee && (
                <CheckInSuccess
                  employeeData={checkedInEmployee}
                  entityType={entityType}
                />
              )}
            </div>

            <div className={styles.searchSection}>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <div className={styles.searchInputWrapper}>
                  <svg
                    className={styles.searchIcon}
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter employee ID or contractor name"
                    className={styles.searchInput}
                  />
                </div>
                <button type="submit" className={styles.searchButton}>
                  Search
                </button>
              </form>
              {searchResults.length > 0 && (
                <div className={styles.results}>
                  {searchResults.map((item) => (
                    <div
                      key={item.type + "-" + item.id}
                      className={styles.resultItem}
                    >
                      <div className={styles.employeeInfo}>
                        <span className={styles.employeeName}>
                          {item.type === "employee"
                            ? `${item.firstname} ${item.lastname}`
                            : item.company_name}
                        </span>
                        <span className={styles.employeeId}>
                          {item.type === "employee"
                            ? item.employee_id
                            : "Contractor"}
                        </span>
                        <span className={styles.employeeType}>
                          {item.type === "employee" ? "Employee" : "Contractor"}
                        </span>
                      </div>
                      {item.type === "employee" && (
                        <div className={styles.guestSection}>
                          <p className={styles.guestQuestion}>
                            Do you have guests with you?
                          </p>
                          <div className={styles.guestCounter}>
                            <button
                              onClick={() =>
                                decrementGuestCount(item.employee_id)
                              }
                              className={styles.guestButton}
                              disabled={
                                isProcessing ||
                                getGuestCount(item.employee_id) === 0
                              }
                            >
                              -
                            </button>
                            <span className={styles.guestCount}>
                              {getGuestCount(item.employee_id)}
                            </span>
                            <button
                              onClick={() =>
                                incrementGuestCount(item.employee_id)
                              }
                              className={styles.guestButton}
                              disabled={isProcessing}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleManualCheckin(item)}
                        className={styles.checkinButton}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Processing..." : "Check-in"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.length === 0 && searchQuery && !isProcessing && (
                <div className={styles.noResults}>No results found.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
