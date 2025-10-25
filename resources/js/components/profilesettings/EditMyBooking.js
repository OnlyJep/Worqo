import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { Message } from 'rsuite';
import { IoWarningOutline } from "react-icons/io5";
import axios from 'axios';
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
  const [availabilityStatus, setAvailabilityStatus] = useState({
    isAvailable: true,
    conflictMessage: '',
    conflictingJobs: []
  });

  useEffect(() => {
    if (isOpen && booking) {
      // Debug logging for booking data
      console.log('=== EDIT BOOKING INITIALIZATION DEBUG ===');
      console.log('Booking data:', booking);
      console.log('Worker data:', booking.worker);
      console.log('Worker profile:', booking.worker?.profile);
      console.log('Worker primary skills:', booking.worker?.primary_skills);
      console.log('Worker additional skills:', booking.worker?.additional_skills);
      console.log('Worker skills structure:', {
        hasPrimarySkills: !!booking.worker?.primary_skills,
        hasAdditionalSkills: !!booking.worker?.additional_skills,
        primarySkillsLength: booking.worker?.primary_skills?.length || 0,
        additionalSkillsLength: booking.worker?.additional_skills?.length || 0
      });
      
      // Check for different possible skill data structures
      console.log('=== CHECKING ALL POSSIBLE SKILL LOCATIONS ===');
      console.log('booking.worker.primary_skills:', booking.worker?.primary_skills);
      console.log('booking.worker.additional_skills:', booking.worker?.additional_skills);
      console.log('booking.worker.skills:', booking.worker?.skills);
      console.log('booking.worker.skills_id:', booking.worker?.skills_id);
      console.log('booking.worker.skills_id?.primary_skills:', booking.worker?.skills_id?.primary_skills);
      console.log('booking.worker.skills_id?.additional_skills:', booking.worker?.skills_id?.additional_skills);
      
      // Initialize form with booking data
      const initialDetails = {
        service_type: booking.service_type || '',
        sub_skill: booking.sub_skill || '',
        work_type: booking.work_type || '',
        book_in: booking.book_in ? new Date(booking.book_in).toISOString().slice(0, 16) : '',
        book_end: booking.book_end ? new Date(booking.book_end).toISOString().slice(0, 16) : '',
        time_in: booking.time_in || '',
        time_out: booking.time_out || '',
        description: booking.description || '',
        daily_rate: booking.daily_rate || ''
      };
      
      console.log('Setting booking details:', initialDetails);
      setBookingDetails(initialDetails);

      // Set worker data for dropdowns - check multiple possible skill locations
      const workerData = {
        id: booking.worker_id,
        name: booking.worker?.profile ? `${booking.worker.profile.first_name} ${booking.worker.profile.last_name}` : 'Worker',
        work_type: booking.work_type,
        primary_skills: booking.worker?.primary_skills || 
                       booking.worker?.primary_skill || 
                       booking.worker?.skills_id?.primary_skills || 
                       booking.worker?.skills?.primary_skills || 
                       [],
        additional_skills: booking.worker?.additional_skills || 
                          booking.worker?.additional_skill || 
                          booking.worker?.skills_id?.additional_skills || 
                          booking.worker?.skills?.additional_skills || 
                          []
      };
      
      console.log('Setting worker data:', workerData);
      setWorker(workerData);

      console.log('Worker state set:', {
        id: booking.worker_id,
        name: booking.worker?.profile ? `${booking.worker.profile.first_name} ${booking.worker.profile.last_name}` : 'Worker',
        work_type: booking.work_type,
        primary_skills: booking.worker?.primary_skills || [],
        additional_skills: booking.worker?.additional_skills || []
      });

      setAvailabilityStatus({
        isAvailable: true,
        conflictMessage: '',
        conflictingJobs: []
      });
    }
  }, [isOpen, booking]);

  // Ensure service type is properly set when worker data is available
  useEffect(() => {
    if (worker) {
      console.log('=== WORKER DATA AVAILABLE - CHECKING SERVICE TYPES ===');
      console.log('Worker:', worker);
      console.log('Available service types:', getAvailableServiceTypes());
      
      if (bookingDetails.service_type && getAvailableServiceTypes().length > 0) {
        console.log('=== SERVICE TYPE VALIDATION ===');
        console.log('Current service type:', bookingDetails.service_type);
        console.log('Available service types:', getAvailableServiceTypes());
        
        const availableTypes = getAvailableServiceTypes();
        const isServiceTypeValid = availableTypes.some(option => option.value === bookingDetails.service_type);
        
        if (!isServiceTypeValid) {
          console.log('Service type not found in available options, resetting...');
          setBookingDetails(prev => ({ ...prev, service_type: '', sub_skill: '' }));
        }
      }
    }
  }, [worker, bookingDetails.service_type]);

  // Check worker availability when booking dates change
  useEffect(() => {
    if (bookingDetails.book_in && bookingDetails.book_end && worker?.id) {
      checkWorkerAvailability();
    }
  }, [bookingDetails.book_in, bookingDetails.book_end, worker?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-populate time_in and time_out when book_in or book_end changes
    if (name === 'book_in' || name === 'book_end') {
      setBookingDetails((prev) => {
        const updated = { ...prev, [name]: value };
        
        // Extract time from book_in and book_end
        if (updated.book_in && updated.book_end) {
          const startTime = new Date(updated.book_in);
          const endTime = new Date(updated.book_end);
          
          // Get start time (from book_in) and add 1 hour for time_in
          const startHour = startTime.getHours();
          const startMinute = startTime.getMinutes();
          
          // Time In: Start time + 1 hour
          let timeInHour = startHour + 1;
          let timeInMinute = startMinute;
          
          // Handle hour overflow for time_in (if > 23)
          if (timeInHour >= 24) {
            timeInHour = timeInHour - 24;
          }
          
          // Set default hours per day based on work type
          let hoursPerDay = 8; // Default
          switch (updated.work_type) {
            case 'full-time':
              hoursPerDay = 8; // 8 hours per day (40 hours/week)
              break;
            case 'part-time':
              hoursPerDay = 6; // 6 hours per day (30 hours/week)
              break;
            case 'one-time':
              hoursPerDay = 8; // 8 hours for one-time jobs
              break;
          }
          
          // Time Out: Time In + working hours
          let timeOutHour = timeInHour + hoursPerDay;
          let timeOutMinute = timeInMinute;
          
          // Handle hour overflow for time_out (if > 23)
          if (timeOutHour >= 24) {
            timeOutHour = timeOutHour - 24;
          }
          
          // Format times
          const timeInStr = `${timeInHour.toString().padStart(2, '0')}:${timeInMinute.toString().padStart(2, '0')}`;
          const timeOutStr = `${timeOutHour.toString().padStart(2, '0')}:${timeOutMinute.toString().padStart(2, '0')}`;
          
          // Auto-populate time fields
          updated.time_in = timeInStr;
          updated.time_out = timeOutStr;
        }
        
        return updated;
      });
    } else {
      setBookingDetails((prev) => ({ ...prev, [name]: value }));
    }
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
      case 'full-time':
        workingDays = calculateFullTimeWorkingDays(start, end);
        break;
      case 'part-time':
        workingDays = calculateFullTimeWorkingDays(start, end); // Same as full-time but different hours
        break;
      case 'one-time':
        workingDays = 1;
        break;
      default:
        workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return { hours: diffHours, days: workingDays };
  };

  // Calculate actual working hours based on time in/out
  const calculateActualHours = () => {
    const { time_in, time_out } = bookingDetails;
    
    if (!time_in || !time_out) {
      return 0;
    }
    
    const [startHour, startMinute] = time_in.split(':').map(Number);
    const [endHour, endMinute] = time_out.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute; // Convert to minutes
    const endTime = endHour * 60 + endMinute; // Convert to minutes
    
    let diffMinutes = endTime - startTime;
    
    // Handle overnight shifts (if end time is before start time)
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 24 hours
    }
    
    return diffMinutes / 60; // Convert back to hours
  };

  const calculateSalary = () => {
    const { book_in, book_end, daily_rate, work_type, time_in, time_out } = bookingDetails;
    
    if (!book_in || !book_end || !daily_rate) {
      return { 
        dailyRate: 0,
        totalAmount: 0, 
        workingDays: 0, 
        totalHours: 0,
        hourlyRate: 0,
        explanation: 'Please fill in booking dates and daily rate'
      };
    }

    const startDate = new Date(book_in);
    const endDate = new Date(book_end);
    
    // Calculate working days based on work type
    let workingDays = 0;
    let hoursPerDay = 0;
    let totalHours = 0;
    let explanation = '';

    // Calculate actual hours per day if time in/out is provided
    const actualHoursPerDay = calculateActualHours();

    switch (work_type) {
      case 'full-time':
        // Full-time: Based on collar type - Blue-collar (Mon-Sat) or White/Pink-collar (Mon-Fri), 8 hours per day
        workingDays = calculateFullTimeWorkingDays(startDate, endDate);
        hoursPerDay = actualHoursPerDay > 0 ? actualHoursPerDay : 8; // Use actual hours or default 8
        totalHours = workingDays * hoursPerDay;
        const fullTimeDays = isBlueCollarWorker() ? 'Monday-Saturday' : 'Monday-Friday';
        explanation = `Full-time: ${hoursPerDay} hours/day, ${fullTimeDays}. Total: ${workingDays} working days`;
        break;
        
      case 'part-time':
        // Part-time: Based on collar type - Blue-collar (Mon-Sat) or White/Pink-collar (Mon-Fri), 6 hours per day
        workingDays = calculatePreferredWorkingDays(startDate, endDate);
        hoursPerDay = actualHoursPerDay > 0 ? actualHoursPerDay : 6; // Use actual hours or default 6
        totalHours = workingDays * hoursPerDay;
        const partTimeDays = isBlueCollarWorker() ? 'Monday-Saturday' : 'Monday-Friday';
        const weeklyHours = isBlueCollarWorker() ? '36 hours/week' : '30 hours/week';
        explanation = `Part-time: ${hoursPerDay} hours/day, ${partTimeDays} (${weeklyHours}). Total: ${workingDays} working days`;
        break;
        
      case 'one-time':
        // One-time: Fixed project payment, hours depend on employer's needs
        workingDays = 1;
        hoursPerDay = actualHoursPerDay > 0 ? actualHoursPerDay : 8; // Use actual hours or default 8
        totalHours = hoursPerDay;
        explanation = `One-time project: ${hoursPerDay} hours (adjustable by employer)`;
        break;
        
      default:
        workingDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        hoursPerDay = actualHoursPerDay > 0 ? actualHoursPerDay : 8;
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

  // Calculate working days based on work type and collar type
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
      
      // Determine working days based on work type and collar type
      if (workType === 'one-time') {
        // One-time jobs: count all days
        workingDaysCount++;
      } else if (isBlueCollarWorker()) {
        // Blue-collar workers: work Monday-Saturday (6 days per week)
        if (dayOfWeek >= 1 && dayOfWeek <= 6) { // Monday to Saturday
          workingDaysCount++;
        }
      } else {
        // White-collar/Pink-collar workers: work Monday-Friday (5 days per week)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
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
      const response = await axios.get(`http://127.0.0.1:8000/api/job-applications/worker/${worker.id}?status=accepted`);
      const acceptedJobs = response.data || [];

      // Also get all job posts with work schedules to check for conflicts
      const jobPostsResponse = await axios.get(`http://127.0.0.1:8000/api/jobposts?worker_id=${worker.id}&include_work_schedule=true`);
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
          label: 'Project Rate (One-time)',
          placeholder: 'Enter project rate amount',
          description: 'One-time project payment (or set custom hours below)'
        };
      default:
        return {
          label: 'Daily Rate',
          placeholder: 'Enter daily rate amount',
          description: ''
        };
    }
  };

  const handleSubmit = () => {
    // Validate required fields before submitting
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
      total_salary: salaryCalculation.totalAmount,
    };

    console.log('Submitting updated booking details:', validatedDetails);
    onSubmit(validatedDetails);
  };

  // Get available service types (main skills only) - same as BookModal.js
  const getAvailableServiceTypes = () => {
    console.log('=== GET AVAILABLE SERVICE TYPES CALLED ===');
    console.log('Worker object:', worker);
    console.log('Worker primary_skills:', worker?.primary_skills);
    console.log('Worker additional_skills:', worker?.additional_skills);
    
    if (!worker?.primary_skills && !worker?.additional_skills) {
      console.log('No skills found in worker data');
      return [];
    }
    
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    
    console.log('All skills combined:', allSkills);
    
    // Create options array for CustomDropdown with unique main skills
    const skillNames = new Set();
    const options = [];
    
    allSkills.forEach(skill => {
      console.log('Processing skill:', skill);
      const mainSkill = skill.skill_name;
      console.log('Skill name:', mainSkill);
      if (!skillNames.has(mainSkill)) {
        skillNames.add(mainSkill);
        options.push({
          value: mainSkill,
          label: mainSkill
        });
        console.log('Added skill to options:', mainSkill);
      }
    });
    
    console.log('Available Service Types:', options);
    console.log('Current Booking Service Type:', bookingDetails.service_type);
    
    return options;
  };

  // Get sub-skills for selected service type - same as BookModal.js
  const getAvailableSubSkills = () => {
    console.log('=== GET AVAILABLE SUB-SKILLS CALLED ===');
    console.log('Selected service type:', bookingDetails.service_type);
    console.log('Worker object:', worker);
    
    if (!bookingDetails.service_type) {
      console.log('No service type selected');
      return [];
    }
    
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    
    console.log('All skills for sub-skill lookup:', allSkills);
    
    const options = [];
    
    allSkills.forEach(skill => {
      console.log('Checking skill:', skill.skill_name, 'against:', bookingDetails.service_type);
      if (skill.skill_name === bookingDetails.service_type && skill.sub_skills && Array.isArray(skill.sub_skills)) {
        console.log('Found matching skill with sub-skills:', skill.sub_skills);
        skill.sub_skills.forEach(subSkill => {
          options.push({
            value: subSkill,
            label: subSkill
          });
          console.log('Added sub-skill:', subSkill);
        });
      }
    });
    
    console.log('Available Sub-Skills:', options);
    return options;
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

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal-container">
        <h2 className="booking-modal-title">Edit Booking for {worker?.name}</h2>
        <div className="booking-modal-form-content">
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
          
          {bookingDetails.service_type && (
            <div className="booking-form-field">
              <label className="booking-form-label" htmlFor="sub_skill">Sub Skills</label>
              {getAvailableSubSkills().length > 0 ? (
                <CustomDropdown
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
              min={minDate}
              required
            />
            <small>
              Please select a time at least 1 hour from now
            </small>
          </div>
          
          <div className="booking-form-field">
            <label className="booking-form-label" htmlFor="book_end">Book End</label>
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
              required
            />
          </div>

          {/* Availability Warning */}
          {!availabilityStatus.isAvailable && (
            <div className="availability-warning">
              <div className="warning-header">
                <IoWarningOutline style={{ color: '#ffc107', marginRight: '18px', marginTop: '8px', fontSize: '30px' }} />
                <div className="rs-message-body">
                  Worker not free — 1 job scheduled.
                </div>
              </div>
            </div>
          )}
          
          {/* Time In/Out Fields - Only show when both Book In and Book End are filled */}
          {bookingDetails.book_in && bookingDetails.book_end && (
            <>
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
                <small>
                  Auto-populated: Book In time + 1 hour (or set custom time)
                </small>
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
                <small>
                  Auto-populated: Time In + working hours (or set custom time)
                </small>
              </div>
            </>
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
            {getSalaryInfo().description && (
              <small>
                {getSalaryInfo().description}
              </small>
            )}
          </div>
          
          {/* Salary Calculation Preview */}
          {bookingDetails.daily_rate && bookingDetails.book_in && bookingDetails.book_end && (
            <div className="booking-form-field">
              <label className="booking-form-label">Salary Calculation Preview</label>
              <div className="salary-calculation-preview">
                <div className="calculation-row">
                  <span className="calculation-label">Daily Rate:</span>
                  <span className="calculation-value">₱{calculateSalary().dailyRate}</span>
                </div>
                <div className="calculation-row">
                  <span className="calculation-label">Hours Per Day:</span>
                  <span className="calculation-value">{calculateSalary().hoursPerDay} hours</span>
                </div>
                <div className="calculation-row">
                  <span className="calculation-label">Working Days:</span>
                  <span className="calculation-value">{calculateSalary().workingDays} days</span>
                </div>
                <div className="calculation-row">
                  <span className="calculation-label">Total Hours:</span>
                  <span className="calculation-value">{calculateSalary().totalHours} hours</span>
                </div>
                <div className="calculation-row">
                  <span className="calculation-label">Hourly Rate:</span>
                  <span className="calculation-value">₱{calculateSalary().hourlyRate}/hour</span>
                </div>
                <div className="calculation-row total-row">
                  <span className="calculation-label">Total Salary:</span>
                  <span className="calculation-value">₱{calculateSalary().totalAmount}</span>
                </div>
                <div>
                  <small>{calculateSalary().explanation}</small>
                </div>
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
            disabled={!bookingDetails.service_type || !bookingDetails.book_in || !bookingDetails.book_end || !bookingDetails.description || !bookingDetails.daily_rate || !isValidEndDate(bookingDetails.book_end) || !validateBookInTime(bookingDetails.book_in) || !availabilityStatus.isAvailable}
          >
            Update Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMyBooking;
