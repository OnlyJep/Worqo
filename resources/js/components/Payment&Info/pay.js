import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './../../../sass/components/pay.scss';
import productImage from '../../../../resources/sass/img/HomepageImgs/sneakers.svg';
import gcashImage from '../../../../resources/sass/img/gcash.svg';
import Headerz from '../HeaderContent/Headerz';
import Footer from '../FooterContent/footer';

const Pay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const gcashSectionRef = useRef(null);

  const { cartItems = [], subtotal = 0, address = {} } = location.state || {};

  const [billingDetails, setBillingDetails] = useState({
    firstName: '',
    lastName: '',
    country: address.country || 'Philippines',
    streetAddress: address.streetAddress || '',
    townCity: address.city || '',
    state: address.state || '',
    mobilePhone: '',
    orderNotes: '',
  });

  const [visibleSections, setVisibleSections] = useState({
    creditCard: false,
    cashOnDelivery: false,
    gcash: false,
    pickUp: false,
  });

  const [pickUpPaymentMethod, setPickUpPaymentMethod] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const [creditCardDetails, setCreditCardDetails] = useState({
    nameOnCard: '',
    cardNumber: '',
    expirationDate: '',
    securityCode: '',
  });

  const statesByCountry = {
    Philippines: ['Agusan Del Norte', 'Cebu', 'Davao del Sur'],
    US: ['California', 'Texas', 'New York'],
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingDetails((prev) => {
      const updatedDetails = { ...prev, [name]: value };
      if (name === 'country') {
        updatedDetails.state = statesByCountry[value][0];
      }
      return updatedDetails;
    });
  };

  const handleCreditCardChange = (e) => {
    const { name, value } = e.target;
    setCreditCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSection = (section) => {
    setVisibleSections((prev) => {
      const newState = {
        creditCard: false,
        cashOnDelivery: false,
        gcash: false,
        pickUp: false,
      };
      if (!prev[section]) {
        newState[section] = true;
      }
      return newState;
    });
    if (section !== 'pickUp') {
      setPickUpPaymentMethod(null);
    }
  };

  const handlePickUpOption = (option) => {
    setPickUpPaymentMethod(option);
    if (option === 'payOnline') {
      setVisibleSections((prev) => ({
        ...prev,
        creditCard: false,
        cashOnDelivery: false,
        gcash: true,
        pickUp: true,
      }));
      setShowPopup(true);
      if (gcashSectionRef.current) {
        gcashSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (visibleSections.pickUp && pickUpPaymentMethod === 'payOnline' && !visibleSections.gcash) {
      alert('Please select GCash to complete your payment for "Pay Online".');
      return;
    }
    console.log('Order placed:', {
      billingDetails,
      visibleSections,
      pickUpPaymentMethod,
      creditCardDetails,
      cartItems,
    });
    navigate('/complete', {
      state: {
        cartItems,
        subtotal,
        address: billingDetails,
      },
    });
  };

  const orderSummary = {
    products: cartItems.length > 0 ? cartItems : [
      {
        name: 'Jordan Royal Blue',
        price: 2620,
        quantity: 1,
        image: productImage,
      },
    ],
    shippingFee: visibleSections.pickUp ? 0 : 80,
    subtotal: subtotal || 2620,
    total: (subtotal || 2620) + (visibleSections.pickUp ? 0 : 80),
  };

  return (
    <div className="pay-view">
      <Headerz />
      <div className="pay-content">
        <h1 className="pay-title">Checkout</h1>

        <div className="pay-container">
          <div className="billing-details">
            <h2 className="section-title">Billing Details</h2>
            <form className="billing-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={billingDetails.firstName}
                    onChange={handleBillingChange}
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={billingDetails.lastName}
                    onChange={handleBillingChange}
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="country">Country / Region</label>
                <select
                  id="country"
                  name="country"
                  value={billingDetails.country}
                  onChange={handleBillingChange}
                  required
                >
                  <option value="Philippines">Philippines</option>
                  <option value="US">United States</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="streetAddress">Street address</label>
                <input
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  value={billingDetails.streetAddress}
                  onChange={handleBillingChange}
                  placeholder="House number and Street name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="townCity">Town / City</label>
                <input
                  type="text"
                  id="townCity"
                  name="townCity"
                  value={billingDetails.townCity}
                  onChange={handleBillingChange}
                  placeholder="Town or City"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State / County</label>
                <select
                  id="state"
                  name="state"
                  value={billingDetails.state}
                  onChange={handleBillingChange}
                  required
                >
                  {statesByCountry[billingDetails.country].map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="mobilePhone">Mobile Phone</label>
                <input
                  type="tel"
                  id="mobilePhone"
                  name="mobilePhone"
                  value={billingDetails.mobilePhone}
                  onChange={handleBillingChange}
                  placeholder="Mobile Phone"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="orderNotes">Order notes (optional)</label>
                <textarea
                  id="orderNotes"
                  name="orderNotes"
                  value={billingDetails.orderNotes}
                  onChange={handleBillingChange}
                  placeholder="Notes about your order, e.g. special notes for delivery."
                  rows="4"
                />
              </div>
            </form>
          </div>

          <div className="order-summary">
            <div className="order-section">
              <h2 className="section-title">Your Order</h2>
              {orderSummary.products.map((product, index) => (
                <div className="order-item" key={index}>
                  <img
                    src={product.image || productImage}
                    alt={product.name}
                    className="product-image"
                  />
                  <div className="product-details">
                    <div className="product-name">{product.name}</div>
                    <div className="product-quantity">
                      Qty: {product.quantity}
                    </div>
                  </div>
                </div>
              ))}

              <div className="summary-row">
                <span className="summary-label">Estimated shipping fee</span>
                <span className="summary-value">
                  ₱{orderSummary.shippingFee.toLocaleString()}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">
                  ₱{orderSummary.subtotal.toLocaleString()}
                </span>
              </div>

              <div className="summary-row total">
                <span className="summary-label">Total</span>
                <span className="summary-value">
                  ₱{orderSummary.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="payment-section">
              <h2 className="section-title">Payment Method</h2>
              <div className="payment-options">
                <button
                  className={`payment-option-btn ${
                    visibleSections.creditCard ? 'active' : ''
                  }`}
                  onClick={() => toggleSection('creditCard')}
                >
                  Credit Card
                </button>
                {visibleSections.creditCard && (
                  <div className="credit-card-form">
                    <div className="form-group">
                      <label htmlFor="nameOnCard">Name on card</label>
                      <input
                        type="text"
                        id="nameOnCard"
                        name="nameOnCard"
                        value={creditCardDetails.nameOnCard}
                        onChange={handleCreditCardChange}
                        placeholder="Name on card"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cardNumber">Card Number</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={creditCardDetails.cardNumber}
                        onChange={handleCreditCardChange}
                        placeholder="Card Number"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="expirationDate">
                          Expiration Date (MM / YY)
                        </label>
                        <input
                          type="text"
                          id="expirationDate"
                          name="expirationDate"
                          value={creditCardDetails.expirationDate}
                          onChange={handleCreditCardChange}
                          placeholder="MM / YY"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="securityCode">Security Code</label>
                        <input
                          type="text"
                          id="securityCode"
                          name="securityCode"
                          value={creditCardDetails.securityCode}
                          onChange={handleCreditCardChange}
                          placeholder="Security Code"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  className={`payment-option-btn ${
                    visibleSections.cashOnDelivery ? 'active' : ''
                  }`}
                  onClick={() => toggleSection('cashOnDelivery')}
                >
                  Cash on Delivery
                </button>
                {visibleSections.cashOnDelivery && (
                  <div className="cash-on-delivery-info">
                    <p>Please prepare the exact amount for delivery.</p>
                  </div>
                )}

                <button
                  className={`payment-option-btn ${
                    visibleSections.gcash ? 'active' : ''
                  }`}
                  onClick={() => toggleSection('gcash')}
                >
                  GCash
                </button>
                <div ref={gcashSectionRef} className="gcash-section">
                  {visibleSections.gcash && (
                    <div className="gcash-payment">
                      <div className="qr-code">
                        <img src={gcashImage} alt="GCash QR Code" />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className={`payment-option-btn ${
                    visibleSections.pickUp ? 'active' : ''
                  }`}
                  onClick={() => toggleSection('pickUp')}
                >
                  Pick Up
                </button>
                {visibleSections.pickUp && (
                  <div className="pick-up-options">
                    <div className="pick-up-buttons">
                      <button
                        className={`pick-up-option-btn ${
                          pickUpPaymentMethod === 'payInPerson' ? 'active' : ''
                        }`}
                        onClick={() => handlePickUpOption('payInPerson')}
                      >
                        Pay in Person
                      </button>
                      <button
                        className={`pick-up-option-btn ${
                          pickUpPaymentMethod === 'payOnline' ? 'active' : ''
                        }`}
                        onClick={() => handlePickUpOption('payOnline')}
                      >
                        Pay Online
                      </button>
                    </div>
                    {pickUpPaymentMethod === 'payInPerson' && (
                      <div className="pick-up-info">
                        <p>Payment will be collected upon pick-up.</p>
                      </div>
                    )}
                    {pickUpPaymentMethod === 'payOnline' && (
                      <div className="pick-up-info">
                        <p>
                          You will be redirected to GCash payment to complete
                          your order.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="place-order-btn"
                onClick={handleSubmit}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Payment Required</h3>
            <p>Please complete your payment via GCash to proceed with your order.</p>
            <button className="popup-close-btn" onClick={closePopup}>
              Got It
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Pay;