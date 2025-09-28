import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';
import './WorkerBookings.scss';

const WorkerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workerNotes, setWorkerNotes] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        message.error("Please log in to view bookings");
        return;
      }

      const response = await axios.get('http://127.0.0.1:8000/api/bookings/worker', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json"
        }
      });

      if (response.data.success) {
        setBookings(response.data.bookings);
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

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.put(`http://127.0.0.1:8000/api/bookings/${bookingId}/status`, {
        status,
        worker_notes: workerNotes
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success(`Booking ${status} successfully`);
        setWorkerNotes('');
        setIsModalOpen(false);
        setSelectedBooking(null);
        fetchBookings();
      } else {
        message.error(response.data.message || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking:", error.response?.data || error.message);
      message.error("Failed to update booking status");
    }
  };

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setWorkerNotes(booking.worker_notes || '');
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'accepted': return '#4CAF50';
      case 'declined': return '#f44336';
      case 'cancelled': return '#9e9e9e';
      case 'completed': return '#2196F3';
      default: return '#9e9e9e';
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <div className="worker-bookings">
        <div className="loading-container">
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-bookings">
      <div className="bookings-header">
        <h2>Your Booking Requests</h2>
        <p>Manage incoming booking requests from employers</p>
      </div>

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>No booking requests yet</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-info">
                  <h3>{booking.employer?.profile ? `${booking.employer.profile.first_name} ${booking.employer.profile.last_name}` : 'Unknown Employer'}</h3>
                  <p className="booking-email">{booking.employer?.email || 'No email'}</p>
                  <p className="booking-contact">{booking.employer?.profile?.contact_number || 'No contact'}</p>
                </div>
                <div className="booking-status">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {booking.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="label">Service:</span>
                  <span className="value">{booking.service_type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Work Type:</span>
                  <span className="value">{booking.work_type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Start:</span>
                  <span className="value">{formatDateTime(booking.book_in)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">End:</span>
                  <span className="value">{formatDateTime(booking.book_end)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Hourly Rate:</span>
                  <span className="value">₱{booking.hourly_rate}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Amount:</span>
                  <span className="value">₱{booking.total_amount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Description:</span>
                  <span className="value">{booking.description}</span>
                </div>
              </div>

              {booking.worker_notes && (
                <div className="worker-notes">
                  <span className="label">Your Notes:</span>
                  <span className="value">{booking.worker_notes}</span>
                </div>
              )}

              {booking.status === 'pending' && (
                <div className="booking-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => handleStatusUpdate(booking.id, 'accepted')}
                  >
                    Accept
                  </button>
                  <button 
                    className="decline-btn"
                    onClick={() => openModal(booking)}
                  >
                    Decline
                  </button>
                </div>
              )}

              {booking.status === 'accepted' && (
                <div className="booking-actions">
                  <button 
                    className="complete-btn"
                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                  >
                    Mark as Completed
                  </button>
                </div>
              )}

              {booking.rating && booking.review && (
                <div className="employer-review">
                  <div className="rating">
                    <span className="label">Employer Rating:</span>
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < booking.rating ? 'star filled' : 'star'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="review">
                    <span className="label">Employer Review:</span>
                    <p>{booking.review}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decline Modal */}
      {isModalOpen && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Decline Booking</h3>
            <div className="modal-content">
              <div className="form-group">
                <label>Reason for declining (optional):</label>
                <textarea
                  value={workerNotes}
                  onChange={(e) => setWorkerNotes(e.target.value)}
                  placeholder="Provide a reason for declining this booking..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedBooking(null);
                  setWorkerNotes('');
                }}
              >
                Cancel
              </button>
              <button 
                className="decline-btn"
                onClick={() => handleStatusUpdate(selectedBooking.id, 'declined')}
              >
                Decline Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerBookings;
