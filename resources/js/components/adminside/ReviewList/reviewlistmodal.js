import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import "./../../../../sass/components/reviewmodal.scss";

const ReviewModal = ({ onClose, onSubmit, isEdit, initialData, employers, workers }) => {
  const [formData, setFormData] = useState({
    employer: { company_name: "", owner: { first_name: "", middlename: "", last_name: "", suffix: "" } },
    worker: { first_name: "", middlename: "", last_name: "", suffix: "" },
    rating: 0,
    comment: "",
    image: null,
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        employer: initialData.employer || { company_name: "", owner: { first_name: "", middlename: "", last_name: "", suffix: "" } },
        worker: initialData.worker || { first_name: "", middlename: "", last_name: "", suffix: "" },
        rating: initialData.rating || 0,
        comment: initialData.comment || "",
        image: null,
      });
    }
  }, [isEdit, initialData]);

  const getFullName = (person) => {
    const { first_name, middlename, last_name, suffix } = person;
    let fullName = `${first_name || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;
    if (suffix) fullName += ` ${suffix}`;
    return fullName.trim() || "N/A";
  };

  const handleEmployerChange = (e) => {
    const selectedCompany = e.target.value;
    const selectedEmployer = (employers ?? []).find(emp => emp.company_name === selectedCompany) || {
      company_name: "",
      owner: { first_name: "", middlename: "", last_name: "", suffix: "" }
    };
    setFormData((prev) => ({ ...prev, employer: selectedEmployer }));
    setErrors((prev) => ({ ...prev, employer: "" }));
  };

  const handleWorkerChange = (e) => {
    const selectedName = e.target.value;
    const selectedWorker = (workers ?? []).find(worker => getFullName(worker) === selectedName) || {
      first_name: "", middlename: "", last_name: "", suffix: ""
    };
    setFormData((prev) => ({ ...prev, worker: selectedWorker }));
    setErrors((prev) => ({ ...prev, worker: "" }));
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const setRating = (newRating) => {
    setFormData((prev) => ({ ...prev, rating: newRating }));
    setErrors((prev) => ({ ...prev, rating: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employer.company_name) newErrors.employer = "Employer is required";
    if (!formData.worker.first_name || !formData.worker.last_name) newErrors.worker = "Worker is required";
    if (formData.rating === 0) newErrors.rating = "Rating is required";
    if (!formData.comment) newErrors.comment = "Comment is required";
    if (formData.image && !['image/jpeg', 'image/png'].includes(formData.image.type)) {
      newErrors.image = "Image must be JPG or PNG";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        employer: formData.employer,
        worker: formData.worker,
        rating: formData.rating,
        comment: formData.comment,
        hasImage: !!formData.image,
      };
      onSubmit(submitData);
      onClose();
    }
  };

  return (
    <div className="reviewmodal-overlay">
      <div className="reviewmodal">
        <h2>{isEdit ? "Edit Review" : "Add New Review"}</h2>
        <div className="reviewmodal-content">
          <div className="form-group">
            <label htmlFor="employer">Employer</label>
            <select
              id="employer"
              value={formData.employer.company_name}
              onChange={handleEmployerChange}
              required
            >
              <option value="">Select Employer</option>
              {(employers ?? []).map((emp, index) => (
                <option key={index} value={emp.company_name}>
                  {emp.company_name || "N/A"}
                </option>
              ))}
            </select>
            {errors.employer && <span className="error">{errors.employer}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="worker">Worker</label>
            <select
              id="worker"
              value={getFullName(formData.worker)}
              onChange={handleWorkerChange}
              required
            >
              <option value="">Select Worker</option>
              {(workers ?? []).map((worker, index) => (
                <option key={index} value={getFullName(worker)}>
                  {getFullName(worker)}
                </option>
              ))}
            </select>
            {errors.worker && <span className="error">{errors.worker}</span>}
          </div>
          <div className="form-group">
            <label>Rating</label>
            <div className="star-rating">
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <label key={index}>
                    <input
                      type="radio"
                      name="rating"
                      value={ratingValue}
                      onClick={() => setRating(ratingValue)}
                      style={{ display: "none" }}
                    />
                    <FaStar
                      className="star"
                      color={ratingValue <= (hoverRating || formData.rating) ? "#ffc107" : "#e4e5e9"}
                      size={25}
                      onMouseEnter={() => setHoverRating(ratingValue)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  </label>
                );
              })}
            </div>
            {errors.rating && <span className="error">{errors.rating}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="comment">Comment</label>
            <textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange(e, "comment")}
              placeholder="Enter comment"
              required
            />
            {errors.comment && <span className="error">{errors.comment}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="image">Upload Image (Optional)</label>
            <input
              id="image"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
            />
            {formData.image && (
              <div className="profile-img-preview">
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Preview"
                  className="preview-img"
                />
                <button className="remove-img-button" onClick={removeImage}>
                  Remove
                </button>
              </div>
            )}
            {errors.image && <span className="error">{errors.image}</span>}
          </div>
        </div>
        <div className="reviewmodal-buttons">
          <button className="submit-button" onClick={handleSubmit}>
            {isEdit ? "Update" : "Create"}
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;