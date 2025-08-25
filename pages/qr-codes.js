import { useState, useEffect } from "react";
import QRCode from "qrcode";
import styles from "../styles/Home.module.css";

export default function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateTestQRCodes = async () => {
      try {
        // Generate QR codes for test employees
        const testEmployees = [
          { employee_id: "EMP001", firstname: "John", lastname: "Doe" },
          { employee_id: "EMP002", firstname: "Jane", lastname: "Smith" },
          { employee_id: "EMP003", firstname: "Mike", lastname: "Johnson" },
          { employee_id: "EMP004", firstname: "Sarah", lastname: "Williams" },
          { employee_id: "EMP005", firstname: "David", lastname: "Brown" },
        ];

        const qrCodesData = await Promise.all(
          testEmployees.map(async (employee) => {
            const qrCodeDataUrl = await QRCode.toDataURL(employee.employee_id, {
              width: 200,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            });

            return {
              ...employee,
              qrCodeDataUrl,
              qrCodeText: employee.employee_id,
            };
          })
        );

        setQrCodes(qrCodesData);
      } catch (error) {
        console.error("Error generating QR codes:", error);
      } finally {
        setLoading(false);
      }
    };

    generateTestQRCodes();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Test QR Codes</h1>
        </div>
        <div className={styles.main}>
          <p>Generating test QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Test QR Codes for Scanner Testing</h1>
        <p style={{ color: "#666", textAlign: "center", marginTop: "10px" }}>
          Use these QR codes to test the scanner functionality
        </p>
      </div>
      <div className={styles.main}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: "20px", 
          maxWidth: "1200px", 
          margin: "0 auto",
          padding: "20px"
        }}>
          {qrCodes.map((employee) => (
            <div
              key={employee.employee_id}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
                border: "2px solid #e0e0e0",
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <img
                  src={employee.qrCodeDataUrl}
                  alt={`QR Code for ${employee.firstname} ${employee.lastname}`}
                  style={{ 
                    width: "150px", 
                    height: "150px",
                    border: "1px solid #ddd",
                    borderRadius: "8px"
                  }}
                />
              </div>
              <h3 style={{ margin: "10px 0", color: "#333" }}>
                {employee.firstname} {employee.lastname}
              </h3>
              <p style={{ 
                margin: "5px 0", 
                color: "#666", 
                fontSize: "14px",
                fontWeight: "bold"
              }}>
                ID: {employee.employee_id}
              </p>
              <p style={{ 
                margin: "5px 0", 
                color: "#888", 
                fontSize: "12px",
                fontFamily: "monospace",
                background: "#f5f5f5",
                padding: "5px",
                borderRadius: "4px"
              }}>
                QR Data: {employee.qrCodeText}
              </p>
              <div style={{ 
                marginTop: "15px", 
                padding: "10px", 
                background: "#f0f8ff", 
                borderRadius: "6px",
                fontSize: "12px",
                color: "#0066cc"
              }}>
                📱 Point your phone camera at this QR code to test the scanner
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ 
          marginTop: "40px", 
          padding: "20px", 
          background: "#fff3cd", 
          borderRadius: "8px",
          border: "1px solid #ffeaa7",
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          <h3 style={{ color: "#856404", marginTop: "0" }}>Testing Instructions:</h3>
          <ol style={{ color: "#856404", textAlign: "left" }}>
            <li>Open the main page with the QR scanner</li>
            <li>Point your phone camera at any of the QR codes above</li>
            <li>The scanner should detect the QR code and process the check-in</li>
            <li>You should see success/error messages displayed</li>
            <li>Check the browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
