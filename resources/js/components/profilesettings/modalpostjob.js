import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import '../../../sass/components/profilesettings/modalpostjob.scss';

const ModalPostJob = ({ onClose, onSubmit, editingJob = null }) => {
  const [formData, setFormData] = useState({
    jobTitle: editingJob?.title || '',
    jobDescription: editingJob?.description || '',
    salary: editingJob?.salary || '',
    email: editingJob?.email || '',
    skillsRequirement: editingJob?.skillsRequirement || '',
    typeOfEmployment: editingJob?.typeOfEmployment || '',
    desiredHours: editingJob?.desiredHours || '',
    contactPerson: editingJob?.contactPerson || ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.jobTitle.trim() || !formData.jobDescription.trim()) {
      alert('Please fill in all required fields (Job Title, Job Description)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('An error occurred while posting the job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-post-job">
        <div className="modal-header">
          <h2 className="modal-title">Post Job Information</h2>
          <button className="close-btn" onClick={handleClose}>
            <span>&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-columns">
            <div className="form-column">
              {/* Job Title and Type of Employment Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="jobTitle">Job Title</label>
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="Enter job title"
                    className="small-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="typeOfEmployment">Type of Employment</label>
                  <Dropdown>
                    <Dropdown.Toggle 
                      variant="outline-secondary" 
                      id="typeOfEmployment-dropdown"
                      className="typeOfEmployment-dropdown-toggle"
                    >
                      {formData.typeOfEmployment || 'Select type of employments'}
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="typeOfEmployment-dropdown-menu">
                      <Dropdown.Item 
                        onClick={() => handleInputChange({ target: { name: 'typeOfEmployment', value: 'Full-time' } })}
                        active={formData.typeOfEmployment === 'Full-time'}
                      >
                        Full-time
                      </Dropdown.Item>
                      <Dropdown.Item 
                        onClick={() => handleInputChange({ target: { name: 'typeOfEmployment', value: 'Part-time' } })}
                        active={formData.typeOfEmployment === 'Part-time'}
                      >
                        Part-time
                      </Dropdown.Item>
                      <Dropdown.Item 
                        onClick={() => handleInputChange({ target: { name: 'typeOfEmployment', value: 'Others' } })}
                        active={formData.typeOfEmployment === 'Others'}
                      >
                        Others
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="jobDescription">Job Description</label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Describe the job to be done"
                  rows="4"
                  required
                />
              </div>

              {/* Salary and Desired Hours Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="salary">Salary</label>
                  <input
                    type="text"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="Enter salary"
                    className="small-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="desiredHours">Desired NO. of Hours per Week</label>
                  <input
                    type="number"
                    id="desiredHours"
                    name="desiredHours"
                    value={formData.desiredHours}
                    onChange={handleInputChange}
                    placeholder="Enter hours per week"
                    min="1"
                    max="168"
                    className="small-input"
                  />
                </div>
              </div>

              {/* Email and Contact Person Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    className="small-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactPerson">Contact Person</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Enter contact person name"
                    className="small-input"
                  />
                </div>
              </div>


              <div className="form-group">
                <label htmlFor="skillsRequirement">Skills Requirement</label>
                <input
                  type="text"
                  id="skillsRequirement"
                  name="skillsRequirement"
                  value={formData.skillsRequirement}
                  onChange={handleInputChange}
                  placeholder="Enter required skills"
                  className="full-width-input"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="post-job-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalPostJob;
