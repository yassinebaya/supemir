import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Book, Clock, User, Download, MapPin, RefreshCw, BookOpen } from 'lucide-react';
import Sidebaretudiant from '../components/sidebaretudiant.js';


 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const SeancesEtudiant = () => {
  const [seances, setSeances] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // États pour la gestion des créneaux dynamiques
  const [creneauxParCours, setCreneauxParCours] = useState({});
  const [coursUniques, setCoursUniques] = useState([]);

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Fonction pour générer un label de créneau
  const genererLabel = (debut, fin) => {
    if (!debut || !fin) return '';
    const formatTime = (time) => {
      const [hour, min] = time.split(':');
      return `${parseInt(hour)}h${min !== '00' ? min : ''}`;
    };
    return `${formatTime(debut)} - ${formatTime(fin)}`;
  };

  // Fonction pour obtenir les dates de la semaine
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

  // Analyser les séances pour extraire les créneaux par cours ET sauvegarder automatiquement
  const analyserCreneaux = (seancesData) => {
    console.log('DEBUG Frontend - analyserCreneaux appelé avec:', seancesData);
    
    const creneauxMap = {};
    const coursSet = new Set();

    seancesData.forEach(seance => {
      const coursNom = seance.cours || seance.coursId?.nom || 'Cours Inconnu';
      coursSet.add(coursNom);

      if (!creneauxMap[coursNom]) {
        creneauxMap[coursNom] = new Set();
      }

      const creneauKey = `${seance.heureDebut}-${seance.heureFin}`;
      creneauxMap[coursNom].add(creneauKey);
    });

    // Convertir les Sets en Arrays et trier
    const creneauxFinal = {};
    Object.keys(creneauxMap).forEach(cours => {
      creneauxFinal[cours] = Array.from(creneauxMap[cours])
        .map((key, index) => {
          const [debut, fin] = key.split('-');
          return { 
            id: index + 1,
            debut, 
            fin, 
            label: genererLabel(debut, fin) 
          };
        })
        .sort((a, b) => a.debut.localeCompare(b.debut));
    });

    console.log('DEBUG Frontend - Créneaux analysés:', creneauxFinal);
    console.log('DEBUG Frontend - Cours uniques:', Array.from(coursSet));
    
    setCreneauxParCours(creneauxFinal);
    setCoursUniques(Array.from(coursSet).sort());
  };

  const fetchSeances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: "Token d'authentification manquant" });
        setLoading(false);
        return;
      }

      // Récupérer les séances de la semaine
      const d = weekDates[0];
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const lundiSemaine = `${y}-${m}-${day}`;

      console.log('DEBUG Frontend - Récupération pour la semaine:', lundiSemaine);

      const res = await fetch(`http://195.179.229.230:5000/api/seances/etudiant?semaine=${lundiSemaine}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('DEBUG Frontend - Données reçues du backend:', data);
        console.log('DEBUG Frontend - Nombre de séances reçues:', data.length);
        
        // Analyser les données reçues
        data.forEach((seance, index) => {
          console.log(`Frontend ${index + 1}. Cours: "${seance.cours}", Jour: ${seance.jour}, Actif: ${seance.actif}, Type: ${seance.typeSeance}, Heure: ${seance.heureDebut}-${seance.heureFin}`);
        });
        
        // Filtrer côté frontend - Plus permissif pour débugger
        const seancesActives = data.filter(seance => {
          const estActif = seance.actif !== false;
          const typeValide = seance.typeSeance !== 'supprime';
          
          console.log(`Filtrage séance "${seance.cours}": actif=${estActif}, typeValide=${typeValide}`);
          
          return estActif && typeValide;
        });
        
        console.log('DEBUG Frontend - Séances filtrées:', seancesActives);
        console.log('DEBUG Frontend - Nombre de séances après filtrage:', seancesActives.length);
        
        setSeances(seancesActives);
        analyserCreneaux(seancesActives);
        
        if (seancesActives.length > 0) {
          setMessage({ 
            type: 'success', 
            text: `${seancesActives.length} séances chargées pour la semaine` 
          });
        } else {
          setMessage({ 
            type: 'info', 
            text: 'Aucune séance programmée cette semaine' 
          });
        }
      } else {
        const errorText = await res.text();
        console.error('Erreur HTTP:', res.status, errorText);
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

  useEffect(() => {
    fetchSeances();
  }, [currentWeek]);

  // Organiser les séances par cours, jour et créneau
  const organiserSeances = () => {
    console.log('DEBUG Frontend - organiserSeances appelé avec seances:', seances);
    
    const emploi = {};
    
    seances.forEach(seance => {
      const coursNom = seance.cours || seance.coursId?.nom || 'Cours Inconnu';
      const key = `${seance.jour}-${seance.heureDebut}-${seance.heureFin}`;
      
      console.log(`Organisant séance: ${coursNom}, clé: ${key}`);
      
      if (!emploi[coursNom]) {
        emploi[coursNom] = {};
      }
      
      emploi[coursNom][key] = seance;
    });
    
    console.log('DEBUG Frontend - Emploi organisé:', emploi);
    return emploi;
  };

  const emploiOrganise = organiserSeances();

  // Navigation des semaines
  const changeWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  // Télécharger l'emploi du temps en CSV
  const downloadSchedule = () => {
    let csvContent = '';
    csvContent += `Emploi du Temps - Semaine du ${formatDate(weekDates[0])} au ${formatDate(weekDates[6])}\n\n`;
    
    // Données par cours
    Object.keys(emploiOrganise).forEach(coursNom => {
      csvContent += `COURS: ${coursNom}\n`;
      csvContent += 'Jour;Horaire;Matière;Salle;Professeur\n';
      
      Object.entries(emploiOrganise[coursNom]).forEach(([key, seance]) => {
        const [jour, debut, fin] = key.split('-');
        csvContent += `${jour};${debut}-${fin};${seance.matiere || ''};${seance.salle || ''};${seance.professeur?.nom || ''}\n`;
      });
      csvContent += '\n';
    });

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mon_emploi_du_temps_${formatDate(weekDates[0]).replace('/', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({ type: 'success', text: 'Emploi du temps téléchargé avec succès !' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Obtenir les statistiques
  const getStats = () => {
    const coursUniques = [...new Set(seances.map(s => s.cours || s.coursId?.nom).filter(Boolean))];
    const profsUniques = [...new Set(seances.map(s => s.professeur?.nom).filter(Boolean))];
    const matieresUniques = [...new Set(seances.map(s => s.matiere).filter(Boolean))];
    const sallesUniques = [...new Set(seances.map(s => s.salle).filter(Boolean))];
    
    return {
      totalSeances: seances.length,
      totalCours: coursUniques.length,
      totalProfs: profsUniques.length,
      totalMatieres: matieresUniques.length,
      totalSalles: sallesUniques.length
    };
  };

  const stats = getStats();

  // Obtenir la prochaine séance
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
      color: '#3b82f6'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6b7280',
      marginTop: '5px'
    },
    controls: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
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
      backgroundColor: '#3b82f6',
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
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '15px 8px',
      textAlign: 'center',
      fontWeight: '600',
      border: '1px solid #2563eb'
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
      height: '120px',
      width: 'calc(100% / 8)',
      position: 'relative',
      backgroundColor: '#fafafa'
    },
    seanceCard: {
      background: '#ffffff',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '2px solid #e5e7eb',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    },
    coursName: {
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '8px',
      fontSize: '13px',
      lineHeight: '1.2'
    },
    matiereName: {
      fontWeight: '500',
      color: '#3b82f6',
      marginBottom: '6px',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    salleName: {
      fontWeight: '500',
      color: '#f59e0b',
      marginBottom: '6px',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    profName: {
      color: '#6b7280',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: '500',
      marginTop: 'auto',
      paddingTop: '8px',
      borderTop: '1px solid #f3f4f6'
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
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.loading}>
            <div>Chargement de votre emploi du temps...</div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              Récupération de vos séances depuis la base de données
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('DEBUG Frontend - Rendu final:');
  console.log('- seances.length:', seances.length);
  console.log('- coursUniques:', coursUniques);
  console.log('- emploiOrganise:', emploiOrganise);
  console.log('- creneauxParCours:', creneauxParCours);

  return (
    <div style={styles.container}>
                         <Sidebaretudiant onLogout={handleLogout} />
      
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1f2937' }}>
            <Calendar size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            Mon Emploi du Temps
          </h1>
        </div>

        {/* Prochaine séance */}
        {prochaineSeance && (
          <div style={styles.nextSeanceCard}>
            <div style={styles.nextSeanceTitle}>
              <Clock size={20} />
              Prochaine séance
            </div>
            <div style={styles.nextSeanceInfo}>
              <strong>{prochaineSeance.cours || prochaineSeance.coursId?.nom}</strong> - {prochaineSeance.jour} à {prochaineSeance.heureDebut}
              {prochaineSeance.matiere && <span> ({prochaineSeance.matiere})</span>}
              {prochaineSeance.salle && <span> - Salle: {prochaineSeance.salle}</span>}
              <div style={{ marginTop: '5px', fontSize: '14px', color: '#6b7280' }}>
                Professeur: {prochaineSeance.professeur?.nom}
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalSeances}</div>
            <div style={styles.statLabel}>
              <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
              Séances totales
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalCours}</div>
            <div style={styles.statLabel}>
              <Book size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
              Cours différents
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalProfs}</div>
            <div style={styles.statLabel}>
              <User size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
              Professeurs
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalMatieres}</div>
            <div style={styles.statLabel}>
              <BookOpen size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
              Matières
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalSalles}</div>
            <div style={styles.statLabel}>
              <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
              Salles
            </div>
          </div>
        </div>

        {/* Contrôles */}
        <div style={styles.controls}>
          {/* Navigation des semaines */}
          <div style={styles.weekNavigation}>
            <button 
              style={styles.weekButton} 
              onClick={() => changeWeek(-1)}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
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
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
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

          {/* Bouton de téléchargement */}
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
          >
            <Download size={18} />
            Télécharger mon emploi du temps
          </button>
        </div>

        {/* Message */}
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


        {/* Tableau de l'emploi du temps par cours */}
        {seances.length > 0 ? (
          <>
            {coursUniques.map(coursNom => {
              const creneauxCours = creneauxParCours[coursNom] || [];
              const seancesCours = emploiOrganise[coursNom] || {};
              
              return (
                <div key={coursNom} style={styles.courseContainer}>
                  <div style={styles.courseTitle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Book size={18} />
                      {coursNom}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {Object.keys(seancesCours).length} séance(s) cette semaine
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
                        {creneauxCours.map(creneau => {
                          console.log(`Rendu créneau: ${creneau.debut}-${creneau.fin} pour cours ${coursNom}`);
                          return (
                            <tr key={`${creneau.debut}-${creneau.fin}`}>
                              <td style={styles.timeCell}>
                                {creneau.label}
                              </td>
                              {jours.map(jour => {
                                const key = `${jour}-${creneau.debut}-${creneau.fin}`;
                                const seance = seancesCours[key];
                                
                                console.log(`Cherche séance pour clé: ${key}, trouvé:`, !!seance);
                                
                                return (
                                  <td key={jour} style={styles.cell}>
                                    {seance ? (
                                      <div 
                                        style={styles.seanceCard}
                                        onMouseEnter={(e) => {
                                          e.target.style.transform = 'translateY(-2px)';
                                          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.transform = 'translateY(0)';
                                          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                        }}
                                      >
                                        <div>
                                          <div style={styles.coursName}>
                                            {seance.cours || seance.coursId?.nom || 'Cours'}
                                          </div>
                                          {seance.matiere && (
                                            <div style={styles.matiereName}>
                                              <BookOpen size={10} />
                                              {seance.matiere}
                                            </div>
                                          )}
                                          {seance.salle && (
                                            <div style={styles.salleName}>
                                              <MapPin size={10} />
                                              {seance.salle}
                                            </div>
                                          )}
                                          {seance.typeSeance === 'rattrapage' && (
                                            <div style={{
                                              fontSize: '9px',
                                              backgroundColor: '#fef3c7',
                                              color: '#92400e',
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              marginTop: '4px',
                                              fontWeight: '600',
                                              textTransform: 'uppercase',
                                              textAlign: 'center',
                                              border: '1px solid #fbbf24'
                                            }}>
                                              RATTRAPAGE
                                            </div>
                                          )}
                                          
                                          {seance.typeSeance === 'exception' && (
                                            <div style={{
                                              fontSize: '9px',
                                              backgroundColor: '#dbeafe',
                                              color: '#1e40af',
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              marginTop: '4px',
                                              fontWeight: '600',
                                              textTransform: 'uppercase',
                                              textAlign: 'center',
                                              border: '1px solid #93c5fd'
                                            }}>
                                              EXCEPTION
                                            </div>
                                          )}
                                          
                                          {seance.actif === false && (
                                            <div style={{
                                              fontSize: '9px',
                                              backgroundColor: '#fee2e2',
                                              color: '#dc2626',
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              marginTop: '4px',
                                              fontWeight: '600',
                                              textTransform: 'uppercase',
                                              textAlign: 'center',
                                              border: '1px solid #fecaca'
                                            }}>
                                              ANNULE
                                            </div>
                                          )}
                                        </div>
                                        <div style={styles.profName}>
                                          <User size={10} />
                                          {seance.professeur?.nom || 'Professeur'}
                                        </div>
                                      </div>
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📚</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>Aucune séance programmée</div>
            <div>Votre emploi du temps sera affiché ici une fois que vos cours seront programmés.</div>
          </div>
        )}

        {/* Instructions en bas de page */}
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
            • Vos horaires s'adaptent automatiquement selon les cours programmés<br/>
            • Les créneaux sont organisés par cours pour une meilleure lisibilité<br/>
            • Utilisez la navigation pour consulter les autres semaines<br/>
            • Téléchargez votre emploi du temps pour une consultation hors ligne<br/>
            • Les séances de rattrapage et exceptions sont clairement identifiées
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeancesEtudiant;