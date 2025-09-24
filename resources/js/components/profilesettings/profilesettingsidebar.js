import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../../sass/components/profilesettings/profilesettingsidebar.scss';

const ProfileSettingsSidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      id: 'my-profile',
      path: '/profile-settings',
      icon: '/images/profile.svg',
      label: 'My Profile',
      isActive: location.pathname === '/profile-settings' || location.pathname === '/profile-settings/'
    },
    {
      id: 'my-addresses',
      path: '/profile-settings/addresses',
      icon: '/images/location.svg',
      label: 'My Addresses',
      isActive: location.pathname === '/profile-settings/addresses'
    },
    {
      id: 'my-bookings',
      path: '/profile-settings/bookings',
      icon: '/images/booklist.svg',
      label: 'My Bookings',
      isActive: location.pathname === '/profile-settings/bookings'
    },
    {
      id: 'post-job',
      path: '/profile-settings/post-job',
      icon: '/images/postjob.svg',
      label: 'Post Job',
      isActive: location.pathname === '/profile-settings/post-job'
    }
  ];

  return (
    <div className="profile-settings-sidebar">
      <div className="sidebar-container">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`sidebar-item ${item.isActive ? 'active' : ''}`}
          >
            <img src={item.icon} alt={item.label} className="sidebar-icon" />
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProfileSettingsSidebar;
