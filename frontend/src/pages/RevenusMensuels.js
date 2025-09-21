import React, { useState, useEffect } from 'react';
import { 
  Calendar, Home, AlertCircle, Filter, TrendingUp, 
  DollarSign, BarChart3, Eye, Download, Users,
  CreditCard, Clock, Target, Wallet, ArrowUp, ArrowDown, RefreshCw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const RevenusMensuels = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anneeScolaireFilter, setAnneeScolaireFilter] = useState('');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  const [previsionsMensuelles, setPrevisionsMensuelles] = useState([]);
  const [statistiquesAnnee, setStatistiquesAnnee] = useState({
    totalEtudiants: 0,
    totalInscriptions: 0,
    totalFormation: 0,
    totalCA: 0,
    repartitionModes: {}
  });

  // Fonction pour récupérer les données
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(''); // Réinitialiser l'erreur
      const token = localStorage.getItem('token');

      // Récupérer les étudiants pour avoir les années disponibles
      const etudiantsRes = await fetch('http://195.179.229.230:5000/api/etudiants', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!etudiantsRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const etudiantsData = await etudiantsRes.json();
      setEtudiants(etudiantsData);

      const annees = [...new Set(etudiantsData.map((e) => e.anneeScolaire).filter(Boolean))]
        .sort()
        .reverse();
      setAnneesDisponibles(annees);

      // Sélectionner automatiquement 2025/2026 ou la première année
      let anneeASelectionner = anneeScolaireFilter;
      if (!anneeASelectionner && annees.length > 0) {
        if (annees.includes('2025/2026')) {
          anneeASelectionner = '2025/2026';
        } else {
          anneeASelectionner = annees[0];
        }
        setAnneeScolaireFilter(anneeASelectionner);
      }

      // Calculer les prévisions avec la nouvelle API
      await fetchRevenusAPI(anneeASelectionner || anneeScolaireFilter, token);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données');
      setEtudiants([]);
    } finally {
      setLoading(false);
    }
  };

  // FONCTION pour utiliser l'API revenus - CORRIGÉE
  const fetchRevenusAPI = async (anneeScolaire, token) => {
    try {
      // Encoder l'année scolaire pour l'URL (remplacer / par %2F)
      const anneeScolaireEncoded = encodeURIComponent(anneeScolaire);
      
      console.log('Appel API avec année:', anneeScolaire, 'encodée:', anneeScolaireEncoded);
      
      const revenusRes = await fetch(`http://195.179.229.230:5000/api/revenus/previsions/${anneeScolaireEncoded}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!revenusRes.ok) {
        const errorText = await revenusRes.text();
        console.error('Erreur API details:', errorText);
        throw new Error(`Erreur API revenus: ${revenusRes.status} ${revenusRes.statusText}`);
      }

      const revenusData = await revenusRes.json();
      
      if (revenusData.success) {
        // Mettre à jour les états avec les données de l'API
        setStatistiquesAnnee({
          totalEtudiants: revenusData.statistiques.totalEtudiants,
          totalInscriptions: revenusData.statistiques.totalInscriptionReel,
          totalFormation: revenusData.statistiques.totalFormationReel,
          totalCA: revenusData.statistiques.totalCAPrevisionnel,
          repartitionModes: revenusData.statistiques.repartitionModes
        });
        
        setPrevisionsMensuelles(revenusData.previsionsMensuelles);
        
        console.log('API Revenus - Succès:', revenusData.debug);
        console.log('Prévisions mensuelles:', revenusData.previsionsMensuelles);
      } else {
        throw new Error(revenusData.message || 'Erreur dans la réponse API');
      }
      
    } catch (err) {
      console.error('Erreur API revenus:', err);
      setError(`Erreur API: ${err.message}`);
      // Fallback vers l'ancienne méthode si l'API échoue
      calculerPrevisionsLocal(etudiants, anneeScolaire);
    }
  };

  // Fallback - ancienne méthode en cas d'échec de l'API
  const calculerPrevisionsLocal = (data, anneeFilter) => {
    console.log('Utilisation de la méthode locale de calcul');
    
    const etudiantsFiltres = anneeFilter === 'toutes' 
      ? data 
      : data.filter(e => e.anneeScolaire === anneeFilter && e.actif);

    const stats = {
      totalEtudiants: etudiantsFiltres.length,
      totalInscriptions: etudiantsFiltres.length * 3000, // Estimation
      totalFormation: etudiantsFiltres.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
      totalCA: 0,
      repartitionModes: {
        annuel: { count: 0, ca: 0 },
        semestriel: { count: 0, ca: 0 },
        trimestriel: { count: 0, ca: 0 },
        mensuel: { count: 0, ca: 0 }
      }
    };

    stats.totalCA = stats.totalInscriptions + stats.totalFormation;

    etudiantsFiltres.forEach(etudiant => {
      const mode = etudiant.modePaiement || 'semestriel';
      const prixTotal = parseFloat(etudiant.prixTotal) || 0;
      
      if (stats.repartitionModes[mode]) {
        stats.repartitionModes[mode].count += 1;
        stats.repartitionModes[mode].ca += prixTotal + 3000;
      }
    });

    setStatistiquesAnnee(stats);

    // Générer prévisions basiques
    const mois = [
      'Septembre', 'Octobre', 'Novembre', 'Décembre',
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août'
    ];

    const previsions = mois.map((nomMois, indexMois) => {
      const revenus = {
        mois: nomMois,
        inscription: 0,
        annuel: 0,
        semestriel: 0,
        trimestriel: 0,
        mensuel: 0,
        total: 0,
        details: {
          inscription: { etudiants: 0 },
          annuel: { etudiants: 0 },
          semestriel: { etudiants: 0 },
          trimestriel: { etudiants: 0 },
          mensuel: { etudiants: 0 }
        }
      };

      etudiantsFiltres.forEach(etudiant => {
        const prixFormation = parseFloat(etudiant.prixTotal) || 0;
        const mode = etudiant.modePaiement || 'semestriel';

        // Inscription en septembre
        if (indexMois === 0) {
          revenus.inscription += 3000; // Estimation
          revenus.details.inscription.etudiants += 1;
        }

        // Formation selon mode
        switch (mode) {
          case 'annuel':
            if (indexMois === 0) {
              revenus.annuel += prixFormation;
              revenus.details.annuel.etudiants += 1;
            }
            break;
          case 'semestriel':
            if (indexMois === 0 || indexMois === 5) {
              revenus.semestriel += Math.round(prixFormation / 2);
              revenus.details.semestriel.etudiants += 1;
            }
            break;
          case 'trimestriel':
            if (indexMois === 0 || indexMois === 4 || indexMois === 8) {
              revenus.trimestriel += Math.round(prixFormation / 3);
              revenus.details.trimestriel.etudiants += 1;
            }
            break;
          case 'mensuel':
            if (indexMois >= 0 && indexMois <= 9) {
              revenus.mensuel += Math.round(prixFormation / 10);
              revenus.details.mensuel.etudiants += 1;
            }
            break;
        }
      });

      revenus.total = revenus.inscription + revenus.annuel + revenus.semestriel + revenus.trimestriel + revenus.mensuel;
      return revenus;
    });

    setPrevisionsMensuelles(previsions);
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleAnneeChange = async (nouvelleAnnee) => {
    console.log('Changement d\'année vers:', nouvelleAnnee);
    setAnneeScolaireFilter(nouvelleAnnee);
    if (nouvelleAnnee) {
      const token = localStorage.getItem('token');
      await fetchRevenusAPI(nouvelleAnnee, token);
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
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Chargement des prévisions...</p>
        </div>
      </div>
    );
  }

  // Calculer les métriques
  const totalAnnuelPrevu = previsionsMensuelles.reduce((sum, mois) => sum + mois.total, 0);
  const moyenneMensuelle = previsionsMensuelles.length > 0 ? totalAnnuelPrevu / 12 : 0;

  // Trouver le mois avec le plus haut revenu
  const moisMaxRevenu = previsionsMensuelles.reduce((max, mois) => 
    mois.total > max.total ? mois : max, { total: 0, mois: 'Aucun' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={{ flex: 1, paddingLeft: '0' }}>
        <Header />
        
        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0 0 0.5rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <BarChart3 size={28} />
                  Prévisions Revenus Mensuels {anneeScolaireFilter}
                </h1>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Prévisions basées sur les paiements réels (inscription + formation séparées)
                </p>
              </div>
              <button
                onClick={fetchData}
                style={{
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <RefreshCw size={16} />
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
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            >
              <Filter size={18} />
              <span style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Année scolaire:</span>
              <select
                value={anneeScolaireFilter}
                onChange={(e) => handleAnneeChange(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="toutes">Toutes les années</option>
                {anneesDisponibles.map((annee) => (
                  <option key={annee} value={annee}>
                    {annee}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistiques globales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Total étudiants */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Users size={32} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total Étudiants</h3>
                  <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>{statistiquesAnnee.totalEtudiants}</p>
                </div>
              </div>
            </div>

            {/* CA Total Annuel */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Wallet size={32} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>CA Total Prévu</h3>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{formatMoney(totalAnnuelPrevu)} MAD</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                    Inscription: {formatMoney(statistiquesAnnee.totalInscriptions)} | 
                    Formation: {formatMoney(statistiquesAnnee.totalFormation)}
                  </p>
                </div>
              </div>
            </div>

            {/* Mois le plus rentable */}
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Target size={32} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Pic de Revenus</h3>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{moisMaxRevenu.mois}</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>{formatMoney(moisMaxRevenu.total)} MAD</p>
                </div>
              </div>
            </div>

            {/* Moyenne mensuelle */}
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <BarChart3 size={32} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Moyenne Mensuelle</h3>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{formatMoney(moyenneMensuelle)} MAD</p>
                </div>
              </div>
            </div>
          </div>

          {/* Répartition par modes de paiement */}
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
              <CreditCard size={24} />
              Répartition par Modes de Paiement
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {Object.entries(statistiquesAnnee.repartitionModes).map(([mode, data]) => (
                <div key={mode} style={{
                  background: '#f9fafb',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '1rem', 
                    color: '#374151',
                    textTransform: 'capitalize'
                  }}>
                    {mode}
                  </h3>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {data.count}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                      étudiants
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                    {formatMoney(data.ca)} MAD
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    {statistiquesAnnee.totalEtudiants > 0 ? 
                      ((data.count / statistiquesAnnee.totalEtudiants) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau des prévisions mensuelles */}
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
              <Calendar size={24} />
              Prévisions Mensuelles Détaillées (Inscription + Formation)
            </h2>

            {previsionsMensuelles.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280',
                fontSize: '1.1rem'
              }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                Aucune donnée disponible pour cette année scolaire
              </div>
            ) : (
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
                      }}>Mois</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Inscription</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Annuel</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Semestriel</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Trimestriel</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Mensuel</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Total Mensuel</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Tendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previsionsMensuelles.map((mois, index) => {
                      const prevMois = index > 0 ? previsionsMensuelles[index - 1] : null;
                      const tendance = prevMois ? mois.total - prevMois.total : 0;
                      const isPeak = mois.total === moisMaxRevenu.total && mois.total > 0;
                      
                      return (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #f3f4f6',
                          backgroundColor: isPeak ? '#fef3c7' : 'transparent'
                        }}>
                          {/* Colonne Mois */}
                          <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: '600', color: '#1e293b' }}>{mois.mois}</span>
                              {isPeak && (
                                <span style={{
                                  background: '#fbbf24',
                                  color: '#92400e',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  PIC
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Colonne Inscription */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#dc2626' }}>
                                {mois.inscription > 0 ? formatMoney(mois.inscription) : '-'}
                              </div>
                              {mois.details.inscription.etudiants > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {mois.details.inscription.etudiants} étud.
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Colonne Annuel */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#059669' }}>
                                {mois.annuel > 0 ? formatMoney(mois.annuel) : '-'}
                              </div>
                              {mois.details.annuel.etudiants > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {mois.details.annuel.etudiants} étud.
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Colonne Semestriel */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                                {mois.semestriel > 0 ? formatMoney(mois.semestriel) : '-'}
                              </div>
                              {mois.details.semestriel.etudiants > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {mois.details.semestriel.etudiants} étud.
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Colonne Trimestriel */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#8b5cf6' }}>
                                {mois.trimestriel > 0 ? formatMoney(mois.trimestriel) : '-'}
                              </div>
                              {mois.details.trimestriel.etudiants > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {mois.details.trimestriel.etudiants} étud.
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Colonne Mensuel */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#f59e0b' }}>
                                {mois.mensuel > 0 ? formatMoney(mois.mensuel) : '-'}
                              </div>
                              {mois.details.mensuel.etudiants > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {mois.details.mensuel.etudiants} étud.
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Colonne Total Mensuel */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <span style={{
                              fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
                              fontSize: '1rem',
                              fontWeight: '700',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.5rem',
                              background: mois.total > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                              color: mois.total > 0 ? '#047857' : '#6b7280'
                            }}>
                              {mois.total > 0 ? formatMoney(mois.total) : '0'} MAD
                            </span>
                          </td>
                          
                          {/* Colonne Tendance */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            {index > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                {tendance > 0 ? (
                                  <>
                                    <ArrowUp size={16} style={{ color: '#059669' }} />
                                    <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>
                                      +{formatMoney(tendance)}
                                    </span>
                                  </>
                                ) : tendance < 0 ? (
                                  <>
                                    <ArrowDown size={16} style={{ color: '#dc2626' }} />
                                    <span style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: '600' }}>
                                      {formatMoney(tendance)}
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>-</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                    <tr>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 'bold', color: '#374151' }}>
                        TOTAL ANNUEL
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>
                        {formatMoney(previsionsMensuelles.reduce((sum, m) => sum + m.inscription, 0))}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 'bold', color: '#059669' }}>
                        {formatMoney(previsionsMensuelles.reduce((sum, m) => sum + m.annuel, 0))}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' }}>
                        {formatMoney(previsionsMensuelles.reduce((sum, m) => sum + m.semestriel, 0))}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {formatMoney(previsionsMensuelles.reduce((sum, m) => sum + m.trimestriel, 0))}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' }}>
                        {formatMoney(previsionsMensuelles.reduce((sum, m) => sum + m.mensuel, 0))}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#1f2937' }}>
                        {formatMoney(totalAnnuelPrevu)} MAD
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}></td>
                    </tr>
                  </tfoot>
                </table>
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '2rem'
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
          div[style*="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))"] {
            grid-template-columns: 1fr !important;
          }
          table { font-size: 0.8rem; }
          th, td { padding: 0.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default RevenusMensuels