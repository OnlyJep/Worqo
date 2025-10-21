import React from 'react';
import { MdVerified, MdDelete } from 'react-icons/md';
import { FaRegEdit } from 'react-icons/fa';
import '../../../sass/components/profilesettings/BookingRequestDetails.scss';

const BookingRequestDetails = ({ 
  booking, 
  userRole, 
  onEdit,
  onDelete,
  onCancelBooking, 
  onStatusUpdate, 
  onViewTransaction, 
  onGiveFeedback
}) => {
  // Determine if this is employer or worker view
  const isEmployerView = userRole === 2;
  const personData = isEmployerView ? booking.worker : booking.employer;
  const personProfile = personData?.profile;
  
  console.log(`Rendering booking ${booking.id} for ${isEmployerView ? 'employer' : 'worker'} with status: ${booking.status}`);
  
  return (
    <div className="booking-details-card">
      <div className="booking-worker-info">
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
          <div className="worker-info-header">
            <div className="worker-basic-info">
              <h3 className="worker-name">
                {personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 'Unknown User'}
              </h3>
              <p className="worker-profession">
                {isEmployerView ? (
                  <>
                    {booking.service_type}
                    {booking.sub_skill && (
                      <span className="booking-sub-skill"> - {booking.sub_skill}</span>
                    )}
                  </>
                ) : 'Employer'}
              </p>
            </div>
            <div className="booking-salary">
              {/* Edit and Delete Icons - Only for employers and non-accepted bookings */}
              {isEmployerView && booking.status !== 'accepted' && booking.status !== 'completed' && (
                <div className="booking-action-icons">
                  <FaRegEdit 
                    className="edit-icon" 
                    onClick={() => onEdit && onEdit(booking)}
                    title="Edit booking"
                  />
                  <MdDelete 
                    className="delete-icon" 
                    onClick={() => onDelete && onDelete(booking)}
                    title="Delete booking"
                  />
                </div>
              )}
              Total: ₱{booking.total_amount}
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
          
          <div className="booking-status">
            <span>Status : </span>
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
          
          <div className="booking-dates">
            <p>Start: {new Date(booking.book_in).toLocaleString()}</p>
            <p>End: {new Date(booking.book_end).toLocaleString()}</p>
          </div>
          
          <div className="booking-description">
            <p><strong>Description:</strong> {booking.description}</p>
          </div>
        </div>
      </div>
      
      <div className="booking-actions">
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
          </>
        )}
      </div>
    </div>
  );
};

export default BookingRequestDetails;
