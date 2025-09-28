import React, { useState, useEffect } from 'react';
import '../../../sass/components/profilesettings/modaladdress.scss';

const ModalAddress = ({ onClose, onAddAddress, editingAddress, userProfile }) => {
  const [formData, setFormData] = useState({
    street: '',
    contact_number: '',
    postal_code: '8600' // Fixed value
  });

  // Update form data when editingAddress changes
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        street: editingAddress.street || '',
        contact_number: editingAddress.contact_number || '',
        postal_code: '8600' // Fixed value
      });
    } else {
      setFormData({
        street: userProfile?.street || '',
        contact_number: userProfile?.contact_number || '',
        postal_code: '8600' // Fixed value
      });
    }
  }, [editingAddress, userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value // Convert empty string to null for suffix_id
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.street && formData.contact_number) {
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
          {/* Full Name */}
          <div className="address-form-row">
            <div className="address-form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={`${userProfile?.first_name || ''} ${userProfile?.middlename || ''} ${userProfile?.last_name || ''} ${userProfile?.suffix?.suffix_name || ''}`.trim()}
                readOnly
                className="readonly-input"
              />
            </div>
          </div>

          {/* Contact Number */}
          <div className="address-form-row">
            <div className="address-form-group">
              <label htmlFor="contact_number">Contact Number</label>
              <input
                type="tel"
                id="contact_number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                placeholder="Enter contact number"
                required
              />
            </div>
          </div>

          {/* Street */}
          <div className="address-form-row">
            <div className="address-form-group">
              <label htmlFor="street">Street</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Enter street address"
                required
              />
            </div>
          </div>

          {/* Province */}
          <div className="address-form-row">
            <div className="address-form-group">
              <label>Province</label>
              <input
                type="text"
                value="Agusan Del Norte"
                readOnly
                className="readonly-input"
              />
            </div>
          </div>

          {/* City */}
          <div className="address-form-row">
            <div className="address-form-group">
              <label>City</label>
              <input
                type="text"
                value="Butuan City"
                readOnly
                className="readonly-input"
              />
            </div>
          </div>

          {/* Postal Code */}
          <div className="address-form-row">
            <div className="address-form-group">
              <label>Postal Code</label>
              <input
                type="text"
                value="8600"
                readOnly
                className="readonly-input"
              />
            </div>
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
