import React from 'react';
import './../../../sass/components/ShopGrids_Styles/all_list.scss';
import PhoneImage from '../../../../resources/sass/img/HomepageImgs/ios16.svg';
import KeyboardImage from '../../../../resources/sass/img/HomepageImgs/keyb.svg';
import JacketImage from '../../../../resources/sass/img/HomepageImgs/blazer.svg';
import ShoesImage from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';

const AllListing = () => {
  const listings = [
    { id: 1, name: 'Iphone 16 Space Black', price: '₱2,000', image: PhoneImage },
    { id: 2, name: 'Attack Shark XY Keyboard', price: '₱2,000', image: KeyboardImage },
    { id: 3, name: 'Dior v2 Blazer', price: '₱2,000', image: JacketImage },
    { id: 4, name: 'Jordan Royal Blue', price: '₱2,000', image: ShoesImage },
    { id: 5, name: 'Iphone 16 Space Black', price: '₱2,000', image: PhoneImage },
    { id: 6, name: 'Attack Shark XY Keyboard', price: '₱2,000', image: KeyboardImage },
    { id: 7, name: 'Dior v2 Blazer', price: '₱2,000', image: JacketImage },
    { id: 8, name: 'Jordan Royal Blue', price: '₱2,000', image: ShoesImage },
    // New product added for the second row
    { id: 9, name: 'Iphone 16 Space Black', price: '₱2,000', image: PhoneImage }, // Reusing PhoneImage for now
  ];

  return (
    <div className="all-listing-wrapper">
      <div className="all-listing-grid">
        {listings.map((listing) => (
          <div key={listing.id} className="listing-item">
            <div className="listing-image-section">
              <img
                src={listing.image}
                alt={listing.name}
                className="listing-image"
              />
            </div>
            <div className="listing-info">
              <h3 className="listing-title">{listing.name}</h3>
              <div className="listing-price">{listing.price}</div>
              <div className="listing-action">
                <button className="add-to-cart-btn">add to cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllListing;