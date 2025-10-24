import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "./../../../../sass/components/_bookingmodal.scss";

const BookingModal = ({ isOpen, onClose, onSubmit, isEdit, initialData, skills = [] }) => {
  const [formData, setFormData] = useState({
    employer_name: "",
    worker_name: "",
    service_type: "",
    sub_skill: "",
    work_type: "",
    description: "",
    book_in: "",
    book_end: "",
    time_in: "",
    time_out: "",
    daily_rate: "",
    total_amount: "",
    status: "pending"
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        setFormData({
          employer_name: initialData.employer_name || "",
          worker_name: initialData.worker_name || "",
          service_type: initialData.service_type || "",
          sub_skill: initialData.sub_skill || "",
          work_type: initialData.work_type || "",
          description: initialData.description || "",
          book_in: initialData.book_in ? new Date(initialData.book_in).toISOString().slice(0, 16) : "",
          book_end: initialData.book_end ? new Date(initialData.book_end).toISOString().slice(0, 16) : "",
          time_in: initialData.time_in ? new Date(initialData.time_in).toISOString().slice(0, 16) : "",
          time_out: initialData.time_out ? new Date(initialData.time_out).toISOString().slice(0, 16) : "",
          daily_rate: initialData.daily_rate || "",
          total_amount: initialData.total_amount || "",
          status: initialData.status || "pending"
        });
      } else {
        setFormData({
          employer_name: "",
          worker_name: "",
          service_type: "",
          sub_skill: "",
          work_type: "",
          description: "",
          book_in: "",
          book_end: "",
          time_in: "",
          time_out: "",
          daily_rate: "",
          total_amount: "",
          status: "pending"
        });
      }
      setErrors({});
    }
  }, [isOpen, isEdit, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employer_name.trim()) {
      newErrors.employer_name = "Employer name is required";
    }

    if (!formData.worker_name.trim()) {
      newErrors.worker_name = "Worker name is required";
    }

    if (!formData.service_type.trim()) {
      newErrors.service_type = "Service type is required";
    }

    if (!formData.work_type.trim()) {
      newErrors.work_type = "Work type is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.book_in) {
      newErrors.book_in = "Book in date is required";
    }

    if (!formData.book_end) {
      newErrors.book_end = "Book end date is required";
    }

    if (!formData.daily_rate || formData.daily_rate <= 0) {
      newErrors.daily_rate = "Daily rate must be greater than 0";
    }

    if (!formData.total_amount || formData.total_amount <= 0) {
      newErrors.total_amount = "Total amount must be greater than 0";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay" onClick={handleClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h2>{isEdit ? "Edit Booking" : "Add New Booking"}</h2>
          <button className="close-button" onClick={handleClose} disabled={isSubmitting}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="booking-modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employer_name">Employer Name *</label>
              <input
                type="text"
                id="employer_name"
                name="employer_name"
                value={formData.employer_name}
                onChange={handleInputChange}
                className={errors.employer_name ? "error" : ""}
                disabled={isSubmitting}
                placeholder="Enter employer name"
              />
              {errors.employer_name && <span className="error-message">{errors.employer_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="worker_name">Worker Name *</label>
              <input
                type="text"
                id="worker_name"
                name="worker_name"
                value={formData.worker_name}
                onChange={handleInputChange}
                className={errors.worker_name ? "error" : ""}
                disabled={isSubmitting}
                placeholder="Enter worker name"
              />
              {errors.worker_name && <span className="error-message">{errors.worker_name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="service_type">Service Type *</label>
              <select
                id="service_type"
                name="service_type"
                value={formData.service_type}
                onChange={handleInputChange}
                className={errors.service_type ? "error" : ""}
                disabled={isSubmitting}
              >
                <option value="">Select Service Type</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.name}>
                    {skill.name}
                  </option>
                ))}
              </select>
              {errors.service_type && <span className="error-message">{errors.service_type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sub_skill">Sub Skill</label>
              <select
                id="sub_skill"
                name="sub_skill"
                value={formData.sub_skill}
                onChange={handleInputChange}
                disabled={isSubmitting}
              >
                <option value="">Select Sub Skill</option>
                {skills.map((skill) => 
                  skill.sub_skills && skill.sub_skills.length > 0 ? (
                    skill.sub_skills.map((subSkill, index) => (
                      <option key={`${skill.id}-${index}`} value={subSkill}>
                        {subSkill}
                      </option>
                    ))
                  ) : null
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="work_type">Work Type *</label>
              <select
                id="work_type"
                name="work_type"
                value={formData.work_type}
                onChange={handleInputChange}
                className={errors.work_type ? "error" : ""}
                disabled={isSubmitting}
              >
                <option value="">Select Work Type</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="freelance">Freelance</option>
              </select>
              {errors.work_type && <span className="error-message">{errors.work_type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={errors.status ? "error" : ""}
                disabled={isSubmitting}
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status && <span className="error-message">{errors.status}</span>}
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? "error" : ""}
              disabled={isSubmitting}
              rows="4"
              placeholder="Describe the work to be done..."
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="book_in">Book In Date & Time *</label>
              <input
                type="datetime-local"
                id="book_in"
                name="book_in"
                value={formData.book_in}
                onChange={handleInputChange}
                className={errors.book_in ? "error" : ""}
                disabled={isSubmitting}
              />
              {errors.book_in && <span className="error-message">{errors.book_in}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="book_end">Book End Date & Time *</label>
              <input
                type="datetime-local"
                id="book_end"
                name="book_end"
                value={formData.book_end}
                onChange={handleInputChange}
                className={errors.book_end ? "error" : ""}
                disabled={isSubmitting}
              />
              {errors.book_end && <span className="error-message">{errors.book_end}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="time_in">Time In Date & Time</label>
              <input
                type="datetime-local"
                id="time_in"
                name="time_in"
                value={formData.time_in}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="time_out">Time Out Date & Time</label>
              <input
                type="datetime-local"
                id="time_out"
                name="time_out"
                value={formData.time_out}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="daily_rate">Daily Rate *</label>
              <input
                type="number"
                id="daily_rate"
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleInputChange}
                className={errors.daily_rate ? "error" : ""}
                disabled={isSubmitting}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              {errors.daily_rate && <span className="error-message">{errors.daily_rate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="total_amount">Total Amount *</label>
              <input
                type="number"
                id="total_amount"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleInputChange}
                className={errors.total_amount ? "error" : ""}
                disabled={isSubmitting}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              {errors.total_amount && <span className="error-message">{errors.total_amount}</span>}
            </div>
          </div>

          <div className="booking-modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : (isEdit ? "Update Booking" : "Create Booking")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
