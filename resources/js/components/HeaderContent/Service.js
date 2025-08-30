import React, { useState } from 'react';
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
  const [selectedCollar, setSelectedCollar] = useState('all');
  const [visibleCount, setVisibleCount] = useState(8);

  const services = [
    {
      name: 'Plumbing Services',
      description: 'Comprehensive plumbing services for repairs, installations, and maintenance.',
      image: image5,
      collar: 'blue',
    },
    {
      name: 'Air Conditioning & Ventilation Services',
      description: 'Repairs, installations, and regular maintenance for AC and ventilation units.',
      image: image6,
      collar: 'white',
    },
    {
      name: 'Handyman Services',
      description: 'General home fixes, installations, and small renovation assistance.',
      image: image7,
      collar: 'blue',
    },
    {
      name: 'Maid Services',
      description: 'Professional home and office cleaning by trusted and trained staff.',
      image: image8,
      collar: 'pink',
    },
    {
      name: 'Machine Operators Services',
      description: 'Comprehensive services for repairs, installations, and maintenance.',
      image: image9,
      collar: 'blue',
    },
    {
      name: 'Carpentry & Woodworks Services',
      description: 'Comprehensive services for repairs, installations, and maintenance.',
      image: image10,
      collar: 'blue',
    },
    {
      name: 'Gardening Services',
      description: 'Comprehensive services for repairs, installations, and maintenance.',
      image: image11,
      collar: 'blue',
    },
    {
      name: 'Caregiver Services',
      description: 'Comprehensive services for repairs, installations, and maintenance.',
      image: image12,
      collar: 'pink',
    },
    {
      name: 'Waiter / Waitress / Service Crew',
      description: 'Comprehensive services for repairs, installations, and maintenance.',
      image: image17,
      collar: 'pink',
    },
    {
      name: 'Content Creator / Writer',
      description: 'Comprehensive services for repairs, installations, and maintenance.',
      image: image18,
      collar: 'white',
    },
    {
      name: 'Makeup Artist Services',
      description: 'Comprehensive services for repairs, installations, and maintenance.',
      image: image19,
      collar: 'pink',
    },
    {
      name: 'IT Support / Helpdesk Services',
      description: 'Comprehensive services for repairs, installations, and maintenance.',
      image: image20,
      collar: 'white',
    },
  ];

  const filteredServices = selectedCollar === 'all'
    ? services
    : services.filter(service => service.collar === selectedCollar);

  const visibleServices = filteredServices.slice(0, visibleCount);

  const handleViewWorkersClick = (serviceName, collar) => {
    if (collar === 'white') {
      navigate('/browse-white');
      return;
    }
    navigate(`/browse?service=${encodeURIComponent(serviceName)}`);
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 4);
  };

  return (
    <div className="service-page">
      <Headerz />
      <main className="service-content">
        <div className="service-container">
          <section className="service-intro">
            <h1 className="service-headline">Hands-On Talent, Tailored to Your Needs</h1>
            <p className="service-subtitle">
              Connect with workers who get the job done—skilled, service-based, or administrative.
            </p>
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

          <div className="section-header">
            <h2 className="section-title">Browse Labor Categories</h2>
            <div className="filter-control">
              <select
                className="collar-select"
                value={selectedCollar}
                onChange={(e) => setSelectedCollar(e.target.value)}
              >
                <option value="all">All Collars</option>
                <option value="blue">Blue Collar</option>
                <option value="white">White Collar</option>
                <option value="pink">Pink Collar</option>
              </select>
            </div>
          </div>

          <div className="services-grid">
            {visibleServices.map((service, index) => (
              <div className="service-card" key={index}>
                <div className="card-image">
                  <img src={service.image} alt={service.name} />
                </div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-badge">
                  <img
                    className="badge-icon"
                    src={
                      service.collar === 'blue'
                        ? blueCollar
                        : service.collar === 'white'
                        ? whiteCollar
                        : pinkCollar
                    }
                    alt={`${service.collar} collar`}
                  />
                  <span className="badge-text">
                    {service.collar.toUpperCase()} COLLAR
                  </span>
                </div>
                <button
                  className="service-cta-btn"
                  onClick={() => handleViewWorkersClick(service.name, service.collar)}
                >
                  View Available Workers &gt;&gt;
                </button>
              </div>
            ))}
          </div>

          <div className="show-more-wrap">
            <button
              type="button"
              className="show-more-btn"
              onClick={handleShowMore}
              disabled={visibleCount >= filteredServices.length}
            >
              {visibleCount >= filteredServices.length ? 'Nothing more' : 'Show More'}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Service;