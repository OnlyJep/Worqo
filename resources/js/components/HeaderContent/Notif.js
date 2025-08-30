import React from 'react';
import Headerz from "./Headerz";
import Footer from '../FooterContent/footer';

const Notif = () => {
  return (
    <>
      <Headerz />
      <div style={{ 
        marginTop: '80px', 
        padding: '2rem',
        minHeight: 'calc(100vh - 80px)',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          display: 'flex',
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            width: '280px',
            backgroundColor: 'white',
            borderRight: '1px solid #e0e0e0',
            padding: '2rem 0'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', padding: '0 2rem' }}>Notifications</h3>
            <div style={{ padding: '0 2rem' }}>
              <div style={{ 
                padding: '1rem',
                cursor: 'pointer',
                backgroundColor: '#e3f2fd',
                borderRight: '3px solid #00C4CC'
              }}>
                All Notifications
              </div>
              <div style={{ 
                padding: '1rem',
                cursor: 'pointer'
              }}>
                Unread Notifications
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, padding: '0 2rem' }}>
            <div style={{ 
              backgroundColor: '#1A2A44',
              color: 'white',
              padding: '2rem',
              marginBottom: '2rem',
              borderRadius: '10px 10px 0 0'
            }}>
              <h2 style={{ margin: 0 }}>All Notifications</h2>
            </div>
            
            <div style={{ 
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: 'white',
              borderRadius: '0 0 10px 10px'
            }}>
              <h3>No Notifications Yet.</h3>
              <p>You're all caught up! No new notifications to show.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Notif;
