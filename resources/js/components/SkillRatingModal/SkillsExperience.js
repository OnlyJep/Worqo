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
  handlePreviousStep
}) => {
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
            <div className="modal-header">
              <h3>{selectedSkill.skill_name || selectedSkill.name}</h3>
              <button className="close-btn" onClick={handleModalClose}>
                <IconX size={20} />
              </button>
            </div>
            <div className="modal-body">
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
              <button className="btn btn-primary" onClick={handleSaveSkill}>Add Skill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsExperience;
