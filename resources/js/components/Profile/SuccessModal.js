import React from 'react';
import './../../../sass/components/SuccessModal.scss';

const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="profile-success-modal-overlay">
      <div className="profile-success-modal">
        <h2>🎉 Booking Successful!</h2>
        <div className="profile-success-modal-content">
          <div className="profile-success-form-group">
            <p>Your booking request has been sent successfully!</p>
            <p>The worker will be notified and can accept or decline your request.</p>
            <p><strong>Status:</strong> Pending approval</p>
          </div>
        </div>
        <div className="profile-success-modal-buttons">
          <button className="profile-success-submit-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
