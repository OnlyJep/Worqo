import React, { useState, useEffect } from 'react';
import { MdVerified } from 'react-icons/md';
import { CiClock2 } from 'react-icons/ci';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { MdOutlineVerified, MdOutlineCancel } from 'react-icons/md';
import { FaRegEdit } from 'react-icons/fa';
import { message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ModalFeedback from './modalfeedback';
import TransactionModal from './TransactionModal';
import EditMyBooking from './EditMyBooking';
import '../../../sass/components/profilesettings/mybookings.scss';

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  const handleProfileClick = (personData) => {
    if (personData && personData.id) {
      navigate(`/profile/${personData.id}`);
    }
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedBooking(null);
  };

  const handleUpdateBooking = async (updatedDetails) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.put(`http://127.0.0.1:8000/api/bookings/${selectedBooking.id}`, updatedDetails, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success("Booking updated successfully");
        setIsEditModalOpen(false);
        setSelectedBooking(null);
        fetchBookings();
      } else {
        message.error(response.data.message || "Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error.response?.data || error.message);
      message.error("Failed to update booking");
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
              const isEmployerView = userRole === 2;
              const personData = isEmployerView ? booking.worker : booking.employer;
              const personProfile = personData?.profile;

              return (
                <div key={booking.id} className="booking-card">
                  {/* Top Section - Worker Info, Status, and Amount */}
                  <div className="booking-top-section">
                    <div className="booking-worker-info">
                      <div 
                        className="booking-worker-profile"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick(personData);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <img 
                          src={personProfile?.profile_img 
                            ? `http://127.0.0.1:8000/storage/${personProfile.profile_img}` 
                            : '/images/default-avatar.svg'
                          } 
                          alt={personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 'User'} 
                          className="booking-worker-avatar" 
                        />
                      </div>
                          <div className="booking-worker-details">
                            <div className="booking-worker-name-container">
                              <h3 
                                className="booking-worker-name"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProfileClick(personData);
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 'Unknown User'}
                              </h3>
                              {/* Edit button - positioned beside worker name */}
                              {isEmployerView && booking.status === 'pending' && (
                                <div className="booking-edit-container">
                                  <button 
                                    className="booking-edit-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditBooking(booking);
                                    }}
                                    title="Edit booking"
                                  >
                                    <FaRegEdit size={20} />
                                  </button>
                                </div>
                              )}
                            </div>
                        <p className="booking-worker-profession">
                          {isEmployerView ? (
                            <>
                              {booking.service_type}
                              {booking.sub_skill && (
                                <span className="booking-sub-skill"> - {booking.sub_skill}</span>
                              )}
                            </>
                          ) : 'Employer'}
                        </p>
                        <div className="booking-worker-badges">
                          {personData?.verified && (
                            <div className="booking-verified-badge">
                              <MdVerified className="booking-verified-icon" />
                              <span>Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="booking-status-amount">
                      <div className="booking-status-badge">
                        <span className="booking-status-text" style={{ 
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
                  <div className="booking-middle-section">
                    <div className="booking-dates">
                      <div className="booking-date-item">
                        <div className="booking-date-label">Start Date</div>
                        <div className="booking-date-value">{new Date(booking.book_in).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</div>
                      </div>
                      <div className="booking-date-item">
                        <div className="booking-date-label">End Date</div>
                        <div className="booking-date-value">{new Date(booking.book_end).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</div>
                      </div>
                    </div>
                    <div className="booking-description">
                      <div className="booking-description-label">Description</div>
                      <div className="booking-description-text">
                        {booking.description && booking.description.length > 50 
                          ? `${booking.description.substring(0, 50)}...` 
                          : booking.description
                        }
                      </div>
                    </div>
                    <div className="booking-salary">
                      ₱{booking.total_amount}
                    </div>
                  </div>

                  {/* Bottom Section - Action Buttons */}
                  <div className="booking-actions">
                    {/* Employer Actions */}
                    {isEmployerView && (
                      <>
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              className="booking-view-transaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(booking);
                              }}
                            >
                              View Transaction
                            </button>
                            <button 
                              className="booking-cancel-booking-btn"
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
                            className="booking-view-transaction-btn"
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
                              className="booking-view-transaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(booking);
                              }}
                            >
                              View Transaction
                            </button>
                            {!booking.has_review && (
                              <button 
                                className="booking-give-feedback-btn"
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
                              className="booking-view-transaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(booking);
                              }}
                            >
                              View Transaction
                            </button>
                            <button 
                              className="booking-accept-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(booking.id, 'accepted');
                              }}
                            >
                              Accept
                            </button>
                            <button 
                              className="booking-decline-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(booking.id, 'declined');
                              }}
                            >
                              Decline
                            </button>
                          </>
                        )}
                        
                        {booking.status === 'accepted' && (
                          <>
                            <button 
                              className="booking-view-transaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(booking);
                              }}
                            >
                              View Transaction
                            </button>
                            <button 
                              className="booking-complete-btn"
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
                            className="booking-view-transaction-btn"
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
          <div className="booking-empty-state">
            <div className="booking-empty-icon">
              <img src="/images/mybooking.svg" alt="No Bookings" />
            </div>
            <h3 className="booking-empty-title">No Bookings Yet</h3>
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

      {/* Edit Booking Modal */}
      {isEditModalOpen && selectedBooking && (
        <EditMyBooking
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateBooking}
          booking={selectedBooking}
        />
      )}
    </div>
  );
};

export default MyBookings;