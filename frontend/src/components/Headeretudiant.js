import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationEtudiant from './NotificationEtudiant'; // تأكد من المسار الصحيح

const Header = () => {
  const navigate = useNavigate();

  return (
    <header style={styles.header}>
      <h1 style={styles.title}></h1>

      <div style={styles.rightSection}>
        {/* إشعارات */}
        <NotificationEtudiant onNavigate={(path) => navigate(path)} />

        {/* (اختياري) اسم المسؤول أو زر تسجيل الخروج */}
        {/* <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Déconnexion</button> */}
      </div>
    </header>
  );
};

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4f46e5',
    margin: 0
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }
};

export default Header;
