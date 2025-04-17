import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './../../../sass/components/order_complete.scss';
import OrderSuccess from '../../../../resources/sass/img/OrderCompleteAssets/order_completed.svg'; // Adjust path as needed
import Headerz from '../HeaderContent/Headerz';

const Complete = () => {
  const navigate = useNavigate(); // Hook for navigation

  // Function to handle button click and redirect to Browse page
  const handleContinueShopping = () => {
    navigate('/browse'); // Redirect to the Browse page
  };

  return ( 
    <div className="order-success-container">
      <Headerz />
      {/* Illustration Section */}
      <div className="OrderSuccess">
        <img src={OrderSuccess} alt="Order Success Illustration" className="order-success-img" />
      </div>

      {/* Text Section */}
      <div className="success-message">
        <p>
          Thanks for your order! We’re on it and will send you a confirmation soon. Questions? Just let us know!
        </p>
      </div>

      {/* Button Section */}
      <button className="continue-shopping-btn" onClick={handleContinueShopping}>
        Continue to Shopping
      </button>
    </div>
  );
};

export default Complete;