import React, { useState, useEffect, useRef } from 'react';
import { IconX, IconChevronDown, IconPlus, IconMinus } from '@tabler/icons-react';
import { Select, Dropdown, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
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

const SkillRatingModal = ({ isOpen, onClose, onComplete, user }) => {
  const [step, setStep] = useState(3);
  const [searchTermPrimary, setSearchTermPrimary] = useState('');
  const [searchTermAdditional, setSearchTermAdditional] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [pendingSkills, setPendingSkills] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [userSkills, setUserSkills] = useState({ primary: null, additional: [] });
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
    if (user?.id) {
      console.log('SkillRatingModal: Initializing for user ID:', user.id);
      checkProfileCompletion();
      fetchProfile();
      fetchSkills();
      loadFromLocalStorage();
    } else {
      console.warn('No user ID provided, skipping initialization');
    }
  }, [user?.id]);

  const checkProfileCompletion = async () => {
    if (!user?.id) {
      console.warn('No user ID for profile completion check');
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

      const skills = Array.isArray(profileData?.worker?.skills_id) ? profileData.worker.skills_id : [];
      const hasCredentials = Array.isArray(profileData?.worker?.credentials_name) && profileData.worker.credentials_name.length > 0;
      if (skills.length >= 2 && hasCredentials) {
        console.log(`Found ${skills.length} skills and credentials, setting skillsStepCompleted to true`);
        setIsProfileComplete(true);
        setSkillsStepCompleted(true);
        localStorage.setItem(`isProfileComplete_${user.id}`, 'true');
        localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
        if (isMounted.current) navigate('/homepage');
      } else {
        console.log(`Skills found: ${skills.length}, Credentials: ${hasCredentials ? 'Yes' : 'No'}, keeping skillsStepCompleted as false`);
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
        setUserSkills({
          primary: parsed.primary || null,
          additional: Array.isArray(parsed.additional) ? parsed.additional : [],
        });
        if (parsed.primary && parsed.additional.length > 0) {
          console.log('Primary and additional skills found in localStorage, setting skillsStepCompleted to true');
          setSkillsStepCompleted(true);
          localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
        }
      }
      const savedPrimary = localStorage.getItem(`primarySkill_${user.id}`);
      if (savedPrimary) {
        console.log('Loaded primarySkill:', JSON.parse(savedPrimary));
        setPrimarySkill(JSON.parse(savedPrimary));
      }
      const savedAdditional = localStorage.getItem(`additionalSkills_${user.id}`);
      if (savedAdditional) {
        console.log('Loaded additionalSkills:', JSON.parse(savedAdditional));
        setAdditionalSkills(JSON.parse(savedAdditional) || []);
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
    } catch (error) {
      console.error('Error loading from localStorage:', error.message);
    }
  };

  const saveToLocalStorage = () => {
    if (!user?.id) {
      console.warn('Cannot save to localStorage: user or user.id is missing');
      return;
    }
    console.log('Saving to localStorage for user:', user.id, 'skillsStepCompleted:', skillsStepCompleted);
    try {
      localStorage.setItem(`userSkills_${user.id}`, JSON.stringify(userSkills));
      localStorage.setItem(`primarySkill_${user.id}`, JSON.stringify(primarySkill));
      localStorage.setItem(`additionalSkills_${user.id}`, JSON.stringify(additionalSkills));
      localStorage.setItem(`skillsStepCompleted_${user.id}`, skillsStepCompleted.toString());
      if (profileId) localStorage.setItem(`profile_${user.id}`, profileId.toString());
    } catch (error) {
      console.error('Error saving to localStorage:', error.message);
    }
  };

  useEffect(() => {
    if (isMounted.current) {
      saveToLocalStorage();
    }
  }, [userSkills, primarySkill, additionalSkills, profileId, skillsStepCompleted]);

  const fetchProfile = async () => {
    if (!user?.id) {
      console.warn('No user ID provided for fetching profile');
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
        const skills = Array.isArray(profile.worker?.skills_id) ? profile.worker.skills_id : [];
        const hasCredentials = Array.isArray(profile.worker?.credentials_name) && profile.worker.credentials_name.length > 0;
        if (skills.length >= 2 && hasCredentials) {
          console.log(`Found ${skills.length} skills and credentials, setting skillsStepCompleted to true`);
          const primary = skills[0] || null;
          const additional = skills.slice(1) || [];
          setUserSkills({ primary, additional });
          setPrimarySkill(primary);
          setAdditionalSkills(additional);
          setSkillsStepCompleted(true);
          localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
          localStorage.setItem(`isProfileComplete_${user.id}`, 'true');
        } else {
          console.log(`Skills found: ${skills.length}, Credentials: ${hasCredentials ? 'Yes' : 'No'}, setting skillsStepCompleted to false`);
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
        alert('No profile found. Please create a profile first.');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Profile fetch aborted');
        return;
      }
      console.error('Error fetching profile:', error.message);
      alert(`Failed to load profile: ${error.message}. Please try again.`);
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
      alert('Failed to load skills: ' + error.message);
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
    if (primarySkill?.skill_id) {
      skillsToFilter = availableSkills.filter(s => s.id !== primarySkill.skill_id);
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
  }, [searchTermAdditional, availableSkills, primarySkill]);

  const handlePrimarySkillSelect = (value) => {
    console.log('Selecting primary skill:', value);
    if (primarySkill) {
      alert('Only one primary skill can be selected.');
      return;
    }
    const totalSkills = (userSkills.primary ? 1 : 0) + userSkills.additional.length;
    if (totalSkills >= 15) {
      alert('You can only add up to 15 skills. Please remove a skill first.');
      return;
    }
    const skill = availableSkills.find(s => s.id === parseInt(value));
    if (!skill) {
      console.error('Selected skill not found:', value);
      alert('Invalid skill selected. Please try again.');
      return;
    }
    if (userSkills.additional.some(userSkill => userSkill.skill_id === skill.id)) {
      alert('This skill has already been added as an additional skill.');
      return;
    }
    console.log('Opening sub-skills modal for skill:', skill);
    setSelectedSkill(skill);
    setAvailableSubSkills(skill.sub_skills || []);
    setSelectedSubSkills([]);
    setShowSkillModal(true);
  };

  const handleAdditionalSkillsSelect = (values) => {
    console.log('Selecting additional skills:', values);
    const totalSkills = (userSkills.primary ? 1 : 0) + userSkills.additional.length;
    const newSkills = values
      .map(id => availableSkills.find(s => s.id === parseInt(id)))
      .filter(skill => skill && !userSkills.additional.some(userSkill => userSkill.skill_id === skill.id) && (!userSkills.primary || userSkills.primary.skill_id !== skill.id));
    
    if (totalSkills + newSkills.length > 15) {
      alert(`You can only add up to 15 skills. You can add ${15 - totalSkills} more skill(s).`);
      return;
    }
    if (newSkills.length > 0) {
      console.log('Opening sub-skills modal for additional skills:', newSkills);
      setPendingSkills(newSkills);
      setSelectedSkill(newSkills[0]);
      setAvailableSubSkills(newSkills[0].sub_skills || []);
      setSelectedSubSkills([]);
      setShowSkillModal(true);
    } else {
      alert('All selected skills are already added or invalid.');
    }
  };

  const handleSkillItemClick = (skill, action) => {
    console.log('Skill item action:', action, 'for skill:', skill);
    if (action === 'edit') {
      const originalSkill = availableSkills.find(s => s.id === skill.id || s.id === skill.skill_id);
      if (!originalSkill) {
        console.error('Skill not found for editing:', skill.id);
        return;
      }
      console.log('Editing skill:', originalSkill);
      setSelectedSkill({ ...skill, sub_skills: originalSkill.sub_skills || [] });
      setAvailableSubSkills(originalSkill.sub_skills || []);
      setSelectedSubSkills(skill.sub_skills || []);
      setShowSkillModal(true);
    } else if (action === 'remove') {
      setUserSkills(prev => {
        let newAdditional = Array.isArray(prev.additional) ? prev.additional.filter(s => s.skill_id !== skill.id && s.skill_id !== skill.skill_id) : [];
        if (prev.primary && (prev.primary.skill_id === skill.id || prev.primary.skill_id === skill.skill_id)) {
          return { primary: null, additional: newAdditional };
        }
        return { ...prev, additional: newAdditional };
      });
      setPrimarySkill(prev => (prev && (prev.skill_id === skill.id || prev.skill_id === skill.skill_id)) ? null : prev);
      setAdditionalSkills(prev => prev.filter(s => s.skill_id !== skill.id && s.skill_id !== skill.skill_id));
      setPendingSkills(prev => prev.filter(s => s.id !== skill.id && s.id !== skill.skill_id));
      const totalSkills = (userSkills.primary ? 1 : 0) + userSkills.additional.length - 1;
      if (totalSkills < 2) {
        console.log('Skills reduced to <2, setting skillsStepCompleted to false');
        setSkillsStepCompleted(false);
        localStorage.setItem(`skillsStepCompleted_${user.id}`, 'false');
      }
    }
  };

  const handleAddSubSkill = (subSkill) => {
    console.log('Adding sub-skill:', subSkill);
    if (selectedSubSkills.includes(subSkill)) {
      alert('This sub-skill is already selected.');
      return;
    }
    setSelectedSubSkills(prev => [...prev, subSkill]);
    setAvailableSubSkills(prev => prev.filter(s => s !== subSkill));
  };

  const handleRemoveSubSkill = (subSkill) => {
    console.log('Removing sub-skill:', subSkill);
    setSelectedSubSkills(prev => prev.filter(s => s !== subSkill));
    setAvailableSubSkills(prev => [...prev, subSkill].sort());
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
      alert('Please select a skill');
      return;
    }
    if (selectedSkill.sub_skills?.length > 0 && selectedSubSkills.length === 0) {
      alert('Please select at least one sub-skill for this skill.');
      return;
    }
    if (!profileId) {
      alert('Profile not loaded. Please wait and try again.');
      return;
    }

    const newSkill = {
      skill_id: String(selectedSkill.id),
      skill_name: selectedSkill.name,
      sub_skills: selectedSubSkills,
    };

    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      alert('Authentication token missing. Please log in again.');
      return;
    }

    try {
      console.log('Sending request to /api/add-skill:', {
        profile_id: profileId,
        skill_id: selectedSkill.id,
        skill_name: selectedSkill.name,
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
          skill_id: selectedSkill.id,
          skill_name: selectedSkill.name,
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
        if (!userSkills.primary?.skill_id === newSkill.skill_id &&
            !userSkills.additional.some(s => s.skill_id === newSkill.skill_id)) {
          if (isMounted.current) {
            setUserSkills(prev => {
              if (!prev.primary) {
                return { primary: newSkill, additional: prev.additional };
              }
              return { ...prev, additional: [...prev.additional, newSkill] };
            });
            if (!primarySkill) {
              setPrimarySkill(newSkill);
            } else {
              setAdditionalSkills(prev => {
                if (!prev.some(s => s.skill_id === newSkill.skill_id)) {
                  return [...prev, newSkill];
                }
                return prev;
              });
            }
          }
        }
      } else {
        if (isMounted.current) {
          setUserSkills(prev => {
            if (prev.primary?.skill_id === newSkill.skill_id ||
                prev.additional.some(s => s.skill_id === newSkill.skill_id)) {
              return prev;
            }
            if (!prev.primary) {
              return { primary: newSkill, additional: prev.additional };
            }
            return { ...prev, additional: [...prev.additional, newSkill] };
          });
          if (!primarySkill) {
            setPrimarySkill(newSkill);
          } else {
            setAdditionalSkills(prev => {
              if (!prev.some(s => s.skill_id === newSkill.skill_id)) {
                return [...prev, newSkill];
              }
              return prev;
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
                setAvailableSubSkills(nextSkills[0].sub_skills || []);
                setSelectedSubSkills([]);
              }
            }, 100);
            return nextSkills;
          } else {
            setShowSkillModal(false);
            setSelectedSkill(null);
            setAvailableSubSkills([]);
            return [];
          }
        });
        const totalSkills = (userSkills.primary ? 1 : 0) + userSkills.additional.length + 1;
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
      alert(`Failed to save skill: ${error.message}. Please try again.`);
    }
  };

  const handleModalClose = () => {
    console.log('Closing skill modal');
    if (isMounted.current) {
      setPendingSkills(prev => {
        const nextSkills = prev.filter(skill => skill.id !== selectedSkill?.id);
        if (nextSkills.length > 0) {
          setSelectedSkill(nextSkills[0]);
          setAvailableSubSkills(nextSkills[0].sub_skills || []);
          setSelectedSubSkills([]);
          return nextSkills;
        } else {
          setShowSkillModal(false);
          setSelectedSkill(null);
          setAvailableSubSkills([]);
          return [];
        }
      });
    }
  };

  const handleNextStep = () => {
    console.log('Next step clicked, userSkills:', userSkills);
    if (!userSkills.primary || userSkills.additional.length === 0) {
      alert('Please select 1 primary skill and at least 1 additional skill before proceeding.');
      return;
    }
    setSkillsStepCompleted(true);
    localStorage.setItem(`skillsStepCompleted_${user.id}`, 'true');
    console.log('skillsStepCompleted set to true, moving to step 4');
    setStep(4);
  };

  const handlePreviousStep = () => {
    console.log('Previous step clicked');
    setStep(3);
  };

  const handleFinalFinish = async () => {
    console.log('Final finish clicked, profileId:', profileId, 'userSkills:', userSkills);
    if (!profileId) {
      alert('Profile ID not found. Please create a profile first.');
      return;
    }
    if (!userSkills.primary || userSkills.additional.length === 0) {
      alert('Please select at least 1 primary and 1 additional skill.');
      return;
    }

    const skillsId = [
      { ...userSkills.primary, sub_skills: userSkills.primary.sub_skills || [] },
      ...userSkills.additional.map(skill => ({
        ...skill,
        sub_skills: skill.sub_skills || [],
      })),
    ];

    const submitData = new FormData();
    submitData.append('profile_id', profileId);
    submitData.append('work_type', 'part-time');

    skillsId.forEach((skill, index) => {
      submitData.append(`skills_id[${index}][skill_id]`, skill.skill_id);
      submitData.append(`skills_id[${index}][skill_name]`, skill.skill_name);
      skill.sub_skills.forEach((subSkill, subIndex) => {
        submitData.append(`skills_id[${index}][sub_skills][${subIndex}]`, subSkill);
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
      alert('Authentication token missing. Please log in again.');
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
      alert(`Failed to complete profile: ${error.message}. Please try again.`);
    }
  };

  const skillMenu = (skill) => (
    <Menu>
      <Menu.Item key="edit" onClick={() => handleSkillItemClick(skill, 'edit')}>
        Edit
      </Menu.Item>
      <Menu.Item key="remove" onClick={() => handleSkillItemClick(skill, 'remove')}>
        Remove
      </Menu.Item>
    </Menu>
  );

  if (!isOpen || !user?.id || isProfileComplete) {
    console.log('SkillRatingModal not rendered: isOpen=', isOpen, 'user.id=', user?.id, 'isProfileComplete=', isProfileComplete);
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
            <div className={`step ${step === 3 ? 'current' : skillsStepCompleted ? 'completed' : ''}`}>
              <div className="step-number">{skillsStepCompleted ? '✓' : '3'}</div>
              <span>Your skills</span>
            </div>
            <div className={`step ${step === 4 ? 'current' : ''}`}>
              <div className="step-number">4</div>
              <span>Your credentials</span>
            </div>
          </div>
        </div>
        <div className="skill-side">
          <div className="step-indicator">
            <span className="step-number">{step}</span>
            <span className="step-title">{step === 3 ? 'Your skills' : 'Your credentials'}</span>
          </div>
          {step === 3 && (
            <>
              <h1>Select your skills</h1>
              <p>Choose 1 primary skill and 1-14 additional skills. Select sub-skills where applicable.</p>

              <div className="skills-container primary-skills-container">
                <h3>Primary Skill</h3>
                <Select
                  showSearch
                  placeholder="Select primary skill"
                  onSearch={setSearchTermPrimary}
                  onSelect={handlePrimarySkillSelect}
                  className="custom-select"
                  style={{ width: '100%', marginBottom: '10px' }}
                  optionFilterProp="children"
                >
                  {filteredSkillsPrimary.map(skill => (
                    <Option key={skill.id} value={skill.id}>
                      {skill.name}
                    </Option>
                  ))}
                </Select>
                {primarySkill && (
                  <Dropdown menu={skillMenu(primarySkill)} trigger={['click']}>
                    <div
                      className="skill-item ant-dropdown-trigger"
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && handleSkillItemClick(primarySkill, 'edit')}
                    >
                      <span>{primarySkill.skill_name} {primarySkill.sub_skills?.length > 0 ? `(Sub-skills: ${primarySkill.sub_skills.join(', ')})` : ''}</span>
                      <IconChevronDown size={16} className="dropdown-arrow" />
                    </div>
                  </Dropdown>
                )}
                {!primarySkill && <p className="no-skill">No primary skill selected</p>}
              </div>

              <div className="skills-container additional-skills-container">
                <h3>Additional Skills</h3>
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Select additional skills"
                  onSearch={setSearchTermAdditional}
                  onChange={handleAdditionalSkillsSelect}
                  className="custom-select"
                  style={{ width: '100%', marginBottom: '10px' }}
                  optionFilterProp="children"
                  value={additionalSkills.map(skill => skill.id || skill.skill_id)}
                >
                  {filteredSkillsAdditional.map(skill => (
                    <Option key={skill.id} value={skill.id}>
                      {skill.name}
                    </Option>
                  ))}
                </Select>
                {additionalSkills.length > 0 ? (
                  <div className="additional-skills-list">
                    {additionalSkills.map(skill => (
                      <Dropdown key={skill.id || skill.skill_id} menu={skillMenu(skill)} trigger={['click']}>
                        <div
                          className="skill-item ant-dropdown-trigger"
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => e.key === 'Enter' && handleSkillItemClick(skill, 'edit')}
                        >
                          <span>{skill.skill_name} {skill.sub_skills?.length > 0 ? `(Sub-skills: ${skill.sub_skills.join(', ')})` : ''}</span>
                          <IconChevronDown size={16} className="dropdown-arrow" />
                        </div>
                      </Dropdown>
                    ))}
                  </div>
                ) : (
                  <p className="no-skill">No additional skills selected</p>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1>Add your credentials</h1>
              <p>Add any relevant credentials to support your skills (optional).</p>
              <div className="credentials-container">
                <div className="credential-section">
                  <Select
                    value={newCredential.credentials_name}
                    onChange={(value) => handleNewCredentialChange({ target: { value } }, "credentials_name")}
                    placeholder="Choose a credential"
                    style={{ width: '100%', marginBottom: '10px' }}
                    className="credential-dropdown"
                  >
                    {credentialOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                  {newCredential.credentials_name && (
                    <div className="credential-upload">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        onChange={(e) => handleNewCredentialChange(e, "credentials_photo")}
                        ref={credentialFileRef}
                      />
                      <button type="button" onClick={addCredential}>Add Credential</button>
                    </div>
                  )}
                  {credentials.length > 0 ? (
                    <div className="credential-list">
                      {credentials.map((cred, index) => (
                        <div key={index} className="credential-item">
                          {cred.credentials_name}: {cred.credentials_photo?.name || "No file selected"}
                          <button type="button" onClick={() => removeCredential(index)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No credentials added</p>
                  )}
                  {errors.new_credential_name && <span className="error">{errors.new_credential_name}</span>}
                  {errors.new_credential_photo && <span className="error">{errors.new_credential_photo}</span>}
                </div>
              </div>
            </>
          )}

          <div className="step-navigation">
            {step === 3 ? (
              <>
                <button className="back-btn" onClick={onClose}>Back</button>
                <button
                  className="next-btn"
                  onClick={handleNextStep}
                  disabled={!userSkills.primary || userSkills.additional.length === 0}
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button className="back-btn" onClick={handlePreviousStep}>Back</button>
                <button
                  className="finish-btn"
                  onClick={handleFinalFinish}
                  disabled={!profileId}
                >
                  Complete Profile
                </button>
              </>
            )}
          </div>

          {showSkillModal && selectedSkill && step === 3 && (
            <div className="skill-details-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{selectedSkill.name}</h3>
                  <IconX size={20} className="close-icon" onClick={handleModalClose} />
                </div>
                <div className="modal-body">
                  {selectedSkill.sub_skills?.length > 0 ? (
                    <div className="sub-skills-section">
                      <label className="sub-skills-label">Sub-Skills <span className="required">(Required)</span></label>
                      <p className="sub-skills-instruction">Add or remove sub-skills using the buttons below.</p>
                      <div className="sub-skills-container">
                        <div className="available-sub-skills">
                          <h4>Available Sub-Skills</h4>
                          {availableSubSkills.length > 0 ? (
                            <ul className="sub-skills-list">
                              {availableSubSkills.map(subSkill => (
                                <li key={subSkill} className="sub-skill-item">
                                  <span className="sub-skill-text">{subSkill}</span>
                                  <button
                                    className="add-sub-skill-btn"
                                    onClick={() => handleAddSubSkill(subSkill)}
                                    aria-label={`Add ${subSkill} to selected sub-skills`}
                                  >
                                    <IconPlus size={16} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-sub-skills">No available sub-skills</p>
                          )}
                        </div>
                        <div className="selected-sub-skills">
                          <h4>Selected Sub-Skills</h4>
                          {selectedSubSkills.length > 0 ? (
                            <ul className="sub-skills-list">
                              {selectedSubSkills.map(subSkill => (
                                <li key={subSkill} className="sub-skill-item">
                                  <span className="sub-skill-text">{subSkill}</span>
                                  <button
                                    className="remove-sub-skill-btn"
                                    onClick={() => handleRemoveSubSkill(subSkill)}
                                    aria-label={`Remove ${subSkill} from selected sub-skills`}
                                  >
                                    <IconMinus size={16} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-sub-skills">No sub-skills selected</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="no-sub-skills">This skill has no sub-skills to select. Click Save to continue.</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="save-btn" onClick={handleSaveSkill}>Save</button>
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