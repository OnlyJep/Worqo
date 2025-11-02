import React from 'react';
import { message } from 'antd';
import '../../../sass/components/profilesettings/transactionmodal.scss';

const TransactionModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  // Get current user to determine if they're employer or worker
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isEmployer = currentUser.role_id === 2; // Assuming role_id 2 is employer
  const isWorker = currentUser.role_id === 1; // Assuming role_id 1 is worker

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours;
  };

  // Determine if worker is blue-collar based on booking service type
  const isBlueCollarWorker = () => {
    if (!booking?.service_type) return false;
    
    const serviceTypeLower = booking.service_type.toLowerCase();
    const blueCollarServiceTypes = [
      'plumbing', 'electrical', 'carpentry', 'welding', 'masonry', 'painting',
      'construction', 'maintenance', 'mechanical', 'automotive', 'gardening',
      'landscaping', 'housekeeping', 'cleaning', 'security', 'machine operation',
      'appliance repair', 'hvac', 'roofing', 'flooring', 'tiling', 'concrete work',
      'excavation', 'heavy machinery', 'forklift', 'crane', 'welding', 'fabrication',
      'pipe fitting', 'drain cleaning', 'leak repair', 'fixture installation',
      'system maintenance', 'equipment repair', 'preventive maintenance',
      'building maintenance', 'hvac maintenance', 'plumbing maintenance',
      'electrical maintenance', 'carpentry repairs', 'painting touch-ups',
      'safety inspections', 'janitorial', 'sanitization', 'deep cleaning',
      'window cleaning', 'carpet cleaning', 'laundry service', 'organization',
      'eco-friendly cleaning', 'plant care', 'lawn maintenance', 'tree trimming',
      'garden design', 'irrigation systems', 'pest control', 'fertilizing',
      'pruning', 'landscape installation', 'seasonal cleanup', 'building security',
      'event security', 'retail security', 'residential security', 'crowd control',
      'patrol services', 'access control', 'emergency response', 'surveillance',
      'safety protocols', 'tailor', 'dressmaker', 'barber', 'hairdresser',
      'cook', 'chef', 'baker', 'driver', 'delivery', 'transportation'
    ];
    
    return blueCollarServiceTypes.some(blueCollarService => 
      serviceTypeLower.includes(blueCollarService) || blueCollarService.includes(serviceTypeLower)
    );
  };

  // Calculate working days based on work type and collar type (including Sunday)
  const calculateWorkingDays = (startDate, endDate) => {
    let workingDaysCount = 0;
    
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    end.setDate(end.getDate() + 1);
    
    while (currentDate < end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Determine working days based on collar type (including Sunday)
      if (isBlueCollarWorker()) {
        // Blue-collar workers: work Monday-Sunday (7 days per week)
        // Include all days: Sunday (0), Monday-Saturday (1-6)
        if (dayOfWeek >= 0 && dayOfWeek <= 6) { // Sunday to Saturday (all days)
          workingDaysCount++;
        }
      } else {
        // White-collar/Pink-collar workers: work Monday-Friday and Sunday (6 days per week)
        // Monday-Friday (1-5) + Sunday (0)
        if (dayOfWeek === 0 || (dayOfWeek >= 1 && dayOfWeek <= 5)) { // Sunday and Monday to Friday
          workingDaysCount++;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDaysCount;
  };

  const calculateSalaryInfo = () => {
    const { book_in, book_end, daily_rate, hours_per_day, time_in, time_out, work_type } = booking;
    
    if (!book_in || !book_end || !daily_rate) {
      return {
        dailyRate: 0,
        hourlyRate: 0,
        totalHours: 0,
        workingDays: 0,
        hoursPerDay: 0,
        totalAmount: booking.total_amount || 0
      };
    }

    const startDate = new Date(book_in);
    const endDate = new Date(book_end);
    const workingDays = calculateWorkingDays(startDate, endDate);
    
    // Calculate hours per day - use hours_per_day if available, otherwise calculate from time_in/time_out
    let hoursPerDay = parseFloat(hours_per_day) || 0;
    if (!hoursPerDay && time_in && time_out) {
      // Calculate from time_in and time_out
      const [startHour, startMinute] = time_in.split(':').map(Number);
      const [endHour, endMinute] = time_out.split(':').map(Number);
      const startTime = startHour + startMinute / 60;
      const endTime = endHour + endMinute / 60;
      hoursPerDay = endTime - startTime;
      if (hoursPerDay < 0) hoursPerDay += 24; // Handle overnight shifts
    }
    if (!hoursPerDay) hoursPerDay = 8; // Default to 8 hours
    
    const totalHours = workingDays * hoursPerDay;
    const dailyRateValue = parseFloat(daily_rate);
    const hourlyRate = hoursPerDay > 0 ? dailyRateValue / hoursPerDay : 0;
    
    return {
      dailyRate: dailyRateValue,
      hourlyRate: hourlyRate,
      totalHours: totalHours,
      workingDays: workingDays,
      hoursPerDay: hoursPerDay,
      totalAmount: booking.total_amount || (dailyRateValue * workingDays)
    };
  };

  const duration = calculateDuration(booking.book_in, booking.book_end);
  const salaryInfo = calculateSalaryInfo();

  return (
    <div className="transaction-modal-overlay">
      <div className="transaction-modal">
        <div className="transaction-modal-header">
          <h2>Transaction Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="transaction-modal-content">
          <div className="transaction-section">
            <h3>Booking Information</h3>
            <div className="transaction-details">
              {/* Show Worker name if viewing as Employer */}
              {isEmployer && booking.worker && (
                <div className="detail-row">
                  <span className="label">Worker Name:</span>
                  <span className="value">
                    {booking.worker.profile 
                      ? `${booking.worker.profile.first_name || ''} ${booking.worker.profile.last_name || ''}`.trim()
                      : booking.worker.name || 'Worker'
                    }
                  </span>
                </div>
              )}
              
              {/* Show Employer name if viewing as Worker */}
              {isWorker && booking.employer && (
                <div className="detail-row">
                  <span className="label">Employer Name:</span>
                  <span className="value">
                    {booking.employer.profile 
                      ? `${booking.employer.profile.first_name || ''} ${booking.employer.profile.last_name || ''}`.trim()
                      : booking.employer.name || 'Employer'
                    }
                  </span>
                </div>
              )}
              
              <div className="detail-row">
                <span className="label">Service Type:</span>
                <span className="value">{booking.service_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Sub Skills:</span>
                <span className="value">
                  {booking.sub_skill && booking.sub_skill.trim() !== '' 
                    ? booking.sub_skill 
                    : 'Not specified'
                  }
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Work Type:</span>
                <span className="value">
                  {booking.work_type ? 
                    booking.work_type.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join('-') 
                    : 'Not specified'
                  }
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`value status-${booking.status}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Book In:</span>
                <span className="value">{formatDate(booking.book_in)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Book End:</span>
                <span className="value">{formatDate(booking.book_end)}</span>
              </div>
              {booking.hours_per_day && (
                <div className="detail-row">
                  <span className="label">Hours per Day:</span>
                  <span className="value">{booking.hours_per_day} hours</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">Description:</span>
                <span className="value">{booking.description}</span>
              </div>
            </div>
          </div>

          <div className="transaction-section">
            <h3>Salary Calculation</h3>
            <div className="salary-calculation-display">
              <div className="salary-row">
                <span className="salary-label">Hourly Rate:</span>
                <span className="salary-value">₱{parseFloat(salaryInfo.hourlyRate).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/hour</span>
              </div>
              <div className="salary-row">
                <span className="salary-label">Total Hours:</span>
                <span className="salary-value">{salaryInfo.totalHours} hours</span>
              </div>
              <div className="salary-row">
                <span className="salary-label">Overall Salary:</span>
                <span className="salary-value">₱{salaryInfo.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {booking.worker_notes && (
            <div className="transaction-section">
              <h3>Worker Notes</h3>
              <div className="notes-content">
                <p>{booking.worker_notes}</p>
              </div>
            </div>
          )}

          {booking.employer_notes && (
            <div className="transaction-section">
              <h3>Employer Notes</h3>
              <div className="notes-content">
                <p>{booking.employer_notes}</p>
              </div>
            </div>
          )}

          {booking.rating && (
            <div className="transaction-section">
              <h3>Review & Rating</h3>
              <div className="transaction-details">
                <div className="detail-row">
                  <span className="label">Rating:</span>
                  <span className="value">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`star ${i < booking.rating ? 'filled' : ''}`}>★</span>
                    ))}
                    ({booking.rating}/5)
                  </span>
                </div>
                {booking.review && (
                  <div className="detail-row">
                    <span className="label">Review:</span>
                    <span className="value">{booking.review}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="transaction-modal-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;

