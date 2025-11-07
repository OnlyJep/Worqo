
import React, { useState, useEffect, useRef } from 'react';
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
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

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

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Get user role from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    setUserRole(userData.role_id);
    setCurrentUserId(userData.id);
    
    // Test admin endpoint first to see if there are any bookings
    testAdminEndpoint();
    fetchBookings();
    
    // If user is a worker, also fetch booking requests
    if (userData.role_id === 1) {
      fetchBookingRequests();
    }
    
    // Listen for booking refresh trigger
    const handleStorageChange = (e) => {
      if (e.key === 'booking_refresh_trigger' && isMountedRef.current) {
        fetchBookings();
      }
    };
    
    // Listen for custom booking submitted event
    const handleBookingSubmitted = () => {
      if (isMountedRef.current) {
        fetchBookings();
      }
    };
    
    // Listen for storage changes and custom events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bookingSubmitted', handleBookingSubmitted);
    
    // Also check for refresh trigger on component mount
    const refreshTrigger = localStorage.getItem('booking_refresh_trigger');
    if (refreshTrigger && isMountedRef.current) {
      fetchBookings();
      // Clear the trigger after use
      localStorage.removeItem('booking_refresh_trigger');
    }
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookingSubmitted', handleBookingSubmitted);
    };
  }, []);

  const testAdminEndpoint = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;

      await axios.get('http://127.0.0.1:8000/api/bookings', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      // Silently handle error - this is just a test endpoint
    }
  };

  const fetchBookingRequests = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        message.error("Please log in to view booking requests");
        return;
      }

      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const userId = userData.id;

      if (!userId) {
        message.error("Unable to fetch booking requests - user data incomplete");
        return;
      }

      const response = await axios.get(`http://127.0.0.1:8000/api/bookings/worker/requests?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success && isMountedRef.current) {
        setBookingRequests(response.data.booking_requests || []);
      }
    } catch (error) {
      // Silently handle error - user will see empty list if fetch fails
    }
  };

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
      
      // Validate that we have a valid user ID
      if (!userData.id) {
        message.error("Unable to fetch bookings - user data incomplete");
        return;
      }

      // Make the API call to fetch bookings using the correct user_id
      const userId = userData.id;
      
      // Try the specific endpoint first
      let response;
      try {
        response = await axios.get(`http://127.0.0.1:8000/api/bookings/${endpoint}?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        });
      } catch (endpointError) {
        // Fallback to admin endpoint
        response = await axios.get('http://127.0.0.1:8000/api/bookings', {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        });
        
        // Filter bookings for this user
        if (response.data.bookings && response.data.bookings.length > 0) {
          const userBookings = response.data.bookings.filter(booking => 
            booking.employer_id == userId || booking.worker_id == userId
          );
          
          if (userBookings.length > 0) {
            const sortedBookings = userBookings.sort((a, b) => {
              const statusOrder = { 'pending': 1, 'accepted': 2, 'completed': 3, 'declined': 4, 'cancelled': 5 };
              return statusOrder[a.status] - statusOrder[b.status];
            });
            if (isMountedRef.current) {
              setBookings(sortedBookings);
              setLoading(false);
            }
            return;
          }
        }
        
        // If no bookings found, set empty array
        if (isMountedRef.current) {
          setBookings([]);
          setLoading(false);
        }
        return;
      }

      if (response.data.success && isMountedRef.current) {
        // Sort bookings: Pending first, then Accepted, Completed, Declined, Cancelled
        const sortedBookings = response.data.bookings.sort((a, b) => {
          const statusOrder = { 'pending': 1, 'accepted': 2, 'completed': 3, 'declined': 4, 'cancelled': 5 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        setBookings(sortedBookings);
      } else if (isMountedRef.current) {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error.response?.data || error.message);
      if (isMountedRef.current) {
        message.error("Failed to fetch bookings");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.put(`http://127.0.0.1:8000/api/bookings/${bookingId}/status`, {
        status: 'cancelled'
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
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
      if (error?.response?.status === 403) {
        message.error(error.response.data?.message || "Unauthorized to cancel this booking");
      } else {
        message.error(error.response?.data?.message || "Failed to cancel booking");
      }
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
        // Also refresh booking requests if user is a worker
        if (userRole === 1) {
          fetchBookingRequests();
        }
      } else {
        message.error(response.data.message || `Failed to ${status} booking`);
      }
    } catch (error) {
      console.error("Error updating booking status:", error.response?.data || error.message);
      message.error(`Failed to ${status} booking`);
    }
  };

  const confirmAndUpdate = (booking, status) => {
    const name = booking?.worker?.profile
      ? `${booking.worker.profile.first_name || ''} ${booking.worker.profile.last_name || ''}`.trim()
      : (booking?.worker?.name || booking?.worker_name || 'this worker');
    const verb = status === 'accepted' ? 'hire' : status === 'declined' ? 'decline' : status;
    if (!window.confirm(`Are you sure you want to ${verb} ${name}?`)) return;
    handleStatusUpdate(booking.id, status);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.put(`http://127.0.0.1:8000/api/bookings/${requestId}/status`, {
        status: 'accepted'
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success('Booking request accepted successfully!');
        fetchBookingRequests(); // Refresh booking requests
        fetchBookings(); // Also refresh regular bookings
      } else {
        message.error(response.data.message || 'Failed to accept booking request');
      }
    } catch (error) {
      console.error("Error accepting booking request:", error.response?.data || error.message);
      message.error('Failed to accept booking request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.put(`http://127.0.0.1:8000/api/bookings/${requestId}/status`, {
        status: 'declined'
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success('Booking request declined');
        fetchBookingRequests(); // Refresh booking requests
        fetchBookings(); // Also refresh regular bookings
      } else {
        message.error(response.data.message || 'Failed to decline booking request');
      }
    } catch (error) {
      console.error("Error declining booking request:", error.response?.data || error.message);
      message.error('Failed to decline booking request');
    }
  };

  // Filter bookings based on active tab
  const getFilteredBookings = () => {
    if (activeTab === 'all') {
      return bookings;
    } else if (activeTab === 'requests') {
      return bookingRequests;
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

      console.log('Submitting review for booking:', selectedWorker.id);
      console.log('Auth token exists:', !!authToken);
      console.log('Auth token length:', authToken ? authToken.length : 0);
      console.log('Auth token preview:', authToken ? authToken.substring(0, 20) + '...' : 'null');

      // Ensure token is properly formatted
      const token = authToken && authToken.trim() ? authToken.trim() : null;
      
      if (!token) {
        message.error("Authentication token is missing. Please log in again.");
        return;
      }

      // Prepare request data
      const requestData = {
        rating: feedbackData.rating,
        comment: feedbackData.feedback
      };

      const requestHeaders = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      console.log('Request URL:', `http://127.0.0.1:8000/api/bookings/${selectedWorker.id}/review`);
      console.log('Request Data:', requestData);
      console.log('Request Headers:', { ...requestHeaders, Authorization: 'Bearer [REDACTED]' });

      const response = await axios.post(
        `http://127.0.0.1:8000/api/bookings/${selectedWorker.id}/review`,
        requestData,
        {
          headers: requestHeaders,
          withCredentials: false
        }
      );

      if (response.data.success) {
        message.success(response.data.message || "Feedback submitted successfully");
        setIsFeedbackModalOpen(false);
        setSelectedWorker(null);
        // Refresh bookings to update has_review status
        await fetchBookings();
      } else {
        message.error(response.data.message || "Failed to submit feedback");
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
      console.log('=== UPDATING BOOKING ===');
      console.log('Booking ID:', selectedBooking.id);
      console.log('Updated details:', updatedDetails);
      console.log('hours_per_day in updatedDetails:', updatedDetails.hours_per_day);
      console.log('hours_per_day type:', typeof updatedDetails.hours_per_day);
      
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.put(`http://127.0.0.1:8000/api/bookings/${selectedBooking.id}`, updatedDetails, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });
      
      console.log('Update response:', response.data);

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
          {activeTab === 'requests' ? 'Booking Requests' : 
           userRole === 1 ? 'My Bookings' : 'My Bookings'}
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
              const isBookingRequest = activeTab === 'requests';
              const personData = isEmployerView ? booking.worker : booking.employer;
              const personProfile = personData?.profile;
              
              // For debugging - log both worker and employer data
              console.log('=== BOOKING PERSON DATA DEBUG ===');
              console.log('Is Employer View:', isEmployerView);
              console.log('Worker Data:', booking.worker);
              console.log('Employer Data:', booking.employer);
              console.log('Worker Profile:', booking.worker?.profile);
              console.log('Employer Profile:', booking.employer?.profile);
              
              // Debug: Log the booking data structure
              console.log('=== BOOKING DATA DEBUG ===');
              console.log('Booking ID:', booking.id);
              console.log('Complete Booking Object:', booking);
              console.log('Person Data:', personData);
              console.log('Person Profile:', personProfile);
              console.log('Person Profile Image:', personProfile?.profile_img);
              console.log('Person Data Image:', personData?.profile_img);
              console.log('Booking Employer:', booking.employer);
              console.log('Booking Worker:', booking.worker);
              console.log('Booking Employer Profile:', booking.employer?.profile);
              console.log('Booking Worker Profile:', booking.worker?.profile);
              
              // If no person data, show basic booking info
              if (!personData) {
                return (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-top-section">
                      <div className="booking-worker-info">
                        <div className="booking-worker-profile">
                          <img 
                            src="/images/defpfp.svg" 
                            alt="User" 
                            className="booking-worker-avatar" 
                          />
                        </div>
                        <div className="booking-worker-details">
                          <h3 className="booking-worker-name">Booking #{booking.id}</h3>
                          <p className="booking-worker-profession">{booking.service_type || 'Service'}</p>
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
                    <div className="booking-middle-section">
                      <div className="booking-dates">
                        <div className="booking-date-item">
                          <div className="booking-date-label">Book In</div>
                          <div className="booking-date-value">{new Date(booking.book_in).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</div>
                        </div>
                        <div className="booking-date-item">
                          <div className="booking-date-label">Book End</div>
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
                  </div>
                );
              }

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
                          src={(() => {
                            console.log('=== AVATAR DEBUG ===');
                            console.log('personProfile:', personProfile);
                            console.log('personProfile.profile_img:', personProfile?.profile_img);
                            console.log('personData:', personData);
                            console.log('personData.profile_img:', personData?.profile_img);
                            
                            // Check if personProfile has profile_img (nested profile data)
                            if (personProfile?.profile_img && personProfile.profile_img !== null && personProfile.profile_img !== '' && personProfile.profile_img !== 'null') {
                              console.log('Using personProfile.profile_img:', personProfile.profile_img);
                              return `http://127.0.0.1:8000/storage/${personProfile.profile_img}`;
                            }
                            // Check if personData has profile_img (direct profile data)
                            if (personData?.profile_img && personData.profile_img !== null && personData.profile_img !== '' && personData.profile_img !== 'null') {
                              console.log('Using personData.profile_img:', personData.profile_img);
                              return `http://127.0.0.1:8000/storage/${personData.profile_img}`;
                            }
                            // Check if booking has direct profile_img (for cases where data structure is different)
                            if (booking.profile_img && booking.profile_img !== null && booking.profile_img !== '' && booking.profile_img !== 'null') {
                              console.log('Using booking.profile_img:', booking.profile_img);
                              return `http://127.0.0.1:8000/storage/${booking.profile_img}`;
                            }
                            // Additional fallback: check if the person data has a profile_img at the root level
                            if (personData && typeof personData === 'object' && personData.profile_img && personData.profile_img !== null && personData.profile_img !== '' && personData.profile_img !== 'null') {
                              console.log('Using personData root profile_img:', personData.profile_img);
                              return `http://127.0.0.1:8000/storage/${personData.profile_img}`;
                            }
                            // Default fallback
                            console.log('Using default avatar: defpfp.svg');
                            return '/images/defpfp.svg';
                          })()} 
                          alt={personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 
                               personData ? `${personData.first_name || ''} ${personData.last_name || ''}`.trim() || 'User' :
                               'User'} 
                          className="booking-worker-avatar" 
                          onError={(e) => {
                            console.log('Image failed to load, using fallback');
                            e.target.src = '/images/defpfp.svg';
                          }}
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
                                {personProfile ? `${personProfile.first_name} ${personProfile.last_name}` : 
                                 personData ? `${personData.first_name || ''} ${personData.last_name || ''}`.trim() || 'Unknown User' :
                                 'Unknown User'}
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
                              {booking.service_type || 'Service'}
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
                        {booking.status === 'pending' && (booking.employer?.id == currentUserId || booking.employer_id == currentUserId) && (
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
                            {isBookingRequest ? (
                              <>
                                <button 
                                  className="booking-accept-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptRequest(booking.id);
                                  }}
                                >
                                  Accept Request
                                </button>
                                <button 
                                  className="booking-decline-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeclineRequest(booking.id);
                                  }}
                                >
                                  Decline Request
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="booking-accept-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmAndUpdate(booking, 'accepted');
                                  }}
                                >
                                  Accept
                                </button>
                                <button 
                                  className="booking-decline-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmAndUpdate(booking, 'declined');
                                  }}
                                >
                                  Decline
                                </button>
                              </>
                            )}
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
            <h3 className="booking-empty-title">
              {activeTab === 'requests' ? 'No Booking Requests' : 'No Bookings Yet'}
            </h3>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && selectedWorker && (
        <ModalFeedback
          onClose={handleCloseFeedbackModal}
          onSubmit={handleSubmitFeedback}
          workerName={
            selectedWorker.worker?.profile 
              ? `${selectedWorker.worker.profile.first_name || ''} ${selectedWorker.worker.profile.last_name || ''}`.trim() || 'Worker'
              : selectedWorker.worker_name || 'Worker'
          }
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
