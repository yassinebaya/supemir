<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebarpaiment';
=======
// ValidationPaiement.js - Version Admin avec gestion des cycles

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918

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
<<<<<<< HEAD

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

=======
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

 
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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
<<<<<<< HEAD
        `https://vmi1977988.contaboserver.net//api2/cycles/professeur/${professeurId}/en-cours`,
=======
        `http://195.179.229.230:5000/api/cycles/professeur/${professeurId}/en-cours`,
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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
<<<<<<< HEAD
        'https://vmi1977988.contaboserver.net//api2/admin/cycles/valides-finance',
=======
        'http://195.179.229.230:5000/api/admin/cycles/valides-finance',
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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
      
<<<<<<< HEAD
      const res = await fetch('https://vmi1977988.contaboserver.net//api2/admin/cycles/payer', {
=======
      const res = await fetch('http://195.179.229.230:5000/api/admin/cycles/payer', {
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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
<<<<<<< HEAD
          text: `Paiement de ${selectedCycle.montantNet.toFixed(2)} DH effectué avec succès ! Nouveau cycle créé automatiquement.` 
=======
          text: `Paiement de ${selectedCycle.montantNet.toFixed(2)} DH effectué avec succès ! Nouveau cycle #${data.nouveauCycle.numeroCycle || data.nouveauCycle.numero} créé automatiquement.` 
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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
<<<<<<< HEAD
=======

        setTimeout(() => {
        }, 3000);

>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
  const methodOptions = [
    { value: 'virement', label: 'Virement Bancaire' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'especes', label: 'Espèces' }
  ];

  const styles = {
    pageWrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: '4px solid #f59e0b'
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
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0 0 24px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    cycleItem: {
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '16px',
      transition: 'all 0.2s ease'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr auto',
      gap: '24px',
      alignItems: 'center'
    },
    profInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    profName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b'
    },
    profDetails: {
      fontSize: '14px',
      color: '#64748b'
    },
    amountBox: {
      textAlign: 'center'
    },
    amount: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#f59e0b',
      marginBottom: '4px'
    },
    amountLabel: {
      fontSize: '12px',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    badge: {
      display: 'inline-block',
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: '#dbeafe',
      color: '#1e40af'
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
    buttonSmall: {
      padding: '8px 16px',
      fontSize: '13px'
    },
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
<<<<<<< HEAD
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
      maxWidth: '600px',
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
      background: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '28px'
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      fontSize: '14px',
      color: '#78350f'
    },
    formGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      boxSizing: 'border-box',
      resize: 'vertical',
      minHeight: '100px',
      fontFamily: 'inherit'
    },
    paymentMethodGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px'
    },
    methodCard: {
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      padding: '16px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: 'white'
    },
    methodCardActive: {
      borderColor: '#f59e0b',
      background: '#fef3c7'
    },
    methodLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#1e293b'
    },
    summaryBox: {
      background: '#e0f2fe',
      border: '1px solid #0891b2',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '28px',
      textAlign: 'center'
    },
    summaryAmount: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0891b2',
      marginBottom: '8px'
    },
    summaryDetails: {
      fontSize: '13px',
      color: '#475569',
      lineHeight: '1.6'
    },
    modalFooter: {
      padding: '20px 32px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
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
    warningMessage: {
      background: '#fef3c7',
      color: '#78350f',
      border: '1px solid #f59e0b'
    },
    infoMessage: {
      background: '#dbeafe',
      color: '#1e40af',
      border: '1px solid #3b82f6'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b'
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#475569'
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
    }
  };

  if (loading) {
    return (
<<<<<<< HEAD
      <div style={styles.pageWrapper}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.headerTitle}>Validation des Paiements</h1>
          </div>
          <div style={styles.card}>
            <div style={{textAlign: 'center', padding: '40px'}}>
              Chargement des cycles de paiement...
            </div>
          </div>
=======
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.header}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#92400e' }}>
            Validation des Paiements - Admin
          </h1>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
          <div>Chargement des cycles de paiement...</div>
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div style={styles.pageWrapper}>
      <Sidebar onLogout={handleLogout} />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Validation des Paiements</h1>
          <p style={styles.headerSubtitle}>
            {cycle ? `Paiement pour ${cycle.professeur?.nom}` : 'Gérez et validez les cycles de paiement des entrepreneurs'}
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

        {!cycle && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>
              <span>Cycles en Attente de Paiement ({cyclesEnAttente.length})</span>
              <button 
                style={{...styles.button, ...styles.buttonSecondary, ...styles.buttonSmall}}
                onClick={chargerTousLesCyclesEnAttente}
                disabled={loading}
              >
                Actualiser
              </button>
            </div>

            {cyclesEnAttente.length > 0 ? (
              cyclesEnAttente.map((cycleItem) => (
                <div
                  key={cycleItem._id}
                  style={styles.cycleItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={styles.grid}>
                    <div style={styles.profInfo}>
                      <div style={styles.profName}>{cycleItem.professeur?.nom}</div>
                      <div style={styles.profDetails}>
                        Cycle #{cycleItem.numeroCycle} • {cycleItem.seancesIncluses?.length || 0} séances
                      </div>
                      <div style={styles.profDetails}>
                        Validé le {new Date(cycleItem.dateValidationFinance).toLocaleDateString('fr-FR')} par {cycleItem.valideParFinance?.nom}
                      </div>
                    </div>

                    <div style={styles.amountBox}>
                      <div style={styles.amount}>{cycleItem.montantNet?.toFixed(2)} DH</div>
                      <div style={styles.amountLabel}>Montant Net</div>
                    </div>

                    <div style={{textAlign: 'center'}}>
                      <span style={styles.badge}>Validé Finance</span>
                    </div>

                    <button
                      style={{...styles.button, ...styles.buttonPrimary}}
                      onClick={() => ouvrirModalPaiement(cycleItem)}
                    >
                      Payer
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyTitle}>Aucun cycle en attente</div>
                <div>Tous les paiements sont à jour ou en attente de validation par Finance.</div>
              </div>
            )}
          </div>
        )}

        {cycle && (
          <div style={styles.card}>
            <h2 style={{margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b'}}>
              Cycle #{cycle.numeroCycle} - {cycle.professeur?.nom}
            </h2>
            
            <div style={{marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                <div>
                  <div style={{fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px'}}>
                    Entrepreneur
                  </div>
                  <div style={{fontSize: '14px', color: '#1e293b', marginBottom: '4px'}}>
                    <strong>Nom:</strong> {cycle.professeur?.nom}
                  </div>
                  <div style={{fontSize: '14px', color: '#1e293b', marginBottom: '4px'}}>
                    <strong>Email:</strong> {cycle.professeur?.email}
                  </div>
                  <div style={{fontSize: '14px', color: '#1e293b'}}>
                    <strong>Tarif/h:</strong> {cycle.professeur?.tarifHoraire || 0} DH
                  </div>
                </div>
                
                <div>
                  <div style={{fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px'}}>
                    Cycle & Validation
                  </div>
                  <div style={{fontSize: '14px', color: '#1e293b', marginBottom: '4px'}}>
                    <strong>Numéro:</strong> #{cycle.numeroCycle}
                  </div>
                  <div style={{fontSize: '14px', color: '#1e293b', marginBottom: '4px'}}>
                    <strong>Séances:</strong> {cycle.seancesIncluses?.length || 0}
                  </div>
                  <div style={{fontSize: '14px', color: '#1e293b', marginBottom: '4px'}}>
                    <strong>Validé par:</strong> {cycle.valideParFinance?.nom || 'N/A'}
                  </div>
                  <div style={{fontSize: '14px', color: '#1e293b'}}>
                    <strong>Date:</strong> {cycle.dateValidationFinance ? new Date(cycle.dateValidationFinance).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.summaryBox}>
              <div style={{fontSize: '14px', fontWeight: '600', color: '#0891b2', marginBottom: '16px'}}>
                Montant à Payer
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'}}>
                <div>
                  <div style={{fontSize: '20px', fontWeight: '700', color: '#059669'}}>
                    {cycle.montantBrut?.toFixed(2)} DH
                  </div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>Montant Brut</div>
                </div>
                {cycle.ajustements !== 0 && (
                  <div>
                    <div style={{fontSize: '20px', fontWeight: '700', color: cycle.ajustements > 0 ? '#dc2626' : '#10b981'}}>
                      {cycle.ajustements > 0 ? '-' : '+'}{Math.abs(cycle.ajustements).toFixed(2)} DH
                    </div>
                    <div style={{fontSize: '12px', color: '#64748b'}}>Ajustements</div>
                  </div>
                )}
                <div>
                  <div style={{fontSize: '24px', fontWeight: '700', color: '#0891b2'}}>
                    {cycle.montantNet?.toFixed(2)} DH
                  </div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>Montant Net</div>
                </div>
              </div>
            </div>

            {cycle.statut === 'valide_finance' && (
              <div style={{textAlign: 'center', marginTop: '24px'}}>
                <button
                  style={{
                    ...styles.button,
                    ...styles.buttonPrimary,
                    ...(loadingAction ? styles.buttonDisabled : {}),
                    padding: '12px 32px',
                    fontSize: '15px'
                  }}
                  onClick={() => ouvrirModalPaiement(cycle)}
                  disabled={loadingAction}
                >
                  {loadingAction ? 'Traitement...' : 'Effectuer le Paiement'}
                </button>
              </div>
            )}

            {cycle.statut === 'paye_admin' && (
              <div style={{
                background: '#d1fae5',
                border: '1px solid #10b981',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center',
                color: '#065f46',
                marginTop: '24px'
              }}>
                Paiement effectué le {new Date(cycle.datePaiementAdmin).toLocaleDateString('fr-FR')}
                <br />
                Méthode: {cycle.methodePaiement}
                {cycle.referencePaiement && ` - Réf: ${cycle.referencePaiement}`}
              </div>
            )}
          </div>
        )}

        {showPaiementModal && selectedCycle && (
          <div style={styles.modal} onClick={() => setShowPaiementModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Effectuer le Paiement</h2>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.infoBox}>
                  <div style={styles.infoGrid}>
                    <div>
                      <strong>Entrepreneur:</strong> {selectedCycle.professeur?.nom}<br/>
                      <strong>Email:</strong> {selectedCycle.professeur?.email}
                    </div>
                    <div>
                      <strong>Cycle:</strong> #{selectedCycle.numeroCycle}<br/>
                      <strong>Séances:</strong> {selectedCycle.seancesIncluses?.length || 0}
                    </div>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Méthode de paiement</label>
                  <div style={styles.paymentMethodGrid}>
                    {methodOptions.map((method) => (
                      <div
                        key={method.value}
                        style={{
                          ...styles.methodCard,
                          ...(paiementData.methodePaiement === method.value ? styles.methodCardActive : {})
                        }}
                        onClick={() => setPaiementData({...paiementData, methodePaiement: method.value})}
                      >
                        <div style={styles.methodLabel}>{method.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Référence de paiement
                    {(paiementData.methodePaiement === 'virement' || paiementData.methodePaiement === 'cheque') && 
                      <span style={{color: '#ef4444'}}> *</span>
                    }
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Numéro de virement, chèque, etc."
                    value={paiementData.referencePaiement}
                    onChange={(e) => setPaiementData({...paiementData, referencePaiement: e.target.value})}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes du paiement</label>
                  <textarea
                    style={styles.textarea}
                    placeholder="Notes administratives sur le paiement..."
                    value={paiementData.notesPaiement}
                    onChange={(e) => setPaiementData({...paiementData, notesPaiement: e.target.value})}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={styles.summaryBox}>
                  <div style={styles.summaryAmount}>
                    {selectedCycle.montantNet?.toFixed(2)} DH
                  </div>
                  <div style={styles.summaryDetails}>
                    {selectedCycle.ajustements !== 0 && (
                      <>
                        Montant brut: {selectedCycle.montantBrut?.toFixed(2)} DH • 
                        Ajustements: {selectedCycle.ajustements?.toFixed(2)} DH<br/>
                      </>
                    )}
                    Un nouveau cycle sera automatiquement créé après le paiement
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  style={{...styles.button, ...styles.buttonSecondary}}
                  onClick={() => {
                    setShowPaiementModal(false);
                    setSelectedCycle(null);
                    setPaiementData({
                      methodePaiement: 'virement',
                      referencePaiement: '',
                      notesPaiement: ''
                    });
                  }}
                >
                  Annuler
                </button>
                <button
                  style={{
                    ...styles.button, 
                    ...styles.buttonPrimary,
                    ...(loadingAction ? styles.buttonDisabled : {})
                  }}
                  onClick={effectuerPaiement}
                  disabled={loadingAction}
                >
                  {loadingAction ? 'Paiement en cours...' : 'Confirmer le Paiement'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
    </div>
  );
};

export default ValidationPaiement;