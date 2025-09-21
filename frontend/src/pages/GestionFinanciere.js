import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

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

  // États pour les pénalités/ajustements
  const [showPenaliteModal, setShowPenaliteModal] = useState(false);
  const [selectedProfesseur, setSelectedProfesseur] = useState(null);
  const [penaliteData, setPenaliteData] = useState({
    type: 'pourcentage',
    valeur: '',
    motif: '',
    appliquePour: 'mois_actuel'
  });
  const [loadingPenalite, setLoadingPenalite] = useState(false);

  // États pour l'historique
  const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
  const [historiquePenalites, setHistoriquePenalites] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  // États pour la validation des paiements
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

  // Fonction utilitaire pour convertir le statut technique en affichage convivial
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

  // Récupérer les données financières (entrepreneurs uniquement) - VERSION CORRIGÉE
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
        
        // NOUVEAU : Traitement des données avec cycles séparés
        const entrepreneurs = Array.isArray(data.rapports) ? 
          data.rapports.map(rapport => ({
            professeur: rapport.professeur,
            donnees: {
              // Données du cycle en cours uniquement
              totalHeures: rapport.statistiques?.totalHeures || 0,
              tarifHoraire: rapport.statistiques?.tarifHoraire || 0,
              montantBrut: rapport.statistiques?.totalAPayerOriginal || 0,
              ajustements: Math.abs(rapport.statistiques?.penaliteAppliquee || 0),
              montantNet: rapport.statistiques?.totalAPayer || 0,
              
              // Informations du cycle actuel
              cycleId: rapport.statistiques?.cycleId,
              numeroCycle: rapport.statistiques?.numeroCycle || 1,
              statutCycle: rapport.statistiques?.statutCycle || 'en_cours',
              dateValidationFinance: rapport.statistiques?.dateValidationFinance,
              datePaiementAdmin: rapport.statistiques?.datePaiementAdmin,
              
              // Statuts d'affichage
              statutAffichage: getStatutAffichage(rapport.statistiques?.statutCycle || 'en_cours'),
              peutPayer: rapport.statistiques?.statutCycle === 'valide_finance',
              estPaye: rapport.statistiques?.statutCycle === 'paye_admin',
              
              // Informations sur l'ajustement actuel
              ajustementInfo: rapport.penaliteInfo || null,
              
              // Validation
              paiementValide: rapport.paiementValide || false,
              dateValidation: rapport.dateValidation || null,
              
              // Info du cycle pour l'affichage
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

  // NOUVELLE FONCTION : Rafraîchir les données après paiement
  const rafraichirApresAction = async () => {
    setMessage({ type: 'info', text: 'Mise à jour des données...' });
    await fetchRapportsFinanciers();
  };

  // Appliquer une pénalité/rabais
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
        
        // Fermer le modal et réinitialiser
        setShowPenaliteModal(false);
        setSelectedProfesseur(null);
        setPenaliteData({
          type: 'pourcentage',
          valeur: '',
          motif: '',
          appliquePour: 'mois_actuel'
        });
        
        // Recharger les données pour voir le nouvel ajustement
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

  // Charger l'historique des ajustements
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

  // Supprimer un ajustement
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

  // FONCTION CORRIGÉE: Valider un cycle par Finance (Étape 1)
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
        
        // Recharger les données pour voir le changement de statut
        await rafraichirApresAction();
      } else {
        const error = await res.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: error.error || 'Erreur lors de la validation du cycle' 
        });
      }
    } catch (err) {
      console.error('Erreur validation cycle:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoadingValidation(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // FONCTION CORRIGÉE: Redirection vers validation Admin (Étape 2)
  const allerVersValidationAdmin = (professeurId) => {
    navigate(`/validation-paiement/${professeurId}?type=cycle`);
  };

  // Invalider un paiement déjà validé (fonction simplifiée)
  const invaliderPaiement = async (professeurId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir invalider ce paiement ?')) return;

    try {
      setLoadingValidation(true);
      const token = localStorage.getItem('token');
      
      // Cette API devra être implémentée côté backend
      const res = await fetch('/api/finance/paiements/invalider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          professeurId: professeurId,
          mois: selectedPeriod.mois,
          annee: selectedPeriod.annee
        })
      });

      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Paiement invalidé avec succès' 
        });
        fetchRapportsFinanciers();
      } else {
        const error = await res.json();
        setMessage({ 
          type: 'error', 
          text: error.error || 'Erreur lors de l\'invalidation' 
        });
      }
    } catch (err) {
      console.error('Erreur invalidation:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoadingValidation(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Exporter les données financières
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

  // Calculs des totaux
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

  // Filtrage des rapports
  const filteredRapports = rapportsFinanciers.filter(rapport => {
    if (!rapport || !rapport.professeur) return false;
    return rapport.professeur.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });

  const totaux = calculateTotals();

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
    controls: {
      backgroundColor: '#fff',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      marginBottom: '25px',
      border: '2px solid #38bdf8'
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
      gap: '15px',
      alignItems: 'center',
      marginTop: '15px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '10px 15px',
      border: '2px solid #38bdf8',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '150px',
      backgroundColor: '#f8fafc'
    },
    input: {
      padding: '10px 15px',
      border: '2px solid #38bdf8',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '250px',
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
      transition: 'all 0.3s',
      boxShadow: '0 2px 8px rgba(14,165,233,0.3)'
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
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '25px'
    },
    statCard: {
      backgroundColor: '#fff',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: '2px solid #38bdf8'
    },
    statNumber: {
      fontSize: '2.2rem',
      fontWeight: 'bold',
      color: '#0ea5e9'
    },
    statLabel: {
      fontSize: '0.95rem',
      color: '#6b7280',
      marginTop: '8px',
      fontWeight: '500'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
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
    validatedTag: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    },
    pendingTag: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    },
    message: {
      padding: '15px 20px',
      borderRadius: '8px',
      marginBottom: '25px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
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
    emptyState: {
      textAlign: 'center',
      padding: '80px 20px',
      color: '#6b7280',
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '2px solid #38bdf8'
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
      padding: '35px',
      borderRadius: '15px',
      width: '700px',
      maxHeight: '85vh',
      overflow: 'auto',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      border: '3px solid #0ea5e9'
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />

      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#0c4a6e' }}>
          Gestion Financière - Professeurs Entrepreneurs
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#6b7280', fontSize: '16px' }}>
          Gestion des paiements, ajustements et données financières
        </p>
      </div>

      {/* Contrôles */}
      <div style={styles.controls}>
        <div style={styles.controlRow}>
          <select
            style={styles.select}
            value={selectedPeriod.mois}
            onChange={(e) => setSelectedPeriod(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
          >
            {mois.map((m, index) => (
              <option key={index} value={index + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            style={styles.select}
            value={selectedPeriod.annee}
            onChange={(e) => setSelectedPeriod(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            onClick={fetchRapportsFinanciers}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>

          <button
            style={{
              ...styles.button,
              ...styles.buttonSuccess,
              ...(filteredRapports.length === 0 ? styles.buttonDisabled : {})
            }}
            onClick={exporterDonneesFinancieres}
            disabled={filteredRapports.length === 0}
          >
            Exporter CSV
          </button>
        </div>

   
<div style={styles.searchRow}>
          <input
            style={styles.input}
            placeholder="Rechercher un entrepreneur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              style={{ ...styles.button, ...styles.buttonDanger }}
              onClick={() => setSearchTerm('')}
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Information sur le système de cycles */}
      <div style={styles.controls}>
        <h3 style={{ color: '#0c4a6e', marginBottom: '15px', margin: '0 0 15px 0' }}>
          🔄 Système de Cycles de Paiement (Données en Temps Réel)
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px',
            border: '2px solid #fbbf24'
          }}>
            <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '5px' }}>
              🔄 Cycle En Cours
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Séances non payées accumulées depuis le dernier paiement
            </div>
            <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '500' }}>
              • Ajustements possibles
              • Validation Finance requise
            </div>
          </div>
          
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#dbeafe', 
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '5px' }}>
              ✅ Validé Finance
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Cycle approuvé, prêt pour paiement Admin
            </div>
            <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500' }}>
              • Montant final confirmé
              • Ajustements verrouillés
            </div>
          </div>
          
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#d1fae5', 
            borderRadius: '8px',
            border: '2px solid #10b981'
          }}>
            <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '5px' }}>
              💰 Payé - Nouveau Cycle
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Paiement effectué, nouveau cycle créé automatiquement
            </div>
            <div style={{ fontSize: '12px', color: '#065f46', fontWeight: '500' }}>
              • Historique préservé
              • Données remises à zéro
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#374151'
          }}>
            <strong>📊 Données Affichées :</strong> Uniquement le cycle en cours de chaque professeur
          </div>
          
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#ecfdf5', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#065f46',
            border: '1px solid #10b981'
          }}>
            <strong>🎯 Après Paiement :</strong> Séances archivées, nouveau cycle créé, données fraîches
          </div>
        </div>
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

      {/* Chargement */}
      {loading && (
        <div style={styles.emptyState}>
          <div>Chargement des données financières...</div>
        </div>
      )}

      {/* Contenu principal */}
      {!loading && (
        <>
          {filteredRapports.length > 0 ? (
            <>
              {/* Statistiques financières */}
              <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{filteredRapports.length}</div>
                  <div style={styles.statLabel}>Entrepreneurs Actifs</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{totaux.montantBrut.toFixed(0)} DH</div>
                  <div style={styles.statLabel}>Montant Brut Total</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{totaux.totalAjustements.toFixed(0)} DH</div>
                  <div style={styles.statLabel}>Total Ajustements</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{totaux.montantNet.toFixed(0)} DH</div>
                  <div style={styles.statLabel}>Montant Net à Payer</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{totaux.paiementsValides}</div>
                  <div style={styles.statLabel}>Paiements Validés</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{totaux.paiementsEnAttente}</div>
                  <div style={styles.statLabel}>En Attente</div>
                </div>
              </div>

              {/* Tableau financier */}
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Entrepreneur</th>
                      <th style={styles.th}>Cycle Actuel</th>
                      <th style={styles.th}>Heures</th>
                      <th style={styles.th}>Tarif/h</th>
                      <th style={styles.th}>Montant Brut</th>
                      <th style={styles.th}>Ajustements</th>
                      <th style={styles.th}>Montant Net</th>
                      <th style={styles.th}>Statut</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRapports.map(rapport => {
                      if (!rapport || !rapport.professeur || !rapport.donnees) return null;
                      
                      const prof = rapport.professeur;
                      const donnees = rapport.donnees;
                      
                      return (
                        <tr key={prof._id}>
                          <td style={styles.td}>
                            <div>
                              <strong style={{ fontSize: '15px' }}>{prof.nom}</strong>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                {prof.email}
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div>
                              <strong style={{ 
                                fontSize: '14px', 
                                color: donnees.statutCycle === 'en_cours' ? '#f59e0b' : 
                                       donnees.statutCycle === 'valide_finance' ? '#3b82f6' : '#10b981'
                              }}>
                                Cycle #{donnees.numeroCycle}
                              </strong>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                {donnees.statutCycle === 'en_cours' ? '🔄 En cours' : 
                                 donnees.statutCycle === 'valide_finance' ? '✅ Validé Finance' :
                                 donnees.statutCycle === 'paye_admin' ? '💰 Payé' : '⏳ En attente'}
                              </div>
                              {donnees.cycleInfo?.seancesCount > 0 && (
                                <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                  {donnees.cycleInfo.seancesCount} séance(s) non payée(s)
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <strong style={{ fontSize: '16px', color: '#0ea5e9' }}>
                              {safeCalculate(donnees, 'totalHeures')}h
                            </strong>
                          </td>
                          <td style={styles.td}>
                            <strong>{safeCalculate(donnees, 'tarifHoraire')} DH</strong>
                          </td>
                          <td style={styles.td}>
                            <strong style={{ fontSize: '15px', color: '#059669' }}>
                              {safeCalculate(donnees, 'montantBrut').toFixed(2)} DH
                            </strong>
                          </td>
                          <td style={styles.td}>
                            {donnees.ajustements !== 0 ? (
                              <div>
                                <strong style={{ 
                                  color: donnees.ajustements > 0 ? '#dc2626' : '#10b981',
                                  fontSize: '14px'
                                }}>
                                  {donnees.ajustements > 0 ? '-' : '+'}
                                  {Math.abs(donnees.ajustements).toFixed(2)} DH
                                </strong>
                                {donnees.ajustementInfo && (
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: '#6b7280',
                                    marginTop: '3px'
                                  }}>
                                    {donnees.ajustementInfo.motif.substring(0, 25)}...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#6b7280', fontSize: '13px' }}>Aucun</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <strong style={{ 
                              fontSize: '16px',
                              color: donnees.montantNet > 0 ? '#dc2626' : '#6b7280'
                            }}>
                              {safeCalculate(donnees, 'montantNet').toFixed(2)} DH
                            </strong>
                            {donnees.ajustements !== 0 && (
                              <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>
                                (Ajusté)
                              </div>
                            )}
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                ...styles.validatedTag,
                                ...(donnees.statutCycle === 'paye_admin' ? 
                                  { backgroundColor: '#d1fae5', color: '#065f46' } : 
                                  donnees.statutCycle === 'valide_finance' ? 
                                    { backgroundColor: '#dbeafe', color: '#1e40af' } :
                                    { backgroundColor: '#fef3c7', color: '#92400e' }
                                )
                              }}>
                                {donnees.statutAffichage || 'En attente'}
                              </span>
                              {donnees.dateValidation && (
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                  {new Date(donnees.dateValidation).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                              {/* Bouton Ajustement - disponible pour cycles en cours */}
                              {donnees.statutCycle === 'en_cours' && (
                                <button
                                  style={{ 
                                    ...styles.button, 
                                    fontSize: '12px', 
                                    padding: '6px 10px',
                                    backgroundColor: '#dc2626'
                                  }}
                                  onClick={() => {
                                    setSelectedProfesseur(prof);
                                    setShowPenaliteModal(true);
                                  }}
                                >
                                  Nouvel Ajustement
                                </button>
                              )}
                              
                              {/* Boutons conditionnels selon le statut du cycle */}
                              {donnees.statutCycle === 'en_cours' && (
                                <button
                                  style={{ 
                                    ...styles.button, 
                                    fontSize: '12px', 
                                    padding: '6px 10px',
                                    backgroundColor: '#10b981',
                                    ...(loadingValidation ? styles.buttonDisabled : {})
                                  }}
                                  onClick={() => validerCycleParFinance(prof._id)}
                                  disabled={loadingValidation}
                                >
                                  {loadingValidation ? 'Validation...' : 'Valider par Finance'}
                                </button>
                              )}

                              {donnees.statutCycle === 'valide_finance' && (
                                <button
                                  style={{ 
                                    ...styles.button, 
                                    fontSize: '12px', 
                                    padding: '6px 10px',
                                    backgroundColor: '#f59e0b'
                                  }}
                                  onClick={() => allerVersValidationAdmin(prof._id)}
                                >
                                  Aller vers Paiement Admin
                                </button>
                              )}

                              {donnees.statutCycle === 'paye_admin' && (
                                <div style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#d1fae5',
                                  color: '#065f46',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  textAlign: 'center',
                                  fontWeight: '600'
                                }}>
                                  Cycle Payé ✓
                                </div>
                              )}
                              
                              <button
                                style={{ 
                                  ...styles.button, 
                                  fontSize: '11px', 
                                  padding: '4px 8px',
                                  backgroundColor: '#6b7280'
                                }}
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
            <div style={styles.emptyState}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💰</div>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px', color: '#374151' }}>
                {rapportsFinanciers.length === 0 ? 'Aucune donnée financière' : 'Aucun résultat trouvé'}
              </div>
              <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                {rapportsFinanciers.length === 0 
                  ? `Aucun entrepreneur actif trouvé pour ${mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}.`
                  : `Aucun entrepreneur ne correspond à la recherche "${searchTerm}".`
                }
              </div>
              {rapportsFinanciers.length === 0 && (
                <button
                  style={{ ...styles.button, marginTop: '20px' }}
                  onClick={fetchRapportsFinanciers}
                >
                  Actualiser
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Ajustement */}
      {showPenaliteModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ 
              margin: '0 0 25px 0', 
              color: '#92400e',
              textAlign: 'center',
              fontSize: '22px'
            }}>
              Appliquer un Ajustement Financier
            </h3>
            
            {/* Info professeur */}
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '25px',
              border: '2px solid #fbbf24'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <strong>Entrepreneur:</strong> {selectedProfesseur?.nom}
                  <br />
                  <strong>Email:</strong> {selectedProfesseur?.email}
                </div>
                <div>
                  <strong>Tarif:</strong> {selectedProfesseur?.tarifHoraire || 0} DH/h
                  <br />
                  <strong>Période:</strong> {mois[selectedPeriod.mois - 1]} {selectedPeriod.annee}
                </div>
              </div>
            </div>

            {/* Type d'ajustement */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontWeight: '700',
                color: '#92400e'
              }}>
                Type d'ajustement:
              </label>
              <select
                style={styles.select}
                value={penaliteData.type}
                onChange={(e) => setPenaliteData({ ...penaliteData, type: e.target.value })}
              >
                <option value="pourcentage">Pourcentage du montant total</option>
                <option value="montant_fixe">Montant fixe en DH</option>
              </select>
            </div>

            {/* Valeur */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontWeight: '700',
                color: '#92400e'
              }}>
                {penaliteData.type === 'pourcentage' ? 'Pourcentage (%)' : 'Montant (DH)'}:
              </label>
              <input
                type="number"
                style={styles.input}
                value={penaliteData.valeur}
                onChange={(e) => setPenaliteData({ ...penaliteData, valeur: e.target.value })}
                placeholder={penaliteData.type === 'pourcentage' ? 'Ex: 10 pour 10% / -5 pour rabais de 5%' : 'Ex: 500 pour pénalité / -200 pour rabais'}
                step={penaliteData.type === 'pourcentage' ? "0.1" : "0.01"}
                min={penaliteData.type === 'pourcentage' ? "-100" : undefined}
                max={penaliteData.type === 'pourcentage' ? "100" : undefined}
              />
              <small style={{ color: '#6b7280', fontSize: '13px', display: 'block', marginTop: '5px' }}>
                Utilisez des valeurs négatives pour un rabais (ex: -10 pour -10%)
              </small>
            </div>

            {/* Motif */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontWeight: '700',
                color: '#92400e'
              }}>
                Motif (obligatoire):
              </label>
              <textarea
                style={{
                  ...styles.input,
                  height: '90px',
                  resize: 'vertical'
                }}
                value={penaliteData.motif}
                onChange={(e) => setPenaliteData({ ...penaliteData, motif: e.target.value })}
                placeholder="Ex: Retards répétés, Absences non justifiées, Prime de performance, Bonus qualité..."
              />
            </div>

            {/* Application */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontWeight: '700',
                color: '#92400e'
              }}>
                Appliquer pour:
              </label>
              <select
                style={styles.select}
                value={penaliteData.appliquePour}
                onChange={(e) => setPenaliteData({ ...penaliteData, appliquePour: e.target.value })}
              >
                <option value="mois_actuel">Ce mois uniquement</option>
                <option value="permanent">Tous les mois suivants (permanent)</option>
              </select>
            </div>

            {/* Aperçu du calcul */}
            {penaliteData.valeur && penaliteData.valeur !== '' && selectedProfesseur && (
              <div style={{
                backgroundColor: '#e0f2fe',
                border: '2px solid #0891b2',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#0891b2' }}>Aperçu du calcul:</h4>
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
                    <div style={{ fontSize: '15px', color: '#0891b2' }}>
                      <div>Montant actuel: <strong>{montantActuel.toFixed(2)} DH</strong></div>
                      <div>Ajustement: <strong style={{ color: ajustement >= 0 ? '#dc2626' : '#10b981' }}>
                        {ajustement >= 0 ? '-' : '+'}{Math.abs(ajustement).toFixed(2)} DH
                      </strong></div>
                      <div>Nouveau montant: <strong style={{ 
                        color: nouveauMontant >= 0 ? '#059669' : '#dc2626',
                        fontSize: '16px'
                      }}>
                        {nouveauMontant.toFixed(2)} DH
                      </strong></div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Boutons d'action */}
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'flex-end',
              marginTop: '30px'
            }}>
              <button
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
                style={{
                  ...styles.button,
                  ...styles.buttonSecondary,
                  padding: '12px 25px'
                }}
              >
                Annuler
              </button>
              
              <button
                onClick={appliquerAjustement}
                disabled={loadingPenalite || !penaliteData.valeur || penaliteData.valeur === '' || !penaliteData.motif.trim()}
                style={{
                  ...styles.button,
                  ...styles.buttonDanger,
                  padding: '12px 25px',
                  ...(loadingPenalite || !penaliteData.valeur || penaliteData.valeur === '' || !penaliteData.motif.trim() ? styles.buttonDisabled : {})
                }}
              >
                {loadingPenalite ? 'Application...' : 'Appliquer l\'ajustement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {showHistoriqueModal && (
        <div style={styles.modal}>
          <div style={{...styles.modalContent, width: '1000px'}}>
            <h3 style={{ 
              margin: '0 0 25px 0', 
              color: '#92400e',
              textAlign: 'center',
              fontSize: '22px'
            }}>
              Historique des Ajustements - {selectedProfesseur?.nom}
            </h3>
            
            {loadingHistorique ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                Chargement de l'historique...
              </div>
            ) : historiquePenalites.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Période</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Valeur</th>
                      <th style={styles.th}>M. Original</th>
                      <th style={styles.th}>Ajustement</th>
                      <th style={styles.th}>M. Final</th>
                      <th style={styles.th}>Motif</th>
                      <th style={styles.th}>Appliqué par</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiquePenalites.map((ajustement, index) => (
                      <tr key={index}>
                        <td style={styles.td}>
                          {new Date(ajustement.dateApplication).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={styles.td}>
                          {mois[ajustement.mois - 1]} {ajustement.annee}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '15px',
                            fontSize: '12px',
                            backgroundColor: ajustement.type === 'pourcentage' ? '#dbeafe' : '#fef3c7',
                            color: ajustement.type === 'pourcentage' ? '#1e40af' : '#92400e',
                            fontWeight: '600'
                          }}>
                            {ajustement.type === 'pourcentage' ? '%' : 'Fixe'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <strong>
                            {ajustement.type === 'pourcentage' ? `${ajustement.valeur}%` : `${ajustement.valeur} DH`}
                          </strong>
                        </td>
                        <td style={styles.td}>
                          <strong>{ajustement.montantOriginal.toFixed(2)} DH</strong>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            color: (ajustement.montantOriginal - ajustement.montantAjuste) > 0 ? '#dc2626' : '#10b981',
                            fontWeight: '700',
                            fontSize: '14px'
                          }}>
                            {(ajustement.montantOriginal - ajustement.montantAjuste) > 0 ? '-' : '+'}
                            {Math.abs(ajustement.montantOriginal - ajustement.montantAjuste).toFixed(2)} DH
                          </span>
                        </td>
                        <td style={styles.td}>
                          <strong style={{ fontSize: '14px' }}>{ajustement.montantAjuste.toFixed(2)} DH</strong>
                        </td>
                        <td style={styles.td}>
                          <div style={{ 
                            maxWidth: '180px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            fontSize: '13px'
                          }} title={ajustement.motif}>
                            {ajustement.motif}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontSize: '12px' }}>
                            {ajustement.appliquePar?.nom || 'N/A'}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <button
                            style={{
                              ...styles.button,
                              ...styles.buttonDanger,
                              fontSize: '11px',
                              padding: '5px 8px'
                            }}
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
              <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                  Aucun ajustement dans l'historique
                </div>
                <div>
                  Cet entrepreneur n'a aucun historique d'ajustements financiers.
                </div>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowHistoriqueModal(false);
                setHistoriquePenalites([]);
                setSelectedProfesseur(null);
              }}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                padding: '12px 25px',
                marginTop: '25px'
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

export default GestionFinanciere;