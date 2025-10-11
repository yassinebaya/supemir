import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Save, X, User, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ModifierCoursEtudiant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [etudiant, setEtudiant] = useState(null);
  const [coursDisponibles, setCoursDisponibles] = useState([]);
  const [coursSelectionnes, setCoursSelectionnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Charger les données de l'étudiant
const resEtudiant = await fetch(`http://195.179.229.230:5000/api/etudiants/${id}`, config);
      const etudiantData = await resEtudiant.json();
      
      // Charger tous les cours disponibles
      const resCours = await fetch('http://195.179.229.230:5000/api/cours', config);
      const coursData = await resCours.json();
      
      if (resEtudiant.ok && resCours.ok) {
        setEtudiant(etudiantData);
        setCoursDisponibles(coursData);
        setCoursSelectionnes(etudiantData.cours || []);
      } else {
        setMessage('Erreur lors du chargement des données');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setMessage('Erreur de connexion au serveur');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCours = (nomCours) => {
    if (coursSelectionnes.includes(nomCours)) {
      setCoursSelectionnes(coursSelectionnes.filter(c => c !== nomCours));
    } else {
      setCoursSelectionnes([...coursSelectionnes, nomCours]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://195.179.229.230:5000/api/pedagogique/etudiant/${id}/cours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cours: coursSelectionnes })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Classes mis à jour avec succès');
        setMessageType('success');
        
        setTimeout(() => {
          navigate('/pedagogique/etudiants');
        }, 2000);
      } else {
        setMessage('❌ ' + (data.message || 'Erreur lors de la mise à jour'));
        setMessageType('error');
      }
    } catch (err) {
      setMessage('❌ Erreur de connexion au serveur');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '2rem'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    iconBox: {
      padding: '0.75rem',
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      borderRadius: '0.75rem',
      display: 'flex'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem'
    },
    cancelButton: {
      padding: '0.75rem 1.5rem',
      background: '#f3f4f6',
      color: '#374151',
      border: 'none',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    saveButton: {
      padding: '0.75rem 1.5rem',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
    },
    card: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    },
    studentInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      background: '#f9fafb',
      borderRadius: '0.75rem',
      marginBottom: '2rem'
    },
    studentIcon: {
      padding: '0.75rem',
      background: '#dbeafe',
      borderRadius: '0.5rem'
    },
    studentName: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937'
    },
    sectionTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    coursGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1rem'
    },
    coursCard: {
      padding: '1rem',
      border: '2px solid #e5e7eb',
      borderRadius: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    coursSelected: {
      borderColor: '#3b82f6',
      background: '#eff6ff'
    },
    coursName: {
      fontWeight: '500',
      color: '#1f2937'
    },
    message: {
      padding: '1rem',
      borderRadius: '0.75rem',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    messageSuccess: {
      background: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0'
    },
    messageError: {
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      fontSize: '1.125rem',
      color: '#6b7280'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.content}>
          <div style={styles.loadingContainer}>
            Chargement des données...
          </div>
        </div>
      </div>
    );
  }

  if (!etudiant) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <AlertCircle size={48} color="#ef4444" />
              <h2 style={{ color: '#1f2937', marginTop: '1rem' }}>Étudiant non trouvé</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <div style={styles.iconBox}>
              <BookOpen size={24} color="white" />
            </div>
            <span>Modifier les Classes de l'étudiant</span>
          </div>
          
          <div style={styles.buttonGroup}>
            <button
              onClick={() => navigate('/pedagogique/etudiants')}
              style={styles.cancelButton}
            >
              <X size={18} />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={18} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            ...styles.message,
            ...(messageType === 'success' ? styles.messageSuccess : styles.messageError)
          }}>
            {messageType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message}
          </div>
        )}

        {/* Infos étudiant */}
        <div style={styles.card}>
          <div style={styles.studentInfo}>
            <div style={styles.studentIcon}>
              <User size={24} color="#3b82f6" />
            </div>
            <div>
              <div style={styles.studentName}>{etudiant.nomComplet}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {etudiant.filiere} - Niveau {etudiant.niveau}
              </div>
            </div>
          </div>

          <div style={styles.sectionTitle}>
            <BookOpen size={20} color="#3b82f6" />
            Sélectionnez les classes ({coursSelectionnes.length} sélectionné{coursSelectionnes.length !== 1 ? 's' : ''})
          </div>

          <div style={styles.coursGrid}>
            {coursDisponibles.map((cours) => {
              const isSelected = coursSelectionnes.includes(cours.nom);
              
              return (
                <div
                  key={cours._id}
                  onClick={() => toggleCours(cours.nom)}
                  style={{
                    ...styles.coursCard,
                    ...(isSelected ? styles.coursSelected : {})
                  }}
                >
                  <span style={styles.coursName}>{cours.nom}</span>
                  {isSelected && <CheckCircle size={20} color="#3b82f6" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifierCoursEtudiant;