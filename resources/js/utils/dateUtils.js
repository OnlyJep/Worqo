/**
 * Date utility functions for Philippines timezone (Asia/Manila, UTC+8)
 */

/**
 * Convert a date string from database (UTC) to Philippines time for datetime-local input
 * @param {string} dateString - Date string from database (UTC)
 * @returns {string} - Formatted string for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export const convertToPhilippinesTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Parse the date string (assumed to be UTC from database)
    // The date string represents a moment in time that was stored as UTC
    // but the actual time value was in Philippines time (UTC+8)
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return '';
    }
    
    // Convert to Philippines time (UTC+8)
    // Use Intl.DateTimeFormat to get the correct time in Philippines timezone
    // This ensures we display the time as it was originally entered (in Philippines time)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    
    // Return in datetime-local format (YYYY-MM-DDTHH:mm)
    // This will be displayed in the input field, and we'll treat it as Philippines time when saving
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch (error) {
    console.error('Error converting date to Philippines time:', error);
    return '';
  }
};

/**
 * Convert a datetime-local value (assumed to be Philippines time) to ISO string for backend
 * @param {string} dateTimeLocal - Date string from datetime-local input (YYYY-MM-DDTHH:mm)
 * @returns {string} - ISO string representing the date in Philippines time
 */
export const convertFromPhilippinesTime = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  
  try {
    // Parse the datetime-local value (assumed to be in Philippines time)
    // datetime-local gives us YYYY-MM-DDTHH:mm without timezone
    // We need to treat this as Philippines time (UTC+8) regardless of user's local timezone
    
    // Split the datetime-local string
    const [datePart, timePart] = dateTimeLocal.split('T');
    if (!datePart || !timePart) {
      console.warn('Invalid datetime-local format:', dateTimeLocal);
      return null;
    }
    
    // Extract date and time components
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create a date object treating the input as Philippines time (UTC+8)
    // We do this by creating a date string with explicit timezone offset
    // Format: YYYY-MM-DDTHH:mm:ss+08:00 (Philippines is UTC+8)
    const dateTimeWithTz = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`;
    
    // Parse it - this will create a Date object representing that time in Philippines
    // The Date object will internally store it as UTC (8 hours earlier)
    const date = new Date(dateTimeWithTz);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateTimeLocal);
      return null;
    }
    
    // Return ISO string (this will be in UTC, but represents the correct Philippines time)
    // For example: if user inputs 2025-04-11T10:15 (Philippines time),
    // this will return 2025-04-11T02:15:00.000Z (UTC, which is 8 hours earlier)
    return date.toISOString();
  } catch (error) {
    console.error('Error converting date from Philippines time:', error);
    return null;
  }
};

/**
 * Get current date/time in Philippines timezone for datetime-local input
 * @returns {string} - Formatted string for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export const getCurrentPhilippinesTime = () => {
  const now = new Date();
  
  // Use Intl.DateTimeFormat to get the correct time in Philippines timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Convert database date to Philippines time for display
 * @param {string} dateString - Date string from database (UTC)
 * @returns {Date} - Date object representing Philippines time
 */
export const getPhilippinesDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Convert to Philippines time for comparison
    // Create a date string in Philippines timezone format
    const phTimeString = date.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    return new Date(phTimeString);
  } catch (error) {
    console.error('Error getting Philippines date:', error);
    return null;
  }
};

/**
 * Compare current time with a date in Philippines timezone
 * @param {string} dateString - Date string from database (UTC)
 * @returns {number} - Difference in milliseconds (positive if date is in future)
 */
export const compareWithPhilippinesTime = (dateString) => {
  if (!dateString) return 0;
  
  try {
    const dbDate = new Date(dateString);
    const now = new Date();
    
    // Get both dates in Philippines timezone for accurate comparison
    const phDbDate = new Date(dbDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const phNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    
    return phDbDate.getTime() - phNow.getTime();
  } catch (error) {
    console.error('Error comparing dates:', error);
    return 0;
  }
};

