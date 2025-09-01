import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import "./../../../../sass/components/_ranksModal.scss";

const RanksModal = ({ onClose, onSubmit, isEdit = false, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    image: null,
    image_url: initialData.image_url || null,
    required_reviews: initialData.required_reviews || 0,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || "",
        image: null,
        image_url: initialData.image_url || null,
        required_reviews: initialData.required_reviews || 0,
      });
      setErrors({});
      setApiError("");
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEdit, initialData]);

  const handleInputChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    if (field === "required_reviews" && value) {
      if (!/^\d*$/.test(value)) return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null, image_url: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Rank name is required";
    if (formData.required_reviews < 0 || !Number.isInteger(Number(formData.required_reviews))) {
      newErrors.required_reviews = "Required reviews must be a positive integer";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      name: formData.name.trim(),
      image: formData.image,
      required_reviews: Number(formData.required_reviews),
    };

    abortControllerRef.current = new AbortController();
    try {
      await onSubmit(submitData, abortControllerRef.current.signal);
      setApiError("");
      setErrors({});
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        setApiError("Please correct the errors in the form: " + JSON.stringify(error.response.data.errors));
      } else {
        setApiError(error.response?.data?.error || "An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>{isEdit ? "Edit Rank" : "Add New Rank"}</h2>
        {apiError && <div className="error api-error">{apiError}</div>}
        {Object.keys(errors).length > 0 && (
          <div className="error validation-errors">
            {Object.entries(errors).map(([field, message]) => (
              <div key={field}>{message}</div>
            ))}
          </div>
        )}
        <form className="adminmodal-content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rank Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange(e, "name")}
              placeholder="Enter rank name"
              required
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>Rank Image (optional)</label>
            <div className="image-upload-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleInputChange(e, "image")}
                ref={fileInputRef}
                className="image-upload"
              />
              {(formData.image || formData.image_url) && (
                <div className="image-preview">
                  <img
                    src={
                      formData.image
                        ? URL.createObjectURL(formData.image)
                        : formData.image_url || "https://via.placeholder.com/40"
                    }
                    alt="Rank Preview"
                    style={{ width: "100px", height: "100px", objectFit: "contain" }}
                  />
                  <button
                    className="remove-image-button"
                    type="button"
                    onClick={handleRemoveImage}
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              )}
            </div>
            {errors.image && <span className="error">{errors.image}</span>}
          </div>
          <div className="form-group">
            <label>Required Reviews</label>
            <input
              type="number"
              value={formData.required_reviews}
              onChange={(e) => handleInputChange(e, "required_reviews")}
              placeholder="Enter required reviews"
              min="0"
              required
            />
            {errors.required_reviews && <span className="error">{errors.required_reviews}</span>}
          </div>
          <div className="adminmodal-buttons">
            <button className="submit-button" type="submit">
              {isEdit ? "Update" : "Add"}
            </button>
            <button className="cancel-button" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RanksModal;