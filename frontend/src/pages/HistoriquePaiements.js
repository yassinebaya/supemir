import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Eye, Calendar,  Clock, FileText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';

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

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1800px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #0ea5e9 100%)',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    },
    header: {
      backgroundColor: '#fff',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      marginBottom: '25px',
      textAlign: 'center',
      border: '3px solid #0ea5e9'
    },
    filtersCard: {
      backgroundColor: '#fff',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      marginBottom: '25px',
      border: '2px solid #38bdf8'
    },
    filterRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '15px'
    },
    input: {
      padding: '10px 15px',
      border: '2px solid #38bdf8',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#f8fafc'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#0ea5e9',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s'
    },
    buttonSuccess: {
      backgroundColor: '#10b981'
    },
    buttonDanger: {
      backgroundColor: '#ef4444'
    },
    buttonSecondary: {
      backgroundColor: '#6b7280'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '25px'
    },
    statCard: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: '2px solid #38bdf8'
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#0ea5e9'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6b7280',
      marginTop: '5px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      border: '2px solid #38bdf8'
    },
    th: {
      backgroundColor: '#f0f9ff',
      padding: '15px 12px',
      textAlign: 'left',
      fontWeight: '700',
      color: '#0c4a6e',
      borderBottom: '3px solid #0ea5e9',
      fontSize: '13px'
    },
    td: {
      padding: '15px 12px',
      borderBottom: '1px solid #e2e8f0'
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    },
    badgeSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    badgeWarning: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    badgeInfo: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '15px',
      width: '90%',
      maxWidth: '1000px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      border: '3px solid #0ea5e9'
    },
    message: {
      padding: '15px 20px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
      fontWeight: '500'
    },
    messageSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '2px solid #10b981'
    },
    messageError: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '2px solid #ef4444'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '20px',
      padding: '20px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#6b7280',
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '2px solid #38bdf8'
    }
  };

  return (
    <div style={styles.container}>
      {/* En-tête */}      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#0c4a6e' }}>
          Historique des Paiements
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#6b7280', fontSize: '16px' }}>
          Consultation et analyse des paiements effectués aux professeurs entrepreneurs
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.messageError : styles.messageSuccess)
        }}>
          {message.text}
        </div>
      )}

      {/* Filtres */}
      <div style={styles.filtersCard}>
        <h3 style={{ margin: '0 0 20px 0', color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={20} />
          Filtres de recherche
        </h3>
        
        <div style={styles.filterRow}>
          <select
            style={styles.input}
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
            style={styles.input}
            value={filters.annee}
            onChange={(e) => setFilters(prev => ({ ...prev, annee: parseInt(e.target.value), page: 1 }))}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            style={styles.input}
            value={filters.mois}
            onChange={(e) => setFilters(prev => ({ ...prev, mois: e.target.value, page: 1 }))}
          >
            <option value="">Toute l'année</option>
            {mois.map((m, index) => (
              <option key={index} value={index + 1}>{m}</option>
            ))}
          </select>

          <select
            style={styles.input}
            value={filters.limit}
            onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
          >
            <option value={10}>10 par page</option>
            <option value={20}>20 par page</option>
            <option value={50}>50 par page</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button
            style={styles.button}
            onClick={fetchHistoriques}
            disabled={loading}
          >
            <Search size={16} />
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>

          <button
            style={{ ...styles.button, ...styles.buttonSuccess }}
            onClick={exporterHistorique}
            disabled={historiques.length === 0}
          >
            <Download size={16} />
            Exporter CSV
          </button>

          <button
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={resetFilters}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {statistiques && Object.keys(statistiques).length > 0 && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{statistiques.totalPaiements || 0}</div>
            <div style={styles.statLabel}>Paiements Total</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>
              {(statistiques.totalMontantNet || 0).toLocaleString('fr-FR')} DH
            </div>
            <div style={styles.statLabel}>Montant Net Total</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{(statistiques.totalHeures || 0).toFixed(1)}h</div>
            <div style={styles.statLabel}>Total Heures</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{statistiques.totalSeances || 0}</div>
            <div style={styles.statLabel}>Total Séances</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>
              {(statistiques.totalAjustements || 0).toLocaleString('fr-FR')} DH
            </div>
            <div style={styles.statLabel}>Ajustements Total</div>
          </div>
          {statistiques.nombreProfesseurs && (
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{statistiques.nombreProfesseurs}</div>
              <div style={styles.statLabel}>Professeurs Payés</div>
            </div>
          )}
        </div>
      )}

      {/* Tableau des historiques */}
      {!loading && historiques.length > 0 ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date Paiement</th>
                  <th style={styles.th}>Professeur</th>
                  <th style={styles.th}>Cycle</th>
                  <th style={styles.th}>Période</th>
                  <th style={styles.th}>Séances</th>
                  <th style={styles.th}>Heures</th>
                  <th style={styles.th}>Montant Brut</th>
                  <th style={styles.th}>Ajustements</th>
                  <th style={styles.th}>Montant Net</th>
                  <th style={styles.th}>Méthode</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historiques.map(historique => (
                  <tr key={historique._id}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#0ea5e9" />
                        <div>
                          <strong>{new Date(historique.datePaiement).toLocaleDateString('fr-FR')}</strong>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {new Date(historique.datePaiement).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <strong>{historique.professeur?.nom}</strong>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {historique.professeur?.email}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...styles.badgeInfo
                      }}>
                        Cycle #{historique.numeroCycle}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '13px' }}>
                        <div>Du: {new Date(historique.periodeDebut).toLocaleDateString('fr-FR')}</div>
                        <div>Au: {new Date(historique.periodeFin).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileText size={16} color="#0ea5e9" />
                        <strong>{historique.nombreSeances || 0}</strong>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={16} color="#0ea5e9" />
                        <strong>{(historique.totalHeures || 0).toFixed(1)}h</strong>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <strong style={{ color: '#059669' }}>
                        {(historique.montantBrut || 0).toLocaleString('fr-FR')} DH
                      </strong>
                    </td>
                    <td style={styles.td}>
                      {(historique.totalAjustements || 0) !== 0 ? (
                        <strong style={{ 
                          color: (historique.totalAjustements || 0) > 0 ? '#dc2626' : '#10b981' 
                        }}>
                          {(historique.totalAjustements || 0) > 0 ? '-' : '+'}
                          {Math.abs(historique.totalAjustements || 0).toLocaleString('fr-FR')} DH
                        </strong>
                      ) : (
                        <span style={{ color: '#6b7280' }}>Aucun</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <strong style={{ color: '#dc2626', fontSize: '15px' }}>
                          {(historique.montantNet || 0).toLocaleString('fr-FR')} DH
                        </strong>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(historique.methodePaiement === 'virement' ? styles.badgeSuccess :
                            historique.methodePaiement === 'cheque' ? styles.badgeWarning :
                            styles.badgeInfo)
                      }}>
                        {historique.methodePaiement.charAt(0).toUpperCase() + historique.methodePaiement.slice(1)}
                      </span>
                      {historique.referencePaiement && (
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          Ref: {historique.referencePaiement}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{ ...styles.button, fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => fetchDetailPaiement(historique._id)}
                      >
                        <Eye size={14} />
                        Détail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{ 
                  ...styles.button, 
                  opacity: pagination.page === 1 ? 0.5 : 1 
                }}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              
              <span style={{ padding: '10px 20px', color: '#0c4a6e', fontWeight: '600' }}>
                Page {pagination.page} sur {pagination.pages}
              </span>
              
              <button
                style={{ 
                  ...styles.button, 
                  opacity: pagination.page === pagination.pages ? 0.5 : 1 
                }}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : !loading && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
            Aucun historique de paiement
          </div>
          <div style={{ fontSize: '15px' }}>
            Aucun paiement ne correspond aux critères de recherche sélectionnés.
          </div>
        </div>
      )}

      {loading && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '20px', fontWeight: '600' }}>
            Chargement de l'historique...
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {showDetailModal && selectedDetail && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={{ margin: '0 0 25px 0', color: '#0c4a6e', textAlign: 'center' }}>
              Détail du Paiement - Cycle #{selectedDetail.numeroCycle}
            </h2>

            {/* Informations générales */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px',
              marginBottom: '25px'
            }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '10px',
                border: '2px solid #38bdf8'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#0c4a6e' }}>Professeur</h4>
                <div><strong>Nom:</strong> {selectedDetail.professeur?.nom}</div>
                <div><strong>Email:</strong> {selectedDetail.professeur?.email}</div>
                <div><strong>Tarif:</strong> {selectedDetail.tarifHoraire || 0} DH/h</div>
              </div>

              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f0fdf4', 
                borderRadius: '10px',
                border: '2px solid #22c55e'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#15803d' }}>Paiement</h4>
                <div><strong>Date:</strong> {new Date(selectedDetail.datePaiement).toLocaleDateString('fr-FR')}</div>
                <div><strong>Méthode:</strong> {selectedDetail.methodePaiement}</div>
                <div><strong>Référence:</strong> {selectedDetail.referencePaiement || 'N/A'}</div>
              </div>
            </div>

            {/* Statistiques financières */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '15px',
              marginBottom: '25px'
            }}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{selectedDetail.nombreSeances || 0}</div>
                <div style={styles.statLabel}>Séances</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{(selectedDetail.totalHeures || 0).toFixed(1)}h</div>
                <div style={styles.statLabel}>Heures</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{(selectedDetail.montantBrut || 0).toLocaleString('fr-FR')} DH</div>
                <div style={styles.statLabel}>Montant Brut</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{(selectedDetail.totalAjustements || 0).toLocaleString('fr-FR')} DH</div>
                <div style={styles.statLabel}>Ajustements</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{(selectedDetail.montantNet || 0).toLocaleString('fr-FR')} DH</div>
                <div style={styles.statLabel}>Montant Net</div>
              </div>
            </div>

            {/* Ajustements appliqués */}
            {selectedDetail.ajustementsAppliques && selectedDetail.ajustementsAppliques.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#0c4a6e', marginBottom: '15px' }}>Ajustements Appliqués</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Motif</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.ajustementsAppliques.map((ajust, index) => (
                        <tr key={index}>
                          <td style={styles.td}>{ajust.motif}</td>
                          <td style={styles.td}>{ajust.type}</td>
                          <td style={styles.td}>
                            <strong style={{ color: ajust.montantAjustement > 0 ? '#dc2626' : '#10b981' }}>
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

            {/* Séances payées */}
            {selectedDetail.seancesPayees && selectedDetail.seancesPayees.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#0c4a6e', marginBottom: '15px' }}>
                  Séances Payées ({selectedDetail.seancesPayees.length})
                </h4>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Cours</th>
                        <th style={styles.th}>Horaires</th>
                        <th style={styles.th}>Durée</th>
                        <th style={styles.th}>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.seancesPayees.map((seance, index) => (
                        <tr key={index}>
                          <td style={styles.td}>
                            {new Date(seance.dateSeance).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={styles.td}>{seance.cours}</td>
                          <td style={styles.td}>{seance.heureDebut || 'N/A'} - {seance.heureFin || 'N/A'}</td>
                          <td style={styles.td}>{(seance.dureeHeures || 0).toFixed(2)}h</td>
                          <td style={styles.td}>
                            <strong>{(seance.montantSeance || 0).toFixed(2)} DH</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {(selectedDetail.notesFinance || selectedDetail.notesAdmin) && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#0c4a6e', marginBottom: '15px' }}>Notes</h4>
                {selectedDetail.notesFinance && (
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#fef3c7', 
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid #f59e0b'
                  }}>
                    <strong>Finance:</strong> {selectedDetail.notesFinance}
                  </div>
                )}
                {selectedDetail.notesAdmin && (
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#dbeafe', 
                    borderRadius: '8px',
                    border: '1px solid #3b82f6'
                  }}>
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
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                width: '100%',
                justifyContent: 'center',
                padding: '12px'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoriquePaiements;