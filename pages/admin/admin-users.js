"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import styles from "../../styles/AdminUsers.module.css";
import { toast } from "react-hot-toast";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { useAdmin, AdminProvider } from "../../context/admin-context";
import { useRouter } from "next/navigation";

function AdminUsersContent() {
  const { adminInfo, isAdmin, loading: contextLoading } = useAdmin();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "manager",
    password: "",
  });

  // Check if user has access to this page
  useEffect(() => {
    if (!contextLoading && !isAdmin()) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/admin/dashboard");
    }
  }, [contextLoading, isAdmin, router]);

  useEffect(() => {
    if (!contextLoading && isAdmin()) {
      fetchUsers();
    }
  }, [currentPage, searchTerm, contextLoading, isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/admin-users?page=${currentPage}&search=${searchTerm}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Add debugging
    console.log("Form data being sent:", formData);
    console.log("Role value:", formData.role);
    console.log("Role type:", typeof formData.role);

    // Frontend validation
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!["admin", "manager"].includes(formData.role)) {
      toast.error(
        `Invalid role: ${formData.role}. Role must be either 'admin' or 'manager'`
      );
      return;
    }

    setCreatingUser(true);
    toast.loading(`Creating ${formData.role} user...`, { id: "createUser" });

    try {
      const requestBody = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      console.log("Request body being sent:", requestBody);

      const response = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.message || "Failed to create user");
      }

      const data = await response.json();

      // Dismiss loading toast and show success
      toast.dismiss("createUser");
      toast.success(
        `✅ ${
          formData.role.charAt(0).toUpperCase() + formData.role.slice(1)
        } "${
          formData.name
        }" created successfully! Check their email for login credentials.`,
        { duration: 5000 }
      );

      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);

      // Dismiss loading toast and show error
      toast.dismiss("createUser");
      toast.error(`❌ Failed to create user: ${error.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    setUpdatingUser(true);
    toast.loading(`Updating user "${formData.name}"...`, { id: "updateUser" });

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/admin-users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const data = await response.json();

      // Dismiss loading toast and show success
      toast.dismiss("updateUser");
      toast.success(
        `✅ User "${formData.name}" updated successfully!${
          formData.password ? " New password has been sent to their email." : ""
        }`,
        { duration: 5000 }
      );

      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);

      // Dismiss loading toast and show error
      toast.dismiss("updateUser");
      toast.error(`❌ Failed to update user: ${error.message}`);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    setDeletingUser(userId);
    toast.loading(`Deleting user "${userName}"...`, { id: "deleteUser" });

    try {
      const response = await fetch(`/api/admin/admin-users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      toast.dismiss("deleteUser");
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.dismiss("deleteUser");
      toast.error(error.message);
    } finally {
      setDeletingUser(null);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    const newFormData = {
      name: "",
      email: "",
      role: "manager",
      password: "",
    };
    console.log("Resetting form to:", newFormData);
    setFormData(newFormData);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const fieldName = e.target.name;
    console.log(`Input change - ${fieldName}:`, newValue);
    setFormData({
      ...formData,
      [fieldName]: newValue,
    });
  };

  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  // Show loading or access denied
  if (contextLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin()) {
    return (
      <AdminLayout>
        <div className={styles.accessDenied}>
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading users...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Admin Users Management</h1>
          <button
            className={styles.createButton}
            onClick={() => {
              console.log("Opening create modal, current formData:", formData);
              setShowCreateModal(true);
              toast.success(
                "📝 Fill out the form below to create a new user. They'll receive login credentials via email.",
                { duration: 4000 }
              );
            }}
          >
            <FiPlus /> Create New User
          </button>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.usersTable}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.role} ${styles[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditModal(user)}
                        title="Edit user"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        title="Delete user"
                        disabled={
                          (user.role === "admin" && user.id !== adminInfo.id) ||
                          deletingUser === user.id
                        }
                      >
                        {deletingUser === user.id ? (
                          <span className={styles.spinner}></span>
                        ) : (
                          <FiTrash2 />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Create New User</h2>
              <form onSubmit={handleCreateUser}>
                <div className={styles.formGroup}>
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creatingUser}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className={creatingUser ? styles.submittingButton : ""}
                  >
                    {creatingUser ? (
                      <>
                        <span className={styles.spinner}></span>
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Edit User: {editingUser.name}</h2>
              <form onSubmit={handleUpdateUser}>
                <div className={styles.formGroup}>
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>New Password (leave blank to keep current)</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button
                      type="button"
                      className={styles.generatePassword}
                      onClick={generateRandomPassword}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={updatingUser}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingUser}
                    className={updatingUser ? styles.submittingButton : ""}
                  >
                    {updatingUser ? (
                      <>
                        <span className={styles.spinner}></span>
                        Updating...
                      </>
                    ) : (
                      "Update User"
                    )}
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

export default function AdminUsers() {
  return (
    <AdminProvider>
      <AdminUsersContent />
    </AdminProvider>
  );
}
