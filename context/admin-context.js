import { createContext, useContext, useState, useEffect } from "react";

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [adminInfo, setAdminInfo] = useState({ name: "Admin", email: "" });
  const [loading, setLoading] = useState(true);

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch("/api/admin/profile");
      if (response.ok) {
        const data = await response.json();
        setAdminInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch admin info:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAdminInfo = (newInfo) => {
    setAdminInfo(newInfo);
  };

  const refreshAdminInfo = () => {
    fetchAdminInfo();
  };

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const value = {
    adminInfo,
    loading,
    updateAdminInfo,
    refreshAdminInfo,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
