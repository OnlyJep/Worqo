import React, { useState, useEffect } from 'react';
import './../../../sass/components/banner.scss';

// Updated image imports with your provided file paths
import bannerOne from '../../../../resources/sass/img/BannerAssets/banner_one.svg';
import bannerTwo from '../../../../resources/sass/img/BannerAssets/main_banner.svg';
import bannerThree from '../../../../resources/sass/img/BannerAssets/fiesta.svg';

const banners = [
  { src: bannerOne, alt: 'Banner 1' },
  { src: bannerTwo, alt: 'Banner 2' },
  { src: bannerThree, alt: 'Banner 3' },
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