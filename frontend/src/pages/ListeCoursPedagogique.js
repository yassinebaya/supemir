import React, { useEffect, useState } from 'react';
import { Plus, BookOpen, User, X, Users, Trash2, Download, Eye, Clock, GraduationCap, Briefcase, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ListeCoursPedagogique = () => {
  const [cours, setCours] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedagogiqueInfo, setPedagogiqueInfo] = useState(null);
  const [coursActuel, setCoursActuel] = useState(null);

  // États pour le modal d'ajout de cours
  const [showAjoutModal, setShowAjoutModal] = useState(false);
  const [nom, setNom] = useState('');
  const [message, setMessage] = useState('');
  const [professeurs_selectionnes, setProfesseursSelectionnes] = useState([]);
  
  // États pour le select avec recherche des professeurs
  const [professeurSearch, setProfesseurSearch] = useState('');
  const [showProfesseurDropdown, setShowProfesseurDropdown] = useState(false);

  // États pour le modal de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [coursASupprimer, setCoursASupprimer] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    fetchPedagogiqueInfo();
    fetchCoursEtEtudiants();
  }, []);

  const fetchPedagogiqueInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://195.179.229.230:5000/api/pedagogique/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPedagogiqueInfo(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des infos pédagogique:', err);
    }
  };

  const fetchCoursEtEtudiants = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const resCours = await fetch('http://195.179.229.230:5000/api/cours', config);
      const resEtudiants = await fetch('http://195.179.229.230:5000/api/etudiant', config);
      const resProfs = await fetch('http://195.179.229.230:5000/api/professeurs', config);

      if (resCours.ok && resEtudiants.ok && resProfs.ok) {
        const coursData = await resCours.json();
        const etudiantsData = await resEtudiants.json();
        const profsData = await resProfs.json();
        
        setCours(coursData);
        setEtudiants(etudiantsData);
        setProfesseurs(profsData);
      }
    } catch (err) {
      console.error('Erreur de chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les étudiants accessibles selon la filière du pédagogique
  const getEtudiantsAccessibles = () => {
    if (!pedagogiqueInfo) return [];
    
    if (pedagogiqueInfo.type === 'GENERAL') {
      // Pédagogique général : accès à tous les étudiants des filières autorisées
      return etudiants.filter(e => 
        pedagogiqueInfo.filieresList.includes(e.filiere) || 
        pedagogiqueInfo.filieresList.includes(e.typeFormation)
      );
    } else {
      // Pédagogique spécifique : accès uniquement à sa filière
      return etudiants.filter(e => 
        e.filiere === pedagogiqueInfo.filiere || 
        e.typeFormation === pedagogiqueInfo.filiere
      );
    }
  };

  const getNombreEtudiants = (nomCours, regimeFormation = null) => {
    const etudiantsAccessibles = getEtudiantsAccessibles();
    
    return etudiantsAccessibles.filter(e => {
      if (e.prixTotal === 0 || e.prixTotal === null || e.prixTotal === undefined) {
        return false;
      }
      
      if (e.anneeScolaire !== '2025/2026') {
        return false;
      }
      
      const coursEtudiant = e.cours;
      let isInCours = false;
      
      if (Array.isArray(coursEtudiant)) {
        isInCours = coursEtudiant.includes(nomCours);
      } else if (typeof coursEtudiant === 'string') {
        isInCours = coursEtudiant.split(',').map(s => s.trim()).includes(nomCours);
      }
      
      if (!isInCours) return false;
      
      if (regimeFormation) {
        const coursNameLower = nomCours.toLowerCase();
        const isTA = coursNameLower.includes(' ta');
        
        if (regimeFormation === 'TA') {
          return isTA;
        } else if (regimeFormation === 'FI') {
          return !isTA;
        }
      }
      
      return true;
    }).length;
  };

  const isLicenceProOrMasterPro = (nomCours) => {
    const coursLower = nomCours.toLowerCase();
    return coursLower.includes('licence pro') || coursLower.includes('master pro');
  };

  const afficherDetails = (coursSelectionne) => {
    setCoursActuel(coursSelectionne);
  };

  const handleAjoutCours = async (e) => {
    e.preventDefault();

    if (!nom.trim()) {
      setMessage('❌ Veuillez remplir le nom du cours');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://195.179.229.230:5000/api/cours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: nom.trim(),
          professeur: professeurs_selectionnes
        })
      });

      if (response.ok) {
        const nouveauCours = await response.json();
        setCours([...cours, nouveauCours]);

        setMessage('✅ Cours ajouté avec succès');
        setNom('');
        setProfesseursSelectionnes([]);

        setTimeout(() => {
          setShowAjoutModal(false);
          setMessage('');
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage('❌ Erreur: ' + (errorData.message || 'Erreur inconnue'));
      }
    } catch (err) {
      setMessage('❌ Erreur: ' + (err.message || 'Erreur de connexion'));
    }
  };

  const ouvrirModalSuppression = (cours) => {
    setCoursASupprimer(cours);
    setShowDeleteModal(true);
    setDeleteMessage('');
  };

  const handleSupprimerCours = async () => {
    if (!coursASupprimer) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://195.179.229.230:5000/api/cours/${coursASupprimer._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setCours(cours.filter(c => c._id !== coursASupprimer._id));
        
        setDeleteMessage('✅ Cours supprimé avec succès');
        
        setTimeout(() => {
          setShowDeleteModal(false);
          setCoursASupprimer(null);
          setDeleteMessage('');
        }, 1500);
      } else {
        const errorData = await response.json();
        setDeleteMessage('❌ Erreur: ' + (errorData.message || 'Erreur lors de la suppression'));
      }
    } catch (err) {
      setDeleteMessage('❌ Erreur: ' + (err.message || 'Erreur de connexion'));
    }
  };

  const fermerModalAjout = () => {
    setShowAjoutModal(false);
    setNom('');
    setProfesseursSelectionnes([]);
    setMessage('');
    setProfesseurSearch('');
    setShowProfesseurDropdown(false);
  };

  const professeursFiltres = professeurs.filter(p =>
    p.nom.toLowerCase().includes(professeurSearch.toLowerCase()) ||
    p.matiere.toLowerCase().includes(professeurSearch.toLowerCase())
  );

  const ajouterProfesseur = (professeur) => {
    if (!professeurs_selectionnes.includes(professeur.nom)) {
      setProfesseursSelectionnes([...professeurs_selectionnes, professeur.nom]);
    }
    setProfesseurSearch('');
    setShowProfesseurDropdown(false);
  };

  const retirerProfesseur = (nomProfesseur) => {
    setProfesseursSelectionnes(professeurs_selectionnes.filter(nom => nom !== nomProfesseur));
  };

  const fermerModalSuppression = () => {
    setShowDeleteModal(false);
    setCoursASupprimer(null);
    setDeleteMessage('');
  };

  const etudiantsDansCours = coursActuel
    ? getEtudiantsAccessibles().filter(e => {
        // Appliquer les mêmes filtres que getNombreEtudiants
        if (e.prixTotal === 0 || e.prixTotal === null || e.prixTotal === undefined) {
          return false;
        }
        
        if (e.anneeScolaire !== '2025/2026') {
          return false;
        }
        
        const coursEtudiant = e.cours;
        let isInCours = false;
        
        if (Array.isArray(coursEtudiant)) {
          isInCours = coursEtudiant.includes(coursActuel.nom);
        } else if (typeof coursEtudiant === 'string') {
          isInCours = coursEtudiant.split(',').map(s => s.trim()).includes(coursActuel.nom);
        }
        
        return isInCours;
      })
    : [];

  const exportToExcel = (typeTable, regimeFormation = null) => {
    let worksheetData = [];
    let filteredCours = [];

    if (typeTable === 'licence_master') {
      worksheetData = [["Nom du Cours", "Professeur(s)", "Nombre d'Étudiants", "Executive"]];
      filteredCours = cours.filter(c => {
        const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
        const nombreEtudiants = getNombreEtudiants(c.nom);
        return isLicenceMaster && nombreEtudiants > 0;
      });
    } else {
      worksheetData = [["Nom du Cours", "Professeur(s)", "Régime de Formation", "Nombre d'Étudiants"]];
      filteredCours = cours.filter(c => {
        const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
        const nombreEtudiants = getNombreEtudiants(c.nom, regimeFormation);
        return !isLicenceMaster && nombreEtudiants > 0;
      });
    }

    filteredCours.forEach(c => {
      const profs = Array.isArray(c.professeur) ? c.professeur.join(', ') : c.professeur || 'Non assigné';
      
      if (typeTable === 'licence_master') {
        const nombreEtudiants = getNombreEtudiants(c.nom);
        const coursNameLower = c.nom.toLowerCase();
        const isExecutive = coursNameLower.includes('executive') || coursNameLower.includes('exécutif');
        worksheetData.push([c.nom, profs, nombreEtudiants, isExecutive ? 'Oui' : 'Non']);
      } else {
        const nombreEtudiants = getNombreEtudiants(c.nom, regimeFormation);
        worksheetData.push([c.nom, profs, regimeFormation, nombreEtudiants]);
      }
    });

    try {
      if (typeof window.XLSX === 'undefined') {
        alert('La bibliothèque Excel n\'est pas chargée.');
        return;
      }

      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.aoa_to_sheet(worksheetData);

      ws['!cols'] = typeTable === 'licence_master' 
        ? [{ wch: 60 }, { wch: 30 }, { wch: 20 }, { wch: 15 }]
        : [{ wch: 50 }, { wch: 30 }, { wch: 25 }, { wch: 20 }];

      const sheetName = typeTable === 'licence_master' 
        ? 'Licences & Masters Pro'
        : `Cours ${regimeFormation}`;
      
      window.XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const fileName = typeTable === 'licence_master'
        ? `licences_masters_pro_${dateStr}.xlsx`
        : `cours_${regimeFormation}_${dateStr}.xlsx`;

      window.XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erreur lors de l\'exportation Excel:', error);
      alert('Erreur lors de l\'exportation du fichier Excel.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    mainContent: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    headerSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      padding: '1.5rem',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    mainTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '1.75rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    mainIconBox: {
      padding: '0.75rem',
      borderRadius: '0.75rem',
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    addButton: {
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      fontSize: '0.95rem'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      marginTop: '3rem',
      padding: '1.5rem',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    iconBox: {
      padding: '0.75rem',
      borderRadius: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    taIcon: {
      background: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    fiIcon: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    },
    licenceMasterIcon: {
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    exportButton: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      fontSize: '0.95rem'
    },
    tableContainer: {
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      marginBottom: '1rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.875rem'
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0'
    },
    th: {
      padding: '1rem 1.5rem',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderRight: '1px solid #e2e8f0'
    },
    thCenter: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      fontWeight: '600',
      color: '#374151',
      borderRight: '1px solid #e2e8f0'
    },
    thLast: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      fontWeight: '600',
      color: '#374151'
    },
    tbody: {
      backgroundColor: 'white'
    },
    tr: {
      borderBottom: '1px solid #f1f5f9',
      transition: 'background-color 0.2s ease'
    },
    td: {
      padding: '1rem 1.5rem',
      color: '#1f2937',
      borderRight: '1px solid #f1f5f9'
    },
    tdCenter: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      color: '#1f2937',
      borderRight: '1px solid #f1f5f9'
    },
    tdLast: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      color: '#1f2937'
    },
    coursName: {
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    studentBadge: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    regimeBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-block'
    },
    taBadge: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    fiBadge: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    executiveBadge: {
      backgroundColor: '#f3e8ff',
      color: '#6b21a8',
      padding: '0.25rem 0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
      justifyContent: 'center'
    },
    viewButton: {
      padding: '0.5rem',
      backgroundColor: '#eff6ff',
      color: '#3b82f6',
      border: '1px solid #bfdbfe',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    deleteButton: {
      padding: '0.5rem',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    totalRow: {
      backgroundColor: '#f1f5f9',
      fontWeight: '600',
      borderTop: '2px solid #e2e8f0'
    },
    totalLabel: {
      padding: '1rem 1.5rem',
      color: '#374151',
      fontWeight: '600',
      borderRight: '1px solid #e2e8f0'
    },
    totalValue: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      color: '#374151',
      fontWeight: '600'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      width: '100%',
      maxWidth: '28rem',
      maxHeight: '90vh',
      overflow: 'hidden'
    },
    detailsModalContent: {
      width: '100%',
      maxWidth: '32rem'
    },
    modalHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid #f3f4f6'
    },
    modalHeaderContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    modalHeaderLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    modalIconContainer: {
      padding: '0.5rem',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    deleteModalIconContainer: {
      padding: '0.5rem',
      background: 'linear-gradient(135deg, #dc2626, #ef4444)',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: 0
    },
    closeButton: {
      padding: '0.5rem',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    modalBody: {
      padding: '1.5rem'
    },
    detailsBody: {
      padding: '1.5rem',
      maxHeight: '60vh',
      overflowY: 'auto'
    },
    formGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.75rem',
      fontSize: '0.875rem',
      backgroundColor: '#f9fafb',
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box'
    },
    message: {
      padding: '1rem',
      borderRadius: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '1rem'
    },
    messageSuccess: {
      backgroundColor: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0'
    },
    messageError: {
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    },
    modalButtonGroup: {
      display: 'flex',
      gap: '0.75rem',
      paddingTop: '1.5rem'
    },
    cancelButton: {
      flex: 1,
      padding: '0.75rem 1rem',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: 'none',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    submitButton: {
      flex: 1,
      padding: '0.75rem 1rem',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      color: 'white',
      border: 'none',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease'
    },
    deleteSubmitButton: {
      flex: 1,
      padding: '0.75rem 1rem',
      background: 'linear-gradient(135deg, #dc2626, #ef4444)',
      color: 'white',
      border: 'none',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease'
    },
    searchableSelect: {
      position: 'relative',
      width: '100%'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      maxHeight: '200px',
      overflowY: 'auto',
      marginTop: '4px'
    },
    dropdownItem: {
      padding: '0.75rem',
      cursor: 'pointer',
      borderBottom: '1px solid #f3f4f6',
      transition: 'background-color 0.2s ease'
    },
    professeurItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    professeurInfo: {
      display: 'flex',
      flexDirection: 'column'
    },
    professeurNom: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#1f2937'
    },
    professeurMatiere: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    selectedProfesseurs: {
      marginTop: '1rem'
    },
    selectedTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.5rem'
    },
    selectedList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem'
    },
    selectedTag: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      border: '1px solid #bfdbfe'
    },
    removeTagButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#1e40af',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      padding: '0',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s ease'
    },
    deleteConfirmationText: {
      fontSize: '0.875rem',
      color: '#6b7280',
      marginBottom: '1rem',
      lineHeight: '1.5'
    },
    deleteWarning: {
      fontSize: '0.875rem',
      color: '#dc2626',
      fontWeight: '600',
      marginBottom: '1rem'
    },
    sectionHeader2: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem'
    },
    sectionTitle2: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937',
      margin: 0
    },
    emptyState: {
      textAlign: 'center',
      padding: '2rem'
    },
    emptyIcon: {
      padding: '0.75rem',
      backgroundColor: '#f3f4f6',
      borderRadius: '50%',
      width: '3rem',
      height: '3rem',
      margin: '0 auto 0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    studentList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    },
    studentItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem',
      backgroundColor: '#f9fafb',
      borderRadius: '0.75rem',
      transition: 'background-color 0.2s ease'
    },
    studentInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    studentIcon: {
      padding: '0.5rem',
      backgroundColor: '#dbeafe',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    studentName: {
      fontWeight: '500',
      color: '#1f2937'
    },
    studentViewButton: {
      padding: '0.5rem',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      color: '#6b7280'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#6b7280' }}>
          Chargement des données...
        </div>
      </div>
    );
  }

  // Afficher un message si le pédagogique n'a pas accès
  if (!pedagogiqueInfo) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
            <AlertCircle size={64} color="#ef4444" />
            <h2 style={{ color: '#1f2937', marginTop: '1rem' }}>Accès non autorisé</h2>
            <p style={{ color: '#6b7280' }}>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fonction pour rendre le tableau FI
  const renderTableFI = () => {
    const regimeFormation = 'FI';
    const filteredCours = cours.filter(c => {
      const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
      return !isLicenceMaster && getNombreEtudiants(c.nom, regimeFormation) > 0;
    });
    
    const total = filteredCours.reduce((sum, c) => sum + getNombreEtudiants(c.nom, regimeFormation), 0);

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <div style={{...styles.iconBox, ...styles.fiIcon}}>
              <GraduationCap size={24} color="white" />
            </div>
            <span>Formation Initiale (FI)</span>
          </div>
          <button
            onClick={() => exportToExcel('fi', regimeFormation)}
            style={styles.exportButton}
          >
            <Download size={18} />
            Exporter Excel
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Nom du Cours</th>
                <th style={styles.th}>Professeur(s)</th>
                <th style={styles.thCenter}>Régime</th>
                <th style={styles.thCenter}>Nombre d'Étudiants</th>
                <th style={styles.thLast}>Actions</th>
              </tr>
            </thead>
            <tbody style={styles.tbody}>
              {filteredCours.map((c, index) => {
                const nombreEtudiants = getNombreEtudiants(c.nom, regimeFormation);
                
                return (
                  <tr key={`${c._id || index}-${regimeFormation}`} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.coursName}>
                        <BookOpen size={16} color="#6b7280" />
                        {c.nom}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="#6b7280" />
                        <span>
                          {Array.isArray(c.professeur)
                            ? c.professeur.join(', ')
                            : c.professeur || 'Non assigné'}
                        </span>
                      </div>
                    </td>
                    <td style={styles.tdCenter}>
                      <span style={{...styles.regimeBadge, ...styles.fiBadge}}>
                        FI
                      </span>
                    </td>
                    <td style={styles.tdCenter}>
                      <div style={styles.studentBadge}>
                        <Users size={12} />
                        {nombreEtudiants}
                      </div>
                    </td>
                    <td style={styles.tdLast}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => afficherDetails(c)}
                          style={styles.viewButton}
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => ouvrirModalSuppression(c)}
                          style={styles.deleteButton}
                          title="Supprimer ce classe"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr style={styles.totalRow}>
                <td style={styles.totalLabel} colSpan="3">
                  Total ({filteredCours.length} cours)
                </td>
                <td style={styles.totalValue} colSpan="2">
                  {total} étudiants
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Fonction pour rendre le tableau TA
  const renderTableTA = () => {
    const regimeFormation = 'TA';
    const filteredCours = cours.filter(c => {
      const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
      return !isLicenceMaster && getNombreEtudiants(c.nom, regimeFormation) > 0;
    });
    
    const total = filteredCours.reduce((sum, c) => sum + getNombreEtudiants(c.nom, regimeFormation), 0);

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <div style={{...styles.iconBox, ...styles.taIcon}}>
              <Clock size={24} color="white" />
            </div>
            <span>Temps Aménagé (TA)</span>
          </div>
          <button
            onClick={() => exportToExcel('ta', regimeFormation)}
            style={styles.exportButton}
          >
            <Download size={18} />
            Exporter Excel
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Nom du Cours</th>
                <th style={styles.th}>Professeur(s)</th>
                <th style={styles.thCenter}>Régime</th>
                <th style={styles.thCenter}>Nombre d'Étudiants</th>
                <th style={styles.thLast}>Actions</th>
              </tr>
            </thead>
            <tbody style={styles.tbody}>
              {filteredCours.map((c, index) => {
                const nombreEtudiants = getNombreEtudiants(c.nom, regimeFormation);
                
                return (
                  <tr key={`${c._id || index}-${regimeFormation}`} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.coursName}>
                        <BookOpen size={16} color="#6b7280" />
                        {c.nom}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="#6b7280" />
                        <span>
                          {Array.isArray(c.professeur)
                            ? c.professeur.join(', ')
                            : c.professeur || 'Non assigné'}
                        </span>
                      </div>
                    </td>
                    <td style={styles.tdCenter}>
                      <span style={{...styles.regimeBadge, ...styles.taBadge}}>
                        TA
                      </span>
                    </td>
                    <td style={styles.tdCenter}>
                      <div style={styles.studentBadge}>
                        <Users size={12} />
                        {nombreEtudiants}
                      </div>
                    </td>
                    <td style={styles.tdLast}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => afficherDetails(c)}
                          style={styles.viewButton}
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => ouvrirModalSuppression(c)}
                          style={styles.deleteButton}
                          title="Supprimer ce classe"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr style={styles.totalRow}>
                <td style={styles.totalLabel} colSpan="3">
                  Total ({filteredCours.length} cours)
                </td>
                <td style={styles.totalValue} colSpan="2">
                  {total} étudiants
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Fonction pour rendre le tableau Licence/Master Pro
  const renderTableLicenceMaster = () => {
    const filteredCours = cours.filter(c => {
      const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
      return isLicenceMaster && getNombreEtudiants(c.nom) > 0;
    });
    
    const total = filteredCours.reduce((sum, c) => sum + getNombreEtudiants(c.nom), 0);

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <div style={{...styles.iconBox, ...styles.licenceMasterIcon}}>
              <Briefcase size={24} color="white" />
            </div>
            <span>Licences Pro & Masters Pro</span>
          </div>
          <button
            onClick={() => exportToExcel('licence_master')}
            style={styles.exportButton}
          >
            <Download size={18} />
            Exporter Excel
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Nom du Cours</th>
                <th style={styles.th}>Professeur(s)</th>
                <th style={styles.thCenter}>Nombre d'Étudiants</th>
                <th style={styles.thCenter}>Executive</th>
                <th style={styles.thLast}>Actions</th>
              </tr>
            </thead>
            <tbody style={styles.tbody}>
              {filteredCours.map((c, index) => {
                const nombreEtudiants = getNombreEtudiants(c.nom);
                const coursNameLower = c.nom.toLowerCase();
                const isExecutive = coursNameLower.includes('executive') || coursNameLower.includes('exécutif');
                
                return (
                  <tr key={c._id || index} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.coursName}>
                        <BookOpen size={16} color="#6b7280" />
                        {c.nom}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="#6b7280" />
                        <span>
                          {Array.isArray(c.professeur)
                            ? c.professeur.join(', ')
                            : c.professeur || 'Non assigné'}
                        </span>
                      </div>
                    </td>
                    <td style={styles.tdCenter}>
                      <div style={styles.studentBadge}>
                        <Users size={12} />
                        {nombreEtudiants}
                      </div>
                    </td>
                    <td style={styles.tdCenter}>
                      <span style={styles.executiveBadge}>
                        <Briefcase size={12} />
                        {isExecutive ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td style={styles.tdLast}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => afficherDetails(c)}
                          style={styles.viewButton}
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => ouvrirModalSuppression(c)}
                          style={styles.deleteButton}
                          title="Supprimer ce classe"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr style={styles.totalRow}>
                <td style={styles.totalLabel} colSpan="2">
                  Total ({filteredCours.length} cours)
                </td>
                <td style={styles.totalValue} colSpan="3">
                  {total} étudiants
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.mainContent}>
        {/* Badge d'information sur les permissions */}
        {pedagogiqueInfo && (
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <User size={20} color="#3b82f6" />
            <span style={{ fontWeight: '600' }}>
              {pedagogiqueInfo.nom}
            </span>
            <span style={{ color: '#6b7280' }}>
              {pedagogiqueInfo.type === 'GENERAL' 
                ? `(Pédagogique Général - Accès: ${pedagogiqueInfo.filieresList.join(', ')})`
                : `(Filière: ${pedagogiqueInfo.filiere})`
              }
            </span>
          </div>
        )}

        {/* Header principal */}
        <div style={styles.headerSection}>
          <div style={styles.mainTitle}>
            <div style={styles.mainIconBox}>
              <BookOpen size={24} color="white" />
            </div>
            <span>Gestion des Classes</span>
          </div>
          <button
            onClick={() => setShowAjoutModal(true)}
            style={styles.addButton}
          >
            <Plus size={18} />
            Nouveau Classe
          </button>
        </div>

        {/* Tableaux séparés */}
        {renderTableFI()}
        {renderTableTA()}
        {renderTableLicenceMaster()}
      </div>

      {/* Modal d'ajout de cours */}
      {showAjoutModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderContent}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.modalIconContainer}>
                    <Plus size={20} color="white" />
                  </div>
                  <h2 style={styles.modalTitle}>Nouveau classe</h2>
                </div>
                <button onClick={fermerModalAjout} style={styles.closeButton}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>
            </div>

            <div style={styles.modalBody}>
              <form onSubmit={handleAjoutCours}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom du classe</label>
                  <input
                    type="text"
                    placeholder=""
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Professeurs</label>
                  
                  <div style={styles.searchableSelect}>
                    <input
                      type="text"
                      placeholder="Rechercher et sélectionner un professeur..."
                      value={professeurSearch}
                      onChange={(e) => {
                        setProfesseurSearch(e.target.value);
                        setShowProfesseurDropdown(e.target.value.length > 0);
                      }}
                      style={styles.input}
                      onFocus={(e) => {
                        if (professeurSearch.length > 0) {
                          setShowProfesseurDropdown(true);
                        }
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          setShowProfesseurDropdown(false);
                        }, 200);
                      }}
                    />
                    
                    {showProfesseurDropdown && professeursFiltres.length > 0 && (
                      <div style={styles.dropdown}>
                        {professeursFiltres.map((p) => (
                          <div
                            key={p._id}
                            style={styles.dropdownItem}
                            onClick={() => ajouterProfesseur(p)}
                          >
                            <div style={styles.professeurItem}>
                              <div style={styles.professeurInfo}>
                                <div style={styles.professeurNom}>{p.nom}</div>
                                <div style={styles.professeurMatiere}>{p.matiere}</div>
                              </div>
                              {professeurs_selectionnes.includes(p.nom) && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#10b981',
                                  fontWeight: '500'
                                }}>
                                  ✓ Sélectionné
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showProfesseurDropdown && professeurSearch.length > 0 && professeursFiltres.length === 0 && (
                      <div style={styles.dropdown}>
                        <div style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          Aucun professeur trouvé pour "{professeurSearch}"
                        </div>
                      </div>
                    )}
                  </div>

                  {professeurs_selectionnes.length > 0 && (
                    <div style={styles.selectedProfesseurs}>
                      <div style={styles.selectedTitle}>
                        {professeurs_selectionnes.length} professeur(s) sélectionné(s)
                      </div>
                      <div style={styles.selectedList}>
                        {professeurs_selectionnes.map((nomProfesseur, index) => {
                          const professeur = professeurs.find(p => p.nom === nomProfesseur);
                          return (
                            <div key={index} style={styles.selectedTag}>
                              <span>{nomProfesseur}</span>
                              {professeur && (
                                <span style={{ fontSize: '0.625rem', opacity: 0.8 }}>
                                  - {professeur.matiere}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => retirerProfesseur(nomProfesseur)}
                                style={styles.removeTagButton}
                                title="Retirer ce professeur"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {message && (
                  <div style={{
                    ...styles.message,
                    ...(message.includes('✅') ? styles.messageSuccess : styles.messageError)
                  }}>
                    {message}
                  </div>
                )}

                <div style={styles.modalButtonGroup}>
                  <button
                    type="button"
                    onClick={fermerModalAjout}
                    style={styles.cancelButton}
                  >
                    Annuler
                  </button>
                  <button type="submit" style={styles.submitButton}>
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderContent}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.deleteModalIconContainer}>
                    <Trash2 size={20} color="white" />
                  </div>
                  <h2 style={styles.modalTitle}>Supprimer le cours</h2>
                </div>
                <button onClick={fermerModalSuppression} style={styles.closeButton}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.deleteConfirmationText}>
                Êtes-vous sûr de vouloir supprimer le cours <strong>"{coursASupprimer?.nom}"</strong> ?
              </div>
              <div style={styles.deleteWarning}>
                ⚠️ Cette action est irréversible et supprimera définitivement le cours.
              </div>

              {deleteMessage && (
                <div style={{
                  ...styles.message,
                  ...(deleteMessage.includes('✅') ? styles.messageSuccess : styles.messageError)
                }}>
                  {deleteMessage}
                </div>
              )}

              <div style={styles.modalButtonGroup}>
                <button
                  type="button"
                  onClick={fermerModalSuppression}
                  style={styles.cancelButton}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSupprimerCours}
                  style={styles.deleteSubmitButton}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {coursActuel && (
        <div style={styles.modal}>
          <div style={{...styles.modalContent, ...styles.detailsModalContent}}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderContent}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.modalIconContainer}>
                    <BookOpen size={20} color="white" />
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>{coursActuel.nom}</h2>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem'}}>
                      <User size={16} />
                      <span>
                        {Array.isArray(coursActuel.professeur)
                          ? coursActuel.professeur.join(', ')
                          : coursActuel.professeur || 'Non assigné'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCoursActuel(null)}
                  style={styles.closeButton}
                >
                  <X size={20} color="#6b7280" />
                </button>
              </div>
            </div>

            <div style={styles.detailsBody}>
              <div style={styles.sectionHeader2}>
                <Users size={20} color="#2563eb" />
                <h3 style={styles.sectionTitle2}>
                  Étudiants inscrits ({etudiantsDansCours.length})
                </h3>
              </div>
              
              {etudiantsDansCours.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <Users size={24} color="#9ca3af" />
                  </div>
                  <p style={{color: '#9ca3af', margin: 0}}>Aucun étudiant inscrit dans ce cours</p>
                </div>
              ) : (
                <div style={styles.studentList}>
                  {etudiantsDansCours.map(e => (
                    <div key={e._id} style={styles.studentItem}>
                      <div style={styles.studentInfo}>
                        <div style={styles.studentIcon}>
                          <User size={16} color="#2563eb" />
                        </div>
                        <span style={styles.studentName}>{e.nomComplet}</span>
                      </div>
                      <button
                        onClick={() => window.location.href = `/pedagogique/etudiant/${e._id}`}
                        style={styles.studentViewButton}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListeCoursPedagogique;