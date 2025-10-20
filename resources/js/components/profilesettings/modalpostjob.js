import React, { useState, useEffect } from "react";
import axios from "axios";
import { message } from "antd";
import CustomDropdown from '../common/CustomDropdown';
import '../../../sass/components/profilesettings/modalpostjob.scss';
import '../../../sass/components/common/CustomDropdown.scss';

const ModalPostJob = ({ onSubmit, onClose, editingJob }) => {
  const [formData, setFormData] = useState({
    jobTitle: editingJob?.job_title || "",
    jobDescription: editingJob?.description || "",
    salary: editingJob?.salary || "",
    salaryType: editingJob?.salary_type || "hourly",
    typeOfEmployment: editingJob?.job_type || "full-time",
    hiringType: editingJob?.hiring_type || "individual",
    teamSize: editingJob?.team_size || (editingJob?.hiring_type === 'team' ? 2 : 1),
    workStart: editingJob?.work_start ? new Date(editingJob.work_start).toISOString().slice(0, 16) : "",
    workEnd: editingJob?.work_end ? new Date(editingJob.work_end).toISOString().slice(0, 16) : "",
    applicationStart: editingJob?.application_start ? new Date(editingJob.application_start).toISOString().slice(0, 16) : "",
    applicationDeadline: editingJob?.application_deadline ? new Date(editingJob.application_deadline).toISOString().slice(0, 16) : "",
    skills: editingJob?.skills || [],
    skillExperiences: editingJob?.skill_experiences || {}
  });

  const [userProfile, setUserProfile] = useState(null);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const salaryTypeOptions = [
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "project", label: "Per Project" },
  ];

  const jobTypeOptions = [
    { value: "full-time", label: "Full Time" },
    { value: "part-time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
  ];

  const hiringTypeOptions = [
    { value: "individual", label: "Individual" },
    { value: "team", label: "Team" },
  ];

  const experienceOptions = [
    { value: "0-11-months", label: "0–11 months" },
    { value: "1-2-years", label: "1–2 years" },
    { value: "3-5-years", label: "3–5 years" },
    { value: "6-9-years", label: "6–9 years" },
    { value: "10+-years", label: "10+ years" },
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUserProfile(userData);
    fetchSkills();
  }, []);

  useEffect(() => {
    if (editingJob) {
      setFormData({
        jobTitle: editingJob.job_title || "",
        jobDescription: editingJob.description || "",
        salary: editingJob.salary || "",
        salaryType: editingJob.salary_type || "hourly",
        typeOfEmployment: editingJob.job_type || "full-time",
        hiringType: editingJob.hiring_type || "individual",
        teamSize: editingJob.team_size || (editingJob.hiring_type === 'team' ? 2 : 1),
        workStart: editingJob.work_start ? new Date(editingJob.work_start).toISOString().slice(0, 16) : "",
        workEnd: editingJob.work_end ? new Date(editingJob.work_end).toISOString().slice(0, 16) : "",
        applicationStart: editingJob.application_start ? new Date(editingJob.application_start).toISOString().slice(0, 16) : "",
        applicationDeadline: editingJob.application_deadline ? new Date(editingJob.application_deadline).toISOString().slice(0, 16) : "",
        skills: editingJob.skills || [],
        skillExperiences: editingJob.skill_experiences || {}
      });
    }
  }, [editingJob]);

  useEffect(() => {
    if (formData.hiringType === "team" && formData.teamSize < 2) {
      setFormData((prev) => ({
        ...prev,
        teamSize: 2,
      }));
    } else if (formData.hiringType === "individual") {
      setFormData((prev) => ({
        ...prev,
        teamSize: 1,
      }));
    }
  }, [formData.hiringType]);

  const fetchSkills = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/skills");
      if (res.data) setAvailableSkills(res.data);
    } catch (error) {
      console.error("Error fetching skills:", error);
      message.error("Failed to load skills");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "teamSize") {
      const numValue = parseInt(value);
      const validTeamSize = numValue >= 2 && numValue <= 50 ? numValue : 2;
      setFormData((prev) => ({ ...prev, [name]: validTeamSize }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openSkillsModal = () => {
    setSelectedSkills([...formData.skills]);
    setIsSkillsModalOpen(true);
  };

  const closeSkillsModal = () => {
    setIsSkillsModalOpen(false);
  };

  const handleSkillToggle = (skillId, skillName) => {
    setSelectedSkills((prev) => {
      if (prev.some((skill) => skill.id === skillId)) {
        return prev.filter((skill) => skill.id !== skillId);
      } else {
        return [...prev, { id: skillId, name: skillName, experience: "0-11-months" }];
      }
    });
  };

  const handleSkillExperienceChange = (skillId, experience) => {
    setSelectedSkills((prev) =>
      prev.map((skill) =>
        skill.id === skillId ? { ...skill, experience: experience } : skill
      )
    );
  };

  const confirmSkillsSelection = () => {
    const skillExperiences = {};
    selectedSkills.forEach((skill) => {
      skillExperiences[skill.id] = skill.experience;
    });

    setFormData((prev) => ({
      ...prev,
      skills: selectedSkills,
      skillExperiences,
    }));
    setIsSkillsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.jobTitle.trim()) return message.error("Please fill in the job title");
    if (!formData.jobDescription.trim()) return message.error("Please fill in the job description");
    if (!formData.salary || parseFloat(formData.salary) <= 0)
      return message.error("Please enter a valid salary");
    if (!formData.applicationStart || !formData.applicationDeadline)
      return message.error("Please select application start and deadline dates");
    if (new Date(formData.applicationDeadline) <= new Date(formData.applicationStart))
      return message.error("Deadline must be after the start date");
    if (!formData.workStart || !formData.workEnd)
      return message.error("Please select work start and end dates");
    if (new Date(formData.workEnd) <= new Date(formData.workStart))
      return message.error("Work end date must be after work start date");

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
      message.error("An error occurred while posting the job.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => onClose();

  const getAvailableServiceTypes = () => {
    if (!availableSkills || availableSkills.length === 0) return [];
    const skillStructure = {};
    availableSkills.forEach((skill) => {
      const mainSkill = skill.name;
      if (!skillStructure[mainSkill]) {
        skillStructure[mainSkill] = { main: mainSkill, subSkills: [] };
      }
      if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
        skill.sub_skills.forEach((sub) => {
          if (!skillStructure[mainSkill].subSkills.includes(sub)) {
            skillStructure[mainSkill].subSkills.push(sub);
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
                <label htmlFor="jobTitle">Job Title</label>
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
                <label htmlFor="jobDescription">Job Description</label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Describe the job"
                  rows="4"
                  required
                />
              </div>

              {/* Salary + Type */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="salary">Salary</label>
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
                  <label htmlFor="salaryType">Salary Type</label>
                  <CustomDropdown
                    options={salaryTypeOptions}
                    value={formData.salaryType}
                    onChange={(val) => setFormData((prev) => ({ ...prev, salaryType: val }))}
                    placeholder="Select salary type"
                    className="small-input"
                    required
                  />
                </div>
              </div>

              {/* Job + Hiring Type */}
              <div className="form-row">
                <div className="form-group">
                  <label>Job Type</label>
                  <CustomDropdown
                    options={jobTypeOptions}
                    value={formData.typeOfEmployment}
                    onChange={(val) => setFormData((prev) => ({ ...prev, typeOfEmployment: val }))}
                    placeholder="Select job type"
                    className="small-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hiring Type</label>
                  <CustomDropdown
                    options={hiringTypeOptions}
                    value={formData.hiringType}
                    onChange={(val) => setFormData((prev) => ({ ...prev, hiringType: val }))}
                    placeholder="Select hiring type"
                    className="small-input"
                    required
                  />
                </div>
              </div>

              {/* Team Size */}
              {formData.hiringType === "team" && (
                <div className="form-group">
                  <label htmlFor="teamSize">Number of Team Members Needed</label>
                  <input
                    type="number"
                    id="teamSize"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    min="2"
                    max="50"
                    className="small-input"
                    required
                  />
                </div>
              )}

               {/* Work Period */}
               <div className="form-row">
                 <div className="form-group">
                   <label htmlFor="workStart">Work Start Date</label>
                   <input
                     type="datetime-local"
                     id="workStart"
                     name="workStart"
                     value={formData.workStart}
                     onChange={handleInputChange}
                     className="small-input"
                     min={new Date().toISOString().slice(0, 16)}
                     required
                   />
                 </div>
                 <div className="form-group">
                   <label htmlFor="workEnd">Work End Date</label>
                   <input
                     type="datetime-local"
                     id="workEnd"
                     name="workEnd"
                     value={formData.workEnd}
                     onChange={handleInputChange}
                     className="small-input"
                     min={formData.workStart || new Date().toISOString().slice(0, 16)}
                     required
                   />
                 </div>
               </div>

              {/* Application Period */}
              <div className="form-row">
                <div className="form-group">
                  <label>Application Start</label>
                  <input
                    type="datetime-local"
                    name="applicationStart"
                    value={formData.applicationStart}
                    onChange={handleInputChange}
                    className="small-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Application Deadline</label>
                  <input
                    type="datetime-local"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleInputChange}
                    min={formData.applicationStart}
                    className="small-input"
                    required
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="form-group">
                <label>Desired Skills</label>
                <div className="skills-selection-container">
                  <button
                    type="button"
                    onClick={openSkillsModal}
                    className="skills-select-button"
                  >
                    {formData.skills.length > 0
                      ? `${formData.skills.length} skill(s) selected`
                      : "Select Skills"}
                  </button>
                  {formData.skills.length > 0 && (
                    <div className="selected-skills-preview">
                      {formData.skills.map((skill, i) => (
                        <span key={i} className="skill-tag">
                          {skill.name} ({skill.experience})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="contact-info">
                <h4>Contact Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={userProfile?.email || ""}
                      disabled
                      className="small-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      value={
                        userProfile
                          ? `${userProfile.first_name || ""} ${userProfile.middlename || ""} ${userProfile.last_name || ""} ${userProfile.suffix_name || ""}`.trim()
                          : ""
                      }
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
            <button type="submit" className="post-job-btn" disabled={isLoading}>
              {isLoading ? "Posting..." : editingJob ? "Update Job" : "Post Job"}
            </button>
          </div>
        </form>
      </div>

      {/* Skills Modal */}
      {isSkillsModalOpen && (
        <div className="adminmodal-overlay">
          <div className="adminmodal skills-modal">
            <div className="adminmodal-header">
              <h2>Select Required Skills</h2>
              <button type="button" className="close-button" onClick={closeSkillsModal}>
                ×
              </button>
            </div>
            <div className="adminmodal-content">
              <div className="skills-grid">
                {getAvailableServiceTypes().map((group, i) => (
                  <div key={i} className="skill-category">
                    <h4>{group.main}</h4>
                    <div className="skill-options">
                      {group.subSkills.length > 0
                        ? group.subSkills.map((sub, j) => {
                            const skillId = `${group.main} - ${sub}`;
                            const isSelected = selectedSkills.some(
                              (s) => s.id === skillId
                            );
                            const selectedSkill = selectedSkills.find(
                              (s) => s.id === skillId
                            );
                            return (
                              <div key={`${i}-${j}`} className="skill-option-with-experience">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSkillToggle(skillId, sub)}
                                  />
                                  <span>{sub}</span>
                                </label>
                                {isSelected && (
                                  <div className="experience-selector">
                                    <CustomDropdown
                                      options={experienceOptions}
                                      value={selectedSkill?.experience || "0-11-months"}
                                      onChange={(val) =>
                                        handleSkillExperienceChange(skillId, val)
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="adminmodal-buttons">
              <button type="button" onClick={closeSkillsModal}>
                Cancel
              </button>
              <button type="button" onClick={confirmSkillsSelection}>
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
