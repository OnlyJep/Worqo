import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './../../../sass/components/jobprofile.scss';
import Headerz from "../HeaderContent/Headerz";
import Footer from "../FooterContent/footer";
import profilePhoto from '../../../../resources/sass/img/pfp.svg';
import coverPhoto from '../../../../resources/sass/img/coverphoto.svg';
import ApplyJobModal from './ApplyJobModal';
import { MdDateRange, MdAccessTime } from "react-icons/md";
import Loader from "../LoaderContent/loader";

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
        
        const response = await axios.get(`http://127.0.0.1:8000/api/jobposts/${jobId}`, {
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

      await axios.post('http://127.0.0.1:8000/api/job-applications/apply', payload, {
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
      month: 'long', 
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
        <div className="job-profile-photo-wrapper">
          <img src={profilePhoto} alt="Job Logo" className="job-profile-photo" />
        </div>
      </div>

      <div className="job-profile-container">
        <div className="job-profile-left">
          <div className="job-profile-info">
            <h2>{job.job_title}</h2>
            <div className="job-status-container">
              <span className="job-status-dot"></span>
              <p className="job-status">{job.archived ? 'Archived' : 'Available Now'}</p>
            </div>
            <p className="job-location">Posted by: {job.profile?.first_name} {job.profile?.middlename} {job.profile?.last_name} {job.profile?.suffix?.suffix_name}</p>
            <p className="job-member-since">POSTED SINCE: {new Date(job.created_at).toLocaleDateString()}</p>
            <button className="job-apply-button" onClick={handleApplyJob}>
              Apply Job
            </button>
          </div>
          <div className="job-stats">
            <div className="job-stat-item">
              <span className="job-stat-label">Salary</span>
              <span className="job-stat-number">₱{job.salary}/{job.salary_type === 'per_hour' ? 'hour' : 'month'}</span>
            </div>
            <div className="job-stat-item">
              <span className="job-stat-label">Job Type</span>
              <span className="job-stat-number">{job.job_type}</span>
            </div>
          </div>
          <div className="job-application-period">
            <h4>Application Period</h4>
            <div className="job-application-list">
              <div className="job-date-item">
                <MdDateRange className="job-date-icon" />
                <span>Start: {formatDate(job.application_start)}</span>
              </div>
              <div className="job-date-item">
                <MdDateRange className="job-date-icon" />
                <span>Deadline: {formatDate(job.application_deadline)}</span>
              </div>
            </div>
          </div>
          
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

        <div className="job-profile-right">
          <h3 className="job-overview-title">OVERVIEW</h3>
          
          <div className="job-about-section">
            <h4>About</h4>
            <p>{formatDescription(job.description)}</p>
          </div>
          
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