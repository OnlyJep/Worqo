import React, { useState, useEffect } from 'react';
import { IconX, IconChevronDown } from '@tabler/icons-react';
import { Select, Dropdown, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
const { Option } = Select;

// Define sub-types for primary skills (example mapping)
const skillSubTypes = {
  'Electrician': ['Wiring', 'Highway Electrician', 'Residential Electrician', 'Commercial Electrician'],
  'Web Developer': ['Front-End', 'Back-End', 'Full-Stack'],
  'Graphic Designer': ['UI/UX', 'Print Design', 'Motion Graphics'],
  'SEO': ['On-Page SEO', 'Off-Page SEO', 'Technical SEO'],
  'Virtual Assistant': ['Administrative', 'Technical', 'Creative'],
  'Wordpress Developer': ['Theme Development', 'Plugin Development', 'Maintenance'],
  'Social Media Marketer': ['Content Creation', 'Ad Management', 'Analytics'],
  'PHP Developer': ['Web Applications', 'API Development', 'E-commerce'],
  'Real Estate Virtual Assistant': ['Listing Management', 'Client Support', 'Marketing'],
  'Content Writer': ['Blog Writing', 'Copywriting', 'Technical Writing'],
  'Amazon Expert': ['Product Listing', 'PPC Advertising', 'Inventory Management'],
  'Sales Representative': ['B2B', 'B2C', 'Retail'],
  'Marketing Specialist': ['Digital Marketing', 'Email Marketing', 'Branding'],
  'Shopify Developer': ['Theme Customization', 'App Development', 'Store Setup'],
  'Video Editor': ['Short-Form', 'Long-Form', 'Animation'],
  'Data Entry': ['Data Processing', 'Transcription', 'Database Management'],
  'Project Manager': ['IT Projects', 'Construction', 'Marketing Campaigns'],
  'GoHighLevel': ['Automation', 'CRM Setup', 'Campaign Management'],
  'Facebook Ads Manager': ['Campaign Setup', 'Optimization', 'Reporting'],
  'Lead Generation': ['Cold Calling', 'Email Outreach', 'Social Media'],
  'Email Marketer': ['Campaign Design', 'Automation', 'Analytics'],
  'eBay Virtual Assistant': ['Listing Creation', 'Customer Service', 'Inventory'],
  'Customer Service': ['Tech Support', 'Sales Support', 'Billing'],
  'Google Ads Manager': ['Search Ads', 'Display Ads', 'Video Ads'],
  'Magento Developer': ['Theme Development', 'Module Development', 'E-commerce'],
  'Web Designer': ['UI Design', 'Responsive Design', 'Wireframing']
};

const SkillRatingModal = ({ isOpen, onClose, onComplete }) => {
  const [searchTermPrimary, setSearchTermPrimary] = useState('');
  const [searchTermAdditional, setSearchTermAdditional] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [pendingSkills, setPendingSkills] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [userSkills, setUserSkills] = useState(() => {
    const savedSkills = localStorage.getItem('userSkills');
    return savedSkills ? JSON.parse(savedSkills) : [];
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [filteredSkillsPrimary, setFilteredSkillsPrimary] = useState([]);
  const [filteredSkillsAdditional, setFilteredSkillsAdditional] = useState([]);
  const [primarySkill, setPrimarySkill] = useState(() => {
    const savedPrimary = localStorage.getItem('primarySkill');
    return savedPrimary ? JSON.parse(savedPrimary) : null;
  });
  const [additionalSkills, setAdditionalSkills] = useState(() => {
    const savedAdditional = localStorage.getItem('additionalSkills');
    return savedAdditional ? JSON.parse(savedAdditional) : [];
  });
  const [skillDetails, setSkillDetails] = useState({
    experienceLevel: '',
    description: '',
    subType: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (searchTermPrimary.trim() === '') {
      setFilteredSkillsPrimary(availableSkills);
    } else {
      const searchLower = searchTermPrimary.toLowerCase().trim();
      const filtered = availableSkills.filter(skill => {
        const skillName = skill.skill_name.toLowerCase();
        return (
          skillName.includes(searchLower) ||
          skillName.split(' ').some(word => word.startsWith(searchLower)) ||
          searchLower.split(' ').every(term => skillName.includes(term)) ||
          skillName.split(' & ').some(part => part.includes(searchLower)) ||
          skillName.split(' / ').some(part => part.includes(searchLower))
        );
      });
      setFilteredSkillsPrimary(filtered);
    }
  }, [searchTermPrimary, availableSkills]);

  useEffect(() => {
    let skillsToFilter = availableSkills;
    if (primarySkill) {
      skillsToFilter = availableSkills.filter(s => s.id !== primarySkill.id);
    }
    if (searchTermAdditional.trim() === '') {
      setFilteredSkillsAdditional(skillsToFilter);
    } else {
      const searchLower = searchTermAdditional.toLowerCase().trim();
      const filtered = skillsToFilter.filter(skill => {
        const skillName = skill.skill_name.toLowerCase();
        return (
          skillName.includes(searchLower) ||
          skillName.split(' ').some(word => word.startsWith(searchLower)) ||
          searchLower.split(' ').every(term => skillName.includes(term)) ||
          skillName.split(' & ').some(part => part.includes(searchLower)) ||
          skillName.split(' / ').some(part => part.includes(searchLower))
        );
      });
      setFilteredSkillsAdditional(filtered);
    }
  }, [searchTermAdditional, availableSkills, primarySkill]);

  useEffect(() => {
    localStorage.setItem('userSkills', JSON.stringify(userSkills));
    localStorage.setItem('primarySkill', JSON.stringify(primarySkill));
    localStorage.setItem('additionalSkills', JSON.stringify(additionalSkills));
  }, [userSkills, primarySkill, additionalSkills]);

  const fetchSkills = async () => {
    const comprehensiveSkills = [
      { id: 1, skill_name: 'Virtual Assistant' },
      { id: 2, skill_name: 'Wordpress Developer' },
      { id: 3, skill_name: 'SEO' },
      { id: 4, skill_name: 'Graphic Designer' },
      { id: 5, skill_name: 'Social Media Marketer' },
      { id: 6, skill_name: 'PHP Developer' },
      { id: 7, skill_name: 'Real Estate Virtual Assistant' },
      { id: 8, skill_name: 'Content Writer' },
      { id: 9, skill_name: 'Amazon Expert' },
      { id: 10, skill_name: 'Sales Representative' },
      { id: 11, skill_name: 'Marketing Specialist' },
      { id: 12, skill_name: 'Shopify Developer' },
      { id: 13, skill_name: 'Video Editor' },
      { id: 14, skill_name: 'Data Entry' },
      { id: 15, skill_name: 'Web Developer' },
      { id: 16, skill_name: 'Project Manager' },
      { id: 17, skill_name: 'GoHighLevel' },
      { id: 18, skill_name: 'Facebook Ads Manager' },
      { id: 19, skill_name: 'Lead Generation' },
      { id: 20, skill_name: 'Email Marketer' },
      { id: 21, skill_name: 'eBay Virtual Assistant' },
      { id: 22, skill_name: 'Customer Service' },
      { id: 23, skill_name: 'Google Ads Manager' },
      { id: 24, skill_name: 'Magento Developer' },
      { id: 25, skill_name: 'Web Designer' },
      { id: 26, skill_name: 'Electrician' }
    ];
    setAvailableSkills(comprehensiveSkills);
    setFilteredSkillsPrimary(comprehensiveSkills);
    setFilteredSkillsAdditional(comprehensiveSkills);
  };

  const handlePrimarySkillSelect = (value) => {
    if (primarySkill) {
      alert('Only one primary skill can be selected.');
      return;
    }
    if (userSkills.length >= 15) {
      alert('You can only add up to 15 skills. Please remove a skill first.');
      return;
    }
    const skill = availableSkills.find(s => s.id === parseInt(value));
    if (skill && !userSkills.some(userSkill => userSkill.id === skill.id)) {
      setSelectedSkill(skill);
      setSkillDetails({
        experienceLevel: '',
        description: '',
        subType: ''
      });
      setShowSkillModal(true);
    } else if (skill) {
      alert('This skill has already been added. Please select a different skill.');
    }
  };

  const handleAdditionalSkillsSelect = (values) => {
    if (userSkills.length + values.length > 15) {
      alert('You can only add up to 15 skills total. Please remove some skills first.');
      return;
    }
    const newSkills = values
      .map(id => availableSkills.find(s => s.id === parseInt(id)))
      .filter(skill => skill && !userSkills.some(userSkill => userSkill.id === skill.id));
    if (newSkills.length > 0) {
      setPendingSkills(newSkills);
      setSelectedSkill(newSkills[0]);
      setSkillDetails({
        experienceLevel: '',
        description: '',
        subType: ''
      });
      setShowSkillModal(true);
    } else {
      alert('All selected skills are already added or invalid.');
    }
  };

  const handleSkillItemClick = (skill, action) => {
    if (action === 'edit') {
      setSelectedSkill({ id: skill.id, skill_name: skill.name });
      setSkillDetails({
        experienceLevel: skill.experienceLevel,
        description: skill.description,
        subType: skill.subType || ''
      });
      setShowSkillModal(true);
    } else if (action === 'remove') {
      setUserSkills(prev => prev.filter(s => s.id !== skill.id));
      if (skill === primarySkill) {
        setPrimarySkill(null);
      }
      setAdditionalSkills(prev => prev.filter(s => s.id !== skill.id));
      setPendingSkills(prev => prev.filter(s => s.id !== selectedSkill?.id));
    }
  };

  const handleSaveSkill = () => {
    if (!selectedSkill) {
      alert('Please select a skill');
      return;
    }
    if (!skillDetails.experienceLevel) {
      alert('Please select an experience level for this skill');
      return;
    }
    if (skillSubTypes[selectedSkill.skill_name] && !skillDetails.subType) {
      alert('Please select a sub-type for this skill');
      return;
    }
    const newSkill = {
      id: selectedSkill.id,
      name: selectedSkill.skill_name,
      experienceLevel: skillDetails.experienceLevel,
      description: skillDetails.description,
      subType: skillDetails.subType
    };

    const skillExists = userSkills.some(userSkill => userSkill.id === newSkill.id);
    const isAdditional = pendingSkills.some(p => p.id === selectedSkill.id);

    if (skillExists) {
      setUserSkills(prev =>
        prev.map(userSkill =>
          userSkill.id === newSkill.id ? newSkill : userSkill
        )
      );
      const existingSkill = userSkills.find(s => s.id === newSkill.id);
      if (existingSkill === primarySkill) {
        setPrimarySkill(newSkill);
      } else {
        setAdditionalSkills(prev =>
          prev.map(addSkill =>
            addSkill.id === newSkill.id ? newSkill : addSkill
          )
        );
      }
    } else {
      if (userSkills.length >= 15) {
        alert('You can only add up to 15 skills. Please remove a skill first.');
        return;
      }
      setUserSkills(prev => [...prev, newSkill]);
      if (!primarySkill && !isAdditional) {
        setPrimarySkill(newSkill);
      } else {
        setAdditionalSkills(prev => [...prev, newSkill]);
      }
    }

    setPendingSkills(prev => {
      const nextSkills = prev.filter(skill => skill.id !== selectedSkill.id);
      if (nextSkills.length > 0) {
        setSelectedSkill(nextSkills[0]);
        setSkillDetails({
          experienceLevel: '',
          description: '',
          subType: ''
        });
        return nextSkills;
      } else {
        setShowSkillModal(false);
        setSelectedSkill(null);
        return [];
      }
    });
  };

  const handleModalClose = () => {
    setPendingSkills(prev => {
      const nextSkills = prev.filter(skill => skill.id !== selectedSkill?.id);
      if (nextSkills.length > 0) {
        setSelectedSkill(nextSkills[0]);
        setSkillDetails({
          experienceLevel: '',
          description: '',
          subType: ''
        });
        return nextSkills;
      } else {
        setShowSkillModal(false);
        setSelectedSkill(null);
        return [];
      }
    });
  };

  const handleFinalFinish = () => {
    if (!primarySkill || additionalSkills.length === 0) {
      alert('Please select 1 primary skill and at least 1 additional skill.');
      return;
    }
    alert('Excellent! Your profile has been completed successfully. You can now start finding jobs!');
    localStorage.setItem('isProfileComplete', 'true');
    onComplete();
    navigate('/homepage'); // Navigate to /homepage
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

  if (!isOpen) return null;

  return (
    <div className="skill-rating-overlay">
      <div className="skill-rating-container">
        <div className="progress-side">
          <div className="logo">Worqo</div>
          <h2>Let's Get You Started!</h2>
          <div className="progress-steps">
            <div className="step completed"><div className="step-number">✓</div><span>Register for an account</span></div>
            <div className="step completed"><div className="step-number">✓</div><span>Create profile</span></div>
            <div className="step current"><div className="step-number">2</div><span>Your skills</span></div>
          </div>
        </div>
        <div className="skill-side">
          <div className="step-indicator">
            <span className="step-number">2</span>
            <span className="step-title"> Your skills</span>
          </div>
          <h1>Select your skills</h1>
          <p>Choose 1 primary skill and 1-14 additional skills that represent your expertise. Add experience level, sub-type (if applicable), and description for each skill.</p>

          <div className="skills-container primary-skills-container">
            <h3>Primary Skill</h3>
            <Select
              showSearch
              placeholder="Select primary skill"
              onSearch={setSearchTermPrimary}
              onSelect={handlePrimarySkillSelect}
              className="custom-select ant-select ant-select-outlined custom-select css-dev-only-do-not-override-l9pxc0 ant-select-single ant-select-show-arrow ant-select-show-search"
              dropdownClassName="custom-select-dropdown"
              style={{ width: '100%', marginBottom: '10px' }}
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {filteredSkillsPrimary.map(skill => (
                <Option key={skill.id} value={skill.id}>
                  {skill.skill_name}
                </Option>
              ))}
            </Select>
            {primarySkill && (
              <Dropdown overlay={skillMenu(primarySkill)} trigger={['click']}>
                <div
                  className="skill-item ant-dropdown-trigger"
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && handleSkillItemClick(primarySkill, 'edit')}
                >
                  <span>{primarySkill.name} {primarySkill.subType ? `(Sub-type: ${primarySkill.subType})` : ''} (Level: {primarySkill.experienceLevel})</span>
                  <IconChevronDown size={16} className="dropdown-arrow" />
                </div>
              </Dropdown>
            )}
            {!primarySkill && <p className="no-skill">No primary skill selected</p>}
          </div>

          <div className="skills-container additional-skills-container">
            <h3>Additional Skills</h3>
            <div className="select-container">
              <Select
                mode="multiple"
                showSearch
                placeholder="Select additional skills"
                onSearch={setSearchTermAdditional}
                onChange={handleAdditionalSkillsSelect}
                className="custom-select ant-select ant-select-outlined custom-select css-dev-only-do-not-override-l9pxc0 ant-select-multiple ant-select-show-arrow ant-select-show-search"
                dropdownClassName="custom-select-dropdown"
                style={{ width: '100%', marginBottom: '10px' }}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                value={additionalSkills.map(skill => skill.id)}
              >
                {filteredSkillsAdditional.map(skill => (
                  <Option key={skill.id} value={skill.id}>
                    {skill.skill_name}
                  </Option>
                ))}
              </Select>
            </div>
            {additionalSkills.length > 0 ? (
              <div className="additional-skills-list">
                {additionalSkills.map(skill => (
                  <Dropdown key={skill.id} overlay={skillMenu(skill)} trigger={['click']}>
                    <div
                      className="skill-item ant-dropdown-trigger"
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && handleSkillItemClick(skill, 'edit')}
                    >
                      <span>{skill.name} {skill.subType ? `(Sub-type: ${skill.subType})` : ''} (Level: {skill.experienceLevel})</span>
                      <IconChevronDown size={16} className="dropdown-arrow" />
                    </div>
                  </Dropdown>
                ))}
              </div>
            ) : (
              <p className="no-skill">No additional skills selected</p>
            )}
          </div>

          <div className="step-navigation">
            <button className="back-btn" onClick={onClose}>Back</button>
            <button
              className="finish-btn"
              onClick={handleFinalFinish}
              disabled={!primarySkill || additionalSkills.length === 0}
            >
              Complete Profile
            </button>
          </div>

          {showSkillModal && selectedSkill && (
            <div className="skill-details-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{selectedSkill.skill_name}</h3>
                  <IconX size={20} className="close-icon" onClick={handleModalClose} />
                </div>
                <div className="modal-body">
                  <div>
                    <label>EXPERIENCE LEVEL FOR THIS SKILL* (Required)</label>
                    <select
                      value={skillDetails.experienceLevel}
                      onChange={(e) => setSkillDetails(prev => ({ ...prev, experienceLevel: e.target.value }))}
                      className="experience-select"
                    >
                      <option value="">Select experience level</option>
                      <option value="beginner">Beginner (0-1 years)</option>
                      <option value="intermediate">Intermediate (1-3 years)</option>
                      <option value="advanced">Advanced (3-5 years)</option>
                      <option value="expert">Expert (5+ years)</option>
                    </select>
                  </div>
                  {selectedSkill && skillSubTypes[selectedSkill.skill_name] && (
                    <div>
                      <label>SUB-TYPE FOR THIS SKILL* (Required)</label>
                      <select
                        value={skillDetails.subType}
                        onChange={(e) => setSkillDetails(prev => ({ ...prev, subType: e.target.value }))}
                        className="experience-select"
                      >
                        <option value="">Select sub-type</option>
                        {skillSubTypes[selectedSkill.skill_name].map(subType => (
                          <option key={subType} value={subType}>
                            {subType}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label>DESCRIBE YOUR EXPERIENCE (Optional)</label>
                    <textarea
                      value={skillDetails.description}
                      onChange={(e) => setSkillDetails(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Write a short description of your experience in this skill."
                      className="description-textarea"
                      rows={4}
                    />
                  </div>
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