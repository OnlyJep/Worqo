import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconPlus, IconArchive } from "@tabler/icons-react";
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

const Collars = () => {
  const [collars, setCollars] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCollars, setSelectedCollars] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [collarToArchive, setCollarToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [collarToEdit, setCollarToEdit] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchCollars(controller.signal);
    return () => controller.abort();
  }, [searchTerm, showArchived, pagination.currentPage]);

  const fetchCollars = async (signal) => {
    try {
      const response = await axios.get("/api/collars", {
        params: {
          search: searchTerm,
          archived: showArchived,
          page: pagination.currentPage,
          limit: 5,
        },
        signal,
        timeout: 10000,
      });
      setCollars(response.data.collars);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
      });
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching collars:", error.response?.data?.error || error.message);
      setError("Failed to fetch collars. Please try again.");
    }
  };

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
  };

  const handleArchiveClick = (collar) => {
    setCollarToArchive(collar);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!collarToArchive) return;
    try {
      await axios.patch(`/api/collars/${collarToArchive.id}/archive`, { archived: true }, { timeout: 5000 });
      setIsConfirmModalOpen(false);
      setCollarToArchive(null);
      await fetchCollars(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error archiving collar:", error.response?.data?.error || error.message);
      setError("Failed to archive collar. Please try again.");
    }
  };

  const handleRestoreCollar = async (collarId) => {
    try {
      await axios.patch(`/api/collars/${collarId}/archive`, { archived: false }, { timeout: 5000 });
      await fetchCollars(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error restoring collar:", error.response?.data?.error || error.message);
      setError("Failed to restore collar. Please try again.");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCollars.length === 0) return;
    try {
      await axios.post(
        "/api/collars/bulk-archive",
        { collar_ids: selectedCollars, action },
        { timeout: 10000 }
      );
      setSelectedCollars([]);
      await fetchCollars(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(`Error performing bulk ${action}:`, error.response?.data?.error || error.message);
      setError(`Failed to perform bulk ${action}. Please try again.`);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setCollarToEdit({ name: "", collar_img: null });
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = (collar) => {
    setCollarToEdit({
      id: collar.id,
      name: collar.name || "",
      collar_img: null,
      image_url: collar.collar_img ? `/storage/${collar.collar_img}` : null,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
    setError("");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCollarToEdit(null);
    setError("");
  };

  const handleCollarAdd = async (formData, signal) => {
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name || "");
      if (formData.collar_img instanceof File) {
        submitData.append("collar_img", formData.collar_img);
      }

      for (let [key, value] of submitData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await axios.post("/api/collars", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      await fetchCollars(new AbortController().signal);
      setError("");
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Add request was aborted");
        return;
      }
      console.error("Error adding collar:", error.response?.data?.error || error.message);
      throw error;
    }
  };

  const handleCollarUpdate = async (formData, signal) => {
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name || "");
      if (formData.collar_img instanceof File) {
        submitData.append("collar_img", formData.collar_img);
      }
      submitData.append("_method", "PUT");

      for (let [key, value] of submitData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await axios.post(`/api/collars/${collarToEdit.id}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      setCollarToEdit(null);
      await fetchCollars(new AbortController().signal);
      setError("");
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Update request was aborted");
        return;
      }
      console.error("Error updating collar:", error.response?.data?.error || error.message);
      throw error;
    }
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

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => setPagination({ ...pagination, currentPage: totalPages })}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="app">
      <AdminSidebar activeItem="Collars" />
      <TopNavbar />
      <div className="colorcodecollars-dashboard">
        <div className="colorcodecollars-content">
          <h2>{showArchived ? "Archived Collars" : "Collars"}</h2>
          {error && <div className="error">{error}</div>}
          <div className="colorcodecollars-header">
            <div className="left-actions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search Collars"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                  <th>Collar Image</th>
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
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(collar)}
                            />
                          )}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 512 512"
                            className="edit-icon"
                            onClick={() => handleEditClick(collar)}
                            style={{ cursor: "pointer" }}
                          >
                            <path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" fill="currentColor" />
                          </svg>
                        </div>
                      </td>
                      <td data-label="Collar Name" className="collar-name-cell">{collar.name || "N/A"}</td>
                      <td data-label="Collar Image">
                        <img
                          src={collar.collar_img ? `/storage/${collar.collar_img}` : "https://via.placeholder.com/40"}
                          alt={collar.name}
                          style={{ width: "40px", height: "40px", objectFit: "contain" }}
                        />
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
          initialData={collarToEdit || { name: "", collar_img: null }}
        />
      )}
    </div>
  );
};

export default Collars;