import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_companylist.scss";
import CompanyModal from "./Companymodal.js";

const Loader = () => (
  <div className="loader" style={{
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "20px",
    background: "rgba(0, 0, 0, 0.7)",
    color: "white",
    borderRadius: "5px",
    zIndex: 1000
  }}>
    Loading...
  </div>
);

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

const getEmployerName = (company, employers = []) => {
  const employer = employers.find((e) => e.id === parseInt(company.employer_id));
  if (!employer || !employer.profile) {
    console.warn("Invalid employer or missing profile for company:", company, { employers });
    return "N/A";
  }
  const { full_name, first_name, middlename, last_name, suffix } = employer.profile;
  const name = full_name || [first_name, middlename, last_name, suffix].filter(Boolean).join(" ") || "N/A";
  console.log("Employer name for company:", name, { employer });
  return name;
};

const getWorkerNames = (workerIds = [], workers = []) => {
  if (!Array.isArray(workerIds) || workerIds.length === 0) return "None";
  return workerIds
    .map((id) => {
      const worker = workers.find((worker) => worker.id === parseInt(id));
      if (!worker || !worker.profile) {
        console.warn("Invalid worker or missing profile for id:", id, { workers });
        return "Unknown Worker";
      }
      const { full_name, first_name, middlename, last_name, suffix } = worker.profile;
      const name = full_name || [first_name, middlename, last_name, suffix].filter(Boolean).join(" ") || "Unknown Worker";
      console.log("Worker name:", name, { worker });
      return name;
    })
    .join(", ");
};

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [companyToArchive, setCompanyToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchCompanies(pagination.currentPage, showArchived, controller.signal),
          fetchEmployers(controller.signal),
          fetchWorkers(controller.signal),
        ]);
        setDataLoaded(true);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError("Failed to load data. Please try again.");
        setDataLoaded(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [pagination.currentPage, showArchived, searchTerm]);

  const fetchCompanies = async (page = 1, archived = false, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("Please log in to view companies.");
      }
      const response = await axios.get(`http://127.0.0.1:8000/api/companies${archived ? '/archived' : ''}`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        params: { page, limit: 5, search: searchTerm },
        signal,
        timeout: 10000,
      });
      setCompanies(response.data.companies || []);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
      });
      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to fetch companies.");
      console.error("Fetch companies error:", err.response?.data || err.message);
    }
  };

  const fetchEmployers = async (signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const response = await axios.get("http://127.0.0.1:8000/api/employers", {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        signal,
        timeout: 5000,
      });
      const employersData = Array.isArray(response.data) ? response.data : response.data.employers || [];
      setEmployers(employersData);
      console.log("Fetched employers:", employersData);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching employers:", err);
      setError("Failed to fetch employers. Please try again.");
    }
  };

  const fetchWorkers = async (signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const response = await axios.get("http://127.0.0.1:8000/api/workers", {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        signal,
        timeout: 5000,
      });
      const workersData = Array.isArray(response.data.workers) ? response.data.workers : [];
      setWorkers(workersData);
      console.log("Fetched workers:", workersData);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching workers:", err);
      setError("Failed to fetch workers. Please try again.");
    }
  };

  const toggleSelectCompany = (companyId) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map((company) => company.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedCompanies([]);
  };

  const handleArchiveClick = (company) => {
    if (company.archived) {
      message.error("Company is already archived.");
      return;
    }
    setCompanyToArchive(company);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!companyToArchive) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/companies/${companyToArchive.id}/archive`,
        { archived: true },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      if (response.status === 200) {
        await fetchCompanies(pagination.currentPage, showArchived, new AbortController().signal);
        setIsConfirmModalOpen(false);
        setCompanyToArchive(null);
        message.success(`Company "${companyToArchive.company_name}" archived successfully!`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to archive company.");
      console.error("Archive error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCompany = async (companyId) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company?.archived) {
      message.error("Company is already restored.");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/companies/${companyId}/archive`,
        { archived: false },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      if (response.status === 200) {
        await fetchCompanies(pagination.currentPage, showArchived, new AbortController().signal);
        message.success(`Company "${company.company_name}" restored successfully!`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to restore company.");
      console.error("Restore error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCompanies.length === 0) {
      message.error("Please select at least one company.");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const validCompanyIds = selectedCompanies.filter((id) => {
        const company = companies.find((c) => c.id === id);
        return action === "archive" ? !company?.archived : company?.archived;
      });
      if (validCompanyIds.length === 0) {
        message.error(`All selected companies are already ${action === "archive" ? "archived" : "restored"}.`);
        return;
      }
      setLoading(true);
      const response = await axios.post(
        `http://127.0.0.1:8000/api/companies/bulk-archive`,
        { company_ids: validCompanyIds, archived: action === "archive" },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 10000,
        }
      );
      if (response.status === 200) {
        await fetchCompanies(pagination.currentPage, showArchived, new AbortController().signal);
        setSelectedCompanies([]);
        message.success(`${validCompanyIds.length} companies ${action === "archive" ? "archived" : "restored"} successfully!`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || `Failed to ${action} companies. Please try again.`);
      console.error("Bulk action error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = async () => {
    if (!dataLoaded) {
      message.error("Please wait until employer and worker data is loaded.");
      return;
    }
    setIsEditMode(false);
    setCompanyToEdit({
      company_name: "",
      employer_id: "",
      worker_ids: [],
      street: "",
      contact_number: "",
      city: "",
      province: "",
      postal_code: "",
      country: "",
    });
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = async (company) => {
    if (!dataLoaded) {
      message.error("Please wait until employer and worker data is loaded.");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/companies/${company.id}`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        timeout: 5000,
      });
      setCompanyToEdit({
        id: response.data.company.id,
        company_name: response.data.company.company_name || "Unnamed Company",
        employer_id: response.data.company.employer_id ? String(response.data.company.employer_id) : "",
        worker_ids: Array.isArray(response.data.company.worker_ids) ? response.data.company.worker_ids.map(String) : [],
        workers: response.data.company.workers || [],
        street: response.data.company.street || "",
        contact_number: response.data.company.contact_number || "",
        city: response.data.company.city || "",
        province: response.data.company.province || "",
        postal_code: response.data.company.postal_code || "",
        country: response.data.company.country || "",
      });
      setIsEditMode(true);
      setIsModalOpen(true);
      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to fetch company details.");
      console.error("Fetch company details error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCompanyToEdit(null);
    setError("");
  };

  const handleCompanyAdd = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:8000/api/companies", formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 10000,
        signal,
      });
      if (response.status === 201) {
        await fetchCompanies(pagination.currentPage, showArchived, new AbortController().signal);
        setIsModalOpen(false);
        message.success("Company added successfully!");
        return response.data;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Add request was aborted");
        return;
      }
      console.error("Error adding company:", err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyUpdate = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      if (!companyToEdit?.id) {
        throw new Error("No company ID provided for update.");
      }
      setLoading(true);
      const response = await axios.post(
        `http://127.0.0.1:8000/api/companies/${companyToEdit.id}?_method=PUT`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          timeout: 10000,
          signal,
        }
      );
      if (response.status === 200) {
        await fetchCompanies(pagination.currentPage, showArchived, new AbortController().signal);
        setIsModalOpen(false);
        setIsEditMode(false);
        setCompanyToEdit(null);
        message.success("Company updated successfully!");
        return response.data;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Update request was aborted");
        return;
      }
      console.error("Error updating company:", err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
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

      if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);
        }
        pageNumbers.push(
          <button key={pagination.totalPages} onClick={() => setPagination({ ...pagination, currentPage: pagination.totalPages })}>
            {pagination.totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="app">
      {loading && <Loader />}
      <AdminSidebar activeItem="Company List" />
      <TopNavbar />
      <div className="companylist-dashboard">
        <div className="companylist-content">
          <h2>{showArchived ? "Archived Companies" : "Company List"}</h2>
          {error && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
          <div className="companylist-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Companies"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedCompanies.length > 0 && (
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
          <div className="companylist-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedCompanies.length === companies.length && companies.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Company Name</th>
                  <th>Employer</th>
                  <th>Hired Workers</th>
                  <th>Street</th>
                  <th>Contact Number</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="loading-row">Loading companies...</td>
                  </tr>
                ) : companies.length > 0 ? (
                  companies.map((company) => (
                    <tr key={company.id}>
                      <td>
                        <div className="action-icons">
                          <span
                            onClick={() => toggleSelectCompany(company.id)}
                            style={{ cursor: "pointer" }}
                          >
                            {selectedCompanies.includes(company.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreCompany(company.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(company)}
                            />
                          )}
                          <FaEdit
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(company)}
                          />
                        </div>
                      </td>
                      <td>{company.company_name || "N/A"}</td>
                      <td>{getEmployerName(company, employers)}</td>
                      <td>{getWorkerNames(company.worker_ids, workers)}</td>
                      <td>{company.street || "N/A"}</td>
                      <td>{company.contact_number || "N/A"}</td>
                      <td>{formatDate(company.created_at)}</td>
                      <td>{formatDate(company.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No {showArchived ? "archived" : "active"} companies found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="companylist-pagination">
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
            <p>Do you want to archive "{companyToArchive?.company_name || 'Unnamed Company'}"?</p>
            <div className="confirm-modal-buttons">
              <button className="cancel-button" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </button>
              <button className="confirm-button" onClick={handleArchiveConfirm}>
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <CompanyModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleCompanyUpdate : handleCompanyAdd}
          isEdit={isEditMode}
          initialData={companyToEdit}
          employers={employers}
          workers={workers}
        />
      )}
    </div>
  );
};

export default CompanyList;