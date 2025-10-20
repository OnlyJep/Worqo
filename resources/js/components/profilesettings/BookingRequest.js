import React from 'react';
import { MdVerified } from 'react-icons/md';
import '../../../sass/components/profilesettings/BookingRequest.scss';

const BookingRequest = ({ 
  booking, 
  userRole, 
  onCancelBooking, 
  onStatusUpdate, 
  onViewTransaction, 
  onGiveFeedback,
  isSelected,
  onSelect
}) => {
  // Determine if this is employer or worker view
  const isEmployerView = userRole === 2;
  const personData = isEmployerView ? booking.worker : booking.employer;
  const personProfile = personData?.profile;
  
  console.log(`Rendering booking ${booking.id} for ${isEmployerView ? 'employer' : 'worker'} with status: ${booking.status}`);
  
  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="booking-request-card">
      <div className="booking-request-checkbox">
        <input
          type="checkbox"
          className="booking-checkbox"
          checked={isSelected || false}
          onChange={(e) => onSelect && onSelect(booking.id, e.target.checked)}
        />
      </div>
      <div className="booking-request-worker-info">
        <div className="worker-profile">
          <img 
            src={personProfile?.profile_img 
              ? `http://127.0.0.1:8000/storage/${personProfile.profile_img}` 
              : '/images/default-avatar.svg'
            } 
            alt={personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 'User'} 
            className="worker-avatar" 
          />
        </div>
        <div className="worker-details">
          <div className="worker-name-row">
            <h3 className="worker-name">
              {personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 'Unknown User'}
            </h3>
            <div className="booking-status">
              <span className="status-text" style={{ 
                color: booking.status === 'pending' ? '#ffa500' :
                       booking.status === 'accepted' ? '#4CAF50' :
                       booking.status === 'completed' ? '#2196F3' :
                       booking.status === 'declined' ? '#f44336' :
                       '#9e9e9e'
              }}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="worker-badges">
            {personData?.verified && (
              <div className="verified-badge">
                <MdVerified className="verified-icon" />
                <span>Verified</span>
              </div>
            )}
          </div>
          <div className="booking-salary">
            Total: ₱{booking.total_amount}
          </div>
          <div className="booking-dates">
            <p>Start: {formatDate(booking.book_in)}</p>
            <p>End: {formatDate(booking.book_end)}</p>
          </div>
          <div className="booking-description">
            <p><strong>Description:</strong> {booking.description}</p>
          </div>
        </div>
      </div>
      
      <div className="booking-request-actions">
        {/* Employer Actions */}
        {isEmployerView && (
          <>
            {booking.status === 'pending' && (
              <>
                <button 
                  className="view-transaction-btn"
                  onClick={() => onViewTransaction(booking)}
                >
                  View Transaction
                </button>
                <button 
                  className="cancel-booking-btn"
                  onClick={() => onCancelBooking(booking.id)}
                >
                  Cancel Booking
                </button>
              </>
            )}
            
            {booking.status === 'accepted' && (
              <button 
                className="view-transaction-btn"
                onClick={() => onViewTransaction(booking)}
              >
                View Transaction
              </button>
            )}
            
            {booking.status === 'completed' && (
              <>
                <button 
                  className="view-transaction-btn"
                  onClick={() => onViewTransaction(booking)}
                >
                  View Transaction
                </button>
                {!booking.has_review && (
                  <button 
                    className="give-feedback-btn"
                    onClick={() => onGiveFeedback(booking)}
                  >
                    Give Feedback
                  </button>
                )}
              </>
            )}
            
            {(booking.status === 'declined' || booking.status === 'cancelled') && (
              <div>
                <span>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
            )}
          </>
        )}
        
        {/* Worker Actions */}
        {!isEmployerView && (
          <>
            {booking.status === 'pending' && (
              <>
                <button 
                  className="view-transaction-btn"
                  onClick={() => onViewTransaction(booking)}
                >
                  View Transaction
                </button>
                <button 
                  className="accept-btn"
                  onClick={() => onStatusUpdate(booking.id, 'accepted')}
                >
                  Accept
                </button>
                <button 
                  className="decline-btn"
                  onClick={() => onStatusUpdate(booking.id, 'declined')}
                >
                  Decline
                </button>
              </>
            )}
            
            {booking.status === 'accepted' && (
              <>
                <button 
                  className="view-transaction-btn"
                  onClick={() => onViewTransaction(booking)}
                >
                  View Transaction
                </button>
                <button 
                  className="complete-btn"
                  onClick={() => onStatusUpdate(booking.id, 'completed')}
                >
                  Mark as Completed
                </button>
              </>
            )}
            
            {booking.status === 'completed' && (
              <button 
                className="view-transaction-btn"
                onClick={() => onViewTransaction(booking)}
              >
                View Transaction
              </button>
            )}
            
            {(booking.status === 'declined' || booking.status === 'cancelled') && (
              <div>
                <span>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingRequest;
