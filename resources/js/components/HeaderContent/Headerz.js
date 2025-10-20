import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';
import { IconBell, IconMenu2, IconMessageCircle } from '@tabler/icons-react';
import axios from 'axios';
import './../../../sass/components/Headerz.scss';
import Loader from '../LoaderContent/loader';

const Headerz = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingToRole, setSwitchingToRole] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Function to update user status display
  const updateUserStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${user.id}/status`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setUser(userData);
        // Fetch unread notifications count
        fetchUnreadCount();
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }

    // Handle click outside for dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for unread notifications count and user status every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
      updateUserStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn, user]);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const userData = JSON.parse(storedUser);
      const userId = userData?.id || userData?.user?.id;
      if (!userId) return;

      const response = await axios.get(`http://127.0.0.1:8000/api/notifications/unread-count?user_id=${userId}`);

      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

   // Listen for profile image updates
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      const updatedUser = event.detail.user;
      setUser(updatedUser);
      setImageError(false); // Reset image error state
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);

  // Listen for notification updates
  useEffect(() => {
    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, []);

  // Listen for special notification links
  useEffect(() => {
    const handleNotificationLink = (event) => {
      const { url, targetRoleId } = event.detail;
      if (url) {
        if (url.includes('/profile-settings/bookings') && targetRoleId) {
          goToBookings(targetRoleId);
        } else {
          setIsLoading(true);
          setTimeout(() => {
            navigate(url);
            setIsLoading(false);
          }, 800);
        }
      }
    };

    window.addEventListener('notificationLinkClicked', handleNotificationLink);
    return () => {
      window.removeEventListener('notificationLinkClicked', handleNotificationLink);
    };
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  // Navigation functions
  const goToHome = () => navigate('/');
  const goToServices = () => navigate('/services');
  const goToAbout = () => navigate('/about');
  const goToFindJobs = () => navigate('/find-jobs');
  const goToPostJobs = () => navigate('/profile-settings/post-job');
  const goToNotifications = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/notifications');
      setIsLoading(false);
    }, 800);
  };

  const goToBookings = async (targetRoleId = null) => {
    if (!user) return;
    
    setIsLoading(true);
    
    // If a target role is specified and it's different from current role, switch roles
    if (targetRoleId && user.role_id !== targetRoleId) {
      try {
        const authToken = localStorage.getItem('auth_token');
        
        // Call backend API to update role in database
        const response = await fetch('http://127.0.0.1:8000/api/users/switch-role', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        body: JSON.stringify({
          user_id: user.id || user.user?.id,
          role_id: targetRoleId
        })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            // Update localStorage with the new user data from backend
            const updatedUser = {
              ...user,
              role_id: data.user.role_id,
              role_name: data.user.role_name
            };
            
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            // Navigate to bookings after a short delay to allow state update
            setTimeout(() => {
              navigate('/profile-settings/bookings');
              setIsLoading(false);
            }, 1000);
            return;
          }
        }
      } catch (error) {
        console.error('Role switch error:', error);
      }
    }
    
    // If no role switch needed or failed, navigate directly
    setTimeout(() => {
      navigate('/profile-settings/bookings');
      setIsLoading(false);
    }, 800);
  };

  const goToLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/login');
      setIsLoading(false);
    }, 800);
  };

  const handleProfileSettings = () => {
    setIsDropdownOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      navigate('/profile-settings');
      setIsLoading(false);
    }, 800);
  };

  const handleSwitchAccount = async () => {
    if (!user) return;
    
    // Calculate the target role name before switching
    const newRoleId = user.role_id === 1 ? 2 : 1;
    const targetRoleName = newRoleId === 1 ? 'Worker' : 'Employer';
    
    setIsSwitching(true);
    setSwitchingToRole(targetRoleName);
    setIsDropdownOpen(false);
    
    try {
      const authToken = localStorage.getItem('auth_token');
      
      // Ensure we have the correct user ID
      const userId = user.id || user.user?.id;
      
      if (!userId) {
        console.error('No user ID found');
        alert('Error: User ID not found. Please log in again.');
        setIsSwitching(false);
        setSwitchingToRole('');
        return;
      }
      
      console.log('Switching role for user:', userId, 'from', user.role_id, 'to', newRoleId);
      
      // Call backend API to update role in database
      const response = await fetch('http://127.0.0.1:8000/api/users/switch-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          role_id: newRoleId
        })
      });
      
      console.log('Role switch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Role switch response data:', data);
        
        if (data.success) {
          // Update localStorage with the new user data from backend
          const updatedUser = {
            ...user,
            role_id: data.user.role_id,
            role_name: data.user.role_name
          };
          
          console.log('Updated user data:', updatedUser);
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          
          // Show switching animation
          setTimeout(() => {
            setIsSwitching(false);
            setSwitchingToRole('');
            window.location.reload();
          }, 2000);
        } else {
          console.error('Role switch failed:', data.message || 'Unknown error');
          console.error('Full response:', data);
          alert('Failed to switch role: ' + (data.message || 'Unknown error'));
          setIsSwitching(false);
          setSwitchingToRole('');
        }
      } else {
        let errorMessage = 'Failed to switch role';
        let errorData = null;
        
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('API error response:', errorData);
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
          console.error('Failed to parse error response:', e);
        }
        
        console.error('API error:', errorMessage);
        console.error('Response status:', response.status);
        alert('Error: ' + errorMessage);
        setIsSwitching(false);
        setSwitchingToRole('');
      }
      
    } catch (error) {
      console.error('Switch account error:', error.message);
      alert('Network error: ' + error.message);
      setIsSwitching(false);
      setSwitchingToRole('');
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://127.0.0.1:8000/api/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Update user status to offline before clearing localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = {
          ...userData,
          is_online: false,
          last_active_text: 'Offline'
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      if (response.ok) {
        localStorage.clear();
        setIsLoggedIn(false);
        setUser(null);
        setIsDropdownOpen(false);
        navigate('/', { replace: true });
      } else {
        console.error('Logout failed:', response.status, response.statusText);
        // Preserve profile completion flags before clearing localStorage
        const profileCompleteFlags = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('isProfileComplete_') || key.includes('skillsStepCompleted_')) {
            profileCompleteFlags[key] = localStorage.getItem(key);
          }
        });
        
        localStorage.clear();
        
        // Restore profile completion flags
        Object.keys(profileCompleteFlags).forEach(key => {
          localStorage.setItem(key, profileCompleteFlags[key]);
        });
        
        setIsLoggedIn(false);
        setUser(null);
        setIsDropdownOpen(false);
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error.message);
      // Preserve profile completion flags before clearing localStorage
      const profileCompleteFlags = {};
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('isProfileComplete_') || key.includes('skillsStepCompleted_')) {
          profileCompleteFlags[key] = localStorage.getItem(key);
        }
      });
      
      localStorage.clear();
      
      // Restore profile completion flags
      Object.keys(profileCompleteFlags).forEach(key => {
        localStorage.setItem(key, profileCompleteFlags[key]);
      });
      
      setIsLoggedIn(false);
      setUser(null);
      setIsDropdownOpen(false);
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <header className="headerz">
      {isLoading && <Loader />}
      {isSwitching && (
        <div className="switching-overlay">
          <div className="switching-content">
            <div className="switching-spinner"></div>
            <h3>Switching to {switchingToRole}...</h3>
          </div>
        </div>
      )}
      <div className="headerz-container">
        {/* Mobile Menu Button */}
        <div className="mobile-menu">
          <IconMenu2 size={24} onClick={toggleMenu} className="menu-icon" />
        </div>

        {/* Logo */}
        <div className="logo" onClick={goToHome} style={{ cursor: 'pointer' }}></div>

        {/* Navigation Links */}
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <span onClick={goToHome}>Home</span>
          {/* Hide Services for Workers (role_id = 1) */}
          {(!isLoggedIn || user?.role_id !== 1) && (
            <span onClick={goToServices}>Services</span>
          )}
          <span onClick={goToAbout}>About Us</span>
          {/* Hide Find Jobs for Employers (role_id = 2) */}
          {(!isLoggedIn || user?.role_id !== 2) && (
            <span onClick={goToFindJobs}>Find Jobs</span>
          )}
          {/* Hide Post Jobs for Workers (role_id = 1) */}
          {(!isLoggedIn || user?.role_id !== 1) && (
            <span onClick={goToPostJobs}>Post Jobs</span>
          )}
          {/* Additional navigation items */}
        </nav>

        {/* Right Side: Icons and Login/Profile */}
        <div className="header-actions">
          {isLoggedIn && (
            <>
              <div className="notification-wrapper" onClick={goToNotifications}>
                <IconBell size={24} className="header-icon" style={{ cursor: 'pointer' }} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
              <IconMessageCircle
                size={24}
                className="header-icon message-icon"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/message')}
              />
            </>
          )}
          {isLoggedIn ? (
            <div className="profile" ref={dropdownRef}>
              <img
                src={imageError || !user?.profile_img ? 'images/defpfp.svg' : (user.profile_img.startsWith('images/') ? user.profile_img : `http://127.0.0.1:8000/storage/${user.profile_img}`)}
                alt="Profile"
                className="profile-icon"
                onError={handleImageError}
              />
              <div
                className={`dropdown-toggle ${isDropdownOpen ? 'open' : ''}`}
                onClick={toggleDropdown}
              >
                <IoMdArrowDropdown className="dropdown-icon" style={{ color: 'white' }} />
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <ul>
                      <li onClick={handleProfileSettings}>
                        <FaUserCog className="menu-icon" /> Profile Settings
                      </li>
                      <li onClick={handleSwitchAccount}>
                        <FaUserCog className="menu-icon" /> Switch to {user?.role_id === 1 ? 'Employer' : 'Worker'}
                      </li>
                      <li onClick={handleLogout}>
                        <FaSignOutAlt className="menu-icon" /> Logout
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button className="login-btn" onClick={goToLogin}>
              Login/Signup
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

export default Headerz;