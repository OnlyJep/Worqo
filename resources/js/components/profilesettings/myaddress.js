import React, { useState, useEffect } from 'react';
import { FaPlus, FaArchive } from 'react-icons/fa';
import { message } from 'antd';
import ModalAddress from './modaladdress';
import '../../../sass/components/profilesettings/myaddress.scss';

const MyAddress = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState({
    id: null,
    first_name: '',
    middlename: '',
    last_name: '',
    suffix_id: null,
    street: '',
    contact_number: '',
    // Fixed address fields
    city: 'Butuan City',
    province: 'Agusan Del Norte',
    postal_code: '8600',
    country: 'Philippines'
  });

  // Load user profile data on component mount
  useEffect(() => {
    loadUserAddress();
  }, []);

  const loadUserAddress = async () => {
    try {
      setLoading(true);
      const localStorageData = JSON.parse(localStorage.getItem("user") || '{}');
      
      // Handle both direct user data and wrapped user data
      const userData = localStorageData.user || localStorageData;
      
      if (userData.id) {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`${window.location.origin}/api/users/${userData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          
          // Handle both direct response and wrapped response
          const profileData = responseData.user || responseData;
          
          const addressData = {
            id: profileData.id,
            first_name: profileData.first_name || '',
            middlename: profileData.middlename || '',
            last_name: profileData.last_name || '',
            suffix_id: profileData.suffix_id || null,
            street: profileData.street || '',
            contact_number: profileData.contact_number || '',
            city: profileData.city || 'Butuan City',
            province: profileData.province || 'Agusan Del Norte',
            postal_code: profileData.postal_code || '8600',
            country: profileData.country || 'Philippines'
          };
          
          setAddress(addressData);
        } else {
          console.error('Failed to fetch profile data:', response.status, response.statusText);
        }
      }
    } catch (error) {
      console.error('Error loading user address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (newAddress) => {
    try {
      const localStorageData = JSON.parse(localStorage.getItem("user") || '{}');
      const userData = localStorageData.user || localStorageData;
      const token = localStorage.getItem("auth_token");
      
      if (userData.id && token) {
        console.log('Sending request for user ID:', userData.id);
        console.log('Request data:', {
          first_name: address.first_name,
          middlename: address.middlename || null,
          last_name: address.last_name,
          email: userData.email,
          street: newAddress.street || null,
          contact_number: newAddress.contact_number || null,
          city: 'Butuan City',
          province: 'Agusan Del Norte',
          postal_code: '8600',
          country: 'Philippines'
        });
        
        const response = await fetch(`${window.location.origin}/api/users/${userData.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            first_name: userData.first_name,
            middlename: userData.middlename || null,
            last_name: userData.last_name,
            email: userData.email, // Required field
            street: newAddress.street || null,
            contact_number: newAddress.contact_number || null,
            // Keep fixed fields
            city: 'Butuan City',
            province: 'Agusan Del Norte',
            postal_code: '8600',
            country: 'Philippines'
          })
        });

        if (response.ok) {
          // Update local state
          setAddress(prevAddress => ({
            ...prevAddress,
            ...newAddress,
            // Keep fixed fields
            city: 'Butuan City',
            province: 'Agusan Del Norte',
            postal_code: '8600',
            country: 'Philippines'
          }));
          
      // Update localStorage user data
      const responseData = await response.json();
      console.log('API Response Data:', responseData);
      
      const updatedProfile = responseData.user || responseData;
      console.log('Updated Profile:', updatedProfile);
      
      // Preserve the original user structure in localStorage
      const currentUserData = JSON.parse(localStorage.getItem("user") || '{}');
      console.log('Current User Data:', currentUserData);
      
      // Ensure we maintain the user structure and preserve role_id
      const userStructure = currentUserData.user ? { user: updatedProfile } : updatedProfile;
      
      // Ensure role_id is preserved if it exists
      if (currentUserData.user && currentUserData.user.role_id) {
        userStructure.user.role_id = currentUserData.user.role_id;
      } else if (currentUserData.role_id && !userStructure.role_id) {
        userStructure.role_id = currentUserData.role_id;
      }
      
      console.log('Final User Structure:', userStructure);
      
      localStorage.setItem("user", JSON.stringify(userStructure));
          
          setIsModalOpen(false);
          setEditingAddress(null);
          
          // Show success message
          if (editingAddress) {
            message.success('Address updated successfully!');
          } else {
            message.success('Address added successfully!');
          }
        } else {
          console.error('Failed to update address');
          message.error('Failed to update address. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating address:', error);
      message.error('An error occurred while updating address. Please try again.');
    }
  };

  const handleEditAddress = () => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };


  if (loading) {
    return (
      <div className="my-address-container">
        <div className="loading-message">
          <p>Loading address...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-address-container">
      <div className="address-header">
        <h2 className="address-title">Address</h2>
        <button 
          className="add-address-btn"
          onClick={() => {
            setEditingAddress(null);
            setIsModalOpen(true);
          }}
        >
          <FaPlus className="btn-icon" />
          {(address.first_name || address.street || address.contact_number) ? 'Edit Address' : 'Add Address'}
        </button>
      </div>

      <div className="address-list">
        {(address.first_name || address.street || address.contact_number) ? (
          <div className="address-card default-address">
            <div className="address-content">
              <div className="address-name">
                {address.first_name && `${address.first_name} ${address.middlename || ''} ${address.last_name || ''} ${address.suffix?.suffix_name || ''}`.trim()}
              </div>
              <div className="address-details">
                {address.contact_number && (
                  <div className="address-contact">
                    <strong>Contact:</strong> {address.contact_number}
                  </div>
                )}
                {address.street && <div className="address-line">{address.street}</div>}
                {address.province && <div className="address-line">{address.province}</div>}
                {address.city && <div className="address-line">{address.city}</div>}
                {address.country && <div className="address-line">{address.country}</div>}
              </div>
            </div>
            <div className="address-actions">
              <button 
                className="edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAddress();
                }}
              >
                <img src="/images/editprof.svg" alt="Edit" className="action-icon" />
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="no-address-message">
            <p>No address added yet. Click "Add Address" to get started.</p>
          </div>
        )}
      </div>

        {isModalOpen && (
        <ModalAddress
          onClose={handleCloseModal}
          onAddAddress={handleAddAddress}
          editingAddress={editingAddress}
          userProfile={address}
        />
      )}
    </div>
  );
};

export default MyAddress;

