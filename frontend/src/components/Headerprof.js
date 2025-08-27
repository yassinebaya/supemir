import React from 'react';
 import { useNavigate } from 'react-router-dom';
 import NotificationProf from './NotificationProf'; // Composant notifications pour professeurs

const HeaderProf = ({ onNavigate, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof Storage !== 'undefined') {
       localStorage.removeItem('token'); // Uncomment in real app
    }
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header style={styles.header}>

      <div style={styles.leftSection}>
     
      </div>

      <div style={styles.rightSection}>
      <NotificationProf onNavigate={(path) => navigate(path)} />

     
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .logout-button:hover {
            background-color: #dc2626 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          
          .logout-button:active {
            transform: translateY(0);
          }
          
          .notification-button:hover {
            color: #1f2937 !important;
            background-color: #f3f4f6 !important;
            transform: scale(1.05);
          }
          
          .notification-button:hover .notification-icon {
            filter: grayscale(0) !important;
          }
          
          .notification-button:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
          }
        `}
      </style>
    </header>
  );
};

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    backdropFilter: 'blur(8px)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
  },
  
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  
  subtitle: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    marginTop: '2px'
  },
  
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
  }
};

const notificationStyles = {
  container: {
    position: 'relative'
  },
  
  button: {
    position: 'relative',
    padding: '12px',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  icon: {
    fontSize: '22px',
    filter: 'grayscale(1)',
    transition: 'filter 0.2s ease'
  },
  
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold',
    borderRadius: '50%',
    height: '20px',
    width: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pulse 2s infinite',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
  }
};

export default HeaderProf;