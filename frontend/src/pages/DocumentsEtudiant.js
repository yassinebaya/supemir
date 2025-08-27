import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebaretudiant from '../components/sidebaretudiant.js';

import { 
  BookOpen, 
  Search, 
  Download, 
  ExternalLink, 
  Calendar, 
  File, 
  Filter,
  Grid,
  List,
  Loader2,
  FileText,
  Book,
  AlertCircle
} from 'lucide-react';

const DocumentsEtudiant = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  // Vérification du rôle
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'etudiant') {
      navigate('/');
    }
  }, [navigate]);
 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
  // Chargement des documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://195.179.229.230:5000/api/documents', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setDocuments(res.data);
        setFilteredDocuments(res.data);
      } catch (err) {
        console.error('Erreur documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Filtrage des documents
  useEffect(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.cours.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCourse) {
      filtered = filtered.filter(doc => doc.cours === selectedCourse);
    }

    setFilteredDocuments(filtered);
  }, [searchTerm, selectedCourse, documents]);

  // Obtenir la liste des cours uniques
  const uniqueCourses = [...new Set(documents.map(doc => doc.cours))];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText style={{width: '20px', height: '20px', color: '#dc2626'}} />;
      case 'doc':
      case 'docx':
        return <File style={{width: '20px', height: '20px', color: '#2563eb'}} />;
      default:
        return <File style={{width: '20px', height: '20px', color: '#6b7280'}} />;
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px'
    },
    headerInner: {
      padding: '24px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
  
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0 0 4px 0'
    },
    subtitle: {
      color: '#6b7280',
      margin: 0
    },
    viewToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      padding: '4px'
    },
    viewButton: {
      padding: '8px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: 'transparent'
    },
    viewButtonActive: {
      backgroundColor: 'white',
      color: '#2563eb',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    },
    viewButtonInactive: {
      color: '#6b7280'
    },
    mainContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px'
    },
    searchSection: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '24px',
      marginBottom: '24px'
    },
    searchContainer: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap'
    },
    searchInputContainer: {
      flex: 1,
      minWidth: '300px',
      position: 'relative'
    },
    searchInput: {
      width: '100%',
      paddingLeft: '40px',
      paddingRight: '16px',
      paddingTop: '12px',
      paddingBottom: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s',
      outline: 'none'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
      width: '20px',
      height: '20px'
    },
    selectContainer: {
      position: 'relative',
      minWidth: '200px'
    },
    select: {
      paddingLeft: '40px',
      paddingRight: '32px',
      paddingTop: '12px',
      paddingBottom: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      cursor: 'pointer',
      outline: 'none',
      width: '100%'
    },
    filterIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
      width: '20px',
      height: '20px'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column'
    },
    loadingText: {
      color: '#6b7280',
      marginTop: '16px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 0'
    },
    emptyIcon: {
      width: '64px',
      height: '64px',
      backgroundColor: '#f3f4f6',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px'
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#111827',
      margin: '0 0 8px 0'
    },
    emptyDescription: {
      color: '#6b7280',
      margin: 0
    },
    documentsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '24px'
    },
    documentsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    documentCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '24px',
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    documentCardList: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '16px',
      transition: 'all 0.2s'
    },
    documentHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '16px'
    },
    documentTitleSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
      minWidth: 0
    },
    documentTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    documentMeta: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '16px'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      color: '#6b7280'
    },
    metaIcon: {
      width: '16px',
      height: '16px',
      marginRight: '8px'
    },
    metaText: {
      fontWeight: '500'
    },
    buttonContainer: {
      display: 'flex',
      gap: '8px'
    },
    button: {
      flex: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 12px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      textDecoration: 'none',
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    buttonOutline: {
      border: '1px solid #2563eb',
      color: '#2563eb',
      backgroundColor: 'transparent'
    },
    buttonPrimary: {
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none'
    },
    buttonIcon: {
      width: '16px',
      height: '16px',
      marginRight: '4px'
    },
    listItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    listContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: 1,
      minWidth: 0
    },
    listTitleSection: {
      flex: 1,
      minWidth: 0
    },
    listTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 4px 0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    listMetaContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginTop: '4px'
    },
    listMetaItem: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      color: '#6b7280'
    },
    listButtons: {
      display: 'flex',
      gap: '8px',
      marginLeft: '16px'
    },
    listButton: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      textDecoration: 'none',
      transition: 'all 0.2s'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Loader2 style={{width: '32px', height: '32px', color: '#2563eb'}} className="animate-spin" />
          <p style={styles.loadingText}>Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}     <Sidebaretudiant onLogout={handleLogout} />

      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ 
            ...styles.headerInner, 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            gap: '24px' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
              <div style={styles.iconContainer}>
              </div>
              <div>
                <h1 style={{ ...styles.title, textAlign: 'center', width: '100%' }}>Documents Disponibles</h1>
              </div>
            </div>
            {/* View Mode Toggle */}
            <div style={styles.viewToggle}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  ...styles.viewButton,
                  ...(viewMode === 'grid' ? styles.viewButtonActive : styles.viewButtonInactive)
                }}
              >
                <Grid style={{width: '16px', height: '16px'}} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  ...styles.viewButton,
                  ...(viewMode === 'list' ? styles.viewButtonActive : styles.viewButtonInactive)
                }}
              >
                <List style={{width: '16px', height: '16px'}} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={styles.mainContent}>
        <div style={styles.searchSection}>
          <div style={styles.searchContainer}>
            {/* Search Bar */}
            <div style={styles.searchInputContainer}>
              <Search style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Rechercher un document ou un cours..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Course Filter */}
            <div style={styles.selectContainer}>
              <Filter style={styles.filterIcon} />
              <select
                style={styles.select}
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="">Tous les cours</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid/List */}
        {filteredDocuments.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <AlertCircle style={{width: '32px', height: '32px', color: '#9ca3af'}} />
            </div>
            <h3 style={styles.emptyTitle}>Aucun document trouvé</h3>
            <p style={styles.emptyDescription}>
              {searchTerm || selectedCourse 
                ? "Essayez de modifier vos critères de recherche" 
                : "Aucun document disponible pour vos cours"}
            </p>
          </div>
        ) : (
          <div style={viewMode === 'grid' ? styles.documentsGrid : styles.documentsList}>
            {filteredDocuments.map(doc => (
              <div 
                key={doc._id} 
                style={viewMode === 'grid' ? styles.documentCard : styles.documentCardList}
                onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
                onMouseLeave={(e) => e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div style={styles.documentHeader}>
                      <div style={styles.documentTitleSection}>
                        {getFileIcon(doc.fichier)}
                        <h3 style={styles.documentTitle}>
                          {doc.titre}
                        </h3>
                      </div>
                    </div>

                    <div style={styles.documentMeta}>
                      <div style={styles.metaItem}>
                        <Book style={{...styles.metaIcon, color: '#2563eb'}} />
                        <span style={styles.metaText}>{doc.cours}</span>
                      </div>
                      <div style={styles.metaItem}>
                        <Calendar style={{...styles.metaIcon, color: '#059669'}} />
                        <span>{formatDate(doc.dateUpload)}</span>
                      </div>
                    </div>

                    <div style={styles.buttonContainer}>
                      <a
                        href={`http://195.179.229.230:5000${doc.fichier}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{...styles.button, ...styles.buttonOutline}}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dbeafe'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <ExternalLink style={styles.buttonIcon} />
                        Voir
                      </a>
                      <a
                        href={`http://195.179.229.230:5000${doc.fichier}`}
                        download
                        style={{...styles.button, ...styles.buttonPrimary}}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                      >
                        <Download style={styles.buttonIcon} />
                        Télécharger
                      </a>
                    </div>
                  </>
                ) : (
                  // List View
                  <div style={styles.listItem}>
                    <div style={styles.listContent}>
                      {getFileIcon(doc.fichier)}
                      <div style={styles.listTitleSection}>
                        <h3 style={styles.listTitle}>
                          {doc.titre}
                        </h3>
                        <div style={styles.listMetaContainer}>
                          <span style={styles.listMetaItem}>
                            <Book style={{...styles.metaIcon, width: '12px', height: '12px'}} />
                            {doc.cours}
                          </span>
                          <span style={styles.listMetaItem}>
                            <Calendar style={{...styles.metaIcon, width: '12px', height: '12px'}} />
                            {formatDate(doc.dateUpload)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.listButtons}>
                      <a
                        href={`http://195.179.229.230:5000${doc.fichier}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{...styles.listButton, ...styles.buttonOutline}}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dbeafe'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <ExternalLink style={styles.buttonIcon} />
                        Voir
                      </a>
                      <a
                        href={`http://195.179.229.230:5000${doc.fichier}`}
                        download
                        style={{...styles.listButton, ...styles.buttonPrimary}}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                      >
                        <Download style={styles.buttonIcon} />
                        Télécharger
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsEtudiant;