import React, { useState, useEffect } from 'react';
import { MdVerified } from 'react-icons/md';
import { message } from 'antd';
import axios from 'axios';
import ModalFeedback from './modalfeedback';
import TransactionModal from './TransactionModal';
import '../../../sass/components/profilesettings/mybookings.scss';

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const bookingCategories = [
    { id: 'all', label: 'All Bookings' },
    { id: 'pending', label: 'Pending' },
    { id: 'declined', label: 'Declined' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'completed', label: 'Completed' }
  ];

  useEffect(() => {
    // Get user role from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    setUserRole(userData.role_id);
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        message.error("Please log in to view bookings");
        return;
      }

      // Determine API endpoint based on user role
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const endpoint = userData.role_id === 1 ? 'worker' : 'employer';
      
      const response = await axios.get(`http://127.0.0.1:8000/api/bookings/${endpoint}?user_id=${userData.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json"
        }
      });

      if (response.data.success) {
        // Sort bookings: Pending first, then Accepted, Completed, Declined, Cancelled
        const sortedBookings = response.data.bookings.sort((a, b) => {
          const statusOrder = { 'pending': 1, 'accepted': 2, 'completed': 3, 'declined': 4, 'cancelled': 5 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        console.log('Fetched bookings for role_id', userData.role_id, ':', sortedBookings);
        setBookings(sortedBookings);
      } else {
        message.error("Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error.response?.data || error.message);
      message.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.patch(`http://127.0.0.1:8000/api/bookings/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json"
        }
      });

      if (response.data.success) {
        message.success("Booking cancelled successfully");
        fetchBookings();
      } else {
        message.error(response.data.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error.response?.data || error.message);
      message.error("Failed to cancel booking");
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.put(`http://127.0.0.1:8000/api/bookings/${bookingId}/status`, {
        status
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success(`Booking ${status} successfully`);
        fetchBookings();
      } else {
        message.error(response.data.message || `Failed to ${status} booking`);
      }
    } catch (error) {
      console.error("Error updating booking status:", error.response?.data || error.message);
      message.error(`Failed to ${status} booking`);
    }
  };

  // Filter bookings based on active tab
  const getFilteredBookings = () => {
    if (activeTab === 'all') {
      return bookings;
    }
    return bookings.filter(booking => 
      booking.status.toLowerCase() === activeTab
    );
  };

  const filteredBookings = getFilteredBookings();

  const handleTabClick = (tabId) => {
    console.log('Tab clicked:', tabId); // Debug log
    console.log('Current active tab before:', activeTab); // Debug log
    setActiveTab(tabId);
    console.log('Setting active tab to:', tabId); // Debug log
  };

  const handleGiveFeedback = (booking) => {
    setSelectedWorker(booking);
    setIsFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setSelectedWorker(null);
  };

  const handleViewTransaction = (booking) => {
    console.log('Opening transaction modal for booking:', booking);
    setSelectedBooking(booking);
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setSelectedBooking(null);
  };

  const handleSubmitFeedback = async (feedbackData) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.post(`http://127.0.0.1:8000/api/bookings/${selectedWorker.id}/review`, {
        rating: feedbackData.rating,
        comment: feedbackData.feedback
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success("Review submitted successfully");
        setIsFeedbackModalOpen(false);
        setSelectedWorker(null);
        fetchBookings();
      } else {
        message.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error.message);
      message.error("Failed to submit review");
    }
  };

  if (loading) {
    return (
      <div className="my-bookings-container">
        <div className="loading-container">
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <h2 className="bookings-title">
          {userRole === 1 ? 'Booking Requests' : 'My Bookings'}
        </h2>
      </div>

      <div className="bookings-navigation">
        {bookingCategories.map((category) => (
          <div key={category.id} className="booking-tab-container">
            <button
              type="button"
              className={`booking-tab ${activeTab === category.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTabClick(category.id);
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {category.label}
            </button>
          </div>
        ))}
      </div>

      <div className="bookings-content">
        {filteredBookings.length > 0 ? (
          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              // Determine if this is employer or worker view
              const isEmployerView = userRole === 2;
              const personData = isEmployerView ? booking.worker : booking.employer;
              const personProfile = personData?.profile;
              
              console.log(`Rendering booking ${booking.id} for ${isEmployerView ? 'employer' : 'worker'} with status: ${booking.status}`);
              
              return (
                <div key={booking.id} className="booking-card">
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
                      <h3 className="worker-name">
                        {personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 'Unknown User'}
                      </h3>
                      <p className="worker-profession">
                        {isEmployerView ? booking.service_type : 'Employer'}
                      </p>
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
                      <div className="booking-salary">
                        Total: ₱{booking.total_amount}
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
                  {/* Message Button */}
                  <button 
                    className="message-btn"
                    onClick={() => {
                      // Store the target user ID in localStorage
                      const targetUserId = isEmployerView ? booking.worker_id : booking.employer_id;
                      localStorage.setItem('message_target_user_id', targetUserId);
                      // Navigate to messages page
                      window.location.href = '/message';
                    }}
                  >
                    Message
                  </button>
                  
                  {/* Employer Actions */}
                  {isEmployerView && (
                    <>
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            className="view-transaction-btn"
                            onClick={() => handleViewTransaction(booking)}
                          >
                            View Transaction
                          </button>
                          <button 
                            className="cancel-booking-btn"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel Booking
                          </button>
                        </>
                      )}
                      
                      {booking.status === 'accepted' && (
                        <button 
                          className="view-transaction-btn"
                          onClick={() => handleViewTransaction(booking)}
                        >
                          View Transaction
                        </button>
                      )}
                      
                      {booking.status === 'completed' && (
                        <>
                          <button 
                            className="view-transaction-btn"
                            onClick={() => handleViewTransaction(booking)}
                          >
                            View Transaction
                          </button>
                          {!booking.has_review && (
                            <button 
                              className="give-feedback-btn"
                              onClick={() => handleGiveFeedback(booking)}
                            >
                              Give Feedback
                            </button>
                          )}
                        </>
                      )}
                      
                      {(booking.status === 'declined' || booking.status === 'cancelled') && (
                        <div className="status-only">
                          <span className={`${booking.status}-text`}>
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
                            onClick={() => handleViewTransaction(booking)}
                          >
                            View Transaction
                          </button>
                          <button 
                            className="accept-btn"
                            onClick={() => handleStatusUpdate(booking.id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button 
                            className="decline-btn"
                            onClick={() => handleStatusUpdate(booking.id, 'declined')}
                          >
                            Decline
                          </button>
                        </>
                      )}
                      
                      {booking.status === 'accepted' && (
                        <>
                          <button 
                            className="view-transaction-btn"
                            onClick={() => handleViewTransaction(booking)}
                          >
                            View Transaction
                          </button>
                          <button 
                            className="complete-btn"
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                          >
                            Mark as Completed
                          </button>
                        </>
                      )}
                      
                      {booking.status === 'completed' && (
                        <button 
                          className="view-transaction-btn"
                          onClick={() => handleViewTransaction(booking)}
                        >
                          View Transaction
                        </button>
                      )}
                      
                      {(booking.status === 'declined' || booking.status === 'cancelled') && (
                        <div className="status-only">
                          <span className={`${booking.status}-text`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <img src="/images/mybooking.svg" alt="No Bookings" />
            </div>
            <h3 className="empty-title">No Bookings Yet</h3>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && selectedWorker && (
        <ModalFeedback
          onClose={handleCloseFeedbackModal}
          onSubmit={handleSubmitFeedback}
          workerName={selectedWorker.worker?.profile ? `${selectedWorker.worker.profile.first_name} ${selectedWorker.worker.profile.last_name}` : 'Worker'}
        />
      )}

      {/* Transaction Modal */}
      {isTransactionModalOpen && selectedBooking && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          booking={selectedBooking}
        />
      )}
    </div>
  );
};

export default MyBookings;
