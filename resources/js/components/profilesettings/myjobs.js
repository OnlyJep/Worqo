import React, { useState, useEffect } from 'react';
import { FaBriefcase, FaCalendar, FaMapMarkerAlt, FaDollarSign, FaClock, FaUser, FaRegEdit } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { message } from 'antd';
import axios from 'axios';
import CancelJobApplicationModal from './CancelJobApplicationModal';
import EditMyJob from './EditMyJob';
import '../../../sass/components/profilesettings/myjobs.scss';

const MyJobs = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancelModal, setCancelModal] = useState({ isOpen: false, applicationId: null, jobTitle: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, application: null });

  const applicationCategories = [
    { id: 'all', label: 'All Applications' },
    { id: 'for_interview', label: 'For Interview' },
    { id: 'accepted', label: 'Hired' },
    { id: 'declined', label: 'Declined' }
  ];

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const currentUser = userData.user || userData;
      
      if (!currentUser.id) {
        console.error('No user ID found');
        setApplications([]);
        return;
      }

      // Try to get profile_id first, then fallback to user_id
      let workerId = currentUser.profile_id;
      
      // If profile_id is not available, try to fetch it from the API
      if (!workerId) {
        try {
          const authToken = localStorage.getItem("auth_token");
          const userResponse = await axios.get(`/api/users/${currentUser.id}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json'
            }
          });
          
          const fetchedUserData = userResponse.data.user || userResponse.data;
          workerId = fetchedUserData.profile_id;
          
          if (workerId) {
            // Update localStorage with profile_id
            const updatedUser = { ...currentUser, profile_id: workerId };
            localStorage.setItem("user", JSON.stringify(userData.user ? { user: updatedUser } : updatedUser));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      
      // If still no profile_id, try using user_id as fallback
      if (!workerId) {
        workerId = currentUser.id;
        console.log('Using user_id as fallback for worker_id:', workerId);
      }

      // Try fetching with profile_id first
      let response;
      try {
        response = await axios.get(`/api/job-applications/worker/${workerId}`);
        console.log('My applications API response:', response.data);
        
        // If no applications found and we used user_id, try with profile_id from API
        if ((!response.data || response.data.length === 0) && workerId === currentUser.id) {
          try {
            const authToken = localStorage.getItem("auth_token");
            const userResponse = await axios.get(`/api/users/${currentUser.id}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
              }
            });
            
            const fetchedUserData = userResponse.data.user || userResponse.data;
            if (fetchedUserData.profile_id && fetchedUserData.profile_id !== currentUser.id) {
              response = await axios.get(`/api/job-applications/worker/${fetchedUserData.profile_id}`);
              console.log('My applications API response (with profile_id):', response.data);
            }
          } catch (error) {
            console.error('Error fetching applications with profile_id:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications([]);
        return;
      }
      
      // Sort applications: For Interview first, then Hired, Declined
      const sortedApplications = response.data.sort((a, b) => {
        const statusOrder = { 'for_interview': 1, 'accepted': 2, 'declined': 3 };
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      });
      
      setApplications(sortedApplications);
    } catch (error) {
      console.error('Error fetching my applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', text: 'Pending', icon: '⏳' },
      for_interview: { class: 'status-interview', text: 'For Interview', icon: '📞' },
      accepted: { class: 'status-accepted', text: 'Hired', icon: '✅' },
      declined: { class: 'status-declined', text: 'Declined', icon: '❌' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSalary = (salary, salaryType) => {
    if (!salary) return 'Not specified';
    return `₱${parseFloat(salary).toLocaleString()}${salaryType === 'per_hour' ? '/hour' : '/month'}`;
  };

  const handleCancelApplication = async (applicationId) => {
    try {
      await axios.patch(`/api/job-applications/${applicationId}/status`, {
        status: 'declined'
      });
      
      // Update the application status in the local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'declined' }
            : app
        )
      );
      
      message.success('Application cancelled successfully');
    } catch (error) {
      console.error('Error cancelling application:', error);
      message.error('Failed to cancel application');
    }
  };

  const openCancelModal = (applicationId, jobTitle) => {
    setCancelModal({
      isOpen: true,
      applicationId: applicationId,
      jobTitle: jobTitle
    });
  };

  const closeCancelModal = () => {
    setCancelModal({
      isOpen: false,
      applicationId: null,
      jobTitle: ''
    });
  };

  const confirmCancelApplication = () => {
    if (cancelModal.applicationId) {
      handleCancelApplication(cancelModal.applicationId);
    }
  };

  const openEditModal = (application) => {
    setEditModal({
      isOpen: true,
      application: application
    });
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      application: null
    });
  };

  const handleEditSubmit = (formData) => {
    // Handle edit submission
    console.log('Edit submitted:', formData);
    closeEditModal();
    // Optionally refresh applications
    fetchMyApplications();
  };



  // Filter applications based on active tab
  const getFilteredApplications = () => {
    if (activeTab === 'all') {
      return applications;
    }
    return applications.filter(application => 
      application.status.toLowerCase() === activeTab
    );
  };

  const filteredApplications = getFilteredApplications();

  const handleTabClick = (tabId) => {
    console.log('Tab clicked:', tabId);
    setActiveTab(tabId);
  };

  if (loading) {
    return (
      <div className="myjobs-container">
        <div className="myjobs-loading-container">
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="myjobs-container">
      <div className="myjobs-header">
        <h2 className="myjobs-title">My Jobs</h2>
      </div>

      <div className="myjobs-navigation">
        {applicationCategories.map((category) => (
          <div key={category.id} className="myjobs-tab-container">
            <button
              type="button"
              className={`myjobs-tab ${activeTab === category.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTabClick(category.id);
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {category.label}
            </button>
          </div>
        ))}
      </div>

      <div className="myjobs-list">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((application) => (
            <div key={application.id} className={`myjobs-card ${application.status === 'declined' ? 'expired' : ''}`}>
              <div className="myjobs-card-header">
                <div className="myjobs-card-actions">
                  {/* Actions here */}
                </div>
              </div>
              <div className="myjobs-content">
                <div className="myjobs-title-row">
                  <h3 className="myjobs-job-title">
                    {application.job_post?.job_title || 'Job Title Not Available'}
                    {application.status === 'for_interview' && (
                      <FaRegEdit 
                        className="edit-icon" 
                        style={{ marginLeft: '8px', color: '#6b7280', cursor: 'pointer', fontSize: '22px' }} 
                        onClick={() => openEditModal(application)}
                      />
                    )}
                  </h3>
                  <span className="myjobs-posted-date">Applied on {formatDate(application.created_at)}</span>
                </div>
                
                <div className="myjobs-metadata">
                  <span className="myjobs-salary">₱{application.job_post?.salary?.toLocaleString() || 'N/A'}/{application.job_post?.salary_type === 'per_hour' ? 'hour' : 'month'}</span>
                  <span 
                    className="myjobs-status"
                    style={{
                      color: application.status === 'declined' ? '#dc3545' :
                             application.status === 'accepted' ? '#059669' :
                             application.status === 'for_interview' ? '#1890ff' : '#6b7280'
                    }}
                  >
                    {application.status === 'for_interview' ? 'For Interview' :
                     application.status === 'accepted' ? 'Hired' :
                     application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>

                <div className="myjobs-info-grid">
                  <div className="myjobs-info-item">
                    <span className="myjobs-info-label">Employer:</span>
                    <span className="myjobs-info-value">
                      {application.job_post?.profile ? 
                        `${application.job_post.profile.first_name} ${application.job_post.profile.middlename || ''} ${application.job_post.profile.last_name}`.trim() : 
                        'Unknown Employer'
                      }
                    </span>
                  </div>
                  {application.resume_path && (
                    <div className="myjobs-info-item myjobs-resume-item">
                      <span className="myjobs-info-label">Resume/CV:</span>
                      <span className="myjobs-info-value">
                        <a 
                          href={`${window.location.origin}/storage/${application.resume_path}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="myjobs-resume-link"
                        >
                          View Resume
                        </a>
                      </span>
                    </div>
                  )}
                  {application.cover_letter && (
                    <div className="myjobs-info-item myjobs-cover-letter-item">
                      <span className="myjobs-info-label">Cover Letter:</span>
                      <span className="myjobs-info-value myjobs-cover-letter">
                        {application.cover_letter}
                      </span>
                    </div>
                  )}
                </div>
                {application.status === 'for_interview' && (
                  <div className="myjobs-cancel-section">
                    <button 
                      className="myjobs-cancel-btn"
                      onClick={() => openCancelModal(application.id, application.job_post?.job_title)}
                    >
                      Cancel Application
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="myjobs-empty-state">
            <div className="myjobs-empty-icon">
              <img src="/images/mybooking.svg" alt="No Applications" />
            </div>
            <h3 className="myjobs-empty-title">No Applications Yet</h3>
            <p className="myjobs-empty-description">You haven't applied for any jobs yet.</p>
          </div>
        )}
      </div>

      <CancelJobApplicationModal
        isOpen={cancelModal.isOpen}
        onClose={closeCancelModal}
        onConfirm={confirmCancelApplication}
        jobTitle={cancelModal.jobTitle}
      />

      <EditMyJob
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        application={editModal.application}
      />

    </div>
  );
};

export default MyJobs;