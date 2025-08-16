import React, { useState, useEffect } from "react";
import "./../../../../sass/components/_colorcodecollarsmodal.scss";

const CollarIcon = ({ color, borderColor }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={borderColor} strokeWidth="2">
    <rect x="4" y="6" width="16" height="12" rx="2" fill={color} />
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

const ColorCodeCollarsModal = ({ onClose, onSubmit, isEdit = false, initialData = {} }) => {
  const [name, setName] = useState(initialData.name || "");
  const [color, setColor] = useState(initialData.color || "#4A90E2");
  const [errors, setErrors] = useState({ name: "" });

  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.name || "");
      setColor(initialData.color || "#4A90E2");
    }
  }, [isEdit, initialData]);

  const validateForm = () => {
    let valid = true;
    const newErrors = { name: "" };

    if (!name.trim()) {
      newErrors.name = "Collar name is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit({ name, color });
  };

  return (
    <div className="employermodal-overlay">
      <div className="employermodal">
        <h2>{isEdit ? "Edit Collar" : "Add New Collar"}</h2>
        <div className="employermodal-content">
          <div className="form-group">
            <label htmlFor="name">Collar Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collar name"
              className={errors.name ? "error" : ""}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="color">Collar Color</label>
            <div className="color-wrapper">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-picker"
              />
              <CollarIcon color={color} borderColor={color} />
            </div>
          </div>
        </div>
        <div className="employermodal-buttons">
          <button className="submit-button" onClick={handleSubmit}>
            {isEdit ? "Update" : "Save"}
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorCodeCollarsModal;