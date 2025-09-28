import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './../../../sass/components/ApplyJobModal.scss';

const ApplyJobModal = ({ job, isOpen, onClose, onSubmit, userRank }) => {
  const [formData, setFormData] = useState({
    coverLetter: '',
    resume: null
  });
  const [userProfile, setUserProfile] = useState(null);
  const [errors, setErrors] = useState({});
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
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
      const userSkills = JSON.parse(localStorage.getItem(`userSkills_${userData.id}`) || '{}');
      
      if (userData.id) {
        // If localStorage skills are empty, try to fetch from API
        if (!userSkills.primary_skills || userSkills.primary_skills.length === 0) {
          console.log('No skills in localStorage, fetching from API...');
          try {
            const response = await axios.get(`/api/workers/${userData.id}`);
            if (response.data && response.data.worker && response.data.worker.skills_id) {
              userSkills = response.data.worker.skills_id;
              console.log('Skills fetched from API:', userSkills);
            }
          } catch (apiError) {
            console.log('Could not fetch skills from API, using localStorage data');
          }
        }
        
        // Construct user profile from localStorage data
        const userProfile = {
          id: userData.id,
          email: userData.email,
          profile: {
            first_name: userData.first_name,
            middlename: userData.middlename,
            last_name: userData.last_name,
            city: userData.city,
            province: userData.province
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Clear error on change
  };


  const checkWorkerSkills = () => {
    if (!userProfile || !userProfile.worker || !userProfile.worker.skills_id) {
      console.log('No user profile or skills data found');
      return { hasRequiredSkills: false, missingSkills: job?.skills?.map(s => s.name) || [] };
    }

    const workerSkills = [];
    const skillsData = userProfile.worker.skills_id;
    
    console.log('Skills data from localStorage:', skillsData);
    
    // Get primary skills and their sub-skills
    if (skillsData.primary_skills && Array.isArray(skillsData.primary_skills) && skillsData.primary_skills.length > 0) {
      skillsData.primary_skills.forEach(skill => {
        workerSkills.push(skill.skill_name);
        if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
          workerSkills.push(...skill.sub_skills);
        }
      });
    }
    
    // Get additional skills and their sub-skills
    if (skillsData.additional_skills && Array.isArray(skillsData.additional_skills) && skillsData.additional_skills.length > 0) {
      skillsData.additional_skills.forEach(skill => {
        workerSkills.push(skill.skill_name);
        if (skill.sub_skills && Array.isArray(skill.sub_skills)) {
          workerSkills.push(...skill.sub_skills);
        }
      });
    }

    const requiredSkills = job?.skills?.map(skill => skill.name) || [];
    const hasRequiredSkills = requiredSkills.some(skill => workerSkills.includes(skill));
    const missingSkills = requiredSkills.filter(skill => !workerSkills.includes(skill));

    console.log('Worker skills:', workerSkills);
    console.log('Required skills:', requiredSkills);
    console.log('Has required skills:', hasRequiredSkills);
    console.log('Missing skills:', missingSkills);

    return { hasRequiredSkills, missingSkills, workerSkills };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.coverLetter) newErrors.coverLetter = 'Please explain yourself and your experience';
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
    const now = new Date();
    const applicationStart = new Date(job.application_start);
    const applicationDeadline = new Date(job.application_deadline);

    // Debug time comparison  
    console.log('Current time (local):', now.toLocaleString());
    console.log('Current time (UTC):', now.toISOString());
    console.log('Application start (UTC):', job.application_start);
    console.log('Application deadline (UTC):', job.application_deadline);
    console.log('Application start (local):', applicationStart.toLocaleString());
    console.log('Application deadline (local):', applicationDeadline.toLocaleString());
    console.log('Current time < Application start?', now < applicationStart);
    console.log('Current time > Application deadline?', now > applicationDeadline);

    // Check application period
    // JavaScript Date objects automatically handle timezone conversion
    console.log('Current time (local):', now.toLocaleString());
    console.log('Application start (local):', applicationStart.toLocaleString());
    console.log('Application deadline (local):', applicationDeadline.toLocaleString());
    
    // Calculate time difference
    const timeDiff = applicationStart.getTime() - now.getTime();
    const hoursUntilStart = timeDiff / (1000 * 60 * 60);
    
    console.log('Hours until application starts:', hoursUntilStart);
    console.log('Current time < Application start?', now < applicationStart);
    
    // Allow applications if start time has passed or if we're within 24 hours of start
    if (now < applicationStart && hoursUntilStart > 24) {
      showNotification(`Applications have not started yet. They will start at ${applicationStart.toLocaleString()}.`, 'error');
      return;
    }

    if (now > applicationDeadline) {
      showNotification('Application deadline has passed.', 'error');
      return;
    }

    // Check if worker has required skills
    const skillCheck = checkWorkerSkills();
    console.log('Skill check result:', skillCheck);
    
    // For testing purposes, allow applications even without required skills
    // TODO: Remove this in production
    if (!skillCheck.hasRequiredSkills && skillCheck.workerSkills.length === 0) {
      console.log('No skills found, allowing application for testing purposes');
      // Continue with application submission
    } else if (!skillCheck.hasRequiredSkills) {
      showNotification(`You don't have the required skills: ${skillCheck.missingSkills.join(', ')}`, 'error');
      return;
    }

    try {
      showNotification('Submitting application...', 'processing');
      
      // Prepare application data with user profile
      const applicationData = new FormData();
      applicationData.append('job_post_id', job.id);
      applicationData.append('worker_id', userProfile.id);
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
        worker_id: userProfile.id,
        cover_letter: formData.coverLetter,
        skills: skillsArray,
        resume: formData.resume ? formData.resume.name : 'No resume'
      });

      // Submit application to backend
      const response = await axios.post('/api/job-applications/apply', applicationData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.status === 201) {
        showNotification('Application submitted successfully!', 'success');
        setTimeout(() => {
          onSubmit(formData);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Failed to submit application. Please try again.', 'error');
      }
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>Apply for {job?.job_title || 'Job'}</h2>
        <div className="adminmodal-content">
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
                  <p><strong>Name:</strong> {userProfile.profile?.first_name} {userProfile.profile?.middlename} {userProfile.profile?.last_name}</p>
                  <p><strong>Email:</strong> {userProfile.email}</p>
                  <p><strong>Location:</strong> {userProfile.profile?.city}, {userProfile.profile?.province}</p>
                  <p><strong>Rank:</strong> {userProfile.worker?.rank?.name || 'Not specified'}</p>
                </div>
              </div>

              <div className="form-group">
                <label>Explain Yourself</label>
                <textarea
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleChange}
                  placeholder="Tell us about your experience and how you're good at the required skills. Explain why you're the right fit for this job and what makes you stand out."
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
        <div className="adminmodal-buttons">
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