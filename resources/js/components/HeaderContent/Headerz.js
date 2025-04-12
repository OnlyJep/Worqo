import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './../../../sass/components/Headerz.scss';
import { IconBell, IconShoppingBag, IconMenu2 } from '@tabler/icons-react';

// Import the SVG as a URL (not as a component)
import logo from '../../../../resources/sass/img/LogoAssets/next_logo.svg';

const Headerz = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate hook

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation functions
  const goToHome = () => navigate('/');
  const goToBrowse = () => navigate('/browse');
  const goToSell = () => navigate('/sell');
  const goToAbout = () => navigate('/about');

  return (
    <header className="headerz">
      <div className="headerz-container">
        {/* Mobile Menu Button */}
        <div className="mobile-menu">
          <IconMenu2 size={24} onClick={toggleMenu} className="menu-icon" />
        </div>

        {/* Logo */}
        <div className="logo">
          <img src={logo} alt="nextUse Logo" className="logo-img" />
        </div>

        {/* Navigation Links */}
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <span onClick={goToHome}>Home</span>
          <span onClick={goToBrowse}>Browse</span>
          <span onClick={goToSell}>Sell</span>
          <span onClick={goToAbout}>About us</span>
        </nav>

        {/* Right Side: Icons and Login */}
        <div className="header-actions">
          <IconBell size={24} className="header-icon" />
          <IconShoppingBag size={24} className="header-icon" />
          <button className="login-btn">Login/Signup</button>
        </div>
      </div>
    </header>
  );
};

export default Headerz;