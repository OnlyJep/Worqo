import React, { useState, useEffect } from "react";
import axios from "axios";
import { message, Select } from "antd";
import "./../../../../sass/components/_servicemodal.scss";

const { Option } = Select;

const ServiceModal = ({ onClose, onSubmit, isEdit, initialData, skills: propSkills }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    color_collar_id: initialData?.color_collar_id || "",
    skill_ids: initialData?.skill_ids || [],
    service_image: initialData?.service_image || null,
    image_url: initialData?.image_url || null,
  });
  const [errors, setErrors] = useState({});
  const [colorCollars, setColorCollars] = useState([]);
  const [skills, setSkills] = useState(propSkills || []);
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState("");
  const [colorCollarsLoading, setColorCollarsLoading] = useState(true);
  const [colorCollarsError, setColorCollarsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchColorCollars = async () => {
      try {
        setColorCollarsLoading(true);
        const authToken = localStorage.getItem("auth_token");
        if (!authToken) {
          throw new Error("No auth token found. Please log in.");
        }
        const response = await axios.get("/api/collars", {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          signal: controller.signal,
          timeout: 15000,
        });
        const collarsData = Array.isArray(response.data.collars) ? response.data.collars : [];
        setColorCollars(collarsData);
        setColorCollarsError("");
        console.log("Color Collars fetched in ServiceModal:", collarsData);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching color collars:", error.response?.data || error.message);
        setColorCollarsError("Failed to fetch color collars. Please try again.");
        message.error("Failed to fetch color collars. Please try again.");
      } finally {
        setColorCollarsLoading(false);
      }
    };

    const fetchSkills = async () => {
      try {
        setSkillsLoading(true);
        const authToken = localStorage.getItem("auth_token");
        if (!authToken) {
          throw new Error("No auth token found. Please log in.");
        }
        const response = await axios.get("/api/skills", {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          signal: controller.signal,
          timeout: 15000,
        });
        const skillsData = Array.isArray(response.data) ? response.data : response.data.skills || [];
        setSkills(skillsData);
        setSkillsError("");
        console.log("Skills fetched in ServiceModal:", skillsData);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching skills:", error.response?.data || error.message);
        setSkillsError("Failed to fetch skills. Please try again.");
        message.error("Failed to fetch skills. Please try again.");
      } finally {
        setSkillsLoading(false);
      }
    };

    if (!propSkills || propSkills.length === 0) {
      fetchSkills();
    } else {
      setSkills(propSkills);
      setSkillsLoading(false);
      console.log("Using propSkills in ServiceModal:", propSkills);
    }

    fetchColorCollars();

    return () => {
      controller.abort();
      if (formData.image_url && formData.service_image instanceof File) {
        URL.revokeObjectURL(formData.image_url);
      }
    };
  }, [formData.image_url, formData.service_image, propSkills]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSkillChange = (value) => {
    setFormData((prev) => ({ ...prev, skill_ids: value }));
    if (errors.skill_ids) {
      setErrors((prev) => ({ ...prev, skill_ids: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (formData.image_url && formData.service_image instanceof File) {
        URL.revokeObjectURL(formData.image_url);
      }
      setFormData((prev) => ({
        ...prev,
        service_image: file,
        image_url: URL.createObjectURL(file),
      }));
      if (errors.service_image) {
        setErrors((prev) => ({ ...prev, service_image: "" }));
      }
    }
  };

  const handleRemoveImage = () => {
    if (formData.image_url && formData.service_image instanceof File) {
      URL.revokeObjectURL(formData.image_url);
    }
    setFormData((prev) => ({
      ...prev,
      service_image: null,
      image_url: null,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.color_collar_id) newErrors.color_collar_id = "Color collar is required";
    if (formData.skill_ids.length === 0) newErrors.skill_ids = "At least one skill is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const controller = new AbortController();
    try {
      setLoading(true);
      await onSubmit(formData, controller.signal);
      onClose();
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Submit error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(", ")
        : error.response?.data?.error || "Failed to submit service. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
      controller.abort();
    }
  };

  return (
    <div className="servicemodal-overlay">
      <div className="servicemodal">
        <h2>{isEdit ? "Edit Service" : "Add Service"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="servicemodal-content">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter service name"
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter service description"
                rows="4"
                style={{ resize: "vertical" }}
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="color_collar_id">Color Collar</label>
              {colorCollarsError ? (
                <div className="error">{colorCollarsError}</div>
              ) : colorCollars.length > 0 ? (
                <select
                  id="color_collar_id"
                  name="color_collar_id"
                  value={formData.color_collar_id}
                  onChange={handleInputChange}
                  disabled={colorCollarsLoading}
                >
                  <option value="">Select Color Collar</option>
                  {colorCollars.map((collar) => (
                    <option key={collar.id} value={collar.id}>
                      {collar.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="error">
                  No color collars available. {colorCollarsLoading ? "Loading..." : "Please try again later."}
                </div>
              )}
              {errors.color_collar_id && <span className="error">{errors.color_collar_id}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="skill_ids">What skills should we fetch inside the services?</label>
              {skillsError ? (
                <div className="error">{skillsError}</div>
              ) : skills.length > 0 ? (
                <Select
                  id="skill_ids"
                  mode="multiple"
                  value={formData.skill_ids}
                  onChange={handleSkillChange}
                  placeholder="Select skills"
                  allowClear
                  disabled={skillsLoading}
                  style={{ width: "100%" }}
                >
                  {skills.map((skill) => (
                    <Option key={skill.id} value={String(skill.id)}>
                      {skill.name}
                    </Option>
                  ))}
                </Select>
              ) : (
                <div className="error">No skills available. {skillsLoading ? "Loading..." : "Please try again later."}</div>
              )}
              {errors.skill_ids && <span className="error">{errors.skill_ids}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="service_image">Service Image</label>
              <input
                type="file"
                id="service_image"
                name="service_image"
                accept="image/*"
                onChange={handleFileChange}
              />
              {formData.image_url && (
                <div className="profile-img-preview">
                  <img src={formData.image_url} alt="Preview" className="preview-img" />
                  <button type="button" className="remove-img-button" onClick={handleRemoveImage}>
                    Remove Image
                  </button>
                </div>
              )}
              {formData.service_image instanceof File && (
                <span className="file-name">{formData.service_image.name}</span>
              )}
              {errors.service_image && <span className="error">{errors.service_image}</span>}
            </div>
          </div>
          <div className="servicemodal-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading || skillsLoading || colorCollarsLoading}>
              {isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;