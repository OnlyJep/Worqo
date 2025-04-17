import React, { useState } from 'react';
import './../../../sass/components/ShopGrids_Styles/all_list.scss';
import PhoneImage from '../../../../resources/sass/img/HomepageImgs/ios16.svg';
import KeyboardImage from '../../../../resources/sass/img/HomepageImgs/keyb.svg';
import JacketImage from '../../../../resources/sass/img/HomepageImgs/blazer.svg';
import ShoesImage from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';
import ProductModal from '../CartModals/Product_modal';

const AllListing = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const listings = [
    {
      id: 1,
      name: 'Iphone 16 Space Black',
      price: '₱65,000',
      image: PhoneImage,
      seller: 'Alexander Otaza',
      specs: {
        display: '6.1-inch Super Retina XDR',
        chip: 'A18 Bionic',
        camera: 'Dual 48MP + 12MP',
        storage: '128GB',
      },
    },
    {
      id: 2,
      name: 'Mechanical Keyboard',
      price: '₱5,000',
      image: KeyboardImage,
      seller: 'Jane Doe',
      specs: {
        type: 'Mechanical',
        switches: 'Cherry MX Blue',
        backlighting: 'RGB',
        connectivity: 'USB-C',
      },
    },
    {
      id: 3,
      name: 'Designer Blazer',
      price: '₱8,000',
      image: JacketImage,
      seller: 'John Smith',
      specs: {
        material: 'Wool Blend',
        size: 'Medium',
        color: 'Navy Blue',
        fit: 'Slim',
      },
    },
    {
      id: 4,
      name: 'Sneakers',
      price: '₱4,500',
      image: ShoesImage,
      seller: 'Emma Wilson',
      specs: {
        material: 'Leather',
        size: 'US 9',
        color: 'White',
        brand: 'Trendy',
      },
    },
    {
      id: 5,
      name: 'Iphone 16 Pro',
      price: '₱75,000',
      image: PhoneImage,
      seller: 'Michael Brown',
      specs: {
        display: '6.3-inch Super Retina XDR',
        chip: 'A18 Pro',
        camera: 'Triple 48MP + 12MP + 12MP',
        storage: '256GB',
      },
    },
    {
      id: 6,
      name: 'Mechanical Keyboard',
      price: '₱5,000',
      image: KeyboardImage,
      seller: 'Jane Doe',
      specs: {
        type: 'Mechanical',
        switches: 'Cherry MX Blue',
        backlighting: 'RGB',
        connectivity: 'USB-C',
      },
    },
    {
      id: 7,
      name: 'Designer Blazer',
      price: '₱8,000',
      image: JacketImage,
      seller: 'John Smith',
      specs: {
        material: 'Wool Blend',
        size: 'Medium',
        color: 'Navy Blue',
        fit: 'Slim',
      },
    },
    {
      id: 8,
      name: 'Sneakers',
      price: '₱4,500',
      image: ShoesImage,
      seller: 'Emma Wilson',
      specs: {
        material: 'Leather',
        size: 'US 9',
        color: 'White',
        brand: 'Trendy',
      },
    },
    {
      id: 9,
      name: 'Iphone 16 Space Black',
      price: '₱65,000',
      image: PhoneImage,
      seller: 'Alexander Otaza',
      specs: {
        display: '6.1-inch Super Retina XDR',
        chip: 'A18 Bionic',
        camera: 'Dual 48MP + 12MP',
        storage: '128GB',
      },
    },
  ];

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="all-listing-wrapper">
      <div className="all-listing-grid">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="listing-item"
            onClick={() => handleProductClick(listing)}
          >
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
                <button
                  className="add-to-cart-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  add to cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={closeModal} />
      )}
    </div>
  );
};

export default AllListing;