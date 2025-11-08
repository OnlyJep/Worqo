import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { message } from "antd";
import CustomDropdown from '../common/CustomDropdown';
import { convertToPhilippinesTime, getCurrentPhilippinesTime } from '../../utils/dateUtils';
import '../../../sass/components/profilesettings/modalpostjob.scss';
import '../../../sass/components/common/CustomDropdown.scss';

const ModalPostJob = ({ onSubmit, onClose, editingJob }) => {
  // Helper function to map backend salary type to frontend
  const getFrontendSalaryType = (backendType) => {
    if (!backendType) return '';
    const salaryTypeMap = {
      'per_hour': 'per_hour', // Keep per_hour as is for direct selection
      'per_month': 'monthly'
    };
    // Normalize the backend type (handle case sensitivity)
    const normalizedType = String(backendType).toLowerCase().trim();
    
    // If it's per_hour, return per_hour (for direct selection)
    if (normalizedType === 'per_hour') {
      return 'per_hour';
    }
    
    // Otherwise use the mapping
    return salaryTypeMap[normalizedType] || normalizedType; // Return the original if not in map
  };

  // Helper function to map backend job type to frontend
  const getFrontendJobType = (backendType) => {
    if (!backendType) return '';
    const jobTypeMap = {
      'per_day': 'per_day',
      'per_job': 'per_job',
      // Legacy mappings for backward compatibility
      'full-time': 'per_day', // Map old full-time to per_day
      'part-time': 'per_day', // Map old part-time to per_day
      'contract': 'per_job', // Map old contract to per_job
      'freelance': 'per_job' // Map old freelance to per_job
    };
    // Normalize the backend type (handle case sensitivity)
    const normalizedType = String(backendType).toLowerCase().trim();
    
    return jobTypeMap[normalizedType] || normalizedType;
  };

  const [formData, setFormData] = useState({
    jobTitle: editingJob?.job_title || "",
    jobDescription: editingJob?.description || "",
    salary: editingJob?.salary ? String(editingJob.salary) : "",
    salaryType: editingJob?.salary_type ? getFrontendSalaryType(editingJob.salary_type) : "",
    typeOfEmployment: editingJob?.job_type ? getFrontendJobType(editingJob.job_type) : "",
    hiringType: editingJob?.hiring_type || "",
    teamSize: editingJob?.team_size || "",
    workStart: editingJob?.work_start ? convertToPhilippinesTime(editingJob.work_start) : "",
    workEnd: editingJob?.work_end ? convertToPhilippinesTime(editingJob.work_end) : "",
    applicationStart: editingJob?.application_start ? convertToPhilippinesTime(editingJob.application_start) : "",
    applicationDeadline: editingJob?.application_deadline ? convertToPhilippinesTime(editingJob.application_deadline) : "",
    skills: editingJob?.skills || [],
    skillExperiences: editingJob?.skill_experiences || {}
  });

  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobTitleOptions, setJobTitleOptions] = useState([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState(() => {
    // Initialize with job title from editingJob if available
    // Will be properly set in useEffect after availableSkills loads
    return editingJob?.job_title || "";
  });
  const [isJobTitleOthers, setIsJobTitleOthers] = useState(() => {
    // Will be determined in useEffect after availableSkills loads
    return false;
  });
  const [customJobTitle, setCustomJobTitle] = useState(() => {
    // Initialize with custom job title from editingJob if available
    return editingJob?.job_title || "";
  });
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const [isSubSkillsDropdownOpen, setIsSubSkillsDropdownOpen] = useState(false);
  const [isSubSkillOthers, setIsSubSkillOthers] = useState(false);
  const [customSubSkill, setCustomSubSkill] = useState("");
  const [subSkillSearchTerm, setSubSkillSearchTerm] = useState("");
  const [isExperienceDropdownOpen, setIsExperienceDropdownOpen] = useState({});
  const [availableSubSkills, setAvailableSubSkills] = useState([]);
  const [selectedSubSkills, setSelectedSubSkills] = useState(() => {
    // Initialize with skills from editingJob if available
    if (editingJob?.skills && Array.isArray(editingJob.skills)) {
      return editingJob.skills
        .filter(skill => skill && skill.name)
        .map(skill => skill.name);
    }
    return [];
  });
  const [subSkillsInputValue, setSubSkillsInputValue] = useState(() => {
    // Initialize with skills from editingJob if available
    if (editingJob?.skills && Array.isArray(editingJob.skills)) {
      const subSkills = editingJob.skills
        .filter(skill => skill && skill.name)
        .map(skill => skill.name);
      return subSkills.join(', ');
    }
    return "";
  });
  const skillsDropdownRef = useRef(null);
  const subSkillsDropdownRef = useRef(null);
  const experienceDropdownRefs = useRef({});
  const isMountedRef = useRef(true);

  const salaryTypeOptions = [
    { value: "hourly", label: "Hourly" },
    { value: "per_hour", label: "Per Hour" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "project", label: "Per Project" },
  ];

  const jobTypeOptions = [
    { value: "per_day", label: "Per Day" },
    { value: "per_job", label: "Per Job" },
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
    setUserRole(Number(userData.role_id));
    fetchSkills();
    
    // Cleanup: mark component as unmounted
    return () => {
      isMountedRef.current = false;
    };
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
    if (editingJob && availableSkills.length > 0) {
      // Map backend salary_type to frontend format
      const salaryTypeMap = {
        'per_hour': 'per_hour', // Keep per_hour as is for direct selection
        'per_month': 'monthly'
      };
      
      // Debug: Log the editing job data
      console.log("=== EDITING JOB DATA ===");
      console.log("Full editingJob:", editingJob);
      console.log("salary from API:", editingJob.salary, "| type:", typeof editingJob.salary);
      console.log("salary_type from API:", editingJob.salary_type, "| type:", typeof editingJob.salary_type);
      
      // Map backend salary_type to frontend format
      let frontendSalaryType = '';
      if (editingJob.salary_type) {
        // Normalize the salary_type value (handle case sensitivity)
        const normalizedSalaryType = String(editingJob.salary_type).toLowerCase().trim();
        
        // If it's per_hour, use per_hour directly (no mapping needed)
        if (normalizedSalaryType === 'per_hour') {
          frontendSalaryType = 'per_hour';
        } else {
          // Otherwise use the mapping
          frontendSalaryType = salaryTypeMap[normalizedSalaryType] || '';
          
          // If mapping failed, try to find it in the options
          if (!frontendSalaryType) {
            const foundOption = salaryTypeOptions.find(opt => 
              opt.value.toLowerCase() === normalizedSalaryType || 
              opt.label.toLowerCase() === normalizedSalaryType
            );
            frontendSalaryType = foundOption ? foundOption.value : normalizedSalaryType;
          }
        }
      }
      
      // Debug: Log salary type mapping
      console.log("Salary Type Mapping - Backend:", editingJob.salary_type, "→ Frontend:", frontendSalaryType);
      console.log("=========================");
      
      // Extract skill experiences from job data
      const skillExperiences = {};
      if (editingJob.skills && Array.isArray(editingJob.skills)) {
        editingJob.skills.forEach(skill => {
          if (skill.name && skill.experience) {
            skillExperiences[skill.name] = skill.experience;
          }
        });
      }
      // Also merge with skill_experiences if it exists
      if (editingJob.skill_experiences && typeof editingJob.skill_experiences === 'object') {
        Object.assign(skillExperiences, editingJob.skill_experiences);
      }
      
      // Convert salary to string for input field (handle number or decimal)
      const salaryValue = editingJob.salary != null ? String(editingJob.salary) : "";
      
      console.log("Setting salary value:", salaryValue, "| Original:", editingJob.salary, "| Type:", typeof editingJob.salary);
      
      setFormData((prev) => ({
        ...prev,
        jobTitle: editingJob.job_title || "",
        jobDescription: editingJob.description || "",
        salary: salaryValue,
        salaryType: frontendSalaryType || prev.salaryType,
        typeOfEmployment: editingJob.job_type ? getFrontendJobType(editingJob.job_type) : "",
        hiringType: editingJob.hiring_type || "",
        teamSize: editingJob.team_size || (editingJob.hiring_type === 'team' ? 2 : 1),
        workStart: editingJob.work_start ? convertToPhilippinesTime(editingJob.work_start) : "",
        workEnd: editingJob.work_end ? convertToPhilippinesTime(editingJob.work_end) : "",
        applicationStart: editingJob.application_start ? convertToPhilippinesTime(editingJob.application_start) : "",
        applicationDeadline: editingJob.application_deadline ? convertToPhilippinesTime(editingJob.application_deadline) : "",
        skills: editingJob.skills || [],
        skillExperiences: skillExperiences
      }));
      setSelectedSkills(editingJob.skills || []);
      
      // Set selected job title and determine if it's custom
      if (editingJob.job_title) {
        const matchingSkill = availableSkills.find(skill => skill.name === editingJob.job_title);
        if (matchingSkill) {
          // Job title exists in available skills
          setSelectedJobTitle(editingJob.job_title);
          setIsJobTitleOthers(false);
          setCustomJobTitle('');
          
          // Set sub-skills for this job title
          if (matchingSkill.sub_skills && matchingSkill.sub_skills.length > 0) {
            const subSkillsOptions = matchingSkill.sub_skills.map(subSkill => ({
              value: subSkill,
              label: subSkill
            }));
            // Add "Others" option to sub-skills
            subSkillsOptions.push({ value: 'Others', label: 'Others' });
            setAvailableSubSkills(subSkillsOptions);
          } else {
            setAvailableSubSkills([{ value: 'Others', label: 'Others' }]);
          }
        } else {
          // Job title is custom (not in available skills)
          setSelectedJobTitle('Others');
          setIsJobTitleOthers(true);
          setCustomJobTitle(editingJob.job_title);
          setAvailableSubSkills([{ value: 'Others', label: 'Others' }]);
          setIsSubSkillOthers(true);
        }
      }
      
      // Set selected sub-skills from the job's skills
      let subSkillsFromJob = [];
      if (editingJob.skills && editingJob.skills.length > 0) {
        subSkillsFromJob = editingJob.skills
          .filter(skill => skill && skill.name)
          .map(skill => skill.name);
        setSelectedSubSkills(subSkillsFromJob);
        // Set the input value to display comma-separated sub-skills
        setSubSkillsInputValue(subSkillsFromJob.join(', '));
        console.log("Loading editing job skills:", editingJob.skills);
        console.log("Selected sub-skills:", subSkillsFromJob);
        console.log("Skill experiences:", skillExperiences);
      }
      
      // Log all form data for debugging
      const isCustomTitle = !availableSkills.find(skill => skill.name === editingJob.job_title);
      console.log("=== EDITING JOB - ALL FORM DATA ===");
      console.log("Job Title:", editingJob.job_title, "| Is Custom:", isCustomTitle);
      console.log("Job Description:", editingJob.description);
      console.log("Salary:", editingJob.salary, "| Salary Type (Backend):", editingJob.salary_type, "| Frontend:", frontendSalaryType);
      console.log("Job Type:", editingJob.job_type);
      console.log("Hiring Type:", editingJob.hiring_type);
      console.log("Team Size:", editingJob.team_size);
      console.log("Application Start:", formData.applicationStart);
      console.log("Application Deadline:", formData.applicationDeadline);
      console.log("Work Start:", formData.workStart);
      console.log("Work End:", formData.workEnd);
      console.log("Sub-Skills:", subSkillsFromJob);
      console.log("Experience Levels:", skillExperiences);
      console.log("===================================");
    } else if (editingJob && availableSkills.length === 0) {
      // If editingJob exists but skills haven't loaded yet, set basic form data
      const salaryTypeMap = {
        'per_hour': 'per_hour', // Keep per_hour as is for direct selection
        'per_month': 'monthly'
      };
      
      // Debug: Log the editing job data (early load)
      console.log("=== EDITING JOB DATA (EARLY LOAD) ===");
      console.log("Full editingJob:", editingJob);
      console.log("salary_type from API:", editingJob.salary_type);
      console.log("salary_type type:", typeof editingJob.salary_type);
      
      // Map backend salary_type to frontend format
      let frontendSalaryType = '';
      if (editingJob.salary_type) {
        // Normalize the salary_type value (handle case sensitivity)
        const normalizedSalaryType = String(editingJob.salary_type).toLowerCase().trim();
        
        // If it's per_hour, use per_hour directly (no mapping needed)
        if (normalizedSalaryType === 'per_hour') {
          frontendSalaryType = 'per_hour';
        } else {
          // Otherwise use the mapping
          frontendSalaryType = salaryTypeMap[normalizedSalaryType] || '';
          
          // If mapping failed, try to find it in the options
          if (!frontendSalaryType) {
            const foundOption = salaryTypeOptions.find(opt => 
              opt.value.toLowerCase() === normalizedSalaryType || 
              opt.label.toLowerCase() === normalizedSalaryType
            );
            frontendSalaryType = foundOption ? foundOption.value : normalizedSalaryType;
          }
        }
      }
      
      // Debug: Log salary type mapping
      console.log("Salary Type Mapping (early load) - Backend:", editingJob.salary_type, "→ Frontend:", frontendSalaryType);
      console.log("Salary (early load):", editingJob.salary, "| type:", typeof editingJob.salary);
      console.log("=====================================");
      
      // Convert salary to string for input field (handle number or decimal)
      const salaryValue = editingJob.salary != null ? String(editingJob.salary) : "";
      console.log("Setting salary value (early load):", salaryValue, "| Original:", editingJob.salary);
      
      setFormData((prev) => ({
        ...prev,
        jobTitle: editingJob.job_title || "",
        jobDescription: editingJob.description || "",
        salary: salaryValue,
        salaryType: frontendSalaryType || prev.salaryType,
        typeOfEmployment: editingJob.job_type ? getFrontendJobType(editingJob.job_type) : "",
        hiringType: editingJob.hiring_type || "",
        teamSize: editingJob.team_size || (editingJob.hiring_type === 'team' ? 2 : 1),
        workStart: editingJob.work_start ? convertToPhilippinesTime(editingJob.work_start) : "",
        workEnd: editingJob.work_end ? convertToPhilippinesTime(editingJob.work_end) : "",
        applicationStart: editingJob.application_start ? convertToPhilippinesTime(editingJob.application_start) : "",
        applicationDeadline: editingJob.application_deadline ? convertToPhilippinesTime(editingJob.application_deadline) : "",
        skills: editingJob.skills || [],
        skillExperiences: editingJob.skill_experiences || {}
      }));
      
      // Set sub-skills input value
      if (editingJob.skills && editingJob.skills.length > 0) {
        const subSkillsFromJob = editingJob.skills
          .filter(skill => skill && skill.name)
          .map(skill => skill.name);
        setSelectedSubSkills(subSkillsFromJob);
        setSubSkillsInputValue(subSkillsFromJob.join(', '));
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
    // If hiringType is empty, don't set teamSize (let user select first)
  }, [formData.hiringType]);

  const fetchSkills = async () => {
    try {
      const res = await axios.get(`/api/skills");
      if (res.data) {
        setAvailableSkills(res.data);
        // Extract unique skill names for job title options
        const uniqueSkillNames = [...new Set(res.data.map(skill => skill.name))];
        const jobTitleOptions = uniqueSkillNames.map(skillName => ({
          value: skillName,
          label: skillName
        }));
        // Add "Others" option at the end
        jobTitleOptions.push({ value: 'Others', label: 'Others' });
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
    if (!formData.salaryType) return message.error("Please select salary type");
    if (!formData.typeOfEmployment) return message.error("Please select job type");
    if (!formData.hiringType) return message.error("Please select hiring type");
    if (!formData.applicationStart || !formData.applicationDeadline)
      return message.error("Please select application start and deadline dates");
    
    // Compare datetime-local strings (assumed to be in Philippines time)
    // datetime-local format: YYYY-MM-DDTHH:mm
    if (formData.applicationDeadline <= formData.applicationStart)
      return message.error("Application deadline must be after application start date");
    
    if (!formData.workStart || !formData.workEnd)
      return message.error("Please select work start and end dates");
    
    // Work start must be on or after application deadline
    if (formData.workStart < formData.applicationDeadline)
      return message.error("Work start date must be on or after application deadline (hiring period must complete first)");
    
    // Work end must be after work start
    if (formData.workEnd <= formData.workStart)
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
      if (isMountedRef.current) {
        message.error('An error occurred while posting the job.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => onClose();

  const handleJobTitleChange = (value) => {
    setSelectedJobTitle(value);
    
    // Check if "Others" is selected
    if (value === 'Others') {
      setIsJobTitleOthers(true);
      setFormData((prev) => ({ ...prev, jobTitle: '' }));
      setAvailableSubSkills([]);
      setIsSubSkillOthers(true); // When job title is Others, sub-skills should also be custom
    } else {
      setIsJobTitleOthers(false);
      setCustomJobTitle('');
      setIsSubSkillOthers(false);
      setCustomSubSkill('');
      setFormData((prev) => ({ ...prev, jobTitle: value }));
      
      // Filter sub-skills based on selected job title
      const selectedSkill = availableSkills.find(skill => skill.name === value);
      if (selectedSkill && selectedSkill.sub_skills) {
        const subSkillsOptions = selectedSkill.sub_skills.map(subSkill => ({
          value: subSkill,
          label: subSkill
        }));
        // Add "Others" option to sub-skills
        subSkillsOptions.push({ value: 'Others', label: 'Others' });
        setAvailableSubSkills(subSkillsOptions);
      } else {
        setAvailableSubSkills([{ value: 'Others', label: 'Others' }]);
      }
    }
    
    // Reset selected sub-skills and skills when job title changes
    setSelectedSubSkills([]);
    setFormData((prev) => ({ ...prev, skills: [], skillExperiences: {} }));
  };

  const handleCustomJobTitleChange = (e) => {
    const value = e.target.value;
    setCustomJobTitle(value);
    setFormData((prev) => ({ ...prev, jobTitle: value }));
  };

  const toggleSubSkillsDropdown = () => {
    setIsSubSkillsDropdownOpen(!isSubSkillsDropdownOpen);
    if (!isSubSkillsDropdownOpen) {
      setSubSkillSearchTerm(''); // Reset search when opening
    }
  };

  const handleSubSkillSearchChange = (e) => {
    setSubSkillSearchTerm(e.target.value);
  };

  const toggleExperienceDropdown = (subSkill) => {
    setIsExperienceDropdownOpen(prev => ({
      ...prev,
      [subSkill]: !prev[subSkill]
    }));
  };

  const handleSubSkillToggle = (subSkill) => {
    if (subSkill === 'Others') {
      setIsSubSkillOthers(true);
      return;
    }
    
    setSelectedSubSkills((prev) => {
      if (prev.includes(subSkill)) {
        return prev.filter(skill => skill !== subSkill);
      } else {
        return [...prev, subSkill];
      }
    });
  };

  const handleCustomSubSkillAdd = () => {
    if (!customSubSkill.trim()) {
      message.error('Please enter a custom sub-skill');
      return;
    }
    
    setSelectedSubSkills((prev) => [...prev, customSubSkill]);
    setCustomSubSkill('');
    setIsSubSkillOthers(false);
    setIsSubSkillsDropdownOpen(false);
    message.success(`Custom sub-skill "${customSubSkill}" added`);
  };

  const handleCustomSubSkillChange = (e) => {
    setCustomSubSkill(e.target.value);
  };

  const handleSubSkillsInputChange = (e) => {
    const value = e.target.value;
    setSubSkillsInputValue(value);
    // Split by comma and update selectedSubSkills
    const skills = value.split(',').map(s => s.trim()).filter(s => s !== '');
    setSelectedSubSkills(skills);
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

  // Determine modal title and button text
  const modalTitle = 'Post Job Information';
  const postButtonText = editingJob ? 'Update Job' : 'Post Job';

  return (
    <div className="modal-overlay">
      <div className="modal-post-job">
        <div className="modal-header">
          <h2 className="modal-title">{modalTitle}</h2>
          <button className="close-btn" onClick={handleClose}>
            <span>&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-columns">
            <div className="form-column">
              {/* Job Title */}
              <div className="form-group">
                <label>Job Title</label>
                {!isJobTitleOthers ? (
                  <CustomDropdown
                    options={jobTitleOptions}
                    value={selectedJobTitle}
                    onChange={handleJobTitleChange}
                    placeholder="Select job title"
                    className="full-width-input"
                    searchable={true}
                    required
                  />
                ) : (
                  <div className="custom-input-group">
                    <input
                      type="text"
                      value={customJobTitle}
                      onChange={handleCustomJobTitleChange}
                      placeholder="Enter custom job title"
                      className="full-width-input"
                      required
                    />
                    <button
                      type="button"
                      className="back-to-select-btn"
                      onClick={() => {
                        setIsJobTitleOthers(false);
                        setCustomJobTitle('');
                        setSelectedJobTitle('');
                        setFormData((prev) => ({ ...prev, jobTitle: '' }));
                      }}
                    >
                      ← Back to Select
                    </button>
                  </div>
                )}
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
                  <label>Salary Type</label>
                  <CustomDropdown
                    options={salaryTypeOptions}
                    value={formData.salaryType}
                    onChange={(val) => {
                      console.log("Salary Type Changed:", val);
                      setFormData((prev) => ({ ...prev, salaryType: val }));
                    }}
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

              {/* Application Period - MOVED TO TOP */}
              <div className="form-row">
                <div className="form-group">
                  <label>Application Start</label>
                  <input
                    type="datetime-local"
                    name="applicationStart"
                    value={formData.applicationStart}
                    onChange={handleInputChange}
                    min={getCurrentPhilippinesTime()}
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
                    disabled={!formData.applicationStart}
                  />
                </div>
              </div>

               {/* Work Period - MOVED BELOW APPLICATION PERIOD */}
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
                    min={formData.applicationDeadline ? 
                      formData.applicationDeadline
                      : getCurrentPhilippinesTime()}
                     required
                     disabled={!formData.applicationDeadline}
                     title={!formData.applicationDeadline ? "Please select Application Deadline first" : "Work Start must be after Application Deadline (hiring period)"}
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
                     min={formData.workStart || getCurrentPhilippinesTime()}
                     required
                     disabled={!formData.workStart}
                     title={!formData.workStart ? "Please select Work Start date first" : ""}
                   />
                 </div>
               </div>

              {/* Sub-Skills */}
              {(selectedJobTitle || editingJob?.job_title || formData.jobTitle) && (
                <div className="form-group">
                  <label>Desired Sub-Skills</label>
                  <div className="sub-skills-multi-select" ref={subSkillsDropdownRef}>
                    <div 
                      className="sub-skills-trigger"
                      onClick={toggleSubSkillsDropdown}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSubSkillsDropdown();
                        }
                      }}
                      tabIndex={0}
                    >
                      <div className="sub-skills-selected-container">
                        {selectedSubSkills.length > 0 ? (
                          <div className="sub-skills-tags">
                            {selectedSubSkills.map((subSkill, index) => (
                              <span key={index} className="sub-skill-tag">
                                {subSkill}
                                <button
                                  type="button"
                                  className="remove-tag-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSubSkills(prev => prev.filter(skill => skill !== subSkill));
                                    // Also remove experience level if it exists
                                    setFormData(prev => {
                                      const newExperiences = { ...prev.skillExperiences };
                                      delete newExperiences[subSkill];
                                      return {
                                        ...prev,
                                        skillExperiences: newExperiences
                                      };
                                    });
                                  }}
                                  aria-label={`Remove ${subSkill}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="sub-skills-placeholder">Select or type sub-skills...</span>
                        )}
                      </div>
                      <span className={`sub-skills-arrow ${isSubSkillsDropdownOpen ? 'open' : ''}`}>
                        ▼
                      </span>
                    </div>
                    
                    {isSubSkillsDropdownOpen && (
                      <div className="sub-skills-dropdown-menu">
                        {availableSubSkills.length > 0 && (
                          <div className="sub-skills-search-container">
                            <input
                              type="text"
                              className="sub-skills-search-input"
                              placeholder="Search sub-skills..."
                              value={subSkillSearchTerm}
                              onChange={handleSubSkillSearchChange}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                        )}
                        <div className="sub-skills-options-list">
                          {availableSubSkills
                            .filter(subSkill => {
                              if (!subSkillSearchTerm) return true;
                              const searchLower = subSkillSearchTerm.toLowerCase();
                              const labelLower = subSkill.label.toLowerCase();
                              const words = labelLower.split(' ');
                              return words.some(word => word.startsWith(searchLower));
                            })
                            .map((subSkill, index) => {
                              const isSelected = selectedSubSkills.includes(subSkill.value);
                              if (subSkill.value === 'Others') {
                                return (
                                  <div key={index} className="sub-skills-custom-container">
                                    <div
                                      className={`sub-skill-option ${isSubSkillOthers ? 'selected' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSubSkillOthers(true);
                                      }}
                                    >
                                      {subSkill.label}
                                    </div>
                                    {isSubSkillOthers && (
                                      <div className="custom-sub-skill-input-container">
                                        <input
                                          type="text"
                                          className="custom-sub-skill-input-field"
                                          placeholder="Enter custom sub-skill"
                                          value={customSubSkill}
                                          onChange={handleCustomSubSkillChange}
                                          onClick={(e) => e.stopPropagation()}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleCustomSubSkillAdd();
                                            }
                                            e.stopPropagation();
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="add-custom-sub-skill-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCustomSubSkillAdd();
                                          }}
                                        >
                                          Add
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={index}
                                  className={`sub-skill-option ${isSelected ? 'selected' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubSkillToggle(subSkill.value);
                                  }}
                                >
                                  <span className="sub-skill-checkbox">
                                    {isSelected ? '✓' : ''}
                                  </span>
                                  <span className="sub-skill-label">{subSkill.label}</span>
                                </div>
                              );
                            })}
                          {availableSubSkills.length === 0 && (
                            <div className="sub-skills-no-options">
                              No sub-skills available. Select a job title first.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <small style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
                    Click to select multiple sub-skills
                  </small>
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
                              {formData.skillExperiences[subSkill] 
                                ? experienceOptions.find(opt => opt.value === formData.skillExperiences[subSkill])?.label || formData.skillExperiences[subSkill]
                                : "Select Experience"}
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
              {isLoading ? "Posting..." : postButtonText}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default ModalPostJob;
