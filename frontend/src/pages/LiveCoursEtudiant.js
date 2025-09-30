import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LiveCoursEtudiant = () => {
  const [cours, setCours] = useState([]);

  useEffect(() => {
    const fetchCours = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://vmi1977988.contaboserver.net//api2/etudiant/mes-cours', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        setCours(data);
      } catch (err) {
        console.error('Erreur:', err);
      }
    };

    fetchCours();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎥 دورات مباشرة متاحة</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cours.map((c, idx) => (
          <li key={idx} style={{
            marginBottom: '15px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            <strong>{c}</strong>
            <br />
            <Link 
              to={`/etudiant/live/${c}`} 
              style={{
                display: 'inline-block',
                marginTop: '10px',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '8px 15px',
                borderRadius: '5px',
                textDecoration: 'none'
              }}
            >
              🎬 انضم إلى البث المباشر
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LiveCoursEtudiant;
