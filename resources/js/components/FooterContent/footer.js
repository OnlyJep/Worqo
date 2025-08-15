import React from 'react';
import './../../../sass/components/footer.scss';

// Assets
import Logo from '../../../../resources/sass/img/worqo_logo.svg';
import FacebookIcon from '../../../../resources/sass/img/iconsAssets/Facebook.svg';
import TwitterIcon from '../../../../resources/sass/img/iconsAssets/twitter.svg';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__info">
          <img className="footer__logo" src={Logo} alt="WORQO" />
          <ul className="footer__contact">
            <li><span className="footer__bullet" aria-hidden>📍</span> 21 JC Aquino Avenue, Butuan City</li>
            <li><span className="footer__bullet" aria-hidden>📞</span> +639506149789</li>
            <li><span className="footer__bullet" aria-hidden>✉️</span> FixnHost@gmail.Com</li>
          </ul>
        </div>

        <div className="footer__list">
          <h3>Privacy Policy</h3>
          <ul>
            <li>Information We Collect</li>
            <li>How We Use Your Information</li>
            <li>Sharing Your Information</li>
            <li>Your Rights</li>
            <li>Data Collections</li>
            <li>Cookies</li>
            <li>Changes To This Policy</li>
          </ul>
        </div>

        <div className="footer__list">
          <h3>FAQs</h3>
          <ul>
            <li>What Is WORQO?</li>
            <li>How Do I Contact A Worker?</li>
            <li>Is It Safe To Use WORQO?</li>
            <li>How Are Service Providers Verified?</li>
            <li>Can I Cancel Or Reschedule A Booking?</li>
            <li>What If I'm Not Satisfied With The Service?</li>
          </ul>
        </div>

        <div className="footer__follow">
          <h3>Follow Us</h3>
          <div className="footer__social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={FacebookIcon} alt="Facebook" />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
              <img src={TwitterIcon} alt="Twitter" />
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>@2025 WORQO, All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;