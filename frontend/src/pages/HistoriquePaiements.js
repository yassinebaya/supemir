import React, { useState, useEffect, useCallback } from 'react';
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
        ? `https://vmi1977988.contaboserver.net//api2/professeurs/${selectedProfesseur}/historique-paiements?${params}`
        : `https://vmi1977988.contaboserver.net//api2/admin/historique-paiements-global?${params}`;

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
      const res = await fetch('https://vmi1977988.contaboserver.net/api2/professeurs', {
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
      const res = await fetch(`https://vmi1977988.contaboserver.net//api2/admin/historique-paiements/${historiqueId}/detail`, {
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
    pageWrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: '4px solid #3b82f6'
    },
    headerTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0 0 8px 0'
    },
    headerSubtitle: {
      fontSize: '15px',
      color: '#64748b',
      margin: 0
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    },
    select: {
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      background: 'white',
      cursor: 'pointer',
      transition: 'border-color 0.2s ease',
      boxSizing: 'border-box'
    },
    buttonRow: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    },
    buttonPrimary: {
      background: '#3b82f6',
      color: 'white'
    },
    buttonSuccess: {
      background: '#10b981',
      color: 'white'
    },
    buttonSecondary: {
      background: '#6b7280',
      color: 'white'
    },
    buttonDisabled: {
      background: '#d1d5db',
      color: '#9ca3af',
      cursor: 'not-allowed'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    statCard: {
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: '1px solid #e2e8f0'
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#3b82f6',
      marginBottom: '8px'
    },
    statLabel: {
      fontSize: '13px',
      color: '#64748b',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    th: {
      background: '#f8fafc',
      padding: '16px 12px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#475569',
      borderBottom: '2px solid #e2e8f0',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: {
      padding: '16px 12px',
      borderBottom: '1px solid #f1f5f9'
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    },
    badgeSuccess: {
      background: '#d1fae5',
      color: '#065f46'
    },
    badgeWarning: {
      background: '#fef3c7',
      color: '#92400e'
    },
    badgeInfo: {
      background: '#dbeafe',
      color: '#1e40af'
    },
    message: {
      padding: '16px 20px',
      borderRadius: '10px',
      marginBottom: '24px',
      fontSize: '14px',
      fontWeight: '500'
    },
    successMessage: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #10b981'
    },
    errorMessage: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #ef4444'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      marginTop: '24px',
      padding: '20px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 20px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#475569',
      marginBottom: '12px'
    },
    emptyText: {
      fontSize: '15px',
      color: '#64748b'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      background: 'white',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '1000px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    modalHeader: {
      padding: '28px 32px',
      borderBottom: '1px solid #e2e8f0'
    },
    modalTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0
    },
    modalBody: {
      padding: '32px'
    },
    infoBox: {
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      border: '1px solid #e2e8f0'
    },
    infoBoxPrimary: {
      background: '#eff6ff',
      borderColor: '#bfdbfe'
    },
    infoBoxSuccess: {
      background: '#f0fdf4',
      borderColor: '#bbf7d0'
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Historique des Paiements</h1>
          <p style={styles.headerSubtitle}>
            Consultation et analyse des paiements effectués aux professeurs entrepreneurs
          </p>
        </div>

        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'error' ? styles.errorMessage : styles.successMessage)
          }}>
            {message.text}
          </div>
        )}

        <div style={styles.card}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            Filtres de recherche
          </h3>
          
          <div style={styles.filterGrid}>
            <select
              style={styles.select}
              value={selectedProfesseur}
              onChange={(e) => setSelectedProfesseur(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">Tous les professeurs</option>
              {professeurs.map(prof => (
                <option key={prof._id} value={prof._id}>
                  {prof.nom}
                </option>
              ))}
            </select>

            <select
              style={styles.select}
              value={filters.annee}
              onChange={(e) => setFilters(prev => ({ ...prev, annee: parseInt(e.target.value), page: 1 }))}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              style={styles.select}
              value={filters.mois}
              onChange={(e) => setFilters(prev => ({ ...prev, mois: e.target.value, page: 1 }))}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">Toute l'année</option>
              {mois.map((m, index) => (
                <option key={index} value={index + 1}>{m}</option>
              ))}
            </select>

            <select
              style={styles.select}
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value={10}>10 par page</option>
              <option value={20}>20 par page</option>
              <option value={50}>50 par page</option>
            </select>
          </div>

          <div style={styles.buttonRow}>
            <button
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(loading ? styles.buttonDisabled : {})
              }}
              onClick={fetchHistoriques}
              disabled={loading}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>

            <button
              style={{
                ...styles.button,
                ...styles.buttonSuccess,
                ...(historiques.length === 0 ? styles.buttonDisabled : {})
              }}
              onClick={exporterHistorique}
              disabled={historiques.length === 0}
            >
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
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {new Date(historique.datePaiement).toLocaleDateString('fr-FR')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {new Date(historique.datePaiement).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {historique.professeur?.nom}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                          {historique.professeur?.email}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                          Cycle #{historique.numeroCycle}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '13px' }}>
                          <div>{new Date(historique.periodeDebut).toLocaleDateString('fr-FR')}</div>
                          <div>{new Date(historique.periodeFin).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <strong>{historique.nombreSeances || 0}</strong>
                      </td>
                      <td style={styles.td}>
                        <strong>{(historique.totalHeures || 0).toFixed(1)}h</strong>
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
                          <span style={{ color: '#64748b' }}>Aucun</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <strong style={{ color: '#dc2626', fontSize: '15px' }}>
                          {(historique.montantNet || 0).toLocaleString('fr-FR')} DH
                        </strong>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...(historique.methodePaiement === 'virement' ? styles.badgeSuccess :
                              historique.methodePaiement === 'cheque' ? styles.badgeWarning :
                              styles.badgeInfo)
                        }}>
                          {historique.methodePaiement?.charAt(0).toUpperCase() + historique.methodePaiement?.slice(1)}
                        </span>
                        {historique.referencePaiement && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            Ref: {historique.referencePaiement}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <button
                          style={{ 
                            ...styles.button, 
                            ...styles.buttonPrimary,
                            fontSize: '12px', 
                            padding: '6px 12px' 
                          }}
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
              <div style={styles.pagination}>
                <button
                  style={{ 
                    ...styles.button, 
                    ...styles.buttonSecondary,
                    ...(pagination.page === 1 ? styles.buttonDisabled : {})
                  }}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Précédent
                </button>
                
                <span style={{ padding: '10px 20px', color: '#475569', fontWeight: '600' }}>
                  Page {pagination.page} sur {pagination.pages}
                </span>
                
                <button
                  style={{ 
                    ...styles.button, 
                    ...styles.buttonPrimary,
                    ...(pagination.page === pagination.pages ? styles.buttonDisabled : {})
                  }}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : !loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyTitle}>Aucun historique de paiement</div>
            <div style={styles.emptyText}>
              Aucun paiement ne correspond aux critères de recherche sélectionnés.
            </div>
          </div>
        )}

        {loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyTitle}>Chargement de l'historique...</div>
          </div>
        )}

        {showDetailModal && selectedDetail && (
          <div style={styles.modal} onClick={() => setShowDetailModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  Détail du Paiement - Cycle #{selectedDetail.numeroCycle}
                </h2>
              </div>

              <div style={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ ...styles.infoBox, ...styles.infoBoxPrimary }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
                      Professeur
                    </h4>
                    <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#1e293b' }}>
                      <div><strong>Nom:</strong> {selectedDetail.professeur?.nom}</div>
                      <div><strong>Email:</strong> {selectedDetail.professeur?.email}</div>
                      <div><strong>Tarif:</strong> {selectedDetail.tarifHoraire || 0} DH/h</div>
                    </div>
                  </div>

                  <div style={{ ...styles.infoBox, ...styles.infoBoxSuccess }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#15803d' }}>
                      Paiement
                    </h4>
                    <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#1e293b' }}>
                      <div><strong>Date:</strong> {new Date(selectedDetail.datePaiement).toLocaleDateString('fr-FR')}</div>
                      <div><strong>Méthode:</strong> {selectedDetail.methodePaiement}</div>
                      <div><strong>Référence:</strong> {selectedDetail.referencePaiement || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div style={styles.statsGrid}>
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

                {selectedDetail.ajustementsAppliques && selectedDetail.ajustementsAppliques.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                      Ajustements Appliqués
                    </h4>
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

                {selectedDetail.seancesPayees && selectedDetail.seancesPayees.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
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

                {(selectedDetail.notesFinance || selectedDetail.notesAdmin) && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                      Notes
                    </h4>
                    {selectedDetail.notesFinance && (
                      <div style={{ 
                        padding: '12px 16px', 
                        background: '#fef3c7', 
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #fbbf24',
                        fontSize: '14px'
                      }}>
                        <strong>Finance:</strong> {selectedDetail.notesFinance}
                      </div>
                    )}
                    {selectedDetail.notesAdmin && (
                      <div style={{ 
                        padding: '12px 16px', 
                        background: '#dbeafe', 
                        borderRadius: '8px',
                        border: '1px solid #3b82f6',
                        fontSize: '14px'
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
                    padding: '12px',
                    justifyContent: 'center',
                    display: 'flex'
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

export default HistoriquePaiements;