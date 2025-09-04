import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Eye, EyeOff, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import Sidebar from '../components/SidebarProf';

const ProfesseurProfil = () => {
  const [formData, setFormData] = useState({
    email: '',
    motDePasseActuel: '',
    motDePasse: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    actuel: false,
    nouveau: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [professeurInfo, setProfesseurInfo] = useState({ 
    nom: '', 
    email: '', 
    genre: '', 
    matiere: '',
    telephone: '' 
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'prof') {
      window.location.href = '/';
    }
    fetchProfesseurInfo();
  }, []);

  const fetchProfesseurInfo = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/professeur/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfesseurInfo(data);
        setFormData(prev => ({ ...prev, email: data.email }));
      }
    } catch (err) {
      console.error('Erreur récupération profil:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!formData.motDePasseActuel) {
      setMessage({ type: 'error', text: 'Mot de passe actuel requis' });
      setLoading(false);
      return;
    }

    if (!formData.email && !formData.motDePasse) {
      setMessage({ type: 'error', text: 'Veuillez modifier au moins un champ' });
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/professeur/profil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
        setFormData(prev => ({
          ...prev,
          motDePasseActuel: '',
          motDePasse: ''
        }));
        setProfesseurInfo(prev => ({ ...prev, email: data.professeur.email }));
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de la mise à jour' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <Sidebar onLogout={handleLogout} />
        
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <User size={32} style={{ color: '#3b82f6' }} />
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Mon Profil
            </h1>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center'
          }}>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: 0
            }}>
              Bonjour {professeurInfo.nom}
            </p>
            {professeurInfo.matiere && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f0f9ff',
                color: '#0369a1',
                padding: '6px 12px',
                borderRadius: '50px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #bae6fd'
              }}>
                <BookOpen size={16} />
                {professeurInfo.matiere}
              </div>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Lock size={24} style={{ color: '#3b82f6' }} />
            Modifier mes informations
          </h2>

          {message.text && (
            <div style={{
              backgroundColor: message.type === 'success' ? '#dcfce7' : '#fef2f2',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {message.type === 'success' ? (
                <CheckCircle size={20} style={{ color: '#059669' }} />
              ) : (
                <AlertCircle size={20} style={{ color: '#dc2626' }} />
              )}
              <span style={{
                color: message.type === 'success' ? '#059669' : '#dc2626',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {message.text}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Email actuel affiché */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Email actuel
              </label>
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                color: '#64748b'
              }}>
                {professeurInfo.email}
              </div>
            </div>

            {/* Nouveau email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Nouvel email (optionnel)
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="nouveau@email.com"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            {/* Mot de passe actuel */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Mot de passe actuel *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  type={showPasswords.actuel ? 'text' : 'password'}
                  name="motDePasseActuel"
                  value={formData.motDePasseActuel}
                  onChange={handleInputChange}
                  placeholder="Votre mot de passe actuel"
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('actuel')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af'
                  }}
                >
                  {showPasswords.actuel ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Nouveau mot de passe (optionnel)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  type={showPasswords.nouveau ? 'text' : 'password'}
                  name="motDePasse"
                  value={formData.motDePasse}
                  onChange={handleInputChange}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('nouveau')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af'
                  }}
                >
                  {showPasswords.nouveau ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Mise à jour...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Mettre à jour
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          div[style*="padding: 32px"] {
            padding: 24px !important;
          }
          
          div[style*="padding: 24px"] {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfesseurProfil;