import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_workerlist.scss";
import WorkerModal from "./workerlistmodal.js";

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

const getFullName = (worker, suffixes = []) => {
  const { first_name, middlename, last_name, suffix_id } = worker?.profile || {};
  let fullName = `${first_name || ""}${middlename ? " " + middlename : ""} ${last_name || ""}`;
  if (suffix_id && suffixes.length > 0) {
    const suffix = suffixes.find((s) => s.id === parseInt(suffix_id))?.suffix_name;
    if (suffix) fullName += ` ${suffix}`;
  }
  return fullName.trim() || "N/A";
};

const WorkerList = () => {
  const [workers, setWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [workerToArchive, setWorkerToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState(null);
  const [genders, setGenders] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch workers, genders, and suffixes
  useEffect(() => {
    const controller = new AbortController();
    fetchWorkers(pagination.currentPage, showArchived, controller.signal);
    fetchGenders(controller.signal);
    fetchSuffixes(controller.signal);

    return () => controller.abort();
  }, [pagination.currentPage, showArchived, searchTerm]);

  const fetchWorkers = async (page = 1, archived = false, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        setError("Please log in to view workers.");
        return;
      }
      const response = await axios.get(`http://127.0.0.1:8000/api/workers${archived ? '/archived' : ''}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { page, limit: 5, search: searchTerm },
        signal,
        timeout: 10000,
      });
      setWorkers(response.data.workers || []);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
      });
      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to fetch workers.");
      console.error("Fetch workers error:", err.response?.data || err.message);
    }
  };

  const fetchGenders = async (signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.get("http://127.0.0.1:8000/api/genders", {
        headers: { Authorization: `Bearer ${authToken}` },
        signal,
        timeout: 5000,
      });
      setGenders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching genders:", err);
      setError("Failed to fetch genders. Please try again.");
    }
  };

  const fetchSuffixes = async (signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.get("http://127.0.0.1:8000/api/suffixes", {
        headers: { Authorization: `Bearer ${authToken}` },
        signal,
        timeout: 5000,
      });
      setSuffixes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching suffixes:", err);
      setError("Failed to fetch suffixes. Please try again.");
    }
  };

  const toggleSelectWorker = (workerId) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map((worker) => worker.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedWorkers([]);
  };

  const handleArchiveClick = (worker) => {
    setWorkerToArchive(worker);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!workerToArchive) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      await axios.patch(
        `http://127.0.0.1:8000/api/workers/${workerToArchive.id}/archive`,
        { archived: true },
        { headers: { Authorization: `Bearer ${authToken}` }, timeout: 5000 }
      );
      await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
      setIsConfirmModalOpen(false);
      setWorkerToArchive(null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to archive worker.");
      console.error("Archive error:", err.response?.data || err.message);
    }
  };

  const handleRestoreWorker = async (workerId) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      await axios.patch(
        `http://127.0.0.1:8000/api/workers/${workerId}/archive`,
        { archived: false },
        { headers: { Authorization: `Bearer ${authToken}` }, timeout: 5000 }
      );
      await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to restore worker.");
      console.error("Restore error:", err.response?.data || err.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedWorkers.length === 0) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      await axios.post(
        `http://127.0.0.1:8000/api/workers/bulk-archive`,
        { worker_ids: selectedWorkers, action },
        { headers: { Authorization: `Bearer ${authToken}` }, timeout: 10000 }
      );
      await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
      setSelectedWorkers([]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} workers.`);
      console.error("Bulk action error:", err.response?.data || err.message);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setWorkerToEdit(null);
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = async (worker) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.get(`http://127.0.0.1:8000/api/workers/${worker.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 5000,
      });
      console.log("Fetched worker data:", response.data); // Debug API response
      setWorkerToEdit({
        id: response.data.id,
        email: response.data.email || "",
        username: response.data.username || "",
        first_name: response.data.profile?.first_name || "",
        middlename: response.data.profile?.middlename || "",
        last_name: response.data.profile?.last_name || "",
        suffix_id: response.data.profile?.suffix_id ? String(response.data.profile.suffix_id) : "",
        gender_id: response.data.profile?.gender_id ? String(response.data.profile.gender_id) : "",
        contact_number: response.data.profile?.contact_number || "",
        street: response.data.profile?.street || "",
        city: response.data.profile?.city || "Butuan City",
        province: response.data.profile?.province || "Agusan Del Norte",
        postal_code: response.data.profile?.postal_code || "8600",
        country: response.data.profile?.country || "Philippines",
        work_type: response.data.worker?.work_type || "part-time",
        credentials: response.data.worker?.credentials || [], // Expecting [{name: "Resume/CV", photo: "path/to/file"}, ...]
        role_id: "1",
        profile_img: null,
      });
      setIsEditMode(true);
      setIsModalOpen(true);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch worker details.");
      console.error("Fetch worker details error:", err.response?.data || err.message);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setWorkerToEdit(null);
    setError("");
  };

  const handleWorkerAdd = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.post("http://127.0.0.1:8000/api/workers", formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 10000,
        signal,
      });
      await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
      setIsModalOpen(false);
      setError("");
      return response.data;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Add request was aborted");
        return;
      }
      console.error("Error adding worker:", err.response?.data || err.message);
      throw err;
    }
  };

  const handleWorkerUpdate = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      console.log("Sending update request with FormData:", formData); // Debug request
      const response = await axios.post(
        `http://127.0.0.1:8000/api/workers/${workerToEdit.id}?_method=PUT`,
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
      await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
      setIsModalOpen(false);
      setIsEditMode(false);
      setWorkerToEdit(null);
      setError("");
      return response.data;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Update request was aborted");
        return;
      }
      console.error("Error updating worker:", err.response?.data || err.message);
      throw err;
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
            onClick={() => fetchWorkers(i, showArchived)}
          >
            {i}
          </button>
        );
      }
    } else {
      if (startPage > 1) {
        pageNumbers.push(
          <button key={1} onClick={() => fetchWorkers(1, showArchived)}>
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
            onClick={() => fetchWorkers(i, showArchived)}
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
          <button key={pagination.totalPages} onClick={() => fetchWorkers(pagination.totalPages, showArchived)}>
            {pagination.totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="app">
      <AdminSidebar activeItem="Worker List" />
      <TopNavbar />
      <div className="workerlist-dashboard">
        <div className="workerlist-content">
          <h2>{showArchived ? "Archived Workers" : "Worker List"}</h2>
          {error && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
          <div className="workerlist-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Workers"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedWorkers.length > 0 && (
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
          <div className="workerlist-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedWorkers.length === workers.length && workers.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Full Name</th>
                  <th>Work Type</th>
                  <th>Credentials</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {workers.length > 0 ? (
                  workers.map((worker) => (
                    <tr key={worker.id}>
                      <td>
                        <div className="action-icons">
                          <span
                            onClick={() => toggleSelectWorker(worker.id)}
                            style={{ cursor: "pointer" }}
                          >
                            {selectedWorkers.includes(worker.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreWorker(worker.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(worker)}
                            />
                          )}
                          <FaUser
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(worker)}
                          />
                        </div>
                      </td>
                      <td className="username-cell">{getFullName(worker, suffixes)}</td>
                      <td>
                        {worker.worker?.work_type
                          ? worker.worker.work_type.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                          : "N/A"}
                      </td>
                      <td>
                        {worker.worker?.credentials?.length > 0
                          ? worker.worker.credentials.map((cred) => cred.name).join(", ")
                          : "None"}
                      </td>
                      <td>{worker.email || "N/A"}</td>
                      <td>{formatDate(worker.created_at)}</td>
                      <td>{formatDate(worker.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>{`No ${showArchived ? "archived" : "active"} workers found`}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="workerlist-pagination">
            <span>{`Page ${pagination.currentPage} of ${pagination.totalPages}`}</span>
            <button
              onClick={() => fetchWorkers(pagination.currentPage - 1, showArchived)}
              disabled={pagination.currentPage <= 1}
            >
              &lt;
            </button>
            {renderPagination()}
            <button
              onClick={() => fetchWorkers(pagination.currentPage + 1, showArchived)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
      {isConfirmModalOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Are you sure?</h3>
            <p>{`Do you want to archive "${getFullName(workerToArchive, suffixes)}"?`}</p>
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
        <WorkerModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleWorkerUpdate : handleWorkerAdd}
          isEdit={isEditMode}
          initialData={workerToEdit}
          genders={genders}
          suffixes={suffixes}
        />
      )}
    </div>
  );
};

export default WorkerList;