import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCaretDown, FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { IconBell, IconMenu2, IconMessageCircle } from '@tabler/icons-react';
import './../../../sass/components/Headerz.scss';
import Loader from '../LoaderContent/loader';

const Headerz = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2); // Sample unread count
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
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
      navigate('/profile');
      setIsLoading(false);
    }, 800);
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
          <span onClick={goToServices}>Services</span>
          <span onClick={goToAbout}>About Us</span>
          <span onClick={goToFindJobs}>Find Jobs</span>
          <span onClick={goToPostJobs}>Post Jobs</span>
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
                src={imageError || !user?.profile_img ? '/default-profile.png' : user.profile_img}
                alt="Profile"
                className="profile-icon"
                onError={handleImageError}
              />
              <div
                className={`dropdown-toggle ${isDropdownOpen ? 'open' : ''}`}
                onClick={toggleDropdown}
              >
                <FaCaretDown className="dropdown-icon" />
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <ul>
                      <li onClick={handleProfileSettings}>
                        <FaUserCog className="menu-icon" /> Profile Settings
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