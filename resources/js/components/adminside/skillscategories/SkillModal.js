import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import "./../../../../sass/components/_adminmodal.scss"; // Adjust path if needed

const SkillModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [subSkills, setSubSkills] = useState(initialData?.sub_skills?.length ? initialData.sub_skills : [""]);
  const [error, setError] = useState("");

  // Debug initial state
  useEffect(() => {
    console.log("SkillModal initialData:", initialData);
    console.log("Initial subSkills:", subSkills);
  }, [initialData]);

  const handleSubSkillChange = (index, value) => {
    const newSubSkills = [...subSkills];
    newSubSkills[index] = value;
    setSubSkills(newSubSkills);
    console.log("Updated subSkills:", newSubSkills); // Debug state update
  };

  const addSubSkillField = () => {
    setSubSkills([...subSkills, ""]);
    console.log("Added sub-skill field. New subSkills:", [...subSkills, ""]);
  };

  const removeSubSkillField = (index) => {
    if (subSkills.length > 1) {
      const newSubSkills = subSkills.filter((_, i) => i !== index);
      setSubSkills(newSubSkills);
      console.log("Removed sub-skill field. New subSkills:", newSubSkills);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Skill name is required");
      return;
    }
    const validSubSkills = subSkills
      .map((skill) => skill.trim())
      .filter((skill) => skill);
    console.log("Submitting:", { name, sub_skills: validSubSkills }); // Debug submission
    try {
      await onSubmit({ name, sub_skills: validSubSkills });
      setError("");
      onClose(); // Close modal on success
    } catch (error) {
      const errorMessage = error?.response?.data?.errors?.name?.[0] || "An error occurred";
      setError(errorMessage);
      console.error("Submission error:", errorMessage);
    }
  };

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>{isEdit ? "Edit Skill" : "Add New Skill"}</h2>
        <div className="adminmodal-content">
          <div className="form-group">
            <label>Skill Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Enter skill name"
            />
            {error && <span className="error">{error}</span>}
          </div>
          <div className="form-group">
            <label>Sub-Skills (Optional)</label>
            {subSkills.map((subSkill, index) => (
              <div key={index} className="sub-skill-input">
                <input
                  type="text"
                  value={subSkill}
                  onChange={(e) => handleSubSkillChange(index, e.target.value)}
                  placeholder={`Sub-Skill ${index + 1}`}
                />
                <div className="sub-skill-actions">
                  {subSkills.length > 1 && (
                    <button
                      className="remove-sub-skill"
                      onClick={() => removeSubSkillField(index)}
                      title="Remove Sub-Skill"
                    >
                      <FaMinus size={16} />
                    </button>
                  )}
                  {index === subSkills.length - 1 && (
                    <button
                      className="add-sub-skill"
                      onClick={addSubSkillField}
                      title="Add Sub-Skill"
                    >
                      <FaPlus size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="adminmodal-buttons">
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

export default SkillModal;