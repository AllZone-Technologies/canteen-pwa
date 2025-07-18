"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import AdminLayout from "./layout";
import styles from "../../styles/AdminBulkUpload.module.css";

export default function BulkUpload({ onClose }) {
  const router = useRouter();
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
        <h1>Bulk Upload Employees</h1>

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
                <p className="text-sm text-gray-500">
                  Supported formats: .csv, .xlsx
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
              <div className="flex flex-row justify-end items-center gap-4">
                <button
                  onClick={handleCreate}
                  disabled={uploading || !previewData?.records?.length}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {uploading ? "Creating..." : "Create Employees"}
                </button>
                <button
                  onClick={() => setPreviewData(null)}
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
                  {previewData.records.map((record, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.firstname}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.lastname}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.employee_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.email}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
