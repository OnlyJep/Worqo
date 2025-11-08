import React, { useState, useEffect } from "react";
import { FaSquare, FaCheckSquare, FaPencilAlt, FaArchive, FaEye, FaCheckCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import { message } from 'antd';
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import SkillModal from "./SkillModal";
import "./../../../../sass/components/_skillscategories.scss";
import axios from "axios";

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

const SkillsCategories = () => {
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [skillToArchive, setSkillToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [activeResponse, archivedResponse] = await Promise.all([
          axios.get(`/api/skills", config),
          axios.get(`/api/skills/archived", config),
        ]);

        const activeSkills = activeResponse.data.map((skill) => ({
          ...skill,
          archived: false,
          sub_skills: skill.sub_skills || [],
        }));
        const archivedSkills = archivedResponse.data.map((skill) => ({
          ...skill,
          archived: true,
          sub_skills: skill.sub_skills || [],
        }));
        setSkills([...activeSkills, ...archivedSkills]);
      } catch (error) {
        console.error("Error fetching skills:", error);
        message.error(error.message || "Failed to fetch skills");
        setSkills([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleExpandSkill = (skillId) => {
    setExpandedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = (skill.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = skill.archived === showArchived;
    const hasMatchingSubSkill = skill.sub_skills.some((subSkill) =>
      subSkill.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (matchesSearch || hasMatchingSubSkill) && matchesArchived;
  });

  const toggleSelectSkill = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSkills.length === filteredSkills.length) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills(filteredSkills.map((skill) => skill.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedSkills([]);
  };

  const handleArchiveClick = (skill) => {
    setSkillToArchive(skill);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!skillToArchive) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.patch(
        `${window.location.origin}/api/skills/${skillToArchive.id}/archive`,
        { archived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setSkills((prevSkills) =>
          prevSkills.map((skill) =>
            skill.id === skillToArchive.id ? { ...skill, archived: true } : skill
          )
        );
        message.success(`Skill "${skillToArchive.name || "N/A"}" archived successfully`);
        setIsConfirmModalOpen(false);
        setSkillToArchive(null);
      }
    } catch (error) {
      console.error("Error archiving skill:", error);
      message.error(error.response?.data?.message || "Failed to archive skill");
    }
  };

  const handleRestoreSkill = async (skillId) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.patch(
        `${window.location.origin}/api/skills/${skillId}/archive`,
        { archived: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setSkills((prevSkills) =>
          prevSkills.map((skill) =>
            skill.id === skillId ? { ...skill, archived: false } : skill
          )
        );
        message.success("Skill restored successfully");
      }
    } catch (error) {
      console.error("Error restoring skill:", error);
      message.error(error.response?.data?.message || "Failed to restore skill");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedSkills.length === 0) return;
    try {
      const token = localStorage.getItem("auth_token");
      const requests = selectedSkills.map((skillId) =>
        axios.patch(
          `${window.location.origin}/api/skills/${skillId}/archive`,
          { archived: action === "archive" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      await Promise.all(requests);
      setSkills((prevSkills) =>
        prevSkills.map((skill) =>
          selectedSkills.includes(skill.id)
            ? { ...skill, archived: action === "archive" }
            : skill
        )
      );
      setSelectedSkills([]);
      message.success(
        action === "archive"
          ? "Selected skills archived successfully"
          : "Selected skills restored successfully"
      );
    } catch (error) {
      console.error(`Error ${action}ing skills:`, error);
      message.error(error.response?.data?.message || `Failed to ${action} skills`);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setSkillToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (skill) => {
    setSkillToEdit({ id: skill.id, name: skill.name || "", sub_skills: skill.sub_skills || [] });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSkillToEdit(null);
  };

  const handleSkillAdd = async (newSkill) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.post(
        `${window.location.origin}/api/skills",
        { name: newSkill.name, sub_skills: newSkill.sub_skills },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 201) {
        setSkills((prevSkills) => [
          {
            id: response.data.id,
            name: response.data.name,
            sub_skills: response.data.sub_skills || [],
            archived: false,
            created_at: response.data.created_at || new Date().toISOString(),
            updated_at: response.data.updated_at || new Date().toISOString(),
          },
          ...prevSkills,
        ]);
        setIsModalOpen(false);
        message.success(`Skill "${newSkill.name}" added successfully`);
      }
    } catch (error) {
      console.error("Error adding skill:", error);
      throw error.response?.data?.errors?.name?.[0] || "Failed to add skill";
    }
  };

  const handleSkillUpdate = async (updatedSkill) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.put(
        `${window.location.origin}/api/skills/${skillToEdit.id}`,
        { name: updatedSkill.name, sub_skills: updatedSkill.sub_skills },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setSkills((prevSkills) =>
          prevSkills.map((skill) =>
            skill.id === skillToEdit.id
              ? {
                  ...skill,
                  name: response.data.name,
                  sub_skills: response.data.sub_skills || [],
                  updated_at: response.data.updated_at || new Date().toISOString(),
                }
              : skill
          )
        );
        setIsModalOpen(false);
        setIsEditMode(false);
        setSkillToEdit(null);
        message.success(`Skill "${updatedSkill.name}" updated successfully`);
      }
    } catch (error) {
      console.error("Error updating skill:", error);
      throw error.response?.data?.errors?.name?.[0] || "Failed to update skill";
    }
  };

  const skillsPerPage = 8;
  const totalPages = Math.ceil(filteredSkills.length / skillsPerPage);
  const currentSkills = filteredSkills.slice(
    (pagination.currentPage - 1) * skillsPerPage,
    pagination.currentPage * skillsPerPage
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
      <AdminSidebar activeItem="Skills Categories" />
      <TopNavbar />
      <div className="skillscategories-dashboard">
        <div className="skillscategories-content">
          <h2>{showArchived ? "Archived Skills" : "Skills Categories"}</h2>
          <div className="skillscategories-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Skills or Sub-Skills"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
          <div className="skillscategories-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedSkills.length === filteredSkills.length && filteredSkills.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Skill Name</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="loading-row">
                      Loading skills...
                    </td>
                  </tr>
                ) : currentSkills.length > 0 ? (
                  currentSkills.map((skill) => (
                    <React.Fragment key={skill.id}>
                      <tr>
                        <td data-label="Actions">
                          <div className="action-icons">
                            <span onClick={() => toggleSelectSkill(skill.id)} style={{ cursor: "pointer" }}>
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
                            <FaPencilAlt
                              size={16}
                              className="edit-icon"
                              onClick={() => handleEditClick(skill)}
                            />
                            {skill.sub_skills.length > 0 && (
                              <span onClick={() => toggleExpandSkill(skill.id)} style={{ cursor: "pointer" }}>
                                {expandedSkills.includes(skill.id) ? (
                                  <FaChevronUp size={16} />
                                ) : (
                                  <FaChevronDown size={16} />
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                        <td data-label="Skill Name" className="skill-name-cell">
                          {skill.name || "N/A"}
                        </td>
                        <td data-label="Created At">{formatDate(skill.created_at)}</td>
                        <td data-label="Updated At">{formatDate(skill.updated_at)}</td>
                      </tr>
                      {expandedSkills.includes(skill.id) &&
                        skill.sub_skills.map((subSkill, index) => (
                          <tr key={`${skill.id}-sub-${index}`} className="sub-skill-row">
                            <td data-label="Actions"></td>
                            <td data-label="Skill Name" className="skill-name-cell sub-skill">
                              ↳ {subSkill}
                            </td>
                            <td data-label="Created At"></td>
                            <td data-label="Updated At"></td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No {showArchived ? "archived" : "active"} skills found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="skillscategories-pagination">
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
            <p>Do you want to archive "{skillToArchive?.name || "N/A"}"?</p>
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
        <SkillModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleSkillUpdate : handleSkillAdd}
          isEdit={isEditMode}
          initialData={skillToEdit}
        />
      )}
    </div>
  );
};

export default SkillsCategories;