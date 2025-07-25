import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import styles from "../../styles/AdminTestEmail.module.css";

export default function TestEmail() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Test email sent successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to send test email",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while sending the test email",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <h1>Test Email Functionality</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter email address"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter name"
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Test Email"}
          </button>
        </form>

        {message && (
          <div
            className={`${styles.message} ${
              message.type === "success" ? styles.success : styles.error
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
