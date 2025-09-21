import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ModalPaiementExpire = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/etudiant/notifications', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const expired = data.filter(n => n.type === 'paiement_expire');
        
        setNotifications(expired);
        if (expired.length > 0) {
          setModalVisible(true);
        }
      } catch (err) {
        console.error('Erreur notification paiement expiré:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const closeModal = () => {
    setModalVisible(false);
  };

  if (!modalVisible || loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '450px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fecaca'
            }}>
              <AlertTriangle size={20} color="#dc2626" />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Paiement Expiré
              </h2>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {notifications.map((notification, index) => (
              <div 
                key={index}
                style={{
                  padding: '16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  borderLeft: '4px solid #dc2626'
                }}
              >
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.5'
                }}>
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <button
            onClick={closeModal}
            style={{
              padding: '12px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPaiementExpire;