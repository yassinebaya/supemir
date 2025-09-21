import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const ValidationPaiement = () => {
  const { professeurId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mois = searchParams.get('mois');
  const annee = searchParams.get('annee');

  const [paiement, setPaiement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [notes, setNotes] = useState('');
  const [historique, setHistorique] = useState([]);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementData, setPaiementData] = useState({
    methodePaiement: 'virement',
    referencePaiement: '',
    notesPaiement: ''
  });

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  useEffect(() => {
    if (professeurId && mois && annee) {
      chargerPaiement();
      chargerHistorique();
    }
  }, [professeurId, mois, annee]);

  const chargerPaiement = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch('/api/finance/paiements/creer-ou-recuperer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          professeurId,
          mois: parseInt(mois),
          annee: parseInt(annee)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPaiement(data.paiement);
        setMessage({ 
          type: 'success', 
          text: data.message 
        });
      } else {
        const error = await res.json();
        setMessage({ 
          type: 'error', 
          text: error.error || 'Erreur lors du chargement du paiement' 
        });
      }
    } catch (err) {
      console.error('Erreur chargement paiement:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const chargerHistorique = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`/api/finance/paiements/historique/${professeurId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setHistorique(data.paiements || []);
      }
    } catch (err) {
      console.error('Erreur historique:', err);
    }
  };

  const validerPaiement = async () => {
    if (!paiement) return;

    try {
      setLoadingAction(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch('/api/finance/paiements/valider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paiementId: paiement._id,
          notes: notes.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPaiement(data.paiement);
        setMessage({ 
          type: 'success', 
          text: 'Paiement validé avec succès ! Vous pouvez maintenant le marquer comme payé.' 
        });
        setNotes('');
        chargerHistorique();
      } else {
        const error = await res.json();
        setMessage({ 
          type: 'error', 
          text: error.error || 'Erreur lors de la validation' 
        });
      }
    } catch (err) {
      console.error('Erreur validation:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoadingAction(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const marquerPaye = async () => {
    if (!paiement || !paiementData.methodePaiement) return;

    try {
      setLoadingAction(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch('/api/finance/paiements/marquer-paye', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paiementId: paiement._id,
          methodePaiement: paiementData.methodePaiement,
          referencePaiement: paiementData.referencePaiement.trim(),
          notes: paiementData.notesPaiement.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPaiement(data.paiement);
        setMessage({ 
          type: 'success', 
          text: 'Paiement marqué comme payé avec succès !' 
        });
        setShowPaiementModal(false);
        setPaiementData({
          methodePaiement: 'virement',
          referencePaiement: '',
          notesPaiement: ''
        });
        chargerHistorique();
      } else {
        const error = await res.json();
        setMessage({ 
          type: 'error', 
          text: error.error || 'Erreur lors du marquage du paiement' 
        });
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoadingAction(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const annulerPaiement = async () => {
    if (!paiement) return;

    const motif = prompt('Motif d\'annulation:');
    if (!motif) return;

    try {
      setLoadingAction(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch('/api/finance/paiements/annuler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paiementId: paiement._id,
          motifAnnulation: motif
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPaiement(data.paiement);
        setMessage({ 
          type: 'warning', 
          text: 'Paiement annulé' 
        });
        chargerHistorique();
      } else {
        const error = await res.json();
        setMessage({ 
          type: 'error', 
          text: error.error || 'Erreur lors de l\'annulation' 
        });
      }
    } catch (err) {
      console.error('Erreur annulation:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoadingAction(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'en_attente': return '#f59e0b';
      case 'valide': return '#10b981';
      case 'paye': return '#059669';
      case 'annule': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatutText = (statut) => {
    switch (statut) {
      case 'en_attente': return 'En Attente';
      case 'valide': return 'Validé';
      case 'paye': return 'Payé';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #f59e0b 100%)',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    },
    header: {
      backgroundColor: '#fff',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '30px',
      textAlign: 'center',
      border: '3px solid #f59e0b'
    },
    card: {
      backgroundColor: '#fff',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '25px',
      border: '2px solid #fbbf24'
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#f59e0b',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s',
      boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
    },
    buttonSuccess: {
      backgroundColor: '#10b981',
      boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
    },
    buttonDanger: {
      backgroundColor: '#ef4444',
      boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
    },
    buttonSecondary: {
      backgroundColor: '#6b7280',
      boxShadow: '0 2px 8px rgba(107,114,128,0.3)'
    },
    buttonDisabled: {
      backgroundColor: '#d1d5db',
      cursor: 'not-allowed',
      boxShadow: 'none'
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      border: '2px solid #fbbf24',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#fefbf3',
      marginBottom: '15px'
    },
    textarea: {
      width: '100%',
      padding: '12px 15px',
      border: '2px solid #fbbf24',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#fefbf3',
      resize: 'vertical',
      minHeight: '80px',
      marginBottom: '15px'
    },
    select: {
      width: '100%',
      padding: '12px 15px',
      border: '2px solid #fbbf24',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#fefbf3',
      marginBottom: '15px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    th: {
      backgroundColor: '#fef3c7',
      padding: '15px 12px',
      textAlign: 'left',
      fontWeight: '700',
      color: '#92400e',
      borderBottom: '3px solid #f59e0b',
      fontSize: '13px'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #fed7aa'
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
      padding: '40px',
      borderRadius: '15px',
      width: '600px',
      maxHeight: '85vh',
      overflow: 'auto',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      border: '3px solid #f59e0b'
    },
    statutBadge: {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block'
    },
    message: {
      padding: '15px 20px',
      borderRadius: '8px',
      marginBottom: '25px',
      textAlign: 'center',
      fontWeight: '500'
    },
    successMessage: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '2px solid #10b981'
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '2px solid #ef4444'
    },
    warningMessage: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      border: '2px solid #f59e0b'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.header}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#92400e' }}>
            Validation de Paiement
          </h1>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
          <div>Chargement des informations de paiement...</div>
        </div>
      </div>
    );
  }

  if (!paiement) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.header}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#92400e' }}>
            Validation de Paiement
          </h1>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
            Erreur de chargement
          </div>
          <div style={{ marginBottom: '20px' }}>
            Impossible de charger les informations de paiement.
          </div>
          <button
            style={styles.button}
            onClick={() => navigate('/gestion-financiere')}
          >
            Retour à la gestion financière
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />

      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#92400e' }}>
          Validation de Paiement
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#6b7280', fontSize: '16px' }}>
          {paiement.professeur?.nom} - {moisNoms[parseInt(mois) - 1]} {annee}
        </p>
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

      {/* Navigation */}
      <div style={styles.card}>
        <button
          style={{ ...styles.button, ...styles.buttonSecondary, marginRight: '15px' }}
          onClick={() => navigate('/gestion-financiere')}
        >
          ← Retour à la gestion financière
        </button>
        <button
          style={styles.button}
          onClick={chargerPaiement}
        >
          Actualiser
        </button>
      </div>

      {/* Informations du paiement */}
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 25px 0', color: '#92400e', fontSize: '1.5rem' }}>
          Détails du Paiement
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px' }}>
          <div>
            <h3 style={{ color: '#92400e', marginBottom: '15px' }}>Entrepreneur</h3>
            <div><strong>Nom:</strong> {paiement.professeur?.nom}</div>
            <div><strong>Email:</strong> {paiement.professeur?.email}</div>
            <div><strong>Tarif/h:</strong> {paiement.professeur?.tarifHoraire || 0} DH</div>
          </div>
          
          <div>
            <h3 style={{ color: '#92400e', marginBottom: '15px' }}>Période & Statut</h3>
            <div><strong>Période:</strong> {moisNoms[paiement.mois - 1]} {paiement.annee}</div>
            <div><strong>Statut:</strong> 
              <span style={{
                ...styles.statutBadge,
                backgroundColor: `${getStatutColor(paiement.statut)}20`,
                color: getStatutColor(paiement.statut),
                marginLeft: '10px'
              }}>
                {getStatutText(paiement.statut)}
              </span>
            </div>
            <div><strong>Créé le:</strong> {new Date(paiement.createdAt).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        {/* Montants */}
        <div style={{ 
          backgroundColor: '#fef3c7', 
          padding: '25px', 
          borderRadius: '12px',
          border: '2px solid #fbbf24',
          marginBottom: '25px'
        }}>
          <h3 style={{ color: '#92400e', marginBottom: '20px' }}>Détail Financier</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#059669' }}>
                {paiement.montantBrut?.toFixed(2)} DH
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>Montant Brut</div>
            </div>
            
            {paiement.ajustements !== 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 'bold', 
                  color: paiement.ajustements > 0 ? '#dc2626' : '#10b981' 
                }}>
                  {paiement.ajustements > 0 ? '-' : '+'}{Math.abs(paiement.ajustements).toFixed(2)} DH
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Ajustements</div>
              </div>
            )}
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {paiement.montantNet?.toFixed(2)} DH
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>Montant Net à Payer</div>
            </div>
          </div>
        </div>

        {/* Actions selon le statut */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {paiement.statut === 'en_attente' && (
            <>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                  ...(loadingAction ? styles.buttonDisabled : {})
                }}
                onClick={validerPaiement}
                disabled={loadingAction}
              >
                {loadingAction ? 'Validation...' : 'Valider le Paiement'}
              </button>
              
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonDanger,
                  ...(loadingAction ? styles.buttonDisabled : {})
                }}
                onClick={annulerPaiement}
                disabled={loadingAction}
              >
                Annuler
              </button>
            </>
          )}
          
          {paiement.statut === 'valide' && (
            <>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                  ...(loadingAction ? styles.buttonDisabled : {})
                }}
                onClick={() => setShowPaiementModal(true)}
                disabled={loadingAction}
              >
                Marquer comme Payé
              </button>
              
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonDanger,
                  ...(loadingAction ? styles.buttonDisabled : {})
                }}
                onClick={annulerPaiement}
                disabled={loadingAction}
              >
                Annuler
              </button>
            </>
          )}
          
          {paiement.statut === 'paye' && (
            <div style={{ 
              backgroundColor: '#d1fae5', 
              color: '#065f46', 
              padding: '15px 20px', 
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              ✅ Paiement effectué le {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
              <br />
              Méthode: {paiement.methodePaiement} 
              {paiement.referencePaiement && ` - Réf: ${paiement.referencePaiement}`}
            </div>
          )}
          
          {paiement.statut === 'annule' && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              color: '#dc2626', 
              padding: '15px 20px', 
              borderRadius: '8px',
              border: '2px solid #ef4444'
            }}>
              ❌ Paiement annulé
            </div>
          )}
        </div>
      </div>

      {/* Notes de validation */}
      {paiement.statut === 'en_attente' && (
        <div style={styles.card}>
          <h3 style={{ color: '#92400e', marginBottom: '15px' }}>Notes de Validation</h3>
          <textarea
            style={styles.textarea}
            placeholder="Ajoutez des notes pour la validation (optionnel)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {/* Détail des séances incluses */}
      <div style={styles.card}>
        <h3 style={{ color: '#92400e', marginBottom: '20px' }}>
          Séances Incluses ({paiement.seancesIncluses?.length || 0})
        </h3>
        
        {paiement.seancesIncluses && paiement.seancesIncluses.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Cours</th>
                  <th style={styles.th}>Heures</th>
                  <th style={styles.th}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {paiement.seancesIncluses.map((seance, index) => (
                  <tr key={index}>
                    <td style={styles.td}>
                      {new Date(seance.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={styles.td}>{seance.cours}</td>
                    <td style={styles.td}>
                      <strong>{seance.heures}h</strong>
                    </td>
                    <td style={styles.td}>
                      <strong>{seance.montant?.toFixed(2)} DH</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            Aucune séance incluse dans ce paiement
          </div>
        )}
      </div>

      {/* Pénalités appliquées */}
      {paiement.penalitesAppliquees && paiement.penalitesAppliquees.length > 0 && (
        <div style={styles.card}>
          <h3 style={{ color: '#92400e', marginBottom: '20px' }}>
            Ajustements Appliqués
          </h3>
          
          {paiement.penalitesAppliquees.map((penalite, index) => (
            <div key={index} style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '10px'
            }}>
              <div style={{ fontWeight: '600', color: '#dc2626' }}>
                {penalite.montant > 0 ? 'Pénalité' : 'Rabais'}: {Math.abs(penalite.montant).toFixed(2)} DH
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
                {penalite.motif}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique des paiements */}
      {historique.length > 0 && (
        <div style={styles.card}>
          <h3 style={{ color: '#92400e', marginBottom: '20px' }}>
            Historique des Paiements
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Période</th>
                  <th style={styles.th}>Montant Net</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Date Validation</th>
                  <th style={styles.th}>Date Paiement</th>
                </tr>
              </thead>
              <tbody>
                {historique.slice(0, 6).map((h, index) => (
                  <tr key={index}>
                    <td style={styles.td}>
                      {moisNoms[h.mois - 1]} {h.annee}
                    </td>
                    <td style={styles.td}>
                      <strong>{h.montantNet?.toFixed(2)} DH</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statutBadge,
                        backgroundColor: `${getStatutColor(h.statut)}20`,
                        color: getStatutColor(h.statut)
                      }}>
                        {getStatutText(h.statut)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {h.dateValidation ? new Date(h.dateValidation).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td style={styles.td}>
                      {h.datePaiement ? new Date(h.datePaiement).toLocaleDateString('fr-FR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de paiement */}
      {showPaiementModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ 
              margin: '0 0 25px 0', 
              color: '#92400e',
              textAlign: 'center',
              fontSize: '1.5rem'
            }}>
              Marquer comme Payé
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#92400e'
              }}>
                Méthode de paiement *
              </label>
              <select
                style={styles.select}
                value={paiementData.methodePaiement}
                onChange={(e) => setPaiementData({
                  ...paiementData, 
                  methodePaiement: e.target.value
                })}
              >
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#92400e'
              }}>
                Référence de paiement
              </label>
              <input
                type="text"
                style={styles.input}
                placeholder="Numéro de virement, chèque, etc."
                value={paiementData.referencePaiement}
                onChange={(e) => setPaiementData({
                  ...paiementData, 
                  referencePaiement: e.target.value
                })}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#92400e'
              }}>
                Notes du paiement
              </label>
              <textarea
                style={styles.textarea}
                placeholder="Notes additionnelles sur le paiement..."
                value={paiementData.notesPaiement}
                onChange={(e) => setPaiementData({
                  ...paiementData, 
                  notesPaiement: e.target.value
                })}
              />
            </div>

            <div style={{ 
              backgroundColor: '#e0f2fe',
              border: '2px solid #0891b2',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#0891b2' }}>
                Montant à payer: {paiement.montantNet?.toFixed(2)} DH
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => setShowPaiementModal(false)}
                style={{
                  ...styles.button,
                  ...styles.buttonSecondary
                }}
              >
                Annuler
              </button>
              
              <button
                onClick={marquerPaye}
                disabled={loadingAction}
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                  ...(loadingAction ? styles.buttonDisabled : {})
                }}
              >
                {loadingAction ? 'Enregistrement...' : 'Confirmer le Paiement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPaiement;