import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import Sidebar from '../components/Sidebar'; 
import {
  Users, GraduationCap, CreditCard, TrendingUp, Award, UserCheck,
  DollarSign, Calendar, Target, BarChart3, PieChart as PieChartIcon,
  Activity, Globe, MapPin, Clock, BookOpen, Eye, Filter, LogOut,
  RefreshCw, ChevronDown, ChevronUp, AlertTriangle, User, Phone,
  IdCard, FileText, Shield, CheckCircle, XCircle, Building, 
  CalendarIcon, Star, X, AlertCircle, Search, Mail, Percent,
  Edit, Trash2, Download, Upload, Settings, Home, Info, Layers,
  TrendingDown, Users2, School, Briefcase, Code, Database, UserPlus
} from 'lucide-react';

// Couleurs professionnelles etendues
const COLORS = [
  '#2563eb', '#059669', '#7c3aed', '#dc2626', '#ea580c', '#0891b2', 
  '#9333ea', '#ca8a04', '#e11d48', '#0d9488', '#7c2d12', '#1e40af'
];

const EnhancedDashboard = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commerciaux, setCommerciaux] = useState([]);
  const [cours, setCours] = useState([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [headerVisible, setHeaderVisible] = useState(true);
  
  // Filtres etendus
  const [filtreAnneeScolaire, setFiltreAnneeScolaire] = useState('2025/2026');
  const [filtreFiliere, setFiltreFiliere] = useState('toutes');
  const [filtreNiveauFormation, setFiltreNiveauFormation] = useState('tous');
  const [filtreCycle, setFiltreCycle] = useState('tous');
  const [filtreTypeFormation, setFiltreTypeFormation] = useState('tous');

  useEffect(() => {
    fetchData();
    setTimeout(() => {
      setShowWelcomeModal(true);
    }, 1000);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [etudiantsRes, commerciauxRes, coursRes] = await Promise.all([
        axios.get('http://195.179.229.230:5000/api/etudiants', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://195.179.229.230:5000/api/commerciaux', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://195.179.229.230:5000/api/cours', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log('ðŸ“Š Donnees chargees:', {
        etudiants: etudiantsRes.data.length,
        commerciaux: commerciauxRes.data.length,
        cours: coursRes.data.length
      });

      setEtudiants(etudiantsRes.data);
      setCommerciaux(commerciauxRes.data);
      setCours(coursRes.data);
      
    } catch (err) {
      console.error('"Œ Erreur lors du chargement des donnees:', err);
      setEtudiants([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEtudiants = () => {
    let filtered = [...etudiants];

    if (filtreAnneeScolaire !== 'toutes') {
      filtered = filtered.filter(e => e.anneeScolaire === filtreAnneeScolaire);
    }
    if (filtreFiliere !== 'toutes') {
      filtered = filtered.filter(e => e.filiere === filtreFiliere);
    }
    if (filtreNiveauFormation !== 'tous') {
      filtered = filtered.filter(e => e.niveauFormation === filtreNiveauFormation);
    }
    if (filtreCycle !== 'tous') {
      filtered = filtered.filter(e => e.cycle === filtreCycle);
    }
    if (filtreTypeFormation !== 'tous') {
      if (filtreTypeFormation === 'FI') {
        // Pour FI, on prend tous ceux qui ne sont ni Executive ni TA
        filtered = filtered.filter(e => {
          const niveau = (e.niveauFormation || '').toLowerCase();
          const cycle = (e.cycle || '').toLowerCase();
          
          const isExecutive = niveau.includes('executive') || niveau.includes('exec') || cycle.includes('executive') || niveau === 'executive';
          const isTA = niveau.includes('ta') || niveau.includes('alterne') || cycle.includes('ta') || cycle.includes('alterne') || niveau === 'ta';
          
          return !isExecutive && !isTA; // FI = tous sauf Executive et TA
        });
      } else if (filtreTypeFormation === 'Executive') {
        filtered = filtered.filter(e => {
          const niveau = (e.niveauFormation || '').toLowerCase();
          const cycle = (e.cycle || '').toLowerCase();
          return niveau.includes('executive') || niveau.includes('exec') || cycle.includes('executive') || niveau === 'executive';
        });
      } else if (filtreTypeFormation === 'TA') {
        filtered = filtered.filter(e => {
          const niveau = (e.niveauFormation || '').toLowerCase();
          const cycle = (e.cycle || '').toLowerCase();
          return niveau.includes('ta') || niveau.includes('alterne') || cycle.includes('ta') || cycle.includes('alterne') || niveau === 'ta';
        });
      }
    }

    return filtered;
  };

  const etudiantsFiltres = getFilteredEtudiants();

  // Statistiques generales ameliorees
  const statsGenerales = {
    totalEtudiants: etudiantsFiltres.length,
    etudiantsActifs: etudiantsFiltres.filter(e => e.actif).length,
    etudiantsPayes: etudiantsFiltres.filter(e => e.paye).length,
    chiffreAffaireTotal: etudiantsFiltres.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
    chiffreAffairePaye: etudiantsFiltres.filter(e => e.paye).reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
    moyennePrixFormation: etudiantsFiltres.length > 0 ?etudiantsFiltres.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0) / etudiantsFiltres.length : 0,
    tauxPaiement: etudiantsFiltres.length > 0 ? (etudiantsFiltres.filter(e => e.paye).length / etudiantsFiltres.length * 100) : 0,
    nouveauxEtudiants: etudiantsFiltres.filter(e => e.nouvelleInscription).length,
  };

  // ðŸŽ“ ANALYSE DES FORMATIONS FT vs EXECUTIVE
  const analyseFormations = () => {
    const formationStats = {
      'FI (Formation Initiale)': { etudiants: [], total: 0, payes: 0, ca: 0, caPaye: 0 },
      'Executive': { etudiants: [], total: 0, payes: 0, ca: 0, caPaye: 0 },
      'TA (Temps Alterne)': { etudiants: [], total: 0, payes: 0, ca: 0, caPaye: 0 }
    };

    etudiantsFiltres.forEach(e => {
      let category = 'FI (Formation Initiale)'; // Par defaut = FI
      const niveau = (e.niveauFormation || '').toLowerCase().trim();
      const cycle = (e.cycle || '').toLowerCase().trim();

      // Determine la categorie en suivant la mAªme logique que le filtre
      const isExecutive = niveau.includes('executive') || niveau.includes('exec') || cycle.includes('executive') || niveau === 'executive';
      const isTA = niveau.includes('ta') || niveau.includes('alterne') || cycle.includes('ta') || cycle.includes('alterne') || niveau === 'ta';

      if (isTA) {
        category = 'TA (Temps Alterne)';
      } else if (isExecutive) {
        category = 'Executive';
      }
      // Sinon, reste dans "FI (Formation Initiale)"

      formationStats[category].etudiants.push(e);
      formationStats[category].total += 1;
      if (e.paye) formationStats[category].payes += 1;
      formationStats[category].ca += parseFloat(e.prixTotal) || 0;
      if (e.paye) formationStats[category].caPaye += parseFloat(e.prixTotal) || 0;
    });

    // Debug pour voir la repartition FI/Executive/TA
    console.log('ðŸ” Repartition des formations FI/Executive/TA:', {
      totalEtudiants: etudiantsFiltres.length,
      repartition: Object.fromEntries(Object.entries(formationStats).map(([key, value]) => [key, value.total])),
      exemples: etudiantsFiltres.slice(0, 5).map(e => ({
        nom: `${e.prenom} ${e.nomDeFamille}`,
        niveauFormation: e.niveauFormation,
        cycle: e.cycle
      }))
    });

    // Retourne toutes les categories, mAªme celles avec 0 etudiant pour le debug
    return Object.entries(formationStats).map(([type, stats]) => ({
      type,
      ...stats,
      tauxReussite: stats.total > 0 ? ((stats.payes / stats.total) * 100).toFixed(1) : 0,
      prixMoyen: stats.total > 0 ? (stats.ca / stats.total).toFixed(0) : 0
    }));
  };
 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
  // ðŸ“Š ANALYSE PAR NIVEAU DE FORMATION
  const analyseNiveauxFormation = () => {
    const niveauxStats = {};
    
    etudiantsFiltres.forEach(e => {
      const niveau = e.niveauFormation || 'Non defini';
      if (!niveauxStats[niveau]) {
        niveauxStats[niveau] = { etudiants: [], total: 0, payes: 0, ca: 0, caPaye: 0 };
      }
      
      niveauxStats[niveau].etudiants.push(e);
      niveauxStats[niveau].total += 1;
      if (e.paye) niveauxStats[niveau].payes += 1;
      niveauxStats[niveau].ca += parseFloat(e.prixTotal) || 0;
      if (e.paye) niveauxStats[niveau].caPaye += parseFloat(e.prixTotal) || 0;
    });

    return Object.entries(niveauxStats).map(([niveau, stats]) => ({
      niveau,
      ...stats,
      tauxReussite: stats.total > 0 ? ((stats.payes / stats.total) * 100).toFixed(1) : 0,
      prixMoyen: stats.total > 0 ? (stats.ca / stats.total).toFixed(0) : 0
    })).sort((a, b) => b.total - a.total);
  };

  // ðŸŽ¯ ANALYSE PAR FILIAˆRE DA‰TAILLA‰E
  const analyseFilieres = () => {
    const filieresStats = {};
    
    etudiantsFiltres.forEach(e => {
      const filiere = e.filiere || 'Non definie';
      if (!filieresStats[filiere]) {
        filieresStats[filiere] = { etudiants: [], total: 0, payes: 0, ca: 0, caPaye: 0, specialites: new Set() };
      }
      
      filieresStats[filiere].etudiants.push(e);
      filieresStats[filiere].total += 1;
      if (e.paye) filieresStats[filiere].payes += 1;
      filieresStats[filiere].ca += parseFloat(e.prixTotal) || 0;
      if (e.paye) filieresStats[filiere].caPaye += parseFloat(e.prixTotal) || 0;
      
      if (e.specialite) filieresStats[filiere].specialites.add(e.specialite);
      if (e.specialiteIngenieur) filieresStats[filiere].specialites.add(e.specialiteIngenieur);
    });

    return Object.entries(filieresStats).map(([filiere, stats]) => ({
      filiere,
      ...stats,
      specialitesCount: stats.specialites.size,
      specialitesList: Array.from(stats.specialites),
      tauxReussite: stats.total > 0 ? ((stats.payes / stats.total) * 100).toFixed(1) : 0,
      prixMoyen: stats.total > 0 ? (stats.ca / stats.total).toFixed(0) : 0
    })).sort((a, b) => b.total - a.total);
  };

  // ðŸ“ˆ ANALYSE PAR ANNA‰E SCOLAIRE
  const analyseAnneesScolaires = () => {
    const anneesStats = {};
    
    etudiantsFiltres.forEach(e => {
      const annee = e.anneeScolaire || 'Non definie';
      if (!anneesStats[annee]) {
        anneesStats[annee] = { etudiants: [], total: 0, payes: 0, ca: 0, caPaye: 0 };
      }
      
      anneesStats[annee].etudiants.push(e);
      anneesStats[annee].total += 1;
      if (e.paye) anneesStats[annee].payes += 1;
      anneesStats[annee].ca += parseFloat(e.prixTotal) || 0;
      if (e.paye) anneesStats[annee].caPaye += parseFloat(e.prixTotal) || 0;
    });

    return Object.entries(anneesStats).map(([annee, stats]) => ({
      annee,
      ...stats,
      tauxReussite: stats.total > 0 ? ((stats.payes / stats.total) * 100).toFixed(1) : 0,
      prixMoyen: stats.total > 0 ? (stats.ca / stats.total).toFixed(0) : 0
    })).sort((a, b) => b.annee.localeCompare(a.annee));
  };

  // ðŸ”„ ANALYSE PAR CYCLE
  const analyseCycles = () => {
    const cyclesStats = {};
    
    etudiantsFiltres.forEach(e => {
      const cycle = e.cycle || 'Non defini';
      if (!cyclesStats[cycle]) {
        cyclesStats[cycle] = { etudiants: [], total: 0, payes: 0, ca: 0, caPaye: 0 };
      }
      
      cyclesStats[cycle].etudiants.push(e);
      cyclesStats[cycle].total += 1;
      if (e.paye) cyclesStats[cycle].payes += 1;
      cyclesStats[cycle].ca += parseFloat(e.prixTotal) || 0;
      if (e.paye) cyclesStats[cycle].caPaye += parseFloat(e.prixTotal) || 0;
    });

    return Object.entries(cyclesStats).map(([cycle, stats]) => ({
      cycle,
      ...stats,
      tauxReussite: stats.total > 0 ? ((stats.payes / stats.total) * 100).toFixed(1) : 0,
      prixMoyen: stats.total > 0 ? (stats.ca / stats.total).toFixed(0) : 0
    })).sort((a, b) => b.total - a.total).filter(item => item.total > 0);
  };

  // 🌍 ANALYSE GÉOGRAPHIQUE
  const analyseGeographique = () => {
    const paysStats = {};
    
    etudiantsFiltres.forEach(e => {
      const pays = e.pays || 'Non defini';
      if (!paysStats[pays]) {
        paysStats[pays] = { etudiants: [], total: 0, payes: 0, ca: 0, residents: 0, fonctionnaires: 0 };
      }
      
      paysStats[pays].etudiants.push(e);
      paysStats[pays].total += 1;
      if (e.paye) paysStats[pays].payes += 1;
      paysStats[pays].ca += parseFloat(e.prixTotal) || 0;
      if (e.resident) paysStats[pays].residents += 1;
      if (e.fonctionnaire) paysStats[pays].fonctionnaires += 1;
    });

    return Object.entries(paysStats).map(([pays, stats]) => ({
      pays,
      ...stats,
      tauxReussite: stats.total > 0 ? ((stats.payes / stats.total) * 100).toFixed(1) : 0,
      tauxResidents: stats.total > 0 ? ((stats.residents / stats.total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);
  };

  // 🧮 Analyse par Filière + Niveau — génère des cartes: "IRM N1", "MASI N2"...
  const analyseFiliereNiveau = () => {
    // D'abord, obtenir TOUTES les combinaisons possibles depuis TOUS les étudiants (pas filtrés)
    const toutesLesCombinaisonsPossibles = new Set();
    
    etudiants.forEach((e) => {
      const filiere = (e.filiere || 'Autre').toUpperCase().trim();
      const rawNiv = (e.niveau ?? e.niveauFormation ?? e.cycle ?? '').toString();
      let niveauNum = null;
      if (typeof e.niveau === 'number') {
        niveauNum = e.niveau;
      } else {
        const m = rawNiv.match(/\d+/);
        niveauNum = m ? parseInt(m[0], 10) : null;
      }
      const key = `${filiere} ${niveauNum !== null ? `N${niveauNum}` : 'N—'}`;
      toutesLesCombinaisonsPossibles.add(JSON.stringify({filiere, niveau: niveauNum, key}));
    });

    // Créer le map avec TOUTES les combinaisons possibles initialisées à 0
    const map = {};
    toutesLesCombinaisonsPossibles.forEach(combinaisonStr => {
      const combinaison = JSON.parse(combinaisonStr);
      map[combinaison.key] = {
        key: combinaison.key,
        filiere: combinaison.filiere,
        niveau: combinaison.niveau,
        total: 0,
        payes: 0,
        ca: 0,
        etudiants: [],
      };
    });

    // Maintenant remplir avec les étudiants FILTRÉS
    etudiantsFiltres.forEach((e) => {
      const filiere = (e.filiere || 'Autre').toUpperCase().trim();
      const rawNiv = (e.niveau ?? e.niveauFormation ?? e.cycle ?? '').toString();
      let niveauNum = null;
      if (typeof e.niveau === 'number') {
        niveauNum = e.niveau;
      } else {
        const m = rawNiv.match(/\d+/);
        niveauNum = m ? parseInt(m[0], 10) : null;
      }
      const key = `${filiere} ${niveauNum !== null ? `N${niveauNum}` : 'N—'}`;

      if (map[key]) {
        map[key].total += 1;
        if (e.paye) map[key].payes += 1;
        map[key].ca += parseFloat(e.prixTotal) || 0;
        map[key].etudiants.push(e);
      }
    });

    // Tri: d'abord par filière puis niveau croissant (non défini vient en dernier)
    return Object.values(map).sort(
      (a, b) =>
        a.filiere.localeCompare(b.filiere) || (a.niveau ?? 99) - (b.niveau ?? 99)
    );
  };

  // Recuperation des donnees d'analyse
  const formationsData = analyseFormations();
  const niveauxData = analyseNiveauxFormation();
  const filieresData = analyseFilieres();
  const anneesData = analyseAnneesScolaires();
  const cyclesData = analyseCycles();
  const paysData = analyseGeographique();
  const classesData = analyseFiliereNiveau();

  // Inscriptions: nouvelles vs anciennes
  const inscriptions = {
    nouvelles: etudiantsFiltres.filter(e => e.nouvelleInscription === true).length,
    anciennes: etudiantsFiltres.filter(e => e.nouvelleInscription === false || !e.nouvelleInscription).length,
  };

  // Fonction pour ouvrir la modal avec details
  const ouvrirModal = (type, data) => {
    setSelectedAnalysis({ type, title: type, data });
    setModalData(data.etudiants || []);
    setShowDetailModal(true);
    setSearchTerm('');
  };

  // Obtenir les valeurs uniques pour les filtres
  const anneesDisponibles = [...new Set(etudiants.map(e => e.anneeScolaire).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const filieres = [...new Set(etudiants.map(e => e.filiere).filter(Boolean))];

  // Filtrer les etudiants dans la modal
  const etudiantsFiltresModal = modalData.filter(etudiant => 
    `${etudiant.prenom} ${etudiant.nomDeFamille}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etudiant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etudiant.codeEtudiant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etudiant.filiere?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount).replace('MAD', 'DH');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3 className="loading-text">Chargement du dashboard avance...</h3>
          <p className="loading-subtext">Analyse des formations en cours</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard">      <Sidebar onLogout={handleLogout} />

      {/* Button to hide/show header */}
      <div style={{textAlign: 'center', margin: '1rem 0'}}>
        <button
          onClick={() => setHeaderVisible(v => !v)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.5rem 1.5rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {headerVisible ? 'Masquer le header' : 'Afficher le header'}
        </button>
      </div>
      {/* En-tAªte ameliore */}
      {headerVisible && (
        <header className="dashboard-header dashboard-header-center">
          <div className="container">
            <div className="header-content header-content-center">
              <div className="header-info header-info-center">
                <h1>
                  Dashboard Administrateur - Formations Completes
                </h1>
                <div className="header-stats header-stats-center">
                  <span className="header-stat">
                    {etudiantsFiltres.length} etudiants
                  </span>
                  <span className="header-stat">
                    {formationsData.length} types de formation
                  </span>
                  <span className="header-stat">
                    {formatMoney(statsGenerales.chiffreAffaireTotal)}
                  </span>
                  <span className="header-stat">
                    {statsGenerales.tauxPaiement.toFixed(1)}% paye
                  </span>
                  <span className="header-stat">
                    {inscriptions.nouvelles} new / {inscriptions.anciennes} old
                  </span>
                </div>
              </div>
              <div className="header-controls header-controls-center">
                <div className="filters-container">
                  <select value={filtreAnneeScolaire} onChange={(e) => setFiltreAnneeScolaire(e.target.value)} className="filter-select">
                    <option value="toutes">Toutes les annees</option>
                    {anneesDisponibles.map(annee => (
                      <option key={annee} value={annee}>{annee}</option>
                    ))}
                  </select>

                  <select value={filtreTypeFormation} onChange={(e) => setFiltreTypeFormation(e.target.value)} className="filter-select">
                    <option value="tous">Tous les types</option>
                    <option value="FI">Formation FI (Formation Initiale)</option>
                    <option value="Executive">Formation Executive</option>
                    <option value="TA">Formation TA (Temps Alterne)</option>
                  </select>

                  <select value={filtreFiliere} onChange={(e) => setFiltreFiliere(e.target.value)} className="filter-select">
                    <option value="toutes">Toutes filieres</option>
                    {filieres.map(filiere => (
                      <option key={filiere} value={filiere}>{filiere}</option>
                    ))}
                  </select>
                </div>

                <button onClick={fetchData} className="btn-refresh">
                  Actualiser
                </button>
              </div>
            </div>
          </div>
        </header>
      )}
      <style jsx>{`
  /* ...existing code... */
  .container {
    max-width: 1400px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%);
    padding: 0 1.5rem;
  }
  .dashboard-header-center {
    background: #fff;
    color: #000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-bottom: 1px solid #e5e7eb;
    text-align: center;
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
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
    color: #000;
    width: 100%;
  }
  .header-info-center h1 {
    color: #000;
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
    color: #000;
    width: 100%;
  }
  .header-controls-center {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }
  /* ...existing code... */
`}</style>

      <div className="dashboard-container">
        {/* Navigation par onglets */}
        <div className="tabs-navigation">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button 
            className={`tab-btn ${activeTab === 'formations' ? 'active' : ''}`}
            onClick={() => setActiveTab('formations')}
          >
            Formations
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analyses
          </button>
          <button 
            className={`tab-btn ${activeTab === 'geography' ? 'active' : ''}`}
            onClick={() => setActiveTab('geography')}
          >
            Geographie
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('inscriptions')}
          >
            Inscriptions
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
                    </div>
                    <div className="stat-content">
                      <h3>{statsGenerales.totalEtudiants}</h3>
                      <p>Total Étudiants</p>
                      <span className="stat-detail">{statsGenerales.etudiantsActifs} actifs • {statsGenerales.nouveauxEtudiants} nouveaux</span>
                    </div>
                  </div>

                  <div className="stat-card green">
                    <div className="stat-icon">
                    </div>
                    <div className="stat-content">
                      <h3>{formatMoney(statsGenerales.chiffreAffaireTotal)}</h3>
                      <p>Chiffre d'Affaires</p>
                      <span className="stat-detail">{formatMoney(statsGenerales.chiffreAffairePaye)} encaisse</span>
                    </div>
                  </div>

                  <div className="stat-card purple">
                    <div className="stat-icon">
                    </div>
                    <div className="stat-content">
                      <h3>{statsGenerales.tauxPaiement.toFixed(1)}%</h3>
                      <p>Taux de Paiement</p>
                      <span className="stat-detail">{statsGenerales.etudiantsPayes} etudiants payes</span>
                    </div>
                  </div>

                  <div className="stat-card orange">
                    <div className="stat-icon">
                    </div>
                    <div className="stat-content">
                      <h3>{formatMoney(statsGenerales.moyennePrixFormation)}</h3>
                      <p>Prix Moyen</p>
                      <span className="stat-detail">par formation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vue d'ensemble des formations */}
              <div className="section">
                <h2 className="section-title">
                  Repartition des Formations FI vs Executive
                </h2>
                <div className="formation-overview">
                  {formationsData.map((formation, index) => (
                    <div key={index} className="formation-card" onClick={() => ouvrirModal(formation.type, formation)}>
                      <div className="formation-header">
                        <h3>{formation.type}</h3>
                        <span className={`formation-badge ${formation.type.includes('FT') ? 'blue' : formation.type.includes('Executive') ? 'purple' : 'gray'}`}>
                          {formation.total} etudiants
                        </span>
                      </div>
                      <div className="formation-stats">
                        <div className="formation-stat">
                          <span className="label">Chiffre d'affaires</span>
                          <span className="value">{formatMoney(formation.ca)}</span>
                        </div>
                        <div className="formation-stat">
                          <span className="label">Taux de reussite</span>
                          <span className="value">{formation.tauxReussite}%</span>
                        </div>
                        <div className="formation-stat">
                          <span className="label">Prix moyen</span>
                          <span className="value">{formatMoney(formation.prixMoyen)}</span>
                        </div>
                      </div>
                      <div className="formation-progress">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${formation.tauxReussite}%`,
                            backgroundColor: parseFloat(formation.tauxReussite) >= 70 ? '#059669' : '#ea580c'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 📌 Cartes par Filière + Niveau
              (IRM 1, IRM 2, MASI 1, ...) */}
              <div className="section">
                <h2 className="section-title">
                  Cartes par Filière + Niveau
                </h2>

                <div className="classes-grid">
                  {classesData.map((item) => {
                    const taux = item.total > 0 ? ((item.payes / item.total) * 100).toFixed(0) : 0;
                    return (
                      <div
                        key={item.key}
                        className="class-card"
                        onClick={() => ouvrirModal(`${item.filiere} N${item.niveau ?? '—'}`, item)}
                      >
                        <div className="class-header">
                          <h3>{item.filiere} — N{item.niveau ?? '—'}</h3>
                          <span className="badge blue">{item.total} étudiants</span>
                        </div>

                        <div className="class-stats">
                          <div className="stat">
                            <span className="label">Payés</span>
                            <span className="value">{item.payes}/{item.total}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Revenus</span>
                            <span className="value">{formatMoney(item.ca)}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Taux paiement</span>
                            <span className={`value ${taux >= 70 ? 'good' : 'warn'}`}>{taux}%</span>
                          </div>
                        </div>

                        <div className="class-progress">
                          <div
                            className="fill"
                            style={{ width: `${taux}%`, backgroundColor: taux >= 70 ? '#059669' : '#ea580c' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'formations' && (
            <>
              {/* Analyse des niveaux de formation */}
              <div className="section">
                <h2 className="section-title">
                  Analyse par Niveau de Formation
                </h2>
                <div className="table-container">
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Niveau de Formation</th>
                        <th>A‰tudiants</th>
                        <th>Payes</th>
                        <th>CA Total</th>
                        <th>CA Paye</th>
                        <th>Taux Reussite</th>
                        <th>Prix Moyen</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {niveauxData.map((niveau, index) => (
                        <tr key={index}>
                          <td className="niveau-name">{niveau.niveau}</td>
                          <td><span className="badge blue">{niveau.total}</span></td>
                          <td><span className="badge green">{niveau.payes}</span></td>
                          <td className="money">{formatMoney(niveau.ca)}</td>
                          <td className="money">{formatMoney(niveau.caPaye)}</td>
                          <td>
                            <span className={`rate ${parseFloat(niveau.tauxReussite) >= 70 ? 'good' : 'warning'}`}>
                              {niveau.tauxReussite}%
                            </span>
                          </td>
                          <td className="money">{formatMoney(niveau.prixMoyen)}</td>
                          <td>
                            <button className="btn-action" onClick={() => ouvrirModal(`Niveau: ${niveau.niveau}`, niveau)}>
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analyse des filieres */}
              <div className="section">
                <h2 className="section-title">
                  Analyse Detaillee par Filiere
                </h2>
                <div className="table-container">
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Filiere</th>
                        <th>A‰tudiants</th>
                        <th>Specialites</th>
                        <th>Payes</th>
                        <th>CA Total</th>
                        <th>Taux Reussite</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filieresData.map((filiere, index) => (
                        <tr key={index}>
                          <td className="filiere-name">
                            {filiere.filiere}
                            {filiere.specialitesCount > 0 && (
                              <div className="specialites-info">
                                {filiere.specialitesCount} specialite{filiere.specialitesCount > 1 ? 's' : ''}
                              </div>
                            )}
                          </td>
                          <td><span className="badge blue">{filiere.total}</span></td>
                          <td><span className="badge purple">{filiere.specialitesCount}</span></td>
                          <td><span className="badge green">{filiere.payes}</span></td>
                          <td className="money">{formatMoney(filiere.ca)}</td>
                          <td>
                            <span className={`rate ${parseFloat(filiere.tauxReussite) >= 70 ? 'good' : 'warning'}`}>
                              {filiere.tauxReussite}%
                            </span>
                          </td>
                          <td>
                            <button className="btn-action" onClick={() => ouvrirModal(`Filiere: ${filiere.filiere}`, filiere)}>
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analyse des cycles */}
              <div className="section">
                <h2 className="section-title">
                  Analyse par Cycle de Formation
                </h2>
                <div className="cycles-grid">
                  {cyclesData.map((cycle, index) => (
                    <div key={index} className="cycle-card" onClick={() => ouvrirModal(`Cycle: ${cycle.cycle}`, cycle)}>
                      <div className="cycle-header">
                        <h3>{cycle.cycle}</h3>
                        <span className="cycle-count">{cycle.total} etudiants</span>
                      </div>
                      <div className="cycle-metrics">
                        <div className="metric">
                          <span className="metric-label">Payes</span>
                          <span className="metric-value">{cycle.payes}/{cycle.total}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">CA</span>
                          <span className="metric-value">{formatMoney(cycle.ca)}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Taux</span>
                          <span className="metric-value">{cycle.tauxReussite}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              {/* Graphiques d'analyse */}
              <div className="charts-section">
                <div className="charts-grid-extended">
                  
                  {/* Graphique Formations FT vs Executive */}
                  <div className="chart-card large">
                    <h3>
                      Repartition FI vs Executive
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={formationsData}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          dataKey="ca"
                          label={({type, ca}) => `${type}: ${formatMoney(ca)}`}
                        >
                          {formationsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Graphique par Annee Scolaire */}
                  <div className="chart-card large">
                    <h3>
                      Evolution par Annee Scolaire
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={anneesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="annee" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="total" fill="#2563eb" name="Total A‰tudiants" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="payes" fill="#059669" name="Payes" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Graphique Top Filieres */}
                  <div className="chart-card">
                    <h3>
                      Top Filieres (Effectifs)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={filieresData.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="filiere" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          fontSize={11}
                          stroke="#64748b"
                        />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Graphique Niveaux de Formation */}
                  <div className="chart-card">
                    <h3>
                      Niveaux de Formation
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={niveauxData.slice(0, 6)}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="total"
                          label={({niveau, total}) => `${niveau.substring(0, 15)}: ${total}`}
                        >
                          {niveauxData.slice(0, 6).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Analyse par Annees Scolaires */}
              <div className="section">
                <h2 className="section-title">
                  Analyse par Annee Scolaire
                </h2>
                <div className="table-container">
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Annee Scolaire</th>
                        <th>Total A‰tudiants</th>
                        <th>A‰tudiants Payes</th>
                        <th>CA Total</th>
                        <th>CA Paye</th>
                        <th>Taux Reussite</th>
                        <th>Prix Moyen</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anneesData.map((annee, index) => (
                        <tr key={index}>
                          <td className="annee-name">{annee.annee}</td>
                          <td><span className="badge blue">{annee.total}</span></td>
                          <td><span className="badge green">{annee.payes}</span></td>
                          <td className="money">{formatMoney(annee.ca)}</td>
                          <td className="money">{formatMoney(annee.caPaye)}</td>
                          <td>
                            <span className={`rate ${parseFloat(annee.tauxReussite) >= 70 ? 'good' : 'warning'}`}>
                              {annee.tauxReussite}%
                            </span>
                          </td>
                          <td className="money">{formatMoney(annee.prixMoyen)}</td>
                          <td>
                            <button className="btn-action" onClick={() => ouvrirModal(`Annee: ${annee.annee}`, annee)}>
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'geography' && (
            <>
              {/* Analyse geographique */}
              <div className="section">
                <h2 className="section-title">
                  Analyse Geographique des A‰tudiants
                </h2>
                <div className="table-container">
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Pays</th>
                        <th>Total A‰tudiants</th>
                        <th>A‰tudiants Payes</th>
                        <th>Taux Reussite</th>
                        <th>CA Total</th>
                        <th>Residents</th>
                        <th>Fonctionnaires</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paysData.map((pays, index) => (
                        <tr key={index}>
                          <td className="pays-name">
                            {pays.pays}
                          </td>
                          <td><span className="badge blue">{pays.total}</span></td>
                          <td><span className="badge green">{pays.payes}</span></td>
                          <td>
                            <span className={`rate ${parseFloat(pays.tauxReussite) >= 70 ? 'good' : 'warning'}`}>
                              {pays.tauxReussite}%
                            </span>
                          </td>
                          <td className="money">{formatMoney(pays.ca)}</td>
                          <td>
                            <span className="badge purple">{pays.residents}</span>
                            <span className="percentage">({pays.tauxResidents}%)</span>
                          </td>
                          <td><span className="badge orange">{pays.fonctionnaires}</span></td>
                          <td>
                            <button className="btn-action" onClick={() => ouvrirModal(`Pays: ${pays.pays}`, pays)}>
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Graphique geographique */}
              <div className="section">
                <div className="charts-grid">
                  <div className="chart-card">
                    <h3>
                      Repartition par Pays (CA)
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={paysData.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          dataKey="ca"
                          label={({pays, ca}) => `${pays}: ${formatMoney(ca)}`}
                        >
                          {paysData.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-card">
                    <h3>
                      Repartition par Pays (Effectifs)
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={paysData.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="pays" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          fontSize={11}
                          stroke="#64748b"
                        />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#2563eb" name="Total" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="residents" fill="#059669" name="Residents" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="fonctionnaires" fill="#ea580c" name="Fonctionnaires" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'inscriptions' && (
            <>
              <div className="section">
                <h2 className="section-title">
                  <UserPlus size={24} />
                  Inscriptions (Nouvelles vs Anciennes)
                </h2>

                {/* Cartes récap */}
                <div className="stats-grid">
                  <div className="stat-card green" onClick={() => ouvrirModal('Nouvelles inscriptions', {
                    total: inscriptions.nouvelles,
                    payes: etudiantsFiltres.filter(e => e.nouvelleInscription === true && e.paye).length,
                    ca: etudiantsFiltres.filter(e => e.nouvelleInscription === true).reduce((s, e) => s + (parseFloat(e.prixTotal)||0), 0),
                    tauxReussite: inscriptions.nouvelles > 0 ? (
                      (etudiantsFiltres.filter(e => e.nouvelleInscription === true && e.paye).length / inscriptions.nouvelles) * 100
                    ).toFixed(1) : 0,
                    etudiants: etudiantsFiltres.filter(e => e.nouvelleInscription === true)
                  })}>
                    <div className="stat-icon"><UserPlus size={24} /></div>
                    <div className="stat-content">
                      <h3>{inscriptions.nouvelles}</h3>
                      <p>Nouvelles inscriptions (true)</p>
                      <span className="stat-detail">Clique pour détails</span>
                    </div>
                  </div>

                  <div className="stat-card blue" onClick={() => ouvrirModal('Anciennes inscriptions', {
                    total: inscriptions.anciennes,
                    payes: etudiantsFiltres.filter(e => (e.nouvelleInscription === false || !e.nouvelleInscription) && e.paye).length,
                    ca: etudiantsFiltres.filter(e => (e.nouvelleInscription === false || !e.nouvelleInscription)).reduce((s, e) => s + (parseFloat(e.prixTotal)||0), 0),
                    tauxReussite: inscriptions.anciennes > 0 ? (
                      (etudiantsFiltres.filter(e => (e.nouvelleInscription === false || !e.nouvelleInscription) && e.paye).length / inscriptions.anciennes) * 100
                    ).toFixed(1) : 0,
                    etudiants: etudiantsFiltres.filter(e => (e.nouvelleInscription === false || !e.nouvelleInscription))
                  })}>
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-content">
                      <h3>{inscriptions.anciennes}</h3>
                      <p>Anciennes inscriptions (false)</p>
                      <span className="stat-detail">Clique pour détails</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>


      {/* Modal detaillee pour analyses */}
      {showDetailModal && selectedAnalysis && (
        <div className="modal-overlay">
          <div className="modal-content detail-modal">
            <div className="modal-header">
              <h2>
                <Eye size={24} />
                {selectedAnalysis.title}
              </h2>
              <button 
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="search-container">
                <div className="search-input-container">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher un etudiant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="students-list">
                <div className="students-count">
                  {etudiantsFiltresModal.length} etudiant{etudiantsFiltresModal.length > 1 ? 's' : ''}
                  {searchTerm && ` (filtre${etudiantsFiltresModal.length > 1 ? 's' : ''})`}
                </div>
                
                <div className="students-table-container">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>etudiant</th>
                        <th>Formation</th>
                        <th>Filiere</th>
                        <th>Annee</th>
                        <th>Statut</th>
                        <th>Paiement</th>
                        <th>Pays</th>
                      </tr>
                    </thead>
                    <tbody>
                      {etudiantsFiltresModal.map((etudiant, index) => (
                        <tr key={index} className={!etudiant.actif ? 'inactive-student' : ''}>
                          <td>
                            <div className="student-name">
                              <strong>{etudiant.prenom} {etudiant.nomDeFamille}</strong>
                              <small>{etudiant.codeEtudiant || etudiant.email}</small>
                            </div>
                          </td>
                          <td>
                            <div className="formation-info">
                              <span className="niveau">{etudiant.niveauFormation || 'Non defini'}</span>
                              {etudiant.cycle && <small className="cycle">Cycle: {etudiant.cycle}</small>}
                            </div>
                          </td>
                          <td>
                            <div className="filiere-info">
                              <span className="filiere">{etudiant.filiere || 'Non definie'}</span>
                              {(etudiant.specialite || etudiant.specialiteIngenieur) && (
                                <small className="specialite">
                                  {etudiant.specialite || etudiant.specialiteIngenieur}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>{etudiant.anneeScolaire || 'Non definie'}</td>
                          <td>
                            <span className={`status-badge ${etudiant.actif ? 'active' : 'inactive'}`}>
                              {etudiant.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td>
                            <div className="payment-info">
                              <span className={`payment-status ${etudiant.paye ? 'paid' : 'unpaid'}`}>
                                {etudiant.paye ? 'Paye' : 'Non paye'}
                              </span>
                              <span className="amount">{formatMoney(etudiant.prixTotal || 0)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="country-info">
                              <span>{etudiant.pays || 'Non defini'}</span>
                              <div className="country-flags">
                                {etudiant.resident && <span className="flag resident">Resident</span>}
                                {etudiant.fonctionnaire && <span className="flag fonctionnaire">Fonctionnaire</span>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="modal-stats">
                <span>Total: {selectedAnalysis.data.total}</span>
                <span>Actifs: {selectedAnalysis.data.payes}</span>
                <span>CA: {formatMoney(selectedAnalysis.data.ca)}</span>
                <span>Taux: {selectedAnalysis.data.tauxReussite}%</span>
              </div>
              <button 
                className="btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS étendus */}
      <style jsx>{`
        .enhanced-dashboard {
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
        }

        /* Classes grid pour les cartes par filière + niveau */
        .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .class-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
          cursor: pointer;
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
        }

        .class-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
        }

        .class-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border-color: #e2e8f0;
        }

        .class-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .class-header h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
        }

        .class-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: center;
        }

        .stat .label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat .value {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat .value.good {
          color: #059669;
        }

        .stat .value.warn {
          color: #ea580c;
        }

        .class-progress {
          width: 100%;
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }

        .class-progress .fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        /* Styles pour le modal premium */
        .dfp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          backdrop-filter: blur(12px);
        }

        .dfp-modal-content {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dfp-welcome-modal {
          max-width: 1200px;
        }

        .dfp-modal-header {
          padding: 24px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .dfp-modal-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          pointer-events: none;
        }

        .dfp-modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1;
          position: relative;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .dfp-modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 12px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .dfp-modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg) scale(1.1);
        }

        .dfp-modal-body {
          padding: 32px;
          background: linear-gradient(135deg, #f5f7ff 0%, #f8faff 100%);
        }

        .dfp-cours-section-premium {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .dfp-section-header-premium {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          padding: 20px 24px;
          color: white;
        }

        .dfp-section-title-premium {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .dfp-title-icon-premium {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .dfp-cours-table-premium {
          background: white;
        }

        .dfp-table-header-premium {
          display: grid;
          grid-template-columns: 2fr 100px 100px 120px 100px 150px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-bottom: 2px solid #e2e8f0;
        }

        .dfp-header-cell-premium {
          padding: 16px 12px;
          font-weight: 700;
          color: #475569;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dfp-center-header-premium {
          text-align: center;
        }

        .dfp-table-body-premium {
          background: white;
        }

        .dfp-row-premium {
          display: grid;
          grid-template-columns: 2fr 100px 100px 120px 100px 150px;
          transition: all 0.3s ease;
          border-bottom: 1px solid #f8fafc;
          position: relative;
        }

        .dfp-row-premium:hover {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .dfp-danger-row-premium {
          border-left: 4px solid #ef4444;
          background: linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%);
        }

        .dfp-danger-row-premium:hover {
          background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
        }

        .dfp-normal-row-premium {
          border-left: 4px solid transparent;
        }

        .dfp-cell-premium {
          padding: 16px 12px;
          display: flex;
          align-items: center;
        }

        .dfp-course-info-premium {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dfp-course-title-premium {
          font-weight: 600;
          color: #1e293b;
          font-size: 16px;
        }

        .dfp-alert-badge-premium {
          display: flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          width: fit-content;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
        }

        .dfp-number-cell-premium {
          justify-content: center;
        }

        .dfp-badge-number-premium {
          padding: 8px 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-width: 40px;
          text-align: center;
        }

        .dfp-badge-primary-premium {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .dfp-badge-success-premium {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .dfp-badge-danger-premium {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .dfp-amount-display-premium {
          font-weight: 700;
          color: #059669;
          font-size: 16px;
          text-shadow: 0 1px 2px rgba(5, 150, 105, 0.2);
        }

        .dfp-percentage-badge-premium {
          padding: 6px 10px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .dfp-perc-excellent-premium {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .dfp-perc-good-premium {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .dfp-perc-average-premium {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .dfp-perc-poor-premium {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .dfp-progress-cell-premium {
          gap: 8px;
        }

        .dfp-progress-premium {
          flex: 1;
          height: 8px;
          background: #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dfp-progress-fill-premium {
          height: 100%;
          transition: all 0.5s ease;
          border-radius: 6px;
        }

        .dfp-fill-success-premium {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .dfp-fill-danger-premium {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .dfp-progress-label-premium {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          min-width: 32px;
        }

        .dfp-modal-footer {
          padding: 24px 32px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          border-radius: 0 0 20px 20px;
          display: flex;
          justify-content: center;
        }

        .dfp-btn-primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .dfp-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        /* Body moderne */
.table-body-modern {
  max-height: 420px;
  overflow-y: auto;
}

/* Lignes modernes */
.row-modern {
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 90px 80px 100px 70px 120px;
  border-bottom: 1px solid #f8fafc;
  transition: all 0.15s ease;
}

.normal-row {
  background: #ffffff;
}

.normal-row:hover {
  background: #f8fafc;
  box-shadow: inset 3px 0 0 #3b82f6;
}

.danger-row {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.03) 0%, rgba(255, 255, 255, 1) 100%);
  border-left: 3px solid #ef4444;
}

.danger-row:hover {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.06) 0%, rgba(255, 255, 255, 1) 100%);
  box-shadow: inset 5px 0 0 #ef4444;
}

/* Cellules modernes */
.cell-modern {
  padding: 1rem 0.75rem;
  border-right: 1px solid #f8fafc;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  line-height: 1.25;
}

.cell-modern:last-child {
  border-right: none;
}

/* Nom du cours */
.cours-name-modern {
  flex-direction: column;
  align-items: flex-start;
}

.course-info {
  width: 100%;
}

.course-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
  margin-bottom: 0.25rem;
}

.alert-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Professeur */
.professor-modern {
  color: #64748b;
}

.prof-list {
  font-weight: 500;
  line-height: 1.3;
}

.unassigned {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.8rem;
}

/* Cellules numériques */
.number-cell {
  justify-content: center;
}

.badge-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  border-radius: 14px;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  text-align: center;
}

.badge-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.3);
}

.badge-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 1px 2px rgba(239, 68, 68, 0.3);
}

.badge-success {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 1px 2px rgba(16, 185, 129, 0.3);
}

/* Montant */
.amount-display {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

/* Pourcentages */
.percentage-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 24px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.perc-excellent {
  background: linear-gradient(135deg, #059669, #047857);
}

.perc-good {
  background: linear-gradient(135deg, #0891b2, #0e7490);
}

.perc-average {
  background: linear-gradient(135deg, #d97706, #b45309);
}

.perc-poor {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

/* Progression moderne */
.progress-cell-modern {
  flex-direction: column;
  gap: 0.25rem;
  justify-content: center;
}

.progress-modern {
  width: 80px;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.fill-success {
  background: linear-gradient(90deg, #10b981, #059669);
}

.fill-danger {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-align: center;
}

/* Scrollbar personnalisée */
.table-body-modern::-webkit-scrollbar {
  width: 5px;
}

.table-body-modern::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 2px;
}

.table-body-modern::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.table-body-modern::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive */
@media (max-width: 1200px) {
  .table-header-modern,
  .row-modern {
    grid-template-columns: 2fr 1.2fr 80px 70px 90px 60px 100px;
  }
  
  .cell-modern {
    padding: 0.875rem 0.5rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .cours-modern-table {
    border-radius: 8px;
  }
  
  .table-header-modern {
    display: none;
  }
  
  .row-modern {
    display: block;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .cell-modern {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
    padding: 0.5rem 0;
  }
  
  .cell-modern:last-child {
    border-bottom: none;
  }
  
  .cell-modern:before {
    content: attr(data-label);
    font-weight: 600;
    color: #64748b;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
}

        /* Loading */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .loading-content {
          text-align: center;
          padding: 2rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 1.25rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .loading-subtext {
          color: #64748b;
        }

        /* Header ameliore */
        .dashboard-header {
          color: black;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%);
          padding: 0 1.5rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          gap: 2rem;
        }

        .header-info h1 {
          font-size: 1.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .header-stats {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
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

        .header-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .filters-container {
          display: flex;
          gap: 0.75rem;
        }

        .filter-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          font-size: 0.875rem;
          cursor: pointer;
          min-width: 140px;
        }

        .filter-select:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }

        .filter-select option {
        }

        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .btn-refresh:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* Navigation par onglets */
        .tabs-navigation {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          gap: 0.5rem;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }

        .tab-btn.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
          background: #f8fafc;
        }

        .tab-btn:hover {
          color: #2563eb;
          background: #f8fafc;
        }

        /* Main Content */
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

        /* Statistics Section amelioree */
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

        .stat-card:hover::before {
          transform: translate(20px, -20px) scale(1.2);
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
          border-left-color: #7c3aed; 
        }
        .stat-card.purple::before { background: #7c3aed; }

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
        .stat-card.purple .stat-icon { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
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

        /* Section Titles */
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

        /* Formation Overview Cards */
        .formation-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .formation-card {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
          cursor: pointer;
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
        }

        .formation-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
        }

        .formation-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border-color: #e2e8f0;
        }

        .formation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .formation-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .formation-badge {
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }

        .formation-badge.blue { background: #2563eb; }
        .formation-badge.purple { background: #7c3aed; }
        .formation-badge.gray { background: #6b7280; }

        .formation-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .formation-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .formation-stat .label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .formation-stat .value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
        }

        .formation-progress {
          width: 100%;
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        /* Tables ameliorees */
        .table-container {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
        }

        .analysis-table {
          width: 100%;
          border-collapse: collapse;
        }

        .analysis-table th {
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
        }

        .analysis-table td {
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .analysis-table tbody tr {
          transition: all 0.2s;
        }

        .analysis-table tbody tr:hover {
          background: #f8fafc;
          transform: scale(1.005);
        }

        .niveau-name,
        .filiere-name,
        .annee-name,
        .pays-name {
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .specialites-info {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
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
        .badge.purple { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
        .badge.orange { background: linear-gradient(135deg, #ea580c, #dc2626); }
        .badge.red { background: linear-gradient(135deg, #dc2626, #b91c1c); }

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

        .percentage {
          font-size: 0.75rem;
          color: #64748b;
          margin-left: 0.25rem;
        }


        .btn-action {
          background: linear-gradient(135deg, #4f46e5, #3730a3);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-action:hover {
          background: linear-gradient(135deg, #3730a3, #312e81);
          transform: translateY(-1px);
        }

        /* Cycles Grid */
        .cycles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .cycle-card {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
          cursor: pointer;
          border: 1px solid #f1f5f9;
        }

        .cycle-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .cycle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .cycle-header h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
        }

        .cycle-count {
          background: #2563eb;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .cycle-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .metric {
          text-align: center;
        }

        .metric-label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .metric-value {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }

        /* Graphiques d'analyse */
.charts-section {
  margin-top: 2rem;
}

.charts-grid-extended {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

@media (max-width: 1024px) {
  .charts-grid-extended,
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

.chart-card.large {
  grid-column: span 1;
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

/* Modals ameliorees */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.welcome-modal {
  max-width: 800px;
}

.detail-modal {
  max-width: 1400px;
}

.modal-header {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 2rem;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Welcome Modal Content */
.welcome-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.welcome-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .welcome-stats {
    grid-template-columns: 1fr;
  }
}

.welcome-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.welcome-stat-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  z-index: 1;
}

.welcome-stat-icon.blue { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
.welcome-stat-icon.green { background: linear-gradient(135deg, #059669, #047857); }
.welcome-stat-icon.purple { background: linear-gradient(135deg, #7c3aed, #6d28d9); }

.welcome-stat-info h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.welcome-stat-info p {
  color: #64748b;
  font-weight: 500;
}

.welcome-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.formations-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.formation-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.formation-summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.formation-summary-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.formation-summary-details {
  font-size: 0.875rem;
  color: #64748b;
}

.formation-summary-ca {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.welcome-features {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.welcome-features h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.welcome-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.welcome-features li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: #64748b;
  font-size: 0.875rem;
}

.welcome-features li::before {
  content: '"¨';
  font-size: 1rem;
}

/* Detail Modal Content */
.search-container {
  margin-bottom: 1.5rem;
}

.search-input-container {
  position: relative;
  max-width: 400px;
}

.search-input-container svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.students-count {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.students-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1;
}

.students-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.students-table tbody tr:hover {
  background: #f9fafb;
}

.inactive-student {
  opacity: 0.6;
  background: #fafafa;
}

.student-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-name strong {
  color: #1e293b;
  font-weight: 600;
}

.student-name small {
  color: #64748b;
  font-size: 0.75rem;
}

.formation-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.formation-info .niveau {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.formation-info .cycle {
  font-size: 0.75rem;
  color: #64748b;
}

.filiere-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filiere-info .filiere {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.filiere-info .specialite {
  font-size: 0.75rem;
  color: #64748b;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.payment-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.payment-status.paid {
  background: #dcfce7;
  color: #166534;
}

.payment-status.unpaid {
  background: #fee2e2;
  color: #991b1b;
}

.amount {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.country-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.country-flags {
  display: flex;
  gap: 0.5rem;
}

.flag {
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
}

.flag.resident {
  background: #ddd6fe;
  color: #5b21b6;
}

.flag.fonctionnaire {
  background: #fed7d7;
  color: #c53030;
}

.modal-stats {
  display: flex;
  gap: 2rem;
  font-size: 0.875rem;
  color: #64748b;
}

.modal-stats span {
  font-weight: 600;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-grid > *,
.formation-overview > *,
.cycles-grid > * {
  animation: slideIn 0.5s ease-out;
}

.stats-grid > *:nth-child(1) { animation-delay: 0.1s; }
.stats-grid > *:nth-child(2) { animation-delay: 0.2s; }
.stats-grid > *:nth-child(3) { animation-delay: 0.3s; }
.stats-grid > *:nth-child(4) { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
};

export default EnhancedDashboard;