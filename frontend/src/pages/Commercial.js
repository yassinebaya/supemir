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
  BarChart2
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
    repartitionFiliere: {},
    repartitionNiveau: {},
    evolutionMensuelle: [],
    chiffreAffaire: 0,
    topCommerciaux: [],
    etudiantsRecents: [],
    tauxConversion: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periode, setPeriode] = useState('mois');
  const [filtreCommercial, setFiltreCommercial] = useState('');

  useEffect(() => {
    fetchStats();
  }, [periode, filtreCommercial]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const params = {};
      if (periode) params.periode = periode;
      if (filtreCommercial && filtreCommercial.trim() !== '') {
        params.commercial = filtreCommercial;
      }
      
      const res = await fetch('http://195.179.229.230:5000/api/comercial/stats?' + new URLSearchParams(params), {
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
        repartitionFiliere: data.repartitionFiliere || {},
        repartitionNiveau: data.repartitionNiveau || {},
        evolutionMensuelle: Array.isArray(data.evolutionMensuelle) ? data.evolutionMensuelle : [],
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

  const getColorForIndex = (index) => {
    const colors = [
      'var(--primary-blue)', 'var(--primary-green)', 'var(--primary-purple)', 
      'var(--primary-red)', 'var(--primary-yellow)', 'var(--primary-indigo)', 
      'var(--primary-teal)', 'var(--primary-pink)'
    ];
    return colors[index % colors.length];
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
    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
      <label style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)'}}>
        Période:
      </label>
      <select 
        value={periode} 
        onChange={(e) => setPeriode(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          backgroundColor: 'white'
        }}
      >
        <option value="jour">Aujourd'hui</option>
        <option value="semaine">Cette semaine</option>
        <option value="mois">Ce mois</option>
        <option value="annee">Cette année</option>
        <option value="tout">Toutes périodes</option>
      </select>
    </div>
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
                  <div className="stat-card-title">Étudiants total</div>
                  <div className="stat-card-value">{formatNombre(stats.totalEtudiants)}</div>
                </div>
                <div className="stat-card-icon">
                  <Users />
                </div>
              </div>
            </div>
            
            <div className="stat-card green">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <div className="stat-card-title">Nouveaux étudiants</div>
                  <div className="stat-card-value">{formatNombre(stats.nouveauxEtudiants)}</div>
                  <div className="stat-card-subtitle">
                    {periode === 'mois' ? 'ce mois' : 
                     periode === 'annee' ? 'cette année' : 
                     periode === 'jour' ? 'aujourd\'hui' :
                     periode === 'semaine' ? 'cette semaine' : 
                     'total'}
                  </div>
                </div>
                <div className="stat-card-icon">
                  <UserCheck />
                </div>
              </div>
            </div>
            
            <div className="stat-card purple">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <div className="stat-card-title">Chiffre d'affaires</div>
                  <div className="stat-card-value">{formatCurrency(stats.chiffreAffaire)}</div>
                </div>
                <div className="stat-card-icon">
                  <DollarSign />
                </div>
              </div>
            </div>
            
            <div className="stat-card yellow">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <div className="stat-card-title">Taux de conversion</div>
                  <div className="stat-card-value">{stats.tauxConversion}%</div>
                  <div className="stat-card-subtitle">Étudiants payés</div>
                </div>
                <div className="stat-card-icon">
                  <TrendingUp />
                </div>
              </div>
            </div>
          </div>
          
          {/* Graphiques */}
          <div className="charts-grid">
            {/* Répartition par filière */}
            <div className="chart-card">
              <div className="chart-header">
                <GraduationCap size={20} />
                <h3>Répartition par filière</h3>
              </div>
              
              {Object.keys(stats.repartitionFiliere).length > 0 ? (
                <div style={{marginTop: '24px'}}>
                  {Object.entries(stats.repartitionFiliere).map(([filiere, count]) => {
                    const percentage = stats.totalEtudiants > 0 
                      ? Math.round((count / stats.totalEtudiants) * 100) 
                      : 0;
                    return (
                      <div key={filiere} style={{marginBottom: '16px'}}>
                        <div style={{
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '8px',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{fontWeight: '600', color: 'var(--text-primary)'}}>{filiere}</span>
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
                              backgroundColor: 'var(--primary-blue)',
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
                  <p>Les données de filières apparaîtront ici</p>
                </div>
              )}
            </div>
            
            {/* Évolution mensuelle */}
            <div className="chart-card">
              <div className="chart-header">
                <BarChart2 size={20} />
                <h3>Évolution des inscriptions</h3>
              </div>
              
              {stats.evolutionMensuelle.length > 0 ? (
                <div style={{height: '300px', marginTop: '24px'}}>
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'end',
                    gap: '8px',
                    padding: '20px 0'
                  }}>
                    {stats.evolutionMensuelle.map((item, index) => {
                      const maxValue = Math.max(...stats.evolutionMensuelle.map(i => i.count || 0));
                      const height = maxValue > 0 ? ((item.count || 0) / maxValue) * 100 : 0;
                      
                      return (
                        <div key={index} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
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
                                backgroundColor: 'var(--primary-blue)',
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.5s ease',
                                position: 'relative'
                              }}
                              title={`${item.count} inscriptions`}
                            />
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            textAlign: 'center',
                            transform: 'rotate(-45deg)',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.mois}
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
                  <p>L'évolution des inscriptions apparaîtra ici</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="pie-charts-grid">
            {/* Top commerciaux */}
            <div className="chart-card">
              <div className="chart-header">
                <UserCheck size={20} />
                <h3>Top commerciaux</h3>
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
            
            {/* Dernières inscriptions */}
            <div className="chart-card">
              <div className="chart-header">
                <Clock size={20} />
                <h3>Dernières inscriptions</h3>
              </div>
              
              {stats.etudiantsRecents.length > 0 ? (
                <div style={{marginTop: '24px'}}>
                  {stats.etudiantsRecents.map(etudiant => (
                    <div key={etudiant._id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {etudiant.image ? (
                          <img 
                            src={`http://195.179.229.230:5000${etudiant.image}`} 
                            alt={etudiant.prenom || 'Étudiant'}
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <Users size={20} style={{color: 'var(--text-secondary)', display: etudiant.image ? 'none' : 'block'}} />
                      </div>
                      
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px'}}>
                          {`${etudiant.prenom || ''} ${etudiant.nomDeFamille || ''}`.trim() || 'N/A'}
                        </div>
                        <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px'}}>
                          {etudiant.filiere || 'N/A'}
                        </div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                          {formatDate(etudiant.dateInscription || etudiant.createdAt)}
                        </div>
                      </div>
                      
                      <div>
                        {etudiant.paye ? (
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            Payé
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            En attente
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="chart-empty">
                  <Clock size={48} />
                  <h4>Aucune inscription récente</h4>
                  <p>Les dernières inscriptions apparaîtront ici</p>
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