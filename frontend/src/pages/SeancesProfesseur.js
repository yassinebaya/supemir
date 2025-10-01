import React, { useEffect, useState } from 'react';
import Sidebaretudiant from '../components/SidebarProf';

import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Book, 
  Clock, 
  Users, 
  Download, 
  GraduationCap, 
  MapPin, 
  BookOpen,
  DollarSign,
  TrendingUp,
  BarChart3,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const SeancesProfesseur = () => {
  const [seances, setSeances] = useState([]);
  const [professeurInfo, setProfesseurInfo] = useState(null);
  const [statistiques, setStatistiques] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [viewMode, setViewMode] = useState('emploi');
  const [selectedPeriod, setSelectedPeriod] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear()
  });

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const estUnId = (str) => {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{24}$/i.test(str);
  };

  const obtenirNomCours = (seance) => {
    if (seance.coursId?.nom) {
      return seance.coursId.nom;
    }
    if (seance.cours && !estUnId(seance.cours)) {
      return seance.cours;
    }
    return 'Cours Inconnu';
  };

  const calculerDureeSeance = (heureDebut, heureFin) => {
    const [heureD, minuteD] = heureDebut.split(':').map(Number);
    const [heureF, minuteF] = heureFin.split(':').map(Number);
    
    const minutesDebut = heureD * 60 + minuteD;
    const minutesFin = heureF * 60 + minuteF;
    
    return (minutesFin - minutesDebut) / 60;
  };

  const genererLabel = (debut, fin) => {
    if (!debut || !fin) return '';
    const formatTime = (time) => {
      const [hour, min] = time.split(':');
      return `${parseInt(hour)}h${min !== '00' ? min : ''}`;
    };
    return `${formatTime(debut)} - ${formatTime(fin)}`;
  };

  const getWeekDates = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      weekDates.push(currentDate);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(currentWeek);
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  useEffect(() => {
    fetchSeances();
    fetchProfesseurInfo();
  }, [currentWeek]);

  useEffect(() => {
    if (viewMode === 'statistiques') {
      fetchStatistiques();
    }
  }, [viewMode, selectedPeriod]);

  const fetchSeances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: "Token d'authentification manquant" });
        setLoading(false);
        return;
      }

      const d = weekDates[0];
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const lundiSemaine = `${y}-${m}-${day}`;

      const res = await fetch(`http://195.179.229.230:5000/api/seances/professeur/semaine/${lundiSemaine}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSeances(data);
        
        if (data.length > 0) {
          setMessage({ 
            type: 'success', 
            text: `${data.length} séances chargées pour la semaine` 
          });
        } else {
          setMessage({ 
            type: 'info', 
            text: 'Aucune séance programmée cette semaine' 
          });
        }
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement des séances' });
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des séances', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const fetchProfesseurInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/professeurs/mon-profil', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setProfesseurInfo(data);
      }
    } catch (err) {
      console.error('Erreur récupération profil:', err);
    }
  };

  const fetchStatistiques = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('mois', selectedPeriod.mois);
      params.append('annee', selectedPeriod.annee);
      
      const res = await fetch(
        `http://195.179.229.230:5000/api/professeurs/mon-rapport?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.ok) {
        const data = await res.json();
        setStatistiques(data);
      }
    } catch (err) {
      console.error('Erreur statistiques:', err);
    }
  };

  const changeWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  // Fonction pour obtenir les statistiques avec fusion des doublons côté front
  const getStatsRapides = () => {
    // Fusionner les doublons pour les calculs
    const creneauxUniques = {};
    const coursSet = new Set();
    
    seances.forEach(seance => {
      const key = `${seance.jour}-${seance.heureDebut}-${seance.heureFin}`;
      
      if (!creneauxUniques[key]) {
        creneauxUniques[key] = seance;
      }
      
      const coursNom = obtenirNomCours(seance);
      if (coursNom !== 'Cours Inconnu') {
        coursSet.add(coursNom);
      }
    });
    
    const seancesUniques = Object.values(creneauxUniques);
    
    const matieresUniques = [...new Set(seancesUniques.map(s => s.matiere).filter(Boolean))];
    const sallesUniques = [...new Set(seancesUniques.map(s => s.salle).filter(Boolean))];
    
    const totalHeures = seancesUniques.reduce((total, seance) => {
      return total + calculerDureeSeance(seance.heureDebut, seance.heureFin);
    }, 0);

    const totalMontant = professeurInfo && !professeurInfo.estPermanent && professeurInfo.tarifHoraire
      ? totalHeures * professeurInfo.tarifHoraire
      : 0;
    
    return {
      totalSeances: seancesUniques.length,
      totalCours: coursSet.size,
      totalMatieres: matieresUniques.length,
      totalSalles: sallesUniques.length,
      totalHeures: Math.round(totalHeures * 100) / 100,
      totalMontant: Math.round(totalMontant * 100) / 100
    };
  };

  const stats = getStatsRapides();

  const getNextSeance = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('fr-FR', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    const jourMapping = {
      'lundi': 'Lundi',
      'mardi': 'Mardi',
      'mercredi': 'Mercredi',
      'jeudi': 'Jeudi',
      'vendredi': 'Vendredi',
      'samedi': 'Samedi',
      'dimanche': 'Dimanche'
    };
    
    const jourActuel = jourMapping[currentDay.toLowerCase()];
    
    const seancesAujourdhui = seances.filter(s => 
      s.jour === jourActuel && s.heureDebut > currentTime
    ).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    
    if (seancesAujourdhui.length > 0) {
      return seancesAujourdhui[0];
    }
    
    const ordreDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const indexActuel = ordreDays.indexOf(jourActuel);
    
    for (let i = indexActuel + 1; i < ordreDays.length; i++) {
      const seancesJour = seances.filter(s => s.jour === ordreDays[i])
        .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
      if (seancesJour.length > 0) {
        return seancesJour[0];
      }
    }
    
    return null;
  };

  const prochaineSeance = getNextSeance();

  const downloadSchedule = () => {
    let csvContent = '';
    csvContent += `Emploi du Temps Professeur - ${professeurInfo?.nom || 'Professeur'}\n`;
    csvContent += `Semaine du ${formatDate(weekDates[0])} au ${formatDate(weekDates[6])}\n\n`;
    
    if (professeurInfo) {
      csvContent += `INFORMATIONS PROFESSEUR\n`;
      csvContent += `Nom: ${professeurInfo.nom}\n`;
      csvContent += `Type: ${professeurInfo.estPermanent ? 'Permanent' : 'Entrepreneur'}\n`;
      if (!professeurInfo.estPermanent && professeurInfo.tarifHoraire) {
        csvContent += `Tarif horaire: ${professeurInfo.tarifHoraire} DH/h\n`;
      }
      csvContent += `\n`;
    }

    csvContent += `STATISTIQUES SEMAINE\n`;
    csvContent += `Total séances: ${stats.totalSeances}\n`;
    csvContent += `Total heures: ${stats.totalHeures}h\n`;
    if (stats.totalMontant > 0) {
      csvContent += `Total montant: ${stats.totalMontant.toFixed(2)} DH\n`;
    }
    csvContent += `\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mes_cours_${formatDate(weekDates[0]).replace('/', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({ type: 'success', text: 'Emploi du temps téléchargé avec succès !' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
    },
    content: {
      flexGrow: 1,
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      textAlign: 'center'
    },
    modeSelector: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      marginBottom: '20px'
    },
    modeButton: {
      padding: '10px 20px',
      border: '2px solid #059669',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    modeButtonActive: {
      backgroundColor: '#059669',
      color: 'white'
    },
    modeButtonInactive: {
      backgroundColor: 'white',
      color: '#059669'
    },
    professeurInfo: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      border: '2px solid #059669'
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statCard: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#059669'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6b7280',
      marginTop: '5px'
    },
    nextSeanceCard: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      border: '2px solid #10b981'
    },
    nextSeanceTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#059669',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    nextSeanceInfo: {
      fontSize: '1rem',
      color: '#374151'
    },
    controls: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    controlRow: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      marginBottom: '15px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    },
    weekNavigation: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '20px'
    },
    weekButton: {
      padding: '8px 12px',
      backgroundColor: '#059669',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      transition: 'all 0.2s'
    },
    weekInfo: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151'
    },
    downloadButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: '#f59e0b',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      margin: '0 auto',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    refreshButton: {
      padding: '8px 16px',
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px'
    },
    courseContainer: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      marginBottom: '20px'
    },
    courseTitle: {
      backgroundColor: '#f8fafc',
      padding: '15px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '2px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    headerCell: {
      backgroundColor: '#059669',
      color: 'white',
      padding: '15px 8px',
      textAlign: 'center',
      fontWeight: '600',
      border: '1px solid #047857'
    },
    timeCell: {
      backgroundColor: '#f8fafc',
      padding: '15px 10px',
      textAlign: 'center',
      fontWeight: '600',
      color: '#374151',
      border: '1px solid #e5e7eb',
      minWidth: '100px'
    },
    cell: {
      border: '1px solid #e5e7eb',
      padding: '8px',
      verticalAlign: 'top',
      minHeight: '130px',
      width: 'calc(100% / 7)',
      position: 'relative'
    },
    seanceCard: {
      backgroundColor: '#d1fae5',
      borderRadius: '4px',
      padding: '6px',
      fontSize: '11px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '1px solid #10b981',
      marginBottom: '4px'
    },
    coursName: {
      fontWeight: '600',
      color: '#065f46',
      marginBottom: '2px',
      fontSize: '12px'
    },
    matiereName: {
      fontWeight: '500',
      color: '#7c3aed',
      marginBottom: '2px',
      fontSize: '10px'
    },
    salleName: {
      fontWeight: '500',
      color: '#dc2626',
      marginBottom: '2px',
      fontSize: '10px'
    },
    dureeInfo: {
      fontWeight: '500',
      color: '#0ea5e9',
      fontSize: '10px',
      marginBottom: '2px'
    },
    montantInfo: {
      fontWeight: '600',
      color: '#dc2626',
      fontSize: '10px'
    },
    multiCoursBadge: {
      fontSize: '8px',
      backgroundColor: '#fbbf24',
      color: '#92400e',
      padding: '2px 4px',
      borderRadius: '3px',
      marginTop: '2px',
      textAlign: 'center',
      fontWeight: '600'
    },
    message: {
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    successMessage: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0'
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    },
    infoMessage: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      border: '1px solid #93c5fd'
    },
    loading: {
      textAlign: 'center',
      padding: '50px',
      fontSize: '16px',
      color: '#6b7280'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280'
    },
    statistiquesContainer: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.loading}>
            <div>Chargement de votre emploi du temps...</div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              Récupération de vos cours depuis la base de données
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebaretudiant onLogout={handleLogout} />

      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1f2937' }}>
            <GraduationCap size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            Mon Dashboard Professeur
          </h1>
        </div>

        <div style={styles.modeSelector}>
          <button
            style={{
              ...styles.modeButton,
              ...(viewMode === 'emploi' ? styles.modeButtonActive : styles.modeButtonInactive)
            }}
            onClick={() => setViewMode('emploi')}
          >
            <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            Emploi du Temps
          </button>
          <button
            style={{
              ...styles.modeButton,
              ...(viewMode === 'statistiques' ? styles.modeButtonActive : styles.modeButtonInactive)
            }}
            onClick={() => setViewMode('statistiques')}
          >
            <BarChart3 size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            Mes Statistiques
          </button>
        </div>

        {professeurInfo && (
          <div style={styles.professeurInfo}>
            <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
              {professeurInfo.nom}
            </h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: professeurInfo.estPermanent ? '#d1fae5' : '#fef3c7',
                color: professeurInfo.estPermanent ? '#065f46' : '#92400e',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {professeurInfo.estPermanent ? 'Professeur Permanent' : 'Entrepreneur'}
              </span>
              {!professeurInfo.estPermanent && professeurInfo.tarifHoraire && (
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Tarif: {professeurInfo.tarifHoraire} DH/heure
                </span>
              )}
            </div>
          </div>
        )}

        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'error' ? styles.errorMessage : 
                message.type === 'info' ? styles.infoMessage : 
                styles.successMessage)
          }}>
            {message.text}
          </div>
        )}

        {viewMode === 'emploi' && (
          <>
            {prochaineSeance && (
              <div style={styles.nextSeanceCard}>
                <div style={styles.nextSeanceTitle}>
                  <Clock size={20} />
                  Prochaine séance
                </div>
                <div style={styles.nextSeanceInfo}>
                  <strong>{obtenirNomCours(prochaineSeance)}</strong> - {prochaineSeance.jour} à {prochaineSeance.heureDebut}
                  {prochaineSeance.matiere && <span> ({prochaineSeance.matiere})</span>}
                  {prochaineSeance.salle && <span> - Salle: {prochaineSeance.salle}</span>}
                  <div style={{ marginTop: '5px', fontSize: '14px', color: '#6b7280' }}>
                    Durée: {calculerDureeSeance(prochaineSeance.heureDebut, prochaineSeance.heureFin)}h
                    {professeurInfo && !professeurInfo.estPermanent && professeurInfo.tarifHoraire && (
                      <span> - Montant: {(calculerDureeSeance(prochaineSeance.heureDebut, prochaineSeance.heureFin) * professeurInfo.tarifHoraire).toFixed(2)} DH</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={styles.statsContainer}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{stats.totalSeances}</div>
                <div style={styles.statLabel}>
                  Séances par semaine
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{stats.totalHeures}h</div>
                <div style={styles.statLabel}>
                  Heures d'enseignement
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{stats.totalCours}</div>
                <div style={styles.statLabel}>
                  Cours différents
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{stats.totalMatieres}</div>
                <div style={styles.statLabel}>
                  Matières
                </div>
              </div>
              {stats.totalMontant > 0 && (
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{stats.totalMontant} DH</div>
                  <div style={styles.statLabel}>
                    Revenus semaine
                  </div>
                </div>
              )}
            </div>

            <div style={styles.controls}>
              <div style={styles.weekNavigation}>
                <button 
                  style={styles.weekButton} 
                  onClick={() => changeWeek(-1)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
                >
                  <ChevronLeft size={16} />
                  Semaine précédente
                </button>
                <div style={styles.weekInfo}>
                  Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[6])}
                </div>
                <button 
                  style={styles.weekButton} 
                  onClick={() => changeWeek(1)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
                >
                  Semaine suivante
                  <ChevronRight size={16} />
                </button>
                <button 
                  style={styles.refreshButton}
                  onClick={fetchSeances}
                >
                  <RefreshCw size={14} />
                  Actualiser
                </button>
              </div>

              <button 
                style={styles.downloadButton}
                onClick={downloadSchedule}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#d97706';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#f59e0b';
                  e.target.style.transform = 'translateY(0px)';
                }}
              ><Download size={18} />
                Télécharger mon emploi du temps
              </button>
            </div>

            {seances.length > 0 ? (
              <>
                {/* TABLEAU UNIQUE AVEC TOUS LES COURS */}
                <div style={styles.courseContainer}>
                  <div style={styles.courseTitle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Book size={18} />
                      Emploi du Temps Complet
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {seances.length} séance(s) cette semaine
                    </div>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.headerCell}>Horaires</th>
                          {jours.map((jour, index) => (
                            <th key={jour} style={styles.headerCell}>
                              {jour}<br />
                              <small>{formatDate(weekDates[index])}</small>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Obtenir tous les créneaux horaires uniques
                          const creneauxUniques = new Set();
                          seances.forEach(s => {
                            creneauxUniques.add(`${s.heureDebut}-${s.heureFin}`);
                          });
                          
                          const creneauxArray = Array.from(creneauxUniques)
                            .map(c => {
                              const [debut, fin] = c.split('-');
                              return { debut, fin, label: genererLabel(debut, fin) };
                            })
                            .sort((a, b) => a.debut.localeCompare(b.debut));
                          
                          return creneauxArray.map(creneau => (
                            <tr key={`${creneau.debut}-${creneau.fin}`}>
                              <td style={styles.timeCell}>
                                {creneau.label}
                              </td>
                              {jours.map(jour => {
                                // Trouver TOUTES les séances pour ce jour et ce créneau
                                const seancesDuCreneau = seances.filter(s => 
                                  s.jour === jour && 
                                  s.heureDebut === creneau.debut && 
                                  s.heureFin === creneau.fin
                                );
                                
                                return (
                                  <td key={jour} style={styles.cell}>
                                    {seancesDuCreneau.length > 0 ? (
                                      <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '4px',
                                        height: '100%'
                                      }}>
                                        {seancesDuCreneau.map((seance, idx) => (
                                          <div 
                                            key={idx} 
                                            style={{
                                              ...styles.seanceCard,
                                              backgroundColor: idx === 0 ? '#d1fae5' : '#e0e7ff',
                                              borderColor: idx === 0 ? '#10b981' : '#6366f1'
                                            }}
                                          >
                                            <div>
                                              <div style={{
                                                ...styles.coursName,
                                                color: idx === 0 ? '#065f46' : '#3730a3'
                                              }}>
                                                {obtenirNomCours(seance)}
                                              </div>
                                              {seance.matiere && (
                                                <div style={styles.matiereName}>
                                                  Matière: {seance.matiere}
                                                </div>
                                              )}
                                              {seance.salle && (
                                                <div style={styles.salleName}>
                                                  Salle: {seance.salle}
                                                </div>
                                              )}
                                              {idx === 0 && (
                                                <>
                                                  <div style={styles.dureeInfo}>
                                                    Durée: {seance.dureeHeures}h
                                                  </div>
                                                  {seance.montant > 0 && (
                                                    <div style={styles.montantInfo}>
                                                      Montant: {seance.montant.toFixed(2)} DH
                                                    </div>
                                                  )}
                                                </>
                                              )}
                                              {seancesDuCreneau.length > 1 && idx === 0 && (
                                                <div style={styles.multiCoursBadge}>
                                                  {seancesDuCreneau.length} COURS SIMULTANÉS
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>👨‍🏫</div>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>Aucun cours programmé</div>
                <div>Vos cours apparaîtront ici une fois qu'ils seront assignés par l'administration.</div>
              </div>
            )}
          </>
        )}

        {viewMode === 'statistiques' && (
          <>
            <div style={styles.controls}>
              <div style={styles.controlRow}>
                <select
                  style={styles.select}
                  value={selectedPeriod.mois}
                  onChange={(e) => setSelectedPeriod(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
                >
                  {mois.map((m, index) => (
                    <option key={index} value={index + 1}>{m}</option>
                  ))}
                </select>

                <select
                  style={styles.select}
                  value={selectedPeriod.annee}
                  onChange={(e) => setSelectedPeriod(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
                >
                  {[2023, 2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <button
                  style={styles.weekButton}
                  onClick={fetchStatistiques}
                >
                  <TrendingUp size={16} />
                  Actualiser
                </button>
              </div>
            </div>

            {statistiques && (
              <div style={styles.statistiquesContainer}>
                <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>
                  Mes Statistiques - {mois[selectedPeriod.mois - 1]} {selectedPeriod.annee}
                </h3>

                <div style={styles.statsContainer}>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistiques.statistiques.totalHeures}h</div>
                    <div style={styles.statLabel}>
                      Total Heures
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistiques.statistiques.totalSeances}</div>
                    <div style={styles.statLabel}>
                      Séances
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistiques.statistiques.coursUniques}</div>
                    <div style={styles.statLabel}>
                      Cours Différents
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistiques.statistiques.moyenneHeuresParJour}h</div>
                    <div style={styles.statLabel}>
                      Moyenne/Jour
                    </div>
                  </div>
                  {statistiques.statistiques.totalAPayer > 0 && (
                    <div style={styles.statCard}>
                      <div style={styles.statNumber}>{statistiques.statistiques.totalAPayer.toFixed(2)} DH</div>
                      <div style={styles.statLabel}>
                        Total Gagné
                      </div>
                    </div>
                  )}
                </div>

                {Object.keys(statistiques.statistiques.repartitionJours).length > 0 && (
                  <div style={{ marginTop: '30px' }}>
                    <h4 style={{ margin: '0 0 20px 0', color: '#374151' }}>
                      Répartition des Heures par Jour
                    </h4>
                    {Object.entries(statistiques.statistiques.repartitionJours).map(([jour, heures]) => {
                      const maxHeures = Math.max(...Object.values(statistiques.statistiques.repartitionJours));
                      const percentage = maxHeures > 0 ? (heures / maxHeures) * 100 : 0;
                      
                      return (
                        <div key={jour} style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            width: '100px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>{jour}</div>
                          <div style={{
                            flex: 1,
                            height: '20px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            marginRight: '10px'
                          }}>
                            <div style={{
                              height: '100%',
                              backgroundColor: '#059669',
                              borderRadius: '10px',
                              transition: 'width 0.3s ease',
                              width: `${percentage}%`
                            }}></div>
                          </div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#374151'
                          }}>{heures}h</div>
                        </div>
                      );
                    })}
                  </div>
                )}

           {statistiques.seances && statistiques.seances.length > 0 && (
  <div style={{ marginTop: '30px' }}>
    <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
      Détail de Mes Séances
    </h4>
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.headerCell}>Date</th>
            <th style={styles.headerCell}>Jour</th>
            <th style={styles.headerCell}>Horaire</th>
            <th style={styles.headerCell}>Cours</th>
            <th style={styles.headerCell}>Matière</th>
            <th style={styles.headerCell}>Salle</th>
            <th style={styles.headerCell}>Durée</th>
            {professeurInfo && !professeurInfo.estPermanent && (
              <th style={styles.headerCell}>Montant</th>
            )}
          </tr>
        </thead>
        <tbody>
          {(() => {
            // Regrouper les séances par date + horaire
            const seancesGroupees = {};
            
            statistiques.seances.forEach(seance => {
              const dateStr = seance.dateSeance ? new Date(seance.dateSeance).toLocaleDateString('fr-FR') : '-';
              const key = `${dateStr}-${seance.jour}-${seance.heureDebut}-${seance.heureFin}`;
              
              if (!seancesGroupees[key]) {
                seancesGroupees[key] = {
                  dateSeance: seance.dateSeance,
                  jour: seance.jour,
                  heureDebut: seance.heureDebut,
                  heureFin: seance.heureFin,
                  cours: [],
                  matieres: [],
                  salles: [],
                  dureeHeures: seance.dureeHeures
                };
              }
              
              const coursNom = obtenirNomCours(seance);
              if (coursNom && !seancesGroupees[key].cours.includes(coursNom)) {
                seancesGroupees[key].cours.push(coursNom);
              }
              
              if (seance.matiere && !seancesGroupees[key].matieres.includes(seance.matiere)) {
                seancesGroupees[key].matieres.push(seance.matiere);
              }
              
              if (seance.salle && !seancesGroupees[key].salles.includes(seance.salle)) {
                seancesGroupees[key].salles.push(seance.salle);
              }
            });
            
            return Object.values(seancesGroupees).map((groupe, index) => (
              <tr key={index}>
                <td style={styles.timeCell}>
                  {groupe.dateSeance ? new Date(groupe.dateSeance).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td style={styles.timeCell}>{groupe.jour}</td>
                <td style={styles.timeCell}>{groupe.heureDebut} - {groupe.heureFin}</td>
                <td style={styles.timeCell}>
                  {groupe.cours.join(' + ')}
                </td>
                <td style={styles.timeCell}>
                  {groupe.matieres.join(' / ') || '-'}
                </td>
                <td style={styles.timeCell}>
                  {groupe.salles.join(' / ') || '-'}
                </td>
                <td style={styles.timeCell}>
                  {calculerDureeSeance(groupe.heureDebut, groupe.heureFin)}h
                </td>
                {professeurInfo && !professeurInfo.estPermanent && (
                  <td style={styles.timeCell}>
                    {(calculerDureeSeance(groupe.heureDebut, groupe.heureFin) * professeurInfo.tarifHoraire).toFixed(2)} DH
                  </td>
                )}
              </tr>
            ));
          })()}
        </tbody>
      </table>
    </div>
  </div>
)}
              </div>
            )}

            {!statistiques && (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>Aucune donnée disponible</div>
                <div>Sélectionnez une période pour voir vos statistiques.</div>
              </div>
            )}
          </>
        )}

        <div style={{
          backgroundColor: '#f8fafc',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '14px' }}>
            📋 Informations sur votre emploi du temps
          </h4>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
            • Vos horaires sont définis dynamiquement selon les cours assignés<br/>
            • Les créneaux s'adaptent automatiquement à votre planning<br/>
            • Utilisez les statistiques pour analyser votre charge de travail<br/>
            • Téléchargez votre emploi du temps pour une consultation hors ligne<br/>
            • Les montants affichés sont calculés selon votre tarif horaire (entrepreneurs uniquement)<br/>
            • Les cours simultanés sont affichés dans la même case avec des couleurs différentes
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeancesProfesseur;