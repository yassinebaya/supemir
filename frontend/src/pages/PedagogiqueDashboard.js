import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح

import {
  Users, GraduationCap, CreditCard, TrendingUp, Award, UserCheck,
  Calendar, Target, BarChart3, PieChart as PieChartIcon,
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
// Update COLORS to include more variety while keeping simple
const COLORS = ['#3b82f6', '#10b981', '#6b7280', '#1d4ed8', '#059669', '#4b5563'];

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
  const [filtreCoursProfs, setFiltreCoursProfs] = useState('tous');

  // Pour le modal de détails
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Ajouter le filtre par cours pour les étudiants
  const [filtreCoursStudents, setFiltreCoursStudents] = useState('tous');

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
        fetch('http://195.179.229.230:5000/api/pedagogique/etudiants', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://195.179.229.230:5000/api/pedagogique/cours', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://195.179.229.230:5000/api/pedagogique/professeurs', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://195.179.229.230:5000/api/pedagogique/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://195.179.229.230:5000/api/pedagogique/cours-detailles', {
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

    // NOUVEAU : Filtre par cours
    if (filtreCoursStudents !== 'tous') {
      filtered = filtered.filter(e => 
        e.cours && Array.isArray(e.cours) && e.cours.includes(filtreCoursStudents)
      );
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

    // NOUVEAU : Filtre par cours
    if (filtreCoursProfs !== 'tous') {
      filtered = filtered.filter(p => {
        // Vérifier dans coursEnseignes
        if (p.coursEnseignes && Array.isArray(p.coursEnseignes)) {
          return p.coursEnseignes.some(enseignement => 
            enseignement.nomCours === filtreCoursProfs
          );
        }
        // Vérifier dans cours (ancien système)
        if (p.cours && Array.isArray(p.cours)) {
          return p.cours.includes(filtreCoursProfs);
        }
        return false;
      });
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
      let typeFormation = e.typeFormation || 'Non défini';
      
      // Déterminer la spécialité selon le type de formation
      if (e.typeFormation === 'CYCLE_INGENIEUR' && e.specialiteIngenieur) {
        specialite = e.specialiteIngenieur;
      } else if (e.typeFormation === 'LICENCE_PRO' && e.specialiteLicencePro) {
        specialite = e.specialiteLicencePro;
      } else if (e.typeFormation === 'MASTER_PRO' && e.specialiteMasterPro) {
        specialite = e.specialiteMasterPro;
      } else if ((e.typeFormation === 'MASI' || e.typeFormation === 'IRM') && e.specialite) {
        specialite = e.specialite;
      }
      
      // Créer une clé unique combinant typeFormation et spécialité
      const cleUnique = `${typeFormation}|${specialite}`;
      
      if (!specialitesStats[cleUnique]) {
        specialitesStats[cleUnique] = { 
          typeFormation,
          specialite,
          specialiteComplete: specialite,
          total: 0, 
          payes: 0, 
          ca: 0 
        };
      }
      
      specialitesStats[cleUnique].total += 1;
      if (e.paye) specialitesStats[cleUnique].payes += 1;
      specialitesStats[cleUnique].ca += parseFloat(e.prixTotal) || 0;
    });

    return Object.values(specialitesStats).map(data => ({
      ...data,
      specialite: data.specialite.length > 40 ? data.specialite.substring(0, 40) + '...' : data.specialite,
      tauxReussite: data.total > 0 ? ((data.payes / data.total) * 100).toFixed(1) : 0
    })).sort((a, b) => {
      // Trier d'abord par typeFormation, puis par total
      if (a.typeFormation !== b.typeFormation) {
        return a.typeFormation.localeCompare(b.typeFormation);
      }
      return b.total - a.total;
    });
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
  
  // NOUVEAU : Obtenir les cours disponibles séparément pour étudiants et professeurs
  const coursDisponiblesEtudiants = [...new Set(
    etudiants.flatMap(e => e.cours || [])
  )].filter(Boolean).sort();

  const coursDisponiblesProfesseurs = [...new Set([
    // Cours des professeurs (nouveau système)
    ...professeurs.flatMap(p => 
      p.coursEnseignes ? p.coursEnseignes.map(ens => ens.nomCours) : []
    ),
    // Cours des professeurs (ancien système)
    ...professeurs.flatMap(p => p.cours || [])
  ])].filter(Boolean).sort();

  // Log de débogage pour vérifier les cours
  console.log('Cours disponibles étudiants:', coursDisponiblesEtudiants);
  console.log('Cours disponibles professeurs:', coursDisponiblesProfesseurs);
  console.log('Exemple étudiant cours:', etudiants[0]?.cours);

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

      {/* Header simplifié */}
      {headerVisible && (
        <header className="simple-header">
          <div className="header-container">
            <h1>Dashboard Pédagogique - {userInfo?.filiere === 'GENERAL' ? 'GÉNÉRAL' : userInfo?.filiere || stats?.filiere}</h1>
            <div className="header-stats">
              <span>{statsGenerales.totalEtudiants} étudiants</span>
              <span>{cours.length} cours</span>
              <span>{professeurs.length} professeurs</span>
              <span>{formatMoney(statsGenerales.chiffreAffaireTotal)}</span>
              <span>{statsGenerales.tauxPaiement.toFixed(1)}% payé</span>
            </div>
            
            {/* Filtres simplifiés */}
            <div className="simple-filters">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="simple-search"
              />
              
              <select 
                value={filtreAnneeScolaire} 
                onChange={(e) => setFiltreAnneeScolaire(e.target.value)} 
                className="simple-select"
              >
                <option value="toutes">Toutes les années</option>
                {anneesDisponibles.map(annee => (
                  <option key={annee} value={annee}>{annee}</option>
                ))}
              </select>

              <select 
                value={filtreNiveau} 
                onChange={(e) => setFiltreNiveau(e.target.value)} 
                className="simple-select"
              >
                <option value="tous">Tous niveaux</option>
                {niveauxDisponibles.map(niveau => (
                  <option key={niveau} value={niveau}>Niveau {niveau}</option>
                ))}
              </select>

              <button onClick={resetFilters} className="simple-btn">
                Réinitialiser
              </button>
            </div>

            {/* Indicateur simple */}
            {(filtreAnneeScolaire !== 'toutes' || filtreNiveau !== 'tous' || filtreSpecialite !== 'toutes' || searchTerm) && (
              <div className="simple-indicator">
                {etudiantsFiltres.length} résultats trouvés
              </div>
            )}
          </div>
        </header>
      )}

      {/* Navigation simplifiée */}
      <div className="simple-tabs">
        <button 
          className={`simple-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button 
          className={`simple-tab-btn ${activeTab === 'niveaux' ? 'active' : ''}`}
          onClick={() => setActiveTab('niveaux')}
        >
          Par Niveau
        </button>
        <button 
          className={`simple-tab-btn ${activeTab === 'specialites' ? 'active' : ''}`}
          onClick={() => setActiveTab('specialites')}
        >
          Par Spécialité
        </button>
        <button 
          className={`simple-tab-btn ${activeTab === 'annees' ? 'active' : ''}`}
          onClick={() => setActiveTab('annees')}
        >
          Par Année
        </button>
        <button 
          className={`simple-tab-btn ${activeTab === 'cours-profs' ? 'active' : ''}`}
          onClick={() => setActiveTab('cours-profs')}
        >
          Cours & Professeurs
        </button>
        <button 
          className={`simple-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Étudiants
        </button>
        <button 
          className={`simple-tab-btn ${activeTab === 'professors' ? 'active' : ''}`}
          onClick={() => setActiveTab('professors')}
        >
          Professeurs
        </button>
      </div>

      <div className="simple-container">
        {/* Statistiques simplifiées */}
        <div className="simple-stats-grid">
          <div className="simple-stat-card">
            <h3>{statsGeneralesFiltered.totalEtudiants}</h3>
            <p>Étudiants</p>
          </div>

          <div className="simple-stat-card">
            <h3>{formatMoney(statsGeneralesFiltered.chiffreAffaireTotal)}</h3>
            <p>Chiffre d'affaires</p>
          </div>

          <div className="simple-stat-card">
            <h3>{statsGeneralesFiltered.tauxPaiement.toFixed(1)}%</h3>
            <p>Taux de paiement</p>
          </div>

          <div className="simple-stat-card">
            <h3>{formatMoney(statsGeneralesFiltered.moyennePrixFormation)}</h3>
            <p>Prix moyen</p>
          </div>
        </div>

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
                        <th>Type Formation</th>
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
                          <td className="type-formation-badge">
                            <span className={`formation-badge ${spec.typeFormation?.toLowerCase()}`}>
                              {spec.typeFormation}
                            </span>
                          </td>
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

                    {/* NOUVEAU : Filtre par cours pour les étudiants - UNIQUEMENT leurs cours */}
                    <select 
                      value={filtreCoursStudents} 
                      onChange={(e) => setFiltreCoursStudents(e.target.value)} 
                      className="students-filter-select"
                    >
                      <option value="tous">Tous les cours</option>
                      {coursDisponiblesEtudiants.map(cours => (
                        <option key={cours} value={cours}>
                          {cours.length > 30 ? cours.substring(0, 30) + '...' : cours}
                        </option>
                      ))}
                    </select>

                    <button 
                      onClick={() => {
                        setSearchTermStudents('');
                        setFiltreGenreStudents('tous');
                        setFiltreStatutStudents('tous');
                        setFiltreCoursStudents('tous');
                      }}
                      className="reset-students-filters-btn"
                    >
                      <RefreshCw size={16} />
                      Réinitialiser
                    </button>
                  </div>
                </div>
                
                <div className="tableau-container">
                  <div className="table-scroll-wrapper">
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
                                    src={`http://195.179.229.230:5000${e.image}`}
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

                    {/* NOUVEAU : Filtre par cours pour les professeurs - UNIQUEMENT leurs cours */}
                    <select 
                      value={filtreCoursProfs} 
                      onChange={(e) => setFiltreCoursProfs(e.target.value)} 
                      className="professors-filter-select"
                    >
                      <option value="tous">Tous les cours</option>
                      {coursDisponiblesProfesseurs.map(cours => (
                        <option key={cours} value={cours}>
                          {cours.length > 30 ? cours.substring(0, 30) + '...' : cours}
                        </option>
                      ))}
                    </select>

                    <button 
                      onClick={() => {
                        setSearchTermProfs('');
                        setFiltreMatiereProfs('toutes');
                        setFiltreCoursProfs('tous');
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
                    <TrendingUp size={20} />
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
                        src={`http://195.179.229.230:5000${selectedStudent.image}`}
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

      {/* Styles CSS ultra simplifiés avec nouvelles couleurs */}
      <style jsx>{`
        .enhanced-dashboard {
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1f2937;
        }

        /* HEADER AVEC NOUVELLES COULEURS */
        .simple-header {
          background: white;
          border-bottom: 3px solid #3b82f6;
          padding: 1.5rem 0;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .simple-header h1 {
          font-size: 1.75rem;
          color: #1f2937;
          margin: 0 0 1rem 0;
          font-weight: 700;
          text-align: center;
        }

        .header-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          font-size: 0.875rem;
          color: #1f2937;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          font-weight: 600;
        }

        .header-stats span {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .simple-filters {
          display: flex;
          justify-content: center;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .simple-search {
          padding: 0.75rem;
          border: 2px solid #10b981;
          border-radius: 8px;
          font-size: 0.875rem;
          min-width: 250px;
          outline: none;
          color: #1f2937;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .simple-search:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .simple-select {
          padding: 0.75rem;
          border: 2px solid #6b7280;
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
          color: #1f2937;
          min-width: 150px;
          outline: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .simple-select:focus {
          border-color: #4b5563;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .simple-btn {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .simple-btn:hover {
          background: linear-gradient(135deg, #4b5563, #374151);
          transform: translateY(-1px);
        }

        .simple-indicator {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          font-size: 0.875rem;
          text-align: center;
          margin-top: 1rem;
          font-weight: 600;
        }

        /* NAVIGATION AVEC NOUVELLES COULEURS */
        .simple-tabs {
          background: white;
          border-bottom: 3px solid #10b981;
          padding: 0;
          max-width: 1200px;
          margin: 0 auto;
          overflow-x: auto;
          display: flex;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
        }

        .simple-tab-btn {
          padding: 1rem 1.5rem;
          border: none;
          background: white;
          color: #6b7280;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          white-space: nowrap;
          transition: all 0.3s ease;
        }

        .simple-tab-btn.active {
          color: #10b981;
          border-bottom-color: #10b981;
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
        }

        .simple-tab-btn:hover {
          color: #059669;
          background: #f0fdf4;
        }

        /* CONTAINER PRINCIPAL */
        .simple-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%) !important;

        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
        }
/* FORMATION TYPES SECTION - COMPLET */
        .formation-types-section {
          margin-bottom: 3rem;
        }

        .formation-types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          padding: 1.5rem;
        }

        .formation-type-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 2px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .formation-type-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #3b82f6, #10b981);
          transition: all 0.3s ease;
        }

        .formation-type-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
          border-color: #10b981;
        }

        .formation-type-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .formation-type-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .formation-type-info h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .formation-type-code {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
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
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .formation-stat:hover {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border-color: #10b981;
          transform: scale(1.05);
        }

        .formation-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 0.25rem;
        }

        .formation-stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .formation-ca {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 1rem;
          border-radius: 12px;
          text-align: center;
        }

        .formation-ca-label {
          display: block;
          font-size: 0.75rem;
          opacity: 0.9;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .formation-ca-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        /* COURS CARDS - COMPLET */
        .cours-professeurs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          padding: 1.5rem;
        }

        .cours-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 2px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .cours-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #3b82f6, #10b981);
        }

        .cours-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
          border-color: #10b981;
        }

        .cours-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .cours-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .cours-stats-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .stat-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .cours-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .cours-financial {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .cours-financial:hover {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border-color: #10b981;
        }

        .financial-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .financial-item:last-child {
          margin-bottom: 0;
        }

        .financial-item .label {
          font-weight: 600;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .financial-item .value {
          font-weight: 700;
          color: #10b981;
          font-size: 1rem;
        }

        .professeurs-section {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #10b981;
          transition: all 0.3s ease;
        }

        .professeurs-section:hover {
          border-color: #059669;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }

        .professeurs-title {
          font-size: 1rem;
          font-weight: 700;
          color: #10b981;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .professeurs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .professeur-item {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          transition: all 0.3s ease;
        }

        .professeur-item:hover {
          border-color: #10b981;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
          transform: translateX(4px);
        }

        .professeur-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .professeur-nom {
          font-weight: 700;
          color: #1f2937;
          font-size: 1rem;
        }

        .professeur-email,
        .professeur-tel {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .professeur-matiere {
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 600;
          background: #f0fdf4;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          display: inline-block;
          margin-top: 0.5rem;
        }

        .cours-meta {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .creation-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .no-data-courses {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .no-data-courses h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: #374151;
        }

        .no-data-courses p {
          font-size: 1rem;
          margin: 0;
          max-width: 500px;
        }

        /* PROFESSOR CARDS - COMPLET */
        .professors-list {
          padding: 1.5rem;
        }

        .professors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .professor-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 2px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .professor-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .professor-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
        }

        .professor-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .professor-info {
          flex: 1;
        }

        .professor-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .professor-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .professor-contact {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .professor-contact:hover {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border-color: #3b82f6;
          transform: translateX(4px);
        }

        .professor-contact span {
          font-size: 0.875rem;
          color: #1f2937;
          font-weight: 500;
        }

        .professor-courses {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #3b82f6;
        }

        .professor-courses h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #3b82f6;
          margin: 0 0 1rem 0;
        }

        .courses-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .no-professors {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .no-professors h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: #374151;
        }

        .no-professors p {
          font-size: 1rem;
          margin: 0;
          max-width: 500px;
        }

        /* MODAL COMPLET */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .student-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          padding: 2rem;
        }

        .student-modal-content {
          max-height: calc(90vh - 80px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #10b981 #f3f4f6;
        }

        .student-modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .student-modal-content::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .student-modal-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 4px;
        }

        .student-photo {
          text-align: center;
          padding: 1rem;
        }

        .payment-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
        }

        /* TYPE FORMATION BADGES COULEURS SPÉCIFIQUES */
        .formation-badge.cycle_ingenieur {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .formation-badge.licence_pro {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .formation-badge.master_pro {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .formation-badge.masi {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }

        .formation-badge.irm {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .type-formation-badge {
          text-align: center;
        }

        /* STATS PRINCIPALES OVERVIEW */
        .stats-section {
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #3b82f6, #10b981);
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1rem auto;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-card.green .stat-icon {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .stat-card.purple .stat-icon {
          background: linear-gradient(135deg, #6b7280, #4b5563);
        }

        .stat-card.orange .stat-icon {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .stat-content h3 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .stat-content p {
          font-size: 1rem;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 0.5rem 0;
        }

        .stat-detail {
          font-size: 0.875rem;
          color: #9ca3af;
          font-weight: 500;
        }

        /* TABS NAVIGATION CACHÉE */
        .tabs-navigation {
          display: none;
        }

        /* RESPONSIVE POUR LES NOUVELLES CARTES */
        @media (max-width: 768px) {
          .formation-types-grid,
          .professors-grid,
          .cours-professeurs-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
          }

          .formation-type-stats {
            grid-template-columns: 1fr;
          }

          .student-info-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
          }

          .cours-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .cours-stats-badges {
            align-self: stretch;
          }

          .simple-container {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .formation-type-card,
          .professor-card,
          .cours-card {
            padding: 1rem;
          }

          .formation-type-header {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }

          .formation-type-icon {
            width: 3rem;
            height: 3rem;
          }

          .stat-card {
            padding: 1.5rem;
          }

          .stat-icon {
            width: 3rem;
            height: 3rem;
          }

          .stat-content h3 {
            font-size: 1.75rem;
          }
        }
        .dashboard-content {
          padding: 2rem 1rem;
        }

        /* STATISTIQUES AVEC COULEURS VARIÉES */
        .simple-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .simple-stat-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .simple-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #3b82f6, #10b981);
        }

        .simple-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }

        .simple-stat-card:nth-child(1)::before {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .simple-stat-card:nth-child(2)::before {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .simple-stat-card:nth-child(3)::before {
          background: linear-gradient(135deg, #6b7280, #4b5563);
        }

        .simple-stat-card:nth-child(4)::before {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .simple-stat-card h3 {
          font-size: 2.5rem;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
          font-weight: 700;
        }

        .simple-stat-card:nth-child(1) h3 { color: #3b82f6; }
        .simple-stat-card:nth-child(2) h3 { color: #10b981; }
        .simple-stat-card:nth-child(3) h3 { color: #6b7280; }
        .simple-stat-card:nth-child(4) h3 { color: #f59e0b; }

        .simple-stat-card p {
          color: #1f2937;
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        /* BOUTON TOGGLE AVEC NOUVELLE COULEUR */
        .header-toggle-btn {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1000;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        }

        .header-toggle-btn:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: scale(1.05);
        }

        /* SECTIONS AVEC NOUVELLES COULEURS */
        .section {
          background: white;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          margin-bottom: 2rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          padding: 1rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .filtered-indicator {
          background: #1f2937;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-left: 1rem;
        }

        /* CHARTS AVEC NOUVELLES COULEURS */
        .charts-section {
          margin-bottom: 3rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 2rem;
        }

        .chart-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .chart-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 1.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 2px solid #10b981;
          padding-bottom: 0.75rem;
        }

        /* TABLEAUX AVEC SCROLL ET NOUVELLES COULEURS */
        .table-container {
          background: white;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        /* NOUVEAU: Wrapper pour le scroll de la table étudiants */
        .tableau-container {
          background: white;
          border-radius: 12px;
          border: 2px solid #10b981;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }

        .table-scroll-wrapper {
          overflow-x: auto;
          overflow-y: auto;
          max-height: 600px;
          scrollbar-width: thin;
          scrollbar-color: #10b981 #f3f4f6;
        }

        .table-scroll-wrapper::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .table-scroll-wrapper::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .table-scroll-wrapper::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 4px;
        }

        .table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #059669, #047857);
        }

        .analysis-table {
          width: 100%;
          border-collapse: collapse;
        }

        .analysis-table th {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 1rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.875rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .analysis-table td {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
          font-weight: 500;
        }

        .analysis-table tbody tr:hover {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
        }

        .no-data-table {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-weight: 600;
          font-size: 1.1rem;
        }

        /* BADGES AVEC NOUVELLES COULEURS */
        .badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 700;
          color: white;
          text-align: center;
          min-width: 3rem;
        }

        .badge.blue { 
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }
        .badge.green { 
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .money {
          font-weight: 700;
          color: #10b981;
          font-size: 1.1rem;
        }

        .rate {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 700;
        }

        .rate.good {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .rate.warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .no-data {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-weight: 600;
          font-size: 1.1rem;
        }

        /* FORMATION BADGES AVEC NOUVELLES COULEURS */
        .formation-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #6b7280, #4b5563);
          text-transform: uppercase;
        }

        /* FILTRES ÉTUDIANTS AVEC NOUVELLES COULEURS */
        .students-filters,
        .professors-filters {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px solid #10b981;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
        }

        .students-filters-row,
        .professors-filters-row {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
        }

        .search-input-container {
          position: relative;
          flex: 1;
          min-width: 300px;
          max-width: 400px;
        }

        .search-input-container svg {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #10b981;
          z-index: 1;
        }

        .students-search-input,
        .professors-search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 2px solid #10b981;
          border-radius: 8px;
          font-size: 0.875rem;
          outline: none;
          font-weight: 500;
          color: #1f2937;
          transition: all 0.3s ease;
        }

        .students-search-input:focus,
        .professors-search-input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .students-filter-select,
        .professors-filter-select {
          padding: 0.75rem 1rem;
          border: 2px solid #6b7280;
          border-radius: 8px;
          background: white;
          color: #1f2937;
          font-size: 0.875rem;
          cursor: pointer;
          min-width: 150px;
          font-weight: 500;
          outline: none;
          transition: all 0.3s ease;
        }

        .students-filter-select:focus,
        .professors-filter-select:focus {
          border-color: #4b5563;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .reset-students-filters-btn,
        .reset-professors-filters-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.3s ease;
        }

        .reset-students-filters-btn:hover,
        .reset-professors-filters-btn:hover {
          background: linear-gradient(135deg, #d97706, #b45309);
          transform: translateY(-1px);
        }

        .clear-search-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #10b981;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .clear-search-btn:hover {
          background: #f0fdf4;
          color: #059669;
        }

        /* TABLEAU ÉTUDIANTS AVEC SCROLL ET NOUVELLES COULEURS */
        .tableau-etudiants {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
        }

        .tableau-etudiants th {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 1rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.875rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .tableau-etudiants td {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
          font-weight: 500;
        }

        .tableau-etudiants tbody tr:hover {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
        }

        .image-etudiant {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
          border: 2px solid #10b981;
        }

        .pas-image {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .statut-text.actif {
          color: #10b981;
          font-weight: 700;
        }

        .statut-text.inactif {
          color: #f59e0b;
          font-weight: 700;
        }

        .btn-voir {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-voir:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-1px);
        }

        .aucun-resultat {
          text-align: center;
          color: #6b7280;
          font-weight: 600;
          padding: 3rem;
          font-size: 1.1rem;
        }

        .nom-colonne {
          font-weight: 700;
          color: #1f2937;
        }

        .filiere-colonne {
          font-weight: 600;
          color: #10b981;
        }

        .niveau-colonne {
          font-weight: 600;
          color: #6b7280;
        }

        .statut-colonne,
        .image-colonne,
        .actions-colonne {
          text-align: center;
        }

        /* AUTRES CARTES AVEC NOUVELLES COULEURS */
        .professor-card,
        .cours-card,
        .formation-type-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 2px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .professor-card:hover,
        .cours-card:hover,
        .formation-type-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15);
        }

        .professor-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .professor-subject {
          font-size: 0.875rem;
          color: white;
          background: linear-gradient(135deg, #10b981, #059669);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 600;
          display: inline-block;
        }

        .course-badge {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .stat-badge.blue { 
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }
        .stat-badge.green { 
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .type-badge {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* MODAL AVEC NOUVELLES COULEURS */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(31, 41, 55, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .student-modal {
          background: white;
          border-radius: 12px;
          border: 2px solid #10b981;
          max-width: 900px;
          width: 90%;
          max-height: 90%;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(16, 185, 129, 0.2);
        }

        .student-modal-header {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .student-modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .modal-close-btn {
          background: white;
          color: #10b981;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .modal-close-btn:hover {
          background: #f0fdf4;
          transform: scale(1.05);
        }

        .student-info-section {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .student-info-section:hover {
          border-color: #10b981;
        }

        .student-info-section h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #10b981;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 2px solid #10b981;
          padding-bottom: 0.5rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .info-item:hover {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border-color: #10b981;
        }

        .info-item label {
          font-weight: 700;
          color: #1f2937;
          font-size: 0.875rem;
          flex-shrink: 0;
          margin-right: 1rem;
        }

        .info-item span {
          font-weight: 600;
          color: #10b981;
          font-size: 0.875rem;
          text-align: right;
          word-break: break-word;
        }

        .payment-status.paid {
          color: #10b981;
        }

        .payment-status.unpaid {
          color: #f59e0b;
        }

        .status.active {
          color: #10b981;
          font-weight: 700;
        }

        .status.inactive {
          color: #f59e0b;
          font-weight: 700;
        }

        .modal-student-image {
          max-width: 200px;
          max-height: 250px;
          border-radius: 12px;
          border: 3px solid #10b981;
          object-fit: cover;
        }

        /* RESPONSIVE AMÉLIORÉ */
        @media (max-width: 768px) {
          .header-stats span {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
          }

          .table-scroll-wrapper {
            max-height: 400px;
          }

          .tableau-etudiants {
            min-width: 800px;
          }

          .simple-stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }

        @media (max-width: 480px) {
          .table-scroll-wrapper {
            max-height: 300px;
          }

          .tableau-etudiants th,
          .tableau-etudiants td {
            padding: 0.5rem;
            font-size: 0.75rem;
          }
        }

        /* SCROLL GÉNÉRAL POUR TOUTES LES TABLES */
        .table-container {
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #10b981 #f3f4f6;
        }

        .table-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .table-container::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #059669, #047857);
        }

        /* AUTRES STYLES INCHANGÉS */
        .stats-section {
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1rem auto;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-card.green .stat-icon {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .stat-card.purple .stat-icon {
          background: linear-gradient(135deg, #6b7280, #4b5563);
        }

        .stat-card.orange .stat-icon {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .tabs-navigation {
          display: none;
        }

        /* AUTRES GRILLES INCHANGÉES */
        .professors-grid,
        .professeurs-grid,
        .cours-professeurs-grid,
        .formation-types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          padding: 1.5rem;
        }

        .niveau-name,
        .specialite-name,
        .annee-name {
          font-weight: 700;
          color: #1f2937;
          font-size: 1rem;
        }

        .price-value {
          font-weight: 700;
          color: #10b981;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
};

export default PedagogiqueDashboard;