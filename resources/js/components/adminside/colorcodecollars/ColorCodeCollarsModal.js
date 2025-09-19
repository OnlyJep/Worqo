import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import "./../../../../sass/components/_colorcodecollarsmodal.scss";

const CollarsModal = ({ onClose, onSubmit, isEdit = false, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    collar_img: null,
    image_url: initialData.image_url || null,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || "",
        collar_img: null,
        image_url: initialData.image_url || null,
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, collar_img: null, image_url: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Collar name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      name: formData.name.trim(),
      collar_img: formData.collar_img,
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
        <h2>{isEdit ? "Edit Collar" : "Add New Collar"}</h2>
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
            <label>Collar Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange(e, "name")}
              placeholder="Enter collar name"
              required
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>Collar Image (optional)</label>
            <div className="image-upload-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleInputChange(e, "collar_img")}
                ref={fileInputRef}
                className="image-upload"
              />
              {(formData.collar_img || formData.image_url) && (
                <div className="image-preview">
                  <img
                    src={
                      formData.collar_img
                        ? URL.createObjectURL(formData.collar_img)
                        : formData.image_url || "https://via.placeholder.com/40"
                    }
                    alt="Collar Preview"
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
            {errors.collar_img && <span className="error">{errors.collar_img}</span>}
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

export default CollarsModal;