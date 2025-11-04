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
    // Get user role from localStorage immediately to avoid redirects
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const roleId = Number(userData.role_id);
    setUserRole(roleId);
  }, []);

  // Determine which bookings component to use based on user role
  const BookingsComponent = userRole === 1 ? BookingRequest : MyBookings;

  // Role-based route protection component
  const RoleProtectedRoute = ({ children, allowedRoles }) => {
    // Don't redirect if userRole is still loading (null), wait for it to be set
    if (userRole === null) {
      return null; // or a loading spinner
    }
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/profile-settings" replace />;
    }
    return children;
  };

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
            {/* My Jobs - only for Workers (role_id 1) */}
            <Route 
              path="/my-jobs" 
              element={
                <RoleProtectedRoute allowedRoles={[1]}>
                  <MyJobs />
                </RoleProtectedRoute>
              } 
            />
            {/* Post Job - only for Employers (role_id 2) */}
            <Route 
              path="/post-job" 
              element={
                <RoleProtectedRoute allowedRoles={[2]}>
                  <MyPostJob />
                </RoleProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
