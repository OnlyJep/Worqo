import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";
import "./../../../../sass/components/_bookingmodal.scss";

const BookingModal = ({ isOpen, onClose, onSubmit, isEdit, initialData, skills = [], employers = [], workers = [] }) => {
  console.log("BookingModal - Employers:", employers);
  console.log("BookingModal - Workers:", workers);
  console.log("BookingModal - Employers length:", employers.length);
  console.log("BookingModal - Workers length:", workers.length);
  console.log("BookingModal - First employer:", employers[0]);
  console.log("BookingModal - First worker:", workers[0]);
  const [formData, setFormData] = useState({
    employer_id: "",
    worker_id: "",
    service_type: "",
    sub_skill: "",
    work_type: "",
    description: "",
    book_in: "",
    book_end: "",
    daily_rate: "",
    total_amount: "",
    status: "pending"
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState({
    isAvailable: true,
    conflictMessage: '',
    conflictingJobs: []
  });
  const [serviceTypeSearch, setServiceTypeSearch] = useState("");
  const [subSkillSearch, setSubSkillSearch] = useState("");

  // Function to get full name from user data
  const getFullName = (person) => {
    if (!person) {
      console.log("getFullName: person is null/undefined");
      return "N/A";
    }
    
    console.log("getFullName: processing person:", person);
    
    // Handle different data structures from different API endpoints
    let firstName, middleName, lastName, suffix, username, email;
    
    // Check if person has a profile object (from workers/employers API)
    if (person.profile) {
      firstName = person.profile.first_name;
      middleName = person.profile.middlename;
      lastName = person.profile.last_name;
      suffix = person.profile.suffix;
      username = person.username;
      email = person.email;
    } else {
      // Direct fields (from users-with-profiles API)
      firstName = person.first_name;
      middleName = person.middlename;
      lastName = person.last_name;
      suffix = person.suffix;
      username = person.username;
      email = person.email;
    }
    
    console.log("getFullName: extracted fields:", {
      firstName,
      middleName,
      lastName,
      suffix,
      username,
      email
    });
    
    // Construct name from available fields
    let name = firstName || "";
    if (middleName) {
      name += ` ${middleName}`;
    }
    if (lastName) {
      name += ` ${lastName}`;
    }
    if (suffix) {
      name += ` ${suffix}`;
    }
    
    const result = name.trim() || username || email || "Unknown User";
    console.log("getFullName: constructed name:", result);
    
    return result;
  };

  // Check worker availability for the selected dates
  const checkWorkerAvailability = async () => {
    try {
      const { book_in, book_end, worker_id } = formData;
      
      if (!book_in || !book_end || !worker_id) {
        setAvailabilityStatus({
          isAvailable: true,
          conflictMessage: '',
          conflictingJobs: []
        });
        return;
      }

      // Get worker's accepted job applications (hired jobs)
      const response = await fetch(`http://127.0.0.1:8000/api/job-applications/worker/${worker_id}?status=accepted`);
      const acceptedJobs = await response.json() || [];

      // Also get all job posts with work schedules to check for conflicts
      const jobPostsResponse = await fetch(`http://127.0.0.1:8000/api/jobposts?worker_id=${worker_id}&include_work_schedule=true`);
      const jobPostsData = await jobPostsResponse.json();
      const jobPosts = jobPostsData?.job_posts?.data || [];

      // Check for date conflicts
      const requestedStart = new Date(book_in);
      const requestedEnd = new Date(book_end);
      const conflictingJobs = [];

      // Check conflicts with accepted job applications
      for (const job of acceptedJobs) {
        if (job.job_post?.work_start && job.job_post?.work_end) {
          const jobStart = new Date(job.job_post.work_start);
          const jobEnd = new Date(job.job_post.work_end);

          // Check if there's any overlap between the requested dates and job dates
          if (
            (requestedStart >= jobStart && requestedStart <= jobEnd) ||
            (requestedEnd >= jobStart && requestedEnd <= jobEnd) ||
            (requestedStart <= jobStart && requestedEnd >= jobEnd)
          ) {
            conflictingJobs.push({
              jobTitle: job.job_post.job_title,
              workStart: job.job_post.work_start,
              workEnd: job.job_post.work_end,
              employer: job.job_post.profile?.first_name + ' ' + job.job_post.profile?.last_name,
              type: 'hired'
            });
          }
        }
      }

      // Check conflicts with job posts that have fixed work schedules
      for (const jobPost of jobPosts) {
        if (jobPost.work_start && jobPost.work_end) {
          const jobStart = new Date(jobPost.work_start);
          const jobEnd = new Date(jobPost.work_end);

          // Check if there's any overlap between the requested dates and job post work schedule
          if (
            (requestedStart >= jobStart && requestedStart <= jobEnd) ||
            (requestedEnd >= jobStart && requestedEnd <= jobEnd) ||
            (requestedStart <= jobStart && requestedEnd >= jobEnd)
          ) {
            conflictingJobs.push({
              jobTitle: jobPost.job_title,
              workStart: jobPost.work_start,
              workEnd: jobPost.work_end,
              employer: jobPost.profile?.first_name + ' ' + jobPost.profile?.last_name,
              type: 'scheduled'
            });
          }
        }
      }

      if (conflictingJobs.length > 0) {
        const hiredCount = conflictingJobs.filter(job => job.type === 'hired').length;
        const scheduledCount = conflictingJobs.filter(job => job.type === 'scheduled').length;
        
        let conflictMessage = 'Worker is not available during the selected period. ';
        if (hiredCount > 0 && scheduledCount > 0) {
          conflictMessage += `They are already hired for ${hiredCount} job(s) and have ${scheduledCount} scheduled job(s) during this time.`;
        } else if (hiredCount > 0) {
          conflictMessage += `They are already hired for ${hiredCount} job(s) during this time.`;
        } else {
          conflictMessage += `They have ${scheduledCount} scheduled job(s) during this time.`;
        }

        setAvailabilityStatus({
          isAvailable: false,
          conflictMessage: conflictMessage,
          conflictingJobs: conflictingJobs
        });
      } else {
        setAvailabilityStatus({
          isAvailable: true,
          conflictMessage: '',
          conflictingJobs: []
        });
      }
    } catch (error) {
      console.error('Error checking worker availability:', error);
      // On error, assume worker is available to avoid blocking legitimate bookings
      setAvailabilityStatus({
        isAvailable: true,
        conflictMessage: '',
        conflictingJobs: []
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        setFormData({
          employer_id: initialData.employer_id || "",
          worker_id: initialData.worker_id || "",
          service_type: initialData.service_type || "",
          sub_skill: initialData.sub_skill || "",
          work_type: initialData.work_type || "",
          description: initialData.description || "",
          book_in: initialData.book_in ? new Date(initialData.book_in).toISOString().slice(0, 16) : "",
          book_end: initialData.book_end ? new Date(initialData.book_end).toISOString().slice(0, 16) : "",
          daily_rate: initialData.daily_rate || "",
          total_amount: initialData.total_amount || "",
          status: initialData.status || "pending"
        });
      } else {
        setFormData({
          employer_id: "",
          worker_id: "",
          service_type: "",
          sub_skill: "",
          work_type: "",
          description: "",
          book_in: "",
          book_end: "",
          daily_rate: "",
          total_amount: "",
          status: "pending"
        });
      }
      setErrors({});
      setAvailabilityStatus({
        isAvailable: true,
        conflictMessage: '',
        conflictingJobs: []
      });
    }
  }, [isOpen, isEdit, initialData]);

  // Check worker availability when booking dates change
  useEffect(() => {
    if (formData.book_in && formData.book_end && formData.worker_id) {
      checkWorkerAvailability();
    } else {
      setAvailabilityStatus({
        isAvailable: true,
        conflictMessage: '',
        conflictingJobs: []
      });
    }
  }, [formData.book_in, formData.book_end, formData.worker_id]);

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

    if (!formData.employer_id && !formData.worker_id) {
      newErrors.employer_id = "At least one participant (employer or worker) must be selected";
      newErrors.worker_id = "At least one participant (employer or worker) must be selected";
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

    // Check if book_end is after book_in
    if (formData.book_in && formData.book_end) {
      const bookInDate = new Date(formData.book_in);
      const bookEndDate = new Date(formData.book_end);
      if (bookEndDate <= bookInDate) {
        newErrors.book_end = "Book end date must be after book in date";
      }
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
              <label htmlFor="employer_id">Employer</label>
              <select
                id="employer_id"
                name="employer_id"
                value={formData.employer_id}
                onChange={handleInputChange}
                className={errors.employer_id ? "error" : ""}
                disabled={isSubmitting}
              >
                <option value="">Select Employer</option>
                {employers.map((employer) => {
                  console.log("Processing employer:", employer);
                  console.log("Employer role_id:", employer.role_id);
                  const displayName = getFullName(employer);
                  console.log("Final employer displayName:", displayName);
                  
                  return (
                    <option key={employer.id} value={employer.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
              {errors.employer_id && <span className="error-message">{errors.employer_id}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="worker_id">Worker</label>
              <select
                id="worker_id"
                name="worker_id"
                value={formData.worker_id}
                onChange={handleInputChange}
                className={errors.worker_id ? "error" : ""}
                disabled={isSubmitting}
              >
                <option value="">Select Worker</option>
                {workers.map((worker) => {
                  console.log("Processing worker:", worker);
                  console.log("Worker role_id:", worker.role_id);
                  console.log("Worker keys:", Object.keys(worker));
                  const displayName = getFullName(worker);
                  console.log("Final worker displayName:", displayName);
                  
                  return (
                    <option key={worker.id} value={worker.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
              {errors.worker_id && <span className="error-message">{errors.worker_id}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="service_type">Service Type *</label>
              <input
                list="service_type_list"
                id="service_type"
                name="service_type"
                value={formData.service_type}
                onChange={handleInputChange}
                onInput={(e) => setServiceTypeSearch(e.target.value)}
                className={errors.service_type ? "error" : ""}
                disabled={isSubmitting}
                autoComplete="off"
              />
              <datalist id="service_type_list">
                {skills
                  .filter(skill => 
                    !serviceTypeSearch || 
                    skill.name.toLowerCase().startsWith(serviceTypeSearch.toLowerCase())
                  )
                  .map((skill) => (
                    <option key={skill.id} value={skill.name} />
                  ))}
              </datalist>
              {errors.service_type && <span className="error-message">{errors.service_type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sub_skill">Sub Skill</label>
              <input
                list="sub_skill_list"
                id="sub_skill"
                name="sub_skill"
                value={formData.sub_skill}
                onChange={handleInputChange}
                onInput={(e) => setSubSkillSearch(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
              <datalist id="sub_skill_list">
                {skills.map((skill) => 
                  skill.sub_skills && skill.sub_skills.length > 0 ? (
                    skill.sub_skills
                      .filter(subSkill => 
                        !subSkillSearch || 
                        subSkill.toLowerCase().startsWith(subSkillSearch.toLowerCase())
                      )
                      .map((subSkill, index) => (
                        <option key={`${skill.id}-${index}`} value={subSkill} />
                      ))
                  ) : null
                )}
              </datalist>
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

          {/* Availability Warning */}
          {!availabilityStatus.isAvailable && (
            <div className="availability-warning">
              <div className="warning-header">
                <IoWarningOutline style={{ color: '#ffc107', marginRight: '18px', marginTop: '8px', fontSize: '30px' }} />
                <div className="rs-message-body">
                  <div className="warning-message">
                    {availabilityStatus.conflictMessage}
                  </div>
                  {availabilityStatus.conflictingJobs.length > 0 && (
                    <div className="conflicting-jobs">
                      <h5>Conflicting Jobs:</h5>
                      <ul>
                        {availabilityStatus.conflictingJobs.map((job, index) => (
                          <li key={index}>
                            <strong>{job.jobTitle}</strong> - {job.type === 'hired' ? 'Hired' : 'Scheduled'}
                            <br />
                            <small>
                              {new Date(job.workStart).toLocaleDateString()} - {new Date(job.workEnd).toLocaleDateString()}
                              {job.employer && ` (Employer: ${job.employer})`}
                            </small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
