import React, { useState, useEffect } from 'react';
import { FaBriefcase, FaCalendar, FaMapMarkerAlt, FaDollarSign, FaClock, FaUser } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { message } from 'antd';
import axios from 'axios';
import '../../../sass/components/profilesettings/myjobs.scss';

const MyJobs = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const applicationCategories = [
    { id: 'all', label: 'All Applications' },
    { id: 'for_interview', label: 'For Interview' },
    { id: 'accepted', label: 'Hired' },
    { id: 'declined', label: 'Declined' },
    { id: 'fired', label: 'Fired' }
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
      <div className="my-jobs-container">
        <div className="loading-container">
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-jobs-container">
      <div className="post-job-header">
        <h2 className="post-job-title">My Jobs</h2>
      </div>

      <div className="bookings-navigation">
        {applicationCategories.map((category) => (
          <div key={category.id} className="booking-tab-container">
            <button
              type="button"
              className={`booking-tab ${activeTab === category.id ? 'active' : ''}`}
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

      <div className="jobs-list">
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
              <div key={application.id} className={`job-card ${application.status === 'declined' || application.status === 'fired' ? 'expired' : ''}`}>
                        <div className="job-card-header">
                          <div className="job-actions">
                            {application.status === 'declined' && <div className="expired-badge">DECLINED</div>}
                            {application.status === 'fired' && <div className="expired-badge">FIRED</div>}
                          </div>
                        </div>

                <div className="job-content">
                  <h3 className="job-title">{jobDetails?.job_title || 'Job Title Not Available'}</h3>
                  
                  <div className="job-metadata">
                    <span className="posted-date">Applied on {formatDate(application.created_at)}</span>
                    <span className="job-salary">₱{jobDetails?.salary?.toLocaleString() || 'N/A'}/{jobDetails?.salary_type === 'per_hour' ? 'hour' : 'month'}</span>
                  </div>

                  <div className="job-info-grid">
                    <div className="info-item">
                      <span className="info-label">Employer:</span>
                      <span className="info-value">
                        {employerProfile ? 
                          `${employerProfile.first_name} ${employerProfile.middlename || ''} ${employerProfile.last_name}`.trim() : 
                          'Unknown Employer'
                        }
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Status:</span>
                      <span className={`status-badge status-${application.status}`}>
                        {application.status === 'for_interview' ? 'For Interview' :
                         application.status === 'accepted' ? 'Hired' :
                         application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>

                    {application.cover_letter && (
                      <div className="info-item cover-letter-item">
                        <span className="info-label">Cover Letter:</span>
                        <span className="info-value">{application.cover_letter}</span>
                      </div>
                    )}

                    {application.resume_path && (
                      <div className="info-item resume-item">
                        <span className="info-label">Your Resume:</span>
                        <span className="info-value">
                          <a 
                            href={`http://127.0.0.1:8000/storage/${application.resume_path}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="resume-link"
                          >
                            View Resume
                          </a>
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <img src="/images/mybooking.svg" alt="No Applications" />
            </div>
            <h3 className="empty-title">No Applications Yet</h3>
            <p className="empty-description">You haven't applied for any jobs yet.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default MyJobs;
