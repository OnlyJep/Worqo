import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './../../../sass/components/profile.scss';
import Headerz from "../HeaderContent/Headerz";
import profilePhoto from '../../../../resources/sass/img/pfp.svg';
import coverPhoto from '../../../../resources/sass/img/coverphoto.svg';
import BookModal from './BookModal';
import ConfirmationModal from './ConfirmationModal';
import SuccessModal from './SuccessModal';
import Loader from "../LoaderContent/loader";
import { message } from 'antd';

const Profile = ({ initialServiceType }) => {
  const { workerId } = useParams();
  const location = useLocation();

  // Function to format last active time
  const getLastActiveText = (lastActivity, isOnline) => {
    // If user is offline (is_online = 0), always show "Offline"
    if (isOnline === 0 || isOnline === false) return 'Offline';
    
    if (!lastActivity) return 'Offline';
    
    const now = new Date();
    const lastActive = new Date(lastActivity);
    const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `Active ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Active ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 365) return `Active ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `Active ${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  };

  // Function to check if status should be green (only when actually online)
  const isStatusGreen = () => {
    // Only show green if user is actually online
    return isUserOnline();
  };
  const resolvedWorkerId = (() => {
    // If route param is not a valid id (e.g., 'profile'), fallback to current user id
    if (!workerId || isNaN(Number(workerId))) {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      return user?.user?.id || user?.id || null;
    }
    return workerId;
  })();
  console.log('Profile component mounted with workerId:', workerId, 'resolved:', resolvedWorkerId);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [workerRank, setWorkerRank] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [collarData, setCollarData] = useState({});
  const [servicesData, setServicesData] = useState([]);

  // Function to fetch collar data from API
  const fetchCollarData = async () => {
    try {
      console.log('Fetching collar data...');
      const response = await axios.get('/api/collars');
      console.log('Collar API response:', response.data);
      const collars = response.data.collars || [];
      const collarMap = {};
      
      collars.forEach(collar => {
        console.log('Processing collar:', collar);
        collarMap[collar.id] = {
          id: collar.id,
          name: collar.name,
          image: collar.collar_img,
          collar_img: collar.collar_img
        };
        
        // Aggressive preloading for ultra-fast collar image loading
        if (collar.collar_img) {
          const img = new Image();
          img.src = `http://127.0.0.1:8000/storage/${collar.collar_img}`;
          img.loading = 'eager';
          img.decoding = 'async';
          console.log('Preloading collar image:', img.src);
        }
      });
      
      setCollarData(collarMap);
      console.log('Fetched collar data:', collarMap);
    } catch (error) {
      console.error('Error fetching collar data:', error);
    }
  };

  // Function to fetch services data from API
  const fetchServicesData = async () => {
    try {
      console.log('Fetching services data...');
      const response = await axios.get('/api/services');
      console.log('Services API response:', response.data);
      const services = response.data.services || [];
      
      setServicesData(services);
      console.log('Fetched services data:', services);
      
      // Aggressive preloading for ultra-fast collar image loading
      services.forEach(service => {
        if (service.collar_img) {
          const img = new Image();
          img.src = `http://127.0.0.1:8000/storage/${service.collar_img}`;
          img.loading = 'eager';
          img.decoding = 'async';
          console.log('Preloading collar image:', img.src);
        }
      });
    } catch (error) {
      console.error('Error fetching services data:', error);
    }
  };

  // Helper function to get rank based on experience
  const getRankByExperience = (experience) => {
    switch (experience) {
      case '0-11-months':
        return { name: 'Bronze', image: '/images/bronze.png' };
      case '1-2-years':
        return { name: 'Silver', image: '/images/silver.svg' };
      case '2-5-years':
        return { name: 'Gold', image: '/images/gold.svg' };
      case '5-10-years':
        return { name: 'Platinum', image: '/images/platinum.svg' };
      case '10+ years':
        return { name: 'Diamond', image: '/images/diamond.svg' };
      default:
        return { name: 'Bronze', image: '/images/bronze.png' };
    }
  };

  // Helper function to get worker collar based on skills and services
  const getWorkerCollar = (worker) => {
    console.log('Getting worker collar for:', worker);
    console.log('Services data available:', servicesData);
    console.log('Worker skills:', worker?.primary_skills, worker?.additional_skills);
    
    if (!worker?.primary_skills && !worker?.additional_skills) {
      console.log('No skills found, using default Blue Collars');
      return { id: 1, name: "Blue Collars", image: "img/collar/aAuEXungkh3r08FEXqhWMSf9fYJNKEjQiMSc76iM.png" };
    }
    
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    
    console.log('All worker skills:', allSkills);
    console.log('Available services:', servicesData);
    
    // Find matching service based on worker's skills
    for (const skill of allSkills) {
      console.log('Checking skill:', skill);
      
      // Find service that contains this skill
      const matchingService = servicesData.find(service => {
        const serviceSkillIds = service.skill_ids || [];
        console.log('Service skill IDs:', serviceSkillIds, 'for service:', service.name);
        return serviceSkillIds.includes(skill.skill_id?.toString());
      });
      
      if (matchingService) {
        console.log('Found matching service:', matchingService);
        console.log('Service collar info:', {
          color_collar_id: matchingService.color_collar_id,
          color_collar_name: matchingService.color_collar_name,
          collar_img: matchingService.collar_img
        });
        
        return {
          id: matchingService.color_collar_id,
          name: matchingService.color_collar_name,
          image: matchingService.collar_img
        };
      }
    }
    
    // Default to Blue Collars if no match found
    console.log('No matching service found, using default Blue Collars');
    return { id: 1, name: "Blue Collars", image: "img/collar/aAuEXungkh3r08FEXqhWMSf9fYJNKEjQiMSc76iM.png" };
  };


  // Check if user is logged in
  const isLoggedIn = () => {
    const authToken = localStorage.getItem("auth_token");
    return !!authToken;
  };

  // Check if the user whose profile is being viewed is online
  const isUserOnline = () => {
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const currentUser = userData.user || userData;
    const isOwnProfile = currentUser?.id === parseInt(resolvedWorkerId);
    
    console.log('Profile status check:', {
      currentUserId: currentUser?.id,
      workerId: worker?.id,
      resolvedWorkerId: resolvedWorkerId,
      isOwnProfile: isOwnProfile,
      isLoggedIn: isLoggedIn(),
      workerIsOnline: worker?.is_online,
      workerLastActivity: worker?.last_activity
    });
    
    // If viewing own profile and logged in, show as online
    if (isOwnProfile && isLoggedIn()) {
      console.log('Showing as online - own profile and logged in');
      return true;
    }
    
    // If the worker ID matches the current user ID (alternative check)
    if (worker && worker.id && currentUser?.id && worker.id === currentUser.id && isLoggedIn()) {
      console.log('Showing as online - worker ID matches current user');
      return true;
    }
    
    // Use the backend is_online status
    console.log('Using backend is_online status:', worker?.is_online);
    return worker?.is_online || false;
  };

  // Handle Hire Now button click
  const handleHireNowClick = () => {
    if (!isLoggedIn()) {
      alert('Please login to hire workers');
      window.location.href = '/login';
      return;
    }
    
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUser = userData.user || userData;
    
    if (currentUser.role_id === 1) {
      alert('Workers cannot hire other workers. Please switch to Employer account.');
      return;
    }
    
    // Show verification modal first
    setIsVerificationModalOpen(true);
  };

  // Handle continue button click
  const handleVerificationContinue = () => {
    setIsVerificationModalOpen(false);
    setIsBookingModalOpen(true);
  };

  // Handle verification modal close
  const handleVerificationClose = () => {
    setIsVerificationModalOpen(false);
  };


  // Handle Message button click
  const handleMessageClick = () => {
    if (!isLoggedIn()) {
      alert('Please login to send messages');
      window.location.href = '/login';
      return;
    }
    
    // Store the target user ID in localStorage
    localStorage.setItem('message_target_user_id', worker.id);
    // Navigate to messages page
    window.location.href = '/message';
  };

  // Fetch worker data from API
  useEffect(() => {
    let isMounted = true;
    
    const fetchWorkerData = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        const authToken = localStorage.getItem("auth_token");
        
        // Check if user is logged in and get their role
        const userData = JSON.parse(localStorage.getItem("user") || '{}');
        const currentUser = userData.user || userData;
        
        const headers = authToken
          ? { Authorization: `Bearer ${authToken}`, Accept: "application/json" }
          : { Accept: "application/json" };

        let workerData;
        try {
          console.log('Making API call to:', `/api/workers/${resolvedWorkerId}`);
          const response = await axios.get(`/api/workers/${resolvedWorkerId}`, {
            headers,
            timeout: 30000,
          });
          workerData = response.data;
          console.log('API response received:', workerData);
        } catch (apiError) {
          // Handle role-based access denial
          if (apiError.response?.status === 403) {
            if (isMounted) {
              setError(apiError.response.data.message || "Access denied. Workers cannot view other worker profiles.");
              setLoading(false);
            }
            return;
          }
          // If the API call fails, it means the user is not a worker
          if (apiError.response?.status === 404) {
            if (isMounted) {
              setError("This user is not a worker. Only worker profiles can be viewed here.");
              setLoading(false);
            }
            return;
          }
          throw apiError; // Re-throw if it's not a 404 or 403 error
        }

        if (!isMounted) return;

        console.log("Raw worker data from API:", workerData);
        console.log("Profile data:", workerData.profile);
        console.log("Worker data:", workerData.worker);
        console.log("Bio:", workerData.worker?.bio);
        console.log("Skills:", workerData.worker?.skills_id);
        console.log("Primary skills:", workerData.worker?.skills_id?.primary_skills);
        console.log("Additional skills:", workerData.worker?.skills_id?.additional_skills);
        console.log("Verified status:", workerData.worker?.verified);
        console.log("Hourly rate from primary skill:", workerData.worker?.skills_id?.primary_skills?.[0]?.hourly_rate);
        
        // Check if the target user is a worker (has worker data)
        if (!workerData.worker) {
          if (isMounted) {
            setError("This user is not a worker. Only worker profiles can be viewed here.");
            setLoading(false);
          }
          return;
        }
        
        // Allow viewing of any worker profile, including own profile
        // This allows employers to view their own worker profiles
        
        // Format the worker data
        const firstName = workerData.profile?.first_name || '';
        const middleName = workerData.profile?.middlename || '';
        const lastName = workerData.profile?.last_name || '';
        const suffix = workerData.profile?.suffix_id || '';
        
        // Combine name parts
        const nameParts = [firstName, middleName, lastName, suffix].filter(part => part && part.trim());
        const fullName = nameParts.join(' ').trim() || 'Unknown Worker';
        
        // Combine address parts
        const addressParts = [
          workerData.profile?.street,
          workerData.profile?.city,
          workerData.profile?.province,
          workerData.profile?.postal_code,
          workerData.profile?.country
        ].filter(part => part && part.trim());
        const fullAddress = addressParts.join(', ');
        
        const formattedWorker = {
          id: workerData.id,
          name: fullName,
          email: workerData.email,
          status: workerData.last_active_text || (workerData.is_online ? "Online" : "Offline"),
          is_online: workerData.is_online,
          last_active_text: workerData.last_active_text,
          last_activity: workerData.last_activity,
          hourlyRate: workerData.worker?.skills_id?.primary_skills?.[0]?.hourly_rate 
            ? parseFloat(workerData.worker.skills_id.primary_skills[0].hourly_rate) 
            : 150.00,
          description: workerData.worker?.bio || "No bio available",
          work_type: workerData.worker?.work_type || 'part-time',
          hours_per_day: workerData.worker?.hours_per_day || 4,
          location: fullAddress || 'Address not specified',
          profile_img: workerData.profile?.profile_img,
          contact_number: workerData.profile?.contact_number,
          street: workerData.profile?.street,
          postal_code: workerData.profile?.postal_code,
          country: workerData.profile?.country,
          // Keep original skills structure for detailed display
          primary_skills: workerData.worker?.skills_id?.primary_skills || [],
          additional_skills: workerData.worker?.skills_id?.additional_skills || [],
          // Format skills with sub-skills for display
          skills: [
            ...(workerData.worker?.skills_id?.primary_skills || []),
            ...(workerData.worker?.skills_id?.additional_skills || [])
          ].map(skill => {
            const skillName = skill.skill_name || 'Unknown Skill';
            const subSkills = skill.sub_skills || [];
            if (subSkills.length > 0) {
              return `${skillName} - ${subSkills.join(', ')}`;
            }
            return skillName;
          }),
          // Format credentials
          credentials: workerData.worker?.credentials_name || [],
          credentials_photo: workerData.worker?.credentials_photo || [],
          created_at: workerData.created_at,
          // Add verified and rank information
          verified: workerData.worker?.verified === true || workerData.worker?.verified === 1,
          rank: workerData.worker?.rank || null,
          preferred_working_days: Array.isArray(workerData.worker?.preferred_working_days) 
            ? workerData.worker.preferred_working_days 
            : [],
        };

        console.log("Formatted worker data:", formattedWorker);
        if (isMounted) {
          setWorker(formattedWorker);
        }
      } catch (error) {
        console.error("Error fetching worker data:", error.response?.data || error.message);
        if (isMounted) {
          setError("Failed to load worker profile. Please try again later.");
          message.error("Failed to load worker profile.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (workerId) {
      fetchWorkerData();
      fetchWorkerReviews();
    }

    return () => {
      isMounted = false;
    };
  }, [workerId]);

  // Fetch collar data on component mount
  useEffect(() => {
    fetchCollarData();
  }, []);

    // Fetch services data on component mount
  useEffect(() => {
    fetchServicesData();
    
    // Preload verified.png for ultra-fast loading
    const verifiedImg = new Image();
    verifiedImg.src = '/images/verified.png';
    verifiedImg.loading = 'eager';
    verifiedImg.decoding = 'async';
    verifiedImg.onload = () => console.log('Verified.png loaded successfully');
    verifiedImg.onerror = () => console.error('Failed to load verified.png');
    console.log('Preloading verified.png from:', verifiedImg.src);
  }, []);

  // Fetch worker reviews
  const fetchWorkerReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`/api/reviews/worker/${resolvedWorkerId}`, {
        headers: { Accept: "application/json" }
      });

      if (response.data.success) {
        setReviews(response.data.reviews);
        const avgRating = response.data.average_rating || 0;
        const numReviews = response.data.total_reviews || 0;
        setAverageRating(avgRating);
        setTotalReviews(numReviews);
        
        // Calculate total points: (Average Rating × 5000 × Number of Reviews)
        const calculatedPoints = avgRating * 5000 * numReviews;
        setTotalPoints(calculatedPoints);
        
        // Determine rank based on total points
        await fetchWorkerRank(calculatedPoints);
      } else {
        // If fetch fails, still show rank with 0 points
        setTotalPoints(0);
        await fetchWorkerRank(0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Even on error, show rank with 0 points
      setTotalPoints(0);
      await fetchWorkerRank(0);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch worker rank based on total points
  const fetchWorkerRank = async (points) => {
    try {
      if (points >= 0) {
        const response = await axios.get('/api/ranks', {
          headers: { Accept: "application/json" }
        });
        
        // Get all ranks sorted by min_points
        const ranks = (response.data.ranks || []).sort((a, b) => a.min_points - b.min_points);
        
        // Find the rank where points fall within the range
        let matchedRank = null;
        for (let i = 0; i < ranks.length; i++) {
          const rank = ranks[i];
          const minPoints = rank.min_points || 0;
          const maxPoints = rank.max_points;
          
          if (maxPoints === null || maxPoints === undefined) {
            // This is the highest rank (no max limit)
            if (points >= minPoints) {
              matchedRank = rank;
            }
          } else {
            // Check if points fall within this rank's range
            if (points >= minPoints && points <= maxPoints) {
              matchedRank = rank;
              break;
            }
          }
        }
        
        if (matchedRank) {
          setWorkerRank(matchedRank);
          
          // Calculate progress toward next rank
          const currentMinPoints = matchedRank.min_points || 0;
          const currentMaxPoints = matchedRank.max_points;
          
          if (currentMaxPoints !== null && currentMaxPoints !== undefined) {
            const rangeSize = currentMaxPoints - currentMinPoints;
            const pointsInRange = points - currentMinPoints;
            const progress = Math.min(100, Math.max(0, (pointsInRange / rangeSize) * 100));
            setProgressPercent(progress);
          } else {
            // Highest rank - always at 100%
            setProgressPercent(100);
          }
        } else if (ranks.length > 0) {
          // If no rank matched and points are 0, use first rank (Bronze)
          matchedRank = ranks[0];
          setWorkerRank(matchedRank);
          setProgressPercent(0);
        }
      }
    } catch (error) {
      console.error("Error fetching worker rank:", error);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleBookingSubmit = (details) => {
    // Just show confirmation modal - don't submit to backend yet
    setBookingDetails(details);
    setIsBookingModalOpen(false);
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        message.error("Please log in to book this worker");
        setIsLoginModalOpen(true);
        return;
      }

      // Check if user is trying to book themselves
      const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
      if (currentUserId && currentUserId === worker.id) {
        message.error("You cannot book yourself");
        return;
      }

      // Validate worker data
      if (!worker || !worker.id) {
        message.error("Worker information is missing. Please refresh the page and try again.");
        return;
      }

      // Convert datetime-local format to proper date format for backend
      const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return null;
        // Convert "YYYY-MM-DDTHH:MM" to "YYYY-MM-DD HH:MM:SS"
        const date = new Date(dateTimeString);
        return date.toISOString().slice(0, 19).replace('T', ' ');
      };

      // Get current user data to set employer_id
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      
      // Use the actual user IDs from the database
      // The employer should be the current user's ID (directly from userData.id)
      const employerUserId = userData.id;
      
      console.log('=== LOCALSTORAGE USER DATA ===');
      console.log('localStorage user key:', localStorage.getItem("user"));
      console.log('Parsed userData:', userData);
      console.log('Extracted employerUserId:', employerUserId);
      console.log('UserData type:', typeof userData);
      console.log('UserData.id type:', typeof userData.id);
      console.log('UserData.id value:', userData.id);
      
      // Validate that we have a valid user ID from localStorage
      if (!employerUserId || employerUserId === null || employerUserId === undefined) {
        console.error('CRITICAL ERROR: No valid user ID found in localStorage!');
        console.error('localStorage user data:', userData);
        message.error("Critical error: Unable to identify user from localStorage. Please refresh and log in again.");
        return;
      }
      
      // The worker ID should be the worker's user ID
      // Try different possible worker ID fields
      let workerUserId = worker.id || worker.user_id || worker.user?.id;
      
      // If still no worker ID, try to get it from the worker data structure
      if (!workerUserId && worker.user) {
        workerUserId = worker.user.id;
      }
      
      // Final fallback: if we still don't have a worker ID, try to fetch it
      if (!workerUserId && worker.id) {
        try {
          console.log('Attempting to fetch worker data for ID:', worker.id);
          const workerResponse = await axios.get(`http://127.0.0.1:8000/api/workers/${worker.id}`);
          if (workerResponse.data && workerResponse.data.id) {
            workerUserId = workerResponse.data.id;
            console.log('Fetched worker user ID from API:', workerUserId);
          }
        } catch (apiError) {
          console.error('Failed to fetch worker data:', apiError);
        }
      }
      
      console.log('=== BOOKING CREATION - USING CORRECT USER IDs ===');
      console.log('Employer User ID (from current user):', employerUserId);
      console.log('Worker User ID (from worker profile):', workerUserId);
      
      console.log('=== BOOKING CREATION DEBUG ===');
      console.log('User data from localStorage:', userData);
      console.log('Employer user ID:', employerUserId);
      console.log('Worker user ID:', workerUserId);
      console.log('Worker data structure:', JSON.stringify(worker, null, 2));
      console.log('Worker ID type:', typeof worker.id);
      console.log('Worker ID value:', worker.id);
      
      // CRITICAL: Validate employer_id is not null/undefined
      if (!employerUserId || employerUserId === null || employerUserId === undefined) {
        console.error('CRITICAL ERROR: employerUserId is null/undefined!');
        console.error('userData:', userData);
        console.error('userData.id:', userData.id);
        message.error("Critical error: Unable to identify employer. Please refresh and try again.");
        return;
      }
      
      // CRITICAL: Validate worker_id is not null/undefined  
      if (!workerUserId || workerUserId === null || workerUserId === undefined) {
        console.error('CRITICAL ERROR: workerUserId is null/undefined!');
        console.error('worker:', worker);
        console.error('worker.id:', worker.id);
        message.error("Critical error: Unable to identify worker. Please refresh and try again.");
        return;
      }
      
      // Validate that we have valid IDs
      if (!employerUserId) {
        message.error("Unable to identify employer. Please refresh and try again.");
        return;
      }
      
      if (!workerUserId) {
        message.error("Unable to identify worker. Please refresh and try again.");
        return;
      }
      
      console.log('Creating booking with employer_id:', employerUserId, 'worker_id:', workerUserId);
      
      // Final validation
      console.log('Final booking data before submission:');
      console.log('Employer ID:', employerUserId);
      console.log('Worker ID:', workerUserId);
      console.log('Service Type:', bookingDetails.service_type);
      console.log('Book In:', bookingDetails.book_in);
      console.log('Book End:', bookingDetails.book_end);
      
      const bookingData = {
        employer_id: employerUserId, // Use user ID directly
        worker_id: workerUserId, // Use user ID directly
        service_type: bookingDetails.service_type,
        sub_skill: bookingDetails.sub_skill || null,
        work_type: bookingDetails.work_type,
        description: bookingDetails.description,
        book_in: formatDateTime(bookingDetails.book_in),
        book_end: formatDateTime(bookingDetails.book_end),
        time_in: bookingDetails.time_in || null,
        time_out: bookingDetails.time_out || null,
        daily_rate: parseFloat(bookingDetails.daily_rate),
        total_amount: parseFloat(bookingDetails.total_amount) || null, // Match database field name
        status: 'pending' // Add status field
      };

      console.log('=== FINAL BOOKING DATA VALIDATION ===');
      console.log('bookingData.employer_id:', bookingData.employer_id);
      console.log('bookingData.worker_id:', bookingData.worker_id);
      console.log('bookingData.employer_id type:', typeof bookingData.employer_id);
      console.log('bookingData.worker_id type:', typeof bookingData.worker_id);
      console.log('bookingData.employer_id is null?', bookingData.employer_id === null);
      console.log('bookingData.worker_id is null?', bookingData.worker_id === null);
      console.log('Complete bookingData:', JSON.stringify(bookingData, null, 2));

      // FINAL VALIDATION: Ensure employer_id is not null before sending
      if (bookingData.employer_id === null || bookingData.employer_id === undefined) {
        console.error('FINAL VALIDATION FAILED: employer_id is null in bookingData!');
        message.error("Critical error: Employer ID is missing. Cannot create booking.");
        return;
      }

      console.log('Submitting booking with data:', bookingData);
      console.log('Auth token:', authToken);
      
      
      const response = await axios.post('http://127.0.0.1:8000/api/bookings', bookingData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          'X-User-ID': employerUserId
        }
      });
      
      console.log('Booking submission response:', response.data);

      if (response.data.success) {
        message.success("Booking request sent successfully!");
        setIsConfirmationModalOpen(false);
        setIsSuccessModalOpen(true);
        
        // Trigger refresh of bookings list
        localStorage.setItem('booking_refresh_trigger', Date.now().toString());
        
        // Also dispatch a custom event for immediate refresh
        window.dispatchEvent(new CustomEvent('bookingSubmitted'));
        
        console.log('Booking submitted successfully, triggering refresh');
      } else {
        message.error(response.data.message || "Failed to send booking request");
      }
    } catch (error) {
      console.error("Booking error:", error.response?.data || error.message);
      
      if (error.response?.status === 422) {
        // Handle validation errors
        const errors = error.response.data?.errors;
        if (errors) {
          const errorMessages = Object.values(errors).flat();
          message.error(`Validation failed: ${errorMessages.join(', ')}`);
        } else {
          message.error(error.response.data?.message || "Validation failed");
        }
      } else {
        const errorMessage = error.response?.data?.message || "Failed to send booking request";
        message.error(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Headerz />
        <div className="profile-loading-container">
          <Loader />
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="profile-page">
        <Headerz />
        <div className="profile-error-container">
          <p className="profile-error-message">{error || "Worker not found"}</p>
        </div>
      </div>
    );
  }

  // Check if service parameter exists in URL
  const searchParams = new URLSearchParams(location.search);
  const hasServiceParam = searchParams.has('service');
  const serviceType = searchParams.get('service') || initialServiceType;

  return (
    <div className="profile-page">
      <Headerz />
      <div className="profile-header">
        <div className="profile-cover-photo">
          <img src={coverPhoto} alt="Cover" />
        </div>
        <div className="profile-photo-wrapper">
          <img 
            src={worker.profile_img 
              ? `http://127.0.0.1:8000/storage/${worker.profile_img}` 
              : "/images/defpfp.svg"
            } 
            alt="Profile" 
            className="profile-photo" 
            onError={(e) => {
              e.target.src = "/images/defpfp.svg";
            }}
          />
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-left">
          <div className="profile-info">
            <div className="profile-name-container">
              <div className="profile-name-with-badge">
                <h2>{worker.name}</h2>
                {/* Collar Badge - positioned beside name */}
                {(() => {
                  const workerCollar = getWorkerCollar(worker);
                  console.log('Worker collar result:', workerCollar);
                  console.log('Image path:', workerCollar.image);
                  console.log('Full image URL:', `http://127.0.0.1:8000/storage/${workerCollar.image}`);
                  
                  return (
                    <div className="profile-service-badge" title={`${workerCollar.name} Worker`}>
                      {workerCollar.image ? (
                        <img 
                          src={`http://127.0.0.1:8000/storage/${workerCollar.image}`} 
                          alt={`${workerCollar.name} Collar`}
                          className="badge-icon"
                          onError={(e) => {
                            console.error('Collar image failed to load:', e.target.src);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Collar image loaded successfully');
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })()}
                {/* Verified Badge - positioned beside collar icon */}
                {(worker.verified === true || worker.verified === 1) && (
                  <div className="profile-verified-badge" title="Verified Worker">
                    <img 
                      src="/images/verified.png" 
                      alt="Verified" 
                      className="verified-icon"
                      loading="eager"
                      decoding="async"
                      onLoad={() => console.log('Verified badge image loaded in profile')}
                      onError={(e) => console.error('Failed to load verified badge image:', e.target.src)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="profile-status-container">
              <span className={`profile-status-dot ${isStatusGreen() ? 'online' : 'offline'}`}></span>
              <p className={`profile-status ${isStatusGreen() ? 'online' : 'offline'}`}>
                {isUserOnline() ? 'Online' : getLastActiveText(worker.last_activity, worker.is_online)}
              </p>
            </div>
            <p className="profile-location">{worker.location}</p>
            {/* Show HIRE NOW and MESSAGE buttons */}
            {(() => {
              const userData = JSON.parse(localStorage.getItem("user") || '{}');
              const currentUser = userData.user || userData;
              const isEmployer = currentUser?.role_id === 2;
              const isOwnProfile = currentUser?.id === parseInt(resolvedWorkerId);
              
              if (isEmployer || isOwnProfile) {
                return (
                  <div className="profile-action-buttons">
                    <button className="profile-hire-button" onClick={handleHireNowClick}>
                      HIRE NOW
                    </button>
                    <button className="profile-message-button" onClick={handleMessageClick}>
                      MESSAGE
                    </button>
                  </div>
                );
              } else {
                return (
                  <div className="profile-hire-disabled">
                    <p>Switch to employer role to hire workers</p>
                  </div>
                );
              }
            })()}
          </div>
          <div className="profile-rank-display-section">
            {workerRank ? (
              <div className="profile-rank-display">
                <img 
                  src={`http://127.0.0.1:8000/storage/${workerRank.image}`}
                  alt={`${workerRank.name} Rank`}
                  className="profile-rank-badge"
                  title={`${workerRank.name} Rank - ${totalPoints.toLocaleString()} points`}
                />
                <div className="profile-rank-progress">
                  <div className="profile-progress-info">
                    <span className="profile-rank-name">{workerRank.name}</span>
                    <span className="profile-points-text">{totalPoints.toLocaleString()} pts</span>
                  </div>
                  <div className="profile-progress-bar-container">
                    <div 
                      className={`profile-progress-bar-fill profile-rank-${workerRank.name.toLowerCase()}`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <span className="profile-progress-label">
                    {workerRank.max_points 
                      ? `${totalPoints.toLocaleString()} / ${workerRank.max_points.toLocaleString()}`
                      : `${totalPoints.toLocaleString()} pts`
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="profile-rank-display">
                <div className="profile-rank-loading">Loading rank...</div>
              </div>
            )}
          </div>
          <div className="profile-stats">
            <div className="profile-stat-item">
              <span className="profile-stat-label">Work Type</span>
              <span className="profile-stat-number">{worker.work_type || 'Part-time'}</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-label">Preferred Working Days</span>
              <span className="profile-stat-number">
                {Array.isArray(worker.preferred_working_days) && worker.preferred_working_days.length > 0 
                  ? worker.preferred_working_days.join(', ').replace(/\b\w/g, l => l.toUpperCase())
                  : 'Not specified'
                }
              </span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-label">Hours/Day</span>
              <span className="profile-stat-number">{worker.hours_per_day || 4} hrs</span>
              </div>
            </div>
        </div>

        <div className="profile-right">
          <div className="profile-tabs">
            {['OVERVIEW', 'CREDENTIALS', 'REVIEWS'].map((tab) => (
              <button
                key={tab}
                className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="profile-tab-content">
            {activeTab === 'OVERVIEW' && (
              <div className="profile-overview">
                <h4>About</h4>
                <p>{worker.description || "No bio available"}</p>
                <h4>Skills</h4>
                <div className="profile-skills-section">
                  {worker.primary_skills.length > 0 && (
                    <div className="profile-skills-category">
                      <h5>Primary Skills</h5>
                      {worker.primary_skills.map((skill, index) => {
                        const skillRank = getRankByExperience(skill.experience);
                        return (
                          <div key={index} className="profile-skill-item">
                            <div className="profile-skill-header">
                              <div className="profile-skill-name-with-rank">
                                <img 
                                  src={skillRank.image} 
                                  alt={`${skillRank.name} Rank`}
                                  className="profile-skill-rank-icon"
                                />
                                <span className="profile-skill-name">
                                  {skill.skill_name}
                                  {skill.sub_skills && skill.sub_skills.length > 0 && (
                                    <span className="profile-sub-skills"> - {skill.sub_skills.join(', ')}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="profile-skill-details">
                              <span className="profile-experience">Experience: {skill.experience}</span>
                              <span className="profile-hourly-rate">₱{skill.hourly_rate}/hour</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {worker.additional_skills.length > 0 && (
                    <div className="profile-skills-category">
                      <h5>Additional Skills</h5>
                      {worker.additional_skills.map((skill, index) => {
                        const skillRank = getRankByExperience(skill.experience);
                        return (
                          <div key={index} className="profile-skill-item">
                            <div className="profile-skill-header">
                              <div className="profile-skill-name-with-rank">
                                <img 
                                  src={skillRank.image} 
                                  alt={`${skillRank.name} Rank`}
                                  className="profile-skill-rank-icon"
                                />
                                <span className="profile-skill-name">
                                  {skill.skill_name}
                                  {skill.sub_skills && skill.sub_skills.length > 0 && (
                                    <span className="profile-sub-skills"> - {skill.sub_skills.join(', ')}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="profile-skill-details">
                              <span className="profile-experience">Experience: {skill.experience}</span>
                              <span className="profile-hourly-rate">₱{skill.hourly_rate}/hour</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {worker.primary_skills.length === 0 && worker.additional_skills.length === 0 && (
                    <p>No skills available</p>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'CREDENTIALS' && (
              <div className="profile-credentials">
                <h4>Credentials</h4>
                {worker.credentials.length > 0 ? (
                <ul>
                  {worker.credentials.map((credential, index) => (
                    <li key={index}>{credential}</li>
                  ))}
                </ul>
                ) : (
                  <p>No credentials available</p>
                )}
                {worker.credentials_photo.length > 0 && (
                  <div className="profile-credentials-photos">
                    <h5>Credential Documents</h5>
                    {worker.credentials_photo.map((photo, index) => (
                      <div key={index} className="profile-credential-photo">
                        <a 
                          href={`http://127.0.0.1:8000/storage/${photo}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {worker.credentials[index] || `Document ${index + 1}`}
                        </a>
                  </div>
                ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'REVIEWS' && (
              <div className="profile-reviews">
                {totalReviews > 0 && (
                  <div className="profile-reviews-header">
                    <div className="profile-reviews-summary">
                      <div className="profile-average-rating">
                        <span className="profile-rating-number">{averageRating.toFixed(1)}</span>
                        <div className="profile-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= Math.round(averageRating) ? 'profile-star filled' : 'profile-star'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="profile-total-reviews">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {reviewsLoading ? (
                  <p>Loading reviews...</p>
                ) : reviews.length > 0 ? (
                  <div className="profile-reviews-list">
                    {reviews.map((review) => (
                      <div key={review.id} className="profile-review-item">
                        <div className="profile-review-header">
                          <div className="profile-reviewer-info">
                            <img 
                              src={review.reviewer.profile_img 
                                ? `http://127.0.0.1:8000/storage/${review.reviewer.profile_img}` 
                                : profilePhoto
                              } 
                              alt={review.reviewer.name}
                              className="profile-reviewer-avatar"
                            />
                            <div className="profile-reviewer-details">
                              <span className="profile-reviewer-name">{review.reviewer.name}</span>
                              <div className="profile-review-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className={star <= review.rating ? 'profile-star filled' : 'profile-star'}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="profile-review-date">
                            {new Date(review.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <p className="profile-review-comment">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No reviews available yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cloudflare Turnstile Verification Modal */}
      {isVerificationModalOpen && (
        <div className="verification-modal-overlay">
          <div className="verification-modal">
            <div className="verification-modal-header">
              <h3>Security Verification</h3>
              <button 
                className="verification-close-btn" 
                onClick={handleVerificationClose}
              >
                ×
              </button>
            </div>
            <div className="verification-modal-content">
              <p>Click Continue to proceed with hiring.</p>
              
              <div className="verification-actions">
                <button 
                  className="continue-button enabled"
                  onClick={handleVerificationContinue}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BookModal
        worker={worker}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={(details) => handleBookingSubmit(details)}
        serviceType={serviceType}
      />

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmBooking}
        onBack={() => {
          setIsConfirmationModalOpen(false);
          setIsBookingModalOpen(true);
        }}
        worker={worker}
        bookingDetails={bookingDetails}
        calculateSalary={calculateSalary}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />


      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="profile-login-modal-overlay">
          <div className="profile-login-modal">
            <h2>Sign In Required</h2>
            <p className="profile-login-modal-subtitle">You need to be logged in to book this worker</p>
            
            <div className="profile-login-options">
              <div className="profile-login-option">
                <h3>Already have an account?</h3>
                <p>Sign in to your existing account to book this worker</p>
                <button 
                  className="profile-login-btn profile-signin-btn"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    // Navigate to login page or open login modal
                    window.location.href = '/login';
                  }}
                >
                  Sign In
                </button>
              </div>
              
              <div className="profile-login-divider">
                <span>OR</span>
              </div>
              
              <div className="profile-login-option">
                <h3>New to Worqo?</h3>
                <p>Create a new account to start booking workers</p>
                <button 
                  className="profile-login-btn profile-signup-btn"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    // Navigate to signup page or open signup modal
                    window.location.href = '/register';
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <div className="profile-login-modal-buttons">
              <button 
                className="profile-login-cancel-button" 
                onClick={() => setIsLoginModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Calculate actual hours based on time in/out
  const calculateActualHours = (details) => {
    const { time_in, time_out } = details;
    
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

  function calculateSalary(details) {
    if (!details || !details.book_in || !details.book_end || !details.daily_rate) {
      return { 
        dailyRate: 0,
        totalAmount: 0, 
        workingDays: 0, 
        totalHours: 0,
        hoursPerDay: 0,
        hourlyRate: 0,
        explanation: 'Please fill in booking dates and daily rate'
      };
    }

    const startDate = new Date(details.book_in);
    const endDate = new Date(details.book_end);
    
    // Calculate working days based on work type
    let workingDays = 0;
    let hoursPerDay = 0;
    let totalHours = 0;
    let explanation = '';

    // Calculate actual hours per day if time in/out is provided
    const actualHoursPerDay = calculateActualHours(details);

    switch (details.work_type) {
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

    const dailyRate = parseFloat(details.daily_rate);
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
  }
};

export default Profile;