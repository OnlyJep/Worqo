import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import './../../../sass/components/BookModal.scss';

const BookModal = ({ worker, isOpen, onClose, onSubmit, serviceType }) => {
  const [bookingDetails, setBookingDetails] = useState({
    service_type: serviceType || '',
    work_type: worker?.work_type || 'part-time',
    book_in: '',
    book_end: '',
    description: '',
    hourly_rate: worker?.hourlyRate || 0,
  });

  useEffect(() => {
    if (!isOpen) {
      setBookingDetails({
        service_type: serviceType || '',
        work_type: worker?.work_type || 'part-time',
        book_in: '',
        book_end: '',
        description: '',
        hourly_rate: worker?.hourlyRate || 0,
      });
    }
  }, [isOpen, worker, serviceType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return { hours: 0, days: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { hours: diffHours, days: diffDays };
  };

  const calculateSalary = () => {
    const { book_in, book_end } = bookingDetails;
    if (!book_in || !book_end) return { total: 0, hours: 0 };
    const duration = calculateDuration(book_in, book_end);
    const hourlyRate = parseFloat(bookingDetails.hourly_rate) || 0;
    const total = hourlyRate * duration.hours;
    return { total: total.toFixed(2), hours: duration.hours };
  };

  const handleSubmit = () => {
    // Validate required fields before submitting
    if (!bookingDetails.service_type || !bookingDetails.book_in || !bookingDetails.book_end || !bookingDetails.description) {
      message.error("Please fill in all required fields");
      return;
    }

    // Validate that book_in is at least 1 hour in the future
    if (!validateBookInTime(bookingDetails.book_in)) {
      message.error("Please select a time at least 1 hour from now");
      return;
    }

    // Validate date range
    if (bookingDetails.book_end <= bookingDetails.book_in) {
      message.error("End date must be after start date");
      return;
    }

    // Ensure hourly_rate is a number
    const validatedDetails = {
      ...bookingDetails,
      hourly_rate: parseFloat(bookingDetails.hourly_rate) || 0
    };

    console.log('Submitting booking details:', validatedDetails);
    onSubmit(validatedDetails); // Pass details to parent for further processing
  };

  // Date validation: Ensure book_end is not before book_in
  // Set minimum date to 1 hour from now to avoid timezone issues
  const now = new Date();
  now.setHours(now.getHours() + 1); // Add 1 hour buffer
  const minDate = now.toISOString().slice(0, 16); // Current datetime + 1 hour
  
  // Additional validation for book_in to be at least 1 hour in the future
  const validateBookInTime = (bookInTime) => {
    if (!bookInTime) return true;
    const selectedTime = new Date(bookInTime);
    const currentTime = new Date();
    const oneHourFromNow = new Date(currentTime.getTime() + (60 * 60 * 1000)); // Add 1 hour in milliseconds
    return selectedTime >= oneHourFromNow;
  };
  
  const isValidEndDate = (endDate) => {
    const start = new Date(bookingDetails.book_in);
    const end = new Date(endDate);
    return end >= start;
  };

  // Get available service types with sub-skills based on worker skills
  const getAvailableServiceTypes = () => {
    if (!worker?.primary_skills && !worker?.additional_skills) return [];
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    
    // Create a structure with main skills and their sub-skills
    const skillStructure = {};
    
    allSkills.forEach(skill => {
      const mainSkill = skill.skill_name;
      if (!skillStructure[mainSkill]) {
        skillStructure[mainSkill] = {
          main: mainSkill,
          subSkills: []
        };
      }
      
      // Add sub-skills if they exist
      if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
        skill.sub_skills.forEach(subSkill => {
          if (!skillStructure[mainSkill].subSkills.includes(subSkill)) {
            skillStructure[mainSkill].subSkills.push(subSkill);
          }
        });
      }
    });
    
    return Object.values(skillStructure);
  };

  if (!isOpen) return null;

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>Planning to hire {worker.name}</h2>
        <div className="adminmodal-content">
          <div className="form-group">
            <label>Service Type</label>
            <select
              name="service_type"
              value={bookingDetails.service_type}
              onChange={handleChange}
              required
            >
              <option value="">Select a service</option>
              {getAvailableServiceTypes().map((skillGroup, index) => (
                <optgroup key={index} label={skillGroup.main}>
                  {skillGroup.subSkills.length > 0 ? (
                    skillGroup.subSkills.map((subSkill, subIndex) => (
                      <option key={`${index}-${subIndex}`} value={`${skillGroup.main} - ${subSkill}`}>
                        {subSkill}
                      </option>
                    ))
                  ) : (
                    <option value={skillGroup.main}>{skillGroup.main}</option>
                  )}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Work Type</label>
            <input
              type="text"
              name="work_type"
              value={bookingDetails.work_type}
              readOnly
              disabled
            />
          </div>
          <div className="form-group">
            <label>Book In (Date & Time)</label>
            <input
              type="datetime-local"
              name="book_in"
              value={bookingDetails.book_in}
              onChange={handleChange}
              min={minDate}
              required
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              Please select a time at least 1 hour from now
            </small>
          </div>
          <div className="form-group">
            <label>Book End (Date & Time)</label>
            <input
              type="datetime-local"
              name="book_end"
              value={bookingDetails.book_end}
              onChange={(e) => {
                if (isValidEndDate(e.target.value)) {
                  handleChange(e);
                }
              }}
              min={bookingDetails.book_in || minDate}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={bookingDetails.description}
              onChange={handleChange}
              placeholder="Please describe the work you need done..."
              required
            />
          </div>
          <div className="form-group">
            <label>Estimated Cost</label>
            <div>
              Hours: {calculateSalary().hours}<br />
              Total: ₱{calculateSalary().total}
            </div>
          </div>
        </div>
        <div className="adminmodal-buttons">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="submit-button" onClick={handleSubmit}>
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookModal;