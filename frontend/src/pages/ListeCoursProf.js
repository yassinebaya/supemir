import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar,
  Users,
  Clock,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Plus,
  Eye,
  Loader
} from 'lucide-react';
import SidebarProf from '../components/SidebarProf';

 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const ListeCoursProf = () => {
  const [cours, setCours] = useState([]);
  const [filteredCours, setFilteredCours] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCours = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('http://localhost:5000/api/professeur/mes-cours', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCours(res.data);
        setFilteredCours(res.data);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des cours');
      } finally {
        setLoading(false);
      }
    };

    fetchCours();
  }, []);

  useEffect(() => {
    let filtered = cours.filter(c => 
      c.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.nom.localeCompare(b.nom);
      } else {
        return b.nom.localeCompare(a.nom);
      }
    });

    setFilteredCours(filtered);
  }, [searchTerm, sortOrder, cours]);

  const styles = {
    container: {
      minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    },
    header: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '0'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px',
      display: 'flex',
      justifyContent: 'center', // centre horizontalement
      alignItems: 'center',     // centre verticalement
      height: '100px',          // facultatif, à adapter selon ton layout
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    addButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      textDecoration: 'none'
    },
    mainContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 20px'
    },
    controlsCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    },
    controlsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '16px'
    },
    searchContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 40px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      color: '#6b7280',
      zIndex: 1
    },
    sortButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease'
    },
    viewModeContainer: {
      display: 'flex',
      gap: '4px'
    },
    viewModeButton: {
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    viewModeButtonActive: {
      backgroundColor: '#dbeafe',
      color: '#3b82f6',
      borderColor: '#3b82f6'
    },
    resultsCount: {
      fontSize: '14px',
      color: '#6b7280'
    },
    coursGrid: {
      display: 'grid',
      gap: '24px'
    },
    coursGridMode: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
    },
    coursListMode: {
      gridTemplateColumns: '1fr'
    },
    coursCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    },
    coursCardHover: {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-2px)'
    },
    coursHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '16px'
    },
    coursTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0 0 8px 0'
    },
    coursDescription: {
      fontSize: '14px',
      color: '#6b7280',
      lineHeight: '1.5',
      margin: '0'
    },
    coursStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '16px'
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#6b7280'
    },
    coursFooter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: '16px',
      borderTop: '1px solid #e2e8f0'
    },
    viewLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#3b82f6',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'color 0.2s ease'
    },
    emptyState: {
      textAlign: 'center',
      padding: '64px 20px',
      color: '#6b7280'
    },
    emptyStateIcon: {
      margin: '0 auto 16px',
      color: '#9ca3af'
    },
    emptyStateTitle: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    emptyStateText: {
      fontSize: '14px',
      color: '#6b7280'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '16px'
    },
    loadingSpinner: {
      animation: 'spin 1s linear infinite'
    },
    loadingText: {
      color: '#6b7280',
      fontSize: '14px'
    },
    errorContainer: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      padding: '16px',
      color: '#dc2626',
      fontSize: '14px',
      marginBottom: '24px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Loader size={32} style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Chargement des cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.mainContent}>
          <div style={styles.errorContainer}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .cours-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .sort-button:hover {
          background-color: #f9fafb;
        }
        
        .view-link:hover {
          color: #1d4ed8;
        }
        
        .add-button:hover {
          background-color: #2563eb;
          transform: translateY(-1px);
        }
        
        @media (max-width: 768px) {
          .controls-grid {
            grid-template-columns: 1fr;
          }
          
          .cours-grid-mode {
            grid-template-columns: 1fr;
          }
          
          .header-content {
            flex-direction: column;
            height: auto;
            padding: 16px 20px;
            gap: 16px;
          }
          
          .cours-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
                <SidebarProf onLogout={handleLogout}/>
        
        <div style={styles.headerContent} className="header-content">
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Mes Cours</h1>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Controls */}
        <div style={styles.controlsCard}>
          <div style={styles.controlsGrid} className="controls-grid">
            {/* Search */}
            <div style={styles.searchContainer}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                style={styles.searchInput}
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={styles.sortButton}
              className="sort-button"
            >
              {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              <span>Trier par nom</span>
            </button>

            {/* View Mode */}
            <div style={styles.viewModeContainer}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  ...styles.viewModeButton,
                  ...(viewMode === 'grid' ? styles.viewModeButtonActive : {})
                }}
                title="Vue grille"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  ...styles.viewModeButton,
                  ...(viewMode === 'list' ? styles.viewModeButtonActive : {})
                }}
                title="Vue liste"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Results count */}
          <div style={styles.resultsCount}>
            {filteredCours.length} cours trouvé{filteredCours.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Course List */}
        {filteredCours.length === 0 ? (
          <div style={styles.emptyState}>
            <BookOpen size={48} style={styles.emptyStateIcon} />
            <h3 style={styles.emptyStateTitle}>Aucun cours trouvé</h3>
            <p style={styles.emptyStateText}>
              {searchTerm ? 'Essayez de modifier votre recherche' : 'Vous n\'avez pas encore créé de cours'}
            </p>
          </div>
        ) : (
          <div 
            style={{
              ...styles.coursGrid,
              ...(viewMode === 'grid' ? styles.coursGridMode : styles.coursListMode)
            }}
            className={viewMode === 'grid' ? 'cours-grid-mode' : ''}
          >
            {filteredCours.map(c => (
              <div key={c._id} style={styles.coursCard} className="cours-card">
                <div style={styles.coursHeader}>
                  <div>
                    <h3 style={styles.coursTitle}>{c.nom}</h3>
                    {c.description && (
                      <p style={styles.coursDescription}>{c.description}</p>
                    )}
                  </div>
                </div>
                

                <div style={styles.coursStats}>
                  <div style={styles.statItem}>
                    <Clock size={16} />
                    <span>Créé récemment</span>
                  </div>
                  <div style={styles.statItem}>
                    <BookOpen size={16} />
                    <span>Exercices</span>
                  </div>
                </div>

                <div style={styles.coursFooter}>
                  <Link
                    to={`/professeur/exercices/${c.nom}`}
                    style={styles.viewLink}
                    className="view-link"
                  >
                    <Eye size={16} />
                    <span>Voir les exercices</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListeCoursProf;