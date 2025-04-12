import React from 'react';
import './../../../sass/components/HomepageStyles/product_grid.scss';
import PhoneImage from '../../../../resources/sass/img/HomepageImgs/ios16.svg';
import KeyboardImage from '../../../../resources/sass/img/HomepageImgs/keyb.svg';
import JacketImage from '../../../../resources/sass/img/HomepageImgs/blazer.svg';
import ShoesImage from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';

const ProductGrid = () => {
  const products = [
    { id: 1, name: 'Iphone 16 Space Black', price: '₱2,000', image: PhoneImage },
    { id: 2, name: 'Attack Shark XY Keyboard', price: '₱2,000', image: KeyboardImage },
    { id: 3, name: 'Dior v2 Blazer', price: '₱2,000', image: JacketImage },
    { id: 4, name: 'Jordan Royal Blue', price: '₱2,000', image: ShoesImage },
    { id: 5, name: 'Iphone 16 Space Black', price: '₱2,000', image: PhoneImage },
    { id: 6, name: 'Attack Shark XY Keyboard', price: '₱2,000', image: KeyboardImage },
    { id: 7, name: 'Dior v2 Blazer', price: '₱2,000', image: JacketImage },
    { id: 8, name: 'Jordan Royal Blue', price: '₱2,000', image: ShoesImage },
  ];

  return (
    <div className="product-grid-container">
      <div className="product-grid">
        <h2 className="grid-title">Featured Listings</h2>
        <div className="grid-container">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-top">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                />
              </div>
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">{product.price}</div>
                <div className="button-container">
                  <button className="add-to-cart">add to cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;