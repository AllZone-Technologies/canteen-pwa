import styles from "../styles/Header.module.css";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
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
        {user ? (
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        ) : (
          <Link href="/login" className={styles.loginButton}>
            Login
          </Link>
        )}
        <div className={styles.statusTag}>
          {navigator.onLine ? "Online" : "Offline"}
        </div>
      </div>
    </header>
  );
}
