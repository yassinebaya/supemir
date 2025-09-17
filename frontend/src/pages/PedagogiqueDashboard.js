import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import Sidebar from '../components/Sidebar';
import {
  Users, GraduationCap, TrendingUp, Award, 
  BarChart3, PieChart as PieChartIcon, RefreshCw, 
  ChevronDown, ChevronUp, Home, Calendar, BookOpen,
  Filter, Search, X
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#6b7280', '#1d4ed8', '#059669', '#4b5563', '#f59e0b', '#ef4444', '#8b5cf6'];

const PedagogiqueDashboard = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cours, setCours] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [stats, setStats] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  
  // Filtres complets pour le dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [filtreAnneeScolaire, setFiltreAnneeScolaire] = useState('2025/2026');
  const [filtreNiveau, setFiltreNiveau] = useState('tous');
  const [filtreSpecialite, setFiltreSpecialite] = useState('toutes');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

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
          estGeneral: payload.filiere === 'GENERAL'
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

      const [etudiantsRes, coursRes, professeursRes, statsRes] = await Promise.all([
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
        })
      ]);

      if (!etudiantsRes.ok || !coursRes.ok || !professeursRes.ok || !statsRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const [etudiantsData, coursData, professeursData, statsData] = await Promise.all([
        etudiantsRes.json(),
        coursRes.json(),
        professeursRes.json(),
        statsRes.json()
      ]);

      setEtudiants(etudiantsData);
      setCours(coursData);
      setProfesseurs(professeursData);
      setStats(statsData);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage avec tous les filtres
  const getFilteredEtudiants = () => {
    let filtered = [...etudiants];

    // Filtre par recherche textuelle
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        (e.nom && e.nom.toLowerCase().includes(search)) ||
        (e.prenom && e.prenom.toLowerCase().includes(search)) ||
        (e.filiere && e.filiere.toLowerCase().includes(search)) ||
        (e.cin && e.cin.toLowerCase().includes(search))
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

    return filtered;
  };

  const etudiantsFiltres = getFilteredEtudiants();

  // Statistiques basées sur les données filtrées
  const statsGeneralesFiltered = {
    totalEtudiants: etudiantsFiltres.length,
    etudiantsActifs: etudiantsFiltres.filter(e => e.actif).length,
    nouveauxEtudiants: etudiantsFiltres.filter(e => e.nouvelleInscription).length,
  };

  // Analyse par type de formation basée sur les données filtrées
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
      total: data.etudiants.length
    }));
  };

  // Analyse par niveau basée sur les données filtrées
  const analyseParNiveau = () => {
    const niveauxStats = {};
    
    etudiantsFiltres.forEach(e => {
      const niveau = e.niveau || 'Non défini';
      if (!niveauxStats[niveau]) {
        niveauxStats[niveau] = { total: 0 };
      }
      niveauxStats[niveau].total += 1;
    });

    return Object.entries(niveauxStats).map(([niveau, data]) => ({
      niveau: `Niveau ${niveau}`,
      ...data
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
          total: 0
        };
      }
      
      specialitesStats[cleUnique].total += 1;
    });

    return Object.values(specialitesStats).map(data => ({
      ...data,
      specialite: data.specialite.length > 40 ? data.specialite.substring(0, 40) + '...' : data.specialite
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
        anneesStats[annee] = { total: 0 };
      }
      anneesStats[annee].total += 1;
    });

    return Object.entries(anneesStats).map(([annee, data]) => ({
      annee,
      ...data
    })).sort((a, b) => b.annee.localeCompare(a.annee));
  };

  // Analyse par filière (pour vue générale)
  const analyseParFiliere = () => {
    const filieres = {};
    
    etudiantsFiltres.forEach(e => {
      const filiere = e.filiere || 'Non définie';
      if (!filieres[filiere]) {
        filieres[filiere] = { total: 0 };
      }
      filieres[filiere].total += 1;
    });

    return Object.entries(filieres).map(([filiere, data]) => ({
      filiere,
      ...data
    })).sort((a, b) => b.total - a.total);
  };

  const formationTypesData = analyseParTypeFormation();
  const niveauxData = analyseParNiveau();
  const specialitesData = analyseParSpecialite();
  const anneesData = analyseParAnneeScolaire();
  const filieresData = analyseParFiliere();

  // Obtenir les valeurs uniques pour les filtres
  const anneesDisponibles = [...new Set(etudiants.map(e => e.anneeScolaire).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const niveauxDisponibles = [...new Set(etudiants.map(e => e.niveau).filter(n => n !== undefined))].sort((a, b) => a - b);
  const specialitesDisponibles = [...new Set(etudiants.map(e => {
    return e.specialiteIngenieur || e.specialiteLicencePro || e.specialiteMasterPro || e.specialite;
  }).filter(Boolean))];

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFiltreAnneeScolaire(anneesDisponibles[0] || 'toutes');
    setFiltreNiveau('tous');
    setFiltreSpecialite('toutes');
  };

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
        <div className="loading-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-btn">
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleLogout} />

      {/* Bouton toggle header */}
      <button 
        className="header-toggle-btn"
        onClick={() => setHeaderVisible(!headerVisible)}
        title={headerVisible ? "Masquer l'en-tête" : "Afficher l'en-tête"}
      >
        {headerVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Header */}
      {headerVisible && (
        <header className="dashboard-header">
          <div className="header-container">
            <h1>Dashboard Pédagogique - {userInfo?.filiere === 'GENERAL' ? 'GÉNÉRAL' : userInfo?.filiere || stats?.filiere}</h1>
            <div className="header-stats">
              <span>{statsGeneralesFiltered.totalEtudiants} étudiants</span>
              <span>{cours.length} cours</span>
              <span>{professeurs.length} professeurs</span>
            </div>
            
            {/* Filtres complets */}
            <div className="dashboard-filters">
              <div className="search-container">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="dashboard-search"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="clear-search">
                    <X size={14} />
                  </button>
                )}
              </div>
              
              <select 
                value={filtreAnneeScolaire} 
                onChange={(e) => setFiltreAnneeScolaire(e.target.value)} 
                className="dashboard-select"
              >
                <option value="toutes">Toutes les années</option>
                {anneesDisponibles.map(annee => (
                  <option key={annee} value={annee}>{annee}</option>
                ))}
              </select>

              <select 
                value={filtreNiveau} 
                onChange={(e) => setFiltreNiveau(e.target.value)} 
                className="dashboard-select"
              >
                <option value="tous">Tous niveaux</option>
                {niveauxDisponibles.map(niveau => (
                  <option key={niveau} value={niveau}>Niveau {niveau}</option>
                ))}
              </select>

              <select 
                value={filtreSpecialite} 
                onChange={(e) => setFiltreSpecialite(e.target.value)} 
                className="dashboard-select"
              >
                <option value="toutes">Toutes spécialités</option>
                {specialitesDisponibles.map(specialite => (
                  <option key={specialite} value={specialite}>
                    {specialite.length > 30 ? specialite.substring(0, 30) + '...' : specialite}
                  </option>
                ))}
              </select>

              <button onClick={resetFilters} className="dashboard-reset-btn">
                <RefreshCw size={16} />
                Reset
              </button>
            </div>

            {/* Indicateur de filtrage */}
            {(filtreAnneeScolaire !== 'toutes' || filtreNiveau !== 'tous' || filtreSpecialite !== 'toutes' || searchTerm) && (
              <div className="filter-indicator">
                Données filtrées - {statsGeneralesFiltered.totalEtudiants} résultats trouvés
              </div>
            )}
          </div>
        </header>
      )}

      <div className="dashboard-content">
        {/* Statistiques principales */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>{statsGeneralesFiltered.totalEtudiants}</h3>
              <p>Total Étudiants</p>
              <span className="stat-detail">Dont {statsGeneralesFiltered.etudiantsActifs} actifs</span>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">
              <GraduationCap size={24} />
            </div>
            <div className="stat-content">
              <h3>{cours.length}</h3>
              <p>Cours</p>
              <span className="stat-detail">Disponibles</span>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>{professeurs.length}</h3>
              <p>Professeurs</p>
              <span className="stat-detail">Équipe pédagogique</span>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">
              <Award size={24} />
            </div>
            <div className="stat-content">
              <h3>{statsGeneralesFiltered.nouveauxEtudiants}</h3>
              <p>Nouvelles Inscriptions</p>
              <span className="stat-detail">Cette année</span>
            </div>
          </div>
        </div>

        {/* Graphiques principaux */}
        <div className="charts-section">
          <div className="charts-grid">
            <div className="chart-card">
              <h3>
                <PieChartIcon size={20} />
                Répartition par Type de Formation
              </h3>
              {formationTypesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={formationTypesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="total"
                      label={({label, total}) => `${label}: ${total}`}
                    >
                      {formationTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} étudiants`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">Aucune donnée à afficher</div>
              )}
            </div>

            <div className="chart-card">
              <h3>
                <BarChart3 size={20} />
                Répartition par Niveau
              </h3>
              {niveauxData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={niveauxData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="niveau" stroke="#64748b" />
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

            {userInfo?.filiere === 'GENERAL' && (
              <div className="chart-card">
                <h3>
                  <BarChart3 size={20} />
                  Répartition par Filière
                </h3>
                {filieresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={filieresData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="filiere" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#2563eb" name="Total Étudiants" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data">Aucune donnée à afficher</div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Types de formation en cartes */}
        <div className="formation-types-section">
          <h2 className="section-title">
            <Award size={24} />
            Détails par Type de Formation
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analyses détaillées sous forme de tableaux */}
        <div className="analysis-tables-section">
          <h2 className="section-title">
            <BarChart3 size={24} />
            Analyses Détaillées
          </h2>

          <div className="tables-grid">
            {/* Table par Niveau */}
            <div className="analysis-table-card">
              <h3>Analyse par Niveau</h3>
              <div className="table-container">
                {niveauxData.length > 0 ? (
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Niveau</th>
                        <th>Étudiants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {niveauxData.map((niveau, index) => (
                        <tr key={index}>
                          <td className="niveau-name">{niveau.niveau}</td>
                          <td><span className="badge blue">{niveau.total}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data-table">Aucune donnée</div>
                )}
              </div>
            </div>

            {/* Table par Spécialité */}
            <div className="analysis-table-card">
              <h3>Analyse par Spécialité</h3>
              <div className="table-container">
                {specialitesData.length > 0 ? (
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Spécialité</th>
                        <th>Étudiants</th>
                        <th>Payés</th>
                        <th>CA Total</th>
                        <th>Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specialitesData.map((spec, index) => (
                        <tr key={index}>
                          <td>
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
                  <div className="no-data-table">Aucune donnée</div>
                )}
              </div>
            </div>

            {/* Table par Année Scolaire */}
            <div className="analysis-table-card">
              <h3>Analyse par Année Scolaire</h3>
              <div className="table-container">
                {anneesData.length > 0 ? (
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Année Scolaire</th>
                        <th>Étudiants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anneesData.map((annee, index) => (
                        <tr key={index}>
                          <td className="annee-name">{annee.annee}</td>
                          <td><span className="badge blue">{annee.total}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data-table">Aucune donnée</div>
                )}
              </div>
            </div>

            {/* Table par Filière (si vue générale) */}
            {userInfo?.filiere === 'GENERAL' && (
              <div className="analysis-table-card">
                <h3>Analyse par Filière</h3>
                <div className="table-container">
                  {filieresData.length > 0 ? (
                    <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Filière</th>
                        <th>Étudiants</th>
                      </tr>
                    </thead>
                      <tbody>
                        {filieresData.map((filiere, index) => (
                          <tr key={index}>
                            <td className="filiere-name">{filiere.filiere}</td>
                            <td><span className="badge blue">{filiere.total}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-data-table">Aucune donnée</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section spéciale pour vue générale */}
     
      </div>

      <style jsx>{`
        .dashboard {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%);
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

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
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        }

        .header-toggle-btn:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: scale(1.05);
        }

        .dashboard-header {
          background: white;
          border-bottom: 3px solid #3b82f6;
          padding: 1.5rem 0;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          text-align: center;
        }

        .dashboard-header h1 {
          font-size: 1.75rem;
          color: #1f2937;
          margin: 0 0 1rem 0;
          font-weight: 700;
        }

        .header-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .header-stats span {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
        }

        .dashboard-filters {
          display: flex;
          justify-content: center;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-container svg {
          position: absolute;
          left: 0.75rem;
          color: #10b981;
          z-index: 1;
        }

        .dashboard-search {
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 2px solid #10b981;
          border-radius: 8px;
          font-size: 0.875rem;
          min-width: 250px;
          outline: none;
          transition: all 0.3s ease;
        }

        .dashboard-search:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: #10b981;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .clear-search:hover {
          background: #f0fdf4;
        }

        .dashboard-select {
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

        .dashboard-select:focus {
          border-color: #4b5563;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .dashboard-reset-btn {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dashboard-reset-btn:hover {
          background: linear-gradient(135deg, #d97706, #b45309);
          transform: translateY(-1px);
        }

        .filter-indicator {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          font-size: 0.875rem;
          text-align: center;
          margin-top: 1rem;
          font-weight: 600;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          border: 2px solid #e5e7eb;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
        }

        .stat-card.blue::before { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .stat-card.green::before { background: linear-gradient(135deg, #10b981, #059669); }
        .stat-card.orange::before { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .stat-card.purple::before { background: linear-gradient(135deg, #6b7280, #4b5563); }

        .stat-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1rem auto;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .stat-card.blue .stat-icon { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .stat-card.green .stat-icon { background: linear-gradient(135deg, #10b981, #059669); }
        .stat-card.orange .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .stat-card.purple .stat-icon { background: linear-gradient(135deg, #6b7280, #4b5563); }

        .stat-content h3 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .stat-card.blue .stat-content h3 { color: #3b82f6; }
        .stat-card.green .stat-content h3 { color: #10b981; }
        .stat-card.orange .stat-content h3 { color: #f59e0b; }
        .stat-card.purple .stat-content h3 { color: #6b7280; }

        .stat-content p {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .stat-detail {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

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
          padding: 2rem;
          border-radius: 16px;
          border: 2px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .chart-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.15);
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

        .formation-types-section {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 2rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: center;
          justify-content: center;
        }

        .formation-types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
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
        }

        .formation-type-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
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
          grid-template-columns: 1fr;
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

        /* Nouvelles sections d'analyse */
        .analysis-tables-section {
          margin-bottom: 3rem;
        }

        .tables-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 2rem;
        }

        .analysis-table-card {
          background: white;
          border-radius: 16px;
          border: 2px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .analysis-table-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.15);
        }

        .analysis-table-card h3 {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 1rem;
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
        }

        .table-container {
          overflow-x: auto;
          max-height: 400px;
          overflow-y: auto;
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

        .analysis-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 450px;
        }

        .analysis-table th {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          color: #1f2937;
          padding: 0.75rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.875rem;
          border-bottom: 2px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .analysis-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .analysis-table tbody tr:hover {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          text-align: center;
          min-width: 2rem;
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
          font-size: 0.875rem;
        }

        .rate {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
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

        .formation-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }

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

        .niveau-name,
        .specialite-name,
        .annee-name,
        .filiere-name {
          font-weight: 700;
          color: #1f2937;
        }

        .no-data-table {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
          font-weight: 600;
        }

        .filiere-section {
          margin-bottom: 3rem;
        }

        .filiere-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .filiere-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 2px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-align: center;
        }

        .filiere-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
        }

        .filiere-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 1.5rem 0;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 0.5rem;
        }

        .filiere-stats {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .filiere-stat {
          padding: 1rem;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border-radius: 12px;
          border: 1px solid #3b82f6;
        }

        .filiere-stat .value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 0.25rem;
        }

        .filiere-stat .label {
          font-size: 0.75rem;
          color: #1f2937;
          font-weight: 600;
          text-transform: uppercase;
        }

        .no-data {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e5e7eb;
          border-left: 4px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .retry-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 1rem;
          transition: all 0.3s ease;
        }

        .retry-btn:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .header-stats {
            gap: 1rem;
          }

          .header-stats span {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
          }

          .dashboard-filters {
            flex-direction: column;
            gap: 0.75rem;
          }

          .dashboard-search,
          .dashboard-select {
            min-width: 200px;
            width: 100%;
            max-width: 300px;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .tables-grid {
            grid-template-columns: 1fr;
          }

          .formation-types-grid {
            grid-template-columns: 1fr;
          }

          .formation-type-stats {
            grid-template-columns: 1fr;
          }

          .dashboard-content {
            padding: 1rem;
          }

          .analysis-table {
            min-width: 350px;
          }

          .analysis-table th,
          .analysis-table td {
            padding: 0.5rem;
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .stat-card {
            padding: 1.5rem;
          }

          .stat-icon {
            width: 3rem;
            height: 3rem;
          }

          .stat-content h3 {
            font-size: 1.5rem;
          }

          .formation-type-card {
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

          .dashboard-filters {
            padding: 0 0.5rem;
          }

          .dashboard-search,
          .dashboard-select {
            min-width: 150px;
          }

          .analysis-table {
            min-width: 300px;
          }

          .badge {
            padding: 0.125rem 0.5rem;
            font-size: 0.625rem;
          }

          .chart-card {
            padding: 1rem;
          }

          .chart-card h3 {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PedagogiqueDashboard;