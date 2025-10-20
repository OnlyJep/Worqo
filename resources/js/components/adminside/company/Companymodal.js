import React, { useState, useEffect, useRef } from "react";
import { Select } from "antd";
import { message } from "antd";
import "./../../../../sass/components/_companymodal.scss";

const { Option } = Select;

const CompanyModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sub_skills: Array.isArray(initialData?.sub_skills) ? initialData.sub_skills : [],
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    isMountedRef.current = true;

    // Log props and formData for debugging
    console.log("SkillModal props:", { initialData });
    console.log("formData after initialization:", formData);

    // For skills, we don't need external data loading
    setDataLoaded(true);

    // Reset errors and API error
    if (isMountedRef.current) {
      setApiError("");
      setErrors({});
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialData]);

  const handleChange = (value, name) => {
    const fieldValue = typeof value === 'object' && value.target ? value.target.value : value;
    const fieldName = typeof value === 'object' && value.target ? value.target.name : name;

    if (fieldName === "contact_number" && fieldValue && !/^\+?[\d\s-]*$/.test(fieldValue)) {
      return;
    }

    if (isMountedRef.current) {
      setFormData((prev) => ({ ...prev, [fieldName]: fieldValue }));
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      setApiError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Skill name is required";

    if (isMountedRef.current) {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (typeof onSubmit !== 'function') {
      console.error("onSubmit is not a function:", onSubmit);
      setApiError("Submission handler is not available. Please try again.");
      return;
    }

    const submitData = {
      name: formData.name || "",
      sub_skills: formData.sub_skills || [],
    };

    console.log("FormData before submission:", {
      name: formData.name,
      sub_skills: formData.sub_skills,
    });

    try {
      setIsLoading(true);
      await onSubmit(submitData, abortControllerRef.current.signal);
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
    } finally {
      setIsLoading(false);
    }
  };

  const [newSubSkill, setNewSubSkill] = useState("");

  const addSubSkill = () => {
    if (newSubSkill.trim() && !formData.sub_skills.includes(newSubSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        sub_skills: [...prev.sub_skills, newSubSkill.trim()]
      }));
      setNewSubSkill("");
    }
  };

  const removeSubSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      sub_skills: prev.sub_skills.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="companymodal-overlay">
      <div className="companymodal">
        <h2>{isEdit ? "Edit Skill" : "Add Skill"}</h2>
        {apiError && (
          <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
            {apiError}
          </div>
        )}
        <div className="companymodal-content">
          <div className="form-group">
            <label>Skill Name <span style={{ color: "red" }}>*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange(e, "name")}
              placeholder="Enter skill name"
              required
              disabled={isLoading}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>Sub-Skills</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                type="text"
                value={newSubSkill}
                onChange={(e) => setNewSubSkill(e.target.value)}
                placeholder="Enter sub-skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubSkill())}
                disabled={isLoading}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={addSubSkill}
                disabled={!newSubSkill.trim() || isLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#1A2A44",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Add
              </button>
            </div>
            {formData.sub_skills.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {formData.sub_skills.map((subSkill, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#f0f0f0",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      gap: "4px"
                    }}
                  >
                    <span>{subSkill}</span>
                    <button
                      type="button"
                      onClick={() => removeSubSkill(index)}
                      disabled={isLoading}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#666",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      ×
                    </button>
            </div>
                ))}
          </div>
            )}
          </div>
        </div>
        <div className="companymodal-buttons">
          <button className="cancel-button" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="submit-button" onClick={handleSubmit} disabled={isLoading}>
            {isEdit ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyModal;