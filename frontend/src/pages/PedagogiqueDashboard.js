import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح

import {
  Users, GraduationCap, CreditCard, TrendingUp, Award, UserCheck,
  DollarSign, Calendar, Target, BarChart3, PieChart as PieChartIcon,
  Activity, Globe, MapPin, Clock, BookOpen, Eye, Filter, LogOut,
  RefreshCw, ChevronDown, ChevronUp, AlertTriangle, User, Phone,
  IdCard, FileText, Shield, CheckCircle, XCircle, Building, 
  CalendarIcon, Star, X, AlertCircle, Search, Mail, Percent,
  Edit, Trash2, Download, Upload, Settings, Home, Info, Layers,
  ChevronRight, UserX, CheckSquare, UserCog
} from 'lucide-react';
 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const COLORS = [
  '#2563eb', '#059669', '#7c3aed', '#dc2626', '#ea580c', '#0891b2', 
  '#9333ea', '#ca8a04', '#e11d48', '#0d9488', '#7c2d12', '#1e40af'
];

const PedagogiqueDashboard = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cours, setCours] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [coursDetailles, setCoursDetailles] = useState([]);
  const [stats, setStats] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  
  // MODIFIER l'état initial du filtre année scolaire
  const [filtreAnneeScolaire, setFiltreAnneeScolaire] = useState('2025/2026');
  const [filtreNiveau, setFiltreNiveau] = useState('tous');
  const [filtreSpecialite, setFiltreSpecialite] = useState('toutes');
  const [searchTerm, setSearchTerm] = useState('');
  const [headerVisible, setHeaderVisible] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pour la liste des étudiants
  const [searchTermStudents, setSearchTermStudents] = useState('');
  const [filtreGenreStudents, setFiltreGenreStudents] = useState('tous');
  const [filtreStatutStudents, setFiltreStatutStudents] = useState('tous');

  // Pour les professeurs
  const [searchTermProfs, setSearchTermProfs] = useState('');
  const [filtreMatiereProfs, setFiltreMatiereProfs] = useState('toutes');

  // Pour le modal de détails
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    fetchData();
    getUserInfo();
  }, []);

  const getUserInfo = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({
          nom: payload.nom,
          filiere: payload.filiere,
          role: payload.role,
          estGeneral: payload.filiere === 'GENERAL' // Ajout pour détecter le mode général
        });
      }
    } catch (error) {
      console.error('Erreur extraction token:', error);
      setError('Erreur d\'authentification');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Utilisation des routes spécifiques au pédagogique
      const [etudiantsRes, coursRes, professeursRes, statsRes, coursDetaillesRes] = await Promise.all([
        fetch('http://localhost:5000/api/pedagogique/etudiants', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/pedagogique/cours', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/pedagogique/professeurs', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/pedagogique/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/pedagogique/cours-detailles', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Vérification des réponses
      if (!etudiantsRes.ok) {
        const errorData = await etudiantsRes.json();
        throw new Error(`Erreur étudiants: ${errorData.message || etudiantsRes.statusText}`);
      }
      
      if (!coursRes.ok) {
        const errorData = await coursRes.json();
        throw new Error(`Erreur cours: ${errorData.message || coursRes.statusText}`);
      }

      if (!professeursRes.ok) {
        const errorData = await professeursRes.json();
        throw new Error(`Erreur professeurs: ${errorData.message || professeursRes.statusText}`);
      }

      if (!statsRes.ok) {
        const errorData = await statsRes.json();
        throw new Error(`Erreur statistiques: ${errorData.message || statsRes.statusText}`);
      }

      if (!coursDetaillesRes.ok) {
        const errorData = await coursDetaillesRes.json();
        throw new Error(`Erreur cours détaillés: ${errorData.message || coursDetaillesRes.statusText}`);
      }

      const [etudiantsData, coursData, professeursData, statsData, coursDetaillesData] = await Promise.all([
        etudiantsRes.json(),
        coursRes.json(),
        professeursRes.json(),
        statsRes.json(),
        coursDetaillesRes.json()
      ]);

      console.log('Données chargées (pédagogique):', {
        etudiants: etudiantsData.length,
        cours: coursData.length,
        professeurs: professeursData.length,
        coursDetailles: coursDetaillesData.length,
        filiere: statsData.filiere
      });

      setEtudiants(etudiantsData);
      setCours(coursData);
      setProfesseurs(professeursData);
      setCoursDetailles(coursDetaillesData);
      setStats(statsData);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message);
      setEtudiants([]);
      setCours([]);
      setProfesseurs([]);
      setCoursDetailles([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Filtres améliorés
  const getFilteredEtudiants = () => {
    let filtered = [...etudiants];

    // Filtre par année scolaire (corrigé)
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

    // Recherche textuelle
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        (e.nom && e.nom.toLowerCase().includes(search)) ||
        (e.prenom && e.prenom.toLowerCase().includes(search)) ||
        (e.cin && e.cin.toLowerCase().includes(search)) ||
        (e.telephone && e.telephone.includes(search)) ||
        (e.email && e.email.toLowerCase().includes(search))
      );
    }

    return filtered;
  };

  // Fonction pour filtrer les étudiants
  const getFilteredStudents = () => {
    let filtered = getFilteredEtudiants(); // Utilise déjà vos filtres existants

    // Filtre par recherche spécifique aux étudiants
    if (searchTermStudents.trim() !== '') {
      const search = searchTermStudents.toLowerCase();
      filtered = filtered.filter(e => 
        (e.nom && e.nom.toLowerCase().includes(search)) ||
        (e.prenom && e.prenom.toLowerCase().includes(search)) ||
        (e.cin && e.cin.toLowerCase().includes(search)) ||
        (e.codeEtudiant && e.codeEtudiant.toLowerCase().includes(search))
      );
    }

    // Filtre par genre
    if (filtreGenreStudents !== 'tous') {
      filtered = filtered.filter(e => e.genre === filtreGenreStudents);
    }

    // Filtre par statut
    if (filtreStatutStudents !== 'tous') {
      if (filtreStatutStudents === 'actifs') {
        filtered = filtered.filter(e => e.actif);
      } else if (filtreStatutStudents === 'inactifs') {
        filtered = filtered.filter(e => !e.actif);
      } else if (filtreStatutStudents === 'payes') {
        filtered = filtered.filter(e => e.paye);
      } else if (filtreStatutStudents === 'non-payes') {
        filtered = filtered.filter(e => !e.paye);
      }
    }

    return filtered;
  };

  // Fonction pour filtrer les professeurs
  const getFilteredProfesseurs = () => {
    let filtered = [...professeurs];

    if (searchTermProfs.trim() !== '') {
      const search = searchTermProfs.toLowerCase();
      filtered = filtered.filter(p => 
        (p.nom && p.nom.toLowerCase().includes(search)) ||
        (p.email && p.email.toLowerCase().includes(search)) ||
        (p.telephone && p.telephone.includes(search)) ||
        (p.matiere && p.matiere.toLowerCase().includes(search))
      );
    }

    if (filtreMatiereProfs !== 'toutes') {
      filtered = filtered.filter(p => p.matiere === filtreMatiereProfs);
    }

    return filtered;
  };

  const etudiantsFiltres = getFilteredEtudiants();

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Fonction pour calculer l'âge
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

  // Fonction pour voir les détails d'un étudiant
  const handleView = (etudiant) => {
    setSelectedAnalysis({ 
      type: 'Détails Étudiant', 
      title: `${etudiant.prenom} ${etudiant.nomDeFamille}`,
      data: { etudiants: [etudiant] }
    });
    setModalData([etudiant]);
    setShowDetailModal(true);
  };

  // Fonction pour gérer les clics sur "Voir"
  const handleViewStudent = (etudiant) => {
    setSelectedStudent(etudiant);
    setShowStudentModal(true);
  };

  // Analyse par type de formation
  const analyseParTypeFormation = () => {
    const types = {
      'FI': { label: 'Formation Initiale', etudiants: [], color: '#2563eb' },
      'TA': { label: 'Temps Alterné', etudiants: [], color: '#059669' },
      'Executive': { label: 'Executive', etudiants: [], color: '#7c3aed' }
    };

    etudiantsFiltres.forEach(e => {
      const niveau = (e.niveauFormation || '').toLowerCase();
      const cycle = (e.cycle || '').toLowerCase();
      
      if (niveau.includes('executive') || cycle.includes('executive')) {
        types.Executive.etudiants.push(e);
      } else if (niveau.includes('ta') || niveau.includes('alterne') || cycle.includes('ta') || cycle.includes('alterne')) {
        types.TA.etudiants.push(e);
      } else {
        types.FI.etudiants.push(e);
      }
    });

    return Object.entries(types).map(([key, data]) => ({
      type: key,
      label: data.label,
      color: data.color,
      total: data.etudiants.length,
      payes: data.etudiants.filter(e => e.paye).length,
      ca: data.etudiants.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
      tauxPaiement: data.etudiants.length > 0 ? (data.etudiants.filter(e => e.paye).length / data.etudiants.length * 100).toFixed(1) : 0
    }));
  };

  // Now we can safely declare these variables that depend on the functions above
  const etudiantsFiltered = getFilteredStudents();
  const professeursFiltered = getFilteredProfesseurs();
  const formationTypesData = analyseParTypeFormation();

  // Analyse des professeurs par filière
  const analyseProfesseurs = () => {
    const filieresProfs = {};
    
    etudiants.forEach(e => {
      const filiere = e.filiere || 'Non définie';
      if (!filieresProfs[filiere]) {
        filieresProfs[filiere] = {
          filiere,
          professeurs: new Set(),
          etudiants: 0,
          typeFormations: new Set()
        };
      }
      
      filieresProfs[filiere].etudiants++;
      if (e.professeur) filieresProfs[filiere].professeurs.add(e.professeur);
      
      // Déterminer le type de formation
      const niveau = (e.niveauFormation || '').toLowerCase();
      const cycle = (e.cycle || '').toLowerCase();
      const isExecutive = niveau.includes('executive') || cycle.includes('executive');
      const isTA = niveau.includes('ta') || niveau.includes('alterne') || cycle.includes('ta') || cycle.includes('alterne');
      
      if (isTA) {
        filieresProfs[filiere].typeFormations.add('TA (Temps Alterné)');
      } else if (isExecutive) {
        filieresProfs[filiere].typeFormations.add('Executive');
      } else {
        filieresProfs[filiere].typeFormations.add('FI (Formation Initiale)');
      }
    });
    
    return Object.values(filieresProfs).map(f => ({
      ...f,
      professeurs: Array.from(f.professeurs),
      typeFormations: Array.from(f.typeFormations),
      nbProfesseurs: f.professeurs.size
    })).sort((a, b) => b.etudiants - a.etudiants);
  };

  // Calculs statistiques basés sur les données filtrées
  const statsGeneralesFiltered = {
    totalEtudiants: etudiantsFiltres.length,
    etudiantsActifs: etudiantsFiltres.filter(e => e.actif).length,
    etudiantsPayes: etudiantsFiltres.filter(e => e.paye).length,
    chiffreAffaireTotal: etudiantsFiltres.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
    chiffreAffairePaye: etudiantsFiltres.filter(e => e.paye).reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
    moyennePrixFormation: etudiantsFiltres.length > 0 ?etudiantsFiltres.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0) / etudiantsFiltres.length : 0,
    tauxPaiement: etudiantsFiltres.length > 0 ? (etudiantsFiltres.filter(e => e.paye).length / etudiantsFiltres.length * 100) : 0,
    nouveauxEtudiants: etudiantsFiltres.filter(e => e.nouvelleInscription).length,
  };

  // Statistiques globales (non filtrées) pour l'en-tête
  const statsGenerales = stats ? {
    totalEtudiants: stats.totalEtudiants,
    etudiantsActifs: stats.etudiantsActifs,
    etudiantsPayes: stats.etudiantsPayes,
    chiffreAffaireTotal: stats.chiffreAffaireTotal,
    chiffreAffairePaye: stats.chiffreAffairePaye,
    moyennePrixFormation: stats.moyennePrixFormation,
    tauxPaiement: stats.tauxPaiement,
    nouveauxEtudiants: stats.nouveauxEtudiants,
  } : statsGeneralesFiltered;

  // Analyse par niveau basée sur les données filtrées
  const analyseParNiveau = () => {
    const niveauxStats = {};
    
    etudiantsFiltres.forEach(e => {
      const niveau = e.niveau || 'Non défini';
      if (!niveauxStats[niveau]) {
        niveauxStats[niveau] = { total: 0, payes: 0, ca: 0 };
      }
      niveauxStats[niveau].total += 1;
      if (e.paye) niveauxStats[niveau].payes += 1;
      niveauxStats[niveau].ca += parseFloat(e.prixTotal) || 0;
    });

    return Object.entries(niveauxStats).map(([niveau, data]) => ({
      niveau: `Niveau ${niveau}`,
      ...data,
      tauxReussite: data.total > 0 ? ((data.payes / data.total) * 100).toFixed(1) : 0
    })).sort((a, b) => {
      const niveauA = parseInt(a.niveau.replace('Niveau ', '')) || 0;
      const niveauB = parseInt(b.niveau.replace('Niveau ', '')) || 0;
      return niveauA - niveauB;
    });
  };

  // Analyse par spécialité basée sur les données filtrées
  const analyseParSpecialite = () => {
    const specialitesStats = {};
    
    etudiantsFiltres.forEach(e => {
      let specialite = 'Tronc commun';
      if (e.specialiteIngenieur) {
        specialite = e.specialiteIngenieur;
      } else if (e.specialiteLicencePro) {
        specialite = e.specialiteLicencePro;
      } else if (e.specialiteMasterPro) {
        specialite = e.specialiteMasterPro;
      } else if (e.specialite) {
        specialite = e.specialite;
      }
      
      if (!specialitesStats[specialite]) {
        specialitesStats[specialite] = { total: 0, payes: 0, ca: 0 };
      }
      specialitesStats[specialite].total += 1;
      if (e.paye) specialitesStats[specialite].payes += 1;
      specialitesStats[specialite].ca += parseFloat(e.prixTotal) || 0;
    });

    return Object.entries(specialitesStats).map(([specialite, data]) => ({
      specialite: specialite.length > 40 ? specialite.substring(0, 40) + '...' : specialite,
      specialiteComplete: specialite,
      ...data,
      tauxReussite: data.total > 0 ? ((data.payes / data.total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);
  };

  // Analyse par année scolaire basée sur les données filtrées
  const analyseParAnneeScolaire = () => {
    const anneesStats = {};
    
    etudiantsFiltres.forEach(e => {
      const annee = e.anneeScolaire || 'Non définie';
      if (!anneesStats[annee]) {
        anneesStats[annee] = { total: 0, payes: 0, ca: 0 };
      }
      anneesStats[annee].total += 1;
      if (e.paye) anneesStats[annee].payes += 1;
      anneesStats[annee].ca += parseFloat(e.prixTotal) || 0;
    });

    return Object.entries(anneesStats).map(([annee, data]) => ({
      annee,
      ...data,
      tauxReussite: data.total > 0 ? ((data.payes / data.total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.annee.localeCompare(a.annee));
  };

  // Analyse des cours avec relation professeur-étudiant
  const analyseCoursAvecProfesseurs = () => {
    return coursDetailles.map(cours => {
      // Trouver les étudiants de ce cours selon les filtres appliqués
      const etudiantsDuCours = etudiantsFiltres.filter(e => 
        e.cours && Array.isArray(e.cours) && e.cours.includes(cours.nom)
      );

      return {
        ...cours,
        etudiantsFiltres: etudiantsDuCours.length,
        etudiantsPayesFiltres: etudiantsDuCours.filter(e => e.paye).length,
        caFiltre: etudiantsDuCours.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0)
      };
    }).filter(cours => cours.etudiantsFiltres > 0); // Ne montrer que les cours avec des étudiants
  };

  const niveauxData = analyseParNiveau();
  const specialitesData = analyseParSpecialite();
  const anneesData = analyseParAnneeScolaire();
  const coursAvecProfs = analyseCoursAvecProfesseurs();
  const professeursParsFiliere = analyseProfesseurs();

  // Obtenir les valeurs uniques pour les filtres (basées sur toutes les données, pas filtrées)
  const anneesDisponibles = [...new Set(etudiants.map(e => e.anneeScolaire).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const niveauxDisponibles = [...new Set(etudiants.map(e => e.niveau).filter(n => n !== undefined))].sort((a, b) => a - b);
  const specialitesDisponibles = [...new Set(etudiants.map(e => {
    return e.specialiteIngenieur || e.specialiteLicencePro || e.specialiteMasterPro || e.specialite;
  }).filter(Boolean))];
  const genresDisponibles = [...new Set(etudiants.map(e => e.genre).filter(Boolean))];
  const matieresDisponibles = [...new Set(professeurs.map(p => p.matiere).filter(Boolean))];

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount).replace('MAD', 'DH');
  };

  const resetFilters = () => {
    const anneesDisponibles = [...new Set(etudiants.map(e => e.anneeScolaire).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const defaultYear = initializeDefaultYear(anneesDisponibles);
    
    setFiltreAnneeScolaire(defaultYear);
    setFiltreNiveau('tous');
    setFiltreSpecialite('toutes');
    setSearchTerm('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // AJOUTER cette fonction pour initialiser l'année par défaut
  const initializeDefaultYear = (anneesDisponibles) => {
    // Vérifier si 2025/2026 existe dans les données
    if (anneesDisponibles.includes('2025/2026')) {
      return '2025/2026';
    }
    // Sinon, prendre l'année la plus récente
    if (anneesDisponibles.length > 0) {
      return anneesDisponibles[0]; // Les années sont déjà triées par ordre décroissant
    }
    // Si aucune donnée, revenir à 'toutes'
    return 'toutes';
  };

  // AJOUTER cette fonction pour obtenir l'année scolaire actuelle de manière intelligente
  const getDefaultAcademicYear = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() retourne 0-11
    
    // Si nous sommes entre septembre et décembre, l'année scolaire commence cette année
    // Si nous sommes entre janvier et août, l'année scolaire a commencé l'année précédente
    const startYear = currentMonth >= 9 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    
    return `${startYear}/${endYear}`;
  };

  useEffect(() => {
    fetchData();
    getUserInfo();
  }, []);

  // AJOUTER ce nouvel useEffect pour initialiser le filtre après le chargement des données
  useEffect(() => {
    if (etudiants.length > 0) {
      const anneesDisponibles = [...new Set(etudiants.map(e => e.anneeScolaire).filter(Boolean))].sort((a, b) => b.localeCompare(a));
      const currentFilter = filtreAnneeScolaire;
      
      // Si le filtre actuel n'existe pas dans les données disponibles
      if (currentFilter !== 'toutes' && !anneesDisponibles.includes(currentFilter)) {
        const defaultYear = initializeDefaultYear(anneesDisponibles);
        setFiltreAnneeScolaire(defaultYear);
      }
    }
  }, [etudiants, filtreAnneeScolaire]);

  // ...existing code for getUserInfo and fetchData...

  // ...existing code for filtered functions and stats...

  // ...existing code until the select element...

  return (
    <div className="enhanced-dashboard">
      <Sidebar onLogout={handleLogout} />

      {/* Bouton pour masquer/afficher le header */}
      <button 
        className="header-toggle-btn"
        onClick={() => setHeaderVisible(!headerVisible)}
        title={headerVisible ? "Masquer l'en-tête" : "Afficher l'en-tête"}
      >
        {headerVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* En-tête spécifique pédagogique */}
      {headerVisible && (
        <header className="dashboard-header dashboard-header-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div className="container">
            <div className="header-content header-content-center">
              <div className="header-info header-info-center">
                <h1>
                  <GraduationCap size={28} />
                  Dashboard Pédagogique - {userInfo?.filiere === 'GENERAL' ? 'GÉNÉRAL 🌟' : userInfo?.filiere || stats?.filiere || 'Chargement...'}
                  {userInfo?.filiere === 'GENERAL' && (
                    <span className="general-badge">
                      <Shield size={16} />
                      ACCÈS GLOBAL
                    </span>
                  )}
                </h1>
                <div className="header-stats header-stats-center">
                  <span className="header-stat">
                    <Users size={16} />
                    {statsGenerales.totalEtudiants} étudiants {userInfo?.filiere === 'GENERAL' ? '(Toutes filières)' : ''}
                  </span>
                  <span className="header-stat">
                    <BookOpen size={16} />
                    {cours.length} cours
                  </span>
                  <span className="header-stat">
                    <User size={16} />
                    {professeurs.length} professeurs
                  </span>
                  <span className="header-stat">
                    <DollarSign size={16} />
                    {formatMoney(statsGenerales.chiffreAffaireTotal)}
                  </span>
                  <span className="header-stat">
                    <Percent size={16} />
                    {statsGenerales.tauxPaiement.toFixed(1)}% payé
                  </span>
                </div>
                
                {/* Indicateur de filtres actifs */}
                {(filtreAnneeScolaire !== 'toutes' || filtreNiveau !== 'tous' || filtreSpecialite !== 'toutes' || searchTerm) && (
                  <div className="filters-active-indicator">
                    <Filter size={14} />
                    <span>Filtres appliqués ({etudiantsFiltres.length} résultats)</span>
                    <button onClick={resetFilters} className="reset-filters-btn">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="header-controls header-controls-center">
                <div className="search-container">
                  <div className="search-input-container">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder={userInfo?.filiere === 'GENERAL' ? "Rechercher dans toutes les filières..." : "Rechercher un étudiant..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="clear-search-btn">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filters-container">
                  <select value={filtreAnneeScolaire} onChange={(e) => setFiltreAnneeScolaire(e.target.value)} className="filter-select">
                    <option value="toutes">Toutes les années scolaires</option>
                    {anneesDisponibles.map(annee => (
                      <option key={annee} value={annee}>
                        {annee} {annee === '2025/2026' ? '(Année actuelle)' : ''}
                      </option>
                    ))}
                  </select>

                  <select value={filtreNiveau} onChange={(e) => setFiltreNiveau(e.target.value)} className="filter-select">
                    <option value="tous">Tous les niveaux</option>
                    {niveauxDisponibles.map(niveau => (
                      <option key={niveau} value={niveau}>Niveau {niveau}</option>
                    ))}
                  </select>

                  <select value={filtreSpecialite} onChange={(e) => setFiltreSpecialite(e.target.value)} className="filter-select">
                    <option value="toutes">Toutes spécialités</option>
                    {specialitesDisponibles.map(specialite => (
                      <option key={specialite} value={specialite}>
                        {specialite.length > 30 ? specialite.substring(0, 30) + '...' : specialite}
                      </option>
                    ))}
                  </select>
                </div>

                <button onClick={fetchData} className="btn-refresh">
                  <RefreshCw size={16} />
                  Actualiser
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="dashboard-container">
        {/* Navigation par onglets */}
        <div className="tabs-navigation">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Home size={16} />
            Vue d'ensemble
          </button>
          <button 
            className={`tab-btn ${activeTab === 'niveaux' ? 'active' : ''}`}
            onClick={() => setActiveTab('niveaux')}
          >
            <Layers size={16} />
            Par Niveau
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specialites' ? 'active' : ''}`}
            onClick={() => setActiveTab('specialites')}
          >
            <Award size={16} />
            Par Spécialité
          </button>
          <button 
            className={`tab-btn ${activeTab === 'annees' ? 'active' : ''}`}
            onClick={() => setActiveTab('annees')}
          >
            <Calendar size={16} />
            Par Année Scolaire
          </button>
          <button 
            className={`tab-btn ${activeTab === 'cours-profs' ? 'active' : ''}`}
            onClick={() => setActiveTab('cours-profs')}
          >
            <BookOpen size={16} />
            Cours & Professeurs
          </button>
          <button 
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={16} />
            Liste Étudiants
          </button>
          <button 
            className={`tab-btn ${activeTab === 'professors' ? 'active' : ''}`}
            onClick={() => setActiveTab('professors')}
          >
            <UserCog size={16} />
            Professeurs
          </button>
        </div>

        <div className="dashboard-content">
          
          {activeTab === 'overview' && (
            <>
              {/* Statistiques principales */}
              <div className="stats-section">
                <div className="stats-grid">
                  <div className="stat-card blue">
                    <div className="stat-icon">
                      <Users size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>{statsGeneralesFiltered.totalEtudiants}</h3>
                      <p>Étudiants {userInfo?.filiere === 'GENERAL' ? '(Toutes filières)' : '(filtrés)'}</p>
                      <span className="stat-detail">{statsGeneralesFiltered.etudiantsActifs} actifs • {statsGeneralesFiltered.nouveauxEtudiants} nouveaux</span>
                    </div>
                  </div>

                  <div className="stat-card green">
                    <div className="stat-icon">
                      <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>{formatMoney(statsGeneralesFiltered.chiffreAffaireTotal)}</h3>
                      <p>CA {userInfo?.filiere === 'GENERAL' ? '(Global)' : '(filtré)'}</p>
                      <span className="stat-detail">{formatMoney(statsGeneralesFiltered.chiffreAffairePaye)} encaissé</span>
                    </div>
                  </div>

                  <div className="stat-card purple">
                    <div className="stat-icon">
                      <Percent size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>{statsGeneralesFiltered.tauxPaiement.toFixed(1)}%</h3>
                      <p>Taux de Paiement</p>
                      <span className="stat-detail">{statsGeneralesFiltered.etudiantsPayes} étudiants payés</span>
                    </div>
                  </div>

                  <div className="stat-card orange">
                    <div className="stat-icon">
                      <Award size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>{formatMoney(statsGeneralesFiltered.moyennePrixFormation)}</h3>
                      <p>Prix Moyen</p>
                      <span className="stat-detail">par formation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section spéciale pour pédagogique général : Répartition par filière */}
              {userInfo?.filiere === 'GENERAL' && stats && stats.repartitionFiliere && (
                <div className="charts-section">
                  <div className="chart-card" style={{ marginBottom: '2rem' }}>
                    <h3>
                      <PieChartIcon size={20} />
                      Répartition par Filière (Vue Générale)
                    </h3>
                    {Object.keys(stats.repartitionFiliere).length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={Object.entries(stats.repartitionFiliere).map(([filiere, data]) => ({
                              name: filiere,
                              value: data.total,
                              ca: data.ca,
                              payes: data.payes
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            dataKey="value"
                            label={({name, value}) => `${name}: ${value}`}
                          >
                            {Object.entries(stats.repartitionFiliere).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} étudiants`,
                              `CA: ${formatMoney(props.payload.ca)}`,
                              `Payés: ${props.payload.payes}`
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data">Aucune donnée à afficher</div>
                    )}
                  </div>
                </div>
              )}

              {/* Graphiques overview */}
              <div className="charts-section">
                <div className="charts-grid">
                  <div className="chart-card">
                    <h3>
                      <PieChartIcon size={20} />
                      Répartition par Niveau {userInfo?.filiere === 'GENERAL' ? '(Global)' : '(Filtré)'}
                    </h3>
                    {niveauxData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={niveauxData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="total"
                            label={({niveau, total}) => `${niveau}: ${total}`}
                          >
                            {niveauxData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data">Aucune donnée à afficher</div>
                    )}
                  </div>

                  <div className="chart-card">
                    <h3>
                      <BarChart3 size={20} />
                      Évolution par Année Scolaire {userInfo?.filiere === 'GENERAL' ? '(Global)' : '(Filtré)'}
                    </h3>
                    {anneesData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={anneesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="annee" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" fill="#2563eb" name="Total Étudiants" />
                          <Bar dataKey="payes" fill="#059669" name="Payés" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data">Aucune donnée à afficher</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cartes des types de formation */}
              <div className="formation-types-section">
                <h2 className="section-title">
                  <Award size={24} />
                  Types de Formation
                </h2>
                <div className="formation-types-grid">
                  {formationTypesData.map((formation, index) => (
                    <div key={index} className="formation-type-card">
                      <div className="formation-type-header">
                        <div className="formation-type-icon" style={{ background: formation.color }}>
                          <GraduationCap size={24} />
                        </div>
                        <div className="formation-type-info">
                          <h3>{formation.label}</h3>
                          <span className="formation-type-code">{formation.type}</span>
                        </div>
                      </div>
                      
                      <div className="formation-type-stats">
                        <div className="formation-stat">
                          <span className="formation-stat-value">{formation.total}</span>
                          <span className="formation-stat-label">Étudiants</span>
                        </div>
                        <div className="formation-stat">
                          <span className="formation-stat-value">{formation.payes}</span>
                          <span className="formation-stat-label">Payés</span>
                        </div>
                        <div className="formation-stat">
                          <span className="formation-stat-value">{formation.tauxPaiement}%</span>
                          <span className="formation-stat-label">Taux</span>
                        </div>
                      </div>
                      
                      <div className="formation-ca">
                        <span className="formation-ca-label">Chiffre d'affaires</span>
                        <span className="formation-ca-value">{formatMoney(formation.ca)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'niveaux' && (
            <div className="section">
              <h2 className="section-title">
                <Layers size={24} />
                Analyse par Niveau - {userInfo?.filiere || stats?.filiere}
                {(filtreAnneeScolaire !== 'toutes' || filtreSpecialite !== 'toutes' || searchTerm) && (
                  <span className="filtered-indicator">(Vue filtrée)</span>
                )}
              </h2>
              <div className="table-container">
                {niveauxData.length > 0 ? (
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Niveau</th>
                        <th>Étudiants</th>
                        <th>Payés</th>
                        <th>CA Total</th>
                        <th>Taux Réussite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {niveauxData.map((niveau, index) => (
                        <tr key={index}>
                          <td className="niveau-name">{niveau.niveau}</td>
                          <td><span className="badge blue">{niveau.total}</span></td>
                          <td><span className="badge green">{niveau.payes}</span></td>
                          <td className="money">{formatMoney(niveau.ca)}</td>
                          <td>
                            <span className={`rate ${parseFloat(niveau.tauxReussite) >= 70 ? 'good' : 'warning'}`}>
                              {niveau.tauxReussite}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data-table">Aucune donnée correspondante aux filtres</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'specialites' && (
            <div className="section">
              <h2 className="section-title">
                <Award size={24} />
                Analyse par Spécialité - {userInfo?.filiere || stats?.filiere}
                {(filtreAnneeScolaire !== 'toutes' || filtreNiveau !== 'tous' || searchTerm) && (
                  <span className="filtered-indicator">(Vue filtrée)</span>
                )}
              </h2>
              <div className="table-container">
                {specialitesData.length > 0 ? (
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Spécialité</th>
                        <th>Étudiants</th>
                        <th>Payés</th>
                        <th>CA Total</th>
                        <th>Taux Réussite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specialitesData.map((spec, index) => (
                        <tr key={index}>
                          <td className="specialite-name" title={spec.specialiteComplete}>
                            {spec.specialite}
                          </td>
                          <td><span className="badge blue">{spec.total}</span></td>
                          <td><span className="badge green">{spec.payes}</span></td>
                          <td className="money">{formatMoney(spec.ca)}</td>
                          <td>
                            <span className={`rate ${parseFloat(spec.tauxReussite) >= 70 ? 'good' : 'warning'}`}>
                              {spec.tauxReussite}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data-table">Aucune donnée correspondante aux filtres</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'annees' && (
            <div className="section">
              <h2 className="section-title">
                <Calendar size={24} />
                Analyse par Année Scolaire - {userInfo?.filiere || stats?.filiere}
                {(filtreNiveau !== 'tous' || filtreSpecialite !== 'toutes' || searchTerm) && (
                  <span className="filtered-indicator">(Vue filtrée)</span>
                )}
              </h2>
              <div className="table-container">
                {anneesData.length > 0 ? (
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Année Scolaire</th>
                        <th>Étudiants</th>
                        <th>Payés</th>
                        <th>CA Total</th>
                        <th>Taux Réussite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anneesData.map((annee, index) => (
                        <tr key={index}>
                          <td className="annee-name">{annee.annee}</td>
                          <td><span className="badge blue">{annee.total}</span></td>
                          <td><span className="badge green">{annee.payes}</span></td>
                          <td className="money">{formatMoney(annee.ca)}</td>
                          <td>
                            <span className={`rate ${parseFloat(annee.tauxReussite) >= 70 ? 'good' : 'warning'}`}>
                              {annee.tauxReussite}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data-table">Aucune donnée correspondante aux filtres</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cours-profs' && (
            <div className="section">
              <h2 className="section-title">
                <BookOpen size={24} />
                Cours & Professeurs - {userInfo?.filiere || stats?.filiere}
                {(filtreAnneeScolaire !== 'toutes' || filtreNiveau !== 'tous' || filtreSpecialite !== 'toutes' || searchTerm) && (
                  <span className="filtered-indicator">(Vue filtrée)</span>
                )}
              </h2>
              
              <div className="cours-professeurs-grid">
                {coursAvecProfs.length > 0 ? (
                  coursAvecProfs.map((cours, index) => (
                    <div key={index} className="cours-card">
                      <div className="cours-header">
                        <h3 className="cours-title">
                          <BookOpen size={18} />
                          {cours.nom}
                        </h3>
                        <div className="cours-stats-badges">
                          <span className="stat-badge blue">
                            <Users size={14} />
                            {cours.etudiantsFiltres} étudiants
                          </span>
                          <span className="stat-badge green">
                            <CheckSquare size={14} />
                            {cours.etudiantsPayesFiltres} payés
                          </span>
                        </div>
                      </div>

                      <div className="cours-details">
                        <div className="cours-financial">
                          <div className="financial-item">
                            <span className="label">CA filtré:</span>
                            <span className="value">{formatMoney(cours.caFiltre)}</span>
                          </div>
                          <div className="financial-item">
                            <span className="label">Taux paiement:</span>
                            <span className={`rate ${cours.etudiantsFiltres > 0 && (cours.etudiantsPayesFiltres / cours.etudiantsFiltres) >= 0.7 ? 'good' : 'warning'}`}>
                              {cours.etudiantsFiltres > 0 ? ((cours.etudiantsPayesFiltres / cours.etudiantsFiltres) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>

                        {cours.professeurs && cours.professeurs.length > 0 && (
                          <div className="professeurs-section">
                            <h4 className="professeurs-title">
                              <User size={16} />
                              Professeurs ({cours.professeurs.length})
                            </h4>
                            <div className="professeurs-list">
                              {cours.professeurs.map((prof, profIndex) => (
                                <div key={profIndex} className="professeur-item">
                                  <div className="professeur-info">
                                    <span className="professeur-nom">{prof.nom}</span>
                                    {prof.email && (
                                      <span className="professeur-email">
                                        <Mail size={12} />
                                        {prof.email}
                                      </span>
                                    )}
                                    {prof.telephone && (
                                      <span className="professeur-tel">
                                        <Phone size={12} />
                                        {prof.telephone}
                                      </span>
                                    )}
                                  </div>
                                  {prof.matiere && prof.matiere !== cours.nom && (
                                    <div className="professeur-matiere">
                                      Spécialité: {prof.matiere}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cours.dateCreation && (
                          <div className="cours-meta">
                            <span className="creation-date">
                              <Calendar size={14} />
                              Créé le {new Date(cours.dateCreation).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data-courses">
                    <BookOpen size={48} color="#94a3b8" />
                    <h3>Aucun cours trouvé</h3>
                    <p>Aucun cours ne correspond aux filtres appliqués ou aucun étudiant n'est inscrit aux cours disponibles.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <>
              <div className="section">
                <h2 className="section-title">
                  <Users size={24} />
                  Liste Complète des Étudiants ({etudiantsFiltered.length})
                </h2>
                
                {/* Filtres spécifiques aux étudiants */}
                <div className="students-filters">
                  <div className="students-filters-row">
                    <div className="search-input-container">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, prénom, CIN, code étudiant..."
                        value={searchTermStudents}
                        onChange={(e) => setSearchTermStudents(e.target.value)}
                        className="students-search-input"
                      />
                      {searchTermStudents && (
                        <button onClick={() => setSearchTermStudents('')} className="clear-search-btn">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                    <select 
                      value={filtreGenreStudents} 
                      onChange={(e) => setFiltreGenreStudents(e.target.value)} 
                      className="students-filter-select"
                    >
                      <option value="tous">Tous les genres</option>
                      {genresDisponibles.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>

                    <select 
                      value={filtreStatutStudents} 
                      onChange={(e) => setFiltreStatutStudents(e.target.value)} 
                      className="students-filter-select"
                    >
                      <option value="tous">Tous les statuts</option>
                      <option value="actifs">Actifs</option>
                      <option value="inactifs">Inactifs</option>
                      <option value="payes">Payés</option>
                      <option value="non-payes">Non payés</option>
                    </select>

                    <button 
                      onClick={() => {
                        setSearchTermStudents('');
                        setFiltreGenreStudents('tous');
                        setFiltreStatutStudents('tous');
                      }}
                      className="reset-students-filters-btn"
                    >
                      <RefreshCw size={16} />
                      Réinitialiser
                    </button>
                  </div>
                </div>
                
                <div className="tableau-container">
                  <table className="tableau-etudiants">
                    <thead>
                      <tr>
                        <th>Nom Complet</th>
                        <th>Genre</th>
                        <th>Date de Naissance</th>
                        <th>Âge</th>
                        <th>Téléphone</th>
                        <th>Email</th>
                        <th>Filière</th>
                        <th>Niveau</th>
                        <th>Statut</th>
                        <th>Image</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {etudiantsFiltered.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="aucun-resultat">
                            Aucun étudiant trouvé
                          </td>
                        </tr>
                      ) : (
                        etudiantsFiltered.map((e) => (
                          <tr key={e._id}>
                            <td className="nom-colonne">{e.prenom} {e.nomDeFamille}</td>
                            <td>{e.genre || 'N/A'}</td>
                            <td>{formatDate(e.dateNaissance)}</td>
                            <td>{calculerAge(e.dateNaissance)} ans</td>
                            <td>{e.telephone || 'N/A'}</td>
                            <td>{e.email || 'N/A'}</td>
                            <td className="filiere-colonne">{e.filiere || 'N/A'}</td>
                            <td className="niveau-colonne">{e.niveauFormation || e.cycle || 'N/A'}</td>
                            <td className="statut-colonne">
                              <span className={`statut-text ${e.actif ? 'actif' : 'inactif'}`}>
                                {e.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="image-colonne">
                              {e.image ? (
                                <img
                                  src={`http://localhost:5000${e.image}`}
                                  alt="etudiant"
                                  className="image-etudiant"
                                />
                              ) : (
                                <div className="pas-image">N/A</div>
                              )}
                            </td>
                            <td className="actions-colonne">
                              <button
                                onClick={() => handleViewStudent(e)}
                                className="btn-voir"
                              >
                                Voir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'professors' && (
            <>
              <div className="section">
                <h2 className="section-title">
                  <UserCog size={24} />
                  Liste des Professeurs ({professeursFiltered.length})
                </h2>
                
                {/* Filtres spécifiques aux professeurs */}
                <div className="professors-filters">
                  <div className="professors-filters-row">
                    <div className="search-input-container">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, email, téléphone, matière..."
                        value={searchTermProfs}
                        onChange={(e) => setSearchTermProfs(e.target.value)}
                        className="professors-search-input"
                      />
                      {searchTermProfs && (
                        <button onClick={() => setSearchTermProfs('')} className="clear-search-btn">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                    <select 
                      value={filtreMatiereProfs} 
                      onChange={(e) => setFiltreMatiereProfs(e.target.value)} 
                      className="professors-filter-select"
                    >
                      <option value="toutes">Toutes les matières</option>
                      {matieresDisponibles.map(matiere => (
                        <option key={matiere} value={matiere}>{matiere}</option>
                      ))}
                    </select>

                    <button 
                      onClick={() => {
                        setSearchTermProfs('');
                        setFiltreMatiereProfs('toutes');
                      }}
                      className="reset-professors-filters-btn"
                    >
                      <RefreshCw size={16} />
                      Réinitialiser
                    </button>
                  </div>
                </div>
                
                <div className="professors-list">
                  {professeursFiltered.length === 0 ? (
                    <div className="no-professors">
                      <UserCog size={48} color="#94a3b8" />
                      <h3>Aucun professeur trouvé</h3>
                      <p>Aucun professeur ne correspond aux critères de recherche.</p>
                    </div>
                  ) : (
                    <div className="professors-grid">
                      {professeursFiltered.map((prof, index) => (
                        <div key={index} className="professor-card">
                          <div className="professor-header">
                            <div className="professor-avatar">
                              <UserCog size={24} />
                            </div>
                            <div className="professor-info">
                              <h3 className="professor-name">{prof.nom}</h3>
                              {prof.matiere && (
                                <span className="professor-subject">{prof.matiere}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="professor-details">
                            {prof.email && (
                              <div className="professor-contact">
                                <Mail size={16} />
                                <span>{prof.email}</span>
                              </div>
                            )}
                            {prof.telephone && (
                              <div className="professor-contact">
                                <Phone size={16} />
                                <span>{prof.telephone}</span>
                              </div>
                            )}
                          </div>
                          
                          {prof.cours && prof.cours.length > 0 && (
                            <div className="professor-courses">
                              <h4>Cours enseignés:</h4>
                              <div className="courses-list">
                                {prof.cours.map((cours, idx) => (
                                  <span key={idx} className="course-badge">{cours}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Professeurs par filière section déplacée ici */}
                <div className="section-separator">
                  <h2 className="section-title">
                    <Building size={24} />
                    Professeurs par Filière et Types de Formation
                  </h2>
                  
                  <div className="professeurs-grid">
                    {professeursParsFiliere.map((filiere, index) => (
                      <div key={index} className="professeur-card">
                        <div className="professeur-header">
                          <h3>{filiere.filiere}</h3>
                          <div className="professeur-badges">
                            <span className="badge blue">{filiere.etudiants} étudiants</span>
                            <span className="badge green">{filiere.nbProfesseurs} prof(s)</span>
                          </div>
                        </div>
                        
                        <div className="types-formation">
                          <h4>Types de Formation :</h4>
                          <div className="types-list">
                            {filiere.typeFormations.map((type, idx) => (
                              <span key={idx} className="type-badge">{type}</span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="professeurs-list">
                          <h4>Professeurs :</h4>
                          {filiere.professeurs.length > 0 ? (
                            <ul>
                              {filiere.professeurs.map((prof, idx) => (
                                <li key={idx} className="professeur-item">
                                  <UserCog size={16} />
                                  {prof}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-professor">Aucun professeur assigné</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Modal pour les détails d'un étudiant */}
      {showStudentModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="student-modal-header">
              <h2>
                <User size={24} />
                Détails de l'étudiant
              </h2>
              <button 
                onClick={() => setShowStudentModal(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="student-modal-content">
              <div className="student-info-grid">
                {/* Informations personnelles */}
                <div className="student-info-section">
                  <h3>
                    <IdCard size={20} />
                    Informations Personnelles
                  </h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Nom complet:</label>
                      <span>{selectedStudent.prenom} {selectedStudent.nomDeFamille}</span>
                    </div>
                    <div className="info-item">
                      <label>CIN:</label>
                      <span>{selectedStudent.cin || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Code étudiant:</label>
                      <span>{selectedStudent.codeEtudiant || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Genre:</label>
                      <span>{selectedStudent.genre || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Date de naissance:</label>
                      <span>{formatDate(selectedStudent.dateNaissance)}</span>
                    </div>
                    <div className="info-item">
                      <label>Âge:</label>
                      <span>{calculerAge(selectedStudent.dateNaissance)} ans</span>
                    </div>
                    <div className="info-item">
                      <label>Téléphone:</label>
                      <span>{selectedStudent.telephone || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{selectedStudent.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Informations académiques */}
                <div className="student-info-section">
                  <h3>
                    <GraduationCap size={20} />
                    Informations Académiques
                  </h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Filière:</label>
                      <span>{selectedStudent.filiere || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Niveau:</label>
                      <span>{selectedStudent.niveau || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Cycle:</label>
                      <span>{selectedStudent.cycle || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Niveau formation:</label>
                      <span>{selectedStudent.niveauFormation || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Spécialité:</label>
                      <span>
                        {selectedStudent.specialiteIngenieur || 
                         selectedStudent.specialiteLicencePro || 
                         selectedStudent.specialiteMasterPro || 
                         selectedStudent.specialite || 'Tronc commun'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Année scolaire:</label>
                      <span>{selectedStudent.anneeScolaire || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Professeur:</label>
                      <span>{selectedStudent.professeur || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Informations financières */}
                <div className="student-info-section">
                  <h3>
                    <DollarSign size={20} />
                    Informations Financières
                  </h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Prix total:</label>
                      <span className="price-value">{formatMoney(selectedStudent.prixTotal)}</span>
                    </div>
                    <div className="info-item">
                      <label>Statut paiement:</label>
                      <span className={`payment-status ${selectedStudent.paye ? 'paid' : 'unpaid'}`}>
                        {selectedStudent.paye ? (
                          <>
                            <CheckCircle size={16} />
                            Payé
                          </>
                        ) : (
                          <>
                            <XCircle size={16} />
                            Non payé
                          </>
                        )}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Statut inscription:</label>
                      <span className={`status ${selectedStudent.actif ? 'active' : 'inactive'}`}>
                        {selectedStudent.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Nouvelle inscription:</label>
                      <span>{selectedStudent.nouvelleInscription ? 'Oui' : 'Non'}</span>
                    </div>
                  </div>
                </div>

                {/* Photo de l'étudiant */}
                {selectedStudent.image && (
                  <div className="student-info-section">
                    <h3>
                      <Eye size={20} />
                      Photo
                    </h3>
                    <div className="student-photo">
                      <img
                        src={`http://localhost:5000${selectedStudent.image}`}
                        alt="Photo étudiant"
                        className="modal-student-image"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS */}
      <style jsx>{`
        .enhanced-dashboard {
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
          position: relative;
        }

        .header-toggle-btn {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1000;
          background: white;
          border: 2px solid #667eea;
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          color: #667eea;
        }

        .header-toggle-btn:hover {
          background: #667eea;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .header-toggle-btn:active {
          transform: translateY(0);
        }

        .loading-container, .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .loading-content, .error-content {
          text-align: center;
          padding: 2rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text, .error-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .error-title {
          color: #dc2626;
        }

        .loading-subtext, .error-message {
          color: #64748b;
          margin-bottom: 1rem;
        }

        .btn-retry {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin: 0 auto;
        }

        .btn-retry:hover {
          background: #5a6fd8;
          transform: translateY(-1px);
        }

        .dashboard-header-center {
          text-align: center;
          padding-top: 1.5rem;
          padding-bottom: 1.5rem;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .header-content-center {
          flex-direction: column;
          align-items: center;
          justify-content: center;
          display: flex;
          width: 100%;
        }

        .header-info-center {
          text-align: center;
          color: white;
          width: 100%;
        }

        .header-info-center h1 {
          color: white;
          font-weight: bold;
          font-size: 2rem;
          margin-bottom: 1rem;
          justify-content: center;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }

        .header-stats-center {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          color: white;
          width: 100%;
          margin-bottom: 1rem;
        }

        .header-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .filters-active-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fef3c7;
        }

        .reset-filters-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 0.25rem;
          border-radius: 0.25rem;
          cursor: pointer;
          display:
          left: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .clear-search-btn {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .clear-search-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .filters-container {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .filter-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 0.875rem;
          cursor: pointer;
          min-width: 140px;
        }

        .filter-select option {
          background: #374151;
          color: white;
        }

        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .btn-refresh:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .tabs-navigation {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          gap: 0.5rem;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          overflow-x: auto;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap:  0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
        }

        .tab-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
          background: #f8fafc;
        }

        .tab-btn:hover {
          color: #667eea;
          background: #f8fafc;
        }

        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .filters-container {
            flex-direction: column;
          }
          
          .filter-select {
            min-width: 200px;
          }
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          opacity: 0.1;
          transform: translate(30px, -30px);
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.15);
        }

        .stat-card.blue { 
          border-left-color: #2563eb; 
        }
        .stat-card.blue::before { background: #2563eb; }

        .stat-card.green { 
          border-left-color: #059669; 
        }
        .stat-card.green::before { background: #059669; }

        .stat-card.purple { 
          border-left-color: #667eea; 
        }
        .stat-card.purple::before { background: #667eea; }

        .stat-card.orange { 
          border-left-color: #ea580c; 
        }
        .stat-card.orange::before { background: #ea580c; }

        .stat-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          z-index: 1;
        }

        .stat-card.blue .stat-icon { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
        .stat-card.green .stat-icon { background: linear-gradient(135deg, #059669, #047857); }
        .stat-card.purple .stat-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
        .stat-card.orange .stat-icon { background: linear-gradient(135deg, #ea580c, #dc2626); }

        .stat-content {
          flex: 1;
          z-index: 1;
          position: relative;
        }

        .stat-content h3 {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
          line-height: 1.2;
        }

        .stat-content p {
          color: #64748b;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .stat-detail {
          font-size: 0.875rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .filtered-indicator {
          font-size: 0.875rem;
          color: #ea580c;
          font-weight: 500;
          background: #fef3c7;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          margin-left: 0.5rem;
        }

        .charts-section {
          margin-top: 2rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          background: white;
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
        }

        .chart-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #94a3b8;
          font-weight: 500;
        }

        .table-container {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
          overflow-x: auto;
        }

        .analysis-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .analysis-table th {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
          border-bottom: 2px solid #e5e7eb;
          white-space: nowrap;
        }

        .analysis-table td {
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .analysis-table tbody tr:hover {
          background: #f8fafc;
        }

        .no-data-table {
          text-align: center;
          padding: 3rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .niveau-name,
        .specialite-name,
        .annee-name {
          font-weight: 600;
          color: #1e293b;
        }

        .specialite-name {
          cursor: help;
        }

        .badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          text-align: center;
          min-width: 2.5rem;
        }

        .badge.blue { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
        .badge.green { background: linear-gradient(135deg, #059669, #047857); }

        .money {
          font-weight: 600;
          color: #1e293b;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
        }

        .rate {
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .rate.good {
          background: #dcfce7;
          color: #166534;
        }

        .rate.warning {
          background: #fef3c7;
          color: #92400e;
        }

        /* Cours & Professeurs Styles */
        .cours-professeurs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 640px) {
          .cours-professeurs-grid {
            grid-template-columns: 1fr;
          }
        }

        .cours-card {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
          transition: all 0.3s;
        }

        .cours-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .cours-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .cours-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          flex: 1;
        }

        .cours-stats-badges {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .stat-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          text-align: center;
          white-space: nowrap;
        }

        .stat-badge.blue { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
        .stat-badge.green { background: linear-gradient(135deg, #059669, #047857); }

        .cours-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cours-financial {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .financial-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .financial-item .label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .financial-item .value {
          font-weight: 600;
          color: #1e293b;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }

        .professeurs-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
        }

        .professeurs-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.75rem 0;
        }

        .professeurs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .professeur-item {
          background: #f8fafc;
          border-radius: 0.5rem;
          padding: 1rem;
          border: 1px solid #e2e8f0;
        }

        .professeur-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .professeur-nom {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.9rem;
        }

        .professeur-email,
        .professeur-tel {
          font-size: 0.75rem;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .professeur-matiere {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #7c3aed;
          font-style: italic;
        }

        .cours-meta {
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
        }

        .creation-date {
          font-size: 0.75rem;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .no-data-courses {
          text-align: center;
          padding: 3rem;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .no-data-courses h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .no-data-courses p {
          font-size: 0.9rem;
          color: #94a3b8;
          max-width: 400px;
          line-height: 1.5;
          margin: 0;
        }

        /* Tableau des étudiants */
        .tableau-container {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
          overflow-x: auto;
        }

        .tableau-etudiants {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
        }

        .tableau-etudiants th {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
          border-bottom: 2px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 10;
          white-space: nowrap;
        }

        .tableau-etudiants td {
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .tableau-etudiants tbody tr:hover {
          background: #f8fafc;
        }

        .image-etudiant {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e5e7eb;
        }

        .pas-image {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: #64748b;
          border: 2px solid #e5e7eb;
        }

        .statut-text.actif {
          color: #059669;
          font-weight: 600;
        }

        .statut-text.inactif {
          color: #dc2626;
          font-weight: 600;
        }

        .btn-voir {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-voir:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .aucun-resultat {
          text-align: center;
          color: #64748b;
          font-style: italic;
          padding: 2rem;
        }

        .nom-colonne {
          font-weight: 600;
          color: #1e293b;
        }

        .filiere-colonne {
          font-weight: 500;
          color: #667eea;
        }

        .niveau-colonne {
          font-weight: 500;
          color: #059669;
        }

        /* Grille des professeurs */
        .professeurs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 640px) {
          .professeurs-grid {
            grid-template-columns: 1fr;
          }
        }

        .professeur-card {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
          transition: all 0.3s;
        }

        .professeur-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .professeur-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .professeur-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .professeur-info {
          flex: 1;
        }

        .professeur-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
          line-height: 1.3;
        }

        .professeur-subject {
          font-size: 0.875rem;
          color: #667eea;
          font-weight: 500;
          background: #eff6ff;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          display: inline-block;
        }

        .professor-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .professor-contact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .professor-courses h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.5rem 0;
        }

        .courses-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .course-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .section-separator {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #f1f5f9;
        }

        /* Student Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .student-modal {
          background: white;
          border-radius: 1rem;
          max-width: 800px;
          width: 100%;
          padding: 2rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          overflow-y: auto;
          max-height: 90vh;
        }

        .student-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .student-modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .student-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .student-info-section {
          background: #f8fafc;
          border-radius: 0.75rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .student-info-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .info-grid {
          display: grid;
          gap: 0.75rem;
        }

        .info-item {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          align-items: center;
        }

        .info-item label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
        }

        .info-item span {
          font-size: 0.875rem;
          color: #1e293b;
          font-weight: 500;
        }

        .price-value {
          font-weight: 600;
          color: #059669;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }

        .payment-status {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
        }

        .payment-status.paid {
          color: #059669;
        }

        .payment-status.unpaid {
          color: #dc2626;
        }

        .status.active {
          color: #059669;
          font-weight: 600;
        }

        .status.inactive {
          color: #dc2626;
          font-weight: 600;
        }

        .student-photo {
          text-align: center;
        }

        .modal-student-image {
          max-width: 200px;
          max-height: 200px;
          border-radius: 0.75rem;
          object-fit: cover;
          border: 3px solid #e2e8f0;
        }
/* ===========================================
   STYLES CSS MANQUANTS POUR LE DASHBOARD
   =========================================== */

/* 1. FILTRES SPÉCIFIQUES AUX ÉTUDIANTS */
.students-filters {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  margin-bottom: 2rem;
}

.students-filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.students-search-input {
  width: 100%;
  min-width: 300px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #1f2937;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}

.students-search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.students-filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  color: #1f2937;
  font-size: 0.875rem;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.2s;
}

.students-filter-select:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.reset-students-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.reset-students-filters-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

/* 2. FILTRES SPÉCIFIQUES AUX PROFESSEURS */
.professors-filters {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  margin-bottom: 2rem;
}

.professors-filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.professors-search-input {
  width: 100%;
  min-width: 300px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #1f2937;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}

.professors-search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.professors-filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  color: #1f2937;
  font-size: 0.875rem;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.2s;
}

.professors-filter-select:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.reset-professors-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.reset-professors-filters-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

/* 3. LISTE DES PROFESSEURS */
.professors-list {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

.no-professors {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  gap: 1rem;
}

.no-professors h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.no-professors p {
  font-size: 0.875rem;
  color: #94a3b8;
  max-width: 400px;
  line-height: 1.5;
  margin: 0;
}

.professors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.professor-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

.professor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-color: #e2e8f0;
}

.professor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.professor-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.professor-info {
  flex: 1;
  min-width: 0;
}

.professor-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
  word-break: break-word;
}

.professor-subject {
  font-size: 0.875rem;
  color: #667eea;
  font-weight: 500;
  background: #eff6ff;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.professor-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.professor-contact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
  word-break: break-all;
}

.professor-courses {
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}

.professor-courses h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.courses-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.course-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #e5e7eb;
}

/* 4. TYPES DE FORMATION */
.formation-types-section {
  margin: 2rem 0;
}

.formation-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.formation-type-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.formation-type-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: var(--formation-color, #2563eb);
  opacity: 0.05;
  border-radius: 50%;
  transform: translate(30px, -30px);
}

.formation-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.formation-type-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.formation-type-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.formation-type-info {
  flex: 1;
}

.formation-type-info h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.formation-type-code {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  background: #f8fafc;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.formation-type-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.formation-stat {
  text-align: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #f1f5f9;
}

.formation-stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.formation-stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.formation-ca {
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}

.formation-ca-label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.formation-ca-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

/* 5. RESPONSIVE DESIGN AMÉLIORÉ */
@media (max-width: 1024px) {
  .students-filters-row,
  .professors-filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .students-search-input,
  .professors-search-input {
    min-width: 100%;
  }
  
  .formation-types-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  .formation-type-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .students-filters,
  .professors-filters {
    padding: 1rem;
  }
  
  .professors-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  
  .formation-types-grid {
    grid-template-columns: 1fr;
  }
  
  .formation-type-stats {
    grid-template-columns: 1fr;
  }
  
  .formation-stat {
    padding: 0.75rem;
  }
  
  .professor-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .professor-info {
    text-align: center;
  }
  
  .courses-list {
    justify-content: center;
  }
}

/* 6. ANIMATIONS SUPPLÉMENTAIRES */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.students-filters,
.professors-filters,
.formation-type-card,
.professor-card {
  animation: slideIn 0.3s ease-out;
}

/* 7. ÉTATS DE FOCUS AMÉLIORÉS */
.students-filter-select:focus,
.professors-filter-select:focus {
  transform: translateY(-1px);
}

.reset-students-filters-btn:focus,
.reset-professors-filters-btn:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* 8. AMÉLIORATION DES COULEURS DE STATUT */
.professor-contact svg {
  color: #667eea;
}

.formation-type-card:hover .formation-type-icon {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}

/* 9. SCROLLBAR PERSONNALISÉE */
.professors-list::-webkit-scrollbar,
.students-filters::-webkit-scrollbar {
  width: 6px;
}

.professors-list::-webkit-scrollbar-track,
.students-filters::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.professors-list::-webkit-scrollbar-thumb,
.students-filters::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.professors-list::-webkit-scrollbar-thumb:hover,
.students-filters::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 10. STYLE POUR LES LISTES VIDES */
.no-professors,
.no-data-courses {
  transition: all 0.3s ease;
}

.no-professors:hover,
.no-data-courses:hover {
  transform: translateY(-2px);
}
        /* CSS pour le badge général */
        .general-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-left: 1rem;
          box-shadow: 0 2px 4px rgba(147, 51, 234, 0.3);
          animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .general-badge:hover {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default PedagogiqueDashboard;