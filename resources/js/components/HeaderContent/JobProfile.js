import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './../../../sass/components/JobProfile.scss'; // Reuse profile.scss
import Headerz from "../HeaderContent/Headerz";
import Footer from "../FooterContent/footer";
import profilePhoto from '../../../../resources/sass/img/pfp.svg';
import coverPhoto from '../../../../resources/sass/img/coverphoto.svg';
import ApplyJobModal from './ApplyJobModal';

const JobProfile = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const job = state?.job;
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [userRank, setUserRank] = useState("Silver 1"); // Mock user rank

  useEffect(() => {
    if (!job) {
      navigate('/find-jobs'); // Redirect if no job data
    }
  }, [job, navigate]);

  if (!job) return null;

  const handleApplyJob = () => {
    setIsApplyModalOpen(true);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleModalClose = () => {
    setIsApplyModalOpen(false);
  };

  const handleModalSubmit = (formData) => {
    console.log('Application submitted:', formData);
    // Add backend submission logic here if needed
  };

  return (
    <div className="profile-page">
      <Headerz />
      <div className="profile-header">
        <div className="cover-photo">
          <img src={coverPhoto} alt="Cover" />
        </div>
        <div className="profile-photo-wrapper">
          <img src={profilePhoto} alt="Job Logo" className="profile-photo" />
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-left">
          <div className="profile-info">
            <h2>{job.title}</h2>
            <div className="status-container">
              <span className="status-dot"></span>
              <p className="status">Available Now</p>
            </div>
            <p className="location">{job.location}</p>
            <button className="edit-profile" onClick={handleApplyJob}>
              Apply Job
            </button>
          </div>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Salary</span>
              <span className="stat-number">{job.salary}</span>
            </div>
          </div>
          <p className="member-since">POSTED SINCE: {job.postedAt}</p>
          <p className="report">Report Job</p>
        </div>

        <div className="profile-right">
          <div className="tabs">
            {['OVERVIEW'].map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="tab-content">
            {activeTab === 'OVERVIEW' && (
              <div className="overview">
                <h4>About</h4>
                <p>{job.description}</p>
                <h4>Employment Type</h4>
                <p>{job.employmentType || 'Not specified'}</p>
                <h4>Skills Required</h4>
                <div className="skills-row">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="chip">{skill}</span>
                  ))}
                </div>
                <h4>Requirements</h4>
                <ul>
                  <li>Minimum Rank: {job.requirements.minRank}</li>
                </ul>
              </div>
            )}
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