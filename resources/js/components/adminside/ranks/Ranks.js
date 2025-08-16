import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import RanksModal from "./RanksModal";
import "./../../../../sass/components/_ranks.scss";

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
  const [ranks, setRanks] = useState([
    { id: 1, name: "Verified", image: "https://img.icons8.com/color/40/verified-badge.png", required_reviews: 1500, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-02-01T12:00:00Z", archived: false },
    { id: 2, name: "Associate", image: "https://via.placeholder.com/40?text=Associate", required_reviews: 30, created_at: "2025-03-15T09:30:00Z", updated_at: "2025-04-01T11:00:00Z", archived: false },
    { id: 3, name: "Professional", image: "https://via.placeholder.com/40?text=Professional", required_reviews: 50, created_at: "2025-05-10T14:00:00Z", updated_at: "2025-06-01T15:00:00Z", archived: true },
    { id: 4, name: "Senior", image: "https://via.placeholder.com/40?text=Senior", required_reviews: 75, created_at: "2025-07-01T08:00:00Z", updated_at: "2025-08-01T10:00:00Z", archived: false },
    { id: 5, name: "Expert", image: "https://via.placeholder.com/40?text=Expert", required_reviews: 100, created_at: "2025-09-01T13:00:00Z", updated_at: "2025-10-01T14:00:00Z", archived: false },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRanks, setSelectedRanks] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [rankToArchive, setRankToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rankToEdit, setRankToEdit] = useState(null);
  const navigate = useNavigate();

  const filteredRanks = ranks.filter((rank) => {
    const matchesSearch = rank.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = rank.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectRank = (rankId) => {
    setSelectedRanks((prev) =>
      prev.includes(rankId) ? prev.filter((id) => id !== rankId) : [...prev, rankId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRanks.length === filteredRanks.length) {
      setSelectedRanks([]);
    } else {
      setSelectedRanks(filteredRanks.map((rank) => rank.id));
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

  const handleArchiveConfirm = () => {
    if (!rankToArchive) return;
    setRanks((prevRanks) =>
      prevRanks.map((rank) =>
        rank.id === rankToArchive.id ? { ...rank, archived: true } : rank
      )
    );
    setIsConfirmModalOpen(false);
    setRankToArchive(null);
  };

  const handleRestoreRank = (rankId) => {
    setRanks((prevRanks) =>
      prevRanks.map((rank) =>
        rank.id === rankId ? { ...rank, archived: false } : rank
      )
    );
  };

  const handleBulkAction = (action) => {
    if (selectedRanks.length === 0) return;
    setRanks((prevRanks) =>
      prevRanks.map((rank) =>
        selectedRanks.includes(rank.id)
          ? { ...rank, archived: action === "archive" }
          : rank
      )
    );
    setSelectedRanks([]);
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setRankToEdit({});
    setIsModalOpen(true);
  };

  const handleEditClick = (rank) => {
    setRankToEdit({
      id: rank.id,
      name: rank.name || "",
      image: rank.image || "",
      required_reviews: rank.required_reviews || 0,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setRankToEdit(null);
  };

  const handleRankAdd = (newRank) => {
    const addedRank = {
      id: ranks.length + 1,
      name: newRank.name,
      image: newRank.image,
      required_reviews: newRank.required_reviews,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };
    setRanks((prevRanks) => [addedRank, ...prevRanks]);
    setIsModalOpen(false);
  };

  const handleRankUpdate = (updatedRank) => {
    setRanks((prevRanks) =>
      prevRanks.map((rank) =>
        rank.id === rankToEdit.id
          ? {
              ...rank,
              name: updatedRank.name,
              image: updatedRank.image,
              required_reviews: updatedRank.required_reviews,
              updated_at: new Date().toISOString(),
            }
          : rank
      )
    );
    setIsModalOpen(false);
    setIsEditMode(false);
    setRankToEdit(null);
  };

  const ranksPerPage = 5;
  const totalPages = Math.ceil(filteredRanks.length / ranksPerPage);
  const currentRanks = filteredRanks.slice(
    (pagination.currentPage - 1) * ranksPerPage,
    pagination.currentPage * ranksPerPage
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
      <AdminSidebar activeItem="Ranks" />
      <TopNavbar />
      <div className="ranks-dashboard">
        <div className="ranks-content">
          <h2>{showArchived ? "Archived Ranks" : "Ranks"}</h2>
          <div className="ranks-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Ranks"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
                        {selectedRanks.length === filteredRanks.length && filteredRanks.length > 0 ? (
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
                  <th>Required Reviews</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {currentRanks.length > 0 ? (
                  currentRanks.map((rank) => (
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
                          src={rank.image}
                          alt={rank.name}
                          style={{ width: "40px", height: "40px", objectFit: "contain" }}
                        />
                      </td>
                      <td data-label="Required Reviews">{rank.required_reviews}</td>
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
          initialData={rankToEdit || {}}
        />
      )}
    </div>
  );
};

export default Ranks;