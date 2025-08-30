import React, { useState } from 'react';
import './../../../sass/components/profile.scss';
import Headerz from "../HeaderContent/Headerz";
import { IconBrandTwitter, IconBrandLinkedin, IconBrandInstagram } from '@tabler/icons-react'; // Removed IconX since it's no longer used
import profilePhoto from '../../../../resources/sass/img/pfp.svg';
import coverPhoto from '../../../../resources/sass/img/coverphoto.svg';
import BookModal from './BookModal';

const Profile = ({ initialServiceType }) => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Mock worker data
  const worker = {
    id: 1,
    name: "Lebron James",
    role: "Master Plumber",
    status: "ACTIVE NOW",
    hourlyRate: 200.17,
    description: "Experienced plumber with over 10 years in the field, specializing in residential and commercial plumbing solutions.",
    education: "Associates Degree in Plumbing Technology",
    skills: ["Pipe Installation", "Leak Repair", "System Maintenance"],
    experience: "10+ years",
    location: "Los Angeles, CA",
    memberSince: "September 27, 2021",
    rating: 4.8,
    reviews: [
      { id: 1, reviewer: "John S.", rating: 5, comment: "Lebron did an excellent job fixing our pipe leak. Very professional!", date: "August 15, 2025" },
      { id: 2, reviewer: "Sarah M.", rating: 4, comment: "Good work, but scheduling was a bit tricky.", date: "July 20, 2025" },
    ],
    credentials: [
      "Licensed Master Plumber, California",
      "Certified in Backflow Prevention",
      "OSHA Safety Certification",
    ],
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleBookingSubmit = (details) => {
    setBookingDetails(details);
    setIsBookingModalOpen(false);
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmBooking = () => {
    setIsConfirmationModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="profile-page">
      <Headerz />
      <div className="profile-header">
        <div className="cover-photo">
          <img src={coverPhoto} alt="Cover" />
        </div>
        <div className="profile-photo-wrapper">
          <img src={profilePhoto} alt="Profile" className="profile-photo" />
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-left">
          <div className="profile-info">
            <h2>{worker.name}</h2>
            <div className="status-container">
              <span className="status-dot"></span>
              <p className="status">{worker.status === "ACTIVE NOW" ? "Available now" : worker.status}</p>
            </div>
            <p className="location">{worker.location}</p>
            <button className="edit-profile" onClick={() => setIsBookingModalOpen(true)}>
              BOOK NOW
            </button>
          </div>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Experience</span>
              <span className="stat-number">10+ years</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hourly Rate</span>
              <span className="stat-number">$200.17/hr</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rating</span>
              <span className="stat-number">4.8 ★</span>
            </div>
          </div>
          <div className="social-links">
            <h4>ON THE WEB</h4>
            <div className="social-links-container">
              <div className="social-icon">
                <IconBrandTwitter size={20} className="social-media-icon" />
                <span>Twitter</span>
              </div>
              <div className="social-icon">
                <IconBrandLinkedin size={20} className="social-media-icon" />
                <span>LinkedIn</span>
              </div>
              <div className="social-icon">
                <IconBrandInstagram size={20} className="social-media-icon" />
                <span>Instagram</span>
              </div>
            </div>
          </div>
          <p className="member-since">MEMBER SINCE: {worker.memberSince}</p>
          <p className="report">Report Profile</p>
        </div>

        <div className="profile-right">
          <div className="tabs">
            {['OVERVIEW', 'CREDENTIALS', 'REVIEWS'].map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="tab-content">
            {activeTab === 'OVERVIEW' && (
              <div className="overview">
                <h4>About</h4>
                <p>{worker.description}</p>
                <h4>Skills</h4>
                <div className="skills-row">
                  {worker.skills.map((skill, index) => (
                    <span key={index} className="chip">{skill}</span>
                  ))}
                </div>
                <h4>Education</h4>
                <p>{worker.education}</p>
              </div>
            )}
            {activeTab === 'CREDENTIALS' && (
              <div className="credentials">
                <h4>Credentials</h4>
                <ul>
                  {worker.credentials.map((credential, index) => (
                    <li key={index}>{credential}</li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === 'REVIEWS' && (
              <div className="reviews">
                <h4>Reviews ({worker.reviews.length})</h4>
                {worker.reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <span className="reviewer">{review.reviewer}</span>
                      <span className="rating">{'★'.repeat(review.rating)}</span>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    <p className="review-date">{review.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BookModal
        worker={worker}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={(details) => handleBookingSubmit(details)}
      />

      {/* Confirmation Modal */}
      {isConfirmationModalOpen && (
        <div className="adminmodal-overlay">
          <div className="adminmodal">
            <h2>Planning Summary</h2> {/* Removed X button */}
            <div className="adminmodal-content">
              <div className="form-group">
                <label>Worker</label>
                <input type="text" value={worker.name} readOnly disabled />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="text" value={bookingDetails.email} readOnly disabled />
              </div>
              <div className="form-group name-row">
                <div className="name-field">
                  <label>First Name</label>
                  <input type="text" value={bookingDetails.firstName} readOnly disabled />
                </div>
                <div className="name-field">
                  <label>Middle Name</label>
                  <input type="text" value={bookingDetails.middleName} readOnly disabled />
                </div>
              </div>
              <div className="form-group name-row">
                <div className="name-field">
                  <label>Last Name</label>
                  <input type="text" value={bookingDetails.lastName} readOnly disabled />
                </div>
                <div className="name-field">
                  <label>Suffix</label>
                  <input type="text" value={bookingDetails.suffix} readOnly disabled />
                </div>
              </div>
              <div className="form-group">
                <label>Service Type</label>
                <input type="text" value={bookingDetails.serviceType} readOnly disabled />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value="Butuan City" readOnly disabled />
              </div>
              <div className="form-group">
                <label>Book In</label>
                <input type="text" value={bookingDetails.bookIn} readOnly disabled />
              </div>
              <div className="form-group">
                <label>Book End</label>
                <input type="text" value={bookingDetails.bookEnd} readOnly disabled />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={bookingDetails.description} readOnly disabled />
              </div>
              <div className="form-group">
                <label>Estimated Salary</label>
                <div>
                  Daily: ${bookingDetails ? calculateSalary(bookingDetails).daily : '0.00'}<br />
                  Monthly: ${bookingDetails ? calculateSalary(bookingDetails).monthly : '0.00'}<br />
                  Yearly: ${bookingDetails ? calculateSalary(bookingDetails).yearly : '0.00'}
                </div>
              </div>
            </div>
            <div className="adminmodal-buttons">
              <button className="cancel-button" onClick={() => setIsConfirmationModalOpen(false)}>
                Cancel
              </button>
              <button className="submit-button" onClick={handleConfirmBooking}>
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="adminmodal-overlay">
          <div className="adminmodal">
            <h2>Booking Successful</h2> {/* Removed X button */}
            <div className="adminmodal-content">
              <div className="form-group">
                <p>Thank you for booking this applicant. Please note that the status is currently pending.</p>
              </div>
            </div>
            <div className="adminmodal-buttons">
              <button className="submit-button" onClick={() => setIsSuccessModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function calculateSalary(details) {
    if (!details.bookIn || !details.bookEnd) return { daily: 0, monthly: 0, yearly: 0 };
    const start = new Date(details.bookIn);
    const end = new Date(details.bookEnd);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    const hourlyRate = worker.hourlyRate;
    const daily = hourlyRate * 8 * diffDays;
    const monthly = hourlyRate * 8 * 30 * diffMonths;
    const yearly = hourlyRate * 8 * 365 * diffYears;
    return { daily: daily.toFixed(2), monthly: monthly.toFixed(2), yearly: yearly.toFixed(2) };
  }
};

export default Profile;