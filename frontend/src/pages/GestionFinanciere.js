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

<<<<<<< HEAD
=======
  // Fonction utilitaire pour convertir le statut technique en affichage convivial
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
=======
  // Récupérer les données financières (entrepreneurs uniquement) - VERSION CORRIGÉE
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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
<<<<<<< HEAD
        `https://vmi1977988.contaboserver.net//api2/professeurs/rapports/mensuel?mois=${selectedPeriod.mois}&annee=${selectedPeriod.annee}`,
=======
        `http://195.179.229.230:5000/api/professeurs/rapports/mensuel?mois=${selectedPeriod.mois}&annee=${selectedPeriod.annee}`,
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        
<<<<<<< HEAD
=======
        // NOUVEAU : Traitement des données avec cycles séparés
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
        const entrepreneurs = Array.isArray(data.rapports) ? 
          data.rapports.map(rapport => ({
            professeur: rapport.professeur,
            donnees: {
<<<<<<< HEAD
=======
              // Données du cycle en cours uniquement
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
              totalHeures: rapport.statistiques?.totalHeures || 0,
              tarifHoraire: rapport.statistiques?.tarifHoraire || 0,
              montantBrut: rapport.statistiques?.totalAPayerOriginal || 0,
              ajustements: Math.abs(rapport.statistiques?.penaliteAppliquee || 0),
              montantNet: rapport.statistiques?.totalAPayer || 0,
              
<<<<<<< HEAD
=======
              // Informations du cycle actuel
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
              cycleId: rapport.statistiques?.cycleId,
              numeroCycle: rapport.statistiques?.numeroCycle || 1,
              statutCycle: rapport.statistiques?.statutCycle || 'en_cours',
              dateValidationFinance: rapport.statistiques?.dateValidationFinance,
              datePaiementAdmin: rapport.statistiques?.datePaiementAdmin,
              
<<<<<<< HEAD
=======
              // Statuts d'affichage
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
              statutAffichage: getStatutAffichage(rapport.statistiques?.statutCycle || 'en_cours'),
              peutPayer: rapport.statistiques?.statutCycle === 'valide_finance',
              estPaye: rapport.statistiques?.statutCycle === 'paye_admin',
              
<<<<<<< HEAD
              ajustementInfo: rapport.penaliteInfo || null,
              paiementValide: rapport.paiementValide || false,
              dateValidation: rapport.dateValidation || null,
              
=======
              // Informations sur l'ajustement actuel
              ajustementInfo: rapport.penaliteInfo || null,
              
              // Validation
              paiementValide: rapport.paiementValide || false,
              dateValidation: rapport.dateValidation || null,
              
              // Info du cycle pour l'affichage
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
=======
  // NOUVELLE FONCTION : Rafraîchir les données après paiement
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
  const rafraichirApresAction = async () => {
    setMessage({ type: 'info', text: 'Mise à jour des données...' });
    await fetchRapportsFinanciers();
  };

<<<<<<< HEAD
=======
  // Appliquer une pénalité/rabais
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
      const res = await fetch('https://vmi1977988.contaboserver.net//api2/finance/appliquer-penalite', {
=======
      const res = await fetch('http://195.179.229.230:5000/api/finance/appliquer-penalite', {
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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
        
<<<<<<< HEAD
=======
        // Fermer le modal et réinitialiser
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
        setShowPenaliteModal(false);
        setSelectedProfesseur(null);
        setPenaliteData({
          type: 'pourcentage',
          valeur: '',
          motif: '',
          appliquePour: 'mois_actuel'
        });
        
<<<<<<< HEAD
=======
        // Recharger les données pour voir le nouvel ajustement
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
=======
  // Charger l'historique des ajustements
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
  const fetchHistoriqueAjustements = async (professeurId) => {
    try {
      setLoadingHistorique(true);
      const token = localStorage.getItem('token');
      
<<<<<<< HEAD
      const res = await fetch(`https://vmi1977988.contaboserver.net//api2/finance/penalites/historique/${professeurId}`, {
=======
      const res = await fetch(`http://195.179.229.230:5000/api/finance/penalites/historique/${professeurId}`, {
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
=======
  // Supprimer un ajustement
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
  const supprimerAjustement = async (ajustementId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet ajustement ?')) return;

    try {
      const token = localStorage.getItem('token');
      
<<<<<<< HEAD
      const res = await fetch(`https://vmi1977988.contaboserver.net//api2/finance/penalites/${ajustementId}`, {
=======
      const res = await fetch(`http://195.179.229.230:5000/api/finance/penalites/${ajustementId}`, {
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
=======
  // FONCTION CORRIGÉE: Valider un cycle par Finance (Étape 1)
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
  const validerCycleParFinance = async (professeurId) => {
    try {
      setLoadingValidation(true);
      const token = localStorage.getItem('token');
      
<<<<<<< HEAD
      const res = await fetch('https://vmi1977988.contaboserver.net//api2/finance/cycles/valider', {
=======
      const res = await fetch('http://195.179.229.230:5000/api/finance/cycles/valider', {
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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
        
<<<<<<< HEAD
=======
        // Recharger les données pour voir le changement de statut
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
=======
  // FONCTION CORRIGÉE: Redirection vers validation Admin (Étape 2)
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
  const allerVersValidationAdmin = (professeurId) => {
    navigate(`/validation-paiement/${professeurId}?type=cycle`);
  };

<<<<<<< HEAD
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
=======
  // Calculs des totaux
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
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

<<<<<<< HEAD
=======
  // Filtrage des rapports
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
  const filteredRapports = rapportsFinanciers.filter(rapport => {
    if (!rapport || !rapport.professeur) return false;
    return rapport.professeur.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });

  const totaux = calculateTotals();

  const styles = {
<<<<<<< HEAD
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
    controlRow: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '150px',
      background: 'white',
      cursor: 'pointer',
      transition: 'border-color 0.2s ease'
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '300px',
      transition: 'border-color 0.2s ease'
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
    buttonDanger: {
      background: '#ef4444',
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
      fontSize: '32px',
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
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
<<<<<<< HEAD
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
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    },
<<<<<<< HEAD
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
    warningMessage: {
      background: '#fef3c7',
      color: '#78350f',
      border: '1px solid #f59e0b'
    },
    infoMessage: {
      background: '#dbeafe',
      color: '#1e40af',
      border: '1px solid #3b82f6'
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 20px',
<<<<<<< HEAD
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
      color: '#64748b',
      lineHeight: '1.6'
=======
      color: '#6b7280',
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '2px solid #38bdf8'
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
    },
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
      maxWidth: '700px',
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
    modalFooter: {
      padding: '20px 32px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    },
    formGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '100px',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
    },
    infoBox: {
      background: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      fontSize: '14px',
      color: '#78350f'
    },
    previewBox: {
      background: '#e0f2fe',
      border: '1px solid #0891b2',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    },
    previewTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0891b2',
      marginBottom: '12px'
    },
    previewContent: {
      fontSize: '14px',
      color: '#0c4a6e',
      lineHeight: '1.8'
    },
    cycleInfo: {
      background: '#f8fafc',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      border: '1px solid #e2e8f0'
    },
    cycleTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#475569',
      marginBottom: '8px'
    },
    cycleText: {
      fontSize: '13px',
      color: '#64748b',
      lineHeight: '1.6'
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
    }
  };

  return (
<<<<<<< HEAD
    <div style={styles.pageWrapper}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Gestion Financière</h1>
          <p style={styles.headerSubtitle}>
            Gérez les paiements, ajustements et validations des entrepreneurs
          </p>
        </div>

        {/* Contrôles */}
        <div style={styles.card}>
          <div style={styles.controlRow}>
            <select
              style={styles.select}
              value={selectedPeriod.mois}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
                ...styles.buttonPrimary,
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

          <div style={styles.controlRow}>
            <input
              style={styles.input}
              placeholder="Rechercher un entrepreneur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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

        {/* Information système de cycles */}
        <div style={styles.card}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
            Système de Cycles de Paiement
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={styles.cycleInfo}>
              <div style={styles.cycleTitle}>Cycle En Cours</div>
              <div style={styles.cycleText}>
                Séances non payées accumulées depuis le dernier paiement. Ajustements possibles et validation Finance requise.
              </div>
            </div>
            
            <div style={{...styles.cycleInfo, background: '#eff6ff', borderColor: '#bfdbfe'}}>
              <div style={styles.cycleTitle}>Validé Finance</div>
              <div style={styles.cycleText}>
                Cycle approuvé avec montant final confirmé. Prêt pour paiement Admin. Ajustements verrouillés.
              </div>
            </div>
            
            <div style={{...styles.cycleInfo, background: '#f0fdf4', borderColor: '#bbf7d0'}}>
              <div style={styles.cycleTitle}>Payé - Nouveau Cycle</div>
              <div style={styles.cycleText}>
                Paiement effectué, nouveau cycle créé automatiquement. Historique préservé et données remises à zéro.
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
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

        {/* Chargement */}
        {loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyTitle}>Chargement en cours</div>
            <div style={styles.emptyText}>Récupération des données financières...</div>
          </div>
        )}

        {/* Contenu principal */}
        {!loading && (
          <>
            {filteredRapports.length > 0 ? (
              <>
                {/* Statistiques */}
                <div style={styles.statsGrid}>
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

                {/* Tableau */}
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
                              <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b' }}>
                                {prof.nom}
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                {prof.email}
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: '#3b82f6' }}>
                                Cycle #{donnees.numeroCycle}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                {donnees.cycleInfo?.seancesCount || 0} séance(s)
                              </div>
                            </td>
                            <td style={styles.td}>
                              <strong style={{ fontSize: '16px', color: '#3b82f6' }}>
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
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                      {donnees.ajustementInfo.motif.substring(0, 20)}...
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '13px' }}>Aucun</span>
                              )}
                            </td>
                            <td style={styles.td}>
                              <strong style={{ fontSize: '16px', color: '#dc2626' }}>
                                {safeCalculate(donnees, 'montantNet').toFixed(2)} DH
                              </strong>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.badge,
                                ...(donnees.statutCycle === 'paye_admin' ? styles.badgeSuccess : 
                                    donnees.statutCycle === 'valide_finance' ? styles.badgeInfo :
                                    styles.badgeWarning)
                              }}>
                                {donnees.statutAffichage || 'En attente'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                {donnees.statutCycle === 'en_cours' && (
                                  <>
                                    <button
                                      style={{ 
                                        ...styles.button, 
                                        ...styles.buttonDanger,
                                        fontSize: '12px', 
                                        padding: '6px 12px'
                                      }}
                                      onClick={() => {
                                        setSelectedProfesseur(prof);
                                        setShowPenaliteModal(true);
                                      }}
                                    >
                                      Ajustement
                                    </button>
                                    <button
                                      style={{ 
                                        ...styles.button, 
                                        ...styles.buttonSuccess,
                                        fontSize: '12px', 
                                        padding: '6px 12px',
                                        ...(loadingValidation ? styles.buttonDisabled : {})
                                      }}
                                      onClick={() => validerCycleParFinance(prof._id)}
                                      disabled={loadingValidation}
                                    >
                                      Valider Finance
                                    </button>
                                  </>
                                )}

                                {donnees.statutCycle === 'valide_finance' && (
                                  <button
                                    style={{ 
                                      ...styles.button, 
                                      fontSize: '12px', 
                                      padding: '6px 12px',
                                      background: '#f59e0b',
                                      color: 'white'
                                    }}
                                    onClick={() => allerVersValidationAdmin(prof._id)}
                                  >
                                    Vers Paiement
                                  </button>
                                )}

                                {donnees.statutCycle === 'paye_admin' && (
                                  <div style={{
                                    padding: '6px 12px',
                                    background: '#d1fae5',
                                    color: '#065f46',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    fontWeight: '600'
                                  }}>
                                    Payé
                                  </div>
                                )}
                                
                                <button
                                  style={{ 
                                    ...styles.button, 
                                    ...styles.buttonSecondary,
                                    fontSize: '11px', 
                                    padding: '4px 8px'
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
                <div style={styles.emptyTitle}>
                  {rapportsFinanciers.length === 0 ? 'Aucune donnée financière' : 'Aucun résultat'}
                </div>
                <div style={styles.emptyText}>
                  {rapportsFinanciers.length === 0 
                    ? `Aucun entrepreneur actif pour ${mois[selectedPeriod.mois - 1]} ${selectedPeriod.annee}.`
                    : `Aucun entrepreneur ne correspond à "${searchTerm}".`
                  }
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Ajustement */}
        {showPenaliteModal && (
          <div style={styles.modal} onClick={() => setShowPenaliteModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Appliquer un Ajustement</h2>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.infoBox}>
                  <div style={styles.infoGrid}>
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

                <div style={styles.formGroup}>
                  <label style={styles.label}>Type d'ajustement</label>
                  <select
                    style={styles.select}
                    value={penaliteData.type}
                    onChange={(e) => setPenaliteData({ ...penaliteData, type: e.target.value })}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="pourcentage">Pourcentage du montant total</option>
                    <option value="montant_fixe">Montant fixe en DH</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {penaliteData.type === 'pourcentage' ? 'Pourcentage (%)' : 'Montant (DH)'}
                  </label>
                  <input
                    type="number"
                    style={styles.input}
                    value={penaliteData.valeur}
                    onChange={(e) => setPenaliteData({ ...penaliteData, valeur: e.target.value })}
                    placeholder={penaliteData.type === 'pourcentage' ? 'Ex: 10 ou -5' : 'Ex: 500 ou -200'}
                    step={penaliteData.type === 'pourcentage' ? "0.1" : "0.01"}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Valeurs négatives pour rabais (ex: -10)
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Motif (obligatoire)</label>
                  <textarea
                    style={styles.textarea}
                    value={penaliteData.motif}
                    onChange={(e) => setPenaliteData({ ...penaliteData, motif: e.target.value })}
                    placeholder="Ex: Retards répétés, Prime de performance..."
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Appliquer pour</label>
                  <select
                    style={styles.select}
                    value={penaliteData.appliquePour}
                    onChange={(e) => setPenaliteData({ ...penaliteData, appliquePour: e.target.value })}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="mois_actuel">Ce mois uniquement</option>
                    <option value="permanent">Tous les mois suivants</option>
                  </select>
                </div>

                {penaliteData.valeur && penaliteData.valeur !== '' && selectedProfesseur && (
                  <div style={styles.previewBox}>
                    <div style={styles.previewTitle}>Aperçu du calcul</div>
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
                        <div style={styles.previewContent}>
                          <div>Montant actuel: <strong>{montantActuel.toFixed(2)} DH</strong></div>
                          <div>Ajustement: <strong style={{ color: ajustement >= 0 ? '#dc2626' : '#10b981' }}>
                            {ajustement >= 0 ? '-' : '+'}{Math.abs(ajustement).toFixed(2)} DH
                          </strong></div>
                          <div>Nouveau montant: <strong style={{ fontSize: '16px' }}>
                            {nouveauMontant.toFixed(2)} DH
                          </strong></div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button
                  style={{...styles.button, ...styles.buttonSecondary}}
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
                  style={{
                    ...styles.button,
                    ...styles.buttonDanger,
                    ...(loadingPenalite || !penaliteData.valeur || !penaliteData.motif.trim() ? styles.buttonDisabled : {})
                  }}
                  onClick={appliquerAjustement}
                  disabled={loadingPenalite || !penaliteData.valeur || !penaliteData.motif.trim()}
                >
                  {loadingPenalite ? 'Application...' : 'Appliquer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Historique */}
        {showHistoriqueModal && (
          <div style={styles.modal} onClick={() => setShowHistoriqueModal(false)}>
            <div style={{...styles.modalContent, maxWidth: '1000px'}} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Historique - {selectedProfesseur?.nom}</h2>
              </div>

              <div style={styles.modalBody}>
                {loadingHistorique ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
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
                          <th style={styles.th}>Ajustement</th>
                          <th style={styles.th}>Motif</th>
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
                                ...styles.badge,
                                ...(ajustement.type === 'pourcentage' ? styles.badgeInfo : styles.badgeWarning)
                              }}>
                                {ajustement.type === 'pourcentage' ? 'Pourcentage' : 'Fixe'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <strong>
                                {ajustement.type === 'pourcentage' ? `${ajustement.valeur}%` : `${ajustement.valeur} DH`}
                              </strong>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                color: (ajustement.montantOriginal - ajustement.montantAjuste) > 0 ? '#dc2626' : '#10b981',
                                fontWeight: '700'
                              }}>
                                {(ajustement.montantOriginal - ajustement.montantAjuste) > 0 ? '-' : '+'}
                                {Math.abs(ajustement.montantOriginal - ajustement.montantAjuste).toFixed(2)} DH
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ajustement.motif}>
                                {ajustement.motif}
                              </div>
                            </td>
                            <td style={styles.td}>
                              <button
                                style={{
                                  ...styles.button,
                                  ...styles.buttonDanger,
                                  fontSize: '11px',
                                  padding: '4px 8px'
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
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                      Aucun historique
                    </div>
                    <div>Aucun ajustement trouvé pour cet entrepreneur.</div>
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button
                  style={{...styles.button, ...styles.buttonSecondary}}
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
=======
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
>>>>>>> 40b442342f960141cfa700ad6785875d931a1918
    </div>
  );
};

export default GestionFinanciere;