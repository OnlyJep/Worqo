import React from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import '../../../sass/components/profilesettings/canceljobapplicationmodal.scss';

const CancelJobApplicationModal = ({ isOpen, onClose, onConfirm, jobTitle }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="cancel-job-modal-overlay">
      <div className="cancel-job-modal">
        <div className="cancel-job-modal-header">
          <div className="warning-icon">
            <FaExclamationTriangle />
          </div>
          <h2>Cancel Job Application</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="cancel-job-modal-content">
          <div className="warning-message">
            <p>Are you sure you want to cancel your application for:</p>
            <h3 className="job-title">{jobTitle}</h3>
            <p className="warning-text">
              This action cannot be undone. You will need to apply again if you change your mind.
            </p>
          </div>
        </div>
        
        <div className="cancel-job-modal-actions">
          <button 
            className="cancel-btn"
            onClick={onClose}
          >
            Keep Application
          </button>
          <button 
            className="confirm-cancel-btn"
            onClick={handleConfirm}
          >
            Yes, Cancel Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelJobApplicationModal;
