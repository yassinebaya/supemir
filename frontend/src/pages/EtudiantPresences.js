import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, BookOpen, MessageCircle, Search, X, Filter, Users, Clock } from 'lucide-react';
import Sidebar from '../components/sidebaretudiant';
import { useNavigate } from 'react-router-dom';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const EtudiantPresencesAbsences = () => {
  const [presences, setPresences] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [activeTab, setActiveTab] = useState('presences'); // 'presences' ou 'absences'
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'etudiant') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Récupérer les présences
        const presencesRes = await fetch('http://localhost:5000/api/etudiant/presences', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const presencesData = await presencesRes.json();
        setPresences(presencesData);

        // Récupérer les absences
        const absencesRes = await fetch('http://localhost:5000/api/etudiant/absences', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const absencesData = await absencesRes.json();
        setAbsences(absencesData);

        // Initialiser les données filtrées avec les présences par défaut
        setFilteredData(presencesData);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Effet pour filtrer les données selon l'onglet actif et les critères de recherche
  useEffect(() => {
    const currentData = activeTab === 'presences' ? presences : absences;
    let filtered = currentData;

    // Filtre par texte (cours ou remarque)
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.cours.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.remarque && item.remarque.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtre par date
    if (dateFilter === 'custom' && (dateRange.start || dateRange.end)) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.dateSession);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          return itemDate >= startDate;
        } else if (endDate) {
          return itemDate <= endDate;
        }
        return true;
      });
    } else if (dateFilter && dateFilter !== 'custom') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.dateSession);
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        switch (dateFilter) {
          case 'today':
            return itemDateOnly.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDateOnly >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDateOnly >= monthAgo;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return itemDateOnly >= yearAgo;
          default:
            return true;
        }
      });
    }

    setFilteredData(filtered);
  }, [searchTerm, dateFilter, dateRange, presences, absences, activeTab]);

  // Gestion du changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Réinitialiser les filtres lors du changement d'onglet
    setSearchTerm('');
    setDateFilter('');
    setDateRange({ start: '', end: '' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    if (e.target.value !== 'custom') {
      setDateRange({ start: '', end: '' });
    }
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setDateRange({ start: '', end: '' });
  };

  const hasActiveFilters = searchTerm || dateFilter || dateRange.start || dateRange.end;
  const currentData = activeTab === 'presences' ? presences : absences;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTitle}>
            <h1 style={styles.title}>Suivi de Présence</h1>
          </div>
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{presences.length}</span>
              <span style={styles.statLabel}>Présences</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{absences.length}</span>
              <span style={styles.statLabel}>Absences</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{filteredData.length}</span>
              <span style={styles.statLabel}>Affichées</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabsWrapper}>
          <button
            onClick={() => handleTabChange('presences')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'presences' ? styles.activeTab : styles.inactiveTab)
            }}
          >
            <CheckCircle size={20} />
            <span>Présences ({presences.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('absences')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'absences' ? styles.activeTab : styles.inactiveTab)
            }}
          >
            <XCircle size={20} />
            <span>Absences ({absences.length})</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={styles.searchContainer}>
        <div style={styles.searchWrapper}>
          <div style={styles.filtersRow}>
            {/* Search Input */}
            <div style={styles.searchInputContainer}>
              <Search size={20} color="#6b7280" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Rechercher par cours ou remarque..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={styles.clearButton}
                  title="Effacer la recherche"
                >
                  <X size={18} color="#6b7280" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <div style={styles.dateFilterContainer}>
              <Calendar size={20} color="#6b7280" style={styles.filterIcon} />
              <select
                value={dateFilter}
                onChange={handleDateFilterChange}
                style={styles.dateSelect}
              >
                <option value="">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="year">Cette année</option>
                <option value="custom">Période personnalisée</option>
              </select>
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={styles.clearAllButton}
                title="Effacer tous les filtres"
              >
                <X size={18} />
                Effacer
              </button>
            )}
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div style={styles.dateRangeContainer}>
              <div style={styles.dateRangeInputs}>
                <div style={styles.dateInputGroup}>
                  <label style={styles.dateLabel}>Du :</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
                <div style={styles.dateInputGroup}>
                  <label style={styles.dateLabel}>Au :</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results Info */}
          {hasActiveFilters && (
            <div style={styles.searchResults}>
              <Filter size={16} color="#6b7280" />
              <span>
                {filteredData.length} résultat{filteredData.length !== 1 ? 's' : ''} 
                {filteredData.length !== currentData.length && ` sur ${currentData.length}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {filteredData.length === 0 ? (
          <div style={styles.emptyState}>
            {activeTab === 'presences' ? (
              <CheckCircle size={64} color="#d1d5db" />
            ) : (
              <XCircle size={64} color="#d1d5db" />
            )}
            <h3 style={styles.emptyTitle}>
              {hasActiveFilters ? 'Aucun résultat trouvé' : 
                `Aucune ${activeTab === 'presences' ? 'présence' : 'absence'} enregistrée`
              }
            </h3>
            <p style={styles.emptyText}>
              {hasActiveFilters 
                ? `Aucune ${activeTab === 'presences' ? 'présence' : 'absence'} ne correspond aux critères de recherche. Essayez de modifier vos filtres.`
                : `Vos ${activeTab === 'presences' ? 'présences' : 'absences'} aux séances apparaîtront ici une fois enregistrées.`
              }
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} style={styles.clearSearchButton}>
                Afficher toutes les {activeTab === 'presences' ? 'présences' : 'absences'}
              </button>
            )}
          </div>
        ) : (
          <div style={styles.presencesGrid}>
            {filteredData.map((item, index) => (
              <div key={index} style={styles.presenceCard} className="presence-card">
                <div style={styles.cardHeader}>
                  <div style={styles.courseInfo}>
                    <BookOpen size={20} color="#4f46e5" />
                    <span style={styles.courseName}>{item.cours}</span>
                  </div>
                  <div style={activeTab === 'presences' ? styles.presentBadge : styles.absentBadge}>
                    {activeTab === 'presences' ? (
                      <CheckCircle size={16} color="#10b981" />
                    ) : (
                      <XCircle size={16} color="#ef4444" />
                    )}
                    <span style={styles.statusText}>
                      {activeTab === 'presences' ? 'Présent' : 'Absent'}
                    </span>
                  </div>
                </div>
                
                <div style={styles.cardContent}>
                  <div style={styles.dateInfo}>
                    <Calendar size={18} color="#6b7280" />
                    <div style={styles.dateDetails}>
                      <span style={styles.dateLabel}>Date de séance</span>
                      <span style={styles.dateValue}>
                        {new Date(item.dateSession).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  {/* remarque */}
                  {item.remarque && (
                    <div style={styles.remarqueInfo}>
                      <MessageCircle size={18} color="#6b7280" />
                      <div style={styles.remarqueDetails}>
                        <span style={styles.remarqueLabel}>Remarque</span>
                        <span style={styles.remarqueValue}>{item.remarque}</span>
                      </div>
                    </div>
                  )}
                  {/* matiere */}
                  {item.matiere && (
                    <div style={styles.remarqueInfo}>
                      <BookOpen size={18} color="#6b7280" />
                      <div style={styles.remarqueDetails}>
                        <span style={styles.remarqueLabel}>Matière</span>
                        <span style={styles.remarqueValue}>{item.matiere}</span>
                      </div>
                    </div>
                  )}
    {(item.periode || item.heure) && (
  <div style={styles.remarqueInfo}>
    <Clock size={18} color="#6b7280" />
    <div style={styles.remarqueDetails}>
      {item.periode && (
        <>
          <span style={styles.remarqueLabel}>Période</span>
          <span style={styles.remarqueValue}>
            {item.periode === 'matin'
              ? 'Matin'
              : item.periode === 'soir'
              ? 'Soir'
              : item.periode}
          </span>
        </>
      )}
      {item.heure && (
        <>
          <span style={styles.remarqueLabel}>Heure</span>
          <span style={styles.remarqueValue}>{item.heure}</span>
        </>
      )}
    </div>
  </div>
)}


                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '1.5rem 0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    gap: '1rem',
  },
  
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  
  statsContainer: {
    display: 'flex',
    gap: '2rem',
  },
  
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#3b82f6',
  },
  
  statLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '500',
  },

  // Styles pour les onglets
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0',
  },

  tabsWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    gap: '0',
  },

  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    border: 'none',
    borderBottom: '3px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },

  activeTab: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },

  inactiveTab: {
    color: '#6b7280',
    borderBottomColor: 'transparent',
  },

  // Styles pour la section de recherche et filtres
  searchContainer: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '1rem 0',
  },

  searchWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },

  searchInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 300px',
    minWidth: '250px',
  },

  searchIcon: {
    position: 'absolute',
    left: '1rem',
    zIndex: 1,
  },

  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.75rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none',
    color: '#1f2937',
  },

  dateFilterContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '0 0 auto',
  },

  filterIcon: {
    position: 'absolute',
    left: '1rem',
    zIndex: 1,
  },

  dateSelect: {
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.75rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none',
    color: '#1f2937',
    cursor: 'pointer',
    minWidth: '200px',
  },

  clearButton: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },

  clearAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },

  dateRangeContainer: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    border: '1px solid #e5e7eb',
  },

  dateRangeInputs: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'end',
    flexWrap: 'wrap',
  },

  dateInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: '1 1 150px',
  },

  dateLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },

  dateInput: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none',
    color: '#1f2937',
  },

  searchResults: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  },

  clearSearchButton: {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
  },
  
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  loadingText: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '3rem 1rem',
    gap: '1rem',
  },
  
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  
  emptyText: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
    maxWidth: '400px',
    lineHeight: '1.5',
  },
  
  presencesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  
  presenceCard: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.2s ease',
  },
  
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.25rem',
    gap: '1rem',
  },
  
  courseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0,
  },
  
  courseName: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    wordBreak: 'break-word',
  },
  
  presentBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#dcfce7',
    borderRadius: '0.5rem',
    border: '1px solid #bbf7d0',
    flexShrink: 0,
  },

  absentBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#fecaca',
    borderRadius: '0.5rem',
    border: '1px solid #fca5a5',
    flexShrink: 0,
  },
  
  statusText: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#065f46',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  
  dateInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  
  dateDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  
  dateLabel: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  dateValue: {
    fontSize: '0.875rem',
    color: '#1f2937',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  
  remarqueInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  },
  
  remarqueDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  
  remarqueLabel: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  remarqueValue: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.4',
  },
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .presence-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  /* Styles pour les éléments interactifs */
  input[type="text"]:focus,
  input[type="date"]:focus,
  select:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }

  .clear-button:hover {
    background-color: #f3f4f6 !important;
  }

  .clear-all-button:hover {
    background-color: #e5e7eb !important;
    color: #374151 !important;
  }

  .clear-search-button:hover {
    background-color: #2563eb !important;
  }

  /* Styles pour les onglets */
  .tab-button:hover {
    background-color: #f8fafc !important;
  }

  /* Styles pour les badges d'absence */
  .absent-badge .status-text {
    color: #991b1b !important;
  }

  select option {
    padding: 0.5rem;
  }
  
 @media (max-width: 768px) {
    .presences-grid {
      grid-template-columns: 1fr !important;
    }
    
    .filters-row {
      flex-direction: column !important;
      gap: 1rem !important;
    }
    
    .search-input-container {
      flex: 1 1 auto !important;
      min-width: 100% !important;
    }
    
    .date-filter-container {
      flex: 1 1 auto !important;
    }
    
    .date-select {
      min-width: 100% !important;
    }
    
    .stats-container {
      flex-direction: column !important;
      gap: 1rem !important;
    }
    
    .header-content {
      flex-direction: column !important;
    }
    
    .tabs-wrapper {
      flex-direction: column !important;
      gap: 0 !important;
    }
    
    .tab-button {
      justify-content: center !important;
      border-bottom: none !important;
      border-right: 3px solid transparent !important;
    }
    
    .tab-button.active {
      border-right-color: #3b82f6 !important;
    }
    
    .date-range-inputs {
      flex-direction: column !important;
    }
    
    .date-input-group {
      flex: 1 1 auto !important;
    }
    
    .course-info {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.5rem !important;
    }
    
    .card-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.75rem !important;
    }
    
    .present-badge,
    .absent-badge {
      align-self: flex-start !important;
    }
  }
  
  @media (max-width: 480px) {
    .main-content {
      padding: 1rem 0.5rem !important;
    }
    
    .header-content {
      padding: 0 0.5rem !important;
    }
    
    .search-wrapper {
      padding: 0 0.5rem !important;
    }
    
    .tabs-wrapper {
      padding: 0 0.5rem !important;
    }
    
    .title {
      font-size: 24px !important;
    }
    
    .presence-card {
      padding: 1rem !important;
    }
    
    .stats-container {
      flex-direction: row !important;
      gap: 1rem !important;
    }
    
    .stat-number {
      font-size: 1.25rem !important;
    }
  }
`;

document.head.appendChild(styleSheet);

export default EtudiantPresencesAbsences;