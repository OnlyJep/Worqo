import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLocationDot } from 'react-icons/fa6';
import { IoCallSharp } from 'react-icons/io5';
import { MdEmail } from 'react-icons/md';
import './../../../sass/components/footer.scss';

const Footer = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handlePostJobClick = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    navigate('/profile-settings/post-job');
  };

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__info">
          <img className="footer__logo" src={`${window.location.origin}/images/worqo_logo.svg`} alt="WORQO" />
          <ul className="footer__contact">
            <li>
              <FaLocationDot className="footer__bullet" size={16} style={{ color: 'white' }} aria-hidden="true" />
              <span>21 JC Aquino Avenue, Butuan City</span>
            </li>
            <li>
              <IoCallSharp className="footer__bullet" size={16} style={{ color: 'white' }} aria-hidden="true" />
              <span>+639506149789</span>
            </li>
            <li>
              <MdEmail className="footer__bullet" size={16} style={{ color: 'white' }} aria-hidden="true" />
              <span>worqo@gmail.Com</span>
            </li>
          </ul>
        </div>

        <div className="footer__nav">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/profile-settings/post-job" onClick={handlePostJobClick}>Post Job</a></li>
            <li><a href="/find-jobs">Find Jobs</a></li>
          </ul>
        </div>

        <div className="footer__policies">
          <ul>
            <li><a href="/about">Privacy Policy</a></li>
            <li><a href="/about">FAQs</a></li>
          </ul>
        </div>

        <div className="footer__follow">
          <h3>Follow Us</h3>
          <div className="footer__social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={`${window.location.origin}/images/facebook.svg`} alt="Facebook" />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
              <img src={`${window.location.origin}/images/twitter.svg`} alt="Twitter" />
            </a>
          </div>
        </div>
      </div>

      {showLoginModal && (
        <div
          className="headerz-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onMouseDown={(e) => {
            if (e.target.classList.contains('headerz-modal-overlay')) {
              setShowLoginModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-login-modal-title"
            style={{
              background: '#fff',
              borderRadius: 8,
              width: '90%',
              maxWidth: 420,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
              <h3 id="footer-login-modal-title" style={{ margin: 0, fontSize: 18, color: '#000' }}>Login Required</h3>
            </div>
            <div style={{ padding: 20, color: '#333', fontSize: 14, lineHeight: 1.5 }}>
              Please login to post jobs.
            </div>
            <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #eee' }}>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/login', { replace: true });
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#001E40',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Login / Signup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="footer__bottom">
        <p>@2025 WORQO, All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;