import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaCheck, FaTimes as FaX, FaEnvelope, FaCalendar, FaFilePdf, FaDownload, FaFire } from 'react-icons/fa';
import axios from 'axios';
import { message } from 'antd';
import '../../../sass/components/profilesettings/jobapplicationsmodal.scss';
import '../../../sass/components/profilesettings/jobapplicationsmodal-additional.scss';

const JobApplicationsModal = ({ jobPostId, jobTitle, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [collarData, setCollarData] = useState({});
  const [ranksData, setRanksData] = useState({});

  useEffect(() => {
    fetchCollarData();
    fetchRanksData();
    fetchApplications();
  }, [jobPostId]);

  const fetchCollarData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/collars');
      const collars = response.data.collars || [];
      const collarMap = {};
      
      collars.forEach(collar => {
        collarMap[collar.id] = {
          id: collar.id,
          name: collar.name,
          image: collar.collar_img
        };
      });
      
      setCollarData(collarMap);
      console.log('Fetched collar data:', collarMap);
    } catch (error) {
      console.error('Error fetching collar data:', error);
    }
  };

  const fetchRanksData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/ranks');
      const ranks = response.data.ranks || [];
      const rankMap = {};
      
      ranks.forEach(rank => {
        rankMap[rank.id] = {
          id: rank.id,
          name: rank.name,
          image: rank.image
        };
      });
      
      setRanksData(rankMap);
      console.log('Fetched ranks data:', rankMap);
    } catch (error) {
      console.error('Error fetching ranks data:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/job-applications/job/${jobPostId}`);
      console.log('Applications API Response:', response.data);
      
      // Fetch detailed worker data for each application
      const applicationsWithWorkerData = await Promise.all(
        response.data.map(async (application) => {
          try {
            const workerResponse = await axios.get(`http://127.0.0.1:8000/api/workers/${application.worker_id}`);
            return {
              ...application,
              detailedWorker: workerResponse.data
            };
          } catch (workerError) {
            console.error(`Error fetching worker ${application.worker_id}:`, workerError);
            return application;
          }
        })
      );
      
      setApplications(applicationsWithWorkerData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatus = async (applicationId, status) => {
    try {
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      for_interview: { class: 'status-interview', text: 'For Interview' },
      accepted: { class: 'status-accepted', text: 'Hired' },
      declined: { class: 'status-declined', text: 'Declined' },
      fired: { class: 'status-fired', text: 'Fired' }
    };
    
    const config = statusConfig[status] || statusConfig.for_interview;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getWorkerName = (worker) => {
    const name = [worker.first_name, worker.middlename, worker.last_name]
      .filter(Boolean)
      .join(' ');
    return worker.suffix_name ? `${name} ${worker.suffix_name}` : name;
  };

  // Helper function to get rank based on experience using real ranks data
  const getRankByExperience = (experience) => {
    switch (experience) {
      case '0-11-months':
        return ranksData[2] || { name: 'Bronze', image: 'img/rank/chOmYCPss4v5FLPv4M309dB0qzCKIxG0WRThxD9i.jpg' };
      case '1-2-years':
        return ranksData[3] || { name: 'Silver', image: 'img/rank/pp1cpyZuiQcpUy44geQdA6GtN5DzvJBZu1Jra53H.png' };
      case '2-5-years':
        return ranksData[4] || { name: 'Gold', image: 'img/rank/aTxm30AVX6eA2bX8ICZLRskw66eg9pBgibzhutXO.jpg' };
      case '5-10-years':
        return ranksData[5] || { name: 'Diamond', image: 'img/rank/BT3ZPIEvlO4KYEsUpPhD6jVQyskw0tPknV43CoY1.jpg' };
      default:
        return ranksData[2] || { name: 'Bronze', image: 'img/rank/chOmYCPss4v5FLPv4M309dB0qzCKIxG0WRThxD9i.jpg' };
    }
  };

  // Helper function to map skill IDs to collar information
  const getCollarBySkillId = (skillId) => {
    const skillToCollarIdMap = {
      "1": 2, // Virtual Assistant - Pink Collars
      "2": 1, // WordPress Developer - Blue Collars
      "3": 1, // SEO - Blue Collars
      "4": 2, // Graphic Designer - Pink Collars
      "5": 1, // Social Media Marketer - Blue Collars
      "6": 2, // PHP Developer - Pink Collars
      "7": 1, // Real Estate VA - Blue Collars
      "8": 2, // Content Writer - Pink Collars
    };
    
    const collarId = skillToCollarIdMap[skillId];
    if (collarId && collarData[collarId]) {
      return collarData[collarId];
    }
    
    return null;
  };

  const getWorkerCollars = (application) => {
    const collars = [];
    const collarMap = {};
    
    // Get skills from application
    if (application.skills && Array.isArray(application.skills)) {
      application.skills.forEach(skillName => {
        // Map skill names to skill IDs (simplified mapping)
        const skillIdMap = {
          "Virtual Assistant": "1",
          "WordPress Developer": "2",
          "SEO": "3",
          "Graphic Designer": "4",
          "Social Media Marketer": "5",
          "PHP Developer": "6",
          "Real Estate Virtual Assistant": "7",
          "Content Writer": "8"
        };
        
        const skillId = skillIdMap[skillName];
        if (skillId) {
          const collarInfo = getCollarBySkillId(skillId);
          if (collarInfo && !collarMap[collarInfo.id]) {
            collarMap[collarInfo.id] = collarInfo;
            collars.push(collarInfo);
          }
        }
      });
    }
    
    // If no collars found, return default Blue Collars
    if (collars.length === 0) {
      return [{ 
        id: 1, 
        name: "Blue Collars", 
        image: "img/collar/aAuEXungkh3r08FEXqhWMSf9fYJNKEjQiMSc76iM.png" 
      }];
    }
    
    return collars;
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const downloadResume = (resumePath) => {
    if (resumePath) {
      // Since storage:link is configured, the path should be accessible via /storage/
      window.open(`http://127.0.0.1:8000/storage/${resumePath}`, '_blank');
    }
  };

  const handleViewProfile = (workerId) => {
    // Navigate to worker profile page
    // The Profile component will handle the 404 case if the user is not a worker
    // Allow viewing of any worker profile, including own profile
    window.open(`/profile/${workerId}`, '_blank');
  };

  return (
    <div className="job-applications-modal-overlay">
      <div className="job-applications-modal">
        <div className="modal-header">
          <h2>Employee Applications - {jobTitle}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
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
                <h4>Filter by Status:</h4>
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
                      <div className="worker-avatar">
                        <img 
                          src={application.detailedWorker?.profile?.profile_img 
                            ? `http://127.0.0.1:8000/storage/${application.detailedWorker.profile.profile_img}` 
                            : application.worker.profile_img 
                            ? `http://127.0.0.1:8000/storage/${application.worker.profile_img}` 
                            : "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg"
                          } 
                          alt={`${getWorkerName(application.worker)}'s avatar`}
                          className="profile-image"
                          onError={(e) => {
                            e.target.src = "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg";
                          }}
                        />
                      </div>
                      <div className="worker-details">
                        <div className="worker-name-with-collar">
                          <h4 className="worker-name">{getWorkerName(application.worker)}</h4>
                          <div className="collar-badges">
                            {getWorkerCollars(application).map((collar, index) => (
                              <div key={index} className="collar-badge" title={`${collar.name} Worker`}>
                                {collar.image ? (
                                  <img 
                                    src={`http://127.0.0.1:8000/storage/${collar.image}`} 
                                    alt={`${collar.name} Collar`}
                                    className="collar-icon"
                                  />
                                ) : (
                                  <div className="collar-icon-placeholder">
                                    {collar.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="application-date">
                          <FaCalendar /> Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="application-status">
                      <button 
                        className="view-profile-btn-top"
                        onClick={() => handleViewProfile(application.worker_id)}
                        title="View Profile"
                      >
                        <FaUser />
                      </button>
                      {getStatusBadge(application.status)}
                    </div>
                  </div>
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

                  {application.detailedWorker && (
                    <div className="worker-skills">
                      <h5>Skills:</h5>
                      <div className="skills-list">
                        {/* Display Primary Skills */}
                        {application.detailedWorker.worker?.skills_id?.primary_skills?.map((skill, index) => {
                          const skillRank = getRankByExperience(skill.experience);
                          return (
                            <div key={`primary-${index}`} className="skill-item-with-rank">
                              <div className="skill-rank-and-name">
                                <img 
                                  src={`http://127.0.0.1:8000/storage/${skillRank.image}`} 
                                  alt={`${skillRank.name} Rank`}
                                  className="skill-rank-icon-small"
                                />
                                <span className="skill-main-name">{skill.skill_name}</span>
                              </div>
                              {skill.sub_skills && skill.sub_skills.length > 0 && (
                                <div className="skill-sub-skills">
                                  - {skill.sub_skills.join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Display Additional Skills */}
                        {application.detailedWorker.worker?.skills_id?.additional_skills?.map((skill, index) => {
                          const skillRank = getRankByExperience(skill.experience);
                          return (
                            <div key={`additional-${index}`} className="skill-item-with-rank">
                              <div className="skill-rank-and-name">
                                <img 
                                  src={`http://127.0.0.1:8000/storage/${skillRank.image}`} 
                                  alt={`${skillRank.name} Rank`}
                                  className="skill-rank-icon-small"
                                />
                                <span className="skill-main-name">{skill.skill_name}</span>
                              </div>
                              {skill.sub_skills && skill.sub_skills.length > 0 && (
                                <div className="skill-sub-skills">
                                  - {skill.sub_skills.join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Fallback to application.skills if detailedWorker is not available */}
                        {!application.detailedWorker && application.skills && application.skills.length > 0 && (
                          <>
                            {application.skills.map((skill, index) => {
                              const skillRank = getRankByExperience('2-5-years'); // Default to Gold
                              
                              // Parse skill to separate main skill and sub-skills
                              const parseSkill = (skillString) => {
                                if (skillString.includes(' - ')) {
                                  const [mainSkill, ...subSkills] = skillString.split(' - ');
                                  return {
                                    main: mainSkill.trim(),
                                    sub: subSkills.join(' - ').trim()
                                  };
                                }
                                return {
                                  main: skillString.trim(),
                                  sub: null
                                };
                              };
                              
                              const parsedSkill = parseSkill(skill);
                              
                              return (
                                <div key={index} className="skill-item-with-rank">
                                  <div className="skill-rank-and-name">
                                    <img 
                                      src={`http://127.0.0.1:8000/storage/${skillRank.image}`} 
                                      alt={`${skillRank.name} Rank`}
                                      className="skill-rank-icon-small"
                                    />
                                    <span className="skill-main-name">{parsedSkill.main}</span>
                                  </div>
                                  {parsedSkill.sub && (
                                    <div className="skill-sub-skills">
                                      - {parsedSkill.sub}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {application.status === 'for_interview' && (
                    <div className="application-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => handleApplicationStatus(application.id, 'accepted')}
                      >
                        <FaCheck /> Hire
                      </button>
                      <button 
                        className="decline-btn"
                        onClick={() => handleApplicationStatus(application.id, 'declined')}
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
      </div>
    </div>
  );
};

export default JobApplicationsModal;
