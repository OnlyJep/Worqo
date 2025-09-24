import React, { useState } from 'react';
import '../../../sass/components/profilesettings/modaladdress.scss';

const ModalAddress = ({ onClose, onAddAddress, editingAddress }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    zipCode: '',
    phoneNumber: '',
    city: '',
    province: '',
    street: '',
    fullAddress: '',
    isDefault: false
  });

  // Update form data when editingAddress changes
  React.useEffect(() => {
    if (editingAddress) {
      setFormData({
        firstName: editingAddress.firstName || '',
        lastName: editingAddress.lastName || '',
        zipCode: editingAddress.zipCode || '',
        phoneNumber: editingAddress.phoneNumber || '',
        city: editingAddress.city || '',
        province: editingAddress.province || '',
        street: editingAddress.street || '',
        fullAddress: editingAddress.fullAddress || '',
        isDefault: editingAddress.isDefault || false
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        zipCode: '',
        phoneNumber: '',
        city: '',
        province: '',
        street: '',
        fullAddress: '',
        isDefault: false
      });
    }
  }, [editingAddress]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.firstName && formData.lastName && formData.phoneNumber && formData.city) {
      onAddAddress(formData);
    }
  };

  return (
    <div className="address-modal-overlay" onClick={onClose}>
      <div className="address-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="address-modal-header">
          <h2 className="address-modal-title">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button className="address-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="address-modal-form">
          <div className="address-form-row">
            <div className="address-form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="address-form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="address-form-row">
            <div className="address-form-group">
              <label htmlFor="zipCode">Zip Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
              />
            </div>
            <div className="address-form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="address-form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="address-form-group">
            <label htmlFor="province">Province</label>
            <input
              type="text"
              id="province"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
            />
          </div>

          <div className="address-form-group">
            <label htmlFor="street">Street</label>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
            />
          </div>

          <div className="address-form-group">
            <label htmlFor="fullAddress">Full Address</label>
            <input
              type="text"
              id="fullAddress"
              name="fullAddress"
              value={formData.fullAddress}
              onChange={handleInputChange}
            />
          </div>

          <div className="address-form-group address-checkbox-group">
            <label className="address-checkbox-label">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
              />
              <span className="address-checkmark"></span>
              Set as default address
            </label>
          </div>

          <div className="address-modal-buttons">
            <button type="button" className="address-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="address-add-btn">
              {editingAddress ? 'Update Address' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAddress;
