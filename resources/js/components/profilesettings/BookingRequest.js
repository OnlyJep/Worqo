import React, { useState, useEffect } from 'react';
import { MdVerified } from 'react-icons/md';
import { CiClock2 } from 'react-icons/ci';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { MdOutlineVerified, MdOutlineCancel } from 'react-icons/md';
import { message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ModalFeedback from './modalfeedback';
import TransactionModal from './TransactionModal';
import '../../../sass/components/profilesettings/BookingRequest.scss';
import '../../../sass/components/profilesettings/confirmmodal.scss';

const BookingRequest = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, action: null, booking: null });

  const bookingCategories = [
    { id: 'all', label: 'All Bookings' },
    { id: 'pending', label: 'Pending' },
    { id: 'declined', label: 'Declined' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'completed', label: 'Completed' }
  ];

  // Helper function to get status icon and styling
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          icon: <CiClock2 size={14} />,
          backgroundColor: '#ffa500',
          color: 'white'
        };
      case 'accepted':
        return {
          icon: <IoMdCheckmarkCircleOutline size={14} />,
          backgroundColor: '#4CAF50',
          color: 'white'
        };
      case 'completed':
        return {
          icon: <MdOutlineVerified size={14} />,
          backgroundColor: '#2196F3',
          color: 'white'
        };
      case 'declined':
        return {
          icon: <MdOutlineCancel size={14} />,
          backgroundColor: '#f44336',
          color: 'white'
        };
      case 'cancelled':
        return {
          icon: <MdOutlineCancel size={14} />,
          backgroundColor: '#9e9e9e',
          color: 'white'
        };
      default:
        return {
          icon: <CiClock2 size={14} />,
          backgroundColor: '#9e9e9e',
          color: 'white'
        };
    }
  };

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
      
      const response = await axios.get(`/api/bookings/${endpoint}?user_id=${userData.id}`, {
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
      const response = await axios.patch(`/api/bookings/${bookingId}/cancel`, {}, {
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
      const response = await axios.put(`/api/bookings/${bookingId}/status`, {
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

  const openConfirm = (booking, action) => setConfirmState({ open: true, action, booking });
  const closeConfirm = () => setConfirmState({ open: false, action: null, booking: null });
  const proceedConfirm = () => {
    if (confirmState.booking && confirmState.action) {
      handleStatusUpdate(confirmState.booking.id, confirmState.action);
    }
    closeConfirm();
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
      
      if (!authToken) {
        message.error("Please log in to submit a review");
        return;
      }

      if (!selectedWorker || !selectedWorker.id) {
        message.error("Booking information is missing");
        return;
      }

      // Ensure token is properly formatted
      const token = authToken && authToken.trim() ? authToken.trim() : null;
      
      if (!token) {
        message.error("Authentication token is missing. Please log in again.");
        return;
      }

      const response = await axios.post(`/api/bookings/${selectedWorker.id}/review`, {
        rating: feedbackData.rating,
        comment: feedbackData.feedback
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success(response.data.message || "Review submitted successfully");
        setIsFeedbackModalOpen(false);
        setSelectedWorker(null);
        fetchBookings();
      } else {
        message.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        message.error("Session expired. Please log in again.");
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (error.response?.status === 403) {
        message.error("You are not authorized to review this booking");
      } else if (error.response?.status === 400) {
        message.error(error.response.data?.message || "Invalid request. Please check the booking status.");
      } else {
        message.error(error.response?.data?.message || "Failed to submit review. Please try again.");
      }
    }
  };

  const handleProfileClick = (personData) => {
    if (personData && personData.id) {
      navigate(`/profile/${personData.id}`);
    }
  };

  if (loading) {
    return (
      <div className="booking-request-container">
        <div className="loading-container">
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-request-container">
      <div className="booking-request-header">
        <h2 className="booking-request-title">
          {userRole === 1 ? 'Booking Requests' : 'My Bookings'}
        </h2>
      </div>

      <div className="booking-request-navigation">
        {bookingCategories.map((category) => (
          <div key={category.id} className="booking-request-tab-container">
            <button
              type="button"
              className={`booking-request-tab ${activeTab === category.id ? 'active' : ''}`}
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

      <div className="booking-request-content">
        {filteredBookings.length > 0 ? (
          <div className="booking-request-list">
            {filteredBookings.map((booking) => {
              const isEmployerView = userRole === 2;
              const personData = isEmployerView ? booking.worker : booking.employer;
              const personProfile = personData?.profile;
              

              return (
                <div key={booking.id} className="booking-request-card">
                  {/* Top Section - Worker Info, Status, and Amount */}
                  <div className="booking-request-top-section">
                    <div className="booking-request-worker-info">
                      <div 
                        className="booking-request-worker-profile"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick(personData);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <img 
                          src={(() => {
                            // Check if personProfile has profile_img (nested profile data)
                            if (personProfile?.profile_img && personProfile.profile_img !== null && personProfile.profile_img !== '' && personProfile.profile_img !== 'null') {
                              return `${window.location.origin}/storage/${personProfile.profile_img}`;
                            }
                            // Check if personData has profile_img (direct profile data)
                            if (personData?.profile_img && personData.profile_img !== null && personData.profile_img !== '' && personData.profile_img !== 'null') {
                              return `${window.location.origin}/storage/${personData.profile_img}`;
                            }
                            // Check if booking has direct profile_img (for cases where data structure is different)
                            if (booking.profile_img && booking.profile_img !== null && booking.profile_img !== '' && booking.profile_img !== 'null') {
                              return `${window.location.origin}/storage/${booking.profile_img}`;
                            }
                            // Additional fallback: check if the person data has a profile_img at the root level
                            if (personData && typeof personData === 'object' && personData.profile_img && personData.profile_img !== null && personData.profile_img !== '' && personData.profile_img !== 'null') {
                              return `${window.location.origin}/storage/${personData.profile_img}`;
                            }
                            // Default fallback
                            return '/images/defpfp.svg';
                          })()} 
                          alt={personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 
                               personData ? `${personData.first_name || ''} ${personData.last_name || ''}`.trim() || 'User' :
                               'User'} 
                          className="booking-request-worker-avatar" 
                          onError={(e) => {
                            console.log('Image failed to load, using fallback');
                            e.target.src = '/images/defpfp.svg';
                          }}
                        />
                      </div>
                      <div className="booking-request-worker-details">
                        <h3 
                          className="booking-request-worker-name"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProfileClick(personData);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 
                           personData ? `${personData.first_name || ''} ${personData.last_name || ''}`.trim() || 'Unknown User' :
                           'Unknown User'}
                        </h3>
                        <p className="booking-request-worker-profession">
                          {isEmployerView ? (
                            <>
                              {booking.service_type}
                              {booking.sub_skill && (
                                <span className="booking-request-sub-skill"> - {booking.sub_skill}</span>
                              )}
                            </>
                          ) : 'Employer'}
                        </p>
                        <div className="booking-request-worker-badges">
                          {personData?.verified && (
                            <div className="booking-request-verified-badge">
                              <MdVerified className="booking-request-verified-icon" />
                              <span>Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="booking-request-status-amount">
                      <div className="booking-request-status-badge">
                        <span className="booking-request-status-text" style={{ 
                          backgroundColor: getStatusIcon(booking.status).backgroundColor,
                          color: getStatusIcon(booking.status).color
                        }}>
                          {getStatusIcon(booking.status).icon}
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section - Dates and Description */}
                  <div className="booking-request-middle-section">
                    <div className="booking-request-dates">
                      <div className="booking-request-date-item">
                        <div className="booking-request-date-label">Start Date</div>
                        <div className="booking-request-date-value">{new Date(booking.book_in).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</div>
                      </div>
                      <div className="booking-request-date-item">
                        <div className="booking-request-date-label">End Date</div>
                        <div className="booking-request-date-value">{new Date(booking.book_end).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</div>
                      </div>
                    </div>
                    {(() => {
                      const contactProfile = isEmployerView ? booking.worker?.profile : booking.employer?.profile;
                      if (!contactProfile) return null;
                      
                      return (
                        <>
                          <div className="booking-request-address">
                            <div className="booking-request-address-label">Address</div>
                            <div className="booking-request-address-text">
                              {(() => {
                                const addressParts = [
                                  contactProfile.street,
                                  contactProfile.city,
                                  contactProfile.province,
                                  contactProfile.postal_code,
                                  contactProfile.country
                                ].filter(part => part && part.trim() !== '');
                                return addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
                              })()}
                            </div>
                          </div>
                          <div className="booking-request-contact">
                            <div className="booking-request-contact-label">Contact Number</div>
                            <div className="booking-request-contact-text">
                              {contactProfile.contact_number || 'N/A'}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                    <div className="booking-request-description">
                      <div className="booking-request-description-label">Description</div>
                      <div className="booking-request-description-text">
                        {booking.description && booking.description.length > 50 
                          ? `${booking.description.substring(0, 50)}...` 
                          : booking.description
                        }
                      </div>
                    </div>
                    <div className="booking-request-salary">
                      ₱{booking.total_amount}
                    </div>
                  </div>

                  {/* Bottom Section - Action Buttons */}
                  <div className="booking-request-actions">
                    {/* Employer Actions */}
                    {isEmployerView && (
                      <>
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              className="booking-request-view-transaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(booking);
                              }}
                            >
                              View Transaction
                            </button>
                            <button 
                              className="booking-request-cancel-booking-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(booking.id);
                              }}
                            >
                              Cancel Booking
                            </button>
                          </>
                        )}
                        
                        {booking.status === 'accepted' && (
                          <button 
                            className="booking-request-view-transaction-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTransaction(booking);
                            }}
                          >
                            View Transaction
                          </button>
                        )}
                        
                        {booking.status === 'completed' && (
                          <>
                            <button 
                              className="booking-request-view-transaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(booking);
                              }}
                            >
                              View Transaction
                            </button>
                            {!booking.has_review && (
                              <button 
                                className="booking-request-give-feedback-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGiveFeedback(booking);
                                }}
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
                              className="booking-request-view-transaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(booking);
                              }}
                            >
                              View Transaction
                            </button>
                                <button 
                              className="booking-request-accept-btn"
                              onClick={(e) => { e.stopPropagation(); openConfirm(booking, 'accepted'); }}
                            >
                              Accept
                            </button>
                            <button 
                              className="booking-request-decline-btn"
                              onClick={(e) => { e.stopPropagation(); openConfirm(booking, 'declined'); }}
                            >
                              Decline
                            </button>
                          </>
                        )}
                        
                        {booking.status === 'accepted' && (
                          <>
                            <button 
                              className="booking-request-view-transaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(booking);
                              }}
                            >
                              View Transaction
                            </button>
                            <button 
                              className="booking-request-complete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(booking.id, 'completed');
                              }}
                            >
                              Mark as Completed
                            </button>
                          </>
                        )}
                        
                        {booking.status === 'completed' && (
                          <button 
                            className="booking-request-view-transaction-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTransaction(booking);
                            }}
                          >
                            View Transaction
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="booking-request-empty-state">
            <div className="booking-request-empty-icon">
              <img src="/images/mybooking.svg" alt="No Bookings" />
            </div>
            <h3 className="booking-request-empty-title">No Bookings Yet</h3>
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
    {/* Confirm Modal */}
    {confirmState.open && (
      <div className="confirm-modal-overlay" onClick={closeConfirm}>
        <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-modal-header">
            <h3>Confirm Action</h3>
            <button className="close-btn" onClick={closeConfirm}>×</button>
          </div>
          <div className="confirm-modal-content">
            <p>
              Are you sure you want to {confirmState.action === 'accepted' ? 'accept booking from' : 'decline booking from'}{' '}
              {confirmState.booking?.employer?.profile 
                ? `${confirmState.booking.employer.profile.first_name || ''} ${confirmState.booking.employer.profile.last_name || ''}`.trim()
                : (confirmState.booking?.employer?.name || confirmState.booking?.employer_name || 'this employer')}?
            </p>
          </div>
          <div className="confirm-modal-actions">
            <button className="confirm-btn" onClick={proceedConfirm}>
              {confirmState.action === 'accepted' ? 'Accept' : 'Decline'}
            </button>
            <button className="cancel-btn" onClick={closeConfirm}>Cancel</button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default BookingRequest;