import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";
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
  const [roles, setRoles] = useState([
    { id: 1, name: "Admin", created_at: "2025-01-01T10:00:00Z", updated_at: "2025-02-01T12:00:00Z", archived: false },
    { id: 2, name: "Employer", created_at: "2025-03-15T09:30:00Z", updated_at: "2025-04-01T11:00:00Z", archived: false },
    { id: 3, name: "Worker", created_at: "2025-05-10T14:00:00Z", updated_at: "2025-06-01T15:00:00Z", archived: false },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [roleToArchive, setRoleToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const navigate = useNavigate();

  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = role.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRoles.length === filteredRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(filteredRoles.map((role) => role.id));
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

  const handleArchiveConfirm = () => {
    if (!roleToArchive) return;
    setRoles((prevRoles) =>
      prevRoles.map((role) =>
        role.id === roleToArchive.id ? { ...role, archived: true } : role
      )
    );
    setIsConfirmModalOpen(false);
    setRoleToArchive(null);
  };

  const handleRestoreRole = (roleId) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) =>
        role.id === roleId ? { ...role, archived: false } : role
      )
    );
  };

  const handleBulkAction = (action) => {
    if (selectedRoles.length === 0) return;
    setRoles((prevRoles) =>
      prevRoles.map((role) =>
        selectedRoles.includes(role.id)
          ? { ...role, archived: action === "archive" }
          : role
      )
    );
    setSelectedRoles([]);
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

  const handleRoleAdd = (newRole) => {
    const addedRole = {
      id: roles.length + 1,
      name: newRole.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };
    setRoles((prevRoles) => [addedRole, ...prevRoles]);
    setIsModalOpen(false);
  };

  const handleRoleUpdate = (updatedRole) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) =>
        role.id === roleToEdit.id
          ? {
              ...role,
              name: updatedRole.name,
              updated_at: new Date().toISOString(),
            }
          : role
      )
    );
    setIsModalOpen(false);
    setIsEditMode(false);
    setRoleToEdit(null);
  };

  const rolesPerPage = 5;
  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage);
  const currentRoles = filteredRoles.slice(
    (pagination.currentPage - 1) * rolesPerPage,
    pagination.currentPage * rolesPerPage
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
                  <span className="button-text">{showArchived ? "Restore All" : "Archive Marisa All"}</span>
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
                        {selectedRoles.length === filteredRoles.length && filteredRoles.length > 0 ? (
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
                {currentRoles.length > 0 ? (
                  currentRoles.map((role) => (
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
                            <FaTrash
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