import React, { useState } from 'react';
import { MdVerified } from 'react-icons/md';
import ModalFeedback from './modalfeedback';
import '../../../sass/components/profilesettings/mybookings.scss';

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const bookingCategories = [
    { id: 'all', label: 'All Bookings' },
    { id: 'pending', label: 'Pending' },
    { id: 'declined', label: 'Declined' },
    { id: 'approved', label: 'Approved' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'completed', label: 'Completed' }
  ];

  // Sample booking data
  const allBookings = [
   {
     id: 1,
     workerName: 'Ruella Malabo',
     profession: 'Developer',
     profilePic: '/images/electrician.svg',
     isVerified: true,
     isBlueCollar: false,
     isWhiteCollar: true,
     isPinkCollar: false,
     salary: '₱ 1,000.00',
     status: 'Approved',
     statusColor: '#F7E891'
   },
     {
       id: 2,
       workerName: 'Maria Santos',
       profession: 'Electrician',
       profilePic: '/images/electrician.svg',
       isVerified: true,
       isBlueCollar: true,
       isWhiteCollar: false,
       isPinkCollar: false,
       salary: '₱ 1,500.00',
       status: 'Pending',
       statusColor: '#D9512C'
     },
     {
       id: 3,
       workerName: 'John Dela Cruz',
       profession: 'Carpenter',
       profilePic: '/images/electrician.svg',
       isVerified: true,
       isBlueCollar: true,
       isWhiteCollar: false,
       isPinkCollar: false,
       salary: '₱ 1,800.00',
       status: 'Completed',
       statusColor: '#16a34a'
     },
     {
       id: 4,
       workerName: 'Ana Rodriguez',
       profession: 'Nurse',
       profilePic: '/images/electrician.svg',
       isVerified: true,
       isBlueCollar: false,
       isWhiteCollar: false,
       isPinkCollar: true,
       salary: '₱ 1,200.00',
       status: 'Declined',
       statusColor: '#dc2626'
     },
     {
       id: 5,
       workerName: 'Carlos Mendez',
       profession: 'Welder',
       profilePic: '/images/electrician.svg',
       isVerified: true,
       isBlueCollar: true,
       isWhiteCollar: false,
       isPinkCollar: false,
       salary: '₱ 1,600.00',
       status: 'Cancelled',
       statusColor: '#6b7280'
     }
   ];

  // Filter bookings based on active tab
  const getFilteredBookings = () => {
    if (activeTab === 'all') {
      return allBookings;
    }
    return allBookings.filter(booking => 
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

  const handleGiveFeedback = (worker) => {
    setSelectedWorker(worker);
    setIsFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setSelectedWorker(null);
  };

  const handleSubmitFeedback = (feedbackData) => {
    console.log('Feedback submitted:', feedbackData);
    // Here you would typically send the feedback to your backend
    // For now, we'll just log it and close the modal
    // No alert popup - direct submission
  };

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <h2 className="bookings-title">My Bookings</h2>
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

      <div className={`bookings-content ${activeTab === 'all' ? 'all-bookings' : ''}`}>
        {filteredBookings.length > 0 ? (
          <div className="bookings-list">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-worker-info">
                  <div className="worker-profile">
                    <img src={booking.profilePic} alt={booking.workerName} className="worker-avatar" />
                  </div>
                  <div className="worker-details">
                    <h3 className="worker-name">{booking.workerName}</h3>
                    <p className="worker-profession">{booking.profession}</p>
                    <div className="worker-badges">
                      {booking.isVerified && (
                        <div className="verified-badge">
                          <MdVerified className="verified-icon" />
                          <span>Verified</span>
                        </div>
                      )}
                      {booking.isBlueCollar && (
                        <div className="blue-collar-badge">
                          <img src="/images/bluecollar.svg" alt="Blue Collar" className="blue-collar-icon" />
                          <span>BLUE COLLAR</span>
                        </div>
                      )}
                      {booking.isWhiteCollar && (
                        <div className="white-collar-badge">
                          <img src="/images/whitecollar.svg" alt="White Collar" className="white-collar-icon" />
                          <span>WHITE COLLAR</span>
                        </div>
                      )}
                      {booking.isPinkCollar && (
                        <div className="pink-collar-badge">
                          <img src="/images/pink.svg" alt="Pink Collar" className="pink-collar-icon" />
                          <span>PINK COLLAR</span>
                        </div>
                      )}
                    </div>
                    <div className="booking-status">
                      <span>Status : </span>
                      <span className="status-text" style={{ color: booking.statusColor }}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="booking-salary">
                      Salary : {booking.salary}
                    </div>
                  </div>
                </div>
                <div className="booking-actions">
                  {/* Pending: View Transaction + Cancel Booking */}
                  {booking.status === 'Pending' && (
                    <>
                      <button className="view-transaction-btn">View Transaction</button>
                      <button className="cancel-booking-btn">Cancel Booking</button>
                    </>
                  )}
                  
                  {/* Approved: View Transaction only */}
                  {booking.status === 'Approved' && (
                    <button className="view-transaction-btn">View Transaction</button>
                  )}
                  
                  {/* Declined: No buttons, just status text */}
                  {booking.status === 'Declined' && (
                    <div className="status-only">
                      <span className="declined-text">Declined</span>
                    </div>
                  )}
                  
                  {/* Cancelled: No buttons, just status text */}
                  {booking.status === 'Cancelled' && (
                    <div className="status-only">
                      <span className="cancelled-text">Cancelled</span>
                    </div>
                  )}
                  
                  {/* Completed: Give Feedback button only */}
                  {booking.status === 'Completed' && (
                    <button 
                      className="give-feedback-btn"
                      onClick={() => handleGiveFeedback(booking)}
                    >
                      Give Feedback
                    </button>
                  )}
                </div>
              </div>
            ))}
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
          workerName={selectedWorker.workerName}
        />
      )}
    </div>
  );
};

export default MyBookings;
