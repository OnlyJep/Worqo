import React from 'react';
import { message } from 'antd';
import '../../../sass/components/profilesettings/transactionmodal.scss';

const TransactionModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours;
  };

  const duration = calculateDuration(booking.book_in, booking.book_end);

  return (
    <div className="transaction-modal-overlay">
      <div className="transaction-modal">
        <div className="transaction-modal-header">
          <h2>Transaction Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="transaction-modal-content">
          <div className="transaction-section">
            <h3>Booking Information</h3>
            <div className="transaction-details">
              <div className="detail-row">
                <span className="label">Service Type:</span>
                <span className="value">{booking.service_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Work Type:</span>
                <span className="value">{booking.work_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`value status-${booking.status}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Start Date:</span>
                <span className="value">{formatDate(booking.book_in)}</span>
              </div>
              <div className="detail-row">
                <span className="label">End Date:</span>
                <span className="value">{formatDate(booking.book_end)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Duration:</span>
                <span className="value">{duration} hours</span>
              </div>
              <div className="detail-row">
                <span className="label">Description:</span>
                <span className="value">{booking.description}</span>
              </div>
            </div>
          </div>

          <div className="transaction-section">
            <h3>Financial Details</h3>
            <div className="transaction-details">
              <div className="detail-row">
                <span className="label">Agreed Salary:</span>
                <span className="value">₱{booking.total_amount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Total Hours:</span>
                <span className="value">{duration} hours</span>
              </div>
              <div className="detail-row total-row">
                <span className="label">Total Amount:</span>
                <span className="value total-amount">₱{booking.total_amount}</span>
              </div>
            </div>
          </div>

          {booking.worker_notes && (
            <div className="transaction-section">
              <h3>Worker Notes</h3>
              <div className="notes-content">
                <p>{booking.worker_notes}</p>
              </div>
            </div>
          )}

          {booking.employer_notes && (
            <div className="transaction-section">
              <h3>Employer Notes</h3>
              <div className="notes-content">
                <p>{booking.employer_notes}</p>
              </div>
            </div>
          )}

          {booking.rating && (
            <div className="transaction-section">
              <h3>Review & Rating</h3>
              <div className="transaction-details">
                <div className="detail-row">
                  <span className="label">Rating:</span>
                  <span className="value">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`star ${i < booking.rating ? 'filled' : ''}`}>★</span>
                    ))}
                    ({booking.rating}/5)
                  </span>
                </div>
                {booking.review && (
                  <div className="detail-row">
                    <span className="label">Review:</span>
                    <span className="value">{booking.review}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="transaction-modal-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;

