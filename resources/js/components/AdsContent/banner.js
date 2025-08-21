import React, { useState, useEffect } from 'react';
import './../../../sass/components/banner.scss';

// Use the provided hero image
import heroImage from '../../../../resources/sass/img/Rectangle 9721.svg';

const banners = [
  { src: heroImage, alt: 'Hero' },
];

const Banner = () => {
  const [currentBanner, setCurrentBanner] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleDotClick = (index) => {
    setCurrentBanner(index);
  };

  return (
    <div className="banner-container">
      <div className="banner-slider">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`banner-slide ${index === currentBanner ? 'active' : ''}`}
          >
            <img src={banner.src} alt={banner.alt} className="banner-image" />
          </div>
        ))}
      </div>
      <div className="banner-dots">
        {banners.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentBanner ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;