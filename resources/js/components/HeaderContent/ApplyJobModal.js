import React, { useState, useEffect } from 'react';
import './../../../sass/components/ApplyJobModal.scss';

const ApplyJobModal = ({ job, isOpen, onClose, onSubmit, userRank }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    coverLetter: '',
  });
  const [errors, setErrors] = useState({});
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ firstName: '', middleName: '', lastName: '', email: '', coverLetter: '' });
      setErrors({});
      setApplicationStatus(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Clear error on change
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.coverLetter) newErrors.coverLetter = 'Cover letter is required';
    return newErrors;
  };

  const showNotification = (message, type = 'error') => {
    setApplicationStatus({ message, type });
    setTimeout(() => setApplicationStatus(null), 5000); // Auto-hide after 5 seconds
  };

  const handleSubmit = () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const rankOrder = { "Bronze 1": 1, "Silver 1": 2, "Gold 1": 3, "Gold 2": 4, "Gold 3": 5, "Platinum 1": 6 };
    const userRankValue = rankOrder[userRank] || 0;
    const requiredRankValue = rankOrder[job.requirements.minRank] || 0;

    if (userRankValue < requiredRankValue) {
      showNotification(`You are not qualified. Required rank: ${job.requirements.minRank}, Your rank: ${userRank}`, 'error');
      return;
    }

    const applicationSteps = [
      { step: 'Submitting application...', status: 'processing' },
      { step: 'Processing your application...', status: 'processing' },
      { step: 'Application submitted successfully!', status: 'success' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < applicationSteps.length) {
        showNotification(applicationSteps[currentStep].step, applicationSteps[currentStep].status);
        currentStep++;
      } else {
        clearInterval(interval);
        onSubmit(formData);
        onClose();
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  if (!isOpen) return null;

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>Apply for {job.title}</h2>
        <div className="adminmodal-content">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
            />
            {errors.firstName && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.firstName}</span>}
          </div>
          <div className="form-group">
            <label>Middle Name</label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Enter your middle name (optional)"
            />
          </div>
          <div className="form-group name-row">
            <div className="name-field">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
              />
              {errors.lastName && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.lastName}</span>}
            </div>
            <div className="name-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
              {errors.email && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.email}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Cover Letter</label>
            <textarea
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleChange}
              placeholder="Write a brief cover letter"
            />
            {errors.coverLetter && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.coverLetter}</span>}
          </div>
        </div>
        <div className="adminmodal-buttons">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="submit-button" onClick={handleSubmit}>
            Submit Application
          </button>
        </div>
        {applicationStatus && (
          <div className={`notification ${applicationStatus.type}`}>
            <p>{applicationStatus.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyJobModal;