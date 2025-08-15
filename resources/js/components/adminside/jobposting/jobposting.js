import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import JobPostModal from "./JobPostModal";
import "./../../../../sass/components/_jobposttable.scss";

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

const JobPostTable = () => {
  const [jobPosts, setJobPosts] = useState([
    {
      id: 1,
      company_name: "TechCorp Inc.",
      owner: { first_name: "Alice", middlename: null, last_name: "Brown", suffix: null },
      skills: [{ name: "Maid", rank: "Bronze 3" }],
      description: "Looking for a reliable maid for office cleaning and maintenance.",
      requirements: "2+ years experience, attention to detail, flexible schedule.",
      created_at: "2025-01-10T09:00:00Z",
      updated_at: "2025-02-15T11:00:00Z",
      archived: false,
    },
    {
      id: 2,
      company_name: "BuildEasy LLC",
      owner: { first_name: "Bob", middlename: "C", last_name: "Davis", suffix: "Jr" },
      skills: [{ name: "Plumber", rank: "Bronze 3" }],
      description: "Seeking a skilled plumber for residential and commercial projects.",
      requirements: "3+ years experience, licensed plumber, own tools preferred.",
      created_at: "2025-03-20T10:30:00Z",
      updated_at: "2025-04-05T12:00:00Z",
      archived: false,
    },
    {
      id: 3,
      company_name: "GreenWorks Co.",
      owner: { first_name: "Carol", middlename: null, last_name: "Evans", suffix: null },
      skills: [{ name: "Electrician", rank: "Bronze 3" }],
      description: "Need a certified electrician for wiring and installation tasks.",
      requirements: "2+ years in electrical work, certification required, safety-focused.",
      created_at: "2025-05-15T14:00:00Z",
      updated_at: "2025-06-10T15:00:00Z",
      archived: true,
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [postToArchive, setPostToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);
  const navigate = useNavigate();

  const filteredPosts = jobPosts.filter((post) => {
    const companyName = post.company_name?.toLowerCase() || "";
    const ownerName = getFullName(post.owner).toLowerCase();
    const skills = post.skills.map((skill) => skill.name.toLowerCase()).join(" ");
    const matchesSearch =
      companyName.includes(searchTerm.toLowerCase()) ||
      ownerName.includes(searchTerm.toLowerCase()) ||
      skills.includes(searchTerm.toLowerCase());
    const matchesArchived = post.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectPost = (postId) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map((post) => post.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedPosts([]);
  };

  const handleArchiveClick = (post) => {
    setPostToArchive(post);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (!postToArchive) return;
    setJobPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postToArchive.id ? { ...post, archived: true } : post
      )
    );
    setIsConfirmModalOpen(false);
    setPostToArchive(null);
  };

  const handleRestorePost = (postId) => {
    setJobPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, archived: false } : post
      )
    );
  };

  const handleBulkAction = (action) => {
    if (selectedPosts.length === 0) return;
    setJobPosts((prevPosts) =>
      prevPosts.map((post) =>
        selectedPosts.includes(post.id)
          ? { ...post, archived: action === "archive" }
          : post
      )
    );
    setSelectedPosts([]);
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setPostToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (post) => {
    setPostToEdit({
      ...post,
      company_name: post.company_name || "",
      owner: post.owner || { first_name: "", middlename: "", last_name: "", suffix: "" },
      skills: post.skills || [{ name: "", rank: "Bronze 3" }],
      description: post.description || "",
      requirements: post.requirements || "",
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setPostToEdit(null);
  };

  const handlePostAdd = (newPost) => {
    const addedPost = {
      id: jobPosts.length + 1,
      company_name: newPost.company_name || "Unknown",
      owner: newPost.owner || { first_name: "Unknown", middlename: null, last_name: "Owner", suffix: null },
      skills: newPost.skills || [{ name: "Unknown", rank: "Bronze 3" }],
      description: newPost.description || "",
      requirements: newPost.requirements || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };
    setJobPosts((prevPosts) => [addedPost, ...prevPosts]);
    setIsModalOpen(false);
  };

  const handlePostUpdate = (updatedPost) => {
    setJobPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postToEdit.id
          ? {
              ...post,
              company_name: updatedPost.company_name,
              owner: updatedPost.owner,
              skills: updatedPost.skills,
              description: updatedPost.description,
              requirements: updatedPost.requirements,
              updated_at: new Date().toISOString(),
            }
          : post
      )
    );
    setIsModalOpen(false);
    setIsEditMode(false);
    setPostToEdit(null);
  };

  const postsPerPage = 5;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const currentPosts = filteredPosts.slice(
    (pagination.currentPage - 1) * postsPerPage,
    pagination.currentPage * postsPerPage
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
      <AdminSidebar activeItem="Job Posts" />
      <TopNavbar />
      <div className="jobposttable-dashboard">
        <div className="jobposttable-content">
          <h2>{showArchived ? "Archived Job Posts" : "Job Posts"}</h2>
          <div className="jobposttable-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Job Posts"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedPosts.length > 0 && (
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

          <div className="jobposttable-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedPosts.length === filteredPosts.length && filteredPosts.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Company</th>
                  <th>Owner</th>
                  <th>Skills</th>
                  <th>Description</th>
                  <th>Requirements</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {currentPosts.length > 0 ? (
                  currentPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="action-icons">
                          <span onClick={() => toggleSelectPost(post.id)} style={{ cursor: "pointer" }}>
                            {selectedPosts.includes(post.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestorePost(post.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(post)}
                            />
                          )}
                          <FaUser
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(post)}
                          />
                        </div>
                      </td>
                      <td className="company-cell">{post.company_name || "N/A"}</td>
                      <td className="owner-cell">{getFullName(post.owner)}</td>
                      <td className="skills-cell">
                        {post.skills.map((skill, index) => (
                          <span key={index} className="skill-badge">
                            <span className="skill-name">{skill.name}</span>
                            <span className="skill-rank">{skill.rank}</span>
                          </span>
                        ))}
                      </td>
                      <td className="description-cell">{post.description || "N/A"}</td>
                      <td className="requirements-cell">{post.requirements || "N/A"}</td>
                      <td>{formatDate(post.created_at)}</td>
                      <td>{formatDate(post.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No {showArchived ? "archived" : "active"} job posts found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="jobposttable-pagination">
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
            <p>Do you want to archive job post for "{postToArchive?.company_name}"?</p>
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
        <JobPostModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handlePostUpdate : handlePostAdd}
          isEdit={isEditMode}
          initialData={postToEdit}
        />
      )}
    </div>
  );
};

export default JobPostTable;