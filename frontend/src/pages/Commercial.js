import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CreditCard, 
  GraduationCap,
  UserCheck,
  Clock,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Award,
  BarChart2,
  User,
  Globe
} from "lucide-react";
import Sidebar from '../components/SidebarCommercial';

const handleLogout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
  }
  window.location.href = '/';
};

const DashboardCommercial = () => {
  const [stats, setStats] = useState({
    totalEtudiants: 0,
    nouveauxEtudiants: 0,
    etudiantsActifs: 0,
    etudiantsInactifs: 0,
    etudiantsPayes: 0,
    etudiantsNonPayes: 0,
    repartitionGenre: { hommes: 0, femmes: 0 },
    repartitionTypeFormation: {},
    repartitionNiveau: {},
    repartitionAnneeScolaire: {},
    evolutionAnneeScolaire: [],
    chiffreAffaire: 0,
    topCommerciaux: [],
    etudiantsRecents: [],
    tauxConversion: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anneeScolaire, setAnneeScolaire] = useState('');
  const [anneesScolairesDisponibles, setAnneesScolairesDisponibles] = useState([]);
  const [vuePersonnelle, setVuePersonnelle] = useState(false); // true = personnel, false = général

  // Fonction pour générer l'année scolaire actuelle
  const getAnneeScolaireActuelle = () => {
    const now = new Date();
    const anneeActuelle = now.getFullYear();
    const mois = now.getMonth() + 1;
    
    if (mois >= 9) {
      return `${anneeActuelle}/${anneeActuelle + 1}`;
    } else {
      return `${anneeActuelle - 1}/${anneeActuelle}`;
    }
  };

  // Générer les années scolaires disponibles
  useEffect(() => {
    const generateAnneesScolaires = () => {
      const annees = [];
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Déterminer l'année scolaire actuelle
      let startYear = currentMonth >= 9 ? currentYear : currentYear - 1;
      
      // Générer les 10 dernières années scolaires
      for (let i = 0; i < 10; i++) {
        const year = startYear - i;
        annees.push(`${year}/${year + 1}`);
      }
      
      return annees;
    };
    
    const annees = generateAnneesScolaires();
    setAnneesScolairesDisponibles(annees);
    
    // Définir l'année scolaire actuelle par défaut
    const anneeScolaireActuelle = getAnneeScolaireActuelle();
    setAnneeScolaire(anneeScolaireActuelle);
  }, []);

  useEffect(() => {
    if (anneeScolaire) {
      fetchStats();
    }
  }, [anneeScolaire, vuePersonnelle]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const params = {};
      if (anneeScolaire) params.anneeScolaire = anneeScolaire;
      
      // Ajouter le paramètre pour vue personnelle
      if (vuePersonnelle) {
        params.personnel = 'true';
      }
      
      const res = await fetch('http://localhost:5000/api/comercial/stats?' + new URLSearchParams(params), {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000)
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setStats({
        totalEtudiants: data.totalEtudiants || 0,
        nouveauxEtudiants: data.nouveauxEtudiants || 0,
        etudiantsActifs: data.etudiantsActifs || 0,
        etudiantsInactifs: data.etudiantsInactifs || 0,
        etudiantsPayes: data.etudiantsPayes || 0,
        etudiantsNonPayes: data.etudiantsNonPayes || 0,
        repartitionGenre: data.repartitionGenre || { hommes: 0, femmes: 0 },
        repartitionTypeFormation: data.repartitionTypeFormation || {},
        repartitionNiveau: data.repartitionNiveau || {},
        repartitionAnneeScolaire: data.repartitionAnneeScolaire || {},
        evolutionAnneeScolaire: Array.isArray(data.evolutionAnneeScolaire) ? data.evolutionAnneeScolaire : [],
        chiffreAffaire: data.chiffreAffaire || 0,
        topCommerciaux: Array.isArray(data.topCommerciaux) ? data.topCommerciaux : [],
        etudiantsRecents: Array.isArray(data.etudiantsRecents) ? data.etudiantsRecents : [],
        tauxConversion: data.tauxConversion || 0
      });
      
    } catch (err) {
      console.error('Erreur lors de la récupération des stats:', err);
      
      if (err.message.includes('401')) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.message.includes('403')) {
        setError('Accès non autorisé.');
      } else if (err.name === 'AbortError') {
        setError('Délai d\'attente dépassé. Veuillez réessayer.');
      } else if (!navigator.onLine) {
        setError('Pas de connexion internet.');
      } else {
        setError('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatNombre = (nombre) => {
    if (nombre == null || isNaN(nombre)) return '0';
    return new Intl.NumberFormat('fr-FR').format(nombre);
  };

  const formatCurrency = (montant) => {
    if (montant == null || isNaN(montant)) return '0 MAD';
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getTypeFormationLabel = (type) => {
    const labels = {
      'CYCLE_INGENIEUR': 'Cycle Ingénieur',
      'LICENCE_PRO': 'Licence Professionnelle',
      'MASTER_PRO': 'Master Professionnel',
      'MASI': 'MASI',
      'IRM': 'IRM'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="loading-container">        
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Chargement des statistiques...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <AlertCircle className="error-icon" />
          <h2 className="error-title">Erreur</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button onClick={fetchStats} className="error-btn primary">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
    }}> 
      <Sidebar onLogout={handleLogout} />

      <div className="dashboard-header">
        <div className="container">
          <div className="header-content" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            textAlign: 'center'
          }}>
            <div className="header-info">
              <h1 style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0
              }}>
                Tableau de bord commercial
              </h1>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {/* Boutons Personnel/Général */}
              <div style={{
                display: 'flex',
                gap: '8px',
                backgroundColor: 'white',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                <button
                  onClick={() => setVuePersonnelle(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: !vuePersonnelle ? 'var(--primary-blue)' : 'transparent',
                    color: !vuePersonnelle ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  <Globe size={16} />
                  Général
                </button>
                <button
                  onClick={() => setVuePersonnelle(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: vuePersonnelle ? 'var(--primary-green)' : 'transparent',
                    color: vuePersonnelle ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  <User size={16} />
                  Personnel
                </button>
              </div>
              
              {/* Sélecteur d'année scolaire */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <label style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)'}}>
                  Année scolaire:
                </label>
                <select 
                  value={anneeScolaire} 
                  onChange={(e) => setAnneeScolaire(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'white'
                  }}
                >
                  {anneesScolairesDisponibles.map(annee => (
                    <option key={annee} value={annee}>{annee}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Indicateur de vue actuelle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: vuePersonnelle ? '#f0f9ff' : '#f9fafb',
              borderRadius: '8px',
              border: `1px solid ${vuePersonnelle ? '#3b82f6' : '#e5e7eb'}`,
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              {vuePersonnelle ? (
                <>
                  <User size={16} style={{color: 'var(--primary-green)'}} />
                  Vos statistiques personnelles
                </>
              ) : (
                <>
                  <Globe size={16} style={{color: 'var(--primary-blue)'}} />
                  Statistiques générales de l'école
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-container">
        <div className="dashboard-content">
          {/* Cartes de statistiques */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <div className="stat-card-title">
                    {vuePersonnelle ? 'Mes étudiants' : 'Étudiants total'}
                  </div>
                  <div className="stat-card-value">{formatNombre(stats.totalEtudiants)}</div>
                  <div className="stat-card-subtitle">Année {anneeScolaire}</div>
                </div>
                <div className="stat-card-icon">
                  <Users />
                </div>
              </div>
            </div>
            
            <div className="stat-card green">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <div className="stat-card-title">
                    {vuePersonnelle ? 'Mes étudiants actifs' : 'Étudiants actifs'}
                  </div>
                  <div className="stat-card-value">{formatNombre(stats.etudiantsActifs)}</div>
                  <div className="stat-card-subtitle">Année {anneeScolaire}</div>
                </div>
                <div className="stat-card-icon">
                  <UserCheck />
                </div>
              </div>
            </div>
            
            <div className="stat-card purple">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <div className="stat-card-title">
                    {vuePersonnelle ? 'Mon chiffre d\'affaires' : 'Chiffre d\'affaires'}
                  </div>
                  <div className="stat-card-value">{formatCurrency(stats.chiffreAffaire)}</div>
                  <div className="stat-card-subtitle">Année {anneeScolaire}</div>
                </div>
                <div className="stat-card-icon">
                  <DollarSign />
                </div>
              </div>
            </div>
            
            <div className="stat-card yellow">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <div className="stat-card-title">
                    {vuePersonnelle ? 'Mon taux de paiement' : 'Taux de paiement'}
                  </div>
                  <div className="stat-card-value">{stats.tauxConversion}%</div>
                  <div className="stat-card-subtitle">
                    {formatNombre(stats.etudiantsPayes)}/{formatNombre(stats.totalEtudiants)} payés
                  </div>
                </div>
                <div className="stat-card-icon">
                  <TrendingUp />
                </div>
              </div>
            </div>
          </div>
          
          {/* Graphiques */}
          <div className="charts-grid">
            {/* Répartition par type de formation */}
            <div className="chart-card">
              <div className="chart-header">
                <GraduationCap size={20} />
                <h3>
                  {vuePersonnelle ? 'Mes étudiants par formation' : 'Répartition par type de formation'}
                </h3>
              </div>
              
              {Object.keys(stats.repartitionTypeFormation).length > 0 ? (
                <div style={{marginTop: '24px'}}>
                  {Object.entries(stats.repartitionTypeFormation).map(([type, count]) => {
                    const percentage = stats.totalEtudiants > 0 
                      ? Math.round((count / stats.totalEtudiants) * 100) 
                      : 0;
                    return (
                      <div key={type} style={{marginBottom: '16px'}}>
                        <div style={{
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '8px',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                            {getTypeFormationLabel(type)}
                          </span>
                          <span style={{color: 'var(--text-secondary)'}}>{count} ({percentage}%)</span>
                        </div>
                        <div style={{
                          width: '100%', 
                          height: '8px', 
                          backgroundColor: '#F3F4F6', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div 
                            style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: vuePersonnelle ? 'var(--primary-green)' : 'var(--primary-blue)',
                              borderRadius: '4px',
                              transition: 'width 0.5s ease'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="chart-empty">
                  <GraduationCap size={48} />
                  <h4>Aucune donnée disponible</h4>
                  <p>Les données de formations apparaîtront ici</p>
                </div>
              )}
            </div>
            
            {/* Évolution par année scolaire */}
            <div className="chart-card">
              <div className="chart-header">
                <BarChart2 size={20} />
                <h3>
                  {vuePersonnelle ? 'Mon évolution par année' : 'Évolution par année scolaire'}
                </h3>
              </div>
              
              {stats.evolutionAnneeScolaire.length > 0 ? (
                <div style={{height: '300px', marginTop: '24px'}}>
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'end',
                    gap: '8px',
                    padding: '20px 0'
                  }}>
                    {stats.evolutionAnneeScolaire.map((item, index) => {
                      const maxValue = Math.max(...stats.evolutionAnneeScolaire.map(i => i.count || 0));
                      const height = maxValue > 0 ? ((item.count || 0) / maxValue) * 100 : 0;
                      
                      return (
                        <div key={index} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '8px',
                            fontWeight: '600'
                          }}>
                            {item.count}
                          </div>
                          <div style={{
                            width: '100%',
                            height: '200px',
                            display: 'flex',
                            alignItems: 'end',
                            marginBottom: '8px'
                          }}>
                            <div 
                              style={{
                                width: '100%',
                                height: `${Math.max(height, 2)}%`,
                                backgroundColor: vuePersonnelle ? 'var(--primary-green)' : 'var(--primary-blue)',
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.5s ease',
                                position: 'relative'
                              }}
                              title={`${item.count} étudiants`}
                            />
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            textAlign: 'center',
                            transform: 'rotate(-45deg)',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.anneeScolaire}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="chart-empty">
                  <BarChart2 size={48} />
                  <h4>Aucune donnée disponible</h4>
                  <p>L'évolution par année scolaire apparaîtra ici</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="pie-charts-grid">
            {/* Top commerciaux - Seulement en vue générale */}
            {!vuePersonnelle && (
              <div className="chart-card">
                <div className="chart-header">
                  <UserCheck size={20} />
                  <h3>Top commerciaux</h3>
                  <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                    Année {anneeScolaire}
                  </span>
                </div>
                
                {stats.topCommerciaux.length > 0 ? (
                  <div style={{marginTop: '24px'}}>
                    {stats.topCommerciaux.map((com, index) => (
                      <div key={com._id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px'}}>
                            {com.nomComplet || `${com.prenom || ''} ${com.nom || ''}`.trim() || 'N/A'}
                          </div>
                          <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                            {com.count || 0} étudiants • {formatCurrency(com.chiffreAffaire || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="chart-empty">
                    <UserCheck size={48} />
                    <h4>Aucune donnée disponible</h4>
                    <p>Le classement des commerciaux apparaîtra ici</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Répartition par niveau */}
            <div className="chart-card">
              <div className="chart-header">
                <Award size={20} />
                <h3>
                  {vuePersonnelle ? 'Mes étudiants par niveau' : 'Répartition par niveau'}
                </h3>
              </div>
              
              {Object.keys(stats.repartitionNiveau).length > 0 ? (
                <div style={{marginTop: '24px'}}>
                  {Object.entries(stats.repartitionNiveau)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([niveau, count]) => {
                      const percentage = stats.totalEtudiants > 0 
                        ? Math.round((count / stats.totalEtudiants) * 100) 
                        : 0;
                      return (
                        <div key={niveau} style={{marginBottom: '16px'}}>
                          <div style={{
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            marginBottom: '8px',
                            fontSize: '0.875rem'
                          }}>
                            <span style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                              Niveau {niveau}
                            </span>
                            <span style={{color: 'var(--text-secondary)'}}>{count} ({percentage}%)</span>
                          </div>
                          <div style={{
                            width: '100%', 
                            height: '8px', 
                            backgroundColor: '#F3F4F6', 
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div 
                              style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: vuePersonnelle ? 'var(--primary-green)' : 'var(--primary-green)',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="chart-empty">
                  <Award size={48} />
                  <h4>Aucune donnée disponible</h4>
                  <p>La répartition par niveau apparaîtra ici</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCommercial;