"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import styles from "../../styles/AdminBulkUpload.module.css";

export default function BulkUpload({ onClose }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState([]);

  // Debug effect to monitor validation warnings state
  useEffect(() => {
    console.log("Validation warnings state changed:", validationWarnings);
  }, [validationWarnings]);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.match(/\.(csv|xlsx|xls)$/i)
    ) {
      toast.error("Please upload only CSV or Excel files (.csv, .xlsx, .xls)");
      return;
    }

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
        if (error.errors && Array.isArray(error.errors)) {
          // Handle validation errors
          const errorMessage = `${error.message}\n${error.errors.join("\n")}`;
          throw new Error(errorMessage);
        } else {
          throw new Error(
            error.error || error.message || "Failed to preview file"
          );
        }
      }

      const data = await response.json();
      console.log("API response data:", data);
      setPreviewData(data);

      // Use warnings from API response
      const warnings = data.warnings || [];
      console.log("API warnings:", warnings);
      setValidationWarnings(warnings);
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
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0];
      if (file.errors.some((error) => error.code === "file-invalid-type")) {
        toast.error(
          "Please upload only CSV or Excel files (.csv, .xlsx, .xls)"
        );
      } else if (file.errors.some((error) => error.code === "too-many-files")) {
        toast.error("Please upload only one file at a time");
      } else {
        toast.error("File upload failed. Please try again.");
      }
    },
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to create employees"
        );
      }

      // Handle partial success with errors
      if (data.errors && data.errors.length > 0) {
        const successMessage = `Successfully created ${data.count} employees`;
        const errorMessage = `Failed to create ${data.failed} employees due to errors`;

        toast.success(successMessage);

        // Show detailed errors in a more user-friendly way
        if (data.errors.length <= 5) {
          // Show individual error messages for small number of errors
          data.errors.forEach((error, index) => {
            setTimeout(() => {
              toast.error(`Row ${error.row}: ${error.error}`, {
                duration: 4000,
              });
            }, (index + 1) * 1000);
          });
        } else {
          // Show summary for many errors
          toast.error(errorMessage, { duration: 5000 });

          // Log detailed errors to console for debugging
          console.error("Bulk upload errors:", data.errors);
        }
      } else {
        toast.success(`Successfully created ${data.count} employees`);
      }

      if (onClose) {
        onClose();
      } else {
        router.push("/admin/employees");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className="flex justify-between items-center mb-6">
          <h1>Bulk Upload Employees</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const csvContent =
                  "firstname,lastname,employee_id,email,department,nationality\nJohn,Doe,EMP001,john.doe@example.com,IT,US\nJane,Smith,EMP002,jane.smith@example.com,HR,UK";
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "employee_template.csv";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Template downloaded successfully");
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Download Template
            </button>
            <button
              onClick={() => {
                const testData = {
                  records: [
                    {
                      firstname: "John",
                      lastname: "Doe",
                      employee_id: "EMP001",
                      email: "john@example.com",
                      department: "IT",
                    },
                    {
                      firstname: "Jane",
                      lastname: "Smith",
                      employee_id: "EMP001",
                      email: "jane@example.com",
                      department: "HR",
                    },
                    {
                      firstname: "Bob",
                      lastname: "Johnson",
                      employee_id: "EMP003",
                      email: "john@example.com",
                      department: "Sales",
                    },
                  ],
                  totalRecords: 3,
                  warnings: [
                    {
                      row: 2,
                      type: "duplicate_employee_id",
                      message: "Duplicate Employee ID within file: EMP001",
                      employee_id: "EMP001",
                    },
                    {
                      row: 3,
                      type: "duplicate_email",
                      message: "Duplicate Email within file: john@example.com",
                      email: "john@example.com",
                    },
                  ],
                };
                setPreviewData(testData);
                setValidationWarnings(testData.warnings);
                console.log("Test warnings:", testData.warnings);
                toast.success("Test data loaded with duplicates");
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Duplicates
            </button>
          </div>
        </div>

        {/* Only show dropzone if no previewData */}
        {!previewData && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            <input {...getInputProps()} />
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                <p>Processing file...</p>
              </div>
            ) : isDragActive ? (
              <p>Drop the file here...</p>
            ) : (
              <div>
                <p className="mb-2">
                  Drag and drop a CSV or Excel file here, or click to select
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Supported formats: .csv, .xlsx, .xls
                </p>
                <p className="text-xs text-gray-400">
                  Required headers: firstname, lastname, employee_id, email
                </p>
                <p className="text-xs text-gray-400">
                  Optional headers: department, nationality
                </p>
              </div>
            )}
          </div>
        )}

        {/* Show preview and actions if previewData exists */}
        {previewData && (
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">
                Preview ({previewData.totalRecords} records)
              </h2>

              {/* Show validation warnings */}
              {console.log("Validation warnings state:", validationWarnings)}
              {validationWarnings.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Validation Warnings ({validationWarnings.length})
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {validationWarnings
                            .slice(0, 3)
                            .map((warning, index) => (
                              <li key={index}>
                                Row {warning.row}: {warning.message}
                              </li>
                            ))}
                          {validationWarnings.length > 3 && (
                            <li>
                              ... and {validationWarnings.length - 3} more
                              warnings
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-row justify-end items-center gap-4">
                <button
                  onClick={handleCreate}
                  disabled={uploading || !previewData?.records?.length}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {uploading ? "Creating..." : "Create Employees"}
                </button>
                <button
                  onClick={() => {
                    setPreviewData(null);
                    setValidationWarnings([]);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    {/* Only show Nationality if present in the first record */}
                    {previewData.records[0] &&
                      previewData.records[0].nationality !== undefined && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nationality
                        </th>
                      )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.records.map((record, index) => {
                    const rowWarnings = validationWarnings.filter(
                      (w) => w.row === index + 1
                    );
                    const hasWarning = rowWarnings.length > 0;

                    console.log(`Row ${index + 1}:`, {
                      record,
                      rowWarnings,
                      hasWarning,
                    });

                    return (
                      <tr
                        key={index}
                        className={hasWarning ? "bg-yellow-50" : ""}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.firstname}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.lastname}
                        </td>
                        <td
                          className={`px-4 py-4 whitespace-nowrap text-sm ${
                            rowWarnings.some(
                              (w) =>
                                w.type === "duplicate_employee_id" ||
                                w.type === "existing_employee_id"
                            )
                              ? "text-red-600 font-medium"
                              : "text-gray-900"
                          }`}
                        >
                          {record.employee_id}
                          {rowWarnings.some(
                            (w) => w.type === "duplicate_employee_id"
                          ) && (
                            <span className="ml-2 text-xs text-red-500">
                              ⚠️ Duplicate in file
                            </span>
                          )}
                          {rowWarnings.some(
                            (w) => w.type === "existing_employee_id"
                          ) && (
                            <span className="ml-2 text-xs text-red-500">
                              ⚠️ Exists in DB
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-4 whitespace-nowrap text-sm ${
                            rowWarnings.some(
                              (w) =>
                                w.type === "duplicate_email" ||
                                w.type === "existing_email"
                            )
                              ? "text-red-600 font-medium"
                              : "text-gray-900"
                          }`}
                        >
                          {record.email}
                          {rowWarnings.some(
                            (w) => w.type === "duplicate_email"
                          ) && (
                            <span className="ml-2 text-xs text-red-500">
                              ⚠️ Duplicate in file
                            </span>
                          )}
                          {rowWarnings.some(
                            (w) => w.type === "existing_email"
                          ) && (
                            <span className="ml-2 text-xs text-red-500">
                              ⚠️ Exists in DB
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.department}
                        </td>
                        {/* Only show Nationality if present */}
                        {record.nationality !== undefined && (
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.nationality}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
