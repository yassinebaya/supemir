import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Upload, 
  Calendar, 
  BookOpen, 
  Eye,
  Loader2,
  Filter,
  Grid,
  List,
  AlertCircle,
  File,
  Book
} from 'lucide-react';
import SidebarProf from '../components/SidebarProf';

const DocumentsProfesseur = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  // États pour le formulaire d'upload
  const [titre, setTitre] = useState('');
  const [cours, setCours] = useState('');
  const [file, setFile] = useState(null);
  const [mesCours, setMesCours] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Vérification du rôle
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'prof') {
      window.location.href = '/';
    }
  }, []);

  // Charger les documents
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://195.179.229.230:5000/api/professeur/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setDocuments(data);
      setFilteredDocuments(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setLoading(false);
    }
  };

  // Charger les cours du professeur
  const fetchCours = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://195.179.229.230:5000/api/professeur/mes-cours', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMesCours(data);
    } catch (err) {
      console.error('Erreur lors du chargement des cours:', err);
    }
  };

  useEffect(() => {
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

  // Ouvrir le modal et charger les cours
  const openModal = () => {
    setShowModal(true);
    fetchCours();
    // Reset form
    setTitre('');
    setCours('');
    setFile(null);
    setUploadMessage('');
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setUploadMessage('');
  };

  // Upload de document
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!titre || !cours || !file) {
      return setUploadMessage('Veuillez remplir tous les champs.');
    }

    setUploadLoading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('titre', titre);
    formData.append('cours', cours);
    formData.append('fichier', file);

    try {
      const response = await fetch('http://195.179.229.230:5000/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setUploadMessage('Document envoyé avec succès');
        setTitre('');
        setCours('');
        setFile(null);
        
        // Recharger la liste des documents
        fetchDocuments();
        
        // Fermer le modal après 1.5 secondes
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setUploadMessage("Erreur lors de l'envoi");
      }
      
    } catch (err) {
      console.error(err);
      setUploadMessage("Erreur lors de l'envoi");
    } finally {
      setUploadLoading(false);
    }
  };

  // Supprimer un document
  const handleDelete = async (documentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    setDeleteLoading(documentId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://195.179.229.230:5000/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Retirer le document de la liste
        setDocuments(documents.filter(doc => doc._id !== documentId));
      } else {
        alert('Erreur lors de la suppression du document');
      }
      
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression du document');
    } finally {
      setDeleteLoading(null);
    }
  };

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
    background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)',
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
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
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
    addButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '14px'
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
      cursor: 'pointer',
      border: 'none'
    },
    buttonOutline: {
      border: '1px solid #2563eb',
      color: '#2563eb',
      backgroundColor: 'transparent'
    },
    buttonDelete: {
      border: '1px solid #dc2626',
      color: '#dc2626',
      backgroundColor: 'transparent'
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
      transition: 'all 0.2s',
      border: 'none',
      cursor: 'pointer'
    },
    // Modal styles
    modalOverlay: {
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
      zIndex: 50
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      width: '100%',
      maxWidth: '28rem',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px',
      borderBottom: '1px solid #e5e7eb'
    },
    modalTitleSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: 0
    },
    closeButton: {
      padding: '8px',
      border: 'none',
      background: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      color: '#6b7280'
    },
    modalContent: {
      padding: '24px'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none',
      transition: 'all 0.2s',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    selectInput: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none',
      transition: 'all 0.2s',
      fontSize: '14px',
      boxSizing: 'border-box',
      backgroundColor: 'white'
    },
    message: {
      padding: '12px',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '16px'
    },
    messageSuccess: {
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      border: '1px solid #bbf7d0'
    },
    messageError: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    },
    modalButtonGroup: {
      display: 'flex',
      gap: '12px',
      paddingTop: '16px'
    },
    cancelButton: {
      flex: 1,
      padding: '12px 16px',
      color: '#374151',
      backgroundColor: '#f3f4f6',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    submitButton: {
      flex: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    submitButtonDisabled: {
      backgroundColor: '#93c5fd',
      cursor: 'not-allowed'
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
      {/* Header */}        <SidebarProf onLogout={handleLogout}/>

      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ ...styles.headerInner, flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ ...styles.headerLeft, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <div style={styles.iconContainer}>
              </div>
              <div>
                <h1 style={{ ...styles.title, textAlign: 'center', width: '100%' }}>Mes Documents</h1>
              </div>
            </div>
            <div style={styles.headerRight}>
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

              <button 
                onClick={openModal}
                style={styles.addButton}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                <Plus style={{width: '16px', height: '16px'}} />
                Ajouter
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
                : "Commencez par ajouter votre premier document"}
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
                        <Eye style={styles.buttonIcon} />
                        Voir
                      </a>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        disabled={deleteLoading === doc._id}
                        style={{
                          ...styles.button,
                          ...styles.buttonDelete,
                          ...(deleteLoading === doc._id ? {opacity: 0.5, cursor: 'not-allowed'} : {})
                        }}
                        onMouseEnter={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.backgroundColor = '#fee2e2';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {deleteLoading === doc._id ? (
                          <Loader2 style={styles.buttonIcon} className="animate-spin" />
                        ) : (
                          <Trash2 style={styles.buttonIcon} />
                        )}
                        Supprimer
                      </button>
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
                        <Eye style={styles.buttonIcon} />
                        Voir
                      </a>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        disabled={deleteLoading === doc._id}
                        style={{
                          ...styles.listButton,
                          ...styles.buttonDelete,
                          ...(deleteLoading === doc._id ? {opacity: 0.5, cursor: 'not-allowed'} : {})
                        }}
                        onMouseEnter={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.backgroundColor = '#fee2e2';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {deleteLoading === doc._id ? (
                          <Loader2 style={styles.buttonIcon} className="animate-spin" />
                        ) : (
                          <Trash2 style={styles.buttonIcon} />
                        )}
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal pour ajouter un document */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={styles.modal}>
            {/* Header du modal */}
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <div style={styles.iconContainer}>
                  <Upload style={{width: '20px', height: '20px', color: '#2563eb'}} />
                </div>
                <h2 style={styles.modalTitle}>Ajouter un document</h2>
              </div>
              <button
                onClick={closeModal}
                style={styles.closeButton}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <X style={{width: '20px', height: '20px'}} />
              </button>
            </div>

            {/* Contenu du modal */}
            <form onSubmit={handleUpload} style={styles.modalContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Titre du document</label>
                <input
                  type="text"
                  placeholder="Entrez le titre du document..."
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Cours</label>
                <select
                  value={cours}
                  onChange={(e) => setCours(e.target.value)}
                  style={styles.selectInput}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                >
                  <option value="">Sélectionnez un cours</option>
                  {mesCours.map(c => (
                    <option key={c._id} value={c.nom}>{c.nom}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fichier</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                />
                <p style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
                  Formats acceptés : PDF, DOC, DOCX
                </p>
              </div>

              {uploadMessage && (
                <div style={{
                  ...styles.message,
                  ...(uploadMessage.includes('succès') ? styles.messageSuccess : styles.messageError)
                }}>
                  {uploadMessage}
                </div>
              )}

              <div style={styles.modalButtonGroup}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={styles.cancelButton}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  style={{
                    ...styles.submitButton,
                    ...(uploadLoading ? styles.submitButtonDisabled : {})
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadLoading) {
                      e.target.style.backgroundColor = '#1d4ed8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadLoading) {
                      e.target.style.backgroundColor = '#2563eb';
                    }
                  }}
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 style={{width: '16px', height: '16px'}} className="animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Upload style={{width: '16px', height: '16px'}} />
                      Ajouter le document
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @media (max-width: 768px) {
          .documents-grid {
            grid-template-columns: 1fr !important;
          }
          
          .header-inner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          
          .search-container {
            flex-direction: column !important;
          }
          
          .search-input-container,
          .select-container {
            min-width: auto !important;
          }
          
          .list-item {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .list-buttons {
            margin-left: 0 !important;
            margin-top: 16px !important;
            justify-content: stretch !important;
          }
          
          .list-button {
            flex: 1 !important;
          }
        }
        
        @media (max-width: 480px) {
          .modal {
            margin: 16px !important;
            width: calc(100% - 32px) !important;
          }
          
          .button-container {
            flex-direction: column !important;
          }
          
          .view-toggle {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentsProfesseur;