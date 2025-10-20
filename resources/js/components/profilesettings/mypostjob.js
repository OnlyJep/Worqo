import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaRegEdit, FaPlus } from 'react-icons/fa';
import { message } from 'antd';
import axios from 'axios';
import ModalPostJob from './modalpostjob';
import JobApplicationsModal from './JobApplicationsModal';
import JobDetailModal from './JobDetailModal';
import '../../../sass/components/profilesettings/mypostjob.scss';

const MyPostJob = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState(null);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Get user profile from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    setUserProfile(userData);
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        message.error("Please log in to view job posts");
        return;
      }

      // First check for expired jobs
      try {
        await axios.post('http://127.0.0.1:8000/api/jobposts/check-expired', {}, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json"
          }
        });
      } catch (expiredError) {
        console.log("No expired jobs to archive");
      }

      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const response = await axios.get(`http://127.0.0.1:8000/api/jobposts?profile_id=${userData.id}&show_archived=true`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json"
        }
      });

      if (response.data.job_posts) {
        setJobs(response.data.job_posts.data || []);
      } else {
        message.error("Failed to fetch job posts");
      }
    } catch (error) {
      console.error("Error fetching job posts:", error.response?.data || error.message);
      message.error("Failed to fetch job posts");
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleEditJob = (jobId) => {
    const jobToEdit = jobs.find(job => job.id === jobId);
    if (jobToEdit) {
      setEditingJob(jobToEdit);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSubmitJob = async (jobData) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      
      const jobPayload = {
        profile_id: userData.id,
        job_title: jobData.jobTitle,
        skills: jobData.skills,
        skill_experiences: jobData.skillExperiences,
        description: jobData.jobDescription,
        salary: parseFloat(jobData.salary),
        salary_type: jobData.salaryType,
        job_type: jobData.typeOfEmployment,
        hiring_type: jobData.hiringType,
        team_size: jobData.teamSize,
        work_start: jobData.workStart || null,
        work_end: jobData.workEnd || null,
        application_start: jobData.applicationStart,
        application_deadline: jobData.applicationDeadline
      };

      let response;
      if (editingJob) {
        // Update existing job
        response = await axios.put(`http://127.0.0.1:8000/api/jobposts/${editingJob.id}`, jobPayload, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        });
        message.success("Job post updated successfully");
      } else {
        // Create new job
        response = await axios.post('http://127.0.0.1:8000/api/jobposts', jobPayload, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        });
        message.success("Job post created successfully");
      }

      if (response.data) {
        fetchJobs(); // Refresh the jobs list
        setIsModalOpen(false);
        setEditingJob(null);
      }
    } catch (error) {
      console.error("Error submitting job:", error.response?.data || error.message);
      message.error("Failed to submit job post");
    }
  };

  const handleViewApplicants = (job, e) => {
    e.stopPropagation(); // Prevent card click
    setSelectedJobForApplications(job);
    setIsApplicationsModalOpen(true);
  };

  const handleCardClick = (job) => {
    setSelectedJobForDetail(job);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (jobId, e) => {
    e.stopPropagation(); // Prevent card click
    handleEditJob(jobId);
  };


  if (loading) {
    return (
      <div className="my-post-job-container">
        <div className="loading-container">
          <p>Loading job posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-post-job-container">
      <div className="post-job-header">
        <h2 className="post-job-title">My Post Job</h2>
        <button className="add-post-job-btn" onClick={handleAddJob}>
          <FaPlus className="btn-icon" />
          Add Post Job
        </button>
      </div>

      <div className="jobs-list">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div 
              key={job.id} 
              className={`job-card ${job.archived ? 'expired' : ''}`}
              onClick={() => handleCardClick(job)}
            >
              <div className="job-card-header">
                <div className="job-actions">
                  <button 
                    className="view-applicants-btn"
                    onClick={(e) => handleViewApplicants(job, e)}
                    title="View Applicants"
                  >
                    <FaUserFriends className="action-icon" />
                  </button>
                  <button 
                    className="edit-job-btn"
                    onClick={(e) => handleEditClick(job.id, e)}
                    title="Edit Job"
                  >
                    <FaRegEdit className="action-icon" />
                  </button>
                  {job.archived && <div className="expired-badge">EXPIRED</div>}
                </div>
              </div>

              <div className="job-content">
                <h3 className="job-title">{job.job_title || `Job Post #${job.id}`}</h3>
                
                <div className="job-metadata">
                  <span className="job-salary">₱{job.salary.toLocaleString()}/{job.salary_type === 'per_hour' ? 'hour' : 'month'}</span>
                  <span className="posted-date">Posted on {new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                <div className="job-description">
                  <h4 className="description-title">Job Overview/Description</h4>
                  <p className="description-text">{job.description}</p>
                </div>

                <div className="job-skills">
                  <h4 className="skills-title">Skills Required</h4>
                  {job.skills && job.skills.length > 0 ? (
                    job.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill.name} ({skill.experience})
                      </span>
                    ))
                  ) : (
                    <span className="skill-tag">No specific skills required</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <img src="/images/mybooking.svg" alt="No Job Posts" />
            </div>
            <h3 className="empty-title">No Job Posts Yet</h3>
            <p className="empty-description">Create your first job post to start hiring workers.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ModalPostJob
          onClose={handleCloseModal}
          onSubmit={handleSubmitJob}
          editingJob={editingJob}
        />
      )}

      {isApplicationsModalOpen && selectedJobForApplications && (
        <JobApplicationsModal
          jobPostId={selectedJobForApplications.id}
          jobTitle={selectedJobForApplications.job_title}
          onClose={() => {
            setIsApplicationsModalOpen(false);
            setSelectedJobForApplications(null);
          }}
        />
      )}

      {isDetailModalOpen && selectedJobForDetail && (
        <JobDetailModal
          job={selectedJobForDetail}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedJobForDetail(null);
          }}
        />
      )}
    </div>
  );
};

export default MyPostJob;
