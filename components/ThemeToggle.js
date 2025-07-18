import { useTheme } from "../context/theme-context";
import styles from "../styles/ThemeToggle.module.css";

export default function ThemeToggle({ isOpen = true }) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className={styles.placeholder} />;
  }

  const getThemeIcon = () => {
    return theme === "dark" ? "🌙" : "☀️";
  };

  const getThemeLabel = () => {
    return theme === "dark" ? "Dark" : "Light";
  };

  return (
    <button
      className={styles.toggleButton}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      <span className={styles.icon}>{getThemeIcon()}</span>
      {isOpen && <span className={styles.label}>{getThemeLabel()}</span>}
    </button>
  );
}
