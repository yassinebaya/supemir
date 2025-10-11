import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './RapportsProfesseurs.css';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const GestionFinanciere = () => {
  const navigate = useNavigate();
  const [professeurs, setProfesseurs] = useState([]);
  const [rapportsFinanciers, setRapportsFinanciers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear()
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const [showPenaliteModal, setShowPenaliteModal] = useState(false);
  const [selectedProfesseur, setSelectedProfesseur] = useState(null);
  const [penaliteData, setPenaliteData] = useState({
    type: 'pourcentage',
    valeur: '',
    motif: '',
    appliquePour: 'mois_actuel'
  });
  const [loadingPenalite, setLoadingPenalite] = useState(false);

  const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
  const [historiquePenalites, setHistoriquePenalites] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  const [loadingValidation, setLoadingValidation] = useState(false);

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    fetchRapportsFinanciers();
  }, [selectedPeriod]);

  const safeCalculate = (data, field, defaultValue = 0) => {
    if (!data || typeof data[field] !== 'number') return defaultValue;
    return data[field];
  };

  const getStatutAffichage = (statutCycle) => {
    switch (statutCycle) {
      case 'en_cours':
        return 'En cours';
      case 'valide_finance':
        return 'Validé Finance';
      case 'paye_admin':
        return 'Payé';
      case 'archive':
        return 'Archivé';
      default:
        return 'En attente';
    }
  };

  const fetchRapportsFinanciers = async () => {
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
        
        const entrepreneurs = Array.isArray(data.rapports) ? 
          data.rapports.map(rapport => ({
            professeur: rapport.professeur,
            donnees: {
              totalHeures: rapport.statistiques?.totalHeures || 0,
              tarifHoraire: rapport.statistiques?.tarifHoraire || 0,
              montantBrut: rapport.statistiques?.totalAPayerOriginal || 0,
              ajustements: Math.abs(rapport.statistiques?.penaliteAppliquee || 0),
              montantNet: rapport.statistiques?.totalAPayer || 0,
              
              cycleId: rapport.statistiques?.cycleId,
              numeroCycle: rapport.statistiques?.numeroCycle || 1,
              statutCycle: rapport.statistiques?.statutCycle || 'en_cours',
              dateValidationFinance: rapport.statistiques?.dateValidationFinance,
              datePaiementAdmin: rapport.statistiques?.datePaiementAdmin,
              
              statutAffichage: getStatutAffichage(rapport.statistiques?.statutCycle || 'en_cours'),
              peutPayer: rapport.statistiques?.statutCycle === 'valide_finance',
              estPaye: rapport.statistiques?.statutCycle === 'paye_admin',
              
              ajustementInfo: rapport.penaliteInfo || null,
              paiementValide: rapport.paiementValide || false,
              dateValidation: rapport.dateValidation || null,
              
              cycleInfo: {
                estCycleEnCours: rapport.statistiques?.statutCycle === 'en_cours',
                seancesCount: rapport.statistiques?.totalSeances || 0
              }
            }
          })) : [];
        
        setRapportsFinanciers(entrepreneurs);
        
        if (entrepreneurs.length > 0) {
          setMessage({ 
            type: 'success', 
            text: `${entrepreneurs.length} entrepreneurs avec cycles actifs trouvés pour ${mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}` 
          });
        } else {
          setMessage({ 
            type: 'warning', 
            text: `Aucun cycle actif trouvé pour ${mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}` 
          });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.message || 'Erreur lors du chargement des données financières' 
        });
      }
    } catch (err) {
      console.error('Erreur rapports financiers:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const rafraichirApresAction = async () => {
    setMessage({ type: 'info', text: 'Mise à jour des données...' });
    await fetchRapportsFinanciers();
  };

  const appliquerAjustement = async () => {
    if (!selectedProfesseur) {
      setMessage({ type: 'error', text: 'Aucun professeur sélectionné' });
      return;
    }
    
    if (!penaliteData.motif || penaliteData.motif.trim() === '') {
      setMessage({ type: 'error', text: 'Le motif est obligatoire' });
      return;
    }
    
    const valeurNumerique = parseFloat(penaliteData.valeur);
    if (isNaN(valeurNumerique) || valeurNumerique === 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer une valeur numérique valide différente de 0' });
      return;
    }

    try {
      setLoadingPenalite(true);
      setMessage({ type: '', text: '' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }
      
      const payload = {
        professeurId: selectedProfesseur._id,
        mois: selectedPeriod.mois,
        annee: selectedPeriod.annee,
        type: penaliteData.type,
        valeur: valeurNumerique,
        motif: penaliteData.motif.trim(),
        appliquePour: penaliteData.appliquePour
      };

      const res = await fetch('http://195.179.229.230:5000/api/finance/appliquer-penalite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        
        setMessage({ 
          type: 'success', 
          text: `Ajustement appliqué à ${selectedProfesseur.nom}. Nouveau montant: ${result.nouveauMontant?.toFixed(2) || 'N/A'} DH` 
        });
        
        setShowPenaliteModal(false);
        setSelectedProfesseur(null);
        setPenaliteData({
          type: 'pourcentage',
          valeur: '',
          motif: '',
          appliquePour: 'mois_actuel'
        });
        
        await rafraichirApresAction();
        
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.error || errorData.message || 'Erreur lors de l\'application de l\'ajustement' 
        });
      }
    } catch (err) {
      console.error('Erreur ajustement:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoadingPenalite(false);
    }
  };

  const fetchHistoriqueAjustements = async (professeurId) => {
    try {
      setLoadingHistorique(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`http://195.179.229.230:5000/api/finance/penalites/historique/${professeurId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setHistoriquePenalites(data.penalites || []);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement de l\'historique' });
      }
    } catch (err) {
      console.error('Erreur historique:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoadingHistorique(false);
    }
  };

  const supprimerAjustement = async (ajustementId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet ajustement ?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`http://195.179.229.230:5000/api/finance/penalites/${ajustementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Ajustement supprimé avec succès' });
        
        if (selectedProfesseur) {
          fetchHistoriqueAjustements(selectedProfesseur._id);
        }
        fetchRapportsFinanciers();
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const validerCycleParFinance = async (professeurId) => {
    try {
      setLoadingValidation(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch('http://195.179.229.230:5000/api/finance/cycles/valider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          professeurId: professeurId,
          notes: `Validé par Finance le ${new Date().toLocaleDateString('fr-FR')}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        setMessage({ 
          type: 'success', 
          text: `Cycle validé ! Montant: ${data.cycle.montantNet.toFixed(2)} DH. En attente de paiement par l'Admin.` 
        });
        
        await rafraichirApresAction();
      } else {
        const error = await res.json().catch(() => ({}));
        
        setMessage({ 
          type: 'error', 
          text: error.error || 'Erreur lors de la validation du cycle' 
        });
      }
    } catch (err) {
      console.error('Erreur validation:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoadingValidation(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const allerVersValidationAdmin = (professeurId) => {
    navigate(`/validation-paiement/${professeurId}?type=cycle`);
  };

  const exporterDonneesFinancieres = () => {
    try {
      const totaux = calculateTotals();
      
      let content = '';
      content += `Rapport Financier - ${mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}\n`;
      content += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      
      content += `RESUME FINANCIER\n`;
      content += `Total Entrepreneurs: ${filteredRapports.length}\n`;
      content += `Montant Brut Total: ${totaux.montantBrut.toFixed(2)} DH\n`;
      content += `Total Ajustements: ${totaux.totalAjustements.toFixed(2)} DH\n`;
      content += `Montant Net Total: ${totaux.montantNet.toFixed(2)} DH\n`;
      content += `Paiements Validés: ${totaux.paiementsValides}\n`;
      content += `Paiements En Attente: ${totaux.paiementsEnAttente}\n\n`;
      
      content += `DETAIL PAR ENTREPRENEUR\n`;
      content += `Nom;Email;Heures;Tarif/h;Montant Brut;Ajustements;Montant Net;Statut Paiement;Date Validation\n`;
      
      filteredRapports.forEach(rapport => {
        if (!rapport || !rapport.professeur || !rapport.donnees) return;
        
        const prof = rapport.professeur;
        const donnees = rapport.donnees;
        content += `${prof.nom || 'N/A'};${prof.email || 'N/A'};${safeCalculate(donnees, 'totalHeures')};${safeCalculate(donnees, 'tarifHoraire')};${safeCalculate(donnees, 'montantBrut').toFixed(2)};${safeCalculate(donnees, 'ajustements').toFixed(2)};${safeCalculate(donnees, 'montantNet').toFixed(2)};${donnees.statutAffichage || 'En attente'};${donnees.dateValidation ? new Date(donnees.dateValidation).toLocaleDateString('fr-FR') : 'N/A'}\n`;
      });

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rapport_financier_${selectedPeriod.mois}_${selectedPeriod.annee}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Rapport financier exporté avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Erreur export:', err);
      setMessage({ type: 'error', text: 'Erreur lors de l\'export' });
    }
  };

  const calculateTotals = () => {
    if (!Array.isArray(rapportsFinanciers) || rapportsFinanciers.length === 0) {
      return { 
        montantBrut: 0, 
        totalAjustements: 0, 
        montantNet: 0,
        paiementsValides: 0,
        paiementsEnAttente: 0
      };
    }

    return rapportsFinanciers.reduce((acc, rapport) => {
      if (!rapport || !rapport.donnees) return acc;
      
      const donnees = rapport.donnees;
      
      return {
        montantBrut: acc.montantBrut + safeCalculate(donnees, 'montantBrut'),
        totalAjustements: acc.totalAjustements + safeCalculate(donnees, 'ajustements'),
        montantNet: acc.montantNet + safeCalculate(donnees, 'montantNet'),
        paiementsValides: acc.paiementsValides + (donnees.estPaye ? 1 : 0),
        paiementsEnAttente: acc.paiementsEnAttente + (donnees.estPaye ? 0 : 1)
      };
    }, { 
      montantBrut: 0, 
      totalAjustements: 0, 
      montantNet: 0,
      paiementsValides: 0,
      paiementsEnAttente: 0
    });
  };

  const filteredRapports = rapportsFinanciers.filter(rapport => {
    if (!rapport || !rapport.professeur) return false;
    return rapport.professeur.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });

  const totaux = calculateTotals();

  return (
    <div className="rapports-page-wrapper">
      <Sidebar onLogout={handleLogout} />
      
      <div className="rapports-container">
        <div className="rapports-header">
          <h1 className="rapports-header-title">Gestion Financière</h1>
          <p className="rapports-header-subtitle">
            Gérez les paiements, ajustements et validations des entrepreneurs
          </p>
        </div>

        <div className="rapports-controls-card">
          <div className="rapports-control-row">
            <select
              className="rapports-select"
              value={selectedPeriod.mois}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
            >
              {mois.map((m, index) => (
                <option key={index} value={index + 1}>{m}</option>
              ))}
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

            <button
              className="rapports-button rapports-button-primary"
              onClick={fetchRapportsFinanciers}
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>

            <button
              className="rapports-button rapports-button-success"
              onClick={exporterDonneesFinancieres}
              disabled={filteredRapports.length === 0}
            >
              Exporter CSV
            </button>
          </div>

          <div className="rapports-control-row">
            <input
              className="rapports-input"
              placeholder="Rechercher un entrepreneur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="rapports-button rapports-button-danger rapports-button-small"
                onClick={() => setSearchTerm('')}
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        <div className="rapports-controls-card">
          <h3 className="rapports-section-title">
            Système de Cycles de Paiement
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="finance-cycle-info">
              <div className="finance-cycle-title">Cycle En Cours</div>
              <div className="finance-cycle-text">
                Séances non payées accumulées depuis le dernier paiement. Ajustements possibles et validation Finance requise.
              </div>
            </div>
            
            <div className="finance-cycle-info finance-cycle-valide">
              <div className="finance-cycle-title">Validé Finance</div>
              <div className="finance-cycle-text">
                Cycle approuvé avec montant final confirmé. Prêt pour paiement Admin. Ajustements verrouillés.
              </div>
            </div>
            
            <div className="finance-cycle-info finance-cycle-paye">
              <div className="finance-cycle-title">Payé - Nouveau Cycle</div>
              <div className="finance-cycle-text">
                Paiement effectué, nouveau cycle créé automatiquement. Historique préservé et données remises à zéro.
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`rapports-message rapports-message-${message.type}`}>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="rapports-loading">
            <div className="rapports-loading-title">Chargement en cours</div>
            <div className="text-muted">Récupération des données financières...</div>
          </div>
        )}

        {!loading && (
          <>
            {filteredRapports.length > 0 ? (
              <>
                <div className="rapports-stats-grid">
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{filteredRapports.length}</div>
                    <div className="rapports-stat-label">Entrepreneurs Actifs</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{totaux.montantBrut.toFixed(0)} DH</div>
                    <div className="rapports-stat-label">Montant Brut Total</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{totaux.totalAjustements.toFixed(0)} DH</div>
                    <div className="rapports-stat-label">Total Ajustements</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{totaux.montantNet.toFixed(0)} DH</div>
                    <div className="rapports-stat-label">Montant Net à Payer</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{totaux.paiementsValides}</div>
                    <div className="rapports-stat-label">Paiements Validés</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{totaux.paiementsEnAttente}</div>
                    <div className="rapports-stat-label">En Attente</div>
                  </div>
                </div>

                <div className="rapports-table-wrapper">
                  <table className="rapports-table">
                    <thead>
                      <tr>
                        <th>Entrepreneur</th>
                        <th>Cycle Actuel</th>
                        <th>Heures</th>
                        <th>Tarif/h</th>
                        <th>Montant Brut</th>
                        <th>Ajustements</th>
                        <th>Montant Net</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRapports.map(rapport => {
                        if (!rapport || !rapport.professeur || !rapport.donnees) return null;
                        
                        const prof = rapport.professeur;
                        const donnees = rapport.donnees;
                        
                        return (
                          <tr key={prof._id}>
                            <td>
                              <div className="rapports-prof-name-cell">
                                {prof.nom}
                              </div>
                              <div className="rapports-prof-email">
                                {prof.email}
                              </div>
                            </td>
                            <td>
                              <div className="finance-cycle-number">
                                Cycle #{donnees.numeroCycle}
                              </div>
                              <div className="finance-seances-count">
                                {donnees.cycleInfo?.seancesCount || 0} séance(s)
                              </div>
                            </td>
                            <td>
                              <strong className="finance-heures-count">
                                {safeCalculate(donnees, 'totalHeures')}h
                              </strong>
                            </td>
                            <td>
                              <strong>{safeCalculate(donnees, 'tarifHoraire')} DH</strong>
                            </td>
                            <td>
                              <strong className="finance-montant-brut">
                                {safeCalculate(donnees, 'montantBrut').toFixed(2)} DH
                              </strong>
                            </td>
                            <td>
                              {donnees.ajustements !== 0 ? (
                                <div>
                                  <strong className={donnees.ajustements > 0 ? 'text-danger' : 'text-success'}>
                                    {donnees.ajustements > 0 ? '-' : '+'}
                                    {Math.abs(donnees.ajustements).toFixed(2)} DH
                                  </strong>
                                  {donnees.ajustementInfo && (
                                    <div className="finance-ajustement-motif">
                                      {donnees.ajustementInfo.motif.substring(0, 20)}...
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">Aucun</span>
                              )}
                            </td>
                            <td>
                              <strong className="finance-montant-net">
                                {safeCalculate(donnees, 'montantNet').toFixed(2)} DH
                              </strong>
                            </td>
                            <td>
                              <span className={`rapports-badge ${
                                donnees.statutCycle === 'paye_admin' ? 'rapports-badge-success' : 
                                donnees.statutCycle === 'valide_finance' ? 'rapports-badge-info' :
                                'rapports-badge-warning'
                              }`}>
                                {donnees.statutAffichage || 'En attente'}
                              </span>
                            </td>
                            <td>
                              <div className="rapports-actions-cell">
                                {donnees.statutCycle === 'en_cours' && (
                                  <>
                                    <button
                                      className="rapports-button rapports-button-danger rapports-button-small"
                                      onClick={() => {
                                        setSelectedProfesseur(prof);
                                        setShowPenaliteModal(true);
                                      }}
                                    >
                                      Ajustement
                                    </button>
                                    <button
                                      className="rapports-button rapports-button-success rapports-button-small"
                                      onClick={() => validerCycleParFinance(prof._id)}
                                      disabled={loadingValidation}
                                    >
                                      Valider Finance
                                    </button>
                                  </>
                                )}

                                {donnees.statutCycle === 'valide_finance' && (
                                  <button
                                    className="rapports-button rapports-button-warning rapports-button-small"
                                    onClick={() => allerVersValidationAdmin(prof._id)}
                                  >
                                    Vers Paiement
                                  </button>
                                )}

                                {donnees.statutCycle === 'paye_admin' && (
                                  <div className="finance-paye-badge">
                                    Payé
                                  </div>
                                )}
                                
                                <button
                                  className="rapports-button rapports-button-secondary rapports-button-small"
                                  onClick={() => {
                                    setSelectedProfesseur(prof);
                                    fetchHistoriqueAjustements(prof._id);
                                    setShowHistoriqueModal(true);
                                  }}
                                >
                                  Historique
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
                <div className="rapports-empty-title">
                  {rapportsFinanciers.length === 0 ? 'Aucune donnée financière' : 'Aucun résultat'}
                </div>
                <div className="rapports-empty-text">
                  {rapportsFinanciers.length === 0 
                    ? `Aucun entrepreneur actif pour ${mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}.`
                    : `Aucun entrepreneur ne correspond à "${searchTerm}".`
                  }
                </div>
              </div>
            )}
          </>
        )}

        {showPenaliteModal && (
          <div className="rapports-modal-overlay" onClick={() => setShowPenaliteModal(false)}>
            <div className="rapports-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="rapports-modal-header">
                <h2 className="rapports-modal-title">Appliquer un Ajustement</h2>
              </div>

              <div className="rapports-modal-body">
                <div className="finance-info-box">
                  <div className="finance-info-grid">
                    <div>
                      <strong>Entrepreneur:</strong> {selectedProfesseur?.nom}<br/>
                      <strong>Email:</strong> {selectedProfesseur?.email}
                    </div>
                    <div>
                      <strong>Tarif:</strong> {selectedProfesseur?.tarifHoraire || 0} DH/h<br/>
                      <strong>Période:</strong> {mois[selectedPeriod.mois - 1]} {selectedPeriod.annee}
                    </div>
                  </div>
                </div>

                <div className="finance-form-group">
                  <label className="finance-label">Type d'ajustement</label>
                  <select
                    className="rapports-select"
                    value={penaliteData.type}
                    onChange={(e) => setPenaliteData({ ...penaliteData, type: e.target.value })}
                  >
                    <option value="pourcentage">Pourcentage du montant total</option>
                    <option value="montant_fixe">Montant fixe en DH</option>
                  </select>
                </div>

                <div className="finance-form-group">
                  <label className="finance-label">
                    {penaliteData.type === 'pourcentage' ? 'Pourcentage (%)' : 'Montant (DH)'}
                  </label>
                  <input
                    type="number"
                    className="rapports-input"
                    value={penaliteData.valeur}
                    onChange={(e) => setPenaliteData({ ...penaliteData, valeur: e.target.value })}
                    placeholder={penaliteData.type === 'pourcentage' ? 'Ex: 10 ou -5' : 'Ex: 500 ou -200'}
                    step={penaliteData.type === 'pourcentage' ? "0.1" : "0.01"}
                  />
                  <div className="finance-field-hint">
                    Valeurs négatives pour rabais (ex: -10)
                  </div>
                </div>

                <div className="finance-form-group">
                  <label className="finance-label">Motif (obligatoire)</label>
                  <textarea
                    className="finance-textarea"
                    value={penaliteData.motif}
                    onChange={(e) => setPenaliteData({ ...penaliteData, motif: e.target.value })}
                    placeholder="Ex: Retards répétés, Prime de performance..."
                  />
                </div>

                <div className="finance-form-group">
                  <label className="finance-label">Appliquer pour</label>
                  <select
                    className="rapports-select"
                    value={penaliteData.appliquePour}
                    onChange={(e) => setPenaliteData({ ...penaliteData, appliquePour: e.target.value })}
                  >
                    <option value="mois_actuel">Ce mois uniquement</option>
                    <option value="permanent">Tous les mois suivants</option>
                  </select>
                </div>

                {penaliteData.valeur && penaliteData.valeur !== '' && selectedProfesseur && (
                  <div className="finance-preview-box">
                    <div className="finance-preview-title">Aperçu du calcul</div>
                    {(() => {
                      const rapportActuel = filteredRapports.find(r => r.professeur._id === selectedProfesseur._id);
                      const montantActuel = rapportActuel?.donnees?.montantNet || rapportActuel?.donnees?.montantBrut || 0;
                      
                      let ajustement = 0;
                      if (penaliteData.type === 'pourcentage') {
                        ajustement = (montantActuel * parseFloat(penaliteData.valeur || 0)) / 100;
                      } else {
                        ajustement = parseFloat(penaliteData.valeur || 0);
                      }
                      
                      const nouveauMontant = montantActuel - ajustement;
                      
                      return (
                        <div className="finance-preview-content">
                          <div>Montant actuel: <strong>{montantActuel.toFixed(2)} DH</strong></div>
                          <div>Ajustement: <strong className={ajustement >= 0 ? 'text-danger' : 'text-success'}>
                            {ajustement >= 0 ? '-' : '+'}{Math.abs(ajustement).toFixed(2)} DH
                          </strong></div>
                          <div>Nouveau montant: <strong className="finance-preview-total">
                            {nouveauMontant.toFixed(2)} DH
                          </strong></div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="rapports-modal-footer">
                <button
                  className="rapports-button rapports-button-secondary"
                  onClick={() => {
                    setShowPenaliteModal(false);
                    setSelectedProfesseur(null);
                    setPenaliteData({
                      type: 'pourcentage',
                      valeur: '',
                      motif: '',
                      appliquePour: 'mois_actuel'
                    });
                  }}
                >
                  Annuler
                </button>
                <button
                  className="rapports-button rapports-button-danger"
                  onClick={appliquerAjustement}
                  disabled={loadingPenalite || !penaliteData.valeur || !penaliteData.motif.trim()}
                >
                  {loadingPenalite ? 'Application...' : 'Appliquer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistoriqueModal && (
          <div className="rapports-modal-overlay" onClick={() => setShowHistoriqueModal(false)}>
            <div className="rapports-modal-content finance-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="rapports-modal-header">
                <h2 className="rapports-modal-title">Historique - {selectedProfesseur?.nom}</h2>
              </div>

              <div className="rapports-modal-body">
                {loadingHistorique ? (
                  <div className="rapports-loading">
                    <div className="rapports-loading-title">Chargement de l'historique...</div>
                  </div>
                ) : historiquePenalites.length > 0 ? (
                  <div className="rapports-table-wrapper">
                    <table className="rapports-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Période</th>
                          <th>Type</th>
                          <th>Valeur</th>
                          <th>Ajustement</th>
                          <th>Motif</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historiquePenalites.map((ajustement, index) => (
                          <tr key={index}>
                            <td>
                              {new Date(ajustement.dateApplication).toLocaleDateString('fr-FR')}
                            </td>
                            <td>
                              {mois[ajustement.mois - 1]} {ajustement.annee}
                            </td>
                            <td>
                              <span className={`rapports-badge ${
                                ajustement.type === 'pourcentage' ? 'rapports-badge-info' : 'rapports-badge-warning'
                              }`}>
                                {ajustement.type === 'pourcentage' ? 'Pourcentage' : 'Fixe'}
                              </span>
                            </td>
                            <td>
                              <strong>
                                {ajustement.type === 'pourcentage' ? `${ajustement.valeur}%` : `${ajustement.valeur} DH`}
                              </strong>
                            </td>
                            <td>
                              <span className={
                                (ajustement.montantOriginal - ajustement.montantAjuste) > 0 ? 'text-danger font-bold' : 'text-success font-bold'
                              }>
                                {(ajustement.montantOriginal - ajustement.montantAjuste) > 0 ? '-' : '+'}
                                {Math.abs(ajustement.montantOriginal - ajustement.montantAjuste).toFixed(2)} DH
                              </span>
                            </td>
                            <td>
                              <div className="finance-motif-cell" title={ajustement.motif}>
                                {ajustement.motif}
                              </div>
                            </td>
                            <td>
                              <button
                                className="rapports-button rapports-button-danger rapports-button-small"
                                onClick={() => supprimerAjustement(ajustement._id)}
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rapports-empty-state">
                    <div className="rapports-empty-title">
                      Aucun historique
                    </div>
                    <div className="rapports-empty-text">Aucun ajustement trouvé pour cet entrepreneur.</div>
                  </div>
                )}
              </div>

              <div className="rapports-modal-footer">
                <button
                  className="rapports-button rapports-button-secondary"
                  onClick={() => {
                    setShowHistoriqueModal(false);
                    setHistoriquePenalites([]);
                    setSelectedProfesseur(null);
                  }}
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

export default GestionFinanciere;