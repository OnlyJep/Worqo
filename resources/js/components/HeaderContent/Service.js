import React from 'react';
import { useNavigate } from 'react-router-dom';
import Headerz from './Headerz';
import Footer from '../FooterContent/footer';
import './../../../sass/components/Service.scss';
import searchIcon from '../../../sass/img/search.svg';
import image9 from '../../../sass/img/image 9.svg';
import image10 from '../../../sass/img/image 10.svg';
import image11 from '../../../sass/img/image 11.svg';
import image12 from '../../../sass/img/image 12.svg';
import image17 from '../../../sass/img/image 17.svg';
import image18 from '../../../sass/img/image 18.svg';
import image19 from '../../../sass/img/image 19.svg';
import image20 from '../../../sass/img/image 20.svg';
import image5 from '../../../sass/img/image 5.svg';
import image6 from '../../../sass/img/image 6.svg';
import image7 from '../../../sass/img/image 7.svg';
import image8 from '../../../sass/img/image 8.svg';
import pinkCollar from '../../../sass/img/pink.svg';
import whiteCollar from '../../../sass/img/white.svg';
import blueCollar from '../../../sass/img/blue.svg';

const Service = () => {
  const navigate = useNavigate();

  const handleViewWorkersClick = (serviceName, collar) => {
    if (collar === 'white') {
      navigate('/browse-white');
      return;
    }
    navigate(`/browse?service=${encodeURIComponent(serviceName)}`);
  };

  return (
    <div className="service-page">
      {/* Header Component */}
      <Headerz />
      
      {/* Main Service Content */}
      <main className="service-content">
        <div className="service-container">
          {/* Intro content inside wrapper */}
          <section className="service-intro">
            <h1 className="service-headline">Hands-On Talent, Tailored to Your Needs</h1>
            <p className="service-subtitle">Connect with workers who get the job done—skilled, service-based, or administrative.</p>

            <div className="hero-search">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search"
                  className="search-input"
                />
                <button className="search-button" aria-label="Search">
                  <img src={searchIcon} alt="Search" />
                </button>
              </div>
            </div>
          </section>

          {/* Section header with title (left) and filter (right) */}
          <div className="section-header">
            <h2 className="section-title">Browse Labor Categories</h2>
            <div className="filter-control">
              <select className="collar-select" defaultValue="all">
                <option value="all">All Collars</option>
                <option value="skilled">Skilled</option>
                <option value="service">Service-Based</option>
                <option value="admin">Administrative</option>
              </select>
            </div>
          </div>

          
          
          <div className="services-grid">
            {/* Additional: Original 4 services */}
            <div className="service-card">
              <div className="card-image">
                <img src={image5} alt="Plumbing Services" />
              </div>
              <h3>Plumbing Services</h3>
              <p>Comprehensive plumbing services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={blueCollar} alt="Blue collar" />
                <span className="badge-text">BLUE COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Plumbing Services')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image6} alt="Air Conditioning & Ventilation Services" />
              </div>
              <h3>Air Conditioning & Ventilation Services</h3>
              <p>Repairs, installations, and regular maintenance for AC and ventilation units.</p>
              <div className="service-badge">
                <img className="badge-icon" src={whiteCollar} alt="White collar" />
                <span className="badge-text">WHITE COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Air Conditioning & Ventilation Services', 'white')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image7} alt="Handyman Services" />
              </div>
              <h3>Handyman Services</h3>
              <p>General home fixes, installations, and small renovation assistance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={blueCollar} alt="Blue collar" />
                <span className="badge-text">BLUE COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Handyman Services')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image8} alt="Maid Services" />
              </div>
              <h3>Maid Services</h3>
              <p>Professional home and office cleaning by trusted and trained staff.</p>
              <div className="service-badge">
                <img className="badge-icon" src={pinkCollar} alt="Pink collar" />
                <span className="badge-text">PINK COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Maid Services')}>View Available Workers &gt;&gt;</button>
            </div>

            {/* Row 1 */}
            <div className="service-card">
              <div className="card-image">
                <img src={image9} alt="Machine Operators Services" />
              </div>
              <h3>Machine Operators Services</h3>
              <p>Comprehensive services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={blueCollar} alt="Blue collar" />
                <span className="badge-text">BLUE COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Machine Operators Services')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image10} alt="Carpentry & Woodworks Services" />
              </div>
              <h3>Carpentry & Woodworks Services</h3>
              <p>Comprehensive services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={blueCollar} alt="Blue collar" />
                <span className="badge-text">BLUE COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Carpentry & Woodworks Services')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image11} alt="Gardening Services" />
              </div>
              <h3>Gardening Services</h3>
              <p>Comprehensive services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={blueCollar} alt="Blue collar" />
                <span className="badge-text">BLUE COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Gardening Services')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image12} alt="Caregiver Services" />
              </div>
              <h3>Caregiver Services</h3>
              <p>Comprehensive services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={pinkCollar} alt="Pink collar" />
                <span className="badge-text">PINK COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Caregiver Services')}>View Available Workers &gt;&gt;</button>
            </div>

            {/* Row 2 */}
            <div className="service-card">
              <div className="card-image">
                <img src={image17} alt="Waiter / Waitress / Service Crew" />
              </div>
              <h3>Waiter / Waitress / Service Crew</h3>
              <p>Comprehensive services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={pinkCollar} alt="Pink collar" />
                <span className="badge-text">PINK COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Waiter / Waitress / Service Crew')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image18} alt="Content Creator / Writer" />
              </div>
              <h3>Content Creator / Writer</h3>
              <p>Comprehensive services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={whiteCollar} alt="White collar" />
                <span className="badge-text">WHITE COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Content Creator / Writer', 'white')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image19} alt="Makeup Artist Services" />
              </div>
              <h3>Makeup Artist Services</h3>
              <p>Comprehensive services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={pinkCollar} alt="Pink collar" />
                <span className="badge-text">PINK COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('Makeup Artist Services')}>View Available Workers &gt;&gt;</button>
            </div>

            <div className="service-card">
              <div className="card-image">
                <img src={image20} alt="IT Support / Helpdesk Services" />
              </div>
              <h3>IT Support / Helpdesk Services</h3>
              <p>Comprehensive services for repairs, installations, and maintenance.</p>
              <div className="service-badge">
                <img className="badge-icon" src={whiteCollar} alt="White collar" />
                <span className="badge-text">WHITE COLLAR</span>
              </div>
              <button className="service-cta-btn" onClick={() => handleViewWorkersClick('IT Support / Helpdesk Services', 'white')}>View Available Workers &gt;&gt;</button>
            </div>
          </div>
          
          {false && (
            <div className="service-cta">
              <h2>Need a Service?</h2>
              <p>Find qualified professionals in your area to get the job done right.</p>
              <button className="cta-button">Find Services</button>
            </div>
          )}
        </div>
      </main>

      {/* Show More button under the services grid */}
      <div className="show-more-wrap">
            <button type="button" className="show-more-btn">Show More</button>
          </div>
      
      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default Service;
