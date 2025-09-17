import React, { useState, useEffect } from 'react';
import './../../../sass/components/HomepageStyles/homepage.scss';
import Headerz from '../HeaderContent/Headerz';
import Stats from '../StatsContent/stats';
import Footer from '../FooterContent/footer';
import SkillRatingModal from '../SkillRatingModal/SkillRatingModal';
import { IconSearch } from '@tabler/icons-react';

const HomePage = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('HomePage: Loaded user from localStorage:', parsedUser);
      setUser(parsedUser);

      if (parsedUser.role_id === 1) {
        const checkProfile = async () => {
          console.log('Checking profile for user:', parsedUser.id);
          const isComplete = localStorage.getItem(`isProfileComplete_${parsedUser.id}`);
          const skillsCompleted = localStorage.getItem(`skillsStepCompleted_${parsedUser.id}`);
          console.log('LocalStorage - isProfileComplete:', isComplete, 'skillsStepCompleted:', skillsCompleted);

          if (isComplete === 'true' || skillsCompleted === 'true') {
            console.log('Profile or skills completed in localStorage, setting isProfileComplete to true');
            setIsProfileComplete(true);
            setShowProfileModal(false);
            return;
          }

          try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
              console.warn('No authentication token found');
              setShowProfileModal(true);
              return;
            }
            const response = await fetch(`http://127.0.0.1:8000/api/workers/${parsedUser.id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
            });
            if (!response.ok) {
              console.error('Worker fetch failed:', response.status, response.statusText);
              setShowProfileModal(true);
              return;
            }
            const profileData = await response.json();
            console.log('Fetched profile data from /api/workers:', JSON.stringify(profileData, null, 2));

            const skills = Array.isArray(profileData?.worker?.skills_id) ? profileData.worker.skills_id : [];
            const hasCredentials = Array.isArray(profileData?.worker?.credentials_name) && profileData.worker.credentials_name.length > 0;
            if (skills.length >= 2 && hasCredentials) {
              console.log(`Found ${skills.length} skills and credentials, overriding localStorage and setting isProfileComplete to true`);
              localStorage.setItem(`skillsStepCompleted_${parsedUser.id}`, 'true');
              localStorage.setItem(`isProfileComplete_${parsedUser.id}`, 'true');
              setIsProfileComplete(true);
              setShowProfileModal(false);
            } else {
              console.log(`Skills found: ${skills.length}, Credentials: ${hasCredentials ? 'Yes' : 'No'}, showing modal`);
              setShowProfileModal(true);
            }
          } catch (error) {
            console.error('Error fetching profile:', error.message);
            setShowProfileModal(true);
          }
        };
        checkProfile();
      }
    } else {
      console.log('No user data found in localStorage');
    }
  }, []);

  const handleProfileModalComplete = () => {
    console.log('Profile modal completed, updating states');
    setShowProfileModal(false);
    setIsProfileComplete(true);
    localStorage.setItem(`isProfileComplete_${user.id}`, 'true');
    localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
    window.location.reload();
  };

  return (
    <div className="homepage">
      <Headerz />
      
      <div className="content-wrapper">
        <h1>
          Find Jobs That Match Your Skills, Fast and Easy
        </h1>
        <p className="sub-headline">
          Connect with workers who get the job done—skilled, service-based, or administrative.
        </p>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search"
            disabled={!isProfileComplete && user?.role_id === 1}
          />
          <button className="search-button" disabled={!isProfileComplete && user?.role_id === 1}>
            <IconSearch size={24} />
          </button>
        </div>
      </div>

      <div className="work-searches-section">
        <div className="work-searches-content">
          <h2>Common Work Searches</h2>
          <div className="underline"></div>
          <div className="job-categories">
            <div className="category-column">
              <div className="job-category">Plumber</div>
              <div className="job-category">Electrician</div>
              <div className="job-category">Carpenter</div>
              <div className="job-category">Welder</div>
              <div className="job-category">Mason</div>
              <div className="job-category">House</div>
              <div className="job-category">Painter</div>
              <div className="job-category">Mechanic</div>
              <div className="job-category">Housekeeper</div>
              <div className="job-category">Gardener</div>
              <div className="job-category">Driver</div>
            </div>
            <div className="category-column">
              <div className="job-category">Construction Worker</div>
              <div className="job-category">Laundry Worker</div>
              <div className="job-category">AC Technician</div>
              <div className="job-category">Appliance Repair Technician</div>
              <div className="job-category">Tailor / Dressmaker</div>
              <div className="job-category">Barber / Hairdresser</div>
              <div className="job-category">Cook / Chef</div>
              <div className="job-category">Baker</div>
              <div className="job-category">Security Guard</div>
              <div className="job-category">Janitor / Cleaner</div>
            </div>
          </div>
          <button className="see-more-btn" disabled={!isProfileComplete && user?.role_id === 1}>
            SEE MORE SKILLS
          </button>
        </div>
      </div>

      {!isProfileComplete && user && user.role_id === 1 && (
        <div className="profile-prompt">
          <p>
            Finish your profile to start browsing jobs!{' '}
            <button onClick={() => setShowProfileModal(true)}>Complete Now</button>
          </p>
        </div>
      )}

      <Footer />
      
      <SkillRatingModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileModalComplete}
        user={user}
      />
    </div>
  );
};

export default HomePage;