import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaPencilAlt, FaCalendarAlt } from "react-icons/fa";
import { message } from "antd";
import Admintopnavbar from "../adminside/admintopnavbar/admintopnavbar";
import Adminsidebar from "../adminside/adminsidebar/adminsidebar";
import { dispatchProfileImageUpdate, getProfileImageUrl } from "../../utils/profileImageUtils";

const AdminProfileSetting = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [genders, setGenders] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  
  // Profile form states
  const [profileData, setProfileData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    email: "",
    gender: ""
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
  
  // Profile dropdown states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    
    // Fetch genders and suffixes
    fetchGenders();
    fetchSuffixes();
  }, []);

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

  const loadUserData = async () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      
      // If gender_name is null, fetch fresh user data from API
      if (userData.gender_id && !userData.gender_name) {
        try {
          const token = localStorage.getItem("auth_token");
          if (token) {
            const response = await fetch(`http://127.0.0.1:8000/api/users/${userData.id}`, {
              method: "GET",
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            });
            
            if (response.ok) {
              const freshUserData = await response.json();
              setUser(freshUserData);
              localStorage.setItem("user", JSON.stringify(freshUserData));
              setProfileData({
                firstName: freshUserData.first_name || "",
                middleName: freshUserData.middlename || "",
                lastName: freshUserData.last_name || "",
                suffix: freshUserData.suffix_id || "",
                email: freshUserData.email || "",
                gender: freshUserData.gender_id || ""
              });
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error);
        }
      }
      
      // Use stored data if it's complete or if API fetch failed
      setUser(userData);
      setProfileData({
        firstName: userData.first_name || "",
        middleName: userData.middlename || "",
        lastName: userData.last_name || "",
        suffix: userData.suffix_id || "",
        email: userData.email || "",
        gender: userData.gender_id || ""
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
    document.getElementById('profile-image-input').click();
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
      
      // Handle suffix_id - only add if it has a value
      if (profileData.suffix) {
        requestData.suffix_id = profileData.suffix;
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
        
        if (profileData.suffix) {
          formData.append('suffix_id', profileData.suffix);
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
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          
          // Dispatch profile image update event
          dispatchProfileImageUpdate(updatedUser);
          
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
              <div className={`avatar-placeholder ${!profileImagePreview && (!user?.profile_img || user?.profile_img === 'img/defaultpfp.jpg') ? 'no-image' : ''}`}>
                <img 
                  src={profileImagePreview || (user?.profile_img && user.profile_img !== 'img/defaultpfp.jpg' ? `http://127.0.0.1:8000/storage/${user.profile_img}?v=${Date.now()}` : "img/defaultpfp.jpg")} 
                  alt="Profile" 
                  onError={(e) => {
                    e.target.src = "img/defaultpfp.jpg";
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
                id="profile-image-input"
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
                <select
                  id="suffix"
                  name="suffix"
                  value={profileData.suffix}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "editing" : ""}
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
                src={profileImagePreview || (user?.profile_img && user.profile_img !== 'img/defaultpfp.jpg' ? `http://127.0.0.1:8000/storage/${user.profile_img}?v=${Date.now()}` : "img/defaultpfp.jpg")} 
                alt="Profile" 
                onError={(e) => {
                  e.target.src = "img/defaultpfp.jpg";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </Adminsidebar>
  );
};

export default AdminProfileSetting;


