import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};
const RapportsProfesseurs = () => {
  const [professeurs, setProfesseurs] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear()
  });
  const [viewMode, setViewMode] = useState('mensuel');
  const [selectedProfesseur, setSelectedProfesseur] = useState('');
  const [rapportIndividuel, setRapportIndividuel] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('tous'); // 'tous', 'permanent', 'entrepreneur'
  
  // Nouveaux états pour la gestion des périodes
  const [loadingPeriodes, setLoadingPeriodes] = useState(false);
  const [periodesDisponibles, setPeriodesDisponibles] = useState({
    annees: [],
    moisParAnnee: {},
    loaded: false
  });

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    fetchProfesseurs();
    fetchPeriodesDisponibles();
    if (viewMode === 'mensuel') {
      fetchRapportsMensuels();
    }
  }, [selectedPeriod, viewMode]);

  // Fonction pour récupérer les périodes disponibles
  const fetchPeriodesDisponibles = async () => {
    try {
      setLoadingPeriodes(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://195.179.229.230:5000/api/seances/periodes-disponibles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setPeriodesDisponibles({
          annees: data.annees || [],
          moisParAnnee: data.moisParAnnee || {},
          loaded: true
        });
      } else {
        // Fallback avec années par défaut
        const currentYear = new Date().getFullYear();
        setPeriodesDisponibles({
          annees: [currentYear - 1, currentYear, currentYear + 1],
          moisParAnnee: {},
          loaded: true
        });
      }
    } catch (err) {
      console.error('Erreur chargement périodes:', err);
      // Fallback avec années par défaut
      const currentYear = new Date().getFullYear();
      setPeriodesDisponibles({
        annees: [currentYear - 1, currentYear, currentYear + 1],
        moisParAnnee: {},
        loaded: true
      });
    } finally {
      setLoadingPeriodes(false);
    }
  };

  // Fonction pour obtenir les mois disponibles pour une année
  const getMoisDisponiblesPourAnnee = (annee) => {
    const moisDisponibles = periodesDisponibles.moisParAnnee[annee] || [];
    return moisDisponibles.length > 0 ? moisDisponibles : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  // Fonction pour gérer le changement d'année
  const handleAnneeChange = (nouvelleAnnee) => {
    const annee = parseInt(nouvelleAnnee);
    const moisDisponibles = getMoisDisponiblesPourAnnee(annee);
    const moisActuel = selectedPeriod.mois;
    
    // Si le mois actuel n'est pas disponible pour cette année, prendre le premier mois disponible
    const nouveauMois = moisDisponibles.includes(moisActuel) ? moisActuel : moisDisponibles[0] || 1;
    
    setSelectedPeriod({
      annee: annee,
      mois: nouveauMois
    });
  };

  // Fonction utilitaire pour vérifier les données
  const safeCalculate = (data, field, defaultValue = 0) => {
    if (!data || typeof data[field] !== 'number') return defaultValue;
    return data[field];
  };

  const fetchProfesseurs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }

      const res = await fetch('http://195.179.229.230:5000/api/professeurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        const professeursActifs = Array.isArray(data) ? data.filter(p => p && p.actif) : [];
        setProfesseurs(professeursActifs);
        
        if (professeursActifs.length === 0) {
          setMessage({ type: 'warning', text: 'Aucun professeur actif trouvé.' });
        }
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement des professeurs' });
      }
    } catch (err) {
      console.error('Erreur chargement professeurs:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    }
  };

  const fetchRapportsMensuels = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }

      const res = await fetch(
        `http://195.179.229.230:5000/api/professeurs/rapports/mensuel?mois=${selectedPeriod.mois}&annee=${selectedPeriod.annee}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        const rapportsValides = Array.isArray(data.rapports) ? data.rapports : [];
        setRapports(rapportsValides);
        
        if (rapportsValides.length === 0) {
          setMessage({ 
            type: 'warning', 
            text: `Aucune activité trouvée pour ${data.periode?.nomMois || mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}` 
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: `${rapportsValides.length} professeurs trouvés pour ${data.periode?.nomMois || mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}` 
          });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.message || 'Erreur lors du chargement des rapports' 
        });
      }
    } catch (err) {
      console.error('Erreur rapports:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const fetchRapportIndividuel = async (professeurId) => {
    if (!professeurId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un professeur' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }

      const url = viewMode === 'annuel' 
        ? `http://195.179.229.230:5000/api/professeurs/${professeurId}/rapport/annuel?annee=${selectedPeriod.annee}`
        : `http://195.179.229.230:5000/api/professeurs/${professeurId}/rapport?mois=${selectedPeriod.mois}&annee=${selectedPeriod.annee}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }
      
      if (res.status === 404) {
        setMessage({ type: 'warning', text: 'Professeur non trouvé' });
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setRapportIndividuel(data);
        
        const profNom = data.professeur?.nom || 'Professeur';
        if (viewMode === 'annuel') {
          setMessage({ type: 'success', text: `Rapport annuel de ${profNom} chargé` });
        } else {
          const totalHeures = data.statistiques?.totalHeures || 0;
          setMessage({ 
            type: 'success', 
            text: `Rapport de ${profNom}: ${totalHeures}h ce mois` 
          });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.message || 'Erreur lors du chargement du rapport' 
        });
      }
    } catch (err) {
      console.error('Erreur rapport individuel:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Fonction de calcul sécurisée des totaux
  const calculateTotals = (rapports) => {
    if (!Array.isArray(rapports) || rapports.length === 0) {
      return { totalHeures: 0, totalAPayer: 0, totalSeances: 0 };
    }

    return rapports.reduce((acc, rapport) => {
      if (!rapport || !rapport.statistiques) return acc;
      
      return {
        totalHeures: acc.totalHeures + safeCalculate(rapport.statistiques, 'totalHeures'),
        totalAPayer: acc.totalAPayer + safeCalculate(rapport.statistiques, 'totalAPayer'),
        totalSeances: acc.totalSeances + safeCalculate(rapport, 'nombreSeances')
      };
    }, { totalHeures: 0, totalAPayer: 0, totalSeances: 0 });
  };

  // Filtrage et recherche
  const filteredRapports = rapports.filter(rapport => {
    if (!rapport || !rapport.professeur) return false;
    
    const matchesSearch = rapport.professeur.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    let matchesFilter = true;
    if (filterType === 'permanent') {
      matchesFilter = rapport.professeur.estPermanent === true;
    } else if (filterType === 'entrepreneur') {
      matchesFilter = rapport.professeur.estPermanent === false;
    }
    
    return matchesSearch && matchesFilter;
  });

  const downloadRapport = (format = 'csv') => {
    try {
      if (viewMode === 'mensuel' && rapports.length > 0) {
        downloadRapportMensuel(format);
      } else if (rapportIndividuel) {
        downloadRapportIndividuel(format);
      } else {
        setMessage({ type: 'warning', text: 'Aucune donnée à télécharger' });
      }
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement' });
    }
  };

  const downloadRapportMensuel = (format) => {
    const totaux = calculateTotals(rapports);
    
    let content = '';
    content += `Rapport Mensuel - ${mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}\n`;
    content += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    
    content += `RESUME GENERAL\n`;
    content += `Total Professeurs: ${rapports.length}\n`;
    content += `Total Heures: ${totaux.totalHeures.toFixed(1)}h\n`;
    content += `Total à Payer: ${totaux.totalAPayer.toFixed(2)} DH\n`;
    content += `Total Séances: ${totaux.totalSeances}\n\n`;
    
    content += `DETAIL PAR PROFESSEUR\n`;
    content += `Nom;Type;Heures;Tarif/h;Total à Payer;Séances;Email\n`;
    
    rapports.forEach(rapport => {
      if (!rapport || !rapport.professeur || !rapport.statistiques) return;
      
      const prof = rapport.professeur;
      const stats = rapport.statistiques;
      content += `${prof.nom || 'N/A'};${prof.estPermanent ? 'Permanent' : 'Entrepreneur'};${safeCalculate(stats, 'totalHeures')};${safeCalculate(stats, 'tarifHoraire')};${safeCalculate(stats, 'totalAPayer').toFixed(2)};${safeCalculate(rapport, 'nombreSeances')};${prof.email || 'N/A'}\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_mensuel_${selectedPeriod.mois}_${selectedPeriod.annee}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'Rapport téléchargé avec succès' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const downloadRapportIndividuel = (format) => {
    if (!rapportIndividuel || !rapportIndividuel.professeur || !rapportIndividuel.statistiques) {
      setMessage({ type: 'error', text: 'Données du rapport incomplètes' });
      return;
    }

    const prof = rapportIndividuel.professeur;
    const stats = rapportIndividuel.statistiques;
    
    let content = '';
    content += `Rapport Individuel - ${prof.nom || 'Professeur'}\n`;
    content += `Période: ${selectedPeriod.mois ? mois[selectedPeriod.mois - 1] : 'Année'} ${selectedPeriod.annee}\n`;
    content += `Type: ${prof.estPermanent ? 'Permanent' : 'Entrepreneur'}\n`;
    content += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    
    content += `STATISTIQUES\n`;
    content += `Total Heures: ${safeCalculate(stats, 'totalHeures')}h\n`;
    content += `Total Séances: ${safeCalculate(stats, 'totalSeances')}\n`;
    content += `Cours Différents: ${safeCalculate(stats, 'coursUniques')}\n`;
    content += `Matières Différentes: ${safeCalculate(stats, 'matieresUniques')}\n`;
    if (!prof.estPermanent) {
      content += `Tarif Horaire: ${safeCalculate(stats, 'tarifHoraire')} DH/h\n`;
      content += `Total à Payer: ${safeCalculate(stats, 'totalAPayer').toFixed(2)} DH\n`;
    }
    content += `\n`;
    
    // Détail des séances
    if (rapportIndividuel.seances && Array.isArray(rapportIndividuel.seances)) {
      content += `DETAIL DES SEANCES\n`;
      content += `Jour;Heure Début;Heure Fin;Cours;Matière;Salle;Durée\n`;
      
      rapportIndividuel.seances.forEach(seance => {
        if (!seance) return;
        content += `${seance.jour || 'N/A'};${seance.heureDebut || 'N/A'};${seance.heureFin || 'N/A'};${seance.cours || 'N/A'};${seance.matiere || ''};${seance.salle || ''};${seance.dureeHeures || 0}h\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `rapport_${(prof.nom || 'professeur').replace(/\s+/g, '_')}_${selectedPeriod.mois || 'annee'}_${selectedPeriod.annee}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'Rapport individuel téléchargé avec succès' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',

      fontFamily: 'Arial, sans-serif'
    },
    header: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      textAlign: 'center'
    },
    controls: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    controlRow: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      marginBottom: '15px',
      flexWrap: 'wrap'
    },
    searchRow: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      marginTop: '15px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minWidth: '150px'
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minWidth: '200px'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    buttonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    },
    buttonSuccess: {
      backgroundColor: '#10b981'
    },
    buttonWarning: {
      backgroundColor: '#f59e0b'
    },
    buttonDanger: {
      backgroundColor: '#ef4444'
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statCard: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#3b82f6'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6b7280',
      marginTop: '5px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    th: {
      backgroundColor: '#f8fafc',
      padding: '12px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '2px solid #e5e7eb'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e5e7eb'
    },
    entrepreneurTag: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    permanentTag: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    message: {
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '20px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    successMessage: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0'
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    },
    warningMessage: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fbbf24'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#6b7280'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#374151'
    },
    emptyText: {
      fontSize: '14px',
      lineHeight: '1.5'
    }
  };

  const totaux = calculateTotals(filteredRapports);

  return (
    <div style={styles.container}>
      {/* Header */}      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1f2937' }}>
          Rapports et Statistiques Professeurs
        </h1>
      </div>

      {/* Contrôles */}
      <div style={styles.controls}>
        <div style={styles.controlRow}>
          <select
            style={styles.select}
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setRapportIndividuel(null);
              setSelectedProfesseur('');
            }}
          >
            <option value="mensuel">Rapport Mensuel Global</option>
            <option value="individuel">Rapport Individuel</option>
            <option value="annuel">Rapport Annuel Individuel</option>
          </select>

          <select
            style={{
              ...styles.select,
              ...(loadingPeriodes ? styles.buttonDisabled : {})
            }}
            value={selectedPeriod.mois}
            onChange={(e) => setSelectedPeriod(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
            disabled={viewMode === 'annuel' || loadingPeriodes || !periodesDisponibles.loaded}
          >
            {viewMode === 'annuel' ? (
              <option value="">Toute l'année</option>
            ) : loadingPeriodes ? (
              <option value="">Chargement des mois...</option>
            ) : (
              getMoisDisponiblesPourAnnee(selectedPeriod.annee).length > 0 ? (
                getMoisDisponiblesPourAnnee(selectedPeriod.annee).map(moisNum => (
                  <option key={moisNum} value={moisNum}>
                    {mois[moisNum - 1]}
                  </option>
                ))
              ) : (
                // Fallback si aucun mois disponible pour cette année
                mois.map((m, index) => (
                  <option key={index} value={index + 1} disabled>
                    {m} (aucune donnée)
                  </option>
                ))
              )
            )}
          </select>

          <select
            style={{
              ...styles.select,
              ...(loadingPeriodes ? styles.buttonDisabled : {})
            }}
            value={selectedPeriod.annee}
            onChange={(e) => handleAnneeChange(e.target.value)}
            disabled={loadingPeriodes || !periodesDisponibles.loaded}
          >
            {loadingPeriodes ? (
              <option value="">Chargement des années...</option>
            ) : periodesDisponibles.loaded && periodesDisponibles.annees.length > 0 ? (
              // Utilisation des années DYNAMIQUES de la base de données
              periodesDisponibles.annees.map(year => {
                const moisCount = getMoisDisponiblesPourAnnee(year).length;
                return (
                  <option key={year} value={year}>
                    {year} {moisCount > 0 ? `(${moisCount} mois avec données)` : '(aucune donnée)'}
                  </option>
                );
              })
            ) : (
              // Fallback seulement si aucune donnée dynamique n'est disponible
              <option value="" disabled>Aucune année avec données trouvée</option>
            )}
          </select>

          {(viewMode === 'individuel' || viewMode === 'annuel') && (
            <select
              style={styles.select}
              value={selectedProfesseur}
              onChange={(e) => setSelectedProfesseur(e.target.value)}
            >
              <option value="">-- Sélectionner un professeur --</option>
              {professeurs.map(prof => (
                <option key={prof._id} value={prof._id}>
                  {prof.nom} ({prof.estPermanent ? 'Permanent' : 'Entrepreneur'})
                </option>
              ))}
            </select>
          )}

          <button
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            onClick={() => {
              if (viewMode === 'mensuel') {
                fetchRapportsMensuels();
              } else if (selectedProfesseur) {
                fetchRapportIndividuel(selectedProfesseur);
              }
            }}
            disabled={loading || ((viewMode === 'individuel' || viewMode === 'annuel') && !selectedProfesseur)}
          >
            {loading ? 'Chargement...' : 'Générer Rapport'}
          </button>

          <button
            style={{
              ...styles.button,
              ...styles.buttonWarning,
              ...((!rapports.length && !rapportIndividuel) ? styles.buttonDisabled : {})
            }}
            onClick={() => downloadRapport('csv')}
            disabled={viewMode === 'mensuel' ? rapports.length === 0 : !rapportIndividuel}
          >
            Télécharger CSV
          </button>
        </div>

        {/* Recherche et filtrage pour mode mensuel */}
        {viewMode === 'mensuel' && (
          <div style={styles.searchRow}>
            <input
              style={styles.input}
              placeholder="Rechercher un professeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              style={styles.select}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="tous">Tous les professeurs</option>
              <option value="permanent">Permanents seulement</option>
              <option value="entrepreneur">Entrepreneurs seulement</option>
            </select>
            {(searchTerm || filterType !== 'tous') && (
              <button
                style={{ ...styles.button, ...styles.buttonDanger, fontSize: '12px', padding: '6px 12px' }}
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('tous');
                }}
              >
                Effacer filtres
              </button>
            )}
            
            <button
              style={{ 
                ...styles.button, 
                ...styles.buttonSuccess, 
                fontSize: '12px', 
                padding: '6px 12px',
                ...(loadingPeriodes ? styles.buttonDisabled : {})
              }}
              onClick={fetchPeriodesDisponibles}
              disabled={loadingPeriodes}
            >
              {loadingPeriodes ? 'Actualisation...' : 'Actualiser périodes'}
            </button>

            {periodesDisponibles.loaded && (
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                padding: '6px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                {periodesDisponibles.annees.length} années • {Object.values(periodesDisponibles.moisParAnnee).flat().length} mois avec données
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.errorMessage : 
              message.type === 'warning' ? styles.warningMessage :
              styles.successMessage)
        }}>
          {message.text}
        </div>
      )}

      {/* Affichage conditionnel selon le mode */}
      {loading && (
        <div style={styles.emptyState}>
          <div>Chargement des rapports...</div>
        </div>
      )}

      {/* Mode Mensuel Global */}
      {viewMode === 'mensuel' && !loading && (
        <>
          {filteredRapports.length > 0 ? (
            <>
              {/* Statistiques globales */}
              <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{filteredRapports.length}</div>
                  <div style={styles.statLabel}>
                    Professeurs {searchTerm || filterType !== 'tous' ? 'Filtrés' : 'Actifs'}
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>
                    {totaux.totalHeures.toFixed(1)}h
                  </div>
                  <div style={styles.statLabel}>
                    Total Heures
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>
                    {filteredRapports.filter(r => r.professeur && !r.professeur.estPermanent).length}
                  </div>
                  <div style={styles.statLabel}>
                    Entrepreneurs
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>
                    {totaux.totalAPayer.toFixed(2)} DH
                  </div>
                  <div style={styles.statLabel}>
                    Total à Payer
                  </div>
                </div>
              </div>

              {/* Tableau des rapports */}
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Professeur</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Heures</th>
                      <th style={styles.th}>Séances</th>
                      <th style={styles.th}>Tarif/h</th>
                      <th style={styles.th}>Total à Payer</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRapports.map(rapport => {
                      if (!rapport || !rapport.professeur || !rapport.statistiques) return null;
                      
                      return (
                        <tr key={rapport.professeur._id}>
                          <td style={styles.td}>
                            <strong>{rapport.professeur.nom}</strong>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {rapport.professeur.email}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={rapport.professeur.estPermanent ? styles.permanentTag : styles.entrepreneurTag}>
                              {rapport.professeur.estPermanent ? 'Permanent' : 'Entrepreneur'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <strong>{safeCalculate(rapport.statistiques, 'totalHeures')}h</strong>
                          </td>
                          <td style={styles.td}>
                            {safeCalculate(rapport, 'nombreSeances')}
                          </td>
                          <td style={styles.td}>
                            {rapport.professeur.estPermanent ? '-' : `${safeCalculate(rapport.statistiques, 'tarifHoraire')} DH`}
                          </td>
                          <td style={styles.td}>
                            <strong style={{ color: safeCalculate(rapport.statistiques, 'totalAPayer') > 0 ? '#dc2626' : '#6b7280' }}>
                              {rapport.professeur.estPermanent ? '-' : `${safeCalculate(rapport.statistiques, 'totalAPayer').toFixed(2)} DH`}
                            </strong>
                          </td>
                          <td style={styles.td}>
                            <button
                              style={{ ...styles.button, fontSize: '12px', padding: '4px 8px' }}
                              onClick={() => {
                                setSelectedProfesseur(rapport.professeur._id);
                                setViewMode('individuel');
                                fetchRapportIndividuel(rapport.professeur._id);
                              }}
                            >
                              Détails
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <div style={styles.emptyTitle}>
                {rapports.length === 0 ? 'Aucun rapport disponible' : 'Aucun résultat trouvé'}
              </div>
              <div style={styles.emptyText}>
                {rapports.length === 0 
                  ? `Aucune activité trouvée pour ${mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}. Vérifiez que les professeurs ont des séances programmées.`
                  : `Aucun professeur ne correspond aux critères de recherche "${searchTerm}" et filtre "${filterType}".`
                }
              </div>
              {rapports.length === 0 && (
                <button
                  style={{ ...styles.button, marginTop: '16px' }}
                  onClick={fetchRapportsMensuels}
                >
                  Actualiser
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Mode Individuel */}
      {(viewMode === 'individuel' || viewMode === 'annuel') && !loading && (
        <>
          {rapportIndividuel ? (
            <>
              {/* Informations du professeur */}
              <div style={{ ...styles.statCard, marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
                  {rapportIndividuel.professeur.nom}
                </h3>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={rapportIndividuel.professeur.estPermanent ? styles.permanentTag : styles.entrepreneurTag}>
                    {rapportIndividuel.professeur.estPermanent ? 'Permanent' : 'Entrepreneur'}
                  </span>
                  {!rapportIndividuel.professeur.estPermanent && (
                    <span>Tarif: {rapportIndividuel.professeur.tarifHoraire || 0} DH/h</span>
                  )}
                </div>
              </div>

              {/* Statistiques individuelles */}
              {viewMode === 'individuel' ? (
                <div style={styles.statsContainer}>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{safeCalculate(rapportIndividuel.statistiques, 'totalHeures')}h</div>
                    <div style={styles.statLabel}>
                      Total Heures
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{safeCalculate(rapportIndividuel.statistiques, 'totalSeances')}</div>
                    <div style={styles.statLabel}>
                      Séances
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{safeCalculate(rapportIndividuel.statistiques, 'coursUniques')}</div>
                    <div style={styles.statLabel}>Cours Différents</div>
                  </div>
                  {!rapportIndividuel.professeur.estPermanent && (
                    <div style={styles.statCard}>
                      <div style={styles.statNumber}>{safeCalculate(rapportIndividuel.statistiques, 'totalAPayer').toFixed(2)} DH</div>
                      <div style={styles.statLabel}>
                        Total à Payer
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Mode annuel - affichage mensuel
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Évolution Mensuelle {rapportIndividuel.annee}</h4>
                  {rapportIndividuel.rapportsMensuels && Array.isArray(rapportIndividuel.rapportsMensuels) ? (
                    <>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Mois</th>
                              <th style={styles.th}>Heures</th>
                              <th style={styles.th}>Séances</th>
                              {!rapportIndividuel.professeur.estPermanent && <th style={styles.th}>Montant</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rapportIndividuel.rapportsMensuels.map(rapport => (
                              <tr key={rapport.mois}>
                                <td style={styles.td}>{rapport.nomMois}</td>
                                <td style={styles.td}>{safeCalculate(rapport.statistiques, 'totalHeures')}h</td>
                                <td style={styles.td}>{safeCalculate(rapport, 'nombreSeances')}</td>
                                {!rapportIndividuel.professeur.estPermanent && (
                                  <td style={styles.td}>{safeCalculate(rapport.statistiques, 'totalAPayer').toFixed(2)} DH</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Totaux annuels */}
                      {rapportIndividuel.totauxAnnuels && (
                        <div style={{ ...styles.statsContainer, marginTop: '20px' }}>
                          <div style={styles.statCard}>
                            <div style={styles.statNumber}>{safeCalculate(rapportIndividuel.totauxAnnuels, 'totalHeures')}h</div>
                            <div style={styles.statLabel}>Total Annuel Heures</div>
                          </div>
                          <div style={styles.statCard}>
                            <div style={styles.statNumber}>{safeCalculate(rapportIndividuel.totauxAnnuels, 'totalSeances')}</div>
                            <div style={styles.statLabel}>Total Annuel Séances</div>
                          </div>
                          {!rapportIndividuel.professeur.estPermanent && (
                            <div style={styles.statCard}>
                              <div style={styles.statNumber}>{safeCalculate(rapportIndividuel.totauxAnnuels, 'totalAPayer').toFixed(2)} DH</div>
                              <div style={styles.statLabel}>Total Annuel à Payer</div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>📅</div>
                      <div style={styles.emptyTitle}>Aucune donnée mensuelle</div>
                      <div style={styles.emptyText}>Les données mensuelles ne sont pas disponibles pour cette année.</div>
                    </div>
                  )}
                </div>
              )}

              {/* Détail des séances (pour mode individuel mensuel) */}
              {viewMode === 'individuel' && rapportIndividuel.seances && Array.isArray(rapportIndividuel.seances) && rapportIndividuel.seances.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Détail des Séances</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Jour</th>
                          <th style={styles.th}>Horaire</th>
                          <th style={styles.th}>Cours</th>
                          <th style={styles.th}>Matière</th>
                          <th style={styles.th}>Salle</th>
                          <th style={styles.th}>Durée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rapportIndividuel.seances.map((seance, index) => (
                          <tr key={index}>
                            <td style={styles.td}>{seance.jour || 'N/A'}</td>
                            <td style={styles.td}>{seance.heureDebut || 'N/A'} - {seance.heureFin || 'N/A'}</td>
                            <td style={styles.td}>{seance.cours || 'N/A'}</td>
                            <td style={styles.td}>{seance.matiere || '-'}</td>
                            <td style={styles.td}>{seance.salle || '-'}</td>
                            <td style={styles.td}>{seance.dureeHeures || 0}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : selectedProfesseur ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⚠️</div>
              <div style={styles.emptyTitle}>Aucune donnée disponible</div>
              <div style={styles.emptyText}>
                Ce professeur n'a aucune activité enregistrée pour cette période.
                <br />
                Vérifiez que des séances ont été programmées et générées.
              </div>
              <button
                style={{ ...styles.button, marginTop: '16px' }}
                onClick={() => fetchRapportIndividuel(selectedProfesseur)}
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👨‍🏫</div>
              <div style={styles.emptyTitle}>Sélectionnez un professeur</div>
              <div style={styles.emptyText}>
                Choisissez un professeur dans la liste ci-dessus pour voir son rapport détaillé.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RapportsProfesseurs;