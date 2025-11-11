import React from 'react';
import { IconX } from '@tabler/icons-react';

// Category options for display
const credentialCategories = [
  { value: 'government', label: 'Government Credential' },
  { value: 'professional', label: 'Professional Credential' },
  { value: 'personal', label: 'Personal Credential' },
];

const AddedCredentials = ({
  credentials,
  onEditCredential,
  onRemoveCredential
}) => {
  return (
    <div className="form-section added-credentials-section">
      <div className="section-title">Added Credentials ({credentials.length})</div>
      {credentials.length > 0 ? (
        credentials.map((cred, index) => (
          <div key={index} className="credential-card-container">
            <div 
              className="credential-card"
              onClick={() => onEditCredential(cred, index)}
            >
              <div className="credential-content">
                <div className="credential-main">
                  <div className="credential-header">
                    <span className="credential-name">{cred.credentials_name}</span>
                  </div>
                  <div className="credential-info">
                    <div className="credential-category">
                      <span className="category-label">Category:</span>
                      <span className="category-value">
                        {cred.category 
                          ? credentialCategories.find(cat => cat.value === cred.category)?.label 
                          : 'Professional Credential'
                        }
                      </span>
                    </div>
                    <div className="credential-files">
                      <span className="files-label">Files:</span>
                      <span className="files-list">
                        {cred.credentials_photo ? 'Photo' : ''}
                        {cred.credentials_photo && cred.credentials_doc ? ', ' : ''}
                        {cred.credentials_doc ? 'Document' : ''}
                        {!cred.credentials_photo && !cred.credentials_doc ? 'None uploaded' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="credential-actions">
                  <button 
                    type="button"
                    className="remove-credential-btn" 
                    title="Remove credential"
                    style={{
                      background: 'transparent',
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      boxShadow: 'none'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCredential(index);
                    }}
                  >
                    <IconX size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-credentials">
          <span className="empty-text">No credentials added yet</span>
          <span className="empty-hint">Add credentials to build trust with employers</span>
        </div>
      )}
    </div>
  );
};

export default AddedCredentials;

