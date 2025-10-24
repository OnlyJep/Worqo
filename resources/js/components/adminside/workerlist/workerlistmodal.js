import React, { useState, useEffect, useRef } from "react";
import { Select, Dropdown, Menu } from "antd";
import { IconX, IconChevronDown, IconPlus, IconMinus } from "@tabler/icons-react";
import { TiDeleteOutline } from "react-icons/ti";
import "./../../../../sass/components/workermodal.scss";
import axios from "axios";

const { Option } = Select;

// Custom Select wrapper to handle cleanup
const SafeSelect = ({ children, ...props }) => {
  const selectRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutRefs = useRef([]);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      
      // Clear all timeouts
      timeoutRefs.current.forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
      timeoutRefs.current = [];
      
      // Force cleanup when component unmounts
      try {
        // Clean up any ResizeObserver instances
        if (window.ResizeObserver) {
          const observers = document.querySelectorAll('[data-resize-observer]');
          observers.forEach(observer => {
            if (observer._resizeObserver) {
              observer._resizeObserver.disconnect();
            }
          });
        }
        
        // Force close any open dropdowns
        const dropdowns = document.querySelectorAll('.ant-select-dropdown');
        dropdowns.forEach(dropdown => {
          dropdown.classList.add('ant-select-dropdown-hidden');
          dropdown.style.pointerEvents = 'none';
          dropdown.style.visibility = 'hidden';
          dropdown.style.display = 'none';
        });
        
        // Clean up select components
        const selectComponents = document.querySelectorAll('.ant-select');
        selectComponents.forEach(select => {
          const trigger = select.querySelector('.ant-select-selector');
          if (trigger) {
            trigger.classList.remove('ant-select-focused');
            trigger.classList.remove('ant-select-open');
          }
        });
      } catch (error) {
        console.warn('SafeSelect: Error in cleanup:', error);
      }
    };
  }, []);
  
  return (
    <Select
      ref={selectRef}
      {...props}
      onOpenChange={(open) => {
        if (!isMountedRef.current) return;
        
        try {
          if (!open) {
            // Force close when dropdown is hidden
            const timeoutId = setTimeout(() => {
              if (isMountedRef.current) {
                try {
                  const dropdown = document.querySelector('.ant-select-dropdown');
                  if (dropdown) {
                    dropdown.classList.add('ant-select-dropdown-hidden');
                    dropdown.style.pointerEvents = 'none';
                    dropdown.style.visibility = 'hidden';
                    dropdown.style.display = 'none';
                  }
                } catch (error) {
                  console.warn('SafeSelect: Error closing dropdown:', error);
                }
              }
            }, 10);
            
            // Store timeout for cleanup
            timeoutRefs.current.push(timeoutId);
          }
          
          if (props.onOpenChange) {
            props.onOpenChange(open);
          }
        } catch (error) {
          console.warn('SafeSelect: Error in onOpenChange:', error);
        }
      }}
    >
      {children}
    </Select>
  );
};

const credentialOptions = [
  { value: "Resume/CV", label: "Resume / Curriculum Vitae (CV)" },
  { value: "Birth Certificate", label: "Birth Certificate (PSA-issued)" },
  { value: "Barangay Clearance", label: "Barangay Clearance" },
  { value: "Police Clearance", label: "Police Clearance" },
  { value: "NBI Clearance", label: "NBI Clearance" },
  { value: "Medical Certificate", label: "Medical Certificate / Health Certificate" },
  { value: "SSS Number", label: "SSS Number (Social Security System)" },
  { value: "PhilHealth Number", label: "PhilHealth Number" },
  { value: "Pag-IBIG Number", label: "Pag-IBIG Number (HDMF)" },
  { value: "TIN", label: "TIN (Tax Identification Number)" },
    { value: "Valid Government ID", label: "Valid Government ID (e.g., Passport, Driver's License, Voter's ID, UMID, National ID)" },
];

const experienceOptions = [
  { value: "0-11-months", label: "0 to 11 months" },
  { value: "1-2-years", label: "1 to 2 years" },
  { value: "2-5-years", label: "2 to 5 years" },
  { value: "5-10-years", label: "5 to 10 years" },
  { value: "+-10-years", label: "+10 years" },
];

// Function to format working days in a structured way
const formatWorkingDays = (days) => {
  if (!days || days.length === 0) return '';
  
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = {
    'monday': 'Monday',
    'tuesday': 'Tuesday', 
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday'
  };
  
  // Sort days according to the week order (Monday first)
  const sortedDays = days
    .map(day => day.toLowerCase())
    .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  
  if (sortedDays.length === 0) return '';
  if (sortedDays.length === 1) return dayNames[sortedDays[0]];
  
  // Group consecutive days
  const ranges = [];
  let start = 0;
  
  for (let i = 1; i <= sortedDays.length; i++) {
    if (i === sortedDays.length || dayOrder.indexOf(sortedDays[i]) !== dayOrder.indexOf(sortedDays[i-1]) + 1) {
      if (i - start === 1) {
        // Single day
        ranges.push(dayNames[sortedDays[start]]);
      } else {
        // Range of days
        const startDay = dayNames[sortedDays[start]];
        const endDay = dayNames[sortedDays[i-1]];
        ranges.push(`${startDay}-${endDay}`);
      }
      start = i;
    }
  }
  
  return ranges.join(', ');
};

const WorkerModal = ({ onClose, onSubmit, isEdit, initialData, genders, suffixes, skills }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middlename: "",
    last_name: "",
    suffix_id: "",
    email: "",
    password: "",
    gender_id: "",
    contact_number: "",
    street: "",
    city: "Butuan City",
    province: "Agusan Del Norte",
    postal_code: "8600",
    country: "Philippines",
    profile_img: null,
    work_type: "",
    hours_per_day: 4,
    preferred_working_hours: [],
    bio: "",
      skills_id: [],
      credentials: [],
      role_id: "1",
      is_reviewed: "",
  });
  const [errors, setErrors] = useState({});
  const preferredDaysRef = useRef(null);
  const [apiError, setApiError] = useState("");
  const [newCredential, setNewCredential] = useState({ credentials_name: "", credentials_photo: null, credentials_doc: null });
  const [availableSubSkills, setAvailableSubSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ skill_id: "", sub_skills: [], experience: "" });
  const [showSubSkillsDropdown, setShowSubSkillsDropdown] = useState(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
  const [forceCloseAdditionalDropdown, setForceCloseAdditionalDropdown] = useState(false);
  const [searchTermPrimary, setSearchTermPrimary] = useState("");
  const [searchTermAdditional, setSearchTermAdditional] = useState("");
  const [filteredSkillsPrimary, setFilteredSkillsPrimary] = useState([]);
  const [filteredSkillsAdditional, setFilteredSkillsAdditional] = useState([]);
  const profileImgRef = useRef(null);
  const credentialFileRef = useRef(null);
  const abortControllerRef = useRef(new AbortController());
  const isMountedRef = useRef(true);
  const timeoutRefs = useRef([]);
  const selectRefs = useRef({});
  // Preferred working days native select (no external ref needed)

  // Force close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMountedRef.current) {
        // Check if click is outside any select dropdown
        const isClickOnSelect = event.target.closest('.ant-select') || 
                                event.target.closest('.ant-select-dropdown') ||
                                event.target.closest('.ant-select-item');
        
        if (!isClickOnSelect) {
          // Force close all dropdowns
          const dropdowns = document.querySelectorAll('.ant-select-dropdown');
          dropdowns.forEach(dropdown => {
            dropdown.classList.add('ant-select-dropdown-hidden');
            dropdown.style.pointerEvents = 'none';
            dropdown.style.visibility = 'hidden';
            dropdown.style.display = 'none';
          });
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Additional cleanup for Ant Design components
  useEffect(() => {
    return () => {
      // Force cleanup of all Ant Design components
      if (isMountedRef.current) {
        isMountedRef.current = false;
      }
      
      // Remove all Ant Design dropdowns and overlays
      const antdElements = document.querySelectorAll('.ant-select-dropdown, .ant-dropdown, .ant-tooltip, .ant-popover');
      antdElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      
      // Clear any remaining ResizeObserver instances
      if (window.ResizeObserver) {
        const observers = document.querySelectorAll('[data-resize-observer]');
        observers.forEach(observer => {
          if (observer._resizeObserver) {
            observer._resizeObserver.disconnect();
          }
        });
      }
    };
  }, []);

  // Specific cleanup for experience dropdown to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up experience dropdown specifically
      const experienceDropdown = document.querySelector('.skill-experience-flow-select .ant-select-dropdown');
      if (experienceDropdown) {
        experienceDropdown.classList.add('ant-select-dropdown-hidden');
        experienceDropdown.style.pointerEvents = 'none';
        experienceDropdown.style.visibility = 'hidden';
        experienceDropdown.style.display = 'none';
      }
      
      // Clean up any ResizeObserver instances related to experience dropdown
      if (window.ResizeObserver) {
        const experienceSelect = document.querySelector('.skill-experience-flow-select');
        if (experienceSelect) {
          const observer = experienceSelect._resizeObserver;
          if (observer) {
            observer.disconnect();
          }
        }
      }
    };
  }, [showExperienceDropdown]);

  // Use skills from props or fetch from API
  const [skillsState, setSkillsState] = useState(skills || []);
  
  const fetchSkills = async () => {
    if (!isMountedRef.current) return;
    try {
      const response = await axios.get("/api/skills", {
        signal: abortControllerRef.current.signal,
      });
      const fetchedSkills = response.data.map((skill) => ({
        ...skill,
        sub_skills: Array.isArray(skill.sub_skills) ? skill.sub_skills : [],
      }));
      if (isMountedRef.current) {
        setSkillsState(fetchedSkills);
        setFilteredSkillsPrimary(fetchedSkills);
        setFilteredSkillsAdditional(fetchedSkills);
      }
    } catch (error) {
      if (error.name !== "AbortError" && isMountedRef.current) {
        console.error("Error fetching skills:", error);
        setApiError("Failed to load skills. Please try again.");
      }
    }
  };


  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();
    fetchSkills();
    
    // Initialize filtered skills with props if available
    if (skills && skills.length > 0) {
      setSkillsState(skills);
      setFilteredSkillsPrimary(skills);
      setFilteredSkillsAdditional(skills);
    }

    if (isEdit && initialData) {
      // Handle skills_id structure - it can be an object with primary_skills and additional_skills
      let initialSkills = [];
      if (initialData.worker?.skills_id) {
        if (initialData.worker.skills_id.primary_skills || initialData.worker.skills_id.additional_skills) {
          // New structured format
          const primarySkills = initialData.worker.skills_id.primary_skills || [];
          const additionalSkills = initialData.worker.skills_id.additional_skills || [];
          initialSkills = [...primarySkills, ...additionalSkills];
        } else if (Array.isArray(initialData.worker.skills_id)) {
          // Old array format
          initialSkills = initialData.worker.skills_id;
        }
      }

      // Ensure preferred_working_days is always an array (use preferred_working_days for consistency with table display)
      let preferredWorkingDays = initialData.worker?.preferred_working_days || initialData.worker?.preferred_working_hours || [];
      
      // Handle different data formats
      if (typeof preferredWorkingDays === 'string') {
        try {
          preferredWorkingDays = JSON.parse(preferredWorkingDays);
        } catch (e) {
          // If JSON parsing fails, try to handle as comma-separated string
          if (preferredWorkingDays.includes(',')) {
            preferredWorkingDays = preferredWorkingDays.split(',').map(day => day.trim().toLowerCase());
          } else if (preferredWorkingDays.trim()) {
            preferredWorkingDays = [preferredWorkingDays.trim().toLowerCase()];
          } else {
            preferredWorkingDays = [];
          }
        }
      }
      
      // Ensure it's always an array and normalize the values
      if (!Array.isArray(preferredWorkingDays)) {
        preferredWorkingDays = [];
      }
      
      // Normalize day names to lowercase
      preferredWorkingDays = preferredWorkingDays
        .map(day => day.toLowerCase().trim())
        .filter(day => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day));
      
      if (isMountedRef.current) {
        const newFormData = {
          first_name: initialData.profile?.first_name || "",
          middlename: initialData.profile?.middlename || "",
          last_name: initialData.profile?.last_name || "",
          suffix_id: initialData.profile?.suffix_id ? String(initialData.profile.suffix_id) : "",
          email: initialData.email || "",
          password: "",
          gender_id: initialData.profile?.gender_id ? String(initialData.profile.gender_id) : "",
          contact_number: initialData.profile?.contact_number || "",
          street: initialData.profile?.street || "",
          city: initialData.profile?.city || "Butuan City",
          province: initialData.profile?.province || "Agusan Del Norte",
          postal_code: initialData.profile?.postal_code || "8600",
          country: initialData.profile?.country || "Philippines",
          profile_img: initialData.profile?.profile_img || null,
          work_type: initialData.worker?.work_type || "",
          hours_per_day: initialData.worker?.hours_per_day || 4,
          preferred_working_hours: preferredWorkingDays,
          bio: initialData.worker?.bio || "",
          skills_id: initialSkills,
          credentials: Array.isArray(initialData.worker?.credentials_name) && 
            (Array.isArray(initialData.worker?.credentials_photo) || Array.isArray(initialData.worker?.credentials_doc))
            ? initialData.worker.credentials_name.map((name, index) => ({
                credentials_name: name || "",
                credentials_photo: initialData.worker.credentials_photo?.[index] || null,
                credentials_doc: initialData.worker.credentials_doc?.[index] || null,
              }))
            : [],
          role_id: "1",
          is_reviewed: (initialData.worker?.is_reviewed === null || initialData.worker?.is_reviewed === 'TO BE REVIEWED' || initialData.worker?.is_reviewed === '0') ? '' : (initialData.worker?.is_reviewed || ''),
        };
        
        
        setFormData(newFormData);
        setApiError("");
        setErrors({});
      }
    }

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current.abort();
      // Clear all timeouts
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current = [];
      
      // Force close all dropdowns on unmount
      const dropdowns = document.querySelectorAll('.ant-select-dropdown');
      dropdowns.forEach(dropdown => {
        dropdown.classList.add('ant-select-dropdown-hidden');
        dropdown.style.pointerEvents = 'none';
        dropdown.style.visibility = 'hidden';
        dropdown.style.display = 'none';
      });
      
      // Force cleanup of all Ant Design Select components
      const selectComponents = document.querySelectorAll('.ant-select');
      selectComponents.forEach(select => {
        // Force close any open dropdowns
        const trigger = select.querySelector('.ant-select-selector');
        if (trigger) {
          trigger.classList.remove('ant-select-focused');
          trigger.classList.remove('ant-select-open');
        }
        
        // Remove any event listeners
        const clonedSelect = select.cloneNode(true);
        select.parentNode.replaceChild(clonedSelect, select);
      });
      
      // Clear any remaining observers
      if (window.ResizeObserver) {
        const observers = document.querySelectorAll('[data-resize-observer]');
        observers.forEach(observer => {
          if (observer._resizeObserver) {
            observer._resizeObserver.disconnect();
          }
        });
      }
    };
  }, [isEdit, initialData, skills]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    if (searchTermPrimary.trim() === "") {
      setFilteredSkillsPrimary(skillsState || []);
    } else {
      const searchLower = searchTermPrimary.toLowerCase().trim();
      const filtered = (skillsState || []).filter((skill) => skill.name.toLowerCase().includes(searchLower));
      setFilteredSkillsPrimary(filtered);
    }
  }, [searchTermPrimary, skillsState]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    let skillsToFilter = skillsState || [];
    if (formData.skills_id[0]?.skill_id) {
      skillsToFilter = skillsToFilter.filter((s) => String(s.id) !== formData.skills_id[0].skill_id);
    }
    if (searchTermAdditional.trim() === "") {
      setFilteredSkillsAdditional(skillsToFilter);
    } else {
      const searchLower = searchTermAdditional.toLowerCase().trim();
      const filtered = skillsToFilter.filter((skill) => skill.name.toLowerCase().includes(searchLower));
      setFilteredSkillsAdditional(filtered);
    }
  }, [searchTermAdditional, skillsState, formData.skills_id]);

  // Close preferred working days dropdown when clicking outside
  // removed outside click handler (no custom dropdown anymore)

  const handlePrimarySkillSelect = (value) => {
    if (!isMountedRef.current) return;
    
    // If value is null/undefined, clear the primary skill
    if (!value) {
      if (isMountedRef.current) {
        setFormData((prev) => ({
          ...prev,
          skills_id: prev.skills_id.slice(1) // Remove the first skill (primary) and keep additional skills
        }));
        setNewSkill({ skill_id: "", sub_skills: [], experience: "" });
        setAvailableSubSkills([]);
        setShowSubSkillsDropdown(false);
        setShowExperienceDropdown(false);
        setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
      }
      return;
    }
    
    const skill = skillsState.find((s) => String(s.id) === value);
    if (!skill) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, skills_id: "Invalid skill selected. Please try again." }));
      }
      return;
    }
    
    // Check if this skill is already selected as additional skill
    const isAlreadyAdditional = formData.skills_id.slice(1).some((existing) => existing.skill_id === value);
    if (isAlreadyAdditional) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, skills_id: "This skill is already selected as an additional skill. Please remove it first." }));
      }
      return;
    }
    
    if (isMountedRef.current) {
      setNewSkill({
        skill_id: value,
        skill_name: skill.name,
        sub_skills: [],
        experience: ""
      });
      setAvailableSubSkills(skill.sub_skills || []);
      setShowSubSkillsDropdown(true);
      setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
    }
  };

  const handleSubSkillsSelect = (values) => {
    if (!isMountedRef.current) return;
      if (isMountedRef.current) {
      setNewSkill(prev => ({ ...prev, sub_skills: values }));
      setShowSubSkillsDropdown(false);
      setShowExperienceDropdown(true);
      setErrors((prev) => ({ ...prev, sub_skills: "" }));
    }
  };

  const handleExperienceSelect = (value) => {
    if (!isMountedRef.current) return;
    console.log('Experience selected:', value);
    
      if (isMountedRef.current) {
      setNewSkill(prev => {
        const updated = { ...prev, experience: value };
        console.log('Updated skill with experience:', updated);
        
        // Use requestAnimationFrame to ensure DOM updates are complete
        if (isMountedRef.current) {
          const timeoutId = setTimeout(() => {
            if (isMountedRef.current) {
          addSkillToFormWithSkill(updated);
            }
        }, 0);
          timeoutRefs.current.push(timeoutId);
        }
        return updated;
      });
      
      // Close experience dropdown after selection
      if (isMountedRef.current) {
      setShowExperienceDropdown(false);
      }
    }
  };

  const addSkillToForm = () => {
    if (!isMountedRef.current) return;
    console.log('Adding skill to form:', newSkill);
    if (isMountedRef.current) {
      setFormData((prev) => {
        // For primary skill, always replace the first skill (index 0)
        const updatedSkills = [newSkill, ...prev.skills_id.slice(1)];
        console.log('Updated skills array:', updatedSkills);
          return {
            ...prev,
          skills_id: updatedSkills,
        };
      });
      setNewSkill({ skill_id: "", sub_skills: [], experience: "" });
      setAvailableSubSkills([]);
      setShowSubSkillsDropdown(false);
      setShowExperienceDropdown(false);
      setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
    }
  };

  const addSkillToFormWithSkill = (skillToAdd) => {
    if (!isMountedRef.current) return;
    console.log('Adding skill to form with skill:', skillToAdd);
    if (isMountedRef.current) {
      setFormData((prev) => {
        // Check if this is a primary skill (no existing primary) or additional skill
        const hasPrimarySkill = prev.skills_id[0]?.skill_id;
        const isPrimarySkill = !hasPrimarySkill || prev.skills_id[0].skill_id === skillToAdd.skill_id;
        
        if (isPrimarySkill) {
          // For primary skill, always replace the first skill (index 0)
          const updatedSkills = [skillToAdd, ...prev.skills_id.slice(1)];
          console.log('Updated skills array with primary skill:', updatedSkills);
          return {
            ...prev,
          skills_id: updatedSkills,
          };
        } else {
          // For additional skill, update existing or add new
          const existingIndex = prev.skills_id.findIndex(skill => skill.skill_id === skillToAdd.skill_id);
          let updatedSkills;
          
          if (existingIndex > 0) {
            // Update existing additional skill
            updatedSkills = [...prev.skills_id];
            updatedSkills[existingIndex] = skillToAdd;
            console.log('Updated existing additional skill:', updatedSkills);
          } else {
            // Add new additional skill
            updatedSkills = [...prev.skills_id, skillToAdd];
            console.log('Added new additional skill:', updatedSkills);
          }
          
          return {
            ...prev,
            skills_id: updatedSkills,
          };
        }
      });
      setNewSkill({ skill_id: "", sub_skills: [], experience: "" });
      setAvailableSubSkills([]);
      setShowSubSkillsDropdown(false);
      setShowExperienceDropdown(false);
      setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
    }
  };

  const cancelSkillSelection = () => {
    if (!isMountedRef.current) return;
    if (isMountedRef.current) {
      setNewSkill({ skill_id: "", sub_skills: [], experience: "" });
      setShowSubSkillsDropdown(false);
      setShowExperienceDropdown(false);
      setAvailableSubSkills([]);
      setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
    }
  };

  const handleAdditionalSkillsSelect = (values) => {
    if (!isMountedRef.current) return;
    
    // Get currently selected additional skills
    const currentAdditionalSkills = formData.skills_id.slice(1).map(skill => skill.skill_id);
    
    // Find the newly added skill (if any)
    const newSkillId = values.find(id => !currentAdditionalSkills.includes(id));
    
    if (newSkillId) {
      // Check if this skill is already selected as primary skill
      const isPrimarySkill = formData.skills_id[0]?.skill_id === newSkillId;
      if (isPrimarySkill) {
        if (isMountedRef.current) {
          setErrors((prev) => ({ ...prev, skills_id: "This skill is already selected as the primary skill." }));
        }
        return;
      }
      
      const skill = skillsState.find((s) => String(s.id) === newSkillId);
      if (!skill) {
      if (isMountedRef.current) {
          setErrors((prev) => ({ ...prev, skills_id: "Invalid skill selected. Please try again." }));
      }
      return;
    }
    if (isMountedRef.current) {
        setNewSkill({
          skill_id: newSkillId,
          skill_name: skill.name,
          sub_skills: [],
          experience: ""
        });
        setAvailableSubSkills(skill.sub_skills || []);
        setShowSubSkillsDropdown(true);
        setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
      }
    }
  };

  // New function to handle multiple additional skills selection
  const handleMultipleAdditionalSkillsSelect = (values) => {
    if (!isMountedRef.current) return;
    
    // Get currently selected additional skills
    const currentAdditionalSkills = formData.skills_id.slice(1).map(skill => skill.skill_id);
    
    // Find all newly added skills
    const newSkillIds = values.filter(id => !currentAdditionalSkills.includes(id));
    
    if (newSkillIds.length > 0) {
      // Check if any of the new skills are already selected as primary skill
      const isAnyPrimarySkill = newSkillIds.some(id => formData.skills_id[0]?.skill_id === id);
      if (isAnyPrimarySkill) {
        if (isMountedRef.current) {
          setErrors((prev) => ({ ...prev, skills_id: "One or more skills are already selected as the primary skill." }));
        }
        return;
      }
      
      // Add all new skills to the form data immediately
      const newSkills = newSkillIds.map(skillId => {
        const skill = skillsState.find((s) => String(s.id) === skillId);
        return {
          skill_id: skillId,
          skill_name: skill?.name || 'Unknown Skill',
          sub_skills: [],
          experience: "0-11-months" // Default experience
        };
      });
      
      if (isMountedRef.current) {
        setFormData((prev) => {
          const updatedSkills = [...prev.skills_id.slice(0, 1), ...prev.skills_id.slice(1), ...newSkills];
          console.log('Recording additional skills:', newSkills);
          console.log('Updated skills array:', updatedSkills);
          return {
            ...prev,
            skills_id: updatedSkills
          };
        });
        
        // Force close the additional skills dropdown immediately
        setForceCloseAdditionalDropdown(true);
        const timeoutId = setTimeout(() => {
          if (isMountedRef.current) {
            setForceCloseAdditionalDropdown(false);
            const dropdown = document.querySelector('.additional-skills-select .ant-select-dropdown');
            if (dropdown) {
              dropdown.classList.add('ant-select-dropdown-hidden');
              dropdown.style.pointerEvents = 'none';
              dropdown.style.visibility = 'hidden';
              dropdown.style.display = 'none';
            }
          }
        }, 50);
        timeoutRefs.current.push(timeoutId);
        
        // Process the first new skill for detailed sub-skills and experience selection
        const firstNewSkillId = newSkillIds[0];
        const skill = skillsState.find((s) => String(s.id) === firstNewSkillId);
        if (skill) {
          setNewSkill({
            skill_id: firstNewSkillId,
            skill_name: skill.name,
            sub_skills: [],
            experience: ""
          });
          setAvailableSubSkills(skill.sub_skills || []);
          
          // Show sub-skills dropdown after a short delay
          const showSubSkillsTimeout = setTimeout(() => {
            if (isMountedRef.current) {
              setShowSubSkillsDropdown(true);
            }
          }, 100);
          timeoutRefs.current.push(showSubSkillsTimeout);
        }
        
        setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
      }
    }
  };


  const handleInputChange = (e, field) => {
    if (!isMountedRef.current) return;
    let value;
    if (e && e.target) {
      value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    } else {
      value = e || "";
    }
    if (field === "contact_number" && value && !/^\+?[\d\s-]*$/.test(value)) {
      return;
    }
    if (field === "profile_img" && value) {
      if (value.size > 2048 * 1024) {
        if (isMountedRef.current) {
          setErrors((prev) => ({ ...prev, profile_img: "Image must not exceed 2 MB." }));
        }
        return;
      }
      if (!["image/jpeg", "image/png", "image/jpg"].includes(value.type)) {
        if (isMountedRef.current) {
          setErrors((prev) => ({ ...prev, profile_img: "Image must be JPEG, PNG, or JPG." }));
        }
        return;
      }
    }
    if (isMountedRef.current) {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        
        // Auto-set hours per day and preferred working days based on work type
        if (field === "work_type") {
          if (value === "full-time") {
            newData.hours_per_day = 8;
            newData.preferred_working_hours = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          } else if (value === "part-time") {
            newData.hours_per_day = 4;
            // Clear preferred working days for part-time to let user choose
            newData.preferred_working_hours = [];
          } else if (value === "one-time") {
            newData.hours_per_day = 1;
            // Clear preferred working days for one-time to let user choose
            newData.preferred_working_hours = [];
          }
        }
        
        return newData;
      });
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setApiError("");
    }
  };

  const handleNewCredentialChange = (e, field) => {
    if (!isMountedRef.current) return;
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    
    if (field === "credentials_photo" && value) {
      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
        ].includes(value.type)
      ) {
        if (isMountedRef.current) {
          setErrors((prev) => ({
            ...prev,
            new_credential_photo: "Credential photo must be PDF, Word, JPG, or PNG.",
          }));
        }
        return;
      }
      if (value.size > 2048 * 1024) {
        if (isMountedRef.current) {
          setErrors((prev) => ({
            ...prev,
            new_credential_photo: "Credential photo must not exceed 2 MB.",
          }));
        }
        return;
      }
    }
    
    if (field === "credentials_doc" && value) {
      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(value.type)
      ) {
        if (isMountedRef.current) {
          setErrors((prev) => ({
            ...prev,
            new_credential_doc: "Credential document must be PDF or Word document.",
          }));
        }
        return;
      }
      if (value.size > 2048 * 1024) {
        if (isMountedRef.current) {
          setErrors((prev) => ({
            ...prev,
            new_credential_doc: "Credential document must not exceed 2 MB.",
          }));
        }
        return;
      }
    }
    
    if (isMountedRef.current) {
      setNewCredential((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ 
        ...prev, 
        new_credential_name: "", 
        new_credential_photo: "",
        new_credential_doc: ""
      }));
    }
  };

  const addCredential = () => {
    if (!isMountedRef.current) return;
    if (!newCredential.credentials_name) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, new_credential_name: "Please select a credential type." }));
      }
      return;
    }
    if (!newCredential.credentials_photo && !newCredential.credentials_doc) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, new_credential_photo: "Please upload a credential file (photo or document)." }));
      }
      return;
    }
    if (isMountedRef.current) {
      setFormData((prev) => ({
        ...prev,
        credentials: [...prev.credentials, newCredential],
      }));
      setNewCredential({ credentials_name: "", credentials_photo: null, credentials_doc: null });
      setErrors((prev) => ({ 
        ...prev, 
        new_credential_name: "", 
        new_credential_photo: "",
        new_credential_doc: ""
      }));
      if (credentialFileRef.current) {
        credentialFileRef.current.value = "";
      }
    }
  };

  const removeCredential = (index) => {
    if (!isMountedRef.current) return;
    if (isMountedRef.current) {
      setFormData((prev) => ({
        ...prev,
        credentials: prev.credentials.filter((_, i) => i !== index),
      }));
      setErrors((prev) => ({ ...prev, credentials: "" }));
    }
  };


  const removeProfileImg = () => {
    if (!isMountedRef.current) return;
    if (isMountedRef.current) {
      setFormData((prev) => ({ ...prev, profile_img: null }));
      setErrors((prev) => ({ ...prev, profile_img: "" }));
      if (profileImgRef.current) {
        profileImgRef.current.value = "";
      }
    }
  };

  const validateForm = () => {
    if (!isMountedRef.current) return false;
    const newErrors = {};
    if (!formData.first_name) newErrors.first_name = "First name is required.";
    if (!formData.last_name) newErrors.last_name = "Last name is required.";
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }
    if (!isEdit && !formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters with 1 uppercase letter and 1 digit.";
    }
    // Gender is optional - removed required validation
    if (!formData.work_type) newErrors.work_type = "Work type is required.";
    
    // Validate hours per day
    if (!formData.hours_per_day || formData.hours_per_day < 1 || formData.hours_per_day > 24) {
      newErrors.hours_per_day = "Hours per day must be between 1 and 24.";
    }
    
    if (formData.contact_number && !/^\+?[\d\s-]{7,20}$/.test(formData.contact_number)) {
      newErrors.contact_number = "Contact number must be 7-20 digits, spaces, or hyphens.";
    }
    if (!formData.skills_id || formData.skills_id.length === 0 || !formData.skills_id[0]?.skill_id) {
      newErrors.skills_id = "At least one primary skill is required.";
    }
    if (isMountedRef.current) {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMountedRef.current || !validateForm()) return;

    const submitData = new FormData();
    submitData.append("first_name", formData.first_name || "");
    submitData.append("last_name", formData.last_name || "");
    submitData.append("email", formData.email || "");
    submitData.append("gender_id", formData.gender_id || "");
    submitData.append("work_type", formData.work_type || "");
    submitData.append("hours_per_day", formData.hours_per_day || "");
    submitData.append("preferred_working_days", JSON.stringify(formData.preferred_working_hours || []));
    submitData.append("bio", formData.bio || "");
    submitData.append("role_id", formData.role_id);
    submitData.append("skills_id", JSON.stringify(formData.skills_id || []));
    submitData.append("is_reviewed", formData.is_reviewed || "TO BE REVIEWED");
    if (isEdit) {
      submitData.append("_method", "PUT");
    }

    if (formData.middlename) submitData.append("middlename", formData.middlename);
    if (formData.suffix_id) submitData.append("suffix_id", formData.suffix_id);
    if (formData.contact_number) submitData.append("contact_number", formData.contact_number);
    if (formData.street) submitData.append("street", formData.street);
    if (formData.city) submitData.append("city", formData.city);
    if (formData.province) submitData.append("province", formData.province);
    if (formData.postal_code) submitData.append("postal_code", formData.postal_code);
    if (formData.country) submitData.append("country", formData.country);
    if (formData.password) {
      submitData.append("password", formData.password);
    }

    if (formData.profile_img && formData.profile_img instanceof File) {
      submitData.append("profile_img", formData.profile_img);
    } else if (!formData.profile_img && isEdit) {
      submitData.append("profile_img", "");
    }

    if (formData.credentials.length > 0) {
      formData.credentials.forEach((cred, index) => {
        submitData.append(`credentials[${index}][credentials_name]`, cred.credentials_name);
        if (cred.credentials_photo instanceof File) {
          submitData.append(`credentials[${index}][credentials_photo]`, cred.credentials_photo);
        }
        if (cred.credentials_doc instanceof File) {
          submitData.append(`credentials[${index}][credentials_doc]`, cred.credentials_doc);
        }
      });
    }

    try {
      await onSubmit(submitData, isEdit ? initialData.id : null, abortControllerRef.current.signal);
      if (isMountedRef.current) {
        setApiError("");
        setErrors({});
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      if (isMountedRef.current) {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
          setApiError("Please correct the errors in the form.");
        } else {
          setApiError(error.response?.data?.error || "An error occurred. Please try again.");
        }
      }
    }
  };

  const isGendersLoaded = Array.isArray(genders);
  const isSuffixesLoaded = Array.isArray(suffixes);
  const isSkillsLoaded = Array.isArray(skillsState) && skillsState.length > 0;
  const isImageFile = (path) => /\.(jpg|jpeg|png)$/i.test(path);

  const skillMenu = (skill) => ({
    items: [
      {
        key: "edit",
        label: "Edit",
        onClick: () => {
          if (!isMountedRef.current) return;
          const foundSkill = skillsState.find((s) => String(s.id) === String(skill.skill_id));
          if (foundSkill) {
            setSelectedSkill({
              ...foundSkill,
              experience: skill.experience || '0-11-months',
              hourly_rate: skill.hourly_rate || ''
            });
            const currentSubSkills = Array.isArray(skill.sub_skills) ? skill.sub_skills : [];
            setAvailableSubSkills(
              (foundSkill.sub_skills || []).filter((subSkill) => !currentSubSkills.includes(subSkill))
            );
            setSelectedSubSkills(currentSubSkills);
            setShowSkillModal(true);
          }
        },
      },
      {
        key: "remove",
        label: "Remove",
        onClick: () => {
          if (!isMountedRef.current) return;
          setFormData((prev) => ({
            ...prev,
            skills_id: prev.skills_id.filter((s) => s.skill_id !== skill.skill_id),
          }));
        },
      },
    ],
  });

  return (
    <div className="worker-modal-overlay">
      <div className="worker-modal">
        <h2>{isEdit ? "Edit Worker Profile" : "Create Worker Profile"}</h2>
        {apiError && <div className="error">{apiError}</div>}
        {!isGendersLoaded || !isSuffixesLoaded || !isSkillsLoaded ? (
          <div className="error">Error: Required data (gender, suffix, or skills) not loaded. Please try again later.</div>
        ) : (
          <form className="worker-modal-form" onSubmit={handleSubmit}>
            <div className="worker-modal-content">
              <div className="form-section worker-modal-form-personal-info">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name <span className="required">*</span></label>
                    <input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange(e, "first_name")}
                      required
                    />
                    {errors.first_name && <span className="error">{errors.first_name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="middlename">Middle Name</label>
                    <input
                      id="middlename"
                      type="text"
                      value={formData.middlename}
                      onChange={(e) => handleInputChange(e, "middlename")}
                    />
                    {errors.middlename && <span className="error">{errors.middlename}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name <span className="required">*</span></label>
                    <input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange(e, "last_name")}
                      required
                    />
                    {errors.last_name && <span className="error">{errors.last_name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="suffix_id">Suffix</label>
                    <select
                      id="suffix_id"
                      value={formData.suffix_id || ""}
                      onChange={(e) => handleInputChange(e.target.value, "suffix_id")}
                      className="credential-dropdown"
                    >
                      <option value="">None</option>
                      {suffixes.map((suffix) => (
                        <option key={suffix.id} value={String(suffix.id)}>
                          {suffix.suffix_name || suffix.name}
                        </option>
                      ))}
                    </select>
                    {errors.suffix_id && <span className="error">{errors.suffix_id}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email <span className="required">*</span></label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange(e, "email")}
                      required
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">{isEdit ? "New Password" : "Password"} <span className="required">{isEdit ? "" : "*"}</span></label>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange(e, "password")}
                      required={!isEdit}
                    />
                    {errors.password && <span className="error">{errors.password}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gender_id">Gender</label>
                    <select
                      id="gender_id"
                      value={formData.gender_id || ""}
                      onChange={(e) => handleInputChange(e.target.value, "gender_id")}
                      className="credential-dropdown"
                      required
                    >
                      <option value="">Select Gender</option>
                      {genders.map((gender) => (
                        <option key={gender.id} value={String(gender.id)}>
                          {gender.name || gender.gender_name}
                        </option>
                      ))}
                    </select>
                    {errors.gender_id && <span className="error">{errors.gender_id}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact_number">Contact Number</label>
                    <input
                      id="contact_number"
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) => handleInputChange(e, "contact_number")}
                      placeholder="+123-456-7890"
                    />
                    {errors.contact_number && <span className="error">{errors.contact_number}</span>}
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h3>Address</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="street">Street</label>
                    <input
                      id="street"
                      type="text"
                      value={formData.street}
                      onChange={(e) => handleInputChange(e, "street")}
                    />
                    {errors.street && <span className="error">{errors.street}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input id="city" type="text" value={formData.city} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="province">Province</label>
                    <input id="province" type="text" value={formData.province} disabled />
                  </div>
                  <div className="form-group">
                    <label htmlFor="postal_code">Postal Code</label>
                    <input id="postal_code" type="text" value={formData.postal_code} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input id="country" type="text" value={formData.country} disabled />
                  </div>
                </div>
              </div>
              <div className="form-section worker-modal-form-work-info">
                <h3>Work Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="work_type">Work Type <span className="required">*</span></label>
                    <select
                      id="work_type"
                      value={formData.work_type}
                      onChange={(e) => handleInputChange(e, "work_type")}
                      className="credential-dropdown"
                      required
                    >
                      <option value="">Select Work Type</option>
                      <option value="part-time">Part Time</option>
                      <option value="full-time">Full Time</option>
                      <option value="one-time">One Time </option>
                    </select>
                    {errors.work_type && <span className="error">{errors.work_type}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="role_id">Role</label>
                    <select id="role_id" value={formData.role_id} disabled className="credential-dropdown">
                      <option value="1">Worker</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hours_per_day">Hours Per Day</label>
                    <input
                      id="hours_per_day"
                      type="number"
                      value={formData.hours_per_day}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1 && value <= 24) {
                          handleInputChange(e, "hours_per_day");
                        } else if (e.target.value === '') {
                          handleInputChange(e, "hours_per_day");
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (value < 1 || value > 24) {
                          setErrors(prev => ({
                            ...prev,
                            hours_per_day: "Hours per day must be between 1 and 24."
                          }));
                        } else {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.hours_per_day;
                            return newErrors;
                          });
                        }
                      }}
                      min="1"
                      max="24"
                      step="1"
                      disabled={formData.work_type === 'full-time'}
                    />
                    {formData.work_type === 'full-time' && (
                      <span className="help-text">Full-time automatically set to 8 hours per day</span>
                    )}
                    {errors.hours_per_day && <span className="error">{errors.hours_per_day}</span>}
                  </div>
                  <div className="form-group preferred-working-days worker-modal-form-work-info">
                    <label htmlFor="preferred_working_days">Preferred Working Days</label>
                     <SafeSelect
                      id="preferred_working_days"
                      mode="multiple"
                      placeholder="Select Preferred Working Days"
                      value={formData.preferred_working_hours || []}
                      onChange={(values) => handleInputChange(values, "preferred_working_hours")}
                      className="preferred-working-days-dropdown"
                      showSearch={false}
                       allowClear={false}
                       disabled={false}
                       open={undefined}
                       styles={{ 
                         popup: { root: { zIndex: 3000 } },
                         selector: { cursor: 'pointer' }
                       }}
                       onOpenChange={(open) => {
                         if (isMountedRef.current) {
                           if (open) {
                             // Ensure dropdown is visible and clickable
                             const timeoutId = setTimeout(() => {
                               if (isMountedRef.current) {
                                 const dropdown = document.querySelector('.preferred-working-days-dropdown .ant-select-dropdown');
                                 if (dropdown) {
                                   dropdown.classList.remove('ant-select-dropdown-hidden');
                                   dropdown.style.pointerEvents = 'auto';
                                   dropdown.style.visibility = 'visible';
                                   dropdown.style.display = 'block';
                                   dropdown.style.zIndex = '3000';
                                 }
                               }
                             }, 10);
                             timeoutRefs.current.push(timeoutId);
                           } else {
                             // Ensure dropdown is properly hidden when closing
                             const timeoutId = setTimeout(() => {
                               if (isMountedRef.current) {
                                 const dropdown = document.querySelector('.preferred-working-days-dropdown .ant-select-dropdown');
                                 if (dropdown) {
                                   dropdown.classList.add('ant-select-dropdown-hidden');
                                   dropdown.style.pointerEvents = 'none';
                                   dropdown.style.visibility = 'hidden';
                                   dropdown.style.display = 'none';
                                 }
                               }
                             }, 10);
                             timeoutRefs.current.push(timeoutId);
                           }
                         }
                       }}
                       tagRender={(props) => {
                         const { label, closable, onClose } = props;
                         return (
                           <span className="ant-select-selection-item">
                             {label}
                             {closable && (
                               <span className="ant-select-selection-item-remove" onClick={onClose}>
                                 ×
                               </span>
                             )}
                           </span>
                         );
                       }}
                       maxTagCount="responsive"
                       maxTagTextLength={20}
                       getPopupContainer={(trigger) => trigger.parentElement}
                    >
                      <Option value="monday">Monday</Option>
                      <Option value="tuesday">Tuesday</Option>
                      <Option value="wednesday">Wednesday</Option>
                      <Option value="thursday">Thursday</Option>
                      <Option value="friday">Friday</Option>
                      <Option value="saturday">Saturday</Option>
                      <Option value="sunday">Sunday</Option>
                     </SafeSelect>
                     {formData.preferred_working_hours && formData.preferred_working_hours.length > 0 && (
                       <div className="working-days-display">
                         <span className="working-days-label">Selected Days:</span>
                         <span className="working-days-formatted">{formatWorkingDays(formData.preferred_working_hours)}</span>
                       </div>
                     )}
                    {errors.preferred_working_hours && <span className="error">{errors.preferred_working_hours}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="is_reviewed">Status</label>
                    <select
                      id="is_reviewed"
                      value={formData.is_reviewed}
                      onChange={(e) => handleInputChange(e.target.value, "is_reviewed")}
                      className="credential-dropdown"
                    >
                      <option value="">TO BE REVIEWED</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="DECLINED">DECLINED</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange(e, "bio")}
                      placeholder="Tell us about yourself..."
                      rows="3"
                      maxLength="1000"
                    />
                    <span className="help-text">Optional: Describe your background and experience</span>
                    {errors.bio && <span className="error">{errors.bio}</span>}
                  </div>
                </div>
              </div>
              <div className="form-section worker-modal-form-skills-info">
                <h3>Skills</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="primary_skill">Primary Skill (One Only) <span className="required">*</span></label>
                    <SafeSelect
                      id="primary_skill"
                      placeholder={filteredSkillsPrimary.length === 0 ? "Loading skills..." : "Select primary skill"}
                      onChange={handlePrimarySkillSelect}
                      showSearch={false}
                      required
                      value={formData.skills_id[0]?.skill_id || undefined}
                      className="primary-skill-select"
                      loading={filteredSkillsPrimary.length === 0}
                      notFoundContent={filteredSkillsPrimary.length === 0 ? "No skills available" : "No skills found"}
                      allowClear={true}
                      styles={{
                        popup: {
                          root: {
                            zIndex: 3000
                          }
                        }
                      }}
                      getPopupContainer={(trigger) => trigger.parentElement}
                      onOpenChange={(open) => {
                        if (isMountedRef.current) {
                        if (open) {
                            // Force dropdown to be visible when opening
                            const timeoutId = setTimeout(() => {
                              if (isMountedRef.current) {
                            const dropdown = document.querySelector('.primary-skill-select .ant-select-dropdown');
                            if (dropdown) {
                              dropdown.classList.remove('ant-select-dropdown-hidden');
                              dropdown.style.pointerEvents = 'auto';
                              dropdown.style.visibility = 'visible';
                              dropdown.style.display = 'block';
                                }
                            }
                          }, 10);
                            timeoutRefs.current.push(timeoutId);
                          } else {
                            // Ensure dropdown is properly hidden when closing
                            const timeoutId = setTimeout(() => {
                              if (isMountedRef.current) {
                                const dropdown = document.querySelector('.primary-skill-select .ant-select-dropdown');
                                if (dropdown) {
                                  dropdown.classList.add('ant-select-dropdown-hidden');
                                  dropdown.style.pointerEvents = 'none';
                                  dropdown.style.visibility = 'hidden';
                                  dropdown.style.display = 'none';
                                }
                              }
                            }, 10);
                            timeoutRefs.current.push(timeoutId);
                          }
                        }
                      }}
                    >
                      {filteredSkillsPrimary.map((skill) => (
                        <Option key={skill.id} value={String(skill.id)}>
                          {skill.name}
                        </Option>
                      ))}
                    </SafeSelect>
                    {errors.skills_id && <span className="error">{errors.skills_id}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="additional_skills">Additional Skills</label>
                    <SafeSelect
                      id="additional_skills"
                      mode="multiple"
                      placeholder="Select additional skills"
                      onChange={handleMultipleAdditionalSkillsSelect}
                      showSearch={false}
                      value={formData.skills_id.slice(1).map((skill) => skill.skill_id)}
                      className="additional-skills-select"
                      loading={filteredSkillsAdditional.length === 0}
                      notFoundContent={filteredSkillsAdditional.length === 0 ? "No skills available" : "No skills found"}
                      styles={{
                        popup: {
                          root: {
                            zIndex: 3000
                          }
                        }
                      }}
                      getPopupContainer={(trigger) => trigger.parentElement}
                      onOpenChange={(open) => {
                        if (isMountedRef.current) {
                          // If we're forcing close, don't open the dropdown
                          if (forceCloseAdditionalDropdown) {
                            return false;
                          }
                          
                        if (open) {
                            // Force dropdown to be visible when opening
                            const timeoutId = setTimeout(() => {
                              if (isMountedRef.current) {
                            const dropdown = document.querySelector('.additional-skills-select .ant-select-dropdown');
                            if (dropdown) {
                              dropdown.classList.remove('ant-select-dropdown-hidden');
                              dropdown.style.pointerEvents = 'auto';
                              dropdown.style.visibility = 'visible';
                              dropdown.style.display = 'block';
                                }
                            }
                          }, 10);
                            timeoutRefs.current.push(timeoutId);
                          } else {
                            // Ensure dropdown is properly hidden when closing
                            const timeoutId = setTimeout(() => {
                              if (isMountedRef.current) {
                                const dropdown = document.querySelector('.additional-skills-select .ant-select-dropdown');
                                if (dropdown) {
                                  dropdown.classList.add('ant-select-dropdown-hidden');
                                  dropdown.style.pointerEvents = 'none';
                                  dropdown.style.visibility = 'hidden';
                                  dropdown.style.display = 'none';
                                }
                              }
                            }, 10);
                            timeoutRefs.current.push(timeoutId);
                          }
                        }
                      }}
                    >
                      {filteredSkillsAdditional.map((skill) => (
                        <Option key={skill.id} value={String(skill.id)}>
                          {skill.name}
                        </Option>
                      ))}
                    </SafeSelect>
                  </div>
                </div>

                {/* New Step-by-Step Skill Selection */}
                {newSkill.skill_id && (
                  <div className="skill-selection-flow">
                    <div className="skill-selection-step">                     
                      {showSubSkillsDropdown && availableSubSkills.length > 0 && (
                        <div className="form-group skill-sub-skills-step">
                          <label htmlFor="sub_skills">Sub-Skills</label>
                          <SafeSelect
                            id="sub_skills"
                            mode="multiple"
                            placeholder="Select sub-skills"
                            value={newSkill.sub_skills || []}
                            onChange={handleSubSkillsSelect}
                            showSearch={false}
                            className="skill-sub-skills-flow-select"
                            styles={{
                              popup: {
                                root: {
                                  zIndex: 3000
                                }
                              }
                            }}
                            getPopupContainer={(trigger) => trigger.parentElement}
                            onOpenChange={(open) => {
                              if (isMountedRef.current) {
                                if (open) {
                                  // Force dropdown to be visible when opening
                                  const timeoutId = setTimeout(() => {
                                    if (isMountedRef.current) {
                                      const dropdown = document.querySelector('.skill-sub-skills-flow-select .ant-select-dropdown');
                                      if (dropdown) {
                                        dropdown.classList.remove('ant-select-dropdown-hidden');
                                        dropdown.style.pointerEvents = 'auto';
                                        dropdown.style.visibility = 'visible';
                                        dropdown.style.display = 'block';
                                      }
                                    }
                                  }, 10);
                                  timeoutRefs.current.push(timeoutId);
                                } else {
                                  // Ensure dropdown is properly hidden when closing
                                  const timeoutId = setTimeout(() => {
                                    if (isMountedRef.current) {
                                      const dropdown = document.querySelector('.skill-sub-skills-flow-select .ant-select-dropdown');
                                      if (dropdown) {
                                        dropdown.classList.add('ant-select-dropdown-hidden');
                                        dropdown.style.pointerEvents = 'none';
                                        dropdown.style.visibility = 'hidden';
                                        dropdown.style.display = 'none';
                                      }
                                    }
                                  }, 10);
                                  timeoutRefs.current.push(timeoutId);
                                }
                              }
                            }}
                          >
                            {availableSubSkills.map((subSkill) => (
                              <Option key={subSkill} value={subSkill}>
                                {subSkill}
                              </Option>
                            ))}
                          </SafeSelect>
                          {errors.sub_skills && <span className="error">{errors.sub_skills}</span>}
                        </div>
                      )}

                      {showExperienceDropdown && (
                        <div className="form-group skill-experience-step">
                          <label htmlFor="experience">Experience Level <span className="required">*</span></label>
                          <SafeSelect
                            id="experience"
                            placeholder="Select experience level"
                            value={newSkill.experience || undefined}
                            onChange={handleExperienceSelect}
                            showSearch={false}
                            className="skill-experience-flow-select"
                            styles={{
                              popup: {
                                root: {
                                  zIndex: 3000
                                }
                              }
                            }}
                            getPopupContainer={(trigger) => trigger.parentElement}
                            onOpenChange={(open) => {
                              if (isMountedRef.current) {
                                if (open) {
                                  // Force dropdown to be visible when opening
                                  const timeoutId = setTimeout(() => {
                                    if (isMountedRef.current) {
                                      const dropdown = document.querySelector('.skill-experience-flow-select .ant-select-dropdown');
                                      if (dropdown) {
                                        dropdown.classList.remove('ant-select-dropdown-hidden');
                                        dropdown.style.pointerEvents = 'auto';
                                        dropdown.style.visibility = 'visible';
                                        dropdown.style.display = 'block';
                                      }
                                    }
                                  }, 10);
                                  timeoutRefs.current.push(timeoutId);
                                } else {
                                  // Ensure dropdown is properly hidden when closing
                                  const timeoutId = setTimeout(() => {
                                    if (isMountedRef.current) {
                                      const dropdown = document.querySelector('.skill-experience-flow-select .ant-select-dropdown');
                                      if (dropdown) {
                                        dropdown.classList.add('ant-select-dropdown-hidden');
                                        dropdown.style.pointerEvents = 'none';
                                        dropdown.style.visibility = 'hidden';
                                        dropdown.style.display = 'none';
                                      }
                                    }
                                  }, 10);
                                  timeoutRefs.current.push(timeoutId);
                                }
                              }
                            }}
                          >
                            {experienceOptions.map((option) => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </SafeSelect>
                          {errors.experience && <span className="error">{errors.experience}</span>}
                        </div>
                      )}

                      <div className="skill-selection-actions">
                        <button 
                          type="button" 
                          className="cancel-skill-btn"
                          onClick={cancelSkillSelection}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Organized Skills Display */}
                {(formData.skills_id[0]?.skill_id || formData.skills_id.slice(1).length > 0) && (
                  <div className="selected-skills-container">
                    <div className="skills-display-row">
                      {/* Primary Skills Column */}
                      <div className="skills-column primary-skills-column">
                        <h4>Primary Skills</h4>
                        {formData.skills_id[0]?.skill_id ? (
                          <div className="skill-item-container">
                    <Dropdown menu={skillMenu(formData.skills_id[0])} trigger={["click"]}>
                      <div
                                className="skill-item ant-dropdown-trigger primary-skill-item"
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && console.log('Primary skill clicked')}
                      >
                        <div className="skill-info">
                          <div className="skill-detail">
                            <span className="skill-label">Skills:</span>
                          <span className="skill-name">{formData.skills_id[0].skill_name}</span>
                          </div>
                          {formData.skills_id[0].sub_skills?.length > 0 && (
                            <div className="skill-detail">
                              <span className="skill-label">Sub-skills:</span>
                              <span className="skill-sub-skills">{formData.skills_id[0].sub_skills.join(", ")}</span>
                            </div>
                          )}
                          {formData.skills_id[0].experience && (
                            <div className="skill-detail">
                              <span className="skill-label">Experience:</span>
                              <span className="skill-experience">{experienceOptions.find(e => e.value === formData.skills_id[0].experience)?.label}</span>
                            </div>
                          )}
                          {formData.skills_id[0].hourly_rate && (
                            <div className="skill-detail">
                              <span className="skill-label">Rate:</span>
                              <span className="skill-rate">₱{formData.skills_id[0].hourly_rate}/hr</span>
                            </div>
                          )}
                        </div>
                        <IconChevronDown size={16} className="dropdown-arrow" />
                      </div>
                    </Dropdown>
                  </div>
                        ) : (
                          <div className="no-skills-message">
                            <span>No primary skill selected</span>
                  </div>
                )}
                      </div>

                      {/* Additional Skills Column */}
                      <div className="skills-column additional-skills-column">
                        <h4>Additional Skills</h4>
                        {formData.skills_id.slice(1).length > 0 ? (
                          <div className="additional-skills-list">
                    {formData.skills_id.slice(1).map((skill) => (
                              <div key={skill.skill_id} className="skill-item-container">
                                <Dropdown menu={skillMenu(skill)} trigger={["click"]}>
                        <div
                                    className="skill-item ant-dropdown-trigger additional-skill-item"
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => e.key === 'Enter' && console.log('Additional skill clicked')}
                        >
                          <div className="skill-info">
                            <div className="skill-detail">
                              <span className="skill-label">Skills:</span>
                            <span className="skill-name">{skill.skill_name}</span>
                            </div>
                            {skill.sub_skills?.length > 0 && (
                              <div className="skill-detail">
                                <span className="skill-label">Sub-skills:</span>
                                <span className="skill-sub-skills">{skill.sub_skills.join(", ")}</span>
                              </div>
                            )}
                            {skill.experience && (
                              <div className="skill-detail">
                                <span className="skill-label">Experience:</span>
                                <span className="skill-experience">{experienceOptions.find(e => e.value === skill.experience)?.label}</span>
                              </div>
                            )}
                            {skill.hourly_rate && (
                              <div className="skill-detail">
                                <span className="skill-label">Rate:</span>
                                <span className="skill-rate">₱{skill.hourly_rate}/hr</span>
                              </div>
                            )}
                          </div>
                          <IconChevronDown size={16} className="dropdown-arrow" />
                        </div>
                      </Dropdown>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-skills-message">
                            <span>No additional skills selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-section">
                <h3>Profile Picture</h3>
                <div className="form-group">
                  <div className="profile-upload-container">
                    <div 
                      className="profile-upload-dropzone"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-over');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('drag-over');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-over');
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                          handleInputChange({ target: { files: [files[0]] } }, "profile_img");
                        }
                      }}
                    >
                      {formData.profile_img ? (
                        <div className="profile-img-preview-inside">
                          <div className="preview-image-container">
                            {typeof formData.profile_img === "string" ? (
                              <img src={`http://127.0.0.1:8000/storage/${formData.profile_img}`} alt="Profile Preview" />
                            ) : (
                              <img src={URL.createObjectURL(formData.profile_img)} alt="Profile Preview" />
                            )}
                          </div>
                          <div className="preview-actions">
                            <button 
                              type="button" 
                              className="change-image-button"
                              onClick={() => document.getElementById('profile_img').click()}
                            >
                              Change Image
                            </button>
                            <button 
                              type="button" 
                              className="remove-image-button"
                              onClick={removeProfileImg}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-content">
                          <div className="upload-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 13H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 17H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 9H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <button 
                            type="button" 
                            className="browse-button"
                            onClick={() => document.getElementById('profile_img').click()}
                          >
                            Browse
                          </button>
                          <p className="drop-text">drop a file here</p>
                          <p className="file-types">*File supported .png, .jpg & .webp</p>
                        </div>
                      )}
                  <input
                    id="profile_img"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={(e) => handleInputChange(e, "profile_img")}
                    ref={profileImgRef}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                  {errors.profile_img && <span className="error">{errors.profile_img}</span>}
                </div>
              </div>
              <div className="form-section worker-modal-form-credentials-info">
                <h3>Credentials</h3>
                    <div className="form-group">
                  <div className="credential-section">
                    <div className="credential-selection-side">
                      <label htmlFor="credential_type">Choose Credential Type</label>
                      <select
                        id="credential_type"
                        value={newCredential.credentials_name}
                        onChange={(e) => handleNewCredentialChange(e, "credentials_name")}
                        className="credential-dropdown"
                      >
                        <option value="">Choose a credential</option>
                        {credentialOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.new_credential_name && <span className="error">{errors.new_credential_name}</span>}
                    </div>
                    
                    {newCredential.credentials_name && (
                      <div className="credential-upload-side">
                        <div className="credential-upload-options">
                          <div className="credential-upload-option">
                            <label htmlFor="credential_photo">Upload Credential Photo</label>
                            <div 
                              className="credential-upload-dropzone"
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('drag-over');
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.classList.remove('drag-over');
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('drag-over');
                                const files = e.dataTransfer.files;
                                if (files.length > 0) {
                                  handleNewCredentialChange({ target: { files: [files[0]] } }, "credentials_photo");
                                }
                              }}
                            >
                              {newCredential.credentials_photo ? (
                                <div className="credential-file-preview">
                                  <div className="preview-file-container">
                                    {newCredential.credentials_photo instanceof File ? (
                                      <>
                                        {newCredential.credentials_photo.type.startsWith('image/') ? (
                                          <img src={URL.createObjectURL(newCredential.credentials_photo)} alt="Credential Preview" />
                                        ) : (
                                          <div className="file-icon">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M14 2V8H20" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M16 13H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M16 17H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M10 9H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          </div>
                                        )}
                                        <div className="file-info">
                                          <span className="file-name">{newCredential.credentials_photo.name}</span>
                                          <span className="file-size">{(newCredential.credentials_photo.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="file-info">
                                        <span className="file-name">{newCredential.credentials_photo}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="preview-actions">
                                    <button 
                                      type="button" 
                                      className="change-file-button"
                                      onClick={() => document.getElementById('credential_photo').click()}
                                    >
                                      Change Photo
                                    </button>
                                    <button 
                                      type="button" 
                                      className="remove-file-button"
                                      onClick={() => {
                                        setNewCredential(prev => ({ ...prev, credentials_photo: null }));
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="upload-content">
                                  <div className="upload-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M14 2V8H20" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M16 13H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M16 17H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M10 9H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="browse-button"
                                    onClick={() => document.getElementById('credential_photo').click()}
                                  >
                                    Browse Photos
                                  </button>
                                  <p className="drop-text">or drop a photo here</p>
                                  <p className="file-types">*File supported .jpg, .png, .pdf</p>
                                </div>
                              )}
                              <input
                                id="credential_photo"
                                type="file"
                                accept=".jpg,.png,.pdf"
                                onChange={(e) => handleNewCredentialChange(e, "credentials_photo")}
                                style={{ display: 'none' }}
                              />
                            </div>
                            {errors.new_credential_photo && <span className="error">{errors.new_credential_photo}</span>}
                          </div>

                          <div className="credential-upload-option">
                            <label htmlFor="credential_doc">Upload Credential Document</label>
                            <div 
                              className="credential-upload-dropzone"
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('drag-over');
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.classList.remove('drag-over');
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('drag-over');
                                const files = e.dataTransfer.files;
                                if (files.length > 0) {
                                  handleNewCredentialChange({ target: { files: [files[0]] } }, "credentials_doc");
                                }
                              }}
                            >
                              {newCredential.credentials_doc ? (
                                <div className="credential-file-preview">
                                  <div className="preview-file-container">
                                    {newCredential.credentials_doc instanceof File ? (
                                      <>
                                        <div className="file-icon">
                                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M14 2V8H20" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M16 13H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M16 17H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M10 9H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </div>
                                        <div className="file-info">
                                          <span className="file-name">{newCredential.credentials_doc.name}</span>
                                          <span className="file-size">{(newCredential.credentials_doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="file-info">
                                        <span className="file-name">{newCredential.credentials_doc}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="preview-actions">
                                    <button 
                                      type="button" 
                                      className="change-file-button"
                                      onClick={() => document.getElementById('credential_doc').click()}
                                    >
                                      Change Document
                                    </button>
                                    <button 
                                      type="button" 
                                      className="remove-file-button"
                                      onClick={() => {
                                        setNewCredential(prev => ({ ...prev, credentials_doc: null }));
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="upload-content">
                                  <div className="upload-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M14 2V8H20" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M16 13H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M16 17H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M10 9H8" stroke="#1A2A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="browse-button"
                                    onClick={() => document.getElementById('credential_doc').click()}
                                  >
                                    Browse Documents
                                  </button>
                                  <p className="drop-text">or drop a document here</p>
                                  <p className="file-types">*File supported .pdf, .doc, .docx</p>
                                </div>
                              )}
                              <input
                                id="credential_doc"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleNewCredentialChange(e, "credentials_doc")}
                                style={{ display: 'none' }}
                              />
                            </div>
                            {errors.new_credential_doc && <span className="error">{errors.new_credential_doc}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {newCredential.credentials_name && (newCredential.credentials_photo || newCredential.credentials_doc) && (
                      <div className="add-credential-section">
                      <button 
                        type="button" 
                        className="add-credential-button"
                        onClick={addCredential}
                      >
                          <IconPlus size={16} />
                          Add Credential
                      </button>
                    </div>
                    )}
                  
                      <div className="credential-list">
                      <h4>Added Credentials</h4>
                        {formData.credentials.length > 0 ? (
                        <div className="credentials-grid">
                          {formData.credentials.map((cred, index) => (
                            <div key={`credential-${index}`} className="credential-item">
                              <div className="credential-item-header">
                                <span className="credential-name">{cred.credentials_name}</span>
                                <button 
                                  type="button" 
                                  className="remove-credential-button"
                                  onClick={() => removeCredential(index)}
                                >
                                  <TiDeleteOutline size={20} />
                                </button>
                              </div>
                              <div className="credential-file-display">
                                  {/* Display photo if available */}
                                  {cred.credentials_photo && (
                                    <div className="credential-photo">
                                      <h5>Photo:</h5>
                                      {typeof cred.credentials_photo === "string" && cred.credentials_photo ? (
                                        <img
                                          src={`http://127.0.0.1:8000/storage/${cred.credentials_photo}`}
                                          alt={cred.credentials_name}
                                          className="credential-image"
                                        />
                                      ) : cred.credentials_photo instanceof File ? (
                                        cred.credentials_photo.type.startsWith('image/') ? (
                                          <img
                                            src={URL.createObjectURL(cred.credentials_photo)}
                                            alt={cred.credentials_name}
                                            className="credential-image"
                                          />
                                        ) : (
                                          <div className="credential-file-info">
                                            {cred.credentials_photo.name}
                                          </div>
                                        )
                                      ) : (
                                        <div className="credential-file-info">
                                          {cred.credentials_photo}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Display document if available */}
                                  {cred.credentials_doc && (
                                    <div className="credential-doc">
                                      <h5>Document:</h5>
                                      {typeof cred.credentials_doc === "string" && cred.credentials_doc ? (
                                        <div className="credential-file-link">
                                          <a href={`http://127.0.0.1:8000/storage/${cred.credentials_doc}`} download>
                                            {cred.credentials_doc.split("/").pop()}
                                          </a>
                                        </div>
                                      ) : cred.credentials_doc instanceof File ? (
                                        <div className="credential-file-info">
                                          {cred.credentials_doc.name}
                                        </div>
                                      ) : (
                                        <div className="credential-file-info">
                                          {cred.credentials_doc}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Show message if no files */}
                                  {!cred.credentials_photo && !cred.credentials_doc && (
                                    <div className="credential-file-info">
                                      No files selected
                                    </div>
                                  )}
                                </div>
                              </div>
                          ))}
                            </div>
                        ) : (
                          <div className="no-credentials-message">
                            <span>No credentials added yet</span>
                          </div>
                        )}
                    </div>
                    {errors.credentials && <span className="error">{errors.credentials}</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="worker-modal-actions">
              <button className="cancel-button" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="submit-button" type="submit">
                {isEdit ? "Update" : "Create"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default WorkerModal;
