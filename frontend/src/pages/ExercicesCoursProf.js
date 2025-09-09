import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  FileText, 
  User, 
  MessageSquare, 
  Save,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Hash,
  Eye
} from 'lucide-react';
import SidebarProf from '../components/SidebarProf';

 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

const ExercicesCoursProf = () => {
  const { nomCours } = useParams();
  const [exercicesParEtudiant, setExercicesParEtudiant] = useState({});
  const [loading, setLoading] = useState(true);
  const [remarqueEdits, setRemarqueEdits] = useState({});
  const [savedRemarques, setSavedRemarques] = useState(new Set()); // Nouveau state pour tracker les remarques sauvegardées
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedNumero, setSelectedNumero] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedStudents, setExpandedStudents] = useState({});
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchExercices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://195.179.229.230:5000/api/professeur/exercices/${nomCours}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const regroupés = {};
        const alreadySaved = new Set(); // Pour identifier les exercices qui ont déjà une remarque
        
        res.data.forEach(ex => {
          const etudiantId = ex.etudiant?._id;
          const nom = ex.etudiant?.nomComplet || '---';
          if (!regroupés[etudiantId]) {
            regroupés[etudiantId] = { nom, exercices: [] };
          }
          regroupés[etudiantId].exercices.push(ex);
          
          // Si l'exercice a déjà une remarque, l'ajouter au set des sauvegardées
          if (ex.remarque && ex.remarque.trim()) {
            alreadySaved.add(ex._id);
          }
        });

        setExercicesParEtudiant(regroupés);
        setSavedRemarques(alreadySaved);
      } catch (err) {
        console.error('Erreur récupération exercices:', err);
        showNotification('Erreur lors du chargement des exercices', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchExercices();
  }, [nomCours]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemarqueChange = (id, value) => {
    setRemarqueEdits(prev => ({ ...prev, [id]: value }));
  };

  const saveRemarque = async (id) => {
    const remarque = remarqueEdits[id];
    if (!remarque) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://195.179.229.230:5000/api/professeur/exercices/${id}/remarque`, {
        remarque
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ajouter cet exercice au set des remarques sauvegardées
      setSavedRemarques(prev => new Set([...prev, id]));
      
      showNotification('Remarque enregistrée avec succès');
    } catch (err) {
      console.error('Erreur sauvegarde remarque:', err);
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  };

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const filteredStudents = Object.entries(exercicesParEtudiant).filter(([id, { nom, exercices }]) => {
    const matchesSearch = nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || exercices.some(ex => ex.type === selectedType);
    const matchesNumero = !selectedNumero || exercices.some(ex => ex.numero.toString() === selectedNumero);
    return matchesSearch && matchesType && matchesNumero;
  });

  const sortedStudents = filteredStudents.sort((a, b) => {
    const [, studentA] = a;
    const [, studentB] = b;
    
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? studentA.nom.localeCompare(studentB.nom)
        : studentB.nom.localeCompare(studentA.nom);
    } else {
      const dateA = Math.max(...studentA.exercices.map(ex => new Date(ex.dateEnvoi)));
      const dateB = Math.max(...studentB.exercices.map(ex => new Date(ex.dateEnvoi)));
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });

  const getAllTypes = () => {
    const types = new Set();
    Object.values(exercicesParEtudiant).forEach(({ exercices }) => {
      exercices.forEach(ex => types.add(ex.type));
    });
    return Array.from(types);
  };

  const getAllNumeros = () => {
    const numeros = new Set();
    Object.values(exercicesParEtudiant).forEach(({ exercices }) => {
      exercices.forEach(ex => numeros.add(ex.numero));
    });
    return Array.from(numeros).sort((a, b) => a - b);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      padding: '24px',
    background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      justifyContent: 'center',

    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      marginBottom: '24px'
    },
    filtersContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 44px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      transition: 'border-color 0.2s',
      outline: 'none'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      outline: 'none'
    },
    filterGroup: {
      position: 'relative'
    },
    filterIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      pointerEvents: 'none'
    },
    studentCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)'
    },
    studentHeader: {
      padding: '20px 24px',
      backgroundColor: 'rgba(248, 250, 252, 0.8)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    studentName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    exerciseCard: {
      padding: '20px 24px',
      borderBottom: '1px solid rgba(241, 245, 249, 0.5)'
    },
    exerciseHeader: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px'
    },
    exerciseTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: '#e0e7ff',
      color: '#3730a3'
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '16px'
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#64748b'
    },
    downloadLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      color: 'white',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      padding: '6px 12px',
      borderRadius: '6px',
      border: '1px solid #e0e7ff',
      backgroundColor: '#2563eb',
      transition: 'all 0.2s'
    },
    remarqueContainer: {
      marginTop: '16px',
      padding: '16px',
      backgroundColor: 'rgba(248, 250, 252, 0.8)',
      borderRadius: '8px',
      border: '1px solid rgba(226, 232, 240, 0.5)'
    },
    remarqueLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '80px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    saveButton: {
      marginTop: '8px',
      padding: '8px 16px',
      backgroundColor: '#059669',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background-color 0.2s'
    },
    // Nouveau style pour l'indicateur "Exercice vu"
    savedIndicator: {
      marginTop: '8px',
      padding: '8px 16px',
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    notification: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'slideIn 0.3s ease-out'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '300px',
      fontSize: '16px',
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)'
    },
    '@media (max-width: 768px)': {
      filtersContainer: {
        gridTemplateColumns: '1fr'
      },
      exerciseHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start'
      },
      infoGrid: {
        gridTemplateColumns: '1fr'
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Clock size={20} style={{ marginRight: '8px' }} />
          Chargement des exercices...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <SidebarProf onLogout={handleLogout}/>
        
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: notification.type === 'error' ? '#dc2626' : '#16a34a',
          border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#bbf7d0'}`
        }}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {notification.message}
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>
          Exercices Envoyés
        </h1>
        <p style={styles.subtitle}>
          Cours: {nomCours} • {Object.keys(exercicesParEtudiant).length} étudiants
        </p>

        <div style={styles.filtersContainer}>
          <div style={styles.filterGroup}>
            <Search size={16} style={styles.filterIcon} />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <Filter size={16} style={styles.filterIcon} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{...styles.select, paddingLeft: '44px'}}
            >
              <option value="">Tous les types</option>
              {getAllTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <Hash size={16} style={styles.filterIcon} />
            <select
              value={selectedNumero}
              onChange={(e) => setSelectedNumero(e.target.value)}
              style={{...styles.select, paddingLeft: '44px'}}
            >
              <option value="">Tous les numéros</option>
              {getAllNumeros().map(numero => (
                <option key={numero} value={numero}>N° {numero}</option>
              ))}
            </select>
          </div>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            style={styles.select}
          >
            <option value="date-desc">Plus récents d'abord</option>
            <option value="date-asc">Plus anciens d'abord</option>
            <option value="name-asc">Nom A-Z</option>
            <option value="name-desc">Nom Z-A</option>
          </select>
        </div>
      </div>

      {sortedStudents.length === 0 ? (
        <div style={styles.emptyState}>
          <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>Aucun exercice trouvé</h3>
          <p style={{ color: '#9ca3af' }}>
            {searchTerm || selectedType || selectedNumero ? 'Aucun résultat ne correspond à vos critères de recherche.' : 'Aucun exercice n\'a encore été envoyé.'}
          </p>
        </div>
      ) : (
        sortedStudents.map(([id, { nom, exercices }]) => (
          <div key={id} style={styles.studentCard}>
            <div 
              style={styles.studentHeader}
              onClick={() => toggleStudentExpansion(id)}
            >
              <div style={styles.studentName}>
                <User size={20} />
                {nom}
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '400', 
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {exercices.length} exercice{exercices.length > 1 ? 's' : ''}
                </span>
              </div>
              {expandedStudents[id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedStudents[id] && exercices
              .filter(ex => {
                const matchesType = !selectedType || ex.type === selectedType;
                const matchesNumero = !selectedNumero || ex.numero.toString() === selectedNumero;
                return matchesType && matchesNumero;
              })
              .sort((a, b) => a.numero - b.numero)
              .map(ex => (
                <div key={ex._id} style={styles.exerciseCard}>
                  <div style={styles.exerciseHeader}>
                    <div style={styles.exerciseTitle}>
                      <FileText size={16} />
                      {ex.titre}
                    </div>
                    <div style={styles.badge}>
                      {ex.type} N°{ex.numero}
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <Calendar size={16} />
                      {new Date(ex.dateEnvoi).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <div>
                      <a 
                        href={`http://195.179.229.230:5000${ex.fichier}`}
                        target="_blank" 
                        rel="noreferrer"
                        style={styles.downloadLink}
                      >
                        <Eye size={16} />
                        Voir le fichier
                      </a>
                    </div>
                  </div>

                  <div style={styles.remarqueContainer}>
                    <div style={styles.remarqueLabel}>
                      <MessageSquare size={16} />
                      Remarque pour l'étudiant
                    </div>
                    <textarea
                      value={remarqueEdits[ex._id] || ex.remarque || ''}
                      onChange={(e) => handleRemarqueChange(ex._id, e.target.value)}
                      placeholder="Ajouter une remarque pour cet exercice..."
                      style={{
                        ...styles.textarea,
                        backgroundColor: savedRemarques.has(ex._id) ? '#f9fafb' : 'white',
                        color: savedRemarques.has(ex._id) ? '#6b7280' : '#374151',
                        cursor: savedRemarques.has(ex._id) ? 'not-allowed' : 'text'
                      }}
                      readOnly={savedRemarques.has(ex._id)}
                      disabled={savedRemarques.has(ex._id)}
                    />
                    
                    {/* Affichage conditionnel : bouton ou indicateur */}
                    {savedRemarques.has(ex._id) ? (
                      <div style={styles.savedIndicator}>
                        <Eye size={16} />
                        Exercice vu et commenté
                      </div>
                    ) : (
                      <button 
                        onClick={() => saveRemarque(ex._id)}
                        style={styles.saveButton}
                      >
                        <Save size={16} />
                        Sauvegarder la remarque
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ))
      )}
    </div>
  );
};

export default ExercicesCoursProf;