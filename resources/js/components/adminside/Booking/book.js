import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaArchive, FaEye, FaCheckCircle } from "react-icons/fa";
import { IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_book.scss";
import Loader from "./../../LoaderContent/loader";
import BookingModal from "./bookingmodal";

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

const Book = () => {
  const [books, setBooks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
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
    fetchAllUsers(controller.signal);
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
      console.log('Admin bookings API response:', response.data);
      console.log('Bookings data:', response.data.bookings);
      if (response.data.bookings && response.data.bookings.length > 0) {
        console.log('First booking data:', response.data.bookings[0]);
        console.log('First booking employer:', response.data.bookings[0].employer);
        console.log('First booking worker:', response.data.bookings[0].worker);
      }
      setBooks(response.data.bookings || []);
      setPagination({
        currentPage: response.data.pagination?.currentPage || 1,
        totalPages: response.data.pagination?.totalPages || 1,
        totalItems: response.data.pagination?.totalItems || 0,
      });
      setError("");
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") return;
      const errorMsg = error.response?.data?.error || "Failed to fetch bookings. Please try again.";
      console.error("Error fetching bookings:", errorMsg);
      setError(errorMsg);
      message.error(errorMsg);
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
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") return;
      console.error("Error fetching skills:", error.response?.data?.error || error.message);
    }
  };

  const fetchAllUsers = async (signal) => {
    try {
      console.log("Fetching employers and workers...");
      
      // Fetch employers and workers using the proper API endpoints
      const [employersResponse, workersResponse] = await Promise.all([
        axios.get("/api/employers", { signal, timeout: 10000 }),
        axios.get("/api/workers", { signal, timeout: 10000 })
      ]);
      
      // Extract data from responses
      const employers = employersResponse.data.employers || employersResponse.data || [];
      const workers = workersResponse.data.workers || workersResponse.data || [];
      
      console.log("Fetched employers:", employers.length, employers);
      console.log("Fetched workers:", workers.length, workers);
      console.log("First employer:", employers[0]);
      console.log("First worker:", workers[0]);
      
      // Debug worker data structure
      if (workers.length > 0) {
        const firstWorker = workers[0];
        console.log("First worker detailed structure:", {
          id: firstWorker.id,
          email: firstWorker.email,
          profile: firstWorker.profile,
          worker: firstWorker.worker
        });
      }
      
        setEmployers(employers);
        setWorkers(workers);
      
      console.log("Successfully set employers:", employers.length, "and workers:", workers.length);
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") return;
      console.error("Error fetching users:", error.response?.data?.error || error.message);
      setError("Failed to fetch users. Please try again.");
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
      message.success("Booking archived successfully!");
    } catch (error) {
      if (error.name === "AbortError") return;
      const errorMsg = error.response?.data?.error || "Failed to archive book. Please try again.";
      console.error("Error archiving book:", errorMsg);
      setError(errorMsg);
      message.error(errorMsg);
    }
  };

  const handleRestoreBook = async (bookId) => {
    try {
      await axios.patch(`/api/bookings/${bookId}/archive`, { archived: false }, { timeout: 5000 });
      await fetchBooks(new AbortController().signal);
      setError("");
      message.success("Booking restored successfully!");
    } catch (error) {
      if (error.name === "AbortError") return;
      const errorMsg = error.response?.data?.error || "Failed to restore book. Please try again.";
      console.error("Error restoring book:", errorMsg);
      setError(errorMsg);
      message.error(errorMsg);
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      await axios.delete(`/api/bookings/${bookId}`, { timeout: 5000 });
      await fetchBooks(new AbortController().signal);
      setError("");
      message.success("Booking deleted successfully!");
    } catch (error) {
      if (error.name === "AbortError") return;
      const errorMsg = error.response?.data?.error || "Failed to delete book. Please try again.";
      console.error("Error deleting book:", errorMsg);
      setError(errorMsg);
      message.error(errorMsg);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedBooks.length === 0) return;
    try {
      if (action === "delete") {
        await axios.post(
          "/api/bookings/bulk-delete",
          { booking_ids: selectedBooks },
          { timeout: 10000 }
        );
      } else {
        await axios.post(
          "/api/bookings/bulk-archive",
          { booking_ids: selectedBooks, action },
          { timeout: 10000 }
        );
      }
      setSelectedBooks([]);
      await fetchBooks(new AbortController().signal);
      setError("");
      message.success(`${selectedBooks.length} booking(s) ${action === 'archive' ? 'archived' : action === 'delete' ? 'deleted' : 'restored'} successfully!`);
    } catch (error) {
      if (error.name === "AbortError") return;
      const errorMsg = error.response?.data?.error || `Failed to perform bulk ${action}. Please try again.`;
      console.error(`Error performing bulk ${action}:`, errorMsg);
      setError(errorMsg);
      message.error(errorMsg);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setBookToEdit(null);
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = (book) => {
    console.log("Edit button clicked - Booking data:", book);
    console.log("Booking fields:", {
      id: book.id,
      employer_id: book.employer_id,
      worker_id: book.worker_id,
      service_type: book.service_type,
      sub_skill: book.sub_skill,
      work_type: book.work_type,
      description: book.description,
      book_in: book.book_in,
      book_end: book.book_end,
      hours_per_day: book.hours_per_day,
      daily_rate: book.daily_rate,
      total_amount: book.total_amount,
      status: book.status
    });
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
      {loading && <Loader />}
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
                    <FaArchive size={20} className="button-icon" />
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
                  <th>Hours/Day</th>
                  <th>Address</th>
                  <th>Contact Number</th>
                  <th>Description</th>
                  <th>Book In</th>
                  <th>Book End</th>
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
                    <td colSpan="17" className="loading-row">
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
                            <>
                              <FaCheckCircle
                                size={16}
                                className="restore-icon"
                                onClick={() => handleRestoreBook(book.id)}
                                title="Restore"
                              />
                              <FaArchive
                                size={16}
                                className="delete-icon"
                                onClick={() => handleDeleteBook(book.id)}
                                title="Delete Permanently"
                              />
                            </>
                          ) : (
                            <>
                              <FaArchive
                                size={16}
                                className="archive-icon"
                                onClick={() => handleArchiveClick(book)}
                                title="Archive"
                              />
                              {book.archived && (
                                <FaArchive
                                  size={16}
                                  className="delete-icon"
                                  onClick={() => handleDeleteBook(book.id)}
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
                            onClick={() => handleEditClick(book)}
                            style={{ cursor: "pointer" }}
                          >
                            <path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" fill="currentColor" />
                          </svg>
                        </div>
                      </td>
                      <td data-label="Employer Name">
                        <div className="employer-info">
                          <div className="name">
                            {book.employer?.profile ? 
                              `${book.employer.profile.first_name || ''} ${book.employer.profile.last_name || ''}`.trim() || "N/A" 
                              : book.employer_name || "N/A"
                            }
                          </div>
                        </div>
                      </td>
                      <td data-label="Worker Name">
                        <div className="worker-info">
                          <div className="name">
                            {book.worker?.profile ? 
                              `${book.worker.profile.first_name || ''} ${book.worker.profile.last_name || ''}`.trim() || "N/A" 
                              : book.worker_name || "N/A"
                            }
                          </div>
                        </div>
                      </td>
                      <td data-label="Service Type">{book.service_type || "N/A"}</td>
                      <td data-label="Sub Skill">{book.sub_skill || "N/A"}</td>
                      <td data-label="Work Type">
                        {book.work_type ? 
                          book.work_type.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join('-') 
                          : "N/A"
                        }
                      </td>
                      <td data-label="Hours/Day">
                        {book.hours_per_day ? `${book.hours_per_day} hrs` : "N/A"}
                      </td>
                      <td data-label="Address">
                        <div className="address-info">
                          {book.employer?.profile ? (
                            <div>
                              <small> {book.employer.profile.street || ""} {book.employer.profile.city || ""} {book.employer.profile.province || ""} {book.employer.profile.postal_code || ""}</small>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </td>
                      <td data-label="Contact Number">
                        {book.employer?.profile?.contact_number || "N/A"}
                      </td>
                      <td data-label="Description">{book.description || "N/A"}</td>
                      <td data-label="Book In">{formatDate(book.book_in)}</td>
                      <td data-label="Book End">{formatDate(book.book_end)}</td>
                      <td data-label="Daily Rate">
                        ₱{book.daily_rate ? Number(book.daily_rate).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                      </td>
                      <td data-label="Total Amount">
                        ₱{book.total_amount ? Number(book.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                      </td>
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
                    <td colSpan="17">No {showArchived ? "archived" : "active"} bookings found</td>
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
        employers={employers}
        workers={workers}
      />
    </div>
  );
};

export default Book;
