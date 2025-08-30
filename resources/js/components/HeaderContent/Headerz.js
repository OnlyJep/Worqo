import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../sass/components/Headerz.scss';
import { IconBell, IconMenu2, IconMessageCircle } from '@tabler/icons-react';
import Loader from '../LoaderContent/loader';

const Headerz = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2); // Sample unread count
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation functions
  const goToHome = () => navigate('/');
  const goToServices = () => navigate('/services');
  const goToAbout = () => navigate('/about');
  const goToFindJobs = () => navigate('/find-jobs');
  const goToPostJobs = () => navigate('/post-jobs');
  
  const goToLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/login');
      setIsLoading(false);
    }, 800);
  };

  const goToNotifications = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/notifications');
      setIsLoading(false);
    }, 800);
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

        {/* Right Side: Icons and Login */}
        <div className="header-actions">
          <div className="notification-wrapper" onClick={goToNotifications}>
            <IconBell 
              size={24} 
              className="header-icon" 
              style={{ cursor: 'pointer' }}
            />
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
          <button className="login-btn" onClick={goToLogin}>
            Login/Signup
          </button>
        </div>
      </div>
    </header>
  );
};

export default Headerz;