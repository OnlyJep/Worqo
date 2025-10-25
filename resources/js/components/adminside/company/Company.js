import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaArchive, FaEye } from "react-icons/fa";
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
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [skillToArchive, setSkillToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchSkills(controller.signal);
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
  }, [showArchived, searchTerm]);

  const fetchSkills = async (signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("Please log in to view skills.");
      }
      const endpoint = showArchived ? '/api/skills/archived' : '/api/skills';
      const response = await axios.get(`http://127.0.0.1:8000${endpoint}`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        signal,
        timeout: 10000,
      });
      setSkills(response.data || []);
      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to fetch skills.");
      console.error("Fetch skills error:", err.response?.data || err.message);
    }
  };


  const toggleSelectSkill = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSkills.length === skills.length) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills(skills.map((skill) => skill.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setSelectedSkills([]);
  };

  const handleArchiveClick = (skill) => {
    if (skill.archived) {
      message.error("Skill is already archived.");
      return;
    }
    setSkillToArchive(skill);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!skillToArchive) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/skills/${skillToArchive.id}/archive`,
        { archived: true },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      if (response.status === 200) {
        await fetchSkills(new AbortController().signal);
        setIsConfirmModalOpen(false);
        setSkillToArchive(null);
        message.success(`Skill "${skillToArchive.name}" archived successfully!`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to archive skill.");
      console.error("Archive error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSkill = async (skillId) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill?.archived) {
      message.error("Skill is already restored.");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/skills/${skillId}/archive`,
        { archived: false },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 5000,
        }
      );
      if (response.status === 200) {
        await fetchSkills(new AbortController().signal);
        message.success(`Skill "${skill.name}" restored successfully!`);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to restore skill.");
      console.error("Restore error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedSkills.length === 0) {
      message.error("Please select at least one skill.");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const validSkillIds = selectedSkills.filter((id) => {
        const skill = skills.find((s) => s.id === id);
        return action === "archive" ? !skill?.archived : skill?.archived;
      });
      if (validSkillIds.length === 0) {
        message.error(`All selected skills are already ${action === "archive" ? "archived" : "restored"}.`);
        return;
      }
      setLoading(true);
      // For now, we'll handle each skill individually since there's no bulk endpoint
      for (const skillId of validSkillIds) {
        await axios.patch(
          `http://127.0.0.1:8000/api/skills/${skillId}/archive`,
          { archived: action === "archive" },
          {
            headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
            timeout: 5000,
          }
        );
      }
      await fetchSkills(new AbortController().signal);
      setSelectedSkills([]);
      message.success(`${validSkillIds.length} skills ${action === "archive" ? "archived" : "restored"} successfully!`);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || `Failed to ${action} skills. Please try again.`);
      console.error("Bulk action error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = async () => {
    if (!dataLoaded) {
      message.error("Please wait until data is loaded.");
      return;
    }
    setIsEditMode(false);
    setSkillToEdit({
      name: "",
      sub_skills: [],
    });
    setIsModalOpen(true);
    setError("");
  };

  const handleEditClick = async (skill) => {
    if (!dataLoaded) {
      message.error("Please wait until data is loaded.");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      setSkillToEdit({
        id: skill.id,
        name: skill.name || "",
        sub_skills: skill.sub_skills || [],
      });
      setIsEditMode(true);
      setIsModalOpen(true);
      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.response?.data?.error || "Failed to fetch skill details.");
      console.error("Fetch skill details error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSkillToEdit(null);
    setError("");
  };

  const handleSkillAdd = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:8000/api/skills", formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000,
        signal,
      });
      if (response.status === 201) {
        await fetchSkills(new AbortController().signal);
        setIsModalOpen(false);
        message.success("Skill added successfully!");
        return response.data;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Add request was aborted");
        return;
      }
      console.error("Error adding skill:", err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSkillUpdate = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      if (!skillToEdit?.id) {
        throw new Error("No skill ID provided for update.");
      }
      setLoading(true);
      const response = await axios.put(
        `http://127.0.0.1:8000/api/skills/${skillToEdit.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
          signal,
        }
      );
      if (response.status === 200) {
        await fetchSkills(new AbortController().signal);
        setIsModalOpen(false);
        setIsEditMode(false);
        setSkillToEdit(null);
        message.success("Skill updated successfully!");
        return response.data;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Update request was aborted");
        return;
      }
      console.error("Error updating skill:", err.response?.data || err.message);
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
          <h2>{showArchived ? "Archived Skills" : "Jobs"}</h2>
          {error && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
          <div className="companylist-header">
            <div className="left-actions">
              <input
                type="text"
                className="search-input"
                placeholder="Search Skills"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="right-actions">
              {selectedSkills.length > 0 && (
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
                        {selectedSkills.length === skills.length && skills.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Skill</th>
                  <th>Sub-Skills</th>
                  <th>Collar</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-row">Loading skills...</td>
                  </tr>
                ) : skills.length > 0 ? (
                  skills.map((skill) => (
                    <tr key={skill.id}>
                      <td>
                        <div className="action-icons">
                          <span
                            onClick={() => toggleSelectSkill(skill.id)}
                            style={{ cursor: "pointer" }}
                          >
                            {selectedSkills.includes(skill.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreSkill(skill.id)}
                            />
                          ) : (
                            <FaArchive
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(skill)}
                            />
                          )}
                          <FaEdit
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(skill)}
                          />
                        </div>
                      </td>
                      <td>{skill.name || "N/A"}</td>
                      <td>{Array.isArray(skill.sub_skills) && skill.sub_skills.length > 0 ? 
                        (skill.sub_skills.length > 3 ? 
                          skill.sub_skills.slice(0, 3).join(", ") + "..." : 
                          skill.sub_skills.join(", ")
                        ) : "N/A"}</td>
                      <td>N/A</td>
                      <td>{formatDate(skill.created_at)}</td>
                      <td>{formatDate(skill.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No {showArchived ? "archived" : "active"} skills found</td>
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
            <p>Do you want to archive "{skillToArchive?.name || 'Unnamed Skill'}"?</p>
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
          onSubmit={isEditMode ? handleSkillUpdate : handleSkillAdd}
          isEdit={isEditMode}
          initialData={skillToEdit}
        />
      )}
    </div>
  );
};

export default CompanyList;