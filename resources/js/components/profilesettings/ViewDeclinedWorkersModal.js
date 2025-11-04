import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser } from 'react-icons/fa';
import { LuFileSearch } from 'react-icons/lu';
import { IoEyeSharp } from 'react-icons/io5';
import axios from 'axios';
import '../../../sass/components/profilesettings/viewdeclinedworkersmodal.scss';

const ViewDeclinedWorkersModal = ({ jobPostId, jobTitle, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobPost, setJobPost] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);

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

  const getWorkerName = (worker) => {
    // Filter out empty/null middle names to avoid double names
    const nameParts = [worker.first_name, worker.middlename, worker.last_name]
      .filter(part => part && part.trim() !== '')
      .join(' ');
    return worker.suffix_name ? `${nameParts} ${worker.suffix_name}` : nameParts;
  };

  const filteredApplications = applications.filter(app => app.status === 'declined');

  const downloadResume = (resumePath) => {
    if (resumePath) {
      window.open(`http://127.0.0.1:8000/storage/${resumePath}`, '_blank');
    }
  };

  const handleViewProfile = (application) => {
    // Check if current user is a worker trying to view another worker's profile
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const currentUser = userData.user || userData;
    
    if (currentUser?.role_id === 1) {
      alert("Workers cannot view other worker profiles. Please switch to employer role to hire workers.");
      return;
    }
    
    // Debug: Log the application data to see the structure
    console.log('Application data:', application);
    console.log('Worker data:', application.worker);
    console.log('Worker ID:', application.worker.id);
    
    // Use the worker's ID for the profile route
    const workerId = application.worker.id;
    console.log('Opening profile for worker ID:', workerId);
    window.open(`/profile/${workerId}`, '_blank');
  };

  const handleViewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowApplicationDetails(true);
  };

  const handleCloseApplicationDetails = () => {
    setShowApplicationDetails(false);
    setSelectedApplication(null);
  };

  return (
    <div className="view-declined-workers-modal-overlay">
      <div className="view-declined-workers-modal">
        <div className="modal-header">
          <h2>Declined Workers - {jobTitle}</h2>
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
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state">
            <FaUser className="empty-icon" />
            <h3>No Declined Workers</h3>
            <p>No workers have been declined for this job yet.</p>
          </div>
        ) : (
          <>
            <div className="applications-list">
              {filteredApplications.map((application) => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <div className="worker-info" onClick={() => handleViewApplicationDetails(application)} style={{ cursor: 'pointer' }}>
                      <div className="worker-avatar">
                        <img 
                          src={(() => {
                            const profileImg = application?.worker?.profile_img;
                            if (profileImg && profileImg !== 'img/defaultpfp.jpg' && profileImg !== 'profiles/defaultpfp.jpg') {
                              const cleanPath = profileImg.startsWith('/') ? profileImg.substring(1) : profileImg;
                              return `http://127.0.0.1:8000/storage/${cleanPath}`;
                            }
                            return "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg";
                          })()}
                          alt={`${getWorkerName(application.worker || {})}'s avatar`}
                          className="profile-image"
                          onError={(e) => {
                            e.target.src = "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg";
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div className="worker-details">
                        <h4 className="worker-name">{getWorkerName(application.worker)}</h4>
                        <p className="application-date">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="application-status">
                      <span className={`status-badge status-declined`}>
                        Declined
                      </span>
                    </div>
                  </div>

                  <div className="profile-info">
                    <h5>Profile Information</h5>
                    <div className="profile-details">
                      <div className="profile-text-details">
                        <p><strong>Email:</strong> {application.worker?.user?.email || 'Not provided'}</p>
                        <p><strong>Location:</strong> {application.worker?.city || 'Not specified'}, {application.worker?.province || 'Not specified'}</p>
                      </div>
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
                      <h5><LuFileSearch /> Resume/CV:</h5>
                      <button 
                        className="download-resume-btn"
                        onClick={() => downloadResume(application.resume_path)}
                      >
                        View Resume
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

                  <div className="application-actions">
                    <button 
                      className="view-profile-btn"
                      onClick={() => handleViewProfile(application)}
                    >
                      <IoEyeSharp /> View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationDetails && selectedApplication && (
        <div className="application-details-modal-overlay">
          <div className="application-details-modal">
            <div className="modal-header">
              <h3>Application Details - {getWorkerName(selectedApplication.worker)}</h3>
              <button className="close-btn" onClick={handleCloseApplicationDetails}>
                <FaTimes />
              </button>
            </div>
            
            <div className="application-details-content">
              <div className="profile-info">
                <h4>Worker Profile Information</h4>
                <div className="profile-details">
                  <div className="profile-image-section">
                    <img 
                      src={selectedApplication.worker.profile_img && selectedApplication.worker.profile_img !== 'img/defaultpfp.jpg' 
                        ? `http://127.0.0.1:8000/storage/${selectedApplication.worker.profile_img}?v=${Date.now()}` 
                        : "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg"
                      } 
                      alt={`${getWorkerName(selectedApplication.worker)}'s avatar`}
                      className="profile-image"
                      onError={(e) => {
                        e.target.src = "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg";
                      }}
                    />
                  </div>
                  <div className="profile-text-details">
                    <p><strong>Name:</strong> {getWorkerName(selectedApplication.worker)}</p>
                    <p><strong>Email:</strong> {selectedApplication.worker?.user?.email || 'Not provided'}</p>
                    <p><strong>Location:</strong> {selectedApplication.worker?.city || 'Not specified'}, {selectedApplication.worker?.province || 'Not specified'}</p>
                    <p><strong>Applied on:</strong> {new Date(selectedApplication.created_at).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> Declined</p>
                  </div>
                </div>
              </div>

              {selectedApplication.cover_letter && (
                <div className="cover-letter-section">
                  <h4>Cover Letter</h4>
                  <div className="cover-letter-content">
                    <p>{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                <div className="skills-section">
                  <h4>Skills</h4>
                  <div className="skills-list">
                    {selectedApplication.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplication.resume_path && (
                <div className="resume-section">
                  <h4><LuFileSearch /> Resume/CV</h4>
                  <button 
                    className="download-resume-btn"
                    onClick={() => downloadResume(selectedApplication.resume_path)}
                  >
                    View Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewDeclinedWorkersModal;

