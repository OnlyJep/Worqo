import React, { useState, useEffect, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [jobTitleOptions, setJobTitleOptions] = useState([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const [isSubSkillsDropdownOpen, setIsSubSkillsDropdownOpen] = useState(false);
  const [isExperienceDropdownOpen, setIsExperienceDropdownOpen] = useState({});
  const [availableSubSkills, setAvailableSubSkills] = useState([]);
  const [selectedSubSkills, setSelectedSubSkills] = useState([]);
  const skillsDropdownRef = useRef(null);
  const subSkillsDropdownRef = useRef(null);
  const experienceDropdownRefs = useRef({});

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(event.target)) {
        setIsSkillsDropdownOpen(false);
      }
      if (subSkillsDropdownRef.current && !subSkillsDropdownRef.current.contains(event.target)) {
        setIsSubSkillsDropdownOpen(false);
      }
      // Close all experience dropdowns
      Object.keys(experienceDropdownRefs.current).forEach(key => {
        const ref = experienceDropdownRefs.current[key];
        if (ref && !ref.contains(event.target)) {
          setIsExperienceDropdownOpen(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      setSelectedSkills(editingJob.skills || []);
      
      // Set selected job title and sub-skills for editing
      if (editingJob.job_title) {
        setSelectedJobTitle(editingJob.job_title);
        // Find the skill that matches the job title and set its sub-skills
        const matchingSkill = availableSkills.find(skill => skill.name === editingJob.job_title);
        if (matchingSkill && matchingSkill.sub_skills) {
          const subSkillsOptions = matchingSkill.sub_skills.map(subSkill => ({
            value: subSkill,
            label: subSkill
          }));
          setAvailableSubSkills(subSkillsOptions);
        }
      }
      
      // Set selected sub-skills from the job's skills
      if (editingJob.skills && editingJob.skills.length > 0) {
        const subSkillsFromJob = editingJob.skills.map(skill => skill.name);
        setSelectedSubSkills(subSkillsFromJob);
        console.log("Loading editing job skills:", editingJob.skills);
        console.log("Selected sub-skills:", subSkillsFromJob);
      }
    }
  }, [editingJob, availableSkills]);

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
      if (res.data) {
        setAvailableSkills(res.data);
        // Extract unique skill names for job title options
        const uniqueSkillNames = [...new Set(res.data.map(skill => skill.name))];
        const jobTitleOptions = uniqueSkillNames.map(skillName => ({
          value: skillName,
          label: skillName
        }));
        setJobTitleOptions(jobTitleOptions);
      }
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
      // Prepare skills data with sub-skills and experience levels
      const skillsData = selectedSubSkills.map(subSkill => ({
        name: subSkill,
        experience: formData.skillExperiences[subSkill] || "0-11-months"
      }));

      const jobData = {
        ...formData,
        skills: skillsData,
        skillExperiences: formData.skillExperiences
      };

      console.log("Submitting job data:", jobData);
      console.log("Selected sub-skills:", selectedSubSkills);
      console.log("Skills data:", skillsData);

      await onSubmit(jobData);
    } catch (err) {
      console.error(err);
      message.error("An error occurred while posting the job.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => onClose();

  const handleJobTitleChange = (value) => {
    setSelectedJobTitle(value);
    setFormData((prev) => ({ ...prev, jobTitle: value }));
    
    // Filter sub-skills based on selected job title
    const selectedSkill = availableSkills.find(skill => skill.name === value);
    if (selectedSkill && selectedSkill.sub_skills) {
      const subSkillsOptions = selectedSkill.sub_skills.map(subSkill => ({
        value: subSkill,
        label: subSkill
      }));
      setAvailableSubSkills(subSkillsOptions);
    } else {
      setAvailableSubSkills([]);
    }
    
    // Reset selected sub-skills and skills when job title changes
    setSelectedSubSkills([]);
    setFormData((prev) => ({ ...prev, skills: [], skillExperiences: {} }));
  };

  const toggleSubSkillsDropdown = () => {
    setIsSubSkillsDropdownOpen(!isSubSkillsDropdownOpen);
  };

  const toggleExperienceDropdown = (subSkill) => {
    setIsExperienceDropdownOpen(prev => ({
      ...prev,
      [subSkill]: !prev[subSkill]
    }));
  };

  const handleSubSkillToggle = (subSkill) => {
    setSelectedSubSkills((prev) => {
      if (prev.includes(subSkill)) {
        return prev.filter(skill => skill !== subSkill);
      } else {
        return [...prev, subSkill];
      }
    });
  };

  const handleExperienceChange = (subSkill, experience) => {
    setFormData((prev) => ({
      ...prev,
      skillExperiences: {
        ...prev.skillExperiences,
        [subSkill]: experience
      }
    }));
    // Close the dropdown after selection
    setIsExperienceDropdownOpen(prev => ({
      ...prev,
      [subSkill]: false
    }));
  };


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
                <CustomDropdown
                  options={jobTitleOptions}
                  value={formData.jobTitle}
                  onChange={handleJobTitleChange}
                  placeholder="Select job title"
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

              {/* Sub-Skills */}
              {selectedJobTitle && (
                <div className="form-group">
                  <label>Desired Sub-Skills</label>
                  <div className="ant-select-selection-overflow sub-skills-multi-select">
                    <div 
                      className="ant-select-selection-overflow-item"
                      onClick={toggleSubSkillsDropdown}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSubSkillsDropdown();
                        } else if (e.key === 'Escape') {
                          setIsSubSkillsDropdownOpen(false);
                        }
                      }}
                    >
                      <span className="ant-select-selection-item">
                        {selectedSubSkills.length > 0
                          ? `${selectedSubSkills.length} sub-skill(s) selected`
                          : "Select Sub-Skills"}
                      </span>
                      <span className={`ant-select-arrow ${isSubSkillsDropdownOpen ? 'open' : ''}`}>
                        ▼
                      </span>
                    </div>
                    {isSubSkillsDropdownOpen && (
                      <div className="ant-select-dropdown sub-skills-dropdown">
                        {availableSubSkills.map((subSkill, index) => (
                          <div key={index} className="ant-select-item">
                            <label className="sub-skill-option">
                              <input
                                type="checkbox"
                                checked={selectedSubSkills.includes(subSkill.value)}
                                onChange={() => handleSubSkillToggle(subSkill.value)}
                              />
                              <span>{subSkill.label}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Experience Levels for Selected Sub-Skills */}
              {selectedSubSkills.length > 0 && (
                <div className="form-group">
                  <label>Experience Levels</label>
                  <div className="experience-levels-container">
                    {selectedSubSkills.map((subSkill, index) => (
                      <div key={index} className="experience-level-item">
                        <div className="sub-skill-name">{subSkill}</div>
                        <div 
                          className="ant-select-selection-overflow experience-dropdown" 
                          ref={(el) => {
                            if (el) {
                              experienceDropdownRefs.current[subSkill] = el;
                            }
                          }}
                        >
                          <div 
                            className="ant-select-selection-overflow-item"
                            onClick={() => toggleExperienceDropdown(subSkill)}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleExperienceDropdown(subSkill);
                              } else if (e.key === 'Escape') {
                                setIsExperienceDropdownOpen(prev => ({ ...prev, [subSkill]: false }));
                              }
                            }}
                          >
                            <span className="ant-select-selection-item">
                              {formData.skillExperiences[subSkill] || "Select Experience"}
                            </span>
                            <span className={`ant-select-arrow ${isExperienceDropdownOpen[subSkill] ? 'open' : ''}`}>
                              ▼
                            </span>
                          </div>
                          {isExperienceDropdownOpen[subSkill] && (
                            <div className="ant-select-dropdown">
                              {experienceOptions.map((option, optIndex) => (
                                <div 
                                  key={optIndex} 
                                  className="ant-select-item"
                                  onClick={() => handleExperienceChange(subSkill, option.value)}
                                >
                                  {option.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Skills Preview */}
              {selectedSubSkills.length > 0 && (
                <div className="selected-skills-preview">
                  <h4>Selected Skills:</h4>
                  {selectedSubSkills.map((subSkill, index) => (
                    <div key={index} className="skill-with-experience">
                      <span className="skill-tag">{subSkill}</span>
                      {formData.skillExperiences[subSkill] && (
                        <span className="experience-tag">
                          {experienceOptions.find(opt => opt.value === formData.skillExperiences[subSkill])?.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

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

    </div>
  );
};

export default ModalPostJob;
