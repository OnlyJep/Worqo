import React, { useState, useEffect } from 'react';
import './../../../sass/components/BookModal.scss';

const BookModal = ({ worker, isOpen, onClose, onSubmit }) => {
  const [bookingDetails, setBookingDetails] = useState({
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    serviceType: 'Plumbing', // Default to Plumbing based on browse service
    bookIn: '',
    bookEnd: '',
    description: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setBookingDetails({
        email: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        serviceType: 'Plumbing',
        bookIn: '',
        bookEnd: '',
        description: '',
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return { days: 0, months: 0, years: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    return { days: diffDays, months: diffMonths, years: diffYears };
  };

  const calculateSalary = () => {
    const { bookIn, bookEnd } = bookingDetails;
    if (!bookIn || !bookEnd) return { daily: 0, monthly: 0, yearly: 0 };
    const duration = calculateDuration(bookIn, bookEnd);
    const hourlyRate = worker.hourlyRate;
    const daily = hourlyRate * 8 * duration.days;
    const monthly = hourlyRate * 8 * 30 * duration.months;
    const yearly = hourlyRate * 8 * 365 * duration.years;
    return { daily: daily.toFixed(2), monthly: monthly.toFixed(2), yearly: yearly.toFixed(2) };
  };

  const handleSubmit = () => {
    onSubmit(bookingDetails); // Pass details to parent for further processing
  };

  // Date validation: Ensure bookEnd is not before bookIn and within 2003-2025
  const minDate = new Date('2003-01-01').toISOString().split('T')[0];
  const maxDate = new Date('2025-12-31').toISOString().split('T')[0];
  const isValidEndDate = (endDate) => {
    const start = new Date(bookingDetails.bookIn);
    const end = new Date(endDate);
    return end >= start && end >= new Date(minDate) && end <= new Date(maxDate);
  };

  if (!isOpen) return null;

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>Planning to book {worker.name}</h2> {/* Removed X button and updated title */}
        <div className="adminmodal-content">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={bookingDetails.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group name-row">
            <div className="name-field">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={bookingDetails.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="name-field">
              <label>Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={bookingDetails.middleName}
                onChange={handleChange}
                placeholder="Enter your middle name"
              />
            </div>
          </div>
          <div className="form-group name-row">
            <div className="name-field">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={bookingDetails.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                required
              />
            </div>
            <div className="name-field">
              <label>Suffix (Optional)</label>
              <input
                type="text"
                name="suffix"
                value={bookingDetails.suffix}
                onChange={handleChange}
                placeholder="e.g., Jr., Sr."
              />
            </div>
          </div>
          <div className="form-group">
            <label>Service Type</label>
            <input
              type="text"
              name="serviceType"
              value={bookingDetails.serviceType}
              readOnly
              disabled
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value="Butuan City"
              readOnly
              disabled
            />
          </div>
          <div className="form-group">
            <label>Book In</label>
            <input
              type="date"
              name="bookIn"
              value={bookingDetails.bookIn}
              onChange={handleChange}
              min={minDate}
              max={maxDate}
              required
            />
          </div>
          <div className="form-group">
            <label>Book End</label>
            <input
              type="date"
              name="bookEnd"
              value={bookingDetails.bookEnd}
              onChange={(e) => {
                if (isValidEndDate(e.target.value)) {
                  handleChange(e);
                }
              }}
              min={bookingDetails.bookIn || minDate}
              max={maxDate}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={bookingDetails.description}
              onChange={handleChange}
              placeholder="Describe the work or favor for this worker"
              required
            />
          </div>
          <div className="form-group">
            <label>Estimated Salary</label>
            <div>
              Daily: ${calculateSalary().daily}<br />
              Monthly: ${calculateSalary().monthly}<br />
              Yearly: ${calculateSalary().yearly}
            </div>
          </div>
        </div>
        <div className="adminmodal-buttons">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={!bookingDetails.email || !bookingDetails.firstName || !bookingDetails.lastName || !bookingDetails.bookIn || !bookingDetails.bookEnd || !bookingDetails.description || !isValidEndDate(bookingDetails.bookEnd)}
          >
            Submit Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookModal;