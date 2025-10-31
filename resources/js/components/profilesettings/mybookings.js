
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

  useEffect(() => {
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
      if (e.key === 'booking_refresh_trigger') {
        console.log('Booking refresh trigger detected, refreshing bookings...');
        fetchBookings();
      }
    };
    
    // Listen for custom booking submitted event
    const handleBookingSubmitted = () => {
      console.log('Booking submitted event detected, refreshing bookings...');
      console.log('Current bookings before refresh:', bookings);
      fetchBookings();
    };
    
    // Listen for storage changes and custom events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bookingSubmitted', handleBookingSubmitted);
    
    // Also check for refresh trigger on component mount
    const refreshTrigger = localStorage.getItem('booking_refresh_trigger');
    if (refreshTrigger) {
      console.log('Found booking refresh trigger on mount, refreshing bookings...');
      fetchBookings();
      // Clear the trigger after use
      localStorage.removeItem('booking_refresh_trigger');
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookingSubmitted', handleBookingSubmitted);
    };
  }, []);

  const testAdminEndpoint = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;

      console.log('=== TESTING ADMIN ENDPOINT ===');
      const response = await axios.get('http://127.0.0.1:8000/api/bookings', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });
      
      console.log('Admin endpoint test response:', response.data);
      console.log('Total bookings in database:', response.data.bookings?.length || 0);
      
      if (response.data.bookings && response.data.bookings.length > 0) {
        console.log('Sample booking:', response.data.bookings[0]);
        console.log('Sample booking employer_id:', response.data.bookings[0].employer_id);
        console.log('Sample booking worker_id:', response.data.bookings[0].worker_id);
      }
    } catch (error) {
      console.error('Admin endpoint test error:', error.response?.data || error.message);
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

      console.log('=== FETCHING BOOKING REQUESTS ===');
      console.log('User ID:', userId);

      const response = await axios.get(`http://127.0.0.1:8000/api/bookings/worker/requests?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      console.log('=== BOOKING REQUESTS RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.data.success) {
        setBookingRequests(response.data.booking_requests || []);
        console.log('Booking requests count:', response.data.booking_requests?.length || 0);
      } else {
        console.error('Failed to fetch booking requests:', response.data.message);
      }
    } catch (error) {
      console.error("Error fetching booking requests:", error.response?.data || error.message);
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
      
      console.log('Raw localStorage user data:', localStorage.getItem("user"));
      console.log('Parsed user data:', userData);
      console.log('User ID from localStorage:', userData.id);
      console.log('Role ID from localStorage:', userData.role_id);
      
      // Get the profile ID from user data
      // Check if userData has a profile_id field, otherwise use the id
      const profileId = userData.profile_id || userData.id;
      
      // Validate that we have a valid user ID
      if (!userData.id) {
        message.error("Unable to fetch bookings - user data incomplete");
        return;
      }

      // Make the API call to fetch bookings using the correct user_id
      // For employers: use user_id from employers table
      // For workers: use user_id from workers table
      const userId = userData.id; // This should be the user_id from the database
      
      console.log('=== FETCHING BOOKINGS DEBUG ===');
      console.log('User data:', userData);
      console.log('User ID:', userId);
      console.log('Role ID:', userData.role_id);
      console.log('Endpoint:', endpoint);
      console.log('API URL:', `http://127.0.0.1:8000/api/bookings/${endpoint}?user_id=${userId}`);
      
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
        console.log('Specific endpoint response:', response.data);
      } catch (endpointError) {
        console.log('Specific endpoint failed, trying admin endpoint...');
        console.log('Endpoint error:', endpointError.response?.data || endpointError.message);
        
        // Fallback to admin endpoint
        response = await axios.get('http://127.0.0.1:8000/api/bookings', {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        });
        
        console.log('Admin endpoint response:', response.data);
        
        // Filter bookings for this user
        if (response.data.bookings && response.data.bookings.length > 0) {
          const userBookings = response.data.bookings.filter(booking => 
            booking.employer_id == userId || booking.worker_id == userId
          );
          
          console.log('Found user bookings in admin endpoint:', userBookings.length);
          
          if (userBookings.length > 0) {
            const sortedBookings = userBookings.sort((a, b) => {
              const statusOrder = { 'pending': 1, 'accepted': 2, 'completed': 3, 'declined': 4, 'cancelled': 5 };
              return statusOrder[a.status] - statusOrder[b.status];
            });
            setBookings(sortedBookings);
            setLoading(false);
            return;
          }
        }
        
        // If no bookings found, set empty array
        setBookings([]);
        setLoading(false);
        return;
      }
      
      console.log('=== API RESPONSE DEBUG ===');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response success:', response.data.success);
      console.log('Bookings count:', response.data.bookings?.length || 0);
      if (response.data.bookings && response.data.bookings.length > 0) {
        console.log('First booking:', response.data.bookings[0]);
        console.log('First booking employer_id:', response.data.bookings[0].employer_id);
        console.log('First booking worker_id:', response.data.bookings[0].worker_id);
      }

      if (response.data.success) {
        // Sort bookings: Pending first, then Accepted, Completed, Declined, Cancelled
        const sortedBookings = response.data.bookings.sort((a, b) => {
          const statusOrder = { 'pending': 1, 'accepted': 2, 'completed': 3, 'declined': 4, 'cancelled': 5 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        console.log('Setting bookings:', sortedBookings.length, 'bookings');
        setBookings(sortedBookings);
      } else {
        console.log('API returned success: false');
        setBookings([]);
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
