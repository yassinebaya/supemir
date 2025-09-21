import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const ProfileUpdatePage = () => {
  const [profileData, setProfileData] = useState({
    nom: '',
    email: '',
    ancienMotDePasse: '',
    nouveauMotDePasse: ''
  });
  
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Charger les données du profil au montage du composant
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ Aucun token trouvé');
        window.location.href = '/';
        return;
      }

      console.log('🔍 Chargement du profil avec token:', token.substring(0, 20) + '...');

      const response = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Données profil reçues:', data);
        
        const profileInfo = {
          nom: data.nom || '',
          email: data.email || '',
          ancienMotDePasse: '',
          nouveauMotDePasse: ''
        };
        
        setProfileData(profileInfo);
        setOriginalData({
          nom: data.nom || '',
          email: data.email || ''
        });
      } else if (response.status === 401) {
        console.log('❌ Token invalide - redirection login');
        localStorage.removeItem('token');
        window.location.href = '/';
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        console.log('❌ Erreur response:', errorData);
        setMessage({ type: 'error', text: errorData.error || 'Erreur lors du chargement du profil' });
      }
    } catch (error) {
      console.error('❌ Erreur loadProfile:', error);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoadingProfile(false);
    }
  };

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
    
    // Validation du mot de passe
    if (changes.ancienMotDePasse && !changes.nouveauMotDePasse) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe est requis' });
      return false;
    }
    
    if (changes.nouveauMotDePasse && !changes.ancienMotDePasse) {
      setMessage({ type: 'error', text: 'L\'ancien mot de passe est requis' });
      return false;
    }

    // Validation longueur nouveau mot de passe
    if (changes.nouveauMotDePasse && changes.nouveauMotDePasse.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const changes = getChangedFields();
    console.log('🔄 Changements détectés:', changes);
    
    if (!validateChanges(changes)) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ Aucun token pour la mise à jour');
        window.location.href = '/';
        return;
      }

      console.log('📤 Envoi mise à jour avec:', changes);

      const response = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
      });

      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response data:', result);

      if (response.ok) {
        // Mettre à jour les données originales avec les nouvelles valeurs
        setOriginalData(prev => ({ 
          ...prev, 
          nom: result.admin.nom,
          email: result.admin.email
        }));
        
        // Mettre à jour profileData avec les nouvelles données
        setProfileData(prev => ({
          ...prev,
          nom: result.admin.nom,
          email: result.admin.email,
          ancienMotDePasse: '', 
          nouveauMotDePasse: '' 
        }));
        
        setMessage({ 
          type: 'success', 
          text: `Profil mis à jour avec succès (${result.modifiedFields.join(', ')})` 
        });

        console.log('✅ Mise à jour réussie');
      } else if (response.status === 401) {
        console.log('❌ Token invalide lors de la mise à jour');
        localStorage.removeItem('token');
        window.location.href = '/';
      } else {
        console.log('❌ Erreur mise à jour:', result);
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la mise à jour' });
      }
    } catch (error) {
      console.error('❌ Erreur handleSubmit:', error);
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
      maxWidth: '800px',
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
    loading: {
      textAlign: 'center',
      padding: '40px',
      fontSize: '16px',
      color: '#6b7280'
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
    buttonDisabled: {
      backgroundColor: '#d1d5db',
      color: '#6b7280',
      cursor: 'not-allowed'
    }
  };

  // Détection mobile
  const isMobile = window.innerWidth < 768;

  if (loadingProfile) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.loading}>
              Chargement du profil...
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Formulaire */}
          <div style={isMobile ? styles.formGridMobile : styles.formGrid}>
            {/* Colonne gauche - Informations personnelles */}
            <div style={styles.columnLeft}>
              <h2 style={styles.columnTitle}>Informations personnelles</h2>
              
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
              </div>

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
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
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
                {profileData.ancienMotDePasse && profileData.nouveauMotDePasse && (
                  <p style={styles.updateNotice}>✓ Mot de passe sera changé</p>
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
                {Object.keys(getChangedFields()).map(field => {
                  if (field === 'nouveauMotDePasse') return null;
                  return (
                    <li key={field} style={styles.changesListItem}>
                      • {field === 'ancienMotDePasse' ? 'Changement de mot de passe' : field}
                    </li>
                  );
                })}
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

export default ProfileUpdatePage;