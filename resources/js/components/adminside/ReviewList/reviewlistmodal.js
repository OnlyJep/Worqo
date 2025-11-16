import React, { useState, useEffect, useRef, useMemo } from "react";
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
    const selectedUser = allUsers.find((user) => user.id === parseInt(selectedId)) || {
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
    const selectedUser = allUsers.find((user) => user.id === parseInt(selectedId)) || {
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
    if (formData.comment && formData.comment.length > 1000) newErrors.comment = "Comment cannot exceed 1000 characters";
    if (formData.user.id === formData.reviewedUser.id) {
      newErrors.reviewedUser = "Cannot review yourself";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitError(null);

    try {
      // Ensure all values are properly formatted
      const userId = parseInt(formData.user.id);
      const reviewedUserId = parseInt(formData.reviewedUser.id);
      const rating = parseInt(formData.rating);
      
      // Validate values before sending
      if (isNaN(userId) || isNaN(reviewedUserId) || isNaN(rating)) {
        setSubmitError("Invalid user or rating data. Please select both users and a rating.");
        return;
      }
      
      if (rating < 1 || rating > 5) {
        setSubmitError("Rating must be between 1 and 5.");
        return;
      }
      
      const payload = {
        user_id: userId,
        reviewed_user_id: reviewedUserId,
        rating: rating,
        comment: formData.comment.trim() || null,
      };
      
      console.log("Submitting review payload:", payload);
      
      const url = isEdit
        ? `/api/reviews/${initialData.id}`
        : `/api/reviews`;
      await axios({
        method: isEdit ? "PUT" : "POST",
        url,
        data: payload,
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
      });
      
      // Show success alert
      alert(isEdit ? "Review updated successfully!" : "Review added successfully!");
      
      await onRefresh();
      onClose();
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Submit canceled:", error.message);
        return;
      }
      
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors || {};
        console.error("Validation errors:", validationErrors);
        console.error("Full error response:", error.response.data);
        
        // Map backend field names to frontend field names
        const newErrors = {};
        let errorMessages = [];
        
        Object.keys(validationErrors).forEach((key) => {
          const errorArray = Array.isArray(validationErrors[key]) 
            ? validationErrors[key] 
            : [validationErrors[key]];
          const message = errorArray[0];
          
          if (key === 'user_id') {
            newErrors.user = message;
          } else if (key === 'reviewed_user_id') {
            newErrors.reviewedUser = message;
          } else if (key === 'rating') {
            newErrors.rating = message;
          } else if (key === 'comment') {
            newErrors.comment = message;
          } else {
            newErrors[key] = message;
          }
          
          errorMessages.push(`${key}: ${message}`);
        });
        
        setErrors(newErrors);
        setSubmitError(errorMessages.length > 0 
          ? `Validation failed: ${errorMessages.join('; ')}` 
          : "Please correct the errors in the form.");
      } else if (error.response?.status === 409) {
        setSubmitError("A review already exists for this user combination.");
      } else if (error.response?.status === 403) {
        setSubmitError("You are not authorized to perform this action.");
      } else {
        setSubmitError(error.response?.data?.error || "Failed to submit review. Please try again.");
        console.error("Submit error:", error.response?.data || error);
      }
    }
  };

  // Use all workers and employers without role filtering, deduplicated by ID
  const allUsers = useMemo(() => {
    const allUsersRaw = [...(employers || []), ...(workers || [])];
    // Remove duplicates by ID - keep the first occurrence
    return allUsersRaw.filter((user, index, self) => 
      index === self.findIndex((u) => u.id === user.id)
    );
  }, [employers, workers]);

  // Check if workers and employers are arrays
  const isWorkersLoaded = Array.isArray(workers);
  const isEmployersLoaded = Array.isArray(employers);
  const hasUsers = (workers && workers.length > 0) || (employers && employers.length > 0);

  return (
    <div className="reviewmodal-overlay">
      <div className="reviewmodal">
        <h2>{isEdit ? "Edit Review" : "Add New Review"}</h2>
        {submitError && <div className="error">{submitError}</div>}
        {!isWorkersLoaded || !isEmployersLoaded ? (
          <div>Loading user data...</div>
        ) : !hasUsers ? (
          <div>No users available for review. Please ensure there are users in the system.</div>
        ) : (
          <div className="reviewmodal-content">
            <div className="form-group">
              <label htmlFor="user">Reviewer</label>
              <select id="user" value={formData.user.id} onChange={handleUserChange} required>
                <option value="">Select Reviewer</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getFullName(user)}
                  </option>
                ))}
              </select>
              {errors.user && <span className="error">{errors.user}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="reviewedUser">Reviewed User</label>
              <select
                id="reviewedUser"
                value={formData.reviewedUser.id}
                onChange={handleReviewedUserChange}
                required
                disabled={!formData.user.id}
              >
                <option value="">Select Reviewed User</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getFullName(user)}
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
            disabled={!hasUsers}
          >
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