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
  { value: "Valid Government ID", label: "Valid Government ID (e.g., Passport, Driver’s License, Voter’s ID, UMID, National ID)" },
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
    skills_id: [],
    credentials: [],
    role_id: "1",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [newCredential, setNewCredential] = useState({ credentials_name: "", credentials_photo: null });
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedSubSkills, setSelectedSubSkills] = useState([]);
  const [availableSubSkills, setAvailableSubSkills] = useState([]);
  const [searchTermPrimary, setSearchTermPrimary] = useState("");
  const [searchTermAdditional, setSearchTermAdditional] = useState("");
  const [filteredSkillsPrimary, setFilteredSkillsPrimary] = useState([]);
  const [filteredSkillsAdditional, setFilteredSkillsAdditional] = useState([]);
  const profileImgRef = useRef(null);
  const credentialFileRef = useRef(null);
  const abortControllerRef = useRef(new AbortController());
  const isMountedRef = useRef(true);

  // Fetch skills from the API
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

    if (isEdit && initialData) {
      let initialSkills = Array.isArray(initialData.worker?.skills_id) ? initialData.worker.skills_id : [];
      if (isMountedRef.current) {
        setFormData({
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
          skills_id: initialSkills,
          credentials: Array.isArray(initialData.worker?.credentials_name) && Array.isArray(initialData.worker?.credentials_photo)
            ? initialData.worker.credentials_name.map((name, index) => ({
                credentials_name: name || "",
                credentials_photo: initialData.worker.credentials_photo[index] || null,
              }))
            : [],
          role_id: "1",
        });
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
      setFilteredSkillsPrimary(skills || []);
    } else {
      const searchLower = searchTermPrimary.toLowerCase().trim();
      const filtered = (skills || []).filter((skill) => skill.name.toLowerCase().includes(searchLower));
      setFilteredSkillsPrimary(filtered);
    }
  }, [searchTermPrimary, skills]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    let skillsToFilter = skills || [];
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
  }, [searchTermAdditional, skills, formData.skills_id]);

  const handlePrimarySkillSelect = (value) => {
    if (!isMountedRef.current) return;
    const skill = skills.find((s) => String(s.id) === value);
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
      setSelectedSkill(skill);
      setAvailableSubSkills(skill.sub_skills || []);
      setSelectedSubSkills([]);
      setShowSkillModal(true);
      setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
    }
  };

  const handleAdditionalSkillsSelect = (values) => {
    if (!isMountedRef.current) return;
    const newSkillIds = values.filter((id) => !formData.skills_id.some((skill) => skill.skill_id === id));
    if (newSkillIds.length === 0) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, skills_id: "All selected skills are already added or invalid." }));
      }
      return;
    }
    const newSkills = newSkillIds.map((id) => skills.find((s) => String(s.id) === id)).filter(Boolean);
    if (newSkills.length > 0) {
      if (isMountedRef.current) {
        setSelectedSkill(newSkills[0]);
        setAvailableSubSkills(newSkills[0].sub_skills || []);
        setSelectedSubSkills([]);
        setShowSkillModal(true);
        setErrors((prev) => ({ ...prev, skills_id: "" }));
      }
    } else {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, skills_id: "Invalid additional skills selected." }));
      }
    }
  };

  const handleAddSubSkill = (subSkill) => {
    if (!isMountedRef.current) return;
    if (selectedSubSkills.includes(subSkill)) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, sub_skills: "This sub-skill is already selected." }));
      }
      return;
    }
    if (isMountedRef.current) {
      setSelectedSubSkills((prev) => [...prev, subSkill]);
      setAvailableSubSkills((prev) => prev.filter((s) => s !== subSkill));
      setErrors((prev) => ({ ...prev, sub_skills: "" }));
    }
  };

  const handleRemoveSubSkill = (subSkill) => {
    if (!isMountedRef.current) return;
    if (isMountedRef.current) {
      setSelectedSubSkills((prev) => prev.filter((s) => s !== subSkill));
      setAvailableSubSkills((prev) => [...prev, subSkill].sort());
    }
  };

  const handleSaveSkill = () => {
    if (!isMountedRef.current || !selectedSkill) return;
    if (selectedSkill.sub_skills.length > 0 && selectedSubSkills.length === 0) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, sub_skills: "Please select at least one sub-skill." }));
      }
      return;
    }
    const newSkill = {
      skill_id: String(selectedSkill.id),
      skill_name: selectedSkill.name,
      sub_skills: selectedSubSkills,
    };
    if (isMountedRef.current) {
      setFormData((prev) => {
        const isPrimary = prev.skills_id[0]?.skill_id === newSkill.skill_id;
        const skillIndex = prev.skills_id.findIndex((s) => s.skill_id === newSkill.skill_id);
        if (isPrimary) {
          // Update primary skill at index 0
          return {
            ...prev,
            skills_id: [newSkill, ...prev.skills_id.slice(1)],
          };
        } else if (skillIndex !== -1) {
          // Update additional skill in place
          return {
            ...prev,
            skills_id: [
              ...prev.skills_id.slice(0, skillIndex),
              newSkill,
              ...prev.skills_id.slice(skillIndex + 1),
            ],
          };
        } else {
          // Add new skill (primary if no primary exists, otherwise additional)
          const isPrimaryEmpty = !prev.skills_id[0] || prev.skills_id[0].skill_id === "";
          return {
            ...prev,
            skills_id: isPrimaryEmpty ? [newSkill, ...prev.skills_id.slice(1)] : [...prev.skills_id, newSkill],
          };
        }
      });
      setShowSkillModal(false);
      setSelectedSkill(null);
      setAvailableSubSkills([]);
      setSelectedSubSkills([]);
      setErrors((prev) => ({ ...prev, skills_id: "", sub_skills: "" }));
      setApiError("");
    }
  };

  const handleModalClose = () => {
    if (!isMountedRef.current) return;
    if (isMountedRef.current) {
      setShowSkillModal(false);
      setSelectedSkill(null);
      setAvailableSubSkills([]);
      setSelectedSubSkills([]);
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
      setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!formData.gender_id) newErrors.gender_id = "Gender is required.";
    if (!formData.work_type) newErrors.work_type = "Work type is required.";
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
    submitData.append("role_id", formData.role_id);
    submitData.append("skills_id", JSON.stringify(formData.skills_id || []));
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
  const isSkillsLoaded = Array.isArray(skills);
  const isImageFile = (path) => /\.(jpg|jpeg|png)$/i.test(path);

  const skillMenu = (skill) => ({
    items: [
      {
        key: "edit",
        label: "Edit",
        onClick: () => {
          if (!isMountedRef.current) return;
          const foundSkill = skills.find((s) => String(s.id) === String(skill.skill_id));
          if (foundSkill) {
            setSelectedSkill(foundSkill);
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
              <div className="form-section">
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
                    <label htmlFor="gender_id">Gender <span className="required">*</span></label>
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
              <div className="form-section">
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
                      <option value="one-time-job">One Time Job</option>
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
              </div>
              <div className="form-section">
                <h3>Skills</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="primary_skill">Primary Skill <span className="required">*</span></label>
                    <Select
                      showSearch
                      placeholder="Search and select primary skill"
                      onSearch={setSearchTermPrimary}
                      onChange={handlePrimarySkillSelect}
                      className="credential-dropdown"
                      optionFilterProp="children"
                      required
                      value={formData.skills_id[0]?.skill_id || undefined}
                    >
                      {filteredSkillsPrimary.map((skill) => (
                        <Option key={skill.id} value={String(skill.id)}>
                          {skill.name}
                        </Option>
                      ))}
                    </Select>
                    {errors.skills_id && <span className="error">{errors.skills_id}</span>}
                  </div>
                </div>
                {formData.skills_id[0]?.skill_id && (
                  <div className="selected-skills">
                    <h4>Selected Primary Skill</h4>
                    <Dropdown menu={skillMenu(formData.skills_id[0])} trigger={["click"]}>
                      <div className="skill-item ant-dropdown-trigger">
                        <span>
                          {formData.skills_id[0].skill_name}{" "}
                          {formData.skills_id[0].sub_skills?.length > 0
                            ? `(Sub-skills: ${formData.skills_id[0].sub_skills.join(", ")})`
                            : ""}
                        </span>
                        <IconChevronDown size={16} />
                      </div>
                    </Dropdown>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="additional_skills">Additional Skills</label>
                    <Select
                      mode="multiple"
                      showSearch
                      placeholder="Search and select additional skills"
                      onSearch={setSearchTermAdditional}
                      onChange={handleAdditionalSkillsSelect}
                      className="credential-dropdown"
                      optionFilterProp="children"
                      value={formData.skills_id.slice(1).map((skill) => skill.skill_id)}
                    >
                      {filteredSkillsAdditional.map((skill) => (
                        <Option key={skill.id} value={String(skill.id)}>
                          {skill.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>
                {formData.skills_id.slice(1).length > 0 && (
                  <div className="selected-skills">
                    <h4>Selected Additional Skills</h4>
                    {formData.skills_id.slice(1).map((skill) => (
                      <Dropdown key={skill.skill_id} menu={skillMenu(skill)} trigger={["click"]}>
                        <div className="skill-item ant-dropdown-trigger">
                          <span>
                            {skill.skill_name}{" "}
                            {skill.sub_skills?.length > 0 ? `(Sub-skills: ${skill.sub_skills.join(", ")})` : ""}
                          </span>
                          <IconChevronDown size={16} />
                        </div>
                      </Dropdown>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-section">
                <h3>Profile Picture</h3>
                <div className="form-group">
                  <label htmlFor="profile_img">Profile Picture</label>
                  <input
                    id="profile_img"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={(e) => handleInputChange(e, "profile_img")}
                    ref={profileImgRef}
                  />
                  {formData.profile_img && (
                    <div className="profile-img-preview">
                      {typeof formData.profile_img === "string" ? (
                        <img src={`http://127.0.0.1:8000/storage/${formData.profile_img}`} alt="Profile Preview" />
                      ) : (
                        <img src={URL.createObjectURL(formData.profile_img)} alt="Profile Preview" />
                      )}
                      <button type="button" onClick={removeProfileImg}>Remove</button>
                    </div>
                  )}
                  {errors.profile_img && <span className="error">{errors.profile_img}</span>}
                </div>
              </div>
              <div className="form-section">
                <h3>Credentials</h3>
                <div className="form-group">
                  <label>Add Credential</label>
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
                          {availableSubSkills.length > 0 ? (
                            <ul className="sub-skills-list">
                              {availableSubSkills.map((subSkill) => (
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
                          {selectedSubSkills.length > 0 ? (
                            <ul className="sub-skills-list">
                              {selectedSubSkills.map((subSkill) => (
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
    </div>
  );
};

export default WorkerModal;