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

  const showMessage = useCallback((msg, type) => {
    console.log("showMessage called:", msg, type); // Debug log
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setMessage(msg);
    setMessageType(type);
    messageTimeoutRef.current = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 2000);
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
      if (response.data?.isRestricted) {
        showMessage(response.data.error, "error");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return false;
      }

      if (response.status === "success") {
        // Hide scanner during success animation
        setIsScannerActive(false);

        // Handle both employee and contractor data
        const entityData = response.data.data;

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

        // Wait for success animation to complete
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setCheckedInEmployee(null);

        // Wait a bit more before showing scanner again
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Show scanner again - it will auto-initialize
        setIsScannerActive(true);

        return true;
      }

      if (response.status === "queued") {
        showMessage(response.message, "info");
        return true;
      }

      showMessage(response.data?.error || "Check-in failed", "error");
      return false;
    },
    [showMessage]
  );

  const onScanSuccess = useCallback(
    async (decodedText) => {
      if (isProcessing) return;
      console.log("onScanSuccess called with:", decodedText);
      setIsProcessing(true);
      try {
        const result = await api.checkin({
          qrCode: decodedText,
          sourceType: "QR",
        });
        console.log("API checkin result:", result);
        await handleCheckinResponse(result);
      } catch (error) {
        console.error("Error in onScanSuccess:", error);
        showMessage(error.message, "error");
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, handleCheckinResponse, showMessage]
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
        payload.employeeId = item.id;
        payload.guestCount = getGuestCount(item.id);
      } else if (item.type === "contractor") {
        payload.contractorId = item.id;
      }
      const result = await api.checkin(payload);
      const success = await handleCheckinResponse(result);
      if (success) {
        setSearchResults([]);
        setSearchQuery("");
        // Clear guest count for this employee after successful check-in
        if (item.type === "employee") {
          setGuestCounts((prev) => {
            const newCounts = { ...prev };
            delete newCounts[item.id];
            return newCounts;
          });
        }
      }
    } catch (error) {
      showMessage(error.message, "error");
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
              height={50}
              className={styles.logoImage}
            />
          </div>
          <div className={styles.headerRight}>
            <NetworkStatus />
            <QueueStatus />
            <ThemeToggle />
            <div className={styles.adminSection}>
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
            </div>
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <h1 className={styles.title}>QR Code Check-In</h1>

        {/* Message Display */}
        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
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
                              onClick={() => decrementGuestCount(item.id)}
                              className={styles.guestButton}
                              disabled={
                                isProcessing || getGuestCount(item.id) === 0
                              }
                            >
                              -
                            </button>
                            <span className={styles.guestCount}>
                              {getGuestCount(item.id)}
                            </span>
                            <button
                              onClick={() => incrementGuestCount(item.id)}
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
