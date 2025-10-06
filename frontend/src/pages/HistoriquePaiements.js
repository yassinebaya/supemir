import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import './RapportsProfesseurs.css';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const HistoriquePaiements = () => {
  const [historiques, setHistoriques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfesseur, setSelectedProfesseur] = useState('');
  const [professeurs, setProfesseurs] = useState([]);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear(),
    mois: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [statistiques, setStatistiques] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const fetchHistoriques = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.annee && { annee: filters.annee }),
        ...(filters.mois && { mois: filters.mois }),
        ...(selectedProfesseur && { professeurId: selectedProfesseur })
      });

      const url = selectedProfesseur 
        ? `http://195.179.229.230:5000/api/professeurs/${selectedProfesseur}/historique-paiements?${params}`
        : `http://195.179.229.230:5000/api/admin/historique-paiements-global?${params}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setHistoriques(data.historiques);
        setPagination(data.pagination);
        setStatistiques(data.statistiques);
        setMessage({ 
          type: 'success', 
          text: `${data.pagination.total} paiement(s) trouvé(s)` 
        });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement' });
      }
    } catch (err) {
      console.error('Erreur fetch historiques:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  }, [filters.page, filters.limit, filters.annee, filters.mois, selectedProfesseur]);

  useEffect(() => {
    fetchProfesseurs();
    fetchHistoriques();
  }, [fetchHistoriques]);

  const fetchProfesseurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/professeurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfesseurs(data.filter(p => !p.estPermanent));
      }
    } catch (err) {
      console.error('Erreur fetch professeurs:', err);
    }
  };

  const fetchDetailPaiement = async (historiqueId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://195.179.229.230:5000/api/admin/historique-paiements/${historiqueId}/detail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSelectedDetail(data.historique);
        setShowDetailModal(true);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement du détail' });
      }
    } catch (err) {
      console.error('Erreur fetch détail:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    }
  };

  const exporterHistorique = () => {
    try {
      let content = 'Historique des Paiements\n';
      content += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      
      if (selectedProfesseur) {
        const prof = professeurs.find(p => p._id === selectedProfesseur);
        content += `Professeur: ${prof?.nom || 'N/A'}\n\n`;
      }
      
      content += 'RESUME\n';
      content += `Total Paiements: ${statistiques.totalPaiements || 0}\n`;
      content += `Montant Total Net: ${(statistiques.totalMontantNet || 0).toFixed(2)} DH\n`;
      content += `Total Heures: ${(statistiques.totalHeures || 0).toFixed(2)}h\n`;
      content += `Total Séances: ${statistiques.totalSeances || 0}\n\n`;
      
      content += 'DETAIL DES PAIEMENTS\n';
      content += 'Date;Professeur;Cycle;Heures;Montant Brut;Ajustements;Montant Net;Méthode;Référence\n';
      
      historiques.forEach(h => {
        content += `${new Date(h.datePaiement).toLocaleDateString('fr-FR')};${h.professeur?.nom || 'N/A'};${h.numeroCycle || 'N/A'};${h.totalHeures || 0};${(h.montantBrut || 0).toFixed(2)};${(h.totalAjustements || 0).toFixed(2)};${(h.montantNet || 0).toFixed(2)};${h.methodePaiement || 'N/A'};${h.referencePaiement || 'N/A'}\n`;
      });

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historique_paiements_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Historique exporté avec succès' });
    } catch (err) {
      console.error('Erreur export:', err);
      setMessage({ type: 'error', text: 'Erreur lors de l\'export' });
    }
  };

  const resetFilters = () => {
    setFilters({
      annee: new Date().getFullYear(),
      mois: '',
      page: 1,
      limit: 10
    });
    setSelectedProfesseur('');
  };

  return (
    <div className="rapports-page-wrapper">
      <Sidebar onLogout={handleLogout} />
      
      <div className="rapports-container">
        <div className="rapports-header">
          <h1 className="rapports-header-title">Historique des Paiements</h1>
          <p className="rapports-header-subtitle">
            Consultation et analyse des paiements effectués aux professeurs entrepreneurs
          </p>
        </div>

        {message.text && (
          <div className={`rapports-message rapports-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="rapports-controls-card">
          <h3 className="rapports-section-title">
            Filtres de recherche
          </h3>
          
          <div className="historique-filter-grid">
            <select
              className="rapports-select"
              value={selectedProfesseur}
              onChange={(e) => setSelectedProfesseur(e.target.value)}
            >
              <option value="">Tous les professeurs</option>
              {professeurs.map(prof => (
                <option key={prof._id} value={prof._id}>
                  {prof.nom}
                </option>
              ))}
            </select>

            <select
              className="rapports-select"
              value={filters.annee}
              onChange={(e) => setFilters(prev => ({ ...prev, annee: parseInt(e.target.value), page: 1 }))}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              className="rapports-select"
              value={filters.mois}
              onChange={(e) => setFilters(prev => ({ ...prev, mois: e.target.value, page: 1 }))}
            >
              <option value="">Toute l'année</option>
              {mois.map((m, index) => (
                <option key={index} value={index + 1}>{m}</option>
              ))}
            </select>

            <select
              className="rapports-select"
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
            >
              <option value={10}>10 par page</option>
              <option value={20}>20 par page</option>
              <option value={50}>50 par page</option>
            </select>
          </div>

          <div className="rapports-control-row">
            <button
              className="rapports-button rapports-button-primary"
              onClick={fetchHistoriques}
              disabled={loading}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>

            <button
              className="rapports-button rapports-button-success"
              onClick={exporterHistorique}
              disabled={historiques.length === 0}
            >
              Exporter CSV
            </button>

            <button
              className="rapports-button rapports-button-secondary"
              onClick={resetFilters}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {statistiques && Object.keys(statistiques).length > 0 && (
          <div className="rapports-stats-grid">
            <div className="rapports-stat-card">
              <div className="rapports-stat-number">{statistiques.totalPaiements || 0}</div>
              <div className="rapports-stat-label">Paiements Total</div>
            </div>
            <div className="rapports-stat-card">
              <div className="rapports-stat-number">
                {(statistiques.totalMontantNet || 0).toLocaleString('fr-FR')} DH
              </div>
              <div className="rapports-stat-label">Montant Net Total</div>
            </div>
            <div className="rapports-stat-card">
              <div className="rapports-stat-number">{(statistiques.totalHeures || 0).toFixed(1)}h</div>
              <div className="rapports-stat-label">Total Heures</div>
            </div>
            <div className="rapports-stat-card">
              <div className="rapports-stat-number">{statistiques.totalSeances || 0}</div>
              <div className="rapports-stat-label">Total Séances</div>
            </div>
            <div className="rapports-stat-card">
              <div className="rapports-stat-number">
                {(statistiques.totalAjustements || 0).toLocaleString('fr-FR')} DH
              </div>
              <div className="rapports-stat-label">Ajustements Total</div>
            </div>
            {statistiques.nombreProfesseurs && (
              <div className="rapports-stat-card">
                <div className="rapports-stat-number">{statistiques.nombreProfesseurs}</div>
                <div className="rapports-stat-label">Professeurs Payés</div>
              </div>
            )}
          </div>
        )}

        {!loading && historiques.length > 0 ? (
          <>
            <div className="rapports-table-wrapper">
              <table className="rapports-table">
                <thead>
                  <tr>
                    <th>Date Paiement</th>
                    <th>Professeur</th>
                    <th>Cycle</th>
                    <th>Période</th>
                    <th>Séances</th>
                    <th>Heures</th>
                    <th>Montant Brut</th>
                    <th>Ajustements</th>
                    <th>Montant Net</th>
                    <th>Méthode</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historiques.map(historique => (
                    <tr key={historique._id}>
                      <td>
                        <div className="historique-date-cell">
                          {new Date(historique.datePaiement).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="historique-time-cell">
                          {new Date(historique.datePaiement).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="rapports-prof-name-cell">
                          {historique.professeur?.nom}
                        </div>
                        <div className="rapports-prof-email">
                          {historique.professeur?.email}
                        </div>
                      </td>
                      <td>
                        <span className="rapports-badge rapports-badge-info">
                          Cycle #{historique.numeroCycle}
                        </span>
                      </td>
                      <td>
                        <div className="historique-periode-cell">
                          <div>{new Date(historique.periodeDebut).toLocaleDateString('fr-FR')}</div>
                          <div>{new Date(historique.periodeFin).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </td>
                      <td>
                        <strong>{historique.nombreSeances || 0}</strong>
                      </td>
                      <td>
                        <strong>{(historique.totalHeures || 0).toFixed(1)}h</strong>
                      </td>
                      <td>
                        <strong className="text-success">
                          {(historique.montantBrut || 0).toLocaleString('fr-FR')} DH
                        </strong>
                      </td>
                      <td>
                        {(historique.totalAjustements || 0) !== 0 ? (
                          <strong className={(historique.totalAjustements || 0) > 0 ? 'text-danger' : 'text-success'}>
                            {(historique.totalAjustements || 0) > 0 ? '-' : '+'}
                            {Math.abs(historique.totalAjustements || 0).toLocaleString('fr-FR')} DH
                          </strong>
                        ) : (
                          <span className="text-muted">Aucun</span>
                        )}
                      </td>
                      <td>
                        <strong className="historique-montant-net">
                          {(historique.montantNet || 0).toLocaleString('fr-FR')} DH
                        </strong>
                      </td>
                      <td>
                        <span className={`rapports-badge ${
                          historique.methodePaiement === 'virement' ? 'rapports-badge-success' :
                          historique.methodePaiement === 'cheque' ? 'rapports-badge-warning' :
                          'rapports-badge-info'
                        }`}>
                          {historique.methodePaiement?.charAt(0).toUpperCase() + historique.methodePaiement?.slice(1)}
                        </span>
                        {historique.referencePaiement && (
                          <div className="historique-reference">
                            Ref: {historique.referencePaiement}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="rapports-button rapports-button-primary rapports-button-small"
                          onClick={() => fetchDetailPaiement(historique._id)}
                        >
                          Détail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="historique-pagination">
                <button
                  className="rapports-button rapports-button-secondary"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Précédent
                </button>
                
                <span className="historique-pagination-info">
                  Page {pagination.page} sur {pagination.pages}
                </span>
                
                <button
                  className="rapports-button rapports-button-primary"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : !loading && (
          <div className="rapports-empty-state">
            <div className="rapports-empty-icon">📋</div>
            <div className="rapports-empty-title">Aucun historique de paiement</div>
            <div className="rapports-empty-text">
              Aucun paiement ne correspond aux critères de recherche sélectionnés.
            </div>
          </div>
        )}

        {loading && (
          <div className="rapports-loading">
            <div className="rapports-loading-title">Chargement de l'historique...</div>
          </div>
        )}

        {showDetailModal && selectedDetail && (
          <div className="rapports-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="rapports-modal-content finance-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="rapports-modal-header">
                <h2 className="rapports-modal-title">
                  Détail du Paiement - Cycle #{selectedDetail.numeroCycle}
                </h2>
              </div>

              <div className="rapports-modal-body">
                <div className="historique-detail-grid">
                  <div className="historique-info-box historique-info-primary">
                    <h4 className="historique-info-title">
                      Professeur
                    </h4>
                    <div className="historique-info-content">
                      <div><strong>Nom:</strong> {selectedDetail.professeur?.nom}</div>
                      <div><strong>Email:</strong> {selectedDetail.professeur?.email}</div>
                      <div><strong>Tarif:</strong> {selectedDetail.tarifHoraire || 0} DH/h</div>
                    </div>
                  </div>

                  <div className="historique-info-box historique-info-success">
                    <h4 className="historique-info-title historique-info-title-success">
                      Paiement
                    </h4>
                    <div className="historique-info-content">
                      <div><strong>Date:</strong> {new Date(selectedDetail.datePaiement).toLocaleDateString('fr-FR')}</div>
                      <div><strong>Méthode:</strong> {selectedDetail.methodePaiement}</div>
                      <div><strong>Référence:</strong> {selectedDetail.referencePaiement || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="rapports-stats-grid">
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{selectedDetail.nombreSeances || 0}</div>
                    <div className="rapports-stat-label">Séances</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{(selectedDetail.totalHeures || 0).toFixed(1)}h</div>
                    <div className="rapports-stat-label">Heures</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{(selectedDetail.montantBrut || 0).toLocaleString('fr-FR')} DH</div>
                    <div className="rapports-stat-label">Montant Brut</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{(selectedDetail.totalAjustements || 0).toLocaleString('fr-FR')} DH</div>
                    <div className="rapports-stat-label">Ajustements</div>
                  </div>
                  <div className="rapports-stat-card">
                    <div className="rapports-stat-number">{(selectedDetail.montantNet || 0).toLocaleString('fr-FR')} DH</div>
                    <div className="rapports-stat-label">Montant Net</div>
                  </div>
                </div>

                {selectedDetail.ajustementsAppliques && selectedDetail.ajustementsAppliques.length > 0 && (
                  <div className="mb-3">
                    <h4 className="rapports-section-title">
                      Ajustements Appliqués
                    </h4>
                    <div className="rapports-table-wrapper">
                      <table className="rapports-table">
                        <thead>
                          <tr>
                            <th>Motif</th>
                            <th>Type</th>
                            <th>Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDetail.ajustementsAppliques.map((ajust, index) => (
                            <tr key={index}>
                              <td>{ajust.motif}</td>
                              <td>{ajust.type}</td>
                              <td>
                                <strong className={ajust.montantAjustement > 0 ? 'text-danger' : 'text-success'}>
                                  {(ajust.montantAjustement || 0) > 0 ? '-' : '+'}
                                  {Math.abs(ajust.montantAjustement || 0).toFixed(2)} DH
                                </strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedDetail.seancesPayees && selectedDetail.seancesPayees.length > 0 && (
                  <div className="mb-3">
                    <h4 className="rapports-section-title">
                      Séances Payées ({selectedDetail.seancesPayees.length})
                    </h4>
                    <div className="historique-seances-scroll">
                      <table className="rapports-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Cours</th>
                            <th>Horaires</th>
                            <th>Durée</th>
                            <th>Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDetail.seancesPayees.map((seance, index) => (
                            <tr key={index}>
                              <td>
                                {new Date(seance.dateSeance).toLocaleDateString('fr-FR')}
                              </td>
                              <td>{seance.cours}</td>
                              <td>{seance.heureDebut || 'N/A'} - {seance.heureFin || 'N/A'}</td>
                              <td>{(seance.dureeHeures || 0).toFixed(2)}h</td>
                              <td>
                                <strong>{(seance.montantSeance || 0).toFixed(2)} DH</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(selectedDetail.notesFinance || selectedDetail.notesAdmin) && (
                  <div className="mb-3">
                    <h4 className="rapports-section-title">Notes</h4>
                    {selectedDetail.notesFinance && (
                      <div className="historique-note historique-note-finance">
                        <strong>Finance:</strong> {selectedDetail.notesFinance}
                      </div>
                    )}
                    {selectedDetail.notesAdmin && (
                      <div className="historique-note historique-note-admin">
                        <strong>Admin:</strong> {selectedDetail.notesAdmin}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDetail(null);
                  }}
                  className="rapports-button rapports-button-secondary"
                  style={{ width: '100%' }}
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

export default HistoriquePaiements;