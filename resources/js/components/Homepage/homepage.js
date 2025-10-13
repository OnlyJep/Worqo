import React, { useState, useEffect } from 'react';
import './../../../sass/components/HomepageStyles/homepage.scss';
import Headerz from '../HeaderContent/Headerz';
import Stats from '../StatsContent/stats';
import Footer from '../FooterContent/footer';
import ProfileSetupNotification from '../ProfileSetupNotification/ProfileSetupNotification';
import { IconSearch } from '@tabler/icons-react';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('HomePage: Loaded user from localStorage:', parsedUser);
      setUser(parsedUser);

      // Check if profile is complete for UI state
      if (parsedUser.role_id === 1) {
        const isComplete = localStorage.getItem(`isProfileComplete_${parsedUser.id}`);
        const skillsCompleted = localStorage.getItem(`skillsStepCompleted_${parsedUser.id}`);
        
        if (isComplete === 'true' || skillsCompleted === 'true') {
          setIsProfileComplete(true);
        } else {
          setIsProfileComplete(false);
        }
      } else if (parsedUser.role_id === 2) {
        // For employers, set profile as complete
        setIsProfileComplete(true);
      }
    }
  }, []);


  return (
    <div className="homepage">
      <ProfileSetupNotification />
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

      <Footer />
    </div>
  );
};

export default HomePage;