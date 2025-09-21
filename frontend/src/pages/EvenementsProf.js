import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  FileText, 
  Tag, 
  Search, 
  BookOpen, 
  Users, 
  Clock,
  MapPin,
  Filter
} from 'lucide-react';
import SidebarProf from '../components/SidebarProf';

const EvenementsProf = () => {
  const [evenements, setEvenements] = useState([]);
  const [filteredEvenements, setFilteredEvenements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const navigate = useNavigate();
   const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'prof') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchEvenements = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/evenements/public', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvenements(res.data);
        setFilteredEvenements(res.data);
      } catch (err) {
        console.error('Erreur lors du chargement des événements publics:', err);
      }
    };

    fetchEvenements();
  }, []);

  useEffect(() => {
    let filtered = evenements;

    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(e => e.type === selectedType);
    }

    setFilteredEvenements(filtered);
  }, [searchTerm, selectedType, evenements]);

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'conférence':
        return <Users size={18} />;
      case 'atelier':
        return <BookOpen size={18} />;
      case 'séminaire':
        return <FileText size={18} />;
      default:
        return <Calendar size={18} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'conférence':
        return '#3b82f6';
      case 'atelier':
        return '#10b981';
      case 'séminaire':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const uniqueTypes = [...new Set(evenements.map(e => e.type))];

  const styles = {
    container: {
      minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',

      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '30px',
      marginBottom: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1f2937',
      margin: '0 0 10px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0'
    },
    searchSection: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    searchContainer: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    searchInputWrapper: {
      position: 'relative',
      flex: '1',
      minWidth: '250px'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 44px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      background: '#ffffff',
      outline: 'none'
    },
    searchIcon: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af'
    },
    filterSelect: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '16px',
      background: '#ffffff',
      cursor: 'pointer',
      minWidth: '150px',
      outline: 'none',
      transition: 'all 0.3s ease'
    },
    eventsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '24px',
      marginBottom: '30px'
    },
    eventCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    },
    eventHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '16px'
    },
    eventTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f2937',
      margin: '0',
      lineHeight: '1.3'
    },
    typeChip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      color: '#ffffff',
      marginLeft: '12px'
    },
    eventInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    infoItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      fontSize: '14px',
      color: '#4b5563'
    },
    infoIcon: {
      marginTop: '2px',
      flexShrink: 0
    },
    noEvents: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '40px',
      textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    noEventsText: {
      fontSize: '18px',
      color: '#6b7280',
      margin: '12px 0 0 0'
    },
    decorativeCircle: {
      position: 'absolute',
      top: '-50px',
      right: '-50px',
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
      zIndex: 0
    }
  };

  // Styles responsifs
  const mediaQueries = `
    @media (max-width: 768px) {
      .search-container {
        flex-direction: column;
        align-items: stretch;
      }
      .search-input-wrapper {
        min-width: unset;
      }
      .events-grid {
        grid-template-columns: 1fr;
      }
      .event-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .type-chip {
        margin-left: 0;
      }
    }
    
    @media (hover: hover) {
      .search-input:hover, .search-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .filter-select:hover, .filter-select:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .event-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      }
    }
  `;

  return (
    <div style={styles.container}>
        <SidebarProf onLogout={handleLogout}/>
      <style>{mediaQueries}</style>
      <div style={styles.content}>
        <div style={{ ...styles.header, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <h1 style={{ ...styles.title, textAlign: 'center', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              Événements Publics
            </h1>
          </div>
        
        </div>

        <div style={styles.searchSection}>
          <div style={styles.searchContainer} className="search-container">
            <div style={styles.searchInputWrapper} className="search-input-wrapper">
              <Search style={styles.searchIcon} size={20} />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                className="search-input"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={styles.filterSelect}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredEvenements.length === 0 ? (
          <div style={styles.noEvents}>
            <Search size={48} color="#9ca3af" />
            <p style={styles.noEventsText}>
              {searchTerm || selectedType 
                ? "Aucun événement ne correspond à vos critères de recherche."
                : "Aucun événement public disponible pour le moment."
              }
            </p>
          </div>
        ) : (
          <div style={styles.eventsGrid} className="events-grid">
            {filteredEvenements.map(e => (
              <div 
                key={e._id} 
                style={styles.eventCard}
                className="event-card"
              >
                <div style={styles.decorativeCircle}></div>
                <div style={styles.eventHeader} className="event-header">
                  <h3 style={styles.eventTitle}>{e.titre}</h3>
                  <div 
                    style={{
                      ...styles.typeChip,
                      backgroundColor: getTypeColor(e.type)
                    }}
                    className="type-chip"
                  >
                    {getTypeIcon(e.type)}
                    {e.type}
                  </div>
                </div>
                
                <div style={styles.eventInfo}>
                  <div style={styles.infoItem}>
                    <Calendar style={styles.infoIcon} size={16} color="#3b82f6" />
                    <span>
                      <strong>Date:</strong> {new Date(e.dateDebut).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {e.dateFin && (
  <div style={styles.infoItem}>
    <Clock style={styles.infoIcon} size={16} color="#f59e0b" />
    <span>
      <strong>Date de fin:</strong> {new Date(e.dateFin).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </span>
  </div>
)}

                  {e.description && (
                    <div style={styles.infoItem}>
                      <FileText style={styles.infoIcon} size={16} color="#10b981" />
                      <span>
                        <strong>Description:</strong> {e.description}
                      </span>
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

export default EvenementsProf;