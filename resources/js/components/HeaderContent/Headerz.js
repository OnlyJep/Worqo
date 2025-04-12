import React from 'react';
import './../../../sass/components/Headerz.scss';
import { IconBell, IconShoppingCart } from '@tabler/icons-react';

// Import the SVG as a URL (not as a component)
import logo from '../../../../resources/sass/img/nextu_logo.svg'; // Adjust the path as needed

const Headerz = () => {
  return (
    <header className="headerz">
      <div className="headerz-container">
        {/* Left Side: Logo and Navigation Links */}
        <div className="header-left">
          {/* Logo */}
          <div className="logo">
            <img src={logo} alt="nextUse Logo" className="logo-img" />
          </div>

          {/* Navigation Links */}
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/browse">Browse</a>
            <a href="/sell">Sell</a>
            <a href="/about">About us</a>
          </nav>
        </div>

        {/* Right Side: Icons and Login */}
        <div className="header-actions">
          <IconBell size={24} className="header-icon" />
          <IconShoppingCart size={24} className="header-icon" />
          <button className="login-btn">Login/Signup</button>
        </div>
      </div>
    </header>
  );
};

export default Headerz;