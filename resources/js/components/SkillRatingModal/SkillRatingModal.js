import React, { useState, useEffect, useRef } from 'react';
import { IconX, IconChevronDown, IconPlus, IconMinus } from '@tabler/icons-react';
import { Select, Dropdown, message, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import SkillsExperience from './SkillsExperience';
const { Option } = Select;

// Category options shown in the first dropdown (three only)
const credentialCategories = [
  { value: 'government', label: 'Government Credential' },
  { value: 'professional', label: 'Professional Credential' },
  { value: 'personal', label: 'Personal Credential' },
];

// Map of credential type options per category (shown inside modal)
const credentialSubTypes = {
  government: [
    { value: 'SSS ID', label: 'SSS ID / SSS Number' },
    { value: 'TIN ID', label: 'TIN ID / Tax Identification Number' },
    { value: 'PhilHealth ID', label: 'PhilHealth ID' },
    { value: 'Pag-IBIG ID', label: 'Pag-IBIG ID' },
    { value: 'National ID', label: 'National ID / Postal ID' },
    { value: 'Drivers License', label: 'Driver\'s License' },
    { value: 'Passport', label: 'Passport' },
    { value: 'Voters ID', label: 'Voter\'s ID' },
    { value: 'Barangay Clearance', label: 'Barangay Clearance' },
    { value: 'Police Clearance', label: 'Police Clearance' },
    { value: 'NBI Clearance', label: 'NBI Clearance' },
  ],
  professional: [
    { value: 'TESDA Certificate', label: 'TESDA / NC Certificates' },
    { value: 'Diploma', label: 'Diploma / Transcript of Records' },
    { value: 'Training Certificate', label: 'Training Certificates' },
    { value: 'Professional License', label: 'License or Professional ID (e.g., PRC License)' },
    { value: 'Work Portfolio', label: 'Work Experience Records / Portfolio' },
    { value: 'Certificate of Employment', label: 'Certificate of Employment' },
    { value: 'Performance Evaluation', label: 'Performance Evaluation / Feedback' },
    { value: 'Work Photos', label: 'Work Accomplishment Photos (for skilled workers like carpenters, painters, etc.)' },
  ],
  personal: [
    { value: 'Resume/CV', label: 'Resume / Curriculum Vitae (CV)' },
    { value: 'Birth Certificate', label: 'Birth Certificate' },
    { value: 'Character Reference', label: 'Character Reference / Reference Letter' },
  ],
};

const credentialOptions = [
  { value: "Resume/CV", label: "Resume / Curriculum Vitae (CV)" },
  { value: "Birth Certificate", label: "Birth Certificate" },
  { value: "Barangay Clearance", label: "Barangay Clearance" },
  { value: "Police Clearance", label: "Police Clearance" },
  { value: "NBI Clearance", label: "NBI Clearance" },
  { value: "Medical Certificate", label: "Medical Certificate / Health Certificate" },
  { value: "SSS Number", label: "SSS Number (Social Security System)" },
  { value: "PhilHealth Number", label: "PhilHealth Number" },
  { value: "Pag-IBIG Number", label: "Pag-IBIG Number (HDMF)" },
  { value: "TIN", label: "TIN (Tax Identification Number)" },
  { value: "Valid Government ID", label: "Valid Government ID (e.g., Passport, Driver's License, Voter's ID, UMID, National ID)" },
];

const experienceOptions = [
  { value: "no-experience", label: "No Experience" },
  { value: "0-11-months", label: "0 to 11 months" },
  { value: "2-5-years", label: "2 to 5 years" },
  { value: "5-10-years", label: "5 to 10 years" },
];

const workingDaysOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const SkillRatingModal = ({ isOpen, onClose, onComplete, user }) => {
  const [step, setStep] = useState(3);
  const [searchTermPrimary, setSearchTermPrimary] = useState('');
  const [searchTermAdditional, setSearchTermAdditional] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [pendingSkills, setPendingSkills] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [isAddingPrimarySkill, setIsAddingPrimarySkill] = useState(false);
  const [userSkills, setUserSkills] = useState({ 
    primary_skills: [], 
    additional_skills: [] 
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [filteredSkillsPrimary, setFilteredSkillsPrimary] = useState([]);
  const [filteredSkillsAdditional, setFilteredSkillsAdditional] = useState([]);
  const [primarySkill, setPrimarySkill] = useState(null);
  const [additionalSkills, setAdditionalSkills] = useState([]);
  const [selectedSubSkills, setSelectedSubSkills] = useState([]);
  const [availableSubSkills, setAvailableSubSkills] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [newCredential, setNewCredential] = useState({ credentials_name: "", credentials_photo: null, credentials_doc: null });
  const [editingCredentialIndex, setEditingCredentialIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedCredentialCategory, setSelectedCredentialCategory] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [skillsStepCompleted, setSkillsStepCompleted] = useState(false);
  const [workPreferencesCompleted, setWorkPreferencesCompleted] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [preferredWorkingHours, setPreferredWorkingHours] = useState([]);
  const [bio, setBio] = useState('');
  const [isPrimarySkillsDropdownOpen, setIsPrimarySkillsDropdownOpen] = useState(false);
  const [isAdditionalSkillsDropdownOpen, setIsAdditionalSkillsDropdownOpen] = useState(false);
  const [isWorkingDaysDropdownOpen, setIsWorkingDaysDropdownOpen] = useState(false);
  // Initialize mobile state based on window width if available (SSR-safe)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 767;
    }
    return false;
  });
  const credentialFileRef = useRef(null);
  const primarySkillsDropdownRef = useRef(null);
  const additionalSkillsDropdownRef = useRef(null);
  const workingDaysDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const abortController = useRef(new AbortController());

  // Detect mobile viewport for responsive rendering - PORTRAIT LAYOUT
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileView = width <= 767;
      setIsMobile(isMobileView);
      
      // Force mobile layout class on container using ref
      if (containerRef.current) {
        if (isMobileView) {
          containerRef.current.classList.add('mobile-layout');
          containerRef.current.classList.remove('desktop-layout');
          document.body.classList.add('skill-rating-mobile');
          document.body.classList.remove('skill-rating-desktop');
        } else {
          containerRef.current.classList.add('desktop-layout');
          containerRef.current.classList.remove('mobile-layout');
          document.body.classList.add('skill-rating-desktop');
          document.body.classList.remove('skill-rating-mobile');
        }
      }
    };

    // Check immediately on mount
    checkMobile();

    // Also check after DOM is ready
    const timeoutId = setTimeout(checkMobile, 50);

    // Add resize listener with debounce for performance
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', handleResize);
    
    const handleOrientationChange = () => {
      setTimeout(checkMobile, 150); // Slight delay for orientation change
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(resizeTimeout);
      // Cleanup body classes
      document.body.classList.remove('skill-rating-mobile', 'skill-rating-desktop');
    };
  }, []);

  // Map working days to indices for consistent ordering and range formatting
  const workingDayIndexMap = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };

  const getWorkingDayLabel = (value) => {
    const option = workingDaysOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const formatPreferredWorkingDays = (days) => {
    if (!Array.isArray(days) || days.length === 0) return '';
    if (days.length === 1) return getWorkingDayLabel(days[0]);
    
    // Sort days by their index to maintain proper order
    const sorted = [...new Set(days)].sort((a, b) => (workingDayIndexMap[a] ?? 0) - (workingDayIndexMap[b] ?? 0));
    
    // Check if days are consecutive
    let isConsecutive = true;
    for (let i = 1; i < sorted.length; i++) {
      const currentIndex = workingDayIndexMap[sorted[i]] ?? 0;
      const previousIndex = workingDayIndexMap[sorted[i-1]] ?? 0;
      if (currentIndex !== previousIndex + 1) {
        isConsecutive = false;
        break;
      }
    }
    
    if (isConsecutive && sorted.length > 1) {
      // For consecutive days, use dash format
      const start = sorted[0];
      const end = sorted[sorted.length - 1];
      return `${getWorkingDayLabel(start)} - ${getWorkingDayLabel(end)}`;
    } else {
      // For non-consecutive days, use ampersand format
      return sorted.map(day => getWorkingDayLabel(day)).join(' & ');
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      abortController.current.abort();
    };
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (primarySkillsDropdownRef.current && !primarySkillsDropdownRef.current.contains(event.target)) {
        setIsPrimarySkillsDropdownOpen(false);
      }
      if (additionalSkillsDropdownRef.current && !additionalSkillsDropdownRef.current.contains(event.target)) {
        setIsAdditionalSkillsDropdownOpen(false);
      }
      if (workingDaysDropdownRef.current && !workingDaysDropdownRef.current.contains(event.target)) {
        setIsWorkingDaysDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (user?.id && user?.role_id === 1) {
      console.log('SkillRatingModal: Initializing for user ID:', user.id);
      checkProfileCompletion();
      fetchProfile();
      fetchSkills();
      loadFromLocalStorage();
    } else {
      console.warn('No user ID provided or user is not a worker, skipping initialization');
    }
  }, [user?.id]);

  const checkProfileCompletion = async () => {
    if (!user?.id || user?.role_id !== 1) {
      console.warn('No user ID for profile completion check or user is not a worker');
      return;
    }
    console.log('Checking profile completion for user:', user.id);
    try {
      const isComplete = localStorage.getItem(`isProfileComplete_${user.id}`);
      const skillsCompleted = localStorage.getItem(`skillsStepCompleted_${user.id}`);
      console.log('LocalStorage - isProfileComplete:', isComplete, 'skillsStepCompleted:', skillsCompleted);

      if (isComplete === 'true' || skillsCompleted === 'true') {
        console.log('Profile or skills already completed, setting states to true');
        setIsProfileComplete(true);
        setSkillsStepCompleted(true);
        localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
        if (isMounted.current) {
          if (window.location.pathname.includes('/skill-rating')) {
            // If used as a page, use window.location
            window.location.href = '/homepage';
          } else {
            // If used as a modal, use navigate
            navigate('/homepage');
          }
        }
        return;
      }

      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.warn('No authentication token found');
        return;
      }

      const response = await fetch(`${window.location.origin}/api/workers/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        console.error('Worker fetch failed:', response.status, response.statusText);
        return;
      }

      const profileData = await response.json();
      console.log('Profile data from /api/workers:', JSON.stringify(profileData, null, 2));

      // Handle structured skills_id format
      const skillsData = profileData?.worker?.skills_id || {};
      const primarySkills = Array.isArray(skillsData.primary_skills) ? skillsData.primary_skills : [];
      const additionalSkills = Array.isArray(skillsData.additional_skills) ? skillsData.additional_skills : [];
      const totalSkills = primarySkills.length + additionalSkills.length;
      
      const hasCredentials = Array.isArray(profileData?.worker?.credentials_name) && profileData.worker.credentials_name.length > 0;
      if (totalSkills >= 2 && hasCredentials) {
        console.log(`Found ${totalSkills} skills (${primarySkills.length} primary, ${additionalSkills.length} additional) and credentials, setting skillsStepCompleted to true`);
        setIsProfileComplete(true);
        setSkillsStepCompleted(true);
        localStorage.setItem(`isProfileComplete_${user.id}`, 'true');
        localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
        if (isMounted.current) {
          if (window.location.pathname.includes('/skill-rating')) {
            // If used as a page, use window.location
            window.location.href = '/homepage';
          } else {
            // If used as a modal, use navigate
            navigate('/homepage');
          }
        }
      } else {
        console.log(`Skills found: ${totalSkills} (${primarySkills.length} primary, ${additionalSkills.length} additional), Credentials: ${hasCredentials ? 'Yes' : 'No'}, keeping skillsStepCompleted as false`);
        localStorage.setItem(`skillsStepCompleted_${user.id}`, 'false');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Profile completion check aborted');
        return;
      }
      console.error('Error checking profile completion:', error.message);
    }
  };

  const loadFromLocalStorage = () => {
    if (!user?.id) {
      console.warn('No user ID for loading localStorage');
      return;
    }
    console.log('Loading from localStorage for user:', user.id);
    try {
      const savedSkills = localStorage.getItem(`userSkills_${user.id}`);
      if (savedSkills) {
        const parsed = JSON.parse(savedSkills);
        console.log('Loaded userSkills:', parsed);
        
        // Handle both old and new data formats
        if (parsed.primary_skills && parsed.additional_skills) {
          // New format
          setUserSkills({
            primary_skills: Array.isArray(parsed.primary_skills) ? parsed.primary_skills : [],
            additional_skills: Array.isArray(parsed.additional_skills) ? parsed.additional_skills : [],
          });
        } else if (parsed.primary || parsed.additional) {
          // Old format - convert to new format
          const primarySkills = parsed.primary ? [parsed.primary] : [];
          const additionalSkills = Array.isArray(parsed.additional) ? parsed.additional : [];
          setUserSkills({
            primary_skills: primarySkills,
            additional_skills: additionalSkills,
          });
        } else {
          // Default format
          setUserSkills({
            primary_skills: [],
            additional_skills: [],
          });
        }
        
        // Check if skills are complete
        const currentSkills = parsed.primary_skills && parsed.additional_skills 
          ? { primary_skills: parsed.primary_skills, additional_skills: parsed.additional_skills }
          : { primary_skills: parsed.primary ? [parsed.primary] : [], additional_skills: Array.isArray(parsed.additional) ? parsed.additional : [] };
          
        if (currentSkills.primary_skills.length > 0 && currentSkills.additional_skills.length > 0) {
          console.log('Primary and additional skills found in localStorage, setting skillsStepCompleted to true');
          setSkillsStepCompleted(true);
          localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
        }
      } else {
        // No saved skills - set default structure
        setUserSkills({
          primary_skills: [],
          additional_skills: [],
        });
      }
      
      const savedProfile = localStorage.getItem(`profile_${user.id}`);
      if (savedProfile) {
        console.log('Loaded profileId:', savedProfile);
        setProfileId(parseInt(savedProfile));
      }
      const skillsCompleted = localStorage.getItem(`skillsStepCompleted_${user.id}`);
      if (skillsCompleted === 'true') {
        console.log('skillsStepCompleted found in localStorage as true');
        setSkillsStepCompleted(true);
      } else {
        console.log('skillsStepCompleted in localStorage:', skillsCompleted);
      }
      
      const workPrefsCompleted = localStorage.getItem(`workPreferencesCompleted_${user.id}`);
      if (workPrefsCompleted === 'true') {
        console.log('workPreferencesCompleted found in localStorage as true');
        setWorkPreferencesCompleted(true);
      } else {
        console.log('workPreferencesCompleted in localStorage:', workPrefsCompleted);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error.message);
      // Set default structure on error
      setUserSkills({
        primary_skills: [],
        additional_skills: [],
      });
    }
  };

  const saveToLocalStorage = () => {
    if (!user?.id) {
      console.warn('Cannot save to localStorage: user or user.id is missing');
      return;
    }
    console.log('Saving to localStorage for user:', user.id, 'skillsStepCompleted:', skillsStepCompleted, 'workPreferencesCompleted:', workPreferencesCompleted);
    try {
      localStorage.setItem(`userSkills_${user.id}`, JSON.stringify(userSkills));
      localStorage.setItem(`primarySkill_${user.id}`, JSON.stringify(primarySkill));
      localStorage.setItem(`additionalSkills_${user.id}`, JSON.stringify(additionalSkills));
      localStorage.setItem(`skillsStepCompleted_${user.id}`, skillsStepCompleted.toString());
      localStorage.setItem(`workPreferencesCompleted_${user.id}`, workPreferencesCompleted.toString());
      if (profileId) localStorage.setItem(`profile_${user.id}`, profileId.toString());
    } catch (error) {
      console.error('Error saving to localStorage:', error.message);
    }
  };

  // Ensure userSkills always has the correct structure
  useEffect(() => {
    if (!userSkills.primary_skills || !userSkills.additional_skills) {
      setUserSkills(prev => ({
        primary_skills: prev.primary_skills || [],
        additional_skills: prev.additional_skills || [],
      }));
    }
  }, [userSkills]);

  useEffect(() => {
    if (isMounted.current) {
      saveToLocalStorage();
    }
  }, [userSkills, primarySkill, additionalSkills, profileId, skillsStepCompleted, workPreferencesCompleted]);

  const fetchProfile = async () => {
    if (!user?.id || user?.role_id !== 1) {
      console.warn('No user ID provided for fetching profile or user is not a worker');
      return;
    }
    console.log('Fetching profile for user:', user.id);
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(`${window.location.origin}/api/workers/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        signal: abortController.current.signal,
      });
      console.log('Profile API Response:', response);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Worker fetch failed:', response.status, response.statusText, errorData);
        throw new Error(errorMessage);
      }
      const profile = await response.json();
      console.log('Fetched profile from /api/workers:', JSON.stringify(profile, null, 2));
      if (profile && (profile.profile_id || profile.worker) && isMounted.current) {
        // Set profile ID if available
        if (profile.profile_id) {
          setProfileId(profile.profile_id);
        } else if (profile.profile && profile.profile.id) {
          setProfileId(profile.profile.id);
        }
        
        // Handle structured skills_id format
        const skillsData = profile.worker?.skills_id || {};
        const primarySkills = Array.isArray(skillsData.primary_skills) ? skillsData.primary_skills : [];
        const additionalSkills = Array.isArray(skillsData.additional_skills) ? skillsData.additional_skills : [];
        const totalSkills = primarySkills.length + additionalSkills.length;
        
        const hasCredentials = Array.isArray(profile.worker?.credentials_name) && profile.worker.credentials_name.length > 0;
        
        if (totalSkills >= 2 && hasCredentials) {
          console.log(`Found ${totalSkills} skills (${primarySkills.length} primary, ${additionalSkills.length} additional) and credentials, setting skillsStepCompleted to true`);
          setUserSkills({ 
            primary_skills: primarySkills, 
            additional_skills: additionalSkills 
          });
          setPrimarySkill(primarySkills.length > 0 ? primarySkills[0] : null);
          setAdditionalSkills(additionalSkills);
          setSkillsStepCompleted(true);
          localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
          localStorage.setItem(`isProfileComplete_${user.id}`, 'true');
        } else {
          console.log(`Skills found: ${totalSkills} (${primarySkills.length} primary, ${additionalSkills.length} additional), Credentials: ${hasCredentials ? 'Yes' : 'No'}, setting skillsStepCompleted to false`);
          setUserSkills({ 
            primary_skills: primarySkills, 
            additional_skills: additionalSkills 
          });
          setPrimarySkill(primarySkills.length > 0 ? primarySkills[0] : null);
          setAdditionalSkills(additionalSkills);
          setSkillsStepCompleted(false);
          localStorage.setItem(`skillsStepCompleted_${user.id}`, 'false');
        }
        if (profile.worker?.credentials_name) {
          const creds = profile.worker.credentials_name.map((name, index) => ({
            credentials_name: name,
            credentials_photo: profile.worker.credentials_photo?.[index] || null,
          }));
          setCredentials(creds);
          console.log('Loaded credentials:', creds);
        }
      } else {
        console.error('No profile found for user:', user.id);
        message.error('No profile found. Please create a profile first.');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Profile fetch aborted');
        return;
      }
      console.error('Error fetching profile:', error.message);
      message.error(`Failed to load profile: ${error.message}. Please try again.`);
    }
  };

  const fetchSkills = async () => {
    console.log('Fetching skills');
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      const response = await fetch('/api/skills', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        signal: abortController.current.signal,
      });
      if (!response.ok) {
        console.error('Skills fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch skills');
      }
      const data = await response.json();
      console.log('Fetched skills:', data);
      const skillsWithArrays = data.map(skill => ({
        ...skill,
        sub_skills: Array.isArray(skill.sub_skills) ? skill.sub_skills : [],
      }));
      if (isMounted.current) {
        setAvailableSkills(skillsWithArrays);
        setFilteredSkillsPrimary(skillsWithArrays);
        setFilteredSkillsAdditional(skillsWithArrays);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Skills fetch aborted');
        return;
      }
      console.error('Error fetching skills:', error.message);
      message.error('Failed to load skills: ' + error.message);
    }
  };

  useEffect(() => {
    if (searchTermPrimary.trim() === '') {
      setFilteredSkillsPrimary(availableSkills);
    } else {
      const searchLower = searchTermPrimary.toLowerCase().trim();
      const filtered = availableSkills.filter(skill =>
        skill.name.toLowerCase().includes(searchLower)
      );
      setFilteredSkillsPrimary(filtered);
    }
  }, [searchTermPrimary, availableSkills]);

  useEffect(() => {
    let skillsToFilter = availableSkills;
    // Filter out primary skills from additional skills
    if (userSkills?.primary_skills?.length > 0) {
      skillsToFilter = availableSkills.filter(s => 
        !userSkills.primary_skills.some(primarySkill => parseInt(primarySkill.skill_id) === s.id)
      );
    }
    // Also filter out any skills already in additional skills
    if (userSkills?.additional_skills?.length > 0) {
      skillsToFilter = skillsToFilter.filter(s => 
        !userSkills.additional_skills.some(additionalSkill => parseInt(additionalSkill.skill_id) === s.id)
      );
    }
    if (searchTermAdditional.trim() === '') {
      setFilteredSkillsAdditional(skillsToFilter);
    } else {
      const searchLower = searchTermAdditional.toLowerCase().trim();
      const filtered = skillsToFilter.filter(skill =>
        skill.name.toLowerCase().includes(searchLower)
      );
      setFilteredSkillsAdditional(filtered);
    }
  }, [searchTermAdditional, availableSkills, userSkills]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen, isTypeDropdownOpen]);

  const handlePrimarySkillSelect = (value) => {
    console.log('Selecting primary skill:', value);
    if (userSkills?.primary_skills?.length > 0) {
      message.error('Only one primary skill can be selected.');
      return;
    }
    const totalSkills = (userSkills.primary_skills?.length || 0) + (userSkills.additional_skills?.length || 0);
    if (totalSkills >= 15) {
      message.error('You can only add up to 15 skills. Please remove a skill first.');
      return;
    }
    const skill = availableSkills.find(s => s.id === parseInt(value));
    if (!skill) {
      console.error('Selected skill not found:', value);
      message.error('Invalid skill selected. Please try again.');
      return;
    }
    if (userSkills?.additional_skills?.some(userSkill => parseInt(userSkill.skill_id) === skill.id)) {
      message.error('This skill has already been added as an additional skill.');
      return;
    }
    console.log('Opening sub-skills modal for skill:', skill);
    setIsAddingPrimarySkill(true);
    setSelectedSkill({
      ...skill
    });
    // Initialize with all sub-skills available and none selected
    setAvailableSubSkills(skill.sub_skills || []);
    setSelectedSubSkills([]);
    setShowSkillModal(true);
  };

  const handleAdditionalSkillsSelect = (values) => {
    console.log('Selecting additional skills:', values);
    const totalSkills = (userSkills.primary_skills?.length || 0) + (userSkills.additional_skills?.length || 0);
    const newSkills = values
      .map(id => availableSkills.find(s => s.id === parseInt(id)))
      .filter(skill => skill && 
        !(userSkills.additional_skills || []).some(userSkill => parseInt(userSkill.skill_id) === skill.id) && 
        !(userSkills.primary_skills || []).some(primarySkill => parseInt(primarySkill.skill_id) === skill.id));
    
    if (totalSkills + newSkills.length > 15) {
      message.error(`You can only add up to 15 skills. You can add ${15 - totalSkills} more skill(s).`);
      return;
    }
    if (newSkills.length > 0) {
      console.log('Opening sub-skills modal for additional skills:', newSkills);
      setPendingSkills(newSkills);
      setSelectedSkill({
        ...newSkills[0]
      });
      // Initialize with all sub-skills available and none selected
      setAvailableSubSkills(newSkills[0].sub_skills || []);
      setSelectedSubSkills([]);
      setShowSkillModal(true);
    } else {
      message.error('All selected skills are already added or invalid.');
    }
  };

  const handleAdditionalSkillToggle = (skill) => {
    console.log('Toggling additional skill:', skill);
    const totalSkills = (userSkills.primary_skills?.length || 0) + (userSkills.additional_skills?.length || 0);
    
    // Check if skill is already selected
    const isAlreadySelected = userSkills.additional_skills?.some(userSkill => parseInt(userSkill.skill_id) === skill.id);
    
    if (isAlreadySelected) {
      // Remove skill
      handleRemoveSkill(skill.id, false);
    } else {
      // Add skill
      if (totalSkills >= 15) {
        message.error('You can only add up to 15 skills. Please remove a skill first.');
        return;
      }
      
      // Check if it's already a primary skill
      if (userSkills.primary_skills?.some(primarySkill => parseInt(primarySkill.skill_id) === skill.id)) {
        message.error('This skill has already been added as a primary skill.');
        return;
      }
      
      // Add the skill
      setIsAddingPrimarySkill(false);
      setPendingSkills([skill]);
      setSelectedSkill({
        ...skill
      });
      setAvailableSubSkills(skill.sub_skills || []);
      setSelectedSubSkills([]);
      setShowSkillModal(true);
    }
  };

  const handleWorkingDayToggle = (day) => {
    console.log('Toggling working day:', day);
    
    const isSelected = preferredWorkingHours.includes(day);
    
    if (isSelected) {
      // Remove day
      setPreferredWorkingHours(prev => prev.filter(d => d !== day));
    } else {
      // Add day
      setPreferredWorkingHours(prev => [...prev, day]);
    }
  };

  const handleSkillItemClick = (skill, action) => {
    console.log('Skill item action:', action, 'for skill:', skill);
    console.log('Available skills count:', availableSkills.length);
    if (action === 'edit') {
      const skillId = skill.skill_id || skill.id;
      console.log('Looking for skill ID:', skillId, 'as integer:', parseInt(skillId));
      const originalSkill = availableSkills.find(s => s.id === parseInt(skillId));
      if (!originalSkill) {
        console.error('Skill not found for editing:', skillId, 'Available skills:', availableSkills.map(s => ({ id: s.id, name: s.name })));
        return;
      }
      console.log('Editing skill:', originalSkill);
      const alreadySelectedSubSkills = skill.sub_skills || [];
      const allSubSkills = originalSkill.sub_skills || [];
      const availableSubSkills = allSubSkills.filter(subSkill => !alreadySelectedSubSkills.includes(subSkill));
      
      // Determine if this is a primary or additional skill being edited
      const isPrimarySkill = userSkills.primary_skills && userSkills.primary_skills.some(ps => ps.skill_id === skillId);
      setIsAddingPrimarySkill(isPrimarySkill);
      
      setSelectedSkill({ 
        ...skill, 
        sub_skills: originalSkill.sub_skills || []
      });
      setAvailableSubSkills(availableSubSkills);
      setSelectedSubSkills(alreadySelectedSubSkills);
      setShowSkillModal(true);
    } else if (action === 'remove') {
      const skillId = skill.skill_id || skill.id;
      // Determine if this is a primary or additional skill being removed
      const isPrimarySkill = userSkills.primary_skills && userSkills.primary_skills.some(ps => ps.skill_id === skillId);
      console.log('Removing skill:', skillId, 'isPrimary:', isPrimarySkill);
      handleRemoveSkill(skillId, isPrimarySkill);
    }
  };

  const handleAddSubSkill = (subSkill) => {
    console.log('Adding sub-skill:', subSkill);
    if (selectedSubSkills.includes(subSkill)) {
      message.error('This sub-skill is already selected.');
      return;
    }
    setSelectedSubSkills(prev => [...prev, subSkill]);
    setAvailableSubSkills(prev => prev.filter(s => s !== subSkill));
    
    // Update the selected skill's sub_skills to reflect the change
    if (selectedSkill) {
      const updatedSubSkills = [...selectedSubSkills, subSkill];
      setSelectedSkill(prev => ({
        ...prev,
        sub_skills: updatedSubSkills
      }));
    }
  };

  const handleRemoveSubSkill = (subSkill) => {
    console.log('Removing sub-skill:', subSkill);
    setSelectedSubSkills(prev => prev.filter(s => s !== subSkill));
    setAvailableSubSkills(prev => [...prev, subSkill].sort());
    
    // Update the selected skill's sub_skills to reflect the change
    if (selectedSkill) {
      const updatedSubSkills = selectedSubSkills.filter(s => s !== subSkill);
      setSelectedSkill(prev => ({
        ...prev,
        sub_skills: updatedSubSkills
      }));
    }
  };

  const handleNewCredentialChange = (e, field) => {
    console.log('Changing credential field:', field);
    const value = e.target?.type === "file" ? e.target.files[0] : e.target?.value || e;
    if ((field === "credentials_photo" || field === "credentials_doc") && value) {
      if (field === "credentials_photo") {
        // Validate photo files (JPG, PNG only)
        if (!["image/jpeg", "image/png"].includes(value.type)) {
          setErrors((prev) => ({
            ...prev,
            new_credential_photo: "Photo must be JPG or PNG",
          }));
          return;
        }
      } else if (field === "credentials_doc") {
        // Validate document files (PDF, DOC, DOCX only)
        if (![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(value.type)) {
          setErrors((prev) => ({
            ...prev,
            new_credential_doc: "Document must be PDF, DOC, or DOCX",
          }));
          return;
        }
      }
      
      if (value.size > 2048 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [field === "credentials_photo" ? "new_credential_photo" : "new_credential_doc"]: "File must not exceed 2 MB",
        }));
        return;
      }
    }
    setNewCredential((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "", new_credential_doc: "" }));
  };

  const addCredential = () => {
    console.log('Adding/updating credential:', newCredential, 'editing index:', editingCredentialIndex);
    if (!selectedCredentialCategory) {
      setErrors((prev) => ({ ...prev, new_credential_category: "Please select a credential category" }));
      return;
    }
    if (!newCredential.credentials_name) {
      setErrors((prev) => ({ ...prev, new_credential_name: "Please select a credential type" }));
      return;
    }
    // At least one file (photo or document) is required
    if (credentials.length === 0 && (!newCredential.credentials_photo && !newCredential.credentials_doc)) {
      setErrors((prev) => ({ ...prev, new_credential_photo: "Please upload at least one file (photo or document)" }));
      return;
    }

    const credentialData = { ...newCredential, category: selectedCredentialCategory };

    if (editingCredentialIndex !== null) {
      // Update existing credential
      setCredentials((prev) => 
        prev.map((cred, index) => 
          index === editingCredentialIndex ? credentialData : cred
        )
      );
      console.log('Updated credential at index:', editingCredentialIndex);
    } else {
      // Add new credential
      setCredentials((prev) => [...prev, credentialData]);
      console.log('Added new credential');
    }

    // Reset form
    setNewCredential({ credentials_name: "", credentials_photo: null, credentials_doc: null });
    setSelectedCredentialCategory("");
    setEditingCredentialIndex(null);
    setErrors((prev) => ({ ...prev, new_credential_category: "", new_credential_name: "", new_credential_photo: "", new_credential_doc: "" }));
    if (credentialFileRef.current) {
      credentialFileRef.current.value = "";
    }
  };

  const removeCredential = (index) => {
    console.log('Removing credential at index:', index);
    setCredentials((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, credentials: "" }));
  };

  const handleSaveSkill = async () => {
    console.log('Saving skill:', selectedSkill);
    if (!selectedSkill) {
      message.error('Please select a skill');
      return;
    }
    // Only require sub-skills if the skill has sub-skills available
    if (selectedSkill.sub_skills?.length > 0 && selectedSubSkills.length === 0) {
      message.error('Please select at least one sub-skill for this skill.');
      return;
    }
    if (!profileId) {
      message.error('Profile not loaded. Please wait and try again.');
      return;
    }

    const newSkill = {
      skill_id: String(selectedSkill.skill_id || selectedSkill.id),
      skill_name: selectedSkill.skill_name || selectedSkill.name,
      sub_skills: selectedSubSkills,
      experience: selectedSkill.experience || '0-11-months',
    };

    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      message.error('Authentication token missing. Please log in again.');
      return;
    }

    try {
      const skillId = selectedSkill.skill_id || selectedSkill.id;
      const skillName = selectedSkill.skill_name || selectedSkill.name;
      
      // Check if this is an existing skill being edited
      const isExistingSkill = userSkills.primary_skills.some(skill => skill.skill_id === newSkill.skill_id) ||
                             userSkills.additional_skills.some(skill => skill.skill_id === newSkill.skill_id);
      
      if (isExistingSkill) {
        // Update existing skill using the updateSkills endpoint
        console.log('Updating existing skill:', {
          user_id: user.id,
          skills_id: userSkills,
          updated_skill: newSkill,
        });
        
        // Update the skill in the appropriate array
        const updatedSkills = { ...userSkills };
        const primaryIndex = updatedSkills.primary_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
        if (primaryIndex !== -1) {
          updatedSkills.primary_skills[primaryIndex] = { 
            ...updatedSkills.primary_skills[primaryIndex], 
            sub_skills: newSkill.sub_skills,
            experience: newSkill.experience
          };
        } else {
          const additionalIndex = updatedSkills.additional_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
          if (additionalIndex !== -1) {
            updatedSkills.additional_skills[additionalIndex] = { 
              ...updatedSkills.additional_skills[additionalIndex], 
              sub_skills: newSkill.sub_skills,
              experience: newSkill.experience
            };
          }
        }
        
        const response = await fetch(`/api/workers/${user.id}/skills`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            skills_id: updatedSkills
          }),
          signal: abortController.current.signal,
        });
        
        if (!response.ok) {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error('Error response from /api/workers/updateSkills:', errorData);
          const errorMsg = errorData.message || errorData.error || (errorData.errors ? Object.values(errorData.errors)[0]?.[0] : 'Failed to update skill');
          throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('Skill update response:', data);
        
        // Update local state
        if (isMounted.current) {
          setUserSkills(updatedSkills);
          message.success('Skill updated successfully');
        }
      } else {
        // Add new skill using the add-skill endpoint
        console.log('Adding new skill:', {
          profile_id: profileId,
          skill_id: skillId,
          skill_name: skillName,
          sub_skills: selectedSubSkills,
        });
        
        const response = await fetch('/api/add-skill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            profile_id: profileId,
            skill_id: skillId,
            skill_name: skillName,
            sub_skills: selectedSubSkills.length > 0 ? selectedSubSkills : [],
            experience: selectedSkill.experience || '0-11-months',
          }),
          signal: abortController.current.signal,
        });
        
        if (!response.ok) {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error('Error response from /api/add-skill:', errorData);
          const errorMsg = errorData.message || errorData.error || (errorData.errors ? Object.values(errorData.errors)[0]?.[0] : 'Failed to save skill');
          throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log('Skill response:', data);

        if (data.message === 'Skill already added') {
          // Skill already exists in database, add it to local state
          if (isMounted.current) {
            setUserSkills(prev => {
              // Check if skill already exists in local state
              const existsInPrimary = prev.primary_skills.some(skill => skill.skill_id === newSkill.skill_id);
              const existsInAdditional = prev.additional_skills.some(skill => skill.skill_id === newSkill.skill_id);
              
              let updated;
              if (existsInPrimary || existsInAdditional) {
                // Update existing skill
                updated = { ...prev };
                if (existsInPrimary) {
                  const index = updated.primary_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
                  updated.primary_skills[index] = { 
                    ...updated.primary_skills[index], 
                    sub_skills: newSkill.sub_skills,
                    experience: newSkill.experience
                  };
                } else {
                  const index = updated.additional_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
                  updated.additional_skills[index] = { 
                    ...updated.additional_skills[index], 
                    sub_skills: newSkill.sub_skills,
                    experience: newSkill.experience
                  };
                }
              } else {
                // Add new skill to local state
                if (isAddingPrimarySkill) {
                  // For primary skills, replace the existing one (only one primary skill allowed)
                  updated = { ...prev, primary_skills: [newSkill] };
                } else {
                  updated = { ...prev, additional_skills: [...prev.additional_skills, newSkill] };
                }
              }
              
              // Check if we have enough skills to complete the step
              const totalSkills = (updated.primary_skills?.length || 0) + (updated.additional_skills?.length || 0);
              if (totalSkills >= 2) {
                console.log('Total skills >= 2 after adding, setting skillsStepCompleted to true');
                setSkillsStepCompleted(true);
                localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
              }
              
              return updated;
            });
            message.success('Skill added successfully');
          }
        } else {
          // New skill added successfully
          if (isMounted.current) {
            setUserSkills(prev => {
              // Add new skill - use the flag to determine if it should be primary or additional
              let updated;
              if (isAddingPrimarySkill) {
                // For primary skills, replace the existing one (only one primary skill allowed)
                updated = { ...prev, primary_skills: [newSkill] };
              } else {
                updated = { ...prev, additional_skills: [...prev.additional_skills, newSkill] };
              }
              
              // Check if we have enough skills to complete the step
              const totalSkills = (updated.primary_skills?.length || 0) + (updated.additional_skills?.length || 0);
              if (totalSkills >= 2) {
                console.log('Total skills >= 2 after adding, setting skillsStepCompleted to true');
                setSkillsStepCompleted(true);
                localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
              }
              
              return updated;
            });
            message.success('Skill added successfully');
          }
        }
      }

      if (isMounted.current) {
        setPendingSkills(prev => {
          const nextSkills = prev.filter(skill => skill.id !== selectedSkill.id);
          if (nextSkills.length > 0) {
            setTimeout(() => {
              if (isMounted.current) {
                setSelectedSkill(nextSkills[0]);
                // Initialize with all sub-skills available and none selected
                setAvailableSubSkills(nextSkills[0].sub_skills || []);
                setSelectedSubSkills([]);
              }
            }, 100);
            return nextSkills;
          } else {
            setShowSkillModal(false);
            setSelectedSkill(null);
            setAvailableSubSkills([]);
            setSelectedSubSkills([]);
            setIsAddingPrimarySkill(false);
            return [];
          }
        });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Skill save aborted');
        return;
      }
      console.error('Error saving skill:', error.message);
      message.error(`Failed to save skill: ${error.message}. Please try again.`);
    }
  };

  const handleRemoveSkill = async (skillId, isPrimarySkill = false) => {
    console.log('Removing skill:', skillId, 'isPrimary:', isPrimarySkill);
    if (!profileId) {
      message.error('Profile not loaded. Please wait and try again.');
      return;
    }

    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      message.error('Authentication token missing. Please log in again.');
      return;
    }

    // First, update the local state
    let updatedSkills = {
      primary_skills: [],
      additional_skills: []
    };
    
    if (isPrimarySkill) {
      // Remove primary skill, keep additional skills intact
      updatedSkills = {
        primary_skills: [],
        additional_skills: userSkills.additional_skills || []
      };
    } else {
      // Remove from additional skills, keep primary
      updatedSkills = {
        primary_skills: userSkills.primary_skills || [],
        additional_skills: (userSkills.additional_skills || []).filter(s => s.skill_id !== skillId)
      };
    }

    console.log('Updated skills object:', updatedSkills);

    try {
      // Use the updateSkills endpoint instead of remove-skill
      console.log('Sending request to /api/workers/updateSkills:', {
        user_id: user.id,
        skills_id: updatedSkills
      });
      const response = await fetch(`/api/workers/${user.id}/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          skills_id: updatedSkills
        }),
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Error response from /api/workers/updateSkills:', errorData);
        const errorMsg = errorData.message || errorData.error || (errorData.errors ? Object.values(errorData.errors)[0]?.[0] : 'Failed to remove skill');
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Update skills response:', data);

      if (isMounted.current) {
        // Update local state with the new skills object
        setUserSkills(updatedSkills);
        
        setPrimarySkill(updatedSkills.primary_skills.length > 0 ? updatedSkills.primary_skills[0] : null);
        setAdditionalSkills(updatedSkills.additional_skills);
        setPendingSkills(prev => prev.filter(s => s.id !== skillId));
        
        // Recalculate total skills after removal
        const totalSkills = updatedSkills.primary_skills.length + updatedSkills.additional_skills.length;
        
        console.log('Total skills after removal:', totalSkills, 'isPrimary:', isPrimarySkill);
        if (totalSkills < 2) {
          console.log('Skills reduced to <2, setting skillsStepCompleted to false');
          setSkillsStepCompleted(false);
          localStorage.setItem(`skillsStepCompleted_${user.id}`, 'false');
        }
        
        message.success('Skill removed successfully');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Remove skill aborted');
        return;
      }
      console.error('Error removing skill:', error.message);
      message.error(`Failed to remove skill: ${error.message}. Please try again.`);
    }
  };

  const handleModalClose = () => {
    console.log('Closing skill modal');
    if (isMounted.current) {
      setPendingSkills(prev => {
        const skillId = selectedSkill?.skill_id || selectedSkill?.id;
        const nextSkills = prev.filter(skill => skill.id !== skillId);
        if (nextSkills.length > 0) {
          setSelectedSkill(nextSkills[0]);
          // Initialize with all sub-skills available and none selected
          setAvailableSubSkills(nextSkills[0].sub_skills || []);
          setSelectedSubSkills([]);
          return nextSkills;
        } else {
          setShowSkillModal(false);
          setSelectedSkill(null);
          setAvailableSubSkills([]);
          setSelectedSubSkills([]);
          setIsAddingPrimarySkill(false);
          return [];
        }
      });
    }
  };

  const handleNextStep = () => {
    console.log('Next step clicked, userSkills:', userSkills);
    if ((userSkills.primary_skills?.length || 0) === 0 || (userSkills.additional_skills?.length || 0) === 0) {
      message.error('Please select 1 primary skill and at least 1 additional skill before proceeding.');
      return;
    }
    setSkillsStepCompleted(true);
    localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
    console.log('skillsStepCompleted set to true, moving to step 5');
    setStep(5);
  };

  const handlePreviousStep = () => {
    console.log('Previous step clicked');
    if (step === 5) {
      setStep(4);
    } else if (step === 4) {
      setStep(3);
    }
  };

  const handleFinalFinish = async () => {
    console.log('Final finish clicked, profileId:', profileId, 'userSkills:', userSkills);
    if (!profileId) {
      message.error('Profile ID not found. Please create a profile first.');
      return;
    }
    if ((userSkills.primary_skills?.length || 0) === 0 || (userSkills.additional_skills?.length || 0) === 0) {
      message.error('Please select at least 1 primary and 1 additional skill.');
      return;
    }
    // Check if at least one credential is provided
    if (credentials.length === 0) {
      message.error('Please add at least one credential to complete your profile.');
      return;
    }

    const skillsId = {
      primary_skills: (userSkills.primary_skills || []).map(skill => ({
        ...skill,
        sub_skills: skill.sub_skills || [],
      })),
      additional_skills: (userSkills.additional_skills || []).map(skill => ({
        ...skill,
        sub_skills: skill.sub_skills || [],
      })),
    };

    const submitData = new FormData();
    submitData.append('profile_id', profileId);
    submitData.append('hours_per_day', hoursPerDay);
    submitData.append('preferred_working_days', JSON.stringify(preferredWorkingHours));
    submitData.append('bio', bio);

    // Add primary skills
    skillsId.primary_skills.forEach((skill, index) => {
      submitData.append(`skills_id[primary_skills][${index}][skill_id]`, skill.skill_id);
      submitData.append(`skills_id[primary_skills][${index}][skill_name]`, skill.skill_name);
      submitData.append(`skills_id[primary_skills][${index}][experience]`, skill.experience || '0-11-months');
      skill.sub_skills.forEach((subSkill, subIndex) => {
        submitData.append(`skills_id[primary_skills][${index}][sub_skills][${subIndex}]`, subSkill);
      });
    });

    // Add additional skills
    skillsId.additional_skills.forEach((skill, index) => {
      submitData.append(`skills_id[additional_skills][${index}][skill_id]`, skill.skill_id);
      submitData.append(`skills_id[additional_skills][${index}][skill_name]`, skill.skill_name);
      submitData.append(`skills_id[additional_skills][${index}][experience]`, skill.experience || '0-11-months');
      skill.sub_skills.forEach((subSkill, subIndex) => {
        submitData.append(`skills_id[additional_skills][${index}][sub_skills][${subIndex}]`, subSkill);
      });
    });

    credentials.forEach((cred, index) => {
      submitData.append(`credentials[${index}][credentials_name]`, cred.credentials_name);
      if (cred.credentials_photo instanceof File) {
        submitData.append(`credentials[${index}][credentials_photo]`, cred.credentials_photo);
      }
      if (cred.credentials_doc instanceof File) {
        submitData.append(`credentials[${index}][credentials_doc]`, cred.credentials_doc);
      }
    });

    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      message.error('Authentication token missing. Please log in again.');
      return;
    }

    try {
      console.log('Submitting complete profile data:', {
        profile_id: profileId,
        hours_per_day: hoursPerDay,
        preferred_working_days: preferredWorkingHours,
        skills_id: skillsId,
        credentials_count: credentials.length,
      });
      const response = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: submitData,
        signal: abortController.current.signal,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || (errorData.errors ? Object.values(errorData.errors)[0][0] : 'Failed to complete profile');
        throw new Error(errorMsg);
      }

      if (isMounted.current) {
        console.log('Profile completed, clearing localStorage and navigating');
        localStorage.setItem(`isProfileComplete_${user.id}`, 'true');
        localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
        localStorage.removeItem(`userSkills_${user.id}`);
        localStorage.removeItem(`primarySkill_${user.id}`);
        localStorage.removeItem(`additionalSkills_${user.id}`);
        localStorage.removeItem(`profile_${user.id}`);
        
        // Dispatch profileCompleted event to hide notification immediately
        window.dispatchEvent(new CustomEvent('profileCompleted'));
        
        onComplete();
        if (window.location.pathname.includes('/skill-rating')) {
          // If used as a page, use window.location
          window.location.href = '/homepage';
        } else {
          // If used as a modal, use navigate
          navigate('/homepage');
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Profile completion aborted');
        return;
      }
      console.error('Error completing profile:', error.message);
      message.error(`Failed to complete profile: ${error.message}. Please try again.`);
    }
  };

  const skillMenu = (skill) => ({
    items: [
      {
        key: 'edit',
        label: 'Edit',
        onClick: () => handleSkillItemClick(skill, 'edit')
      },
      {
        key: 'remove',
        label: 'Remove',
        onClick: () => handleSkillItemClick(skill, 'remove')
      }
    ]
  });

  // When used as a page, always render (isOpen is always true)
  // When used as a modal, check isOpen condition
  if (!isOpen && !window.location.pathname.includes('/skill-rating')) {
    console.log('SkillRatingModal not rendered: isOpen=', isOpen, 'user.id=', user?.id, 'isProfileComplete=', isProfileComplete, 'user.role_id=', user?.role_id);
    return null;
  }

  if (!user?.id || isProfileComplete || user?.role_id === 2) {
    console.log('SkillRatingModal not rendered: user.id=', user?.id, 'isProfileComplete=', isProfileComplete, 'user.role_id=', user?.role_id);
    return null;
  }

  return (
    <div className="skill-rating-overlay">
      <div 
        ref={containerRef}
        className={`skill-rating-container ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}
      >
        <div className="progress-side">
          {!isMobile && (
            <>
              <div className="logo">Worqo</div>
              <h2>Let's Get You Started!</h2>
            </>
          )}
          <div className="progress-steps">
            <div className="step completed">
              <div className="step-number">✓</div>
              {!isMobile && <span>Register for an account</span>}
            </div>
            <div className="step completed">
              <div className="step-number">✓</div>
              {!isMobile && <span>Create profile</span>}
            </div>
            <div className={`step ${step === 3 ? 'current' : workPreferencesCompleted ? 'completed' : ''}`}>
              <div className="step-number">{workPreferencesCompleted ? '✓' : '3'}</div>
              {!isMobile && <span>Work Preferences</span>}
            </div>
            <div className={`step ${step === 4 ? 'current' : skillsStepCompleted ? 'completed' : ''}`}>
              <div className="step-number">{skillsStepCompleted ? '✓' : '4'}</div>
              {!isMobile && <span>Skills & Experience</span>}
            </div>
            <div className={`step ${step === 5 ? 'current' : ''}`}>
              <div className="step-number">5</div>
              {!isMobile && <span>Credentials</span>}
            </div>
          </div>
        </div>
        <div className="skill-side">
          <div className="step-indicator">
            <span className="step-number">{step}</span>
            <span className="step-title">
              {step === 3 ? 'Work Preferences' : 
               step === 4 ? 'Skills & Experience' : 
               'Credentials'}
            </span>
          </div>
          {step === 3 && (
            <>
              <div className="step-header">
                <h1>Work Preferences</h1>
                <p className="step-description">Tell us about your work preferences to help employers understand your availability and expectations.</p>
              </div>

              <div className="form-section">
                <div className="section-title">Your Work Preferences</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Hours Per Day <span className="required">*</span></label>
                    <Input
                      type="number"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(parseInt(e.target.value) || 1)}
                      min="1"
                      max="24"
                      className="form-input"
                    />
                    <span className="form-help">How long you are willing or able to work each day</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Working Days <span className="required">*</span></label>
                    <div className="custom-multi-dropdown" ref={workingDaysDropdownRef}>
                      <div 
                        className="multi-dropdown-trigger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Working days dropdown clicked, current state:', isWorkingDaysDropdownOpen);
                          setIsWorkingDaysDropdownOpen(!isWorkingDaysDropdownOpen);
                        }}
                      >
                        <div className="multi-dropdown-value">
                          {preferredWorkingHours.length > 0 
                            ? formatPreferredWorkingDays(preferredWorkingHours)
                            : 'Select preferred working days'
                          }
                        </div>
                        <span className={`dropdown-arrow ${isWorkingDaysDropdownOpen ? 'open' : ''}`}>
                          <IconChevronDown size={16} />
                        </span>
                      </div>
                      {isWorkingDaysDropdownOpen && (
                        <div className="multi-dropdown-menu">
                          <div className="dropdown-items">
                            {workingDaysOptions.map(option => {
                              const isSelected = preferredWorkingHours.includes(option.value);
                              
                              return (
                                <div
                                  key={option.value}
                                  className={`multi-dropdown-item ${isSelected ? 'selected' : ''}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleWorkingDayToggle(option.value);
                                  }}
                                >
                                  <span className="item-text">{option.label}</span>
                                  {isSelected && <span className="checkmark">✓</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="form-help">Select your preferred working days</span>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Professional Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell potential employers about yourself, your experience, and what makes you unique..."
                    className="form-textarea"
                    rows={4}
                    maxLength={500}
                  />
                  <span className="form-help">Briefly describe yourself and your professional background (optional)</span>
                  <div className="character-count">{bio.length}/500</div>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <SkillsExperience
              userSkills={userSkills}
              setUserSkills={setUserSkills}
              availableSkills={availableSkills}
              setAvailableSkills={setAvailableSkills}
              filteredSkillsPrimary={filteredSkillsPrimary}
              setFilteredSkillsPrimary={setFilteredSkillsPrimary}
              filteredSkillsAdditional={filteredSkillsAdditional}
              setFilteredSkillsAdditional={setFilteredSkillsAdditional}
              searchTermPrimary={searchTermPrimary}
              setSearchTermPrimary={setSearchTermPrimary}
              searchTermAdditional={searchTermAdditional}
              setSearchTermAdditional={setSearchTermAdditional}
              primarySkill={primarySkill}
              setPrimarySkill={setPrimarySkill}
              additionalSkills={additionalSkills}
              setAdditionalSkills={setAdditionalSkills}
              selectedSubSkills={selectedSubSkills}
              setSelectedSubSkills={setSelectedSubSkills}
              availableSubSkills={availableSubSkills}
              setAvailableSubSkills={setAvailableSubSkills}
              selectedSkill={selectedSkill}
              setSelectedSkill={setSelectedSkill}
              showSkillModal={showSkillModal}
              setShowSkillModal={setShowSkillModal}
              pendingSkills={pendingSkills}
              setPendingSkills={setPendingSkills}
              profileId={profileId}
              user={user}
              handlePrimarySkillSelect={handlePrimarySkillSelect}
              handleAdditionalSkillsSelect={handleAdditionalSkillsSelect}
              handleAdditionalSkillToggle={handleAdditionalSkillToggle}
              handleSkillItemClick={handleSkillItemClick}
              handleAddSubSkill={handleAddSubSkill}
              handleRemoveSubSkill={handleRemoveSubSkill}
              handleSaveSkill={handleSaveSkill}
              handleRemoveSkill={handleRemoveSkill}
              handleModalClose={handleModalClose}
              isWorkTypeDropdownOpen={isPrimarySkillsDropdownOpen}
              setIsWorkTypeDropdownOpen={setIsPrimarySkillsDropdownOpen}
              isAdditionalSkillsDropdownOpen={isAdditionalSkillsDropdownOpen}
              setIsAdditionalSkillsDropdownOpen={setIsAdditionalSkillsDropdownOpen}
              workTypeDropdownRef={primarySkillsDropdownRef}
              additionalSkillsDropdownRef={additionalSkillsDropdownRef}
              fetchSkills={fetchSkills}
              handleNextStep={handleNextStep}
              handlePreviousStep={handlePreviousStep}
            />
          )}

          {step === 5 && (
            <>
              <div className="step-header">
                <h1>Add Your Credentials</h1>
                <p className="step-description">Upload relevant documents to support your skills and build trust with potential employers.</p>
              </div>
              <form id="worker-credentials-form" name="worker-credentials-form" className="worker-credentials-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-section">
                <div className="section-title">Professional Credentials</div>
                <p className="section-description">Add any relevant credentials to support your skills (optional but recommended).</p>

                <div className="credentials-section">
                  <div className="credential-form">
                    <div className="form-group">
                      <label className="form-label">Credential Category</label>
                      <div className={`custom-dropdown ${isCategoryDropdownOpen ? 'dropdown-open' : ''}`} ref={categoryDropdownRef}>
                        <div
                          className="dropdown-trigger"
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={isCategoryDropdownOpen}
                          aria-haspopup="listbox"
                        >
                          <span className="dropdown-value">
                            {selectedCredentialCategory 
                              ? credentialCategories.find(cat => cat.value === selectedCredentialCategory)?.label
                              : 'Choose a Credential Category'
                            }
                          </span>
                          <span className={`dropdown-arrow ${isCategoryDropdownOpen ? 'open' : ''}`}>
                            <IconChevronDown
                              size={16}
                              className="chevron-icon"
                              style={{
                                transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease'
                              }}
                            />
                          </span>
                        </div>
                        
                        {isCategoryDropdownOpen && (
                          <div className="dropdown-menu">
                            <div className="dropdown-items">
                              {credentialCategories.map((option) => (
                                <div
                                  key={option.value}
                                  className={`dropdown-item ${selectedCredentialCategory === option.value ? 'selected' : ''}`}
                                  onClick={() => {
                                    setSelectedCredentialCategory(option.value);
                                    setNewCredential(prev => ({ ...prev, credentials_name: "", credentials_photo: null }));
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                >
                                  <span className="item-text">{option.label}</span>
                                  {selectedCredentialCategory === option.value && (
                                    <span className="checkmark">✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {errors.new_credential_category && <span className="error-message">{errors.new_credential_category}</span>}
                    </div>

                    {selectedCredentialCategory && (
                      <div className="form-group">
                        <label className="form-label">Credential Type</label>
                        <div className={`custom-dropdown ${isTypeDropdownOpen ? 'dropdown-open' : ''}`} ref={typeDropdownRef}>
                          <div
                            className="dropdown-trigger"
                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                            tabIndex={0}
                            role="button"
                            aria-expanded={isTypeDropdownOpen}
                            aria-haspopup="listbox"
                          >
                            <span className="dropdown-value">
                              {newCredential.credentials_name
                                ? credentialSubTypes[selectedCredentialCategory]?.find(option => option.value === newCredential.credentials_name)?.label
                                : 'Choose a Credential Type'
                              }
                            </span>
                            <span className={`dropdown-arrow ${isTypeDropdownOpen ? 'open' : ''}`}>
                              <IconChevronDown
                                size={16}
                                className="chevron-icon"
                                style={{
                                  transform: isTypeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.3s ease'
                                }}
                              />
                            </span>
                          </div>
                          
                          {isTypeDropdownOpen && (
                            <div className="dropdown-menu">
                              <div className="dropdown-items">
                                {credentialSubTypes[selectedCredentialCategory]?.map(option => (
                                  <div
                                    key={option.value}
                                    className={`dropdown-item ${newCredential.credentials_name === option.value ? 'selected' : ''}`}
                                    onClick={() => {
                                      handleNewCredentialChange({ target: { value: option.value } }, "credentials_name");
                                      setIsTypeDropdownOpen(false);
                                    }}
                                  >
                                    <span className="item-text">{option.label}</span>
                                    {newCredential.credentials_name === option.value && (
                                      <span className="checkmark">✓</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {errors.new_credential_name && <span className="error-message">{errors.new_credential_name}</span>}
                      </div>
                    )}

                    {newCredential.credentials_name && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Upload Photo/Image</label>
                          <div className="file-upload-container">
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              onChange={(e) => handleNewCredentialChange(e, "credentials_photo")}
                              ref={credentialFileRef}
                              className="file-input"
                              id="worker-credential-photo"
                            />
                            <label htmlFor="worker-credential-photo" className="file-upload-label">
                              <span className="upload-text">Choose photo (JPG, PNG Max 2MB)</span>
                            </label>
                          </div>
                          {newCredential.credentials_photo && (
                            <div className="file-preview">
                              <span className="file-name">{newCredential.credentials_photo.name}</span>
                            </div>
                          )}
                          {errors.new_credential_photo && <span className="error-message">{errors.new_credential_photo}</span>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Upload Document (Optional)</label>
                          <div className="file-upload-container">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => handleNewCredentialChange(e, "credentials_doc")}
                              className="file-input"
                              id="worker-credential-doc"
                            />
                            <label htmlFor="worker-credential-doc" className="file-upload-label">
                              <span className="upload-text">Choose document (PDF, DOC, DOCX Max 2MB)</span>
                            </label>
                          </div>
                          {newCredential.credentials_doc && (
                            <div className="file-preview">
                              <span className="file-name">{newCredential.credentials_doc.name}</span>
                            </div>
                          )}
                          {errors.new_credential_doc && <span className="error-message">{errors.new_credential_doc}</span>}
                        </div>
                      </>
                    )}

                    {newCredential.credentials_name && (newCredential.credentials_photo || newCredential.credentials_doc) && (
                      <div className="form-group">
                        <button 
                          type="button" 
                          onClick={addCredential}
                          className="add-credential-btn"
                        >
                          {editingCredentialIndex !== null ? 'Update Credential' : 'Add Credential'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </form>

               <div className="form-section added-credentials-section">
                 <div className="section-title">Added Credentials ({credentials.length})</div>
                 {credentials.length > 0 ? (
                   credentials.map((cred, index) => (
                    <div key={index} className="credential-card-container">
                      <div 
                        className="credential-card"
                        onClick={() => {
                          // Edit credential functionality - make entire card clickable
                          setNewCredential(cred);
                          setSelectedCredentialCategory(cred.category || "");
                          setEditingCredentialIndex(index); // Set the index of the credential being edited
                          // Scroll to form
                          document.querySelector('.credential-form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                         <div className="credential-header">
                           <span className="credential-name">{cred.credentials_name}</span>
                           <button 
                             type="button"
                             className="remove-credential-btn" 
                             title="Remove credential"
                             style={{
                               background: 'transparent',
                               backgroundColor: 'transparent',
                               border: 'none',
                               padding: 0,
                               margin: 0,
                               boxShadow: 'none'
                             }}
                             onClick={(e) => {
                               e.stopPropagation(); // Prevent card click when removing
                               removeCredential(index);
                             }}
                           >
                             <IconX size={16} />
                           </button>
                         </div>
                         <div className="credential-info">
                           <div className="credential-category">
                             <span className="category-label">Category:</span>
                             <span className="category-value">
                               {cred.category ? credentialCategories.find(cat => cat.value === cred.category)?.label : 'Professional Credential'}
                             </span>
                           </div>
                           <div className="credential-files">
                             <span className="files-label">Files:</span>
                             <span className="files-list">
                               {cred.credentials_photo ? 'Photo' : ''}
                               {cred.credentials_photo && cred.credentials_doc ? ', ' : ''}
                               {cred.credentials_doc ? 'Document' : ''}
                               {!cred.credentials_photo && !cred.credentials_doc ? 'None uploaded' : ''}
                             </span>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="empty-credentials">
                     <span className="empty-text">No credentials added yet</span>
                     <span className="empty-hint">Add credentials to build trust with employers</span>
                   </div>
                 )}
               </div>
            </>
          )}

          <div className="step-navigation">
            {step === 3 ? (
              <button
                className="work-preferences-next-btn"
                onClick={() => {
                  // Validate Work Preferences
                  if (hoursPerDay && preferredWorkingHours.length > 0) {
                    setWorkPreferencesCompleted(true);
                    setStep(4);
                  } else {
                    message.error('Please fill in all required fields');
                  }
                }}
              >
                Next
              </button>
            ) : step === 4 ? (
              <>
                <button 
                  className="skills-experience-back-btn" 
                  onClick={() => setStep(3)}
                >
                  ← Back
                </button>
                <button
                  className="skills-experience-next-btn"
                  onClick={handleNextStep}
                  disabled={(userSkills.primary_skills?.length || 0) === 0 || (userSkills.additional_skills?.length || 0) === 0}
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button 
                  className="credentials-back-btn" 
                  onClick={handlePreviousStep}
                >
                  ← Back
                </button>
                <button
                  className="credentials-complete-btn"
                  onClick={handleFinalFinish}
                  disabled={!profileId}
                >
                  Complete
                </button>
              </>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};


export default SkillRatingModal;
