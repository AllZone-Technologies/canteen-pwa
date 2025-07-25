"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import styles from "../styles/AdminBulkUpload.module.css";

export default function BulkUploadModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setPreviewData(null); // Clear previous preview
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/bulk-upload/preview", {
        method: "POST",
        body: formData,
        headers: {
          "x-file-name": file.name,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to preview file");
      }

      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
  });

  const handleCreate = async () => {
    if (!previewData?.records?.length) return;

    setUploading(true);
    try {
      const response = await fetch("/api/admin/bulk-upload/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: previewData.records }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create employees");
      }

      const data = await response.json();
      toast.success(`Successfully created ${data.count} employees`);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalHeader}>
        <h2>Bulk Upload Employees</h2>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      </div>

      <div className={styles.modalBody}>
        {/* Only show dropzone if no previewData */}
        {!previewData && (
          <div
            {...getRootProps()}
            className={`${styles.dropzone} ${
              isDragActive ? styles.dropzoneActive : ""
            }`}
          >
            <input {...getInputProps()} />
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Processing file...</p>
              </div>
            ) : isDragActive ? (
              <p>Drop the file here...</p>
            ) : (
              <div>
                <div className={styles.dropzoneIcon}>📁</div>
                <p className={styles.dropzoneText}>
                  Drag and drop a CSV or Excel file here, or click to select
                </p>
                <p className={styles.dropzoneSubtext}>
                  Supported formats: .csv, .xlsx
                </p>
              </div>
            )}
          </div>
        )}

        {/* Show preview and actions if previewData exists */}
        {previewData && (
          <div className={styles.previewSection}>
            <div className={styles.previewHeader}>
              <h3>Preview ({previewData.totalRecords} records)</h3>
              <div className={styles.previewActions}>
                <button
                  onClick={handleCreate}
                  disabled={uploading || !previewData?.records?.length}
                  className={styles.createButton}
                >
                  {uploading ? "Creating..." : "Create Employees"}
                </button>
                <button
                  onClick={() => setPreviewData(null)}
                  className={styles.cancelButton}
                >
                  Back
                </button>
              </div>
            </div>

            <div className={styles.previewContainer}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Department</th>
                    {previewData.records[0] &&
                      previewData.records[0].nationality !== undefined && (
                        <th>Nationality</th>
                      )}
                  </tr>
                </thead>
                <tbody>
                  {previewData.records.map((record, index) => (
                    <tr key={index}>
                      <td>{record.firstname}</td>
                      <td>{record.lastname}</td>
                      <td>{record.employee_id}</td>
                      <td>{record.email}</td>
                      <td>{record.department}</td>
                      {record.nationality !== undefined && (
                        <td>{record.nationality}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
