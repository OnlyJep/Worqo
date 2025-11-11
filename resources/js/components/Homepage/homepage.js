import React, { useState, useEffect, useRef } from 'react';
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
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

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

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

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
    } else {
      // Guest users or no user - use general search term
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
        setShowSuggestions(false);
      }
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearch = (e) => {
    if (e) {
      e.preventDefault();
    }
    
    const currentSearchTerm = user?.role_id === 2 ? employerSearchTerm : workerSearchTerm;
    
    // Close suggestions
    setShowSuggestions(false);
    
    if (currentSearchTerm.trim()) {
      // Navigate based on user role
      if (user?.role_id === 2) {
        // Employer - go to services page
        navigate(`/services?search=${encodeURIComponent(currentSearchTerm.trim())}`);
      } else {
        // Worker or guest - go to find-jobs page
        navigate(`/find-jobs?search=${encodeURIComponent(currentSearchTerm.trim())}`);
      }
    }
  };

  // Handle search on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle skill click
  const handleSkillClick = (skillName) => {
    // Close suggestions if open
    setShowSuggestions(false);
    
    // Update role-specific search term
    if (user?.role_id === 2) {
      setEmployerSearchTerm(skillName);
    } else {
      // Worker or guest
      setWorkerSearchTerm(skillName);
    }
    
    // Navigate based on user role
    if (user?.role_id === 2) {
      // Employer - go to services page
      navigate(`/services?search=${encodeURIComponent(skillName)}`);
    } else {
      // Worker or guest - go to find-jobs page
      navigate(`/find-jobs?search=${encodeURIComponent(skillName)}`);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    // Update role-specific search term
    if (user?.role_id === 2) {
      setEmployerSearchTerm(suggestion);
    } else {
      // Worker or guest
      setWorkerSearchTerm(suggestion);
    }
    
    setShowSuggestions(false);
    
    // Navigate based on user role
    if (user?.role_id === 2) {
      // Employer - go to services page
      navigate(`/services?search=${encodeURIComponent(suggestion)}`);
    } else {
      // Worker or guest - go to find-jobs page
      navigate(`/find-jobs?search=${encodeURIComponent(suggestion)}`);
    }
  };

  // Handle see more skills button click
  const handleSeeMoreSkills = () => {
    // Navigate based on user role
    if (user?.role_id === 2) {
      // Employer - go to services page
      navigate('/services');
    } else {
      // Worker or guest - go to find-jobs page
      navigate('/find-jobs');
    }
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
        <form 
          className={`search-bar ${user?.role_id === 2 ? 'employer-search-bar' : 'worker-search-bar'}`}
          onSubmit={handleSearch}
        >
          <div className={`search-input-container ${user?.role_id === 2 ? 'employer-search-input-container' : 'worker-search-input-container'}`}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={user?.role_id === 2 ? "Search for workers and services..." : "Search for jobs and opportunities..."}
              value={user?.role_id === 2 ? employerSearchTerm : workerSearchTerm}
              onChange={handleSearchInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              disabled={!isProfileComplete && user?.role_id === 1}
              aria-label="Search input"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className={`search-suggestions ${user?.role_id === 2 ? 'employer-search-suggestions' : 'worker-search-suggestions'}`}
                role="listbox"
              >
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`suggestion-item ${user?.role_id === 2 ? 'employer-suggestion-item' : 'worker-suggestion-item'}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseDown={(e) => e.preventDefault()}
                    role="option"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSuggestionClick(suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            type="submit"
            className={`search-button ${user?.role_id === 2 ? 'employer-search-button' : 'worker-search-button'}`}
            onClick={handleSearch}
            disabled={!isProfileComplete && user?.role_id === 1}
            aria-label="Search"
          >
            <IconSearch size={24} />
          </button>
        </form>
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
                  className={`job-category ${user?.role_id === 2 ? 'employer-job-category' : 'worker-job-category'} ${(!isProfileComplete && user?.role_id === 1) ? 'disabled' : ''}`}
                  onClick={() => {
                    if (isProfileComplete || user?.role_id !== 1) {
                      handleSkillClick(skill.name);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && (isProfileComplete || user?.role_id !== 1)) {
                      e.preventDefault();
                      handleSkillClick(skill.name);
                    }
                  }}
                  role="button"
                  tabIndex={(isProfileComplete || user?.role_id !== 1) ? 0 : -1}
                  aria-label={`Search for ${skill.name} jobs`}
                  style={{ cursor: (!isProfileComplete && user?.role_id === 1) ? 'not-allowed' : 'pointer' }}
                >
                  {skill.name}
                </div>
              ))}
            </div>
            <div className={`category-column ${user?.role_id === 2 ? 'employer-category-column' : 'worker-category-column'}`}>
              {popularSkills.slice(Math.ceil(popularSkills.length / 2)).map((skill, index) => (
                <div 
                  key={skill.id} 
                  className={`job-category ${user?.role_id === 2 ? 'employer-job-category' : 'worker-job-category'} ${(!isProfileComplete && user?.role_id === 1) ? 'disabled' : ''}`}
                  onClick={() => {
                    if (isProfileComplete || user?.role_id !== 1) {
                      handleSkillClick(skill.name);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && (isProfileComplete || user?.role_id !== 1)) {
                      e.preventDefault();
                      handleSkillClick(skill.name);
                    }
                  }}
                  role="button"
                  tabIndex={(isProfileComplete || user?.role_id !== 1) ? 0 : -1}
                  aria-label={`Search for ${skill.name} jobs`}
                  style={{ cursor: (!isProfileComplete && user?.role_id === 1) ? 'not-allowed' : 'pointer' }}
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