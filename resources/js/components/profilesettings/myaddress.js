import React, { useState } from 'react';
import { FaPlus, FaArchive } from 'react-icons/fa';
import ModalAddress from './modaladdress';
import '../../../sass/components/profilesettings/myaddress.scss';

const MyAddress = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      firstName: 'Jemima',
      lastName: 'Soliano',
      zipCode: '8006',
      province: 'Agusan Del Norte',
      city: 'Butuan City',
      street: 'Purok 1 Bonbon, Libertad',
      country: 'Philippines',
      phoneNumber: '095069982143',
      isDefault: true
    }
  ]);

  const handleAddAddress = (newAddress) => {
    if (editingAddress) {
      // Update existing address
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id 
          ? { ...addr, ...newAddress }
          : addr
      ));
    } else {
      // Add new address
      const address = {
        id: addresses.length + 1,
        ...newAddress
      };
      setAddresses([...addresses, address]);
    }
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleEditAddress = (id) => {
    const addressToEdit = addresses.find(addr => addr.id === id);
    if (addressToEdit) {
      setEditingAddress(addressToEdit);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleArchiveAddress = (id) => {
    // Handle archive functionality
    setAddresses(addresses.filter(address => address.id !== id));
  };

  const handleSetDefault = (id) => {
    // Set the clicked address as default and remove default from others
    setAddresses(addresses.map(address => ({
      ...address,
      isDefault: address.id === id
    })));
  };

  return (
    <div className="my-address-container">
      <div className="address-header">
        <h2 className="address-title">My Addresses</h2>
        <button 
          className="add-address-btn"
          onClick={() => {
            setEditingAddress(null);
            setIsModalOpen(true);
          }}
        >
          <FaPlus className="btn-icon" />
          Add New Address
        </button>
      </div>

      <div className="address-list">
        {addresses.map((address) => (
          <div 
            key={address.id} 
            className={`address-card ${address.isDefault ? 'default-address' : ''}`}
            onClick={() => handleSetDefault(address.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="address-content">
              <div className="address-name">
                {address.firstName} {address.lastName}
                {address.zipCode && <span className="zip-code">, {address.zipCode}</span>}
              </div>
              <div className="address-details">
                {address.province && <div className="address-line">{address.province}</div>}
                {address.city && <div className="address-line">{address.city}</div>}
                {address.street && <div className="address-line">{address.street}</div>}
                {address.country && <div className="address-line">{address.country}</div>}
                {address.fullAddress && <div className="address-line">{address.fullAddress}</div>}
                {address.phoneNumber && <div className="address-phone">{address.phoneNumber}</div>}
                {address.isDefault && <div className="default-badge">Default Address</div>}
              </div>
            </div>
            <div className="address-actions">
              <button 
                className="edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAddress(address.id);
                }}
              >
                <img src="/images/editprof.svg" alt="Edit" className="action-icon" />
                Edit
              </button>
              <button 
                className="archive-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchiveAddress(address.id);
                }}
              >
                <FaArchive className="action-icon" />
                Archive
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ModalAddress
          onClose={handleCloseModal}
          onAddAddress={handleAddAddress}
          editingAddress={editingAddress}
        />
      )}
    </div>
  );
};

export default MyAddress;
