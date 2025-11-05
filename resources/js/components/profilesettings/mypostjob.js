import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaRegEdit, FaPlus } from 'react-icons/fa';
import { message } from 'antd';
import axios from 'axios';
import ModalPostJob from './modalpostjob';
import JobApplicationsModal from './JobApplicationsModal';
import JobDetailModal from './JobDetailModal';
import { convertFromPhilippinesTime } from '../../utils/dateUtils';
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
  const [employerCredentials, setEmployerCredentials] = useState([]);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user profile from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    setUserProfile(userData);
    setUserRole(Number(userData.role_id));
    fetchJobs();
    checkEmployerCredentials();

    // Listen for credentials updates
    const handleCredentialsUpdate = () => {
      console.log('Credentials updated, rechecking...');
      checkEmployerCredentials();
    };

    window.addEventListener('employerCredentialsUpdated', handleCredentialsUpdate);

    return () => {
      window.removeEventListener('employerCredentialsUpdated', handleCredentialsUpdate);
    };
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
      const currentUser = userData.user || userData;
      
      // Get the profile ID first
      let profileId;
      try {
        const profileResponse = await axios.get(`http://127.0.0.1:8000/api/profiles?user_id=${currentUser.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json"
          }
        });
        profileId = profileResponse.data.id;
        console.log("Profile found for job fetch:", profileResponse.data);
      } catch (profileError) {
        console.log("Profile not found, using user ID:", currentUser.id);
        profileId = currentUser.id;
      }

      const response = await axios.get(`http://127.0.0.1:8000/api/jobposts?profile_id=${profileId}&show_archived=true`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json"
        }
      });

      console.log("Job posts response:", response.data);
      console.log("Profile ID used:", profileId);

      if (response.data.job_posts) {
        setJobs(response.data.job_posts.data || []);
        console.log("Jobs found:", response.data.job_posts.data?.length || 0);
      } else {
        console.log("No job_posts in response:", response.data);
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching job posts:", error.response?.data || error.message);
      message.error("Failed to fetch job posts");
    } finally {
      setLoading(false);
    }
  };

  const checkEmployerCredentials = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;

      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const currentUser = userData.user || userData;
      
      // Only check for employers (role_id === 2)
      const roleId = Number(currentUser.role_id);
      if (roleId !== 2) {
        setHasCredentials(true); // Non-employers don't need credentials
        return;
      }

      // Use employer API endpoint
      const apiEndpoint = `http://127.0.0.1:8000/api/employers/${currentUser.id}`;

      const response = await axios.get(apiEndpoint, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json"
        }
      });

      // The API returns { employer: { ...user data, employer: { ...employer data } } }
      const apiUserData = response.data.employer || response.data;
      
      // The User model has an employer relationship, so we need to access it
      // Structure: { employer: { id: ..., employer: { credentials_name: [...] } } }
      let employerRecord = null;
      
      if (apiUserData.employer) {
        employerRecord = apiUserData.employer;
      }
      
      // Get credentials from the actual employer record
      const credentialsNames = employerRecord?.credentials_name || [];
      const credentialsPhotos = employerRecord?.credentials_photo || [];
      const credentialsDocs = employerRecord?.credentials_doc || [];
      
      console.log('Employer credentials check:', {
        fullResponse: response.data,
        apiUserData: apiUserData,
        employerRecord: employerRecord,
        names: credentialsNames,
        photos: credentialsPhotos,
        docs: credentialsDocs,
        photosType: typeof credentialsPhotos,
        photosIsArray: Array.isArray(credentialsPhotos),
        docsType: typeof credentialsDocs,
        docsIsArray: Array.isArray(credentialsDocs),
        photoArray: JSON.stringify(credentialsPhotos),
        docArray: JSON.stringify(credentialsDocs)
      });
      
      // Helper function to check if a value is a valid credential file
      const isValidCredentialFile = (file) => {
        if (!file) return false;
        if (file === null || file === 'null' || file === 'NULL') return false;
        if (typeof file === 'string') {
          const trimmed = file.trim();
          return trimmed !== '' && trimmed !== 'null' && trimmed !== 'NULL';
        }
        return true;
      };
      
      // Check if employer has any actual credential files (photo or doc)
      const hasPhotoFiles = Array.isArray(credentialsPhotos) && 
        credentialsPhotos.some(file => isValidCredentialFile(file));
      
      const hasDocFiles = Array.isArray(credentialsDocs) && 
        credentialsDocs.some(file => isValidCredentialFile(file));
      
      const hasValidCredentials = hasPhotoFiles || hasDocFiles;
      
      setHasCredentials(hasValidCredentials);
      setEmployerCredentials(credentialsNames);
      
      console.log('Has valid credentials:', hasValidCredentials, {
        hasPhotoFiles,
        hasDocFiles,
        photoCount: credentialsPhotos.filter(f => f && f.trim() !== '').length,
        docCount: credentialsDocs.filter(f => f && f.trim() !== '').length
      });
    } catch (error) {
      console.error('Error checking employer credentials:', error.response?.data || error.message);
      setHasCredentials(false);
      setEmployerCredentials([]);
    }
  };

  const handleAddJob = () => {
    // Check if employer has credentials before allowing job posting
    if (!hasCredentials) {
      message.error("You need to submit credentials before posting a job. Please go to Profile Settings to add your credentials.");
      return;
    }
    
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleEditJob = (jobId) => {
    const jobToEdit = jobs.find(job => job.id === jobId);
    if (jobToEdit) {
      // Debug: Log the job data being passed to edit modal
      console.log("=== EDITING JOB - PASSING TO MODAL ===");
      console.log("Job ID:", jobId);
      console.log("Full job data:", JSON.parse(JSON.stringify(jobToEdit)));
      console.log("salary:", jobToEdit.salary, "| type:", typeof jobToEdit.salary);
      console.log("salary_type:", jobToEdit.salary_type, "| type:", typeof jobToEdit.salary_type);
      console.log("job_type:", jobToEdit.job_type);
      console.log("hiring_type:", jobToEdit.hiring_type);
      console.log("team_size:", jobToEdit.team_size);
      console.log("skills:", jobToEdit.skills);
      console.log("skill_experiences:", jobToEdit.skill_experiences);
      console.log("=====================================");
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
      
      // Get the correct user ID from the nested structure
      const currentUser = userData.user || userData;
      
      // First, let's try to get the profile ID from the backend
      let profileId;
      try {
        const profileResponse = await axios.get(`http://127.0.0.1:8000/api/profiles?user_id=${currentUser.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json"
          }
        });
        profileId = profileResponse.data.id;
        console.log("Profile found:", profileResponse.data);
      } catch (profileError) {
        console.log("Profile not found, creating profile for user:", currentUser.id);
        // Create a profile record for this user
        try {
          const createProfileResponse = await axios.post('http://127.0.0.1:8000/api/profiles', {
            user_id: currentUser.id,
            first_name: currentUser.first_name || 'Unknown',
            last_name: currentUser.last_name || 'User',
            gender_id: currentUser.gender_id || 1,
            contact_number: currentUser.contact_number || null,
            street: currentUser.street || null,
            city: currentUser.city || 'Butuan City',
            province: currentUser.province || 'Agusan Del Norte',
            postal_code: currentUser.postal_code || '8600',
            country: currentUser.country || 'Philippines',
            profile_img: currentUser.profile_img || null
          }, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: "application/json",
              "Content-Type": "application/json"
            }
          });
          profileId = createProfileResponse.data.profile.id;
          console.log("Profile created:", createProfileResponse.data.profile);
        } catch (createError) {
          console.error("Failed to create profile:", createError.response?.data || createError.message);
          // Fallback to user ID
          profileId = currentUser.id;
        }
      }
      
      console.log("User data:", userData);
      console.log("Profile ID:", profileId);
      console.log("Current user:", currentUser);
      
      // Map salary types to backend expected values
      const salaryTypeMap = {
        'hourly': 'per_hour',
        'per_hour': 'per_hour', // Direct mapping for per_hour
        'daily': 'per_hour', // Map daily to per_hour for now
        'weekly': 'per_hour', // Map weekly to per_hour for now
        'monthly': 'per_month',
        'project': 'per_hour' // Map project to per_hour for now
      };
      
      const jobPayload = {
        profile_id: profileId,
        job_title: jobData.jobTitle,
        skills: jobData.skills,
        skill_experiences: jobData.skillExperiences,
        description: jobData.jobDescription,
        salary: parseFloat(jobData.salary),
        salary_type: salaryTypeMap[jobData.salaryType] || 'per_hour',
        job_type: jobData.typeOfEmployment,
        hiring_type: jobData.hiringType,
        team_size: jobData.teamSize || (jobData.hiringType === 'team' ? 2 : 1),
        work_start: convertFromPhilippinesTime(jobData.workStart),
        work_end: convertFromPhilippinesTime(jobData.workEnd),
        application_start: convertFromPhilippinesTime(jobData.applicationStart),
        application_deadline: convertFromPhilippinesTime(jobData.applicationDeadline),
        street: null,
        city: 'Butuan City',
        province: 'Agusan Del Norte',
        postal_code: '8600',
        country: 'Philippines'
      };
      
      console.log("Job payload being sent:", jobPayload);
      console.log("Job type value:", jobPayload.job_type, "| Type:", typeof jobPayload.job_type);
      
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
      console.error("Full error response:", error.response);
      
      // Show specific validation errors if available
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        console.error("Validation errors:", errors);
        const errorMessages = Object.values(errors).flat();
        message.error(`Validation failed: ${errorMessages.join(', ')}`);
      } else {
        console.error("No specific validation errors found");
        message.error("Failed to submit job post");
      }
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


  // Determine labels based on user role

  // Animated loading dots state
  const [loadingDots, setLoadingDots] = useState('.');

  useEffect(() => {
    if (loading) {
      const dotSequence = ['.', '..', '...', '.', '..', '...'];
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        setLoadingDots(dotSequence[currentIndex]);
        currentIndex = (currentIndex + 1) % dotSequence.length;
      }, 500); // Change every 500ms

      return () => clearInterval(interval);
    }
  }, [loading]);

  if (loading) {
    const loadingText = 'Loading job posts';
    return (
      <div className="my-post-job-container">
        <div className="loading-container">
          <p>{loadingText}{loadingDots}</p>
        </div>
      </div>
    );
  }
  const pageTitle = 'My Post Job';
  const addButtonText = 'Add Post Job';
  const requiresCredentials = userRole === 2;

  return (
    <div className="my-post-job-container">
      <div className="post-job-header">
        <h2 className="post-job-title">{pageTitle}</h2>
        <button 
          className={`add-post-job-btn ${!hasCredentials && requiresCredentials ? 'disabled' : ''}`}
          onClick={handleAddJob}
          disabled={!hasCredentials && requiresCredentials}
          title={!hasCredentials && requiresCredentials ? 'Please add credentials first' : 'Add a new job post'}
        >
          <FaPlus className="btn-icon" />
          {addButtonText}
        </button>
      </div>

      {/* Credentials Requirement Message for Employers */}
      {!hasCredentials && requiresCredentials && (
        <div className="credentials-requirement-message">
          <div className="requirement-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
            </svg>
          </div>
          <div className="requirement-content">
            <h3 className="requirement-title">Credentials Required</h3>
            <p className="requirement-description">
              You need to submit your credentials before you can post jobs. This helps build trust with potential workers and ensures a professional working environment.
            </p>
            <button 
              className="go-to-profile-btn"
              onClick={() => {
                // Navigate to profile settings
                window.location.href = '/profile-settings';
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Go to Profile Settings
            </button>
          </div>
        </div>
      )}

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
                    job.skills.map((skill, index) => {
                      console.log("Rendering skill:", skill);
                      return (
                        <span key={index} className="skill-tag">
                          {skill.name} ({skill.experience})
                        </span>
                      );
                    })
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