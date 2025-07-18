// components/PageLoader.js
import styles from "../styles/PageLoader.module.css";

export default function PageLoader() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderSpinner}></div>
    </div>
  );
}
