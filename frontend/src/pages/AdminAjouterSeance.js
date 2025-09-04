import React, { useState, useEffect } from 'react';
import { Calendar, Save, Users, Book, ChevronLeft, ChevronRight, Download, SaveAll } from 'lucide-react';
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const EmploiDuTemps = () => {
  const [jours] = useState(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']);
  const [creneaux] = useState([
    { debut: '08:00', fin: '10:00', label: '8h - 10h' },
    { debut: '10:00', fin: '12:00', label: '10h - 12h' },
    { debut: '14:00', fin: '16:00', label: '14h - 16h' },
    { debut: '16:00', fin: '18:00', label: '16h - 18h' }
  ]);
  
  const [coursList, setCoursList] = useState([]);
  const [profList, setProfList] = useState([]);
  const [selectedCours, setSelectedCours] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [emploiDuTemps, setEmploiDuTemps] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  // Fonction pour obtenir les dates de la semaine
  const getWeekDates = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 6; i++) {
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

  // Charger les données depuis votre API
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: "Token d'authentification manquant" });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        let coursData = []; // ✅ Declare coursData at the beginning
        
        // Récupérer les cours depuis votre API
        const resCours = await fetch('http://localhost:5000/api/cours', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resCours.ok) {
          coursData = await resCours.json(); // ✅ Assign to coursData
          setCoursList(coursData);
        }

        // Récupérer les professeurs depuis votre API
        const resProfs = await fetch('http://localhost:5000/api/professeurs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resProfs.ok) {
          const profsData = await resProfs.json();
          setProfList(profsData);
        }

        // Récupérer les séances existantes depuis votre API
        const resSeances = await fetch('http://localhost:5000/api/seances', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resSeances.ok) {
          const seancesData = await resSeances.json();
          
          // ✅ CORRECTION: Organiser les séances par cours ID avec la matière et salle
          const emploi = {};
          seancesData.forEach(seance => {
            // ✅ Find course ID from course name
            const cours = coursData.find(c => c.nom === seance.cours);
            if (!cours) return; // Skip if course not found
            
            const coursId = cours._id;
            if (!emploi[coursId]) emploi[coursId] = {};
            
            const key = `${seance.jour}-${seance.heureDebut}-${seance.heureFin}`;
            emploi[coursId][key] = {
              professeur: seance.professeur?._id || '',
              matiere: seance.matiere || '', // ✅ IMPORTANT: Récupérer la matière depuis la BD
              salle: seance.salle || '', // ✅ NOUVEAU: Récupérer la salle depuis la BD
              seanceId: seance._id
            };
            
            // ✅ DEBUG: Log pour vérifier que la matière et salle sont bien récupérées
            console.log(`Séance récupérée - Cours: ${seance.cours}, Matière: "${seance.matiere}", Salle: "${seance.salle}", Prof: ${seance.professeur?.nom}`);
          });
          
          console.log('Emploi du temps chargé:', emploi); // ✅ Debug log
          setEmploiDuTemps(emploi);
        }

      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setMessage({ type: 'error', text: "Erreur lors du chargement des données depuis la base de données" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Ajouter/retirer un cours sélectionné
  const toggleCours = (coursId) => {
    setSelectedCours(prev => {
      if (prev.includes(coursId)) {
        return prev.filter(id => id !== coursId);
      } else {
        return [...prev, coursId];
      }
    });
  };

  // Mettre à jour une case du tableau
  const updateCase = (coursId, jour, creneau, field, value) => {
    const key = `${jour}-${creneau.debut}-${creneau.fin}`;
    
    // ✅ DEBUG: Log pour voir les changements
    console.log(`Mise à jour - Cours: ${coursId}, Jour: ${jour}, Champ: ${field}, Valeur: "${value}"`);
    
    setEmploiDuTemps(prev => ({
      ...prev,
      [coursId]: {
        ...prev[coursId],
        [key]: {
          ...prev[coursId]?.[key],
          [field]: value
        }
      }
    }));
  };

  // Sauvegarder toutes les séances d'un cours
  const saveAllSeances = async (coursId) => {
    const coursData = emploiDuTemps[coursId];
    if (!coursData) return;

    // ✅ Trouver le cours pour obtenir son nom
    const cours = coursList.find(c => c._id === coursId);
    if (!cours) {
      setMessage({ type: 'error', text: 'Cours non trouvé' });
      return;
    }

    const token = localStorage.getItem('token');
    let successCount = 0;
    let errorCount = 0;

    setMessage({ type: 'info', text: 'Sauvegarde en cours...' });

    try {
      const promises = Object.entries(coursData).map(async ([key, seanceData]) => {
        if (!seanceData.professeur) return; // Ignorer les cases vides

        const [jour, heureDebut, heureFin] = key.split('-');
        
        const payload = {
          jour,
          heureDebut,
          heureFin,
          cours: coursId, // ✅ Send course ID to backend (backend will convert to name)
          professeur: seanceData.professeur,
          matiere: seanceData.matiere || '', // ✅ IMPORTANT: Inclure la matière
          salle: seanceData.salle || '' // ✅ NOUVEAU: Inclure la salle
        };

        // ✅ DEBUG: Log du payload envoyé
        console.log('Payload envoyé:', payload);

        try {
          let res;
          if (seanceData.seanceId) {
            // Modifier séance existante
            res = await fetch(`http://localhost:5000/api/seances/${seanceData.seanceId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });
          } else {
            // Créer nouvelle séance
            res = await fetch('http://localhost:5000/api/seances', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });
          }

          if (res.ok) {
            const result = await res.json();
            successCount++;
            
            // Mettre à jour l'ID si c'est une nouvelle séance
            if (!seanceData.seanceId) {
              setEmploiDuTemps(prev => ({
                ...prev,
                [coursId]: {
                  ...prev[coursId],
                  [key]: {
                    ...prev[coursId][key],
                    seanceId: result.seance._id
                  }
                }
              }));
            }
          } else {
            const errorData = await res.json();
            console.error('Erreur serveur:', errorData);
            errorCount++;
          }
        } catch (err) {
          console.error('Erreur requête:', err);
          errorCount++;
        }
      });

      await Promise.all(promises);

      if (errorCount === 0) {
        setMessage({ type: 'success', text: `✅ ${successCount} séances sauvegardées avec succès !` });
      } else {
        setMessage({ type: 'warning', text: `⚠️ ${successCount} réussies, ${errorCount} échecs` });
      }
    } catch (err) {
      console.error('Erreur générale:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Télécharger le tableau en CSV
  const downloadTable = () => {
    if (selectedCours.length === 0) {
      setMessage({ type: 'error', text: 'Sélectionnez au moins un cours pour télécharger' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    let csvContent = '';
    
    selectedCours.forEach(coursId => {
      const cours = coursList.find(c => c._id === coursId);
      if (!cours) return;

      // En-tête du cours
      csvContent += `\nCOURS: ${cours.nom}\n`;
      csvContent += `Semaine du ${formatDate(weekDates[0])} au ${formatDate(weekDates[5])}\n\n`;
      
      // En-tête du tableau
      csvContent += 'Horaires;';
      jours.forEach((jour, index) => {
        csvContent += `${jour} (${formatDate(weekDates[index])});`;
      });
      csvContent += '\n';

      // Données du tableau
      creneaux.forEach(creneau => {
        csvContent += `${creneau.label};`;
        
        jours.forEach(jour => {
          const key = `${jour}-${creneau.debut}-${creneau.fin}`;
          const seanceData = emploiDuTemps[coursId]?.[key] || {};
          
          const profNom = profList.find(p => p._id === seanceData.professeur)?.nom || '';
          const matiere = seanceData.matiere || '';
          const salle = seanceData.salle || '';
          
          // ✅ NOUVEAU: Inclure la salle dans le CSV
          csvContent += `"${profNom}${matiere ? ' - ' + matiere : ''}${salle ? ' (Salle: ' + salle + ')' : ''}";`;
        });
        csvContent += '\n';
      });
      
      csvContent += '\n';
    });

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `emploi_du_temps_${formatDate(weekDates[0]).replace('/', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({ type: 'success', text: '📁 Tableau téléchargé avec succès !' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Navigation des semaines
  const changeWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const styles = {
    container: {
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',

      maxWidth: '1400px',
      margin: '20px auto',
      padding: '0 20px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      textAlign: 'center'
    },
    controls: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    coursSelection: {
      marginBottom: '20px'
    },
    coursGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '10px',
      marginTop: '10px'
    },
    coursCard: {
      padding: '12px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s'
    },
    coursCardSelected: {
      backgroundColor: '#dbeafe',
      borderColor: '#3b82f6',
      color: '#1e40af'
    },
    weekNavigation: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px'
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
      gap: '5px'
    },
    weekInfo: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151'
    },
    downloadButton: {
      padding: '12px 24px',
      backgroundColor: '#f59e0b',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
    },
    tableContainer: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      marginBottom: '30px'
    },
    tableActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      padding: '15px',
      borderBottom: '2px solid #e5e7eb'
    },
    courseTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      margin: 0
    },
    saveAllButton: {
      padding: '8px 16px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)'
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
      height: '120px', // ✅ Augmenté pour accueillir le champ salle
      width: 'calc(100% / 7)',
      position: 'relative'
    },
    cellContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      height: '100%'
    },
    select: {
      width: '100%',
      padding: '4px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '11px',
      backgroundColor: '#fff'
    },
    input: {
      width: '100%',
      padding: '4px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '11px'
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
    warningMessage: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fbbf24'
    },
    loading: {
      textAlign: 'center',
      padding: '50px',
      fontSize: '16px',
      color: '#6b7280'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div>Chargement de l'emploi du temps...</div>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Récupération des cours, professeurs et séances depuis la base de données
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <Sidebar onLogout={handleLogout} />

      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1f2937' }}>
          <Calendar size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Emploi du Temps - Gestion des Séances
        </h1>
      </div>

      {/* Contrôles */}
      <div style={styles.controls}>
        {/* Sélection des cours */}
        <div style={styles.coursSelection}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
            <Book size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Sélectionnez les classe à afficher:
          </h3>
          <div style={styles.coursGrid}>
            {coursList.map(cours => (
              <div
                key={cours._id}
                style={{
                  ...styles.coursCard,
                  ...(selectedCours.includes(cours._id) ? styles.coursCardSelected : {})
                }}
                onClick={() => toggleCours(cours._id)}
              >
                {cours.nom}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation des semaines */}
        <div style={styles.weekNavigation}>
          <button style={styles.weekButton} onClick={() => changeWeek(-1)}>
            <ChevronLeft size={16} />
            Semaine précédente
          </button>
          <div style={styles.weekInfo}>
            Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[5])}
          </div>
          <button style={styles.weekButton} onClick={() => changeWeek(1)}>
            Semaine suivante
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Bouton de téléchargement */}
        {selectedCours.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button 
              style={styles.downloadButton} 
              onClick={downloadTable}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#d97706';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f59e0b';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
              }}
            >
              <Download size={18} />
              Télécharger tout l'emploi du temps
            </button>
          </div>
        )}
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

      {/* Tableaux pour chaque cours sélectionné */}
      {selectedCours.map(coursId => {
        const cours = coursList.find(c => c._id === coursId);
        if (!cours) return null;

        return (
          <div key={coursId} style={styles.tableContainer}>
            <div style={styles.tableActions}>
              <div style={styles.courseTitle}>
                📚 {cours.nom}
              </div>
              <button 
                style={styles.saveAllButton}
                onClick={() => saveAllSeances(coursId)}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 5px 14px rgba(16, 185, 129, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.3)';
                }}
              >
                <SaveAll size={16} />
                Sauvegarder tout le tableau
              </button>
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
                  {creneaux.map(creneau => (
                    <tr key={`${creneau.debut}-${creneau.fin}`}>
                      <td style={styles.timeCell}>
                        {creneau.label}
                      </td>
                      {jours.map(jour => {
                        const key = `${jour}-${creneau.debut}-${creneau.fin}`;
                        const seanceData = emploiDuTemps[coursId]?.[key] || {};
                        
                        // ✅ DEBUG: Log pour voir les données de la séance
                        console.log(`Rendu cellule - Cours: ${cours.nom}, Jour: ${jour}, Matière: "${seanceData.matiere}", Salle: "${seanceData.salle}"`);
                        
                        return (
                          <td key={jour} style={styles.cell}>
                            <div style={styles.cellContent}>
                              {/* Sélection du professeur */}
                              <select
                                style={styles.select}
                                value={seanceData.professeur || ''}
                                onChange={(e) => updateCase(coursId, jour, creneau, 'professeur', e.target.value)}
                              >
                                <option value="">-- Professeur --</option>
                                {profList.map(prof => (
                                  <option key={prof._id} value={prof._id}>
                                    {prof.nom}
                                  </option>
                                ))}
                              </select>

                              {/* ✅ Champ matière */}
                              <input
                                style={styles.input}
                                placeholder="Matière..."
                                value={seanceData.matiere || ''}
                                onChange={(e) => updateCase(coursId, jour, creneau, 'matiere', e.target.value)}
                                title={`Valeur actuelle: "${seanceData.matiere || 'vide'}"`}
                              />

                              {/* ✅ NOUVEAU: Champ salle */}
                              <input
                                style={styles.input}
                                placeholder="Salle..."
                                value={seanceData.salle || ''}
                                onChange={(e) => updateCase(coursId, jour, creneau, 'salle', e.target.value)}
                                title={`Valeur actuelle: "${seanceData.salle || 'vide'}"`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {selectedCours.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Sélectionnez au moins un classe pour afficher son emploi du temps
        </div>
      )}
    </div>
  );
};

export default EmploiDuTemps;