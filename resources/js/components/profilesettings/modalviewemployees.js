import React, { useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import Dropdown from 'react-bootstrap/Dropdown';
import '../../../sass/components/profilesettings/modalviewemployees.scss';

const ModalViewEmployees = ({ onClose, jobTitle = "Job Position" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollar, setSelectedCollar] = useState('All Collars');
  const [employees] = useState([
    {
      id: 1,
      name: 'Jeff Ogabang',
      role: 'Master Plumber',
      salary: '₱ 2000',
      employmentType: 'One-Time Task',
      profilePic: '/images/electrician.svg', // You'll need to add this image
      collarType: 'Blue Collar',
      isVerified: true,
      hasTools: true
    },
    {
      id: 2,
      name: 'Josephus Dumanglas',
      role: 'Air Conditioning',
      salary: '₱ 12,000.00/month',
      employmentType: 'Part - Time Job',
      profilePic: '/images/electrician.svg',
      collarType: 'White Collar',
      isVerified: true,
      hasTools: false
    },
    {
      id: 3,
      name: 'Ruella Malabo',
      role: 'Caregiver',
      salary: '₱ 30,000.00/month',
      employmentType: 'Full - Time Job',
      profilePic: '/images/electrician.svg',
      collarType: 'Pink Collar',
      isVerified: true,
      hasTools: false
    }
  ]);

  const collarOptions = ['All Collars', 'Blue Collar', 'White Collar', 'Pink Collar'];

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCollarChange = (collar) => {
    setSelectedCollar(collar);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollar = selectedCollar === 'All Collars' || employee.collarType === selectedCollar;
    return matchesSearch && matchesCollar;
  });

  const getCollarIcon = (collarType) => {
    switch (collarType) {
      case 'Blue Collar':
        return '/images/bluecollar.svg';
      case 'White Collar':
        return '/images/whitecollar.svg';
      case 'Pink Collar':
        return '/images/pink.svg';
      default:
        return null;
    }
  };

  const getStatusIcon = (employee) => {
    if (employee.isVerified) {
      return <MdVerified className="verified-icon" />;
    } else if (employee.hasTools) {
      return <img src="/images/tools.svg" alt="Tools" className="status-icon" />;
    } else {
      return <img src="/images/envelope.svg" alt="Envelope" className="status-icon" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-view-employees">
        <div className="modal-header">
          <h2 className="modal-title">View Employees Lists</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="filter-section">
          <div className="collar-filter">
            <Dropdown>
              <Dropdown.Toggle 
                variant="outline-secondary" 
                id="collar-dropdown"
                className="collar-dropdown-toggle"
              >
                {selectedCollar}
              </Dropdown.Toggle>

              <Dropdown.Menu className="collar-dropdown-menu">
                {collarOptions.map((option, index) => (
                  <Dropdown.Item 
                    key={index}
                    onClick={() => handleCollarChange(option)}
                    active={selectedCollar === option}
                  >
                    {option}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
          
          <div className="search-section">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button className="search-btn">
              <FaSearch />
            </button>
          </div>
        </div>

        <div className="employees-list">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="employee-card">
              <div className="employee-avatar">
                <img 
                  src={employee.profilePic} 
                  alt={employee.name}
                  className="avatar-img"
                />
              </div>
              
              <div className="employee-details">
                <div className="employee-name-section">
                  <h3 className="employee-name">{employee.name}</h3>
                  <div className="status-icons">
                    <img 
                      src={getCollarIcon(employee.collarType)} 
                      alt={employee.collarType}
                      className="collar-icon"
                    />
                     {getStatusIcon(employee)}
                  </div>
                </div>
                
                <p className="employee-role">{employee.role}</p>
                <p className="employee-salary">{employee.salary}</p>
                <p className="employee-employment-type">{employee.employmentType}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="back-btn" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalViewEmployees;
