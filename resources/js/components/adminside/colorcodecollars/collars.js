import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import { FaTag } from "react-icons/fa";
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
  const [collars, setCollars] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCollars, setSelectedCollars] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [collarToArchive, setCollarToArchive] = useState(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [collarToDelete, setCollarToDelete] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [collarToEdit, setCollarToEdit] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = "http://127.0.0.1:8000/api";

  // Fetch collars from API
  const fetchCollars = async (signal) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/collars`, {
        params: {
          search: searchTerm,
          archived: showArchived,
          page: pagination.currentPage,
          per_page: 5,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        signal,
      });
      setCollars(response.data.collars);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
      });
      setError(null);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Fetch collars aborted");
        return;
      }
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        setError("Unauthorized: Please log in again.");
      } else {
        setError(error.response?.data?.error || "Failed to fetch collars. Please try again.");
        console.error("Error fetching collars:", error.response?.data?.error || error.message);
      }
    }
  };

  // Fetch collars when searchTerm, showArchived, or currentPage changes
  useEffect(() => {
    const controller = new AbortController();
    fetchCollars(controller.signal);
    return () => {
      controller.abort();
    };
  }, [searchTerm, showArchived, pagination.currentPage]);

  const toggleSelectCollar = (collarId) => {
    setSelectedCollars((prev) =>
      prev.includes(collarId) ? prev.filter((id) => id !== collarId) : [...prev, collarId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCollars.length === collars.length) {
      setSelectedCollars([]);
    } else {
      setSelectedCollars(collars.map((collar) => collar.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedCollars([]);
    setError(null);
  };

  const handleArchiveClick = (collar) => {
    setCollarToArchive(collar);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!collarToArchive) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/collars/${collarToArchive.id}/archive`,
        { archived: true },
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }
      );
      setIsConfirmModalOpen(false);
      setCollarToArchive(null);
      setError(null);
      await fetchCollars(new AbortController().signal);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        setError("Unauthorized: Please log in again.");
      } else {
        setError(error.response?.data?.error || "Failed to archive collar. Please try again.");
        console.error("Error archiving collar:", error.response?.data?.error || error.message);
      }
    }
  };

  const handleDeleteClick = (collar) => {
    setCollarToDelete(collar);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!collarToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/collars/${collarToDelete.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      setIsConfirmDeleteModalOpen(false);
      setCollarToDelete(null);
      setError(null);
      await fetchCollars(new AbortController().signal);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        setError("Unauthorized: Please log in again.");
      } else {
        setError(error.response?.data?.error || "Failed to delete collar. Please try again.");
        console.error("Error deleting collar:", error.response?.data?.error || error.message);
      }
    }
  };

  const handleRestoreCollar = async (collarId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/collars/${collarId}/restore`,
        { archived: false },
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }
      );
      setError(null);
      await fetchCollars(new AbortController().signal);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        setError("Unauthorized: Please log in again.");
      } else {
        setError(error.response?.data?.error || "Failed to restore collar. Please try again.");
        console.error("Error restoring collar:", error.response?.data?.error || error.message);
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCollars.length === 0) return;
    try {
      await axios.post(
        `${API_BASE_URL}/collars/${action === "archive" ? "bulk-archive" : "bulk-restore"}`,
        { collar_ids: selectedCollars },
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }
      );
      setSelectedCollars([]);
      setError(null);
      await fetchCollars(new AbortController().signal);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        setError("Unauthorized: Please log in again.");
      } else {
        setError(error.response?.data?.error || `Failed to perform bulk ${action}. Please try again.`);
        console.error(`Error performing bulk ${action}:`, error.response?.data?.error || error.message);
      }
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setCollarToEdit({});
    setIsModalOpen(true);
    setError(null);
  };

  const handleEditClick = (collar) => {
    setCollarToEdit({
      id: collar.id,
      name: collar.name || "",
      color: collar.color || "#4A90E2",
    });
    setIsEditMode(true);
    setIsModalOpen(true);
    setError(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCollarToEdit(null);
    setError(null);
  };

  const handleCollarAdd = async (newCollar) => {
    try {
      await axios.post(
        `${API_BASE_URL}/collars`,
        { name: newCollar.name, color: newCollar.color },
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }
      );
      setIsModalOpen(false);
      setError(null);
      await fetchCollars(new AbortController().signal);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        setError("Unauthorized: Please log in again.");
      } else {
        setError(error.response?.data?.error || "Failed to add collar. Please try again.");
        console.error("Error adding collar:", error.response?.data?.error || error.message);
      }
    }
  };

  const handleCollarUpdate = async (updatedCollar) => {
    try {
      await axios.put(
        `${API_BASE_URL}/collars/${collarToEdit.id}`,
        { name: updatedCollar.name, color: updatedCollar.color },
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }
      );
      setIsModalOpen(false);
      setIsEditMode(false);
      setCollarToEdit(null);
      setError(null);
      await fetchCollars(new AbortController().signal);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        setError("Unauthorized: Please log in again.");
      } else {
        setError(error.response?.data?.error || "Failed to update collar. Please try again.");
        console.error("Error updating collar:", error.response?.data?.error || error.message);
      }
    }
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
    setError(null);
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
      <AdminSidebar activeItem="Color Code Collars" />
      <TopNavbar />
      <div className="colorcodecollars-dashboard">
        <div className="colorcodecollars-content">
          <h2>{showArchived ? "Archived Collars" : "Color Code Collars"}</h2>
          {error && (
            <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
              {error}
            </div>
          )}
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
                        {selectedCollars.length === collars.length && collars.length > 0 ? (
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
                {collars.length > 0 ? (
                  collars.map((collar) => (
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
                            <>
                              <FaTrash
                                size={16}
                                className="delete-icon"
                                onClick={() => handleDeleteClick(collar)}
                              />
                              <FaPencilAlt
                                size={16}
                                className="edit-icon"
                                onClick={() => handleEditClick(collar)}
                              />
                            </>
                          )}
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
      {isConfirmDeleteModalOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Are you sure?</h3>
            <p>Do you want to permanently delete "{collarToDelete?.name}"?</p>
            <div className="confirm-modal-buttons">
              <button className="confirm-button" onClick={handleDeleteConfirm}>
                Yes, Delete
              </button>
              <button className="cancel-button" onClick={() => setIsConfirmDeleteModalOpen(false)}>
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