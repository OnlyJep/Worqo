import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye } from 'react-icons/fa';
import { compareWithPhilippinesTime } from '../../utils/dateUtils';
import './../../../sass/components/ApplyJobModal.scss';

const ApplyJobModal = ({ job, isOpen, onClose, onSubmit, userRank, onViewApplications }) => {
  const [formData, setFormData] = useState({
    coverLetter: '',
    resume: null
  });
  const [userProfile, setUserProfile] = useState(null);
  const [userContact, setUserContact] = useState(null);
  const [errors, setErrors] = useState({});
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
      fetchUserContact();
      setFormData({ coverLetter: '', resume: null });
      setErrors({});
      setApplicationStatus(null);
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const currentUser = userData.user || userData || {};
      const userSkills = JSON.parse(localStorage.getItem(`userSkills_${currentUser.id}`) || '{}');
      
      if (currentUser.id) {
        let profileId = currentUser.profile_id;
        
        // If localStorage skills are empty OR profile_id is missing, try to fetch from API
        if (!userSkills.primary_skills || userSkills.primary_skills.length === 0 || !profileId) {
          console.log('Fetching worker data from API...');
          try {
            const authToken = localStorage.getItem("auth_token");
            const response = await axios.get(`/api/workers/${currentUser.id}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
              }
            });
            
            if (response.data) {
              // Get profile_id from API response if missing
              if (!profileId && response.data.profile && response.data.profile.id) {
                profileId = response.data.profile.id;
                console.log('Profile ID fetched from API:', profileId);
              }
              
              // Get skills from API response if missing
              if ((!userSkills.primary_skills || userSkills.primary_skills.length === 0) && 
                  response.data.worker && response.data.worker.skills_id) {
                userSkills = response.data.worker.skills_id;
                console.log('Skills fetched from API:', userSkills);
              }
            }
          } catch (apiError) {
            console.log('Could not fetch data from API, using localStorage data');
          }
        }
        
        // If profile_id is still missing, use user id as fallback
        // Note: This may fail backend validation if user id is not a valid profile id
        const finalProfileId = profileId || currentUser.id;
        
        // Construct user profile from localStorage data
        const userProfile = {
          id: currentUser.id,
          profile_id: finalProfileId, // Use profile_id from API or localStorage
          email: currentUser.email,
          profile: {
            first_name: currentUser.first_name,
            middlename: currentUser.middlename,
            last_name: currentUser.last_name,
            city: currentUser.city,
            province: currentUser.province,
            profile_img: currentUser.profile_img
          },
          worker: {
            skills_id: userSkills
          }
        };
        
        console.log('User profile from localStorage:', userProfile);
        setUserProfile(userProfile);
      } else {
        throw new Error('No user data found in localStorage');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      showNotification('Failed to load profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserContact = async () => {
    try {
      const localStorageData = JSON.parse(localStorage.getItem("user") || '{}');
      const userData = localStorageData.user || localStorageData;
      
      if (userData.id) {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`http://127.0.0.1:8000/api/users/${userData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          const profileData = responseData.user || responseData;
          
          setUserContact({
            contact_number: profileData.contact_number || 'Not provided'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user contact:', error);
      setUserContact({ contact_number: 'Not available' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Clear error on change
  };


  // Check worker skills for informational purposes only - no longer blocks application
  const checkWorkerSkills = () => {
    if (!userProfile || !userProfile.worker || !userProfile.worker.skills_id) {
      console.log('No user profile or skills data found');
      return { hasRequiredSkills: false, missingSkills: job?.skills?.map(s => s.name) || [] };
    }

    const workerSkills = [];
    const skillsData = userProfile.worker.skills_id;
    
    console.log('Skills data from localStorage:', skillsData);
    
    // Get primary skills and their sub-skills with experience levels
    if (skillsData.primary_skills && Array.isArray(skillsData.primary_skills) && skillsData.primary_skills.length > 0) {
      skillsData.primary_skills.forEach(skill => {
        workerSkills.push({
          name: skill.skill_name,
          experience: skill.experience || 'No experience'
        });
        if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
          skill.sub_skills.forEach(subSkill => {
            workerSkills.push({
              name: subSkill,
              experience: skill.experience || 'No experience'
            });
          });
        }
      });
    }
    
    // Get additional skills and their sub-skills with experience levels
    if (skillsData.additional_skills && Array.isArray(skillsData.additional_skills) && skillsData.additional_skills.length > 0) {
      skillsData.additional_skills.forEach(skill => {
        workerSkills.push({
          name: skill.skill_name,
          experience: skill.experience || 'No experience'
        });
        if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
          skill.sub_skills.forEach(subSkill => {
            workerSkills.push({
              name: subSkill,
              experience: skill.experience || 'No experience'
            });
          });
        }
      });
    }

    const requiredSkills = job?.skills || [];
    
    // Helper function to normalize skill names for comparison
    const normalizeSkillName = (name) => {
      return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    };
    
    // Check if worker has at least one of the required skills with sufficient experience
    const hasRequiredSkills = requiredSkills.some(requiredSkill => {
      const workerSkill = workerSkills.find(ws => {
        // Try exact match first
        if (ws.name === requiredSkill.name) return true;
        
        // Try normalized match
        if (normalizeSkillName(ws.name) === normalizeSkillName(requiredSkill.name)) return true;
        
        // Try partial match (in case one is a subset of the other)
        const workerNormalized = normalizeSkillName(ws.name);
        const requiredNormalized = normalizeSkillName(requiredSkill.name);
        return workerNormalized.includes(requiredNormalized) || requiredNormalized.includes(workerNormalized);
      });
      
      if (!workerSkill) return false;
      
      // If worker has the skill, check experience level
      return checkExperienceLevel(workerSkill.experience, requiredSkill.experience);
    });
    
    // Only show missing skills if worker has NO matching skills at all
    const missingSkills = hasRequiredSkills ? [] : requiredSkills.filter(requiredSkill => {
      const workerSkill = workerSkills.find(ws => {
        // Try exact match first
        if (ws.name === requiredSkill.name) return true;
        
        // Try normalized match
        if (normalizeSkillName(ws.name) === normalizeSkillName(requiredSkill.name)) return true;
        
        // Try partial match
        const workerNormalized = normalizeSkillName(ws.name);
        const requiredNormalized = normalizeSkillName(requiredSkill.name);
        return workerNormalized.includes(requiredNormalized) || requiredNormalized.includes(workerNormalized);
      });
      
      if (!workerSkill) return true;
      
      // If worker has the skill but insufficient experience, it's missing
      return !checkExperienceLevel(workerSkill.experience, requiredSkill.experience);
    });

    console.log('Worker skills:', workerSkills);
    console.log('Required skills:', requiredSkills);
    console.log('Has required skills:', hasRequiredSkills);
    console.log('Missing skills:', missingSkills);

    return { hasRequiredSkills, missingSkills, workerSkills };
  };

  const checkExperienceLevel = (workerExperience, requiredExperience) => {
    // Define experience levels hierarchy
    const experienceLevels = {
      'No experience': 0,
      'Beginner (0-1 years)': 1,
      'Beginner': 1,
      'Intermediate (1-3 years)': 2,
      'Intermediate': 2,
      'Advanced (3-5 years)': 3,
      'Advanced': 3,
      'Expert (5+ years)': 4,
      'Expert': 4
    };

    // Extract years from experience strings like "1-2-years" or "3-5 years"
    const extractYears = (experienceStr) => {
      if (!experienceStr) return 0;
      
      // Handle formats like "1-2-years", "3-5 years", "5+ years"
      const yearMatch = experienceStr.match(/(\d+)(?:-(\d+))?(?:\+)?/);
      if (yearMatch) {
        const minYears = parseInt(yearMatch[1]);
        const maxYears = yearMatch[2] ? parseInt(yearMatch[2]) : minYears;
        return Math.max(minYears, maxYears); // Use the higher value for comparison
      }
      
      // Fallback to predefined levels
      return experienceLevels[experienceStr] || 0;
    };

    const workerLevel = extractYears(workerExperience);
    const requiredLevel = extractYears(requiredExperience);

    console.log(`Experience comparison: Worker "${workerExperience}" (${workerLevel}) vs Required "${requiredExperience}" (${requiredLevel})`);

    // Worker can apply if their experience level is equal to or higher than required
    return workerLevel >= requiredLevel;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.coverLetter) newErrors.coverLetter = 'Please explain your experience related to this job';
    if (!formData.resume) newErrors.resume = 'Resume is required';
    return newErrors;
  };

  const showNotification = (message, type = 'error') => {
    setApplicationStatus({ message, type });
    setTimeout(() => setApplicationStatus(null), 5000); // Auto-hide after 5 seconds
  };

  const handleSubmit = async () => {
    console.log('Form data:', formData);
    console.log('User profile:', userProfile);
    console.log('Job data:', job);
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    // Check if job is still accepting applications
    // Get current time in Philippines timezone
    const now = new Date();
    const phNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    
    // Parse job dates and convert to Philippines time for comparison
    const applicationStart = new Date(new Date(job.application_start).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const applicationDeadline = new Date(new Date(job.application_deadline).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

    // Debug time comparison  
    console.log('Current time (Philippines):', phNow.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    console.log('Application start (Philippines):', applicationStart.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    console.log('Application deadline (Philippines):', applicationDeadline.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    
    // Calculate time difference in milliseconds
    const timeDiff = applicationStart.getTime() - phNow.getTime();
    const hoursUntilStart = timeDiff / (1000 * 60 * 60);
    
    console.log('Hours until application starts:', hoursUntilStart);
    console.log('Current time < Application start?', phNow < applicationStart);
    
    // Allow applications if start time has passed or if we're within 24 hours of start
    if (phNow < applicationStart && hoursUntilStart > 24) {
      const startDateStr = applicationStart.toLocaleString('en-US', { 
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      showNotification(`Applications have not started yet. They will start on ${startDateStr} (Philippines time).`, 'error');
      return;
    }

    if (phNow > applicationDeadline) {
      showNotification('Application deadline has passed.', 'error');
      return;
    }

    // Check hiring type and application limits
    console.log('Job hiring type:', job.hiring_type);
    console.log('Job application count:', job.application_count);
    
    if (job.hiring_type === 'individual') {
      // For individual hiring: only 1 person can be accepted, but more can apply
      // Job becomes invisible in findjob.js only when someone is accepted (not just applied)
      console.log('Individual hiring type - checking if job is still accepting applications');
      // Individual jobs can accept applications until someone is hired/accepted
      // The visibility logic is handled in findjob.js based on accepted applications
    } else if (job.hiring_type === 'team') {
      // For team hiring: up to 20 people can apply and multiple can be accepted
      if (job.application_count >= 20) {
        showNotification('This team position has reached the maximum number of applications (20).', 'error');
        return;
      }
    }

    // Check worker skills for informational purposes only
    const skillCheck = checkWorkerSkills();
    console.log('Skill check result:', skillCheck);
    
    // Skills are now optional - workers can apply regardless of skill match
    // The skill check is kept for informational purposes and employer review

    try {
      showNotification('Submitting application...', 'processing');
      
      // Use profile_id for worker_id (must exist in profiles table)
      const workerId = userProfile.profile_id || userProfile.id;
      
      if (!workerId) {
        showNotification('Unable to determine worker profile. Please log in again.', 'error');
        return;
      }
      
      // Prepare application data with user profile
      const applicationData = new FormData();
      applicationData.append('job_post_id', job.id);
      applicationData.append('worker_id', workerId);
      applicationData.append('cover_letter', formData.coverLetter);
      
      // Convert skills object to array format
      const skillsArray = [];
      const skillsData = userProfile.worker?.skills_id || {};
      
      // Add primary skills
      if (skillsData.primary_skills && Array.isArray(skillsData.primary_skills)) {
        skillsData.primary_skills.forEach(skill => {
          skillsArray.push(skill.skill_name);
          if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
            skillsArray.push(...skill.sub_skills);
          }
        });
      }
      
      // Add additional skills
      if (skillsData.additional_skills && Array.isArray(skillsData.additional_skills)) {
        skillsData.additional_skills.forEach(skill => {
          skillsArray.push(skill.skill_name);
          if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
            skillsArray.push(...skill.sub_skills);
          }
        });
      }
      
      // Send skills as array, not JSON string
      skillsArray.forEach(skill => {
        applicationData.append('skills[]', skill);
      });
      
      // Add resume file if provided
      if (formData.resume) {
        applicationData.append('resume', formData.resume);
      }
      
      console.log('Submitting application data:', {
        job_post_id: job.id,
        worker_id: workerId,
        cover_letter: formData.coverLetter,
        skills: skillsArray,
        resume: formData.resume ? formData.resume.name : 'No resume'
      });

      // Submit application to backend
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.post('/api/job-applications/apply', applicationData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 201) {
        // Show success message
        showNotification('Application has been submitted!', 'success');
        
        setTimeout(() => {
          onSubmit(formData);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = Object.values(error.response.data.errors).flat();
        showNotification(errorMessages.join(', '), 'error');
      } else {
        showNotification('Failed to submit application. Please try again.', 'error');
      }
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="applyjobmodal-overlay">
      <div className="applyjobmodal">
        <div className="modal-header">
          <h2>Apply for {job?.job_title || 'Job'}</h2>
          <div className="header-actions">
            {onViewApplications && (
              <button 
                className="view-applications-btn"
                onClick={() => onViewApplications(job)}
                title="View Applications"
              >
                <FaEye />
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
        </div>
        <div className="applyjobmodal-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your profile...</p>
            </div>
          ) : userProfile ? (
            <>
              <div className="profile-info">
                <h3>Your Profile Information</h3>
                <div className="profile-details">
                  <div className="profile-image-section">
                    <img 
                      src={userProfile.profile?.profile_img 
                        ? `http://127.0.0.1:8000/storage/${userProfile.profile.profile_img}` 
                        : "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg"
                      } 
                      alt="Profile" 
                      className="profile-image"
                      onError={(e) => {
                        e.target.src = "http://127.0.0.1:8000/storage/profiles/defaultpfp.jpg";
                      }}
                    />
                  </div>
                  <div className="profile-text-details">
                    <p><strong>Name:</strong> {userProfile.profile?.first_name} {userProfile.profile?.middlename} {userProfile.profile?.last_name}</p>
                    <p><strong>Email:</strong> {userProfile.email}</p>
                    <p><strong>Contact Number:</strong> {userContact?.contact_number || 'Not provided'}</p>
                    <p><strong>Location:</strong> {userProfile.profile?.city}, {userProfile.profile?.province}</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Do you have any experience related to this job? Explain</label>
                <textarea
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleChange}
                  placeholder="Tell us about your experience and skills. Even if you don't have all the desired skills, explain how you can contribute to this job."
                />
                {errors.coverLetter && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.coverLetter}</span>}
              </div>

              <div className="form-group">
                <label>Resume/CV</label>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData(prev => ({ ...prev, resume: e.target.files[0] }))}
                />
                {errors.resume && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.resume}</span>}
              </div>
            </>
          ) : (
            <div className="error-state">
              <p>Failed to load your profile. Please try again.</p>
            </div>
          )}
        </div>
        <div className="applyjobmodal-buttons">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="submit-button" onClick={handleSubmit}>
            Submit Application
          </button>
        </div>
        {applicationStatus && (
          <div className={`notification ${applicationStatus.type}`}>
            <p>{applicationStatus.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyJobModal;