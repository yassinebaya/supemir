import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Save, 
  SaveAll,
  RefreshCw,
  Play,
  Book,
  Download,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';

const EmploiCreation = () => {
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
  const [emploiDuTemps, setEmploiDuTemps] = useState({});
  const [templates, setTemplates] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [validationStatus, setValidationStatus] = useState({});

  // Charger les données
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-select first course when courses load
  useEffect(() => {
    if (coursList.length > 0 && selectedCours.length === 0) {
      setSelectedCours([coursList[0]._id]);
    }
  }, [coursList.length]);

  // Validate templates when they change
  useEffect(() => {
    validateTemplates();
  }, [emploiDuTemps, selectedCours]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Récupérer les cours
      const resCours = await fetch('http://195.179.229.230:5000/api/cours', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resCours.ok) {
        const coursData = await resCours.json();
        setCoursList(coursData);
      }

      // Récupérer les professeurs
      const resProfs = await fetch('http://195.179.229.230:5000/api/professeurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resProfs.ok) {
        const profsData = await resProfs.json();
        setProfList(profsData.filter(p => p.actif));
      }

      // Récupérer les templates
      const resTemplates = await fetch('http://195.179.229.230:5000/api/seances/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resTemplates.ok) {
        const templatesData = await resTemplates.json();
        setTemplates(templatesData);
        
        if (coursList.length > 0) {
          organiserTemplates(templatesData);
        }
      }

    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setMessage({ type: 'error', text: "Erreur lors du chargement des données" });
    } finally {
      setLoading(false);
    }
  };

  const organiserTemplates = (templatesData) => {
    const emploi = {};
    
    templatesData.forEach(template => {
      let coursObj = null;
      
      if (template.coursId) {
        coursObj = coursList.find(c => c._id === template.coursId);
      }
      if (!coursObj && template.cours) {
        coursObj = coursList.find(c => c.nom === template.cours);
      }
      
      if (!coursObj) return;
      
      const coursId = coursObj._id;
      if (!emploi[coursId]) emploi[coursId] = {};
      
      const jourKey = template.jour || 'Lundi';
      const hDeb = normalizeTime(template.heureDebut);
      const hFin = normalizeTime(template.heureFin);
      const key = `${jourKey}-${hDeb}-${hFin}`;
      
      emploi[coursId][key] = {
        professeur: template.professeur._id || template.professeur,
        matiere: template.matiere,
        salle: template.salle,
        templateId: template._id,
        actif: template.actif !== false
      };
    });
    
    setEmploiDuTemps(emploi);
  };

  const normalizeTime = (t) => {
    if (!t) return '';
    const parts = t.toString().split(':');
    const h = (parts[0] || '00').padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    return `${h}:${m}`;
  };

  const getProfesseursPourCours = (coursId) => {
    const cours = coursList.find(c => c._id === coursId);
    if (!cours) return [];
    
    return profList.filter(prof => {
      if (!prof.actif) return false;
      
      if (prof.coursEnseignes && prof.coursEnseignes.length > 0) {
        return prof.coursEnseignes.some(enseignement => 
          enseignement.nomCours === cours.nom
        );
      }
      
      if (prof.cours && Array.isArray(prof.cours)) {
        return prof.cours.includes(cours.nom);
      }
      
      return false;
    });
  };

  const getMatieresProfesseurPourCours = (professeurId, coursId) => {
    const prof = profList.find(p => p._id === professeurId);
    const cours = coursList.find(c => c._id === coursId);
    
    if (!prof || !cours) return [];
    
    if (prof.coursEnseignes && prof.coursEnseignes.length > 0) {
      const matieresPourCeCours = prof.coursEnseignes.filter(
        enseignement => enseignement.nomCours === cours.nom
      );
      return matieresPourCeCours.map(enseignement => enseignement.matiere);
    }
    
    if (prof.matiere && prof.cours && prof.cours.includes(cours.nom)) {
      return [prof.matiere];
    }
    
    return [];
  };

  const updateCase = (coursId, jour, creneau, field, value) => {
    const key = `${jour}-${creneau.debut}-${creneau.fin}`;
    
    setEmploiDuTemps(prev => {
      const newState = {
        ...prev,
        [coursId]: {
          ...prev[coursId],
          [key]: {
            ...prev[coursId]?.[key],
            [field]: value
          }
        }
      };
      
      if (field === 'professeur' && value) {
        const matieresPossibles = getMatieresProfesseurPourCours(value, coursId);
        
        if (matieresPossibles.length === 1) {
          newState[coursId][key].matiere = matieresPossibles[0];
        } else if (matieresPossibles.length === 0) {
          newState[coursId][key].matiere = '';
        }
      }
      
      return newState;
    });
  };

  const clearCase = (coursId, jour, creneau) => {
    const key = `${jour}-${creneau.debut}-${creneau.fin}`;
    
    setEmploiDuTemps(prev => {
      const newState = { ...prev };
      if (newState[coursId] && newState[coursId][key]) {
        delete newState[coursId][key];
      }
      return newState;
    });
  };

  const validateTemplates = () => {
    const status = {};
    
    selectedCours.forEach(coursId => {
      const coursData = emploiDuTemps[coursId];
      if (!coursData) {
        status[coursId] = { valid: false, errors: ['Aucune séance définie'], seancesCount: 0 };
        return;
      }

      const errors = [];
      const seances = Object.entries(coursData);
      
      if (seances.length === 0) {
        errors.push('Aucune séance définie');
      }

      seances.forEach(([key, seance]) => {
        if (!seance.professeur) {
          errors.push(`Professeur manquant pour ${key.replace('-', ' ')}`);
        }
        if (!seance.matiere) {
          errors.push(`Matière manquante pour ${key.replace('-', ' ')}`);
        }
      });

      status[coursId] = {
        valid: errors.length === 0 && seances.length > 0,
        errors,
        seancesCount: seances.length
      };
    });
    
    setValidationStatus(status);
  };

  const saveAllTemplates = async (coursId) => {
    const coursData = emploiDuTemps[coursId];
    if (!coursData) return;

    const cours = coursList.find(c => c._id === coursId);
    if (!cours) {
      setMessage({ type: 'error', text: 'Cours non trouvé' });
      return;
    }

    const token = localStorage.getItem('token');
    let successCount = 0;
    let errorCount = 0;

    setMessage({ type: 'info', text: 'Sauvegarde des templates en cours...' });

    try {
      const promises = Object.entries(coursData).map(async ([key, seanceData]) => {
        if (!seanceData.professeur) return;

        const [jour, heureDebut, heureFin] = key.split('-');
        
        const payload = {
          jour,
          heureDebut,
          heureFin,
          cours: coursId,
          professeur: seanceData.professeur,
          matiere: seanceData.matiere || '',
          salle: seanceData.salle || '',
          dateDebutTemplate: new Date().toISOString().split('T')[0]
        };

        try {
          let res;
          if (seanceData.templateId) {
            res = await fetch(`http://195.179.229.230:5000/api/seances/${seanceData.templateId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });
          } else {
            res = await fetch('http://195.179.229.230:5000/api/seances/template', {
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
            
            if (!seanceData.templateId) {
              setEmploiDuTemps(prev => ({
                ...prev,
                [coursId]: {
                  ...prev[coursId],
                  [key]: {
                    ...prev[coursId][key],
                    templateId: result.template._id
                  }
                }
              }));
            }
          } else {
            errorCount++;
            console.error('Erreur sauvegarde template:', await res.text());
          }
        } catch (err) {
          errorCount++;
          console.error('Erreur requête template:', err);
        }
      });

      await Promise.all(promises);

      if (errorCount === 0) {
        setMessage({ type: 'success', text: `${successCount} templates sauvegardés avec succès !` });
      } else {
        setMessage({ type: 'warning', text: `${successCount} réussies, ${errorCount} échecs` });
      }
    } catch (err) {
      console.error('Erreur générale sauvegarde:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const genererSeances = async (nbSemaines = 4) => {
    try {
      setLoading(true);
      setMessage({ type: 'info', text: `Génération de ${nbSemaines} semaines en cours...` });
      
      const token = localStorage.getItem('token');
      const res = await fetch(`http://195.179.229.230:5000/api/seances/generer/${nbSemaines}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const result = await res.json();
        setMessage({ 
          type: 'success', 
          text: `${nbSemaines} semaines générées avec succès ! Total: ${result.resultats?.reduce((sum, r) => sum + r.seances, 0) || 'N/A'} séances` 
        });
      } else {
        const errorText = await res.text();
        console.error('Erreur génération:', errorText);
        setMessage({ type: 'error', text: 'Erreur lors de la génération' });
      }
    } catch (err) {
      console.error('Erreur connexion génération:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const toggleCours = (coursId) => {
    setSelectedCours(prev => {
      if (prev.includes(coursId)) {
        return prev.filter(id => id !== coursId);
      } else {
        return [...prev, coursId];
      }
    });
  };

  const downloadTemplates = () => {
    if (selectedCours.length === 0) {
      setMessage({ type: 'error', text: 'Sélectionnez au moins un cours pour télécharger' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    let csvContent = 'Templates d\'Emploi du Temps\n\n';
    
    selectedCours.forEach(coursId => {
      const cours = coursList.find(c => c._id === coursId);
      if (!cours) return;

      csvContent += `\nCOURS: ${cours.nom}\n`;
      csvContent += 'Horaires;';
      jours.forEach(jour => {
        csvContent += `${jour};`;
      });
      csvContent += '\n';

      creneaux.forEach(creneau => {
        csvContent += `${creneau.label};`;
        
        jours.forEach(jour => {
          const key = `${jour}-${creneau.debut}-${creneau.fin}`;
          const seanceData = emploiDuTemps[coursId]?.[key] || {};
          
          const profNom = profList.find(p => p._id === seanceData.professeur)?.nom || '';
          const matiere = seanceData.matiere || '';
          const salle = seanceData.salle || '';
          
          csvContent += `"${profNom}${matiere ? ' - ' + matiere : ''}${salle ? ' (Salle: ' + salle + ')' : ''}";`;
        });
        csvContent += '\n';
      });
      
      csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `templates_emploi_temps.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({ type: 'success', text: 'Templates téléchargés avec succès !' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
    generationControls: {
      backgroundColor: '#f8fafc',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '2px solid #e5e7eb'
    },
    generationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginTop: '15px'
    },
    generationButton: {
      padding: '12px 16px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease'
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
      transition: 'all 0.2s',
      position: 'relative'
    },
    coursCardSelected: {
      backgroundColor: '#dbeafe',
      borderColor: '#3b82f6',
      color: '#1e40af'
    },
    validationBadge: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px'
    },
    validBadge: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    invalidBadge: {
      backgroundColor: '#ef4444',
      color: 'white'
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
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
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
      height: '130px',
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
    clearButton: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px'
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
    validationSummary: {
      backgroundColor: '#f8fafc',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e5e7eb'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div>Chargement des templates...</div>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Récupération des données depuis la base de données
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1f2937' }}>
          <Settings size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Création des Templates d'Emploi du Temps
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#6b7280' }}>
          Créez les modèles d'emploi du temps qui serviront à générer automatiquement les séances réelles
        </p>
      </div>

      {/* Section Génération Automatique */}
      <div style={styles.generationControls}>
        <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>
          <RefreshCw size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Génération Automatique des Séances
        </h3>
        <p style={{ color: '#6b7280', margin: '0 0 15px 0' }}>
          Une fois vos templates créés, générez automatiquement les séances réelles pour les semaines à venir.
        </p>
        
        <div style={styles.generationGrid}>
          <button 
            style={styles.generationButton}
            onClick={() => genererSeances(2)}
            disabled={loading}
          >
            <Play size={16} />
            Générer 2 semaines
          </button>
          <button 
            style={styles.generationButton}
            onClick={() => genererSeances(4)}
            disabled={loading}
          >
            <Play size={16} />
            Générer 4 semaines
          </button>
          <button 
            style={styles.generationButton}
            onClick={() => genererSeances(8)}
            disabled={loading}
          >
            <Play size={16} />
            Générer 8 semaines
          </button>
          <button 
            style={styles.generationButton}
            onClick={() => fetchData()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Actualiser données
          </button>
        </div>
      </div>

      {/* Contrôles principaux */}
      <div style={styles.controls}>
        {/* Sélection des cours */}
        <div style={styles.coursSelection}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
            <Book size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Sélectionner les classes pour créer leurs templates :
          </h3>
          <div style={styles.coursGrid}>
            {coursList.map(cours => {
              const status = validationStatus[cours._id];
              return (
                <div
                  key={cours._id}
                  style={{
                    ...styles.coursCard,
                    ...(selectedCours.includes(cours._id) ? styles.coursCardSelected : {})
                  }}
                  onClick={() => toggleCours(cours._id)}
                >
                  {cours.nom}
                  {status && (
                    <div 
                      style={{
                        ...styles.validationBadge,
                        ...(status.valid ? styles.validBadge : styles.invalidBadge)
                      }}
                      title={status.valid ? `${status.seancesCount} séances définies` : status.errors.join(', ')}
                    >
                      {status.valid ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    </div>
                  )}
                  {status && (
                    <div style={{ fontSize: '10px', marginTop: '4px', color: '#6b7280' }}>
                      {status.seancesCount} séance{status.seancesCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bouton de téléchargement */}
        {selectedCours.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button 
              style={styles.downloadButton} 
              onClick={downloadTemplates}
            >
              <Download size={18} />
              Télécharger les Templates
            </button>
          </div>
        )}
      </div>

      {/* Résumé de validation */}
      {selectedCours.length > 0 && Object.keys(validationStatus).length > 0 && (
        <div style={styles.validationSummary}>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '14px' }}>
            Résumé de validation des templates
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
            {selectedCours.map(coursId => {
              const cours = coursList.find(c => c._id === coursId);
              const status = validationStatus[coursId];
              if (!cours || !status) return null;

              return (
                <div key={coursId} style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: `2px solid ${status.valid ? '#10b981' : '#ef4444'}`,
                  backgroundColor: status.valid ? '#ecfdf5' : '#fef2f2'
                }}>
                  <div style={{ fontWeight: '600', color: status.valid ? '#065f46' : '#991b1b' }}>
                    {cours.nom} {status.valid ? '✓' : '⚠'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {status.seancesCount} séance{status.seancesCount > 1 ? 's' : ''} définie{status.seancesCount > 1 ? 's' : ''}
                  </div>
                  {status.errors.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
                      {status.errors.slice(0, 2).join(', ')}
                      {status.errors.length > 2 && '...'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Tableaux pour chaque cours sélectionné */}
      {selectedCours.map(coursId => {
        const cours = coursList.find(c => c._id === coursId);
        if (!cours) return null;

        return (
          <div key={coursId} style={styles.tableContainer}>
            <div style={styles.tableActions}>
              <div style={styles.courseTitle}>
                <Settings size={18} />
                Template: {cours.nom}
                {validationStatus[coursId] && (
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: validationStatus[coursId].valid ? '#dcfce7' : '#fef2f2',
                    color: validationStatus[coursId].valid ? '#166534' : '#dc2626',
                    marginLeft: '10px'
                  }}>
                    {validationStatus[coursId].seancesCount} séance{validationStatus[coursId].seancesCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <button 
                style={styles.saveAllButton}
                onClick={() => saveAllTemplates(coursId)}
                disabled={!validationStatus[coursId]?.valid}
                onMouseOver={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#059669';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 5px 14px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#10b981';
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                <SaveAll size={16} />
                Sauvegarder Template
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.headerCell}>Horaires</th>
                    {jours.map(jour => (
                      <th key={jour} style={styles.headerCell}>
                        {jour}
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
                        const hasData = seanceData.professeur || seanceData.matiere || seanceData.salle;
                        
                        return (
                          <td key={jour} style={styles.cell}>
                            {hasData && (
                              <button
                                style={styles.clearButton}
                                onClick={() => clearCase(coursId, jour, creneau)}
                                title="Vider cette case"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                            
                            <div style={styles.cellContent}>
                              <select
                                style={styles.select}
                                value={seanceData.professeur || ''}
                                onChange={(e) => updateCase(coursId, jour, creneau, 'professeur', e.target.value)}
                              >
                                <option value="">-- Sélectionner Professeur --</option>
                                {getProfesseursPourCours(coursId).map(prof => (
                                  <option key={prof._id} value={prof._id}>
                                    {prof.nom} {prof.estPermanent ? '(P)' : '(E)'}
                                  </option>
                                ))}
                              </select>

                              {/* Dropdown matière dynamique */}
                              {seanceData.professeur ? (
                                (() => {
                                  const matieresPourCeCours = getMatieresProfesseurPourCours(seanceData.professeur, coursId);
                                  return matieresPourCeCours.length > 0 ? (
                                    <select
                                      style={styles.select}
                                      value={seanceData.matiere || ''}
                                      onChange={(e) => updateCase(coursId, jour, creneau, 'matiere', e.target.value)}
                                    >
                                      <option value="">-- Sélectionner Matière --</option>
                                      {matieresPourCeCours.map(matiere => (
                                        <option key={matiere} value={matiere}>
                                          {matiere}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      style={{
                                        ...styles.input, 
                                        backgroundColor: '#fff',
                                        border: '1px solid #f59e0b',
                                        color: '#92400e'
                                      }}
                                      placeholder="Saisir matière manuellement..."
                                      value={seanceData.matiere || ''}
                                      onChange={(e) => updateCase(coursId, jour, creneau, 'matiere', e.target.value)}
                                    />
                                  );
                                })()
                              ) : (
                                <input
                                  style={{
                                    ...styles.input, 
                                    backgroundColor: '#f3f4f6', 
                                    cursor: 'not-allowed',
                                    color: '#9ca3af'
                                  }}
                                  placeholder="Sélectionnez d'abord un professeur"
                                  value=""
                                  disabled
                                />
                              )}

                              <input
                                style={styles.input}
                                placeholder="Salle (optionnel)..."
                                value={seanceData.salle || ''}
                                onChange={(e) => updateCase(coursId, jour, creneau, 'salle', e.target.value)}
                              />

                              {/* Indicateur de statut */}
                              {hasData && (
                                <div style={{ 
                                  fontSize: '9px', 
                                  textAlign: 'center',
                                  marginTop: '4px',
                                  color: seanceData.professeur && seanceData.matiere ? '#059669' : '#dc2626'
                                }}>
                                  {seanceData.professeur && seanceData.matiere ? (
                                    <span style={{ backgroundColor: '#dcfce7', padding: '1px 4px', borderRadius: '4px' }}>
                                      Complet ✓
                                    </span>
                                  ) : (
                                    <span style={{ backgroundColor: '#fef2f2', padding: '1px 4px', borderRadius: '4px' }}>
                                      Incomplet
                                    </span>
                                  )}
                                </div>
                              )}
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

      {/* États vides */}
      {selectedCours.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚙️</div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            Créer vos Templates d'Emploi du Temps
          </div>
          <div style={{ marginBottom: '20px' }}>
            Sélectionnez une classe ci-dessus pour créer son emploi du temps de base.
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '20px', 
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '2px solid #3b82f6',
            maxWidth: '600px',
            margin: '20px auto'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: '#1e40af' }}>
              Comment utiliser cette page :
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'left' }}>
              <strong>1. Créer des Templates :</strong> Sélectionnez une classe et définissez l'emploi du temps hebdomadaire de base<br/>
              <strong>2. Assigner :</strong> Choisissez professeurs, matières et salles pour chaque créneau<br/>
              <strong>3. Sauvegarder :</strong> Cliquez "Sauvegarder Template" pour valider<br/>
              <strong>4. Générer :</strong> Utilisez "Génération Automatique" pour créer les séances réelles<br/>
              <strong>5. Télécharger :</strong> Exportez vos templates en CSV si nécessaire
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {selectedCours.length > 0 && (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '14px' }}>
            Instructions - Mode Création de Templates
          </h4>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
            • <strong>Templates</strong> : Créez l'emploi du temps de base qui se répétera chaque semaine<br/>
            • <strong>Professeurs</strong> : Seuls les professeurs assignés à cette classe apparaissent dans la liste<br/>
            • <strong>Matières</strong> : Sélectionnées automatiquement selon l'association professeur/classe<br/>
            • <strong>Validation</strong> : Professeur et matière sont obligatoires, salle optionnelle<br/>
            • <strong>Sauvegarde</strong> : Les templates sont enregistrés en base de données<br/>
            • <strong>Génération</strong> : Une fois sauvegardés, utilisez la génération automatique pour créer les séances réelles
          </div>
        </div>
      )}

      {/* Footer avec statistiques */}
      {selectedCours.length > 0 && Object.keys(validationStatus).length > 0 && (
        <div style={{
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '30px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
            Résumé Global
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {Object.values(validationStatus).filter(s => s.valid).length}
              </div>
              <div style={{ fontSize: '12px', color: '#d1d5db' }}>Templates Complets</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                {Object.values(validationStatus).filter(s => !s.valid).length}
              </div>
              <div style={{ fontSize: '12px', color: '#d1d5db' }}>Templates Incomplets</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                {Object.values(validationStatus).reduce((sum, s) => sum + s.seancesCount, 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#d1d5db' }}>Total Séances</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                {profList.length}
              </div>
              <div style={{ fontSize: '12px', color: '#d1d5db' }}>Professeurs Actifs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmploiCreation;