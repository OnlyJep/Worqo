import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaArchive, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import RolesModal from "./RolesModal";
import "./../../../../sass/components/_roles.scss";

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

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [roleToArchive, setRoleToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const navigate = useNavigate();

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      const response = await axios.get("/api/roles/all", {
        params: {
          search: searchTerm,
          archived: showArchived,
          page: pagination.currentPage,
          limit: 5,
        },
      });
      const mappedRoles = response.data.roles.map((role) => ({
        ...role,
        name: role.role_name,
      }));
      setRoles(mappedRoles);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
      });
    } catch (error) {
      console.error("Error fetching roles:", error.response?.data?.error || error.message);
    }
  };

  // Fetch roles when searchTerm, showArchived, or currentPage changes
  useEffect(() => {
    fetchRoles();
  }, [searchTerm, showArchived, pagination.currentPage]);

  const toggleSelectRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRoles.length === roles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(roles.map((role) => role.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedRoles([]);
  };

  const handleArchiveClick = (role) => {
    setRoleToArchive(role);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!roleToArchive) return;
    try {
      await axios.patch(`/api/roles/${roleToArchive.id}/archive`, { archived: true });
      setIsConfirmModalOpen(false);
      setRoleToArchive(null);
      await fetchRoles(); // Refresh table
    } catch (error) {
      console.error("Error archiving role:", error.response?.data?.error || error.message);
    }
  };

  const handleRestoreRole = async (roleId) => {
    try {
      await axios.patch(`/api/roles/${roleId}/archive`, { archived: false });
      await fetchRoles(); // Refresh table
    } catch (error) {
      console.error("Error restoring role:", error.response?.data?.error || error.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRoles.length === 0) return;
    try {
      await axios.post("/api/roles/bulk-archive", {
        role_ids: selectedRoles,
        action,
      });
      setSelectedRoles([]);
      await fetchRoles(); // Refresh table
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error.response?.data?.error || error.message);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setRoleToEdit({});
    setIsModalOpen(true);
  };

  const handleEditClick = (role) => {
    setRoleToEdit({
      id: role.id,
      name: role.name || "",
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setRoleToEdit(null);
  };

  const handleRoleAdd = async (newRole) => {
    try {
      await axios.post("/api/roles", { role_name: newRole.name });
      setIsModalOpen(false);
      await fetchRoles(); // Refresh table
    } catch (error) {
      console.error("Error adding role:", error.response?.data?.error || error.message);
    }
  };

  const handleRoleUpdate = async (updatedRole) => {
    try {
      await axios.put(`/api/roles/${roleToEdit.id}`, { role_name: updatedRole.name });
      setIsModalOpen(false);
      setIsEditMode(false);
      setRoleToEdit(null);
      await fetchRoles(); // Refresh table
    } catch (error) {
      console.error("Error updating role:", error.response?.data?.error || error.message);
    }
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const totalPages = pagination.totalPages;
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
      <AdminSidebar activeItem="Roles" />
      <TopNavbar />
      <div className="ranks-dashboard">
        <div className="ranks-content">
          <h2>{showArchived ? "Archived Roles" : "Roles"}</h2>
          <div className="ranks-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Roles"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedRoles.length > 0 && (
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
          <div className="ranks-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedRoles.length === roles.length && roles.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Role Name</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <tr key={role.id}>
                      <td data-label="Actions">
                        <div className="action-icons">
                          <span onClick={() => toggleSelectRole(role.id)} style={{ cursor: "pointer" }}>
                            {selectedRoles.includes(role.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreRole(role.id)}
                            />
                          ) : (
                            <FaArchive
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(role)}
                            />
                          )}
                          <FaPencilAlt
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(role)}
                          />
                        </div>
                      </td>
                      <td data-label="Role Name" className="rank-name-cell">{role.name || "N/A"}</td>
                      <td data-label="Created At">{formatDate(role.created_at)}</td>
                      <td data-label="Updated At">{formatDate(role.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No {showArchived ? "archived" : "active"} roles found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ranks-pagination">
            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              {"<"}
            </button>
            {renderPagination()}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
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
            <p>Do you want to archive "{roleToArchive?.name}"?</p>
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
        <RolesModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleRoleUpdate : handleRoleAdd}
          isEdit={isEditMode}
          initialData={roleToEdit || {}}
        />
      )}
    </div>
  );
};

export default Roles;