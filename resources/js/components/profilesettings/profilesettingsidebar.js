
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../../sass/components/profilesettings/profilesettingsidebar.scss';

const ProfileSettingsSidebar = () => {
  const location = useLocation();
  
  // Get user role from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || '{}');
  const userRole = userData.role_id;

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
      label: userRole === 1 ? 'Booking Requests' : 'My Bookings',
      isActive: location.pathname === '/profile-settings/bookings'
    }
  ];

  // Only add My Jobs for workers (role_id 1)
  if (userRole === 1) {
    menuItems.push({
      id: 'my-jobs',
      path: '/profile-settings/my-jobs',
      icon: '/images/job.svg',
      label: 'My Jobs',
      isActive: location.pathname === '/profile-settings/my-jobs'
    });
  }

  // Only add Post Job for employers (role_id 2)
  if (userRole === 2) {
    menuItems.push({
      id: 'post-job',
      path: '/profile-settings/post-job',
      icon: '/images/postjob.svg',
      label: 'Post Job',
      isActive: location.pathname === '/profile-settings/post-job'
    });
  }

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
