import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProfileSettingsSidebar from './profilesettingsidebar';
import MyProfile from './myprofile';
import MyAddress from './myaddress';
import MyPostJob from './mypostjob';
import MyJobs from './myjobs';
import BookingRequest from './BookingRequest';
import MyBookings from './mybookings';
import Headerz from '../HeaderContent/Headerz';
import '../../../sass/components/profilesettings/profilesettingsidebar.scss';
import '../../../sass/components/profilesettings/myprofile.scss';
import '../../../sass/components/profilesettings/myaddress.scss';
import '../../../sass/components/profilesettings/mypostjob.scss';
import '../../../sass/components/profilesettings/myjobs.scss';
import '../../../sass/components/profilesettings/profilesettings.scss';
import '../../../sass/components/profilesettings/BookingRequest.scss';
import '../../../sass/components/profilesettings/mybookings.scss';
import './../../../sass/components/Headerz.scss';

const ProfileSettings = () => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user role from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    setUserRole(userData.role_id);
  }, []);

  // Determine which bookings component to use based on user role
  const BookingsComponent = userRole === 1 ? BookingRequest : MyBookings;

  return (
    <div className="profile-settings-container">
      <Headerz />
      <div className="profile-settings-layout">
        <ProfileSettingsSidebar />
        <div className="profile-settings-content">
          <Routes>
            <Route path="/" element={<MyProfile />} />
            <Route path="/addresses" element={<MyAddress />} />
            <Route path="/bookings" element={<BookingsComponent />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/post-job" element={<MyPostJob />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
