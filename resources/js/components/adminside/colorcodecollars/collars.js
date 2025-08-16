import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import { FaTag } from "react-icons/fa"; // Replaced FaCollar with FaTag
import "./../../../../sass/components/_colorcodecollars.scss";
import ColorCodeCollarsModal from "./ColorCodeCollarsModal";

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

const ColorCodeCollars = () => {
  const [collars, setCollars] = useState([
    {
      id: 1,
      name: "Manual Labor",
      color: "#4A90E2",
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-02-01T12:00:00Z",
      archived: false,
    },
    {
      id: 2,
      name: "Service Industry",
      color: "#FF69B4",
      created_at: "2025-03-15T09:30:00Z",
      updated_at: "2025-04-01T11:00:00Z",
      archived: false,
    },
    {
      id: 3,
      name: "Corporate Management",
      color: "#FFFFFF",
      created_at: "2025-05-10T14:00:00Z",
      updated_at: "2025-06-01T15:00:00Z",
      archived: true,
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCollars, setSelectedCollars] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [collarToArchive, setCollarToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [collarToEdit, setCollarToEdit] = useState(null);
  const navigate = useNavigate();

  const filteredCollars = collars.filter((collar) => {
    const matchesSearch = collar.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = collar.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectCollar = (collarId) => {
    setSelectedCollars((prev) =>
      prev.includes(collarId)
        ? prev.filter((id) => id !== collarId)
        : [...prev, collarId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCollars.length === filteredCollars.length) {
      setSelectedCollars([]);
    } else {
      setSelectedCollars(filteredCollars.map((collar) => collar.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedCollars([]);
  };

  const handleArchiveClick = (collar) => {
    setCollarToArchive(collar);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (!collarToArchive) return;
    setCollars((prevCollars) =>
      prevCollars.map((collar) =>
        collar.id === collarToArchive.id ? { ...collar, archived: true } : collar
      )
    );
    setIsConfirmModalOpen(false);
    setCollarToArchive(null);
  };

  const handleRestoreCollar = (collarId) => {
    setCollars((prevCollars) =>
      prevCollars.map((collar) =>
        collar.id === collarId ? { ...collar, archived: false } : collar
      )
    );
  };

  const handleBulkAction = (action) => {
    if (selectedCollars.length === 0) return;
    setCollars((prevCollars) =>
      prevCollars.map((collar) =>
        selectedCollars.includes(collar.id)
          ? { ...collar, archived: action === "archive" }
          : collar
      )
    );
    setSelectedCollars([]);
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setCollarToEdit({});
    setIsModalOpen(true);
  };

  const handleEditClick = (collar) => {
    setCollarToEdit({
      id: collar.id,
      name: collar.name || "",
      color: collar.color || "",
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCollarToEdit(null);
  };

  const handleCollarAdd = (newCollar) => {
    const addedCollar = {
      id: collars.length + 1,
      name: newCollar.name,
      color: newCollar.color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };
    setCollars((prevCollars) => [addedCollar, ...prevCollars]);
    setIsModalOpen(false);
  };

  const handleCollarUpdate = (updatedCollar) => {
    setCollars((prevCollars) =>
      prevCollars.map((collar) =>
        collar.id === collarToEdit.id
          ? {
              ...collar,
              name: updatedCollar.name,
              color: updatedCollar.color,
              updated_at: new Date().toISOString(),
            }
          : collar
      )
    );
    setIsModalOpen(false);
    setIsEditMode(false);
    setCollarToEdit(null);
  };

  const collarsPerPage = 5;
  const totalPages = Math.ceil(filteredCollars.length / collarsPerPage);
  const currentCollars = filteredCollars.slice(
    (pagination.currentPage - 1) * collarsPerPage,
    pagination.currentPage * collarsPerPage
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
      <AdminSidebar activeItem="Color Code Collars" />
      <TopNavbar />
      <div className="colorcodecollars-dashboard">
        <div className="colorcodecollars-content">
          <h2>{showArchived ? "Archived Collars" : "Color Code Collars"}</h2>
          <div className="colorcodecollars-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Collars"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedCollars.length > 0 && (
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
          <div className="colorcodecollars-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedCollars.length === filteredCollars.length && filteredCollars.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Collar Name</th>
                  <th>Collar Color</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {currentCollars.length > 0 ? (
                  currentCollars.map((collar) => (
                    <tr key={collar.id}>
                      <td data-label="Actions">
                        <div className="action-icons">
                          <span onClick={() => toggleSelectCollar(collar.id)} style={{ cursor: "pointer" }}>
                            {selectedCollars.includes(collar.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreCollar(collar.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(collar)}
                            />
                          )}
                          <FaPencilAlt
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(collar)}
                          />
                        </div>
                      </td>
                      <td data-label="Collar Name" className="collar-name-cell">{collar.name || "N/A"}</td>
                      <td data-label="Collar Color">
                        <span className="collar-type">
                          <FaTag
                            className="collar-icon"
                            style={{
                              color: collar.color,
                              borderColor: collar.color,
                            }}
                          />
                          {collar.color}
                        </span>
                      </td>
                      <td data-label="Created At">{formatDate(collar.created_at)}</td>
                      <td data-label="Updated At">{formatDate(collar.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No {showArchived ? "archived" : "active"} collars found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="colorcodecollars-pagination">
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
            <p>Do you want to archive "{collarToArchive?.name}"?</p>
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
        <ColorCodeCollarsModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleCollarUpdate : handleCollarAdd}
          isEdit={isEditMode}
          initialData={collarToEdit || {}}
        />
      )}
    </div>
  );
};

export default ColorCodeCollars;