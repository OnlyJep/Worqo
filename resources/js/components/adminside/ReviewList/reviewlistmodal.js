import React, { useState, useEffect, useRef } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "./../../../../sass/components/reviewmodal.scss";

const ReviewModal = ({ onClose, onRefresh, isEdit, initialData, employers, workers }) => {
  const [formData, setFormData] = useState({
    user: { id: "", role_id: null, first_name: "", middlename: "", last_name: "", suffix: "" },
    reviewedUser: { id: "", role_id: null, first_name: "", middlename: "", last_name: "", suffix: "" },
    rating: 0,
    comment: "",
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const abortControllerRef = useRef(null);

  // Initialize form data for edit mode
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    if (isEdit && initialData) {
      setFormData({
        user: initialData.user || {
          id: "",
          role_id: null,
          first_name: "",
          middlename: "",
          last_name: "",
          suffix: "",
        },
        reviewedUser: initialData.reviewedUser || {
          id: "",
          role_id: null,
          first_name: "",
          middlename: "",
          last_name: "",
          suffix: "",
        },
        rating: initialData.rating || 0,
        comment: initialData.comment || "",
      });
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEdit, initialData]);

  const getFullName = (person) => {
    if (!person) return "N/A";
    const profile = person.profile || person;
    const { first_name, middlename, last_name, suffix, username } = profile;
    let fullName = `${first_name || username || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;
    if (suffix) fullName += ` ${suffix}`;
    return fullName.trim() || "N/A";
  };

  const handleUserChange = (e) => {
    const selectedId = e.target.value;
    const selectedUser = employers.find((user) => user.id === parseInt(selectedId)) || {
      id: "",
      role_id: null,
      first_name: "",
      middlename: "",
      last_name: "",
      suffix: "",
    };
    console.log("Selected reviewer:", selectedUser);
    setFormData((prev) => ({
      ...prev,
      user: selectedUser,
      reviewedUser: { id: "", role_id: null, first_name: "", middlename: "", last_name: "", suffix: "" },
    }));
    setErrors((prev) => ({ ...prev, user: "", reviewedUser: "" }));
    setSubmitError(null);
  };

  const handleReviewedUserChange = (e) => {
    const selectedId = e.target.value;
    const selectedUser = workers.find((user) => user.id === parseInt(selectedId)) || {
      id: "",
      role_id: null,
      first_name: "",
      middlename: "",
      last_name: "",
      suffix: "",
    };
    console.log("Selected reviewed user:", selectedUser);
    setFormData((prev) => ({ ...prev, reviewedUser: selectedUser }));
    setErrors((prev) => ({ ...prev, reviewedUser: "" }));
    setSubmitError(null);
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSubmitError(null);
  };

  const setRating = (newRating) => {
    setFormData((prev) => ({ ...prev, rating: newRating }));
    setErrors((prev) => ({ ...prev, rating: "" }));
    setSubmitError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.user.id) newErrors.user = "Reviewer is required";
    if (!formData.reviewedUser.id) newErrors.reviewedUser = "Reviewed user is required";
    if (formData.rating === 0) newErrors.rating = "Rating is required";
    if (formData.comment.length > 1000) newErrors.comment = "Comment cannot exceed 1000 characters";
    if (formData.user.role_id === 2 && formData.reviewedUser.role_id !== 1) {
      newErrors.reviewedUser = "Employers can only review workers";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitError(null);
    setLoading(true);

    try {
      const payload = {
        user_id: parseInt(formData.user.id),
        reviewed_user_id: parseInt(formData.reviewedUser.id),
        rating: formData.rating,
        comment: formData.comment,
      };
      const url = isEdit
        ? `http://127.0.0.1:8000/api/reviews/${initialData.id}`
        : `http://127.0.0.1:8000/api/reviews`; // Fixed URL typo
      await axios({
        method: isEdit ? "PUT" : "POST",
        url,
        data: payload,
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
      });
      await onRefresh();
      onClose();
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Submit canceled:", error.message);
      } else {
        if (error.response?.status === 422) {
          const validationErrors = error.response.data.errors || {};
          setErrors((prev) => ({
            ...prev,
            ...Object.keys(validationErrors).reduce((acc, key) => ({
              ...acc,
              [key]: validationErrors[key][0],
            }), {}),
          }));
          setSubmitError("Please correct the errors in the form.");
        } else {
          setSubmitError("Failed to submit review. Please try again.");
          console.error("Submit error:", error.response?.data || error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter workers to only include those with role_id: 1
  const filteredWorkers = workers.filter((worker) => worker.role_id === 1);

  // Check if workers and employers are arrays
  const isWorkersLoaded = Array.isArray(filteredWorkers);
  const isEmployersLoaded = Array.isArray(employers);

  return (
    <div className="reviewmodal-overlay">
      <div className="reviewmodal">
        <h2>{isEdit ? "Edit Review" : "Add New Review"}</h2>
        {submitError && <div className="error">{submitError}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : !isWorkersLoaded || !isEmployersLoaded ? (
          <div>Error: User data not loaded. Please try again later.</div>
        ) : (
          <div className="reviewmodal-content">
            <div className="form-group">
              <label htmlFor="user">Reviewer (Employer)</label>
              <select id="user" value={formData.user.id} onChange={handleUserChange} required>
                <option value="">Select Reviewer</option>
                {employers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getFullName(emp)} (Employer)
                  </option>
                ))}
              </select>
              {errors.user && <span className="error">{errors.user}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="reviewedUser">Reviewed User (Worker)</label>
              <select
                id="reviewedUser"
                value={formData.reviewedUser.id}
                onChange={handleReviewedUserChange}
                required
                disabled={!formData.user.id}
              >
                <option value="">Select Reviewed User</option>
                {filteredWorkers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {getFullName(worker)} (Worker)
                  </option>
                ))}
              </select>
              {errors.reviewedUser && <span className="error">{errors.reviewedUser}</span>}
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
              />
              {errors.comment && <span className="error">{errors.comment}</span>}
            </div>
          </div>
        )}
        <div className="reviewmodal-buttons">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={loading || !isWorkersLoaded || !isEmployersLoaded}
          >
            {isEdit ? "Update" : "Create"}
          </button>
          <button className="cancel-button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;