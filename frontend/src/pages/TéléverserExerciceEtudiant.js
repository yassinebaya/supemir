import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Upload, BookOpen, FileText, GraduationCap, Hash, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Sidebaretudiant from '../components/sidebaretudiant';
 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const TeleverserExerciceEtudiant = () => {
  const [titre, setTitre] = useState('');
  const [cours, setCours] = useState('');
  const [type, setType] = useState('Devoir');
  const [numero, setNumero] = useState(1);
  const [file, setFile] = useState(null);
  const [coursList, setCoursList] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [professeurId, setProfesseurId] = useState('');
  const [professeursDispo, setProfesseursDispo] = useState([]);

  useEffect(() => {
    const fetchCours = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('http://195.179.229.230:5000/api/etudiant/mes-cours', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (Array.isArray(res.data)) {
          setCoursList(res.data);
        } else {
          setCoursList([]);
        }
      } catch (err) {
        console.error('Erreur chargement cours:', err);
        setCoursList([]);
      }
    };

    fetchCours();
  }, []);

  useEffect(() => {
    const profsForCours = coursList.find(c => c.nomCours === cours);
    setProfesseursDispo(profsForCours ? profsForCours.professeurs : []);
    setProfesseurId('');
  }, [cours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!titre || !cours || !file || !type || !numero) {
      setMessage({ type: 'error', text: 'Tous les champs sont requis' });
      setIsSubmitting(false);
      return;
    }
    if (!professeurId) {
      setMessage({ type: 'error', text: 'Veuillez choisir un professeur.' });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('titre', titre);
    formData.append('cours', cours);
    formData.append('type', type);
    formData.append('numero', numero);
    formData.append('fichier', file);
    formData.append('professeurId', professeurId);

    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://195.179.229.230:5000/api/etudiant/exercices', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', text: res.data.message || 'Exercice envoyé avec succès !' });
      setTitre('');
      setCours('');
      setType('Devoir');
      setNumero(1);
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de l\'envoi' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Devoir': return <FileText size={20} />;
      case 'Examen': return <GraduationCap size={20} />;
      case 'TD': return <BookOpen size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',

      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
                   <Sidebaretudiant onLogout={handleLogout} />
      
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
        
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#2d3748',
            marginBottom: '10px'
          }}>
            Envoyer un Exercice
          </h2>
        
        </div>

        {/* Form */}
        <div style={{
          display: 'grid',
          gap: '25px'
        }}>
          {/* Titre */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '8px'
            }}>
              Titre de l'exercice
            </label>
            <input
              type="text"
              placeholder="Ex: Devoir de Mathématiques - Chapitre 3"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                background: '#fafafa',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.background = '#fafafa';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Grid pour les sélections */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {/* Cours */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '8px'
              }}>
                <BookOpen size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
Classe             </label>
              <select
                value={cours}
                onChange={(e) => {
                  const selected = coursList.find(c => c.nomCours === e.target.value);
                  setCours(e.target.value);
                  setProfesseursDispo(selected?.professeurs || []);
                  setProfesseurId('');
                }}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#fafafa',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#fafafa';
                }}
              >
                <option value="">-- Choisir classe --</option>
                {coursList.map((item, index) => (
                  <option key={index} value={item.nomCours}>{item.nomCours}</option>
                ))}
              </select>
            </div>
            {/* Choisir un professeur */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                Professeur
              </label>
              <select
                value={professeurId}
                onChange={(e) => setProfesseurId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#fafafa',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Choisir un professeur --</option>
                {professeursDispo.map((prof) => (
                  <option key={prof._id} value={prof._id}>
                    {prof.nom} ({prof.matiere})
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '8px'
              }}>
                Type d'exercice
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#fafafa',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#fafafa';
                }}
              >
                <option value="Devoir">
                 Devoir
                </option>
                <option value="Examen">
                  Examen
                </option>
                <option value="TD">
                   TD
                </option>
              </select>
            </div>

            {/* Numéro */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '8px'
              }}>
                <Hash size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Numéro
              </label>
              <input
                type="number"
                placeholder="1"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                min="1"
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#fafafa',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Upload File */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '8px'
            }}>
              Fichier à téléverser
            </label>
            <div style={{
              border: '2px dashed #cbd5e0',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              background: '#f8fafc',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.background = '#f0f4ff';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e0';
              e.currentTarget.style.background = '#f8fafc';
            }}
            onClick={() => document.getElementById('file-input').click()}
            >
              <Upload size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                {file ? file.name : 'Cliquez pour choisir un fichier ou glissez-déposez'}
              </p>
              <p style={{
                fontSize: '14px',
                color: '#9ca3af',
                margin: '0'
              }}>
                PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB)
              </p>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor:'#4f46e5',
              color: 'white',
              border: 'none',
              padding: '18px 40px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              transform: isSubmitting ? 'none' : 'translateY(0)',
              marginTop: '20px'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ffffff40',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send size={20} />
                Envoyer l'exercice
              </>
            )}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            marginTop: '25px',
            padding: '15px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `2px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#166534' : '#dc2626'
          }}>
            {message.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {message.text}
            </span>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .form-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default TeleverserExerciceEtudiant;