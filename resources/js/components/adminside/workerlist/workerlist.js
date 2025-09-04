import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaEye, FaTrash } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_workerlist.scss";
import WorkerModal from "./workerlistmodal.js";

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
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewCredential, setPreviewCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchWorkers(pagination.currentPage, showArchived, controller.signal),
          fetchGenders(controller.signal),
          fetchSuffixes(controller.signal),
          fetchSkills(controller.signal),
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [pagination.currentPage, showArchived, searchTerm]);

  const fetchWorkers = async (page = 1, archived = false, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("Please log in to view workers.");
      }
      const response = await axios.get(`http://127.0.0.1:8000/api/workers${archived ? '/archived' : ''}`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
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
      message.error(err.response?.data?.error || "Failed to fetch workers.");
      console.error("Fetch workers error:", err.response?.data || err.message);
    }
  };

  const fetchGenders = async (signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const response = await axios.get("http://127.0.0.1:8000/api/genders", {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        signal,
        timeout: 5000,
      });
      setGenders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching genders:", err);
      message.error("Failed to fetch genders. Please try again.");
    }
  };

  const fetchSuffixes = async (signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const response = await axios.get("http://127.0.0.1:8000/api/suffixes", {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        signal,
        timeout: 5000,
      });
      setSuffixes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching suffixes:", err);
      message.error("Failed to fetch suffixes. Please try again.");
    }
  };

  const fetchSkills = async (signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const response = await axios.get("http://127.0.0.1:8000/api/skills", {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        signal,
        timeout: 5000,
      });
      setSkills(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching skills:", err);
      message.error("Failed to fetch skills. Please try again.");
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
    const currentWorkers = workers;
    if (selectedWorkers.length === currentWorkers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(currentWorkers.map((worker) => worker.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedWorkers([]);
  };

  const handleArchiveClick = (worker) => {
    if (worker.archived) {
      message.error("Worker is already archived.");
      return;
    }
    setWorkerToArchive(worker);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!workerToArchive) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/workers/${workerToArchive.id}/archive`,
        { archived: true },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      if (response.status === 200) {
        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
        setIsConfirmModalOpen(false);
        setWorkerToArchive(null);
        message.success(`Worker "${getFullName(workerToArchive, suffixes)}" archived successfully!`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      message.error(err.response?.data?.error || "Failed to archive worker.");
      console.error("Archive error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreWorker = async (workerId) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker?.archived) {
      message.error("Worker is already restored.");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/workers/${workerId}/archive`,
        { archived: false },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      if (response.status === 200) {
        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
        message.success(`Worker "${getFullName(worker, suffixes)}" restored successfully!`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      message.error(err.response?.data?.error || "Failed to restore worker.");
      console.error("Restore error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedWorkers.length === 0) {
      message.error("Please select at least one worker.");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const validWorkerIds = selectedWorkers.filter((id) => {
        const worker = workers.find((w) => w.id === id);
        return action === "archive" ? !worker?.archived : worker?.archived;
      });
      if (validWorkerIds.length === 0) {
        message.error(`All selected workers are already ${action === "archive" ? "archived" : "restored"}.`);
        return;
      }
      setLoading(true);
      const response = await axios.post(
        `http://127.0.0.1:8000/api/workers/bulk-archive`,
        { worker_ids: validWorkerIds, archived: action === "archive" },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 10000,
        }
      );
      if (response.status === 200) {
        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
        setSelectedWorkers([]);
        message.success(`${validWorkerIds.length} workers ${action === "archive" ? "archived" : "restored"} successfully!`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      message.error(err.response?.data?.error || `Failed to ${action} workers. Please try again.`);
      console.error("Bulk action error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setWorkerToEdit({
      email: "",
      username: "",
      profile: {
        first_name: "",
        middlename: "",
        last_name: "",
        suffix_id: "",
        gender_id: "",
        contact_number: "",
        street: "",
        city: "Butuan City",
        province: "Agusan Del Norte",
        postal_code: "8600",
        country: "Philippines",
        profile_img: null,
      },
      worker: {
        work_type: "part-time",
        skills_id: [],
        credentials_name: [],
        credentials_photo: [],
      },
    });
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = async (worker) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/workers/${worker.id}`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        timeout: 5000,
      });
      setWorkerToEdit({
        id: response.data.id,
        email: response.data.email || "",
        username: response.data.username || "",
        profile: {
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
          profile_img: response.data.profile?.profile_img || null,
        },
        worker: {
          work_type: response.data.worker?.work_type || "part-time",
          skills_id: response.data.worker?.skills_id || [],
          credentials_name: response.data.worker?.credentials_name || [],
          credentials_photo: response.data.worker?.credentials_photo || [],
        },
      });
      setIsEditMode(true);
      setIsModalOpen(true);
      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;
      message.error(err.response?.data?.error || "Failed to fetch worker details.");
      console.error("Fetch worker details error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewClick = (credential) => {
    setPreviewCredential(credential);
    setIsPreviewModalOpen(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewModalOpen(false);
    setPreviewCredential(null);
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
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:8000/api/workers", formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 10000,
        signal,
      });
      if (response.status === 201) {
        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
        setIsModalOpen(false);
        message.success("Worker added successfully!");
        return response.data;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Add request was aborted");
        return;
      }
      console.error("Error adding worker:", err.response?.data || err.message);
      message.error(err.response?.data?.error || "Failed to add worker.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerUpdate = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
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
      if (response.status === 200) {
        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
        setIsModalOpen(false);
        setIsEditMode(false);
        setWorkerToEdit(null);
        message.success("Worker updated successfully!");
        return response.data;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Update request was aborted");
        return;
      }
      console.error("Error updating worker:", err.response?.data || err.message);
      message.error(err.response?.data?.error || "Failed to update worker.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isImageFile = (path) => /\.(jpg|jpeg|png)$/i.test(path);

  const getSkillNames = (skillsId = []) => {
    if (!Array.isArray(skillsId) || skillsId.length === 0) return "None";
    return skillsId
      .map((id) => skills.find((skill) => skill.id === parseInt(id))?.name || "Unknown")
      .join(", ");
  };

  const workersPerPage = 5;
  const filteredWorkers = workers.filter((worker) => {
    const fullName = getFullName(worker, suffixes).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || worker.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(pagination.totalItems / workersPerPage));
  const currentWorkers = filteredWorkers;

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
          <button key={totalPages} onClick={() => setPagination({ ...pagination, currentPage: totalPages })}>
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
                        {selectedWorkers.length === currentWorkers.length && currentWorkers.length > 0 ? (
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
                  <th>Work Type</th>
                  <th>Skills</th>
                  <th>Credentials</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="loading-row">Loading workers...</td>
                  </tr>
                ) : currentWorkers.length > 0 ? (
                  currentWorkers.map((worker) => {
                    const credentials = Array.isArray(worker.worker?.credentials_name) && 
                      Array.isArray(worker.worker?.credentials_photo)
                      ? worker.worker.credentials_name
                          .map((name, index) => ({
                            credentials_name: name,
                            credentials_photo: worker.worker.credentials_photo[index],
                          }))
                          .filter((cred) => cred.credentials_name && cred.credentials_photo)
                      : [];
                    return (
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
                            <FaEdit
                              size={16}
                              className="edit-icon"
                              onClick={() => handleEditClick(worker)}
                            />
                          </div>
                        </td>
                        <td>
                          {worker.profile?.profile_img ? (
                            <img
                              src={`http://127.0.0.1:8000/storage/${worker.profile.profile_img}`}
                              alt="Profile"
                              className="profile-img"
                              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.src = `http://127.0.0.1:8000/storage/images/pfp/default.png`;
                              }}
                            />
                          ) : (
                            <img
                              src={`http://127.0.0.1:8000/storage/images/pfp/default.png`}
                              alt="Default Profile"
                              className="profile-img"
                              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                            />
                          )}
                        </td>
                        <td className="fullname-cell">{getFullName(worker, suffixes)}</td>
                        <td>
                          {worker.worker?.work_type
                            ? worker.worker.work_type.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                            : "N/A"}
                        </td>
                        <td>{getSkillNames(worker.worker?.skills_id)}</td>
                        <td>
                          {credentials.length > 0
                            ? credentials.map((cred, index) => (
                                <div key={index} className="credential-item">
                                  {cred.credentials_name}:{" "}
                                  <button
                                    className="credential-link"
                                    onClick={() => handlePreviewClick(cred)}
                                  >
                                    {isImageFile(cred.credentials_photo)
                                      ? "View Image"
                                      : "View File"}
                                  </button>
                                </div>
                              ))
                            : "None"}
                        </td>
                        <td>{worker.email || "N/A"}</td>
                        <td>{formatDate(worker.created_at)}</td>
                        <td>{formatDate(worker.updated_at)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9">No {showArchived ? "archived" : "active"} workers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="workerlist-pagination">
            <span>Page {pagination.currentPage} of {totalPages}</span>
            <button
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
              disabled={pagination.currentPage <= 1}
            >
              {"<"}
            </button>
            {renderPagination()}
            <button
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
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
            <p>Do you want to archive "{getFullName(workerToArchive, suffixes)}"?</p>
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
      {isPreviewModalOpen && previewCredential && (
        <div className="preview-modal-overlay">
          <div className="preview-modal">
            <h3>{previewCredential.credentials_name}</h3>
            {isImageFile(previewCredential.credentials_photo) ? (
              <img
                src={`http://127.0.0.1:8000/storage/${previewCredential.credentials_photo}`}
                alt={previewCredential.credentials_name}
                className="preview-image"
                style={{ maxWidth: "100%", maxHeight: "400px" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML += `<p style="color: red;">Failed to load image: ${previewCredential.credentials_photo}</p>`;
                }}
              />
            ) : (
              <div className="preview-file">
                <p>File: {previewCredential.credentials_name}</p>
                <a
                  href={`http://127.0.0.1:8000/storage/${previewCredential.credentials_photo}`}
                  download
                  className="download-button"
                >
                  Download File
                </a>
              </div>
            )}
            <div className="preview-modal-buttons">
              <button className="close-button" onClick={handlePreviewClose}>
                Close
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
          skills={skills}
        />
      )}
    </div>
  );
};

export default WorkerList;
