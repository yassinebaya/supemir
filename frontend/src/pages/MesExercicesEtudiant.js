import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Eye, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive,
  Trash2
} from 'lucide-react';
import Sidebaretudiant from '../components/sidebaretudiant.js';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const MesExercicesEtudiant = () => {
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCours, setFilterCours] = useState('all');
  const [filterProf, setFilterProf] = useState('all'); // 🆕
  const [sortBy, setSortBy] = useState('dateEnvoi');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'etudiant') {
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    const fetchExercices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/etudiant/mes-exercices', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setExercices(data);
        setLoading(false);
      } catch (err) {
        console.error('❌ Erreur lors du chargement des exercices:', err);
        setLoading(false);
      }
    };
    fetchExercices();
  }, []);

  // Fonction pour supprimer un exercice
  const handleDeleteExercice = async (exerciceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action est irréversible.')) {
      return;
    }

    setDeletingId(exerciceId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/etudiant/exercices/${exerciceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        // Supprimer l'exercice de la liste locale
        setExercices(prev => prev.filter(ex => ex._id !== exerciceId));
        alert('✅ Exercice supprimé avec succès');
      } else {
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression de l\'exercice');
    } finally {
      setDeletingId(null);
    }
  };

  // Fonction pour vérifier si un exercice peut être supprimé (moins de 24h)
  const canDeleteExercice = (dateEnvoi) => {
    const maintenant = new Date();
    const diffHeures = (maintenant - new Date(dateEnvoi)) / (1000 * 60 * 60);
    return diffHeures <= 24;
  };

  // Fonction pour obtenir le temps restant pour la suppression
  const getTimeRemainingForDelete = (dateEnvoi) => {
    const maintenant = new Date();
    const diffHeures = (maintenant - new Date(dateEnvoi)) / (1000 * 60 * 60);
    const heuresRestantes = Math.max(0, 24 - diffHeures);
    
    if (heuresRestantes > 1) {
      return `${Math.floor(heuresRestantes)}h restantes`;
    } else if (heuresRestantes > 0) {
      return `${Math.floor(heuresRestantes * 60)}min restantes`;
    } else {
      return 'Délai expiré';
    }
  };

  // Obtenir la liste unique des cours et types
  const uniqueCours = [...new Set(exercices.map(ex => ex.cours))];
  const uniqueTypes = [...new Set(exercices.map(ex => ex.type))];
  const uniqueProfs = [...new Set(exercices.map(ex => ex.professeur?.nom))]; // 🆕
  
  // Filtrage et recherche
  const filteredExercices = exercices.filter(ex => {
    const matchesSearch =
      ex.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.cours.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.remarque && ex.remarque.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ex.professeur?.nom && ex.professeur.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ex.professeur?.matiere && ex.professeur.matiere.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || ex.type === filterType;
    const matchesCours = filterCours === 'all' || ex.cours === filterCours;
    const matchesProf = filterProf === 'all' || ex.professeur?.nom === filterProf;
    return matchesSearch && matchesType && matchesCours && matchesProf;
  });

  // Tri
  const sortedExercices = filteredExercices.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'dateEnvoi':
        aValue = new Date(a.dateEnvoi);
        bValue = new Date(b.dateEnvoi);
        break;
      case 'titre':
        aValue = a.titre.toLowerCase();
        bValue = b.titre.toLowerCase();
        break;
      case 'cours':
        aValue = a.cours.toLowerCase();
        bValue = b.cours.toLowerCase();
        break;
      case 'type':
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
        break;
      case 'numero':
        aValue = parseInt(a.numero) || 0;
        bValue = parseInt(b.numero) || 0;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Fonction pour obtenir l'icône du type d'exercice
  const getTypeIcon = (type) => {
    switch (type) {
      case 'Exercice':
        return <CheckCircle size={16} />;
      case 'Devoir':
        return <AlertCircle size={16} />;
      case 'TP':
        return <Users size={16} />;
      case 'Projet':
        return <TrendingUp size={16} />;
      case 'Quiz':
        return <Clock size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'Exercice': { bg: '#dbeafe', text: '#1e40af' },
      'Devoir': { bg: '#fecaca', text: '#b91c1c' },
      'TP': { bg: '#d1fae5', text: '#065f46' },
      
    };
    return colors[type] || { bg: '#f3f4f6', text: '#374151' };
  };

  const styles = {
    container: {
      margin: '0 auto',
      padding: '20px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
 background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)',
       minHeight: '100vh',
    },
    header: {
      backgroundColor: '#ffffff',
      padding: '30px',
      borderRadius: '16px',
      marginBottom: '30px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderLeft: '4px solid #3b82f6',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      margin: '0',
    },
    filtersContainer: {
      backgroundColor: '#ffffff',
      padding: '24px',
      borderRadius: '16px',
      marginBottom: '30px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    filtersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '20px',
    },
    searchContainer: {
      position: 'relative',
      gridColumn: '1 / -1',
    },
    searchInput: {
      width: '100%',
      padding: '14px 16px 14px 45px',
      fontSize: '16px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
    },
    searchIcon: {
      position: 'absolute',
      left: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b',
      fontSize: '18px',
    },
    select: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '16px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
    },
    statsContainer: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    statCard: {
      backgroundColor: '#ffffff',
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      flex: '1',
      minWidth: '150px',
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#3b82f6',
      margin: '0 0 4px 0',
    },
    statLabel: {
      fontSize: '14px',
      color: '#64748b',
      margin: '0',
    },
    exerciceCard: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    },
    exerciceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
      flexWrap: 'wrap',
      gap: '12px',
    },
    exerciceTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0',
      flex: '1',
      display: 'flex',
      alignItems: 'center',
    },
    exerciceType: {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    exerciceInfo: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '20px',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    infoIcon: {
      color: '#64748b',
      minWidth: '16px',
    },
    infoText: {
      fontSize: '14px',
      color: '#4b5563',
      margin: '0',
    },
    infoValue: {
      fontWeight: '600',
      color: '#1e293b',
    },
    actionsContainer: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    downloadButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      textDecoration: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      border: 'none',
      cursor: 'pointer',
    },
    deleteButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      backgroundColor: '#ef4444',
      color: '#ffffff',
      textDecoration: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      border: 'none',
      cursor: 'pointer',
    },
    deleteButtonDisabled: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      backgroundColor: '#e5e7eb',
      color: '#9ca3af',
      textDecoration: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      border: 'none',
      cursor: 'not-allowed',
    },
    deleteInfo: {
      fontSize: '12px',
      color: '#64748b',
      fontStyle: 'italic',
    },
    deleteInfoExpired: {
      fontSize: '12px',
      color: '#ef4444',
      fontStyle: 'italic',
    },
    remarkContainer: {
      backgroundColor: '#f1f5f9',
      padding: '16px',
      borderRadius: '12px',
      marginTop: '16px',
      border: '1px solid #e2e8f0',
    },
    remarkText: {
      fontSize: '14px',
      color: '#475569',
      margin: '0',
      fontStyle: 'italic',
      lineHeight: '1.6',
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '60px',
      fontSize: '18px',
      color: '#64748b',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    emptyIcon: {
      color: '#cbd5e1',
      marginBottom: '16px',
    },
    emptyText: {
      fontSize: '18px',
      color: '#64748b',
      margin: '0',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={{ marginRight: '12px' }}>⏳</div>
          Chargement de vos exercices...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebaretudiant onLogout={handleLogout} />

      <div style={{ 
        ...styles.header, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        
        textAlign: 'center' 
      }}>
        <h1 style={{ 
          ...styles.title, 
          textAlign: 'center', 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          Mes Exercices & Devoirs
        </h1>
        
      </div>

      <div style={styles.filtersContainer}>
        <div style={styles.searchContainer}>
          <Search style={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Rechercher par titre, cours ou remarque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...styles.searchInput,
              ...(searchTerm && { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' })
            }}
          />
        </div>

        <div style={styles.filtersGrid}>
          <div>
            <label style={styles.label}>Type d'exercice</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={styles.select}
            >
              <option value="all">Tous les types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Cours</label>
            <select
              value={filterCours}
              onChange={(e) => setFilterCours(e.target.value)}
              style={styles.select}
            >
              <option value="all">Tous les cours</option>
              {uniqueCours.map(cours => (
                <option key={cours} value={cours}>{cours}</option>
              ))}
            </select>
          </div>

          {/* 🆕 Professeur filter */}
          <div>
            <label style={styles.label}>Professeur</label>
            <select
              value={filterProf}
              onChange={(e) => setFilterProf(e.target.value)}
              style={styles.select}
            >
              <option value="all">Tous les professeurs</option>
              {uniqueProfs.map(nom => (
                <option key={nom} value={nom}>{nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.select}
            >
              <option value="dateEnvoi">Date d'envoi</option>
              <option value="titre">Titre</option>
              <option value="cours">Cours</option>
              <option value="type">Type</option>
              <option value="numero">Numéro</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Ordre</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={styles.select}
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{exercices.length}</div>
          <div style={styles.statLabel}>Total exercices</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{filteredExercices.length}</div>
          <div style={styles.statLabel}>Résultats trouvés</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{uniqueCours.length}</div>
          <div style={styles.statLabel}>Cours différents</div>
        </div>
      </div>

      {sortedExercices.length === 0 ? (
        <div style={styles.emptyState}>
          <Archive size={48} style={styles.emptyIcon} />
          <p style={styles.emptyText}>
            {exercices.length === 0 ? 'Aucun exercice trouvé.' : 'Aucun exercice ne correspond à vos critères de recherche.'}
          </p>
        </div>
      ) : (
        sortedExercices.map((ex) => {
          const typeColor = getTypeColor(ex.type);
          const canDelete = canDeleteExercice(ex.dateEnvoi);
          const timeRemaining = getTimeRemainingForDelete(ex.dateEnvoi);
          const isDeleting = deletingId === ex._id;
          
          return (
            <div
              key={ex._id}
              style={{
                ...styles.exerciceCard,
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <div style={styles.exerciceHeader}>
                <h3 style={styles.exerciceTitle}>
                  <FileText size={20} style={{ marginRight: '8px' }} />
                  {ex.titre}
                </h3>
                <span 
                  style={{
                    ...styles.exerciceType,
                    backgroundColor: typeColor.bg,
                    color: typeColor.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {getTypeIcon(ex.type)}
                  {ex.type} N°{ex.numero}
                </span>
              </div>

              <div style={styles.exerciceInfo}>
                <div style={styles.infoItem}>
                  <BookOpen size={16} style={styles.infoIcon} />
                  <p style={styles.infoText}>
                    Cours: <span style={styles.infoValue}>{ex.cours}</span>
                  </p>
                </div>
                <div style={styles.infoItem}>
                  <Calendar size={16} style={styles.infoIcon} />
                  <p style={styles.infoText}>
                    Envoyé le: <span style={styles.infoValue}>
                      {new Date(ex.dateEnvoi).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </p>
                </div>
                {/* 👉 Affichage professeur et matière */}
                <div style={styles.infoItem}>
                  <Users size={16} style={styles.infoIcon} />
                  <p style={styles.infoText}>
                    Professeur: <span style={styles.infoValue}>
                      {ex.professeur?.nom || '---'} ({ex.professeur?.matiere || '---'})
                    </span>
                  </p>
                </div>
              </div>

              <div style={styles.actionsContainer}>
                <a
                  href={`http://localhost:5000${ex.fichier}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.downloadButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2563eb';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#3b82f6';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <Eye size={16} />
                  Voir le fichier
                </a>

                {canDelete ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={() => handleDeleteExercice(ex._id)}
                      disabled={isDeleting}
                      style={{
                        ...styles.deleteButton,
                        ...(isDeleting && { opacity: 0.7, cursor: 'not-allowed' })
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeleting) {
                          e.target.style.backgroundColor = '#dc2626';
                          e.target.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDeleting) {
                          e.target.style.backgroundColor = '#ef4444';
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <Trash2 size={16} />
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                    <span style={styles.deleteInfo}>
                      {timeRemaining} pour supprimer
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      style={styles.deleteButtonDisabled}
                      disabled
                    >
                      <Trash2 size={16} />
                      Suppression impossible
                    </button>
                    <span style={styles.deleteInfoExpired}>
                      {timeRemaining}
                    </span>
                  </div>
                )}
              </div>

              {ex.remarque && (
                <div style={styles.remarkContainer}>
                  <p style={{ ...styles.infoText, marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} />
                    Remarque du professeur:
                  </p>
                  <p style={styles.remarkText}>{ex.remarque}</p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MesExercicesEtudiant;