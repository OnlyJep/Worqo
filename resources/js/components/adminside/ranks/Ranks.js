import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_ranksModal.scss";
import RanksModal from "./RanksModal";

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
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchRanks(controller.signal);
    return () => controller.abort();
  }, [searchTerm, showArchived, pagination.currentPage]);

  const fetchRanks = async (signal) => {
    try {
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
      setRanks(response.data.ranks);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
      });
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching ranks:", error.response?.data?.error || error.message);
      setError("Failed to fetch ranks. Please try again.");
    }
  };

  const toggleSelectRank = (rankId) => {
    setSelectedRanks((prev) =>
      prev.includes(rankId) ? prev.filter((id) => id !== rankId) : [...prev, rankId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRanks.length === ranks.length) {
      setSelectedRanks([]);
    } else {
      setSelectedRanks(ranks.map((rank) => rank.id));
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

  const handleBulkAction = async (action) => {
    if (selectedRanks.length === 0) return;
    try {
      await axios.post(
        "/api/ranks/bulk-archive",
        { rank_ids: selectedRanks, action },
        { timeout: 10000 }
      );
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
    setRankToEdit({ name: "", image: null, min_points: 0, max_points: null });
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = (rank) => {
    setRankToEdit({
      id: rank.id,
      name: rank.name || "",
      image: null, // No file selected initially
      image_url: rank.image ? `/storage/${rank.image}` : null, // Store existing image URL
      min_points: rank.min_points || 0,
      max_points: rank.max_points || null,
    });
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

      for (let [key, value] of submitData.entries()) {
        console.log(`${key}: ${value}`);
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

      for (let [key, value] of submitData.entries()) {
        console.log(`${key}: ${value}`);
      }

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
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
                        {selectedRanks.length === ranks.length && ranks.length > 0 ? (
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
                {ranks.length > 0 ? (
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
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreRank(rank.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(rank)}
                            />
                          )}
                          <FaPencilAlt
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(rank)}
                          />
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
            <p>Do you want to archive "{rankToArchive?.name}"?</p>
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