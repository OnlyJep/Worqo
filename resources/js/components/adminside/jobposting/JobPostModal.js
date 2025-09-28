import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { message, Select, Dropdown, Menu } from "antd";
const { Option } = Select;
import { IconX, IconChevronDown, IconPlus, IconMinus } from "@tabler/icons-react";
import "./../../../../sass/components/jobpostmodal.scss";

const JobPostModal = ({ onClose, onSubmit, isEdit, initialData, onRefresh }) => {
  const [formData, setFormData] = useState({
    company_id: "",
    profile_id: "",
    skills_required: [],
    description: "",
    salary: "",
    job_type: "full-time",
    street: "",
    city: "Butuan City",
    province: "Agusan Del Norte",
    postal_code: "8600",
    country: "Philippines",
    application_start: "",
    application_deadline: "",
  });
  const [errors, setErrors] = useState({});
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableRanks, setAvailableRanks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyEmployers, setCompanyEmployers] = useState({});
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedSubSkills, setSelectedSubSkills] = useState([]);
  const [availableSubSkills, setAvailableSubSkills] = useState([]);
  const [searchTermSkills, setSearchTermSkills] = useState("");
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Fetch skills, ranks, and companies
    const fetchData = async () => {
      try {
        const [skillsResponse, ranksResponse, companiesResponse] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/skills"),
          axios.get("http://127.0.0.1:8000/api/ranks"),
          axios.get("http://127.0.0.1:8000/api/companies"),
        ]);
        const skillsData = skillsResponse.data.map((skill) => ({
          ...skill,
          sub_skills: Array.isArray(skill.sub_skills) ? skill.sub_skills : [],
        }));
        setAvailableSkills(skillsData);
        setFilteredSkills(skillsData);
        
        // Update ranks to use full rank objects instead of just names
        const ranksData = ranksResponse.data.ranks || ranksResponse.data;
        setAvailableRanks(ranksData);
        const companiesData = companiesResponse.data.companies || [];
        setCompanies(companiesData);
        // Map company_id to employer object
        const employersMap = companiesData.reduce((acc, company) => {
          if (company.id && company.employer && company.employer.id) {
            acc[company.id] = company.employer;
          }
          return acc;
        }, {});
        setCompanyEmployers(employersMap);
        console.log("Fetched companies:", companiesData);
        console.log("Company employers map:", employersMap);
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

  useEffect(() => {
    if (isEdit && initialData && companies.length > 0) {
      const company = companies.find((c) => c.id === initialData.company_id);
      setSelectedCompany(company || null);
      setFormData({
        company_id: initialData.company_id || "",
        profile_id: company?.employer_id ? String(company.employer_id) : initialData.profile_id || "",
        skills_required: initialData.skills ? (() => {
          const skillsArray = [];
          // Parse the alternating format: skill_name, [sub_skills], skill_name, [sub_skills], ...
          for (let i = 0; i < initialData.skills.length; i += 2) {
            const skillName = initialData.skills[i];
            const subSkills = initialData.skills[i + 1] || [];
            
            if (skillName) {
              const actualSkill = availableSkills.find(s => s.name === skillName);
              const rankIndex = Math.floor(i / 2);
              const rank = availableRanks.find(rank => rank.name === initialData.ranks[rankIndex]) || availableRanks[0];
              
              skillsArray.push({
                skill_id: actualSkill ? String(actualSkill.id) : String(rankIndex + 1),
                skill_name: skillName,
                sub_skills: Array.isArray(subSkills) ? subSkills : [],
                rank: rank
              });
            }
          }
          return skillsArray;
        })() : [],
        description: initialData.description || "",
        salary: initialData.salary || "",
        job_type: initialData.job_type || "full-time",
        street: initialData.street || "",
        city: initialData.city || "Butuan City",
        province: initialData.province || "Agusan Del Norte",
        postal_code: initialData.postal_code || "8600",
        country: initialData.country || "Philippines",
        application_start: initialData.application_start
          ? new Date(initialData.application_start).toISOString().slice(0, 16)
          : "",
        application_deadline: initialData.application_deadline
          ? new Date(initialData.application_deadline).toISOString().slice(0, 16)
          : "",
      });
      console.log("Edit mode - Selected company:", company);
      console.log("Edit mode - Set profile_id to:", company?.employer_id || initialData.profile_id);
    }
  }, [isEdit, initialData, companies]);

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "company_id") {
        const company = companies.find((c) => c.id === parseInt(value));
        setSelectedCompany(company || null);
        newData.profile_id = company?.employer_id ? String(company.employer_id) : "";
        console.log("Selected company:", company);
        console.log("Set profile_id to:", newData.profile_id);
        if (!company?.employer) {
          setErrors((prev) => ({
            ...prev,
            profile_id: "No employer associated with this company",
          }));
        } else {
          setErrors((prev) => ({ ...prev, profile_id: "" }));
        }
      }
      return newData;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

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
      setAvailableSubSkills(skill.sub_skills || []);
      setSelectedSubSkills([]);
      setShowSkillModal(true);
      setErrors((prev) => ({ ...prev, skills_required: "", sub_skills: "" }));
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
    
    const updatedSkill = {
      skill_id: String(selectedSkill.id),
      skill_name: selectedSkill.name,
      sub_skills: selectedSubSkills,
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
      setAvailableSubSkills([]);
      setSelectedSubSkills([]);
      setEditingSkillId(null);
      setErrors((prev) => ({ ...prev, skills_required: "", sub_skills: "" }));
    }
  };

  const handleModalClose = () => {
    if (!isMountedRef.current) return;
    if (isMountedRef.current) {
      setShowSkillModal(false);
      setSelectedSkill(null);
      setAvailableSubSkills([]);
      setSelectedSubSkills([]);
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
    if (!formData.company_id) {
      newErrors.company_id = "Company is required";
    }
    if (!formData.profile_id) {
      newErrors.profile_id = "Profile is required";
    }
    if (formData.company_id && selectedCompany && String(selectedCompany.employer_id) !== formData.profile_id) {
      newErrors.profile_id = "Profile must match the company's employer";
    }
    if (!formData.description) {
      newErrors.description = "Job description is required";
    }
    if (!formData.job_type) {
      newErrors.job_type = "Job type is required";
    }
    if (!formData.city) {
      newErrors.city = "City is required";
    }
    if (!formData.province) {
      newErrors.province = "Province is required";
    }
    if (!formData.postal_code) {
      newErrors.postal_code = "Postal code is required";
    }
    if (!formData.country) {
      newErrors.country = "Country is required";
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
    if (formData.skills_required.length === 0) {
      newErrors.skills_required = "At least one skill is required";
    }
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
        // Format skills array to include sub-skills
        const formattedSkills = [];
        const formattedRanks = [];
        
        formData.skills_required.forEach(skill => {
          formattedSkills.push(skill.skill_name);
          if (skill.sub_skills && skill.sub_skills.length > 0) {
            formattedSkills.push(skill.sub_skills);
          } else {
            formattedSkills.push([]); // Empty array if no sub-skills
          }
          formattedRanks.push(skill.rank?.name || skill.rank);
        });

        const submitData = {
          ...formData,
          skills: formattedSkills,
          ranks: formattedRanks,
          application_start: formData.application_start ? `${formData.application_start}:00` : "",
          application_deadline: formData.application_deadline ? `${formData.application_deadline}:00` : "",
        };
        await onSubmit(submitData);
        message.success(isEdit ? "Job post updated successfully" : "Job post created successfully");
        onClose();
        onRefresh();
      } catch (error) {
        console.error("Error submitting job post:", error);
        const errorMessage = error.response?.data?.message || "Failed to submit job post";
        message.error(errorMessage);
        setErrors((prev) => ({ ...prev, submit: errorMessage }));
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
              <span>✏️</span>
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
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', color: '#ff4d4f' }}>
              <span>🗑️</span>
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
          <div className="form-group">
            <label htmlFor="company_id">Company</label>
            <select
              id="company_id"
              value={formData.company_id}
              onChange={(e) => handleInputChange(e, "company_id")}
              required
            >
              <option value="" disabled>
                Select Company
              </option>
              {Array.isArray(companies) &&
                companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
            </select>
            {errors.company_id && <span className="error">{errors.company_id}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="profile_id">Profile</label>
            <select
              id="profile_id"
              value={formData.profile_id}
              onChange={(e) => handleInputChange(e, "profile_id")}
              required
              disabled
            >
              <option value="" disabled>
                Select Profile
              </option>
              {selectedCompany && companyEmployers[selectedCompany.id] ? (
                <option value={selectedCompany.employer_id}>
                  {getProfileName(companyEmployers[selectedCompany.id])}
                </option>
              ) : (
                <option value="" disabled>
                  No employer available
                </option>
              )}
            </select>
            {errors.profile_id && <span className="error">{errors.profile_id}</span>}
          </div>
          <div className="form-group">
            <label>Skills Required</label>
            <Select
              showSearch
              placeholder="Search and select skill"
              onSearch={setSearchTermSkills}
              onChange={handleSkillSelect}
              className="skill-select"
              optionFilterProp="children"
              style={{ width: '100%', marginBottom: '16px' }}
            >
              {filteredSkills.map((skill) => (
                <Option key={skill.id} value={String(skill.id)}>
                  {skill.name}
                </Option>
              ))}
            </Select>
            {errors.skills_required && <span className="error">{errors.skills_required}</span>}
            
            {formData.skills_required.length > 0 && (
              <div className="selected-skills">
                <h4>Selected Skills</h4>
                {formData.skills_required.map((skill) => (
                  <div key={skill.skill_id} className="skill-item-container">
                    <div className="skill-item">
                      <Dropdown overlay={skillMenu(skill)} trigger={["click"]}>
                        <button className="skill-item ant-dropdown-trigger" type="button">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontWeight: '500' }}>{skill.skill_name}</span>
                            {skill.sub_skills?.length > 0 && (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#8c8c8c', 
                                fontStyle: 'italic'
                              }}>
                                Sub-skills: {skill.sub_skills.join(", ")}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <IconChevronDown size={16} />
                            <span style={{ fontSize: '10px', color: '#8c8c8c' }}>Actions</span>
                          </div>
                        </button>
                      </Dropdown>
                    </div>
                    <div className="rank-select">
                      <select
                        value={skill.rank?.id || skill.rank}
                        onChange={(e) => handleRankChange(skill.skill_id, e.target.value)}
                      >
                        {availableRanks.map((rank) => (
                          <option key={rank.id} value={rank.id}>
                            {rank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <label htmlFor="job_type">Job Type</label>
            <select
              id="job_type"
              value={formData.job_type}
              onChange={(e) => handleInputChange(e, "job_type")}
              required
            >
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
            </select>
            {errors.job_type && <span className="error">{errors.job_type}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="street">Street</label>
            <input
              id="street"
              type="text"
              value={formData.street}
              onChange={(e) => handleInputChange(e, "street")}
              placeholder="Enter street address"
            />
            {errors.street && <span className="error">{errors.street}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange(e, "city")}
              placeholder="Enter city"
            />
            {errors.city && <span className="error">{errors.city}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="province">Province</label>
            <input
              id="province"
              type="text"
              value={formData.province}
              onChange={(e) => handleInputChange(e, "province")}
              placeholder="Enter province"
            />
            {errors.province && <span className="error">{errors.province}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="postal_code">Postal Code</label>
            <input
              id="postal_code"
              type="text"
              value={formData.postal_code}
              onChange={(e) => handleInputChange(e, "postal_code")}
              placeholder="Enter postal code"
            />
            {errors.postal_code && <span className="error">{errors.postal_code}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange(e, "country")}
              placeholder="Enter country"
            />
            {errors.country && <span className="error">{errors.country}</span>}
          </div>
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
  );
};

export default JobPostModal;