import React, { useState, useEffect } from 'react';
import './../../../sass/components/HomepageStyles/homepage.scss';
import Headerz from '../HeaderContent/Headerz';
import Stats from '../StatsContent/stats';
import Footer from '../FooterContent/footer';
import ProfileSetupNotification from '../ProfileSetupNotification/ProfileSetupNotification';
import { IconSearch } from '@tabler/icons-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [popularSkills, setPopularSkills] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employerSearchTerm, setEmployerSearchTerm] = useState('');
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');
  const navigate = useNavigate();

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

  // Clear search suggestions when user role changes
  useEffect(() => {
    setSearchSuggestions([]);
    setShowSuggestions(false);
  }, [user?.role_id]);

  // Define static popular skills for common work searches (from SkillSeeder)
  useEffect(() => {
    const staticSkills = [
      { id: 1, name: "Plumbing" },
      { id: 2, name: "Electrical Work" },
      { id: 3, name: "Carpentry" },
      { id: 4, name: "Welding" },
      { id: 5, name: "Computer / IT Skills" },
      { id: 6, name: "Driving" },
      { id: 7, name: "Cooking" },
      { id: 8, name: "Sewing" },
      { id: 9, name: "Machine Operation" },
      { id: 10, name: "Housekeeping" },
      { id: 11, name: "Gardening / Landscaping" },
      { id: 12, name: "Painting" },
      { id: 13, name: "Cleaning Services" },
      { id: 14, name: "Delivery Services" },
      { id: 15, name: "Security Services" },
      { id: 16, name: "Maintenance Work" },
      { id: 17, name: "Sales" },
      { id: 18, name: "Administrative Work" },
      { id: 19, name: "Teaching / Tutoring" },
      { id: 20, name: "Healthcare Support" }
    ];
    
    setPopularSkills(staticSkills);
  }, []);

  // Handle search input changes
  const handleSearchInputChange = async (e) => {
    const value = e.target.value;
    
    // Update role-specific search term
    if (user?.role_id === 2) {
      setEmployerSearchTerm(value);
    } else if (user?.role_id === 1) {
      setWorkerSearchTerm(value);
    }

    if (value.length >= 2) {
      try {
        const response = await axios.get(`/api/search/suggestions?q=${encodeURIComponent(value)}`);
        setSearchSuggestions(response.data.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSearchSuggestions([]);
      }
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearch = () => {
    const currentSearchTerm = user?.role_id === 2 ? employerSearchTerm : workerSearchTerm;
    
    if (currentSearchTerm.trim()) {
      // Navigate based on user role
      if (user?.role_id === 2) {
        // Employer - go to services page
        navigate(`/services?search=${encodeURIComponent(currentSearchTerm)}`);
      } else if (user?.role_id === 1) {
        // Worker - go to find-jobs page
        navigate(`/find-jobs?search=${encodeURIComponent(currentSearchTerm)}`);
      }
      // If no valid role, stay on homepage
    }
  };

  // Handle search on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle skill click
  const handleSkillClick = (skillName) => {
    // Update role-specific search term
    if (user?.role_id === 2) {
      setEmployerSearchTerm(skillName);
    } else if (user?.role_id === 1) {
      setWorkerSearchTerm(skillName);
    }
    
    // Navigate based on user role
    if (user?.role_id === 2) {
      // Employer - go to services page
      navigate(`/services?search=${encodeURIComponent(skillName)}`);
    } else if (user?.role_id === 1) {
      // Worker - go to find-jobs page
      navigate(`/find-jobs?search=${encodeURIComponent(skillName)}`);
    }
    // If no valid role, stay on homepage
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    // Update role-specific search term
    if (user?.role_id === 2) {
      setEmployerSearchTerm(suggestion);
    } else if (user?.role_id === 1) {
      setWorkerSearchTerm(suggestion);
    }
    
    setShowSuggestions(false);
    // Navigate based on user role
    if (user?.role_id === 2) {
      // Employer - go to services page
      navigate(`/services?search=${encodeURIComponent(suggestion)}`);
    } else if (user?.role_id === 1) {
      // Worker - go to find-jobs page
      navigate(`/find-jobs?search=${encodeURIComponent(suggestion)}`);
    }
    // If no valid role, stay on homepage
  };

  // Handle see more skills button click
  const handleSeeMoreSkills = () => {
    // Navigate based on user role
    if (user?.role_id === 2) {
      // Employer - go to services page
      navigate('/services');
    } else if (user?.role_id === 1) {
      // Worker - go to find-jobs page
      navigate('/find-jobs');
    }
    // If no valid role, stay on homepage
  };


  return (
    <div className="homepage">
      <ProfileSetupNotification />
      <Headerz />
      
      <div className="content-wrapper">
        <h1>
          {user?.role_id === 2 
            ? "Find Workers That Match Your Needs, Fast and Easy" 
            : "Find Jobs That Match Your Skills, Fast and Easy"
          }
        </h1>
        <p className="sub-headline">
          {user?.role_id === 2 
            ? "Connect with skilled workers who get the job done—service-based, administrative, or specialized." 
            : "Find job opportunities that match your skills and experience."
          }
        </p>
        <div className={`search-bar ${user?.role_id === 2 ? 'employer-search-bar' : 'worker-search-bar'}`}>
          <div className={`search-input-container ${user?.role_id === 2 ? 'employer-search-input-container' : 'worker-search-input-container'}`}>
            <input
              type="text"
              placeholder={user?.role_id === 2 ? "Search for workers and services..." : "Search for jobs and opportunities..."}
              value={user?.role_id === 2 ? employerSearchTerm : workerSearchTerm}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              disabled={!isProfileComplete && user?.role_id === 1}
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className={`search-suggestions ${user?.role_id === 2 ? 'employer-search-suggestions' : 'worker-search-suggestions'}`}>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`suggestion-item ${user?.role_id === 2 ? 'employer-suggestion-item' : 'worker-suggestion-item'}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            className={`search-button ${user?.role_id === 2 ? 'employer-search-button' : 'worker-search-button'}`}
            onClick={handleSearch}
            disabled={!isProfileComplete && user?.role_id === 1}
          >
            <IconSearch size={24} />
          </button>
        </div>
      </div>

      <div className={`work-searches-section ${user?.role_id === 2 ? 'employer-work-searches-section' : 'worker-work-searches-section'}`}>
        <div className={`work-searches-content ${user?.role_id === 2 ? 'employer-work-searches-content' : 'worker-work-searches-content'}`}>
          <h2>{user?.role_id === 2 ? "Common Worker Categories" : "Popular Job Categories"}</h2>
          <div className="underline"></div>
          <div className={`job-categories ${user?.role_id === 2 ? 'employer-job-categories' : 'worker-job-categories'}`}>
            <div className={`category-column ${user?.role_id === 2 ? 'employer-category-column' : 'worker-category-column'}`}>
              {popularSkills.slice(0, Math.ceil(popularSkills.length / 2)).map((skill, index) => (
                <div 
                  key={skill.id} 
                  className={`job-category ${user?.role_id === 2 ? 'employer-job-category' : 'worker-job-category'}`}
                  onClick={() => handleSkillClick(skill.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {skill.name}
                </div>
              ))}
            </div>
            <div className={`category-column ${user?.role_id === 2 ? 'employer-category-column' : 'worker-category-column'}`}>
              {popularSkills.slice(Math.ceil(popularSkills.length / 2)).map((skill, index) => (
                <div 
                  key={skill.id} 
                  className={`job-category ${user?.role_id === 2 ? 'employer-job-category' : 'worker-job-category'}`}
                  onClick={() => handleSkillClick(skill.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
          <button 
            className={`see-more-btn ${user?.role_id === 2 ? 'employer-see-more-btn' : 'worker-see-more-btn'}`}
            onClick={handleSeeMoreSkills}
            disabled={!isProfileComplete && user?.role_id === 1}
          >
            {user?.role_id === 2 ? "SEE MORE WORKERS" : "BROWSE ALL JOBS"}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;