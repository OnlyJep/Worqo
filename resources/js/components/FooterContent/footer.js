import React from 'react';
import './../../../sass/components/footer.scss';

// Import social media SVGs
import FacebookIcon from '../../../../resources/sass/img/iconsAssets/Facebook.svg';
import InstagramIcon from '../../../../resources/sass/img/iconsAssets/Instagram.svg';
import XIcon from '../../../../resources/sass/img/iconsAssets/twitter.svg';
import TikTokIcon from '../../../../resources/sass/img/iconsAssets/Tiktok.svg';
import LinkedInIcon from '../../../../resources/sass/img/iconsAssets/LinkedIn.svg';

// Import app store badges
import GooglePlayBadge from '../../../../resources/sass/img/iconsAssets/gplay.svg';
import AppStoreBadge from '../../../../resources/sass/img/iconsAssets/appstore.svg';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content-wrapper">
        <div className="footer__column">
          <h3>Company</h3>
          <a href="/about-us">About us</a>
          <a href="/careers">Careers</a>
          <a href="/partner">Partner with nextUse</a>
          <a href="/terms-privacy">Terms & Privacy</a>
          <a href="/help">Help</a>
        </div>

        <div className="footer__column">
          <h3>Explore nextUse</h3>
          <a href="/start-selling">Start Selling</a>
          <a href="/browse-category">Browse by Category</a>
          <a href="/local-deals">Find Local Deals</a>
          <a href="/top-sellers">Top Sellers</a>
          <a href="/help">Help</a>
        </div>

        <div className="footer__column">
          <div className="footer__community-text">
            <h3>Join Our Community! Let’s</h3>
            <h3>Reuse Together.</h3>
          </div>
          <div className="footer__social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <img src={FacebookIcon} alt="Facebook" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <img src={InstagramIcon} alt="Instagram" />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer">
              <img src={XIcon} alt="X" />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
              <img src={TikTokIcon} alt="TikTok" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <img src={LinkedInIcon} alt="LinkedIn" />
            </a>
          </div>
        </div>

        <div className="footer__app-download">
          <p>Buy and Sell Second-Hand Items Anytime, Anywhere with the NextUse App.</p>
          <div className="footer__app-buttons">
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
              <img src={GooglePlayBadge} alt="Get it on Google Play" />
            </a>
            <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">
              <img src={AppStoreBadge} alt="Download on the App Store" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;