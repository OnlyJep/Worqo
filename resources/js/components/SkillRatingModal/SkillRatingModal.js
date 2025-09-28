import React, { useState, useEffect, useRef } from 'react';
import { IconX, IconChevronDown, IconPlus, IconMinus } from '@tabler/icons-react';
import { Select, Dropdown, message, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import '../../../sass/components/_skillratingmodal.scss';
const { Option } = Select;

const credentialOptions = [
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
];

const workTypeOptions = [
  { value: "part-time", label: "Part-time" },
  { value: "full-time", label: "Full-time" },
  { value: "one-time", label: "One-time" },
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
  const [newCredential, setNewCredential] = useState({ credentials_name: "", credentials_photo: null });
  const [errors, setErrors] = useState({});
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [skillsStepCompleted, setSkillsStepCompleted] = useState(false);
  const [workPreferencesCompleted, setWorkPreferencesCompleted] = useState(false);
  const [workType, setWorkType] = useState('part-time');
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [preferredWorkingHours, setPreferredWorkingHours] = useState([]);
  const [bio, setBio] = useState('');
  const credentialFileRef = useRef(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const abortController = useRef(new AbortController());

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      abortController.current.abort();
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
        if (isMounted.current) navigate('/homepage');
        return;
      }

      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.warn('No authentication token found');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/workers/${user.id}`, {
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
        if (isMounted.current) navigate('/homepage');
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
      const response = await fetch(`http://127.0.0.1:8000/api/workers/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        signal: abortController.current.signal,
      });
      if (!response.ok) {
        console.error('Worker fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch worker profile');
      }
      const profile = await response.json();
      console.log('Fetched profile from /api/workers:', JSON.stringify(profile, null, 2));
      if (profile && profile.id && isMounted.current) {
        setProfileId(profile.id);
        
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
    setSelectedSkill({
      ...skill,
      experience: 'no-experience',
      hourly_rate: ''
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
        ...newSkills[0],
        experience: 'no-experience',
        hourly_rate: ''
      });
      // Initialize with all sub-skills available and none selected
      setAvailableSubSkills(newSkills[0].sub_skills || []);
      setSelectedSubSkills([]);
      setShowSkillModal(true);
    } else {
      message.error('All selected skills are already added or invalid.');
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
      
      setSelectedSkill({ 
        ...skill, 
        sub_skills: originalSkill.sub_skills || [],
        experience: skill.experience || 'no-experience',
        hourly_rate: skill.hourly_rate || ''
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
    if (field === "credentials_photo" && value) {
      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
        ].includes(value.type)
      ) {
        setErrors((prev) => ({
          ...prev,
          new_credential_photo: "Credential must be PDF, Word, JPG, or PNG",
        }));
        return;
      }
      if (value.size > 2048 * 1024) {
        setErrors((prev) => ({
          ...prev,
          new_credential_photo: "Credential file must not exceed 2 MB",
        }));
        return;
      }
    }
    setNewCredential((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "" }));
  };

  const addCredential = () => {
    console.log('Adding credential:', newCredential);
    if (!newCredential.credentials_name) {
      setErrors((prev) => ({ ...prev, new_credential_name: "Please select a credential type" }));
      return;
    }
    if (!newCredential.credentials_photo) {
      setErrors((prev) => ({ ...prev, new_credential_photo: "Please upload a credential file" }));
      return;
    }
    setCredentials((prev) => [...prev, { ...newCredential }]);
    setNewCredential({ credentials_name: "", credentials_photo: null });
    setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "" }));
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
      experience: selectedSkill.experience || 'no-experience',
      hourly_rate: selectedSkill.hourly_rate || '',
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
          updatedSkills.primary_skills[primaryIndex] = { ...updatedSkills.primary_skills[primaryIndex], sub_skills: newSkill.sub_skills };
        } else {
          const additionalIndex = updatedSkills.additional_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
          if (additionalIndex !== -1) {
            updatedSkills.additional_skills[additionalIndex] = { ...updatedSkills.additional_skills[additionalIndex], sub_skills: newSkill.sub_skills };
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
          // Update existing skill with new sub-skills
          if (isMounted.current) {
            setUserSkills(prev => {
              const updated = { ...prev };
              // Check if it's in primary skills
              const primaryIndex = prev.primary_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
              if (primaryIndex !== -1) {
                updated.primary_skills[primaryIndex] = { ...updated.primary_skills[primaryIndex], sub_skills: newSkill.sub_skills };
              } else {
                // Check if it's in additional skills
                const additionalIndex = prev.additional_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
                if (additionalIndex !== -1) {
                  updated.additional_skills[additionalIndex] = { ...updated.additional_skills[additionalIndex], sub_skills: newSkill.sub_skills };
                }
              }
              return updated;
            });
          }
        } else {
          // New skill added successfully
          if (isMounted.current) {
            setUserSkills(prev => {
              // Check if skill already exists
              const existsInPrimary = prev.primary_skills.some(skill => skill.skill_id === newSkill.skill_id);
              const existsInAdditional = prev.additional_skills.some(skill => skill.skill_id === newSkill.skill_id);
              
              if (existsInPrimary || existsInAdditional) {
                // Update existing skill
                const updated = { ...prev };
                if (existsInPrimary) {
                  const index = updated.primary_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
                  updated.primary_skills[index] = { ...updated.primary_skills[index], sub_skills: newSkill.sub_skills };
                } else {
                  const index = updated.additional_skills.findIndex(skill => skill.skill_id === newSkill.skill_id);
                  updated.additional_skills[index] = { ...updated.additional_skills[index], sub_skills: newSkill.sub_skills };
                }
                return updated;
              }
              
              // Add new skill - determine if it should be primary or additional
              if (prev.primary_skills.length === 0) {
                return { ...prev, primary_skills: [newSkill] };
              } else {
                return { ...prev, additional_skills: [...prev.additional_skills, newSkill] };
              }
            });
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
            return [];
          }
        });
        const totalSkills = (userSkills.primary_skills?.length || 0) + (userSkills.additional_skills?.length || 0) + 1;
        if (totalSkills >= 2) {
          console.log('Total skills >= 2 after adding, setting skillsStepCompleted to true');
          setSkillsStepCompleted(true);
          localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
        }
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
    submitData.append('work_type', workType);
    submitData.append('hours_per_day', hoursPerDay);
    submitData.append('monthly_salary', monthlySalary);
    submitData.append('preferred_working_hours', JSON.stringify(preferredWorkingHours));
    submitData.append('bio', bio);

    // Add primary skills
    skillsId.primary_skills.forEach((skill, index) => {
      submitData.append(`skills_id[primary_skills][${index}][skill_id]`, skill.skill_id);
      submitData.append(`skills_id[primary_skills][${index}][skill_name]`, skill.skill_name);
      submitData.append(`skills_id[primary_skills][${index}][experience]`, skill.experience || 'no-experience');
      submitData.append(`skills_id[primary_skills][${index}][hourly_rate]`, skill.hourly_rate || '');
      skill.sub_skills.forEach((subSkill, subIndex) => {
        submitData.append(`skills_id[primary_skills][${index}][sub_skills][${subIndex}]`, subSkill);
      });
    });

    // Add additional skills
    skillsId.additional_skills.forEach((skill, index) => {
      submitData.append(`skills_id[additional_skills][${index}][skill_id]`, skill.skill_id);
      submitData.append(`skills_id[additional_skills][${index}][skill_name]`, skill.skill_name);
      submitData.append(`skills_id[additional_skills][${index}][experience]`, skill.experience || 'no-experience');
      submitData.append(`skills_id[additional_skills][${index}][hourly_rate]`, skill.hourly_rate || '');
      skill.sub_skills.forEach((subSkill, subIndex) => {
        submitData.append(`skills_id[additional_skills][${index}][sub_skills][${subIndex}]`, subSkill);
      });
    });

    credentials.forEach((cred, index) => {
      submitData.append(`credentials[${index}][credentials_name]`, cred.credentials_name);
      if (cred.credentials_photo instanceof File) {
        submitData.append(`credentials[${index}][credentials_photo]`, cred.credentials_photo);
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
        work_type: 'part-time',
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
        onComplete();
        navigate('/homepage');
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

  if (!isOpen || !user?.id || isProfileComplete || user?.role_id === 2) {
    console.log('SkillRatingModal not rendered: isOpen=', isOpen, 'user.id=', user?.id, 'isProfileComplete=', isProfileComplete, 'user.role_id=', user?.role_id);
    return null;
  }

  return (
    <div className="skill-rating-overlay">
      <div className="skill-rating-container">
        <div className="progress-side">
          <div className="logo">Worqo</div>
          <h2>Let's Get You Started!</h2>
          <div className="progress-steps">
            <div className="step completed"><div className="step-number">✓</div><span>Register for an account</span></div>
            <div className="step completed"><div className="step-number">✓</div><span>Create profile</span></div>
            <div className={`step ${step === 3 ? 'current' : workPreferencesCompleted ? 'completed' : ''}`}>
              <div className="step-number">{workPreferencesCompleted ? '✓' : '3'}</div>
              <span>Work Preferences</span>
            </div>
            <div className={`step ${step === 4 ? 'current' : skillsStepCompleted ? 'completed' : ''}`}>
              <div className="step-number">{skillsStepCompleted ? '✓' : '4'}</div>
              <span>Skills & Experience</span>
            </div>
            <div className={`step ${step === 5 ? 'current' : ''}`}>
              <div className="step-number">5</div>
              <span>Credentials</span>
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
                    <label className="form-label">Work Type <span className="required">*</span></label>
                    <Select
                      value={workType}
                      onChange={(value) => {
                        setWorkType(value);
                        // Auto-set hours per day based on work type
                        if (value === 'full-time') {
                          setHoursPerDay(8);
                        } else if (value === 'part-time') {
                          setHoursPerDay(4);
                        } else if (value === 'one-time') {
                          setHoursPerDay(1);
                        }
                      }}
                      className="form-select"
                    >
                      {workTypeOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hours Per Day</label>
                    <Input
                      type="number"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(parseInt(e.target.value) || 1)}
                      min="1"
                      max="24"
                      className="form-input"
                      disabled={workType === 'full-time'}
                    />
                    {workType === 'full-time' && (
                      <span className="form-help">Full-time automatically set to 8 hours per day</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expected Monthly Salary (PHP)</label>
                    <Input
                      type="number"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value)}
                      min="0"
                      step="100"
                      placeholder="e.g., 15000"
                      className="form-input"
                    />
                    <span className="form-help">Set your expected monthly salary (optional)</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Working Days</label>
                    <Select
                      mode="multiple"
                      value={preferredWorkingHours}
                      onChange={setPreferredWorkingHours}
                      placeholder="Select your preferred working days"
                      className="form-select"
                    >
                      {workingDaysOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                    <span className="form-help">Select the days you're available to work</span>
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
            <>
              <div className="step-header">
                <h1>Skills & Experience</h1>
                <p className="step-description">Add your primary skill and additional skills to showcase your expertise.</p>
              </div>

              <div className="form-section">
                <div className="section-title">Your Skills</div>
                <p className="section-description">Add your primary skill and additional skills to showcase your expertise.</p>

                <div className="skills-section">
                  <div className="skill-group">
                    <label className="form-label">Primary Skill <span className="required">*</span></label>
                    <Select
                      showSearch
                      placeholder="Choose your main skill"
                      onSearch={setSearchTermPrimary}
                      onSelect={handlePrimarySkillSelect}
                      className="form-select"
                      optionFilterProp="children"
                      allowClear
                      value={undefined}
                    >
                      {filteredSkillsPrimary.map(skill => (
                        <Option key={skill.id} value={skill.id}>
                          {skill.name}
                        </Option>
                      ))}
                    </Select>
                    <span className="form-help">Select your strongest skill</span>
                    
                    {(userSkills.primary_skills?.length || 0) > 0 && (
                      <div className="selected-skills">
                        {(userSkills.primary_skills || []).map(skill => (
                          <Dropdown 
                            key={skill.skill_id} 
                            menu={skillMenu(skill)} 
                            trigger={['click']}
                            placement="bottomRight"
                          >
                            <div className="skill-card primary-skill">
                              <div className="skill-header">
                                <span className="skill-name">{skill.skill_name}</span>
                                <IconChevronDown size={16} className="dropdown-arrow" />
                              </div>
                              <div className="skill-details">
                                {skill.sub_skills?.length > 0 && (
                                  <div className="skill-sub-skills">
                                    <span className="sub-skills-label">Sub-skills:</span>
                                    <span className="sub-skills-list">{skill.sub_skills.join(', ')}</span>
                                  </div>
                                )}
                                {skill.experience && (
                                  <div className="skill-experience">
                                    <span className="experience-label">Experience:</span>
                                    <span className="experience-value">{experienceOptions.find(e => e.value === skill.experience)?.label}</span>
                                  </div>
                                )}
                                {skill.hourly_rate && (
                                  <div className="skill-rate">
                                    <span className="rate-label">Rate:</span>
                                    <span className="rate-value">₱{skill.hourly_rate}/hr</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Dropdown>
                        ))}
                      </div>
                    )}
                    {(userSkills.primary_skills?.length || 0) === 0 && (
                      <div className="empty-state">
                        <span className="empty-text">No primary skill selected</span>
                      </div>
                    )}
                  </div>

                  <div className="skill-group">
                    <label className="form-label">Additional Skills</label>
                    <Select
                      mode="multiple"
                      showSearch
                      placeholder="Choose additional skills"
                      onSearch={setSearchTermAdditional}
                      onChange={handleAdditionalSkillsSelect}
                      className="form-select"
                      optionFilterProp="children"
                      maxTagCount={0}
                      tagRender={() => null}
                      allowClear
                      value={[]}
                    >
                      {filteredSkillsAdditional.map(skill => (
                        <Option key={skill.id} value={skill.id}>
                          {skill.name}
                        </Option>
                      ))}
                    </Select>
                    <span className="form-help">Add other skills you possess</span>
                    
                    {userSkills.additional_skills.length > 0 ? (
                      <div className="selected-skills">
                        {userSkills.additional_skills.map(skill => (
                          <Dropdown 
                            key={skill.skill_id} 
                            menu={skillMenu(skill)} 
                            trigger={['click']}
                            placement="bottomRight"
                          >
                            <div className="skill-card additional-skill">
                              <div className="skill-header">
                                <span className="skill-name">{skill.skill_name}</span>
                                <IconChevronDown size={16} className="dropdown-arrow" />
                              </div>
                              <div className="skill-details">
                                {skill.sub_skills?.length > 0 && (
                                  <div className="skill-sub-skills">
                                    <span className="sub-skills-label">Sub-skills:</span>
                                    <span className="sub-skills-list">{skill.sub_skills.join(', ')}</span>
                                  </div>
                                )}
                                {skill.experience && (
                                  <div className="skill-experience">
                                    <span className="experience-label">Experience:</span>
                                    <span className="experience-value">{experienceOptions.find(e => e.value === skill.experience)?.label}</span>
                                  </div>
                                )}
                                {skill.hourly_rate && (
                                  <div className="skill-rate">
                                    <span className="rate-label">Rate:</span>
                                    <span className="rate-value">₱{skill.hourly_rate}/hr</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Dropdown>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <span className="empty-text">No additional skills selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="step-header">
                <h1>Add Your Credentials</h1>
                <p className="step-description">Upload relevant documents to support your skills and build trust with potential employers.</p>
              </div>

              <div className="form-section">
                <div className="section-title">Professional Credentials</div>
                <p className="section-description">Add any relevant credentials to support your skills (optional but recommended).</p>

                <div className="credentials-section">
                  <div className="credential-form">
                    <div className="form-group">
                      <label className="form-label">Credential Type</label>
                      <Select
                        value={newCredential.credentials_name}
                        onChange={(value) => handleNewCredentialChange({ target: { value } }, "credentials_name")}
                        placeholder="Choose a credential type"
                        className="form-select"
                      >
                        {credentialOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    {newCredential.credentials_name && (
                      <div className="form-group">
                        <label className="form-label">Upload Document</label>
                        <div className="file-upload-container">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => handleNewCredentialChange(e, "credentials_photo")}
                            ref={credentialFileRef}
                            className="file-input"
                            id="credential-file"
                          />
                          <label htmlFor="credential-file" className="file-upload-label">
                            <span className="upload-icon">📁</span>
                            <span className="upload-text">Choose file or drag and drop</span>
                            <span className="upload-hint">PDF, DOC, DOCX, JPG, PNG (Max 2MB)</span>
                          </label>
                        </div>
                        {newCredential.credentials_photo && (
                          <div className="file-preview">
                            <span className="file-name">{newCredential.credentials_photo.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {newCredential.credentials_name && (
                      <button 
                        type="button" 
                        onClick={addCredential}
                        className="add-credential-btn"
                        disabled={!newCredential.credentials_photo}
                      >
                        Add Credential
                      </button>
                    )}

                    {errors.new_credential_name && <span className="error-message">{errors.new_credential_name}</span>}
                    {errors.new_credential_photo && <span className="error-message">{errors.new_credential_photo}</span>}
                  </div>

                  {credentials.length > 0 ? (
                    <div className="credentials-list">
                      <div className="list-header">
                        <span className="list-title">Added Credentials ({credentials.length})</span>
                      </div>
                      {credentials.map((cred, index) => (
                        <div key={index} className="credential-item">
                          <div className="credential-info">
                            <span className="credential-name">{cred.credentials_name}</span>
                            <span className="credential-file">{cred.credentials_photo?.name || "No file selected"}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeCredential(index)}
                            className="remove-credential-btn"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-credentials">
                      <span className="empty-text">No credentials added yet</span>
                      <span className="empty-hint">Add credentials to build trust with employers</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="step-navigation">
            {step === 3 ? (
              <div className="navigation-buttons">
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => {
                    // Validate Work Preferences
                    if (workType && hoursPerDay && preferredWorkingHours.length > 0) {
                      setWorkPreferencesCompleted(true);
                      setStep(4);
                    } else {
                      message.error('Please fill in all required fields');
                    }
                  }}
                >
                  Next
                </button>
              </div>
            ) : step === 4 ? (
              <div className="navigation-buttons">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setStep(3)}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleNextStep}
                  disabled={(userSkills.primary_skills?.length || 0) === 0 || (userSkills.additional_skills?.length || 0) === 0}
                >
                  Next
                </button>
              </div>
            ) : (
              <div className="navigation-buttons">
                <button 
                  className="btn btn-secondary" 
                  onClick={handlePreviousStep}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleFinalFinish}
                  disabled={!profileId}
                >
                  Complete
                </button>
              </div>
            )}
          </div>

          {showSkillModal && selectedSkill && step === 4 && (
            <div className="skill-details-modal">
              <div className="modal-overlay" onClick={() => setShowSkillModal(false)}></div>
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{selectedSkill.skill_name || selectedSkill.name}</h3>
                  <button className="close-btn" onClick={handleModalClose}>
                    <IconX size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="skill-details-section">
                    <div className="form-group">
                      <label className="form-label">Experience Level <span className="required">*</span></label>
                      <Select
                        value={selectedSkill.experience || 'no-experience'}
                        onChange={(value) => setSelectedSkill(prev => ({ ...prev, experience: value }))}
                        className="form-select"
                      >
                        {experienceOptions.map(option => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Hourly Rate for this Skill (PHP)</label>
                      <input
                        type="number"
                        value={selectedSkill.hourly_rate || ''}
                        onChange={(e) => setSelectedSkill(prev => ({ ...prev, hourly_rate: e.target.value }))}
                        placeholder="e.g., 500"
                        min="0"
                        step="10"
                        className="form-input"
                      />
                      <span className="form-help">Set a specific rate for this skill (optional)</span>
                    </div>
                  </div>

                  <div className="sub-skills-section">
                    <label className="form-label">Sub-Skills <span className="required">*</span></label>
                    <p className="section-description">Add or remove sub-skills using the buttons below.</p>
                    <div className="sub-skills-container">
                      <div className="sub-skills-column">
                        <h4 className="column-title">Available Sub-Skills</h4>
                        {availableSubSkills.length > 0 ? (
                          <div className="sub-skills-list">
                            {availableSubSkills.map(subSkill => (
                              <div key={subSkill} className="sub-skill-item">
                                <span className="sub-skill-text">{subSkill}</span>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleAddSubSkill(subSkill)}
                                  aria-label={`Add ${subSkill} to selected sub-skills`}
                                >
                                  <IconPlus size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <span className="empty-text">No available sub-skills</span>
                          </div>
                        )}
                      </div>
                      <div className="sub-skills-column">
                        <h4 className="column-title">Selected Sub-Skills</h4>
                        {selectedSubSkills.length > 0 ? (
                          <div className="sub-skills-list">
                            {selectedSubSkills.map(subSkill => (
                              <div key={subSkill} className="sub-skill-item selected">
                                <span className="sub-skill-text">{subSkill}</span>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleRemoveSubSkill(subSkill)}
                                  aria-label={`Remove ${subSkill} from selected sub-skills`}
                                >
                                  <IconMinus size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <span className="empty-text">No sub-skills selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowSkillModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSaveSkill}>Save Skill</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillRatingModal;