import { useTheme } from "../context/theme-context";
import ThemeToggle from "../components/ThemeToggle";
import styles from "../styles/TestTheme.module.css";

export default function TestTheme() {
  const { theme, resolvedTheme, mounted } = useTheme();

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Theme Test Page</h1>
        <ThemeToggle />
      </header>

      <main className={styles.main}>
        <div className={styles.info}>
          <p>
            <strong>Current Theme:</strong> {theme}
          </p>
          <p>
            <strong>Resolved Theme:</strong> {resolvedTheme}
          </p>
        </div>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2>Colors</h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: "var(--bg-primary)" }}
                ></div>
                <span>Primary Background</span>
              </div>
              <div className={styles.colorItem}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                ></div>
                <span>Secondary Background</span>
              </div>
              <div className={styles.colorItem}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: "var(--bg-tertiary)" }}
                ></div>
                <span>Tertiary Background</span>
              </div>
              <div className={styles.colorItem}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: "var(--accent-color)" }}
                ></div>
                <span>Accent Color</span>
              </div>
              <div className={styles.colorItem}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: "var(--success-color)" }}
                ></div>
                <span>Success Color</span>
              </div>
              <div className={styles.colorItem}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: "var(--error-color)" }}
                ></div>
                <span>Error Color</span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Text Colors</h2>
            <div className={styles.textExamples}>
              <p className={styles.textPrimary}>Primary Text Color</p>
              <p className={styles.textSecondary}>Secondary Text Color</p>
              <p className={styles.textMuted}>Muted Text Color</p>
              <p className={styles.textActive}>Active Text Color</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Components</h2>
            <div className={styles.components}>
              <button className={styles.button}>Primary Button</button>
              <button className={styles.buttonSecondary}>
                Secondary Button
              </button>
              <input
                type="text"
                placeholder="Input field"
                className={styles.input}
              />
              <div className={styles.card}>
                <h3>Card Component</h3>
                <p>This is a card with background and border styling.</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Borders</h2>
            <div className={styles.borderExamples}>
              <div className={styles.borderItem}>Border Color</div>
              <div className={styles.borderItemHover}>Border Hover</div>
              <div className={styles.borderItemFocus}>Border Focus</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
