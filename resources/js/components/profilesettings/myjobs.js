import React, { useState, useEffect } from 'react';
import { FaBriefcase, FaCalendar, FaMapMarkerAlt, FaDollarSign, FaClock, FaUser } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { message } from 'antd';
import axios from 'axios';
import CancelJobApplicationModal from './CancelJobApplicationModal';
import '../../../sass/components/profilesettings/myjobs.scss';

const MyJobs = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancelModal, setCancelModal] = useState({ isOpen: false, applicationId: null, jobTitle: '' });

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
        return;
      }

      // Use the user ID as worker_id since that's what's stored in job_applications table
      const response = await axios.get(`http://127.0.0.1:8000/api/job-applications/worker/${currentUser.id}`);
      console.log('My applications API response:', response.data);
      
      // Sort applications: For Interview first, then Hired, Declined, Fired
      const sortedApplications = response.data.sort((a, b) => {
        const statusOrder = { 'for_interview': 1, 'accepted': 2, 'declined': 3, 'fired': 4 };
        return statusOrder[a.status] - statusOrder[b.status];
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
      declined: { class: 'status-declined', text: 'Declined', icon: '❌' },
      fired: { class: 'status-fired', text: 'Fired', icon: '🔥' }
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
      await axios.patch(`http://127.0.0.1:8000/api/job-applications/${applicationId}/status`, {
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
          filteredApplications.map((application) => {
            console.log('Application:', application);
            console.log('Application job_post:', application.job_post);
            
            const jobDetails = application.job_post;
            const employerProfile = jobDetails?.profile;
            
            console.log('Job Details:', jobDetails);
            console.log('Job Title:', jobDetails?.job_title);
            console.log('Employer Profile:', employerProfile);
            
            // Check if job_post data is available
            if (!application.job_post) {
              console.error('No job_post data found for application:', application.id);
              return (
                <div key={application.id} className="job-card">
                  <div className="job-content">
                    <h3 className="job-title">Loading job details...</h3>
                  </div>
                </div>
              );
            }

            return (
              <div key={application.id} className={`myjobs-card ${application.status === 'declined' ? 'expired' : ''}`}>
                <div className="myjobs-card-header">
                  <div className="myjobs-card-actions">
                  </div>
                </div>

                <div className="myjobs-content">
                  <div className="myjobs-title-row">
                    <h3 className="myjobs-job-title">{jobDetails?.job_title || 'Job Title Not Available'}</h3>
                    <span className="myjobs-posted-date">Applied on {formatDate(application.created_at)}</span>
                  </div>
                  
                  <div className="myjobs-metadata">
                    <span className="myjobs-salary">₱{jobDetails?.salary?.toLocaleString() || 'N/A'}/{jobDetails?.salary_type === 'per_hour' ? 'hour' : 'month'}</span>
                  </div>

                  <div className="myjobs-info-grid">
                    <div className="myjobs-info-item">
                      <span className="myjobs-info-label">Employer:</span>
                      <span className="myjobs-info-value">
                        {employerProfile ? 
                          `${employerProfile.first_name} ${employerProfile.middlename || ''} ${employerProfile.last_name}`.trim() : 
                          'Unknown Employer'
                        }
                      </span>
                    </div>

                    <div className="myjobs-info-item">
                      <span className="myjobs-info-label">Status:</span>
                      <span 
                        className="myjobs-info-value"
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

                    {application.resume_path && (
                      <div className="myjobs-info-item myjobs-resume-item">
                        <span className="myjobs-info-label">Resume/CV:</span>
                        <span className="myjobs-info-value">
                          <a 
                            href={`http://127.0.0.1:8000/storage/${application.resume_path}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="myjobs-resume-link"
                          >
                            View Resume
                          </a>
                        </span>
                      </div>
                    )}

                    {/* Work Period Information */}
                    {jobDetails?.work_start && jobDetails?.work_end && (
                      <div className="myjobs-info-item myjobs-work-period-item">
                        <span className="myjobs-info-label">Work Period:</span>
                        <span className="myjobs-info-value">
                          {new Date(jobDetails.work_start).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })} - {new Date(jobDetails.work_end).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {application.status === 'for_interview' && (
                    <div className="myjobs-cancel-section">
                      <button 
                        className="myjobs-cancel-btn"
                        onClick={() => openCancelModal(application.id, jobDetails?.job_title)}
                      >
                        Cancel Application
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })
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

    </div>
  );
};

export default MyJobs;
B