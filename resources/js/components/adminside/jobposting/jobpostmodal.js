import React, { useState, useEffect } from "react";
import "./../../../../sass/components/jobpostmodal.scss";

const JobPostModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    company_name: "",
    owner: { first_name: "", middlename: "", last_name: "", suffix: "" },
    skills: [{ name: "", rank: "Bronze 3" }],
    description: "",
    requirements: "",
  });

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        company_name: initialData.company_name || "",
        owner: {
          first_name: initialData.owner?.first_name || "",
          middlename: initialData.owner?.middlename || "",
          last_name: initialData.owner?.last_name || "",
          suffix: initialData.owner?.suffix || "",
        },
        skills: initialData.skills?.length > 0 ? initialData.skills : [{ name: "", rank: "Bronze 3" }],
        description: initialData.description || "",
        requirements: initialData.requirements || "",
      });
    }
  }, [isEdit, initialData]);

  const handleInputChange = (e, field, subfield) => {
    if (subfield) {
      setFormData((prev) => ({
        ...prev,
        [field]: { ...prev[field], [subfield]: e.target.value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    }
  };

  const handleSkillChange = (index, field, value) => {
    setFormData((prev) => {
      const newSkills = [...prev.skills];
      newSkills[index] = { ...newSkills[index], [field]: value };
      return { ...prev, skills: newSkills };
    });
  };

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: "", rank: "Bronze 3" }],
    }));
  };

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="jobpostmodal-overlay">
      <div className="jobpostmodal">
        <h2>{isEdit ? "Edit Job Post" : "Add New Job Post"}</h2>
        <div className="jobpostmodal-content">
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange(e, "company_name")}
              placeholder="Enter company name"
            />
          </div>
          <div className="form-group">
            <label>Owner</label>
            <div className="owner-fields">
              <input
                type="text"
                value={formData.owner.first_name}
                onChange={(e) => handleInputChange(e, "owner", "first_name")}
                placeholder="First Name"
              />
              <input
                type="text"
                value={formData.owner.middlename}
                onChange={(e) => handleInputChange(e, "owner", "middlename")}
                placeholder="Middle Name"
              />
              <input
                type="text"
                value={formData.owner.last_name}
                onChange={(e) => handleInputChange(e, "owner", "last_name")}
                placeholder="Last Name"
              />
              <input
                type="text"
                value={formData.owner.suffix}
                onChange={(e) => handleInputChange(e, "owner", "suffix")}
                placeholder="Suffix"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Skills</label>
            {formData.skills.map((skill, index) => (
              <div key={index} className="skill-row">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => handleSkillChange(index, "name", e.target.value)}
                  placeholder="Skill Name"
                />
                <select
                  value={skill.rank}
                  onChange={(e) => handleSkillChange(index, "rank", e.target.value)}
                >
                  <option value="Bronze 3">Bronze 3</option>
                  <option value="Silver 2">Silver 2</option>
                  <option value="Gold 1">Gold 1</option>
                </select>
                {formData.skills.length > 1 && (
                  <button className="remove-skill" onClick={() => removeSkill(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button className="add-skill" onClick={addSkill}>
              Add Skill
            </button>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange(e, "description")}
              placeholder="Enter job description"
            />
          </div>
          <div className="form-group">
            <label>Requirements</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange(e, "requirements")}
              placeholder="Enter job requirements"
            />
          </div>
        </div>
        <div className="jobpostmodal-buttons">
          <button className="submit-button" onClick={handleSubmit}>
            {isEdit ? "Update" : "Add"}
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