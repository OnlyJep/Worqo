import React, { useState, useEffect, useRef } from "react";

import axios from "axios";

import { message, Select, Dropdown, Menu } from "antd";

const { Option } = Select;

import { IconX, IconChevronDown, IconPlus, IconMinus } from "@tabler/icons-react";

import CustomDropdown from '../../common/CustomDropdown';

import "./../../../../sass/components/jobpostmodal.scss";
import "../../../../sass/components/common/CustomDropdown.scss";
import "../../../../sass/components/profilesettings/modalpostjob.scss";



// Helper function to construct profile image URL (matches jobposting.js logic)
// This function matches the exact same logic used in jobposting.js for consistency
const getProfileImageSrc = (profileImg) => {
  // Handle null, undefined, or empty string
  if (!profileImg || profileImg.trim() === '' || profileImg === 'null') {
    return "/images/default-profile.svg";
  }
  
  // If it's already a full URL, return as is
  if (profileImg.startsWith("http://") || profileImg.startsWith("https://")) {
    return profileImg;
  }
  
  // If it starts with /storage, it's already a complete path
  if (profileImg.startsWith("/storage")) {
    return `${window.location.origin}${profileImg}`;
  }
  
  // Laravel stores files using store('profiles', 'public') which returns "profiles/filename.jpg"
  // The symbolic link at public/storage points to storage/app/public
  // So if profileImg is "profiles/filename.jpg", the URL should be "/storage/profiles/filename.jpg"
  // When profileImg is just "filename.jpg", the URL should be "/storage/profiles/filename.jpg"
  if (profileImg.startsWith("profiles/")) {
    // Already has profiles/ prefix, construct: /storage/profiles/filename.jpg
    return `${window.location.origin}/storage/${profileImg}`;
  }
  
  // If it's just a filename (e.g., "68fa312d3dc9b.jpg"), assume it's in the profiles directory
  // This matches how jobposting.js handles it
  return `${window.location.origin}/storage/profiles/${profileImg}`;
};

const JobPostModal = ({ onClose, onSubmit, isEdit, initialData, onRefresh }) => {

  const [formData, setFormData] = useState({

    employer_id: "",

    profile_id: "",

    job_title: "",
    skills_required: [],

    description: "",

    salary: "",

    salary_type: "",
    job_type: "",

    hiring_type: "",
    team_size: "",
    work_start: "",
    work_end: "",
    application_start: "",

    application_deadline: "",

  });

  const [errors, setErrors] = useState({});

  const [availableSkills, setAvailableSkills] = useState([]);

  const [availableRanks, setAvailableRanks] = useState([]);

  const [employers, setEmployers] = useState([]);

  const [selectedEmployer, setSelectedEmployer] = useState(null);

  const [selectedSkill, setSelectedSkill] = useState(null);

  const [showSkillModal, setShowSkillModal] = useState(false);

  const [selectedSubSkillsForModal, setSelectedSubSkillsForModal] = useState([]);

  const [availableSubSkillsForModal, setAvailableSubSkillsForModal] = useState([]);

  const [searchTermSkills, setSearchTermSkills] = useState("");

  const [filteredSkills, setFilteredSkills] = useState([]);

  const [editingSkillId, setEditingSkillId] = useState(null);

  const isMountedRef = useRef(true);
  const [jobTitleOptions, setJobTitleOptions] = useState([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [isJobTitleOthers, setIsJobTitleOthers] = useState(false);
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [availableSubSkills, setAvailableSubSkills] = useState([]);
  const [selectedSubSkills, setSelectedSubSkills] = useState([]);
  const [subSkillsInputValue, setSubSkillsInputValue] = useState("");
  const [subSkillSearchTerm, setSubSkillSearchTerm] = useState("");
  const [skillExperiences, setSkillExperiences] = useState({});
  const [isExperienceDropdownOpen, setIsExperienceDropdownOpen] = useState({});
  const experienceDropdownRefs = useRef({});
  const [isSubSkillsDropdownOpen, setIsSubSkillsDropdownOpen] = useState(false);
  const [isSubSkillOthers, setIsSubSkillOthers] = useState(false);
  const [customSubSkill, setCustomSubSkill] = useState("");
  const subSkillsDropdownRef = useRef(null);



  useEffect(() => {

    // Fetch skills, ranks, and companies

    const fetchData = async () => {

      try {

        const [skillsResponse, ranksResponse, employersResponse] = await Promise.all([

          axios.get(`/api/skills`),

          axios.get(`/api/ranks`),

          axios.get(`/api/employers`),

        ]);

        // Handle different response structures for skills
        let skillsData = [];
        if (skillsResponse.data) {
          if (Array.isArray(skillsResponse.data)) {
            skillsData = skillsResponse.data;
          } else if (skillsResponse.data.data && Array.isArray(skillsResponse.data.data)) {
            skillsData = skillsResponse.data.data;
          } else if (skillsResponse.data.skills && Array.isArray(skillsResponse.data.skills)) {
            skillsData = skillsResponse.data.skills;
          }
        }

        const formattedSkills = skillsData.map((skill) => ({

          id: skill.id,
          name: skill.name || skill.skill_name || "",
          sub_skills: Array.isArray(skill.sub_skills) ? skill.sub_skills : [],

        })).filter(skill => skill.id && skill.name); // Filter out invalid skills

        setAvailableSkills(formattedSkills);

        setFilteredSkills(formattedSkills);

        // Extract unique skill names for job title options (like employer flow)
        const uniqueSkillNames = [...new Set(formattedSkills.map(skill => skill.name))];
        const jobTitleOptions = uniqueSkillNames.map(skillName => ({
          value: skillName,
          label: skillName
        }));
        // Add "Others" option at the end
        jobTitleOptions.push({ value: 'Others', label: 'Others' });
        setJobTitleOptions(jobTitleOptions);

        

        // Update ranks to use full rank objects instead of just names

        const ranksData = ranksResponse.data.ranks || ranksResponse.data;

        setAvailableRanks(ranksData);

        // Fetch employers data
        const employersData = Array.isArray(employersResponse.data)
          ? employersResponse.data
          : [];
        
        setEmployers(employersData);

      } catch (error) {

        console.error("Error fetching data:", error);

        message.error("Failed to load data. Please try again.");

        setErrors({ fetch: "Failed to load data. Please try again." });

      }

    };

    fetchData();

  }, []);



  useEffect(() => {

    if (!isMountedRef.current) return;

    if (searchTermSkills.trim() === "") {

      setFilteredSkills(availableSkills || []);

    } else {

      const searchLower = searchTermSkills.toLowerCase().trim();

      const filtered = (availableSkills || []).filter((skill) => skill.name.toLowerCase().includes(searchLower));

      setFilteredSkills(filtered);

    }

  }, [searchTermSkills, availableSkills]);



  useEffect(() => {

    return () => {

      isMountedRef.current = false;

    };

  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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
    // Set form data for edit mode - find employer by profile_id
    if (isEdit && initialData && employers.length > 0) {
      // Find employer by profile_id
      const employer = employers.find(emp => 
        emp.profile && emp.profile.id && String(emp.profile.id) === String(initialData.profile_id)
      );
      
      if (employer) {
        setSelectedEmployer(employer);
        console.log("Found employer in useEffect:", employer);
        console.log("Employer profile:", employer.profile);
      } else {
        console.log("No employer found for profile_id:", initialData.profile_id);
      }
      
      // Set selected job title and sub-skills for editing (like employer flow)
      const jobTitle = initialData.job_title || "";
      if (jobTitle) {
        setSelectedJobTitle(jobTitle);
        setIsJobTitleOthers(false);
        
        // Find the skill that matches the job title and set its sub-skills
        const matchingSkill = availableSkills.find(skill => skill.name === jobTitle);
        if (matchingSkill && matchingSkill.sub_skills) {
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
        setSelectedJobTitle("");
        setAvailableSubSkills([]);
      }
      
      // Set selected sub-skills from the job's skills (like employer flow)
      if (initialData.skills && Array.isArray(initialData.skills) && initialData.skills.length > 0) {
        // Handle skills array - it could be an array of skill objects with name and experience
        const subSkillsFromJob = initialData.skills.map(skill => {
          if (typeof skill === 'string') {
            return skill;
          } else if (skill && skill.name) {
            return skill.name;
          }
          return null;
        }).filter(s => s !== null);
        
        setSelectedSubSkills(subSkillsFromJob);
        // Set the input value to display comma-separated sub-skills
        setSubSkillsInputValue(subSkillsFromJob.join(', '));
        
        // Set skill experiences from the job's skillExperiences
        const experiences = {};
        initialData.skills.forEach(skill => {
          if (skill && typeof skill === 'object' && skill.name && skill.experience) {
            experiences[skill.name] = skill.experience;
          }
        });
        if (initialData.skill_experiences && typeof initialData.skill_experiences === 'object') {
          setSkillExperiences({ ...experiences, ...initialData.skill_experiences });
        } else {
          setSkillExperiences(experiences);
        }
      }

      setFormData({

        employer_id: employer?.id ? String(employer.id) : (initialData.employer_id || ""),
        profile_id: initialData.profile_id ? String(initialData.profile_id) : "",
        job_title: jobTitle,
        skills_required: initialData.skills ? (() => {

          const skillsArray = [];

          // Handle different skill formats
          if (Array.isArray(initialData.skills)) {
            // Parse skills - could be array of objects with name/experience, or alternating format
            // Check if it's the new format (array of objects)
            if (initialData.skills.length > 0 && typeof initialData.skills[0] === 'object' && initialData.skills[0].name) {
              // New format: array of objects with name and experience
              // Filter out skills that match the job title (those are handled separately as sub-skills)
              initialData.skills.forEach((skill, index) => {
                if (skill && skill.name && skill.name !== jobTitle) {
                  const actualSkill = availableSkills.find(s => s.name === skill.name);
                  const rankIndex = index;
                  const rank = (initialData.ranks && initialData.ranks[rankIndex])
                    ? availableRanks.find(rank => rank.name === initialData.ranks[rankIndex]) || availableRanks[0]
                    : availableRanks[0];

                  skillsArray.push({
                    skill_id: actualSkill ? String(actualSkill.id) : String(rankIndex + 1),
                    skill_name: skill.name,
                    sub_skills: Array.isArray(skill.sub_skills) ? skill.sub_skills : [],
                    rank: rank
                  });
                }
              });
            } else {
              // Old alternating format: skill_name, [sub_skills], skill_name, [sub_skills], ...
              // Skip the first skill if it matches the job title (it's the job title skill)
              const startIndex = (initialData.skills.length >= 2 && initialData.skills[0] === jobTitle) ? 2 : 0;

              for (let i = startIndex; i < initialData.skills.length; i += 2) {
                const skillName = initialData.skills[i];
                const subSkills = initialData.skills[i + 1] || [];

                if (skillName && typeof skillName === 'string') {
                  const actualSkill = availableSkills.find(s => s.name === skillName);
                  const rankIndex = Math.floor(i / 2);
                  const rank = (initialData.ranks && initialData.ranks[rankIndex])
                    ? availableRanks.find(rank => rank.name === initialData.ranks[rankIndex]) || availableRanks[0]
                    : availableRanks[0];

                  skillsArray.push({
                    skill_id: actualSkill ? String(actualSkill.id) : String(rankIndex + 1),
                    skill_name: skillName,
                    sub_skills: Array.isArray(subSkills) ? subSkills : [],
                    rank: rank
                  });
                }
              }
            }
          }

          return skillsArray;

        })() : [],

        description: initialData.description || "",

        salary: initialData.salary || "",

        salary_type: (() => {
          // Get salary_type from initialData, normalize it (lowercase, trim)
          const salaryType = initialData.salary_type 
            ? String(initialData.salary_type).toLowerCase().trim()
            : null;
          
          // Debug: Log salary type mapping
          console.log("JobPostModal - salary_type mapping:");
          console.log("  Original value:", initialData.salary_type);
          console.log("  Normalized value:", salaryType);
          
          // Valid salary type options in the dropdown
          const validSalaryTypes = ['hourly', 'per_hour', 'daily', 'weekly', 'monthly', 'per_month', 'per_project'];
          
          // If the salary_type matches one of the valid options, return it as is
          // This ensures that if database has 'per_hour', it shows 'per_hour' in the dropdown
          // and if database has 'per_month', we can map it to 'monthly' or keep as 'per_month'
          if (salaryType && validSalaryTypes.includes(salaryType)) {
            console.log("  Valid salary type found:", salaryType);
            return salaryType;
          }
          
          // Handle backend values directly
          if (salaryType === 'per_hour') {
            console.log("  Using per_hour from backend");
            return 'per_hour';
          }
          if (salaryType === 'per_month') {
            // Map per_month to monthly for display (since we have monthly in dropdown)
            console.log("  Mapped per_month to monthly");
            return 'monthly';
          }
          
          // If it's a valid value but not in our list, try to find a match
          if (salaryType) {
            // Check if it's a variation of our valid types
            if (salaryType.includes('hour') || salaryType === 'hr' || salaryType === 'hrly') {
              console.log("  Detected hourly variant, using per_hour");
              return 'per_hour';
            }
            if (salaryType.includes('month') || salaryType === 'mo') {
              console.log("  Detected monthly variant, using monthly");
              return 'monthly';
            }
          }
          
          // If salary_type is null or missing, default to per_hour for existing jobs
          // This ensures validation passes for jobs that were created before salary_type was required
          if (!salaryType && isEdit) {
            console.log("  Warning: salary_type is null for existing job, defaulting to per_hour");
            return 'per_hour';
          }
          
          // Return empty string to show placeholder when creating new jobs
          console.log("  Using empty string to show placeholder");
          return "";
        })(),
        job_type: initialData.job_type || "",

        hiring_type: initialData.hiring_type || "",
        team_size: initialData.team_size || "",
        work_start: initialData.work_start
          ? new Date(initialData.work_start).toISOString().slice(0, 16)
          : "",
        work_end: initialData.work_end
          ? new Date(initialData.work_end).toISOString().slice(0, 16)
          : "",
        application_start: initialData.application_start

          ? new Date(initialData.application_start).toISOString().slice(0, 16)

          : "",

        application_deadline: initialData.application_deadline

          ? new Date(initialData.application_deadline).toISOString().slice(0, 16)

          : "",

      });

      console.log("Edit mode - Initial data:", initialData);
      console.log("Edit mode - Profile ID:", initialData.profile_id);
      console.log("Edit mode - Selected employer:", employer);
    }

  }, [isEdit, initialData, availableSkills, availableRanks, employers]);


  const handleInputChange = (e, field) => {

    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    setFormData((prev) => {

      const newData = { ...prev, [field]: value };

      // Handle employer selection - automatically set profile_id
      if (field === "employer_id" && value) {
        const selectedEmp = employers.find(emp => String(emp.id) === String(value));
        
        if (selectedEmp) {
          setSelectedEmployer(selectedEmp);
          
          // Automatically set profile_id from selected employer
          if (selectedEmp.profile?.id) {
            newData.profile_id = String(selectedEmp.profile.id);
          }
          
          console.log("Selected employer:", selectedEmp);
          console.log("Set profile_id to:", newData.profile_id);
          
          // Clear profile_id error if it exists
          setErrors((prev) => ({ ...prev, profile_id: "" }));
        } else {
          setSelectedEmployer(null);
          newData.profile_id = "";
          setExistingImagePath(null);
          setErrors((prev) => ({
            ...prev,
            profile_id: "No profile associated with this employer",
          }));
        }
      }

      return newData;

    });

    
    setErrors((prev) => ({ ...prev, [field]: "" }));

  };



  const handleJobTitleChange = (value) => {
    if (!isMountedRef.current) return;
    
    setSelectedJobTitle(value);
    
    // Check if "Others" is selected
    if (value === 'Others') {
      setIsJobTitleOthers(true);
      setFormData((prev) => ({ ...prev, job_title: '' }));
      setAvailableSubSkills([]);
      setSelectedSubSkills([]);
      setSubSkillsInputValue('');
      setSkillExperiences({});
      setIsSubSkillOthers(false);
      setCustomSubSkill('');
    } else {
      setIsJobTitleOthers(false);
      setCustomJobTitle('');
      setFormData((prev) => ({ ...prev, job_title: value }));
      
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
    
    // Reset selected sub-skills and experiences when job title changes
    setSelectedSubSkills([]);
    setSubSkillsInputValue('');
    setSkillExperiences({});
      setIsSubSkillOthers(false);
      setCustomSubSkill('');
    setErrors((prev) => ({ ...prev, job_title: "" }));
  };

  const handleCustomJobTitleChange = (e) => {
    const value = e.target.value;
    setCustomJobTitle(value);
    setFormData((prev) => ({ ...prev, job_title: value }));
  };

  const handleSubSkillsInputChange = (e) => {
    const value = e.target.value;
    setSubSkillsInputValue(value);
    setSubSkillSearchTerm(value);
    // Split by comma and update selectedSubSkills
    const skills = value.split(',').map(s => s.trim()).filter(s => s !== '');
    setSelectedSubSkills(skills);
  };

  const toggleSubSkillsDropdown = () => {
    setIsSubSkillsDropdownOpen(!isSubSkillsDropdownOpen);
    if (!isSubSkillsDropdownOpen) {
      setSubSkillSearchTerm(''); // Reset search when opening
    }
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
    // Update input value for display
    setSubSkillsInputValue(prev => {
      const skills = prev.includes(subSkill) 
        ? prev.split(',').map(s => s.trim()).filter(s => s !== subSkill && s !== '')
        : [...prev.split(',').map(s => s.trim()).filter(s => s !== ''), subSkill];
      return skills.join(', ');
    });
  };

  const handleCustomSubSkillAdd = () => {
    if (!customSubSkill.trim()) {
      message.error('Please enter a custom sub-skill');
      return;
    }
    
    setSelectedSubSkills((prev) => [...prev, customSubSkill.trim()]);
    setSubSkillsInputValue(prev => {
      const skills = prev ? prev.split(',').map(s => s.trim()).filter(s => s !== '') : [];
      return [...skills, customSubSkill.trim()].join(', ');
    });
    setCustomSubSkill('');
    setIsSubSkillOthers(false);
    setIsSubSkillsDropdownOpen(false);
    message.success(`Custom sub-skill "${customSubSkill.trim()}" added`);
  };

  const handleCustomSubSkillChange = (e) => {
    setCustomSubSkill(e.target.value);
  };

  const handleSubSkillSearchChange = (e) => {
    setSubSkillSearchTerm(e.target.value);
  };

  const handleExperienceChange = (subSkill, experience) => {
    setSkillExperiences((prev) => ({
      ...prev,
      [subSkill]: experience
    }));
    // Close the dropdown after selection
    setIsExperienceDropdownOpen(prev => ({
      ...prev,
      [subSkill]: false
    }));
  };

  const toggleExperienceDropdown = (subSkill) => {
    setIsExperienceDropdownOpen(prev => ({
      ...prev,
      [subSkill]: !prev[subSkill]
    }));
  };

  const experienceOptions = [
    { value: "0-11-months", label: "0–11 months" },
    { value: "1-2-years", label: "1–2 years" },
    { value: "3-5-years", label: "3–5 years" },
    { value: "6-9-years", label: "6–9 years" },
    { value: "10+-years", label: "10+ years" },
  ];


  const handleSkillSelect = (value) => {

    if (!isMountedRef.current) return;

    const skill = availableSkills.find((s) => String(s.id) === value);

    if (!skill) {

      if (isMountedRef.current) {

        setErrors((prev) => ({ ...prev, skills_required: "Invalid skill selected. Please try again." }));

      }

      return;

    }

    if (formData.skills_required.some((existing) => existing.skill_id === value)) {

      if (isMountedRef.current) {

        setErrors((prev) => ({ ...prev, skills_required: "This skill has already been added." }));

      }

      return;

    }

    if (isMountedRef.current) {

      setSelectedSkill(skill);

      setAvailableSubSkillsForModal(skill.sub_skills || []);

      setSelectedSubSkillsForModal([]);

      setShowSkillModal(true);

      setErrors((prev) => ({ ...prev, skills_required: "", sub_skills: "" }));

    }

  };



  const handleAddSubSkill = (subSkill) => {

    if (!isMountedRef.current) return;

    if (selectedSubSkillsForModal.includes(subSkill)) {

      if (isMountedRef.current) {

        setErrors((prev) => ({ ...prev, sub_skills: "This sub-skill is already selected." }));

      }

      return;

    }

    if (isMountedRef.current) {

      setSelectedSubSkillsForModal((prev) => [...prev, subSkill]);

      setAvailableSubSkillsForModal((prev) => prev.filter((s) => s !== subSkill));

      setErrors((prev) => ({ ...prev, sub_skills: "" }));

    }

  };



  const handleRemoveSubSkill = (subSkill) => {

    if (!isMountedRef.current) return;

    if (isMountedRef.current) {

      setSelectedSubSkillsForModal((prev) => prev.filter((s) => s !== subSkill));

      setAvailableSubSkillsForModal((prev) => [...prev, subSkill].sort());

    }

  };



  const handleSaveSkill = () => {

    if (!isMountedRef.current || !selectedSkill) return;

    if (selectedSkill.sub_skills.length > 0 && selectedSubSkillsForModal.length === 0) {

      if (isMountedRef.current) {

        setErrors((prev) => ({ ...prev, sub_skills: "Please select at least one sub-skill." }));

      }

      return;

    }

    

    const updatedSkill = {

      skill_id: String(selectedSkill.id),

      skill_name: selectedSkill.name,

      sub_skills: selectedSubSkillsForModal,

      rank: availableRanks[0] || { id: 1, name: "Gold" }, // Default to first rank or Gold

    };



    if (isMountedRef.current) {

      if (editingSkillId) {

        // Update existing skill

        setFormData((prev) => ({

          ...prev,

          skills_required: prev.skills_required.map(skill => 

            skill.skill_id === editingSkillId ? updatedSkill : skill

          ),

        }));

      } else {

        // Add new skill

        setFormData((prev) => ({

          ...prev,

          skills_required: [...prev.skills_required, updatedSkill],

        }));

      }

      

      setShowSkillModal(false);

      setSelectedSkill(null);

      setAvailableSubSkillsForModal([]);

      setSelectedSubSkillsForModal([]);

      setEditingSkillId(null);

      setErrors((prev) => ({ ...prev, skills_required: "", sub_skills: "" }));

    }

  };



  const handleModalClose = () => {

    if (!isMountedRef.current) return;

    if (isMountedRef.current) {

      setShowSkillModal(false);

      setSelectedSkill(null);

      setAvailableSubSkillsForModal([]);

      setSelectedSubSkillsForModal([]);

      setEditingSkillId(null);

    }

  };



  const handleRankChange = (skillId, newRankId) => {

    if (!isMountedRef.current) return;

    const selectedRank = availableRanks.find(rank => String(rank.id) === String(newRankId));

    setFormData((prev) => ({

      ...prev,

      skills_required: prev.skills_required.map((skill) =>

        skill.skill_id === skillId ? { ...skill, rank: selectedRank } : skill

      ),

    }));

  };



  const removeSkill = (skillId) => {

    if (!isMountedRef.current) return;

    setFormData((prev) => ({

      ...prev,

      skills_required: prev.skills_required.filter((skill) => skill.skill_id !== skillId),

    }));

  };



  const validateForm = () => {

    const newErrors = {};

    // Validate employer selection
    if (!formData.employer_id) {
      newErrors.employer_id = "Employer is required";
    }

    // Validate profile_id
    if (!formData.profile_id) {
      newErrors.profile_id = "Profile ID is required";
    }

    // Validate that profile_id matches selected employer
    if (formData.employer_id && selectedEmployer) {
      const expectedProfileId = selectedEmployer.profile?.id ? String(selectedEmployer.profile.id) : "";
      if (expectedProfileId && formData.profile_id !== expectedProfileId) {
        newErrors.profile_id = "Profile ID must match the selected employer";
      }
    }
    if (!formData.job_title || !selectedJobTitle) {
      newErrors.job_title = "Job title is required";
    }

    if (!formData.description) {

      newErrors.description = "Job description is required";

    }

    if (!formData.job_type) {

      newErrors.job_type = "Job type is required";

    }

    if (!formData.salary_type || formData.salary_type.trim() === '') {
      newErrors.salary_type = "Salary type is required";
    }
    if (!formData.hiring_type) {
      newErrors.hiring_type = "Hiring type is required";
    }
    if (formData.hiring_type === "team" && (!formData.team_size || parseInt(formData.team_size) < 2)) {
      newErrors.team_size = "Team size must be at least 2";
    }
    if (!formData.work_start) {
      newErrors.work_start = "Work start date and time are required";
    }
    if (!formData.work_end) {
      newErrors.work_end = "Work end date and time are required";
    }
    if (formData.work_start && formData.work_end) {
      const workStartDate = new Date(formData.work_start);
      const workEndDate = new Date(formData.work_end);
      if (workEndDate <= workStartDate) {
        newErrors.work_end = "Work end must be after work start";
      }
    }
    if (!formData.application_start) {

      newErrors.application_start = "Application start date and time are required";

    }

    if (!formData.application_deadline) {

      newErrors.application_deadline = "Application deadline date and time are required";

    }

    if (formData.application_start && formData.application_deadline) {

      const startDate = new Date(formData.application_start);

      const endDate = new Date(formData.application_deadline);

      if (endDate <= startDate) {

        newErrors.application_deadline = "Deadline must be after the start date";

      }

      if (startDate.getFullYear() < new Date().getFullYear()) {

        newErrors.application_start = "Start date cannot be in the past";

      }

    }

    if (formData.salary && (isNaN(formData.salary) || Number(formData.salary) < 1)) {

      newErrors.salary = "Salary must be a number greater than or equal to 1";

    }

    // Job title skill is now required, skills_required is optional for additional skills

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {

      message.error("Please correct the errors in the form.");

    }

    return Object.keys(newErrors).length === 0;

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    if (validateForm()) {

      try {

        // Convert dates to full ISO 8601 format for backend

        // Format skills array with experiences (like employer flow)
        const skillsData = selectedSubSkills.map(subSkill => ({
          name: subSkill,
          experience: skillExperiences[subSkill] || "0-11-months"
        }));



        // Map salary_type to backend format (only accepts per_hour or per_month)
        const mapSalaryTypeToBackend = (frontendType) => {
          if (!frontendType || frontendType.trim() === '') {
            console.warn("Salary type is empty, defaulting to per_hour");
            return 'per_hour'; // Default fallback - backend requires this field
          }
          const normalized = String(frontendType).toLowerCase().trim();
          
          // Map to backend values
          if (normalized === 'hourly' || normalized === 'per_hour') {
            return 'per_hour';
          }
          if (normalized === 'monthly' || normalized === 'per_month') {
            return 'per_month';
          }
          // For other types (daily, weekly, per_project), default to per_month
          if (normalized === 'daily' || normalized === 'weekly' || normalized === 'per_project') {
            return 'per_month';
          }
          // If already valid backend value, return as is
          if (normalized === 'per_hour' || normalized === 'per_month') {
            return normalized;
          }
          // Default fallback
          console.warn(`Unknown salary type: ${frontendType}, defaulting to per_hour`);
          return 'per_hour';
        };

        // Prepare submit data
        const submitData = {
            profile_id: formData.profile_id,
            job_title: formData.job_title || "",
            skills: skillsData,
            skill_experiences: skillExperiences,
            description: formData.description,
            salary: formData.salary,
            salary_type: mapSalaryTypeToBackend(formData.salary_type),
            job_type: formData.job_type,
            hiring_type: formData.hiring_type,
            team_size: formData.team_size ? parseInt(formData.team_size) : (formData.hiring_type === "team" ? 2 : 1),
            work_start: formData.work_start ? `${formData.work_start}:00` : "",
            work_end: formData.work_end ? `${formData.work_end}:00` : "",
          application_start: formData.application_start ? `${formData.application_start}:00` : "",

          application_deadline: formData.application_deadline ? `${formData.application_deadline}:00` : "",

        };
        
        console.log("Submitting job post data:", submitData);
        console.log("Salary type mapping:", formData.salary_type, "->", submitData.salary_type);

        await onSubmit(submitData);

        message.success(isEdit ? "Job post updated successfully" : "Job post created successfully");

        onClose();

        onRefresh();

      } catch (error) {

        console.error("Error submitting job post:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);

        // Show detailed validation errors if available
        if (error.response?.status === 422 && error.response?.data?.errors) {
          const validationErrors = error.response.data.errors;
          const errorMessages = Object.entries(validationErrors).map(([field, messages]) => {
            return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          }).join('; ');
          message.error(`Validation failed: ${errorMessages}`);
          setErrors(validationErrors);
        } else {
          const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to submit job post";
          message.error(errorMessage);
          setErrors((prev) => ({ ...prev, submit: errorMessage }));
        }

      }

    }

  };



  const getProfileName = (profile) => {

    if (!profile) {

      console.log("No profile provided to getProfileName");

      return "N/A";

    }

    const { first_name, middlename, last_name, suffix } = profile;

    let fullName = `${first_name || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;

    if (suffix) fullName += ` ${suffix}`;

    const name = fullName.trim() || "N/A";

    console.log("Profile name generated:", name, "from profile:", profile);

    return name;

  };



  const skillMenu = (skill) => (

    <Menu

      items={[

        {

          key: "edit",

          label: (

            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>

              <span>âœï¸</span>

              <span>Edit Skill</span>

            </span>

          ),

          onClick: () => {

            if (!isMountedRef.current) return;

            const foundSkill = availableSkills.find((s) => String(s.id) === String(skill.skill_id));

            if (foundSkill) {

              setEditingSkillId(skill.skill_id); // Set the skill being edited

              setSelectedSkill(foundSkill);

              const currentSubSkills = Array.isArray(skill.sub_skills) ? skill.sub_skills : [];

              setAvailableSubSkillsForModal(

                (foundSkill.sub_skills || []).filter((subSkill) => !currentSubSkills.includes(subSkill))

              );

              setSelectedSubSkillsForModal(currentSubSkills);

              setShowSkillModal(true);

            }

          },

        },

        {

          key: "remove",

          label: (

            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', color: '#ff4d4f' }}>

              <span>ðŸ—‘ï¸</span>

              <span>Remove Skill</span>

            </span>

          ),

          onClick: () => {

            if (!isMountedRef.current) return;

            removeSkill(skill.skill_id);

          },

        },

      ]}

    />

  );



  return (

    <div className="jobpostmodal-overlay">

      <div className="jobpostmodal">

        <h2>{isEdit ? "Edit Job Post" : "Create Job Post"}</h2>

        {errors.fetch && <span className="error">{errors.fetch}</span>}

        <div className="jobpostmodal-content">

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profile_id">Profile ID</label>
              <input
                id="profile_id"
                type="text"
                value={formData.profile_id || ""}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'not-allowed'
                }}
                title="Profile ID is automatically set when you select an employer"
              />
              {errors.profile_id && <span className="error">{errors.profile_id}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="employer_id">Employer Name</label>
              <select
                id="employer_id"
                name="employer_id"
                value={formData.employer_id}
                onChange={(e) => handleInputChange(e, "employer_id")}
                required
              >
                <option value="" disabled>
                  Select Employer
                </option>
                {Array.isArray(employers) &&
                  employers.map((employer) => {
                    const fullName = employer.profile
                      ? `${employer.profile.first_name || ''} ${employer.profile.middlename ? employer.profile.middlename + ' ' : ''}${employer.profile.last_name || ''}${employer.profile.suffix_name ? ' ' + employer.profile.suffix_name : ''}`.trim() || 'N/A'
                      : 'N/A';
                    return (
                      <option key={employer.id} value={employer.id}>
                        {fullName}
                      </option>
                    );
                  })}
              </select>
              {errors.employer_id && <span className="error">{errors.employer_id}</span>}
            </div>
          </div>


          {/* Job Title - Like employer flow */}
          <div className="form-group">
            <label htmlFor="job_title">Job Title</label>
            {!isJobTitleOthers ? (
              <>
                {/* Hidden input for label association - ensures label properly associates with form element */}
                <input
                  id="job_title"
                  type="hidden"
                  value={selectedJobTitle || ''}
                  aria-hidden="true"
                  tabIndex={-1}
                  readOnly
                />
                <CustomDropdown
                  options={jobTitleOptions}
                  value={selectedJobTitle}
                  onChange={handleJobTitleChange}
                  placeholder="Select job title"
                  className="skill-select"
                  searchable={true}
                  required
                />
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  id="job_title"
                  type="text"
                  value={customJobTitle}
                  onChange={handleCustomJobTitleChange}
                  placeholder="Enter custom job title"
                  style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsJobTitleOthers(false);
                    setCustomJobTitle('');
                    setSelectedJobTitle('');
                    setFormData((prev) => ({ ...prev, job_title: '' }));
                  }}
                  style={{ alignSelf: 'flex-start', padding: '4px 8px', cursor: 'pointer' }}
                >
                  ← Back to Select
                </button>
              </div>
            )}
            {errors.job_title && <span className="error">{errors.job_title}</span>}
          </div>

          {/* Sub-Skills - Multi-select dropdown like employer flow */}
          {selectedJobTitle && !isJobTitleOthers && (
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
                                setSkillExperiences(prev => {
                                  const newExperiences = { ...prev };
                                  delete newExperiences[subSkill];
                                  return newExperiences;
                                });
                                // Update input value
                                setSubSkillsInputValue(prev => {
                                  const skills = prev.split(',').map(s => s.trim()).filter(s => s !== subSkill && s !== '');
                                  return skills.join(', ');
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

          {/* Experience Levels for Selected Sub-Skills - Like employer flow */}
          {selectedSubSkills.length > 0 && (
            <div className="form-group">
              <label>Experience Levels</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedSubSkills.map((subSkill, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <div style={{ flex: 1, fontWeight: '500' }}>{subSkill}</div>
                    <div style={{ position: 'relative' }}>
                      <div
                        onClick={() => toggleExperienceDropdown(subSkill)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minWidth: '150px'
                        }}
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
                        <span>{skillExperiences[subSkill] ? experienceOptions.find(opt => opt.value === skillExperiences[subSkill])?.label || skillExperiences[subSkill] : "Select Experience"}</span>
                        <span style={{ fontSize: '10px' }}>▼</span>
                      </div>
                      {isExperienceDropdownOpen[subSkill] && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {experienceOptions.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              onClick={() => handleExperienceChange(subSkill, option.value)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: optIndex < experienceOptions.length - 1 ? '1px solid #eee' : 'none'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
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

          {/* Selected Skills Preview - Like employer flow */}
          {selectedSubSkills.length > 0 && (
            <div className="form-group">
              <label>Selected Skills Preview</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                {selectedSubSkills.map((subSkill, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '2px solid #e5e7eb' }}>
                    <span style={{ fontWeight: '500', color: '#1f2937' }}>{subSkill}</span>
                    {skillExperiences[subSkill] && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        ({experienceOptions.find(opt => opt.value === skillExperiences[subSkill])?.label || skillExperiences[subSkill]})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">

            <label htmlFor="description">Job Description</label>

            <textarea

              id="description"

              value={formData.description}

              onChange={(e) => handleInputChange(e, "description")}

              placeholder="Describe the job role and responsibilities"

            />

            {errors.description && <span className="error">{errors.description}</span>}

          </div>

          <div className="form-row">
          <div className="form-group">

            <label htmlFor="salary">Salary (PHP)</label>

            <input

              id="salary"

              type="number"

              value={formData.salary}

              onChange={(e) => handleInputChange(e, "salary")}

              placeholder="Enter salary (e.g., 500)"

              min="1"

            />

            {errors.salary && <span className="error">{errors.salary}</span>}

          </div>

            <div className="form-group">
              <label htmlFor="salary_type">Salary Type</label>
              <select
                id="salary_type"
                value={formData.salary_type}
                onChange={(e) => handleInputChange(e, "salary_type")}
                required
              >
                <option value="" disabled>Select salary type...</option>
                <option value="hourly">Hourly</option>
                <option value="per_hour">Per Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="per_project">Per Project</option>
              </select>
              {errors.salary_type && <span className="error">{errors.salary_type}</span>}
            </div>
          </div>
          <div className="form-row">
          <div className="form-group">

            <label htmlFor="job_type">Job Type</label>

            <select

              id="job_type"

              value={formData.job_type}

              onChange={(e) => handleInputChange(e, "job_type")}

              required

            >

              <option value="" disabled>Select job type...</option>

              <option value="per_day">Per Day</option>

              <option value="per_job">Per Job</option>

            </select>

            {errors.job_type && <span className="error">{errors.job_type}</span>}

          </div>

            <div className="form-group">
              <label htmlFor="hiring_type">Hiring Type</label>
              <select
                id="hiring_type"
                value={formData.hiring_type}
                onChange={(e) => handleInputChange(e, "hiring_type")}
                required
              >
                <option value="" disabled>Select hiring type...</option>
                <option value="individual">Individual</option>
                <option value="team">Team</option>
              </select>
              {errors.hiring_type && <span className="error">{errors.hiring_type}</span>}
            </div>
          </div>
          {formData.hiring_type === "team" && (
            <div className="form-group">
              <label htmlFor="team_size">Team Size</label>
              <input
                id="team_size"
                type="number"
                value={formData.team_size}
                onChange={(e) => handleInputChange(e, "team_size")}
                placeholder="Enter team size"
                min="2"
                max="50"
              />
              {errors.team_size && <span className="error">{errors.team_size}</span>}
            </div>
          )}
          <div className="form-row">
          <div className="form-group">

            <label htmlFor="application_start">Application Start (Date & Time)</label>

            <input

              id="application_start"

              type="datetime-local"

              value={formData.application_start}

              onChange={(e) => handleInputChange(e, "application_start")}

              min={`${new Date().getFullYear()}-01-01T00:00`}

              required

            />

            {errors.application_start && <span className="error">{errors.application_start}</span>}

          </div>

          <div className="form-group">

            <label htmlFor="application_deadline">Application Deadline (Date & Time)</label>

            <input

              id="application_deadline"

              type="datetime-local"

              value={formData.application_deadline}

              onChange={(e) => handleInputChange(e, "application_deadline")}

              min={formData.application_start || `${new Date().getFullYear()}-01-01T00:00`}

              required

            />

            {errors.application_deadline && <span className="error">{errors.application_deadline}</span>}

            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="work_start">Work Start (Date & Time)</label>
              <input
                id="work_start"
                type="datetime-local"
                value={formData.work_start}
                onChange={(e) => handleInputChange(e, "work_start")}
                min={`${new Date().getFullYear()}-01-01T00:00`}
                required
              />
              {errors.work_start && <span className="error">{errors.work_start}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="work_end">Work End (Date & Time)</label>
              <input
                id="work_end"
                type="datetime-local"
                value={formData.work_end}
                onChange={(e) => handleInputChange(e, "work_end")}
                min={formData.work_start || `${new Date().getFullYear()}-01-01T00:00`}
                required
              />
              {errors.work_end && <span className="error">{errors.work_end}</span>}
            </div>
          </div>

          {errors.submit && <span className="error">{errors.submit}</span>}

        </div>

        <div className="jobpostmodal-buttons">

          <button className="submit-button" onClick={handleSubmit}>

            {isEdit ? "Update" : "Create"}

          </button>

          <button className="cancel-button" onClick={onClose}>

            Cancel

          </button>

        </div>

      </div>



      {showSkillModal && selectedSkill && (

        <div className="skill-details-modal-overlay">

          <div className="skill-details-modal">

            <div className="modal-content">

              <div className="modal-header">

                <h3>{selectedSkill.name}</h3>

                <IconX size={20} className="close-icon" onClick={handleModalClose} />

              </div>

              <div className="modal-body">

                {selectedSkill.sub_skills.length > 0 ? (

                  <div className="sub-skills-section">

                    <label className="sub-skills-label">

                      Sub-Skills <span className="required">(Required)</span>

                    </label>

                    <p className="sub-skills-instruction">Select sub-skills by moving them between the lists below.</p>

                    <div className="sub-skills-container">

                      <div className="available-sub-skills">

                        <h4>Available Sub-Skills</h4>

                        {availableSubSkillsForModal.length > 0 ? (

                          <ul className="sub-skills-list">

                            {availableSubSkillsForModal.map((subSkill) => (

                              <li key={subSkill} className="sub-skill-item">

                                <span className="sub-skill-text">{subSkill}</span>

                                <button

                                  className="add-sub-skill-btn"

                                  onClick={() => handleAddSubSkill(subSkill)}

                                  aria-label={`Add ${subSkill} to selected sub-skills`}

                                >

                                  <IconPlus size={16} />

                                </button>

                              </li>

                            ))}

                          </ul>

                        ) : (

                          <p className="no-sub-skills">No available sub-skills</p>

                        )}

                      </div>

                      <div className="selected-sub-skills">

                        <h4>Selected Sub-Skills</h4>

                        {selectedSubSkillsForModal.length > 0 ? (

                          <ul className="sub-skills-list">

                            {selectedSubSkillsForModal.map((subSkill) => (

                              <li key={subSkill} className="sub-skill-item">

                                <span className="sub-skill-text">{subSkill}</span>

                                <button

                                  className="remove-sub-skill-btn"

                                  onClick={() => handleRemoveSubSkill(subSkill)}

                                  aria-label={`Remove ${subSkill} from selected sub-skills`}

                                >

                                  <IconMinus size={16} />

                                </button>

                              </li>

                            ))}

                          </ul>

                        ) : (

                          <p className="no-sub-skills">No sub-skills selected</p>

                        )}

                      </div>

                    </div>

                    {errors.sub_skills && <span className="error">{errors.sub_skills}</span>}

                  </div>

                ) : (

                  <p className="no-sub-skills">This skill has no sub-skills. Click Save to continue.</p>

                )}

              </div>

              <div className="modal-footer">

                <button className="save-btn" onClick={handleSaveSkill}>

                  Save

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};



export default JobPostModal;
