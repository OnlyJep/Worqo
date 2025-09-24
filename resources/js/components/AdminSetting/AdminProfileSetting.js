import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaPencilAlt, FaCalendarAlt } from "react-icons/fa";
import Admintopnavbar from "../adminside/admintopnavbar/admintopnavbar";
import Adminsidebar from "../adminside/adminsidebar/adminsidebar";

const AdminProfileSetting = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  
  // Profile form states
  const [profileData, setProfileData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    email: "",
    gender: "",
    dateOfBirth: ""
  });

  // Password form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Password visibility states
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Load user data on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setProfileData({
        firstName: userData.first_name || "",
        middleName: userData.middle_name || "",
        lastName: userData.last_name || "",
        suffix: userData.suffix || "",
        email: userData.email || "",
        gender: userData.gender || "",
        dateOfBirth: userData.date_of_birth || ""
      });
    }
  }, []);

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
    // Reset profile data to original values
    if (user) {
      setProfileData({
        firstName: user.first_name || "",
        middleName: user.middle_name || "",
        lastName: user.last_name || "",
        suffix: user.suffix || "",
        email: user.email || "",
        gender: user.gender || "",
        dateOfBirth: user.date_of_birth || ""
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()) {
      alert("Please fill in all required fields (First Name, Last Name, Email)");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        alert("You must be logged in to update your profile");
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        try {
          const updatedUser = await response.json();
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setIsEditingProfile(false);
          alert("Profile updated successfully!");
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          alert("Profile updated but there was an issue with the response format.");
          setIsEditingProfile(false);
        }
      } else {
        try {
          const errorData = await response.json();
          alert(`Failed to update profile: ${errorData.message || 'Please try again.'}`);
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
          alert(`Failed to update profile: Server returned ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Profile update error:", error);
      alert("An error occurred while updating your profile. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!passwordData.currentPassword.trim() || !passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()) {
      alert("Please fill in all password fields");
      return;
    }

    // Validate password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    // Check if new password is different from current
    if (passwordData.currentPassword === passwordData.newPassword) {
      alert("New password must be different from current password");
      return;
    }

    // For now, show a message that password change is not implemented
    alert("Password change functionality is not yet implemented in the backend. Please contact the administrator.");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setIsEditingPassword(false);
  };

  return (
    <Adminsidebar>
      <div className="admin-profile-setting">
        <Admintopnavbar />
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
        
        <div className="my-profile-container">
        {/* Profile Details Section */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar-container">
              <div className="avatar-placeholder">
                <img 
                  src={user?.profile_img || "/images/pfp.svg"} 
                  alt="Profile" 
                />
              </div>
            </div>
          </div>
          
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  placeholder="Enter first name"
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "editing" : ""}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="middleName">Middle Name</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={profileData.middleName}
                  onChange={handleProfileChange}
                  placeholder="Enter middle name"
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "editing" : ""}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  placeholder="Enter last name"
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "editing" : ""}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="suffix">Suffix</label>
                <input
                  type="text"
                  id="suffix"
                  name="suffix"
                  value={profileData.suffix}
                  onChange={handleProfileChange}
                  placeholder="Jr., Sr., etc."
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "editing" : ""}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  placeholder="Enter email address"
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "editing" : ""}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "editing" : ""}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group date-field">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <div className="date-input-container">
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={profileData.dateOfBirth}
                    onChange={handleProfileChange}
                    disabled={!isEditingProfile}
                    className={isEditingProfile ? "editing" : ""}
                  />
                  <FaCalendarAlt className="calendar-icon" />
                </div>
              </div>
            </div>

            <div className="form-actions">
              {!isEditingProfile ? (
                <button type="button" className="edit-btn" onClick={handleEditProfile}>
                  <FaPencilAlt className="btn-icon" />
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
                    <FaPencilAlt className="btn-icon" />
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Change Password Section */}
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
                  placeholder="Enter current password"
                  disabled={!isEditingPassword}
                  className={isEditingPassword ? "editing" : ""}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
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
                  placeholder="Enter new password"
                  disabled={!isEditingPassword}
                  className={isEditingPassword ? "editing" : ""}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
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
                  placeholder="Confirm new password"
                  disabled={!isEditingPassword}
                  className={isEditingPassword ? "editing" : ""}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-actions">
              {!isEditingPassword ? (
                <button type="button" className="edit-btn" onClick={handleEditPassword}>
                  <FaPencilAlt className="btn-icon" />
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
                    <FaPencilAlt className="btn-icon" />
                    Change Password
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
    </Adminsidebar>
  );
};

export default AdminProfileSetting;
