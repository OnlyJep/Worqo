import React, { useState } from 'react';
import "./../../../sass/components/profile.scss";
import { IconBrandTwitter, IconBrandLinkedin, IconBrandInstagram, IconSquareRoundedPlus } from '@tabler/icons-react';
import Headerz from '../HeaderContent/Headerz'; // Import the Headerz component

// Import images
import profilePhoto from '../../../../resources/sass/img/pfp.svg';
import coverPhoto from '../../../../resources/sass/img/coverphoto.svg';
import listingPhoto1 from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';
import listingPhoto2 from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';
import listingPhoto3 from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';
import listingPhoto4 from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';

// Import custom SVGs for link and share icons
import LinkIcon from '../../../../resources/sass/img/iconsAssets/link.svg';
import ShareIcon from '../../../../resources/sass/img/iconsAssets/share.svg';

function Profile() {
  const [activeTab, setActiveTab] = useState('ITEMS FOR SALE');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="profile-page">
      {/* Add the Headerz component */}
      <Headerz />

      {/* Header with Cover Photo and Profile Photo */}
      <div className="profile-header">
        <div className="cover-photo">
          <img src={coverPhoto} alt="Cover" />
        </div>
        <div className="profile-photo-wrapper">
          <img src={profilePhoto} alt="Profile" className="profile-photo" />
        </div>
      </div>

      {/* Profile Section */}
      <div className="profile-container">
        <div className="profile-left">
          <div className="profile-info">
            <h2>Alexander Otaza</h2>
            <div className="status-container">
              <span className="status-dot"></span>
              <p className="status">Available now</p>
            </div>
            <p className="location">Butuan, Philippines</p>
            <button className="edit-profile">
              <IconSquareRoundedPlus size={20} style={{ marginRight: '8px' }} />
              EDIT PROFILE INFO
            </button>
          </div>

          {/* Stats */}
          <div className="stats">
            <div className="stat-item">
              <div className="stat-label">Items Sold</div>
              <div className="stat-number">189</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Successful Transactions</div>
              <div className="stat-number">33</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Followers</div>
              <div className="stat-number">15</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Following</div>
              <div className="stat-number">18</div>
            </div>
          </div>

          {/* Social Links */}
          <div className="social-links">
            <h4>ON THE WEB</h4>
            <div className="social-links-container">
              <div className="social-icon">
                <IconBrandTwitter size={20} className="social-media-icon" />
                <span>Twitter</span>
                <img src={LinkIcon} alt="Link" className="action-icon" />
                <img src={ShareIcon} alt="Share" className="action-icon" />
              </div>
              <div className="social-icon">
                <IconBrandLinkedin size={20} className="social-media-icon" />
                <span>LinkedIn</span>
                <img src={LinkIcon} alt="Link" className="action-icon" />
                <img src={ShareIcon} alt="Share" className="action-icon" />
              </div>
              <div className="social-icon">
                <IconBrandInstagram size={20} className="social-media-icon" />
                <span>Instagram</span>
                <img src={LinkIcon} alt="Link" className="action-icon" />
                <img src={ShareIcon} alt="Share" className="action-icon" />
              </div>
            </div>
          </div>

          {/* Member Since and Report */}
          <p className="member-since">MEMBER SINCE: SEPTEMBER 27, 2021</p>
          <p className="report">Report</p>
        </div>

        {/* Listings Section */}
        <div className="profile-right">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'ITEMS FOR SALE' ? 'active' : ''}`}
              onClick={() => handleTabClick('ITEMS FOR SALE')}
            >
             YOUR LISTINGS
            </button>
            <button
              className={`tab ${activeTab === 'REVIEWS' ? 'active' : ''}`}
              onClick={() => handleTabClick('REVIEWS')}
            >
              REVIEWS
            </button>
            <button
              className={`tab ${activeTab === 'YOUR STATS' ? 'active' : ''}`}
              onClick={() => handleTabClick('YOUR STATS')}
            >
              YOUR STATS
            </button>
            <button
              className={`tab ${activeTab === 'DRAFTS' ? 'active' : ''}`}
              onClick={() => handleTabClick('DRAFTS')}
            >
              DRAFTS
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'ITEMS FOR SALE' && (
              <div className="listings">
                <div className="listing-item">
                  <img src={listingPhoto1} alt="Listing 1" />
                </div>
                <div className="listing-item">
                  <img src={listingPhoto2} alt="Listing 2" />
                </div>
                <div className="listing-item">
                  <img src={listingPhoto3} alt="Listing 3" />
                </div>
                <div className="listing-item">
                  <img src={listingPhoto4} alt="Listing 4" />
                </div>
                <div className="listing-item create-listing">
                  <div className="create-listing-container">
                    <button className="create-listing-circle">
                      <IconSquareRoundedPlus size={20} />
                    </button>
                    <button className="create-listing-button">
                      Create a new listing
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'REVIEWS' && (
              <div className="tab-placeholder">
                <p>Reviews content coming soon...</p>
              </div>
            )}
            {activeTab === 'YOUR STATS' && (
              <div className="tab-placeholder">
                <p>Your stats content coming soon...</p>
              </div>
            )}
            {activeTab === 'DRAFTS' && (
              <div className="tab-placeholder">
                <p>Drafts content coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;