import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_book.scss";
import Loader from "./../../LoaderContent/loader";
import BookingModal from "./bookingmodal";

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

const Book = () => {
  const [books, setBooks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookToArchive, setBookToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [bookToEdit, setBookToEdit] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchBooks(controller.signal);
    fetchSkills(controller.signal);
    return () => controller.abort();
  }, [searchTerm, showArchived, pagination.currentPage]);

  const fetchBooks = async (signal) => {
    try {
      setLoading(true);
      const response = await axios.get("/api/bookings", {
        params: {
          search: searchTerm,
          archived: showArchived,
          page: pagination.currentPage,
          limit: 5,
        },
        signal,
        timeout: 10000,
      });
      setBooks(response.data.bookings || []);
      setPagination({
        currentPage: response.data.pagination?.currentPage || 1,
        totalPages: response.data.pagination?.totalPages || 1,
        totalItems: response.data.pagination?.totalItems || 0,
      });
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching bookings:", error.response?.data?.error || error.message);
      setError("Failed to fetch bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async (signal) => {
    try {
      const response = await axios.get("/api/skills", {
        signal,
        timeout: 10000,
      });
      setSkills(response.data || []);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching skills:", error.response?.data?.error || error.message);
    }
  };

  const toggleSelectBook = (bookId) => {
    setSelectedBooks((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBooks.length === (books?.length || 0)) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks((books || []).map((book) => book.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedBooks([]);
  };

  const handleArchiveClick = (book) => {
    setBookToArchive(book);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!bookToArchive) return;
    try {
      await axios.patch(`/api/books/${bookToArchive.id}/archive`, { archived: true }, { timeout: 5000 });
      setIsConfirmModalOpen(false);
      setBookToArchive(null);
      await fetchBooks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error archiving book:", error.response?.data?.error || error.message);
      setError("Failed to archive book. Please try again.");
    }
  };

  const handleRestoreBook = async (bookId) => {
    try {
      await axios.patch(`/api/books/${bookId}/archive`, { archived: false }, { timeout: 5000 });
      await fetchBooks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error restoring book:", error.response?.data?.error || error.message);
      setError("Failed to restore book. Please try again.");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedBooks.length === 0) return;
    try {
      await axios.post(
        "/api/books/bulk-archive",
        { book_ids: selectedBooks, action },
        { timeout: 10000 }
      );
      setSelectedBooks([]);
      await fetchBooks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(`Error performing bulk ${action}:`, error.response?.data?.error || error.message);
      setError(`Failed to perform bulk ${action}. Please try again.`);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setBookToEdit(null);
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = (book) => {
    setBookToEdit(book);
    setIsEditMode(true);
    setIsModalOpen(true);
    setError("");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setBookToEdit(null);
    setError("");
  };

  const handleBookingSubmit = async (formData) => {
    try {
      if (isEditMode && bookToEdit) {
        // Update existing booking
        await axios.put(`/api/bookings/${bookToEdit.id}`, formData, { timeout: 10000 });
      } else {
        // Create new booking
        await axios.post("/api/bookings", formData, { timeout: 10000 });
      }
      
      // Refresh the bookings list
      await fetchBooks(new AbortController().signal);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error saving booking:", error.response?.data?.error || error.message);
      setError(`Failed to ${isEditMode ? "update" : "create"} booking. Please try again.`);
      throw error; // Re-throw to prevent modal from closing
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
      <AdminSidebar activeItem="Books" />
      <TopNavbar />
      <div className="book-dashboard">
        <div className="book-content">
          <h2>{showArchived ? "Archived Bookings" : "Bookings"}</h2>
          {error && <div className="error">{error}</div>}
          <div className="book-header">
            <div className="left-actions">
              <input
                type="text"
                className="search-input"
                placeholder="Search Bookings"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="right-actions">
              {selectedBooks.length > 0 && (
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
          <div className="book-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedBooks.length === (books?.length || 0) && (books?.length || 0) > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Employer Name</th>
                  <th>Worker Name</th>
                  <th>Service Type</th>
                  <th>Sub Skill</th>
                  <th>Work Type</th>
                  <th>Description</th>
                  <th>Book In</th>
                  <th>Book End</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Daily Rate</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="16" className="loading-row">
                      <Loader />
                    </td>
                  </tr>
                ) : (books?.length || 0) > 0 ? (
                  books.map((book) => (
                    <tr key={book.id}>
                      <td data-label="Actions">
                        <div className="action-icons">
                          <span onClick={() => toggleSelectBook(book.id)} style={{ cursor: "pointer" }}>
                            {selectedBooks.includes(book.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreBook(book.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(book)}
                            />
                          )}
                          <FaPencilAlt
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(book)}
                          />
                        </div>
                      </td>
                      <td data-label="Employer ID">{book.employer_id || "N/A"}</td>
                      <td data-label="Worker ID">{book.worker_id || "N/A"}</td>
                      <td data-label="Service Type">{book.service_type || "N/A"}</td>
                      <td data-label="Sub Skill">{book.sub_skill || "N/A"}</td>
                      <td data-label="Work Type">{book.work_type || "N/A"}</td>
                      <td data-label="Description">{book.description || "N/A"}</td>
                      <td data-label="Book In">{formatDate(book.book_in)}</td>
                      <td data-label="Book End">{formatDate(book.book_end)}</td>
                      <td data-label="Time In">{formatDate(book.time_in)}</td>
                      <td data-label="Time Out">{formatDate(book.time_out)}</td>
                      <td data-label="Daily Rate">${book.daily_rate || "0.00"}</td>
                      <td data-label="Total Amount">${book.total_amount || "0.00"}</td>
                      <td data-label="Status">
                        <span className={`status-badge status-${book.status}`}>
                          {book.status || "N/A"}
                        </span>
                      </td>
                      <td data-label="Created At">{formatDate(book.created_at)}</td>
                      <td data-label="Updated At">{formatDate(book.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="16">No {showArchived ? "archived" : "active"} bookings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="book-pagination">
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
            <p>Do you want to archive this booking?</p>
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

      <BookingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleBookingSubmit}
        isEdit={isEditMode}
        initialData={bookToEdit}
        skills={skills}
      />
    </div>
  );
};

export default Book;
