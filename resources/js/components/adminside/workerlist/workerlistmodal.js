import React, { useState, useEffect, useRef } from "react";
import { Select, Dropdown, Menu } from "antd";
import { IconX, IconChevronDown, IconPlus, IconMinus } from "@tabler/icons-react";
import "./../../../../sass/components/workermodal.scss";
import axios from "axios";

const { Option } = Select;

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
  const [newCredential, setNewCredential] = useState({ credentials_name: "", credentials_photo: null });
  const [availableSubSkills, setAvailableSubSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ skill_id: "", sub_skills: [], experience: "" });
  const [showSubSkillsDropdown, setShowSubSkillsDropdown] = useState(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
  const [searchTermPrimary, setSearchTermPrimary] = useState("");
  const [searchTermAdditional, setSearchTermAdditional] = useState("");
  const [filteredSkillsPrimary, setFilteredSkillsPrimary] = useState([]);
  const [filteredSkillsAdditional, setFilteredSkillsAdditional] = useState([]);
  const profileImgRef = useRef(null);
  const credentialFileRef = useRef(null);
  const abortControllerRef = useRef(new AbortController());
  const isMountedRef = useRef(true);
  // Preferred working days native select (no external ref needed)

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

      // Ensure preferred_working_hours is always an array
      let preferredWorkingHours = initialData.worker?.preferred_working_hours || [];
      
      // Handle different data formats
      if (typeof preferredWorkingHours === 'string') {
        try {
          preferredWorkingHours = JSON.parse(preferredWorkingHours);
        } catch (e) {
          // If JSON parsing fails, try to handle as comma-separated string
          if (preferredWorkingHours.includes(',')) {
            preferredWorkingHours = preferredWorkingHours.split(',').map(day => day.trim().toLowerCase());
          } else if (preferredWorkingHours.trim()) {
            preferredWorkingHours = [preferredWorkingHours.trim().toLowerCase()];
          } else {
            preferredWorkingHours = [];
          }
        }
      }
      
      // Ensure it's always an array and normalize the values
      if (!Array.isArray(preferredWorkingHours)) {
        preferredWorkingHours = [];
      }
      
      // Normalize day names to lowercase
      preferredWorkingHours = preferredWorkingHours
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
          preferred_working_hours: preferredWorkingHours,
          bio: initialData.worker?.bio || "",
          skills_id: initialSkills,
          credentials: Array.isArray(initialData.worker?.credentials_name) && Array.isArray(initialData.worker?.credentials_photo)
            ? initialData.worker.credentials_name.map((name, index) => ({
                credentials_name: name || "",
                credentials_photo: initialData.worker.credentials_photo[index] || null,
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
    };
  }, [isEdit, initialData]);

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
    const skill = skillsState.find((s) => String(s.id) === value);
    if (!skill) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, skills_id: "Invalid skill selected. Please try again." }));
      }
      return;
    }
    if (formData.skills_id.some((existing) => existing.skill_id === value)) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, skills_id: "This skill has already been added." }));
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
        // Call addSkillToForm with the updated skill
        setTimeout(() => {
          addSkillToFormWithSkill(updated);
        }, 0);
        return updated;
      });
      setShowExperienceDropdown(false);
    }
  };

  const addSkillToForm = () => {
    if (!isMountedRef.current) return;
    console.log('Adding skill to form:', newSkill);
    if (isMountedRef.current) {
      setFormData((prev) => {
        const isPrimaryEmpty = !prev.skills_id[0] || prev.skills_id[0].skill_id === "";
        const updatedSkills = isPrimaryEmpty ? [newSkill, ...prev.skills_id.slice(1)] : [...prev.skills_id, newSkill];
        console.log('Updated skills array:', updatedSkills);
          return {
            ...prev,
          skills_id: updatedSkills,
        };
      });
      setNewSkill({ skill_id: "", sub_skills: [], experience: "" });
      setAvailableSubSkills([]);
      setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
    }
  };

  const addSkillToFormWithSkill = (skillToAdd) => {
    if (!isMountedRef.current) return;
    console.log('Adding skill to form with skill:', skillToAdd);
    if (isMountedRef.current) {
      setFormData((prev) => {
          const isPrimaryEmpty = !prev.skills_id[0] || prev.skills_id[0].skill_id === "";
        const updatedSkills = isPrimaryEmpty ? [skillToAdd, ...prev.skills_id.slice(1)] : [...prev.skills_id, skillToAdd];
        console.log('Updated skills array with experience:', updatedSkills);
          return {
            ...prev,
          skills_id: updatedSkills,
          };
      });
      setNewSkill({ skill_id: "", sub_skills: [], experience: "" });
      setAvailableSubSkills([]);
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
        
        // Auto-set hours per day based on work type
        if (field === "work_type") {
          if (value === "full-time") {
            newData.hours_per_day = 8;
          } else if (value === "part-time") {
            newData.hours_per_day = 4;
          } else if (value === "one-time") {
            newData.hours_per_day = 1;
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
            new_credential_photo: "Credential must be PDF, Word, JPG, or PNG.",
          }));
        }
        return;
      }
      if (value.size > 2048 * 1024) {
        if (isMountedRef.current) {
          setErrors((prev) => ({
            ...prev,
            new_credential_photo: "Credential file must not exceed 2 MB.",
          }));
        }
        return;
      }
    }
    if (isMountedRef.current) {
      setNewCredential((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "" }));
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
    if (!newCredential.credentials_photo) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, new_credential_photo: "Please upload a credential file." }));
      }
      return;
    }
    if (isMountedRef.current) {
      setFormData((prev) => ({
        ...prev,
        credentials: [...prev.credentials, newCredential],
      }));
      setNewCredential({ credentials_name: "", credentials_photo: null });
      setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "" }));
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
    submitData.append("is_reviewed", formData.is_reviewed || "");
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
                    <Select
                      id="preferred_working_days"
                      mode="multiple"
                      placeholder="Select Preferred Working Days"
                      value={formData.preferred_working_hours || []}
                      onChange={(values) => handleInputChange(values, "preferred_working_hours")}
                      className="preferred-working-days-dropdown"
                      showSearch={false}
                      styles={{ popup: { root: { zIndex: 3000 } } }}
                    >
                      <Option value="monday">Monday</Option>
                      <Option value="tuesday">Tuesday</Option>
                      <Option value="wednesday">Wednesday</Option>
                      <Option value="thursday">Thursday</Option>
                      <Option value="friday">Friday</Option>
                      <Option value="saturday">Saturday</Option>
                      <Option value="sunday">Sunday</Option>
                    </Select>
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
                    <label htmlFor="primary_skill">Primary Skill <span className="required">*</span></label>
                    <Select
                      id="primary_skill"
                      placeholder={filteredSkillsPrimary.length === 0 ? "Loading skills..." : "Select primary skill"}
                      onChange={handlePrimarySkillSelect}
                      showSearch={false}
                      required
                      value={formData.skills_id[0]?.skill_id || undefined}
                      className="primary-skill-select"
                      loading={filteredSkillsPrimary.length === 0}
                      notFoundContent={filteredSkillsPrimary.length === 0 ? "No skills available" : "No skills found"}
                      styles={{
                        popup: {
                          root: {
                            zIndex: 3000
                          }
                        }
                      }}
                      getPopupContainer={(trigger) => trigger.parentElement}
                      onOpenChange={(open) => {
                        if (open) {
                          // Force dropdown to be visible
                          setTimeout(() => {
                            const dropdown = document.querySelector('.primary-skill-select .ant-select-dropdown');
                            if (dropdown) {
                              dropdown.classList.remove('ant-select-dropdown-hidden');
                              dropdown.style.pointerEvents = 'auto';
                              dropdown.style.visibility = 'visible';
                              dropdown.style.display = 'block';
                            }
                          }, 10);
                        }
                      }}
                    >
                      {filteredSkillsPrimary.map((skill) => (
                        <Option key={skill.id} value={String(skill.id)}>
                          {skill.name}
                        </Option>
                      ))}
                    </Select>
                    {errors.skills_id && <span className="error">{errors.skills_id}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="additional_skills">Additional Skills</label>
                    <Select
                      id="additional_skills"
                      mode="multiple"
                      placeholder="Select additional skills"
                      onChange={handleAdditionalSkillsSelect}
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
                        if (open) {
                          // Force dropdown to be visible
                          setTimeout(() => {
                            const dropdown = document.querySelector('.additional-skills-select .ant-select-dropdown');
                            if (dropdown) {
                              dropdown.classList.remove('ant-select-dropdown-hidden');
                              dropdown.style.pointerEvents = 'auto';
                              dropdown.style.visibility = 'visible';
                              dropdown.style.display = 'block';
                            }
                          }, 10);
                        }
                      }}
                    >
                      {filteredSkillsAdditional.map((skill) => (
                        <Option key={skill.id} value={String(skill.id)}>
                          {skill.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* New Step-by-Step Skill Selection */}
                {newSkill.skill_id && (
                  <div className="skill-selection-flow">
                    <div className="skill-selection-step">                     
                      {showSubSkillsDropdown && availableSubSkills.length > 0 && (
                        <div className="form-group skill-sub-skills-step">
                          <label htmlFor="sub_skills">Sub-Skills</label>
                          <Select
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
                          >
                            {availableSubSkills.map((subSkill) => (
                              <Option key={subSkill} value={subSkill}>
                                {subSkill}
                              </Option>
                            ))}
                          </Select>
                          {errors.sub_skills && <span className="error">{errors.sub_skills}</span>}
                        </div>
                      )}

                      {showExperienceDropdown && (
                        <div className="form-group skill-experience-step">
                          <label htmlFor="experience">Experience Level <span className="required">*</span></label>
                          <Select
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
                          >
                            {experienceOptions.map((option) => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
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
                {formData.skills_id[0]?.skill_id && (
                  <div className="selected-skills">
                    <h4>Selected Primary Skill</h4>
                    <Dropdown menu={skillMenu(formData.skills_id[0])} trigger={["click"]}>
                      <div
                        className="skill-item ant-dropdown-trigger"
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && console.log('Primary skill clicked')}
                      >
                        <div className="skill-info">
                          <span className="skill-name">{formData.skills_id[0].skill_name}</span>
                          {formData.skills_id[0].sub_skills?.length > 0 && (
                            <span className="skill-sub-skills">
                              Sub-skills: {formData.skills_id[0].sub_skills.join(", ")}
                            </span>
                          )}
                          {formData.skills_id[0].experience && (
                            <span className="skill-experience">
                              Experience: {experienceOptions.find(e => e.value === formData.skills_id[0].experience)?.label}
                            </span>
                          )}
                          {formData.skills_id[0].hourly_rate && (
                            <span className="skill-rate">
                              Rate: ₱{formData.skills_id[0].hourly_rate}/hr
                            </span>
                          )}
                        </div>
                        <IconChevronDown size={16} className="dropdown-arrow" />
                      </div>
                    </Dropdown>
                  </div>
                )}
                {formData.skills_id.slice(1).length > 0 && (
                  <div className="selected-skills">
                    <h4>Selected Additional Skills</h4>
                    {formData.skills_id.slice(1).map((skill) => (
                      <Dropdown key={skill.skill_id} menu={skillMenu(skill)} trigger={["click"]}>
                        <div
                          className="skill-item ant-dropdown-trigger"
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => e.key === 'Enter' && console.log('Additional skill clicked')}
                        >
                          <div className="skill-info">
                            <span className="skill-name">{skill.skill_name}</span>
                            {skill.sub_skills?.length > 0 && (
                              <span className="skill-sub-skills">
                                Sub-skills: {skill.sub_skills.join(", ")}
                              </span>
                            )}
                            {skill.experience && (
                              <span className="skill-experience">
                                Experience: {experienceOptions.find(e => e.value === skill.experience)?.label}
                              </span>
                            )}
                            {skill.hourly_rate && (
                              <span className="skill-rate">
                                Rate: ₱{skill.hourly_rate}/hr
                              </span>
                            )}
                          </div>
                          <IconChevronDown size={16} className="dropdown-arrow" />
                        </div>
                      </Dropdown>
                    ))}
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
                    <select
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
                    {newCredential.credentials_name && (
                      <div className="credential-upload">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleNewCredentialChange(e, "credentials_photo")}
                          ref={credentialFileRef}
                        />
                        <button type="button" onClick={addCredential}>Add Credential</button>
                      </div>
                    )}
                    <div className="credential-list">
                      {formData.credentials.map((cred, index) => (
                        <div key={`credential-${index}`} className="credential-item">
                          {cred.credentials_name}:{" "}
                          {typeof cred.credentials_photo === "string" ? (
                            isImageFile(cred.credentials_photo) ? (
                              <img
                                src={`http://127.0.0.1:8000/storage/${cred.credentials_photo}`}
                                alt={cred.credentials_name}
                              />
                            ) : (
                              <a href={`http://127.0.0.1:8000/storage/${cred.credentials_photo}`} download>
                                {cred.credentials_photo.split("/").pop()}
                              </a>
                            )
                          ) : (
                            cred.credentials_photo?.name || "No file selected"
                          )}
                          <button type="button" onClick={() => removeCredential(index)}>Remove</button>
                        </div>
                      ))}
                    </div>
                    {errors.credentials && <span className="error">{errors.credentials}</span>}
                    {errors.new_credential_name && <span className="error">{errors.new_credential_name}</span>}
                    {errors.new_credential_photo && <span className="error">{errors.new_credential_photo}</span>}
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
