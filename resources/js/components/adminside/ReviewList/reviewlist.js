import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaArchive, FaEye } from "react-icons/fa";
import { IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_reviewstable.scss";
import ReviewModal from "./reviewlistmodal.js";
import Loader from "./../../LoaderContent/loader";

const API_BASE_URL = "/api";

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

const calculatePoints = (rating) => {
  // Points = Rating * 5,000
  // Rating can be 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, or 5.0
  if (!rating || rating < 1 || rating > 5) return 0;
  return Math.round(rating * 5000);
};

const formatPoints = (points) => {
  return points.toLocaleString('en-US');
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
          
          // Handle different response structures
          let employersData = [];
          let workersData = [];
          
          // Handle employers data
          if (Array.isArray(employerResponse.data)) {
            employersData = employerResponse.data;
          } else if (employerResponse.data && Array.isArray(employerResponse.data.employers)) {
            employersData = employerResponse.data.employers;
          } else if (employerResponse.data && Array.isArray(employerResponse.data.data)) {
            employersData = employerResponse.data.data;
          }
          
          // Handle workers data
          if (Array.isArray(workerResponse.data)) {
            workersData = workerResponse.data;
          } else if (workerResponse.data && Array.isArray(workerResponse.data.workers)) {
            workersData = workerResponse.data.workers;
          } else if (workerResponse.data && Array.isArray(workerResponse.data.data)) {
            workersData = workerResponse.data.data;
          }
          
          console.log("Processed Employers:", employersData);
          console.log("Processed Workers:", workersData);
          
          setEmployers(employersData);
          setWorkers(workersData);
          setDataLoaded(true);
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("Users fetch canceled:", err.message);
        } else if (isMounted) {
          console.error("Error fetching users:", err);
          const errorMessage = err.response?.data?.message || err.message || "Failed to fetch users. Please try again.";
          setError(`Error loading user data: ${errorMessage}`);
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
  const fetchReviews = async (resetToPageOne = false) => {
    setLoading(true);
    setError(null);
    const source = axios.CancelToken.source();
    
    // If resetting to page 1, update pagination state first
    const pageToFetch = resetToPageOne ? 1 : pagination.currentPage;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/reviews`, {
        params: {
          archived: showArchived ? 1 : 0,
          search: searchTerm,
          page: pageToFetch,
        },
        cancelToken: source.token,
      });
      console.log("Reviews response:", response.data);
      const normalizedReviews = (Array.isArray(response.data.data) ? response.data.data : []).map((review) => ({
        ...review,
        reviewedUser: review.reviewed_user || review.reviewedUser || null,
      }));
      
      // Log to help debug missing reviews
      console.log("Fetched reviews count:", normalizedReviews.length);
      console.log("Current page:", pageToFetch, "Total pages:", response.data.meta?.total_pages);
      console.log("All fetched review IDs:", normalizedReviews.map(r => ({ id: r.id, user_id: r.user_id, reviewed_user_id: r.reviewed_user_id })));
      
      setReviews(normalizedReviews);
      setPagination({
        currentPage: response.data.meta?.current_page || pageToFetch,
        totalPages: response.data.meta?.total_pages || 1,
      });
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Reviews fetch canceled:", err.message);
      } else {
        const errorMsg = err.response?.data?.error || "Failed to fetch reviews. Please try again.";
        setError(errorMsg);
        message.error(errorMsg);
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(false);
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
      message.success("Review archived successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to archive review. Please try again.";
      setError(errorMsg);
      message.error(errorMsg);
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
      message.success("Review restored successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to restore review. Please try again.";
      setError(errorMsg);
      message.error(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) {
      message.warning("No reviews selected.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/reviews/bulk`, {
        action,
        review_ids: selectedReviews,
      });
      await fetchReviews();
      setSelectedReviews([]);
      message.success(`${selectedReviews.length} review(s) ${action === 'archive' ? 'archived' : 'restored'} successfully!`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to perform bulk ${action}. Please try again.`;
      setError(errorMsg);
      message.error(errorMsg);
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
    
    // Clear any previous errors
    setError(null);
    
    // Show warning if no users available, but still allow modal to open
    if (employers.length === 0 || workers.length === 0) {
      console.warn("Limited users available:", { employers: employers.length, workers: workers.length });
      // Don't block the modal, just show a warning
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
    
    // Clear any previous errors
    setError(null);
    
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

  // Use reviews directly from API (already paginated on backend)
  // Only apply client-side filtering for search if needed
  const currentReviews = filteredReviews;

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
          {error && (
            <div className="error-message" style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: '12px', 
              borderRadius: '4px', 
              marginBottom: '16px',
              border: '1px solid #ffcdd2'
            }}>
              {error}
            </div>
          )}
          {loading && <Loader />}
          {!dataLoaded && !loading && (
            <div style={{ 
              background: '#fff3e0', 
              color: '#f57c00', 
              padding: '12px', 
              borderRadius: '4px', 
              marginBottom: '16px',
              border: '1px solid #ffcc02'
            }}>
              Initializing user data...
            </div>
          )}
          <div className="reviewstable-header">
             <div className="left-actions">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                 <circle cx="11" cy="11" r="8"></circle>
                 <path d="m21 21-4.35-4.35"></path>
               </svg>
               <input
                 type="text"
                 className="search-input"
                 placeholder="Search Reviews"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
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
                  <th>Points</th>
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
                            <FaArchive
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
                      <td className="points-cell">{formatPoints(calculatePoints(review.rating))}</td>
                      <td className="comment-cell">{review.comment || "N/A"}</td>
                      <td>{formatDate(review.created_at)}</td>
                      <td>{formatDate(review.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No {showArchived ? "archived" : "active"} reviews found</td>
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
          onRefresh={async () => {
            // Always fetch page 1 to show the newly added review
            await fetchReviews(true);
          }}
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