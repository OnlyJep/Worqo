import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_ranks.scss";
import Loader from "./../../LoaderContent/loader";
import RanksModal from "./RanksModal";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateString);
    return "Invalid Date";
  }
};

const Ranks = () => {
  const [ranks, setRanks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRanks, setSelectedRanks] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [rankToArchive, setRankToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rankToEdit, setRankToEdit] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchRanks(controller.signal);
    return () => controller.abort();
  }, [searchTerm, showArchived, pagination.currentPage]);

  const fetchRanks = async (signal) => {
    try {
      setLoading(true);
      const response = await axios.get("/api/ranks", {
        params: {
          search: searchTerm,
          archived: showArchived,
          page: pagination.currentPage,
          limit: 5,
        },
        signal,
        timeout: 10000,
      });
      setRanks(response.data.ranks || []);
      setPagination({
        currentPage: response.data.pagination?.currentPage || 1,
        totalPages: response.data.pagination?.totalPages || 1,
        totalItems: response.data.pagination?.totalItems || 0,
      });
      setError("");
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") return;
      console.error("Error fetching ranks:", error.response?.data?.error || error.message);
      setError("Failed to fetch ranks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectRank = (rankId) => {
    setSelectedRanks((prev) =>
      prev.includes(rankId) ? prev.filter((id) => id !== rankId) : [...prev, rankId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRanks.length === (ranks?.length || 0)) {
      setSelectedRanks([]);
    } else {
      setSelectedRanks((ranks || []).map((rank) => rank.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedRanks([]);
  };

  const handleArchiveClick = (rank) => {
    setRankToArchive(rank);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!rankToArchive) return;
    try {
      await axios.patch(`/api/ranks/${rankToArchive.id}/archive`, { archived: true }, { timeout: 5000 });
      setIsConfirmModalOpen(false);
      setRankToArchive(null);
      await fetchRanks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error archiving rank:", error.response?.data?.error || error.message);
      setError("Failed to archive rank. Please try again.");
    }
  };

  const handleRestoreRank = async (rankId) => {
    try {
      await axios.patch(`/api/ranks/${rankId}/archive`, { archived: false }, { timeout: 5000 });
      await fetchRanks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error restoring rank:", error.response?.data?.error || error.message);
      setError("Failed to restore rank. Please try again.");
    }
  };

  const handleDeleteRank = async (rankId) => {
    try {
      await axios.delete(`/api/ranks/${rankId}`, { timeout: 5000 });
      await fetchRanks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error deleting rank:", error.response?.data?.error || error.message);
      setError("Failed to delete rank. Please try again.");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRanks.length === 0) return;
    try {
      if (action === "delete") {
        await axios.post(
          "/api/ranks/bulk-delete",
          { rank_ids: selectedRanks },
          { timeout: 10000 }
        );
      } else {
        await axios.post(
          "/api/ranks/bulk-archive",
          { rank_ids: selectedRanks, action },
          { timeout: 10000 }
        );
      }
      setSelectedRanks([]);
      await fetchRanks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(`Error performing bulk ${action}:`, error.response?.data?.error || error.message);
      setError(`Failed to perform bulk ${action}. Please try again.`);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setRankToEdit(null);
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = (rank) => {
    setRankToEdit(rank);
    setIsEditMode(true);
    setIsModalOpen(true);
    setError("");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setRankToEdit(null);
    setError("");
  };

  const handleRankSubmit = async (formData, signal) => {
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name || "");
      if (formData.image instanceof File) {
        submitData.append("image", formData.image);
      }
      submitData.append("min_points", formData.min_points || 0);
      if (formData.max_points !== null && formData.max_points !== undefined) {
        submitData.append("max_points", formData.max_points);
      }

      if (isEditMode && rankToEdit) {
        // Update existing rank
        submitData.append("_method", "PUT");
        await axios.post(`/api/ranks/${rankToEdit.id}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 10000,
          signal,
        });
      } else {
        // Create new rank
        await axios.post("/api/ranks", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 10000,
          signal,
        });
      }
      
      // Close modal and refresh the ranks list
      setIsModalOpen(false);
      setIsEditMode(false);
      setRankToEdit(null);
      await fetchRanks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      console.error("Error saving rank:", error.response?.data?.error || error.message);
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleRankAdd = async (formData, signal) => {
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name || "");
      if (formData.image instanceof File) {
        submitData.append("image", formData.image);
      }
      submitData.append("min_points", formData.min_points || 0);
      if (formData.max_points !== null && formData.max_points !== undefined) {
        submitData.append("max_points", formData.max_points);
      }

      const response = await axios.post("/api/ranks", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      await fetchRanks(new AbortController().signal);
      setError("");
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Add request was aborted");
        return;
      }
      console.error("Error adding rank:", error.response?.data?.error || error.message);
      throw error;
    }
  };

  const handleRankUpdate = async (formData, signal) => {
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name || "");
      if (formData.image instanceof File) {
        submitData.append("image", formData.image);
      }
      submitData.append("min_points", formData.min_points || 0);
      if (formData.max_points !== null && formData.max_points !== undefined) {
        submitData.append("max_points", formData.max_points);
      }
      submitData.append("_method", "PUT");

      const response = await axios.post(`/api/ranks/${rankToEdit.id}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      setRankToEdit(null);
      await fetchRanks(new AbortController().signal);
      setError("");
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Update request was aborted");
        return;
      }
      console.error("Error updating rank:", error.response?.data?.error || error.message);
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
      <AdminSidebar activeItem="Ranks" />
      <TopNavbar />
      <div className="ranks-dashboard">
        <div className="ranks-content">
          <h2>{showArchived ? "Archived Ranks" : "Ranks"}</h2>
          {error && <div className="error">{error}</div>}
          <div className="ranks-header">
            <div className="left-actions">
              <input
                type="text"
                className="search-input"
                placeholder="Search Ranks"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="right-actions">
              {selectedRanks.length > 0 && (
                <>
                  <button
                    className="header-button archive-all-button"
                    onClick={() => handleBulkAction(showArchived ? "restore" : "archive")}
                  >
                    <IconArchive size={20} className="button-icon" />
                    <span className="button-text">{showArchived ? "Restore All" : "Archive All"}</span>
                  </button>
                  <button
                    className="header-button delete-all-button"
                    onClick={() => handleBulkAction("delete")}
                  >
                    <FaTrash size={20} className="button-icon" />
                    <span className="button-text">Delete All</span>
                  </button>
                </>
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
                        {selectedRanks.length === (ranks?.length || 0) && (ranks?.length || 0) > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Rank Name</th>
                  <th>Rank Image</th>
                  <th>Points Range</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-row">
                      <Loader />
                    </td>
                  </tr>
                ) : (ranks?.length || 0) > 0 ? (
                  ranks.map((rank) => (
                    <tr key={rank.id}>
                      <td data-label="Actions">
                        <div className="action-icons">
                          <span onClick={() => toggleSelectRank(rank.id)} style={{ cursor: "pointer" }}>
                            {selectedRanks.includes(rank.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <>
                              <FaCheckCircle
                                size={16}
                                className="restore-icon"
                                onClick={() => handleRestoreRank(rank.id)}
                                title="Restore"
                              />
                              <FaTrash
                                size={16}
                                className="delete-icon"
                                onClick={() => handleDeleteRank(rank.id)}
                                title="Delete Permanently"
                              />
                            </>
                          ) : (
                            <>
                              <FaTrash
                                size={16}
                                className="archive-icon"
                                onClick={() => handleArchiveClick(rank)}
                                title="Archive"
                              />
                              {rank.archived && (
                                <FaTrash
                                  size={16}
                                  className="delete-icon"
                                  onClick={() => handleDeleteRank(rank.id)}
                                  title="Delete Permanently"
                                />
                              )}
                            </>
                          )}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 512 512"
                            className="edit-icon"
                            onClick={() => handleEditClick(rank)}
                            style={{ cursor: "pointer" }}
                          >
                            <path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" fill="currentColor" />
                          </svg>
                        </div>
                      </td>
                      <td data-label="Rank Name" className="rank-name-cell">{rank.name || "N/A"}</td>
                      <td data-label="Rank Image">
                        <img
                          src={rank.image ? `/storage/${rank.image}` : "https://via.placeholder.com/40"}
                          alt={rank.name}
                          style={{ width: "40px", height: "40px", objectFit: "contain" }}
                        />
                      </td>
                      <td data-label="Points Range">
                        {rank.min_points?.toLocaleString() || '0'} - {rank.max_points ? rank.max_points.toLocaleString() : '∞'}
                      </td>
                      <td data-label="Created At">{formatDate(rank.created_at)}</td>
                      <td data-label="Updated At">{formatDate(rank.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No {showArchived ? "archived" : "active"} ranks found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ranks-pagination">
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
            <p>Do you want to archive this rank?</p>
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
        <RanksModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleRankUpdate : handleRankAdd}
          isEdit={isEditMode}
          initialData={rankToEdit || { name: "", image: null, min_points: 0, max_points: null }}
        />
      )}
    </div>
  );
};

export default Ranks;
