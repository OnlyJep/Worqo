import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaEye, FaTrash } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_userlist.scss";
import UserModal from "./Userlistmodal.js";

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

const getFullName = (user) => {
  const { first_name, middlename, last_name, suffix } = user;
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
  const navigate = useNavigate();

  const baseImageUrl = "http://127.0.0.1:8000/";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("LaravelPassportToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [activeResponse, archivedResponse] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/users", config),
          axios.get("http://127.0.0.1:8000/api/users/archived", config),
        ]);

        const activeUsers = activeResponse.data.map((user) => ({ ...user, archived: false }));
        const archivedUsers = archivedResponse.data.map((user) => ({ ...user, archived: true }));
        setUsers([...activeUsers, ...archivedUsers]);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = getFullName(user).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = user.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
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
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/users/${userToArchive.id}/archive`,
        { archived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userToArchive.id ? { ...user, archived: true } : user
          )
        );
        setIsConfirmModalOpen(false);
        setUserToArchive(null);
      }
    } catch (error) {
      console.error("Error archiving user:", error);
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/users/${userId}/archive`,
        { archived: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, archived: false } : user
          )
        );
      }
    } catch (error) {
      console.error("Error restoring user:", error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const requests = selectedUsers.map((userId) =>
        axios.patch(
          `http://127.0.0.1:8000/api/users/${userId}/archive`,
          { archived: action === "archive" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      await Promise.all(requests);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(user.id)
            ? { ...user, archived: action === "archive" }
            : user
        )
      );
      setSelectedUsers([]);
    } catch (error) {
      console.error(`Error ${action}ing users:`, error);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = async (user) => {
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.get(`http://127.0.0.1:8000/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserToEdit({
        ...user,
        first_name: response.data.first_name || "",
        middlename: response.data.middlename || "",
        last_name: response.data.last_name || "",
        suffix: response.data.suffix || "",
        email: response.data.email || "",
        role_id: response.data.role_id?.toString() || "1",
        gender: response.data.gender || "",
      });
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching user for edit:", error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setUserToEdit(null);
  };

  const handleUserAdd = async (newUser) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/register",
        newUser,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 201) {
        const addedUser = {
          id: response.data.user.id,
          first_name: response.data.user.first_name,
          middlename: response.data.user.middlename,
          last_name: response.data.user.last_name,
          suffix: response.data.user.suffix,
          email: response.data.user.email,
          role_name: response.data.user.role_name || ["Admin", "Employer", "Worker"][response.data.user.role_id - 1],
          profile_img: response.data.user.profile_img,
          gender: response.data.user.gender,
          created_at: response.data.user.created_at || new Date().toISOString(),
          updated_at: response.data.user.updated_at || new Date().toISOString(),
          archived: false,
        };
        setUsers((prevUsers) => [addedUser, ...prevUsers]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error adding user:", error.response?.data || error.message);
    }
  };

  const handleUserUpdate = async (updatedUser) => {
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.post(
        `http://127.0.0.1:8000/api/users/${userToEdit.id}`,
        updatedUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === response.data.id ? { ...response.data, archived: user.archived } : user
          )
        );
        setIsModalOpen(false);
        setIsEditMode(false);
        setUserToEdit(null);
      }
    } catch (error) {
      console.error("Error updating user:", error.response?.data || error.message);
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
      <AdminSidebar activeItem="Users List" />
      <TopNavbar />
      <div className="userlist-dashboard">
        <div className="userlist-content">
          <h2>{showArchived ? "Archived Users" : "Users List"}</h2>
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
                      <td className="username-cell">
                        <img
                          src={user.profile_img ? `${baseImageUrl}${user.profile_img}` : `${baseImageUrl}images/pfp/default.png`}
                          alt="Profile"
                          className="profile-picture"
                          onError={(e) => {
                            e.target.src = `${baseImageUrl}images/pfp/default.png`;
                          }}
                        />
                        {getFullName(user)}
                      </td>
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