import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProfileSettingsSidebar from './profilesettingsidebar';
import MyProfile from './myprofile';
import MyAddress from './myaddress';
import MyPostJob from './mypostjob';
import MyJobs from './myjobs';
import BookingRequest from './BookingRequest';
import Headerz from '../HeaderContent/Headerz';
import '../../../sass/components/profilesettings/profilesettingsidebar.scss';
import '../../../sass/components/profilesettings/myprofile.scss';
import '../../../sass/components/profilesettings/myaddress.scss';
import '../../../sass/components/profilesettings/mypostjob.scss';
import '../../../sass/components/profilesettings/myjobs.scss';
import '../../../sass/components/profilesettings/profilesettings.scss';
import '../../../sass/components/profilesettings/BookingRequest.scss';
import './../../../sass/components/Headerz.scss';

const ProfileSettings = () => {
  return (
    <div className="profile-settings-container">
      <Headerz />
      <div className="profile-settings-layout">
        <ProfileSettingsSidebar />
        <div className="profile-settings-content">
          <Routes>
            <Route path="/" element={<MyProfile />} />
            <Route path="/addresses" element={<MyAddress />} />
            <Route path="/bookings" element={<BookingRequest />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/post-job" element={<MyPostJob />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
