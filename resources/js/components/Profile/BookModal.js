import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import './../../../sass/components/BookModal.scss';

const BookModal = ({ worker, isOpen, onClose, onSubmit }) => {
  const [bookingDetails, setBookingDetails] = useState({
    service_type: '',
    work_type: worker?.work_type || 'part-time',
    book_in: '',
    book_end: '',
    time_in: '',
    time_out: '',
    description: '',
    daily_rate: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setBookingDetails({
        service_type: '',
        work_type: worker?.work_type || 'part-time',
        book_in: '',
        book_end: '',
        time_in: '',
        time_out: '',
        description: '',
        daily_rate: '',
      });
    }
  }, [isOpen, worker]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'book_in' || name === 'book_end') {
      setBookingDetails((prev) => {
        const updated = { ...prev, [name]: value };
        
        if (updated.book_in && updated.book_end) {
          const startTime = new Date(updated.book_in);
          
          const startHour = startTime.getHours();
          const startMinute = startTime.getMinutes();
          
          // Time In: Start time + 1 hour
          let timeInHour = startHour + 1;
          let timeInMinute = startMinute;
          
          if (timeInHour >= 24) {
            timeInHour = timeInHour - 24;
          }
          
          let hoursPerDay = 8; // Default
          switch (updated.work_type) {
            case 'full-time':
              hoursPerDay = 8;
              break;
            case 'part-time':
              hoursPerDay = 6;
              break;
            case 'one-time':
              hoursPerDay = 8;
              break;
          }
          
          // Time Out: Time In + working hours
          let timeOutHour = timeInHour + hoursPerDay;
          let timeOutMinute = timeInMinute;
          
          if (timeOutHour >= 24) {
            timeOutHour = timeOutHour - 24;
          }
          
          const timeInStr = `${timeInHour.toString().padStart(2, '0')}:${timeInMinute.toString().padStart(2, '0')}`;
          const timeOutStr = `${timeOutHour.toString().padStart(2, '0')}:${timeOutMinute.toString().padStart(2, '0')}`;
          
          updated.time_in = timeInStr;
          updated.time_out = timeOutStr;
        }
        
        return updated;
      });
    } else {
      setBookingDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateActualHours = () => {
    const { time_in, time_out } = bookingDetails;
    if (!time_in || !time_out) return 0;
    const [startHour, startMinute] = time_in.split(':').map(Number);
    const [endHour, endMinute] = time_out.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    let diffMinutes = endTime - startTime;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }
    return diffMinutes / 60;
  };

  const isBlueCollarWorker = () => {
    if (!worker?.primary_skills && !worker?.additional_skills) return false;
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    const blueCollarSkills = [
      'construction', 'carpenter', 'electrician', 'plumber', 'mechanic', 'welder',
      'painter', 'mason', 'roofer', 'laborer', 'maintenance', 'repair',
      'installation', 'assembly', 'manufacturing', 'factory', 'warehouse',
      'delivery', 'driver', 'security', 'janitor', 'cleaner', 'gardener',
      'landscaper', 'farming', 'agriculture', 'mining', 'oil', 'gas',
      'trucking', 'logistics', 'shipping', 'loading', 'unloading'
    ];
    return allSkills.some(skill => {
      const skillName = skill.skill_name?.toLowerCase() || '';
      return blueCollarSkills.some(blueCollarSkill => 
        skillName.includes(blueCollarSkill) || blueCollarSkill.includes(skillName)
      );
    });
  };

  const calculateWorkingDays = (startDate, endDate, workType) => {
    let workingDaysCount = 0;
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    
    while (currentDate < end) {
      const dayOfWeek = currentDate.getDay();
      if (workType === 'one-time') {
        workingDaysCount++;
      } else if (isBlueCollarWorker()) {
        if (dayOfWeek >= 1 && dayOfWeek <= 6) { // Monday to Saturday
          workingDaysCount++;
        }
      } else {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
          workingDaysCount++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return workingDaysCount;
  };

  const calculateSalary = () => {
    const { book_in, book_end, work_type, daily_rate } = bookingDetails;
    if (!book_in || !book_end || !daily_rate) return { total: 0, hours: 0, explanation: '' };
    
    const startDate = new Date(book_in);
    const endDate = new Date(book_end);
    const dailyRate = parseFloat(daily_rate) || 0;
    
    let workingDays = 0;
    let hoursPerDay = 0;
    let totalHours = 0;
    let explanation = '';
    
    const actualHoursPerDay = calculateActualHours();
    
    switch (work_type) {
      case 'full-time':
        workingDays = calculateWorkingDays(startDate, endDate, 'full-time');
        hoursPerDay = actualHoursPerDay > 0 ? actualHoursPerDay : 8;
        totalHours = workingDays * hoursPerDay;
        const fullTimeDays = isBlueCollarWorker() ? 'Monday-Saturday' : 'Monday-Friday';
        explanation = `Full-time: ${hoursPerDay} hours/day, ${fullTimeDays}. Total: ${workingDays} working days`;
        break;
        
      case 'part-time':
        workingDays = calculateWorkingDays(startDate, endDate, 'part-time');
        hoursPerDay = actualHoursPerDay > 0 ? actualHoursPerDay : 6;
        totalHours = workingDays * hoursPerDay;
        const partTimeDays = isBlueCollarWorker() ? 'Monday-Saturday' : 'Monday-Friday';
        const weeklyHours = isBlueCollarWorker() ? '36 hours/week' : '30 hours/week';
        explanation = `Part-time: ${hoursPerDay} hours/day, ${partTimeDays} (${weeklyHours}). Total: ${workingDays} working days`;
        break;
        
      case 'one-time':
        workingDays = 1;
        hoursPerDay = actualHoursPerDay > 0 ? actualHoursPerDay : 8;
        totalHours = hoursPerDay;
        explanation = `One-time project: ${hoursPerDay} hours (adjustable by employer)`;
        break;
        
      default:
        workingDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        hoursPerDay = actualHoursPerDay > 0 ? actualHoursPerDay : 8;
        totalHours = workingDays * hoursPerDay;
        explanation = `Standard calculation: ${workingDays} working days`;
    }
    
    const totalSalary = dailyRate * workingDays;
    
    return {
      total: totalSalary.toFixed(2),
      hours: totalHours,
      workingDays: workingDays,
      hoursPerDay: hoursPerDay,
      explanation: explanation
    };
  };

  const getSalaryInfo = () => {
    const workType = bookingDetails.work_type;
    const isBlueCollar = isBlueCollarWorker();
    
    switch (workType) {
      case 'part-time':
        const partTimeDays = isBlueCollar ? 'Monday-Saturday' : 'Monday-Friday';
        const partTimeWeeklyHours = isBlueCollar ? '36 hours/week' : '30 hours/week';
        return {
          label: 'Daily Rate (Part-time)',
          placeholder: 'Enter daily rate amount',
          description: `6 hours per day, ${partTimeDays} (${partTimeWeeklyHours})`
        };
      case 'full-time':
        const fullTimeDays = isBlueCollar ? 'Monday-Saturday' : 'Monday-Friday';
        const fullTimeWeeklyHours = isBlueCollar ? '48 hours/week' : '40 hours/week';
        return {
          label: 'Daily Rate (Full-time)',
          placeholder: 'Enter daily rate amount',
          description: `8 hours per day, ${fullTimeDays} (${fullTimeWeeklyHours})`
        };
      case 'one-time':
        return {
          label: 'Daily Rate (One-time)',
          placeholder: 'Enter daily rate amount',
          description: 'Hours depend on employer needs'
        };
      default:
        return {
          label: 'Daily Rate',
          placeholder: 'Enter daily rate amount',
          description: 'Standard daily rate'
        };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!bookingDetails.service_type || !bookingDetails.book_in || !bookingDetails.book_end || !bookingDetails.daily_rate) {
      message.error('Please fill in all required fields');
      return;
    }

    const salaryInfo = calculateSalary();
    if (salaryInfo.total <= 0) {
      message.error('Please enter a valid daily rate');
      return;
    }

    onSubmit(bookingDetails);
  };

  if (!isOpen) return null;

  const salaryInfo = getSalaryInfo();
  const salaryCalculation = calculateSalary();

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <div className="booking-modal-header">
          <h2>Book {worker?.name}</h2>
          <button className="booking-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="booking-form-field">
            <label className="booking-form-label">Service Type</label>
            <select
              name="service_type"
              value={bookingDetails.service_type}
              onChange={handleChange}
              className="booking-form-input"
              required
            >
              <option value="">Select Service Type</option>
              <option value="consultation">Consultation</option>
              <option value="project">Project</option>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
              <option value="installation">Installation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="booking-form-field">
            <label className="booking-form-label">Work Type</label>
            <select
              name="work_type"
              value={bookingDetails.work_type}
              onChange={handleChange}
              className="booking-form-input"
              required
            >
              <option value="part-time">Part-time</option>
              <option value="full-time">Full-time</option>
              <option value="one-time">One-time</option>
            </select>
          </div>

          <div className="booking-form-field">
            <label className="booking-form-label">Book In</label>
            <input
              type="datetime-local"
              name="book_in"
              value={bookingDetails.book_in}
              onChange={handleChange}
              className="booking-form-input"
              required
              min={new Date().toISOString().slice(0, 16)}
            />
            <small>
              Please select a time at least 1 hour from now
            </small>
          </div>

          <div className="booking-form-field">
            <label className="booking-form-label">Book End</label>
            <input
              type="datetime-local"
              name="book_end"
              value={bookingDetails.book_end}
              onChange={handleChange}
              className="booking-form-input"
              required
              min={bookingDetails.book_in || new Date().toISOString().slice(0, 16)}
            />
            <small>
              Select when the work should end
            </small>
          </div>

          {bookingDetails.book_in && bookingDetails.book_end && (
            <>
              <div className="booking-form-field">
                <label className="booking-form-label">Time In</label>
                <input
                  type="time"
                  name="time_in"
                  value={bookingDetails.time_in}
                  onChange={handleChange}
                  className="booking-form-input"
                  placeholder="Select start time"
                />
                <small>
                  Auto-populated: Book In time + 1 hour (or set custom time)
                </small>
              </div>
              
              <div className="booking-form-field">
                <label className="booking-form-label">Time Out</label>
                <input
                  type="time"
                  name="time_out"
                  value={bookingDetails.time_out}
                  onChange={handleChange}
                  className="booking-form-input"
                  placeholder="Select end time"
                />
                <small>
                  Auto-populated: Time In + working hours (or set custom time)
                </small>
              </div>
            </>
          )}

          <div className="booking-form-field">
            <label className="booking-form-label">{salaryInfo.label}</label>
            <input
              type="number"
              name="daily_rate"
              value={bookingDetails.daily_rate}
              onChange={handleChange}
              className="booking-form-input"
              placeholder={salaryInfo.placeholder}
              min="0"
              step="0.01"
              required
            />
            <small>
              {salaryInfo.description}
            </small>
          </div>

          <div className="booking-form-field">
            <label className="booking-form-label">Description</label>
            <textarea
              name="description"
              value={bookingDetails.description}
              onChange={handleChange}
              className="booking-form-input"
              rows={4}
              placeholder="Describe the work needed..."
            />
          </div>

          {/* Salary Calculation Preview */}
          {bookingDetails.book_in && bookingDetails.book_end && bookingDetails.daily_rate && (
            <div className="salary-calculation-preview">
              <h4>Salary Calculation Preview</h4>
              <div className="calculation-row">
                <span>Daily Rate:</span>
                <span>₱{bookingDetails.daily_rate}</span>
              </div>
              <div className="calculation-row">
                <span>Working Days:</span>
                <span>{salaryCalculation.workingDays} days</span>
              </div>
              <div className="calculation-row">
                <span>Hours per Day:</span>
                <span>{salaryCalculation.hoursPerDay} hours</span>
              </div>
              <div className="calculation-row">
                <span>Total Hours:</span>
                <span>{salaryCalculation.hours} hours</span>
              </div>
              <div className="calculation-row total-row">
                <span>Total Salary:</span>
                <span>₱{salaryCalculation.total}</span>
              </div>
              <div>
                <small>{salaryCalculation.explanation}</small>
              </div>
            </div>
          )}

          <div className="booking-form-actions">
            <button type="button" className="booking-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="booking-submit-btn">
              Book Worker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookModal;