// ValidationPaiement.js - Version Admin avec gestion des cycles

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const ValidationPaiement = () => {
  const { professeurId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  const [cycle, setCycle] = useState(null);
  const [cyclesEnAttente, setCyclesEnAttente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [paiementData, setPaiementData] = useState({
    methodePaiement: 'virement',
    referencePaiement: '',
    notesPaiement: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
    setTimeout(() => navigate('/'), 1500);
    return;
  }

  if (professeurId && type === 'cycle') {
    chargerCycleSpecifique();
  } else {
    chargerTousLesCyclesEnAttente();
  }
}, [professeurId, type, navigate]);

 
  const chargerCycleSpecifique = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      const res = await fetch(
        `http://195.179.229.230:5000/api/cycles/professeur/${professeurId}/en-cours`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      if (res.status === 403) {
        setMessage({ type: 'error', text: 'Accès refusé. Permissions insuffisantes.' });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setCycle(data.cycle);
        
        switch (data.cycle?.statut) {
          case 'en_cours':
            setMessage({ 
              type: 'warning', 
              text: 'Ce cycle est encore en cours et n\'a pas été validé par Finance.' 
            });
            break;
          case 'valide_finance':
            setMessage({ 
              type: 'success', 
              text: `Cycle validé par Finance${data.cycle.dateValidationFinance ? ' le ' + new Date(data.cycle.dateValidationFinance).toLocaleDateString('fr-FR') : ''}. Prêt pour paiement.` 
            });
            break;
          case 'paye_admin':
            setMessage({ 
              type: 'info', 
              text: `Cycle déjà payé${data.cycle.datePaiementAdmin ? ' le ' + new Date(data.cycle.datePaiementAdmin).toLocaleDateString('fr-FR') : ''}.` 
            });
            break;
          default:
            setMessage({ 
              type: 'info', 
              text: `Cycle chargé avec succès. Statut: ${data.cycle?.statut || 'inconnu'}` 
            });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.error || `Erreur ${res.status}: ${res.statusText}` 
        });
      }
    } catch (err) {
      console.error('Erreur chargement cycle:', err);
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion au serveur. Vérifiez que le serveur backend fonctionne.' 
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const chargerTousLesCyclesEnAttente = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      const res = await fetch(
        'http://195.179.229.230:5000/api/admin/cycles/valides-finance',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      if (res.status === 403) {
        setMessage({ type: 'error', text: 'Accès refusé. Cette page est réservée aux administrateurs.' });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setCyclesEnAttente(data.cycles || []);
        setMessage({ 
          type: 'success', 
          text: `${(data.cycles || []).length} cycles en attente de paiement` 
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.error || 'Erreur lors du chargement des cycles' 
        });
      }
    } catch (err) {
      console.error('Erreur chargement cycles:', err);
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion au serveur' 
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const ouvrirModalPaiement = (cycleAPayer) => {
    setSelectedCycle(cycleAPayer);
    setShowPaiementModal(true);
  };

  const effectuerPaiement = async () => {
    if (!selectedCycle || !paiementData.methodePaiement) {
      setMessage({ type: 'error', text: 'Cycle ou méthode de paiement manquant.' });
      return;
    }

    if (!selectedCycle.montantNet || selectedCycle.montantNet <= 0) {
      setMessage({ type: 'error', text: 'Le montant du cycle doit être supérieur à 0.' });
      return;
    }

    if ((paiementData.methodePaiement === 'virement' || paiementData.methodePaiement === 'cheque') 
        && !paiementData.referencePaiement.trim()) {
      setMessage({ 
        type: 'error', 
        text: 'La référence de paiement est obligatoire pour les virements et chèques.' 
      });
      return;
    }

    try {
      setLoadingAction(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }
      
      const res = await fetch('http://195.179.229.230:5000/api/admin/cycles/payer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cycleId: selectedCycle._id,
          methodePaiement: paiementData.methodePaiement,
          referencePaiement: paiementData.referencePaiement.trim(),
          notes: paiementData.notesPaiement.trim()
        })
      });

      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setMessage({ 
          type: 'success', 
          text: `Paiement de ${selectedCycle.montantNet.toFixed(2)} DH effectué avec succès ! Nouveau cycle #${data.nouveauCycle.numeroCycle || data.nouveauCycle.numero} créé automatiquement.` 
        });
        
        setShowPaiementModal(false);
        setSelectedCycle(null);
        setPaiementData({
          methodePaiement: 'virement',
          referencePaiement: '',
          notesPaiement: ''
        });

        if (professeurId && type === 'cycle') {
          await chargerCycleSpecifique();
        } else {
          await chargerTousLesCyclesEnAttente();
        }

        setTimeout(() => {
        }, 3000);

      } else {
        const error = await res.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: error.error || error.message || `Erreur ${res.status}: Échec du paiement` 
        });
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion lors du paiement. Veuillez réessayer.' 
      });
    } finally {
      setLoadingAction(false);
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
    },
    infoMessage: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      border: '2px solid #3b82f6'
    },
    cycleCard: {
      backgroundColor: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '15px',
      transition: 'all 0.3s'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.header}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#92400e' }}>
            Validation des Paiements - Admin
          </h1>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
          <div>Chargement des cycles de paiement...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />

      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#92400e' }}>
          Validation des Paiements - Administrateur
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#6b7280', fontSize: '16px' }}>
          {cycle ? `Paiement pour ${cycle.professeur?.nom}` : 'Tous les cycles en attente de paiement'}
        </p>
      </div>

      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.errorMessage : 
              message.type === 'warning' ? styles.warningMessage :
              message.type === 'info' ? styles.infoMessage :
              styles.successMessage)
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.card}>
     
        <button
          style={styles.button}
          onClick={cycle ? chargerCycleSpecifique : chargerTousLesCyclesEnAttente}
        >
          Actualiser
        </button>
      </div>

      {cycle && (
        <div style={styles.card}>
          <h2 style={{ margin: '0 0 25px 0', color: '#92400e', fontSize: '1.5rem' }}>
            Cycle #{cycle.numeroCycle} - {cycle.professeur?.nom}
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px' }}>
            <div>
              <h3 style={{ color: '#92400e', marginBottom: '15px' }}>Entrepreneur</h3>
              <div><strong>Nom:</strong> {cycle.professeur?.nom}</div>
              <div><strong>Email:</strong> {cycle.professeur?.email}</div>
              <div><strong>Tarif/h:</strong> {cycle.professeur?.tarifHoraire || 0} DH</div>
            </div>
            
            <div>
              <h3 style={{ color: '#92400e', marginBottom: '15px' }}>Cycle & Validation</h3>
              <div><strong>Numéro de cycle:</strong> #{cycle.numeroCycle}</div>
              <div><strong>Séances incluses:</strong> {cycle.seancesIncluses?.length || 0}</div>
              <div><strong>Validé par Finance:</strong> {cycle.valideParFinance?.nom || 'N/A'}</div>
              <div><strong>Date validation:</strong> {cycle.dateValidationFinance ? new Date(cycle.dateValidationFinance).toLocaleDateString('fr-FR') : 'N/A'}</div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#fef3c7', 
            padding: '25px', 
            borderRadius: '12px',
            border: '2px solid #fbbf24',
            marginBottom: '25px'
          }}>
            <h3 style={{ color: '#92400e', marginBottom: '20px' }}>Montant à Payer</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#059669' }}>
                  {cycle.montantBrut?.toFixed(2)} DH
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Montant Brut</div>
              </div>
              
              {cycle.ajustements !== 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 'bold', 
                    color: cycle.ajustements > 0 ? '#dc2626' : '#10b981' 
                  }}>
                    {cycle.ajustements > 0 ? '-' : '+'}{Math.abs(cycle.ajustements).toFixed(2)} DH
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Ajustements</div>
                </div>
              )}
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {cycle.montantNet?.toFixed(2)} DH
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Montant Net à Payer</div>
              </div>
            </div>
          </div>

          {cycle.statut === 'valide_finance' && (
            <div style={{ textAlign: 'center' }}>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                  fontSize: '16px',
                  padding: '15px 30px',
                  ...(loadingAction ? styles.buttonDisabled : {})
                }}
                onClick={() => ouvrirModalPaiement(cycle)}
                disabled={loadingAction}
              >
                Effectuer le Paiement
              </button>
            </div>
          )}

          {cycle.statut === 'paye_admin' && (
            <div style={{ 
              backgroundColor: '#d1fae5', 
              color: '#065f46', 
              padding: '20px', 
              borderRadius: '8px',
              border: '2px solid #10b981',
              textAlign: 'center'
            }}>
              ✅ Paiement effectué le {new Date(cycle.datePaiementAdmin).toLocaleDateString('fr-FR')}
              <br />
              Méthode: {cycle.methodePaiement} 
              {cycle.referencePaiement && ` - Réf: ${cycle.referencePaiement}`}
            </div>
          )}

          {cycle.seancesIncluses && cycle.seancesIncluses.length > 0 && (
            <div style={styles.card}>
              <h3 style={{ color: '#92400e', marginBottom: '20px' }}>
                Séances Incluses dans ce Cycle ({cycle.seancesIncluses.length})
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Cours</th>
                      <th style={styles.th}>Durée</th>
                      <th style={styles.th}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycle.seancesIncluses.map((seance, index) => (
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
            </div>
          )}
        </div>
      )}

      {!cycle && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#92400e', fontSize: '1.5rem' }}>
              Cycles en Attente de Paiement ({cyclesEnAttente.length})
            </h2>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary, fontSize: '12px', padding: '8px 12px' }}
              onClick={chargerTousLesCyclesEnAttente}
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
          
          {cyclesEnAttente.length > 0 ? (
            <>
              {cyclesEnAttente.map((cycleItem, index) => (
                <div key={cycleItem._id || index} style={styles.cycleCard}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 200px', gap: '20px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                        {cycleItem.professeur?.nom}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Cycle #{cycleItem.numeroCycle} • {cycleItem.seancesIncluses?.length || 0} séances
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        Validé le {new Date(cycleItem.dateValidationFinance).toLocaleDateString('fr-FR')} par {cycleItem.valideParFinance?.nom}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                        {cycleItem.montantNet?.toFixed(2)} DH
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Montant Net
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af'
                      }}>
                        Validé Finance
                      </span>
                    </div>
                    
                    <div>
                      <button
                        style={{
                          ...styles.button,
                          ...styles.buttonSuccess,
                          fontSize: '14px',
                          padding: '8px 16px',
                          width: '100%'
                        }}
                        onClick={() => ouvrirModalPaiement(cycleItem)}
                      >
                        Payer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💰</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                Aucun cycle en attente de paiement
              </div>
              <div>
                Tous les paiements sont à jour ou en attente de validation par Finance.
              </div>
            </div>
          )}
        </div>
      )}

      {showPaiementModal && selectedCycle && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ 
              margin: '0 0 25px 0', 
              color: '#92400e',
              textAlign: 'center',
              fontSize: '1.5rem'
            }}>
              Effectuer le Paiement
            </h3>
            
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '25px',
              border: '2px solid #fbbf24'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <strong>Entrepreneur:</strong> {selectedCycle.professeur?.nom}
                  <br />
                  <strong>Email:</strong> {selectedCycle.professeur?.email}
                </div>
                <div>
                  <strong>Cycle:</strong> #{selectedCycle.numeroCycle}
                  <br />
                  <strong>Séances:</strong> {selectedCycle.seancesIncluses?.length || 0}
                </div>
              </div>
            </div>
            
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
                placeholder="Notes administratives sur le paiement..."
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
              <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#0891b2' }}>
                Montant à payer: {selectedCycle.montantNet?.toFixed(2)} DH
              </div>
              {selectedCycle.ajustements !== 0 && (
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
                  (Montant brut: {selectedCycle.montantBrut?.toFixed(2)} DH, Ajustements: {selectedCycle.ajustements?.toFixed(2)} DH)
                </div>
              )}
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                Une fois payé, ce cycle sera archivé et un nouveau cycle sera automatiquement créé
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setShowPaiementModal(false);
                  setSelectedCycle(null);
                  setPaiementData({
                    methodePaiement: 'virement',
                    referencePaiement: '',
                    notesPaiement: ''
                  });
                }}
                style={{
                  ...styles.button,
                  ...styles.buttonSecondary
                }}
              >
                Annuler
              </button>
              
              <button
                onClick={effectuerPaiement}
                disabled={loadingAction}
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                  ...(loadingAction ? styles.buttonDisabled : {})
                }}
              >
                {loadingAction ? 'Paiement en cours...' : 'Confirmer le Paiement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPaiement;