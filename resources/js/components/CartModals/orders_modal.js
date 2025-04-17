import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../sass/components/orders_modal.scss';
import { IconSquareRoundedX } from '@tabler/icons-react';
import productImage from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';

const OrdersModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Attack Shark Three Modes 8K Gaming Mouse',
      price: 2000,
      quantity: 1,
      image: productImage,
    },
    {
      id: 2,
      name: 'Attack Shark Three Modes 8K Gaming Mouse',
      price: 2000,
      quantity: 1,
      image: productImage,
    },
  ]);

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleDecreaseQuantity = (id) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleIncreaseQuantity = (id) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    navigate('/pay');
    onClose();
  };

  const handleViewCart = () => {
    navigate('/cart');
    onClose();
  };

  return (
    <div className={`cart-modal ${isOpen ? 'open' : ''}`}>
      <div className="cart-modal-content">
        <div className="cart-header">
          <div className="cart-title">
            <h2>Cart</h2>
            <span className="cart-count">{totalItemCount}</span>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-image" />
              <div className="cart-item-details">
                <h3>{item.name}</h3>
                <p className="price">₱{item.price.toLocaleString()}</p>
                <div className="quantity-controls">
                  <button
                    onClick={() => handleDecreaseQuantity(item.id)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleIncreaseQuantity(item.id)}>
                    +
                  </button>
                </div>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <IconSquareRoundedX size={30} /> {/* Increased from 16 to 20 */}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-footer">
          <p className="shipping-note">Shipping will be calculated at checkout</p>
          <p className="total-price">
            Total Price: <span>₱{totalPrice.toLocaleString()} PHP</span>
          </p>
          <div className="cart-actions">
            <button
              className="view-cart-button secondary"
              onClick={handleViewCart}
            >
              View cart
            </button>
            <button
              className="view-cart-button primary"
              onClick={handleCheckout}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersModal;