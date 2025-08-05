"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import DataTable from "../../components/DataTable";
import styles from "../../styles/AdminEmployees.module.css";
import { toast, Toaster } from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import { useLoading } from "../../context/loading-context";
import PageLoader from "../../components/PageLoader";
import { FiEdit2, FiTrash2, FiSend } from "react-icons/fi";
import BulkUploadModal from "../../components/BulkUploadModal";

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    department: "",
    employeeId: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdatingQr, setIsUpdatingQr] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const formRef = useRef(null);
  const { isLoading, setIsLoading } = useLoading();
  const [filters, setFilters] = useState({
    department: "all",
  });
  const [sort, setSort] = useState({
    by: "firstname",
    order: "ASC",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    firstname: "",
    lastname: "",
    email: "",
    employeeId: "",
    department: "",
  });

  const departments = [
    "IT",
    "HR",
    "Finance",
    "Operations",
    "Marketing",
    "Sales",
    "Customer Support",
    "Research & Development",
    "Legal",
    "Administration",
  ];

  const fetchEmployees = useCallback(async () => {
    try {
      console.log("Fetching employees with filters:", {
        currentPage,
        filters,
        sort,
      });
      const response = await fetch(
        `/api/admin/users?page=${currentPage}&filters=${JSON.stringify(
          filters
        )}&sort=${JSON.stringify(sort)}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch employees");
      }
      const data = await response.json();
      console.log("Fetched employees:", data);
      setEmployees(Array.isArray(data) ? data : data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(err.message);
      toast.error("Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sort]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Firstname validation
    if (!formData.firstname.trim()) {
      errors.firstname = "First name is required";
      isValid = false;
    } else if (formData.firstname.length < 2) {
      errors.firstname = "First name must be at least 2 characters long";
      isValid = false;
    } else if (formData.firstname.length > 50) {
      errors.firstname = "First name must not exceed 50 characters";
      isValid = false;
    } else if (!/^[a-zA-Z\s]*$/.test(formData.firstname)) {
      errors.firstname = "First name should only contain letters and spaces";
      isValid = false;
    }

    // Lastname validation
    if (!formData.lastname.trim()) {
      errors.lastname = "Last name is required";
      isValid = false;
    } else if (formData.lastname.length < 2) {
      errors.lastname = "Last name must be at least 2 characters long";
      isValid = false;
    } else if (formData.lastname.length > 50) {
      errors.lastname = "Last name must not exceed 50 characters";
      isValid = false;
    } else if (!/^[a-zA-Z\s]*$/.test(formData.lastname)) {
      errors.lastname = "Last name should only contain letters and spaces";
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    } else if (formData.email.length > 100) {
      errors.email = "Email must not exceed 100 characters";
      isValid = false;
    }

    // Employee ID validation
    if (!formData.employeeId.trim()) {
      errors.employeeId = "Employee ID is required";
      isValid = false;
    } else if (formData.employeeId.length > 20) {
      errors.employeeId = "Employee ID must not exceed 20 characters";
      isValid = false;
    } else if (!/^[A-Za-z0-9-_]+$/.test(formData.employeeId)) {
      errors.employeeId =
        "Employee ID can only contain letters, numbers, hyphens, and underscores";
      isValid = false;
    }

    // Department validation
    if (!formData.department) {
      errors.department = "Department is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Check for existing employee ID or email
  const checkExisting = async (field, value) => {
    if (!value || value.trim() === "") return;

    try {
      const response = await fetch(
        `/api/admin/users/check-existing?field=${field}&value=${encodeURIComponent(
          value.trim()
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setFormErrors((prev) => ({
            ...prev,
            [field === "employee_id" ? "employeeId" : field]: `${
              field === "employee_id" ? "Employee ID" : "Email"
            } already exists in the system`,
          }));
        }
      }
    } catch (error) {
      console.error("Error checking existing:", error);
    }
  };

  // Debounced check for existing values
  const debouncedCheck = useCallback(
    debounce((field, value) => {
      checkExisting(field, value);
    }, 500),
    []
  );

  const handleInputChangeWithValidation = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Check for existing values for employee ID and email
    if (name === "employeeId" && value.trim()) {
      debouncedCheck("employee_id", value);
    } else if (name === "email" && value.trim()) {
      debouncedCheck("email", value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsAddingUser(true);
    const toastId = toast.loading(
      showEditModal ? "Updating employee..." : "Adding employee..."
    );
    try {
      const url = showEditModal
        ? `/api/admin/users/${selectedEmployee.id}`
        : "/api/admin/users";

      const method = showEditModal ? "PUT" : "POST";

      // Transform the data to match API expectations
      const apiData = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim(),
        employee_id: formData.employeeId.trim(),
        department: formData.department,
      };

      console.log("Sending employee data:", apiData);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);

        // Handle field-specific errors
        if (data.details) {
          const newErrors = {};
          Object.entries(data.details).forEach(([field, message]) => {
            if (message) {
              newErrors[field === "employee_id" ? "employeeId" : field] =
                message;
            }
          });
          setFormErrors(newErrors);

          // Show a more user-friendly error message
          const errorMessage = data.message || "Failed to save employee";
          throw new Error(errorMessage);
        }

        throw new Error(data.message || "Failed to save employee");
      }

      console.log("API Response:", data);

      await fetchEmployees();
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        department: "",
        employeeId: "",
      });
      setFormErrors({
        firstname: "",
        lastname: "",
        email: "",
        employeeId: "",
        department: "",
      });

      toast.success(
        showEditModal
          ? "Employee updated successfully"
          : "Employee added successfully",
        { id: toastId }
      );
    } catch (err) {
      console.error("Error saving employee:", err);

      // Handle specific error types gracefully
      let errorMessage = err.message;

      if (err.message.includes("Employee ID already exists")) {
        errorMessage =
          "This Employee ID is already in use. Please choose a different one.";
      } else if (err.message.includes("Email address already exists")) {
        errorMessage =
          "This email address is already registered. Please use a different email.";
      } else if (err.message.includes("Failed to save employee")) {
        errorMessage =
          "Unable to save employee. Please check your information and try again.";
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstname: employee.firstname || "",
      lastname: employee.lastname || "",
      email: employee.email || "",
      department: employee.department || "",
      employeeId: employee.employee_id || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    setEmployeeToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${employeeToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete employee");
      }

      toast.success("Employee deleted successfully");
      fetchEmployees();
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchEmployees();
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Search failed");
      }
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : data.users || []);
      setTotalPages(1);
    } catch (err) {
      toast.error(err.message);
      setEmployees([]);
    }
  };

  const handleSendQR = async (employeeId) => {
    try {
      const response = await fetch("/api/admin/send-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employee_id: employeeId }), // Fix: use employee_id
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send QR code");
      }

      toast.success("QR code sent successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateQrCodes = async () => {
    setIsUpdatingQr(true);
    try {
      const response = await fetch("/api/admin/update-qr-codes", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update QR codes");
      }

      toast.success("QR codes updated successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdatingQr(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setPreviewData(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/bulk-upload/preview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to preview file");
      }

      const data = await response.json();
      setPreviewData({ ...data, fileName: file.name });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
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

  const handleBulkCreate = async () => {
    if (!previewData?.records?.length) {
      toast.error("No records to create");
      return;
    }

    const toastId = toast.loading("Creating employees...");
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
      toast.success(`Successfully created ${data.count} employees`, {
        id: toastId,
      });
      setPreviewData(null);
      fetchEmployees();
    } catch (error) {
      toast.error(error.message || "Failed to create employees", {
        id: toastId,
      });
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (column) => {
    setSort((prevSort) => {
      if (prevSort.by === column) {
        return {
          by: column,
          order: prevSort.order === "ASC" ? "DESC" : "ASC",
        };
      }
      return {
        by: column,
        order: "ASC",
      };
    });
    setCurrentPage(1);
  };

  // Define table columns for DataTable
  const tableColumns = [
    {
      accessorKey: "firstname",
      header: "First Name",
      size: 150,
    },
    {
      accessorKey: "lastname",
      header: "Last Name",
      size: 150,
    },
    {
      accessorKey: "employee_id",
      header: "Employee ID",
      size: 120,
    },
    {
      accessorKey: "department",
      header: "Department",
      size: 120,
    },
    {
      accessorKey: "email",
      header: "Email",
      size: 200,
    },
    {
      id: "actions",
      header: "Actions",
      size: 200,
      cell: ({ row }) => (
        <div className={styles.actions}>
          <button
            className={styles.editButton}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original);
            }}
            title="Edit Employee"
            aria-label="Edit Employee"
            type="button"
          >
            <FiEdit2 />
          </button>
          <button
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original.id);
            }}
            title="Delete Employee"
            aria-label="Delete Employee"
            type="button"
          >
            <FiTrash2 />
          </button>
          <button
            className={styles.qrButton}
            onClick={(e) => {
              e.stopPropagation();
              handleSendQR(row.original.employee_id);
            }}
            title="Send QR Code"
            aria-label="Send QR Code"
            type="button"
          >
            <FiSend />
          </button>
        </div>
      ),
    },
  ];

  if (loading)
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading employees...</div>
      </AdminLayout>
    );

  if (error)
    return (
      <AdminLayout>
        <div className={styles.error}>{error}</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#059669",
            },
          },
          error: {
            duration: 4000,
            style: {
              background: "#dc2626",
            },
          },
          loading: {
            duration: 2000,
            style: {
              background: "#3b82f6",
            },
          },
        }}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Employees</h1>
          <div className={styles.headerActions}>
            <button
              className={styles.addButton}
              onClick={() => setShowAddModal(true)}
            >
              Add Employee
            </button>
            <button
              className={styles.bulkUploadButton}
              onClick={() => setShowBulkUpload(true)}
            >
              Bulk Upload
            </button>
            <button
              className={styles.updateQrButton}
              onClick={handleUpdateQrCodes}
              disabled={isUpdatingQr}
            >
              {isUpdatingQr ? "Updating..." : "Update QR Codes"}
            </button>
          </div>
        </div>

        {/* Removed search bar here */}

        <div className={styles.filters}>
          <select
            value={filters.department}
            onChange={(e) =>
              setFilters({ ...filters, department: e.target.value })
            }
            className={styles.filterSelect}
          >
            <option value="all">All Departments</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <DataTable
          data={employees}
          columns={tableColumns}
          searchable={true}
          sortable={true}
          pagination={true}
          pageSize={itemsPerPage}
          loading={loading}
          emptyMessage="No employees found"
          className={styles.dataTable}
        />

        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>

        {(showAddModal || showEditModal) && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>{showEditModal ? "Edit Employee" : "Add Employee"}</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstname">First Name</label>
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleInputChangeWithValidation}
                    className={`${styles.formInput} ${
                      formErrors.firstname ? styles.inputError : ""
                    }`}
                    placeholder="Enter first name"
                  />
                  {formErrors.firstname && (
                    <span className={styles.errorMessage}>
                      {formErrors.firstname}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastname">Last Name</label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChangeWithValidation}
                    className={`${styles.formInput} ${
                      formErrors.lastname ? styles.inputError : ""
                    }`}
                    placeholder="Enter last name"
                  />
                  {formErrors.lastname && (
                    <span className={styles.errorMessage}>
                      {formErrors.lastname}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChangeWithValidation}
                    className={`${styles.formInput} ${
                      formErrors.email ? styles.inputError : ""
                    }`}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && (
                    <span className={styles.errorMessage}>
                      {formErrors.email}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="employeeId">Employee ID</label>
                  <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChangeWithValidation}
                    className={`${styles.formInput} ${
                      formErrors.employeeId ? styles.inputError : ""
                    } ${showEditModal ? styles.readOnlyInput : ""}`}
                    placeholder="Enter employee ID"
                    readOnly={showEditModal}
                  />
                  {formErrors.employeeId && (
                    <span className={styles.errorMessage}>
                      {formErrors.employeeId}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="department">Department</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChangeWithValidation}
                    className={`${styles.formSelect} ${
                      formErrors.department ? styles.inputError : ""
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {formErrors.department && (
                    <span className={styles.errorMessage}>
                      {formErrors.department}
                    </span>
                  )}
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isAddingUser}
                  >
                    {isAddingUser
                      ? "Saving..."
                      : showEditModal
                      ? "Update"
                      : "Add"}{" "}
                    Employee
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setFormData({
                        firstname: "",
                        lastname: "",
                        email: "",
                        department: "",
                        employeeId: "",
                        nationality: "",
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showBulkUpload && (
          <div className={styles.modal}>
            <BulkUploadModal
              onClose={() => setShowBulkUpload(false)}
              onSuccess={() => {
                setShowBulkUpload(false);
                fetchEmployees();
              }}
            />
          </div>
        )}

        {showDeleteModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Delete Employee</h2>
              <p className={styles.deleteWarning}>
                Are you sure you want to delete this employee? This action
                cannot be undone.
              </p>
              <div className={styles.modalActions}>
                <button
                  className={styles.deleteConfirmButton}
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEmployeeToDelete(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
