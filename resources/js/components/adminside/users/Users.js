import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaEye, FaArchive } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_userlist.scss";
import UserModal from "./Userlistmodal";
import Loader from "./../../LoaderContent/loader";
import { message } from "antd"; // Import Ant Design message
import { dispatchProfileImageUpdate } from "../../../utils/profileImageUtils";
import defpfp from "/images/defpfp.svg";

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

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToArchive, setUserToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [searchTerm, showArchived, pagination.currentPage]);

  // Listen for profile image updates from other components
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      const updatedUser = event.detail;
      console.log("Users.js received profile image update event:", updatedUser);
      // Refresh the data to show updated profile images
      setImageRefreshKey(prev => prev + 1);
      fetchData(new AbortController().signal);
    };

    document.addEventListener("profileImageUpdated", handleProfileImageUpdate);
    return () => {
      document.removeEventListener("profileImageUpdated", handleProfileImageUpdate);
    };
  }, []);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const response = await axios.get("http://127.0.0.1:8000/api/users", {
        params: { archived: showArchived, search: searchTerm, page: pagination.currentPage, limit: 5 },
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        signal,
        timeout: 10000,
      });
      setUsers(response.data.users);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
      });
      setSelectedUsers([]); // Reset selected users on new data fetch
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching users:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to fetch users. Please check the server or network."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedUsers([]);
  };

  const handleArchiveClick = (user) => {
    setUserToArchive(user);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!userToArchive) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.patch(
        `http://127.0.0.1:8000/api/users/${userToArchive.id}/archive`,
        { archived: true },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      setIsConfirmModalOpen(false);
      setUserToArchive(null);
      message.success("User archived successfully");
      await fetchData(new AbortController().signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error archiving user:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to archive user. Please try again."
      );
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.patch(
        `http://127.0.0.1:8000/api/users/${userId}/archive`,
        { archived: false },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      message.success("User restored successfully");
      await fetchData(new AbortController().signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error restoring user:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to restore user. Please try again."
      );
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      message.warning("No users selected");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.post(
        "http://127.0.0.1:8000/api/users/bulk-archive",
        { user_ids: selectedUsers, action },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 10000,
        }
      );
      setSelectedUsers([]);
      message.success(`Users ${action}d successfully`);
      await fetchData(new AbortController().signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(`Error ${action}ing users:`, error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : `Failed to ${action} users. Please try again.`
      );
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setUserToEdit({
      first_name: "",
      middlename: "",
      last_name: "",
      suffix_id: "",
      email: "",
      password: "",
      role_id: "",
      gender_id: "",
      contact_number: "",
      street: "",
      city: "",
      province: "",
      postal_code: "",
      country: "",
      profile_img: null,
      image_url: null,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (user) => {
    setUserToEdit({
      id: user.id,
      first_name: user.first_name || "",
      middlename: user.middlename || "",
      last_name: user.last_name || "",
      suffix_id: user.suffix_id ? String(user.suffix_id) : "",
      email: user.email || "",
      password: "",
      role_id: user.role_id ? String(user.role_id) : "",
      gender_id: user.gender_id ? String(user.gender_id) : "",
      contact_number: user.contact_number || "",
      street: user.street || "",
      city: user.city || "",
      province: user.province || "",
      postal_code: user.postal_code || "",
      country: user.country || "",
      profile_img: null,
      image_url: user.profile_img ? `http://127.0.0.1:8000/storage/${user.profile_img}?v=${Date.now()}` : null,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setUserToEdit(null);
  };

  const handleUserAdd = async (formData, signal) => {
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
      submitData.append("role_id", formData.role_id || "");
      submitData.append("gender_id", formData.gender_id || "");
      submitData.append("contact_number", formData.contact_number || "");
      submitData.append("street", formData.street || "");
      submitData.append("city", formData.city || "");
      submitData.append("province", formData.province || "");
      submitData.append("postal_code", formData.postal_code || "");
      submitData.append("country", formData.country || "");
      if (formData.profile_img instanceof File) {
        submitData.append("profile_img", formData.profile_img);
      }

      const response = await axios.post("http://127.0.0.1:8000/api/users", submitData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      message.success("User added successfully");
      await fetchData(new AbortController().signal);
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error adding user:", error.response?.data || error.message);
      message.error("Failed to add user. Please try again.");
      throw error;
    }
  };

  const handleUserUpdate = async (formData, signal) => {
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
      submitData.append("role_id", formData.role_id || "");
      submitData.append("gender_id", formData.gender_id || "");
      submitData.append("contact_number", formData.contact_number || "");
      submitData.append("street", formData.street || "");
      submitData.append("city", formData.city || "");
      submitData.append("province", formData.province || "");
      submitData.append("postal_code", formData.postal_code || "");
      submitData.append("country", formData.country || "");
      if (formData.profile_img instanceof File) {
        submitData.append("profile_img", formData.profile_img);
      } else if (formData.profile_img === null && userToEdit.image_url) {
        submitData.append("profile_img", "");
      }
      submitData.append("_method", "PUT");

      const response = await axios.post(`http://127.0.0.1:8000/api/users/${userToEdit.id}`, submitData, {
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
      setUserToEdit(null);
      message.success("User updated successfully");
      
      // Check if the updated user is the current logged-in user
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("Current user ID:", currentUser.id, "Updated user ID:", userToEdit.id);
      console.log("Response data:", response.data);
      
      if (currentUser.id === userToEdit.id && response.data) {
        // Update the current user's data in localStorage and dispatch event
        const updatedUser = {
          ...currentUser,
          ...response.data,
          profile_img: response.data.profile_img || response.data.image_url
        };
        console.log("Updating current user data:", updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatchProfileImageUpdate(updatedUser);
        setImageRefreshKey(prev => prev + 1); // Force image refresh in table
        console.log("Profile image update event dispatched");
      }
      
      await fetchData(new AbortController().signal);
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error updating user:", error.response?.data || error.message);
      message.error("Failed to update user. Please try again.");
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
      <AdminSidebar activeItem="Users List" />
      <TopNavbar />
      <div className="userlist-dashboard">
        <div className="userlist-content">
          <h2>{showArchived ? "Archived Users" : "Users List"}</h2>
          <div className="userlist-header">
            <div className="left-actions">
              <input
                type="text"
                className="search-input"
                placeholder="Search Users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="right-actions">
              {selectedUsers.length > 0 && (
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
          <div className="userlist-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedUsers.length === users.length && users.length > 0 ? (
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
                    <td colSpan="7" className="loading-row">Loading users...</td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="action-icons">
                          <span onClick={() => toggleSelectUser(user.id)} style={{ cursor: "pointer" }}>
                            {selectedUsers.includes(user.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreUser(user.id)}
                            />
                          ) : (
                            <FaArchive
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(user)}
                            />
                          )}
                          <FaEdit
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(user)}
                          />
                        </div>
                      </td>
                      <td>
                        {user.profile_img ? (
                          <img
                            src={`http://127.0.0.1:8000/storage/${user.profile_img}?v=${imageRefreshKey}`}
                            alt="Profile"
                            className="profile-img"
                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          <img
                            src={defpfp}
                            alt="Default Profile"
                            className="profile-img"
                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                          />
                        )}
                      </td>
                      <td className="fullname-cell">{getFullName(user)}</td>
                      <td>{user.email || "N/A"}</td>
                      <td>{user.role_name || ["Admin", "Employer", "Worker"][user.role_id - 1] || "N/A"}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{formatDate(user.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No {showArchived ? "archived" : "active"} users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="userlist-pagination">
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
            <p>Do you want to archive "{getFullName(userToArchive)}"?</p>
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
        <UserModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleUserUpdate : handleUserAdd}
          isEdit={isEditMode}
          initialData={userToEdit}
        />
      )}
    </div>
  );
};

export default UsersList;