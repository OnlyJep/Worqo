import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaCheck, FaTimes as FaX, FaCalendar, FaFilePdf } from 'react-icons/fa';
import { FaUsersViewfinder } from 'react-icons/fa6';
import { message } from 'antd';
import axios from 'axios';
import '../../../sass/components/profilesettings/jobapplicationsmodal.scss';
import '../../../sass/components/profilesettings/confirmmodal.scss';
import ViewWorkersApplicationModal from './ViewWorkersApplicationModal';
import ViewHiredWorkersModal from './ViewHiredWorkersModal';
import ViewDeclinedWorkersModal from './ViewDeclinedWorkersModal';
import ModalFeedback from './modalfeedback';

const JobApplicationsModal = ({ jobPostId, jobTitle, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [jobPost, setJobPost] = useState(null);
  const [showViewWorkersModal, setShowViewWorkersModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [showViewHiredWorkersModal, setShowViewHiredWorkersModal] = useState(false);
  const [showViewDeclinedWorkersModal, setShowViewDeclinedWorkersModal] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, action: null, application: null });
  const [warningModal, setWarningModal] = useState({ open: false, message: '' });
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedApplicationForFeedback, setSelectedApplicationForFeedback] = useState(null);

  useEffect(() => {
    fetchJobPost();
    fetchApplications();
  }, [jobPostId]);


  const fetchJobPost = async () => {
    try {
      const response = await axios.get(`/api/jobposts/${jobPostId}`);
      setJobPost(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching job post:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/job-applications/job/${jobPostId}`);
      console.log('Applications API Response:', response.data);
      
      // Ensure worker data and profile_img are properly set
      const applicationsData = Array.isArray(response.data) ? response.data : [];
      const processedApplications = applicationsData.map(app => {
        if (app.worker && !app.worker.profile_img) {
          console.warn('Worker missing profile_img:', app.worker);
        }
        return app;
      });
      
      setApplications(processedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatus = async (applicationId, status) => {
    try {
      // Check hiring type logic only when accepting (not when declining or changing status)
      if (status === 'accepted' && jobPost) {
        const currentApp = applications.find(app => app.id === applicationId);
        const acceptedCount = applications.filter(app => app.status === 'accepted').length;
        
        // If changing from declined/for_interview to accepted, don't count the current application
        // If already accepted, we're changing it, so subtract 1
        const adjustedCount = currentApp?.status === 'accepted' ? acceptedCount - 1 : acceptedCount;
        
        // Validate individual hiring limit
        if (jobPost.hiring_type === 'individual' && adjustedCount >= 1) {
          setWarningModal({ 
            open: true, 
            message: 'This job is for individual hiring. Only one person can be accepted.' 
          });
          return;
        }
        
        // Validate team hiring limit using team_size from jobPost
        if (jobPost.hiring_type === 'team') {
          // Ensure team_size is a number (convert string to number if needed)
          const teamSize = Number(jobPost.team_size) || 2; // Default to 2 if not set or invalid
          const currentAccepted = Number(adjustedCount);
          
          console.log('Team hiring validation:', {
            teamSize,
            currentAccepted,
            adjustedCount,
            hiring_type: jobPost.hiring_type,
            team_size: jobPost.team_size
          });
          
          if (currentAccepted >= teamSize) {
            setWarningModal({ 
              open: true, 
              message: `This job is for team hiring. Maximum ${teamSize} people can be accepted. You have already accepted ${currentAccepted} worker(s).` 
            });
            return;
          }
        }
      }

      await axios.patch(`/api/job-applications/${applicationId}/status`, {
        status: status
      });
      
      // Update the application status in the local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: status }
            : app
        )
      );
      
      // Refresh the job post to get updated application counts
      fetchJobPost();
    } catch (error) {
      console.error('Error updating application status:', error);
      setWarningModal({ 
        open: true, 
        message: 'Failed to update application status. Please try again.' 
      });
    }
  };

  const openConfirm = (application, status) => {
    setConfirmState({ open: true, action: status, application });
  };

  const closeConfirm = () => setConfirmState({ open: false, action: null, application: null });

  const proceedConfirm = () => {
    if (confirmState.open && confirmState.application && confirmState.action) {
      // Validate before proceeding if accepting
      if (confirmState.action === 'accepted') {
        if (!jobPost) {
          setWarningModal({ 
            open: true, 
            message: 'Job post information is not loaded. Please wait and try again.' 
          });
          closeConfirm();
          return;
        }
        
        const currentApp = applications.find(app => app.id === confirmState.application.id);
        const acceptedCount = applications.filter(app => app.status === 'accepted').length;
        const adjustedCount = currentApp?.status === 'accepted' ? acceptedCount - 1 : acceptedCount;
        
        // Validate individual hiring limit
        if (jobPost.hiring_type === 'individual' && adjustedCount >= 1) {
          setWarningModal({ 
            open: true, 
            message: 'This job is for individual hiring. Only one person can be accepted.' 
          });
          closeConfirm();
          return;
        }
        
        // Validate team hiring limit
        if (jobPost.hiring_type === 'team') {
          const teamSize = Number(jobPost.team_size) || 2;
          const currentAccepted = Number(adjustedCount);
          
          console.log('Team hiring validation in proceedConfirm:', {
            teamSize,
            currentAccepted,
            adjustedCount,
            hiring_type: jobPost.hiring_type,
            team_size: jobPost.team_size,
            jobPost: jobPost
          });
          
          if (currentAccepted >= teamSize) {
            setWarningModal({ 
              open: true, 
              message: `This job is for team hiring. Maximum ${teamSize} people can be accepted. You have already accepted ${currentAccepted} worker(s).` 
            });
            closeConfirm();
            return;
          }
        }
      }
      
      handleApplicationStatus(confirmState.application.id, confirmState.action);
    }
    closeConfirm();
  };


  const getWorkerName = (worker) => {
    // Filter out empty/null middle names to avoid double names
    const nameParts = [worker.first_name, worker.middlename, worker.last_name]
      .filter(part => part && part.trim() !== '')
      .join(' ');
    return worker.suffix_name ? `${nameParts} ${worker.suffix_name}` : nameParts;
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const downloadResume = (resumePath) => {
    if (resumePath) {
      window.open(`${window.location.origin}/storage/${resumePath}`, '_blank');
    }
  };

  const handleViewProfile = (workerId) => {
    // Check if current user is a worker trying to view another worker's profile
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const currentUser = userData.user || userData;
    
    if (currentUser?.role_id === 1) {
      setWarningModal({ 
        open: true, 
        message: "Workers cannot view other worker profiles. Please switch to employer role to hire workers." 
      });
      return;
    }
    
    window.open(`/profile/${workerId}`, '_blank');
  };

  const handleViewApplicationDetails = (application) => {
    setSelectedApplicationId(application.id);
    setShowViewWorkersModal(true);
  };

  const handleCloseViewWorkersModal = () => {
    setShowViewWorkersModal(false);
    setSelectedApplicationId(null);
  };

  const handleViewHiredWorkers = () => {
    setShowViewHiredWorkersModal(true);
  };

  const handleCloseViewHiredWorkersModal = () => {
    setShowViewHiredWorkersModal(false);
  };

  const handleViewDeclinedWorkers = () => {
    setShowViewDeclinedWorkersModal(true);
  };

  const handleCloseViewDeclinedWorkersModal = () => {
    setShowViewDeclinedWorkersModal(false);
  };

  const handleMessageApplicantClick = async (event, application) => {
    event.preventDefault();
    if (!application) return;

    const worker = application.worker || {};
    const workerUserId = worker.user_id || worker.id || worker.user?.id || application.worker_id;
    if (workerUserId) {
      localStorage.setItem('message_target_user_id', String(workerUserId));
    } else {
      localStorage.removeItem('message_target_user_id');
    }

    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const currentRole = stored?.role_id || stored?.user?.role_id;
    const targetRole = 2; // employer role to chat as employer

    try {
      if (currentRole && currentRole !== targetRole) {
        const authToken = localStorage.getItem('auth_token');
        await fetch(`${window.location.origin}/api/users/switch-role`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ user_id: stored.id || stored?.user?.id, role_id: targetRole })
        }).catch(() => {});

        const updatedUser = { ...(stored.user || stored), role_id: targetRole };
        localStorage.setItem('user', JSON.stringify(stored.user ? { user: updatedUser } : updatedUser));
      }
    } catch (error) {
      console.error('Error switching role before messaging:', error);
    }

    window.location.href = '/message';
  };

  const handleGiveFeedback = (application) => {
    console.log('handleGiveFeedback called with:', application);
    if (!application) {
      console.error('No application provided to handleGiveFeedback');
      return;
    }
    setSelectedApplicationForFeedback(application);
    setIsFeedbackModalOpen(true);
    console.log('Feedback modal should now be open');
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setSelectedApplicationForFeedback(null);
  };

  const handleSubmitFeedback = async (feedbackData) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      
      if (!authToken) {
        message.error("Please log in to submit a review");
        return;
      }

      if (!selectedApplicationForFeedback || !selectedApplicationForFeedback.id) {
        message.error("Application information is missing");
        return;
      }

      // Get worker user_id from the application
      // worker.user_id is the user_id from the profile
      const worker = selectedApplicationForFeedback.worker || {};
      const workerUserId = worker.user_id || worker.user?.id;
      
      if (!workerUserId) {
        message.error("Worker information is missing. Cannot submit feedback.");
        return;
      }

      // Ensure token is properly formatted
      const token = authToken && authToken.trim() ? authToken.trim() : null;
      
      if (!token) {
        message.error("Authentication token is missing. Please log in again.");
        return;
      }

      // Get current user ID
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const currentUserId = userData.id || userData.user?.id;

      // Use the general review endpoint with worker user_id
      const response = await axios.post(
        `/api/reviews`,
        {
          user_id: currentUserId,
          reviewed_user_id: workerUserId,
          rating: feedbackData.rating,
          comment: feedbackData.feedback
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        message.success("Feedback submitted successfully");
        setIsFeedbackModalOpen(false);
        
        // Immediately update the local state to hide the button
        if (selectedApplicationForFeedback && selectedApplicationForFeedback.id) {
          setApplications(prev => 
            prev.map(app => 
              app.id === selectedApplicationForFeedback.id 
                ? { ...app, has_review: true }
                : app
            )
          );
        }
        
        setSelectedApplicationForFeedback(null);
        // Refresh applications to update has_review status from backend
        await fetchApplications();
      } else {
        message.error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        message.error("Session expired. Please log in again.");
      } else if (error.response?.status === 403) {
        message.error("You are not authorized to review this worker");
      } else if (error.response?.status === 400) {
        message.error(error.response.data?.message || "Invalid request. Please check the application status.");
      } else {
        message.error(error.response?.data?.message || "Failed to submit review. Please try again.");
      }
    }
  };

  return (
    <div className="job-applications-modal-overlay">
      <div className="job-applications-modal">
        <div className="modal-header">
          <h2>Employee Applications - {jobTitle}</h2>
          <div className="header-actions">
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <FaUser className="empty-icon" />
            <h3>No Applications Yet</h3>
            <p>No one has applied for this job yet.</p>
          </div>
        ) : (
          <>
            <div className="filter-section">
              <div className="filter-buttons">
                <button 
                  className={filterStatus === 'all' ? 'active' : ''}
                  onClick={() => setFilterStatus('all')}
                >
                  All ({applications.length})
                </button>
                <button 
                  className={filterStatus === 'for_interview' ? 'active' : ''}
                  onClick={() => setFilterStatus('for_interview')}
                >
                  For Interview ({applications.filter(app => app.status === 'for_interview').length})
                </button>
                <button 
                  className={filterStatus === 'accepted' ? 'active' : ''}
                  onClick={() => setFilterStatus('accepted')}
                >
                  Hired ({applications.filter(app => app.status === 'accepted').length})
                </button>
                <button 
                  className={filterStatus === 'completed' ? 'active' : ''}
                  onClick={() => setFilterStatus('completed')}
                >
                  Completed ({applications.filter(app => app.status === 'completed').length})
                </button>
                <button 
                  className={filterStatus === 'declined' ? 'active' : ''}
                  onClick={() => setFilterStatus('declined')}
                >
                  Declined ({applications.filter(app => app.status === 'declined').length})
                </button>
              </div>
            </div>

            <div className="applications-list">
              {filteredApplications.map((application) => {
                // Get worker profile image with proper fallback
                const getProfileImageSrc = () => {
                  const profileImg = application?.worker?.profile_img;
                  if (!profileImg || profileImg === 'img/defaultpfp.jpg' || profileImg === 'profiles/defaultpfp.jpg') {
                    return `${window.location.origin}/storage/profiles/defaultpfp.jpg`;
                  }
                  // Remove leading slash if present and construct proper path
                  const cleanPath = profileImg.startsWith('/') ? profileImg.substring(1) : profileImg;
                  return `${window.location.origin}/storage/${cleanPath}`;
                };

                return (
                  <div key={application.id} className="application-card">
                    <div className="application-header">
                      <div className="worker-info">
                        <div className="avatar-container">
                          <div className="avatar-placeholder">
                            <img 
                              src={getProfileImageSrc()}
                              alt={`${getWorkerName(application.worker || {})}'s avatar`}
                              onError={(e) => {
                                e.target.src = `${window.location.origin}/storage/profiles/defaultpfp.jpg`;
                              }}
                              loading="lazy"
                            />
                          </div>
                        </div>
                      <div className="worker-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 className="worker-name">{getWorkerName(application.worker)}</h4>
                        {application.status === 'for_interview' && (
                          <FaUsersViewfinder 
                              className="interview-icon-name" 
                            onClick={() => handleViewApplicationDetails(application)}
                            title="View Application Details"
                          />
                        )}
                          {application.status === 'accepted' && (
                            <svg 
                              className="hired-icon-name" 
                              title="View Hired Workers"
                              onClick={() => handleViewHiredWorkers()}
                              style={{ cursor: 'pointer' }}
                              viewBox="0 0 640 512"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M48 48l88 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L32 0C14.3 0 0 14.3 0 32L0 136c0 13.3 10.7 24 24 24s24-10.7 24-24l0-88zM175.8 224a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm-26.5 32C119.9 256 96 279.9 96 309.3c0 14.7 11.9 26.7 26.7 26.7l56.1 0c8-34.1 32.8-61.7 65.2-73.6c-7.5-4.1-16.2-6.4-25.3-6.4l-69.3 0zm368 80c14.7 0 26.7-11.9 26.7-26.7c0-29.5-23.9-53.3-53.3-53.3l-69.3 0c-9.2 0-17.8 2.3-25.3 6.4c32.4 11.9 57.2 39.5 65.2 73.6l56.1 0zm-89.4 0c-8.6-24.3-29.9-42.6-55.9-47c-3.9-.7-7.9-1-12-1l-80 0c-4.1 0-8.1 .3-12 1c-26 4.4-47.3 22.7-55.9 47c-2.7 7.5-4.1 15.6-4.1 24c0 13.3 10.7 24 24 24l176 0c13.3 0 24-10.7 24-24c0-8.4-1.4-16.5-4.1-24zM464 224a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm-80-32a64 64 0 1 0 -128 0 64 64 0 1 0 128 0zM504 48l88 0 0 88c0 13.3 10.7 24 24 24s24-10.7 24-24l0-104c0-17.7-14.3-32-32-32L504 0c-13.3 0-24 10.7-24 24s10.7 24 24 24zM48 464l0-88c0-13.3-10.7-24-24-24s-24 10.7-24 24L0 480c0 17.7 14.3 32 32 32l104 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-88 0zm456 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l104 0c17.7 0 32-14.3 32-32l0-104c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 88-88 0z" fill="currentColor"></path>
                            </svg>
                          )}
                          {application.status === 'declined' && (
                            <svg 
                              className="declined-icon-name" 
                              title="View Declined Workers"
                              onClick={() => handleViewDeclinedWorkers()}
                              style={{ cursor: 'pointer' }}
                              viewBox="0 0 640 512"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M48 48l88 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L32 0C14.3 0 0 14.3 0 32L0 136c0 13.3 10.7 24 24 24s24-10.7 24-24l0-88zM175.8 224a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm-26.5 32C119.9 256 96 279.9 96 309.3c0 14.7 11.9 26.7 26.7 26.7l56.1 0c8-34.1 32.8-61.7 65.2-73.6c-7.5-4.1-16.2-6.4-25.3-6.4l-69.3 0zm368 80c14.7 0 26.7-11.9 26.7-26.7c0-29.5-23.9-53.3-53.3-53.3l-69.3 0c-9.2 0-17.8 2.3-25.3 6.4c32.4 11.9 57.2 39.5 65.2 73.6l56.1 0zm-89.4 0c-8.6-24.3-29.9-42.6-55.9-47c-3.9-.7-7.9-1-12-1l-80 0c-4.1 0-8.1 .3-12 1c-26 4.4-47.3 22.7-55.9 47c-2.7 7.5-4.1 15.6-4.1 24c0 13.3 10.7 24 24 24l176 0c13.3 0 24-10.7 24-24c0-8.4-1.4-16.5-4.1-24zM464 224a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm-80-32a64 64 0 1 0 -128 0 64 64 0 1 0 128 0zM504 48l88 0 0 88c0 13.3 10.7 24 24 24s24-10.7 24-24l0-104c0-17.7-14.3-32-32-32L504 0c-13.3 0-24 10.7-24 24s10.7 24 24 24zM48 464l0-88c0-13.3-10.7-24-24-24s-24 10.7-24 24L0 480c0 17.7 14.3 32 32 32l104 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-88 0zm456 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l104 0c17.7 0 32-14.3 32-32l0-104c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 88-88 0z" fill="currentColor"></path>
                            </svg>
                          )}
                        </div>
                        <p className="application-date">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                  <div className="message-and-actions" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ color: '#333' }}>Want to message this applicant? </span>
                      <a
                        href="#"
                        onClick={(e) => handleMessageApplicantClick(e, application)}
                        style={{ color: '#1a73e8', textDecoration: 'underline' }}
                      >
                        Click here
                      </a>
                    </div>
                    {application.status !== 'accepted' && application.status !== 'declined' && application.status !== 'completed' && (
                      <div className="application-actions">
                        <button 
                          className="accept-btn"
                          onClick={() => openConfirm(application, 'accepted')}
                          title="Accept/Hire this worker"
                        >
                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
                          </svg>
                          Hire
                        </button>
                        <button 
                          className="decline-btn"
                          onClick={() => openConfirm(application, 'declined')}
                          title="Decline this application"
                        >
                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 352 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                          </svg>
                          Decline
                        </button>
                      </div>
                    )}
                    {application.status === 'completed' && !application.has_review && (
                      <div className="application-actions">
                        <button 
                          type="button"
                          className="give-feedback-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Give Feedback button clicked for application:', application.id);
                            handleGiveFeedback(application);
                          }}
                          title="Give feedback to this worker"
                        >
                          Give Feedback
                        </button>
                      </div>
                    )}
                  </div>
                      </div>
                    </div>
                    <div className="application-status">
                      <span className={`status-badge ${application.status === 'for_interview' ? 'status-interview' : application.status === 'accepted' ? 'status-accepted' : application.status === 'completed' ? 'status-completed' : 'status-declined'}`}>
                        {application.status === 'for_interview' ? 'For Interview' :
                         application.status === 'accepted' ? 'Hired' :
                         application.status === 'completed' ? 'Completed' :
                         'Declined'}
                      </span>
                    </div>
                  </div>

                  {application.cover_letter && (
                    <div className="cover-letter">
                      <h5>Cover Letter:</h5>
                      <p>{application.cover_letter}</p>
                    </div>
                  )}

                  {application.resume_path && (
                    <div className="resume-section">
                      <h5>Resume/CV:</h5>
                      <button 
                        className="download-resume-btn"
                        onClick={() => downloadResume(application.resume_path)}
                      >
                        <FaFilePdf /> Download Resume
                      </button>
                    </div>
                  )}

                  {application.skills && application.skills.length > 0 && (
                    <div className="worker-skills">
                      <h5>Skills:</h5>
                      <div className="skills-list">
                        {application.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ViewWorkersApplicationModal */}
      {showViewWorkersModal && (
        <ViewWorkersApplicationModal
          jobPostId={jobPostId}
          jobTitle={jobTitle}
          applicationId={selectedApplicationId}
          onClose={handleCloseViewWorkersModal}
        />
      )}

      {/* ViewHiredWorkersModal */}
      {showViewHiredWorkersModal && (
        <ViewHiredWorkersModal
          jobPostId={jobPostId}
          jobTitle={jobTitle}
          onClose={handleCloseViewHiredWorkersModal}
        />
      )}

      {/* ViewDeclinedWorkersModal */}
      {showViewDeclinedWorkersModal && (
        <ViewDeclinedWorkersModal
          jobPostId={jobPostId}
          jobTitle={jobTitle}
          onClose={handleCloseViewDeclinedWorkersModal}
        />
      )}

      {/* Confirm Action Modal */}
      {confirmState.open && (
        <div className="confirm-modal-overlay" onClick={closeConfirm}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <h3>Confirm Action</h3>
              <button className="close-btn" onClick={closeConfirm}>
                <FaTimes />
              </button>
            </div>
            <div className="confirm-modal-content">
              <p>
                {confirmState.action === 'accepted' 
                  ? `Are you sure you want to hire ${confirmState.application ? getWorkerName(confirmState.application.worker) : 'this worker'}?`
                  : 'Are you sure you want to decline?'}
              </p>
            </div>
            <div className="confirm-modal-actions">
              <button className="confirm-btn" onClick={proceedConfirm}>
                {confirmState.action === 'accepted' ? 'Hire' : 'Decline'}
              </button>
              <button className="cancel-btn" onClick={closeConfirm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {warningModal.open && (
        <div className="warning-modal-overlay" onClick={() => setWarningModal({ open: false, message: '' })}>
          <div className="warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="warning-modal-header">
              <h3>⚠️ Warning</h3>
              <button className="close-btn" onClick={() => setWarningModal({ open: false, message: '' })}>
                <FaTimes />
              </button>
            </div>
            <div className="warning-modal-content">
              <p>{warningModal.message}</p>
            </div>
            <div className="warning-modal-actions">
              <button className="warning-ok-btn" onClick={() => setWarningModal({ open: false, message: '' })}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && selectedApplicationForFeedback && (
        <ModalFeedback
          onClose={handleCloseFeedbackModal}
          onSubmit={handleSubmitFeedback}
          workerName={getWorkerName(selectedApplicationForFeedback.worker || {})}
        />
      )}
    </div>
  );
};

export default JobApplicationsModal;
