import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح
 
const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};
const SimpleProfilePage = () => {
  const [profileData, setProfileData] = useState({
    nom: '',
    email: '',
    ancienMotDePasse: '',
    nouveauMotDePasse: ''
  });
  
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Charger les données du profil

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer le message quand l'utilisateur tape
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const getChangedFields = () => {
    const changes = {};
    
    // Vérifier chaque champ pour voir s'il a changé
    if (profileData.nom !== originalData.nom && profileData.nom.trim()) {
      changes.nom = profileData.nom.trim();
    }
    
    if (profileData.email !== originalData.email && profileData.email.trim()) {
      changes.email = profileData.email.trim();
    }
    
    if (profileData.ancienMotDePasse && profileData.nouveauMotDePasse) {
      if (profileData.ancienMotDePasse.trim() && profileData.nouveauMotDePasse.trim()) {
        changes.ancienMotDePasse = profileData.ancienMotDePasse.trim();
        changes.nouveauMotDePasse = profileData.nouveauMotDePasse.trim();
      }
    }
    
    return changes;
  };

  const validateChanges = (changes) => {
    if (Object.keys(changes).length === 0) {
      setMessage({ type: 'error', text: 'Aucune modification détectée' });
      return false;
    }
    
    // Valider l'email s'il est modifié
    if (changes.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(changes.email)) {
        setMessage({ type: 'error', text: 'Format d\'email invalide' });
        return false;
      }
    }
    
    // Validation du mot de passe - les deux champs doivent être remplis ensemble
    if (changes.ancienMotDePasse && !changes.nouveauMotDePasse) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe est requis' });
      return false;
    }
    
    if (changes.nouveauMotDePasse && !changes.ancienMotDePasse) {
      setMessage({ type: 'error', text: 'L\'ancien mot de passe est requis' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const changes = getChangedFields();
    
    if (!validateChanges(changes)) return;
    
    setLoading(true);
    
    try {
      // Simulation de l'API - remplacez par votre logique
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour les données originales avec les nouvelles valeurs
      setOriginalData(prev => ({ ...prev, ...changes }));
      
      // Réinitialiser les champs mot de passe
      setProfileData(prev => ({ 
        ...prev, 
        ancienMotDePasse: '', 
        nouveauMotDePasse: '' 
      }));
      
      setMessage({ 
        type: 'success', 
        text: `Profil mis à jour avec succès (${Object.keys(changes).join(', ')})` 
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '5px 16px'
    },
    wrapper: {
      maxWidth: '800px', // Augmenté pour desktop
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '32px'
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '32px',
      textAlign: 'center'
    },
    alertError: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fecaca'
    },
    alertSuccess: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0'
    },
    alertText: {
      fontSize: '15px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px',
      marginBottom: '32px'
    },
    formGridMobile: {
      display: 'block'
    },
    columnLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    columnRight: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    columnTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '2px solid #e5e7eb'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '15px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    labelIcon: {
      marginRight: '8px',
      verticalAlign: 'middle'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '15px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    inputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    updateNotice: {
      fontSize: '13px',
      color: '#059669',
      marginTop: '6px',
      fontWeight: '500'
    },
    changesPreview: {
      backgroundColor: '#eff6ff',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '32px',
      border: '1px solid #dbeafe'
    },
    changesTitle: {
      fontSize: '16px',
      color: '#1d4ed8',
      fontWeight: '600',
      marginBottom: '12px'
    },
    changesList: {
      fontSize: '14px',
      color: '#2563eb',
      marginTop: '8px',
      paddingLeft: '0',
      listStyle: 'none'
    },
    changesListItem: {
      marginBottom: '6px',
      padding: '4px 0'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '24px'
    },
    button: {
      minWidth: '200px',
      padding: '12px 24px',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '15px'
    },
    buttonEnabled: {
      backgroundColor: '#2563eb',
      color: 'white',
      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
    },
    buttonEnabledHover: {
      backgroundColor: '#1d4ed8',
      boxShadow: '0 4px 8px rgba(37, 99, 235, 0.3)'
    },
    buttonDisabled: {
      backgroundColor: '#d1d5db',
      color: '#6b7280',
      cursor: 'not-allowed'
    }
  };

  // Détection mobile
  const isMobile = window.innerWidth < 768;

  return (
    <div style={styles.container}>
            <Sidebar onLogout={handleLogout} />

      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h1 style={styles.title}>
            Mon Profil
          </h1>

          {/* Message d'alerte */}
          {message.text && (
            <div style={message.type === 'error' ? styles.alertError : styles.alertSuccess}>
              {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              <span style={styles.alertText}>{message.text}</span>
            </div>
          )}

          {/* Formulaire avec layout responsive */}
          <div style={isMobile ? styles.formGridMobile : styles.formGrid}>
            {/* Colonne gauche - Informations personnelles */}
            <div style={styles.columnLeft}>
              <h2 style={styles.columnTitle}>Informations personnelles</h2>
              
              {/* Nom */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <User size={18} style={styles.labelIcon} />
                  Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  value={profileData.nom}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {profileData.nom !== originalData.nom && profileData.nom.trim() && (
                  <p style={styles.updateNotice}>✓ Nom sera mis à jour</p>
                )}
              </div>

              {/* Email */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Mail size={18} style={styles.labelIcon} />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {profileData.email !== originalData.email && profileData.email.trim() && (
                  <p style={styles.updateNotice}>✓ Email sera mis à jour</p>
                )}
              </div>
            </div>

            {/* Colonne droite - Mot de passe */}
            <div style={styles.columnRight}>
              <h2 style={styles.columnTitle}>Changement de mot de passe</h2>
              
              {/* Ancien mot de passe */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Lock size={18} style={styles.labelIcon} />
                  Ancien mot de passe
                </label>
                <input
                  type="password"
                  name="ancienMotDePasse"
                  value={profileData.ancienMotDePasse}
                  onChange={handleChange}
                  placeholder="Ancien mot de passe"
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {profileData.ancienMotDePasse && (
                  <p style={styles.updateNotice}>✓ Requis pour changer le mot de passe</p>
                )}
              </div>

              {/* Nouveau mot de passe */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Lock size={18} style={styles.labelIcon} />
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="nouveauMotDePasse"
                  value={profileData.nouveauMotDePasse}
                  onChange={handleChange}
                  placeholder="Nouveau mot de passe"
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {profileData.nouveauMotDePasse && (
                  <p style={styles.updateNotice}>✓ Nouveau mot de passe sera appliqué</p>
                )}
              </div>
            </div>
          </div>

          {/* Résumé des modifications */}
          {Object.keys(getChangedFields()).length > 0 && (
            <div style={styles.changesPreview}>
              <p style={styles.changesTitle}>
                Modifications à apporter :
              </p>
              <ul style={styles.changesList}>
                {Object.keys(getChangedFields()).map(field => (
                  <li key={field} style={styles.changesListItem}>
                    • {field === 'ancienMotDePasse' ? 'Changement de mot de passe' : 
                       field === 'nouveauMotDePasse' ? '' : field}
                  </li>
                )).filter(item => item.props.children !== '• ')}
              </ul>
            </div>
          )}

          {/* Bouton de soumission */}
          <div style={styles.buttonContainer}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || Object.keys(getChangedFields()).length === 0}
              style={{
                ...styles.button,
                ...(loading || Object.keys(getChangedFields()).length === 0 
                  ? styles.buttonDisabled 
                  : styles.buttonEnabled)
              }}
              onMouseEnter={(e) => {
                if (!loading && Object.keys(getChangedFields()).length > 0) {
                  e.target.style.backgroundColor = '#1d4ed8';
                  e.target.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && Object.keys(getChangedFields()).length > 0) {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
                }
              }}
            >
              <Save size={18} />
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleProfilePage;