import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_employerlist.scss";
import EmployerModal from "./employerlistmodal.js";

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
  const { first_name, middlename, last_name, suffix_id, suffixes } = person || {};
  let fullName = `${first_name || ""}${middlename ? " " + middlename : ""} ${last_name || ""}`;
  if (suffix_id && suffixes) {
    const suffix = suffixes.find((s) => s.id === suffix_id)?.name || suffixes.find((s) => s.id === suffix_id)?.suffix_name;
    if (suffix) fullName += ` ${suffix}`;
  }
  return fullName.trim() || "N/A";
};

const EmployerList = () => {
  const [employers, setEmployers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedEmployers, setSelectedEmployers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [employerToArchive, setEmployerToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [employerToEdit, setEmployerToEdit] = useState(null);
  const [genders, setGenders] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch employers, genders, and suffixes
  useEffect(() => {
    const controller = new AbortController();
    fetchEmployers(controller.signal);
    fetchGenders(controller.signal);
    fetchSuffixes(controller.signal);

    return () => controller.abort();
  }, [showArchived]);

  const fetchEmployers = async (signal) => {
    try {
      const response = await axios.get(
        showArchived ? "/api/employers/archived" : "/api/employers",
        { signal, timeout: 10000 }
      );
      setEmployers(response.data);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching employers:", error);
      setError("Failed to fetch employers. Please try again.");
    }
  };

  const fetchGenders = async (signal) => {
    try {
      const response = await axios.get("/api/genders", { signal, timeout: 5000 });
      setGenders(response.data);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching genders:", error);
      setError("Failed to fetch genders. Please try again.");
    }
  };

  const fetchSuffixes = async (signal) => {
    try {
      const response = await axios.get("/api/suffixes", { signal, timeout: 5000 });
      setSuffixes(response.data);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching suffixes:", error);
      setError("Failed to fetch suffixes. Please try again.");
    }
  };

  const filteredEmployers = employers.filter((employer) => {
    const ownerFullName = getFullName({ ...employer.profile, suffixes }).toLowerCase();
    const matchesSearch =
      (employer.employer?.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employer.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerFullName.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleSelectEmployer = (employerId) => {
    setSelectedEmployers((prev) =>
      prev.includes(employerId)
        ? prev.filter((id) => id !== employerId)
        : [...prev, employerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmployers.length === filteredEmployers.length) {
      setSelectedEmployers([]);
    } else {
      setSelectedEmployers(filteredEmployers.map((employer) => employer.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ currentPage: 1, totalPages: 1 });
    setSelectedEmployers([]);
  };

  const handleArchiveClick = (employer) => {
    setEmployerToArchive(employer);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!employerToArchive) return;
    try {
      await axios.patch(`/api/employers/${employerToArchive.id}/archive`, {}, { timeout: 5000 });
      await fetchEmployers(new AbortController().signal);
      setIsConfirmModalOpen(false);
      setEmployerToArchive(null);
      setError("");
    } catch (error) {
      console.error("Error archiving employer:", error);
      setError("Failed to archive employer. Please try again.");
    }
  };

  const handleRestoreEmployer = async (employerId) => {
    try {
      await axios.patch(`/api/employers/${employerId}/restore`, {}, { timeout: 5000 });
      await fetchEmployers(new AbortController().signal);
      setError("");
    } catch (error) {
      console.error("Error restoring employer:", error);
      setError("Failed to restore employer. Please try again.");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedEmployers.length === 0) return;
    try {
      await Promise.all(
        selectedEmployers.map((id) =>
          axios.patch(`/api/employers/${id}/${action}`, {}, { timeout: 5000 })
        )
      );
      await fetchEmployers(new AbortController().signal);
      setSelectedEmployers([]);
      setError("");
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      setError(`Failed to perform bulk ${action}. Please try again.`);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setEmployerToEdit(null);
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = async (employer) => {
    try {
      const response = await axios.get(`/api/employers/${employer.id}`, { timeout: 5000 });
      console.log("Fetched employer data:", response.data); // Debug API response
      setEmployerToEdit({
        id: response.data.id,
        company_name: response.data.employer?.company_name || "",
        company_phone: response.data.employer?.company_phone || "",
        company_email: response.data.employer?.company_email || "",
        company_address: response.data.employer?.company_address || "",
        email: response.data.email || "",
        username: response.data.username || "",
        first_name: response.data.profile?.first_name || "",
        middlename: response.data.profile?.middlename || "",
        last_name: response.data.profile?.last_name || "",
        suffix_id: response.data.profile?.suffix_id || "",
        gender_id: response.data.profile?.gender_id || "",
        contact_number: response.data.profile?.contact_number || "",
        street: response.data.profile?.street || "",
        city: response.data.profile?.city || "Butuan City",
        province: response.data.profile?.province || "Agusan Del Norte",
        postal_code: response.data.profile?.postal_code || "8600",
        country: response.data.profile?.country || "Philippines",
        role_id: "2",
        profile_img: null,
      });
      setIsEditMode(true);
      setIsModalOpen(true);
      setError("");
    } catch (error) {
      console.error("Error fetching employer details:", error);
      setError("Failed to fetch employer details. Please try again.");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEmployerToEdit(null);
    setError("");
  };

  const handleEmployerAdd = async (formData, signal) => {
    try {
      formData.append("role_id", "2");
      const response = await axios.post("/api/employers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
        signal,
      });
      await fetchEmployers(new AbortController().signal);
      setIsModalOpen(false);
      setError("");
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Add request was aborted");
        return;
      }
      console.error("Error adding employer:", error);
      throw error;
    }
  };

  const handleEmployerUpdate = async (formData, signal) => {
    try {
      formData.append("role_id", "2");
      console.log("Sending update request with FormData:", formData); // Debug request
      const response = await axios.post(`/api/employers/${employerToEdit.id}?_method=PUT`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Accept": "application/json"
        },
        timeout: 10000,
        signal,
      });
      await fetchEmployers(new AbortController().signal);
      setIsModalOpen(false);
      setIsEditMode(false);
      setEmployerToEdit(null);
      setError("");
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Update request was aborted");
        return;
      }
      console.error("Error updating employer:", error);
      throw error;
    }
  };

  const employersPerPage = 5;
  const totalPages = Math.ceil(filteredEmployers.length / employersPerPage);
  const currentEmployers = filteredEmployers.slice(
    (pagination.currentPage - 1) * employersPerPage,
    pagination.currentPage * employersPerPage
  );

  const handlePageChange = (page) => {
    setPagination({ currentPage: page, totalPages });
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
      <AdminSidebar activeItem="Employer List" />
      <TopNavbar />
      <div className="employerlist-dashboard">
        <div className="employerlist-content">
          <h2>{showArchived ? "Archived Employers" : "Employer List"}</h2>
          {error && <div className="error">{error}</div>}
          <div className="employerlist-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Employers"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedEmployers.length > 0 && (
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
          <div className="employerlist-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedEmployers.length === filteredEmployers.length && filteredEmployers.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Company Name</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployers.length > 0 ? (
                  currentEmployers.map((employer) => (
                    <tr key={employer.id}>
                      <td data-label="Actions">
                        <div className="action-icons">
                          <span onClick={() => toggleSelectEmployer(employer.id)} style={{ cursor: "pointer" }}>
                            {selectedEmployers.includes(employer.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreEmployer(employer.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(employer)}
                            />
                          )}
                          <FaUser
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(employer)}
                          />
                        </div>
                      </td>
                      <td data-label="Company Name" className="company-name-cell">{employer.employer?.company_name || "N/A"}</td>
                      <td data-label="Owner" className="owner-cell">{getFullName({ ...employer.profile, suffixes })}</td>
                      <td data-label="Email">{employer.email || "N/A"}</td>
                      <td data-label="Phone">{employer.profile?.contact_number || "N/A"}</td>
                      <td data-label="Address">{employer.employer?.company_address || "N/A"}</td>
                      <td data-label="Created At">{formatDate(employer.created_at)}</td>
                      <td data-label="Updated At">{formatDate(employer.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No {showArchived ? "archived" : "active"} employers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="employerlist-pagination">
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
            <p>Do you want to archive "{employerToArchive?.employer?.company_name || "N/A"}"?</p>
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
          onSubmit={isEditMode ? handleEmployerUpdate : handleEmployerAdd}
          isEdit={isEditMode}
          initialData={employerToEdit}
          genders={genders}
          suffixes={suffixes}
        />
      )}
    </div>
  );
};

export default EmployerList;