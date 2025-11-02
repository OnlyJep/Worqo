import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaCheck, FaTimes as FaX, FaCalendar, FaFilePdf, FaFire } from 'react-icons/fa';
import { FaUsersViewfinder } from 'react-icons/fa6';
import axios from 'axios';
import '../../../sass/components/profilesettings/jobapplicationsmodal.scss';
import '../../../sass/components/profilesettings/confirmmodal.scss';
import ViewWorkersApplicationModal from './ViewWorkersApplicationModal';
import ViewHiredWorkersModal from './ViewHiredWorkersModal';
import ViewDeclinedWorkersModal from './ViewDeclinedWorkersModal';

const JobApplicationsModal = ({ jobPostId, jobTitle, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [jobPost, setJobPost] = useState(null);
  const [showViewWorkersModal, setShowViewWorkersModal] = useState(false);
  const [showViewHiredWorkersModal, setShowViewHiredWorkersModal] = useState(false);
  const [showViewDeclinedWorkersModal, setShowViewDeclinedWorkersModal] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, action: null, application: null });

  useEffect(() => {
    fetchJobPost();
    fetchApplications();
  }, [jobPostId]);


  const fetchJobPost = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/jobposts/${jobPostId}`);
      setJobPost(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching job post:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/job-applications/job/${jobPostId}`);
      console.log('Applications API Response:', response.data);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatus = async (applicationId, status) => {
    try {
      // Check hiring type logic
      if (status === 'accepted' && jobPost) {
        const acceptedCount = applications.filter(app => app.status === 'accepted').length;
        
        if (jobPost.hiring_type === 'individual' && acceptedCount >= 1) {
          alert('This job is for individual hiring. Only one person can be accepted.');
          return;
        }
        
        if (jobPost.hiring_type === 'team' && acceptedCount >= 20) {
          alert('This job is for team hiring. Maximum 20 people can be accepted.');
          return;
        }
      }

      await axios.patch(`http://127.0.0.1:8000/api/job-applications/${applicationId}/status`, {
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
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const openConfirm = (application, status) => {
    setConfirmState({ open: true, action: status, application });
  };

  const closeConfirm = () => setConfirmState({ open: false, action: null, application: null });

  const proceedConfirm = () => {
    if (confirmState.open && confirmState.application && confirmState.action) {
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
      window.open(`http://127.0.0.1:8000/storage/${resumePath}`, '_blank');
    }
  };

  const handleViewProfile = (workerId) => {
    // Check if current user is a worker trying to view another worker's profile
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const currentUser = userData.user || userData;
    
    if (currentUser?.role_id === 1) {
      alert("Workers cannot view other worker profiles. Please switch to employer role to hire workers.");
      return;
    }
    
    window.open(`/profile/${workerId}`, '_blank');
  };

  const handleViewApplicationDetails = (application) => {
    setShowViewWorkersModal(true);
  };

  const handleCloseViewWorkersModal = () => {
    setShowViewWorkersModal(false);
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
                  className={filterStatus === 'declined' ? 'active' : ''}
                  onClick={() => setFilterStatus('declined')}
                >
                  Declined ({applications.filter(app => app.status === 'declined').length})
                </button>
              </div>
            </div>

            <div className="applications-list">
              {filteredApplications.map((application) => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <div className="worker-info">
                      <div className="avatar-container">
                        <div className="avatar-placeholder">
                          <img 
                            src={application.worker.profile_img && application.worker.profile_img !== 'img/defaultpfp.jpg' 
                              ? `http://127.0.0.1:8000/storage/${application.worker.profile_img}?v=${Date.now()}` 
                              : "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg"
                            } 
                            alt={`${getWorkerName(application.worker)}'s avatar`}
                            onError={(e) => {
                              e.target.src = "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg";
                            }}
                          />
                        </div>
                      </div>
                      <div className="worker-details">
                        <h4 className="worker-name">{getWorkerName(application.worker)}</h4>
                        <p className="application-date">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ color: '#333' }}>Want to message this applicant? </span>
                          <a
                            href="#"
                            onClick={async (e) => {
                              e.preventDefault();
                              const stored = JSON.parse(localStorage.getItem('user') || '{}');
                              const currentRole = stored?.role_id;
                              const targetRole = 2; // employer role to chat as employer
                              try {
                                if (currentRole && currentRole !== targetRole) {
                                  const authToken = localStorage.getItem('auth_token');
                                  await fetch('http://127.0.0.1:8000/api/users/switch-role', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                                    body: JSON.stringify({ user_id: stored.id || stored?.user?.id, role_id: targetRole })
                                  }).catch(() => {});
                                  const updated = { ...(stored.user || stored), role_id: targetRole };
                                  localStorage.setItem('user', JSON.stringify(stored.user ? { user: updated } : updated));
                                }
                              } catch (_) {}
                              window.location.href = '/message';
                            }}
                            style={{ color: '#1a73e8', textDecoration: 'underline' }}
                          >
                            Click here
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="application-status">
                      <div className="status-container">
                        <span className={`status-badge ${application.status === 'for_interview' ? 'status-interview' : application.status === 'accepted' ? 'status-accepted' : application.status === 'declined' ? 'status-declined' : 'status-fired'}`}>
                          {application.status === 'for_interview' ? 'For Interview' :
                           application.status === 'accepted' ? 'Hired' :
                           application.status === 'declined' ? 'Declined' :
                           application.status === 'fired' ? 'Fired' : application.status}
                        </span>
                        {application.status === 'for_interview' && (
                          <FaUsersViewfinder 
                            className="interview-icon" 
                            onClick={() => handleViewApplicationDetails(application)}
                            title="View Application Details"
                          />
                        )}
                        {application.status === 'accepted' && (
                          <svg 
                            className="hired-icon" 
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
                            className="declined-icon" 
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
                      {application.status === 'for_interview' && (
                        <div className="status-actions">
                          <button 
                            className="accept-btn-small"
                            onClick={() => openConfirm(application, 'accepted')}
                            title="Accept Application"
                          >
                            <FaCheck />
                          </button>
                          <button 
                            className="decline-btn-small"
                            onClick={() => openConfirm(application, 'declined')}
                            title="Decline Application"
                          >
                            <FaX />
                          </button>
                        </div>
                      )}
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

                  {application.status === 'for_interview' && (
                    <div className="application-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => openConfirm(application, 'accepted')}
                      >
                        <FaCheck /> Hire
                      </button>
                      <button 
                        className="decline-btn"
                        onClick={() => openConfirm(application, 'declined')}
                      >
                        <FaX /> Decline
                      </button>
                    </div>
                  )}

                  {application.status === 'accepted' && (
                    <div className="application-actions">
                      <button 
                        className="fire-btn"
                        onClick={() => handleApplicationStatus(application.id, 'fired')}
                      >
                        <FaFire /> Fire
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ViewWorkersApplicationModal */}
      {showViewWorkersModal && (
        <ViewWorkersApplicationModal
          jobPostId={jobPostId}
          jobTitle={jobTitle}
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
                Are you sure you want to {confirmState.action === 'accepted' ? 'hire' : 'decline'}{' '}
                {confirmState.application ? getWorkerName(confirmState.application.worker) : 'this worker'}?
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
    </div>
  );
};

export default JobApplicationsModal;
