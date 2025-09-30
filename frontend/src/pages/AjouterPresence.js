import React, { useEffect, useState, useCallback } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Save, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock,
  GraduationCap,
  Sun,
  Moon,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/SidebarProf'; // Composant sidebar pour professeur

const AjouterPresence = () => {
  const [cours, setCours] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [dateSession, setDateSession] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [periode, setPeriode] = useState('matin');
  const [presences, setPresences] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seanceId, setSeanceId] = useState(''); // Ajouter ce state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCours = async () => {
      try {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'prof') {
          navigate('/');
          return;
        }

        try {
                    // ✅ Récupérer d'abord la liste des cours
          const resCours = await axios.get('https://vmi1977988.contaboserver.net/api2/professeur/mes-cours', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCours(resCours.data);

          // ✅ Essayer de chercher la séance actuelle
          const res = await axios.get('https://vmi1977988.contaboserver.net/api2/seances/actuelle', {
            headers: { Authorization: `Bearer ${token}` }
          });

          const seanceActuelle = res.data;
          console.log('🔍 Séance actuelle trouvée:', seanceActuelle);
          
          // ✅ DÉBOGAGE DÉTAILLÉ
          console.log('=== DONNÉES SÉANCE ACTUELLE ===');
          console.log('seanceActuelle.cours:', seanceActuelle.cours);
          console.log('seanceActuelle.matiere:', seanceActuelle.matiere);
          console.log('seanceActuelle.type:', seanceActuelle.type);
          console.log('===============================');
          
          // Auto-remplir tous les champs
          setSelectedCours(seanceActuelle.cours); // Maintenant c'est le nom, pas l'ID
          setDateSession(seanceActuelle.dateSeance.split('T')[0]);
          setHeureDebut(seanceActuelle.heureDebut);
          setHeureFin(seanceActuelle.heureFin);
          setSeanceId(seanceActuelle._id);
          
          setSeanceId(seanceActuelle._id);
          
          // ✅ DÉBOGAGE: Afficher la matière reçue
          console.log('=== MATIÈRE REÇUE ===');
          console.log('seanceActuelle.matiere:', seanceActuelle.matiere);
          console.log('seanceActuelle.type:', seanceActuelle.type);
          console.log('==================');
          
          // ✅ CORRECTION : Récupérer les étudiants avec toutes les infos nécessaires
          const resEtudiants = await axios.get(`https://vmi1977988.contaboserver.net//api2/seances/${seanceActuelle._id}/etudiants`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // ✅ CORRECTION: Utiliser directement la matière de la séance
          const matiereSeance = seanceActuelle.matiere; // Pas de fallback vers "Séance manuelle"
          
          console.log('=== INITIALISATION PRÉSENCES ===');
          console.log('Matière utilisée:', matiereSeance);
          console.log('Professeur:', seanceActuelle.nomProfesseur);
          console.log('================================');
          
          const initialPresences = resEtudiants.data.map(et => ({
            etudiant: et._id,
            nom: et.nomComplet,
            statut: 'present',
            retardMinutes: '',
            remarque: '',
            seanceId: seanceActuelle._id,
            matiere: matiereSeance, // ✅ Utiliser directement la matière reçue
            nomProfesseur: seanceActuelle.nomProfesseur
          }));
          
          setPresences(initialPresences);
          
          console.log('✅ Présences initialisées avec matière:', matiereSeance);
          console.log('Nombre d\'étudiants:', initialPresences.length);

        } catch (error) {
          if (error.response?.status === 404) {
            // ✅ NOUVEAU: Gérer les différents types de 404
            const errorMessage = error.response?.data?.message || error.response?.data?.error;
            
            if (errorMessage?.includes('Toutes les séances du jour sont terminées')) {
              setMessage('all_sessions_completed');
            } else {
              setMessage('no_session_today');
            }
            
            console.log('📝 Aucune séance disponible:', errorMessage);
          } else {
            console.error('Erreur:', error);
            setMessage('error');
          }
        }
      } catch (error) {
        console.error('Erreur globale:', error);
        setMessage('error');
      }
    };

    fetchCours();
  }, [navigate]);

  // Move the CSS class addition useEffect inside the component
  useEffect(() => {
    const configGrid = document.querySelector('[data-config-grid]');
    if (configGrid) {
      configGrid.classList.add('configuration-grid');
    }
    
    const leftCol = document.querySelector('[data-left-column]');
    if (leftCol) {
      leftCol.classList.add('left-column');
    }
    
    const rightCol = document.querySelector('[data-right-column]');  
    if (rightCol) {
      rightCol.classList.add('right-column');
    }
  }, []);

  // Ajouter les styles CSS
  useEffect(() => {
    const additionalStyles = `
      .form-select:focus, .form-input:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
      }
      
      .table-row:hover {
        background-color: #f8fafc !important;
      }
      
      .remarque-input:focus, .retard-input:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
      }
      
      /* Animation de rotation pour l'icône de chargement */
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Style pour bouton désactivé */
      button:disabled {
        pointer-events: none;
      }
      
      /* Responsive Design */
      @media (max-width: 968px) {
        .configuration-grid {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
        }
        
        .left-column, .right-column {
          padding: 20px !important;
        }
      }
      
      @media (max-width: 768px) {
        .main-content {
          padding: 16px !important;
        }
        
        .form-content {
          padding: 20px !important;
        }
        
        .configuration-grid {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
          margin-bottom: 16px !important;
        }
        
        .left-column {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important;
          margin-bottom: 0 !important;
        }
        
        .right-column {
          background: linear-gradient(135deg, #fefcbf, #fef3c7) !important;
        }
        
        .title {
          font-size: 24px !important;
        }
        
        .table-container {
          font-size: 14px !important;
        }
        
        .th, .td {
          padding: 12px 8px !important;
        }
        
        .remarque-container, .retard-container {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 6px !important;
        }
        
        .submit-button {
          width: 100% !important;
          justify-content: center !important;
        }
        
        .student-info {
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          gap: 8px !important;
        }
        
        .student-name {
          font-size: 14px !important;
        }
        
        .avatar {
          width: 35px !important;
          height: 35px !important;
        }
        
        .avatar-text {
          font-size: 14px !important;
        }
        
        .status-select {
          min-width: 100px !important;
          font-size: 13px !important;
          padding: 6px 12px !important;
        }
        
        .form-group {
          margin-bottom: 16px !important;
        }
        
        .card-header {
          padding: 20px 24px !important;
        }
        
        .card-title-text {
          font-size: 18px !important;
        }
      }
      
      @media (max-width: 480px) {
        .main-content {
          padding: 12px !important;
        }
        
        .form-content {
          padding: 16px !important;
        }
        
        .left-column, .right-column {
          padding: 16px !important;
          gap: 16px !important;
        }
        
        .header-content {
          padding: 0 16px !important;
        }
        
        .title {
          font-size: 20px !important;
        }
        
        .title-section {
          flex-direction: column !important;
          gap: 8px !important;
          padding: 16px 0 !important;
        }
        
        .card-header {
          padding: 16px 20px !important;
        }
        
        .table-container {
          border-radius: 8px !important;
        }
        
        .submit-container {
          padding-top: 16px !important;
        }
        
        .submit-button {
          padding: 14px 24px !important;
          font-size: 15px !important;
        }
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = additionalStyles;
    document.head.appendChild(styleSheet);
    
    return () => {
      // Cleanup
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // تحديث الفترة تلقائياً عند تغيير وقت البداية
  useEffect(() => {
    if (heureDebut) {
      const hour = parseInt(heureDebut.split(':')[0]);
      setPeriode(hour < 12 ? 'matin' : 'soir');
    }
  }, [heureDebut]);

  // 🆕 Fonction pour vérifier si tous les champs requis sont remplis
  const areAllFieldsFilled = useCallback(() => {
    return selectedCours && dateSession && heureDebut && heureFin;
  }, [selectedCours, dateSession, heureDebut, heureFin]);

  // 🆕 useEffect pour charger les étudiants uniquement quand tous les champs sont remplis
  useEffect(() => {
    const loadStudents = async () => {
      if (!areAllFieldsFilled()) {
        setPresences([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        const res = await axios.get('https://vmi1977988.contaboserver.net/api2/professeur/etudiants', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filtrer par le cours sélectionné
        const filtered = res.data.filter(et => et.cours.includes(selectedCours));

        const initialPresences = filtered.map(et => ({
          etudiant: et._id,
          nom: et.nomComplet,
          statut: 'present', // 🆕 'present', 'absent', 'retard'
          retardMinutes: '', // 🆕 Temps de retard en minutes
          remarque: '',
        }));
        setPresences(initialPresences);
      } catch (error) {
        console.error('Erreur lors du chargement des étudiants:', error);
        setMessage('error');
      }
    };

    loadStudents();
  }, [selectedCours, dateSession, heureDebut, heureFin, areAllFieldsFilled]); // 🆕 Déclencher quand un de ces champs change

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // 🔄 Fonction simplifiée pour la sélection du cours
  const handleCoursChange = (e) => {
    setSelectedCours(e.target.value);
    setMessage(''); // Reset message
  };

  const handlePresenceChange = (index, field, value) => {
    const updated = [...presences];
    updated[index][field] = value;
    
    // 🆕 Si le statut change de 'retard' à autre chose, effacer les minutes de retard
    if (field === 'statut' && value !== 'retard') {
      updated[index]['retardMinutes'] = '';
    }
    
    setPresences(updated);
  };

// SOLUTION SIMPLE : Dans AjouterPresence.js, modifiez juste la fonction handleSubmit

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (isSubmitting) {
    return;
  }

  const token = localStorage.getItem('token');

  // Validations
  if (!selectedCours || !dateSession || !heureDebut || !heureFin) {
    setMessage('error');
    return;
  }

  if (heureFin <= heureDebut) {
    setMessage('error');
    return;
  }

  const retardsInvalides = presences.some(p => 
    p.statut === 'retard' && (!p.retardMinutes || p.retardMinutes <= 0)
  );
  
  if (retardsInvalides) {
    setMessage('retard_error');
    return;
  }

  setIsSubmitting(true);
  setMessage('loading');

  const heure = `${heureDebut}-${heureFin}`;

  try {
    // Obtenir infos professeur
    const resProfesseur = await axios.get('https://vmi1977988.contaboserver.net/api2/professeur/profil', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const professeurInfo = resProfesseur.data;

    // ✅ CORRECTION : Déterminer la vraie matière à envoyer
    let matiereAEnvoyer = 'Matière non spécifiée';
    
    // Si on a un seanceId (séance automatique), récupérer sa matière
    if (seanceId) {
      try {
        const resSeance = await axios.get(`https://vmi1977988.contaboserver.net//api2/seances/${seanceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resSeance.data && resSeance.data.matiere) {
          matiereAEnvoyer = resSeance.data.matiere;
          console.log('✅ Matière récupérée de la séance:', matiereAEnvoyer);
        }
      } catch (seanceError) {
        console.warn('Erreur récupération matière séance:', seanceError);
        // Fallback sur la matière du professeur
        matiereAEnvoyer = professeurInfo.matiere || selectedCours;
      }
    } else {
      // Séance manuelle : utiliser la matière du professeur
      matiereAEnvoyer = professeurInfo.matiere || selectedCours;
    }

    console.log('=== ENVOI PRÉSENCES ===');
    console.log('Matière qui sera envoyée:', matiereAEnvoyer);
    console.log('seanceId:', seanceId);
    console.log('======================');

    // Enregistrer toutes les présences
    const promises = presences.map(pres => 
      axios.post('https://vmi1977988.contaboserver.net/api2/presences', {
        etudiant: pres.etudiant,
        cours: selectedCours,
        seanceId: seanceId || null,
        dateSession,
        present: pres.statut === 'present',
        absent: pres.statut === 'absent',
        retard: pres.statut === 'retard',
        retardMinutes: pres.statut === 'retard' ? parseInt(pres.retardMinutes) : 0,
        remarque: pres.remarque,
        heure,
        periode,
        matiere: matiereAEnvoyer, // ✅ Utiliser la vraie matière déterminée
        nomProfesseur: professeurInfo.nom || 'Non spécifié'
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    await Promise.all(promises);
    setMessage('success');
    
    // SIMPLE : Recharger après 2 secondes
    setTimeout(() => {
      // Reset complet
      setSelectedCours('');
      setDateSession('');
      setHeureDebut('');
      setHeureFin('');
      setPresences([]);
      setSeanceId('');
      setMessage('');
      setIsSubmitting(false);
      
      // Déclencher le rechargement de la prochaine séance
      window.location.reload();
    }, 2000);
    
  } catch (err) {
    console.error('Erreur:', err);
    setMessage('error');
    setIsSubmitting(false);
  }
};

  // Fonction pour convertir l'heure en format 12h avec AM/PM
  const formatTimeToAMPM = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Fonction pour obtenir le texte de la période
  const getPeriodeText = () => {
    if (!heureDebut) return '';
    const hour = parseInt(heureDebut.split(':')[0]);
    return hour < 12 ? 'Matin' : 'Soir';
  };

  // Fonction pour obtenir l'icône selon la période
  const getPeriodeIcon = () => {
    if (!heureDebut) return <Clock style={styles.labelIcon} />;
    const hour = parseInt(heureDebut.split(':')[0]);
    return hour < 12 ? <Sun style={styles.labelIcon} /> : <Moon style={styles.labelIcon} />;
  };

  // 🆕 Fonction pour obtenir le style du statut
  const getStatusStyle = (statut) => {
    switch (statut) {
      case 'present':
        return {
          backgroundColor: '#dcfce7',
          color: '#166534',
          borderColor: '#bbf7d0'
        };
      case 'absent':
        return {
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderColor: '#fecaca'
        };
      case 'retard':
        return {
          backgroundColor: '#fef3c7',
          color: '#d97706',
          borderColor: '#fcd34d'
        };
      default:
        return {};
    }
  };

  return (
    <div style={styles.container}>
      {/* Header moderne */}
      <Sidebar onLogout={handleLogout} />

      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleSection}>
            <div style={styles.iconContainer}>
            </div>
            <h1 style={styles.title}>Enregistrement de Présence</h1>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={styles.mainContent}>
        <div style={styles.formCard}>
          {/* En-tête de la carte */}
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>
              <BookOpen style={styles.cardIcon} />
              <h2 style={styles.cardTitleText}>Configuration de la session</h2>
            </div>
          </div>

          {/* Formulaire */}
          <div style={styles.formContent}>
            {/* Configuration en deux colonnes */}
            <div style={styles.configurationGrid} data-config-grid>
              {/* Colonne gauche */}
              <div style={styles.leftColumn} data-left-column>
                {/* En-tête colonne gauche */}
                <div style={styles.columnHeader}>
                  <BookOpen style={styles.columnIcon} />
                  <h3 style={styles.columnTitle}>Informations du classe</h3>
                </div>
                
                {/* Sélection du cours */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <BookOpen style={styles.labelIcon} />
                    Sélectionner un classe
                  </label>
                  <select 
                    style={styles.select} 
                    value={selectedCours} 
                    onChange={handleCoursChange} 
                    required
                    className="form-select"
                  >
                    <option value="">Choisir un classe...</option>
                    {cours.map(c => (
                      <option key={c._id} value={c.nom}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Date de session */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Calendar style={styles.labelIcon} />
                    Date de session
                  </label>
                  <input 
                    type="date" 
                    style={styles.input}
                    value={dateSession} 
                    onChange={e => setDateSession(e.target.value)} 
                    required 
                    className="form-input"
                  />
                </div>
              </div>

              {/* Colonne droite */}
              <div style={styles.rightColumn} data-right-column>
                {/* En-tête colonne droite */}
                <div style={styles.columnHeader}>
                  <Clock style={styles.columnIcon} />
                  <h3 style={styles.columnTitle}>Horaire de session</h3>
                </div>
                
                {/* Heure de début */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Clock style={styles.labelIcon} />
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    style={styles.input}
                    required
                    className="form-input"
                  />
                  {/* Affichage automatique AM/PM */}
                  {heureDebut && (
                    <div style={styles.timeDisplay}>
                      <span style={styles.timeDisplayText}>
                        {formatTimeToAMPM(heureDebut)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Heure de fin */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Clock style={styles.labelIcon} />
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    style={styles.input}
                    required
                    className="form-input"
                  />
                  {/* Affichage automatique AM/PM */}
                  {heureFin && (
                    <div style={styles.timeDisplay}>
                      <span style={styles.timeDisplayText}>
                        {formatTimeToAMPM(heureFin)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Période (automatique) */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {getPeriodeIcon()}
                    Période (automatique)
                  </label>
                  <div style={styles.periodeDisplay}>
                    {heureDebut ? (
                      <div style={{
                        ...styles.periodeTag,
                        backgroundColor: periode === 'matin' ? '#dbeafe' : '#fef3c7',
                        color: periode === 'matin' ? '#1e40af' : '#d97706',
                        borderColor: periode === 'matin' ? '#93c5fd' : '#fcd34d'
                      }}>
                        {periode === 'matin' ? 
                          <Sun style={styles.periodeIcon} /> : 
                          <Moon style={styles.periodeIcon} />
                        }
                        {getPeriodeText()}
                      </div>
                    ) : (
                      <div style={{...styles.periodeTag, backgroundColor: '#f3f4f6', color: '#6b7280', borderColor: '#d1d5db'}}>
                        <Clock style={styles.periodeIcon} />
                        Sélectionnez une heure
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 🆕 Message d'instruction si tous les champs ne sont pas remplis */}
            {!areAllFieldsFilled() && (
              <div style={styles.instructionMessage}>
                <div style={styles.instructionContent}>
                  <Clock style={styles.instructionIcon} />
                  <div>
                    <h4 style={styles.instructionTitle}>Complétez la configuration</h4>
                    <p style={styles.instructionText}>
                      Veuillez remplir tous les champs ci-dessus pour voir la liste des étudiants et enregistrer la présence.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des présences - 🆕 Affichée seulement si tous les champs sont remplis */}
            {areAllFieldsFilled() && presences.length > 0 && (
              <div style={styles.presenceSection}>
                <div style={styles.presenceHeader}>
                  <h3 style={styles.presenceTitle}>
                    <Users style={styles.presenceIcon} />
                    Liste des étudiants ({presences.length})
                  </h3>
                </div>
                
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th style={styles.th}>Étudiant</th>
                        <th style={styles.th}>Statut</th>
                        <th style={styles.th}>Temps de retard</th>
                        <th style={styles.th}>Remarque</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presences.map((p, i) => (
                        <tr key={p.etudiant} style={styles.tableRow} className="table-row">
                          <td style={styles.td}>
                            <div style={styles.studentInfo}>
                              <div style={styles.avatar}>
                                <span style={styles.avatarText}>
                                  {p.nom.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div style={styles.studentName}>{p.nom}</div>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <select 
                              style={{
                                ...styles.statusSelect,
                                ...getStatusStyle(p.statut)
                              }}
                              value={p.statut} 
                              onChange={(e) => handlePresenceChange(i, 'statut', e.target.value)}
                            >
                              <option value="present">
                                ✓ Présent
                              </option>
                              <option value="absent">
                                ✗ Absent
                              </option>
                              <option value="retard">
                                ⏰ En retard
                              </option>
                            </select>
                          </td>
                          <td style={styles.td}>
                            {/* 🆕 Champ pour les minutes de retard - visible seulement si "retard" est sélectionné */}
                            {p.statut === 'retard' ? (
                              <div style={styles.retardContainer}>
                                <AlertTriangle style={styles.retardIcon} />
                                <input 
                                  type="number" 
                                  style={styles.retardInput}
                                  value={p.retardMinutes} 
                                  onChange={(e) => handlePresenceChange(i, 'retardMinutes', e.target.value)}
                                  placeholder="Minutes..."
                                  min="1"
                                  max="120"
                                  className="retard-input"
                                />
                                <span style={styles.retardLabel}>min</span>
                              </div>
                            ) : (
                              <span style={styles.notApplicable}>—</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <div style={styles.remarqueContainer}>
                              <MessageSquare style={styles.remarqueIcon} />
                              <input 
                                type="text" 
                                style={styles.remarqueInput}
                                value={p.remarque} 
                                onChange={(e) => handlePresenceChange(i, 'remarque', e.target.value)}
                                placeholder="Ajouter une remarque..."
                                className="remarque-input"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Bouton d'enregistrement */}
                <div style={styles.submitContainer}>
                  <button 
                    type="submit" 
                    style={{
                      ...styles.submitButton,
                      opacity: isSubmitting ? 0.6 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      background: isSubmitting 
                        ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                        : 'linear-gradient(135deg, #3b82f6, #4f46e5)'
                    }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="submit-button"
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.target.style.background = 'linear-gradient(135deg, #1e40af, #3730a3)';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.target.style.background = 'linear-gradient(135deg, #3b82f6, #4f46e5)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #ffffff',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Enregistrement en cours...
                      </>
                    ) : (
                      <>
                        <Save style={styles.buttonIcon} />
                        Enregistrer la présence
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Message de statut */}
            {message === 'all_sessions_completed' ? (
              <div style={{
                ...styles.messageContainer,
                backgroundColor: '#dcfce7',
                borderColor: '#16a34a',
                color: '#166534'
              }}>
                <CheckCircle style={styles.messageIcon} />
                Félicitations ! Toutes vos séances du jour sont terminées. 
                Revenez demain pour de nouvelles séances.
              </div>
            ) : message === 'no_session_today' ? (
              <div style={{
                ...styles.messageContainer,
                backgroundColor: '#fef3c7',
                borderColor: '#d97706',
                color: '#92400e'
              }}>
                <Clock style={styles.messageIcon} />
                Aucune séance programmée aujourd'hui. Vous pouvez saisir manuellement si nécessaire.
              </div>
            ) : message && (
              <div style={{
                ...styles.messageContainer,
                backgroundColor: message === 'success' ? '#dcfce7' : 
                                message === 'partial_success' ? '#fef3c7' :
                                message === 'loading' ? '#eff6ff' : 
                                message === 'retard_error' ? '#fef3c7' : 
                                message === 'validation_error' ? '#fee2e2' :
                                message === 'permission_error' ? '#fef2f2' :
                                message === 'server_error' ? '#fee2e2' :
                                message === 'network_error' ? '#f3f4f6' : '#fee2e2',
                borderColor: message === 'success' ? '#16a34a' : 
                           message === 'partial_success' ? '#d97706' :
                           message === 'loading' ? '#3b82f6' : 
                           message === 'retard_error' ? '#d97706' : 
                           message === 'validation_error' ? '#dc2626' :
                           message === 'permission_error' ? '#dc2626' :
                           message === 'server_error' ? '#dc2626' :
                           message === 'network_error' ? '#6b7280' : '#dc2626',
                color: message === 'success' ? '#166534' : 
                      message === 'partial_success' ? '#d97706' :
                      message === 'loading' ? '#1e40af' : 
                      message === 'retard_error' ? '#d97706' : 
                      message === 'validation_error' ? '#991b1b' :
                      message === 'permission_error' ? '#991b1b' :
                      message === 'server_error' ? '#991b1b' :
                      message === 'network_error' ? '#374151' : '#991b1b'
              }}>
                {message === 'success' ? (
                  <>
                    <CheckCircle style={styles.messageIcon} />
                    Toutes les présences enregistrées avec succès ! Redirection en cours...
                  </>
                ) : message === 'partial_success' ? (
                  <>
                    <AlertTriangle style={styles.messageIcon} />
                    Présences enregistrées avec quelques erreurs. Vérifiez les détails dans la console.
                  </>
                ) : message === 'loading' ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #3b82f6',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Enregistrement en cours, veuillez patienter...
                  </>
                ) : message === 'retard_error' ? (
                  <>
                    <AlertTriangle style={styles.messageIcon} />
                    Erreur: Veuillez saisir le temps de retard pour tous les étudiants marqués "En retard".
                  </>
                ) : message === 'validation_error' ? (
                  <>
                    <XCircle style={styles.messageIcon} />
                    Erreur de validation: Vérifiez que tous les champs requis sont remplis correctement.
                  </>
                ) : message === 'permission_error' ? (
                  <>
                    <XCircle style={styles.messageIcon} />
                    Erreur: Vous n'avez pas l'autorisation d'enregistrer la présence pour ce cours.
                  </>
                ) : message === 'server_error' ? (
                  <>
                    <XCircle style={styles.messageIcon} />
                    Erreur serveur: Problème lors de l'enregistrement. Veuillez réessayer.
                  </>
                ) : message === 'network_error' ? (
                  <>
                    <XCircle style={styles.messageIcon} />
                    Erreur réseau: Vérifiez votre connexion internet et réessayez.
                  </>
                ) : (
                  <>
                    <XCircle style={styles.messageIcon} />
                    Erreur: Veuillez vérifier tous les champs requis et que l'heure de fin soit après l'heure de début.
                  </>
                )}
              </div>
            )}

            {/* ✅ BONUS: Affichage spécial quand toutes les séances sont terminées */}
            {message === 'all_sessions_completed' && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f0fdf4',
                borderRadius: '12px',
                border: '2px solid #bbf7d0',
                marginTop: '20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
                <div style={{ fontSize: '24px', marginBottom: '10px', color: '#166534', fontWeight: '600' }}>
                  Journée terminée !
                </div>
                <div style={{ fontSize: '16px', color: '#166534', marginBottom: '20px' }}>
                  Toutes vos séances du jour ont été complétées avec succès.
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #a7f3d0'
                }}>
                  💡 <strong>Astuce :</strong> Les nouvelles séances apparaîtront automatiquement demain.
                  <br />
                  Si vous devez ajouter une séance exceptionnelle, utilisez la saisie manuelle ci-dessous.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(229, 231, 235, 0.6)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px'
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '24px 0'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #1f2937, #374151)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0'
  },
  mainContent: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '24px'
  },
  formCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '24px 32px'
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  cardIcon: {
    width: '20px',
    height: '20px',
    color: 'black'
  },
  cardTitleText: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'black',
    margin: '0'
  },
  formContent: {
    padding: '32px'
  },
  configurationGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginBottom: '24px'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '16px',
    border: '1px solid rgba(229, 231, 235, 0.6)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    position: 'relative'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '16px',
    border: '1px solid rgba(217, 119, 6, 0.2)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    position: 'relative'
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
  },
  columnIcon: {
    width: '18px',
    height: '18px',
    color: '#4338ca'
  },
  columnTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0'
  },
  formGroup: {
    marginBottom: '24px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },
  labelIcon: {
    width: '16px',
    height: '16px',
    color: '#3b82f6'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#374151',
    outline: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#374151',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  timeDisplay: {
    marginTop: '8px',
    padding: '8px 12px',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(59, 130, 246, 0.2)'
  },
  timeDisplayText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e40af'
  },
  periodeDisplay: {
    display: 'flex',
    alignItems: 'center'
  },
  periodeTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '8px',
    border: '2px solid #93c5fd',
    fontSize: '16px',
    fontWeight: '500'
  },
  periodeIcon: {
    width: '18px',
    height: '18px'
  },
  instructionMessage: {
    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },
  instructionContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  },
  instructionIcon: {
    width: '24px',
    height: '24px',
    color: '#3b82f6',
    marginTop: '2px',
    flexShrink: 0
  },
  instructionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 8px 0'
  },
  instructionText: {
    fontSize: '14px',
    color: '#1e3a8a',
    margin: '0',
    lineHeight: '1.5'
  },
  presenceSection: {
    marginTop: '32px',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '24px'
  },
  presenceHeader: {
    marginBottom: '16px'
  },
  presenceTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0'
  },
  presenceIcon: {
    width: '20px',
    height: '20px',
    color: '#3b82f6'
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    marginBottom: '24px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff'
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
  },
  th: {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #e5e7eb'
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease'
  },
  td: {
    padding: '16px 20px',
    verticalAlign: 'middle'
  },
  studentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
  },
  avatarText: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600'
  },
  studentName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1f2937'
  },
  statusSelect: {
    padding: '8px 16px',
    border: '2px solid',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px'
  },
  // 🆕 Styles pour la gestion des retards
  retardContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '150px'
  },
  retardIcon: {
    width: '16px',
    height: '16px',
    color: '#d97706',
    flexShrink: 0
  },
  retardInput: {
    flex: 1,
    padding: '8px 12px',
    border: '2px solid #fcd34d',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#fefcbf',
    color: '#d97706',
    textAlign: 'center'
  },
  retardLabel: {
    fontSize: '12px',
    color: '#d97706',
    fontWeight: '500'
  },
  notApplicable: {
    color: '#9ca3af',
    fontSize: '18px',
    textAlign: 'center',
    fontWeight: '500'
  },
  remarqueContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '250px'
  },
  remarqueIcon: {
    width: '16px',
    height: '16px',
    color: '#9ca3af',
    flexShrink: 0
  },
  remarqueInput: {
    flex: 1,
    padding: '8px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  submitContainer: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '24px'
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  },
  buttonIcon: {
    width: '20px',
    height: '20px'
  },
  messageContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '2px solid',
    marginTop: '24px',
    fontSize: '16px',
    fontWeight: '500'
  },
  messageIcon: {
    width: '20px',
    height: '20px'
  }
};

export default AjouterPresence;