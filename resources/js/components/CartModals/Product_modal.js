import React from 'react';
import './../../../sass/components/Product_modal.scss';
import { IconX } from '@tabler/icons-react';

const ProductModal = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="productview-modal-overlay">
      <div className="productview-modal-content">
        <button className="productview-modal-close-button" onClick={onClose}>
          <IconX size={24} />
        </button>
        
        <div className="productview-modal-product-section">
          <div className="productview-modal-product-image">
            <img src={product.image} alt={product.name} />
          </div>
          <div className="productview-modal-product-details">
            <div className="productview-modal-seller-info">Seller: Alexander Otaza</div>
            <h1 className="productview-modal-title">{product.name}</h1>
            <div className="productview-modal-price">₱65,000</div>
            
            <div className="productview-modal-specs">
              <div className="productview-modal-spec-item">
                <span className="productview-modal-spec-name">Display:</span>
                <span className="productview-modal-spec-value">6.1-inch Super Retina XDR</span>
              </div>
              <div className="productview-modal-spec-item">
                <span className="productview-modal-spec-name">Chip:</span>
                <span className="productview-modal-spec-value">A18 Bionic</span>
              </div>
              <div className="productview-modal-spec-item">
                <span className="productview-modal-spec-name">Camera:</span>
                <span className="productview-modal-spec-value">Dual 48MP + 12MP</span>
              </div>
              <div className="productview-modal-spec-item">
                <span className="productview-modal-spec-name">Storage:</span>
                <span className="productview-modal-spec-value">128GB</span>
              </div>
            </div>
            
            <div className="productview-modal-action-buttons">
              <button className="productview-modal-buy-now">Buy now</button>
              <button className="productview-modal-add-to-cart">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;