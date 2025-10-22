import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye } from 'react-icons/fa';
import '../../../sass/components/profilesettings/EditMyJob.scss';

const EditMyJob = ({ application, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    cover_letter: '',
    resume: null
  });
  const [userProfile, setUserProfile] = useState(null);
  const [userContact, setUserContact] = useState(null);
  const [errors, setErrors] = useState({});
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && application) {
      fetchUserProfile();
      fetchUserContact();
      setFormData({ 
        cover_letter: application.cover_letter || '', 
        resume: null 
      });
      setErrors({});
      setApplicationStatus(null);
    }
  }, [isOpen, application]);

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
            province: userData.province,
            profile_img: userData.profile_img
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.cover_letter) newErrors.cover_letter = 'Please explain yourself and your experience';
    return newErrors;
  };

  const showNotification = (message, type = 'error') => {
    setApplicationStatus({ message, type });
    setTimeout(() => setApplicationStatus(null), 5000); // Auto-hide after 5 seconds
  };

  const handleSubmit = async () => {
    console.log('Form data:', formData);
    console.log('Application:', application);
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      showNotification('Updating application...', 'processing');
      
      // Prepare application data
      const applicationData = new FormData();
      
      // Ensure cover letter is not empty and properly set
      const coverLetterValue = formData.cover_letter?.trim() || '';
      
      if (!coverLetterValue) {
        showNotification('Cover letter is required', 'error');
        return;
      }
      
      applicationData.append('cover_letter', coverLetterValue);
      
      // Add resume file if provided
      if (formData.resume) {
        applicationData.append('resume', formData.resume);
      }

      // Update application via backend
      const authToken = localStorage.getItem("auth_token");
      const response = await axios.post(`http://127.0.0.1:8000/api/job-applications/${application.id}/update`, applicationData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 200 || response.status === 201) {
        // Show success message
        showNotification('Application has been updated!', 'success');
        
        setTimeout(() => {
          onSubmit(formData);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating application:', error);
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
        showNotification('Failed to update application. Please try again.', 'error');
      }
    }
  };

  if (!isOpen || !application) return null;

  return (
    <div className="editmyjob-overlay">
      <div className="editmyjob">
        <div className="modal-header">
          <h2>Edit Application for {application?.job_post?.job_title || 'Job'}</h2>
          <div className="header-actions">
            <button className="close-btn" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
        </div>
        <div className="editmyjob-content">
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
                    <p><strong>Rank:</strong> {userProfile.worker?.rank?.name || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Update Your Cover Letter</label>
                <textarea
                  name="cover_letter"
                  value={formData.cover_letter}
                  onChange={handleChange}
                  placeholder="Update your experience and skills description for this job."
                />
                {errors.cover_letter && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.cover_letter}</span>}
              </div>

              <div className="form-group">
                <label>Update Resume/CV (Optional)</label>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData(prev => ({ ...prev, resume: e.target.files[0] }))}
                />
                <small>Leave empty to keep your current resume</small>
              </div>

              {application.resume_path && (
                <div className="current-resume">
                  <p><strong>Current Resume:</strong> 
                    <a 
                      href={`http://127.0.0.1:8000/storage/${application.resume_path}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="resume-link"
                    >
                      View Current Resume
                    </a>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="error-state">
              <p>Failed to load your profile. Please try again.</p>
            </div>
          )}
        </div>
        <div className="editmyjob-buttons">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="submit-button" onClick={handleSubmit}>
            Update Application
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

export default EditMyJob;
