import React from 'react';
import './../../../sass/components/ConfirmationModal.scss';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, onBack, worker, bookingDetails, calculateSalary }) => {
  if (!isOpen) return null;

  // Early return if required data is missing
  if (!worker || !bookingDetails || !calculateSalary) {
    console.error('ConfirmationModal: Missing required props');
    return (
      <div className="booking-modal-overlay">
        <div className="booking-modal-container">
          <h2 className="booking-modal-title">Error Loading Confirmation</h2>
          <p>Missing required data. Please try again.</p>
          <button onClick={onBack}>Back</button>
        </div>
      </div>
    );
  }

  // Safe calculation function
  const safeCalculateSalary = () => {
    try {
      return calculateSalary(bookingDetails);
    } catch (error) {
      console.error('Error in calculateSalary:', error);
      return {
        dailyRate: 0,
        totalAmount: 0,
        workingDays: 0,
        totalHours: 0,
        hoursPerDay: 0,
        hourlyRate: '0.00',
        explanation: 'Error calculating salary'
      };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal-container">
        <h2 className="booking-modal-title">Review Booking Details</h2>
        <div className="booking-modal-form-content">
          <div className="booking-form-field">
            <label className="booking-form-label">Worker</label>
            <input
              type="text"
              value={worker?.name || 'Unknown Worker'}
              className="booking-form-input booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label">Service Type</label>
            <input
              type="text"
              value={bookingDetails?.service_type || 'Not specified'}
              className="booking-form-input booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label">Sub Skills</label>
            <input
              type="text"
              value={bookingDetails?.sub_skill || 'Not specified'}
              className="booking-form-input booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label">Work Type</label>
            <input
              type="text"
              value={bookingDetails?.work_type || 'Not specified'}
              className="booking-form-input booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label">Book In</label>
            <input
              type="text"
              value={formatDate(bookingDetails?.book_in)}
              className="booking-form-input booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label">Book End</label>
            <input
              type="text"
              value={formatDate(bookingDetails?.book_end)}
              className="booking-form-input booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label">Description</label>
            <textarea
              value={bookingDetails?.description || 'No description provided'}
              className="booking-form-textarea booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label">Daily Rate</label>
            <input
              type="text"
              value={`₱${bookingDetails?.daily_rate || '0.00'}`}
              className="booking-form-input booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
        </div>
        <div className="booking-modal-actions">
          <button className="booking-btn booking-btn-cancel" onClick={onBack}>
            Back
          </button>
          <button className="booking-btn booking-btn-submit" onClick={onConfirm}>
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
