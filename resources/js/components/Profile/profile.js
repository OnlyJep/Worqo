import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

  // Helper function to get rank based on experience
  const getRankByExperience = (experience) => {
    switch (experience) {
      case '0-11-months':
        return { name: 'Bronze', image: 'img/rank/chOmYCPss4v5FLPv4M309dB0qzCKIxG0WRThxD9i.jpg' };
      case '1-2-years':
        return { name: 'Silver', image: 'img/rank/pp1cpyZuiQcpUy44geQdA6GtN5DzvJBZu1Jra53H.png' };
      case '2-5-years':
        return { name: 'Gold', image: 'img/rank/aTxm30AVX6eA2bX8ICZLRskw66eg9pBgibzhutXO.jpg' };
      case '5-10-years':
        return { name: 'Diamond', image: 'img/rank/BT3ZPIEvlO4KYEsUpPhD6jVQyskw0tPknV43CoY1.jpg' };
      default:
        return { name: 'Bronze', image: 'img/rank/chOmYCPss4v5FLPv4M309dB0qzCKIxG0WRThxD9i.jpg' };
    }
  };


  // Check if user is logged in
  const isLoggedIn = () => {
    const authToken = localStorage.getItem("auth_token");
    return !!authToken;
  };

  // Handle Hire Now button click
  const handleHireNowClick = () => {
    if (!isLoggedIn()) {
      setIsLoginModalOpen(true);
    } else {
      setIsBookingModalOpen(true);
    }
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
          console.log('Making API call to:', `http://127.0.0.1:8000/api/workers/${resolvedWorkerId}`);
          const response = await axios.get(`http://127.0.0.1:8000/api/workers/${resolvedWorkerId}`, {
            headers,
            timeout: 10000,
          });
          workerData = response.data;
          console.log('API response received:', workerData);
        } catch (apiError) {
          // If the API call fails, it means the user is not a worker
          if (apiError.response?.status === 404) {
            if (isMounted) {
              setError("This user is not a worker. Only worker profiles can be viewed here.");
              setLoading(false);
            }
            return;
          }
          throw apiError; // Re-throw if it's not a 404 error
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
          status: "ACTIVE NOW", // Since we only show ACCEPTED workers
          hourlyRate: workerData.worker?.skills_id?.primary_skills?.[0]?.hourly_rate 
            ? parseFloat(workerData.worker.skills_id.primary_skills[0].hourly_rate) 
            : 150.00,
          description: workerData.worker?.bio || "No bio available",
          work_type: workerData.worker?.work_type || 'part-time',
          hours_per_day: workerData.worker?.hours_per_day || 4,
          monthly_salary: workerData.worker?.monthly_salary || null,
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

  // Fetch worker reviews
  const fetchWorkerReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/reviews/worker/${resolvedWorkerId}`, {
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
        const response = await axios.get('http://127.0.0.1:8000/api/ranks', {
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

      const bookingData = {
        worker_id: worker.id,
        service_type: bookingDetails.service_type,
        sub_skill: bookingDetails.sub_skill || null,
        work_type: bookingDetails.work_type,
        description: bookingDetails.description,
        book_in: formatDateTime(bookingDetails.book_in),
        book_end: formatDateTime(bookingDetails.book_end),
        time_in: bookingDetails.time_in || null,
        time_out: bookingDetails.time_out || null,
        daily_rate: parseFloat(bookingDetails.daily_rate),
        total_salary: parseFloat(bookingDetails.total_salary) || null,
      };

      const response = await axios.post('http://127.0.0.1:8000/api/bookings', bookingData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success("Booking request sent successfully!");
        setIsConfirmationModalOpen(false);
        setIsSuccessModalOpen(true);
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
              : profilePhoto
            } 
            alt="Profile" 
            className="profile-photo" 
          />
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-left">
          <div className="profile-info">
            <div className="profile-name-container">
              <h2>{worker.name}</h2>
               <div className="profile-badges-container">
                 {(worker.verified === true || worker.verified === 1) && (
                   <div className="profile-verified-badge" title="Verified Worker">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="#4CAF50"/>
                     </svg>
                   </div>
                 )}
               </div>
            </div>
            <div className="profile-status-container">
              <span className="profile-status-dot"></span>
              <p className="profile-status">{worker.status === "ACTIVE NOW" ? "Available now" : worker.status}</p>
            </div>
            <p className="profile-location">{worker.location}</p>
            <button className="profile-hire-button" onClick={handleHireNowClick}>
              HIRE NOW
            </button>
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
                                  src={`http://127.0.0.1:8000/storage/${skillRank.image}`} 
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
                                  src={`http://127.0.0.1:8000/storage/${skillRank.image}`} 
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

      <BookModal
        worker={worker}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={(details) => handleBookingSubmit(details)}
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