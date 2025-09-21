import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Calendar, 
  Star, 
  TrendingUp, 
  Award, 
  BarChart3, 
  FileText, 
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Target,
  GraduationCap,
  Clock,
  X,
  Users,
  EyeOff,
  Settings
} from 'lucide-react';
import Sidebar from '../components/sidebaretudiant'; // ✅ ا
 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const EtudiantBulletins = () => {
  const [bulletins, setBulletins] = useState([]);
  const [filteredBulletins, setFilteredBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // États pour contrôler la visibilité des sections
  const [visibilitySettings, setVisibilitySettings] = useState({
    statistics: true,
    notesPreview: true,
    remarquePreview: true,
    professeurInfo: true,
    dateInfo: true,
    coefficients: true
  });

  const [filters, setFilters] = useState({
    semestre: '',
    cours: '',
    search: '',
    sortBy: 'date',
    dateDebut: '',
    dateFin: ''
  });

  // Notification system
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle visibility settings
  const toggleVisibility = (setting) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    showNotification(`${setting === 'statistics' ? 'Statistiques' : 
                      setting === 'notesPreview' ? 'Aperçu des notes' :
                      setting === 'remarquePreview' ? 'Remarques' :
                      setting === 'professeurInfo' ? 'Infos professeur' :
                      setting === 'dateInfo' ? 'Dates' : 'Coefficients'} ${!visibilitySettings[setting] ? 'affiché(es)' : 'masqué(es)'}`, 'info');
  };

  // Fetch bulletins depuis l'API
  useEffect(() => {
    const fetchBulletins = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/bulletins/etudiant/me', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }

        const data = await res.json();
        
        // Vérification que data.bulletins existe et est un tableau
        if (data.bulletins && Array.isArray(data.bulletins)) {
          setBulletins(data.bulletins);
          setFilteredBulletins(data.bulletins);
        } else if (Array.isArray(data)) {
          // Si data est directement un tableau
          setBulletins(data);
          setFilteredBulletins(data);
        } else {
          setBulletins([]);
          setFilteredBulletins([]);
          console.warn("La réponse ne contient pas de tableau de bulletins:", data);
        }
      } catch (err) {
        console.error("Erreur de récupération:", err);
        setError(err.message);
        setBulletins([]);
        setFilteredBulletins([]);
        showNotification('Erreur lors du chargement des bulletins', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBulletins();
  }, []);

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...bulletins];

    if (filters.semestre) {
      filtered = filtered.filter(b => b.semestre?.toLowerCase().includes(filters.semestre.toLowerCase()));
    }

    if (filters.cours) {
      filtered = filtered.filter(b => b.cours?.toLowerCase().includes(filters.cours.toLowerCase()));
    }

    if (filters.search) {
      filtered = filtered.filter(b => 
        b.cours?.toLowerCase().includes(filters.search.toLowerCase()) ||
        b.professeur?.nomComplet?.toLowerCase().includes(filters.search.toLowerCase()) ||
        (b.notes && b.notes.some(note => 
          note.titre?.toLowerCase().includes(filters.search.toLowerCase())
        ))
      );
    }

    if (filters.dateDebut) {
      filtered = filtered.filter(b => 
        new Date(b.createdAt || b.dateCreation) >= new Date(filters.dateDebut)
      );
    }

    if (filters.dateFin) {
      filtered = filtered.filter(b => 
        new Date(b.createdAt || b.dateCreation) <= new Date(filters.dateFin)
      );
    }

    // Tri
    if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt || b.dateCreation || 0) - new Date(a.createdAt || a.dateCreation || 0));
    } else if (filters.sortBy === 'moyenne') {
      filtered.sort((a, b) => (b.moyenneFinale || 0) - (a.moyenneFinale || 0));
    } else if (filters.sortBy === 'cours') {
      filtered.sort((a, b) => (a.cours || '').localeCompare(b.cours || ''));
    }

    setFilteredBulletins(filtered);
  }, [bulletins, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      semestre: '',
      cours: '',
      search: '',
      sortBy: 'date',
      dateDebut: '',
      dateFin: ''
    });
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/bulletins/etudiant/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.bulletins && Array.isArray(data.bulletins)) {
        setBulletins(data.bulletins);
        setFilteredBulletins(data.bulletins);
      } else if (Array.isArray(data)) {
        setBulletins(data);
        setFilteredBulletins(data);
      }
      showNotification('Données actualisées avec succès');
    } catch (err) {
      setError(err.message);
      showNotification('Erreur lors de l\'actualisation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (bulletin) => {
    setSelectedBulletin(bulletin);
    setShowDetailModal(true);
  };

  // Fonctions utilitaires pour les classes CSS
  const getMoyenneClass = (moyenne) => {
    if (!moyenne) return 'non-note';
    if (moyenne >= 16) return 'excellent';
    if (moyenne >= 14) return 'tres-bien';
    if (moyenne >= 12) return 'bien';
    if (moyenne >= 10) return 'assez-bien';
    return 'insuffisant';
  };

  const getNoteClass = (note) => {
    if (note >= 16) return 'excellent';
    if (note >= 14) return 'tres-bien';
    if (note >= 12) return 'bien';
    if (note >= 10) return 'assez-bien';
    return 'insuffisant';
  };

  // Calculer les statistiques générales
  const calculateStats = () => {
    if (bulletins.length === 0) return null;
    
    const moyennes = bulletins.filter(b => b.moyenneFinale).map(b => b.moyenneFinale);
    const moyenneGenerale = moyennes.length > 0 ? 
      (moyennes.reduce((a, b) => a + b, 0) / moyennes.length).toFixed(2) : 'N/A';
    
    const admis = bulletins.filter(b => b.moyenneFinale >= 10).length;
    const total = bulletins.filter(b => b.moyenneFinale).length;
    
    return {
      moyenneGenerale,
      tauxReussite: total > 0 ? ((admis / total) * 100).toFixed(1) : 0,
      totalBulletins: bulletins.length,
      bulletinsNotes: total,
      meilleureNote: moyennes.length > 0 ? Math.max(...moyennes).toFixed(2) : 'N/A'
    };
  };

  const stats = calculateStats();

  // Obtenir les options uniques pour les filtres
  const uniqueSemestres = [...new Set(bulletins.map(b => b.semestre).filter(Boolean))];
  const uniqueCours = [...new Set(bulletins.map(b => b.cours).filter(Boolean))];

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <h3 style={styles.loadingTitle}>Chargement de vos bulletins...</h3>
          <p style={styles.loadingText}>Récupération de vos résultats académiques</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <AlertCircle size={48} color="#ef4444" />
          <h3 style={styles.errorTitle}>Erreur de chargement</h3>
          <p style={styles.errorText}>{error}</p>
          <button onClick={refreshData} style={styles.retryButton}>
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Notification */}<Sidebar onLogout={handleLogout} />
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'error' ? '#fee2e2' : 
                          notification.type === 'info' ? '#e0f2fe' : '#dcfce7',
          color: notification.type === 'error' ? '#dc2626' : 
                notification.type === 'info' ? '#0369a1' : '#166534',
          border: `1px solid ${notification.type === 'error' ? '#fca5a5' : 
                               notification.type === 'info' ? '#7dd3fc' : '#86efac'}`
        }}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {notification.message}
        </div>
      )}

      {/* Header avec statistiques */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerMain}>
            <div style={styles.headerTitle}>
              <div>
                <h1 style={styles.title}>Mes Bulletins de Notes</h1>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button 
                onClick={() => setShowVisibilitySettings(!showVisibilitySettings)}
                style={{
                  ...styles.secondaryButton, 
                  backgroundColor: showVisibilitySettings ? '#f0fdf4' : '#f8fafc',
                  color: showVisibilitySettings ? '#166534' : '#374151'
                }}
              >
                <Settings size={18} />
                Affichage {showVisibilitySettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  ...styles.secondaryButton, 
                  backgroundColor: showFilters ? '#e0f2fe' : '#f8fafc'
                }}
              >
                <Filter size={18} />
                Filtres {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button 
                onClick={refreshData}
                style={styles.secondaryButton}
                disabled={loading}
              >
                <RefreshCw size={18} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Paramètres de visibilité */}
          {showVisibilitySettings && (
            <div style={styles.visibilitySection}>
              <h3 style={styles.visibilitySectionTitle}>
                <Settings size={20} />
                Personnaliser l'affichage
              </h3>
              <div style={styles.visibilityGrid}>
                <div style={styles.visibilityItem}>
                  <button
                    onClick={() => toggleVisibility('statistics')}
                    style={{
                      ...styles.visibilityButton,
                      backgroundColor: visibilitySettings.statistics ? '#dcfce7' : '#fee2e2',
                      color: visibilitySettings.statistics ? '#166534' : '#dc2626'
                    }}
                  >
                    {visibilitySettings.statistics ? <Eye size={16} /> : <EyeOff size={16} />}
                    Statistiques générales
                  </button>
                </div>
                
                <div style={styles.visibilityItem}>
                  <button
                    onClick={() => toggleVisibility('notesPreview')}
                    style={{
                      ...styles.visibilityButton,
                      backgroundColor: visibilitySettings.notesPreview ? '#dcfce7' : '#fee2e2',
                      color: visibilitySettings.notesPreview ? '#166534' : '#dc2626'
                    }}
                  >
                    {visibilitySettings.notesPreview ? <Eye size={16} /> : <EyeOff size={16} />}
                    Aperçu des notes
                  </button>
                </div>
                
                <div style={styles.visibilityItem}>
                  <button
                    onClick={() => toggleVisibility('remarquePreview')}
                    style={{
                      ...styles.visibilityButton,
                      backgroundColor: visibilitySettings.remarquePreview ? '#dcfce7' : '#fee2e2',
                      color: visibilitySettings.remarquePreview ? '#166534' : '#dc2626'
                    }}
                  >
                    {visibilitySettings.remarquePreview ? <Eye size={16} /> : <EyeOff size={16} />}
                    Remarques professeur
                  </button>
                </div>
                
                <div style={styles.visibilityItem}>
                  <button
                    onClick={() => toggleVisibility('professeurInfo')}
                    style={{
                      ...styles.visibilityButton,
                      backgroundColor: visibilitySettings.professeurInfo ? '#dcfce7' : '#fee2e2',
                      color: visibilitySettings.professeurInfo ? '#166534' : '#dc2626'
                    }}
                  >
                    {visibilitySettings.professeurInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                    Infos professeur
                  </button>
                </div>
                
                <div style={styles.visibilityItem}>
                  <button
                    onClick={() => toggleVisibility('dateInfo')}
                    style={{
                      ...styles.visibilityButton,
                      backgroundColor: visibilitySettings.dateInfo ? '#dcfce7' : '#fee2e2',
                      color: visibilitySettings.dateInfo ? '#166534' : '#dc2626'
                    }}
                  >
                    {visibilitySettings.dateInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                    Dates
                  </button>
                </div>
                
                <div style={styles.visibilityItem}>
                  <button
                    onClick={() => toggleVisibility('coefficients')}
                    style={{
                      ...styles.visibilityButton,
                      backgroundColor: visibilitySettings.coefficients ? '#dcfce7' : '#fee2e2',
                      color: visibilitySettings.coefficients ? '#166534' : '#dc2626'
                    }}
                  >
                    {visibilitySettings.coefficients ? <Eye size={16} /> : <EyeOff size={16} />}
                    Coefficients
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques générales */}
          {stats && visibilitySettings.statistics && (
            <div style={styles.statsSection}>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <BarChart3 size={24} color="#3b82f6" />
                  </div>
                  <div style={styles.statContent}>
                    <div style={styles.statValue}>{stats.moyenneGenerale}</div>
                    <div style={styles.statLabel}>Moyenne Générale</div>
                  </div>
                </div>
                
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <Target size={24} color="#10b981" />
                  </div>
                  <div style={styles.statContent}>
                    <div style={styles.statValue}>{stats.tauxReussite}%</div>
                    <div style={styles.statLabel}>Taux de Réussite</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <Award size={24} color="#f59e0b" />
                  </div>
                  <div style={styles.statContent}>
                    <div style={styles.statValue}>{stats.meilleureNote}</div>
                    <div style={styles.statLabel}>Meilleure Note</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <FileText size={24} color="#8b5cf6" />
                  </div>
                  <div style={styles.statContent}>
                    <div style={styles.statValue}>{stats.totalBulletins}</div>
                    <div style={styles.statLabel}>Total Bulletins</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section des filtres */}
      {showFilters && (
        <div style={styles.filtersSection}>
          <div style={styles.filtersContainer}>
            <div style={styles.filtersGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Search size={16} />
                  Recherche générale
                </label>
                <input
                  type="text"
                  placeholder="Cours, professeur, évaluation..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <BookOpen size={16} />
                  Cours
                </label>
                <select
                  value={filters.cours}
                  onChange={(e) => handleFilterChange('cours', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Tous les cours</option>
                  {uniqueCours.map(cours => (
                    <option key={cours} value={cours}>{cours}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} />
                  Semestre
                </label>
                <select
                  value={filters.semestre}
                  onChange={(e) => handleFilterChange('semestre', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Tous les semestres</option>
                  {uniqueSemestres.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <TrendingUp size={16} />
                  Trier par
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  style={styles.select}
                >
                  <option value="date">Date (récent)</option>
                  <option value="moyenne">Moyenne (élevée)</option>
                  <option value="cours">Cours (A-Z)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} />
                  Date début
                </label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} />
                  Date fin
                </label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.filtersActions}>
              <button onClick={resetFilters} style={styles.resetButton}>
                <RefreshCw size={16} />
                Réinitialiser
              </button>
              <div style={styles.resultsCount}>
                {filteredBulletins.length} bulletin{filteredBulletins.length > 1 ? 's' : ''} trouvé{filteredBulletins.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div style={styles.content}>
        {filteredBulletins.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={64} color="#9ca3af" />
            <h3 style={styles.emptyTitle}>
              {bulletins.length === 0 ? 'Aucun bulletin disponible' : 'Aucun résultat trouvé'}
            </h3>
            <p style={styles.emptyText}>
              {bulletins.length === 0 
                ? "Vos bulletins apparaîtront ici une fois qu'ils seront publiés par vos professeurs."
                : "Aucun bulletin ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
              }
            </p>
            {bulletins.length === 0 && (
              <button onClick={refreshData} style={styles.primaryButton}>
                <RefreshCw size={20} />
                Actualiser
              </button>
            )}
          </div>
        ) : (
          <div style={styles.bulletinsList}>
            {filteredBulletins.map(bulletin => (
              <div key={bulletin._id} style={styles.bulletinCard}>
                <div style={styles.bulletinHeader}>
                  <div style={styles.bulletinInfo}>
                    <h3 style={styles.bulletinTitle}>
                      <BookOpen size={20} color="#3b82f6" />
                      {bulletin.cours}
                    </h3>
                    <div style={styles.bulletinMeta}>
                      <span style={styles.semestreBadge}>
                        <Calendar size={14} />
                        {bulletin.semestre}
                      </span>
                      {visibilitySettings.professeurInfo && (
                        <span style={styles.professeurInfo}>
                          <User size={14} />
                          {bulletin.professeur?.nomComplet || 'Non spécifié'}
                        </span>
                      )}
                      {visibilitySettings.dateInfo && (bulletin.createdAt || bulletin.dateCreation) && (
                        <span style={styles.dateInfo}>
                          <Clock size={14} />
                          {new Date(bulletin.createdAt || bulletin.dateCreation).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={styles.moyenneSection}>
                    <div style={styles.moyenneLabel}>Moyenne</div>
                    <div style={{
                      ...styles.moyenneValue,
                      ...styles[getMoyenneClass(bulletin.moyenneFinale)]
                    }}>
                      {bulletin.moyenneFinale ?? 'N/C'}
                      {bulletin.moyenneFinale && <span style={styles.moyenneMax}>/20</span>}
                    </div>
                  </div>
                </div>

                {/* Aperçu des notes */}
                {visibilitySettings.notesPreview && bulletin.notes && bulletin.notes.length > 0 && (
                  <div style={styles.notesPreview}>
                    <div style={styles.notesHeader}>
                      <h4 style={styles.notesTitle}>
                        <Star size={16} />
                        Détail des évaluations ({bulletin.notes.length})
                      </h4>
                    </div>
                    <div style={styles.notesGrid}>
                      {bulletin.notes.slice(0, 3).map((note, idx) => (
                        <div key={idx} style={styles.noteItem}>
                          <div style={styles.noteHeader}>
                            <span style={styles.noteTitle}>{note.titre}</span>
                            {visibilitySettings.coefficients && (
                              <span style={styles.coeffBadge}>Coef. {note.coefficient}</span>
                            )}
                          </div>
                          <div style={{
                            ...styles.noteValue,
                            ...styles[getNoteClass(note.note)]
                          }}>
                            {note.note}/20
                          </div>
                        </div>
                      ))}
                      {bulletin.notes.length > 3 && (
                        <div style={styles.moreNotes}>
                          <span>+{bulletin.notes.length - 3} autre(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Remarque aperçu */}
                {visibilitySettings.remarquePreview && bulletin.remarque && (
                  <div style={styles.remarquePreview}>
                    <h4 style={styles.remarqueTitle}>
                      <FileText size={16} />
                      Remarque du professeur
                    </h4>
                    <p style={styles.remarqueText}>
                      {bulletin.remarque.length > 100 
                        ? `${bulletin.remarque.substring(0, 100)}...`
                        : bulletin.remarque
                      }
                    </p>
                  </div>
                )}

                <div style={styles.bulletinActions}>
                  <button 
                    onClick={() => handleViewDetail(bulletin)}
                    style={styles.viewButton}
                  >
                    <Eye size={16} />
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détails - reste identique à l'original */}
      {showDetailModal && selectedBulletin && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FileText size={24} />
                Bulletin détaillé - {selectedBulletin.cours}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBulletin(null);
                }}
                style={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Informations générales */}
              <div style={styles.detailSection}>
                <h3 style={styles.detailSectionTitle}>
                  <BookOpen size={20} />
                  Informations générales
                </h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Semestre</span>
                    <span style={styles.detailValue}>{selectedBulletin.semestre}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Professeur</span>
                    <span style={styles.detailValue}>{selectedBulletin.professeur?.nomComplet || 'Non spécifié'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Date de création</span>
                    <span style={styles.detailValue}>
                      {(selectedBulletin.createdAt || selectedBulletin.dateCreation) ? 
                        new Date(selectedBulletin.createdAt || selectedBulletin.dateCreation).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Non spécifiée'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes détaillées */}
              {selectedBulletin.notes && selectedBulletin.notes.length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailSectionTitle}>
                    <Star size={20} />
                    Détail des évaluations
                  </h3>
                  <div style={styles.notesDetailTable}>
                    <div style={styles.notesTableHeader}>
                      <span>Évaluation</span>
                      <span>Note</span>
                      {visibilitySettings.coefficients && <span>Coefficient</span>}
                      <span>Contribution</span>
                    </div>
                    {selectedBulletin.notes.map((note, idx) => {
                      const totalCoef = selectedBulletin.notes.reduce((sum, n) => sum + (n.coefficient || 0), 0);
                      const contribution = totalCoef > 0 ? ((note.note * note.coefficient / totalCoef) * 100 / 20).toFixed(1) : 0;
                      
                      return (
                        <div key={idx} style={{
                          ...styles.notesTableRow,
                          gridTemplateColumns: visibilitySettings.coefficients ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr'
                        }}>
                          <span style={styles.evaluationName}>{note.titre}</span>
                          <span style={{
                            ...styles.noteDetailValue,
                            ...styles[getNoteClass(note.note)]
                          }}>
                            {note.note}/20
                          </span>
                          {visibilitySettings.coefficients && (
                            <span style={styles.coeffValue}>x{note.coefficient}</span>
                          )}
                          <span style={styles.contributionValue}>{contribution}%</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={styles.moyenneDetail}>
                    <div style={styles.moyenneDetailLabel}>Moyenne finale pondérée</div>
                    <div style={{
                      ...styles.moyenneDetailValue,
                      ...styles[getMoyenneClass(selectedBulletin.moyenneFinale)]
                    }}>
                      {selectedBulletin.moyenneFinale ?? 'N/C'}/20
                    </div>
                  </div>
                </div>
              )}

              {/* Remarque complète */}
              {selectedBulletin.remarque && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailSectionTitle}>
                    <FileText size={20} />
                    Remarque du professeur
                  </h3>
                  <div style={styles.remarqueDetail}>
                    <p style={styles.remarqueDetailText}>{selectedBulletin.remarque}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  
  // Notification
  notification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 1001,
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    fontWeight: '600',
    minWidth: '300px'
  },

  // Header
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px'
  },
  headerMain: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '32px',
    gap: '20px'
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },

  // Section de visibilité
  visibilitySection: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '24px',
    marginTop: '24px'
  },
  visibilitySectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  visibilityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px'
  },
  visibilityItem: {
    display: 'flex'
  },
  visibilityButton: {
    width: '100%',
    border: '2px solid',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },

  // Statistiques
  statsSection: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    backgroundColor: '#fefefe',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  statIcon: {
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc'
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },

  // Filtres
  filtersSection: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  filtersContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px'
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  filtersActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #f3f4f6'
  },
  resetButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  resultsCount: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },

  // Contenu principal
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px'
  },
  bulletinsList: {
    display: 'grid',
    gap: '24px'
  },
  bulletinCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease'
  },
  bulletinHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  bulletinInfo: {
    flex: 1,
    minWidth: '300px'
  },
  bulletinTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  bulletinMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  semestreBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600'
  },
  professeurInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f0fdf4',
    color: '#166534',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500'
  },
  dateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500'
  },
  moyenneSection: {
    textAlign: 'center',
    minWidth: '120px'
  },
  moyenneLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px'
  },
  moyenneValue: {
    fontSize: '32px',
    fontWeight: '800',
    padding: '16px 20px',
    borderRadius: '16px',
    position: 'relative',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  moyenneMax: {
    fontSize: '18px',
    opacity: 0.7,
    fontWeight: '600'
  },

  // Classes de couleurs pour les moyennes et notes
  excellent: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  'tres-bien': {
    backgroundColor: '#dbeafe',
    color: '#1e40af'
  },
  bien: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1'
  },
  'assez-bien': {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  insuffisant: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },
  'non-note': {
    backgroundColor: '#f3f4f6',
    color: '#6b7280'
  },

  // Aperçu des notes
  notesPreview: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e5e7eb'
  },
  notesHeader: {
    marginBottom: '16px'
  },
  notesTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  notesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px'
  },
  noteItem: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s ease'
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  noteTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  coeffBadge: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600'
  },
  noteValue: {
    fontSize: '20px',
    fontWeight: '700',
    textAlign: 'center',
    padding: '12px',
    borderRadius: '10px'
  },
  moreNotes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '24px',
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },

  // Remarque aperçu
  remarquePreview: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#f0fdf4',
    borderRadius: '16px',
    border: '1px solid #bbf7d0'
  },
  remarqueTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#166534',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  remarqueText: {
    fontSize: '14px',
    color: '#166534',
    margin: 0,
    lineHeight: '1.6',
    fontStyle: 'italic'
  },

  // Actions du bulletin
  bulletinActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '20px',
    borderTop: '1px solid #f3f4f6'
  },
  viewButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },

  // États vides et de chargement
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '40px'
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '24px'
  },
  loadingTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280'
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '40px'
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#dc2626',
    margin: '16px 0 8px 0'
  },
  errorText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
    padding: '60px 40px',
    backgroundColor: 'white',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
  },
  emptyTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
    margin: '24px 0 12px 0'
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: '1.6',
    marginBottom: '32px',
    maxWidth: '500px'
  },

  // Boutons
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
  },
  secondaryButton: {
    backgroundColor: '#f8fafc',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },

  // Formulaires
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: 'white'
  },
  select: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: 'white',
    transition: 'all 0.2s ease'
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalLarge: {
    backgroundColor: 'white',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  modalHeader: {
    padding: '32px 32px 0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  modalContent: {
    padding: '32px',
    maxHeight: 'calc(90vh - 100px)',
    overflowY: 'auto'
  },

  // Sections de détail
  detailSection: {
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e5e7eb'
  },
  detailSectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  detailItem: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  detailLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    display: 'block'
  },
  detailValue: {
    fontSize: '16px',
    color: '#111827',
    fontWeight: '600'
  },

  // Tableau des notes détaillées
  notesDetailTable: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  notesTableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '14px',
    fontWeight: '700',
    color: '#374151'
  },
  notesTableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '20px',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center'
  },
  evaluationName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827'
  },
  noteDetailValue: {
    fontSize: '16px',
    fontWeight: '700',
    padding: '8px 12px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  coeffValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center'
  },
  contributionValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center'
  },

  // Moyenne détaillée
  moyenneDetail: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#fffbeb',
    borderRadius: '12px',
    border: '2px solid #fbbf24',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  moyenneDetailLabel: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#92400e'
  },
  moyenneDetailValue: {
    fontSize: '24px',
    fontWeight: '800',
    padding: '12px 20px',
    borderRadius: '12px'
  },

  // Remarque détaillée
  remarqueDetail: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #bbf7d0'
  },
  remarqueDetailText: {
    fontSize: '16px',
    color: '#166534',
    margin: 0,
    lineHeight: '1.7',
    fontStyle: 'italic'
  }
};

// Animation CSS pour le spinner
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Injecter les keyframes dans le document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = spinKeyframes;
  document.head.appendChild(styleSheet);
}

export default EtudiantBulletins;