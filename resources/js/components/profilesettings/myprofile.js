import React, { useState, useEffect, useRef } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import '../../../sass/components/profilesettings/myprofile.scss';

const MyProfile = () => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'Jemima',
    middleName: '',
    lastName: 'Soliano',
    email: 'a@gmail.com',
    dateOfBirth: '2003-09-10',
    suffix: '',
    gender: 'Female'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const fileInputRef = useRef(null);

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

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // Handle profile update logic here
    console.log('Profile updated:', profileData);
    setIsEditingProfile(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Handle password update logic here
    console.log('Password updated');
    setIsEditingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log('Profile picture selected:', file);
    }
  };

  return (
    <div className="my-profile-container">
      {/* Profile Settings Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-container">
            <div className={`avatar-placeholder ${isEditingProfile ? 'clickable' : ''}`} onClick={isEditingProfile ? handleAvatarClick : undefined}>
              <img src="/images/myprofile.svg" alt="Profile" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
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
              <input
                type="text"
                id="suffix"
                name="suffix"
                value={profileData.suffix}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={isEditingProfile ? 'editing' : ''}
                placeholder="Suffix"
              />
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
              <Dropdown>
                <Dropdown.Toggle 
                  variant="outline-secondary" 
                  id="gender-dropdown"
                  disabled={!isEditingProfile}
                  className={`gender-dropdown-toggle ${isEditingProfile ? 'editing' : ''}`}
                >
                  {profileData.gender}
                </Dropdown.Toggle>

                <Dropdown.Menu className="gender-dropdown-menu">
                  <Dropdown.Item 
                    onClick={() => handleProfileChange({ target: { name: 'gender', value: 'Male' } })}
                    active={profileData.gender === 'Male'}
                  >
                    Male
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => handleProfileChange({ target: { name: 'gender', value: 'Female' } })}
                    active={profileData.gender === 'Female'}
                  >
                    Female
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => handleProfileChange({ target: { name: 'gender', value: 'Other' } })}
                    active={profileData.gender === 'Other'}
                  >
                    Other
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group date-field">
              <label htmlFor="dateOfBirth" className="label-up">Date of Birth</label>
              <div className="date-input-container">
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={profileData.dateOfBirth}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? 'editing' : ''}
                />
                <img src="/images/dateofbirth.svg" alt="Calendar" className="calendar-icon" />
              </div>
            </div>
            <div className="form-group">
              {/* Empty div for spacing */}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="edit-btn"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
            >
              <img src="/images/editprof.svg" alt="Edit" className="btn-icon" />
              {isEditingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
            {isEditingProfile && (
              <button type="submit" className="save-btn">
                Save Changes
              </button>
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
                type={showPasswords.currentPassword ? "text" : "password"}
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
                onClick={() => togglePasswordVisibility('currentPassword')}
              >
                <i className="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-container">
              <input
                type={showPasswords.newPassword ? "text" : "password"}
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
                onClick={() => togglePasswordVisibility('newPassword')}
              >
                <i className="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-container">
              <input
                type={showPasswords.confirmPassword ? "text" : "password"}
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
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                <i className="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="edit-btn"
              onClick={() => setIsEditingPassword(!isEditingPassword)}
            >
              <img src="/images/editprof.svg" alt="Edit" className="btn-icon" />
              {isEditingPassword ? 'Cancel' : 'Edit Password'}
            </button>
            {isEditingPassword && (
              <button type="submit" className="save-btn">
                Save Password
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyProfile;
