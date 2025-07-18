"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../styles/AdminLayout.module.css";
import { toast } from "react-hot-toast";
import ThemeToggle from "./ThemeToggle";
import { AdminProvider, useAdmin } from "../context/admin-context";
import {
  FiMenu,
  FiUsers,
  FiLogOut,
  FiHome,
  FiFileText,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiChevronDown,
} from "react-icons/fi";

const menuItems = [
  {
    title: "Dashboard",
    icon: (
      <svg
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
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    path: "/admin/dashboard",
  },
  {
    title: "Employees",
    icon: (
      <svg
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    path: "/admin/employees",
  },
  {
    title: "Check-ins",
    icon: (
      <svg
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
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
    path: "/admin/checkins",
  },
  {
    title: "Reports",
    icon: (
      <svg
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
        <path d="M21 21H3"></path>
        <path d="M3 10h18"></path>
        <path d="M3 7h18"></path>
        <path d="M3 14h18"></path>
        <path d="M3 17h18"></path>
      </svg>
    ),
    path: "/admin/reports",
  },
  {
    title: "Contractors",
    icon: (
      <svg
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
        <rect x="3" y="7" width="7" height="10" rx="2" />
        <rect x="14" y="7" width="7" height="10" rx="2" />
        <path d="M17 17v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2" />
      </svg>
    ),
    path: "/admin/contractors",
  },
  {
    title: "Meal Deductions",
    icon: (
      <svg
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
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    path: "/admin/meal-deductions",
  },
];

function AdminLayoutContent({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { adminInfo } = useAdmin();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownOpen &&
        !event.target.closest(`.${styles.profileDropdown}`)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const isActive = (path) => {
    return router.pathname === path;
  };

  const handleLogout = () => {
    // Clear the admin token cookie
    document.cookie =
      "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    toast.success("Logged out successfully");
    router.push("/admin/login");
  };

  const handleProfileClick = () => {
    setProfileDropdownOpen(false);
    router.push("/admin/profile");
  };

  if (!mounted) return null;

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          {isOpen ? (
            <div className={styles.logoContainer}>
              <Image
                src="/logo.svg"
                alt="UHP Canteen Logo"
                width={40}
                height={40}
                className={styles.logoImage}
              />
            </div>
          ) : null}
          <div
            className={
              isOpen ? styles.headerControls : styles.headerControlsCollapsed
            }
          >
            <button
              className={styles.toggleButton}
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <FiMenu />
            </button>
          </div>
        </div>
        <nav className={styles.nav}>
          <Link
            href="/admin/dashboard"
            className={`${styles.navItem} ${
              isActive("/admin/dashboard") ? styles.active : ""
            }`}
          >
            <span className={styles.navIcon}>
              <FiHome />
            </span>
            {isOpen && <span className={styles.navText}>Dashboard</span>}
          </Link>
          <Link
            href="/admin/employees"
            className={`${styles.navItem} ${
              isActive("/admin/employees") ? styles.active : ""
            }`}
          >
            <span className={styles.navIcon}>
              <FiUsers />
            </span>
            {isOpen && <span className={styles.navText}>Employees</span>}
          </Link>
          <Link
            href="/admin/checkins"
            className={`${styles.navItem} ${
              isActive("/admin/checkins") ? styles.active : ""
            }`}
          >
            <span className={styles.navIcon}>
              <FiFileText />
            </span>
            {isOpen && <span className={styles.navText}>Check-ins</span>}
          </Link>
          <Link
            href="/admin/reports"
            className={`${styles.navItem} ${
              isActive("/admin/reports") ? styles.active : ""
            }`}
          >
            <span className={styles.navIcon}>
              <FiBarChart2 />
            </span>
            {isOpen && <span className={styles.navText}>Reports</span>}
          </Link>
          <Link
            href="/admin/contractors"
            className={`${styles.navItem} ${
              isActive("/admin/contractors") ? styles.active : ""
            }`}
          >
            <span className={styles.navIcon}>
              <svg
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
                <rect x="3" y="7" width="7" height="10" rx="2" />
                <rect x="14" y="7" width="7" height="10" rx="2" />
                <path d="M17 17v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2" />
              </svg>
            </span>
            {isOpen && <span className={styles.navText}>Contractors</span>}
          </Link>
          <Link
            href="/admin/meal-deductions"
            className={`${styles.navItem} ${
              isActive("/admin/meal-deductions") ? styles.active : ""
            }`}
          >
            <span className={styles.navIcon}>
              <svg
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
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            {isOpen && <span className={styles.navText}>Meal Deductions</span>}
          </Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <ThemeToggle isOpen={isOpen} />
          <button className={styles.logoutButton} onClick={handleLogout}>
            <span className={styles.navIcon}>
              <FiLogOut />
            </span>
            {isOpen && <span className={styles.navText}>Logout</span>}
          </button>
        </div>
      </aside>
      <main className={`${styles.main} ${!isOpen ? styles.expanded : ""}`}>
        <header className={styles.mainHeader}>
          <div className={styles.headerContent}>
            <div className={styles.breadcrumb}>
              <h1>Admin Dashboard</h1>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.profileDropdown}>
                <button
                  className={styles.profileButton}
                  onClick={toggleProfileDropdown}
                  aria-label="Profile menu"
                >
                  <div className={styles.profileAvatar}>
                    <FiUser />
                  </div>
                  <div className={styles.profileInfo}>
                    <span className={styles.profileName}>{adminInfo.name}</span>
                    <span className={styles.profileEmail}>
                      {adminInfo.email}
                    </span>
                  </div>
                  <FiChevronDown className={styles.dropdownIcon} />
                </button>
                {profileDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <button
                      className={styles.dropdownItem}
                      onClick={handleProfileClick}
                    >
                      <FiSettings />
                      <span>Profile Settings</span>
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={styles.dropdownItem}
                      onClick={handleLogout}
                    >
                      <FiLogOut />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}
