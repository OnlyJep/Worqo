import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaEye, FaTrash } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_userlist.scss";
import UserModal from "./Userlistmodal";
import Loader from "./../../LoaderContent/loader";

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
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [activeResponse, archivedResponse] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/users"),
        axios.get("http://127.0.0.1:8000/api/users/archived"),
      ]);

      const activeUsers = activeResponse.data.map((user) => ({ ...user, archived: false }));
      const archivedUsers = archivedResponse.data.map((user) => ({ ...user, archived: true }));
      setUsers([...activeUsers, ...archivedUsers]);
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
      setError("Failed to fetch users. Please check the server or network.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const filteredUsers = users.filter((user) => {
    const username = user.username?.toLowerCase() || "";
    const matchesSearch = username.includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = user.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
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
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/users/${userToArchive.id}/archive`,
        { archived: true },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );
      if (response.status === 200) {
        await fetchData();
        setIsConfirmModalOpen(false);
        setUserToArchive(null);
      }
    } catch (error) {
      console.error("Error archiving user:", error.response?.data || error.message);
      setError(
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
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/users/${userId}/archive`,
        { archived: false },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );
      if (response.status === 200) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error restoring user:", error.response?.data || error.message);
      setError(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to restore user. Please try again."
      );
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const requests = selectedUsers.map((userId) =>
        axios.patch(
          `http://127.0.0.1:8000/api/users/${userId}/archive`,
          { archived: action === "archive" },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: "application/json",
            },
          }
        )
      );
      await Promise.all(requests);
      await fetchData();
      setSelectedUsers([]);
    } catch (error) {
      console.error(`Error ${action}ing users:`, error.response?.data || error.message);
      setError(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : `Failed to ${action} users. Please try again.`
      );
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = async (user) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const response = await axios.get(`http://127.0.0.1:8000/api/users/${user.id}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
      });
      if (response.status === 200) {
        setUserToEdit(response.data);
        setIsEditMode(true);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching user for edit:", error.response?.data || error.message);
      setError("Failed to fetch user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setUserToEdit(null);
  };

  const handleUserAdd = async (newUser) => {
    try {
      await fetchData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding user:", error.response?.data || error.message);
      throw error;
    }
  };

  const handleUserUpdate = async (updatedUser) => {
    try {
      await fetchData();
      setIsModalOpen(false);
      setIsEditMode(false);
      setUserToEdit(null);
    } catch (error) {
      console.error("Error updating user:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  };

  const usersPerPage = 5;
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (pagination.currentPage - 1) * usersPerPage,
    pagination.currentPage * usersPerPage
  );

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={pagination.currentPage === i ? "active" : ""}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      if (startPage > 1) {
        pageNumbers.push(
          <button key={1} onClick={() => handlePageChange(1)}>
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
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);
        }
        pageNumbers.push(
          <button key={totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
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
          {error && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
          <div className="userlist-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Users"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
                        {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-row">Loading users...</td>
                  </tr>
                ) : currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
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
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(user)}
                            />
                          )}
                          <FaUser
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(user)}
                          />
                        </div>
                      </td>
                      <td className="username-cell">{user.username || "N/A"}</td>
                      <td>{user.email || "N/A"}</td>
                      <td>{user.role_name || ["Admin", "Employer", "Worker"][user.role_id - 1] || "N/A"}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{formatDate(user.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No {showArchived ? "archived" : "active"} users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="userlist-pagination">
            <span>Page {pagination.currentPage} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              {"<"}
            </button>
            {renderPagination()}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= totalPages}
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
            <p>Do you want to archive "{userToArchive?.username}"?</p>
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