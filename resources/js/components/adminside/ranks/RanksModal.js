import React, { useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import "./../../../../sass/components/_ranksmodal.scss";

const RanksModal = ({ onClose, onSubmit, isEdit = false, initialData = {} }) => {
  const [name, setName] = useState(initialData.name || "");
  const [image, setImage] = useState(initialData.image || "");
  const [requiredReviews, setRequiredReviews] = useState(initialData.required_reviews || 0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Rank name is required");
      return;
    }
    if (!image) {
      setError("Rank image is required");
      return;
    }
    if (requiredReviews < 0 || !Number.isInteger(Number(requiredReviews))) {
      setError("Required reviews must be a positive integer");
      return;
    }
    onSubmit({ name, image, required_reviews: Number(requiredReviews) });
  };

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>{isEdit ? "Edit Rank" : "Add New Rank"}</h2>
        <div className="adminmodal-content">
          <div className="form-group">
            <label>Rank Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Enter rank name"
            />
            {error && <span className="error">{error}</span>}
          </div>
          <div className="form-group">
            <label>Rank Image</label>
            <div className="image-upload-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="image-upload"
              />
              {image && (
                <div className="image-preview">
                  <img src={image} alt="Rank Preview" />
                  <button className="remove-image-button" onClick={handleRemoveImage}>
                    <FaTimes size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Required Reviews</label>
            <input
              type="number"
              value={requiredReviews}
              onChange={(e) => {
                setRequiredReviews(e.target.value);
                setError("");
              }}
              placeholder="Enter required reviews"
              min="0"
            />
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

export default RanksModal;