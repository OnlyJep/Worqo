import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../adminsidebar/adminsidebar";
import TopNavbar from "../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaEye, FaTrash } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_adminlist.scss";
import AdminModal from "./adminlistmodal.js";

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

const getFullName = (admin) => {
  const { first_name, middlename, last_name, suffix } = admin;
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

  const baseImageUrl = "http://127.0.0.1:8000/storage/";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("LaravelPassportToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [activeResponse, archivedResponse] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/admins", config),
          axios.get("http://127.0.0.1:8000/api/admins/archived", config),
        ]);

        const activeAdmins = activeResponse.data.admins.map((admin) => ({ ...admin, archived: false }));
        const archivedAdmins = archivedResponse.data.admins.map((admin) => ({ ...admin, archived: true }));
        setAdmins([...activeAdmins, ...archivedAdmins]);
        setPagination({
          currentPage: activeResponse.data.pagination.currentPage,
          totalPages: activeResponse.data.pagination.totalPages,
        });
      } catch (error) {
        console.error("Error fetching admins:", error);
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAdmins = admins.filter((admin) => {
    const fullName = getFullName(admin).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || admin.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = admin.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectAdmin = (adminId) => {
    setSelectedAdmins((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAdmins.length === filteredAdmins.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(filteredAdmins.map((admin) => admin.id));
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
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/admins/${adminToArchive.id}/archive`,
        { archived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setAdmins((prevAdmins) =>
          prevAdmins.map((admin) =>
            admin.id === adminToArchive.id ? { ...admin, archived: true } : admin
          )
        );
        setIsConfirmModalOpen(false);
        setAdminToArchive(null);
      }
    } catch (error) {
      console.error("Error archiving admin:", error);
    }
  };

  const handleRestoreAdmin = async (adminId) => {
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/admins/${adminId}/archive`,
        { archived: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setAdmins((prevAdmins) =>
          prevAdmins.map((admin) =>
            admin.id === adminId ? { ...admin, archived: false } : admin
          )
        );
      }
    } catch (error) {
      console.error("Error restoring admin:", error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedAdmins.length === 0) return;
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.post(
        `http://127.0.0.1:8000/api/admins/bulk-archive`,
        { admin_ids: selectedAdmins, action: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setAdmins((prevAdmins) =>
          prevAdmins.map((admin) =>
            selectedAdmins.includes(admin.id)
              ? { ...admin, archived: action === "archive" }
              : admin
          )
        );
        setSelectedAdmins([]);
      }
    } catch (error) {
      console.error(`Error ${action}ing admins:`, error);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setAdminToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = async (admin) => {
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.get(`http://127.0.0.1:8000/api/admins/${admin.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminToEdit({
        ...response.data,
        first_name: response.data.first_name || "",
        middlename: response.data.middlename || "",
        last_name: response.data.last_name || "",
        suffix: response.data.suffix || "",
        email: response.data.email || "",
        role_id: "3", // Fixed to Admin role_id
      });
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching admin for edit:", error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setAdminToEdit(null);
  };

  const handleAdminAdd = async (newAdmin) => {
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/admins/register",
        newAdmin,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 201) {
        const addedAdmin = {
          ...response.data.admin,
          archived: false,
        };
        setAdmins((prevAdmins) => [addedAdmin, ...prevAdmins]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error adding admin:", error.response?.data || error.message);
    }
  };

  const handleAdminUpdate = async (updatedAdmin) => {
    try {
      const token = localStorage.getItem("LaravelPassportToken");
      const response = await axios.post(
        `http://127.0.0.1:8000/api/admins/${adminToEdit.id}`,
        updatedAdmin,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        setAdmins((prevAdmins) =>
          prevAdmins.map((admin) =>
            admin.id === response.data.admin.id ? { ...response.data.admin, archived: admin.archived } : admin
          )
        );
        setIsModalOpen(false);
        setIsEditMode(false);
        setAdminToEdit(null);
      }
    } catch (error) {
      console.error("Error updating admin:", error.response?.data || error.message);
    }
  };

  const adminsPerPage = 5;
  const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);
  const currentAdmins = filteredAdmins.slice(
    (pagination.currentPage - 1) * adminsPerPage,
    pagination.currentPage * adminsPerPage
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
      <AdminSidebar activeItem="Admin List" />
      <TopNavbar />
      <div className="adminlist-dashboard">
        <div className="adminlist-content">
          <h2>{showArchived ? "Archived Admins" : "Admin List"}</h2>
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
                        {selectedAdmins.length === filteredAdmins.length && filteredAdmins.length > 0 ? (
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
                    <td colSpan="6" className="loading-row">Loading admins...</td>
                  </tr>
                ) : currentAdmins.length > 0 ? (
                  currentAdmins.map((admin) => (
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
                          <FaUser
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(admin)}
                          />
                        </div>
                      </td>
                      <td className="username-cell">
                        <img
                          src={admin.profile_img ? `${baseImageUrl}${admin.profile_img}` : `${baseImageUrl}images/pfp/default.png`}
                          alt="Profile"
                          className="profile-picture"
                          onError={(e) => {
                            e.target.src = `${baseImageUrl}images/pfp/default.png`;
                          }}
                        />
                        {getFullName(admin)}
                      </td>
                      <td>{admin.email || "N/A"}</td>
                      <td>{admin.role_name || "Admin"}</td>
                      <td>{formatDate(admin.created_at)}</td>
                      <td>{formatDate(admin.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No {showArchived ? "archived" : "active"} admins found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="adminlist-pagination">
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