import React, { useState } from "react";

const SkillModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Skill name is required");
      return;
    }
    try {
      await onSubmit({ name });
      setError("");
    } catch (error) {
      const errorMessage = error || "An error occurred";
      setError(errorMessage);
      alert(errorMessage);
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