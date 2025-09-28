import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';
import '../../../sass/components/profilesettings/modalpostjob.scss';

const ModalPostJob = ({ onClose, onSubmit, editingJob = null }) => {
  const [formData, setFormData] = useState({
    jobTitle: editingJob?.job_title || '',
    jobDescription: editingJob?.description || '',
    salary: editingJob?.salary || '',
    salaryType: editingJob?.salary_type || 'per_hour',
    typeOfEmployment: editingJob?.job_type || 'full-time',
    applicationStart: editingJob?.application_start ? new Date(editingJob.application_start).toISOString().slice(0, 16) : '',
    applicationDeadline: editingJob?.application_deadline ? new Date(editingJob.application_deadline).toISOString().slice(0, 16) : '',
    skills: editingJob?.skills || [],
    skillExperiences: editingJob?.skill_experiences || {}
  });

  const [availableSkills, setAvailableSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    // Get user profile from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    setUserProfile(userData);
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const skillsResponse = await axios.get('http://127.0.0.1:8000/api/skills');

      if (skillsResponse.data) {
        setAvailableSkills(skillsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      message.error("Failed to load skills");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillChange = (skillId, isSelected) => {
    setFormData(prev => {
      let newSkills = [...prev.skills];

      if (isSelected) {
        // Add skill
        newSkills.push(skillId);
      } else {
        // Remove skill
        const skillIndex = newSkills.indexOf(skillId);
        if (skillIndex !== -1) {
          newSkills.splice(skillIndex, 1);
        }
      }

      return {
        ...prev,
        skills: newSkills
      };
    });
  };

  const handleExperienceLevelChange = (experienceLevel) => {
    setFormData(prev => ({
      ...prev,
      experienceLevel: experienceLevel
    }));
  };

  const openSkillsModal = () => {
    setSelectedSkills([...formData.skills]);
    setIsSkillsModalOpen(true);
  };

  const closeSkillsModal = () => {
    setIsSkillsModalOpen(false);
  };

  const handleSkillToggle = (skillId, skillName) => {
    setSelectedSkills(prev => {
      if (prev.some(skill => skill.id === skillId)) {
        return prev.filter(skill => skill.id !== skillId);
      } else {
        return [...prev, { id: skillId, name: skillName, experience: '0-11-months' }];
      }
    });
  };

  const handleSkillExperienceChange = (skillId, experience) => {
    setSelectedSkills(prev => 
      prev.map(skill => 
        skill.id === skillId 
          ? { ...skill, experience: experience }
          : skill
      )
    );
  };

  const confirmSkillsSelection = () => {
    const skillExperiences = {};
    selectedSkills.forEach(skill => {
      skillExperiences[skill.id] = skill.experience;
    });

    setFormData(prev => ({
      ...prev,
      skills: selectedSkills,
      skillExperiences: skillExperiences
    }));
    setIsSkillsModalOpen(false);
  };

  const getSkillName = (skillId) => {
    const skill = availableSkills.find(s => s.id === skillId);
    return skill ? skill.skill_name : 'Unknown Skill';
  };

  const getSkillById = (skillId) => {
    return availableSkills.find(s => s.id === skillId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.jobTitle.trim()) {
      message.error('Please fill in the job title');
      return;
    }

    if (!formData.jobDescription.trim()) {
      message.error('Please fill in the job description');
      return;
    }

    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      message.error('Please enter a valid salary amount');
      return;
    }

    if (!formData.applicationStart || !formData.applicationDeadline) {
      message.error('Please select application start and deadline dates');
      return;
    }

    if (new Date(formData.applicationDeadline) <= new Date(formData.applicationStart)) {
      message.error('Application deadline must be after the start date');
      return;
    }

    if (formData.skills.length === 0 || !formData.skills[0]) {
      message.error('Please select a skill');
      return;
    }

     // Validate that all selected skills have experience levels
    const skillsWithoutExperience = formData.skills.filter(skill => !skill.experience);
    if (skillsWithoutExperience.length > 0) {
      message.error('Please set experience level for all selected skills');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting job:', error);
      message.error('An error occurred while posting the job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Get available service types with sub-skills based on available skills
  const getAvailableServiceTypes = () => {
    if (!availableSkills || availableSkills.length === 0) return [];
    
    // Create a structure with main skills and their sub-skills
    const skillStructure = {};
    
    availableSkills.forEach(skill => {
      const mainSkill = skill.name;
      if (!skillStructure[mainSkill]) {
        skillStructure[mainSkill] = {
          main: mainSkill,
          subSkills: []
        };
      }
      
      // Add sub-skills if they exist
      if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
        skill.sub_skills.forEach(subSkill => {
          if (!skillStructure[mainSkill].subSkills.includes(subSkill)) {
            skillStructure[mainSkill].subSkills.push(subSkill);
          }
        });
      }
    });
    
    return Object.values(skillStructure);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-post-job">
        <div className="modal-header">
          <h2 className="modal-title">Post Job Information</h2>
          <button className="close-btn" onClick={handleClose}>
            <span>&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-columns">
            <div className="form-column">
              {/* Job Title */}
              <div className="form-group">
                <label htmlFor="jobTitle">Job Title *</label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  placeholder="Enter job title"
                  className="full-width-input"
                  required
                />
              </div>

              {/* Job Description */}
              <div className="form-group">
                <label htmlFor="jobDescription">Job Description *</label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Describe the job to be done"
                  rows="4"
                  required
                />
              </div>

              {/* Salary and Salary Type Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="salary">Salary *</label>
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="Enter salary amount"
                    min="0"
                    step="0.01"
                    className="small-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salaryType">Salary Type *</label>
                  <select
                    id="salaryType"
                    name="salaryType"
                    value={formData.salaryType}
                    onChange={handleInputChange}
                    className="small-input"
                    required
                  >
                    <option value="per_hour">Per Hour</option>
                    <option value="per_month">Per Month</option>
                  </select>
                </div>
              </div>

              {/* Job Type and Application Dates Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="typeOfEmployment">Job Type *</label>
                  <select
                    id="typeOfEmployment"
                    name="typeOfEmployment"
                    value={formData.typeOfEmployment}
                    onChange={handleInputChange}
                    className="small-input"
                    required
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="applicationStart">Application Start *</label>
                  <input
                    type="datetime-local"
                    id="applicationStart"
                    name="applicationStart"
                    value={formData.applicationStart}
                    onChange={handleInputChange}
                    className="small-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="applicationDeadline">Application Deadline *</label>
                <input
                  type="datetime-local"
                  id="applicationDeadline"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  min={formData.applicationStart}
                  className="full-width-input"
                  required
                />
              </div>

              {/* Skills Selection */}
              <div className="form-group">
                <label htmlFor="skills">Required Skills *</label>
                <div className="skills-selection-container">
                  <button
                    type="button"
                    onClick={openSkillsModal}
                    className="skills-select-button"
                  >
                    {formData.skills.length > 0 
                      ? `${formData.skills.length} skill(s) selected` 
                      : 'Select Skills'
                    }
                  </button>
                  {formData.skills.length > 0 && (
                    <div className="selected-skills-preview">
                      <div className="skills-preview-title">
                        Selected Skills ({formData.skills.length})
                      </div>
                      {formData.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill.name} ({skill.experience})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              {/* Contact Information */}
              <div className="contact-info">
                <h4>Contact Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="small-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      value={userProfile ? `${userProfile.first_name} ${userProfile.middlename || ''} ${userProfile.last_name} ${userProfile.suffix_name || ''}`.trim() : ''}
                      disabled
                      className="small-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="post-job-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Posting...' : (editingJob ? 'Update Job' : 'Post Job')}
            </button>
          </div>
        </form>
      </div>

      {/* Skills Selection Modal */}
      {isSkillsModalOpen && (
        <div className="adminmodal-overlay">
          <div className="adminmodal skills-modal">
            <div className="adminmodal-header">
              <h2>Select Required Skills</h2>
              <button 
                type="button" 
                className="close-button" 
                onClick={closeSkillsModal}
              >
                ×
              </button>
            </div>
            
            <div className="adminmodal-content">
              <div className="skills-grid">
                {getAvailableServiceTypes().map((skillGroup, index) => (
                  <div key={index} className="skill-category">
                    <h4 className="skill-category-title">{skillGroup.main}</h4>
                    <div className="skill-options">
                      {skillGroup.subSkills.length > 0 ? (
                        skillGroup.subSkills.map((subSkill, subIndex) => {
                          const skillId = `${skillGroup.main} - ${subSkill}`;
                          const isSelected = selectedSkills.some(skill => skill.id === skillId);
                          const selectedSkill = selectedSkills.find(skill => skill.id === skillId);
                          return (
                            <div key={`${index}-${subIndex}`} className="skill-option-with-experience">
                              <label className="skill-option">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSkillToggle(skillId, subSkill)}
                                />
                                <span className="skill-name">{subSkill}</span>
                              </label>
                              {isSelected && (
                                <div className="experience-selector">
                                  <label className="experience-label">Experience Required:</label>
                                  <select
                                    value={selectedSkill?.experience || '0-11-months'}
                                    onChange={(e) => handleSkillExperienceChange(skillId, e.target.value)}
                                    className="experience-dropdown"
                                  >
                                    <option value="0-11-months">0-11 months</option>
                                    <option value="1-2-years">1-2 years</option>
                                    <option value="2-5-years">2-5 years</option>
                                    <option value="5-10-years">5-10 years</option>
                                    <option value="10+ years">10+ years</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="skill-option-with-experience">
                          <label className="skill-option">
                            <input
                              type="checkbox"
                              checked={selectedSkills.some(skill => skill.id === skillGroup.main)}
                              onChange={() => handleSkillToggle(skillGroup.main, skillGroup.main)}
                            />
                            <span className="skill-name">{skillGroup.main}</span>
                          </label>
                          {selectedSkills.some(skill => skill.id === skillGroup.main) && (
                            <div className="experience-selector">
                              <label className="experience-label">Experience Required:</label>
                              <select
                                value={selectedSkills.find(skill => skill.id === skillGroup.main)?.experience || '0-11-months'}
                                onChange={(e) => handleSkillExperienceChange(skillGroup.main, e.target.value)}
                                className="experience-dropdown"
                              >
                                <option value="0-11-months">0-11 months</option>
                                <option value="1-2-years">1-2 years</option>
                                <option value="2-5-years">2-5 years</option>
                                <option value="5-10-years">5-10 years</option>
                                <option value="10+ years">10+ years</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedSkills.length > 0 && (
                <div className="selected-skills-summary">
                  <h4>Selected Skills ({selectedSkills.length}):</h4>
                  <div className="selected-skills-list">
                    {selectedSkills.map((skill, index) => (
                      <div key={index} className="skill-with-experience">
                        <span className="skill-tag">
                          {skill.name}
                        </span>
                        <span className="experience-tag">
                          {skill.experience}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="adminmodal-buttons">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={closeSkillsModal}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="submit-button" 
                onClick={confirmSkillsSelection}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalPostJob;