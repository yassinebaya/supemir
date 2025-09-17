import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, RefreshCw, X, Eye, Download, 
  UserCheck, UserX, Mail, Phone, IdCard, Calendar, GraduationCap,
  CheckCircle, XCircle, FileText, AlertCircle, User, 
  TrendingUp, BarChart3, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Table, Grid3X3
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// Styles intégrés
const styles = {
  // Variables CSS pour la cohérence
  primaryColor: '#2563eb',
  primaryDark: '#1d4ed8',
  secondaryColor: '#64748b',
  successColor: '#059669',
  warningColor: '#d97706',
  dangerColor: '#dc2626',
  lightGray: '#f8fafc',
  mediumGray: '#e2e8f0',
  darkGray: '#334155',
  white: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  boxShadowLg: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease'
};

const EtudiantsPedagogiquePage = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [filtreAnneeScolaire, setFiltreAnneeScolaire] = useState('2025/2026');
  const [filtreNiveau, setFiltreNiveau] = useState('tous');
  const [filtreSpecialite, setFiltreSpecialite] = useState('toutes');
  const [filtreGenre, setFiltreGenre] = useState('tous');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreCours, setFiltreCours] = useState('tous');
  const [filtreTypeFormation, setFiltreTypeFormation] = useState('tous');
  const [filtreNiveauFormation, setFiltreNiveauFormation] = useState('tous');
  const [filtreCommercial, setFiltreCommercial] = useState('tous');
  const [filtrePays, setFiltrePays] = useState('tous');

  // États pour les données de référence
  const [listeCommerciaux, setListeCommerciaux] = useState([]);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // États pour les modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // États pour les actions en lot
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Vue actuelle
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'cards'

  useEffect(() => {
    fetchEtudiants();
    fetchCommerciaux();
  }, []);

  const fetchEtudiants = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch('http://195.179.229.230:5000/api/pedagogique/etudiants', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      setEtudiants(data);
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommerciaux = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://195.179.229.230:5000/api/commerciaux', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setListeCommerciaux(data);
      } else {
        console.error('Erreur lors du chargement des commerciaux');
        setListeCommerciaux([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des commerciaux:', err);
      setListeCommerciaux([]);
    }
  };



  // Fonction pour filtrer les étudiants
  const getFilteredEtudiants = () => {
    let filtered = [...etudiants];

    // Recherche textuelle
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        (e.nom && e.nom.toLowerCase().includes(search)) ||
        (e.prenom && e.prenom.toLowerCase().includes(search)) ||
        (e.nomDeFamille && e.nomDeFamille.toLowerCase().includes(search)) ||
        (e.cin && e.cin.toLowerCase().includes(search)) ||
        (e.codeMassar && e.codeMassar.toLowerCase().includes(search)) ||
        (e.codeEtudiant && e.codeEtudiant.toLowerCase().includes(search)) ||
        (e.email && e.email.toLowerCase().includes(search)) ||
        (e.telephone && e.telephone.includes(search))
      );
    }

    // Filtre par année scolaire
    if (filtreAnneeScolaire !== 'toutes') {
      filtered = filtered.filter(e => e.anneeScolaire === filtreAnneeScolaire);
    }

    // Filtre par niveau
    if (filtreNiveau !== 'tous') {
      filtered = filtered.filter(e => e.niveau === parseInt(filtreNiveau));
    }

    // Filtre par spécialité
    if (filtreSpecialite !== 'toutes') {
      filtered = filtered.filter(e => 
        e.specialite === filtreSpecialite ||
        e.specialiteIngenieur === filtreSpecialite ||
        e.specialiteLicencePro === filtreSpecialite ||
        e.specialiteMasterPro === filtreSpecialite
      );
    }

    // Filtre par genre
    if (filtreGenre !== 'tous') {
      filtered = filtered.filter(e => e.genre === filtreGenre);
    }

    // Filtre par statut
    if (filtreStatut !== 'tous') {
      if (filtreStatut === 'actifs') {
        filtered = filtered.filter(e => e.actif);
      } else if (filtreStatut === 'inactifs') {
        filtered = filtered.filter(e => !e.actif);
      } else if (filtreStatut === 'payes') {
        filtered = filtered.filter(e => e.paye);
      } else if (filtreStatut === 'non-payes') {
        filtered = filtered.filter(e => !e.paye);
      }
    }

    // Filtre par cours
    if (filtreCours !== 'tous') {
      filtered = filtered.filter(e => 
        e.cours && Array.isArray(e.cours) && e.cours.includes(filtreCours)
      );
    }

    // Filtre par type de formation
    if (filtreTypeFormation !== 'tous') {
      filtered = filtered.filter(e => e.typeFormation === filtreTypeFormation);
    }

    // Filtre par niveau de formation (FI/TA/Executive)
    if (filtreNiveauFormation !== 'tous') {
      filtered = filtered.filter(e => e.niveauFormation === filtreNiveauFormation);
    }

    return filtered;
  };

  const etudiantsFiltres = getFilteredEtudiants();

  // Pagination
  const totalPages = Math.ceil(etudiantsFiltres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEtudiants = etudiantsFiltres.slice(startIndex, startIndex + itemsPerPage);

  // Obtenir les valeurs uniques pour les filtres
  const anneesDisponibles = [...new Set(etudiants.map(e => e.anneeScolaire).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const niveauxDisponibles = [...new Set(etudiants.map(e => e.niveau).filter(n => n !== undefined))].sort((a, b) => a - b);
  const specialitesDisponibles = [...new Set(etudiants.map(e => {
    return e.specialiteIngenieur || e.specialiteLicencePro || e.specialiteMasterPro || e.specialite;
  }).filter(Boolean))].sort();
  const genresDisponibles = [...new Set(etudiants.map(e => e.genre).filter(Boolean))].sort();
  const coursDisponibles = [...new Set(etudiants.flatMap(e => e.cours || []))].filter(Boolean).sort();
  const typesFormationDisponibles = [...new Set(etudiants.map(e => e.typeFormation).filter(Boolean))].sort();
  const niveauxFormationDisponibles = [...new Set(etudiants.map(e => e.niveauFormation).filter(Boolean))].sort();
  const commerciauxDisponibles = [...new Set(etudiants.map(e => e.commercial).filter(Boolean))].sort();
  const paysDisponibles = [...new Set(etudiants.map(e => e.pays).filter(Boolean))].sort();

  // Fonctions utilitaires
  const getNomCommercial = (commercial) => {
    // Si commercial est un objet (déjà populé)
    if (commercial && typeof commercial === 'object') {
      return commercial.nomComplet || commercial.nom || 'Commercial sans nom';
    }
    
    // Si commercial est un ID string
    if (commercial && typeof commercial === 'string') {
      const commercialObj = listeCommerciaux.find(c => c._id === commercial);
      return commercialObj ? (commercialObj.nomComplet || commercialObj.nom) : 'Commercial supprimé';
    }
    
    // Si commercial est null ou undefined
    return 'Aucun commercial';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculerAge = (dateNaissance) => {
    if (!dateNaissance) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount).replace('MAD', 'DH');
  };

  const getSpecialite = (etudiant) => {
    return etudiant.specialiteIngenieur || 
           etudiant.specialiteLicencePro || 
           etudiant.specialiteMasterPro || 
           etudiant.specialite || 
           'Tronc commun';
  };

  // Gestion des actions
  const handleViewStudent = (etudiant) => {
    setSelectedStudent(etudiant);
    setShowDetailModal(true);
  };

  const handleSelectStudent = (etudiantId) => {
    setSelectedStudents(prev => {
      if (prev.includes(etudiantId)) {
        return prev.filter(id => id !== etudiantId);
      } else {
        return [...prev, etudiantId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === currentEtudiants.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(currentEtudiants.map(e => e._id));
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFiltreAnneeScolaire('2025/2026');
    setFiltreNiveau('tous');
    setFiltreSpecialite('toutes');
    setFiltreGenre('tous');
    setFiltreStatut('tous');
    setFiltreCours('tous');
    setFiltreTypeFormation('tous');
    setFiltreNiveauFormation('tous');
    setCurrentPage(1);
  };

  // Fonctions d'export
  const handleExportStudent = (etudiant) => {
    const dataToExport = {
      'Informations Personnelles': {
        'Nom Complet': `${etudiant.prenom} ${etudiant.nomDeFamille}`,
        'CIN': etudiant.cin || 'N/A',
        'Code Massar': etudiant.codeMassar || 'N/A',
        'Code Étudiant': etudiant.codeEtudiant || 'N/A',
        'Genre': etudiant.genre || 'N/A',
        'Date de Naissance': formatDate(etudiant.dateNaissance),
        'Âge': `${calculerAge(etudiant.dateNaissance)} ans`
      },
      'Contact': {
        'Email': etudiant.email || 'N/A',
        'Téléphone': etudiant.telephone || 'N/A',
        'Adresse': etudiant.adresse || 'N/A',
        'Ville': etudiant.ville || 'N/A'
      },
      'Formation': {
        'Filière': etudiant.filiere || 'N/A',
        'Type de Formation': etudiant.typeFormation || 'N/A',
        'Niveau de Formation': etudiant.niveauFormation || 'N/A',
        'Niveau': etudiant.niveau || 'N/A',
        'Cycle': etudiant.cycle || 'N/A',
        'Spécialité': getSpecialite(etudiant),
        'Année Scolaire': etudiant.anneeScolaire || 'N/A'
      },
      'Informations Financières': {
        'Prix Total': formatMoney(etudiant.prixTotal),
        'Statut Paiement': etudiant.paye ? 'Payé' : 'Non payé',
        'Date de Paiement': formatDate(etudiant.datePaiement),
        'Nouvelle Inscription': etudiant.nouvelleInscription ? 'Oui' : 'Non'
      },
      'Statuts': {
        'Actif': etudiant.actif ? 'Oui' : 'Non',
        'Handicapé': etudiant.handicape ? 'Oui' : 'Non',
        'Résident': etudiant.resident ? 'Oui' : 'Non',
        'Fonctionnaire': etudiant.fonctionnaire ? 'Oui' : 'Non',
        'Mobilité': etudiant.mobilite ? 'Oui' : 'Non'
      }
    };

    // Ajouter les cours s'ils existent
    if (etudiant.cours && etudiant.cours.length > 0) {
      dataToExport['Cours Inscrits'] = etudiant.cours.join(', ');
    }

    exportToCSV([dataToExport], `etudiant_${etudiant.prenom}_${etudiant.nomDeFamille}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportSelected = () => {
    const selectedData = etudiants.filter(e => selectedStudents.includes(e._id));
    exportStudentsToCSV(selectedData, `etudiants_selection_${new Date().toISOString().split('T')[0]}`);
  };

  const exportStudentsToCSV = (students, filename) => {
    const headers = [
      'Nom Complet',
      'CIN',
      'Code Massar',
      'Code Étudiant',
      'Genre',
      'Date de Naissance',
      'Âge',
      'Email',
      'Téléphone',
      'Tél. Responsable',
      'Adresse',
      'Ville',
      'Lieu de Naissance',
      'Pays',
      'Filière',
      'Type de Formation',
      'Niveau de Formation',
      'Niveau',
      'Spécialité',
      'Diplôme d\'Accès',
      'Spécialité Diplôme',
      'Commercial',
      'Source Inscription',
      'Année Scolaire',
      'Code Baccalauréat',
      'Prix Total',
      'Mode Paiement',
      'Statut Paiement',
      'Actif',
      'Nouvelle Inscription'
    ];

    const csvData = students.map(etudiant => [
      `${etudiant.prenom} ${etudiant.nomDeFamille}`,
      etudiant.cin || '',
      etudiant.codeMassar || '',
      etudiant.codeEtudiant || '',
      etudiant.genre || '',
      formatDate(etudiant.dateNaissance),
      calculerAge(etudiant.dateNaissance),
      etudiant.email || '',
      etudiant.telephone || '',
      etudiant.telephoneResponsable || '',
      etudiant.adresse || '',
      etudiant.ville || '',
      etudiant.lieuNaissance || '',
      etudiant.pays || '',
      etudiant.filiere || '',
      etudiant.typeFormation || '',
      etudiant.niveauFormation || '',
      etudiant.niveau || '',
      getSpecialite(etudiant),
      etudiant.diplomeAcces || '',
      etudiant.specialiteDiplomeAcces || '',
      getNomCommercial(etudiant.commercial),
      etudiant.sourceInscription || '',
      etudiant.anneeScolaire || '',
      etudiant.codeBaccalaureat || '',
      etudiant.prixTotal || 0,
      etudiant.modePaiement || '',
      etudiant.paye ? 'Payé' : 'Non payé',
      etudiant.actif ? 'Actif' : 'Inactif',
      etudiant.nouvelleInscription ? 'Oui' : 'Non'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    downloadCSV(csvContent, filename);
  };

  const exportToCSV = (data, filename) => {
    let csvContent = '';
    
    data.forEach((item, index) => {
      if (index === 0) {
        // En-têtes
        const headers = [];
        Object.keys(item).forEach(section => {
          if (typeof item[section] === 'object') {
            Object.keys(item[section]).forEach(key => {
              headers.push(`${section} - ${key}`);
            });
          } else {
            headers.push(section);
          }
        });
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
      }

      // Données
      const row = [];
      Object.keys(item).forEach(section => {
        if (typeof item[section] === 'object') {
          Object.values(item[section]).forEach(value => {
            row.push(value);
          });
        } else {
          row.push(item[section]);
        }
      });
      csvContent += row.map(r => `"${r}"`).join(',') + '\n';
    });

    downloadCSV(csvContent, filename);
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDocument = async (etudiantId, typeDocument) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://195.179.229.230:5000/api/etudiants/${etudiantId}/documents/${typeDocument}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du téléchargement');
      }

      // Obtenir le nom du fichier depuis les headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `document_${typeDocument}`;
      
      if (contentDisposition) {
        // Extraire le nom de fichier depuis Content-Disposition
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Si pas de nom dans les headers, utiliser le type de contenu pour deviner l'extension
      if (!filename.includes('.')) {
        const contentType = response.headers.get('content-type');
        const extensions = {
          'application/pdf': '.pdf',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'text/plain': '.txt',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
          'application/vnd.ms-excel': '.xls'
        };
        
        const extension = extensions[contentType] || '';
        filename += extension;
      }

      // Convertir la réponse en blob
      const blob = await response.blob();
      
      // Créer un lien temporaire pour télécharger
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Ajouter au DOM, cliquer, puis nettoyer
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer après un court délai
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert(`Erreur lors du téléchargement du document: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: styles.lightGray
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${styles.mediumGray}`,
          borderTop: `4px solid ${styles.primaryColor}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: styles.secondaryColor }}>Chargement des étudiants...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: styles.lightGray,
        padding: '2rem'
      }}>
        <AlertCircle size={48} color={styles.dangerColor} />
        <h2 style={{ color: styles.darkGray, marginTop: '16px' }}>Erreur</h2>
        <p style={{ color: styles.secondaryColor, textAlign: 'center' }}>{error}</p>
        <button 
          onClick={fetchEtudiants}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: styles.primaryColor,
            color: styles.white,
            border: 'none',
            padding: '12px 24px',
            borderRadius: styles.borderRadius,
            cursor: 'pointer',
            marginTop: '16px',
            transition: styles.transition
          }}
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      minHeight: '100vh'
    }}>
      <Sidebar onLogout={handleLogout} />

      {/* Header fixe */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: styles.white,
        borderBottom: `1px solid ${styles.mediumGray}`,
        boxShadow: styles.boxShadow
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem 0'
          }}>
            <h1 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: 0,
              fontSize: '1.875rem',
              fontWeight: '700',
              color: styles.darkGray
            }}>
              <Users size={28} />
              Gestion des Étudiants
            </h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Barre de recherche et filtres */}
        <div style={{
          background: styles.white,
          borderRadius: styles.borderRadius,
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: styles.boxShadow,
          border: `1px solid ${styles.mediumGray}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              position: 'relative',
              flex: '1',
              minWidth: '300px'
            }}>
              <Search 
                size={20} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: styles.secondaryColor
                }}
              />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, CIN, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 3rem',
                  border: `1px solid ${styles.mediumGray}`,
                  borderRadius: styles.borderRadius,
                  fontSize: '0.875rem',
                  transition: styles.transition
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: styles.secondaryColor
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: showFiltersPanel ? styles.primaryColor : styles.lightGray,
                color: showFiltersPanel ? styles.white : styles.darkGray,
                border: `1px solid ${styles.mediumGray}`,
                padding: '0.75rem 1rem',
                borderRadius: styles.borderRadius,
                cursor: 'pointer',
                transition: styles.transition
              }}
            >
              <Filter size={16} />
              Filtres
              {showFiltersPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Panel des filtres */}
          {showFiltersPanel && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1rem',
              background: styles.lightGray,
              borderRadius: styles.borderRadius,
              border: `1px solid ${styles.mediumGray}`,
              marginTop: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: styles.darkGray,
                  marginBottom: '0.5rem'
                }}>
                  Année scolaire
                </label>
                <select 
                  value={filtreAnneeScolaire} 
                  onChange={(e) => setFiltreAnneeScolaire(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    borderRadius: styles.borderRadius,
                    fontSize: '0.875rem',
                    background: styles.white
                  }}
                >
                  <option value="toutes">Toutes</option>
                  {anneesDisponibles.map(annee => (
                    <option key={annee} value={annee}>{annee}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: styles.darkGray,
                  marginBottom: '0.5rem'
                }}>
                  Niveau
                </label>
                <select 
                  value={filtreNiveau} 
                  onChange={(e) => setFiltreNiveau(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    borderRadius: styles.borderRadius,
                    fontSize: '0.875rem',
                    background: styles.white
                  }}
                >
                  <option value="tous">Tous</option>
                  {niveauxDisponibles.map(niveau => (
                    <option key={niveau} value={niveau}>Niveau {niveau}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: styles.darkGray,
                  marginBottom: '0.5rem'
                }}>
                  Spécialité
                </label>
                <select 
                  value={filtreSpecialite} 
                  onChange={(e) => setFiltreSpecialite(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    borderRadius: styles.borderRadius,
                    fontSize: '0.875rem',
                    background: styles.white
                  }}
                >
                  <option value="toutes">Toutes</option>
                  {specialitesDisponibles.map(specialite => (
                    <option key={specialite} value={specialite}>
                      {specialite.length > 25 ? specialite.substring(0, 25) + '...' : specialite}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: styles.darkGray,
                  marginBottom: '0.5rem'
                }}>
                  Genre
                </label>
                <select 
                  value={filtreGenre} 
                  onChange={(e) => setFiltreGenre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    borderRadius: styles.borderRadius,
                    fontSize: '0.875rem',
                    background: styles.white
                  }}
                >
                  <option value="tous">Tous</option>
                  {genresDisponibles.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: styles.darkGray,
                  marginBottom: '0.5rem'
                }}>
                  Statut
                </label>
                <select 
                  value={filtreStatut} 
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    borderRadius: styles.borderRadius,
                    fontSize: '0.875rem',
                    background: styles.white
                  }}
                >
                  <option value="tous">Tous</option>
                  <option value="actifs">Actifs</option>
                  <option value="inactifs">Inactifs</option>
                  <option value="payes">Payés</option>
                  <option value="non-payes">Non payés</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: styles.darkGray,
                  marginBottom: '0.5rem'
                }}>
                  Type Formation
                </label>
                <select 
                  value={filtreTypeFormation} 
                  onChange={(e) => setFiltreTypeFormation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    borderRadius: styles.borderRadius,
                    fontSize: '0.875rem',
                    background: styles.white
                  }}
                >
                  <option value="tous">Tous</option>
                  {typesFormationDisponibles.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: styles.darkGray,
                  marginBottom: '0.5rem'
                }}>
                  Niveau Formation
                </label>
                <select 
                  value={filtreNiveauFormation} 
                  onChange={(e) => setFiltreNiveauFormation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    borderRadius: styles.borderRadius,
                    fontSize: '0.875rem',
                    background: styles.white
                  }}
                >
                  <option value="tous">Tous</option>
                  {niveauxFormationDisponibles.map(niveau => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>



              <div style={{
                display: 'flex',
                alignItems: 'end',
                gap: '0.5rem'
              }}>
                <button
                  onClick={resetFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: styles.dangerColor,
                    color: styles.white,
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: styles.borderRadius,
                    cursor: 'pointer',
                    transition: styles.transition,
                    fontSize: '0.875rem'
                  }}
                >
                  <RefreshCw size={16} />
                  Réinitialiser
                </button>
                
                <button
                  onClick={() => setShowFiltersPanel(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: styles.secondaryColor,
                    color: styles.white,
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: styles.borderRadius,
                    cursor: 'pointer',
                    transition: styles.transition,
                    fontSize: '0.875rem'
                  }}
                >
                  <ChevronUp size={16} />
                  Masquer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contrôles de vue et actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          background: styles.white,
          padding: '1rem 1.5rem',
          borderRadius: styles.borderRadius,
          boxShadow: styles.boxShadow,
          border: `1px solid ${styles.mediumGray}`,
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            border: `1px solid ${styles.mediumGray}`,
            borderRadius: styles.borderRadius,
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.5rem 1rem',
                border: 'none',
                background: viewMode === 'table' ? styles.primaryColor : styles.white,
                color: viewMode === 'table' ? styles.white : styles.darkGray,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: styles.transition
              }}
            >
              <Table size={16} />
              Tableau
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.5rem 1rem',
                border: 'none',
                background: viewMode === 'cards' ? styles.primaryColor : styles.white,
                color: viewMode === 'cards' ? styles.white : styles.darkGray,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: styles.transition
              }}
            >
              <Grid3X3 size={16} />
              Cartes
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '0.5rem',
                border: `1px solid ${styles.mediumGray}`,
                borderRadius: styles.borderRadius,
                fontSize: '0.875rem',
                background: styles.white
              }}
            >
              <option value={10}>10 par page</option>
              <option value={20}>20 par page</option>
              <option value={50}>50 par page</option>
              <option value={100}>100 par page</option>
            </select>

            <div style={{
              fontSize: '0.875rem',
              color: styles.secondaryColor,
              whiteSpace: 'nowrap'
            }}>
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, etudiantsFiltres.length)} sur {etudiantsFiltres.length}
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    background: currentPage === 1 ? styles.lightGray : styles.white,
                    color: currentPage === 1 ? styles.secondaryColor : styles.darkGray,
                    borderRadius: styles.borderRadius,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    transition: styles.transition
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span style={{
                  fontSize: '0.875rem',
                  color: styles.darkGray,
                  padding: '0 0.5rem'
                }}>
                  Page {currentPage} sur {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${styles.mediumGray}`,
                    background: currentPage === totalPages ? styles.lightGray : styles.white,
                    color: currentPage === totalPages ? styles.secondaryColor : styles.darkGray,
                    borderRadius: styles.borderRadius,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    transition: styles.transition
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {selectedStudents.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1rem',
              background: styles.lightGray,
              borderRadius: styles.borderRadius,
              border: `1px solid ${styles.mediumGray}`
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: styles.darkGray
              }}>
                {selectedStudents.length} sélectionné(s)
              </span>
              <button 
                onClick={handleExportSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: styles.successColor,
                  color: styles.white,
                  border: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: styles.borderRadius,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  transition: styles.transition
                }}
              >
                <Download size={14} />
                Exporter sélection
              </button>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div>
          {etudiantsFiltres.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 2rem',
              background: styles.white,
              borderRadius: styles.borderRadius,
              border: `2px dashed ${styles.mediumGray}`,
              textAlign: 'center'
            }}>
              <Users size={64} color={styles.secondaryColor} />
              <h3 style={{
                margin: '1rem 0 0.5rem 0',
                color: styles.darkGray,
                fontSize: '1.5rem'
              }}>
                Aucun étudiant trouvé
              </h3>
              <p style={{
                color: styles.secondaryColor,
                marginBottom: '1.5rem',
                maxWidth: '400px'
              }}>
                Aucun étudiant ne correspond aux critères de recherche et de filtrage.
              </p>
              <button 
                onClick={resetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: styles.primaryColor,
                  color: styles.white,
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: styles.borderRadius,
                  cursor: 'pointer',
                  transition: styles.transition
                }}
              >
                <RefreshCw size={16} />
                Réinitialiser les filtres
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div style={{
              background: styles.white,
              borderRadius: styles.borderRadius,
              overflow: 'hidden',
              boxShadow: styles.boxShadow,
              border: `1px solid ${styles.mediumGray}`
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  minWidth: '1200px',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: styles.white
                    }}>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === currentEtudiants.length}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Photo</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: '150px'
                      }}>Nom Complet</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>CIN</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Code Massar</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Code Étudiant</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Genre</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Âge</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Contact</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Formation</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Niveau Formation</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Niveau</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        maxWidth: '200px'
                      }}>Spécialité</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Commercial</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Pays</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Diplôme Accès</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Année Scolaire</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Prix</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Statut</th>
                      <th style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEtudiants.map((etudiant, index) => (
                      <tr 
                        key={etudiant._id} 
                        style={{
                          borderBottom: `1px solid ${styles.mediumGray}`,
                          background: selectedStudents.includes(etudiant._id) ? 
                            '#eff6ff' : 
                            (index % 2 === 0 ? styles.white : '#f9fafb'),
                          transition: styles.transition
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedStudents.includes(etudiant._id)) {
                            e.target.closest('tr').style.background = styles.lightGray;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedStudents.includes(etudiant._id)) {
                            e.target.closest('tr').style.background = index % 2 === 0 ? styles.white : '#f9fafb';
                          }
                        }}
                      >
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(etudiant._id)}
                            onChange={() => handleSelectStudent(etudiant._id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ 
                          padding: '0.875rem 0.75rem', 
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          width: '60px'
                        }}>
                          {etudiant.image ? (
                            <img
                              src={`http://195.179.229.230:5000${etudiant.image}`}
                              alt={`${etudiant.prenom} ${etudiant.nomDeFamille}`}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: `2px solid ${styles.mediumGray}`
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: styles.lightGray,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: styles.secondaryColor,
                              border: `2px solid ${styles.mediumGray}`
                            }}>
                              <User size={16} />
                            </div>
                          )}
                        </td>
                        <td style={{ 
                          padding: '0.875rem 0.75rem', 
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          color: styles.darkGray,
                          minWidth: '150px'
                        }}>
                          {etudiant.prenom} {etudiant.nomDeFamille}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.cin || 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.codeMassar || 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.codeEtudiant || 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.genre || 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {calculerAge(etudiant.dateNaissance)} ans
                        </td>
                        <td style={{ 
                          padding: '0.875rem 0.75rem', 
                          verticalAlign: 'middle',
                          maxWidth: '200px',
                          fontSize: '0.8125rem'
                        }}>
                          {etudiant.email && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              marginBottom: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              <Mail size={12} color={styles.secondaryColor} />
                              <span title={etudiant.email}>
                                {etudiant.email.length > 20 ? etudiant.email.substring(0, 20) + '...' : etudiant.email}
                              </span>
                            </div>
                          )}
                          {etudiant.telephone && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px'
                            }}>
                              <Phone size={12} color={styles.secondaryColor} />
                              <span>{etudiant.telephone}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.typeFormation && (
                            <span style={{
                              background: etudiant.typeFormation === 'INGENIEUR' ? 
                                'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 
                                etudiant.typeFormation === 'LICENCE_PRO' ?
                                'linear-gradient(135deg, #dcfce7, #bbf7d0)' :
                                'linear-gradient(135deg, #fef3c7, #fde68a)',
                              color: etudiant.typeFormation === 'INGENIEUR' ? 
                                '#1e40af' : 
                                etudiant.typeFormation === 'LICENCE_PRO' ?
                                '#166534' :
                                '#92400e',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '1rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              border: '1px solid',
                              borderColor: etudiant.typeFormation === 'INGENIEUR' ? 
                                '#3b82f6' : 
                                etudiant.typeFormation === 'LICENCE_PRO' ?
                                '#22c55e' :
                                '#f59e0b'
                            }}>
                              {etudiant.typeFormation.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.niveauFormation ? (
                            <span style={{
                              background: etudiant.niveauFormation === 'FI' ? 
                                'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 
                                etudiant.niveauFormation === 'TA' ?
                                'linear-gradient(135deg, #dcfce7, #bbf7d0)' :
                                'linear-gradient(135deg, #fef3c7, #fde68a)',
                              color: etudiant.niveauFormation === 'FI' ? 
                                '#1e40af' : 
                                etudiant.niveauFormation === 'TA' ?
                                '#166534' :
                                '#92400e',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '1rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              border: '1px solid',
                              borderColor: etudiant.niveauFormation === 'FI' ? 
                                '#3b82f6' : 
                                etudiant.niveauFormation === 'TA' ?
                                '#22c55e' :
                                '#f59e0b'
                            }}>
                              {etudiant.niveauFormation}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.niveau || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '0.875rem 0.75rem', 
                          verticalAlign: 'middle',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={getSpecialite(etudiant)}>
                          {getSpecialite(etudiant).length > 20 ? 
                            getSpecialite(etudiant).substring(0, 20) + '...' : 
                            getSpecialite(etudiant)
                          }
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {getNomCommercial(etudiant.commercial)}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.pays || 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.diplomeAcces || 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 0.75rem', verticalAlign: 'middle' }}>
                          {etudiant.anneeScolaire || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '0.875rem 0.75rem', 
                          verticalAlign: 'middle',
                          fontWeight: '600',
                          color: styles.primaryColor
                        }}>
                          {formatMoney(etudiant.prixTotal)}
                        </td>
                        <td style={{ 
                          padding: '0.875rem 0.75rem', 
                          verticalAlign: 'middle',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background: etudiant.actif ? '#dcfce7' : '#fee2e2',
                              color: etudiant.actif ? '#166534' : '#991b1b'
                            }}>
                              {etudiant.actif ? (
                                <>
                                  <UserCheck size={12} />
                                  Actif
                                </>
                              ) : (
                                <>
                                  <UserX size={12} />
                                  Inactif
                                </>
                              )}
                            </span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background: etudiant.paye ? '#dbeafe' : '#fef3c7',
                              color: etudiant.paye ? '#1e40af' : '#92400e'
                            }}>
                              {etudiant.paye ? (
                                <>
                                  <CheckCircle size={12} />
                                  Payé
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} />
                                  Non payé
                                </>
                              )}
                            </span>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '0.875rem 0.75rem', 
                          verticalAlign: 'middle',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '0.25rem',
                            justifyContent: 'center'
                          }}>
                            <button
                              onClick={() => handleViewStudent(etudiant)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: styles.primaryColor,
                                color: styles.white,
                                border: 'none',
                                padding: '0.5rem 0.75rem',
                                borderRadius: styles.borderRadius,
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                transition: styles.transition
                              }}
                              onMouseEnter={(e) => e.target.closest('button').style.background = styles.primaryDark}
                              onMouseLeave={(e) => e.target.closest('button').style.background = styles.primaryColor}
                              title="Voir les détails"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem',
              padding: '1rem 0'
            }}>
              {currentEtudiants.map((etudiant) => (
                <div 
                  key={etudiant._id} 
                  style={{
                    background: styles.white,
                    border: `1px solid ${styles.mediumGray}`,
                    borderRadius: styles.borderRadius,
                    padding: '1.5rem',
                    boxShadow: styles.boxShadow,
                    transition: styles.transition,
                    ...(selectedStudents.includes(etudiant._id) && {
                      borderColor: styles.primaryColor,
                      boxShadow: `0 0 0 3px rgba(37, 99, 235, 0.1)`
                    })
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = styles.boxShadowLg;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = selectedStudents.includes(etudiant._id) ? 
                      `0 0 0 3px rgba(37, 99, 235, 0.1)` : styles.boxShadow;
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(etudiant._id)}
                      onChange={() => handleSelectStudent(etudiant._id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      {etudiant.image ? (
                        <img
                          src={`http://195.179.229.230:5000${etudiant.image}`}
                          alt={`${etudiant.prenom} ${etudiant.nomDeFamille}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: `2px solid ${styles.mediumGray}`
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: styles.lightGray,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: styles.secondaryColor,
                          border: `2px solid ${styles.mediumGray}`
                        }}>
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem'
                    }}>
                      <button
                        onClick={() => handleViewStudent(etudiant)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: styles.primaryColor,
                          color: styles.white,
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: styles.borderRadius,
                          cursor: 'pointer',
                          transition: styles.transition
                        }}
                        title="Voir les détails"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 style={{
                      margin: '0 0 1rem 0',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: styles.darkGray
                    }}>
                      {etudiant.prenom} {etudiant.nomDeFamille}
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        color: styles.secondaryColor
                      }}>
                        <IdCard size={14} />
                        <span>{etudiant.cin || etudiant.codeMassar || etudiant.codeEtudiant || 'N/A'}</span>
                      </div>
                      
                      {etudiant.email && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.875rem',
                          color: styles.secondaryColor
                        }}>
                          <Mail size={14} />
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {etudiant.email}
                          </span>
                        </div>
                      )}
                      
                      {etudiant.telephone && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.875rem',
                          color: styles.secondaryColor
                        }}>
                          <Phone size={14} />
                          <span>{etudiant.telephone}</span>
                        </div>
                      )}
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        color: styles.secondaryColor
                      }}>
                        <GraduationCap size={14} />
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {getSpecialite(etudiant)}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        color: styles.secondaryColor
                      }}>
                        <Calendar size={14} />
                        <span>{etudiant.anneeScolaire || 'N/A'}</span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {etudiant.typeFormation && (
                        <span style={{
                          background: etudiant.typeFormation === 'INGENIEUR' ? 
                            'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 
                            etudiant.typeFormation === 'LICENCE_PRO' ?
                            'linear-gradient(135deg, #dcfce7, #bbf7d0)' :
                            'linear-gradient(135deg, #fef3c7, #fde68a)',
                          color: etudiant.typeFormation === 'INGENIEUR' ? 
                            '#1e40af' : 
                            etudiant.typeFormation === 'LICENCE_PRO' ?
                            '#166534' :
                            '#92400e',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          border: '1px solid',
                          borderColor: etudiant.typeFormation === 'INGENIEUR' ? 
                            '#3b82f6' : 
                            etudiant.typeFormation === 'LICENCE_PRO' ?
                            '#22c55e' :
                            '#f59e0b'
                        }}>
                          {etudiant.typeFormation.replace('_', ' ')}
                        </span>
                      )}
                      {etudiant.niveauFormation && (
                        <span style={{
                          background: etudiant.niveauFormation === 'FI' ? 
                            'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 
                            etudiant.niveauFormation === 'TA' ?
                            'linear-gradient(135deg, #dcfce7, #bbf7d0)' :
                            'linear-gradient(135deg, #fef3c7, #fde68a)',
                          color: etudiant.niveauFormation === 'FI' ? 
                            '#1e40af' : 
                            etudiant.niveauFormation === 'TA' ?
                            '#166534' :
                            '#92400e',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          border: '1px solid',
                          borderColor: etudiant.niveauFormation === 'FI' ? 
                            '#3b82f6' : 
                            etudiant.niveauFormation === 'TA' ?
                            '#22c55e' :
                            '#f59e0b'
                        }}>
                          {etudiant.niveauFormation}
                        </span>
                      )}
                      <span style={{
                        background: etudiant.actif ? '#dcfce7' : '#fee2e2',
                        color: etudiant.actif ? '#166534' : '#991b1b',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        border: '1px solid',
                        borderColor: etudiant.actif ? '#22c55e' : '#ef4444'
                      }}>
                        {etudiant.actif ? 'Actif' : 'Inactif'}
                      </span>
                      <span style={{
                        background: etudiant.paye ? '#dbeafe' : '#fef3c7',
                        color: etudiant.paye ? '#1e40af' : '#92400e',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        border: '1px solid',
                        borderColor: etudiant.paye ? '#3b82f6' : '#f59e0b'
                      }}>
                        {etudiant.paye ? 'Payé' : 'Non payé'}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: styles.primaryColor,
                      textAlign: 'right'
                    }}>
                      {formatMoney(etudiant.prixTotal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1.5rem',
            background: styles.white,
            borderRadius: styles.borderRadius,
            boxShadow: styles.boxShadow,
            flexWrap: 'wrap',
            border: `1px solid ${styles.mediumGray}`,
            marginTop: '1.5rem'
          }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.5rem 1rem',
                border: `1px solid ${styles.mediumGray}`,
                background: currentPage === 1 ? styles.lightGray : styles.white,
                color: currentPage === 1 ? styles.secondaryColor : styles.darkGray,
                borderRadius: styles.borderRadius,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: styles.transition
              }}
            >
              <ChevronLeft size={16} />
              Précédent
            </button>
            
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: `1px solid ${styles.mediumGray}`,
                        background: currentPage === page ? styles.primaryColor : styles.white,
                        color: currentPage === page ? styles.white : styles.darkGray,
                        borderRadius: styles.borderRadius,
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        transition: styles.transition,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...(currentPage === page && { borderColor: styles.primaryColor })
                      }}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 3 || page === currentPage + 3) {
                  return <span key={page} style={{ padding: '0 0.5rem', color: styles.secondaryColor }}>...</span>;
                }
                return null;
              })}
            </div>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.5rem 1rem',
                border: `1px solid ${styles.mediumGray}`,
                background: currentPage === totalPages ? styles.lightGray : styles.white,
                color: currentPage === totalPages ? styles.secondaryColor : styles.darkGray,
                borderRadius: styles.borderRadius,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: styles.transition
              }}
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal de détails de l'étudiant */}
      {showDetailModal && selectedStudent && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            style={{
              background: styles.white,
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
              width: '100%',
              maxWidth: '1100px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '30px 30px 20px 30px',
              borderBottom: `2px solid ${styles.lightGray}`
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: styles.darkGray,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <User size={24} />
                Détails de l'étudiant
              </h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: styles.lightGray,
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: styles.secondaryColor,
                  transition: styles.transition,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = styles.mediumGray;
                  e.target.style.color = styles.darkGray;
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = styles.lightGray;
                  e.target.style.color = styles.secondaryColor;
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '30px' }}>
              <div style={{
                display: 'flex',
                gap: '30px',
                marginBottom: '40px',
                padding: '25px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '16px',
                border: `1px solid ${styles.mediumGray}`
              }}>
                <div style={{ flexShrink: 0 }}>
                  {selectedStudent.image ? (
                    <img
                      src={`http://195.179.229.230:5000${selectedStudent.image}`}
                      alt={`${selectedStudent.prenom} ${selectedStudent.nomDeFamille}`}
                      style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '16px',
                        objectFit: 'cover',
                        border: `4px solid ${styles.white}`,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '130px',
                      height: '130px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: styles.secondaryColor,
                      border: `4px solid ${styles.white}`,
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                    }}>
                      <User size={64} />
                    </div>
                  )}
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <h3 style={{
                    margin: '0 0 15px 0',
                    fontSize: '2.25rem',
                    fontWeight: '800',
                    color: styles.darkGray,
                    lineHeight: 1.2
                  }}>
                    {selectedStudent.prenom} {selectedStudent.nomDeFamille}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      border: '2px solid',
                      background: selectedStudent.actif ? '#dcfce7' : '#fee2e2',
                      color: selectedStudent.actif ? '#166534' : '#991b1b',
                      borderColor: selectedStudent.actif ? '#22c55e' : '#ef4444'
                    }}>
                      {selectedStudent.actif ? 'Actif' : 'Inactif'}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      border: '2px solid',
                      background: selectedStudent.paye ? '#dbeafe' : '#fef3c7',
                      color: selectedStudent.paye ? '#1e40af' : '#92400e',
                      borderColor: selectedStudent.paye ? '#3b82f6' : '#f59e0b'
                    }}>
                      {selectedStudent.paye ? 'Payé' : 'Non payé'}
                    </span>
                    {selectedStudent.nouvelleInscription && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '25px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        border: '2px solid',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderColor: '#f59e0b'
                      }}>
                        Nouvelle inscription
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: styles.primaryColor
                  }}>
                    {formatMoney(selectedStudent.prixTotal)}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gap: '30px'
              }}>
                {/* Informations personnelles */}
                <div style={{
                  background: styles.white,
                  borderRadius: '16px',
                  padding: '25px',
                  border: `2px solid ${styles.mediumGray}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.375rem',
                    fontWeight: '700',
                    color: styles.darkGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '15px',
                    borderBottom: `2px solid ${styles.lightGray}`
                  }}>
                    <IdCard size={18} color={styles.primaryColor} />
                    Informations Personnelles
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>CIN:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.cin || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Code Massar:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.codeMassar || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Code étudiant:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.codeEtudiant || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Genre:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.genre || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Date de naissance:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{formatDate(selectedStudent.dateNaissance)}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Âge:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{calculerAge(selectedStudent.dateNaissance)} ans</span>
                    </div>

                  </div>
                </div>

                {/* Contact */}
                <div style={{
                  background: styles.white,
                  borderRadius: '16px',
                  padding: '25px',
                  border: `2px solid ${styles.mediumGray}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.375rem',
                    fontWeight: '700',
                    color: styles.darkGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '15px',
                    borderBottom: `2px solid ${styles.lightGray}`
                  }}>
                    <Phone size={18} color={styles.primaryColor} />
                    Contact
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Email:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem',
                        wordBreak: 'break-all'
                      }}>{selectedStudent.email || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Téléphone:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.telephone || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Adresse:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.adresse || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Ville:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.ville || 'N/A'}</span>
                    </div>

                  </div>
                </div>

                {/* Formation */}
                <div style={{
                  background: styles.white,
                  borderRadius: '16px',
                  padding: '25px',
                  border: `2px solid ${styles.mediumGray}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.375rem',
                    fontWeight: '700',
                    color: styles.darkGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '15px',
                    borderBottom: `2px solid ${styles.lightGray}`
                  }}>
                    <GraduationCap size={18} color={styles.primaryColor} />
                    Formation
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Filière:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.filiere || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Type de formation:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.typeFormation || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Niveau de formation:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.niveauFormation || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Niveau:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.niveau || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Cycle:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.cycle || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`,
                      gridColumn: '1 / -1'
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Spécialité:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{getSpecialite(selectedStudent)}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Année scolaire:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.anneeScolaire || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Cours */}
                {selectedStudent.cours && selectedStudent.cours.length > 0 && (
                  <div style={{
                    background: styles.white,
                    borderRadius: '16px',
                    padding: '25px',
                    border: `2px solid ${styles.mediumGray}`,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h4 style={{
                      margin: '0 0 20px 0',
                      fontSize: '1.375rem',
                      fontWeight: '700',
                      color: styles.darkGray,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '15px',
                      borderBottom: `2px solid ${styles.lightGray}`
                    }}>
                      <FileText size={18} color={styles.primaryColor} />
                      Cours Inscrits
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginTop: '10px'
                    }}>
                      {selectedStudent.cours.map((cours, index) => (
                        <span 
                          key={index} 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                            color: '#6b21a8',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            border: '2px solid #c084fc',
                            transition: styles.transition
                          }}
                        >
                          {cours}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Finances */}
                <div style={{
                  background: styles.white,
                  borderRadius: '16px',
                  padding: '25px',
                  border: `2px solid ${styles.mediumGray}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.375rem',
                    fontWeight: '700',
                    color: styles.darkGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '15px',
                    borderBottom: `2px solid ${styles.lightGray}`
                  }}>
                    <TrendingUp size={18} color={styles.primaryColor} />
                    Informations Financières
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Prix total:</span>
                      <span style={{
                        color: styles.primaryColor,
                        fontWeight: '700',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '1.1rem'
                      }}>{formatMoney(selectedStudent.prixTotal)}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Statut paiement:</span>
                      <span style={{
                        color: selectedStudent.paye ? '#166534' : '#92400e',
                        fontWeight: '600',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>
                        {selectedStudent.paye ? 'Payé' : 'Non payé'}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Date de paiement:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{formatDate(selectedStudent.datePaiement)}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Nouvelle inscription:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.nouvelleInscription ? 'Oui' : 'Non'}</span>
                    </div>
                  </div>
                </div>

                {/* Section Documents */}
                <div style={{
                  background: styles.white,
                  borderRadius: '16px',
                  padding: '25px',
                  border: `2px solid ${styles.mediumGray}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.375rem',
                    fontWeight: '700',
                    color: styles.darkGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '15px',
                    borderBottom: `2px solid ${styles.lightGray}`
                  }}>
                    <FileText size={18} color={styles.primaryColor} />
                    Documents
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '15px'
                  }}>
                    {Object.entries(selectedStudent.documents || {}).map(([typeDoc, docInfo]) => (
                      <div key={typeDoc} style={{
                        padding: '15px',
                        background: styles.lightGray,
                        borderRadius: '12px',
                        border: `1px solid ${styles.mediumGray}`
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <span style={{
                            fontWeight: '600',
                            color: styles.darkGray,
                            fontSize: '0.9rem'
                          }}>
                            {typeDoc.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: docInfo.fichier ? '#dcfce7' : '#fee2e2',
                            color: docInfo.fichier ? '#166534' : '#991b1b'
                          }}>
                            {docInfo.fichier ? 'Fourni' : 'Manquant'}
                          </span>
                        </div>
                        {docInfo.commentaire && (
                          <p style={{
                            fontSize: '0.8rem',
                            color: styles.secondaryColor,
                            margin: '5px 0',
                            fontStyle: 'italic'
                          }}>
                            {docInfo.commentaire}
                          </p>
                        )}
                        {docInfo.fichier && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button 
                              onClick={() => handleDownloadDocument(selectedStudent._id, typeDoc)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: styles.primaryColor,
                                color: styles.white,
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                transition: styles.transition
                              }}
                              onMouseEnter={(e) => e.target.style.background = styles.primaryDark}
                              onMouseLeave={(e) => e.target.style.background = styles.primaryColor}
                            >
                              <Download size={12} />
                              Télécharger
                            </button>
                            
                            {/* Bouton Voir pour les PDF et images */}
                            {(docInfo.fichier.toLowerCase().includes('.pdf') || 
                              docInfo.fichier.toLowerCase().includes('.jpg') || 
                              docInfo.fichier.toLowerCase().includes('.jpeg') || 
                              docInfo.fichier.toLowerCase().includes('.png') || 
                              docInfo.fichier.toLowerCase().includes('.gif')) && (
                              <button 
                                onClick={() => window.open(`http://195.179.229.230:5000${docInfo.fichier}`, '_blank')}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: styles.successColor,
                                  color: styles.white,
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  transition: styles.transition
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#047857'}
                                onMouseLeave={(e) => e.target.style.background = styles.successColor}
                              >
                                <Eye size={12} />
                                Voir
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informations académiques supplémentaires */}
                <div style={{
                  background: styles.white,
                  borderRadius: '16px',
                  padding: '25px',
                  border: `2px solid ${styles.mediumGray}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.375rem',
                    fontWeight: '700',
                    color: styles.darkGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '15px',
                    borderBottom: `2px solid ${styles.lightGray}`
                  }}>
                    <GraduationCap size={18} color={styles.primaryColor} />
                    Informations Académiques
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Code baccalauréat:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.codeBaccalaureat || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Série baccalauréat:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.serieBaccalaureat || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Année baccalauréat:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.anneeBaccalaureat || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Informations administratives */}
                <div style={{
                  background: styles.white,
                  borderRadius: '16px',
                  padding: '25px',
                  border: `2px solid ${styles.mediumGray}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.375rem',
                    fontWeight: '700',
                    color: styles.darkGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '15px',
                    borderBottom: `2px solid ${styles.lightGray}`
                  }}>
                    <IdCard size={18} color={styles.primaryColor} />
                    Informations Administratives
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Lieu de naissance:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.lieuNaissance || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Nationalité:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.pays || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Situation:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{selectedStudent.situation || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '15px',
                      background: styles.lightGray,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${styles.mediumGray}`
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '160px',
                        fontSize: '0.95rem'
                      }}>Dernière connexion:</span>
                      <span style={{
                        color: styles.darkGray,
                        fontWeight: '500',
                        flex: 1,
                        textAlign: 'right',
                        fontSize: '0.95rem'
                      }}>{formatDate(selectedStudent.lastSeen)}</span>
                    </div>
                  </div>
                </div>

                {/* Statuts spéciaux */}
                <div style={{
                  background: styles.white,
                  borderRadius: '16px',
                  padding: '25px',
                  border: `2px solid ${styles.mediumGray}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.375rem',
                    fontWeight: '700',
                    color: styles.darkGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '15px',
                    borderBottom: `2px solid ${styles.lightGray}`
                  }}>
                    <CheckCircle size={18} color={styles.primaryColor} />
                    Statuts Spéciaux
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    {[
                      { key: 'handicape', label: 'Handicapé' },
                      { key: 'resident', label: 'Résident' },
                      { key: 'fonctionnaire', label: 'Fonctionnaire' },
                      { key: 'mobilite', label: 'Mobilité' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 15px',
                        background: selectedStudent[key] ? '#dcfce7' : '#f3f4f6',
                        color: selectedStudent[key] ? '#166534' : '#6b7280',
                        borderRadius: '20px',
                        border: `1px solid ${selectedStudent[key] ? '#22c55e' : '#d1d5db'}`,
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {selectedStudent[key] ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                padding: '25px 30px',
                borderTop: `2px solid ${styles.lightGray}`,
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '0 0 16px 16px',
                marginTop: '30px'
              }}>
                <button 
                  onClick={() => handleExportStudent(selectedStudent)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: styles.successColor,
                    color: styles.white,
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: styles.borderRadius,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: styles.transition
                  }}
                >
                  <Download size={16} />
                  Exporter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EtudiantsPedagogiquePage;