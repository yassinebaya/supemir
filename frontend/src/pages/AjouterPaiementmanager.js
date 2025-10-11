import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Sidebar from '../components/Sidebarpaiment';
import {
  Save,
  UserRoundSearch,
  BookOpen,
  Calendar,
  BadgeEuro,
  StickyNote,
  Info,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://195.179.229.230:5000/api';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const AjouterPaiement = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [cours, setCours] = useState([]);
  const [etudiantsComplets, setEtudiantsComplets] = useState([]);
  
  const [prixTotalEtudiant, setPrixTotalEtudiant] = useState(0);
  const [totalDejaPaye, setTotalDejaPaye] = useState(0);
  const [resteAPayer, setResteAPayer] = useState(0);
  const [modePaiementEtudiant, setModePaiementEtudiant] = useState('');
  const [infosModesPaiement, setInfosModesPaiement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    etudiant: '',
    cours: [],
    moisDebut: '',
    nombreMois: 1,
    montant: '',
    note: '',
    typePaiement: 'formation',
    estInscription: false,
    numeroSerie: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [showRappelModal, setShowRappelModal] = useState(false);
  const [rappelData, setRappelData] = useState({
    note: '',
    dateRappel: ''
  });

  // Fonction utilitaire pour les requêtes API
  const getAuthConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  // Affichage des messages avec auto-disparition
  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  }, []);

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const config = getAuthConfig();
        const [resEtudiants, resCours] = await Promise.all([
          axios.get(`${API_BASE_URL}/etudiant`, config),
          axios.get(`${API_BASE_URL}/cours`, config)
        ]);

        const etudiantsActifs = resEtudiants.data.filter(e => 
          e.actif && 
          e.prixTotal > 0 && 
          e.anneeScolaire === '2025/2026'
        );

        setEtudiantsComplets(etudiantsActifs);
        setEtudiants(etudiantsActifs.map(e => ({
          value: e._id,
          label: e.nomComplet
        })));
        setCours(resCours.data.map(c => ({ value: c.nom, label: c.nom })));

        // Gestion des données pré-remplies
        const savedData = localStorage.getItem('paiementPreRempli');
        if (savedData) {
          const { etudiant: etuId, cours: coursSaved } = JSON.parse(savedData);
          const etudiantComplet = etudiantsActifs.find(e => e._id === etuId);
          
          if (etudiantComplet) {
            setForm(prev => ({
              ...prev,
              etudiant: etuId,
              cours: coursSaved || []
            }));
            await loadEtudiantInfo(etudiantComplet, etuId, coursSaved);
          }
          localStorage.removeItem('paiementPreRempli');
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
        showMessage('❌ Erreur lors du chargement des données', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getAuthConfig, showMessage]);

  // Chargement des informations de paiement d'un étudiant
  const loadEtudiantInfo = async (etudiantComplet, etudiantId, coursEtudiant = null) => {
    try {
      const coursFinaux = coursEtudiant || etudiantComplet?.cours || etudiantComplet?.coursInscrits || [];
      const config = getAuthConfig();
      
      try {
        const { data: infos } = await axios.get(
          `${API_BASE_URL}/paiements/etudiant/${etudiantId}/info`,
          config
        );
        
        setPrixTotalEtudiant(infos.etudiant.prixTotal);
        setTotalDejaPaye(infos.totaux.formation);
        setResteAPayer(infos.totaux.resteAPayer);
        setModePaiementEtudiant(infos.etudiant.modePaiement);
        setInfosModesPaiement(infos.infosModesPaiement);

        // Auto-remplissage intelligent
        if (infos.etudiant.modePaiement !== 'annuel' && infos.prochaineTranche) {
          setForm(prev => ({
            ...prev,
            montant: infos.prochaineTranche.montant.toString(),
            nombreMois: infos.prochaineTranche.nombreMois,
            note: infos.prochaineTranche.description,
            cours: coursFinaux
          }));
        } else {
          setForm(prev => ({ ...prev, cours: coursFinaux }));
        }
      } catch (infoErr) {
        // Fallback vers l'ancienne méthode
        console.warn('API /info non disponible, fallback:', infoErr);
        const { data: paiements } = await axios.get(
          `${API_BASE_URL}/paiements/etudiant/${etudiantId}`,
          config
        );

        const totalPaye = paiements.reduce((acc, p) => acc + (p.montant || 0), 0);
        const prixTotal = etudiantComplet?.prixTotal || 0;

        setPrixTotalEtudiant(prixTotal);
        setTotalDejaPaye(totalPaye);
        setResteAPayer(Math.max(0, prixTotal - totalPaye));
        setModePaiementEtudiant(etudiantComplet?.modePaiement || 'semestriel');
        setInfosModesPaiement(null);
        setForm(prev => ({ ...prev, cours: coursFinaux }));
      }
    } catch (err) {
      console.error('Erreur calcul paiements:', err);
      const prixTotal = etudiantComplet?.prixTotal || 0;
      setPrixTotalEtudiant(prixTotal);
      setTotalDejaPaye(0);
      setResteAPayer(prixTotal);
      setModePaiementEtudiant(etudiantComplet?.modePaiement || 'semestriel');
      setInfosModesPaiement(null);
    }
  };

  // Gestion du changement d'étudiant
  const handleEtudiantChange = async (selectedEtudiant) => {
    if (!selectedEtudiant) {
      setForm(prev => ({ ...prev, etudiant: '', cours: [] }));
      setPrixTotalEtudiant(0);
      setTotalDejaPaye(0);
      setResteAPayer(0);
      setModePaiementEtudiant('');
      setInfosModesPaiement(null);
      return;
    }

    const etudiantId = selectedEtudiant.value;
    const etudiantComplet = etudiantsComplets.find(e => e._id === etudiantId);
    
    setForm(prev => ({ ...prev, etudiant: etudiantId }));
    await loadEtudiantInfo(etudiantComplet, etudiantId);
  };

  // Gestion du changement de type de paiement
  const handleTypePaiementChange = (type) => {
    const isInscription = type === 'inscription';
    
    setForm(prev => ({
      ...prev,
      typePaiement: type,
      estInscription: isInscription,
      moisDebut: isInscription ? '' : prev.moisDebut,
      nombreMois: isInscription ? 0 : (infosModesPaiement?.moisParTranche || 1),
      montant: isInscription ? '' : (infosModesPaiement?.montantParTranche?.toString() || ''),
      note: isInscription ? 'Frais d\'inscription' : (infosModesPaiement?.description || '')
    }));
  };

  // Remplir automatiquement le montant restant
  const remplirMontantRestant = () => {
    setForm(prev => ({ ...prev, montant: resteAPayer.toString() }));
  };

  // Validation du formulaire
  const validateForm = () => {
    if (!form.etudiant) {
      showMessage('❌ Veuillez sélectionner un étudiant', 'error');
      return false;
    }

    if (!form.numeroSerie?.trim()) {
      showMessage('❌ Le numéro de série est obligatoire', 'error');
      return false;
    }

    if (form.numeroSerie.trim().length < 3) {
      showMessage('❌ Le numéro de série doit contenir au moins 3 caractères', 'error');
      return false;
    }

    if (!form.montant || parseFloat(form.montant) <= 0) {
      showMessage('❌ Le montant doit être supérieur à 0', 'error');
      return false;
    }

    if (modePaiementEtudiant === 'annuel') {
      const etudiant = etudiantsComplets.find(e => e._id === form.etudiant);
      if (etudiant?.paye) {
        showMessage('❌ Cet étudiant en mode annuel est déjà marqué comme payé', 'error');
        return false;
      }
    }

    if (!form.estInscription && resteAPayer <= 0) {
      showMessage('❌ Cet étudiant a déjà payé la totalité', 'error');
      return false;
    }

    if (!form.estInscription && parseFloat(form.montant) > resteAPayer) {
      showMessage(`❌ Le montant ne peut pas dépasser ${resteAPayer} MAD`, 'error');
      return false;
    }

    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const config = getAuthConfig();
      const paiementData = {
        etudiant: form.etudiant,
        cours: form.cours,
        moisDebut: form.moisDebut || new Date().toISOString().split('T')[0],
        nombreMois: form.nombreMois,
        montant: parseFloat(form.montant),
        note: form.note,
        estInscription: form.estInscription,
        numeroSerie: form.numeroSerie.trim()
      };

      await axios.post(`${API_BASE_URL}/paiements`, paiementData, config);
      showMessage('✅ Paiement ajouté avec succès', 'success');
      
      // Recharger les infos de l'étudiant
      const etudiantComplet = etudiantsComplets.find(e => e._id === form.etudiant);
      await loadEtudiantInfo(etudiantComplet, form.etudiant);
      
      // Réinitialiser certains champs
      setForm(prev => ({
        ...prev,
        moisDebut: '',
        montant: '',
        note: '',
        typePaiement: 'formation',
        estInscription: false,
        numeroSerie: ''
      }));
    } catch (err) {
      console.error('Erreur ajout:', err);
      const errorMsg = err.response?.data?.error || 'Erreur lors de l\'ajout du paiement';
      showMessage(`❌ ${errorMsg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Gestion du rappel
  const handleAjouterRappel = async () => {
    if (!rappelData.dateRappel || !rappelData.note) {
      showMessage('❌ Veuillez remplir tous les champs du rappel', 'error');
      return;
    }

    if (!form.etudiant || !form.montant || form.cours.length === 0) {
      showMessage('❌ Veuillez remplir le paiement d\'abord', 'error');
      return;
    }

    try {
      const data = {
        etudiant: form.etudiant,
        cours: Array.isArray(form.cours) ? form.cours[0] : form.cours,
        montantRestant: form.montant,
        note: rappelData.note,
        dateRappel: rappelData.dateRappel
      };

      const res = await fetch(`${API_BASE_URL}/rappels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        showMessage('✅ Rappel enregistré avec succès', 'success');
        setShowRappelModal(false);
        setRappelData({ note: '', dateRappel: '' });
      } else {
        showMessage('❌ Erreur lors de l\'enregistrement du rappel', 'error');
      }
    } catch (err) {
      console.error(err);
      showMessage('❌ Erreur serveur lors de l\'ajout du rappel', 'error');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(135deg, #f0f9ff 0%, #a6dbff 25%, #f3e8ff 100%)',
      padding: '20px'
    },
    formContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      padding: '30px'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1f2937',
      textAlign: 'center',
      marginBottom: '30px'
    },
    infoPaiement: {
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '25px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px'
    },
    infoItem: {
      textAlign: 'center'
    },
    infoLabel: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '5px',
      fontWeight: '500'
    },
    infoValue: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    infoValuePaid: {
      color: '#059669'
    },
    infoValueRemaining: {
      color: '#dc2626'
    },
    formGrid: {
      display: 'grid',
      gap: '25px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '25px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '80px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      marginTop: '30px',
      flexWrap: 'wrap'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    quickFillButton: {
      backgroundColor: '#10b981',
      fontSize: '14px',
      padding: '8px 16px'
    },
    message: {
      marginTop: '20px',
      padding: '15px',
      borderRadius: '8px',
      textAlign: 'center',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    messageSuccess: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#15803d'
    },
    messageError: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#dc2626'
    }
  };

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '44px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      '&:hover': { borderColor: '#3b82f6' }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e0f2fe',
      borderRadius: '6px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#0369a1'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#0369a1',
      '&:hover': {
        backgroundColor: '#0369a1',
        color: 'white'
      }
    })
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.formContainer}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Chargement des données...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.formContainer}>
        <h2 style={styles.title}>Ajouter un Paiement</h2>

        {form.etudiant && (
          <div style={styles.infoPaiement}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>
                <Info size={16} style={{display: 'inline', marginRight: '4px'}} />
                Prix Total
              </div>
              <div style={styles.infoValue}>{prixTotalEtudiant.toLocaleString()} MAD</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Formation Payée</div>
              <div style={{...styles.infoValue, ...styles.infoValuePaid}}>
                {totalDejaPaye.toLocaleString()} MAD
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Reste à Payer</div>
              <div style={{...styles.infoValue, ...styles.infoValueRemaining}}>
                {resteAPayer.toLocaleString()} MAD
              </div>
            </div>
            {modePaiementEtudiant && (
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Mode de Paiement</div>
                <div style={styles.infoValue}>
                  {modePaiementEtudiant.charAt(0).toUpperCase() + modePaiementEtudiant.slice(1)}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={styles.formGrid}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <UserRoundSearch size={16} style={{color: '#3b82f6'}} />
                Étudiant *
              </label>
              <Select
                options={etudiants}
                value={etudiants.find(e => e.value === form.etudiant)}
                onChange={handleEtudiantChange}
                placeholder="Sélectionner un étudiant"
                isSearchable
                styles={selectStyles}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <BookOpen size={16} style={{color: '#10b981'}} />
                Classe
              </label>
              <Select
                options={cours}
                value={cours.filter(option => form.cours.includes(option.value))}
                onChange={selectedOptions => 
                  setForm({ 
                    ...form, 
                    cours: selectedOptions ? selectedOptions.map(opt => opt.value) : []
                  })
                }
                placeholder="Classe(s) sélectionnée(s)"
                isMulti
                isSearchable
                styles={selectStyles}
                isDisabled
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <BadgeEuro size={16} style={{color: '#8b5cf6'}} />
                Type de Paiement *
              </label>
              <div style={{display: 'flex', gap: '10px'}}>
                <button
                  type="button"
                  onClick={() => handleTypePaiementChange('formation')}
                  style={{
                    ...styles.button,
                    backgroundColor: form.typePaiement === 'formation' ? '#3b82f6' : '#e5e7eb',
                    color: form.typePaiement === 'formation' ? 'white' : '#374151'
                  }}
                  disabled={!form.etudiant}
                >
                  Formation
                </button>
                <button
                  type="button"
                  onClick={() => handleTypePaiementChange('inscription')}
                  style={{
                    ...styles.button,
                    backgroundColor: form.typePaiement === 'inscription' ? '#8b5cf6' : '#e5e7eb',
                    color: form.typePaiement === 'inscription' ? 'white' : '#374151'
                  }}
                  disabled={!form.etudiant}
                >
                  Frais d'inscription
                </button>
              </div>
            </div>
            
            {infosModesPaiement && form.typePaiement === 'formation' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Info size={16} style={{color: '#6b7280'}} />
                  Informations Mode
                </label>
                <div style={{...styles.input, backgroundColor: '#f9fafb', fontSize: '12px', color: '#374151'}}>
                  <strong>{infosModesPaiement.description}</strong><br/>
                  Montant par tranche: <strong>{infosModesPaiement.montantParTranche.toLocaleString()} MAD</strong><br/>
                  Mois par tranche: <strong>{infosModesPaiement.moisParTranche}</strong>
                </div>
              </div>
            )}
          </div>

          {!form.estInscription && (
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} style={{color: '#8b5cf6'}} />
                  Date de début
                </label>
                <input
                  type="date"
                  name="moisDebut"
                  value={form.moisDebut}
                  onChange={(e) => setForm({ ...form, moisDebut: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} style={{color: '#f59e0b'}} />
                  Nombre de mois
                </label>
                <input
                  type="number"
                  name="nombreMois"
                  value={form.nombreMois}
                  onChange={(e) => setForm({ ...form, nombreMois: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                  style={styles.input}
                  readOnly={!!infosModesPaiement}
                />
              </div>
            </div>
          )}

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <StickyNote size={16} style={{color: '#dc2626'}} />
                Numéro de Série *
              </label>
              <input
                type="text"
                name="numeroSerie"
                value={form.numeroSerie}
                onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })}
                required
                placeholder="Ex: PAY-2025-001"
                style={{
                  ...styles.input,
                  borderColor: form.numeroSerie ? '#10b981' : '#d1d5db'
                }}
              />
              <small style={{color: '#6b7280', fontSize: '12px', marginTop: '4px'}}>
                <AlertCircle size={12} style={{display: 'inline', marginRight: '4px'}} />
                Ce numéro doit être unique pour chaque paiement
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <BadgeEuro size={16} style={{color: '#10b981'}} />
                Montant (MAD) *
                {resteAPayer > 0 && !form.estInscription && (
                  <button
                    type="button"
                    onClick={remplirMontantRestant}
                    style={{...styles.button, ...styles.quickFillButton, marginLeft: '8px'}}
                    title="Remplir le montant restant"
                  >
                    Reste: {resteAPayer.toLocaleString()} MAD
                  </button>
                )}
              </label>
              <input
                type="number"
                name="montant"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                required
                placeholder="0.00"
                min="0"
                step="0.01"
                style={styles.input}
                disabled={!form.estInscription && resteAPayer <= 0}
              />
              {!form.estInscription && resteAPayer <= 0 && (
                <small style={{color: '#059669', marginTop: '4px'}}>
                  ✅ Cet étudiant a payé la totalité
                </small>
              )}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <StickyNote size={16} style={{color: '#eab308'}} />
              Note (optionnel)
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Ajouter une note..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.buttonContainer}>
            <button
              onClick={handleSubmit}
              style={{
                ...styles.button,
                opacity: submitting || (!form.estInscription && resteAPayer <= 0) ? 0.5 : 1,
                cursor: submitting || (!form.estInscription && resteAPayer <= 0) ? 'not-allowed' : 'pointer'
              }}
              disabled={submitting || (!form.estInscription && resteAPayer <= 0)}
            >
              <Save size={18} />
              {submitting ? 'Enregistrement...' : 'Enregistrer le Paiement'}
            </button>
            
            <button
              onClick={() => setShowRappelModal(true)}
              style={{
                ...styles.button,
                backgroundColor: '#8b5cf6'
              }}
              disabled={!form.etudiant}
            >
              Ajouter un rappel
            </button>
          </div>
        </div>

        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'error' ? styles.messageError : styles.messageSuccess)
          }}>
            {message.type === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <Info size={20} />
            )}
            {message.text}
          </div>
        )}

        {showRappelModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
                Ajouter un rappel de paiement
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Description *
                </label>
                <textarea
                  value={rappelData.note}
                  onChange={(e) => setRappelData({ ...rappelData, note: e.target.value })}
                  placeholder="Entrez une note..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Date du rappel *
                </label>
                <input
                  type="date"
                  value={rappelData.dateRappel}
                  onChange={(e) => setRappelData({ ...rappelData, dateRappel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={() => {
                    setShowRappelModal(false);
                    setRappelData({ note: '', dateRappel: '' });
                  }}
                  style={{
                    padding: '10px 16px',
                    background: '#e5e7eb',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Annuler
                </button>
                <button 
                  onClick={handleAjouterRappel}
                  style={{
                    padding: '10px 16px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AjouterPaiement;