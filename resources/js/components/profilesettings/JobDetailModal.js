import React, { useState, useEffect } from 'react';
import '../../../sass/components/profilesettings/jobdetailmodal.scss';

const JobDetailModal = ({ job, onClose }) => {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Get user profile from localStorage (same as modalpostjob.js)
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    setUserProfile(userData);
  }, []);

  if (!job) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatSalaryType = (type) => {
    return type === 'per_hour' ? 'Per Hour' : 'Per Month';
  };

  const formatJobType = (type) => {
    if (!type) return 'Not specified';
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('-');
  };

  const formatHiringType = (type) => {
    if (!type) return 'Individual';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-post-job view-only" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Job Post Details</h2>
          <button className="close-btn" onClick={onClose}>
            <span>&times;</span>
          </button>
        </div>

        {job.archived && (
          <div className="expired-banner">
            <span>⚠️ This job post has expired</span>
          </div>
        )}

        <div className="modal-form view-mode">
          <div className="form-columns">
            <div className="form-column">
              {/* Job Title */}
              <div className="form-group">
                <label>Job Title</label>
                <div className="read-only-field">
                  {job.job_title || `Job Post #${job.id}`}
                </div>
              </div>

              {/* Job Description */}
              <div className="form-group">
                <label>Job Description</label>
                <div className="read-only-field textarea-like">
                  {job.description}
                </div>
              </div>

              {/* Salary and Salary Type Row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Salary</label>
                  <div className="read-only-field">
                    ₱{job.salary ? job.salary.toLocaleString() : '0'}
                  </div>
                </div>
                <div className="form-group">
                  <label>Salary Type</label>
                  <div className="read-only-field">
                    {formatSalaryType(job.salary_type)}
                  </div>
                </div>
              </div>

              {/* Job Type and Hiring Type Row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Job Type</label>
                  <div className="read-only-field">
                    {formatJobType(job.job_type)}
                  </div>
                </div>
                <div className="form-group">
                  <label>Hiring Type</label>
                  <div className="read-only-field">
                    {formatHiringType(job.hiring_type)}
                  </div>
                </div>
              </div>

              {/* Application Dates Row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Application Start</label>
                  <div className="read-only-field">
                    {formatDateTime(job.application_start)}
                  </div>
                </div>
                <div className="form-group">
                  <label>Application Deadline</label>
                  <div className="read-only-field">
                    {formatDateTime(job.application_deadline)}
                  </div>
                </div>
              </div>

              {/* Skills Selection */}
              <div className="form-group">
                <label>Required Skills</label>
                {job.skills && job.skills.length > 0 ? (
                  <div className="selected-skills-preview">
                    <div className="skills-preview-title">
                      {job.skills.length} skill(s) required
                    </div>
                    {job.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill.name} ({skill.experience})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="read-only-field">
                    No specific skills required
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="contact-info">
                <h4>Contact Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <div className="read-only-field">
                      {userProfile?.email || 'N/A'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <div className="read-only-field">
                      {userProfile 
                        ? `${userProfile.first_name} ${userProfile.middlename || ''} ${userProfile.last_name} ${userProfile.suffix_name || ''}`.trim()
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Posted Date */}
              <div className="form-group">
                <label>Posted On</label>
                <div className="read-only-field">
                  {formatDateTime(job.created_at)}
                </div>
              </div>

              {/* Last Updated */}
              {job.updated_at && job.updated_at !== job.created_at && (
                <div className="form-group">
                  <label>Last Updated</label>
                  <div className="read-only-field">
                    {formatDateTime(job.updated_at)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;

