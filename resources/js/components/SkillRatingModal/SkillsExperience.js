import React, { useState, useEffect, useRef } from 'react';
import { IconX, IconChevronDown, IconPlus, IconMinus } from '@tabler/icons-react';
import { message } from 'antd';
import '../../../sass/components/_skillsexperience.scss';

const SkillsExperience = ({
  userSkills,
  setUserSkills,
  availableSkills,
  setAvailableSkills,
  filteredSkillsPrimary,
  setFilteredSkillsPrimary,
  filteredSkillsAdditional,
  setFilteredSkillsAdditional,
  searchTermPrimary,
  setSearchTermPrimary,
  searchTermAdditional,
  setSearchTermAdditional,
  primarySkill,
  setPrimarySkill,
  additionalSkills,
  setAdditionalSkills,
  selectedSubSkills,
  setSelectedSubSkills,
  availableSubSkills,
  setAvailableSubSkills,
  selectedSkill,
  setSelectedSkill,
  showSkillModal,
  setShowSkillModal,
  pendingSkills,
  setPendingSkills,
  profileId,
  user,
  handlePrimarySkillSelect,
  handleAdditionalSkillsSelect,
  handleAdditionalSkillToggle,
  handleSkillItemClick,
  handleAddSubSkill,
  handleRemoveSubSkill,
  handleSaveSkill,
  handleRemoveSkill,
  handleModalClose,
  isWorkTypeDropdownOpen,
  setIsWorkTypeDropdownOpen,
  isAdditionalSkillsDropdownOpen,
  setIsAdditionalSkillsDropdownOpen,
  workTypeDropdownRef,
  additionalSkillsDropdownRef,
  fetchSkills,
  handleNextStep,
  handlePreviousStep,
  userProfile, // Add userProfile prop
  setUserProfile // Add setUserProfile prop
}) => {
  // Check if address is complete
  const isAddressComplete = userProfile?.profile?.street && userProfile?.profile?.contact_number;
  
  // Check if skills form is completed (has at least one primary skill)
  const isSkillsFormCompleted = userSkills?.primary_skills && userSkills.primary_skills.length > 0;
  
  // State to track if we've already sent the review request
  const [reviewStatusRequested, setReviewStatusRequested] = useState(false);
  
  // State for available sub-skills dropdown
  const [isAvailableSubSkillsDropdownOpen, setIsAvailableSubSkillsDropdownOpen] = useState(false);
  const availableSubSkillsDropdownRef = useRef(null);
  
  // Effect to handle clicking outside the available sub-skills dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (availableSubSkillsDropdownRef.current && 
          !availableSubSkillsDropdownRef.current.contains(event.target) &&
          !event.target.closest('.available-sub-skills-dropdown-menu')) {
        console.log('Clicking outside dropdown, closing...');
        setIsAvailableSubSkillsDropdownOpen(false);
      }
    };

    if (isAvailableSubSkillsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAvailableSubSkillsDropdownOpen]);
  
  // Effect to update review status when skills form is completed
  useEffect(() => {
    const updateReviewStatus = async () => {
      // Only proceed if:
      // 1. User is a worker (role_id === 1)
      // 2. Skills form is completed (has primary skills)
      // 3. Address is complete
      // 4. We haven't already sent the request
      // 5. User has a worker profile
      // 6. Worker profile is not already in review status
      if (
        userProfile?.role_id === 1 && 
        isSkillsFormCompleted && 
        isAddressComplete && 
        !reviewStatusRequested && 
        userProfile?.worker?.id &&
        (!userProfile?.worker?.is_reviewed || userProfile?.worker?.is_reviewed === '0' || userProfile?.worker?.is_reviewed === '')
      ) {
        try {
          const token = localStorage.getItem('auth_token');
          const userId = userProfile?.id;
          
          // Check current review status
          const currentReviewStatus = userProfile?.worker?.is_reviewed;
          
          // Only update if not already "TO BE REVIEWED", "ACCEPTED", or "DECLINED"
          if (!currentReviewStatus || (currentReviewStatus !== 'TO BE REVIEWED' && currentReviewStatus !== 'ACCEPTED' && currentReviewStatus !== 'DECLINED')) {
            const response = await fetch(`http://127.0.0.1:8000/api/workers/${userId}/review`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-User-Id': userId
              },
              body: JSON.stringify({
                is_reviewed: 'TO BE REVIEWED'
              })
            });
            
            if (response.ok) {
              // Update local state to reflect the change
              const updatedProfile = {
                ...userProfile,
                worker: {
                  ...userProfile.worker,
                  is_reviewed: 'TO BE REVIEWED'
                }
              };
              setUserProfile(updatedProfile);
              setReviewStatusRequested(true);
              console.log('Worker profile set to TO BE REVIEWED');
            } else {
              const errorData = await response.json();
              console.error('Failed to update worker review status:', errorData);
              message.error('Failed to submit profile for review. Please try again.');
            }
          } else {
            // Mark as requested if already in the correct state
            setReviewStatusRequested(true);
          }
        } catch (error) {
          console.error('Error updating worker review status:', error);
          message.error('Network error. Please check your connection and try again.');
        }
      }
    };
    
    updateReviewStatus();
  }, [isSkillsFormCompleted, isAddressComplete, userProfile, reviewStatusRequested, setUserProfile]);
  
  return (
    <div className="skills-experience-container">
      <div className="step-header">
        <h1>Skills & Experience</h1>
        <p className="step-description">Add your skills to showcase your expertise to potential employers.</p>
      </div>

      <div className="form-section">
        <div className="skills-section">
          <div className="skill-group">
            <label className="form-label">Primary Skill <span className="required">*</span></label>
            <div className={`custom-dropdown ${isWorkTypeDropdownOpen ? 'dropdown-open' : ''}`} ref={workTypeDropdownRef}>
              <div
                className="dropdown-trigger"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Primary skills dropdown clicked, current state:', isWorkTypeDropdownOpen);
                 
                  try {
                    // Always fetch skills to ensure fresh data
                    console.log('Fetching skills from database...');
                    await fetchSkills();
                   
                    // Toggle dropdown after skills are fetched
                    setIsWorkTypeDropdownOpen(!isWorkTypeDropdownOpen);
                  } catch (error) {
                    console.error('Error fetching skills:', error);
                    message.error('Failed to load skills. Please try again.');
                    // Still toggle dropdown even if fetch fails
                    setIsWorkTypeDropdownOpen(!isWorkTypeDropdownOpen);
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Primary skills dropdown activated via keyboard');
                   
                    try {
                      // Always fetch skills to ensure fresh data
                      console.log('Fetching skills from database...');
                      await fetchSkills();
                     
                      // Toggle dropdown after skills are fetched
                      setIsWorkTypeDropdownOpen(!isWorkTypeDropdownOpen);
                    } catch (error) {
                      console.error('Error fetching skills:', error);
                      message.error('Failed to load skills. Please try again.');
                      // Still toggle dropdown even if fetch fails
                      setIsWorkTypeDropdownOpen(!isWorkTypeDropdownOpen);
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsWorkTypeDropdownOpen(false);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={isWorkTypeDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className="dropdown-value">
                  Select Primary Skills
                </span>
                <span className={`dropdown-arrow ${isWorkTypeDropdownOpen ? 'open' : ''}`}>
                  <IconChevronDown
                    size={16}
                    className="chevron-icon"
                    style={{
                      transform: isWorkTypeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </span>
              </div>
              {isWorkTypeDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-items">
                    {filteredSkillsPrimary && filteredSkillsPrimary.length > 0 ? (
                      (() => {
                        console.log('Displaying primary skills:', filteredSkillsPrimary.length, 'skills');
                        console.log('Primary skills data:', filteredSkillsPrimary);
                        return filteredSkillsPrimary.map(skill => {
                        const isSelected = userSkills.primary_skills?.some(primarySkill => parseInt(primarySkill.skill_id) === skill.id);
                        const isAdditional = userSkills.additional_skills?.some(additionalSkill => parseInt(additionalSkill.skill_id) === skill.id);
                       
                        return (
                          <div
                            key={skill.id}
                            className={`dropdown-item ${isSelected ? 'selected' : ''} ${isAdditional ? 'disabled' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isAdditional) {
                                console.log('Primary skill selected:', skill.name || skill.skill_name);
                                handlePrimarySkillSelect(skill.id);
                                setIsWorkTypeDropdownOpen(false);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!isAdditional) {
                                  console.log('Primary skill selected via keyboard:', skill.name || skill.skill_name);
                                  handlePrimarySkillSelect(skill.id);
                                  setIsWorkTypeDropdownOpen(false);
                                }
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsWorkTypeDropdownOpen(false);
                              }
                            }}
                            tabIndex={0}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className="item-text">{skill.name || skill.skill_name || 'Unknown Skill'}</span>
                            {isSelected && <span className="checkmark">✓</span>}
                            {isAdditional && <span className="additional-indicator">Additional</span>}
                          </div>
                        );
                        });
                      })()
                    ) : (
                      <div className="dropdown-item disabled">
                        <span className="item-text">No skills available</span>
                        <span className="loading-indicator">Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
           
            {(userSkills.primary_skills?.length || 0) > 0 && (
              <div className="selected-skills">
                {(userSkills.primary_skills || []).map(skill => (
                  <div key={skill.skill_id} className="skill-card primary-skill" onClick={() => handleSkillItemClick(skill, 'edit')}>
                      <div className="skill-header">
                        <span className="skill-name">{skill.skill_name}</span>
                      <button
                        className="remove-skill-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSkill(skill.skill_id, true);
                        }}
                        title="Remove skill"
                      >
                        <IconX size={16} />
                      </button>
                      </div>
                      <div className="skill-info">
                        {skill.experience && (
                          <div className="skill-experience">
                            <span className="experience-label">Experience:</span>
                            <span className="experience-value">{skill.experience}</span>
                          </div>
                        )}
                        {skill.sub_skills?.length > 0 && (
                          <div className="skill-sub-skills">
                            <span className="sub-skills-label">Sub-skills:</span>
                            <span className="sub-skills-list">{skill.sub_skills.join(', ')}</span>
                          </div>
                        )}
                      </div>
                          </div>
                ))}
              </div>
            )}
          </div>


          <div className="skill-group">
            <label className="form-label">Additional Skills</label>
            <div className={`custom-dropdown ${isAdditionalSkillsDropdownOpen ? 'dropdown-open' : ''}`} ref={additionalSkillsDropdownRef}>
              <div
                className="dropdown-trigger"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Additional skills dropdown clicked, current state:', isAdditionalSkillsDropdownOpen);
                 
                  try {
                    // Always fetch skills to ensure fresh data
                    console.log('Fetching skills from database...');
                    await fetchSkills();
                   
                    // Toggle dropdown after skills are fetched
                    setIsAdditionalSkillsDropdownOpen(!isAdditionalSkillsDropdownOpen);
                  } catch (error) {
                    console.error('Error fetching skills:', error);
                    message.error('Failed to load skills. Please try again.');
                    // Still toggle dropdown even if fetch fails
                    setIsAdditionalSkillsDropdownOpen(!isAdditionalSkillsDropdownOpen);
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Additional skills dropdown activated via keyboard');
                   
                    try {
                      // Always fetch skills to ensure fresh data
                      console.log('Fetching skills from database...');
                      await fetchSkills();
                     
                      // Toggle dropdown after skills are fetched
                      setIsAdditionalSkillsDropdownOpen(!isAdditionalSkillsDropdownOpen);
                    } catch (error) {
                      console.error('Error fetching skills:', error);
                      message.error('Failed to load skills. Please try again.');
                      // Still toggle dropdown even if fetch fails
                      setIsAdditionalSkillsDropdownOpen(!isAdditionalSkillsDropdownOpen);
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsAdditionalSkillsDropdownOpen(false);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={isAdditionalSkillsDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className="dropdown-value">
                  Select Additional Skills
                </span>
                <span className={`dropdown-arrow ${isAdditionalSkillsDropdownOpen ? 'open' : ''}`}>
                  <IconChevronDown
                    size={16}
                    className="chevron-icon"
                    style={{
                      transform: isAdditionalSkillsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </span>
              </div>
              {isAdditionalSkillsDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-items">
                    {filteredSkillsAdditional && filteredSkillsAdditional.length > 0 ? (
                      (() => {
                        console.log('Displaying additional skills:', filteredSkillsAdditional.length, 'skills');
                        console.log('Additional skills data:', filteredSkillsAdditional);
                        return filteredSkillsAdditional.map(skill => {
                        const isSelected = userSkills.additional_skills?.some(userSkill => parseInt(userSkill.skill_id) === skill.id);
                        const isPrimary = userSkills.primary_skills?.some(primarySkill => parseInt(primarySkill.skill_id) === skill.id);
                       
                        return (
                          <div
                            key={skill.id}
                            className={`dropdown-item ${isSelected ? 'selected' : ''} ${isPrimary ? 'disabled' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isPrimary) {
                                handleAdditionalSkillToggle(skill);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!isPrimary) {
                                  handleAdditionalSkillToggle(skill);
                                }
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsAdditionalSkillsDropdownOpen(false);
                              }
                            }}
                            tabIndex={0}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className="item-text">{skill.name || skill.skill_name || 'Unknown Skill'}</span>
                            {isSelected && <span className="checkmark">✓</span>}
                            {isPrimary && <span className="primary-indicator">Primary</span>}
                          </div>
                        );
                        });
                      })()
                    ) : (
                      <div className="dropdown-item disabled">
                        <span className="item-text">No skills available</span>
                        <span className="loading-indicator">Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
           
            {userSkills.additional_skills.length > 0 && (
              <div className="selected-skills">
                {userSkills.additional_skills.map(skill => (
                  <div key={skill.skill_id} className="skill-card additional-skill" onClick={() => handleSkillItemClick(skill, 'edit')}>
                      <div className="skill-header">
                        <span className="skill-name">{skill.skill_name}</span>
                      <button
                        className="remove-skill-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSkill(skill.skill_id, false);
                        }}
                        title="Remove skill"
                      >
                        <IconX size={16} />
                      </button>
                      </div>
                      <div className="skill-info">
                        {skill.experience && (
                          <div className="skill-experience">
                            <span className="experience-label">Experience:</span>
                            <span className="experience-value">{skill.experience}</span>
                          </div>
                        )}
                        {skill.sub_skills?.length > 0 && (
                          <div className="skill-sub-skills">
                            <span className="sub-skills-label">Sub-skills:</span>
                            <span className="sub-skills-list">{skill.sub_skills.join(', ')}</span>
                          </div>
                        )}
                      </div>
                          </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {showSkillModal && selectedSkill && (
        <div className="skill-details-modal">
          <div className="modal-overlay" onClick={() => setShowSkillModal(false)}></div>
          <div className="modal-content">
            <div className="modal-body">
              <div className="modal-header-inline">
                <h3>{selectedSkill.skill_name || selectedSkill.name}</h3>
                <button className="close-btn" onClick={handleModalClose}>
                  <IconX size={20} />
                </button>
              </div>

              <div className="experience-section">
                <label className="form-label">Experience Level <span className="required">*</span></label>
                <p className="section-description">Select your experience level with this skill.</p>
                <select
                  className="experience-select"
                  value={selectedSkill.experience || '0-11-months'}
                  onChange={(e) => {
                    setSelectedSkill(prev => ({
                      ...prev,
                      experience: e.target.value
                    }));
                  }}
                >
                  <option value="no-experience">No Experience</option>
                  <option value="0-11-months">0 to 11 months</option>
                  <option value="1-2-years">1 to 2 years</option>
                  <option value="2-5-years">2 to 5 years</option>
                  <option value="5-10-years">5 to 10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div className="sub-skills-section">
                <label className="form-label">Select Sub-Skills</label>
                <p className="section-description">Choose the specific sub-skills that apply to your expertise.</p>
                <div className="sub-skills-container">
                  <div className="available-sub-skills-dropdown-menu">
                    <div className={`custom-dropdown ${isAvailableSubSkillsDropdownOpen ? 'dropdown-open' : ''}`} ref={availableSubSkillsDropdownRef}>
                      <div 
                        className="dropdown-trigger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Available sub-skills dropdown clicked, current state:', isAvailableSubSkillsDropdownOpen);
                          console.log('Available sub-skills:', availableSubSkills);
                          console.log('Available sub-skills length:', availableSubSkills.length);
                          setIsAvailableSubSkillsDropdownOpen(!isAvailableSubSkillsDropdownOpen);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Available sub-skills dropdown activated via keyboard');
                            setIsAvailableSubSkillsDropdownOpen(!isAvailableSubSkillsDropdownOpen);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsAvailableSubSkillsDropdownOpen(false);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={isAvailableSubSkillsDropdownOpen}
                        aria-haspopup="listbox"
                      >
                        <span className="dropdown-value">
                          Select Available Sub-Skills
                        </span>
                        <span className={`dropdown-arrow ${isAvailableSubSkillsDropdownOpen ? 'open' : ''}`}>
                          <IconChevronDown
                            size={16}
                            className="chevron-icon"
                            style={{
                              transform: isAvailableSubSkillsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s ease'
                            }}
                          />
                        </span>
                      </div>
                      {isAvailableSubSkillsDropdownOpen && (
                        <div className="dropdown-menu" style={{ display: 'block', position: 'absolute', zIndex: 1000 }}>
                        <div className="dropdown-items">
                          {availableSubSkills.length > 0 ? (
                            availableSubSkills.map(subSkill => (
                              <div 
                                key={subSkill} 
                                className="dropdown-item"
                                onClick={() => {
                                  handleAddSubSkill(subSkill);
                                  setIsAvailableSubSkillsDropdownOpen(false);
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <span className="item-text">{subSkill}</span>
                              </div>
                            ))
                          ) : (
                            <div className="dropdown-item disabled">
                              <span className="item-text">No available sub-skills</span>
                            </div>
                          )}
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="selected-sub-skills-section">
                    <h4 className="section-title">Selected Sub-Skills</h4>
                    {selectedSubSkills.length > 0 ? (
                      <div className="selected-sub-skills-list">
                        {selectedSubSkills.map(subSkill => (
                          <div key={subSkill} className="selected-sub-skill-item">
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

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowSkillModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveSkill}>Add Skill</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsExperience;