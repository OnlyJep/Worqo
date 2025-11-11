import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './../../../sass/components/jobprofile.scss';
import Headerz from "../HeaderContent/Headerz";
import Footer from "../FooterContent/footer";
import coverPhoto from '../../../../resources/sass/img/coverphoto.svg';
import ApplyJobModal from './ApplyJobModal';
import { MdDateRange, MdAccessTime } from "react-icons/md";
import Loader from "../LoaderContent/loader";
import { getProfileImageUrl } from '../../utils/profileImageUtils';
import { message } from 'antd';

const defpfp = '/images/defpfp.svg';

const JobProfile = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState(state?.job || null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [userRank, setUserRank] = useState("Silver 1"); // Mock user rank
  const [loading, setLoading] = useState(!state?.job);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobData = async () => {
      if (state?.job) {
        setJob(state.job);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/jobposts/${jobId}`, {
          headers: { Accept: "application/json" }
        });

        if (response.data) {
          setJob(response.data);
        } else {
          setError("Job not found");
        }
      } catch (error) {
        console.error("Error fetching job data:", error);
        setError("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobData();
    }
  }, [jobId, state]);

  useEffect(() => {
    if (!loading && !job && !error) {
      navigate('/find-jobs'); // Redirect if no job data
    }
  }, [job, loading, error, navigate]);

  const handleApplyJob = () => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) {
      message.warning('Please login to apply for jobs');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return;
    }
    
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUser = userData.user || userData;
    
    if (currentUser.role_id === 2) {
      message.warning('Employers cannot apply for jobs. Please switch to Worker account.');
      return;
    }
    
    setIsApplyModalOpen(true);
  };

  const handleModalClose = () => {
    setIsApplyModalOpen(false);
  };

  const handleModalSubmit = async (formData) => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUser = userData.user || userData || {};

      const payload = {
        job_post_id: job?.id,
        cover_letter: formData?.cover_letter || '',
        skills: formData?.skills || [],
      };

      // Attach worker_id or company_id if present; backend handles validation based on hiring_type
      if (currentUser.profile_id) {
        payload.worker_id = currentUser.profile_id;
      } else if (currentUser.company_id) {
        payload.company_id = currentUser.company_id;
      }

      await axios.post(`/api/job-applications/apply`, payload, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      setIsApplyModalOpen(false);
      // Optionally navigate or show a confirmation UI
    } catch (e) {
      console.error('Failed to submit application:', e.response?.data || e.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatDescription = (description) => {
    if (!description) return '';
    return description.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < description.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="job-profile-page">
        <Headerz />
        <div className="loading-container">
          <Loader />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-profile-page">
        <Headerz />
        <div className="error-container">
          <p className="error-message">{error || "Job not found"}</p>
          <button onClick={() => navigate('/find-jobs')} className="back-button">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-profile-page">
      <Headerz />
      <div className="job-profile-header">
        <div className="job-cover-photo">
          <img src={coverPhoto} alt="Cover" />
        </div>
        <div className="job-info-card">
            <div className="job-info-section">
              <div className="job-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="job-info-label">JOB TITLE</div>
              <div className="job-info-value">{job.job_title}</div>
            </div>
            <div className="job-info-divider"></div>
            <div className="job-info-section">
              <div className="job-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 4v16M8 4h8c2 0 3 1 3 3s-1 3-3 3H8M8 10h8"/>
                  <line x1="4" y1="8" x2="20" y2="8"/>
                  <line x1="4" y1="12" x2="20" y2="12"/>
                </svg>
              </div>
              <div className="job-info-label">SALARY</div>
              <div className="job-info-value">₱{job.salary}/{job.salary_type === 'per_hour' ? 'hour' : 'month'}</div>
            </div>
            <div className="job-info-divider"></div>
            <div className="job-info-section">
              <div className="job-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="job-info-label">JOB TYPE</div>
              <div className="job-info-value">{(job.job_type || 'Any').replace(/_/g, ' ').toUpperCase()}</div>
            </div>
            <div className="job-info-divider"></div>
            <div className="job-info-section">
              <div className="job-info-icon">
                <MdDateRange />
              </div>
              <div className="job-info-label">START</div>
              <div className="job-info-value">{formatDate(job.application_start)}</div>
            </div>
            <div className="job-info-divider"></div>
            <div className="job-info-section">
              <div className="job-info-icon">
                <MdDateRange />
              </div>
              <div className="job-info-label">DEADLINE</div>
              <div className="job-info-value">{formatDate(job.application_deadline)}</div>
            </div>
          </div>
        </div>

      <div className="job-profile-container">
        {/* Main Grid: Left Column (Poster Card + Work Period) and Right Column (Overview + Skills) */}
        <div className="job-main-grid">
          {/* Left Column: Poster Profile Card and Work Period */}
          <div className="job-left-column">
            <div className="poster-profile-card">
              <div className="poster-profile-image">
                <img 
                  src={job?.profile?.profile_img ? getProfileImageUrl(job.profile.profile_img, defpfp) : defpfp} 
                  alt="Poster Profile" 
                  onError={(e) => {
                    e.target.src = defpfp;
                  }}
                />
              </div>
              <div className="poster-profile-info">
                <h4 className="poster-name">{job.profile?.first_name} {job.profile?.middlename} {job.profile?.last_name} {job.profile?.suffix?.suffix_name}</h4>
                <p className="poster-role">Job Poster</p>
                <p className="poster-posted-since">POSTED SINCE: {new Date(job.created_at).toLocaleDateString()}</p>
              </div>
              <div className="profile-actions">
                <button className="job-apply-button" onClick={handleApplyJob}>
                  Apply Job
                </button>
              </div>
            </div>

            {/* Job Info Card - shown on mobile only, positioned after poster card */}
            <div className="job-info-card mobile-only">
              <div className="job-info-section">
                <div className="job-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="job-info-label">JOB TITLE</div>
                <div className="job-info-value">{job.job_title}</div>
              </div>
              <div className="job-info-divider"></div>
              <div className="job-info-section">
                <div className="job-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <path d="M12 6v12M9 9h6M9 15h6"/>
                    <path d="M8 8h8M8 16h8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="job-info-label">SALARY</div>
                <div className="job-info-value">₱{job.salary}/{job.salary_type === 'per_hour' ? 'hour' : 'month'}</div>
              </div>
              <div className="job-info-divider"></div>
              <div className="job-info-section">
                <div className="job-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="job-info-label">JOB TYPE</div>
                <div className="job-info-value">{(job.job_type || 'Any').replace(/_/g, ' ').toUpperCase()}</div>
              </div>
              <div className="job-info-divider"></div>
              <div className="job-info-section">
                <div className="job-info-icon">
                  <MdDateRange />
                </div>
                <div className="job-info-label">START</div>
                <div className="job-info-value">{formatDate(job.application_start)}</div>
              </div>
              <div className="job-info-divider"></div>
              <div className="job-info-section">
                <div className="job-info-icon">
                  <MdDateRange />
                </div>
                <div className="job-info-label">DEADLINE</div>
                <div className="job-info-value">{formatDate(job.application_deadline)}</div>
              </div>
            </div>

            {/* Work Period below Poster Profile Card */}
            {job.work_start && job.work_end && (
              <div className="job-work-period">
                <h4>Work Period</h4>
                <div className="job-application-list">
                  <div className="job-date-item">
                    <MdAccessTime className="job-work-icon" />
                    <span>Work Start: {formatDate(job.work_start)}</span>
                  </div>
                  <div className="job-date-item">
                    <MdAccessTime className="job-work-icon" />
                    <span>Work End: {formatDate(job.work_end)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Overview Section and Skills Required */}
          <div className="job-right-column">
            <div className="job-overview-section">
              <h3 className="job-overview-title">OVERVIEW</h3>
              
              <div className="job-about-section">
                <h4>Job Description</h4>
                <p>{formatDescription(job.description)}</p>
              </div>
            </div>

            {/* Skills Required below Overview */}
            <div className="job-skills-section">
              <h4>Skills Required</h4>
              <div className="job-skills-row">
                {job.skills && job.skills.map((skill, index) => (
                  <span key={index} className="job-chip">
                    {skill.name} ({skill.experience || 'No experience specified'})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <ApplyJobModal
        job={job}
        isOpen={isApplyModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        userRank={userRank}
      />
    </div>
  );
};

export default JobProfile;