import React, { useEffect, useState } from 'react';
import { Plus, BookOpen, User, Eye, X, Users, GraduationCap, Trash2, Filter, Search } from 'lucide-react';
import Sidebar from '../components/sidberadmin';

const ListeCoursAdmin = () => {
  const [cours, setCours] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [coursActuel, setCoursActuel] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [professeurs_selectionnes, setProfesseursSelectionnes] = useState([]);

  // États pour le filtre
  const [filtreActif, setFiltreActif] = useState(false);
  const [professeurFiltre, setProfesseurFiltre] = useState('');
  const [coursFiltre, setCoursFiltre] = useState('');

  // États pour le modal d'ajout de cours
  const [showAjoutModal, setShowAjoutModal] = useState(false);
  const [nom, setNom] = useState('');
  const [message, setMessage] = useState('');
  
  // États pour le select avec recherche des professeurs
  const [professeurSearch, setProfesseurSearch] = useState('');
  const [showProfesseurDropdown, setShowProfesseurDropdown] = useState(false);

  // États pour le modal de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [coursASupprimer, setCoursASupprimer] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    const fetchCoursEtEtudiants = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const resCours = await fetch('http://195.179.229.230:5000/api/cours', config);
        const resEtudiants = await fetch('http://195.179.229.230:5000/api/etudiants', config);
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
      }
    };

    fetchCoursEtEtudiants();
  }, []);

  // Fonction de filtrage des cours
  const coursFiltres = cours.filter(c => {
    // Filtre par cours sélectionné
    const correspondCours = coursFiltre === '' || c.nom === coursFiltre;

    // Filtre par professeur
    let correspondProfesseur = true;
    if (professeurFiltre !== '') {
      const professeursCours = Array.isArray(c.professeur) ? c.professeur : [c.professeur];
      correspondProfesseur = professeursCours.some(prof => 
        prof && prof.toLowerCase().includes(professeurFiltre.toLowerCase())
      );
    }

    return correspondCours && correspondProfesseur;
  });

  // Fonction pour réinitialiser les filtres
  const reinitialiserFiltres = () => {
    setProfesseurFiltre('');
    setCoursFiltre('');
    setFiltreActif(false);
  };

  // Compter le nombre de filtres actifs
  const nombreFiltresActifs = () => {
    let count = 0;
    if (professeurFiltre !== '') count++;
    if (coursFiltre !== '') count++;
    return count;
  };

  const afficherDetails = (coursSelectionne) => {
    setCoursActuel(coursSelectionne);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Fonction pour ajouter un cours
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

  // Fonction pour ouvrir le modal de confirmation de suppression
  const ouvrirModalSuppression = (cours) => {
    setCoursASupprimer(cours);
    setShowDeleteModal(true);
    setDeleteMessage('');
  };

  // Fonction pour supprimer un cours
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

  // Fonction pour fermer le modal d'ajout
  const fermerModalAjout = () => {
    setShowAjoutModal(false);
    setNom('');
    setProfesseursSelectionnes([]);
    setMessage('');
    setProfesseurSearch('');
    setShowProfesseurDropdown(false);
  };

  // Filtrer les professeurs selon la recherche
  const professeursFiltres = professeurs.filter(p =>
    p.nom.toLowerCase().includes(professeurSearch.toLowerCase()) ||
    p.matiere.toLowerCase().includes(professeurSearch.toLowerCase())
  );

  // Fonction pour ajouter un professeur à la sélection
  const ajouterProfesseur = (professeur) => {
    if (!professeurs_selectionnes.includes(professeur.nom)) {
      setProfesseursSelectionnes([...professeurs_selectionnes, professeur.nom]);
    }
    setProfesseurSearch('');
    setShowProfesseurDropdown(false);
  };

  // Fonction pour retirer un professeur de la sélection
  const retirerProfesseur = (nomProfesseur) => {
    setProfesseursSelectionnes(professeurs_selectionnes.filter(nom => nom !== nomProfesseur));
  };

  // Fonction pour fermer le modal de suppression
  const fermerModalSuppression = () => {
    setShowDeleteModal(false);
    setCoursASupprimer(null);
    setDeleteMessage('');
  };

  const etudiantsDansCours = coursActuel
    ? etudiants.filter(e => e.cours.includes(coursActuel.nom))
    : [];

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    innerContainer: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem 1rem'
    },
    header: {
      backdropFilter: 'blur(10px)',
      backgroundColor: 'white',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '2rem'
    },
    headerContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: '20px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #1f2937, #4b5563)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: '0'
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '0.875rem',
      margin: '0.25rem 0 0 0'
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
      fontSize: '1rem'
    },
    // Styles pour la section des filtres
    filterSection: {
      backdropFilter: 'blur(10px)',
      backgroundColor: 'white',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '2rem'
    },
    filterHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    filterTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937'
    },
    filterToggle: {
      background: filtreActif ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6b7280, #4b5563)',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    filterContent: {
      display: filtreActif ? 'block' : 'none'
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem'
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    filterLabel: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151'
    },
    filterInput: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      backgroundColor: '#f9fafb',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    filterSelect: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      backgroundColor: '#f9fafb',
      transition: 'all 0.2s ease',
      outline: 'none',
      cursor: 'pointer'
    },
    filterActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '1rem',
      borderTop: '1px solid #f3f4f6'
    },
    filterBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    resetButton: {
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    coursGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem'
    },
    coursCard: {
      backdropFilter: 'blur(10px)',
      backgroundColor: 'white',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      position: 'relative'
    },
    coursCardHovered: {
      backgroundColor: 'white',
      transform: 'translateY(-8px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    },
    coursCardContent: {
      padding: '1.5rem',
      minHeight: '180px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    coursCardTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem'
    },
    coursIcon: {
      padding: '0.75rem',
      background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
      borderRadius: '0.75rem',
      transition: 'all 0.3s ease'
    },
    coursIconHovered: {
      background: 'linear-gradient(135deg, #bfdbfe, #c7d2fe)'
    },
    studentCount: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    coursTitle: {
      fontSize: '1.125rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '0.5rem',
      transition: 'color 0.2s ease'
    },
    coursTitleHovered: {
      color: '#2563eb'
    },
    professeurInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#6b7280',
      marginBottom: '1rem',
      fontSize: '0.875rem'
    },
    coursFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '1rem',
      borderTop: '1px solid #f3f4f6'
    },
    badge: {
      backgroundColor: '#eff6ff',
      color: '#2563eb',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      display: 'inline-block'
    },
    deleteButton: {
      padding: '0.5rem',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    deleteButtonHovered: {
      backgroundColor: '#dc2626',
      color: 'white',
      borderColor: '#dc2626'
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
    select: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.75rem',
      fontSize: '0.875rem',
      backgroundColor: '#f9fafb',
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 0.75rem center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '1.5em 1.5em',
      paddingRight: '2.5rem'
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
    buttonGroup: {
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
    detailsModalContent: {
      width: '100%',
      maxWidth: '32rem'
    },
    detailsBody: {
      padding: '1.5rem',
      maxHeight: '60vh',
      overflowY: 'auto'
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem'
    },
    sectionTitle: {
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
    viewButton: {
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
    // Styles pour le select avec recherche
    searchableSelect: {
      position: 'relative',
      width: '100%'
    },
    searchInput: {
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
    dropdownItemHover: {
      backgroundColor: '#f3f4f6'
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
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />

      <div style={styles.innerContainer}>
        {/* Header moderne */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={{ ...styles.headerLeft, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <div style={styles.iconContainer}>
              </div>
              <div>
                <h1 style={{ ...styles.title, textAlign: 'center', width: '100%' }}>Gestion des Classes</h1>
              </div>
            </div>
            <button
              onClick={() => setShowAjoutModal(true)}
              style={styles.addButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <Plus size={20} />
              Nouveau Classe
            </button>
          </div>
        </div>

        {/* Section des filtres */}
        <div style={styles.filterSection}>
          <div style={styles.filterHeader}>
            <div style={styles.filterTitle}>
              <Filter size={20} color="#2563eb" />
              Filtres
            </div>
            <button
              onClick={() => setFiltreActif(!filtreActif)}
              style={styles.filterToggle}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {filtreActif ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>
          </div>

          <div style={styles.filterContent}>
            <div style={styles.filterGrid}>
              {/* Sélection de cours */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <BookOpen size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Sélectionner un cours
                </label>
                <select
                  value={coursFiltre}
                  onChange={(e) => setCoursFiltre(e.target.value)}
                  style={styles.filterSelect}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Tous les cours</option>
                  {cours.map((c) => (
                    <option key={c._id} value={c.nom}>{c.nom}</option>
                  ))}
                </select>
              </div>

              {/* Filtre par professeur */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <GraduationCap size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Filtre par professeur
                </label>
                <select
                  value={professeurFiltre}
                  onChange={(e) => setProfesseurFiltre(e.target.value)}
                  style={styles.filterSelect}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Tous les professeurs</option>
                  {/* Obtenir tous les professeurs uniques des cours */}
                  {[...new Set(
                    cours.flatMap(c => 
                      Array.isArray(c.professeur) ? c.professeur : [c.professeur]
                    ).filter(prof => prof && prof.trim() !== '')
                  )].sort().map((prof, index) => (
                    <option key={index} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions des filtres */}
            <div style={styles.filterActions}>
              {nombreFiltresActifs() > 0 && (
                <div style={styles.filterBadge}>
                  <Filter size={16} />
                  {nombreFiltresActifs()} filtre{nombreFiltresActifs() > 1 ? 's' : ''} actif{nombreFiltresActifs() > 1 ? 's' : ''}
                </div>
              )}
              
              {nombreFiltresActifs() > 0 && (
                <button
                  onClick={reinitialiserFiltres}
                  style={styles.resetButton}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Résultats de la sélection */}
        {(coursFiltre !== '' || professeurFiltre !== '') && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#1e40af', fontWeight: '500', margin: 0 }}>
              {coursFiltres.length} cours trouvé{coursFiltres.length > 1 ? 's' : ''} 
              {coursFiltre && ` pour le cours "${coursFiltre}"`}
              {professeurFiltre && ` avec le professeur "${professeurFiltre}"`}
            </p>
          </div>
        )}

        {/* Grille des cours filtrés */}
        <div style={styles.coursGrid}>
          {coursFiltres.map((c) => {
            const nombreEtudiants = etudiants.filter(e => e.cours.includes(c.nom)).length;
            const isHovered = hoveredCard === c._id;
            
            return (
              <div 
                key={c._id}
                style={{
                  ...styles.coursCard,
                  ...(isHovered ? styles.coursCardHovered : {})
                }}
                onMouseEnter={() => setHoveredCard(c._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={styles.coursCardContent}>
                  <div 
                    onClick={() => afficherDetails(c)}
                    style={{cursor: 'pointer'}}
                  >
                    <div style={styles.coursCardTop}>
                      <div 
                        style={{
                          ...styles.coursIcon,
                          ...(isHovered ? styles.coursIconHovered : {})
                        }}
                      >
                        <BookOpen size={24} color="#2563eb" />
                      </div>
                      <div style={styles.studentCount}>
                        <Users size={16} />
                        <span>{nombreEtudiants}</span>
                      </div>
                    </div>
                    
                    <h3 
                      style={{
                        ...styles.coursTitle,
                        ...(isHovered ? styles.coursTitleHovered : {})
                      }}
                    >
                      {c.nom}
                    </h3>
                    
                    <div style={styles.professeurInfo}>
                      <User size={16} />
                      <span>
                        {Array.isArray(c.professeur)
                          ? c.professeur.join(', ')
                          : c.professeur || 'Non assigné'}
                      </span>
                    </div>

                  </div>
                  
                  <div style={styles.coursFooter}>
                    <span style={styles.badge}>
                      {nombreEtudiants} étudiant{nombreEtudiants !== 1 ? 's' : ''}
                    </span>
                    
                    {/* Bouton de suppression */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        ouvrirModalSuppression(c);
                      }}
                      style={styles.deleteButton}
                      onMouseEnter={(e) => {
                        Object.assign(e.target.style, styles.deleteButtonHovered);
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fef2f2';
                        e.target.style.color = '#dc2626';
                        e.target.style.borderColor = '#fecaca';
                      }}
                      title="Supprimer ce classe"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message si aucun cours après filtrage */}
        {coursFiltres.length === 0 && cours.length > 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Filter size={24} color="#9ca3af" />
            </div>
            <h3 style={{fontSize: '1.25rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>
              Aucun cours ne correspond aux critères
            </h3>
            <p style={{color: '#9ca3af', marginBottom: '1rem'}}>
              Essayez de modifier vos sélections pour voir plus de résultats
            </p>
            <button
              onClick={reinitialiserFiltres}
              style={{
                ...styles.resetButton,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <X size={16} />
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Message si aucun cours du tout */}
        {cours.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <BookOpen size={24} color="#9ca3af" />
            </div>
            <h3 style={{fontSize: '1.25rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>
              Aucun cours disponible
            </h3>
            <p style={{color: '#9ca3af'}}>Commencez par ajouter votre premier classe</p>
          </div>
        )}
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
                <button
                  onClick={fermerModalAjout}
                  style={styles.closeButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
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
                    placeholder="Ex: Mathématiques, Physique..."
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Professeurs avec select recherchable */}
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
                      onFocus={() => {
                        if (professeurSearch.length > 0) {
                          setShowProfesseurDropdown(true);
                        }
                      }}
                      style={styles.searchInput}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.backgroundColor = 'white';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        if (professeurSearch.length > 0) {
                          setShowProfesseurDropdown(true);
                        }
                      }}
                      onBlur={(e) => {
                        // Délai pour permettre le clic sur un élément de la dropdown
                        setTimeout(() => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.backgroundColor = '#f9fafb';
                          e.target.style.boxShadow = 'none';
                          setShowProfesseurDropdown(false);
                        }, 200);
                      }}
                    />
                    
                    {/* Dropdown des résultats */}
                    {showProfesseurDropdown && professeursFiltres.length > 0 && (
                      <div style={styles.dropdown}>
                        {professeursFiltres.map((p) => (
                          <div
                            key={p._id}
                            style={styles.dropdownItem}
                            onClick={() => ajouterProfesseur(p)}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                            }}
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
                    
                    {/* Message si aucun résultat */}
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

                  {/* Affichage des professeurs sélectionnés */}
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
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#1e40af';
                                  e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                  e.target.style.color = '#1e40af';
                                }}
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

                <div style={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={fermerModalAjout}
                    style={styles.cancelButton}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={styles.submitButton}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
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
                <button
                  onClick={fermerModalSuppression}
                  style={styles.closeButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
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

              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={fermerModalSuppression}
                  style={styles.cancelButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSupprimerCours}
                  style={styles.deleteSubmitButton}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
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
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <X size={20} color="#6b7280" />
                </button>
              </div>
            </div>

            <div style={styles.detailsBody}>
              <div style={styles.sectionHeader}>
                <Users size={20} color="#2563eb" />
                <h3 style={styles.sectionTitle}>
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
                    <div 
                      key={e._id} 
                      style={styles.studentItem}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f9fafb';
                      }}
                    >
                      <div style={styles.studentInfo}>
                        <div style={styles.studentIcon}>
                          <User size={16} color="#2563eb" />
                        </div>
                        <span style={styles.studentName}>{e.nomComplet}</span>
                      </div>
                      <button
                        onClick={() => window.location.href = `/etudiant/${e._id}`}
                        style={styles.viewButton}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#3b82f6';
                        }}
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

export default ListeCoursAdmin;