import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_reviewstable.scss";

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
  const { first_name, middlename, last_name, suffix } = person;
  let fullName = `${first_name || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;
  if (suffix) fullName += ` ${suffix}`;
  return fullName.trim() || "N/A";
};

const ReviewsTable = () => {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      employer: {
        company_name: "TechCorp Inc.",
        owner: { first_name: "Alice", middlename: null, last_name: "Brown", suffix: null },
      },
      worker: { first_name: "John", middlename: "A", last_name: "Doe", suffix: null },
      rating: 4,
      comment: "John is reliable and skilled, but could improve communication.",
      hasImage: true,
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-02-01T12:00:00Z",
      archived: false,
    },
    {
      id: 2,
      employer: {
        company_name: "BuildEasy LLC",
        owner: { first_name: "Bob", middlename: "C", last_name: "Davis", suffix: "Jr" },
      },
      worker: { first_name: "Jane", middlename: null, last_name: "Smith", suffix: "Jr" },
      rating: 5,
      comment: "Jane exceeded expectations with excellent work ethic.",
      hasImage: false,
      created_at: "2025-03-15T09:30:00Z",
      updated_at: "2025-04-01T11:00:00Z",
      archived: false,
    },
    {
      id: 3,
      employer: {
        company_name: "GreenWorks Co.",
        owner: { first_name: "Carol", middlename: null, last_name: "Evans", suffix: null },
      },
      worker: { first_name: "Mike", middlename: "B", last_name: "Johnson", suffix: null },
      rating: 3,
      comment: "Mike's work is satisfactory but needs more attention to detail.",
      hasImage: true,
      created_at: "2025-05-10T14:00:00Z",
      updated_at: "2025-06-01T15:00:00Z",
      archived: true,
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reviewToArchive, setReviewToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const navigate = useNavigate();

  const filteredReviews = reviews.filter((review) => {
    const employerName = review.employer.company_name?.toLowerCase() || "";
    const workerName = getFullName(review.worker).toLowerCase();
    const matchesSearch =
      employerName.includes(searchTerm.toLowerCase()) ||
      workerName.includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = review.archived === showArchived;
    return matchesSearch && matchesArchived;
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
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedReviews([]);
  };

  const handleArchiveClick = (review) => {
    setReviewToArchive(review);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (!reviewToArchive) return;
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewToArchive.id ? { ...review, archived: true } : review
      )
    );
    setIsConfirmModalOpen(false);
    setReviewToArchive(null);
  };

  const handleRestoreReview = (reviewId) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewId ? { ...review, archived: false } : review
      )
    );
  };

  const handleBulkAction = (action) => {
    if (selectedReviews.length === 0) return;
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        selectedReviews.includes(review.id)
          ? { ...review, archived: action === "archive" }
          : review
      )
    );
    setSelectedReviews([]);
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setReviewToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (review) => {
    setReviewToEdit({
      ...review,
      employer: review.employer || { company_name: "", owner: { first_name: "", middlename: "", last_name: "", suffix: "" } },
      worker: review.worker || { first_name: "", middlename: "", last_name: "", suffix: "" },
      rating: review.rating || 1,
      comment: review.comment || "",
      hasImage: review.hasImage || false,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setReviewToEdit(null);
  };

  const handleReviewAdd = (newReview) => {
    const addedReview = {
      id: reviews.length + 1,
      employer: newReview.employer || { company_name: "Unknown", owner: { first_name: "Unknown", middlename: null, last_name: "Owner", suffix: null } },
      worker: newReview.worker || { first_name: "Unknown", middlename: null, last_name: "Worker", suffix: null },
      rating: newReview.rating || 1,
      comment: newReview.comment || "",
      hasImage: newReview.hasImage || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };
    setReviews((prevReviews) => [addedReview, ...prevReviews]);
    setIsModalOpen(false);
  };

  const handleReviewUpdate = (updatedReview) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewToEdit.id
          ? {
              ...review,
              employer: updatedReview.employer,
              worker: updatedReview.worker,
              rating: updatedReview.rating,
              comment: updatedReview.comment,
              hasImage: updatedReview.hasImage,
              updated_at: new Date().toISOString(),
            }
          : review
      )
    );
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
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const currentReviews = filteredReviews.slice(
    (pagination.currentPage - 1) * reviewsPerPage,
    pagination.currentPage * reviewsPerPage
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
      <AdminSidebar activeItem="Reviews List" />
      <TopNavbar />
      <div className="reviewstable-dashboard">
        <div className="reviewstable-content">
          <h2>{showArchived ? "Archived Reviews" : "Reviews List"}</h2>
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
                  <th>Employer</th>
                  <th>Worker</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Image</th>
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
                          <FaUser
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(review)}
                          />
                        </div>
                      </td>
                      <td className="employer-cell">{review.employer.company_name || "N/A"}</td>
                      <td className="worker-cell">{getFullName(review.worker)}</td>
                      <td className="rating-cell">{renderStars(review.rating)}</td>
                      <td className="comment-cell">{review.comment || "N/A"}</td>
                      <td></td>
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
            <p>Do you want to archive review for "{getFullName(reviewToArchive?.worker)}"?</p>
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
        <EmployerModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleReviewUpdate : handleReviewAdd}
          isEdit={isEditMode}
          initialData={reviewToEdit}
        />
      )}
    </div>
  );
};

export default ReviewsTable;