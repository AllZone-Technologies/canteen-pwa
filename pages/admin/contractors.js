"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import styles from "../../styles/AdminEmployees.module.css";
import { toast, Toaster } from "react-hot-toast";
import { useLoading } from "../../context/loading-context";
import { FiEdit2, FiTrash2, FiSend, FiDownload } from "react-icons/fi";

export default function Contractors() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [formErrors, setFormErrors] = useState({
    company_name: "",
    contact_email: "",
    contact_person: "",
    contact_phone: "",
  });
  const { isLoading, setIsLoading } = useLoading();

  const fetchContractors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/contractors?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(
          searchTerm
        )}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch contractors");
      }
      const data = await response.json();
      setContractors(data.contractors || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
      setContractors([]);
      toast.error("Failed to load contractors");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, setIsLoading]);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    if (!formData.company_name.trim()) {
      errors.company_name = "Company name is required";
      isValid = false;
    }
    if (
      formData.contact_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)
    ) {
      errors.contact_email = "Please enter a valid email address";
      isValid = false;
    }
    if (
      formData.contact_person &&
      !/^[a-zA-Z\s]+$/.test(formData.contact_person)
    ) {
      errors.contact_person =
        "Contact person name should only contain letters and spaces";
      isValid = false;
    }
    if (formData.contact_phone && !/^\d+$/.test(formData.contact_phone)) {
      errors.contact_phone = "Phone number should only contain numbers";
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Real-time validation for contact person (alphabets only)
    if (name === "contact_person") {
      const alphabetsOnly = /^[a-zA-Z\s]*$/;
      if (!alphabetsOnly.test(value)) {
        setFormErrors((prev) => ({
          ...prev,
          contact_person:
            "Contact person name should only contain letters and spaces",
        }));
        return;
      }
    }

    // Real-time validation for phone number (numbers only)
    if (name === "contact_phone") {
      const numbersOnly = /^\d*$/;
      if (!numbersOnly.test(value)) {
        setFormErrors((prev) => ({
          ...prev,
          contact_phone: "Phone number should only contain numbers",
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }
    setIsLoading(true);
    const url = showEditModal
      ? `/api/admin/contractors/${selectedContractor.id}`
      : "/api/admin/contractors";
    const method = showEditModal ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error) toast.error(data.error);
        return;
      }
      await fetchContractors();
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        company_name: "",
        contact_person: "",
        contact_email: "",
        contact_phone: "",
        notes: "",
        is_active: true,
      });
      setFormErrors({});
      toast.success(showEditModal ? "Contractor updated" : "Contractor added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (contractor) => {
    setSelectedContractor(contractor);
    setFormData({
      company_name: contractor.company_name,
      contact_person: contractor.contact_person || "",
      contact_email: contractor.contact_email || "",
      contact_phone: contractor.contact_phone || "",
      notes: contractor.notes || "",
      is_active: contractor.is_active,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this contractor?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/contractors/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete contractor");
      await fetchContractors();
      toast.success("Contractor deleted successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadQR = async (contractor) => {
    try {
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: contractor.qr_code_data,
          filename: `${contractor.company_name}_QR.png`,
        }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${contractor.company_name}_QR.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("QR code downloaded successfully");
      } else {
        toast.error("Failed to download QR code");
      }
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  const handleSendQR = async (contractor) => {
    if (!contractor.contact_email) {
      toast.error("No contact email for this contractor");
      return;
    }
    const toastId = toast.loading("Sending QR code email...");
    try {
      const response = await fetch("/api/admin/send-contractor-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractor.id,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("QR code email sent successfully!", { id: toastId });
      } else {
        toast.error(data.message || "Failed to send QR code email", {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error("An error occurred while sending the QR code email", {
        id: toastId,
      });
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading)
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading contractors...</div>
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
      <Toaster position="top-right" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Contractors</h1>
          <div className={styles.headerActions}>
            <button
              className={styles.addButton}
              onClick={() => setShowAddModal(true)}
            >
              Add Contractor
            </button>
          </div>
        </div>
        {/* Removed search bar here */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr key={contractor.id}>
                  <td>{contractor.company_name}</td>
                  <td>{contractor.contact_person || "-"}</td>
                  <td>{contractor.contact_email || "-"}</td>
                  <td>{contractor.contact_phone || "-"}</td>
                  <td>
                    <span
                      className={
                        contractor.is_active ? styles.active : styles.inactive
                      }
                    >
                      {contractor.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(contractor)}
                        title="Edit Contractor"
                        aria-label="Edit Contractor"
                        type="button"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(contractor.id)}
                        title="Delete Contractor"
                        aria-label="Delete Contractor"
                        type="button"
                      >
                        <FiTrash2 />
                      </button>
                      <button
                        className={styles.qrButton}
                        onClick={() => handleDownloadQR(contractor)}
                        title="Download QR Code"
                        aria-label="Download QR Code"
                        type="button"
                      >
                        <FiDownload />
                      </button>
                      <button
                        className={styles.qrButton}
                        onClick={() => handleSendQR(contractor)}
                        title="Send QR Code"
                        aria-label="Send QR Code"
                        type="button"
                      >
                        <FiSend />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <h2>{showEditModal ? "Edit Contractor" : "Add Contractor"}</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="company_name">Company Name</label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      formErrors.company_name ? styles.inputError : ""
                    }`}
                    placeholder="Enter company name"
                  />
                  {formErrors.company_name && (
                    <span className={styles.errorMessage}>
                      {formErrors.company_name}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="contact_person">Contact Person</label>
                  <input
                    type="text"
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      formErrors.contact_person ? styles.inputError : ""
                    }`}
                    placeholder="Enter contact person"
                  />
                  {formErrors.contact_person && (
                    <span className={styles.errorMessage}>
                      {formErrors.contact_person}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="contact_email">Email</label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      formErrors.contact_email ? styles.inputError : ""
                    }`}
                    placeholder="Enter email address"
                  />
                  {formErrors.contact_email && (
                    <span className={styles.errorMessage}>
                      {formErrors.contact_email}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="contact_phone">Phone</label>
                  <input
                    type="text"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      formErrors.contact_phone ? styles.inputError : ""
                    }`}
                    placeholder="Enter phone number"
                  />
                  {formErrors.contact_phone && (
                    <span className={styles.errorMessage}>
                      {formErrors.contact_phone}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="Enter notes"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="is_active">Status</label>
                  <select
                    id="is_active"
                    name="is_active"
                    value={formData.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.value === "active",
                      }))
                    }
                    className={styles.formSelect}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.saveButton}>
                    {showEditModal ? "Update Contractor" : "Add Contractor"}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setFormErrors({});
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
