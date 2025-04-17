import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../sass/components/Headerz.scss';
import { IconBell, IconShoppingBag, IconMenu2 } from '@tabler/icons-react';
import logo from '../../../../resources/sass/img/LogoAssets/next_logo.svg';
import OrdersModal from '../CartModals/orders_modal';
import Loader from '../LoaderContent/loader'; // Import the Loader component

const Headerz = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Navigation functions
  const goToHome = () => navigate('/');
  const goToBrowse = () => navigate('/browse');
  const goToSell = () => navigate('/sell');
  const goToAbout = () => navigate('/about');
  
  const goToLogin = () => {
    setIsLoading(true); // Show loader
    setTimeout(() => {
      navigate('/login');
      setIsLoading(false); // Hide loader after navigation
    }, 1000); // Adjust delay as needed
  };

  return (
    <header className="headerz">
      {isLoading && <Loader />} {/* Show loader when loading */}
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
          <IconShoppingBag
            size={24}
            className="header-icon"
            onClick={toggleModal}
          />
          <button className="login-btn" onClick={goToLogin}>
            Login/Signup
          </button>
        </div>
      </div>

      {/* OrdersModal */}
      <OrdersModal isOpen={isModalOpen} onClose={toggleModal} />
    </header>
  );
};

export default Headerz;