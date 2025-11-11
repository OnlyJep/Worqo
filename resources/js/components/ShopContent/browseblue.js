import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './../../../sass/components/browseblue.scss';
import Headerz from "../HeaderContent/Headerz";
import Banner from "../AdsContent/banner";
import Footer from "../FooterContent/footer";
import Loader from "../LoaderContent/loader";
import { IconChevronDown, IconSearch } from '@tabler/icons-react';
import { message } from 'antd';

const Browse = () => {
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Function to format last active time
  const getLastActiveText = (lastActivity) => {
    if (!lastActivity) return 'Offline';
    
    const now = new Date();
    const lastActive = new Date(lastActivity);
    const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `Active ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Active ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 365) return `Active ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `Active ${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  };

  const [selectedSortOption, setSelectedSortOption] = useState("Sort by");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    minHours: 0,
    maxHours: 24,
    minSalary: 0,
    maxSalary: 50000
  });

  // Collar data state
  const [collarData, setCollarData] = useState({});
  const [servicesData, setServicesData] = useState([]);

  // Function to fetch collar data from API
  const fetchCollarData = async () => {
    try {
      const response = await axios.get('/api/collars');
      const collars = response.data.collars || [];
      const collarMap = {};
      
      collars.forEach(collar => {
        collarMap[collar.id] = {
          id: collar.id,
          name: collar.name,
          image: collar.collar_img,
          collar_img: collar.collar_img
        };
        
        // Aggressive preloading for ultra-fast collar image loading
        if (collar.collar_img) {
          const img = new Image();
          img.src = `${window.location.origin}/storage/${collar.collar_img}`;
          img.loading = 'eager';
          img.decoding = 'async';
          console.log('Preloading collar image:', img.src);
        }
      });
      
      setCollarData(collarMap);
      console.log('Fetched collar data:', collarMap);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Collar data request was aborted");
        return;
      }
      console.error('Error fetching collar data:', error);
    }
  };

  // Function to fetch services data from API
  const fetchServicesData = async () => {
    try {
      console.log('Fetching services data...');
      const response = await axios.get('/api/services');
      console.log('Services API response:', response.data);
      const services = response.data.services || [];
      
      setServicesData(services);
      console.log('Fetched services data:', services);
      
      // Aggressive preloading for ultra-fast collar image loading
      services.forEach(service => {
        if (service.collar_img) {
          const img = new Image();
          img.src = `${window.location.origin}/storage/${service.collar_img}`;
          img.loading = 'eager';
          img.decoding = 'async';
          console.log('Preloading collar image:', img.src);
        }
      });
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Services data request was aborted");
        return;
      }
      console.error('Error fetching services data:', error);
    }
  };

  // Helper function to get worker collar based on skills and services
  const getWorkerCollar = (worker) => {
    console.log('Getting worker collar for:', worker);
    console.log('Services data available:', servicesData);
    console.log('Worker skills:', worker?.primary_skills, worker?.additional_skills);
    
    if (!worker?.primary_skills && !worker?.additional_skills) {
      console.log('No skills found, using default Blue Collars');
      return { id: 1, name: "Blue Collars", image: "img/collar/aAuEXungkh3r08FEXqhWMSf9fYJNKEjQiMSc76iM.png" };
    }
    
    const allSkills = [
      ...(worker.primary_skills || []),
      ...(worker.additional_skills || [])
    ];
    
    console.log('All worker skills:', allSkills);
    console.log('Available services:', servicesData);
    
    // Find matching service based on worker's skills
    for (const skill of allSkills) {
      console.log('Checking skill:', skill);
      
      // Find service that contains this skill
      const matchingService = servicesData.find(service => {
        const serviceSkillIds = service.skill_ids || [];
        console.log('Service skill IDs:', serviceSkillIds, 'for service:', service.name);
        return serviceSkillIds.includes(skill.skill_id?.toString());
      });
      
      if (matchingService) {
        console.log('Found matching service:', matchingService);
        console.log('Service collar info:', {
          color_collar_id: matchingService.color_collar_id,
          color_collar_name: matchingService.color_collar_name,
          collar_img: matchingService.collar_img
        });
        
        return {
          id: matchingService.color_collar_id,
          name: matchingService.color_collar_name,
          image: matchingService.collar_img
        };
      }
    }
    
    // Default to Blue Collars if no match found
    console.log('No matching service found, using default Blue Collars');
    return { id: 1, name: "Blue Collars", image: "img/collar/aAuEXungkh3r08FEXqhWMSf9fYJNKEjQiMSc76iM.png" };
  };

  // Helper function to get rank based on experience
  const getRankByExperience = (experience) => {
    switch (experience) {
      case '0-11-months':
        return { name: 'Bronze', image: `${window.location.origin}/images/bronze.png` };
      case '1-2-years':
        return { name: 'Silver', image: `${window.location.origin}/images/silver.svg` };
      case '2-5-years':
        return { name: 'Gold', image: `${window.location.origin}/images/gold.svg` };
      case '5-10-years':
        return { name: 'Platinum', image: `${window.location.origin}/images/platinum.svg` };
      case '10+ years':
        return { name: 'Diamond', image: `${window.location.origin}/images/diamond.svg` };
      default:
        return { name: 'Bronze', image: `${window.location.origin}/images/bronze.png` };
    }
  };

  // Helper function to determine worker collars based on service collar information
  const getWorkerCollars = (worker) => {
    const collars = [];
    const collarMap = {};
    
    // Get primary skills and determine their service collars
    if (worker.primary_skills && Array.isArray(worker.primary_skills)) {
      worker.primary_skills.forEach(skill => {
        const skillId = skill.skill_id;
        // Map skill IDs to collar information based on service data
        const collarInfo = getCollarBySkillId(skillId);
        if (collarInfo && !collarMap[collarInfo.id]) {
          collarMap[collarInfo.id] = collarInfo;
          collars.push(collarInfo);
        }
      });
    }
    
    // Get additional skills and determine their service collars
    if (worker.additional_skills && Array.isArray(worker.additional_skills)) {
      worker.additional_skills.forEach(skill => {
        const skillId = skill.skill_id;
        const collarInfo = getCollarBySkillId(skillId);
        if (collarInfo && !collarMap[collarInfo.id]) {
          collarMap[collarInfo.id] = collarInfo;
          collars.push(collarInfo);
        }
      });
    }
    
    // If no collars found, return default Blue Collars
    if (collars.length === 0) {
      return [{ 
        id: 1, 
        name: "Blue Collars", 
        image: "img/collar/aAuEXungkh3r08FEXqhWMSf9fYJNKEjQiMSc76iM.png" 
      }];
    }
    
    return collars;
  };

  // Helper function to map skill IDs to collar information based on service data
  const getCollarBySkillId = (skillId) => {
    // Based on the service data provided
    const skillToCollarIdMap = {
      "1": 2, // Virtual Assistant - Pink Collars
      "2": 1, // WordPress Developer - Blue Collars
      "3": 1, // SEO - Blue Collars
      "4": 2, // Graphic Designer - Pink Collars (Customer Services)
      "5": 1, // Social Media Marketer - Blue Collars
      "6": 2, // PHP Developer - Pink Collars (Customer Services)
      "7": 1, // Real Estate VA - Blue Collars
      "8": 2, // Content Writer - Pink Collars (Customer Services)
    };
    
    const collarId = skillToCollarIdMap[skillId];
    if (collarId && collarData[collarId]) {
      return collarData[collarId];
    }
    
    return null;
  };

  const defaultWorkers = [  
    { id: 1, name: "Lebron James", role: "Master Plumber", service: "Plumbing Services", status: "ACTIVE NOW", hourlyRate: 200.17, description: "Experienced plumber with over 10 years in the field.", education: "Associates Degree", skills: ["Pipe Installation", "Leak Repair"], experience: "10+ years" },
    { id: 2, name: "John Doe", role: "Apprentice Plumber", service: "Plumbing Services", status: "ACTIVE NOW", hourlyRate: 150.00, description: "Skilled apprentice with a focus on residential plumbing.", education: "High School Diploma", skills: ["Drain Cleaning", "Fixture Installation"], experience: "2-5 years" },
    { id: 3, name: "Jane Smith", role: "Pipefitter", service: "Plumbing Services", status: "ACTIVE 2 HOURS AGO", hourlyRate: 180.50, description: "Certified pipefitter specializing in commercial projects.", education: "Trade School Certificate", skills: ["Welding", "System Maintenance"], experience: "5-10 years" },
  ];

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Get service name from navigation state or URL params
  const navigationState = location.state;
  const serviceName = navigationState?.serviceName || searchParams.get('service') || 'Plumbing Services';
  const skillNames = navigationState?.skillNames || [];

  // Function to fetch workers data from API
  const fetchWorkersData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, check if we have filtered workers from navigation state
      if (navigationState?.filteredWorkers && navigationState.filteredWorkers.length > 0) {
        console.log("Using filtered workers from navigation state:", navigationState.filteredWorkers.length);
        const formattedWorkers = navigationState.filteredWorkers.map(formatApiWorker).filter(worker => worker !== null);
        
        // Apply frontend filters to navigation state workers
        let filteredWorkers = formattedWorkers;
        
        // Filter out current user from navigation state workers too
        if (currentUserId) {
          filteredWorkers = filteredWorkers.filter(worker => worker.id !== currentUserId);
        }
        
        // Allow both role_id 1 (workers) and role_id 2 (employers) to be displayed
        // Show all workers with worker profiles, regardless of skills
        // This allows role_id 2 users to be displayed even without skills
        // No additional filtering needed - all workers with profiles are shown
        
        console.log('Navigation workers with profiles (excluding own):', filteredWorkers.length, 'out of', formattedWorkers.length);
        
        setAllWorkers(filteredWorkers);
        setFilteredWorkers(filteredWorkers);
        setLoading(false);
        return;
      }
      
      // If no navigation state, fetch from API
      const authToken = localStorage.getItem("auth_token");
      const headers = authToken
        ? { Authorization: `Bearer ${authToken}`, Accept: "application/json" }
        : { Accept: "application/json" };

      let response;
      
      // First, try to get skill names from the service if we have a service name
      let currentSkillNames = skillNames;
      
      if (currentSkillNames.length === 0 && serviceName) {
        try {
          // Fetch services to get skill names for the current service
          const servicesResponse = await axios.get("/api/services", {
            headers,
            timeout: 30000,
          });
          
          const services = servicesResponse.data.services || [];
          const currentService = services.find(service => service.name === serviceName);
          
          if (currentService && currentService.skills) {
            currentSkillNames = currentService.skills.map(skill => skill.name);
            console.log("Found skill names for service:", currentSkillNames);
          }
        } catch (serviceError) {
          console.warn("Could not fetch service data:", serviceError);
        }
      }
      
      // Get current user ID to exclude from results
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const currentUserId = userData.user?.id || userData.id;

      // If we have skill names, fetch by skills, otherwise fetch all workers
      if (currentSkillNames.length > 0) {
        console.log("Fetching workers by skills:", currentSkillNames);
        response = await axios.get("/api/workers/by-skills", {
          params: {
            skill_names: currentSkillNames.join(','),
            page: 1,
            limit: 50,
            exclude_user_id: currentUserId // Exclude current user
          },
          headers,
          timeout: 30000,
        });
      } else {
        console.log("Fetching all workers");
        response = await axios.get("/api/workers", {
          params: {
            page: 1,
            limit: 50,
            exclude_user_id: currentUserId // Exclude current user
          },
          headers,
          timeout: 30000,
        });
      }

      const workers = response.data.workers || [];
      console.log("Fetched workers:", workers.length);
      
      // Format the workers data and filter out invalid workers
      const formattedWorkers = workers.map(formatApiWorker).filter(worker => worker !== null);
      
      // Additional frontend filters
      let filteredWorkers = formattedWorkers;
      
      // Filter out current user (in case API doesn't filter properly)
      if (currentUserId) {
        filteredWorkers = filteredWorkers.filter(worker => worker.id !== currentUserId);
      }
      
      // Allow both role_id 1 (workers) and role_id 2 (employers) to be displayed
      // Show all workers with worker profiles, regardless of skills
      // This allows role_id 2 users to be displayed even without skills
      // No additional filtering needed - all workers with profiles are shown
      
      console.log('Workers with profiles (excluding own):', filteredWorkers.length, 'out of', formattedWorkers.length);
      
      setAllWorkers(filteredWorkers);
      setFilteredWorkers(filteredWorkers);
      
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      console.error("Error fetching workers data:", error.response?.data || error.message);
      
      // Handle role-based access denial
      if (error.response?.status === 403) {
        setError(error.response.data.message || "Access denied. Workers cannot browse other worker profiles. Please switch to employer role to hire workers.");
        message.error(error.response.data.message || "Access denied. Switch to employer role to browse workers.");
      } else {
        setError("Failed to load workers. Please try again later.");
        message.error("Failed to load workers.");
      }
      
      setFilteredWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to format API workers data to match the expected structure
  const formatApiWorker = (apiWorker) => {
    const profile = apiWorker.profile || {};
    const worker = apiWorker.worker || {};
    const skills = worker.skills_id || {};
    
    // Check if this is a valid worker (has worker data)
    // Allow both role_id 1 (workers) and role_id 2 (employers) to be displayed
    if (!worker) {
      console.log('Invalid worker data, skipping:', apiWorker.id);
      return null;
    }
    
    // Format name properly with all parts
    const firstName = profile.first_name || '';
    const middleName = profile.middlename || '';
    const lastName = profile.last_name || '';
    const suffix = profile.suffix_id || '';
    
    // Combine name parts
    const nameParts = [firstName, middleName, lastName, suffix].filter(part => part && part.trim());
    const fullName = nameParts.join(' ').trim() || 'Unknown Worker';
    
    // Extract skills from primary and additional skills with sub-skills
    const allSkills = [
      ...(skills.primary_skills || []),
      ...(skills.additional_skills || [])
    ].map(skill => {
      const skillName = skill.skill_name || skill.name || 'Unknown Skill';
      const subSkills = skill.sub_skills || [];
      if (subSkills.length > 0) {
        return `${skillName} - ${subSkills.join(', ')}`;
      }
      return skillName;
    });

    // Get hourly rate from skills (use the first available rate)
    const hourlyRate = allSkills.length > 0 && skills.primary_skills?.[0]?.hourly_rate 
      ? parseFloat(skills.primary_skills[0].hourly_rate) 
      : 150.00;

    return {
      id: apiWorker.id,
      name: fullName,
      role: allSkills.length > 0 ? allSkills[0] : 'General Worker',
      service: serviceName,
      status: "ACTIVE NOW", // Default status since we only show ACCEPTED workers
      hourlyRate: hourlyRate,
      description: worker.bio || "No bio available",
      skills: allSkills,
      experience: "Experience varies",
      profile_img: profile.profile_img,
      hours_per_day: worker.hours_per_day,
      verified: worker.verified === true || worker.verified === 1,
      rank: worker.rank || null,
      last_activity: apiWorker.last_activity,
      // Include detailed skills data for rank display
      primary_skills: skills.primary_skills || [],
      additional_skills: skills.additional_skills || []
    };
  };

  // Fetch collar data on component mount
  useEffect(() => {
    fetchCollarData();
  }, []);

  // Fetch services data on component mount
  useEffect(() => {
    fetchServicesData();
    
    // Preload verified.png for ultra-fast loading
    const verifiedImg = new Image();
    verifiedImg.src = '/images/verified.png';
    verifiedImg.loading = 'eager';
    verifiedImg.decoding = 'async';
    verifiedImg.onload = () => console.log('Verified.png loaded successfully');
    verifiedImg.onerror = () => console.error('Failed to load verified.png');
    console.log('Preloading verified.png from:', verifiedImg.src);
  }, []);

  // Fetch workers data on component mount
  useEffect(() => {
    fetchWorkersData();
  }, [serviceName, skillNames]);

  // State for all workers (before filtering)
  const [allWorkers, setAllWorkers] = useState([]);

  // Filter and sort workers based on search and sort options
  useEffect(() => {
    if (allWorkers.length === 0) return;

    // Apply all filters
    let filteredWorkers = allWorkers.filter(worker => {
      // Search term filter
      const matchesSearch = searchTerm === '' || worker.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Hours per day filter (more lenient - allow workers with no hours specified)
      const workerHours = worker.hours_per_day || 4;
      const matchesHours = workerHours >= filters.minHours && workerHours <= filters.maxHours;
      
      // Salary range filter (more lenient)
      const matchesSalary = worker.hourlyRate >= filters.minSalary && worker.hourlyRate <= filters.maxSalary;
      
      const matches = matchesSearch && matchesHours && matchesSalary;
      
      return matches;
    });

    // Apply sorting
    if (selectedSortOption === "Price: High-Low") {
      filteredWorkers.sort((a, b) => b.hourlyRate - a.hourlyRate);
    } else if (selectedSortOption === "Price: Low-High") {
      filteredWorkers.sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else if (selectedSortOption === "Newest") {
      filteredWorkers.sort((a, b) => a.id - b.id);
    }

    setFilteredWorkers(filteredWorkers);
  }, [selectedSortOption, searchTerm, allWorkers, filters]);

  const sortOptions = ["Sort by", "Featured", "Newest", "Price: High-Low", "Price: Low-High"];

  const handleSortOptionClick = (option) => {
    setSelectedSortOption(option);
    setIsSortDropdownOpen(false);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleViewProfile = (workerId) => {
    navigate(`/profile/${workerId}?service=${encodeURIComponent(serviceName)}`);
  };

  if (loading) {
    return (
      <div className="browse">
        <Headerz />
        <Banner />
        <div className="loading-container">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="browse">
        <Headerz />
        <Banner />
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="browse">
      <Headerz />
      <Banner />
      <div className="browse-content">
        <div className="header-section">
          <h2 className="category-title">
            {serviceName.toUpperCase()}
          </h2>
            <div className="search-and-sort-row">
            <div className="search-bar">
              <input
                className="search-input"
                type="text"
                placeholder="Search a worker"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn" type="button" aria-label="Search">
                <IconSearch size={16} stroke={2} color="#ffffff" />
              </button>
            </div>
            <div className="sort-wrapper">
              <div
                className="sort-by"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              >
                <span>{selectedSortOption}</span>
                <IconChevronDown className="sort-icon" />
              </div>
              {isSortDropdownOpen && (
                <div className="sort-dropdown">
                  {sortOptions.map((option) => (
                    <div
                      key={option}
                      className="sort-option"
                      onClick={() => handleSortOptionClick(option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button 
            className="mobile-filter-toggle"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            aria-label="Toggle filters"
          >
            {isFiltersOpen ? '−' : '+'} ACTIVE SKILL FILTERS
          </button>
        </div>

        <div className="content-layout">
          <aside className={`filters-sidebar ${isFiltersOpen ? 'mobile-open' : ''}`}>
            <h4 className="filters-title">ACTIVE SKILL FILTERS</h4>
            <div className="filter-group">
              <label>AVAILABILITY (HOURS PER DAY)</label>
              <div className="range">
                <input 
                  type="number" 
                  value={filters.minHours} 
                  min="0" 
                  max="24" 
                  onChange={(e) => handleFilterChange('minHours', parseInt(e.target.value) || 0)}
                />
                <span>to</span>
                <input 
                  type="number" 
                  value={filters.maxHours} 
                  min="0" 
                  max="24" 
                  onChange={(e) => handleFilterChange('maxHours', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="filter-group">
              <label>HOURLY SALARY BETWEEN (PHP)</label>
              <div className="range">
                <input 
                  type="number" 
                  value={filters.minSalary} 
                  min="0" 
                  placeholder="0"
                  onChange={(e) => handleFilterChange('minSalary', parseInt(e.target.value) || 0)}
                />
                <span>to</span>
                <input 
                  type="number" 
                  value={filters.maxSalary} 
                  min="0" 
                  placeholder="10000"
                  onChange={(e) => handleFilterChange('maxSalary', parseInt(e.target.value) || 10000)}
                />
              </div>
            </div>
          </aside>

          <section className="results-list">
            {filteredWorkers.map((worker) => (
              <article key={worker.id} className="result-card">
                <div className="card-inner">
                  <div className="avatar-col">
                    <img 
                      className="avatar" 
                      src={worker.profile_img 
                        ? `${window.location.origin}/storage/${worker.profile_img}` 
                        : "/images/defpfp.svg"
                      } 
                      alt={`${worker.name}'s avatar`}
                      onError={(e) => {
                        e.target.src = "/images/defpfp.svg";
                      }}
                    />
                  </div>
                  <div className="details-col">
                    <div className="name-row">
                      <div className="name-with-badges">
                        <div className="name-with-collar-verified">
                          <h5 className="name">{worker.name}</h5>
                          {/* Collar Image - positioned beside name */}
                          {(() => {
                            const workerCollar = getWorkerCollar(worker);
                            console.log('Worker collar result:', workerCollar);
                            console.log('Image path:', workerCollar.image);
                            console.log('Full image URL:', `${window.location.origin}/storage/${workerCollar.image}`);
                            
                            return (
                              <div className="browse-service-badge" title={`${workerCollar.name} Worker`}>
                                {workerCollar.image ? (
                                  <img 
                                    src={`${window.location.origin}/storage/${workerCollar.image}`} 
                                    alt={`${workerCollar.name} Collar`}
                                    className="badge-icon"
                                    loading="eager"
                                    decoding="async"
                                    onError={(e) => {
                                      console.error('Collar image failed to load:', e.target.src);
                                      e.target.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                      console.log('Collar image loaded successfully');
                                    }}
                                  />
                                ) : null}
                              </div>
                            );
                          })()}
                          {/* Verified Badge - positioned beside collar image */}
                          {(() => {
                            console.log('Worker verified status:', worker.verified, 'Type:', typeof worker.verified);
                            
                            // Check if worker is verified (verified = 1)
                            const isVerified = worker.verified === 1 || worker.verified === true;
                            console.log('Is worker verified:', isVerified);
                            
                            if (isVerified) {
                              console.log('Rendering verified badge for worker:', worker.name);
                              return (
                                <div className="profile-verified-badge" title="Verified Worker">
                                  <img 
                                    src="/images/verified.png" 
                                    alt="Verified" 
                                    className="verified-icon"
                                    loading="eager"
                                    decoding="async"
                                    onLoad={() => console.log('Verified badge image loaded in browseblue')}
                                    onError={(e) => console.error('Failed to load verified badge image:', e.target.src)}
                                  />
                                </div>
                              );
                            } else {
                              console.log('Worker not verified (verified = 0), not showing badge');
                              return null;
                            }
                          })()}
                        </div>
                        <div className="badges-container">
                          {/* Collar badges removed - now using collar_img beside name */}
                        </div>
                      </div>
                      <span className="role">{worker.role}</span>
                    </div>
                    {worker.contact_number && (
                      <div className="contact-info">
                        <span className="contact-number">
                          {worker.contact_number.replace(/(\d{4})\d{3}(\d{4})/, '$1***$2')}
                        </span>
                      </div>
                    )}
                    <div className="skills-row">
                      {worker.primary_skills && worker.primary_skills.length > 0 && (
                        <>
                          {worker.primary_skills.map((skill, index) => {
                            const skillRank = getRankByExperience(skill.experience);
                            return (
                              <span key={`primary-${index}`} className="chip skill-chip-with-rank">
                                <img 
                                  src={skillRank.image} 
                                  alt={`${skillRank.name} Rank`}
                                  className="skill-rank-icon-small"
                                />
                                {skill.skill_name}
                                {skill.sub_skills && skill.sub_skills.length > 0 && (
                                  <span> - {skill.sub_skills.join(', ')}</span>
                                )}
                              </span>
                            );
                          })}
                        </>
                      )}
                      {worker.additional_skills && worker.additional_skills.length > 0 && (
                        <>
                          {worker.additional_skills.map((skill, index) => {
                            const skillRank = getRankByExperience(skill.experience);
                            return (
                              <span key={`additional-${index}`} className="chip skill-chip-with-rank">
                                <img 
                                  src={skillRank.image} 
                                  alt={`${skillRank.name} Rank`}
                                  className="skill-rank-icon-small"
                                />
                                {skill.skill_name}
                                {skill.sub_skills && skill.sub_skills.length > 0 && (
                                  <span> - {skill.sub_skills.join(', ')}</span>
                                )}
                              </span>
                            );
                          })}
                        </>
                      )}
                      {(!worker.primary_skills || worker.primary_skills.length === 0) && 
                       (!worker.additional_skills || worker.additional_skills.length === 0) && (
                        worker.skills.map((skill, index) => (
                        <span key={index} className="chip">{skill}</span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="action-col">
                    <button className="view-btn blue-btn" type="button" onClick={() => handleViewProfile(worker.id)}>VIEW PROFILE</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Browse;