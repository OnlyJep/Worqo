import React, { useState, useEffect } from "react";
import axios from "axios";
import { message } from "antd";
import "./../../../../sass/components/jobpostmodal.scss";

const JobPostModal = ({ onClose, onSubmit, isEdit, initialData, onRefresh }) => {
  const [formData, setFormData] = useState({
    company_id: "",
    profile_id: "",
    skills: [],
    ranks: [],
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

  useEffect(() => {
    // Fetch skills, ranks, and companies
    const fetchData = async () => {
      try {
        const [skillsResponse, ranksResponse, companiesResponse] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/skills"),
          axios.get("http://127.0.0.1:8000/api/ranks"),
          axios.get("http://127.0.0.1:8000/api/companies"),
        ]);
        setAvailableSkills(skillsResponse.data.map((skill) => skill.name));
        setAvailableRanks(ranksResponse.data.ranks.map((rank) => rank.name));
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
    if (isEdit && initialData && companies.length > 0) {
      const company = companies.find((c) => c.id === initialData.company_id);
      setSelectedCompany(company || null);
      setFormData({
        company_id: initialData.company_id || "",
        profile_id: company?.employer_id ? String(company.employer_id) : initialData.profile_id || "",
        skills: initialData.skills || [],
        ranks: initialData.ranks || [],
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

  const handleSkillChange = (index, field, value) => {
    setFormData((prev) => {
      const newSkills = [...prev.skills];
      const newRanks = [...prev.ranks];
      if (field === "name") {
        newSkills[index] = value;
      } else {
        newRanks[index] = value;
      }
      return { ...prev, skills: newSkills, ranks: newRanks };
    });
    setErrors((prev) => ({ ...prev, skills: "", ranks: "" }));
  };

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, ""],
      ranks: [...prev.ranks, "CX"],
    }));
  };

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
      ranks: prev.ranks.filter((_, i) => i !== index),
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
    if (formData.skills.length === 0 || !formData.skills.some((skill) => skill.trim())) {
      newErrors.skills = "At least one valid skill is required";
    }
    if (formData.ranks.length !== formData.skills.length) {
      newErrors.ranks = "Each skill must have a corresponding rank";
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
        const submitData = {
          ...formData,
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
            {formData.skills.map((skill, index) => (
              <div key={index} className="skill-row">
                <select
                  value={skill}
                  onChange={(e) => handleSkillChange(index, "name", e.target.value)}
                >
                  <option value="" disabled>
                    Select Skill
                  </option>
                  {availableSkills.map((skillOption) => (
                    <option key={skillOption} value={skillOption}>
                      {skillOption}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.ranks[index] || "CX"}
                  onChange={(e) => handleSkillChange(index, "rank", e.target.value)}
                >
                  {availableRanks.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
                {formData.skills.length > 1 && (
                  <button className="remove-skill" onClick={() => removeSkill(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button className="add-skill" onClick={addSkill}>
              Add Another Skill
            </button>
            {errors.skills && <span className="error">{errors.skills}</span>}
            {errors.ranks && <span className="error">{errors.ranks}</span>}
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
    </div>
  );
};

export default JobPostModal;