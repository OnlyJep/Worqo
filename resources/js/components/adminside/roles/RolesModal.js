import React, { useState, useEffect } from "react";
import "./../../../../sass/components/_rolesmodal.scss";

const RolesModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      name: initialData.name || "",
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Role name is required";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="employermodal-overlay">
      <div className="employermodal">
        <h2>{isEdit ? "Edit Role" : "Add New Role"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="employermodal-content">
            <div className="form-group">
              <label htmlFor="name">Role Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "error" : ""}
                placeholder="Enter role name"
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>
          </div>
          <div className="employermodal-buttons">
            <button type="submit" className="submit-button">
              {isEdit ? "Update" : "Add"}
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolesModal;