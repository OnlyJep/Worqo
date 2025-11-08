import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';
import { IconBell, IconMenu2, IconMessageCircle } from '@tabler/icons-react';
import axios from 'axios';
import './../../../sass/components/Headerz.scss';
import Loader from '../LoaderContent/loader';
import { getProfileImageUrl } from '../../utils/profileImageUtils';

const Headerz = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Function to update user status display
  const updateUserStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${window.location.origin}/api/users/${user.id}/status`);
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
        // Handle both direct user data and wrapped user data
        const currentUser = userData.user || userData;
        setIsLoggedIn(true);
        setUser(currentUser);
        // Fetch unread notifications count
        fetchUnreadCount();
        // Fetch unread messages count
        fetchUnreadMessageCount();
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
      fetchUnreadMessageCount();
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

      const response = await axios.get(`/api/notifications/unread-count?user_id=${userId}`);

      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch unread messages count
  const fetchUnreadMessageCount = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const userData = JSON.parse(storedUser);
      const userId = userData?.id || userData?.user?.id;
      if (!userId) return;

      const token = localStorage.getItem('auth_token');
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId
        } 
      } : {};

      const response = await axios.get(`/api/messages/unread-count`, config);

      if (response.data.success) {
        setUnreadMessageCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  };

   // Listen for profile image updates
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      const updatedUser = event.detail.user || event.detail;
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

  // Listen for message updates
  useEffect(() => {
    const handleMessageUpdate = () => {
      fetchUnreadMessageCount();
    };

    window.addEventListener('messageUpdated', handleMessageUpdate);
    return () => {
      window.removeEventListener('messageUpdated', handleMessageUpdate);
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
  const goToServices = () => {
    // Allow browsing services without login
    // Only restrict role-based actions when logged in
    if (isLoggedIn && user?.role_id === 1) {
      alert('Workers cannot access services. Please switch to Employer account.');
      return;
    }
    navigate('/services');
  };
  
  const goToAbout = () => navigate('/about');
  
  const goToFindJobs = () => {
    // Allow browsing jobs without login
    // Only restrict role-based actions when logged in
    if (isLoggedIn && user?.role_id === 2) {
      alert('Employers cannot find jobs. Please switch to Worker account.');
      return;
    }
    navigate('/find-jobs');
  };
  
  const goToPostJobs = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isLoggedIn) {
      alert('Please login to post jobs');
      navigate('/login', { replace: true });
      return;
    }
    const userRoleId = Number(user?.role_id);
    if (userRoleId === 1) {
      alert('Workers cannot post jobs. Please switch to Employer account.');
      return;
    }
    if (userRoleId !== 2) {
      alert('Only Employers can post jobs.');
      return;
    }
    // Navigate directly to post job page in profile settings - no intermediate stops
    // Use replace to avoid going to /profile-settings first
    navigate('/profile-settings/post-job', { replace: true });
  };

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
        const response = await fetch(`${window.location.origin}/api/users/switch-role`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            user_id: user.id,
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
    
    let newRoleId;
    let targetRoleName;
    
    // Role switching logic:
    // Worker (1) <-> Employer (2)
    if (user.role_id === 1) {
      // Worker can switch to Employer
      newRoleId = 2;
      targetRoleName = 'Employer';
    } else if (user.role_id === 2) {
      // Employer can switch to Worker
      newRoleId = 1;
      targetRoleName = 'Worker';
    } else {
      // Default fallback
      newRoleId = user.role_id === 1 ? 2 : 1;
      targetRoleName = newRoleId === 1 ? 'Worker' : 'Employer';
    }
    
    setTargetRole(targetRoleName);
    setIsSwitching(true);
    setIsDropdownOpen(false);
    
    try {
      const authToken = localStorage.getItem('auth_token');
      
      // Call backend API to update role in database
      const response = await fetch(`${window.location.origin}/api/users/switch-role`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          role_id: newRoleId
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
          
          // Show switching animation
          setTimeout(() => {
            setIsSwitching(false);
            window.location.reload();
          }, 2000);
        } else {
          console.error('Role switch failed:', data.message || 'Unknown error');
          alert('Failed to switch role: ' + (data.message || 'Unknown error'));
          setIsSwitching(false);
        }
      } else {
        let errorMessage = 'Failed to switch role';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        console.error('API error:', errorMessage);
        alert('Error: ' + errorMessage);
        setIsSwitching(false);
      }
      
    } catch (error) {
      console.error('Switch account error:', error.message);
      alert('Network error: ' + error.message);
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Update user status to offline (is_online = 0) before logout
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = {
          ...userData,
          is_online: 0,
          last_active_text: 'Offline'
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      const response = await fetch(`${window.location.origin}/api/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
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
  const handleImageError = (e) => {
    setImageError(true);
    // Fallback to default profile image if load fails
    const defaultImage = `${window.location.origin}/images/defpfp.svg`;
    if (e.target.src !== defaultImage) {
      e.target.src = defaultImage;
    }
  };

  return (
    <header className="headerz">
      {isLoading && <Loader />}
      {isSwitching && (
        <div className="switching-overlay">
          <div className="switching-content">
            <div className="switching-spinner"></div>
            <h3>Switching to {targetRole}...</h3>
            <p>Please wait while we update your account</p>
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
          <div className="mobile-logo" onClick={goToHome}></div>
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
          {/* Show Post Jobs only for Employers (role_id = 2) */}
          {isLoggedIn && user?.role_id === 2 && (
            <span 
              onClick={goToPostJobs}
              onMouseDown={(e) => e.preventDefault()}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  goToPostJobs(e);
                }
              }}
            >
              Post Jobs
            </span>
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
              <div className="notification-wrapper" onClick={() => navigate('/message')}>
                <IconMessageCircle
                  size={24}
                  className="header-icon message-icon"
                  style={{ cursor: 'pointer' }}
                />
                {unreadMessageCount > 0 && (
                  <span className="notification-badge">{unreadMessageCount}</span>
                )}
              </div>
            </>
          )}
          {isLoggedIn ? (
            <div className="profile" ref={dropdownRef}>
              <img
                src={getProfileImageUrl(user?.profile_img, 'images/defpfp.svg')}
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