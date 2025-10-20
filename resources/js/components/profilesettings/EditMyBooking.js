import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import CustomDropdown from '../common/CustomDropdown';
import '../../../sass/components/profilesettings/EditMyBooking.scss';

const EditMyBooking = ({ isOpen, onClose, onSubmit, booking }) => {
  const [bookingDetails, setBookingDetails] = useState({
    service_type: '',
    sub_skill: '',
    work_type: '',
    book_in: '',
    book_end: '',
    time_in: '',
    time_out: '',
    description: '',
    daily_rate: ''
  });

  const [worker, setWorker] = useState(null);

  useEffect(() => {
    if (isOpen && booking) {
      // Initialize form with booking data
      setBookingDetails({
        service_type: booking.service_type || '',
        sub_skill: booking.sub_skill || '',
        work_type: booking.work_type || '',
        book_in: booking.book_in ? new Date(booking.book_in).toISOString().slice(0, 16) : '',
        book_end: booking.book_end ? new Date(booking.book_end).toISOString().slice(0, 16) : '',
        time_in: booking.time_in || '',
        time_out: booking.time_out || '',
        description: booking.description || '',
        daily_rate: booking.daily_rate || ''
      });

      // Set worker data for dropdowns
      setWorker({
        id: booking.worker_id,
        name: booking.worker?.profile ? `${booking.worker.profile.first_name} ${booking.worker.profile.last_name}` : 'Worker',
        work_type: booking.work_type,
        primary_skills: booking.worker?.primary_skills || [],
        additional_skills: booking.worker?.additional_skills || []
      });
    }
  }, [isOpen, booking]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!bookingDetails.service_type || !bookingDetails.book_in || !bookingDetails.book_end || !bookingDetails.description || !bookingDetails.daily_rate) {
      message.error("Please fill in all required fields");
      return;
    }

    // Validate daily rate amount
    if (!bookingDetails.daily_rate || parseFloat(bookingDetails.daily_rate) <= 0) {
      message.error("Please enter a valid daily rate amount");
      return;
    }

    // Validate date range
    if (bookingDetails.book_end <= bookingDetails.book_in) {
      message.error("End date must be after start date");
      return;
    }

    // Prepare validated details for submission
    const validatedDetails = {
      ...bookingDetails,
      daily_rate: parseFloat(bookingDetails.daily_rate)
    };

    console.log('Submitting updated booking details:', validatedDetails);
    onSubmit(validatedDetails);
  };

  // Get available service types (main skills only)
  const getAvailableServiceTypes = () => {
    if (!worker?.primary_skills && !worker?.additional_skills) return [];
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    
    // Create options array for CustomDropdown with unique main skills
    const skillNames = new Set();
    const options = [];
    
    allSkills.forEach(skill => {
      const mainSkill = skill.skill_name;
      if (!skillNames.has(mainSkill)) {
        skillNames.add(mainSkill);
        options.push({
          value: mainSkill,
          label: mainSkill
        });
      }
    });
    
    return options;
  };

  // Get sub-skills for selected service type
  const getAvailableSubSkills = () => {
    if (!bookingDetails.service_type) return [];
    
    const allSkills = [
      ...(worker?.primary_skills || []),
      ...(worker?.additional_skills || [])
    ];
    
    const options = [];
    
    allSkills.forEach(skill => {
      if (skill.skill_name === bookingDetails.service_type && skill.sub_skills && Array.isArray(skill.sub_skills)) {
        skill.sub_skills.forEach(subSkill => {
          options.push({
            value: subSkill,
            label: subSkill
          });
        });
      }
    });
    
    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="edit-booking-modal-overlay">
      <div className="edit-booking-modal-container">
        <h2 className="edit-booking-modal-title">Edit Booking Request</h2>
        <div className="edit-booking-modal-form-content">
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="service_type">Service Type</label>
            <CustomDropdown
              options={getAvailableServiceTypes()}
              value={bookingDetails.service_type}
              onChange={(value) => setBookingDetails(prev => ({ ...prev, service_type: value, sub_skill: '' }))}
              placeholder="Select a service"
              required
            />
          </div>
          
          {bookingDetails.service_type && getAvailableSubSkills().length > 0 && (
            <div className="booking-form-field">
              <label className="booking-form-label" htmlFor="sub_skill">Sub Skills</label>
              <CustomDropdown
                options={getAvailableSubSkills()}
                value={bookingDetails.sub_skill}
                onChange={(value) => setBookingDetails(prev => ({ ...prev, sub_skill: value }))}
                placeholder="Select a sub-skill"
              />
            </div>
          )}
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="work_type">Work Type</label>
            <input
              type="text"
              id="work_type"
              name="work_type"
              value={bookingDetails.work_type}
              className="booking-form-input booking-form-input-disabled"
              readOnly
              disabled
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="book_in">Book In</label>
            <input
              type="datetime-local"
              id="book_in"
              name="book_in"
              value={bookingDetails.book_in}
              onChange={handleChange}
              className="booking-form-input"
              required
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="book_end">Book End</label>
            <input
              type="datetime-local"
              id="book_end"
              name="book_end"
              value={bookingDetails.book_end}
              onChange={handleChange}
              className="booking-form-input"
              min={bookingDetails.book_in}
              required
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="time_in">Time In</label>
            <input
              type="time"
              id="time_in"
              name="time_in"
              value={bookingDetails.time_in}
              onChange={handleChange}
              className="booking-form-input"
              placeholder="Select start time"
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="time_out">Time Out</label>
            <input
              type="time"
              id="time_out"
              name="time_out"
              value={bookingDetails.time_out}
              onChange={handleChange}
              className="booking-form-input"
              placeholder="Select end time"
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={bookingDetails.description}
              onChange={handleChange}
              className="booking-form-textarea"
              placeholder="Describe the work or service you need"
              required
            />
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="daily_rate">Daily Rate</label>
            <input
              type="number"
              id="daily_rate"
              name="daily_rate"
              value={bookingDetails.daily_rate}
              onChange={handleChange}
              className="booking-form-input"
              placeholder="Enter daily rate amount"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>
        
        <div className="edit-booking-modal-actions">
          <button className="booking-btn booking-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="booking-btn booking-btn-submit"
            onClick={handleSubmit}
            disabled={!bookingDetails.service_type || !bookingDetails.book_in || !bookingDetails.book_end || !bookingDetails.description || !bookingDetails.daily_rate}
          >
            Update Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMyBooking;
