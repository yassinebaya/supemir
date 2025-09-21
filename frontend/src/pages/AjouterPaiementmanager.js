import React, { useEffect, useState } from 'react';
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
  GraduationCap
} from 'lucide-react';

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
  
  const [form, setForm] = useState({
    etudiant: '',
    cours: [],
    moisDebut: '',
    nombreMois: 1,
    montant: '',
    note: '',
    typePaiement: 'mensuel',
    incluePrixInscription: false
  });

  const [message, setMessage] = useState('');
  const [showRappelModal, setShowRappelModal] = useState(false);
  const [note, setNote] = useState('');
  const [dateRappel, setDateRappel] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const resEtudiants = await axios.get('http://localhost:5000/api/etudiants', config);
        const resCours = await axios.get('http://localhost:5000/api/cours', config);

        const etudiantsActifs = resEtudiants.data.filter(e => e.actif);

        setEtudiantsComplets(etudiantsActifs);

        const etudiantsOptions = etudiantsActifs.map(e => ({
          value: e._id,
          label: e.nomComplet
        }));

        setEtudiants(etudiantsOptions);
        setCours(resCours.data.map(c => ({ value: c.nom, label: c.nom })));

        const savedData = JSON.parse(localStorage.getItem('paiementPreRempli'));
        if (savedData) {
          const etuId = savedData.etudiant;
          const coursSaved = savedData.cours || [];

          const etudiantComplet = etudiantsActifs.find(e => e._id === etuId);
          
          if (etudiantComplet) {
            setForm(prev => ({
              ...prev,
              etudiant: etuId,
              cours: coursSaved
            }));

            await handleEtudiantChangeInternal(etudiantComplet, etuId, coursSaved);
          }

          localStorage.removeItem('paiementPreRempli');
        }

      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    };

    fetchData();
  }, []);

  const handleEtudiantChangeInternal = async (etudiantComplet, etudiantId, coursEtudiant = null) => {
    try {
      let coursFinaux = coursEtudiant;
      if (!coursFinaux) {
        coursFinaux = etudiantComplet?.cours || etudiantComplet?.coursInscrits || [];
      }

      const token = localStorage.getItem('token');
      const resPaiements = await axios.get(`http://localhost:5000/api/paiements/etudiant/${etudiantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const paiements = resPaiements.data || [];
      const totalPaye = paiements.reduce((acc, p) => acc + (p.montant || 0), 0);
      const prixTotal = etudiantComplet?.prixTotal || 0;
      const reste = Math.max(0, prixTotal - totalPaye);

      setPrixTotalEtudiant(prixTotal);
      setTotalDejaPaye(totalPaye);
      setResteAPayer(reste);

    } catch (err) {
      console.error('Erreur lors du calcul des paiements:', err);
      const prixTotal = etudiantComplet?.prixTotal || 0;
      setPrixTotalEtudiant(prixTotal);
      setTotalDejaPaye(0);
      setResteAPayer(prixTotal);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Fonction pour gérer la case à cocher
  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    
    if (isChecked) {
      // ✅ Ajouter "Prix inscription: " à la note existante
      const noteActuelle = form.note;
      const nouveauTexte = noteActuelle + (noteActuelle ? ' + Prix inscription: ' : 'Prix inscription: ');
      setForm({ 
        ...form, 
        incluePrixInscription: true,
        note: nouveauTexte
      });
    } else {
      // ✅ Enlever le texte "Prix inscription: " de la note
      const noteActuelle = form.note;
      const noteSansPrix = noteActuelle.replace(/ \+ Prix inscription: [0-9]*/, '').replace(/Prix inscription: [0-9]*/, '').trim();
      setForm({ 
        ...form, 
        incluePrixInscription: false,
        note: noteSansPrix
      });
    }
  };

  const handleEtudiantChange = async (selectedEtudiant) => {
    if (selectedEtudiant) {
      const etudiantId = selectedEtudiant.value;
      const etudiantComplet = etudiantsComplets.find(e => e._id === etudiantId);
      
      let coursEtudiant = [];
      if (etudiantComplet && etudiantComplet.cours) {
        coursEtudiant = etudiantComplet.cours;
      } else if (etudiantComplet && etudiantComplet.coursInscrits) {
        coursEtudiant = etudiantComplet.coursInscrits;
      }
      
      setForm({
        ...form,
        etudiant: etudiantId,
        cours: coursEtudiant
      });

      await handleEtudiantChangeInternal(etudiantComplet, etudiantId);
    } else {
      setForm({
        ...form,
        etudiant: '',
        cours: []
      });
      setPrixTotalEtudiant(0);
      setTotalDejaPaye(0);
      setResteAPayer(0);
    }
  };

  const remplirMontantRestant = () => {
    setForm({
      ...form,
      montant: resteAPayer.toString()
    });
  };

  const handleSubmit = async () => {
    if (resteAPayer <= 0) {
      setMessage('❌ Cet étudiant a déjà payé la totalité du montant dû.');
      return;
    }

    if (parseFloat(form.montant) > resteAPayer) {
      setMessage(`❌ Le montant ne peut pas dépasser le reste à payer (${resteAPayer} MAD).`);
      return;
    }

    const token = localStorage.getItem('token');
    
    const paiementData = {
      etudiant: form.etudiant,
      cours: form.cours,
      moisDebut: form.moisDebut,
      nombreMois: form.nombreMois,
      montant: form.montant,
      note: form.note, // ✅ La note contient tout (note + prix inscription si inclus)
      typePaiement: form.typePaiement
    };

    try {
      await axios.post('http://localhost:5000/api/paiements', paiementData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Paiement ajouté avec succès');
      
      setForm({
        etudiant: '',
        cours: [],
        moisDebut: '',
        nombreMois: 1,
        montant: '',
        note: '',
        typePaiement: 'mensuel',
        incluePrixInscription: false
      });
      
      setPrixTotalEtudiant(0);
      setTotalDejaPaye(0);
      setResteAPayer(0);
    } catch (err) {
      console.error('Erreur ajout:', err);
      setMessage('❌ Erreur lors de l\'ajout du paiement');
    }
  };

  const handleAjouterRappel = async () => {
    if (!dateRappel || !note) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    if (!form.etudiant || !form.montant || !form.cours || form.cours.length === 0) {
      alert("Veuillez remplir le paiement d'abord (étudiant, montant, classe).");
      return;
    }

    const etudiantId = form.etudiant;
    const nomCours = Array.isArray(form.cours) ? form.cours[0] : form.cours;
    const montantManquant = form.montant;

    const data = {
      etudiant: etudiantId,
      cours: nomCours,
      montantRestant: montantManquant,
      note,
      dateRappel
    };

    try {
      const res = await fetch('http://localhost:5000/api/rappels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert("Rappel enregistré avec succès !");
        setShowRappelModal(false);
        setNote('');
        setDateRappel('');
      } else {
        alert("Erreur lors de l'enregistrement !");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur !");
    }
  };

  useEffect(() => {
    if (form.typePaiement === 'annuel') {
      setForm(prev => ({ ...prev, nombreMois: 12 }));
    }
  }, [form.typePaiement]);

  useEffect(() => {
    if (form.typePaiement === 'annuel') {
      const montantMensuel = form.montant / (form.nombreMois || 1);
      setForm(prev => ({ ...prev, montant: montantMensuel * 12 }));
    }
  }, [form.nombreMois]);

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
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '20px',
      alignItems: 'center'
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
      gridTemplateColumns: '1fr',
      gap: '25px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
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
      marginTop: '30px'
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
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '8px',
      textAlign: 'center',
      color: '#15803d',
      fontWeight: '500'
    },
    messageError: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      color: '#dc2626'
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '15px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
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
      '&:hover': {
        borderColor: '#3b82f6'
      }
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

  return (
    <>
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
                <div style={styles.infoValue}>{prixTotalEtudiant} MAD</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Déjà Payé</div>
                <div style={{...styles.infoValue, ...styles.infoValuePaid}}>{totalDejaPaye} MAD</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Reste à Payer</div>
                <div style={{...styles.infoValue, ...styles.infoValueRemaining}}>{resteAPayer} MAD</div>
              </div>
            </div>
          )}

          <div style={styles.formGrid}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <UserRoundSearch size={16} style={{color: '#3b82f6'}} />
                  Étudiant
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
                  placeholder="Classe sélectionnés automatiquement"
                  isMulti
                  isSearchable
                  styles={selectStyles}
                />
              </div>
            </div>

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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  min="1"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <BadgeEuro size={16} style={{color: '#10b981'}} />
                  Montant
                  {resteAPayer > 0 && (
                    <button
                      type="button"
                      onClick={remplirMontantRestant}
                      style={{...styles.button, ...styles.quickFillButton, marginLeft: '8px'}}
                      title="Remplir le montant restant"
                    >
                      Reste: {resteAPayer} MAD
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  name="montant"
                  value={form.montant}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  style={styles.input}
                  disabled={resteAPayer <= 0}
                />
                {resteAPayer <= 0 && (
                  <small style={{color: '#059669', marginTop: '4px'}}>
                    ✅ Cet étudiant a payé la totalité
                  </small>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <StickyNote size={16} style={{color: '#eab308'}} />
                  Note (optionnel)
                </label>
                
                {/* ✅ Case à cocher pour inclure prix d'inscription dans la note */}
                <div style={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    id="incluePrixInscription"
                    checked={form.incluePrixInscription}
                    onChange={handleCheckboxChange}
                    style={styles.checkbox}
                  />
                  <label htmlFor="incluePrixInscription" style={styles.checkboxLabel}>
                    <GraduationCap size={16} style={{color: '#8b5cf6'}} />
                    Inclure prix d'inscription
                  </label>
                </div>
                
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder={form.incluePrixInscription ? "Écrivez votre note + le montant après 'Prix inscription: '" : "Ajouter une note..."}
                  style={styles.textarea}
                />
                
                {form.incluePrixInscription && (
                  <small style={{color: '#8b5cf6', marginTop: '5px', fontSize: '12px'}}>
                    💡 Ajoutez le montant après "Prix inscription: " dans le champ ci-dessus
                  </small>
                )}
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button
                onClick={handleSubmit}
                style={styles.button}
                disabled={resteAPayer <= 0}
              >
                <Save size={18} />
                Enregistrer le Paiement
              </button>
              
              <button
                onClick={() => setShowRappelModal(true)}
                style={{
                  ...styles.button,
                  backgroundColor: '#8b5cf6'
                }}
              >
                Ajouter un rappel
              </button>
            </div>
          </div>

          {message && (
            <div style={message.includes('❌') ? {...styles.message, ...styles.messageError} : styles.message}>
              {message}
            </div>
          )}

          {showRappelModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
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
                <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Ajouter un rappel de paiement</h2>

                <label style={{ display: 'block', marginBottom: '8px' }}>Description :</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Entrez une note..."
                  rows="4"
                  style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
                />

                <label style={{ display: 'block', marginBottom: '8px' }}>Date du rappel :</label>
                <input
                  type="date"
                  value={dateRappel}
                  onChange={(e) => setDateRappel(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginBottom: '24px', borderRadius: '8px', border: '1px solid #ccc' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button 
                    onClick={() => setShowRappelModal(false)} 
                    style={{ padding: '10px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px' }}
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleAjouterRappel} 
                    style={{ padding: '10px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px' }}
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AjouterPaiement;