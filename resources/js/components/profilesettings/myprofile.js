import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { MdEdit } from "react-icons/md";
import '../../../sass/components/profilesettings/myprofile.scss';

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [genders, setGenders] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Rank and reviews states
  const [workerRank, setWorkerRank] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  // Profile form states
  const [profileData, setProfileData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    gender: ''
  });
  
  // Password form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Password visibility states
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Work preferences states (for workers)
  const [workPreferences, setWorkPreferences] = useState({
    workType: '',
    hoursPerDay: '',
    preferredWorkingDays: [],
    bio: ''
  });
  const [isEditingWorkPreferences, setIsEditingWorkPreferences] = useState(false);
  
  // Skills and Experience states (for workers)
  const [workerSkills, setWorkerSkills] = useState({
    primary_skills: [],
    additional_skills: []
  });
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedPrimarySkillId, setSelectedPrimarySkillId] = useState('');
  const [selectedAdditionalSkillIds, setSelectedAdditionalSkillIds] = useState([]);
  
  // Credentials states (for workers and employers)
  const [workerCredentials, setWorkerCredentials] = useState([]);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [newCredential, setNewCredential] = useState({ credentials_name: '', credentials_photo: null, credentials_doc: null });
  const [showAddCredentialForm, setShowAddCredentialForm] = useState(false);
  
  // Employer credentials states
  const [employerCredentials, setEmployerCredentials] = useState([]);
  const [isEditingEmployerCredentials, setIsEditingEmployerCredentials] = useState(false);
  const [newEmployerCredential, setNewEmployerCredential] = useState({ credentials_name: '', credentials_photo: null, credentials_doc: null });
  const [showAddEmployerCredentialForm, setShowAddEmployerCredentialForm] = useState(false);
  
  const fileInputRef = useRef(null);
  const credentialFileInputRef = useRef(null);
  const employerCredentialFileInputRef = useRef(null);

  // Credential types from SkillRatingModal
  const credentialTypes = [
    { value: "Resume/CV", label: "Resume / Curriculum Vitae (CV)" },
    { value: "Birth Certificate", label: "Birth Certificate (PSA-issued)" },
    { value: "Barangay Clearance", label: "Barangay Clearance" },
    { value: "Police Clearance", label: "Police Clearance" },
    { value: "NBI Clearance", label: "NBI Clearance" },
    { value: "Medical Certificate", label: "Medical Certificate / Health Certificate" },
    { value: "SSS Number", label: "SSS Number (Social Security System)" },
    { value: "PhilHealth Number", label: "PhilHealth Number" },
    { value: "Pag-IBIG Number", label: "Pag-IBIG Number (HDMF)" },
    { value: "TIN", label: "TIN (Tax Identification Number)" },
    { value: "Valid Government ID", label: "Valid Government ID (e.g., Passport, Driver's License, Voter's ID, UMID, National ID)" },
    { value: "TESDA Certificate", label: "TESDA / NC Certificates" },
    { value: "Diploma", label: "Diploma / Transcript of Records" },
    { value: "Training Certificate", label: "Training Certificates" },
    { value: "Professional License", label: "License or Professional ID (e.g., PRC License)" },
    { value: "Work Portfolio", label: "Work Experience Records / Portfolio" },
    { value: "Certificate of Employment", label: "Certificate of Employment" },
    { value: "Performance Evaluation", label: "Performance Evaluation / Feedback" },
    { value: "Work Photos", label: "Work Accomplishment Photos (for skilled workers like carpenters, painters, etc.)" },
    { value: "Character Reference", label: "Character Reference / Reference Letter" },
    { value: "Drivers License", label: "Driver's License" },
    { value: "Passport", label: "Passport" },
    { value: "Voters ID", label: "Voter's ID" },
    { value: "National ID", label: "National ID / Postal ID" }
  ];

  // Load user data on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await loadUserData();
        
        // Fetch genders and suffixes
        await Promise.all([
          fetchGenders(),
          fetchSuffixes()
        ]);
      } catch (error) {
        if (isMounted) {
          console.error('Error loading initial data:', error);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch rank and reviews when user is loaded
  useEffect(() => {
    let isMounted = true;
    
    if (user?.id && (user?.role_id === 1 || user?.role_id === '1')) {
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchWorkerReviews(user.id),
            fetchWorkerProfile(user.id),
            fetchAvailableSkills()
          ]);
        } catch (error) {
          if (isMounted) {
            console.error('Error fetching worker data:', error);
          }
        }
      };
      
      fetchData();
    } else if (user?.id && (user?.role_id === 2 || user?.role_id === '2' || user?.role_id === 4 || user?.role_id === '4')) {
      // Fetch employer or contractor data
      const fetchEmployerData = async () => {
        try {
          console.log(`Fetching ${Number(user?.role_id) === 4 ? 'contractor' : 'employer'} data for user:`, user.id);
          await fetchEmployerProfile(user.id);
        } catch (error) {
          if (isMounted) {
            console.error(`Error fetching ${Number(user?.role_id) === 4 ? 'contractor' : 'employer'} data:`, error);
          }
        }
      };
      
      fetchEmployerData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.avatar-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Listen for skills/credentials updates from Skill Rating Modal
  useEffect(() => {
    const handleSkillsCredentialsUpdate = () => {
      console.log('Skills/Credentials updated event received, refreshing worker profile...');
      if (user?.id && (user?.role_id === 1 || user?.role_id === '1')) {
        fetchWorkerProfile(user.id);
      }
    };

    // Listen for custom event dispatched when skills/credentials are saved
    window.addEventListener('workerSkillsUpdated', handleSkillsCredentialsUpdate);
    window.addEventListener('workerCredentialsUpdated', handleSkillsCredentialsUpdate);
    
    return () => {
      window.removeEventListener('workerSkillsUpdated', handleSkillsCredentialsUpdate);
      window.removeEventListener('workerCredentialsUpdated', handleSkillsCredentialsUpdate);
    };
  }, [user]);

  const loadUserData = async () => {
    const storedUser = localStorage.getItem("user");
    console.log('Raw stored user data:', storedUser);
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log('Parsed user data:', userData);
      const currentUser = userData.user || userData;
      console.log('Current user:', currentUser);
      console.log('Current user role_id:', currentUser.role_id);
      
      // If gender_name is null, fetch fresh user data from API
      if (currentUser.gender_id && !currentUser.gender_name) {
        try {
          const token = localStorage.getItem("auth_token");
          if (token) {
            const response = await fetch(`http://127.0.0.1:8000/api/users/${currentUser.id}`, {
              method: "GET",
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            });
            
            if (response.ok) {
              const freshUserData = await response.json();
              
              // Preserve role_id when updating user data
              const updatedUserData = {
                ...freshUserData,
                role_id: currentUser.role_id || freshUserData.role_id
              };
              
              setUser(updatedUserData);
              
              // Preserve the original localStorage structure
              const localStorageStructure = userData.user ? { user: updatedUserData } : updatedUserData;
              localStorage.setItem("user", JSON.stringify(localStorageStructure));
              
              setProfileData({
                firstName: updatedUserData.first_name || "",
                middleName: updatedUserData.middlename || "",
                lastName: updatedUserData.last_name || "",
                suffix: updatedUserData.suffix_id || "",
                email: updatedUserData.email || "",
                gender: updatedUserData.gender_id || ""
              });
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error);
        }
      }
      
      // Use stored data if it's complete or if API fetch failed
      setUser(currentUser);
      console.log('User loaded:', currentUser);
      console.log('User role_id:', currentUser.role_id);
      setProfileData({
        firstName: currentUser.first_name || "",
        middleName: currentUser.middlename || "",
        lastName: currentUser.last_name || "",
        suffix: currentUser.suffix_id || "",
        email: currentUser.email || "",
        gender: currentUser.gender_id || ""
      });
    }
  };

  const fetchGenders = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/genders');
      if (response.ok) {
        const data = await response.json();
        setGenders(data);
      }
    } catch (error) {
      console.error('Error fetching genders:', error);
    }
  };

  const fetchSuffixes = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/suffixes');
      if (response.ok) {
        const data = await response.json();
        setSuffixes(data);
      }
    } catch (error) {
      console.error('Error fetching suffixes:', error);
    }
  };

  const fetchWorkerReviews = async (workerId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/reviews/worker/${workerId}`);
      if (response.ok) {
        const data = await response.json();
        setAverageRating(data.average_rating || 0);
        setTotalReviews(data.total_reviews || 0);
        
        // Calculate total points: avgRating * 5000 * numReviews
        const avgRating = data.average_rating || 0;
        const numReviews = data.total_reviews || 0;
        const calculatedPoints = avgRating * 5000 * numReviews;
        setTotalPoints(calculatedPoints);
        
        // Fetch rank based on total points
        fetchWorkerRank(calculatedPoints);
      } else {
        // If fetch fails, still show rank with 0 points
        setTotalPoints(0);
        fetchWorkerRank(0);
      }
    } catch (error) {
      console.error('Error fetching worker reviews:', error);
      // Even on error, show rank with 0 points
      setTotalPoints(0);
      fetchWorkerRank(0);
    }
  };

  const fetchWorkerRank = async (points) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ranks');
      if (response.ok) {
        const data = await response.json();
        
        // Handle both array and object response formats
        const ranks = Array.isArray(data) ? data : (data.ranks || data.data || []);
        
        console.log('Fetched ranks:', ranks);
        console.log('Total points:', points);
        
        // Sort ranks by min_points to ensure correct order
        const sortedRanks = ranks.sort((a, b) => (a.min_points || 0) - (b.min_points || 0));
        
        // Find the rank that matches the total points
        const matchedRank = sortedRanks.find(rank => {
          const minPoints = rank.min_points || 0;
          const maxPoints = rank.max_points;
          
          if (maxPoints === null || maxPoints === undefined) {
            // For the highest rank with no upper limit
            return points >= minPoints;
          }
          
          return points >= minPoints && points <= maxPoints;
        });
        
        if (matchedRank) {
          console.log('Matched rank:', matchedRank);
          setWorkerRank(matchedRank);
          
          // Calculate progress percentage towards next rank
          if (matchedRank.max_points !== null && matchedRank.max_points !== undefined) {
            const rangeSize = matchedRank.max_points - matchedRank.min_points;
            const currentProgress = points - matchedRank.min_points;
            const percent = (currentProgress / rangeSize) * 100;
            setProgressPercent(Math.min(percent, 100));
          } else {
            // If it's the highest rank, set to 100%
            setProgressPercent(100);
          }
        } else if (sortedRanks.length > 0) {
          // If no rank matched, default to first rank (Bronze)
          console.log('No rank matched, using first rank:', sortedRanks[0]);
          setWorkerRank(sortedRanks[0]);
          setProgressPercent(0);
        } else {
          console.log('No ranks available - this is normal for new users');
          // Set a default state when no ranks are available
          setWorkerRank(null);
          setProgressPercent(0);
        }
      } else {
        console.error('Failed to fetch ranks:', response.status);
        // Try to get a default rank anyway
        trySetDefaultRank();
      }
    } catch (error) {
      console.error('Error fetching worker rank:', error);
      // Try to get a default rank anyway
      trySetDefaultRank();
    }
  };

  const trySetDefaultRank = () => {
    // Set a minimal default rank if API fails
    setWorkerRank({
      id: 1,
      name: 'Bronze',
      min_points: 0,
      max_points: 49999,
      image: 'img/default-rank.png'
    });
    setTotalPoints(0);
    setProgressPercent(0);
  };

  const fetchAvailableSkills = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch('http://127.0.0.1:8000/api/skills', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableSkills(data);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchWorkerProfile = async (workerId) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:8000/api/workers/${workerId}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        const workerData = data.worker || data;
        
        console.log('Fetched worker data:', workerData);
        console.log('Skills data:', workerData.skills_id);
        console.log('Credentials data:', workerData.credentials_name, workerData.credentials_photo);
        
        // Set work preferences from worker data
        setWorkPreferences({
          workType: workerData.work_type || '',
          hoursPerDay: workerData.hours_per_day || '',
          preferredWorkingDays: Array.isArray(workerData.preferred_working_days) 
            ? workerData.preferred_working_days
            : (workerData.preferred_working_days ? JSON.parse(workerData.preferred_working_days) : []),
          bio: workerData.bio || ''
        });
        
        // Set skills from worker data
        const skillsData = workerData.skills_id || {};
        
        console.log('Primary skills from backend:', skillsData.primary_skills);
        console.log('Additional skills from backend:', skillsData.additional_skills);
        
        // Process primary skills to ensure consistent field names
        const primarySkills = Array.isArray(skillsData.primary_skills) 
          ? skillsData.primary_skills.map(skill => ({
              id: skill.skill_id || skill.id,
              skill_name: skill.skill_name,
              sub_skills: skill.sub_skills || [],
              experience: skill.experience || ''
            }))
          : [];
        
        // Process additional skills to ensure consistent field names
        const additionalSkills = Array.isArray(skillsData.additional_skills) 
          ? skillsData.additional_skills.map(skill => ({
              id: skill.skill_id || skill.id,
              skill_name: skill.skill_name,
              sub_skills: skill.sub_skills || [],
              experience: skill.experience || ''
            }))
          : [];
        
        console.log('Processed primary skills:', primarySkills);
        console.log('Processed additional skills:', additionalSkills);
        
        setWorkerSkills({
          primary_skills: primarySkills,
          additional_skills: additionalSkills
        });
        
        // Set credentials from worker data
        if (workerData.credentials_name && Array.isArray(workerData.credentials_name)) {
          const creds = workerData.credentials_name
            .map((name, index) => {
              const photo = workerData.credentials_photo?.[index];
              const doc = workerData.credentials_doc?.[index];
              console.log(`Credential ${index}: name="${name}", photo="${photo}", doc="${doc}"`);
              return {
                credentials_name: name,
                credentials_photo: photo || null,
                credentials_doc: doc || null
              };
            })
            .filter(cred => cred.credentials_name && cred.credentials_name.trim() !== ''); // Filter out empty/null credentials
          console.log('Setting credentials from backend:', creds);
          console.log('Raw credentials_photo from backend:', workerData.credentials_photo);
          console.log('Raw credentials_doc from backend:', workerData.credentials_doc);
          setWorkerCredentials(creds);
        } else {
          console.log('No credentials found in backend data');
          setWorkerCredentials([]);
        }
      }
    } catch (error) {
      console.error('Error fetching worker profile:', error);
    }
  };

  const fetchEmployerProfile = async (employerId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      const currentUser = userData.user || userData;
      const roleId = Number(currentUser.role_id);
      
      console.log(`Fetching ${roleId === 4 ? 'contractor' : 'employer'} profile for ID:`, employerId);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      // Use appropriate API endpoint based on role
      const apiEndpoint = roleId === 4 
        ? `http://127.0.0.1:8000/api/contractors/${employerId}`
        : `http://127.0.0.1:8000/api/employers/${employerId}`;

      const response = await fetch(apiEndpoint, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log(`${roleId === 4 ? 'Contractor' : 'Employer'} profile response status:`, response.status);
      if (response.ok) {
        const data = await response.json();
        const roleData = data.employer || data.contractor || data;
        
        console.log(`Fetched ${roleId === 4 ? 'contractor' : 'employer'} data:`, roleData);
        console.log(`${roleId === 4 ? 'Contractor' : 'Employer'} record:`, roleData[roleId === 4 ? 'contractor' : 'employer']);
        console.log('Credentials data:', roleData.credentials_name, roleData.credentials_photo);
        
        // Check if we have a record
        const record = roleData[roleId === 4 ? 'contractor' : 'employer'] || roleData;
        if (record) {
          console.log(`${roleId === 4 ? 'Contractor' : 'Employer'} record credentials:`, record.credentials_name, record.credentials_photo);
          
          // Set credentials from record
          if (record.credentials_name && Array.isArray(record.credentials_name)) {
            const creds = record.credentials_name
              .map((name, index) => {
                const photo = record.credentials_photo?.[index];
                const doc = record.credentials_doc?.[index];
                console.log(`${roleId === 4 ? 'Contractor' : 'Employer'} Credential ${index}: name="${name}", photo="${photo}", doc="${doc}"`);
                return {
                  credentials_name: name,
                  credentials_photo: photo || null,
                  credentials_doc: doc || null
                };
              })
              .filter(cred => cred.credentials_name && cred.credentials_name.trim() !== ''); // Filter out empty/null credentials
            console.log(`Setting ${roleId === 4 ? 'contractor' : 'employer'} credentials from backend:`, creds);
            setEmployerCredentials(creds);
          } else {
            console.log(`No ${roleId === 4 ? 'contractor' : 'employer'} credentials found in backend data`);
            setEmployerCredentials([]);
          }
        } else {
          console.log(`No ${roleId === 4 ? 'contractor' : 'employer'} record found`);
          setEmployerCredentials([]);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${Number(user?.role_id) === 4 ? 'contractor' : 'employer'} profile:`, error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWorkPreferencesChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-set hours per day when work type changes
    if (name === 'workType') {
      let hoursPerDay = value === 'full-time' ? 8 : value === 'part-time' ? 4 : 1;
      setWorkPreferences(prev => ({
        ...prev,
        workType: value,
        hoursPerDay: hoursPerDay
      }));
    } else {
      setWorkPreferences(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleWorkingDayToggle = (day) => {
    setWorkPreferences(prev => ({
      ...prev,
      preferredWorkingDays: prev.preferredWorkingDays.includes(day)
        ? prev.preferredWorkingDays.filter(d => d !== day)
        : [...prev.preferredWorkingDays, day]
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setProfileImageFile(null);
    setProfileImagePreview(null);
    
    // Reset profile data to original values
    if (user) {
      setProfileData({
        firstName: user.first_name || "",
        middleName: user.middlename || "",
        lastName: user.last_name || "",
        suffix: user.suffix_id || "",
        email: user.email || "",
        gender: user.gender_id || "",
        removeImage: false,
        setDefaultImage: false
      });
    }
  };

  const handleEditPassword = () => {
    setIsEditingPassword(true);
  };

  const handleCancelPasswordEdit = () => {
    setIsEditingPassword(false);
    // Reset password data
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleEditWorkPreferences = () => {
    setIsEditingWorkPreferences(true);
  };

  const handleCancelWorkPreferencesEdit = async () => {
    setIsEditingWorkPreferences(false);
    // Reload work preferences from server
    if (user?.id && (user?.role_id === 1 || user?.role_id === '1')) {
      await fetchWorkerProfile(user.id);
    }
  };

  const handleEditSkills = () => {
    setIsEditingSkills(true);
  };

  const handleCancelSkillsEdit = async () => {
    setIsEditingSkills(false);
    // Reload skills from server
    if (user?.id && (user?.role_id === 1 || user?.role_id === '1')) {
      await fetchWorkerProfile(user.id);
    }
  };

  const handleSaveIndividualSkill = async (skillType, skillData) => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to update skills");
        return;
      }

      // Only include skills that have actual data
      const primarySkillsData = workerSkills.primary_skills
        .filter(skill => skill && skill.id && skill.skill_name && skill.skill_name.trim() !== '')
        .map(skill => ({
          skill_id: skill.id,
          skill_name: skill.skill_name,
          sub_skills: skill.sub_skills || [],
          experience: skill.experience || ''
        }));
      
      const additionalSkillsData = workerSkills.additional_skills
        .filter(skill => skill && skill.id && skill.skill_name && skill.skill_name.trim() !== '')
        .map(skill => ({
          skill_id: skill.id,
          skill_name: skill.skill_name,
          sub_skills: skill.sub_skills || [],
          experience: skill.experience || ''
        }));

      const requestData = {
        skills_id: {
          primary_skills: primarySkillsData,
          additional_skills: additionalSkillsData
        }
      };
      
      console.log('Sending skills data:', requestData);
      console.log('Primary skills count:', primarySkillsData.length);
      console.log('Additional skills count:', additionalSkillsData.length);
      console.log('Current workerSkills state:', workerSkills);
      
      const response = await fetch(`http://127.0.0.1:8000/api/workers/${user.id}/skills`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        message.success(`${skillType} skill saved successfully!`);
        // Refresh data immediately
        await fetchWorkerProfile(user.id);
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('workerSkillsUpdated'));
        // Exit edit mode so saved items render cleanly
        setIsEditingSkills(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(`Failed to save ${skillType} skill: ${errorData.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error(`${skillType} skill save error:`, error);
      message.error(`An error occurred while saving ${skillType} skill. Please check your connection.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillsSubmit = async () => {
    // Validate that primary skill is selected
    if (!workerSkills.primary_skills || workerSkills.primary_skills.length === 0) {
      message.error("Please select a primary skill");
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to update skills");
        return;
      }

      // Only include skills that have actual data
      const primarySkillsData = workerSkills.primary_skills
        .filter(skill => skill && skill.id && skill.skill_name && skill.skill_name.trim() !== '')
        .map(skill => ({
          skill_id: skill.id,
          skill_name: skill.skill_name,
          sub_skills: skill.sub_skills || [],
          experience: skill.experience || ''
        }));
      
      const additionalSkillsData = workerSkills.additional_skills
        .filter(skill => skill && skill.id && skill.skill_name && skill.skill_name.trim() !== '')
        .map(skill => ({
          skill_id: skill.id,
          skill_name: skill.skill_name,
          sub_skills: skill.sub_skills || [],
          experience: skill.experience || ''
        }));

      const requestData = {
        skills_id: {
          primary_skills: primarySkillsData,
          additional_skills: additionalSkillsData
        }
      };
      
      console.log('Sending skills data (handleSkillsSubmit):', requestData);

      const response = await fetch(`http://127.0.0.1:8000/api/workers/${user.id}/skills`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        message.success("Skills updated successfully!");
        setIsEditingSkills(false);
        // Refresh data immediately
        await fetchWorkerProfile(user.id);
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('workerSkillsUpdated'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(`Failed to update skills: ${errorData.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Skills update error:", error);
      message.error("An error occurred while updating skills. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrimarySkillChange = (e) => {
    const skillId = e.target.value;
    const selectedSkill = availableSkills.find(skill => skill.id === parseInt(skillId));
    
    console.log('Selected skill for primary:', selectedSkill);
    console.log('Available skills:', availableSkills);
    
    if (selectedSkill) {
      const skillName = selectedSkill.name || selectedSkill.skill_name;
      console.log('Skill name:', skillName);
      
      setWorkerSkills(prev => ({
        ...prev,
        primary_skills: [{
          id: selectedSkill.id,
          skill_name: skillName,
          sub_skills: [],
          experience: ''
        }]
      }));
    }
  };


  const handleSkillExperienceChange = (skillId, experience, isPrimary = false) => {
    setWorkerSkills(prev => {
      if (isPrimary) {
        return {
          ...prev,
          primary_skills: prev.primary_skills.map(skill => 
            skill.id === skillId ? { ...skill, experience } : skill
          )
        };
      } else {
        return {
          ...prev,
          additional_skills: prev.additional_skills.map(skill => 
            skill.id === skillId ? { ...skill, experience } : skill
          )
        };
      }
    });
  };

  const handleSubSkillAdd = (skillId, subSkill, isPrimary = false) => {
    if (!subSkill.trim()) return;
    
    setWorkerSkills(prev => {
      if (isPrimary) {
        return {
          ...prev,
          primary_skills: prev.primary_skills.map(skill => 
            skill.id === skillId 
              ? { ...skill, sub_skills: [...(skill.sub_skills || []), subSkill.trim()] }
              : skill
          )
        };
      } else {
        return {
          ...prev,
          additional_skills: prev.additional_skills.map(skill => 
            skill.id === skillId 
              ? { ...skill, sub_skills: [...(skill.sub_skills || []), subSkill.trim()] }
              : skill
          )
        };
      }
    });
  };

  const handleSubSkillRemove = (skillId, subSkillToRemove, isPrimary = false) => {
    setWorkerSkills(prev => {
      if (isPrimary) {
        return {
          ...prev,
          primary_skills: prev.primary_skills.map(skill => 
            skill.id === skillId 
              ? { ...skill, sub_skills: (skill.sub_skills || []).filter(sub => sub !== subSkillToRemove) }
              : skill
          )
        };
      } else {
        return {
          ...prev,
          additional_skills: prev.additional_skills.map(skill => 
            skill.id === skillId 
              ? { ...skill, sub_skills: (skill.sub_skills || []).filter(sub => sub !== subSkillToRemove) }
              : skill
          )
        };
      }
    });
  };

  const handleRemoveAdditionalSkill = (removeId) => {
    setWorkerSkills(prev => ({
      ...prev,
      additional_skills: (prev.additional_skills || []).filter(s => s.id !== removeId)
    }));
  };

  const handleEditCredentials = () => {
    setIsEditingCredentials(true);
  };

  const handleCancelCredentialsEdit = async () => {
    setIsEditingCredentials(false);
    // Reload credentials from server
    if (user?.id && (user?.role_id === 1 || user?.role_id === '1')) {
      await fetchWorkerProfile(user.id);
    }
  };

  const handleRemoveCredential = async (index) => {
    const updatedCredentials = workerCredentials.filter((_, i) => i !== index);
    setWorkerCredentials(updatedCredentials);
    
    // Auto-save the changes to backend
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to delete credentials");
        return;
      }

      const formData = new FormData();
      formData.append('user_id', user.id);
      
      // Send updated credentials (without the deleted one)
      if (updatedCredentials.length === 0) {
        formData.append('credentials', JSON.stringify([]));
      } else {
        updatedCredentials.forEach((cred, credIndex) => {
          formData.append(`credentials[${credIndex}][credentials_name]`, cred.credentials_name);
          if (cred.credentials_photo instanceof File) {
            formData.append(`credentials[${credIndex}][credentials_photo]`, cred.credentials_photo);
          } else if (typeof cred.credentials_photo === 'string' && cred.credentials_photo.trim() !== '') {
            formData.append(`credentials[${credIndex}][existing_photo]`, cred.credentials_photo);
          }
        });
      }

      const response = await fetch(`http://127.0.0.1:8000/api/workers/${user.id}/update-credentials`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        message.success("Credential deleted successfully!");
        // Refresh data to get updated credentials from backend
        await fetchWorkerProfile(user.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(`Failed to delete credential: ${errorData.message || errorData.error || 'Please try again.'}`);
        // Revert the change if backend save failed
        setWorkerCredentials(workerCredentials);
      }
    } catch (error) {
      console.error("Credential deletion error:", error);
      message.error("An error occurred while deleting the credential. Please check your connection.");
      // Revert the change if backend save failed
      setWorkerCredentials(workerCredentials);
    }
  };

  const handleNewCredentialChange = (e, field) => {
    if (field === 'credentials_file') {
      const file = e.target.files[0];
      if (file) {
        // Auto-detect file type and route to appropriate field
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        const isImage = imageTypes.includes(file.type);
        const isDoc = docTypes.includes(file.type);
        
        if (!isImage && !isDoc) {
          message.error('File must be an image (JPG, PNG, GIF, WEBP) or document (PDF, Word)');
          return;
        }
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
          message.error('File size must not exceed 2MB');
          return;
        }
        
        // Route to correct field based on file type
        if (isImage) {
          setNewCredential(prev => ({ ...prev, credentials_photo: file, credentials_doc: null }));
        } else if (isDoc) {
          setNewCredential(prev => ({ ...prev, credentials_doc: file, credentials_photo: null }));
        }
      }
    } else {
      setNewCredential(prev => ({ ...prev, [field]: e.target.value }));
    }
  };

  const handleAddCredential = () => {
    if (!newCredential.credentials_name.trim()) {
      message.error('Please enter a credential name');
      return;
    }
    if (!newCredential.credentials_photo && !newCredential.credentials_doc) {
      message.error('Please upload a credential document');
      return;
    }

    console.log('Adding credential:', {
      name: newCredential.credentials_name,
      photo: newCredential.credentials_photo,
      doc: newCredential.credentials_doc,
      isFile: newCredential.credentials_photo instanceof File || newCredential.credentials_doc instanceof File
    });

    setWorkerCredentials(prev => [...prev, { ...newCredential }]);
    setNewCredential({ credentials_name: '', credentials_photo: null, credentials_doc: null });
    setShowAddCredentialForm(false);
    if (credentialFileInputRef.current) {
      credentialFileInputRef.current.value = '';
    }
    message.success('Credential added! Click "Save Changes" to save.');
  };

  const handleCredentialsSubmit = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to update credentials");
        return;
      }

      // Validate that we have credentials to save
      if (workerCredentials.length === 0) {
        message.error("Please add at least one credential before saving");
        setIsLoading(false);
        return;
      }

      // Check if user is in the middle of adding a credential
      if (newCredential.credentials_name || newCredential.credentials_photo || newCredential.credentials_doc) {
        message.error("Please click 'Add to List' to add the credential before saving");
        setIsLoading(false);
        return;
      }

      // Update credentials via API using complete-profile endpoint
      const formData = new FormData();
      formData.append('user_id', user.id);
      
      // Add credentials
      if (workerCredentials.length > 0) {
        // Add credentials as individual form fields
        workerCredentials.forEach((cred, index) => {
          formData.append(`credentials[${index}][credentials_name]`, cred.credentials_name);
          if (cred.credentials_photo instanceof File) {
            // New file upload
            formData.append(`credentials[${index}][credentials_photo]`, cred.credentials_photo);
            console.log(`Adding new file for credential ${index}:`, cred.credentials_photo.name);
          } else if (typeof cred.credentials_photo === 'string' && cred.credentials_photo.trim() !== '') {
            // Existing file path - keep the existing file
            formData.append(`credentials[${index}][existing_photo]`, cred.credentials_photo);
            console.log(`Keeping existing file for credential ${index}:`, cred.credentials_photo);
          }
          
          if (cred.credentials_doc instanceof File) {
            // New file upload
            formData.append(`credentials[${index}][credentials_doc]`, cred.credentials_doc);
            console.log(`Adding new doc for credential ${index}:`, cred.credentials_doc.name);
          } else if (typeof cred.credentials_doc === 'string' && cred.credentials_doc.trim() !== '') {
            // Existing file path - keep the existing file
            formData.append(`credentials[${index}][existing_doc]`, cred.credentials_doc);
            console.log(`Keeping existing doc for credential ${index}:`, cred.credentials_doc);
          }
        });
        
        // Also add a JSON version for debugging
        formData.append('credentials_json', JSON.stringify(workerCredentials));
      }

      console.log('Sending credentials data:', workerCredentials);
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      // Debug: Check each credential's file type
      workerCredentials.forEach((cred, index) => {
        console.log(`Credential ${index}:`, {
          name: cred.credentials_name,
          photo: cred.credentials_photo,
          doc: cred.credentials_doc,
          isFile: cred.credentials_photo instanceof File || cred.credentials_doc instanceof File
        });
      });

      const response = await fetch(`http://127.0.0.1:8000/api/workers/${user.id}/update-credentials`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Credentials update response:', responseData);
        
        message.success("Credentials updated successfully!");
        setIsEditingCredentials(false);
        setNewCredential({ credentials_name: '', credentials_photo: null, credentials_doc: null });
        
        // Clear the file input
        if (credentialFileInputRef.current) {
          credentialFileInputRef.current.value = '';
        }
        
        // Refresh data immediately to get updated credentials from backend
        console.log('Refreshing worker profile after credentials update...');
        await fetchWorkerProfile(user.id);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('workerCredentialsUpdated'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Credentials update failed:', response.status, response.statusText, errorData);
        message.error(`Failed to update credentials: ${errorData.message || errorData.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Credentials update error:", error);
      message.error("An error occurred while updating credentials. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Employer Credential Functions
  const handleEditEmployerCredentials = () => {
    setIsEditingEmployerCredentials(true);
  };

  const handleCancelEmployerCredentialsEdit = async () => {
    setIsEditingEmployerCredentials(false);
    // Reload credentials from server
    if (user?.id && (user?.role_id === 2 || user?.role_id === '2' || user?.role_id === 4 || user?.role_id === '4')) {
      await fetchEmployerProfile(user.id);
    }
  };

  const handleRemoveEmployerCredential = async (index) => {
    const updatedCredentials = employerCredentials.filter((_, i) => i !== index);
    setEmployerCredentials(updatedCredentials);
    
    // Auto-save the changes to backend
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to delete credentials");
        return;
      }

      const formData = new FormData();
      formData.append('user_id', user.id);
      
      // Send updated credentials (without the deleted one)
      if (updatedCredentials.length === 0) {
        formData.append('credentials', JSON.stringify([]));
      } else {
        updatedCredentials.forEach((cred, credIndex) => {
          formData.append(`credentials[${credIndex}][credentials_name]`, cred.credentials_name);
          if (cred.credentials_photo instanceof File) {
            formData.append(`credentials[${credIndex}][credentials_photo]`, cred.credentials_photo);
          } else if (typeof cred.credentials_photo === 'string' && cred.credentials_photo.trim() !== '') {
            formData.append(`credentials[${credIndex}][existing_photo]`, cred.credentials_photo);
          }
        });
      }

      // Use appropriate API endpoint based on role
      const roleId = Number(user?.role_id);
      const apiEndpoint = roleId === 4 
        ? `http://127.0.0.1:8000/api/contractors/${user.id}/update-credentials`
        : `http://127.0.0.1:8000/api/employers/${user.id}/update-credentials`;

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        message.success("Credential deleted successfully!");
        // Refresh data to get updated credentials from backend
        await fetchEmployerProfile(user.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(`Failed to delete credential: ${errorData.message || errorData.error || 'Please try again.'}`);
        // Revert the change if backend save failed
        setEmployerCredentials(employerCredentials);
      }
    } catch (error) {
      console.error("Credential deletion error:", error);
      message.error("An error occurred while deleting the credential. Please check your connection.");
      // Revert the change if backend save failed
      setEmployerCredentials(employerCredentials);
    }
  };

  const handleNewEmployerCredentialChange = (e, field) => {
    if (field === 'credentials_file') {
      const file = e.target.files[0];
      if (file) {
        // Auto-detect file type and route to appropriate field
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        const isImage = imageTypes.includes(file.type);
        const isDoc = docTypes.includes(file.type);
        
        if (!isImage && !isDoc) {
          message.error('File must be an image (JPG, PNG, GIF, WEBP) or document (PDF, Word)');
          return;
        }
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
          message.error('File size must not exceed 2MB');
          return;
        }
        
        // Route to correct field based on file type
        if (isImage) {
          setNewEmployerCredential(prev => ({ ...prev, credentials_photo: file, credentials_doc: null }));
        } else if (isDoc) {
          setNewEmployerCredential(prev => ({ ...prev, credentials_doc: file, credentials_photo: null }));
        }
      }
    } else {
      setNewEmployerCredential(prev => ({ ...prev, [field]: e.target.value }));
    }
  };

  const handleAddEmployerCredential = () => {
    if (!newEmployerCredential.credentials_name.trim()) {
      message.error('Please enter a credential name');
      return;
    }
    if (!newEmployerCredential.credentials_photo && !newEmployerCredential.credentials_doc) {
      message.error('Please upload a credential document');
      return;
    }

    console.log('Adding employer credential:', {
      name: newEmployerCredential.credentials_name,
      photo: newEmployerCredential.credentials_photo,
      doc: newEmployerCredential.credentials_doc,
      isFile: newEmployerCredential.credentials_photo instanceof File || newEmployerCredential.credentials_doc instanceof File
    });

    setEmployerCredentials(prev => [...prev, { ...newEmployerCredential }]);
    setNewEmployerCredential({ credentials_name: '', credentials_photo: null, credentials_doc: null });
    setShowAddEmployerCredentialForm(false);
    if (employerCredentialFileInputRef.current) {
      employerCredentialFileInputRef.current.value = '';
    }
    message.success('Credential added! Click "Save Changes" to save.');
  };

  const handleEmployerCredentialsSubmit = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to update credentials");
        return;
      }

      // Validate that we have credentials to save
      if (employerCredentials.length === 0) {
        message.error("Please add at least one credential before saving");
        setIsLoading(false);
        return;
      }

      // Check if user is in the middle of adding a credential
      if (newEmployerCredential.credentials_name || newEmployerCredential.credentials_photo || newEmployerCredential.credentials_doc) {
        message.error("Please click 'Add to List' to add the credential before saving");
        setIsLoading(false);
        return;
      }

      // Update credentials via API using complete-profile endpoint
      const formData = new FormData();
      formData.append('user_id', user.id);
      
      // Add credentials
      if (employerCredentials.length > 0) {
        // Add credentials as individual form fields
        employerCredentials.forEach((cred, index) => {
          formData.append(`credentials[${index}][credentials_name]`, cred.credentials_name);
          if (cred.credentials_photo instanceof File) {
            // New file upload
            formData.append(`credentials[${index}][credentials_photo]`, cred.credentials_photo);
            console.log(`Adding new file for employer credential ${index}:`, cred.credentials_photo.name);
          } else if (typeof cred.credentials_photo === 'string' && cred.credentials_photo.trim() !== '') {
            // Existing file path - keep the existing file
            formData.append(`credentials[${index}][existing_photo]`, cred.credentials_photo);
            console.log(`Keeping existing file for employer credential ${index}:`, cred.credentials_photo);
          }
          
          if (cred.credentials_doc instanceof File) {
            // New file upload
            formData.append(`credentials[${index}][credentials_doc]`, cred.credentials_doc);
            console.log(`Adding new doc for employer credential ${index}:`, cred.credentials_doc.name);
          } else if (typeof cred.credentials_doc === 'string' && cred.credentials_doc.trim() !== '') {
            // Existing file path - keep the existing file
            formData.append(`credentials[${index}][existing_doc]`, cred.credentials_doc);
            console.log(`Keeping existing doc for employer credential ${index}:`, cred.credentials_doc);
          }
        });
        
        // Also add a JSON version for debugging
        formData.append('credentials_json', JSON.stringify(employerCredentials));
      }

      console.log('Sending employer credentials data:', employerCredentials);
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      // Debug: Check each credential's file type
      employerCredentials.forEach((cred, index) => {
        console.log(`Employer Credential ${index}:`, {
          name: cred.credentials_name,
          photo: cred.credentials_photo,
          doc: cred.credentials_doc,
          isFile: cred.credentials_photo instanceof File || cred.credentials_doc instanceof File
        });
      });

      // Use appropriate API endpoint based on role
      const roleId = Number(user?.role_id);
      const apiEndpoint = roleId === 4 
        ? `http://127.0.0.1:8000/api/contractors/${user.id}/update-credentials`
        : `http://127.0.0.1:8000/api/employers/${user.id}/update-credentials`;

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Employer credentials update response:', responseData);
        
        message.success("Credentials updated successfully!");
        setIsEditingEmployerCredentials(false);
        setNewEmployerCredential({ credentials_name: '', credentials_photo: null, credentials_doc: null });
        
        // Clear the file input
        if (employerCredentialFileInputRef.current) {
          employerCredentialFileInputRef.current.value = '';
        }
        
        // Refresh data immediately to get updated credentials from backend
        console.log('Refreshing employer profile after credentials update...');
        await fetchEmployerProfile(user.id);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('employerCredentialsUpdated'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Employer credentials update failed:', response.status, response.statusText, errorData);
        message.error(`Failed to update credentials: ${errorData.message || errorData.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Employer credentials update error:", error);
      message.error("An error occurred while updating credentials. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        message.error("Image must not exceed 2MB");
        return;
      }
      
      // Validate file type
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        message.error("Image must be JPEG, PNG, or JPG");
        return;
      }
      
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    
    // If there's an existing profile image, mark it for removal
    if (user?.profile_img) {
      setProfileData(prev => ({
        ...prev,
        removeImage: true
      }));
    }
  };

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Close dropdown when clicking outside
  const closeProfileDropdown = () => {
    setShowProfileDropdown(false);
  };

  // Handle view profile image
  const handleViewProfile = () => {
    setShowImageModal(true);
    setShowProfileDropdown(false);
  };

  // Handle change profile image
  const handleChangeProfile = () => {
    fileInputRef.current?.click();
    setShowProfileDropdown(false);
  };

  // Handle delete profile image
  const handleDeleteProfile = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    
    // Set profile data to use default image
    setProfileData(prev => ({
      ...prev,
      setDefaultImage: true
    }));
    
    setShowProfileDropdown(false);
  };

  // Close image modal
  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()) {
      message.error("Please fill in all required fields (First Name, Last Name, Email)");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      message.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to update your profile");
        return;
      }

      // Prepare the request data
      const requestData = {
        first_name: profileData.firstName,
        middlename: profileData.middleName,
        last_name: profileData.lastName,
        email: profileData.email,
      };
      
      // Handle gender_id - only add if it has a value
      if (profileData.gender) {
        requestData.gender_id = profileData.gender;
      }
      
      // Handle suffix_id - set to null if empty string or "Select Suffix"
      if (profileData.suffix && profileData.suffix !== '') {
        requestData.suffix_id = profileData.suffix;
      } else {
        requestData.suffix_id = null;
      }

      // If there's a profile image operation, use FormData, otherwise use JSON
      let body, contentType;
      if (profileImageFile || profileData.removeImage || profileData.setDefaultImage) {
        // Use FormData for file upload, removal, or setting default
        const formData = new FormData();
        formData.append('first_name', profileData.firstName);
        formData.append('middlename', profileData.middleName);
        formData.append('last_name', profileData.lastName);
        formData.append('email', profileData.email);
        
        if (profileData.gender) {
          formData.append('gender_id', profileData.gender);
        }
        
        if (profileData.suffix && profileData.suffix !== '') {
          formData.append('suffix_id', profileData.suffix);
        } else {
          formData.append('suffix_id', '');
        }
        
        if (profileImageFile) {
          formData.append('profile_img', profileImageFile);
        } else if (profileData.removeImage) {
          formData.append('profile_img', ''); // Empty string to remove image
        } else if (profileData.setDefaultImage) {
          formData.append('profile_img', 'default'); // Set to default image
        }
        
        body = formData;
        contentType = null; // Let browser set Content-Type for FormData
      } else {
        // Use JSON for regular updates
        body = JSON.stringify(requestData);
        contentType = 'application/json';
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };
      
      if (contentType) {
        headers['Content-Type'] = contentType;
      }

      // For FormData with files, use POST with method spoofing to avoid Laravel issues with PUT multipart
      let method = "PUT";
      let url = `http://127.0.0.1:8000/api/users/${user.id}`;
      
      if (profileImageFile || profileData.removeImage || profileData.setDefaultImage) {
        // Use method spoofing for FormData uploads
        body.append('_method', 'PUT');
        method = "POST";
      }

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: body
      });

      if (response.ok) {
        try {
          const responseData = await response.json();
          const updatedUser = responseData.user; // Extract user data from response
          
          // Preserve role_id from current user
          const currentUserData = JSON.parse(localStorage.getItem("user") || '{}');
          const currentUser = currentUserData.user || currentUserData;
          
          const finalUserData = {
            ...updatedUser,
            role_id: currentUser.role_id || updatedUser.role_id
          };
          
          setUser(finalUserData);
          
          // Preserve the original localStorage structure
          const localStorageStructure = currentUserData.user ? { user: finalUserData } : finalUserData;
          localStorage.setItem("user", JSON.stringify(localStorageStructure));
          
          // Dispatch custom event to refresh header profile image
          window.dispatchEvent(new CustomEvent('profileImageUpdated', {
            detail: { user: finalUserData }
          }));
          
          setIsEditingProfile(false);
          setProfileImageFile(null);
          setProfileImagePreview(null);
          setProfileData(prev => ({
            ...prev,
            removeImage: false,
            setDefaultImage: false
          }));
          message.success("Profile updated successfully!");
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          message.warning("Profile updated but there was an issue with the response format.");
          setIsEditingProfile(false);
        }
      } else {
        // Handle 404 - User not found (stale data)
        if (response.status === 404) {
          console.error("User not found - clearing stale data");
          const { clearStaleUserData } = await import('../../utils/profileImageUtils.js');
          clearStaleUserData();
          message.error("Your session has expired. Please log in again.");
          return;
        }
        
        try {
          const errorData = await response.json();
          message.error(`Failed to update profile: ${errorData.message || 'Please try again.'}`);
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
          message.error(`Failed to update profile: Server returned ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Profile update error:", error);
      message.error("An error occurred while updating your profile. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!passwordData.currentPassword.trim() || !passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()) {
      message.error("Please fill in all password fields");
      return;
    }

    // Validate password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error("New passwords do not match!");
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 6) {
      message.error("New password must be at least 6 characters long");
      return;
    }

    // Check if new password is different from current
    if (passwordData.currentPassword === passwordData.newPassword) {
      message.error("New password must be different from current password");
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to change your password");
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/change-password', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword
        })
      });

      if (response.ok) {
        message.success("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setIsEditingPassword(false);
      } else {
        try {
          const errorData = await response.json();
          message.error(`Failed to change password: ${errorData.error || 'Please try again.'}`);
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
          message.error(`Failed to change password: Server returned ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Password change error:", error);
      message.error("An error occurred while changing your password. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkPreferencesSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!workPreferences.workType || !workPreferences.hoursPerDay || workPreferences.preferredWorkingDays.length === 0) {
      message.error("Please fill in all required work preference fields");
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        message.error("You must be logged in to update work preferences");
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/workers/${user.id}/preferences`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          work_type: workPreferences.workType,
          hours_per_day: workPreferences.hoursPerDay,
          preferred_working_days: JSON.stringify(workPreferences.preferredWorkingDays),
          bio: workPreferences.bio
        })
      });

      if (response.ok) {
        message.success("Work preferences updated successfully!");
        setIsEditingWorkPreferences(false);
      } else {
        try {
          const errorData = await response.json();
          message.error(`Failed to update work preferences: ${errorData.message || 'Please try again.'}`);
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
          message.error(`Failed to update work preferences: Server returned ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Work preferences update error:", error);
      message.error("An error occurred while updating work preferences. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="my-profile-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
      
      {/* Profile Settings Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-container">
            <div className={`avatar-placeholder ${!profileImagePreview && (!user?.profile_img || user?.profile_img === 'images/defpfp.svg') ? 'no-image' : ''}`}>
              <img 
                src={profileImagePreview || (user?.profile_img ? (user.profile_img.startsWith('images/') ? user.profile_img : `http://127.0.0.1:8000/storage/${user.profile_img}?v=${Date.now()}`) : 'images/defpfp.svg')} 
                alt="Profile" 
                onError={(e) => {
                  e.target.src = "images/defpfp.svg";
                  e.target.parentElement.classList.add('no-image');
                }}
              />
            </div>
            
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleProfileImageChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            
            {/* Camera icon - only show when editing */}
            {isEditingProfile && (
              <div className="camera-icon" onClick={toggleProfileDropdown}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 15.2c-2.35 0-4.27-1.92-4.27-4.27s1.92-4.27 4.27-4.27 4.27 1.92 4.27 4.27-1.92 4.27-4.27 4.27zM16 3.33c-1.11 0-2.08.56-2.65 1.42L12.71 5.5H8c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-11c0-.55-.45-1-1-1h-4.71l-.64-.75c-.57-.86-1.54-1.42-2.65-1.42z"/>
                </svg>
              </div>
            )}
            
            {/* Dropdown menu */}
            {isEditingProfile && (
              <div className={`profile-dropdown ${showProfileDropdown ? 'show' : ''}`}>
                <button type="button" className="dropdown-item" onClick={handleViewProfile}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  View Profile
                </button>
                
                <button type="button" className="dropdown-item" onClick={handleChangeProfile}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 15.2c-2.35 0-4.27-1.92-4.27-4.27s1.92-4.27 4.27-4.27 4.27 1.92 4.27 4.27-1.92 4.27-4.27 4.27zM16 3.33c-1.11 0-2.08.56-2.65 1.42L12.71 5.5H8c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-11c0-.55-.45-1-1-1h-4.71l-.64-.75c-.57-.86-1.54-1.42-2.65-1.42z"/>
                  </svg>
                  Change Profile
                </button>
                
                {(profileImagePreview || (user?.profile_img && user.profile_img !== 'img/defaultpfp.jpg')) && (
                  <button type="button" className="dropdown-item delete-item" onClick={handleDeleteProfile}>
                    <svg viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Delete Profile
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Rank Display - Only show for workers */}
          {(user?.role_id === 1 || user?.role_id === '1') && (
            <div className="rank-display-section">
              {workerRank ? (
                <div className="rank-display">
                  <img 
                    src={`http://127.0.0.1:8000/storage/${workerRank.image}`}
                    alt={`${workerRank.name} Rank`}
                    className="worker-rank-badge"
                    title={`${workerRank.name} Rank - ${totalPoints.toLocaleString()} points`}
                  />
                  <div className="rank-progress">
                    <div className="progress-info">
                      <span className="rank-name">{workerRank.name}</span>
                      <span className="points-text">{totalPoints.toLocaleString()} pts</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className={`progress-bar-fill rank-${workerRank.name.toLowerCase()}`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <span className="progress-label">
                      {workerRank.max_points 
                        ? `${totalPoints.toLocaleString()} / ${workerRank.max_points.toLocaleString()}`
                        : `${totalPoints.toLocaleString()} pts`
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rank-display">
                  <div className="rank-loading">Loading rank...</div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleProfileSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="label-up">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profileData.firstName}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={isEditingProfile ? 'editing' : ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="middleName" className="label-up">Middle Name</label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                value={profileData.middleName}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={isEditingProfile ? 'editing' : ''}
                placeholder="Middle Name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lastName" className="label-up">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profileData.lastName}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={isEditingProfile ? 'editing' : ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="suffix" className="label-up">Suffix</label>
              <select
                id="suffix"
                name="suffix"
                value={profileData.suffix}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={isEditingProfile ? 'editing' : ''}
              >
                <option value="">Select Suffix</option>
                {suffixes.map((suffix) => (
                  <option key={suffix.id} value={suffix.id}>
                    {suffix.suffix_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email" className="label-up">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={isEditingProfile ? 'editing' : ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender" className="label-up">Gender</label>
              <select
                id="gender"
                name="gender"
                value={profileData.gender}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={isEditingProfile ? 'editing' : ''}
              >
                <option value="">Select Gender</option>
                {genders.map((gender) => (
                  <option key={gender.id} value={gender.id}>
                    {gender.gender_name}
                  </option>
                ))}
              </select>
            </div>
          </div>


          <div className="form-actions">
            {!isEditingProfile ? (
              <button type="button" className="edit-btn" onClick={handleEditProfile}>
                <MdEdit className="btn-icon" />
                Edit Profile
              </button>
            ) : (
              <>
                <button type="button" className="edit-btn" onClick={handleCancelProfileEdit}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  onClick={(e) => {
                    console.log("Save profile button clicked");
                    handleProfileSubmit(e);
                  }}
                >
                  <MdEdit className="btn-icon" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="password-card">
        <h3 className="card-title">Change Password</h3>
        
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <div className="password-input-container">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                disabled={!isEditingPassword}
                className={isEditingPassword ? 'editing' : ''}
                placeholder="Enter current password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => togglePasswordVisibility('current')}
              >
                <i className="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-container">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                disabled={!isEditingPassword}
                className={isEditingPassword ? 'editing' : ''}
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => togglePasswordVisibility('new')}
              >
                <i className="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-container">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                disabled={!isEditingPassword}
                className={isEditingPassword ? 'editing' : ''}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                <i className="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div className="form-actions">
            {!isEditingPassword ? (
              <button type="button" className="edit-btn" onClick={handleEditPassword}>
                <MdEdit className="btn-icon" />
                Edit Password
              </button>
            ) : (
              <>
                <button type="button" className="edit-btn" onClick={handleCancelPasswordEdit}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  onClick={(e) => {
                    console.log("Save password button clicked");
                    handlePasswordSubmit(e);
                  }}
                >
                  <MdEdit className="btn-icon" />
                  Change Password
                </button>
              </>
            )}
          </div>
        </form>
      </div>
      
      {/* Work Preferences Card - Only for Workers */}
      {(user?.role_id === 1 || user?.role_id === '1') && (
        <div className="work-preferences-card">
          <h3 className="card-title">Work Preferences</h3>
          
          <form onSubmit={handleWorkPreferencesSubmit} className="work-preferences-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="workType" className="label-up">Work Type</label>
                <select
                  id="workType"
                  name="workType"
                  value={workPreferences.workType}
                  onChange={handleWorkPreferencesChange}
                  disabled={!isEditingWorkPreferences}
                  className={isEditingWorkPreferences ? 'editing' : ''}
                >
                  <option value="">Select Work Type</option>
                  <option value="part-time">Part-time</option>
                  <option value="full-time">Full-time</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="hoursPerDay" className="label-up">Hours Per Day</label>
                <input
                  type="number"
                  id="hoursPerDay"
                  name="hoursPerDay"
                  value={workPreferences.hoursPerDay}
                  onChange={handleWorkPreferencesChange}
                  disabled={!isEditingWorkPreferences || workPreferences.workType === 'full-time'}
                  className={isEditingWorkPreferences ? 'editing' : ''}
                  min="1"
                  max="24"
                  placeholder="Hours per day"
                />
                {workPreferences.workType === 'full-time' && (
                  <span className="form-help">Full-time is automatically set to 8 hours</span>
                )}
              </div>
            </div>


            <div className="form-group full-width">
              <label className="label-up">Preferred Working Days</label>
              <div className="working-days-container">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <label key={day} className={`day-checkbox ${!isEditingWorkPreferences ? 'disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={workPreferences.preferredWorkingDays.includes(day)}
                      onChange={() => handleWorkingDayToggle(day)}
                      disabled={!isEditingWorkPreferences}
                    />
                    <span className="day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="bio" className="label-up">Professional Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={workPreferences.bio}
                onChange={handleWorkPreferencesChange}
                disabled={!isEditingWorkPreferences}
                className={isEditingWorkPreferences ? 'editing' : ''}
                rows={4}
                maxLength={500}
                placeholder="Tell potential employers about yourself..."
              />
              <div className="character-count">{workPreferences.bio.length}/500</div>
            </div>

            <div className="form-actions">
              {!isEditingWorkPreferences ? (
                <button type="button" className="worker-prefs-edit-btn" onClick={handleEditWorkPreferences}>
                  <MdEdit className="btn-icon" />
                  Edit Preferences
                </button>
              ) : (
                <>
                  <button type="button" className="worker-prefs-cancel-btn" onClick={handleCancelWorkPreferencesEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="worker-prefs-save-btn">
                    <MdEdit className="btn-icon" />
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Skills & Experience Card - Only for Workers */}
      {(user?.role_id === 1 || user?.role_id === '1') && (
        <div className="worker-skills-card">
          <h3 className="card-title">Skills & Experience</h3>
          
          <div className="skills-display">
            {/* Primary Skills */}
            <div className="skills-section">
              <h4 className="section-subtitle">Primary Skill</h4>
              {isEditingSkills ? (
                <div className="skill-editing-form">
                  <div className="form-group">
                    <label htmlFor="primarySkillSelect">Select Primary Skill</label>
                    <select
                      id="primarySkillSelect"
                      value={workerSkills.primary_skills[0]?.id || ''}
                      onChange={handlePrimarySkillChange}
                      className="form-input"
                    >
                      <option value="">Select Primary Skill</option>
                      {availableSkills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name || skill.skill_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {workerSkills.primary_skills[0] && (
                    <div className="skill-details-editing">
                      <div className="form-group">
                        <label htmlFor="primaryExperience">Experience Level</label>
                        <select
                          id="primaryExperience"
                          value={workerSkills.primary_skills[0].experience || ''}
                          onChange={(e) => handleSkillExperienceChange(workerSkills.primary_skills[0].id, e.target.value, true)}
                          className="form-input"
                        >
                          <option value="">Select Experience</option>
                          <option value="no-experience">No Experience</option>
                          <option value="0-11-months">0 to 11 months</option>
                          <option value="1-2-years">1 to 2 years</option>
                          <option value="2-5-years">2 to 5 years</option>
                          <option value="5-10-years">5 to 10 years</option>
                          <option value="10-plus-years">10+ years</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="primarySubSkills">Select Sub-skills</label>
                        <div id="primarySubSkills" className="sub-skills-checkbox-grid">
                          {(availableSkills.find(skill => skill.id === workerSkills.primary_skills[0].id)?.sub_skills || [])?.map((subSkill, index) => {
                            const isSelected = workerSkills.primary_skills[0].sub_skills?.includes(subSkill) || false;
                            return (
                              <label key={index} className="sub-skill-checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleSubSkillAdd(workerSkills.primary_skills[0].id, subSkill, true);
                                    } else {
                                      handleSubSkillRemove(workerSkills.primary_skills[0].id, subSkill, true);
                                    }
                                  }}
                                />
                                <span className="sub-skill-checkbox-label">{subSkill}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="sub-skills-tags">
                          {workerSkills.primary_skills[0].sub_skills?.map((subSkill, index) => (
                            <span key={index} className="sub-skill-tag">
                              {subSkill}
                              <button
                                type="button"
                                onClick={() => handleSubSkillRemove(workerSkills.primary_skills[0].id, subSkill, true)}
                                className="remove-sub-skill"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="skill-save-section">
                        <button 
                          type="button" 
                          className="cancel-individual-skill-btn"
                          onClick={() => {
                            setWorkerSkills(prev => ({
                              ...prev,
                              primary_skills: []
                            }));
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="save-individual-skill-btn"
                          onClick={() => handleSaveIndividualSkill('Primary', workerSkills.primary_skills[0])}
                          disabled={!workerSkills.primary_skills[0]?.skill_name}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                          </svg>
                          Save Primary Skill
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {workerSkills.primary_skills && workerSkills.primary_skills.length > 0 ? (
                    <div className="skills-list">
                      {workerSkills.primary_skills.map((skill, index) => (
                        <div key={index} className="skill-item primary-skill">
                          <div className="skill-header">
                            <span className="skill-name">{skill.skill_name}</span>
                          </div>
                          <div className="skill-details-row">
                            <div className="sub-skills">
                              <span className="sub-skills-label">Sub-skills:</span>
                              <div className="sub-skills-tags">
                                {skill.sub_skills.map((subSkill, subIndex) => (
                                  <span key={subIndex} className="sub-skill-tag">{subSkill}</span>
                                ))}
                              </div>
                            </div>
                            {skill.experience && (
                              <div className="skill-experience">
                                <span className="experience-label">Experience:</span>
                                <span className="experience-value">{skill.experience}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No primary skill added yet</p>
                  )}
                </>
              )}
            </div>

            {/* Additional Skills */}
            <div className="skills-section">
              <h4 className="section-subtitle">Additional Skills</h4>
              {isEditingSkills ? (
                <div className="additional-skills-editing">
                  <div className="form-group">
                    <label htmlFor="additionalSkillsSelect">Select Additional Skill</label>
                    <select
                      id="additionalSkillsSelect"
                      value={workerSkills.additional_skills.length > 0 ? workerSkills.additional_skills[0].id : ''}
                      onChange={(e) => {
                        const skillId = e.target.value;
                        const selectedSkill = availableSkills.find(skill => skill.id === parseInt(skillId));
                        
                        console.log('Selected skill for additional:', selectedSkill);
                        
                        if (selectedSkill) {
                          const skillName = selectedSkill.name || selectedSkill.skill_name;
                          console.log('Additional skill name:', skillName);
                          
                          setWorkerSkills(prev => {
                            const exists = (prev.additional_skills || []).some(s => s.id === selectedSkill.id);
                            const updated = exists
                              ? prev.additional_skills
                              : [
                                  ...(prev.additional_skills || []),
                                  { id: selectedSkill.id, skill_name: skillName, sub_skills: [], experience: '' }
                                ];
                            return {
                              ...prev,
                              additional_skills: updated
                            };
                          });
                        } else {
                          setWorkerSkills(prev => ({
                            ...prev,
                            additional_skills: []
                          }));
                        }
                      }}
                      className="form-input"
                    >
                      <option value="">Select Additional Skill</option>
                      {availableSkills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name || skill.skill_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {workerSkills.additional_skills.map((skill, index) => (
                    <div key={skill.id} className="skill-details-editing">
                      <div className="skill-header-editing">
                        <h5 className="skill-editing-title">{skill.skill_name}</h5>
                        <button
                          type="button"
                          className="remove-skill-btn"
                          onClick={() => handleRemoveAdditionalSkill(skill.id)}
                          title="Remove this skill"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                      <div className="form-group">
                        <label htmlFor={`additionalExperience${skill.id}`}>Experience Level</label>
                        <select
                          id={`additionalExperience${skill.id}`}
                          value={skill.experience || ''}
                          onChange={(e) => handleSkillExperienceChange(skill.id, e.target.value, false)}
                          className="form-input"
                        >
                          <option value="">Select Experience</option>
                          <option value="no-experience">No Experience</option>
                          <option value="0-11-months">0 to 11 months</option>
                          <option value="1-2-years">1 to 2 years</option>
                          <option value="2-5-years">2 to 5 years</option>
                          <option value="5-10-years">5 to 10 years</option>
                          <option value="10-plus-years">10+ years</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`additionalSubSkills${skill.id}`}>Select Sub-skills</label>
                        <div id={`additionalSubSkills${skill.id}`} className="sub-skills-checkbox-grid">
                          {(availableSkills.find(s => s.id === skill.id)?.sub_skills || [])?.map((subSkill, subIndex) => {
                            const isSelected = skill.sub_skills?.includes(subSkill) || false;
                            return (
                              <label key={subIndex} className="sub-skill-checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleSubSkillAdd(skill.id, subSkill, false);
                                    } else {
                                      handleSubSkillRemove(skill.id, subSkill, false);
                                    }
                                  }}
                                />
                                <span className="sub-skill-checkbox-label">{subSkill}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="sub-skills-tags">
                          {skill.sub_skills?.map((subSkill, subIndex) => (
                            <span key={subIndex} className="sub-skill-tag">
                              {subSkill}
                              <button
                                type="button"
                                onClick={() => handleSubSkillRemove(skill.id, subSkill, false)}
                                className="remove-sub-skill"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="skill-save-section">
                        <button 
                          type="button" 
                          className="cancel-individual-skill-btn"
                          onClick={() => {
                            setWorkerSkills(prev => ({
                              ...prev,
                              additional_skills: []
                            }));
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="save-individual-skill-btn"
                          onClick={() => handleSaveIndividualSkill('Additional')}
                          disabled={!skill?.skill_name}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                          </svg>
                          Save Additional Skill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {workerSkills.additional_skills && workerSkills.additional_skills.length > 0 ? (
                    <div className="skills-list">
                      {workerSkills.additional_skills.map((skill, index) => (
                        <div key={index} className="skill-item additional-skill">
                          <div className="skill-header">
                            <span className="skill-name">{skill.skill_name}</span>
                          </div>
                          <div className="skill-details-row">
                            <div className="sub-skills">
                              <span className="sub-skills-label">Sub-skills:</span>
                              <div className="sub-skills-tags">
                                {skill.sub_skills.map((subSkill, subIndex) => (
                                  <span key={subIndex} className="sub-skill-tag">{subSkill}</span>
                                ))}
                              </div>
                            </div>
                            {skill.experience && (
                              <div className="skill-experience">
                                <span className="experience-label">Experience:</span>
                                <span className="experience-value">{skill.experience}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No additional skills added yet</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="form-actions">
            {!isEditingSkills ? (
              <button 
                type="button" 
                className="worker-skills-edit-btn" 
                onClick={handleEditSkills}
              >
                <MdEdit className="btn-icon" />
                Edit Skills
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  className="worker-skills-cancel-btn" 
                  onClick={handleCancelSkillsEdit}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="worker-skills-save-btn"
                  onClick={handleSkillsSubmit}
                >
                  <MdEdit className="btn-icon" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Credentials Card - Only for Workers */}
      {(user?.role_id === 1 || user?.role_id === '1') && (
        <div className="worker-credentials-card">
          <h3 className="card-title">Credentials</h3>
          
          <div className="credentials-display">
            {/* Add Credential Form - Show when editing */}
            {isEditingCredentials && (
              <div className="add-credential-form">
                <h4 className="add-form-title">Add New Credential</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="credentialName">Credential Type</label>
                    <select
                      id="credentialName"
                      value={newCredential.credentials_name}
                      onChange={(e) => handleNewCredentialChange(e, 'credentials_name')}
                      className="form-input"
                    >
                      <option value="">Select Credential Type</option>
                      {credentialTypes.map((credential) => (
                        <option key={credential.value} value={credential.value}>
                          {credential.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="credentialFile">Upload File (Images: JPG, PNG, GIF, WEBP | Documents: PDF, Word - Max 2MB)</label>
                    <input
                      type="file"
                      id="credentialFile"
                      ref={credentialFileInputRef}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={(e) => handleNewCredentialChange(e, 'credentials_file')}
                      className="form-input"
                    />
                    {(newCredential.credentials_photo || newCredential.credentials_doc) && (
                      <div className="file-selected-info">
                        <span className="file-selected">
                          Selected: {(newCredential.credentials_photo || newCredential.credentials_doc)?.name}
                          {newCredential.credentials_photo && ' (Image)'}
                          {newCredential.credentials_doc && ' (Document)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="add-credential-action-btn"
                  onClick={handleAddCredential}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add to List
                </button>
              </div>
            )}

            {/* Existing Credentials List */}
            {workerCredentials && workerCredentials.length > 0 ? (
              <div className="credentials-list">
                {workerCredentials.map((credential, index) => (
                  <div key={index} className="credential-item">
                    <div className="credential-icon">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div className="credential-info">
                      <span className="credential-name">{credential.credentials_name}</span>
                      {credential.credentials_photo || credential.credentials_doc ? (
                        typeof credential.credentials_photo === 'string' || typeof credential.credentials_doc === 'string' ? (
                          <div className="document-info">
                            <a 
                              href={`http://127.0.0.1:8000/storage/${credential.credentials_photo || credential.credentials_doc}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="view-document-link"
                            >
                              View Document
                            </a>
                            <span className="file-path">{(credential.credentials_photo || credential.credentials_doc).split('/').pop()}</span>
                          </div>
                        ) : credential.credentials_photo instanceof File ? (
                          <span className="pending-upload">Pending upload: {credential.credentials_photo.name}</span>
                        ) : null
                      ) : (
                        <span className="no-file-uploaded">No file uploaded</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="remove-credential-btn"
                      onClick={() => handleRemoveCredential(index)}
                      title="Delete this credential"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : !isEditingCredentials ? (
              <p className="empty-state">No credentials added yet</p>
            ) : null}
          </div>

          <div className="form-actions">
            {!isEditingCredentials ? (
              <button 
                type="button" 
                className="worker-credentials-edit-btn" 
                onClick={handleEditCredentials}
              >
                <MdEdit className="btn-icon" />
                Edit Credentials
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  className="worker-credentials-cancel-btn" 
                  onClick={handleCancelCredentialsEdit}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="worker-credentials-save-btn"
                  onClick={handleCredentialsSubmit}
                >
                  <MdEdit className="btn-icon" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Credentials Card - Only for Employers */}
      {(user?.role_id === 2 || user?.role_id === '2' || user?.role_id === 4 || user?.role_id === '4') && (
        <div className="employer-credentials-card">
          <h3 className="card-title">Credentials</h3>
          
          <div className="credentials-display">
            {/* Add Credential Form - Show when editing */}
            {isEditingEmployerCredentials && (
              <div className="add-credential-form">
                <h4 className="add-form-title">Add New Credential</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employerCredentialName">Credential Type</label>
                    <select
                      id="employerCredentialName"
                      value={newEmployerCredential.credentials_name}
                      onChange={(e) => handleNewEmployerCredentialChange(e, 'credentials_name')}
                      className="form-input"
                    >
                      <option value="">Select Credential Type</option>
                      {credentialTypes.map((credential) => (
                        <option key={credential.value} value={credential.value}>
                          {credential.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="employerCredentialFile">Upload File (Images: JPG, PNG, GIF, WEBP | Documents: PDF, Word - Max 2MB)</label>
                    <input
                      type="file"
                      id="employerCredentialFile"
                      ref={employerCredentialFileInputRef}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={(e) => handleNewEmployerCredentialChange(e, 'credentials_file')}
                      className="form-input"
                    />
                    {(newEmployerCredential.credentials_photo || newEmployerCredential.credentials_doc) && (
                      <div className="file-selected-info">
                        <span className="file-selected">
                          Selected: {(newEmployerCredential.credentials_photo || newEmployerCredential.credentials_doc)?.name}
                          {newEmployerCredential.credentials_photo && ' (Image)'}
                          {newEmployerCredential.credentials_doc && ' (Document)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="add-credential-action-btn"
                  onClick={handleAddEmployerCredential}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add to List
                </button>
              </div>
            )}

            {/* Existing Credentials List */}
            {employerCredentials && employerCredentials.length > 0 ? (
              <div className="credentials-list">
                {employerCredentials.map((credential, index) => (
                  <div key={index} className="credential-item">
                    <div className="credential-icon">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div className="credential-info">
                      <span className="credential-name">{credential.credentials_name}</span>
                      {credential.credentials_photo || credential.credentials_doc ? (
                        typeof credential.credentials_photo === 'string' || typeof credential.credentials_doc === 'string' ? (
                          <div className="document-info">
                            <a 
                              href={`http://127.0.0.1:8000/storage/${credential.credentials_photo || credential.credentials_doc}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="view-document-link"
                            >
                              View Document
                            </a>
                            <span className="file-path">{(credential.credentials_photo || credential.credentials_doc).split('/').pop()}</span>
                          </div>
                        ) : credential.credentials_photo instanceof File ? (
                          <span className="pending-upload">Pending upload: {credential.credentials_photo.name}</span>
                        ) : null
                      ) : (
                        <span className="no-file-uploaded">No file uploaded</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="remove-credential-btn"
                      onClick={() => handleRemoveEmployerCredential(index)}
                      title="Delete this credential"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : !isEditingEmployerCredentials ? (
              <p className="empty-state">No credentials added yet</p>
            ) : null}
          </div>

          <div className="form-actions">
            {!isEditingEmployerCredentials ? (
              <button 
                type="button" 
                className="employer-credentials-edit-btn" 
                onClick={handleEditEmployerCredentials}
              >
                <MdEdit className="btn-icon" />
                Edit Credentials
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  className="employer-credentials-cancel-btn" 
                  onClick={handleCancelEmployerCredentialsEdit}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="employer-credentials-save-btn"
                  onClick={handleEmployerCredentialsSubmit}
                >
                  <MdEdit className="btn-icon" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>Profile Picture</h3>
              <button className="close-btn" onClick={closeImageModal}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="image-modal-content">
              <img 
                src={profileImagePreview || (user?.profile_img ? (user.profile_img.startsWith('images/') ? user.profile_img : `http://127.0.0.1:8000/storage/${user.profile_img}?v=${Date.now()}`) : 'images/defpfp.svg')} 
                alt="Profile" 
                onError={(e) => {
                  e.target.src = "images/defpfp.svg";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
