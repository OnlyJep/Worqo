import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { Message } from 'rsuite';
import { IoWarningOutline } from "react-icons/io5";
import axios from 'axios';
import CustomDropdown from '../common/CustomDropdown';
import './../../../sass/components/BookModal.scss';

const BookModal = ({ worker, isOpen, onClose, onSubmit, serviceType }) => {
  const [bookingDetails, setBookingDetails] = useState({
    service_type: serviceType || '',
    sub_skill: '',
    work_type: '', // Employer will choose work type
    book_in: '',
    book_end: '',
    hours_per_day: '', // Hours per day
    description: '',
    daily_rate: '', // Rate per day
  });

  const [availabilityStatus, setAvailabilityStatus] = useState({
    isAvailable: true,
    conflictMessage: '',
    conflictingJobs: []
  });

  useEffect(() => {
    if (!isOpen) {
      setBookingDetails({
        service_type: serviceType || '',
        sub_skill: '',
        work_type: '', // Employer will choose work type
        book_in: '',
        book_end: '',
        hours_per_day: '', // Hours per day
        description: '',
        daily_rate: '',
      });
      setAvailabilityStatus({
        isAvailable: true,
        conflictMessage: '',
        conflictingJobs: []
      });
    }
  }, [isOpen, serviceType]);

  // Check worker availability when booking dates change
  useEffect(() => {
    if (bookingDetails.book_in && bookingDetails.book_end && worker?.id) {
      checkWorkerAvailability();
    }
  }, [bookingDetails.book_in, bookingDetails.book_end, worker?.id]);

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
    
    // Calculate working days based on work type
    let workingDays = 0;
    switch (bookingDetails.work_type) {
      case 'per_day':
        workingDays = calculateFullTimeWorkingDays(start, end);
        break;
      case 'per_job':
        workingDays = calculateFullTimeWorkingDays(start, end); // Same as per_day but different hours
        break;
      default:
        workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return { hours: diffHours, days: workingDays };
  };


  const calculateSalary = () => {
    const { book_in, book_end, daily_rate, work_type, hours_per_day } = bookingDetails;
    
    if (!book_in || !book_end || !daily_rate || !hours_per_day) {
      return { 
        dailyRate: 0,
        totalAmount: 0, 
        workingDays: 0, 
        totalHours: 0,
        hourlyRate: 0,
        explanation: 'Please fill in all required fields'
      };
    }

    const startDate = new Date(book_in);
    const endDate = new Date(book_end);
    
    // Calculate working days based on work type
    let workingDays = 0;
    const hoursPerDay = parseFloat(hours_per_day) || 0;
    let totalHours = 0;
    let explanation = '';

    switch (work_type) {
      case 'per_day':
        // Per Day: Based on collar type - Blue-collar (Mon-Sun) or White/Pink-collar (Mon-Fri + Sun)
        workingDays = calculateFullTimeWorkingDays(startDate, endDate);
        totalHours = workingDays * hoursPerDay;
        const perDayDays = isBlueCollarWorker() ? 'Monday-Sunday' : 'Monday-Friday and Sunday';
        explanation = `Per Day: ${hoursPerDay} hours/day, ${perDayDays}. Total: ${workingDays} working days`;
        break;
        
      case 'per_job':
        // Per Job: Based on collar type - Blue-collar (Mon-Sun) or White/Pink-collar (Mon-Fri + Sun)
        workingDays = calculatePreferredWorkingDays(startDate, endDate);
        totalHours = workingDays * hoursPerDay;
        const perJobDays = isBlueCollarWorker() ? 'Monday-Sunday' : 'Monday-Friday and Sunday';
        explanation = `Per Job: ${hoursPerDay} hours/day, ${perJobDays}. Total: ${workingDays} working days`;
        break;
        
      default:
        workingDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        totalHours = workingDays * hoursPerDay;
        explanation = `Standard calculation: ${workingDays} working days`;
    }

    const dailyRate = parseFloat(daily_rate);
    const totalAmount = dailyRate * workingDays;
    const hourlyRate = hoursPerDay > 0 ? dailyRate / hoursPerDay : 0;
    
    return {
      dailyRate: dailyRate,
      totalAmount: totalAmount,
      workingDays: workingDays,
      totalHours: totalHours,
      hoursPerDay: hoursPerDay,
      hourlyRate: hourlyRate.toFixed(2),
      explanation: explanation
    };
  };

  // Calculate working days based on work type and collar type (including Sunday)
  const calculateWorkingDays = (startDate, endDate, workType) => {
    let workingDaysCount = 0;
    
    // Reset time to midnight to avoid time comparison issues
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    // Add 1 day to end date to include the end date itself
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

  // Calculate full-time working days (Monday to Friday)
  const calculateFullTimeWorkingDays = (startDate, endDate) => {
    return calculateWorkingDays(startDate, endDate, 'full-time');
  };

  // Calculate preferred working days for part-time workers
  const calculatePreferredWorkingDays = (startDate, endDate) => {
    return calculateWorkingDays(startDate, endDate, 'part-time');
  };

  // Helper function to get day name from day number
  const getDayName = (dayNumber) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber];
  };

  // Determine if worker is blue-collar based on their skills
  const isBlueCollarWorker = () => {
    if (!worker?.primary_skills && !worker?.additional_skills) return false;
    
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    
    // Blue-collar skill names (manual labor, construction, maintenance, etc.)
    const blueCollarSkills = [
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
    
    return allSkills.some(skill => {
      const skillName = skill.skill_name?.toLowerCase() || '';
      return blueCollarSkills.some(blueCollarSkill => 
        skillName.includes(blueCollarSkill) || blueCollarSkill.includes(skillName)
      );
    });
  };

  // Check worker availability for the selected dates
  const checkWorkerAvailability = async () => {
    try {
      const { book_in, book_end } = bookingDetails;
      
      if (!book_in || !book_end || !worker?.id) {
        setAvailabilityStatus({
          isAvailable: true,
          conflictMessage: '',
          conflictingJobs: []
        });
        return;
      }

      // Get worker's accepted job applications (hired jobs)
      const response = await axios.get(`/api/job-applications/worker/${worker.id}?status=accepted`);
      const acceptedJobs = response.data || [];

      // Also get all job posts with work schedules to check for conflicts
      const jobPostsResponse = await axios.get(`/api/jobposts?worker_id=${worker.id}&include_work_schedule=true`);
      const jobPosts = jobPostsResponse.data?.job_posts?.data || [];

      // Check for date conflicts
      const requestedStart = new Date(book_in);
      const requestedEnd = new Date(book_end);
      const conflictingJobs = [];

      // Check conflicts with accepted job applications
      for (const job of acceptedJobs) {
        if (job.job_post?.work_start && job.job_post?.work_end) {
          const jobStart = new Date(job.job_post.work_start);
          const jobEnd = new Date(job.job_post.work_end);

          // Check if there's any overlap between the requested dates and job dates
          if (
            (requestedStart >= jobStart && requestedStart <= jobEnd) ||
            (requestedEnd >= jobStart && requestedEnd <= jobEnd) ||
            (requestedStart <= jobStart && requestedEnd >= jobEnd)
          ) {
            conflictingJobs.push({
              jobTitle: job.job_post.job_title,
              workStart: job.job_post.work_start,
              workEnd: job.job_post.work_end,
              employer: job.job_post.profile?.first_name + ' ' + job.job_post.profile?.last_name,
              type: 'hired'
            });
          }
        }
      }

      // Check conflicts with job posts that have fixed work schedules
      for (const jobPost of jobPosts) {
        if (jobPost.work_start && jobPost.work_end) {
          const jobStart = new Date(jobPost.work_start);
          const jobEnd = new Date(jobPost.work_end);

          // Check if there's any overlap between the requested dates and job post work schedule
          if (
            (requestedStart >= jobStart && requestedStart <= jobEnd) ||
            (requestedEnd >= jobStart && requestedEnd <= jobEnd) ||
            (requestedStart <= jobStart && requestedEnd >= jobEnd)
          ) {
            conflictingJobs.push({
              jobTitle: jobPost.job_title,
              workStart: jobPost.work_start,
              workEnd: jobPost.work_end,
              employer: jobPost.profile?.first_name + ' ' + jobPost.profile?.last_name,
              type: 'scheduled'
            });
          }
        }
      }

      if (conflictingJobs.length > 0) {
        const hiredCount = conflictingJobs.filter(job => job.type === 'hired').length;
        const scheduledCount = conflictingJobs.filter(job => job.type === 'scheduled').length;
        
        let conflictMessage = 'Worker is not available during the selected period. ';
        if (hiredCount > 0 && scheduledCount > 0) {
          conflictMessage += `They are already hired for ${hiredCount} job(s) and have ${scheduledCount} scheduled job(s) during this time.`;
        } else if (hiredCount > 0) {
          conflictMessage += `They are already hired for ${hiredCount} job(s) during this time.`;
        } else {
          conflictMessage += `They have ${scheduledCount} scheduled job(s) during this time.`;
        }

        setAvailabilityStatus({
          isAvailable: false,
          conflictMessage: conflictMessage,
          conflictingJobs: conflictingJobs
        });
      } else {
        setAvailabilityStatus({
          isAvailable: true,
          conflictMessage: '',
          conflictingJobs: []
        });
      }
    } catch (error) {
      console.error('Error checking worker availability:', error);
      // On error, assume worker is available to avoid blocking legitimate bookings
      setAvailabilityStatus({
        isAvailable: true,
        conflictMessage: '',
        conflictingJobs: []
      });
    }
  };

  const getSalaryInfo = () => {
    return {
      label: 'Daily Rate',
      placeholder: 'Enter daily rate',
      description: ''
    };
  };

  const handleSubmit = () => {
    // Validate required fields before submitting
    if (!bookingDetails.service_type || !bookingDetails.work_type || !bookingDetails.book_in || !bookingDetails.book_end || !bookingDetails.hours_per_day || !bookingDetails.description || !bookingDetails.daily_rate) {
      message.error("Please fill in all required fields");
      return;
    }

    // Validate hours per day
    if (!bookingDetails.hours_per_day || parseFloat(bookingDetails.hours_per_day) <= 0) {
      message.error("Please enter valid hours per day");
      return;
    }

    // Validate daily rate amount
    if (!bookingDetails.daily_rate || parseFloat(bookingDetails.daily_rate) <= 0) {
      message.error("Please enter a valid daily rate amount");
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

    // Check worker availability
    if (!availabilityStatus.isAvailable) {
      message.error(availabilityStatus.conflictMessage);
      return;
    }

    // Prepare validated details for submission
    const salaryCalculation = calculateSalary();
    console.log('Salary calculation result:', salaryCalculation);
    
    // Validate that calculation is valid
    if (salaryCalculation.workingDays === 0 || salaryCalculation.totalHours === 0) {
      message.error("Please ensure all booking details are filled correctly");
      return;
    }
    
    // Validate that sub_skill is included if service_type is selected
    if (bookingDetails.service_type && !bookingDetails.sub_skill) {
      console.warn('Sub-skill is empty for service type:', bookingDetails.service_type);
    }
    
    const validatedDetails = {
      ...bookingDetails,
      daily_rate: parseFloat(bookingDetails.daily_rate),
      total_amount: salaryCalculation.totalAmount, // Match database field name
    };

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

  // Get ALL sub-skills from ALL service types
  const getAvailableSubSkills = () => {
    if (!bookingDetails.service_type) return [];
    
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    
    const options = [];
    const uniqueSubSkills = new Set(); // To avoid duplicates
    
    allSkills.forEach(skill => {
      // Get sub-skills from ALL skills, not just the selected service type
      if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
        skill.sub_skills.forEach(subSkill => {
          // Only add if not already in the set (avoid duplicates)
          if (!uniqueSubSkills.has(subSkill)) {
            uniqueSubSkills.add(subSkill);
            options.push({
              value: subSkill,
              label: subSkill
            });
          }
        });
      }
    });
    
    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal-container">
        <h2 className="booking-modal-title">Planning to hire {worker.name}</h2>
        <div className="booking-modal-form-content">
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="service_type">Service Type</label>
            <CustomDropdown
              id="service_type"
              options={getAvailableServiceTypes()}
              value={bookingDetails.service_type}
              onChange={(value) => setBookingDetails(prev => ({ ...prev, service_type: value }))}
              placeholder="Select a service"
              required
            />
          </div>
          
          {bookingDetails.service_type && (
            <div className="booking-form-field">
              <label className="booking-form-label" htmlFor="sub_skill">Sub Skills</label>
              {getAvailableSubSkills().length > 0 ? (
                <CustomDropdown
                  id="sub_skill"
                  options={getAvailableSubSkills()}
                  value={bookingDetails.sub_skill}
                onChange={(value) => {
                  setBookingDetails(prev => ({ ...prev, sub_skill: value }));
                }}
                  placeholder="Select a sub-skill"
                />
              ) : (
                <input
                  type="text"
                  id="sub_skill"
                  name="sub_skill"
                  value={bookingDetails.sub_skill}
                  onChange={handleChange}
                  className="booking-form-input"
                  placeholder="Enter sub-skill (optional)"
                />
              )}
            </div>
          )}
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="work_type">Work Type</label>
            <CustomDropdown
              id="work_type"
              options={[
                { value: 'per_day', label: 'Per Day' },
                { value: 'per_job', label: 'Per Job' }
              ]}
              value={bookingDetails.work_type}
              onChange={(value) => setBookingDetails(prev => ({ ...prev, work_type: value }))}
              placeholder="Select work-type"
              required
            />
            <small>
              Choose the employment type for this booking
            </small>
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
              min={minDate}
              required
            />
            <small>
              Please select a time at least 1 hour from now
            </small>
          </div>
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="book_end">Book End </label>
            <input
              type="datetime-local"
              id="book_end"
              name="book_end"
              value={bookingDetails.book_end}
              onChange={(e) => {
                if (isValidEndDate(e.target.value)) {
                  handleChange(e);
                }
              }}
              className="booking-form-input"
              min={bookingDetails.book_in || minDate}
            />
          </div>

          {/* Availability Warning */}
          {!availabilityStatus.isAvailable && (
            <div className="availability-warning">
              <div className="warning-header">
                <IoWarningOutline style={{ color: '#ffc107', marginRight: '18px', marginTop: '8px', fontSize: '30px' }} />
                <div className="rs-message-body">
                  <div className="warning-message">
                    {availabilityStatus.conflictMessage}
                  </div>
                  {availabilityStatus.conflictingJobs.length > 0 && (
                    <div className="conflicting-jobs">
                      <h5>Conflicting Jobs:</h5>
                      <ul>
                        {availabilityStatus.conflictingJobs.map((job, index) => (
                          <li key={index}>
                            <strong>{job.jobTitle}</strong> - {job.type === 'hired' ? 'Hired' : 'Scheduled'}
                            <br />
                            <small>
                              {new Date(job.workStart).toLocaleDateString()} - {new Date(job.workEnd).toLocaleDateString()}
                              {job.employer && ` (Employer: ${job.employer})`}
                            </small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
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
            <label className="booking-form-label" htmlFor="hours_per_day">Hours per day</label>
            <input
              type="number"
              id="hours_per_day"
              name="hours_per_day"
              value={bookingDetails.hours_per_day}
              onChange={handleChange}
              className="booking-form-input"
              placeholder="Enter hours per day (e.g., 8)"
              min="1"
              max="24"
              step="0.5"
              required
            />
            <small>
              Specify the number of working hours per day
            </small>
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="daily_rate">{getSalaryInfo().label}</label>
            <input
              type="number"
              id="daily_rate"
              name="daily_rate"
              value={bookingDetails.daily_rate}
              onChange={handleChange}
              className="booking-form-input"
              placeholder={getSalaryInfo().placeholder}
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Salary Calculation Display */}
          {bookingDetails.daily_rate && bookingDetails.hours_per_day && bookingDetails.book_in && bookingDetails.book_end && bookingDetails.work_type && (
            <div className="salary-calculation-section">
              <h3 className="salary-calculation-title">Salary Calculation</h3>
              <div className="salary-calculation-details">
                {(() => {
                  const salaryInfo = calculateSalary();
                  return (
                    <>
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
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
        <div className="booking-modal-actions">
          <button className="booking-btn booking-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="booking-btn booking-btn-submit"
            onClick={handleSubmit}
            disabled={!bookingDetails.service_type || !bookingDetails.work_type || !bookingDetails.book_in || !bookingDetails.book_end || !bookingDetails.hours_per_day || !bookingDetails.description || !bookingDetails.daily_rate || !isValidEndDate(bookingDetails.book_end) || !validateBookInTime(bookingDetails.book_in) || !availabilityStatus.isAvailable}
          >
            Submit Hiring Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookModal;