import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Home, AlertCircle, Filter, Users, DollarSign, 
  TrendingUp, Eye, Phone, Mail, GraduationCap, BookOpen,
  UserCheck, Building, Calendar, Target, BarChart3, Award,
  Shield, CheckCircle, XCircle, User, Search, Download, Handshake
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardPartners = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtre par année scolaire
  const [anneeScolaireFilter, setAnneeScolaireFilter] = useState('');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  // Statistiques Partners
  const [statsPartners, setStatsPartners] = useState({
    partners: { nombre: 0, chiffreAffaire: 0, pourcentageRevenue: 0 },
    normal: { nombre: 0, chiffreAffaire: 0, pourcentageRevenue: 0 },
    total: { nombre: 0, chiffreAffaire: 0 }
  });

  // Statistiques détaillées par type
  const [tableauPartners, setTableauPartners] = useState({
    nouveauxInscrits: { count: 0, ca: 0 },
    reinscriptions: { count: 0, ca: 0 },
    total: { count: 0, ca: 0 },
    recouvrement: { percentage: 0, ca: 0 },
    prixMoyen: 0
  });

  // Commerciaux Partners
  const [commerciaux, setCommerciaux] = useState([]);
  const [statistiquesCommerciaux, setStatistiquesCommerciaux] = useState([]);

  // Récupération des données
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Récupérer les étudiants et commerciaux
      const [etudiantsRes, commerciauxRes] = await Promise.all([
        fetch('http://195.179.229.230:5000/api/etudiants', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://195.179.229.230:5000/api/commerciaux', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!etudiantsRes.ok || !commerciauxRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const etudiantsData = await etudiantsRes.json();
      const commerciauxData = await commerciauxRes.json();

      setEtudiants(etudiantsData);
      setCommerciaux(commerciauxData);

      // Obtenir les années disponibles
      const annees = [...new Set(etudiantsData.map((e) => e.anneeScolaire).filter(Boolean))]
        .sort()
        .reverse();
      setAnneesDisponibles(annees);

      // Sélectionner l'année par défaut
      let anneeASelectionner = anneeScolaireFilter;
      if (!anneeASelectionner && annees.length > 0) {
        if (annees.includes('2025/2026')) {
          anneeASelectionner = '2025/2026';
        } else {
          anneeASelectionner = annees[0];
        }
        setAnneeScolaireFilter(anneeASelectionner);
      }

      // Calculer les statistiques
      calculerStatistiquesPartners(etudiantsData, commerciauxData, anneeASelectionner || anneeScolaireFilter);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données');
      setEtudiants([]);
      setCommerciaux([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcul des statistiques Partners
  const calculerStatistiquesPartners = (etudiantsData, commerciauxData, anneeFilter) => {
    // Filtrer par année si nécessaire
    const etudiantsFiltres = anneeFilter === 'toutes' 
      ? etudiantsData 
      : etudiantsData.filter(e => e.anneeScolaire === anneeFilter);

    // Séparer les étudiants Partners et Normaux
    const etudiantsPartners = etudiantsFiltres.filter(e => e.isPartner === true);
    const etudiantsNormaux = etudiantsFiltres.filter(e => e.isPartner !== true);

    // Calculs globaux
    const partnersRevenue = etudiantsPartners.reduce((sum, e) => sum + (parseFloat(e.prixTotalPartner) || 0), 0);
    const normalRevenue = etudiantsNormaux.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0);
    const totalRevenue = partnersRevenue + normalRevenue;

    setStatsPartners({
      partners: {
        nombre: etudiantsPartners.length,
        chiffreAffaire: partnersRevenue,
        pourcentageRevenue: totalRevenue > 0 ? ((partnersRevenue / totalRevenue) * 100) : 0
      },
      normal: {
        nombre: etudiantsNormaux.length,
        chiffreAffaire: normalRevenue,
        pourcentageRevenue: totalRevenue > 0 ? ((normalRevenue / totalRevenue) * 100) : 0
      },
      total: {
        nombre: etudiantsFiltres.length,
        chiffreAffaire: totalRevenue
      }
    });

    // Statistiques détaillées pour Partners uniquement
    const partnersNouveaux = etudiantsPartners.filter(e => e.nouvelleInscription === true);
    const partnersReinscriptions = etudiantsPartners.filter(e => e.nouvelleInscription === false);
    const partnersPayes = etudiantsPartners.filter(e => e.paye === true);

    const caPartnersNouveaux = partnersNouveaux.reduce((sum, e) => sum + (parseFloat(e.prixTotalPartner) || 0), 0);
    const caPartnersReinscr = partnersReinscriptions.reduce((sum, e) => sum + (parseFloat(e.prixTotalPartner) || 0), 0);
    const caPartnersPayes = partnersPayes.reduce((sum, e) => sum + (parseFloat(e.prixTotalPartner) || 0), 0);
    const prixMoyenPartners = etudiantsPartners.length > 0 ? partnersRevenue / etudiantsPartners.length : 0;

    setTableauPartners({
      nouveauxInscrits: { count: partnersNouveaux.length, ca: caPartnersNouveaux },
      reinscriptions: { count: partnersReinscriptions.length, ca: caPartnersReinscr },
      total: { count: etudiantsPartners.length, ca: partnersRevenue },
      recouvrement: {
        percentage: partnersRevenue > 0 ? (caPartnersPayes / partnersRevenue) * 100 : 0,
        ca: caPartnersPayes
      },
      prixMoyen: prixMoyenPartners
    });

    // Statistiques des commerciaux pour Partners
    calculerStatsCommerciauxPartners(etudiantsPartners, commerciauxData);
  };

  // Calcul des statistiques commerciaux spécifique aux Partners
  const calculerStatsCommerciauxPartners = (etudiantsPartners, commerciauxData) => {
    const statsParCommercial = {};
    
    etudiantsPartners.forEach(etudiant => {
      const commercialId = etudiant.commercial || 'inconnu';
      
      if (!statsParCommercial[commercialId]) {
        const commercial = commerciauxData.find(c => c._id === commercialId);
        
        statsParCommercial[commercialId] = {
          nom: commercial ? commercial.nom : 'Commercial inconnu',
          email: commercial ? commercial.email : '',
          telephone: commercial ? commercial.telephone : '',
          chiffreAffaire: 0,
          totalRecu: 0,
          reste: 0,
          countEtudiants: 0,
          actif: commercial ? commercial.actif !== false : true,
          estAdminInscription: commercial ? commercial.estAdminInscription || false : false
        };
      }
      
      const prixPartner = parseFloat(etudiant.prixTotalPartner) || 0;
      statsParCommercial[commercialId].chiffreAffaire += prixPartner;
      statsParCommercial[commercialId].countEtudiants += 1;
      
      if (etudiant.paye) {
        statsParCommercial[commercialId].totalRecu += prixPartner;
      } else {
        statsParCommercial[commercialId].reste += prixPartner;
      }
    });

    const statistiquesCalculees = Object.entries(statsParCommercial)
      .filter(([commercialId, stats]) => commercialId !== 'inconnu')
      .map(([commercialId, stats]) => stats)
      .sort((a, b) => b.chiffreAffaire - a.chiffreAffaire);

    setStatistiquesCommerciaux(statistiquesCalculees);
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
          etudiants: [], 
          total: 0, 
          payes: 0, 
          ca: 0, 
          caPaye: 0, 
          specialites: new Set(),
          nouveaux: 0,
          reinscriptions: 0,
          actifs: 0,
          bourses: 0
        };
      }
      
      filieresStats[filiere].etudiants.push(e);
      filieresStats[filiere].total += 1;
      if (e.paye) filieresStats[filiere].payes += 1;
      if (e.actif) filieresStats[filiere].actifs += 1;
      if (e.pourcentageBourse && e.pourcentageBourse > 0) filieresStats[filiere].bourses += 1;
      
      const prixPartner = parseFloat(e.prixTotalPartner) || 0;
      filieresStats[filiere].ca += prixPartner;
      if (e.paye) filieresStats[filiere].caPaye += prixPartner;
      
      if (e.nouvelleInscription === true) filieresStats[filiere].nouveaux += 1;
      else filieresStats[filiere].reinscriptions += 1;
      
      // Ajouter les spécialités selon le type de formation
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
      tauxPaiement: stats.total > 0 ? ((stats.payes / stats.total) * 100).toFixed(1) : 0,
      tauxActivite: stats.total > 0 ? ((stats.actifs / stats.total) * 100).toFixed(1) : 0,
      prixMoyen: stats.total > 0 ? (stats.ca / stats.total).toFixed(0) : 0,
      tauxNouveaux: stats.total > 0 ? ((stats.nouveaux / stats.total) * 100).toFixed(1) : 0
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
      calculerStatistiquesPartners(etudiants, commerciaux, nouvelleAnnee);
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
                <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
                  Statistiques et analyses dédiées aux étudiants du programme partenaire
                </p>
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

          {/* Statistiques Globales Partners vs Normal */}
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
                textAlign: 'center'
              }}
            >
              Comparaison Partners vs Étudiants Normaux
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {/* Partners */}
              <div style={{ 
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '1px solid #90caf9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Handshake size={24} style={{ color: '#1976d2' }} />
                  <h3 style={{ fontWeight: 'bold', color: '#1976d2', margin: 0 }}>Partners</h3>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 'bold', color: '#1565c0' }}>
                  {statsPartners.partners.nombre}
                </div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#1976d2' }}>
                  {statsPartners.partners.pourcentageRevenue.toFixed(1)}% du chiffre d'affaires total
                </div>
                <div style={{ fontWeight: 'bold', color: '#0d47a1', fontSize: '1.1rem' }}>
                  {formatMoney(statsPartners.partners.chiffreAffaire)} MAD
                </div>
              </div>

              {/* Normaux */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f3e5f5 0%, #ce93d8 100%)', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '1px solid #ba68c8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <User size={24} style={{ color: '#7b1fa2' }} />
                  <h3 style={{ fontWeight: 'bold', color: '#7b1fa2', margin: 0 }}>Normaux</h3>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 'bold', color: '#6a1b9a' }}>
                  {statsPartners.normal.nombre}
                </div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#7b1fa2' }}>
                  {statsPartners.normal.pourcentageRevenue.toFixed(1)}% du chiffre d'affaires total
                </div>
                <div style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '1.1rem' }}>
                  {formatMoney(statsPartners.normal.chiffreAffaire)} MAD
                </div>
              </div>

              {/* Total */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '1px solid #d1d5db'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <BarChart3 size={24} style={{ color: '#374151' }} />
                  <h3 style={{ fontWeight: 'bold', color: '#374151', margin: 0 }}>Total</h3>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {statsPartners.total.nombre}
                </div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                  Tous étudiants confondus
                </div>
                <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1.1rem' }}>
                  {formatMoney(statsPartners.total.chiffreAffaire)} MAD
                </div>
              </div>
            </div>
          </div>

          {/* Détails Partners */}
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
                textAlign: 'center'
              }}
            >
              Analyse Détaillée - Étudiants Partners
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    Type
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    Nombre
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    Chiffre d'affaire Partners
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>Nouveaux Inscrits Partners</strong>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', color: '#1f2937' }}>{tableauPartners.nouveauxInscrits.count}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>{formatMoney(tableauPartners.nouveauxInscrits.ca)} MAD</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>Réinscriptions Partners</strong>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', color: '#1f2937' }}>{tableauPartners.reinscriptions.count}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>{formatMoney(tableauPartners.reinscriptions.ca)} MAD</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>Total Partners</strong>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: 'bold' }}>{tableauPartners.total.count}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{formatMoney(tableauPartners.total.ca)} MAD</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>Recouvrement Partners</strong>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', color: '#1f2937' }}>
                      {tableauPartners.recouvrement.percentage.toFixed(2)} %
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>{formatMoney(tableauPartners.recouvrement.ca)} MAD</strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>Prix Moyen Partner</strong>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', color: '#1f2937' }}>-</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>{formatMoney(tableauPartners.prixMoyen)} MAD</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Performance Commerciaux Partners */}
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
              <Users size={24} />
              Performance Commerciaux - Étudiants Partners {anneeScolaireFilter === 'toutes' ? '' : anneeScolaireFilter}
            </h2>
            
            {statistiquesCommerciaux.length > 0 ? (
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
                      }}>Commercial</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Contact</th>
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
                      }}>CA Partners</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Montant Reçu</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Reste à Payer</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Taux Recouvrement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiquesCommerciaux.map((stat, index) => {
                      const tauxRecouvrement = stat.chiffreAffaire > 0 
                        ? ((stat.totalRecu / stat.chiffreAffaire) * 100).toFixed(1)
                        : 0;
                        
                      return (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #f3f4f6',
                          opacity: stat.actif ? 1 : 0.6
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
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{stat.nom}</div>
                                {stat.estAdminInscription && (
                                  <div style={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    marginTop: '0.25rem'
                                  }}>
                                    <Shield size={12} />
                                    Admin
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {stat.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                  <Mail size={14} />
                                  <span>{stat.email}</span>
                                </div>
                              )}
                              {stat.telephone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                  <Phone size={14} />
                                  <span>{stat.telephone}</span>
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
                              {stat.countEtudiants || 0}
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
                              {(stat.chiffreAffaire || 0).toLocaleString('fr-FR')} MAD
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                            <span style={{
                              fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#047857'
                            }}>
                              {(stat.totalRecu || 0).toLocaleString('fr-FR')} MAD
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                            <span style={{
                              fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              background: (stat.reste || 0) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: (stat.reste || 0) > 0 ? '#dc2626' : '#047857'
                            }}>
                              {(stat.reste || 0).toLocaleString('fr-FR')} MAD
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                flex: 1,
                                height: '8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div 
                                  style={{
                                    height: '100%',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease',
                                    width: `${Math.min(tauxRecouvrement, 100)}%`,
                                    background: tauxRecouvrement >= 70 ? 'linear-gradient(90deg, #10b981, #059669)' : 
                                               tauxRecouvrement >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 
                                               'linear-gradient(90deg, #ef4444, #dc2626)'
                                  }}
                                ></div>
                              </div>
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#64748b',
                                minWidth: '3rem',
                                textAlign: 'right'
                              }}>
                                {tauxRecouvrement}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#94a3b8', 
                fontStyle: 'italic', 
                padding: '2rem' 
              }}>
                Aucun commercial n'a d'étudiants Partners pour cette année
              </div>
            )}
          </div>

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
                      }}>Partners</th>
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
                      }}>Nouveaux/Réinscr.</th>
                      <th style={{ 
                        padding: '1rem 1.25rem', 
                        textAlign: 'left', 
                        fontWeight: '700', 
                        color: '#374151', 
                        fontSize: '0.875rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Taux Paiement</th>
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
                      }}>CA Payé</th>
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
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#059669' }}>
                              {filiere.nouveaux} nouveaux
                            </span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#3b82f6' }}>
                              {filiere.reinscriptions} réinscr.
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ({filiere.tauxNouveaux}% nouveaux)
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{
                              width: '100%',
                              height: '6px',
                              background: '#e5e7eb',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div 
                                style={{
                                  height: '100%',
                                  borderRadius: '3px',
                                  transition: 'width 0.3s ease',
                                  width: `${Math.min(filiere.tauxPaiement, 100)}%`,
                                  background: parseFloat(filiere.tauxPaiement) >= 70 ? '#10b981' : 
                                             parseFloat(filiere.tauxPaiement) >= 40 ? '#f59e0b' : '#ef4444'
                                }}
                              ></div>
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                              {filiere.tauxPaiement}%
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ({filiere.payes} payés)
                            </span>
                          </div>
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
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#047857'
                          }}>
                            {formatMoney(filiere.caPaye)} MAD
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