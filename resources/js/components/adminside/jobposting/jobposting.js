import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaArchive, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import JobPostModal from "./JobPostModal";
import Loader from "./../../LoaderContent/loader";
import "./../../../../sass/components/_jobposttable.scss";

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "N/A";
  }
};

const getProfileName = (profile) => {
  if (!profile) {
    console.log("No profile provided to getProfileName");
    return "N/A";
  }
  const { first_name, middlename, last_name, suffix } = profile;
  let fullName = `${first_name || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;
  if (suffix) fullName += ` ${suffix}`;
  const name = fullName.trim() || "N/A";
  console.log("Profile name generated:", name, "from profile:", profile);
  return name;
};

const JobPostTable = () => {
  const [jobPosts, setJobPosts] = useState([]);
  const [companies, setCompanies] = useState({});
  const [profiles, setProfiles] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [postToArchive, setPostToArchive] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchJobPosts = async () => {
    try {
      setLoading(true);
      // For admin, fetch all job posts from database
      // Use show_archived=true to get both archived and non-archived posts
      // Fetch all pages to get complete list
      let allJobPosts = [];
      let currentPage = 1;
      let hasMorePages = true;
      let totalItems = 0;
      
      // Fetch all pages of job posts
      while (hasMorePages) {
        const response = await axios.get("http://127.0.0.1:8000/api/jobposts", {
          params: {
            search: searchTerm,
            show_archived: true, // Get all posts (archived and non-archived) for admin
            page: currentPage,
          },
        });
        
        // Get job posts from current page
        let pageJobPosts = [];
        if (response.data.job_posts) {
          if (Array.isArray(response.data.job_posts.data)) {
            pageJobPosts = response.data.job_posts.data;
          } else if (Array.isArray(response.data.job_posts)) {
            pageJobPosts = response.data.job_posts;
          }
        }
        
        allJobPosts = [...allJobPosts, ...pageJobPosts];
        
        // Check if there are more pages
        const pagination = response.data.pagination || {};
        totalItems = pagination.total_items || allJobPosts.length;
        hasMorePages = currentPage < (pagination.total_pages || 1);
        currentPage++;
        
        // Safety limit to prevent infinite loops
        if (currentPage > 100) {
          console.warn("Reached maximum page limit");
          break;
        }
      }
      
      // Filter by archived status if needed
      if (!showArchived) {
        allJobPosts = allJobPosts.filter(post => !post.archived);
      } else {
        allJobPosts = allJobPosts.filter(post => post.archived);
      }
      
      // Sort by created_at descending (newest first)
      allJobPosts.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
      
      setJobPosts(allJobPosts);
      // Update pagination info for display
      setPagination({
        current_page: 1,
        total_pages: 1,
        total_items: allJobPosts.length
      });

      const companiesResponse = await axios.get("http://127.0.0.1:8000/api/employers");
      const profilesResponse = await axios.get("http://127.0.0.1:8000/api/users");

      const companiesData = Array.isArray(companiesResponse.data)
        ? companiesResponse.data
        : [];
      const profilesData = Array.isArray(profilesResponse.data.data)
        ? profilesResponse.data.data
        : Array.isArray(profilesResponse.data)
        ? profilesResponse.data
        : [];

      setCompanies(
        companiesData.reduce((acc, employer) => {
          if (employer.id) {
            // Create a company-like structure from employer data
            const companyData = {
              id: employer.id,
              company_name: employer.profile?.first_name + ' ' + employer.profile?.last_name || 'N/A',
              profile_id: employer.profile?.id || null,
              contact_number: employer.profile?.contact_number || 'N/A',
              archived: employer.archived || false,
              parsed_profile_ids: [employer.profile?.id?.toString()].filter(Boolean)
            };
            acc[employer.id] = companyData;
          }
          return acc;
        }, {})
      );
      setProfiles(
        profilesData.reduce((acc, profile) => {
          if (profile.id) acc[profile.id] = profile;
          return acc;
        }, {})
      );
      setError(null);
    } catch (error) {
      console.error("Error fetching post jobs:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      message.error("Failed to load post jobs. Please try again.");
      setError("Failed to load post jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobPosts();
  }, [searchTerm, showArchived]); // Removed pagination.current_page dependency since we fetch all at once

  const filteredPosts = jobPosts.filter((post) => {
    if (!post) return false;
    const jobTitle = post.job_title?.toLowerCase() || "";
    const skills = Array.isArray(post.skills)
      ? post.skills.join(" ").toLowerCase()
      : "";
    const description = post.description?.toLowerCase() || "";
    const matchesSearch =
      jobTitle.includes(searchTerm.toLowerCase()) ||
      skills.includes(searchTerm.toLowerCase()) ||
      description.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleSelectPost = (postId) => {
    setSelectedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
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
    setPagination({ ...pagination, current_page: 1 });
    setSelectedPosts([]);
  };

  const handleArchiveClick = (post) => {
    setPostToArchive(post);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!postToArchive) return;
    try {
      await axios.patch(`http://127.0.0.1:8000/api/jobposts/${postToArchive.id}/archive`, {
        archived: true,
      });
      message.success(`Job post for "${companies[postToArchive.company_id]?.company_name || "N/A"}" archived successfully`);
      setIsConfirmModalOpen(false);
      setPostToArchive(null);
      fetchJobPosts(); // Refresh data after archiving
    } catch (error) {
      console.error("Error archiving job post:", error);
      message.error(error.response?.data?.message || "Failed to archive job post.");
      setError(error.response?.data?.message || "Failed to archive job post.");
    }
  };

  const handleRestorePost = async (postId) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/jobposts/${postId}/archive`, {
        archived: false,
      });
      message.success("Job post restored successfully");
      fetchJobPosts(); // Refresh data after restoring
    } catch (error) {
      console.error("Error restoring job post:", error);
      message.error(error.response?.data?.message || "Failed to restore job post.");
      setError(error.response?.data?.message || "Failed to restore job post.");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedPosts.length === 0) {
      message.warning("No post jobs selected.");
      return;
    }
    try {
      await axios.post("http://127.0.0.1:8000/api/jobposts/bulk-archive", {
        ids: selectedPosts,
        archived: action === "archive",
      });
      message.success(`Selected post jobs ${action === "archive" ? "archived" : "restored"} successfully`);
      setSelectedPosts([]);
      fetchJobPosts(); // Refresh data after bulk action
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      message.error(error.response?.data?.message || `Failed to ${action} post jobs.`);
      setError(error.response?.data?.message || `Failed to ${action} post jobs.`);
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setPostToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (post) => {
    setPostToEdit(post);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setPostToEdit(null);
  };

  const handlePostAdd = async (newPost) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/jobposts", newPost);
      setJobPosts((prevPosts) => [response.data, ...prevPosts]);
      message.success("Job post created successfully");
      setIsModalOpen(false);
      fetchJobPosts(); // Refresh data after adding
    } catch (error) {
      console.error("Error adding job post:", error);
      message.error(error.response?.data?.message || "Failed to create job post.");
      throw error;
    }
  };

  const handlePostUpdate = async (updatedPost) => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/jobposts/${postToEdit.id}`,
        updatedPost
      );
      setJobPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postToEdit.id ? response.data : post
        )
      );
      message.success("Job post updated successfully");
      setIsModalOpen(false);
      setIsEditMode(false);
      setPostToEdit(null);
      fetchJobPosts(); // Refresh data after updating
    } catch (error) {
      console.error("Error updating job post:", error);
      message.error(error.response?.data?.message || "Failed to update job post.");
      throw error;
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, pagination.current_page - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(pagination.total_pages, startPage + maxPagesToShow - 1);

    if (pagination.total_pages <= maxPagesToShow) {
      for (let i = 1; i <= pagination.total_pages; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={pagination.current_page === i ? "active" : ""}
            onClick={() => setPagination({ ...pagination, current_page: i })}
          >
            {i}
          </button>
        );
      }
    } else {
      if (startPage > 1) {
        pageNumbers.push(
          <button key={1} onClick={() => setPagination({ ...pagination, current_page: 1 })}>
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
            className={pagination.current_page === i ? "active" : ""}
            onClick={() => setPagination({ ...pagination, current_page: i })}
          >
            {i}
          </button>
        );
      }

      if (endPage < pagination.total_pages) {
        if (endPage < pagination.total_pages - 1) {
          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);
        }
        pageNumbers.push(
          <button
            key={pagination.total_pages}
            onClick={() => setPagination({ ...pagination, current_page: pagination.total_pages })}
          >
            {pagination.total_pages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="app">
      {loading && <Loader />}
      <AdminSidebar activeItem="post jobs" />
      <TopNavbar />
      <div className="jobposttable-dashboard">
        <div className="jobposttable-content">
          <h2>{showArchived ? "Archived post jobs" : "Post Jobs"}</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="jobposttable-header">
            <div className="left-actions">
              <input
                type="text"
                className="search-input"
                placeholder="Search by job title, skills, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
          <ErrorBoundary>
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
                    <th>ID</th>
                    <th>Profile ID</th>
                    <th>Job Title</th>
                    <th>Skills</th>
                    <th>Skill Experiences</th>
                    <th>Description</th>
                    <th>Salary</th>
                    <th>Salary Type</th>
                    <th>Job Type</th>
                    <th>Hiring Type</th>
                    <th>Team Size</th>
                    <th>Work Start</th>
                    <th>Work End</th>
                    <th>Application Start</th>
                    <th>Application Deadline</th>
                    <th>Archived</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
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
                              <FaArchive
                                size={16}
                                className="delete-icon"
                                onClick={() => handleArchiveClick(post)}
                              />
                            )}
                            <FaEdit
                              size={16}
                              className="edit-icon"
                              onClick={() => handleEditClick(post)}
                            />
                          </div>
                        </td>
                        <td>{post.id || "N/A"}</td>
                        <td>{post.profile_id || "N/A"}</td>
                        <td>{post.job_title || "N/A"}</td>
                        <td className="skills-cell">
                          {Array.isArray(post.skills) && post.skills.length > 0 ? (
                            post.skills.map((skill, index) => (
                              <span key={index} className="skill-badge">
                                {typeof skill === 'object' ? 
                                  (skill.name || skill.skill_name || JSON.stringify(skill)) : 
                                  (skill || "N/A")
                                }
                              </span>
                            ))
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="skill-experiences-cell">
                          {post.skill_experiences ? (
                            (() => {
                              if (typeof post.skill_experiences === 'object') {
                                if (Array.isArray(post.skill_experiences)) {
                                  return post.skill_experiences.map((exp, index) => {
                                    if (typeof exp === 'object') {
                                      const skillName = exp.name || exp.skill_name || 'Unknown';
                                      const subSkills = exp.sub_skills || exp.sub_skill || 'N/A';
                                      const experience = exp.experience || exp.experience_years || 'N/A';
                                      
                                      return (
                                        <div key={index} style={{ marginBottom: '4px', fontSize: '12px', textAlign: 'left' }}>
                                          <div style={{ fontWeight: 'bold' }}>{skillName}</div>
                                          <div>sub-skill: {subSkills}</div>
                                          <div>experience: {experience}</div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div key={index} style={{ marginBottom: '4px', fontSize: '12px', textAlign: 'left' }}>
                                          {exp}
                                        </div>
                                      );
                                    }
                                  });
                                } else {
                                  return Object.entries(post.skill_experiences).map(([key, value], index) => (
                                    <div key={index} style={{ marginBottom: '4px', fontSize: '12px', textAlign: 'left' }}>
                                      <div style={{ fontWeight: 'bold' }}>{key}</div>
                                      <div>sub-skill: N/A</div>
                                      <div>experience: {value}</div>
                                    </div>
                                  ));
                                }
                              } else {
                                return (
                                  <div style={{ fontSize: '12px', textAlign: 'left' }}>
                                    {post.skill_experiences}
                                  </div>
                                );
                              }
                            })()
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="description-cell">{post.description || "N/A"}</td>
                        <td>{post.salary || "N/A"}</td>
                        <td>{post.salary_type || "N/A"}</td>
                        <td>{post.job_type || "N/A"}</td>
                        <td>{post.hiring_type || "N/A"}</td>
                        <td>{post.team_size || "N/A"}</td>
                        <td>{formatDate(post.work_start)}</td>
                        <td>{formatDate(post.work_end)}</td>
                        <td>{formatDate(post.application_start)}</td>
                        <td>{formatDate(post.application_deadline)}</td>
                        <td>{post.archived ? "Yes" : "No"}</td>
                        <td>{formatDate(post.created_at)}</td>
                        <td>{formatDate(post.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="21">No {showArchived ? "archived" : "active"} post jobs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ErrorBoundary>
          <div className="jobposttable-pagination">
            <span>Showing {filteredPosts.length} of {pagination.total_items} job posts</span>
          </div>
        </div>
      </div>
      {isConfirmModalOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Are you sure?</h3>
            <p>Do you want to archive job post for "{companies[postToArchive?.company_id]?.company_name || "N/A"}"?</p>
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
        <ErrorBoundary>
          <JobPostModal
            onClose={handleModalClose}
            onSubmit={isEditMode ? handlePostUpdate : handlePostAdd}
            isEdit={isEditMode}
            initialData={postToEdit}
            onRefresh={fetchJobPosts}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default JobPostTable;