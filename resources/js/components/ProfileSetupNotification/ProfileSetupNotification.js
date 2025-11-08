import React, { useState, useEffect } from 'react';
import { IconUser, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import '../../../sass/components/_profilesetupnotification.scss';

const ProfileSetupNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Only show notification for workers (role_id === 1), not for employers (role_id === 2)
      if (parsedUser.role_id === 1) {
        const checkProfile = async () => {
          try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
              setIsVisible(true);
              return;
            }
            
            // Always check backend first to get current state, regardless of localStorage
            const response = await fetch(`${window.location.origin}/api/workers/${parsedUser.id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
            });
            
            if (!response.ok) {
              setIsVisible(true);
              return;
            }
            
            const profileData = await response.json();
            const skills = profileData?.worker?.skills_id || {};
            const primarySkills = Array.isArray(skills.primary_skills) ? skills.primary_skills : [];
            const additionalSkills = Array.isArray(skills.additional_skills) ? skills.additional_skills : [];
            const totalSkills = primarySkills.length + additionalSkills.length;
            const hasCredentials = Array.isArray(profileData?.worker?.credentials_name) && 
                                 profileData.worker.credentials_name.filter(name => name && name.trim() !== '').length > 0;
            
            // Check if profile is complete based on backend data
            if (totalSkills >= 2 && hasCredentials) {
              // Profile is complete - update localStorage and hide notification
              localStorage.setItem(`skillsStepCompleted_${parsedUser.id}`, 'true');
              localStorage.setItem(`isProfileComplete_${parsedUser.id}`, 'true');
              setIsProfileComplete(true);
              setIsVisible(false);
              console.log('Profile is complete - hiding notification');
            } else {
              // Profile is incomplete - clear localStorage flags and show notification
              localStorage.setItem(`skillsStepCompleted_${parsedUser.id}`, 'false');
              localStorage.setItem(`isProfileComplete_${parsedUser.id}`, 'false');
              setIsProfileComplete(false);
              setIsVisible(true);
              console.log('Profile is incomplete - showing notification');
            }
          } catch (error) {
            console.error('Error checking profile:', error);
            // On error, check localStorage as fallback
            const isComplete = localStorage.getItem(`isProfileComplete_${parsedUser.id}`);
            const skillsCompleted = localStorage.getItem(`skillsStepCompleted_${parsedUser.id}`);
            
            // Only hide notification if we're certain from localStorage (and it's a network error)
            if (isComplete === 'true' || skillsCompleted === 'true') {
              setIsProfileComplete(true);
              setIsVisible(false);
            } else {
              setIsVisible(true);
            }
          }
        };
        checkProfile();
      }
    }
  }, []);

  const handleCompleteProfile = () => {
    navigate('/skill-rating');
  };

  if (!isVisible || !user || user.role_id !== 1 || isProfileComplete) {
    return null;
  }

  return (
    <div className="profile-setup-notification">
      <div className="notification-content">
        <div className="notification-icon">
          <IconUser size={24} />
        </div>
        <div className="notification-text">
          <h4>Complete Setup Your Profile</h4>
        </div>
        <div className="notification-actions">
          <button className="complete-btn" onClick={handleCompleteProfile}>
            Complete Now
            <IconArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupNotification;
