import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, AlertCircle, Filter, BookOpen, Handshake
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardPartners = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtre par année scolaire
  const [anneeScolaireFilter, setAnneeScolaireFilter] = useState('');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  // Statistiques Partners détaillées (par partner)
  const [statistiquesPartners, setStatistiquesPartners] = useState([]);

  // Récupération des données
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [etudiantsRes, partnersRes] = await Promise.all([
        fetch('https://vmi1977988.contaboserver.net/api2/etudiant', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('https://vmi1977988.contaboserver.net/api2/partners', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!etudiantsRes.ok) {
        throw new Error(`Erreur étudiants: ${etudiantsRes.status}`);
      }

      const etudiantsData = await etudiantsRes.json();
      
      let partnersData = [];
      if (partnersRes.ok) {
        try {
          const partnersResponse = await partnersRes.json();
          // CORRECTION: Extraire les données du format API
          if (partnersResponse.success && Array.isArray(partnersResponse.data)) {
            partnersData = partnersResponse.data;
          } else if (Array.isArray(partnersResponse)) {
            partnersData = partnersResponse;
          } else {
            console.warn('Format de données partners inattendu:', partnersResponse);
            partnersData = [];
          }
        } catch (parseError) {
          console.warn('Failed to parse partners data:', parseError);
          partnersData = [];
        }
      }

      setEtudiants(etudiantsData);
      setPartners(partnersData);

      const annees = [...new Set(etudiantsData.map((e) => e.anneeScolaire).filter(Boolean))]
        .sort()
        .reverse();
      setAnneesDisponibles(annees);

      let anneeASelectionner = anneeScolaireFilter;
      if (!anneeASelectionner && annees.length > 0) {
        if (annees.includes('2025/2026')) {
          anneeASelectionner = '2025/2026';
        } else {
          anneeASelectionner = annees[0];
        }
        setAnneeScolaireFilter(anneeASelectionner);
      }

      calculerStatsParPartner(etudiantsData, partnersData, anneeASelectionner || anneeScolaireFilter);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données');
      setEtudiants([]);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcul des statistiques par partner individuel
  const calculerStatsParPartner = (etudiantsData, partnersData, anneeFilter) => {
    const etudiantsFiltres = anneeFilter === 'toutes' 
      ? etudiantsData.filter(e => e.isPartner === true)
      : etudiantsData.filter(e => e.anneeScolaire === anneeFilter && e.isPartner === true);

    const statsParPartner = {};
    
    etudiantsFiltres.forEach(etudiant => {
      const partnerId = etudiant.nomPartner || 'sans_partner';
      
      if (!statsParPartner[partnerId]) {
        const partner = partnersData.find(p => p._id === partnerId);
        
        // Si le partner n'existe pas, on l'ignore complètement
        if (!partner && partnerId !== 'sans_partner') {
          console.warn(`Partner ${partnerId} non trouvé pour l'étudiant ${etudiant.prenom} ${etudiant.nomDeFamille}`);
          return; // Ignorer cet étudiant
        }
        
        // Ignorer aussi les étudiants sans partner
        if (partnerId === 'sans_partner') {
          console.warn(`Étudiant sans partner: ${etudiant.prenom} ${etudiant.nomDeFamille}`);
          return; // Ignorer cet étudiant
        }
        
        statsParPartner[partnerId] = {
          nomPartner: partner.nomPartner,
          email: partner.email || '',
          active: partner.active !== false,
          chiffreAffaire: 0,
          countEtudiants: 0
        };
      }
      
      const prixPartner = parseFloat(etudiant.prixTotalPartner) || 0;
      statsParPartner[partnerId].chiffreAffaire += prixPartner;
      statsParPartner[partnerId].countEtudiants += 1;
    });

    const statistiquesCalculees = Object.entries(statsParPartner)
      .map(([partnerId, stats]) => stats)
      .sort((a, b) => b.chiffreAffaire - a.chiffreAffaire);

    setStatistiquesPartners(statistiquesCalculees);
  };

  // Analyse par filière pour Partners uniquement
  const analyseFilieresPartners = () => {
    const etudiantsFiltres = anneeScolaireFilter === 'toutes' 
      ? etudiants.filter(e => e.isPartner === true)
      : etudiants.filter(e => e.anneeScolaire === anneeScolaireFilter && e.isPartner === true);

    const filieresStats = {};
    
    etudiantsFiltres.forEach(e => {
      const filiere = e.filiere || 'Non définie';
      if (!filieresStats[filiere]) {
        filieresStats[filiere] = { 
          total: 0, 
          ca: 0, 
          specialites: new Set()
        };
      }
      
      filieresStats[filiere].total += 1;
      const prixPartner = parseFloat(e.prixTotalPartner) || 0;
      filieresStats[filiere].ca += prixPartner;
      
      if (e.specialite) filieresStats[filiere].specialites.add(e.specialite);
      if (e.specialiteIngenieur) filieresStats[filiere].specialites.add(e.specialiteIngenieur);
      if (e.specialiteLicencePro) filieresStats[filiere].specialites.add(e.specialiteLicencePro);
      if (e.specialiteMasterPro) filieresStats[filiere].specialites.add(e.specialiteMasterPro);
    });

    return Object.entries(filieresStats).map(([filiere, stats]) => ({
      filiere,
      ...stats,
      specialitesCount: stats.specialites.size,
      specialitesList: Array.from(stats.specialites),
      prixMoyen: stats.total > 0 ? (stats.ca / stats.total).toFixed(0) : 0
    })).sort((a, b) => b.total - a.total);
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleAnneeChange = (nouvelleAnnee) => {
    setAnneeScolaireFilter(nouvelleAnnee);
    if (etudiants.length > 0) {
      calculerStatsParPartner(etudiants, partners, nouvelleAnnee);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}
          ></div>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Chargement des données Partners...</p>
        </div>
      </div>
    );
  }

  const filieresDataPartners = analyseFilieresPartners();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={{ flex: 1, paddingLeft: '0' }}>
        <Header />
        
        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb',
              color: 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 0.5rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <Handshake size={28} />
                  Dashboard Étudiants Partners {anneeScolaireFilter}
                </h1>
              </div>
              <button
                onClick={fetchData}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  padding: '0.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <RotateCcw size={16} />
                Actualiser
              </button>
            </div>

            {/* Filtre par année scolaire */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Filter size={18} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Année scolaire:</span>
              <select
                value={anneeScolaireFilter}
                onChange={(e) => handleAnneeChange(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="toutes">Toutes les années</option>
                <option value="2025/2026">2025/2026</option>
                {anneesDisponibles
                  .filter((a) => a !== '2025/2026')
                  .map((annee) => (
                    <option key={annee} value={annee} style={{ color: '#000' }}>
                      {annee}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Performance Partners */}
          {statistiquesPartners.length > 0 && (
            <div
              style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid #e5e7eb'
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Handshake size={24} />
                Partners et leurs Étudiants {anneeScolaireFilter === 'toutes' ? '' : anneeScolaireFilter}
              </h2>
              
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                  <thead style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                    <tr>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Partner</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Nombre d'Étudiants</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Chiffre d'Affaires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiquesPartners.map((stat, index) => (
                      <tr key={index} style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        opacity: stat.active ? 1 : 0.6
                      }}>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              background: '#e3f2fd',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#1976d2'
                            }}>
                              <Handshake size={20} />
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{stat.nomPartner}</div>
                              {stat.email && (
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{stat.email}</div>
                              )}
                              {!stat.active && (
                                <div style={{ 
                                  display: 'inline-flex',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  marginTop: '0.25rem'
                                }}>
                                  Inactif
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: 'white',
                            background: '#1976d2',
                            minWidth: '3rem'
                          }}>
                            {stat.countEtudiants || 0}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <span style={{
                            fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            background: 'rgba(25, 118, 210, 0.1)',
                            color: '#1565c0'
                          }}>
                            {(stat.chiffreAffaire || 0).toLocaleString('fr-FR')} MAD
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analyse par Filière Partners */}
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '2rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <BookOpen size={24} />
              Analyse par Filière - Étudiants Partners Uniquement
            </h2>
            
            {filieresDataPartners.length > 0 ? (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', fontSize: '0.9rem' }}>
                  <thead style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                    <tr>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Filière</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Étudiants Partners</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Spécialités</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>CA Partners</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Prix Moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filieresDataPartners.map((filiere, index) => (
                      <tr key={index} style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s'
                      }}>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Handshake size={16} style={{ color: '#1976d2' }} />
                              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>
                                {filiere.filiere}
                              </span>
                            </div>
                            {filiere.specialitesCount > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {filiere.specialitesList.slice(0, 2).map((spec, i) => (
                                  <span key={i} style={{
                                    background: '#e3f2fd',
                                    color: '#1565c0',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }}>
                                    {spec}
                                  </span>
                                ))}
                                {filiere.specialitesList.length > 2 && (
                                  <span style={{
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }}>
                                    +{filiere.specialitesList.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.375rem 0.875rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'white',
                            background: '#1976d2',
                            minWidth: '2rem'
                          }}>
                            {filiere.total}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.375rem 0.875rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'white',
                            background: '#8b5cf6',
                            minWidth: '2rem'
                          }}>
                            {filiere.specialitesCount}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <span style={{
                            fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            background: 'rgba(25, 118, 210, 0.1)',
                            color: '#1565c0'
                          }}>
                            {formatMoney(filiere.ca)} MAD
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <span style={{
                            fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: '#7c3aed'
                          }}>
                            {formatMoney(filiere.prixMoyen)} MAD
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#94a3b8', 
                fontStyle: 'italic', 
                padding: '3rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '2px dashed #cbd5e1'
              }}>
                <Handshake size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>Aucun étudiant Partner</h3>
                <p>Aucun étudiant Partner n'a été trouvé pour cette année scolaire.</p>
              </div>
            )}
          </div>

          {/* Message d'erreur */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          table { font-size: 0.8rem; }
          th, td { padding: 0.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPartners;