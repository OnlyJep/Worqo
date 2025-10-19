import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './../../../sass/components/profile.scss';
import Headerz from "../HeaderContent/Headerz";
import profilePhoto from '../../../../resources/sass/img/pfp.svg';
import coverPhoto from '../../../../resources/sass/img/coverphoto.svg';
import BookModal from './BookModal';
import Loader from "../LoaderContent/loader";
import { message } from 'antd';

const Profile = ({ initialServiceType }) => {
  const { workerId } = useParams();
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
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

  // Subscription plans
  const subscriptionPlans = {
    monthly: {
      name: "Monthly Plan",
      price: 299,
      period: "month",
      features: ["View contact information", "Access to worker profiles", "Priority support"]
    },
    yearly: {
      name: "Yearly Plan", 
      price: 2999,
      period: "year",
      features: ["View contact information", "Access to worker profiles", "Priority support", "Save 17%"]
    }
  };

  const handleContactClick = () => {
    setIsSubscriptionModalOpen(true);
  };

  const handlePlanSelect = (planType) => {
    setSelectedPlan(planType);
  };

  const handlePayment = (paymentMethod) => {
    // Handle payment logic here
    console.log(`Processing ${paymentMethod} payment for ${selectedPlan} plan`);
    message.success(`Payment processed successfully! You now have access to contact information.`);
    setIsSubscriptionModalOpen(false);
    setSelectedPlan(null);
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
    const fetchWorkerData = async () => {
      try {
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
          const response = await axios.get(`http://127.0.0.1:8000/api/workers/${workerId}`, {
            headers,
            timeout: 10000,
          });
          workerData = response.data;
        } catch (apiError) {
          // If the API call fails, it means the user is not a worker
          if (apiError.response?.status === 404) {
            setError("This user is not a worker. Only worker profiles can be viewed here.");
            setLoading(false);
            return;
          }
          throw apiError; // Re-throw if it's not a 404 error
        }

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
          setError("This user is not a worker. Only worker profiles can be viewed here.");
          setLoading(false);
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
          preferred_working_days: workerData.worker?.preferred_working_days || [],
        };

        console.log("Formatted worker data:", formattedWorker);
        setWorker(formattedWorker);
      } catch (error) {
        console.error("Error fetching worker data:", error.response?.data || error.message);
        setError("Failed to load worker profile. Please try again later.");
        message.error("Failed to load worker profile.");
      } finally {
        setLoading(false);
      }
    };

    if (workerId) {
      fetchWorkerData();
      fetchWorkerReviews();
    }
  }, [workerId]);

  // Fetch worker reviews
  const fetchWorkerReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/reviews/worker/${workerId}`, {
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

  const handleBookingSubmit = async (details) => {
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
        service_type: details.service_type,
        work_type: details.work_type,
        description: details.description,
        book_in: formatDateTime(details.book_in),
        book_end: formatDateTime(details.book_end),
        time_in: details.time_in,
        time_out: details.time_out,
        daily_rate: parseFloat(details.daily_rate) || 0
      };

      console.log('Sending booking data:', bookingData);

      const response = await axios.post('http://127.0.0.1:8000/api/bookings', bookingData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        message.success("Booking request sent successfully!");
        setBookingDetails(details);
        setIsBookingModalOpen(false);
        setIsConfirmationModalOpen(true);
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

  const handleConfirmBooking = () => {
    setIsConfirmationModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  if (loading) {
    return (
      <div className="profile-worker-page">
        <Headerz />
        <div className="profile-loading-container">
          <Loader />
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="profile-worker-page">
        <Headerz />
        <div className="profile-error-container">
          <p className="profile-error-message">{error || "Worker not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-worker-page">
      <Headerz />
      <div className="profile-worker-header">
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

      <div className="profile-worker-container">
        <div className="profile-worker-left">
          <div className="profile-worker-info">
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
            <button className="profile-edit-profile" onClick={handleHireNowClick}>
              HIRE NOW
            </button>
          </div>
          <div className="profile-rank-display-section">
            {workerRank ? (
              <div className="profile-rank-display">
                <img 
                  src={`http://127.0.0.1:8000/storage/${workerRank.image}`}
                  alt={`${workerRank.name} Rank`}
                  className="profile-worker-rank-badge"
                  title={`${workerRank.name} Rank - ${totalPoints.toLocaleString()} points`}
                />
                <div className="profile-rank-progress">
                  <div className="progress-info">
                    <span className="profile-rank-name">{workerRank.name}</span>
                    <span className="points-text">{totalPoints.toLocaleString()} pts</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className={`progress-bar-fill rank-${workerRank.name.toLowerCase()}`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <span className="progress-label">
                    {workerRank.max_points 
                      ? `${totalPoints.toLocaleString()} / ${workerRank.max_points.toLocaleString()}`
                      : `${totalPoints.toLocaleString()} pts`
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="profile-rank-display">
                <div className="rank-loading">Loading rank...</div>
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
                {worker.preferred_working_days && worker.preferred_working_days.length > 0 
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

        <div className="profile-worker-right">
          <div className="profile-tabs">
            {['OVERVIEW', 'CREDENTIALS', 'REVIEWS'].map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
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
                            <span key={star} className={star <= Math.round(averageRating) ? 'star filled' : 'star'}>
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
                                  <span key={star} className={star <= review.rating ? 'star filled' : 'star'}>
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

      {/* Confirmation Modal */}
      {isConfirmationModalOpen && (
        <div className="profile-adminmodal-overlay">
          <div className="profile-adminmodal">
            <h2>Planning Summary</h2> {/* Removed X button */}
            <div className="profile-adminmodal-content">
              <div className="profile-form-group">
                <label>Worker</label>
                <input type="text" value={worker.name} readOnly disabled />
              </div>
              <div className="profile-form-group">
                <label>Service Type</label>
                <input type="text" value={bookingDetails.service_type} readOnly disabled />
              </div>
              <div className="profile-form-group">
                <label>Work Type</label>
                <input type="text" value={bookingDetails.work_type} readOnly disabled />
              </div>
              <div className="profile-form-group">
                <label>Book In</label>
                <input type="text" value={bookingDetails.book_in} readOnly disabled />
              </div>
              <div className="profile-form-group">
                <label>Book End</label>
                <input type="text" value={bookingDetails.book_end} readOnly disabled />
              </div>
              <div className="profile-form-group">
                <label>Description</label>
                <textarea value={bookingDetails.description} readOnly disabled />
              </div>
              <div className="profile-form-group">
                <label>Estimated Cost</label>
                <div>
                  Hours: {bookingDetails ? calculateSalary(bookingDetails).hours : '0'}<br />
                  Total: ₱{bookingDetails ? calculateSalary(bookingDetails).total : '0.00'}
                </div>
              </div>
            </div>
            <div className="profile-adminmodal-buttons">
              <button className="profile-cancel-button" onClick={() => setIsConfirmationModalOpen(false)}>
                Cancel
              </button>
              <button className="profile-submit-button" onClick={handleConfirmBooking}>
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="profile-adminmodal-overlay">
          <div className="profile-adminmodal">
            <h2>Booking Successful</h2> {/* Removed X button */}
            <div className="profile-adminmodal-content">
              <div className="profile-form-group">
                <p>Thank you for booking this applicant. Please note that the status is currently pending.</p>
              </div>
            </div>
            <div className="profile-adminmodal-buttons">
              <button className="submit-button" onClick={() => setIsSuccessModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {isSubscriptionModalOpen && (
        <div className="profile-adminmodal-overlay">
          <div className="profile-adminmodal subscription-modal">
            <h2>Upgrade to Premium</h2>
            <p className="profile-modal-subtitle">Unlock contact information and premium features</p>
            
            <div className="profile-subscription-plans">
              <div 
                className={`plan-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                onClick={() => handlePlanSelect('monthly')}
              >
                <h3>{subscriptionPlans.monthly.name}</h3>
                <div className="price">
                  <span className="profile-currency">₱</span>
                  <span className="profile-amount">{subscriptionPlans.monthly.price}</span>
                  <span className="period">/{subscriptionPlans.monthly.period}</span>
                </div>
                <ul className="profile-features">
                  {subscriptionPlans.monthly.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div 
                className={`plan-card ${selectedPlan === 'yearly' ? 'selected' : ''}`}
                onClick={() => handlePlanSelect('yearly')}
              >
                <h3>{subscriptionPlans.yearly.name}</h3>
                <div className="price">
                  <span className="profile-currency">₱</span>
                  <span className="amount">{subscriptionPlans.yearly.price}</span>
                  <span className="period">/{subscriptionPlans.yearly.period}</span>
                </div>
                <ul className="profile-features">
                  {subscriptionPlans.yearly.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <div className="profile-savings-badge">Save 17%</div>
              </div>
            </div>

            {selectedPlan && (
              <div className="payment-methods">
                <h4>Choose Payment Method</h4>
                <div className="payment-options">
                  <button 
                    className="payment-btn gcash"
                    onClick={() => handlePayment('GCash')}
                  >
                    <span className="payment-icon">💳</span>
                    GCash
                  </button>
                  <button 
                    className="payment-btn debit"
                    onClick={() => handlePayment('Debit Card')}
                  >
                    <span className="payment-icon">💳</span>
                    Debit Card
                  </button>
                  <button 
                    className="payment-btn credit"
                    onClick={() => handlePayment('Credit Card')}
                  >
                    <span className="payment-icon">💳</span>
                    Credit Card
                  </button>
                  <button 
                    className="payment-btn paypal"
                    onClick={() => handlePayment('PayPal')}
                  >
                    <span className="payment-icon">💳</span>
                    PayPal
                  </button>
                </div>
              </div>
            )}

            <div className="profile-adminmodal-buttons">
              <button 
                className="profile-cancel-button" 
                onClick={() => {
                  setIsSubscriptionModalOpen(false);
                  setSelectedPlan(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="profile-adminmodal-overlay">
          <div className="profile-adminmodal login-modal">
            <h2>Sign In Required</h2>
            <p className="profile-modal-subtitle">You need to be logged in to book this worker</p>
            
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

            <div className="profile-adminmodal-buttons">
              <button 
                className="profile-cancel-button" 
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

  function calculateSalary(details) {
    if (!details.book_in || !details.book_end || !details.daily_rate) return { total: 0, hours: 0 };
    const start = new Date(details.book_in);
    const end = new Date(details.book_end);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dailyRate = parseFloat(details.daily_rate) || 0;
    const total = dailyRate * diffDays;
    return { total: total.toFixed(2), hours: diffDays };
  }
};

export default Profile;