import React, { useEffect, useState } from 'react';
import { Calendar, Book, Eye, X, Users, Check, AlertCircle, FileText, Search, Filter, ChevronDown, Clock } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SidebarProf from '../components/SidebarProf';

const ListePresences = () => {
  const [presences, setPresences] = useState([]);
  const [groupedSessions, setGroupedSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [sessionActive, setSessionActive] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [coursFilter, setCoursFilter] = useState('');
  const [presenceRateFilter, setPresenceRateFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availableCours, setAvailableCours] = useState([]);
  const [heureFilter, setHeureFilter] = useState('');
  const [periodeFilter, setPeriodeFilter] = useState('');
  const [availableHeures, setAvailableHeures] = useState([]);
  const [matiereFilter, setMatiereFilter] = useState('');
  const [professeurFilter, setProfesseurFilter] = useState('');
  const [availableMatieres, setAvailableMatieres] = useState([]);
  const [availableProfesseurs, setAvailableProfesseurs] = useState([]);
  const navigate = useNavigate();

  // Utilitaire pour formater l'horaire
  const formatHoraire = (heure, periode) => {
    if (!heure && !periode) return 'Non spécifié';
    if (!heure) return periode ? periode.charAt(0).toUpperCase() + periode.slice(1) : 'Non spécifié';
    if (!periode) return heure;
    return `${heure} (${periode.charAt(0).toUpperCase() + periode.slice(1)})`;
  };

  useEffect(() => {
    const fetchPresences = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'prof') {
          navigate('/');
          return;
        }

        const res = await axios.get('http://localhost:5000/api/professeur/presences', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data;

        // ===== NOUVEAU GROUPAGE =====
        const grouped = {};
        for (let p of data) {
          const dateStr = new Date(p.dateSession).toDateString();
          const heureStr = p.heure || 'Non spécifiée';
          const periodeStr = p.periode || 'Non spécifiée';
          const matiereStr = p.matiere || 'Non spécifiée';
          const nomProfesseurStr = p.nomProfesseur || 'Non spécifié';
          const key = `${dateStr}_${p.cours}_${heureStr}_${periodeStr}_${matiereStr}_${nomProfesseurStr}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(p);
        }

        const sessions = Object.entries(grouped).map(([key, values]) => {
          const [date, cours, heure, periode, matiere, nomProfesseur] = key.split('_');
          const presentCount = values.filter(p => p.present).length;
          const totalCount = values.length;
          return {
            date,
            cours,
            heure,
            periode,
            matiere,
            nomProfesseur,
            presences: values,
            presentCount,
            totalCount,
            attendanceRate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
          };
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // ✅ ترتيب تنازلي حسب التاريخ

        const uniqueCours = [...new Set(sessions.map(s => s.cours))];
        setAvailableCours(uniqueCours);
        const uniqueHeures = [...new Set(sessions.map(s => s.heure).filter(h => h && h !== 'Non spécifiée'))];
        setAvailableHeures(uniqueHeures);
        const uniqueMatieres = [...new Set(sessions.map(s => s.matiere).filter(m => m && m !== 'Non spécifiée'))];
        setAvailableMatieres(uniqueMatieres);
        const uniqueProfesseurs = [...new Set(sessions.map(s => s.nomProfesseur).filter(p => p && p !== 'Non spécifié'))];
        setAvailableProfesseurs(uniqueProfesseurs);

        setGroupedSessions(sessions);
        setFilteredSessions(sessions);
      } catch (err) {
        console.error('❌ Erreur chargement présences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresences();
  }, []);

  // Fonction de filtrage
  useEffect(() => {
    let filtered = [...groupedSessions];

    // Recherche textuelle
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.cours.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDate(session.date).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.heure && session.heure.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.periode && session.periode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.matiere && session.matiere.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.nomProfesseur && session.nomProfesseur.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtre par date
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      filtered = filtered.filter(session => session.date === filterDate);
    }

    // Filtre par cours
    if (coursFilter && coursFilter !== 'all') {
      filtered = filtered.filter(session => session.cours === coursFilter);
    }

    // Filtre par matière
    if (matiereFilter && matiereFilter !== 'all') {
      filtered = filtered.filter(session => session.matiere === matiereFilter);
    }

    // Filtre par professeur
    if (professeurFilter && professeurFilter !== 'all') {
      filtered = filtered.filter(session => session.nomProfesseur === professeurFilter);
    }

    // Filtre par taux de présence
    if (presenceRateFilter && presenceRateFilter !== 'all') {
      filtered = filtered.filter(session => {
        switch (presenceRateFilter) {
          case 'high':
            return session.attendanceRate >= 80;
          case 'medium':
            return session.attendanceRate >= 50 && session.attendanceRate < 80;
          case 'low':
            return session.attendanceRate < 50;
          default:
            return true;
        }
      });
    }

    // Filtre par heure
    if (heureFilter && heureFilter !== 'all') {
      filtered = filtered.filter(session => session.heure === heureFilter);
    }

    // Filtre par période
    if (periodeFilter && periodeFilter !== 'all') {
      filtered = filtered.filter(session => session.periode === periodeFilter);
    }

    setFilteredSessions(filtered.sort((a, b) => new Date(b.date) - new Date(a.date))); // ✅ ترتيب النتائج المفلترة أيضًا
  }, [searchTerm, dateFilter, coursFilter, presenceRateFilter, heureFilter, periodeFilter, matiereFilter, professeurFilter, groupedSessions]);

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setCoursFilter('');
    setPresenceRateFilter('');
    setHeureFilter('');
    setPeriodeFilter('');
  };

  const styles = {
    container: {
      minHeight: '100vh',
    background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '24px'
    },
    header: {
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
 
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#111827',
      margin: 0
    },
    subtitle: {
      color: '#6b7280',
      margin: '4px 0 0 0',
      fontSize: '14px'
    },
    searchContainer: {
      padding: '24px',
      borderBottom: '1px solid #e5e7eb'
    },
    searchBar: {
      position: 'relative',
      marginBottom: '16px'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 44px',
      fontSize: '14px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      backgroundColor: '#ffffff',
      transition: 'all 0.2s',
      outline: 'none'
    },
    searchIcon: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af'
    },
    filtersToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: '#f3f4f6',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      transition: 'all 0.2s'
    },
    advancedFilters: {
      marginTop: '16px',
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    filtersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '16px'
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: '500',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    filterInput: {
      padding: '8px 12px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      transition: 'border-color 0.2s'
    },
    filterSelect: {
      padding: '8px 12px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 8px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px',
      paddingRight: '32px'
    },
    clearButton: {
      padding: '8px 16px',
      fontSize: '12px',
      fontWeight: '500',
      color: '#6b7280',
      backgroundColor: 'transparent',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    resultsCount: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    tableHeader: {
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb'
    },
    th: {
      padding: '12px 24px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '500',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    td: {
      padding: '16px 24px',
      borderBottom: '1px solid #f3f4f6',
      verticalAlign: 'middle'
    },
    tableRow: {
      transition: 'background-color 0.2s',
      cursor: 'pointer'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#2563eb',
      backgroundColor: '#eff6ff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    progressContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    progressBar: {
      width: '100px',
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'hidden'
    },
    modalHeader: {
      padding: '24px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    modalBody: {
      padding: '24px',
      overflowY: 'auto',
      maxHeight: 'calc(90vh - 120px)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    statCard: {
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid'
    },
    statCardGreen: {
      backgroundColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      color: '#166534'
    },
    statCardRed: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      color: '#991b1b'
    },
    statCardBlue: {
      backgroundColor: '#eff6ff',
      borderColor: '#bfdbfe',
      color: '#1e40af'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      border: '1px solid'
    },
    badgeGreen: {
      backgroundColor: '#f0fdf4',
      color: '#166534',
      borderColor: '#bbf7d0'
    },
    badgeRed: {
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      borderColor: '#fecaca'
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      gap: '16px'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: '#6b7280'
    },
    closeButton: {
      padding: '8px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#6b7280',
      transition: 'background-color 0.2s'
    },
    mobileCard: {
      padding: '16px',
      borderBottom: '1px solid #f3f4f6'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Chargement des présences...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .table-row:hover {
            background-color: #f9fafb;
          }
          
          .button:hover {
            background-color: #dbeafe;
          }
          
          .close-button:hover {
            background-color: #f3f4f6;
          }
          
          .search-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .filters-toggle:hover {
            background-color: #e5e7eb;
          }
          
          .filter-input:focus, .filter-select:focus {
            border-color: #3b82f6;
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          }
          
          .clear-button:hover {
            background-color: #f3f4f6;
            border-color: #9ca3af;
            color: #374151;
          }
          
          @media (max-width: 768px) {
            .desktop-table {
              display: none;
            }
            .filters-grid {
              grid-template-columns: 1fr;
            }
          }
          
          @media (min-width: 769px) {
            .mobile-cards {
              display: none;
            }
          }
        `}
      </style>

      <div style={styles.maxWidth}>
              {/* Header */} <SidebarProf onLogout={handleLogout} /> {/* ✅ Utilisation du composant SidebarProfesseur */}

        {/* Header */}
        <div style={styles.card}>
          <div style={{
            ...styles.header,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={styles.iconContainer}>
            </div>
            <div>
              <h1 style={{ ...styles.title, textAlign: 'center', width: '100%' }}>Liste des Présences</h1>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div style={styles.searchContainer}>
            {/* Barre de recherche principale */}
            <div style={styles.searchBar}>
              <Search size={20} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Rechercher par classe, date, heure, période..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                className="search-input"
              />
            </div>

            {/* Toggle filtres avancés */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={styles.filtersToggle}
                className="filters-toggle"
              >
                <Filter size={16} />
                Filtres avancés
                <ChevronDown
                  size={16}
                  style={{
                    transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>

              {(searchTerm || dateFilter || coursFilter || presenceRateFilter || heureFilter || periodeFilter) && (
                <button
                  onClick={clearFilters}
                  style={styles.clearButton}
                  className="clear-button"
                >
                  Effacer les filtres
                </button>
              )}
            </div>

            {/* Filtres avancés */}
            {showAdvancedFilters && (
              <div style={styles.advancedFilters}>
                <div style={styles.filtersGrid} className="filters-grid">
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Date</label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={styles.filterInput}
                      className="filter-input"
                    />
                  </div>

                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Classe</label>
                    <select
                      value={coursFilter}
                      onChange={(e) => setCoursFilter(e.target.value)}
                      style={styles.filterSelect}
                      className="filter-select"
                    >
                      <option value="">Tous les classes</option>
                      {availableCours.map(cours => (
                        <option key={cours} value={cours}>{cours}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Matière</label>
                    <select
                      value={matiereFilter}
                      onChange={(e) => setMatiereFilter(e.target.value)}
                      style={styles.filterSelect}
                      className="filter-select"
                    >
                      <option value="">Toutes les matières</option>
                      {availableMatieres.map(matiere => (
                        <option key={matiere} value={matiere}>{matiere}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Professeur</label>
                    <select
                      value={professeurFilter}
                      onChange={(e) => setProfesseurFilter(e.target.value)}
                      style={styles.filterSelect}
                      className="filter-select"
                    >
                      <option value="">Tous les professeurs</option>
                      {availableProfesseurs.map(prof => (
                        <option key={prof} value={prof}>{prof}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Heure</label>
                    <select
                      value={heureFilter}
                      onChange={(e) => setHeureFilter(e.target.value)}
                      style={styles.filterSelect}
                      className="filter-select"
                    >
                      <option value="">Toutes les heures</option>
                      {availableHeures.map(heure => (
                        <option key={heure} value={heure}>{heure}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Période</label>
                    <select
                      value={periodeFilter}
                      onChange={(e) => setPeriodeFilter(e.target.value)}
                      style={styles.filterSelect}
                      className="filter-select"
                    >
                      <option value="">Toutes les périodes</option>
                      <option value="matin">Matin</option>
                      <option value="soir">Soir</option>
                    </select>
                  </div>

                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Taux de présence</label>
                    <select
                      value={presenceRateFilter}
                      onChange={(e) => setPresenceRateFilter(e.target.value)}
                      style={styles.filterSelect}
                      className="filter-select"
                    >
                      <option value="">Tous</option>
                      <option value="high">Élevé (≥80%)</option>
                      <option value="medium">Moyen (50-79%)</option>
                      <option value="low">Faible (&lt;50%)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Compteur de résultats */}
            <div style={styles.resultsCount}>
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} trouvée{filteredSessions.length !== 1 ? 's' : ''}
              {filteredSessions.length !== groupedSessions.length && (
                <span> sur {groupedSessions.length} au total</span>
              )}
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        {filteredSessions.length === 0 ? (
          <div style={styles.card}>
            <div style={styles.emptyState}>
              <FileText size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: '#111827' }}>
                {groupedSessions.length === 0 ? 'Aucune présence trouvée' : 'Aucun résultat'}
              </h3>
              <p>
                {groupedSessions.length === 0 
                  ? 'Les données de présence apparaîtront ici une fois disponibles.'
                  : 'Essayez de modifier vos critères de recherche.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={{ padding: '24px 24px 0 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
                Sessions de classe
              </h2>
            </div>
            
            {/* Desktop Table */}
            <div className="desktop-table">
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.th}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} />
                        Date
                      </div>
                    </th>
                    <th style={styles.th}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Book size={16} />
                        Classe
                      </div>
                    </th>
                    <th style={styles.th}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} />
                        Matière
                      </div>
                    </th>
                    <th style={styles.th}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} />
                        Professeur
                      </div>
                    </th>
                    <th style={styles.th}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} />
                        Horaire
                      </div>
                    </th>
                    <th style={styles.th}>Taux de présence</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session, idx) => (
                    <tr key={idx} className="table-row" style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {formatDate(session.date)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{session.cours}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={{
                          fontWeight: '500',
                          color: '#059669',
                          backgroundColor: '#f0fdf4',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          display: 'inline-block'
                        }}>
                          {session.matiere || 'Non spécifiée'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {session.nomProfesseur || 'Non spécifié'}
                        </div>
                      </td>
                    <td style={styles.td}>
  <div style={{ fontWeight: '500', color: '#111827' }}>
    {formatHoraire(session.heure, session.periode)}
  </div>
</td>

                      <td style={styles.td}>
                        <div style={styles.progressContainer}>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${session.attendanceRate}%`,
                                backgroundColor: session.attendanceRate >= 80 ? '#10b981' :
                                  session.attendanceRate >= 50 ? '#f59e0b' : '#ef4444'
                              }}
                            ></div>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', minWidth: 'fit-content' }}>
                            {session.presentCount}/{session.totalCount}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          className="button"
                          style={styles.button}
                          onClick={() => setSessionActive(session)}
                        >
                          <Eye size={16} />
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards">
              {filteredSessions.map((session, idx) => (
                <div key={idx} style={styles.mobileCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: '0 0 4px 0' }}>
                        {session.cours}
                      </h3>
                      <div style={{
                        display: 'inline-block',
                        fontWeight: '500',
                        color: '#059669',
                        backgroundColor: '#f0fdf4',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        marginBottom: '4px'
                      }}>
                        {session.matiere || 'Non spécifiée'}
                      </div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} />
                        {session.nomProfesseur || 'Non spécifié'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {formatDate(session.date)}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
{formatHoraire(session.heure, session.periode)}
                      </p>
                    </div>
                    <button
                      style={{
                        ...styles.button,
                        fontSize: '12px',
                        padding: '4px 8px'
                      }}
                      onClick={() => setSessionActive(session)}
                    >
                      <Eye size={12} />
                      Voir
                    </button>
                  </div>
                  <div style={styles.progressContainer}>
                    <div style={{ ...styles.progressBar, flex: 1 }}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${session.attendanceRate}%`,
                          backgroundColor: session.attendanceRate >= 80 ? '#10b981' :
                            session.attendanceRate >= 50 ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                      {session.presentCount}/{session.totalCount} ({session.attendanceRate}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Détails */}
        {sessionActive && (
          <div style={styles.modal}>
            <div style={{ ...styles.modalContent, overflowY: 'auto', maxHeight: '90vh' }}>
              {/* Modal Header */}
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} color="#2563eb" />
                    {formatDate(sessionActive.date)}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Book size={16} />
                    {sessionActive.cours}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} />
                      <span style={{
                        fontWeight: '500',
                        color: '#059669',
                        backgroundColor: '#f0fdf4',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {sessionActive.matiere || 'Non spécifiée'}
                      </span>
                    </p>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} />
                      {sessionActive.nomProfesseur || 'Non spécifié'}
                    </p>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} />
{formatHoraire(sessionActive.heure, sessionActive.periode)}
                  </p>
                </div>
                <button
                  className="close-button"
                  style={styles.closeButton}
                  onClick={() => setSessionActive(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ ...styles.modalBody, overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
                {/* Statistics Cards */}
                <div style={styles.statsGrid}>
                  <div style={{ ...styles.statCard, ...styles.statCardGreen }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Check size={20} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Présents</span>
                    </div>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{sessionActive.presentCount}</p>
                  </div>
                  <div style={{ ...styles.statCard, ...styles.statCardRed }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <X size={20} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Absents</span>
                    </div>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{sessionActive.totalCount - sessionActive.presentCount}</p>
                  </div>
                  <div style={{ ...styles.statCard, ...styles.statCardBlue }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Users size={20} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Taux de présence</span>
                    </div>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{sessionActive.attendanceRate}%</p>
                  </div>
                </div>

                {/* Students Table */}
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f3f4f6' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>Liste des étudiants</h4>
                  </div>
                  
                  {/* Desktop Students Table */}
                  <div className="desktop-table">
                    <table style={styles.table}>
                      <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{ ...styles.th, padding: '12px 16px' }}>Étudiant</th>
                          <th style={{ ...styles.th, padding: '12px 16px' }}>Statut</th>
                          <th style={{ ...styles.th, padding: '12px 16px' }}>Remarque</th>
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: 'white' }}>
                        {sessionActive.presences.map(p => (
                          <tr key={p._id} className="table-row">
                            <td style={{ ...styles.td, padding: '12px 16px' }}>
                              <span style={{ fontWeight: '500', color: '#111827' }}>
                                {p.etudiant?.nomComplet || '—'}
                              </span>
                            </td>
                            <td style={{ ...styles.td, padding: '12px 16px' }}>
                              <span style={p.present ? { ...styles.badge, ...styles.badgeGreen } : { ...styles.badge, ...styles.badgeRed }}>
                                {p.present ? <Check size={12} /> : <X size={12} />}
                                {p.present ? 'Présent' : 'Absent'}
                              </span>
                            </td>
                            <td style={{ ...styles.td, padding: '12px 16px' }}>
                              <span style={{ color: '#6b7280' }}>{p.remarque || '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Students Cards */}
                  <div className="mobile-cards">
                    {sessionActive.presences.map(p => (
                      <div key={p._id} style={{ padding: '16px', backgroundColor: 'white', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0, flex: 1 }}>
                            {p.etudiant?.nomComplet || '—'}
                          </h5>
                          <span style={p.present ? { ...styles.badge, ...styles.badgeGreen } : { ...styles.badge, ...styles.badgeRed }}>
                            {p.present ? <Check size={12} /> : <X size={12} />}
                            {p.present ? 'Présent' : 'Absent'}
                          </span>
                        </div>
                        {p.remarque && (
                          <div style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
                            <strong>Remarque:</strong> {p.remarque}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <button
                  onClick={() => setSessionActive(null)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#4b5563',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#4b5563'}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListePresences;