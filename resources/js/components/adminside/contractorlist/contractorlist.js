import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaArchive, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_employerlist.scss";
import Loader from "./../../LoaderContent/loader";
import ContractorModal from "./contractorlistmodal.js";
import defpfp from "/images/defpfp.svg";

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

const ContractorList = () => {
  const [contractors, setContractors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [contractorToArchive, setContractorToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [contractorToEdit, setContractorToEdit] = useState(null);
  const [genders, setGenders] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const navigate = useNavigate();

  // Fetch contractors, genders, and suffixes
  useEffect(() => {
    const controller = new AbortController();
    fetchContractors(controller.signal);
    fetchGenders(controller.signal);
    fetchSuffixes(controller.signal);

    return () => controller.abort();
  }, [showArchived]);

  const fetchContractors = async (signal) => {
    try {
      setLoading(true);
      const response = await axios.get(
        showArchived ? "/api/contractors/archived" : "/api/contractors",
        { signal, timeout: 10000 }
      );
      setContractors(response.data);
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching contractors:", error);
      setError("Failed to fetch contractors. Please try again.");
    } finally {
      setLoading(false);
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

  const filteredContractors = contractors.filter((contractor) => {
    const ownerFullName = getFullName(contractor.profile).toLowerCase();
    const matchesSearch =
      (contractor.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerFullName.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleSelectContractor = (contractorId) => {
    setSelectedContractors((prev) =>
      prev.includes(contractorId)
        ? prev.filter((id) => id !== contractorId)
        : [...prev, contractorId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContractors.length === filteredContractors.length) {
      setSelectedContractors([]);
    } else {
      setSelectedContractors(filteredContractors.map((contractor) => contractor.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ currentPage: 1, totalPages: 1 });
    setSelectedContractors([]);
  };

  const handleArchiveClick = (contractor) => {
    setContractorToArchive(contractor);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!contractorToArchive) return;
    try {
      await axios.patch(`/api/contractors/${contractorToArchive.id}/archive`, {}, { timeout: 5000 });
      await fetchContractors(new AbortController().signal);
      setIsConfirmModalOpen(false);
      setContractorToArchive(null);
      setError("");
      message.success("Contractor archived successfully!");
    } catch (error) {
      console.error("Error archiving contractor:", error);
      setError("Failed to archive contractor. Please try again.");
      message.error("Failed to archive contractor. Please try again.");
    }
  };

  const handleRestoreContractor = async (contractorId) => {
    try {
      await axios.patch(`/api/contractors/${contractorId}/restore`, {}, { timeout: 5000 });
      await fetchContractors(new AbortController().signal);
      setError("");
      message.success("Contractor restored successfully!");
    } catch (error) {
      console.error("Error restoring contractor:", error);
      setError("Failed to restore contractor. Please try again.");
      message.error("Failed to restore contractor. Please try again.");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedContractors.length === 0) {
      message.warning("No contractors selected.");
      return;
    }
    const count = selectedContractors.length;
    try {
      await Promise.all(
        selectedContractors.map((id) =>
          axios.patch(`/api/contractors/${id}/${action}`, {}, { timeout: 5000 })
        )
      );
      await fetchContractors(new AbortController().signal);
      setSelectedContractors([]);
      setError("");
      message.success(`${count} contractor(s) ${action === 'archive' ? 'archived' : 'restored'} successfully!`);
    } catch (error) {
      const errorMsg = `Failed to perform bulk ${action}. Please try again.`;
      console.error(`Error performing bulk ${action}:`, error);
      setError(errorMsg);
      message.error(errorMsg);
    }
  };

  const contractorsPerPage = 5;
  const totalPages = Math.ceil(filteredContractors.length / contractorsPerPage);
  const currentContractors = filteredContractors.slice(
    (pagination.currentPage - 1) * contractorsPerPage,
    pagination.currentPage * contractorsPerPage
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

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setContractorToEdit(null);
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = async (contractor) => {
    try {
      const response = await axios.get(`/api/contractors/${contractor.id}`, { timeout: 5000 });
      console.log("Fetched contractor data:", response.data);
      
      // Extract contractor data from response - API returns {contractor: user}
      const contractorData = response.data.contractor || response.data;
      
      if (!contractorData || !contractorData.id) {
        throw new Error("Invalid contractor data received from server");
      }
      
      setContractorToEdit({
        id: contractorData.id,
        email: contractorData.email || "",
        username: contractorData.username || "",
        first_name: contractorData.profile?.first_name || "",
        middlename: contractorData.profile?.middlename || "",
        last_name: contractorData.profile?.last_name || "",
        suffix_id: contractorData.profile?.suffix_id || "",
        gender_id: contractorData.profile?.gender_id || "",
        contact_number: contractorData.profile?.contact_number || "",
        street: contractorData.profile?.street || "",
        city: contractorData.profile?.city || "Butuan City",
        province: contractorData.profile?.province || "Agusan Del Norte",
        postal_code: contractorData.profile?.postal_code || "8600",
        country: contractorData.profile?.country || "Philippines",
        role_id: "4",
        profile_img: null,
      });
      setIsEditMode(true);
      setIsModalOpen(true);
      setError("");
    } catch (error) {
      console.error("Error fetching contractor details:", error);
      const errorMsg = error.response?.data?.error || error.message || "Failed to fetch contractor details. Please try again.";
      setError(errorMsg);
      message.error(errorMsg);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setContractorToEdit(null);
    setError("");
  };

  const handleContractorAdd = async (formData, signal) => {
    try {
      formData.append("role_id", "4");
      const response = await axios.post("/api/contractors", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
        signal,
      });
      await fetchContractors(new AbortController().signal);
      setIsModalOpen(false);
      setError("");
      message.success("Contractor added successfully!");
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Add request was aborted");
        return;
      }
      console.error("Error adding contractor:", error);
      throw error;
    }
  };

  const handleContractorUpdate = async (formData, signal) => {
    try {
      if (!contractorToEdit || !contractorToEdit.id) {
        throw new Error("Contractor ID is missing. Please try editing again.");
      }
      
      formData.append("role_id", "4");
      console.log("Sending update request with FormData for contractor ID:", contractorToEdit.id);
      const response = await axios.post(`/api/contractors/${contractorToEdit.id}?_method=PUT`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Accept": "application/json"
        },
        timeout: 10000,
        signal,
      });
      await fetchContractors(new AbortController().signal);
      setIsModalOpen(false);
      setIsEditMode(false);
      setContractorToEdit(null);
      setError("");
      message.success("Contractor updated successfully!");
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Update request was aborted");
        return;
      }
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to update contractor. Please try again.";
      console.error("Error updating contractor:", errorMsg, error);
      message.error(errorMsg);
      throw error;
    }
  };

  return (
    <div className="app">
      {loading && <Loader />}
      <AdminSidebar activeItem="Contractor List" />
      <TopNavbar />
      <div className="employerlist-dashboard">
        <div className="employerlist-content">
          <h2>{showArchived ? "Archived Contractors" : "Contractor List"}</h2>
          {error && <div className="error">{error}</div>}
          <div className="employerlist-header">
            <div className="left-actions">
              <input
                type="text"
                className="search-input"
                placeholder="Search Contractors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="right-actions">
              {selectedContractors.length > 0 && (
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
                        {selectedContractors.length === filteredContractors.length && filteredContractors.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Profile Image</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {currentContractors.length > 0 ? (
                  currentContractors.map((contractor) => (
                    <tr key={contractor.id}>
                      <td data-label="Actions">
                        <div className="action-icons">
                          <span onClick={() => toggleSelectContractor(contractor.id)} style={{ cursor: "pointer" }}>
                            {selectedContractors.includes(contractor.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreContractor(contractor.id)}
                            />
                          ) : (
                            <>
                              <FaArchive
                                size={16}
                                className="delete-icon"
                                onClick={() => handleArchiveClick(contractor)}
                              />
                              <FaEdit
                                size={16}
                                className="edit-icon"
                                onClick={() => handleEditClick(contractor)}
                              />
                            </>
                          )}
                        </div>
                      </td>
                      <td data-label="Profile Image">
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {contractor.profile?.profile_img ? (
                            <img 
                              src={`http://127.0.0.1:8000/storage/${contractor.profile.profile_img}`} 
                              alt="Profile" 
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <img 
                              src={defpfp}
                              alt="Default Profile" 
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                      </td>
                      <td data-label="Full Name" className="owner-cell">{getFullName(contractor.profile)}</td>
                      <td data-label="Email">{contractor.email || "N/A"}</td>
                      <td data-label="Created At">{formatDate(contractor.created_at)}</td>
                      <td data-label="Updated At">{formatDate(contractor.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No {showArchived ? "archived" : "active"} contractors found</td>
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
            <p>Do you want to archive "{getFullName(contractorToArchive?.profile)}"?</p>
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
        <ContractorModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleContractorUpdate : handleContractorAdd}
          isEdit={isEditMode}
          initialData={contractorToEdit}
          genders={genders}
          suffixes={suffixes}
        />
      )}
    </div>
  );
};

export default ContractorList;

