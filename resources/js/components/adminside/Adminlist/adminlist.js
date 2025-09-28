import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_adminlist.scss";
import AdminModal from "./AdminListModal";
import Loader from "./../../LoaderContent/loader";
import { message } from "antd";
import { dispatchProfileImageUpdate } from "../../../utils/profileImageUtils";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const getFullName = (person) => {
  const { first_name, middlename, last_name, suffix } = person;
  let fullName = `${first_name || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;
  if (suffix) fullName += ` ${suffix}`;
  return fullName.trim() || "N/A";
};

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [adminToArchive, setAdminToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [searchTerm, showArchived, pagination.currentPage]);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const response = await axios.get("http://127.0.0.1:8000/api/admins", {
        params: { archived: showArchived, search: searchTerm, page: pagination.currentPage, limit: 5 },
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        signal,
        timeout: 10000,
      });
      setAdmins(response.data.users);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
      });
      setSelectedAdmins([]);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching admins:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to fetch admins. Please check the server or network."
      );
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAdmin = (adminId) => {
    setSelectedAdmins((prev) =>
      prev.includes(adminId) ? prev.filter((id) => id !== adminId) : [...prev, adminId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAdmins.length === admins.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(admins.map((admin) => admin.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedAdmins([]);
  };

  const handleArchiveClick = (admin) => {
    setAdminToArchive(admin);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!adminToArchive) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.patch(
        `http://127.0.0.1:8000/api/admins/${adminToArchive.id}/archive`,
        { archived: true },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      setIsConfirmModalOpen(false);
      setAdminToArchive(null);
      message.success("Admin archived successfully");
      await fetchData(new AbortController().signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error archiving admin:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to archive admin. Please try again."
      );
    }
  };

  const handleRestoreAdmin = async (adminId) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.patch(
        `http://127.0.0.1:8000/api/admins/${adminId}/archive`,
        { archived: false },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      message.success("Admin restored successfully");
      await fetchData(new AbortController().signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error restoring admin:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to restore admin. Please try again."
      );
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedAdmins.length === 0) {
      message.warning("No admins selected");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.post(
        "http://127.0.0.1:8000/api/admins/bulk-archive",
        { user_ids: selectedAdmins, action },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 10000,
        }
      );
      setSelectedAdmins([]);
      message.success(`Admins ${action}d successfully`);
      await fetchData(new AbortController().signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(`Error ${action}ing admins:`, error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : `Failed to ${action} admins. Please try again.`
      );
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setAdminToEdit({
      first_name: "",
      middlename: "",
      last_name: "",
      suffix_id: "",
      email: "",
      password: "",
      gender_id: "",
      profile_img: null,
      image_url: null,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (admin) => {
    setAdminToEdit({
      id: admin.id,
      first_name: admin.first_name || "",
      middlename: admin.middlename || "",
      last_name: admin.last_name || "",
      suffix_id: admin.suffix_id ? String(admin.suffix_id) : "",
      email: admin.email || "",
      password: "",
      gender_id: admin.gender_id ? String(admin.gender_id) : "",
      profile_img: null,
      image_url: admin.profile_img ? `http://127.0.0.1:8000/storage/${admin.profile_img}` : null,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setAdminToEdit(null);
  };

  const handleAdminAdd = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const submitData = new FormData();
      submitData.append("first_name", formData.first_name || "");
      submitData.append("middlename", formData.middlename || "");
      submitData.append("last_name", formData.last_name || "");
      submitData.append("suffix_id", formData.suffix_id || "");
      submitData.append("email", formData.email || "");
      if (formData.password) submitData.append("password", formData.password);
      submitData.append("gender_id", formData.gender_id || "");
      if (formData.profile_img instanceof File) {
        submitData.append("profile_img", formData.profile_img);
      }

      const response = await axios.post("http://127.0.0.1:8000/api/admins", submitData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      message.success("Admin added successfully");
      await fetchData(new AbortController().signal);
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error adding admin:", error.response?.data || error.message);
      message.error("Failed to add admin. Please try again.");
      throw error;
    }
  };

  const handleAdminUpdate = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const submitData = new FormData();
      submitData.append("first_name", formData.first_name || "");
      submitData.append("middlename", formData.middlename || "");
      submitData.append("last_name", formData.last_name || "");
      submitData.append("suffix_id", formData.suffix_id || "");
      submitData.append("email", formData.email || "");
      if (formData.password) submitData.append("password", formData.password);
      submitData.append("gender_id", formData.gender_id || "");
      if (formData.profile_img instanceof File) {
        submitData.append("profile_img", formData.profile_img);
      } else if (formData.profile_img === null && adminToEdit.image_url) {
        submitData.append("profile_img", "");
      }
      submitData.append("_method", "PUT");

      const response = await axios.post(`http://127.0.0.1:8000/api/admins/${adminToEdit.id}`, submitData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      setAdminToEdit(null);
      message.success("Admin updated successfully");
      
      // Check if the updated admin is the current logged-in user
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.id === adminToEdit.id && response.data) {
        // Update the current user's data in localStorage and dispatch event
        const updatedUser = {
          ...currentUser,
          ...response.data,
          profile_img: response.data.profile_img || response.data.image_url
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatchProfileImageUpdate(updatedUser);
      }
      
      await fetchData(new AbortController().signal);
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error updating admin:", error.response?.data || error.message);
      message.error("Failed to update admin. Please try again.");
      throw error;
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    if (pagination.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={pagination.currentPage === i ? "active" : ""}
            onClick={() => setPagination({ ...pagination, currentPage: i })}
          >
            {i}
          </button>
        );
      }
    } else {
      if (startPage > 1) {
        pageNumbers.push(
          <button key={1} onClick={() => setPagination({ ...pagination, currentPage: 1 })}>
            1
          </button>
        );
        if (startPage > 2) {
          pageNumbers.push(<span key="start-ellipsis" className="ellipsis">...</span>);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={pagination.currentPage === i ? "active" : ""}
            onClick={() => setPagination({ ...pagination, currentPage: i })}
          >
            {i}
          </button>
        );
      }

      if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);
        }
        pageNumbers.push(
          <button key={pagination.totalPages} onClick={() => setPagination({ ...pagination, currentPage: pagination.totalPages })}>
            {pagination.totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="app">
      {loading && <Loader />}
      <AdminSidebar activeItem="Admins List" />
      <TopNavbar />
      <div className="adminlist-dashboard">
        <div className="adminlist-content">
          <h2>{showArchived ? "Archived Admins" : "Admins List"}</h2>
          <div className="adminlist-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Admins"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedAdmins.length > 0 && (
                <button
                  className="header-button archive-all-button"
                  onClick={() => handleBulkAction(showArchived ? "restore" : "archive")}
                >
                  <IconArchive size={20} className="button-icon" />
                  <span className="button-text">{showArchived ? "Restore All" : "Archive All"}</span>
                </button>
              )}
              <button className="header-button" onClick={handleAddNewClick}>
                <IconPlus size={20} className="button-icon" />
                <span className="button-text">Add New</span>
              </button>
              <button className="header-button" onClick={handleToggleArchived}>
                <FaEye size={20} className="button-icon" />
                <span className="button-text">{showArchived ? "View Active" : "View Archived"}</span>
              </button>
            </div>
          </div>
          <div className="adminlist-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedAdmins.length === admins.length && admins.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Profile Image</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="loading-row">Loading admins...</td>
                  </tr>
                ) : admins.length > 0 ? (
                  admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>
                        <div className="action-icons">
                          <span onClick={() => toggleSelectAdmin(admin.id)} style={{ cursor: "pointer" }}>
                            {selectedAdmins.includes(admin.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreAdmin(admin.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(admin)}
                            />
                          )}
                          <FaEdit
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(admin)}
                          />
                        </div>
                      </td>
                      <td>
                        {admin.profile_img ? (
                          <img
                            src={`http://127.0.0.1:8000/storage/${admin.profile_img}`}
                            alt="Profile"
                            className="profile-img"
                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="fullname-cell">{getFullName(admin)}</td>
                      <td>{admin.email || "N/A"}</td>
                      <td>{admin.role_name || "Admin"}</td>
                      <td>{formatDate(admin.created_at)}</td>
                      <td>{formatDate(admin.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No {showArchived ? "archived" : "active"} admins found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="adminlist-pagination">
            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
            <button
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
              disabled={pagination.currentPage <= 1}
            >
              {"<"}
            </button>
            {renderPagination()}
            <button
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
      {isConfirmModalOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Are you sure?</h3>
            <p>Do you want to archive "{getFullName(adminToArchive)}"?</p>
            <div className="confirm-modal-buttons">
              <button className="confirm-button" onClick={handleArchiveConfirm}>
                Yes, Archive
              </button>
              <button className="cancel-button" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <AdminModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleAdminUpdate : handleAdminAdd}
          isEdit={isEditMode}
          initialData={adminToEdit}
        />
      )}
    </div>
  );
};

export default AdminList;