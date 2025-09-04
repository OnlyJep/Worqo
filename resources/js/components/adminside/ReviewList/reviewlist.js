import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_reviewstable.scss";
import ReviewModal from "./reviewlistmodal.js";

const API_BASE_URL = "http://127.0.0.1:8000/api";

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

const getFullName = (person) => {
  if (!person) {
    console.warn("Person is null or undefined");
    return "N/A";
  }
  const { first_name, middlename, last_name, suffix, username } = person.profile || person;
  let fullName = `${first_name || username || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;
  if (suffix) fullName += ` ${suffix}`;
  const result = fullName.trim() || "N/A";
  console.log(`getFullName for ${username || "unknown"}: ${result}`);
  return result;
};

const ReviewsTable = () => {
  const [reviews, setReviews] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reviewToArchive, setReviewToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const navigate = useNavigate();

  // Fetch employers and workers
  useEffect(() => {
    let isMounted = true;
    const source = axios.CancelToken.source();

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const [employerResponse, workerResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/employers`, { cancelToken: source.token }),
          axios.get(`${API_BASE_URL}/workers`, { cancelToken: source.token }),
        ]);
        if (isMounted) {
          console.log("Employers:", employerResponse.data);
          console.log("Workers:", workerResponse.data);
          // Handle nested workers array
          const employersData = Array.isArray(employerResponse.data) ? employerResponse.data : [];
          const workersData = Array.isArray(workerResponse.data.workers) ? workerResponse.data.workers : [];
          setEmployers(employersData);
          setWorkers(workersData);
          setDataLoaded(true);
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("Users fetch canceled:", err.message);
        } else if (isMounted) {
          setError("Failed to fetch users. Please try again.");
          console.error(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUsers();

    return () => {
      isMounted = false;
      source.cancel("Users fetch canceled due to component unmount");
    };
  }, []);

  // Fetch reviews from API
  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    const source = axios.CancelToken.source();
    try {
      const response = await axios.get(`${API_BASE_URL}/reviews`, {
        params: {
          archived: showArchived ? 1 : 0,
          search: searchTerm,
          page: pagination.currentPage,
        },
        cancelToken: source.token,
      });
      console.log("Reviews response:", response.data);
      const normalizedReviews = (Array.isArray(response.data.data) ? response.data.data : []).map((review) => ({
        ...review,
        reviewedUser: review.reviewed_user || review.reviewedUser || null,
      }));
      setReviews(normalizedReviews);
      setPagination({
        currentPage: response.data.meta?.current_page || 1,
        totalPages: response.data.meta?.total_pages || 1,
      });
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Reviews fetch canceled:", err.message);
      } else {
        setError(err.response?.data?.error || "Failed to fetch reviews. Please try again.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [showArchived, searchTerm, pagination.currentPage]);

  const filteredReviews = reviews.filter((review) => {
    const employerName = getFullName(review.user).toLowerCase();
    const workerName = getFullName(review.reviewedUser).toLowerCase();
    const matchesSearch =
      employerName.includes(searchTerm.toLowerCase()) ||
      workerName.includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleSelectReview = (reviewId) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map((review) => review.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ currentPage: 1, totalPages: 1 });
    setSelectedReviews([]);
  };

  const handleArchiveClick = (review) => {
    setReviewToArchive(review);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!reviewToArchive) return;
    setLoading(true);
    setError(null);
    try {
      await axios.patch(`${API_BASE_URL}/reviews/${reviewToArchive.id}/archive`);
      await fetchReviews();
      setIsConfirmModalOpen(false);
      setReviewToArchive(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to archive review. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreReview = async (reviewId) => {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(`${API_BASE_URL}/reviews/${reviewId}/restore`);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to restore review. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/reviews/bulk`, {
        action,
        review_ids: selectedReviews,
      });
      await fetchReviews();
      setSelectedReviews([]);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to perform bulk ${action}. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = () => {
    if (!dataLoaded) {
      setError("Please wait until user data is loaded.");
      return;
    }
    console.log("Add New clicked, opening modal");
    setIsEditMode(false);
    setReviewToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (review) => {
    if (!dataLoaded) {
      setError("Please wait until user data is loaded.");
      return;
    }
    console.log("Edit clicked for review:", review);
    setReviewToEdit({
      ...review,
      user: review.user || { id: "", role_id: null, first_name: "", middlename: "", last_name: "", suffix: "", username: "" },
      reviewedUser: review.reviewedUser || { id: "", role_id: null, first_name: "", middlename: "", last_name: "", suffix: "", username: "" },
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    console.log("Closing modal");
    setIsModalOpen(false);
    setIsEditMode(false);
    setReviewToEdit(null);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "star filled" : "star"}>★</span>
      );
    }
    return stars;
  };

  const reviewsPerPage = 5;
  const currentReviews = filteredReviews.slice(
    (pagination.currentPage - 1) * reviewsPerPage,
    pagination.currentPage * reviewsPerPage
  );

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    if (pagination.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= pagination.totalPages; i++) {
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

      if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);
        }
        pageNumbers.push(
          <button key={pagination.totalPages} onClick={() => handlePageChange(pagination.totalPages)}>
            {pagination.totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="app">
      <AdminSidebar activeItem="Reviews List" />
      <TopNavbar />
      <div className="reviewstable-dashboard">
        <div className="reviewstable-content">
          <h2>{showArchived ? "Archived Reviews" : "Reviews List"}</h2>
          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-message">Loading...</div>}
          <div className="reviewstable-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Reviews"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedReviews.length > 0 && (
                <button
                  className="header-button archive-all-button"
                  onClick={() => handleBulkAction(showArchived ? "restore" : "archive")}
                  disabled={loading}
                >
                  <IconArchive size={20} className="button-icon" />
                  <span className="button-text">{showArchived ? "Restore All" : "Archive All"}</span>
                </button>
              )}
              <button
                className="header-button"
                onClick={handleAddNewClick}
                disabled={loading || !dataLoaded}
              >
                <IconPlus size={20} className="button-icon" />
                <span className="button-text">Add New</span>
              </button>
              <button className="header-button" onClick={handleToggleArchived} disabled={loading}>
                <FaEye size={20} className="button-icon" />
                <span className="button-text">{showArchived ? "View Active" : "View Archived"}</span>
              </button>
            </div>
          </div>

          <div className="reviewstable-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedReviews.length === filteredReviews.length && filteredReviews.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Reviewer</th>
                  <th>Reviewed User</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {currentReviews.length > 0 ? (
                  currentReviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <div className="action-icons">
                          <span onClick={() => toggleSelectReview(review.id)} style={{ cursor: "pointer" }}>
                            {selectedReviews.includes(review.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreReview(review.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(review)}
                            />
                          )}
                          <FaEdit
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(review)}
                          />
                        </div>
                      </td>
                      <td className="reviewer-cell">{getFullName(review.user)}</td>
                      <td className="reviewed-user-cell">{getFullName(review.reviewedUser)}</td>
                      <td className="rating-cell">{renderStars(review.rating)}</td>
                      <td className="comment-cell">{review.comment || "N/A"}</td>
                      <td>{formatDate(review.created_at)}</td>
                      <td>{formatDate(review.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No {showArchived ? "archived" : "active"} reviews found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="reviewstable-pagination">
            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
            >
              {"<"}
            </button>
            {renderPagination()}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
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
            <p>Do you want to archive review for "{getFullName(reviewToArchive?.reviewedUser)}"?</p>
            <div className="confirm-modal-buttons">
              <button className="confirm-button" onClick={handleArchiveConfirm} disabled={loading}>
                Yes, Archive
              </button>
              <button className="cancel-button" onClick={() => setIsConfirmModalOpen(false)} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <ReviewModal
          onClose={handleModalClose}
          onRefresh={fetchReviews}
          isEdit={isEditMode}
          initialData={reviewToEdit}
          employers={employers}
          workers={workers}
        />
      )}
    </div>
  );
};

export default ReviewsTable;