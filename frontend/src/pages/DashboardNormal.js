import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Home, AlertCircle, Filter, Users, DollarSign, 
  TrendingUp, Eye, Phone, Mail, GraduationCap, BookOpen,
  UserCheck, Building, Calendar, Target, BarChart3, Award,
  Shield, CheckCircle, XCircle, User, Search, Download
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardNormal = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtre par année scolaire
  const [anneeScolaireFilter, setAnneeScolaireFilter] = useState('2024/2025');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  // Ajouter après les états existants
  const [commerciaux, setCommerciaux] = useState([]);
  const [statistiques, setStatistiques] = useState([]);

  // États pour les statistiques calculées
  const [chiffreAffaire, setChiffreAffaire] = useState({
    nouveauxInscrits: { count: 0, ca: 0 },
    reinscriptions: { count: 0, ca: 0 },
    total: { count: 0, ca: 0 },
    preinscrits: { count: 0, ca: 0 },
    recouvrement: { percentage: 0, ca: 0 }
  });

  const [tableauInscrits, setTableauInscrits] = useState({
    global: { total: 0, fi: 0, ta: 0, executive: 0, ca: 0 },
    fi: { total: 0, masi: 0, irm: 0, ca: 0 },
    executive: { total: 0, masi: 0, irm: 0, autre: 0, ca: 0 },
    ta: { total: 0, masi: 0, irm: 0, autre: 0, ca: 0 }
  });

  const [tableauPreinscrits, setTableauPreinscrits] = useState({
    global: { total: 0, fi: 0, ta: 0, executive: 0, ca: 0 },
    fi: { total: 0, masi: 0, irm: 0, ca: 0 },
    executive: { total: 0, masi: 0, irm: 0, ca: 0 },
    ta: { total: 0, masi: 0, irm: 0, ca: 0 }
  });

  const [tableauReinscriptions, setTableauReinscriptions] = useState({
    global: { total: 0, fi: 0, ta: 0, executive: 0, ca: 0 },
    fi: { total: 0, masi: 0, irm: 0, ca: 0 },
    executive: { total: 0, masi: 0, irm: 0, ca: 0 },
    ta: { total: 0, masi: 0, irm: 0, ca: 0 }
  });

  // DONNÉES FIXES POUR 2024/2025
  const donneesFixes2024_2025 = {
    chiffreAffaire: {
      nouveauxInscrits: { count: 202, ca: 5410608.98 },
      reinscriptions: { count: 47, ca: 1306440.0 },
      total: { count: 249, ca: 6717048.98 },
      preinscrits: { count: 9, ca: 257000.0 },
      recouvrement: { percentage: 56.64, ca: 3949767.74 }
    },
    tableauInscrits: {
      global: { total: 202, fi: 59, ta: 53, executive: 90, ca: 5410608.98 },
      fi: { total: 59, masi: 15, irm: 44, ca: 1731608.98 },
      executive: { total: 90, masi: 19, irm: 42, autre: 29, ca: 2299000.0 },
      ta: { total: 53, masi: 26, irm: 27, autre: 0, ca: 1380000.0 }
    },
    tableauPreinscrits: {
      global: { total: 9, fi: 1, ta: 0, executive: 8, ca: 257000.0 },
      fi: { total: 1, masi: 0, irm: 1, ca: 33000.0 },
      executive: { total: 8, masi: 0, irm: 7, ca: 224000.0 },
      ta: { total: 0, masi: 0, irm: 0, ca: 0.0 }
    },
    tableauReinscriptions: {
      global: { total: 47, fi: 33, ta: 14, executive: 0, ca: 1306440.0 },
      fi: { total: 33, masi: 7, irm: 26, ca: 928440.0 },
      executive: { total: 0, masi: 0, irm: 0, ca: 0.0 },
      ta: { total: 14, masi: 10, irm: 4, ca: 378000.0 }
    }
  };

  // Récupération des données
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [etudiantsRes, commerciauxRes] = await Promise.all([
        fetch('http://195.179.229.230:5000/api/etudiant', {
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

      const annees = [...new Set(etudiantsData.map((e) => e.anneeScolaire).filter(Boolean))]
        .sort()
        .reverse();
      setAnneesDisponibles(annees);

      calculerStatistiques(etudiantsData);
      await fetchStatistiques();
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données');
      setEtudiants([]);
      setCommerciaux([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les statistiques commerciales
  const fetchStatistiques = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/commerciaux/statistiques', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      const transformedData = data.map(stat => ({
        nom: stat.commercialInfo?.nom || 'Commercial inconnu',
        email: stat.commercialInfo?.email || '',
        telephone: stat.commercialInfo?.telephone || '',
        chiffreAffaire: stat.chiffreAffaire || 0,
        totalRecu: stat.totalRecu || 0,
        reste: stat.reste || 0,
        countEtudiants: stat.countEtudiants || 0,
        actif: stat.commercialInfo?.actif !== false,
        estAdminInscription: stat.commercialInfo?.estAdminInscription || false
      }));
      
      setStatistiques(transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setStatistiques([]);
    }
  };

  // Fonction d'analyse des filières
  const analyseFilieres = () => {
    const etudiantsFiltres = anneeScolaireFilter === 'toutes' 
      ? etudiants 
      : etudiants.filter(e => e.anneeScolaire === anneeScolaireFilter);

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
          residents: 0,
          bourses: 0
        };
      }
      
      filieresStats[filiere].etudiants.push(e);
      filieresStats[filiere].total += 1;
      if (e.paye) filieresStats[filiere].payes += 1;
      if (e.actif) filieresStats[filiere].actifs += 1;
      if (e.resident) filieresStats[filiere].residents += 1;
      if (e.pourcentageBourse && e.pourcentageBourse > 0) filieresStats[filiere].bourses += 1;
      
      const prixTotal = parseFloat(e.prixTotal) || 0;
      filieresStats[filiere].ca += prixTotal;
      if (e.paye) filieresStats[filiere].caPaye += prixTotal;
      
      if (e.nouvelleInscription === true) filieresStats[filiere].nouveaux += 1;
      else filieresStats[filiere].reinscriptions += 1;
      
      if (e.specialite) filieresStats[filiere].specialites.add(e.specialite);
      if (e.specialiteIngenieur) filieresStats[filiere].specialites.add(e.specialiteIngenieur);
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

  // Calcul des statistiques
  const calculerStatistiques = (data) => {
    if (anneeScolaireFilter === '2024/2025') {
      setChiffreAffaire(donneesFixes2024_2025.chiffreAffaire);
      setTableauInscrits(donneesFixes2024_2025.tableauInscrits);
      setTableauPreinscrits(donneesFixes2024_2025.tableauPreinscrits);
      setTableauReinscriptions(donneesFixes2024_2025.tableauReinscriptions);
      return;
    }

    const etudiantsFiltres = data.filter(
      (e) => anneeScolaireFilter === 'toutes' || e.anneeScolaire === anneeScolaireFilter
    );

    // Inscrits: prixTotal > 0 | Préinscrits: prixTotal == 0 ou vide
    const toNum = (v) => (v === null || v === undefined || v === '' ? 0 : parseFloat(v) || 0);
    const inscrits = etudiantsFiltres.filter((e) => toNum(e.prixTotal) > 0);
    const preinscrits = etudiantsFiltres.filter((e) => toNum(e.prixTotal) === 0);

    const nouveauxInscrits = inscrits.filter((e) => e.nouvelleInscription === true);
    const reinscriptions = inscrits.filter((e) => e.nouvelleInscription === false);

    const caNouveau = nouveauxInscrits.reduce((sum, e) => sum + toNum(e.prixTotal), 0);
    const caReinscription = reinscriptions.reduce((sum, e) => sum + toNum(e.prixTotal), 0);
    const caPreinscrit = preinscrits.reduce((sum, e) => sum + toNum(e.prixTotal), 0); // 0
    const caTotal = caNouveau + caReinscription;

    const etudiantsPayes = inscrits.filter((e) => e.paye === true);
    const caRecouvre = etudiantsPayes.reduce((sum, e) => sum + toNum(e.prixTotal), 0);
    const caTotalPotentiel = inscrits.reduce((sum, e) => sum + toNum(e.prixTotal), 0);

    setChiffreAffaire({
      nouveauxInscrits: { count: nouveauxInscrits.length, ca: caNouveau },
      reinscriptions: { count: reinscriptions.length, ca: caReinscription },
      total: { count: inscrits.length, ca: caTotal },
      preinscrits: { count: preinscrits.length, ca: caPreinscrit },
      recouvrement: {
        percentage: caTotalPotentiel > 0 ? (caRecouvre / caTotalPotentiel) * 100 : 0,
        ca: caRecouvre
      }
    });

    calculerTableauInscrits(inscrits, toNum);
    calculerTableauPreinscrits(preinscrits, toNum);
    calculerTableauReinscriptions(reinscriptions, toNum);
  };

  const calculerTableauInscrits = (inscrits, toNum) => {
    const stats = {
      global: { total: 0, fi: 0, ta: 0, executive: 0, ca: 0 },
      fi: { total: 0, masi: 0, irm: 0, ca: 0 },
      executive: { total: 0, masi: 0, irm: 0, autre: 0, ca: 0 },
      ta: { total: 0, masi: 0, irm: 0, autre: 0, ca: 0 }
    };

    inscrits.forEach((etudiant) => {
      const type = determinerTypeFormation(etudiant);
      const filiere = (etudiant.filiere || '').toLowerCase();
      const ca = toNum(etudiant.prixTotal);

      stats.global.total += 1;
      stats.global.ca += ca;

      if (type === 'FI' || type === 'CYCLE_INGENIEUR') {
        stats.global.fi += 1;
        stats.fi.total += 1;
        stats.fi.ca += ca;
        if (filiere.includes('masi')) stats.fi.masi += 1;
        else if (filiere.includes('irm')) stats.fi.irm += 1;
      } else if (type === 'Executive') {
        stats.global.executive += 1;
        stats.executive.total += 1;
        stats.executive.ca += ca;
        if (filiere.includes('masi')) stats.executive.masi += 1;
        else if (filiere.includes('irm')) stats.executive.irm += 1;
        else stats.executive.autre += 1;
      } else if (type === 'TA') {
        stats.global.ta += 1;
        stats.ta.total += 1;
        stats.ta.ca += ca;
        if (filiere.includes('masi')) stats.ta.masi += 1;
        else if (filiere.includes('irm')) stats.ta.irm += 1;
        else stats.ta.autre += 1;
      }
    });

    setTableauInscrits(stats);
  };

  const calculerTableauPreinscrits = (preinscrits, toNum) => {
    const stats = {
      global: { total: 0, fi: 0, ta: 0, executive: 0, ca: 0 },
      fi: { total: 0, masi: 0, irm: 0, ca: 0 },
      executive: { total: 0, masi: 0, irm: 0, ca: 0 },
      ta: { total: 0, masi: 0, irm: 0, ca: 0 }
    };

    preinscrits.forEach((etudiant) => {
      const type = determinerTypeFormation(etudiant);
      const filiere = (etudiant.filiere || '').toLowerCase();
      const ca = toNum(etudiant.prixTotal);

      stats.global.total += 1;
      stats.global.ca += ca;

      if (type === 'FI' || type === 'CYCLE_INGENIEUR') {
        stats.global.fi += 1;
        stats.fi.total += 1;
        stats.fi.ca += ca;
        if (filiere.includes('masi')) stats.fi.masi += 1;
        else if (filiere.includes('irm')) stats.fi.irm += 1;
      } else if (type === 'Executive') {
        stats.global.executive += 1;
        stats.executive.total += 1;
        stats.executive.ca += ca;
        if (filiere.includes('masi')) stats.executive.masi += 1;
        else if (filiere.includes('irm')) stats.executive.irm += 1;
      } else if (type === 'TA') {
        stats.global.ta += 1;
        stats.ta.total += 1;
        stats.ta.ca += ca;
        if (filiere.includes('masi')) stats.ta.masi += 1;
        else if (filiere.includes('irm')) stats.ta.irm += 1;
      }
    });

    setTableauPreinscrits(stats);
  };

  const calculerTableauReinscriptions = (reinscriptions, toNum) => {
    const stats = {
      global: { total: 0, fi: 0, ta: 0, executive: 0, ca: 0 },
      fi: { total: 0, masi: 0, irm: 0, ca: 0 },
      executive: { total: 0, masi: 0, irm: 0, ca: 0 },
      ta: { total: 0, masi: 0, irm: 0, ca: 0 }
    };

    reinscriptions.forEach((etudiant) => {
      const type = determinerTypeFormation(etudiant);
      const filiere = (etudiant.filiere || '').toLowerCase();
      const ca = toNum(etudiant.prixTotal);

      stats.global.total += 1;
      stats.global.ca += ca;

      if (type === 'FI' || type === 'CYCLE_INGENIEUR') {
        stats.global.fi += 1;
        stats.fi.total += 1;
        stats.fi.ca += ca;
        if (filiere.includes('masi')) stats.fi.masi += 1;
        else if (filiere.includes('irm')) stats.fi.irm += 1;
      } else if (type === 'Executive') {
        stats.global.executive += 1;
        stats.executive.total += 1;
        stats.executive.ca += ca;
        if (filiere.includes('masi')) stats.executive.masi += 1;
        else if (filiere.includes('irm')) stats.executive.irm += 1;
      } else if (type === 'TA') {
        stats.global.ta += 1;
        stats.ta.total += 1;
        stats.ta.ca += ca;
        if (filiere.includes('masi')) stats.ta.masi += 1;
        else if (filiere.includes('irm')) stats.ta.irm += 1;
      }
    });

    setTableauReinscriptions(stats);
  };

  // ✅ Détermination robuste du type de formation, adaptée à votre modèle
  const determinerTypeFormation = (etudiant) => {
    const tf = etudiant.typeFormation;
    if (tf) {
      // Map explicite du modèle -> catégories Dashboard
      if (tf === 'LICENCE_PRO' || tf === 'MASTER_PRO') return 'Executive';
      if (tf === 'CYCLE_INGENIEUR') {
        const niveau = (etudiant.niveauFormation || '').toLowerCase();
        if (niveau.includes('executive')) return 'Executive';
        if (niveau.includes('ta') || niveau.includes('altern') || niveau === 'ta') return 'TA';
        return 'FI';
      }
      if (tf === 'Executive' || tf === 'TA' || tf === 'FI') return tf; // au cas où
    }

    // Fallback: utiliser niveauFormation + cycle
    const niveau = (etudiant.niveauFormation || '').toLowerCase();
    const cycle = (etudiant.cycle || '').toLowerCase();
    if (niveau.includes('executive') || cycle.includes('executive')) return 'Executive';
    if (
      niveau.includes('ta') ||
      niveau.includes('altern') ||
      cycle.includes('ta') ||
      cycle.includes('altern') ||
      niveau === 'ta'
    )
      return 'TA';
    return 'FI';
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleAnneeChange = (nouvelleAnnee) => setAnneeScolaireFilter(nouvelleAnnee);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (etudiants.length > 0 || anneeScolaireFilter === '2024/2025') {
      calculerStatistiques(etudiants);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anneeScolaireFilter]);

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
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Obtenir les données d'analyse
  const filieresData = analyseFilieres();

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
                  <Home size={28} />
                  Chiffre d'Affaire {anneeScolaireFilter}
                </h1>
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
                <option value="2024/2025">2024/2025</option>
                {anneesDisponibles
                  .filter((a) => a !== '2024/2025')
                  .map((annee) => (
                    <option key={annee} value={annee}>
                      {annee}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Chiffre d'Affaire */}
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    Total Inscrit
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    Chiffre d'affaire
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>Nouveaux Inscrits</strong>
                    <br />
                    <span style={{ fontSize: '1.25rem', color: '#1f2937' }}>{chiffreAffaire.nouveauxInscrits.count}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>{formatMoney(chiffreAffaire.nouveauxInscrits.ca)} MAD</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>réinscriptions</strong>
                    <br />
                    <span style={{ fontSize: '1.25rem', color: '#1f2937' }}>{chiffreAffaire.reinscriptions.count}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>{formatMoney(chiffreAffaire.reinscriptions.ca)} MAD</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>Total</strong>
                    <br />
                    <span style={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: 'bold' }}>{chiffreAffaire.total.count}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{formatMoney(chiffreAffaire.total.ca)} MAD</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>préinscrits</strong>
                    <br />
                    <span style={{ fontSize: '1.25rem', color: '#1f2937' }}>{chiffreAffaire.preinscrits.count}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>{formatMoney(chiffreAffaire.preinscrits.ca)} MAD</strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>Recouvrement</strong>
                    <br />
                    <span style={{ fontSize: '1.25rem', color: '#1f2937' }}>
                      {chiffreAffaire.recouvrement.percentage.toFixed(2)} %
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <strong>{formatMoney(chiffreAffaire.recouvrement.ca)} MAD</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tableau des Inscrits */}
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
              Tableau des Inscrits {anneeScolaireFilter === 'toutes' ? '' : anneeScolaireFilter}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {/* Global */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Global</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Total d'inscrits <strong>{tableauInscrits.global.total}</strong>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>FI <strong>{tableauInscrits.global.fi}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>TA <strong>{tableauInscrits.global.ta}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Executive <strong>{tableauInscrits.global.executive}</strong>
                </div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauInscrits.global.ca)} MAD
                </div>
              </div>

              {/* FI */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>FI</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total <strong>{tableauInscrits.fi.total}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauInscrits.fi.masi}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>IRM <strong>{tableauInscrits.fi.irm}</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauInscrits.fi.ca)} MAD
                </div>
              </div>

              {/* Executive */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Exécutive</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total <strong>{tableauInscrits.executive.total}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauInscrits.executive.masi}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>IRM <strong>{tableauInscrits.executive.irm}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Autre <strong>{tableauInscrits.executive.autre}</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauInscrits.executive.ca)} MAD
                </div>
              </div>

              {/* TA */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>TA</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total <strong>{tableauInscrits.ta.total}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauInscrits.ta.masi}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>IRM <strong>{tableauInscrits.ta.irm}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Autre <strong>{tableauInscrits.ta.autre}</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauInscrits.ta.ca)} MAD
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des préinscrits */}
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
              Tableau des préinscrits {anneeScolaireFilter === 'toutes' ? '' : anneeScolaireFilter}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {/* Global */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Global</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Total d'inscrits <strong>{tableauPreinscrits.global.total}</strong>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>FI <strong>{tableauPreinscrits.global.fi}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>TA <strong>{tableauPreinscrits.global.ta}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Executive <strong>{tableauPreinscrits.global.executive}</strong>
                </div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauPreinscrits.global.ca)} MAD
                </div>
              </div>

              {/* FI */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>FI</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total <strong>{tableauPreinscrits.fi.total}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauPreinscrits.fi.masi}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>IRM <strong>{tableauPreinscrits.fi.irm}</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauPreinscrits.fi.ca)} MAD
                </div>
              </div>

              {/* Executive */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Exécutive</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total <strong>{tableauPreinscrits.executive.total}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauPreinscrits.executive.masi}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>IRM <strong>{tableauPreinscrits.executive.irm}</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauPreinscrits.executive.ca)} MAD
                </div>
              </div>

              {/* TA */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>TA</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total <strong>{tableauPreinscrits.ta.total}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauPreinscrits.ta.masi}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>IRM <strong>{tableauPreinscrits.ta.irm}</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauPreinscrits.ta.ca)} MAD
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des réinscriptions */}
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '2rem',
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
              Tableau des réinscriptions
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {/* Global */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Global</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Total d'inscrits <strong>{tableauReinscriptions.global.total}</strong>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>FI <strong>{tableauReinscriptions.global.fi}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>TA <strong>{tableauReinscriptions.global.ta}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Executive <strong>{tableauReinscriptions.global.executive}</strong>
                </div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauReinscriptions.global.ca)} MAD
                </div>
              </div>

              {/* FI */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>FI</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Total d'inscrits FI <strong>{tableauReinscriptions.fi.total}</strong>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauReinscriptions.fi.masi}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>IRM <strong>{tableauReinscriptions.fi.irm}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>G-C <strong>0</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauReinscriptions.fi.ca)} MAD
                </div>
              </div>

              {/* Executive */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Exécutive</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Total d'inscrits Executive <strong>{tableauReinscriptions.executive.total}</strong>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauReinscriptions.executive.masi}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>IRM <strong>{tableauReinscriptions.executive.irm}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>G-C <strong>0</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauReinscriptions.executive.ca)} MAD
                </div>
              </div>

              {/* TA */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>TA</h3>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Total d'inscrits TA <strong>{tableauReinscriptions.ta.total}</strong>
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>MASI <strong>{tableauReinscriptions.ta.masi}</strong></div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>IRM <strong>{tableauReinscriptions.ta.irm}</strong></div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>G-C <strong>0</strong></div>
                <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.95rem' }}>
                  {formatMoney(tableauReinscriptions.ta.ca)} MAD
                </div>
              </div>
            </div>
          </div>

          {/* Performance des Commerciaux */}
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
              Performance des Commerciaux
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
                    }}>Étudiants</th>
                    <th style={{ 
                      padding: '1rem 1.25rem', 
                      textAlign: 'left', 
                      fontWeight: '700', 
                      color: '#374151', 
                      fontSize: '0.875rem',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Chiffre d'Affaires</th>
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
                  {statistiques.length > 0 ? (
                    statistiques.map((stat, index) => {
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
                                background: '#e5e7eb',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#6b7280'
                              }}>
                                <User size={20} />
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
                              background: '#3b82f6',
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
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#1d4ed8'
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
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ 
                        textAlign: 'center', 
                        color: '#94a3b8', 
                        fontStyle: 'italic', 
                        padding: '2rem' 
                      }}>
                        Aucune donnée disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analyse Détaillée par Filière */}
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
              Analyse Détaillée par Filière
            </h2>
            
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
                    }}>Étudiants</th>
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
                    }}>CA Total</th>
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
                  {filieresData.map((filiere, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s'
                    }}>
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>
                            {filiere.filiere}
                          </span>
                          {filiere.specialitesCount > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {filiere.specialitesList.slice(0, 2).map((spec, i) => (
                                <span key={i} style={{
                                  background: '#dbeafe',
                                  color: '#1e40af',
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
                          background: '#6366f1',
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
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#1d4ed8'
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
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
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

export default DashboardNormal;
