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
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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

  // Poll for unread notifications count every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        console.log('No token or user found, skipping unread count fetch');
        return;
      }

      const response = await axios.get('http://127.0.0.1:8000/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      // Only log error if it's not a 401 (unauthorized) error
      if (error.response?.status !== 401) {
        console.error('Error fetching unread count:', error);
      }
      // If 401, user might need to re-authenticate
      if (error.response?.status === 401) {
        console.log('User not authenticated, clearing auth state');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
        setUnreadCount(0);
      }
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
  const goToPostJobs = () => navigate('/post-jobs');
  const goToNotifications = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/notifications');
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
    
    setIsSwitching(true);
    setIsDropdownOpen(false);
    
    try {
      const newRoleId = user.role_id === 1 ? 2 : 1;
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
      const response = await fetch('http://127.0.0.1:8000/api/logout', {
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
        localStorage.clear();
        setIsLoggedIn(false);
        setUser(null);
        setIsDropdownOpen(false);
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error.message);
      localStorage.clear();
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
            <h3>Switching to {user?.role_id === 1 ? 'Employer' : 'Worker'}...</h3>
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
          <span onClick={() => navigate('/contact')}>Contact</span>
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
                src={imageError || !user?.profile_img ? 'img/defaultpfp.jpg' : `http://127.0.0.1:8000/storage/${user.profile_img}`}
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