import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './RapportsProfesseurs.css';

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
  const [filterType, setFilterType] = useState('tous');
  const [showRattrapages, setShowRattrapages] = useState(false);
  const [rattrapagesData, setRattrapagesData] = useState(null);
  const [loadingRattrapages, setLoadingRattrapages] = useState(false);

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    fetchProfesseurs();
    if (viewMode === 'mensuel') {
      fetchRapportsMensuels();
    }
  }, [selectedPeriod, viewMode]);

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
        `http://195.179.229.230:5000/api/professeur/rapports/mensuel?mois=${selectedPeriod.mois}&annee=${selectedPeriod.annee}`,
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

  const fetchRattrapagesProfesseur = async (professeurId) => {
    if (!professeurId) return;

    try {
      setLoadingRattrapages(true);
      const token = localStorage.getItem('token');
      
      const url = viewMode === 'annuel' 
        ? `http://195.179.229.230:5000/api/professeurs/${professeurId}/rattrapages?annee=${selectedPeriod.annee}`
        : `http://195.179.229.230:5000/api/professeurs/${professeurId}/rattrapages?mois=${selectedPeriod.mois}&annee=${selectedPeriod.annee}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRattrapagesData(data);
        setMessage({ 
          type: 'info', 
          text: `${data.statistiquesRattrapages?.totalRattrapages || 0} rattrapages trouvés pour ${data.professeur.nom}` 
        });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement des rattrapages' });
      }
    } catch (err) {
      console.error('Erreur rattrapages:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoadingRattrapages(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

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

  const totaux = calculateTotals(filteredRapports);

  return (
    <div className="rapports-page-wrapper">
      <Sidebar onLogout={handleLogout} />

      <div className="rapports-container">
        <div className="rapports-header">
          <h1 className="rapports-header-title">Rapports Professeurs</h1>
          <p className="rapports-header-subtitle">
            Consultation et analyse des activités des professeurs
          </p>
        </div>

        <div className="rapports-controls-card">
          <div className="rapports-control-row">
            <select
              className="rapports-select"
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                setRapportIndividuel(null);
                setSelectedProfesseur('');
              }}
            >
              <option value="mensuel">Rapport Mensuel</option>
              <option value="individuel">Rapport Individuel</option>
              <option value="annuel">Rapport Annuel</option>
            </select>

            <select
              className="rapports-select"
              value={selectedPeriod.mois}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
              disabled={viewMode === 'annuel'}
            >
              {viewMode === 'annuel' ? (
                <option value="">Toute l'année</option>
              ) : (
                mois.map((m, index) => (
                  <option key={index} value={index + 1}>{m}</option>
                ))
              )}
            </select>

            <select
              className="rapports-select"
              value={selectedPeriod.annee}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {(viewMode === 'individuel' || viewMode === 'annuel') && (
              <select
                className="rapports-select"
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
              className="rapports-button rapports-button-primary"
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
              className="rapports-button rapports-button-success"
              onClick={() => downloadRapport('csv')}
              disabled={viewMode === 'mensuel' ? rapports.length === 0 : !rapportIndividuel}
            >
              Télécharger CSV
            </button>
          </div>

          {viewMode === 'mensuel' && (
            <div className="rapports-control-row">
              <input
                className="rapports-input"
                placeholder="Rechercher un professeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="rapports-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="tous">Tous les professeurs</option>
                <option value="permanent">Permanents seulement</option>
                <option value="entrepreneur">Entrepreneurs seulement</option>
              </select>
              {(searchTerm || filterType !== 'tous') && (
                <button
                  className="rapports-button rapports-button-danger rapports-button-small"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('tous');
                  }}
                >
                  Effacer filtres
                </button>
              )}
            </div>
          )}
        </div>

        {message.text && (
          <div className={`rapports-message rapports-message-${message.type}`}>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="rapports-loading">
            <div className="rapports-loading-title">Chargement des rapports...</div>
          </div>
        )}

        {viewMode === 'mensuel' && !loading && (
          <>
            {filteredRapports.length > 0 ? (
              <>
                <div className="rapports-stats-grid">
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{filteredRapports.length}</div>
                    <div className="rapports-stat-label">Professeurs Actifs</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{totaux.totalHeures.toFixed(1)}h</div>
                    <div className="rapports-stat-label">Total Heures</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">
                      {filteredRapports.filter(r => r.professeur && !r.professeur.estPermanent).length}
                    </div>
                    <div className="rapports-stat-label">Entrepreneurs</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{totaux.totalAPayer.toFixed(2)} DH</div>
                    <div className="rapports-stat-label">Total à Payer</div>
                  </div>
                </div>

                <div className="rapports-table-wrapper">
                  <table className="rapports-table">
                    <thead>
                      <tr>
                        <th>Professeur</th>
                        <th>Type</th>
                        <th>Heures</th>
                        <th>Séances</th>
                        <th>Tarif/h</th>
                        <th>Total à Payer</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRapports.map(rapport => {
                        if (!rapport || !rapport.professeur || !rapport.statistiques) return null;
                        
                        return (
                          <tr key={rapport.professeur._id}>
                            <td>
                              <div className="rapports-prof-name-cell">
                                {rapport.professeur.nom}
                              </div>
                              <div className="rapports-prof-email">
                                {rapport.professeur.email}
                              </div>
                            </td>
                            <td>
                              <span className={`rapports-badge ${rapport.professeur.estPermanent ? 'rapports-badge-success' : 'rapports-badge-warning'}`}>
                                {rapport.professeur.estPermanent ? 'Permanent' : 'Entrepreneur'}
                              </span>
                            </td>
                            <td>
                              <strong>{safeCalculate(rapport.statistiques, 'totalHeures')}h</strong>
                            </td>
                            <td>
                              {safeCalculate(rapport, 'nombreSeances')}
                            </td>
                            <td>
                              {rapport.professeur.estPermanent ? '-' : `${safeCalculate(rapport.statistiques, 'tarifHoraire')} DH`}
                            </td>
                            <td>
                              <strong className={safeCalculate(rapport.statistiques, 'totalAPayer') > 0 ? 'text-danger' : 'text-muted'}>
                                {rapport.professeur.estPermanent ? '-' : `${safeCalculate(rapport.statistiques, 'totalAPayer').toFixed(2)} DH`}
                              </strong>
                            </td>
                            <td>
                              <div className="rapports-actions-cell">
                                <button
                                  className="rapports-button rapports-button-primary rapports-button-small"
                                  onClick={() => {
                                    setSelectedProfesseur(rapport.professeur._id);
                                    setViewMode('individuel');
                                    fetchRapportIndividuel(rapport.professeur._id);
                                  }}
                                >
                                  Voir Détails
                                </button>
                                <button
                                  className="rapports-button rapports-button-warning rapports-button-small"
                                  onClick={() => {
                                    setSelectedProfesseur(rapport.professeur._id);
                                    fetchRattrapagesProfesseur(rapport.professeur._id);
                                    setShowRattrapages(true);
                                  }}
                                >
                                  Rattrapages
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="rapports-empty-state">
                <div className="rapports-empty-icon">📊</div>
                <div className="rapports-empty-title">Aucun rapport disponible</div>
                <div className="rapports-empty-text">
                  Aucune activité trouvée pour {mois[selectedPeriod.mois - 1]} {selectedPeriod.annee}.
                </div>
                <button
                  className="rapports-button rapports-button-primary mt-2"
                  onClick={fetchRapportsMensuels}
                >
                  Actualiser
                </button>
              </div>
            )}
          </>
        )}

        {(viewMode === 'individuel' || viewMode === 'annuel') && !loading && (
          <>
            {rapportIndividuel ? (
              <>
                <div className="rapports-prof-card">
                  <h3 className="rapports-prof-name">
                    {rapportIndividuel.professeur.nom}
                  </h3>
                  <div className="rapports-prof-info">
                    <span className={`rapports-badge ${rapportIndividuel.professeur.estPermanent ? 'rapports-badge-success' : 'rapports-badge-warning'}`}>
                      {rapportIndividuel.professeur.estPermanent ? 'Permanent' : 'Entrepreneur'}
                    </span>
                    {!rapportIndividuel.professeur.estPermanent && (
                      <span className="text-muted">
                        Tarif: {rapportIndividuel.professeur.tarifHoraire || 0} DH/h
                      </span>
                    )}
                  </div>
                </div>

                {viewMode === 'individuel' ? (
                  <div className="rapports-stats-grid">
                    <div className="rapports-stat-card">
                      <div className="rapports-stat-number">{safeCalculate(rapportIndividuel.statistiques, 'totalHeures')}h</div>
                      <div className="rapports-stat-label">Total Heures</div>
                    </div>
                    <div className="rapports-stat-card">
                      <div className="rapports-stat-number">{safeCalculate(rapportIndividuel.statistiques, 'totalSeances')}</div>
                      <div className="rapports-stat-label">Séances</div>
                    </div>
                    <div className="rapports-stat-card">
                      <div className="rapports-stat-number">{safeCalculate(rapportIndividuel.statistiques, 'coursUniques')}</div>
                      <div className="rapports-stat-label">Cours Différents</div>
                    </div>
                    {!rapportIndividuel.professeur.estPermanent && (
                      <div className="rapports-stat-card">
                        <div className="rapports-stat-number">{safeCalculate(rapportIndividuel.statistiques, 'totalAPayer').toFixed(2)} DH</div>
                        <div className="rapports-stat-label">Total à Payer</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rapports-controls-card">
                    <h4 className="rapports-section-title">
                      Évolution Mensuelle {rapportIndividuel.annee}
                    </h4>
                    {rapportIndividuel.rapportsMensuels && Array.isArray(rapportIndividuel.rapportsMensuels) ? (
                      <div className="rapports-table-wrapper">
                        <table className="rapports-table">
                          <thead>
                            <tr>
                              <th>Mois</th>
                              <th>Heures</th>
                              <th>Séances</th>
                              {!rapportIndividuel.professeur.estPermanent && <th>Montant</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rapportIndividuel.rapportsMensuels.map(rapport => (
                              <tr key={rapport.mois}>
                                <td>{rapport.nomMois}</td>
                                <td>{safeCalculate(rapport.statistiques, 'totalHeures')}h</td>
                                <td>{safeCalculate(rapport, 'nombreSeances')}</td>
                                {!rapportIndividuel.professeur.estPermanent && (
                                  <td>{safeCalculate(rapport.statistiques, 'totalAPayer').toFixed(2)} DH</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rapports-empty-state">
                        <div className="rapports-empty-title">Aucune donnée mensuelle</div>
                      </div>
                    )}
                  </div>
                )}

                {viewMode === 'individuel' && rapportIndividuel.seances && Array.isArray(rapportIndividuel.seances) && rapportIndividuel.seances.length > 0 && (
                  <div className="rapports-controls-card">
                    <h4 className="rapports-section-title">
                      Détail des Séances
                    </h4>
                    <div className="rapports-table-wrapper">
                      <table className="rapports-table">
                        <thead>
                          <tr>
                            <th>Jour</th>
                            <th>Horaire</th>
                            <th>Cours</th>
                            <th>Matière</th>
                            <th>Salle</th>
                            <th>Durée</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rapportIndividuel.seances.map((seance, index) => (
                            <tr key={index}>
                              <td>{seance.jour || 'N/A'}</td>
                              <td>{seance.heureDebut || 'N/A'} - {seance.heureFin || 'N/A'}</td>
                              <td>{seance.cours || 'N/A'}</td>
                              <td>{seance.matiere || '-'}</td>
                              <td>{seance.salle || '-'}</td>
                              <td>{seance.dureeHeures || 0}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : selectedProfesseur ? (
              <div className="rapports-empty-state">
                <div className="rapports-empty-icon">📭</div>
                <div className="rapports-empty-title">Aucune donnée disponible</div>
                <div className="rapports-empty-text">
                  Ce professeur n'a aucune activité enregistrée pour cette période.
                </div>
                <button
                  className="rapports-button rapports-button-primary mt-2"
                  onClick={() => fetchRapportIndividuel(selectedProfesseur)}
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="rapports-empty-state">
                <div className="rapports-empty-icon">👤</div>
                <div className="rapports-empty-title">Sélectionnez un professeur</div>
                <div className="rapports-empty-text">
                  Choisissez un professeur dans la liste ci-dessus pour voir son rapport détaillé.
                </div>
              </div>
            )}
          </>
        )}

        {showRattrapages && (
          <div className="rapports-modal-overlay" onClick={() => setShowRattrapages(false)}>
            <div className="rapports-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="rapports-modal-header">
                <h2 className="rapports-modal-title">
                  Séances en Rattrapage - {rattrapagesData?.professeur?.nom}
                </h2>
              </div>

              <div className="rapports-modal-body">
                {loadingRattrapages ? (
                  <div className="rapports-loading">
                    <div className="rapports-loading-title">Chargement des rattrapages...</div>
                  </div>
                ) : rattrapagesData ? (
                  <>
                    <div className="rapports-rattrapage-stats">
                      <div className="rapports-rattrapage-grid">
                        <div className="rapports-rattrapage-item">
                          <div className="rapports-rattrapage-number">
                            {rattrapagesData.statistiquesRattrapages?.totalRattrapages || 0}
                          </div>
                          <div className="rapports-rattrapage-label">
                            Séances à rattraper
                          </div>
                        </div>
                        <div className="rapports-rattrapage-item">
                          <div className="rapports-rattrapage-number">
                            {rattrapagesData.statistiquesRattrapages?.totalHeuresRattrapage || 0}h
                          </div>
                          <div className="rapports-rattrapage-label">
                            Heures non effectuées
                          </div>
                        </div>
                      </div>
                    </div>

                    {rattrapagesData.rattrapages && rattrapagesData.rattrapages.length > 0 ? (
                      <div className="rapports-table-wrapper">
                        <table className="rapports-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Horaire</th>
                              <th>Cours</th>
                              <th>Durée</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rattrapagesData.rattrapages.map((rattrapage, index) => (
                              <tr key={index}>
                                <td>
                                  {new Date(rattrapage.dateSeance).toLocaleDateString('fr-FR')}
                                </td>
                                <td>
                                  {rattrapage.heureDebut} - {rattrapage.heureFin}
                                </td>
                                <td>{rattrapage.cours}</td>
                                <td>
                                  <strong className="text-danger">{rattrapage.dureeHeures}h</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rapports-empty-state">
                        <div className="rapports-empty-title">Aucun rattrapage</div>
                        <div className="rapports-empty-text">
                          Ce professeur n'a aucune séance en attente de rattrapage.
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center mt-3 mb-3">
                    Aucune donnée de rattrapage disponible
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowRattrapages(false);
                    setRattrapagesData(null);
                  }}
                  className="rapports-button rapports-button-secondary"
                  style={{ width: '100%', marginTop: '20px' }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RapportsProfesseurs;