import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookingRequest from './BookingRequest';
import '../../../sass/components/profilesettings/mybookings.scss';

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState(new Set());

  useEffect(() => {
    fetchUserRole();
    fetchBookings();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await axios.get('/api/user');
      setUserRole(response.data.role_id);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status });
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const handleViewTransaction = (booking) => {
    // Implement transaction view logic
    console.log('View transaction for booking:', booking);
  };

  const handleGiveFeedback = (booking) => {
    // Implement feedback logic
    console.log('Give feedback for booking:', booking);
  };

  const handleSelectBooking = (bookingId, isSelected) => {
    setSelectedBookings(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(bookingId);
      } else {
        newSet.delete(bookingId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedBookings.size === 0) return;
    
    try {
      const bookingIds = Array.from(selectedBookings);
      await axios.delete('/api/bookings/bulk', { data: { booking_ids: bookingIds } });
      setSelectedBookings(new Set());
      fetchBookings();
    } catch (error) {
      console.error('Error deleting selected bookings:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const tabs = [
    { key: 'all', label: 'All Bookings' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'completed', label: 'Completed' },
    { key: 'declined', label: 'Declined' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <div className="my-bookings-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <h2 className="bookings-title">My Bookings</h2>
      </div>
      
      <div className="bookings-navigation">
        <div className="bookings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Delete Button */}
      {selectedBookings.size > 0 && (
        <div className="bulk-delete-container" style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginBottom: '16px', 
          padding: '0 20px' 
        }}>
          <button 
            className="delete-selected-btn"
            onClick={handleDeleteSelected}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🗑️</span>
            Delete Selected ({selectedBookings.size})
          </button>
        </div>
      )}
      
      <div className="bookings-content">
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <img src="/images/mybooking.svg" alt="No Bookings" />
            </div>
            <h3 className="empty-title">No Bookings Yet</h3>
            <p className="empty-description">
              {activeTab === 'all' 
                ? "You haven't made any bookings yet." 
                : `No ${activeTab} bookings found.`
              }
            </p>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => (
              <BookingRequest
                key={booking.id}
                booking={booking}
                userRole={userRole}
                onCancelBooking={handleCancelBooking}
                onStatusUpdate={handleStatusUpdate}
                onViewTransaction={handleViewTransaction}
                onGiveFeedback={handleGiveFeedback}
                isSelected={selectedBookings.has(booking.id)}
                onSelect={handleSelectBooking}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
