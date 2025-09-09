import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Save,
  X
} from 'lucide-react';
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح
    const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

const EmploiConsultation = () => {
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
  const [seancesReelles, setSeancesReelles] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [emploiDuTemps, setEmploiDuTemps] = useState({});

  // Nouveaux états pour la copie de semaine
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
  const [semainesDisponibles, setSemainesDisponibles] = useState([]);
  const [semaineSource, setSemaineSource] = useState('');
  const [semaineDestination, setSemaineDestination] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);

  // États pour la copie rapide
  const [showSelectWeek, setShowSelectWeek] = useState(false);
  const [semaineSelectionnee, setSemaineSelectionnee] = useState('');

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

  // Charger les données
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (coursList.length > 0 && selectedCours.length === 0) {
      setSelectedCours([coursList[0]._id]);
    }
  }, [coursList.length]);

  useEffect(() => {
    if (coursList.length > 0) {
      fetchSeancesReelles();
    }
  }, [currentWeek, coursList.length]);

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
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setMessage({ type: 'error', text: "Erreur lors du chargement des données" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSeancesReelles = async () => {
    try {
      const token = localStorage.getItem('token');
      const d = weekDates[0];
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      const lundiSemaine = `${y}-${m}-${day}`;
      
      console.log('🔍 Récupération séances pour la semaine du:', lundiSemaine);
      console.log('📅 Dates de la semaine:', weekDates.map(date => date.toISOString().split('T')[0]));
      
      const res = await fetch(`http://195.179.229.230:5000/api/seances/semaine/${lundiSemaine}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Données reçues du backend:', data.length, 'séances');
        
        // Log détaillé de chaque séance
        data.forEach((seance, index) => {
          console.log(`📝 Séance ${index + 1}:`, {
            id: seance._id,
            cours: seance.cours,
            coursId: seance.coursId,
            dateSeance: seance.dateSeance,
            jour: seance.jour,
            heureDebut: seance.heureDebut,
            heureFin: seance.heureFin,
            professeur: seance.professeur?.nom || seance.professeur,
            matiere: seance.matiere,
            typeSeance: seance.typeSeance,
            actif: seance.actif
          });
        });
        
        setSeancesReelles(data);
        
        if (coursList.length > 0 && data.length > 0) {
          console.log('🔄 Organisation des séances...');
          organiserSeances(data);
          setMessage({ 
            type: 'success', 
            text: `${data.length} séances chargées pour la semaine du ${formatDate(weekDates[0])}` 
          });
        } else if (data.length === 0) {
          console.log('⚠️ Aucune séance trouvée');
          setEmploiDuTemps({});
          setMessage({ 
            type: 'warning', 
            text: `Aucune séance trouvée pour la semaine du ${formatDate(weekDates[0])}` 
          });
        } else {
          console.log('⚠️ CoursList vide, attente du chargement des cours');
        }
      } else {
        console.error('❌ Erreur HTTP:', res.status, res.statusText);
        setMessage({ 
          type: 'error', 
          text: `Erreur ${res.status}: ${res.statusText}` 
        });
      }
    } catch (err) {
      console.error('❌ Erreur réseau:', err);
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion. Vérifiez que le serveur backend est démarré.' 
      });
    }
    
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const organiserSeances = (seancesData) => {
    const emploi = {};
    
    console.log('🔍 Organiser séances - Données reçues:', seancesData.length, 'séances');
    console.log('📋 Cours disponibles:', coursList.map(c => ({ id: c._id, nom: c.nom })));
    
    seancesData.forEach((seance, index) => {
      console.log(`📝 Séance ${index + 1}:`, {
        id: seance._id,
        cours: seance.cours,
        coursId: seance.coursId,
        dateSeance: seance.dateSeance,
        professeur: seance.professeur,
        matiere: seance.matiere,
        typeSeance: seance.typeSeance
      });

      // ✅ CORRECTION : Rechercher le cours par ID OU par nom
      let coursObj = null;
      
      // Essayer d'abord par coursId (nouveau système)
      if (seance.coursId) {
        coursObj = coursList.find(c => c._id === seance.coursId);
        console.log(`🔍 Recherche par coursId "${seance.coursId}":`, coursObj ? 'TROUVÉ' : 'NON TROUVÉ');
      }
      
      // Si pas trouvé, essayer par le champ cours (peut être un ID ou un nom)
      if (!coursObj && seance.cours) {
        // Essayer comme ID
        coursObj = coursList.find(c => c._id === seance.cours);
        console.log(`🔍 Recherche par cours (ID) "${seance.cours}":`, coursObj ? 'TROUVÉ' : 'NON TROUVÉ');
        
        // Si toujours pas trouvé, essayer comme nom
        if (!coursObj) {
          coursObj = coursList.find(c => c.nom === seance.cours);
          console.log(`🔍 Recherche par cours (nom) "${seance.cours}":`, coursObj ? 'TROUVÉ' : 'NON TROUVÉ');
        }
      }

      if (!coursObj) {
        console.warn(`⚠️ Cours non trouvé pour la séance:`, {
          seanceId: seance._id,
          cours: seance.cours,
          coursId: seance.coursId
        });
        return;
      }

      const coursId = coursObj._id;
      const jourKey = getJourForSeance(seance) || 'Lundi';
      const hDeb = normalizeTime(seance.heureDebut);
      const hFin = normalizeTime(seance.heureFin);
      const key = `${jourKey}-${hDeb}-${hFin}`;

      console.log(`✅ Séance mappée:`, {
        coursId,
        coursNom: coursObj.nom,
        key,
        professeur: seance.professeur?.nom || seance.professeur,
        matiere: seance.matiere
      });

      if (!emploi[coursId]) emploi[coursId] = {};
      
      emploi[coursId][key] = {
        professeur: seance.professeur?._id || seance.professeur,
        matiere: seance.matiere || '',
        salle: seance.salle || '',
        seanceId: seance._id,
        typeSeance: seance.typeSeance || 'reelle',
        actif: seance.actif !== false,
        dateSeance: seance.dateSeance
      };
    });

    console.log('📊 Emploi du temps final:', emploi);
    setEmploiDuTemps(emploi);
  };

  const normalizeTime = (t) => {
    if (!t) return '';
    const parts = t.toString().split(':');
    const h = (parts[0] || '00').padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    return `${h}:${m}`;
  };

  const getJourForSeance = (seance) => {
    if (seance?.dateSeance) {
      const d = new Date(seance.dateSeance);
      const idx = (d.getDay() + 6) % 7;
      return jours[idx];
    }
    return seance?.jour;
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
    
    console.log(`Mise à jour: ${field} = "${value}" pour ${key}`);
    
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
      
      if (field === 'professeur' && value && value !== '') {
        const matieresPossibles = getMatieresProfesseurPourCours(value, coursId);
        
        if (matieresPossibles.length === 1) {
          newState[coursId][key].matiere = matieresPossibles[0];
          console.log(`Matière auto-sélectionnée: ${matieresPossibles[0]}`);
        } else if (matieresPossibles.length === 0) {
          newState[coursId][key].matiere = '';
          console.log(`Aucune matière trouvée pour ce professeur`);
        }
      }
      
      if (field === 'professeur' && (!value || value === '')) {
        newState[coursId][key].matiere = '';
        console.log(`Professeur vidé -> matière vidée aussi`);
      }
      
      console.log(`État final pour ${key}:`, newState[coursId][key]);
      return newState;
    });
  };

  const startEdit = (coursId, jour, creneau) => {
    const key = `${jour}-${creneau.debut}-${creneau.fin}`;
    setEditing({ coursId, key });
    
    // Si la cellule est vide, initialiser avec des valeurs vides pour l'édition
    if (!emploiDuTemps[coursId]?.[key]) {
      setEmploiDuTemps(prev => ({
        ...prev,
        [coursId]: {
          ...prev[coursId],
          [key]: {
            professeur: '',
            matiere: '',
            salle: '',
            seanceId: null,
            typeSeance: 'nouvelle',
            actif: true
          }
        }
      }));
    }
  };

  const cancelEdit = () => setEditing(null);

  // FONCTION SAVEDIT CORRIGÉE AVEC VALIDATION
  const saveEdit = async (coursId, jour, creneau) => {
    try {
      const key = `${jour}-${creneau.debut}-${creneau.fin}`;
      const s = emploiDuTemps[coursId]?.[key] || {};
      
      // VALIDATION OBLIGATOIRE - Arrêter si professeur vide
      if (!s.professeur || s.professeur.trim() === '') {
        setMessage({ type: 'error', text: 'Veuillez sélectionner un professeur avant de sauvegarder' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }
      
      // VALIDATION OBLIGATOIRE - Arrêter si matière vide
      if (!s.matiere || s.matiere.trim() === '') {
        setMessage({ type: 'error', text: 'Veuillez sélectionner une matière avant de sauvegarder' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      const token = localStorage.getItem('token');
      
      // ✅ CORRECTION : Calculer correctement la date pour ce jour dans la semaine courante
      const jourIndex = jours.indexOf(jour);
      if (jourIndex === -1) {
        console.error('Jour invalide:', jour);
        return;
      }
      
      const dateISO = getISOForJourInCurrentWeek(jour);
      if (!dateISO) {
        console.error('Impossible de calculer la date ISO pour:', jour);
        return;
      }

      // Payload avec données validées et date correcte
      const payload = {
        cours: coursId,
        professeur: s.professeur,
        matiere: s.matiere,
        salle: s.salle || '',
        dateSeance: dateISO,  // ✅ IMPORTANT : Date au format ISO
        jour,
        heureDebut: creneau.debut,
        heureFin: creneau.fin
      };

      console.log('✅ Payload à envoyer:', payload);

      let res;
      if (s.typeSeance === 'exception' && s.seanceId) {
        // Mise à jour d'une exception existante
        res = await fetch(`http://195.179.229.230:5000/api/seances/${s.seanceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        // Création d'une nouvelle exception
        res = await fetch('http://195.179.229.230:5000/api/seances/exception', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Erreur serveur:', errorData);
        setMessage({ type: 'error', text: `Erreur: ${errorData.error || 'Échec de sauvegarde'}` });
        return;
      }

      const result = await res.json();
      console.log('✅ Séance sauvegardée:', result);

      setMessage({ type: 'success', text: 'Séance sauvegardée avec succès' });
      setEditing(null);
      
      // ✅ IMPORTANT : Rafraîchir les données pour voir la nouvelle séance
      await fetchSeancesReelles();

    } catch (e) {
      console.error('❌ Erreur:', e);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // FONCTION POUR SUPPRIMER UNE SÉANCE - VERSION DEBUG
  const deleteSeance = async (coursId, jour, creneau, seanceData) => {
    console.log('=== DEBUG DELETE SEANCE ===');
    console.log('coursId:', coursId);
    console.log('jour:', jour);
    console.log('creneau:', creneau);
    console.log('seanceData:', seanceData);
    
    const seanceId = seanceData.seanceId;
    const typeSeance = seanceData.typeSeance;
    
    console.log('seanceId extrait:', seanceId);
    console.log('typeSeance:', typeSeance);
    
    if (!seanceId) {
      console.error('ERREUR: seanceId manquant');
      setMessage({ type: 'error', text: 'Impossible de supprimer : ID de séance manquant' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Vérifier si c'est un ID MongoDB valide (24 caractères hexadécimaux)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(seanceId);
    console.log('ID MongoDB valide?', isValidObjectId);
    
    if (!isValidObjectId) {
      console.error('ERREUR: ID MongoDB invalide', seanceId);
      setMessage({ type: 'error', text: 'ID de séance invalide' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    let confirmMessage = '';
    if (typeSeance === 'exception') {
      confirmMessage = 'Supprimer cette exception ?';
    } else if (typeSeance === 'template') {
      confirmMessage = 'Supprimer ce template définitivement ?';
    } else {
      confirmMessage = 'Supprimer cette séance définitivement ?';
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Présent' : 'Manquant');
      
      // Toujours essayer la suppression directe d'abord
      console.log('Tentative de suppression directe pour ID:', seanceId);
      const res = await fetch(`http://195.179.229.230:5000/api/seances/${seanceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Réponse serveur:', res.status, res.statusText);
      
      if (res.ok) {
        const result = await res.json();
        console.log('Suppression réussie:', result);
        setMessage({ type: 'success', text: 'Séance supprimée avec succès' });
        await fetchSeancesReelles();
      } else {
        const errorData = await res.json();
        console.error('Erreur serveur:', errorData);
        
        // Si c'est une restriction (400), essayer la méthode alternative
        if (res.status === 400 && typeSeance !== 'exception') {
          console.log('Restriction backend - tentative de masquage par exception');
          await creerExceptionMasquante(coursId, jour, creneau, token);
        } else {
          setMessage({ 
            type: 'error', 
            text: `Erreur ${res.status}: ${errorData.error || errorData.message || 'Échec de suppression'}` 
          });
        }
      }
    } catch (e) {
      console.error('Erreur réseau:', e);
      setMessage({ type: 'error', text: 'Erreur de connexion lors de la suppression' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Fonction auxiliaire pour créer une exception masquante
  const creerExceptionMasquante = async (coursId, jour, creneau, token) => {
    try {
      console.log('Création exception masquante...');
      const dateIso = getISOForJourInCurrentWeek(jour);
      
      // Obtenir un professeur valide pour contourner la validation
      const profsDisponibles = getProfesseursPourCours(coursId);
      if (profsDisponibles.length === 0) {
        throw new Error('Aucun professeur disponible pour cette classe');
      }
      
      const payload = {
        cours: coursId,
        professeur: profsDisponibles[0]._id, // Premier prof disponible
        matiere: 'SÉANCE ANNULÉE',
        salle: '',
        dateSeance: dateIso,
        jour,
        heureDebut: creneau.debut,
        heureFin: creneau.fin,
        actif: false // Marquer comme inactive
      };
      
      console.log('Payload exception:', payload);

      const res = await fetch('http://195.179.229.230:5000/api/seances/exception', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        console.log('Exception créée:', result);
        setMessage({ type: 'success', text: 'Séance masquée avec succès' });
        await fetchSeancesReelles();
      } else {
        const errorData = await res.json();
        console.error('Erreur création exception:', errorData);
        setMessage({ type: 'error', text: `Erreur masquage: ${errorData.error}` });
      }
    } catch (error) {
      console.error('Erreur dans creerExceptionMasquage:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const getISOForJourInCurrentWeek = (jour) => {
    const idx = jours.indexOf(jour);
    if (idx < 0) return null;
    const d = new Date(weekDates[idx]);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Fonction pour récupérer les semaines disponibles
  const fetchSemainesDisponibles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/seances/semaines-disponibles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSemainesDisponibles(data);
      }
    } catch (err) {
      console.error('Erreur récupération semaines:', err);
    }
  };

  // Fonction pour copier une semaine
  const copierSemaine = async () => {
    if (!semaineSource || !semaineDestination) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner les semaines source et destination' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (semaineSource === semaineDestination) {
      setMessage({ type: 'error', text: 'Les semaines source et destination doivent être différentes' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setCopyLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/seances/copier-semaine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lundiSource: semaineSource,
          lundiDestination: semaineDestination
        })
      });

      const result = await res.json();
      
      if (result.ok) {
        setMessage({ 
          type: 'success', 
          text: `${result.seancesCrees} séances copiées avec succès de la semaine ${semaineSource} vers ${semaineDestination}` 
        });
        
        // Fermer le modal et rafraîchir les données
        setShowCopyWeekModal(false);
        setSemaineSource('');
        setSemaineDestination('');
        await fetchSeancesReelles();
        
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la copie' });
      }
    } catch (err) {
      console.error('Erreur copie semaine:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion lors de la copie' });
    } finally {
      setCopyLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Fonction pour ouvrir le modal de copie
  const ouvrirModalCopie = async () => {
    setShowCopyWeekModal(true);
    await fetchSemainesDisponibles();
    
    // Pré-remplir la semaine actuelle comme destination
    const lundiActuel = weekDates[0].toISOString().split('T')[0];
    setSemaineDestination(lundiActuel);
  };

  // Composant Modal de copie
  const ModalCopierSemaine = () => {
    if (!showCopyWeekModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', textAlign: 'center' }}>
            Copier une semaine d'emploi du temps
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Semaine source (à copier) :
            </label>
            <select
              value={semaineSource}
              onChange={(e) => setSemaineSource(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">-- Sélectionner la semaine à copier --</option>
              {semainesDisponibles.map((semaine, index) => (
                <option key={index} value={semaine.lundiSemaine}>
                  {semaine.periode} ({semaine.nombreSeances} séances, {semaine.nombreCours} cours)
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Semaine destination :
            </label>
            <input
              type="date"
              value={semaineDestination}
              onChange={(e) => setSemaineDestination(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Sélectionnez le lundi de la semaine de destination
            </small>
          </div>

          {semaineSource && semaineDestination && (
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#374151'
            }}>
              Les séances de la semaine du <strong>{semaineSource}</strong> seront copiées 
              vers la semaine du <strong>{semaineDestination}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowCopyWeekModal(false);
                setSemaineSource('');
                setSemaineDestination('');
              }}
              disabled={copyLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: copyLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: copyLoading ? 0.6 : 1
              }}
            >
              Annuler
            </button>
            
            <button
              onClick={copierSemaine}
              disabled={copyLoading || !semaineSource || !semaineDestination}
              style={{
                padding: '12px 24px',
                backgroundColor: copyLoading || !semaineSource || !semaineDestination ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (copyLoading || !semaineSource || !semaineDestination) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {copyLoading && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              {copyLoading ? 'Copie en cours...' : 'Copier la semaine'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fonction pour copier la semaine précédente
  const copierSemainePrecedente = async () => {
    const lundiActuel = weekDates[0].toISOString().split('T')[0];
    if (!window.confirm('Copier toutes les séances de la semaine précédente vers la semaine actuelle ?')) {
      return;
    }
    setCopyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/seances/copier-semaine-precedente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lundiDestination: lundiActuel
        })
      });
      const result = await res.json();
      if (result.ok) {
        setMessage({ type: 'success', text: result.message });
        await fetchSeancesReelles();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setCopyLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Fonction pour charger les semaines disponibles
  const chargerSemaines = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/seances/semaines-avec-seances', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSemainesDisponibles(data);
        setShowSelectWeek(true);
      }
    } catch (err) {
      console.error('Erreur chargement semaines:', err);
    }
  };

  // Fonction pour copier depuis une semaine choisie
  const copierDepuisSemaine = async () => {
    if (!semaineSelectionnee) return;
    setCopyLoading(true);
    setShowSelectWeek(false);
    try {
      const token = localStorage.getItem('token');
      const lundiActuel = weekDates[0].toISOString().split('T')[0];
      const res = await fetch('http://195.179.229.230:5000/api/seances/copier-semaine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lundiSource: semaineSelectionnee,
          lundiDestination: lundiActuel
        })
      });
      const result = await res.json();
      if (result.ok) {
        setMessage({ type: 'success', text: result.message });
        await fetchSeancesReelles();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setCopyLoading(false);
      setSemaineSelectionnee('');
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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

  const changeWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const downloadTable = () => {
    if (selectedCours.length === 0) {
      setMessage({ type: 'error', text: 'Sélectionnez au moins un cours pour télécharger' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    let csvContent = `Séances Réelles - Semaine du ${formatDate(weekDates[0])} au ${formatDate(weekDates[5])}\n\n`;
    
    selectedCours.forEach(coursId => {
      const cours = coursList.find(c => c._id === coursId);
      if (!cours) return;

      csvContent += `\nCOURS: ${cours.nom}\n`;
      csvContent += 'Horaires;';
      jours.forEach((jour, index) => {
        csvContent += `${jour} (${formatDate(weekDates[index])});`;
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
          const statut = seanceData.actif === false ? ' (ANNULÉ)' : '';
          
          csvContent += `"${profNom}${matiere ? ' - ' + matiere : ''}${salle ? ' (Salle: ' + salle + ')' : ''}${statut}";`;
        });
        csvContent += '\n';
      });
      
      csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `seances_${formatDate(weekDates[0]).replace('/', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({ type: 'success', text: 'Tableau téléchargé avec succès !' });
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
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
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
    cellContentReadOnly: {
      padding: '8px',
      backgroundColor: '#f8fafc',
      borderRadius: '4px',
      height: '100%',
      fontSize: '11px'
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
    statusBadge: {
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: '500'
    },
    statusActive: {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    statusInactive: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div>Chargement de l'emploi du temps...</div>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Récupération des données depuis la base de données
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
       <Sidebar onLogout={handleLogout} />
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1f2937' }}>
          <Calendar size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Consultation et Modification de l'Emploi du Temps
        </h1>
      </div>

      <div style={styles.controls}>
        {/* Sélection des cours */}
        <div style={styles.coursSelection}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
            Sélectionner les classes à afficher :
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

        {/* Navigation des semaines avec bouton copier */}
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
          
          {/* BOUTONS COPIE SIMPLES */}
          <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
            {/* Bouton copier semaine précédente */}
            <button 
              style={{
                ...styles.weekButton,
                backgroundColor: copyLoading ? '#9ca3af' : '#10b981',
                cursor: copyLoading ? 'not-allowed' : 'pointer'
              }}
              onClick={copierSemainePrecedente}
              disabled={copyLoading}
            >
              {copyLoading ? 'Copie...' : 'Copier Semaine -1'}
            </button>
            {/* Bouton choisir semaine */}
            <button 
              style={{
                ...styles.weekButton,
                backgroundColor: '#8b5cf6'
              }}
              onClick={chargerSemaines}
            >
              Choisir Semaine
            </button>
          </div>
        </div>

        {/* Bouton de téléchargement */}
        {selectedCours.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button style={styles.downloadButton} onClick={downloadTable}>
              <Download size={18} />
              Télécharger l'emploi du temps
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
                <Calendar size={18} />
                Séances: {cours.nom}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Semaine du {formatDate(weekDates[0])}
                </span>
                <button 
                  style={styles.refreshButton}
                  onClick={fetchSeancesReelles}
                >
                  <RefreshCw size={14} />
                  Actualiser
                </button>
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
                  {creneaux.map(creneau => (
                    <tr key={`${creneau.debut}-${creneau.fin}`}>
                      <td style={styles.timeCell}>
                        {creneau.label}
                      </td>
                      {jours.map(jour => {
                        const key = `${jour}-${creneau.debut}-${creneau.fin}`;
                        const seanceData = emploiDuTemps[coursId]?.[key] || {};
                        
                        return (
                          <td key={jour} style={styles.cell}>
                            {/* Affichage en lecture seule avec boutons améliorés */}
                            {((seanceData.seanceId || seanceData.typeSeance) && editing?.coursId !== coursId && editing?.key !== key) ? (
                              <div style={styles.cellContentReadOnly}>
                                <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '4px' }}>
                                  {profList.find(p => p._id === seanceData.professeur)?.nom || '—'}
                                </div>
                                {seanceData.matiere && (
                                  <div style={{ color: '#7c3aed', marginBottom: '2px', fontSize: '10px' }}>
                                    {seanceData.matiere}
                                  </div>
                                )}
                                {seanceData.salle && (
                                  <div style={{ color: '#dc2626', marginBottom: '2px', fontSize: '10px' }}>
                                    Salle: {seanceData.salle}
                                  </div>
                                )}
                                <div style={{ fontSize: '9px', marginTop: '4px' }}>
                                  <span style={{
                                    ...styles.statusBadge,
                                    ...(seanceData.actif ? styles.statusActive : styles.statusInactive)
                                  }}>
                                    {seanceData.typeSeance || 'reelle'}
                                  </span>
                                </div>
                                {seanceData.actif === false && (
                                  <div style={{ fontSize: '9px', color: '#dc2626', marginTop: '2px' }}>
                                    ANNULÉ
                                  </div>
                                )}

                                {/* BOUTONS D'ACTION AMÉLIORÉS */}
                                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  {/* Bouton Modifier */}
                                  <button
                                    style={{ 
                                      fontSize: '10px', 
                                      padding: '3px 6px', 
                                      borderRadius: '3px', 
                                      border: '1px solid #3b82f6', 
                                      cursor: 'pointer',
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '3px'
                                    }}
                                    onClick={() => startEdit(coursId, jour, creneau)}
                                  >
                                    <Edit size={8} />
                                    Modifier
                                  </button>

                                  {/* Bouton Supprimer */}
                                  <button
                                    style={{
                                      fontSize: '10px',
                                      padding: '3px 6px',
                                      borderRadius: '3px',
                                      border: '1px solid #dc2626',
                                      background: '#dc2626',
                                      color: 'white',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '3px'
                                    }}
                                    onClick={() => deleteSeance(coursId, jour, creneau, seanceData)}
                                    title="Supprimer cette séance"
                                  >
                                    <Trash2 size={8} />
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Bouton Ajouter si pas de séance */
                              editing?.coursId !== coursId && editing?.key !== key && (
                                <div style={{ textAlign: 'center' }}>
                                  <button
                                    style={{ 
                                      fontSize: 11, 
                                      padding: '8px 12px', 
                                      borderRadius: 4, 
                                      border: '2px dashed #d1d5db', 
                                      cursor: 'pointer',
                                      backgroundColor: '#f9fafb',
                                      color: '#374151',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      margin: '0 auto'
                                    }}
                                    onClick={() => startEdit(coursId, jour, creneau)}
                                  >
                                    <Plus size={12} />
                                    Ajouter séance
                                  </button>
                                </div>
                              )
                            )}

                            {/* Mode édition dans la cellule */}
                            {editing?.coursId === coursId && editing?.key === key && (
                              <div style={styles.cellContent}>
                                <select
                                  style={styles.select}
                                  value={seanceData.professeur || ''}
                                  onChange={(e) => updateCase(coursId, jour, creneau, 'professeur', e.target.value)}
                                >
                                  <option value="">-- Professeur --</option>
                                  {getProfesseursPourCours(coursId).map(prof => (
                                    <option key={prof._id} value={prof._id}>
                                      {prof.nom} {prof.estPermanent ? '(Permanent)' : '(Entrepreneur)'}
                                    </option>
                                  ))}
                                </select>

                                {seanceData.professeur ? (
                                  (() => {
                                    const mats = getMatieresProfesseurPourCours(seanceData.professeur, coursId);
                                    return mats.length > 0 ? (
                                      <select
                                        style={styles.select}
                                        value={seanceData.matiere || ''}
                                        onChange={(e) => updateCase(coursId, jour, creneau, 'matiere', e.target.value)}
                                      >
                                        <option value="">-- Matière --</option>
                                        {mats.map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                    ) : (
                                      <input
                                        style={{...styles.input, backgroundColor: '#fff'}}
                                        placeholder="Matière..."
                                        value={seanceData.matiere || ''}
                                        onChange={(e) => updateCase(coursId, jour, creneau, 'matiere', e.target.value)}
                                      />
                                    );
                                  })()
                                ) : (
                                  <input
                                    style={{...styles.input, backgroundColor: '#f3f4f6', cursor: 'not-allowed'}}
                                    placeholder="Sélectionnez d'abord un professeur"
                                    value=""
                                    disabled
                                  />
                                )}

                                <input
                                  style={styles.input}
                                  placeholder="Salle..."
                                  value={seanceData.salle || ''}
                                  onChange={(e) => updateCase(coursId, jour, creneau, 'salle', e.target.value)}
                                />

                                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                  <button
                                    style={{ 
                                      fontSize: 11, 
                                      padding: '4px 8px', 
                                      background: '#10b981', 
                                      color:'#fff', 
                                      border:'none', 
                                      borderRadius: 4, 
                                      cursor:'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    onClick={() => saveEdit(coursId, jour, creneau)}
                                  >
                                    <Save size={10} />
                                    Enregistrer
                                  </button>
                                  <button
                                    style={{ 
                                      fontSize: 11, 
                                      padding: '4px 8px', 
                                      background: '#e5e7eb', 
                                      color:'#111827', 
                                      border:'none', 
                                      borderRadius: 4, 
                                      cursor:'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    onClick={cancelEdit}
                                  >
                                    <X size={10} />
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}
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
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📅</div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            Consulter l'Emploi du Temps
          </div>
          <div>
            Sélectionnez une classe ci-dessus pour voir ses séances programmées.
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fbbf24'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              Fonctionnalités disponibles
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
              • <strong>Consulter</strong> les séances de la semaine<br/>
              • <strong>Modifier</strong> une séance existante<br/>
              • <strong>Ajouter</strong> une nouvelle séance<br/>
              • <strong>Supprimer</strong> une séance<br/>
              • <strong>Télécharger</strong> l'emploi du temps
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
            📋 Mode Consultation et Modification
          </h4>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
            • Cliquez sur <strong>"Modifier"</strong> pour changer les détails d'une séance<br/>
            • Cliquez sur <strong>"Ajouter séance"</strong> dans une case vide pour créer une nouvelle séance<br/>
            • <strong>IMPORTANT</strong> : Professeur et matière sont OBLIGATOIRES pour sauvegarder<br/>
            • Cliquez sur <strong>"Supprimer"</strong> pour effacer définitivement une séance<br/>
            • Les modifications créent des <strong>exceptions</strong> pour cette semaine<br/>
            • Naviguez entre les semaines pour voir les différentes périodes
          </div>
        </div>
      )}

      {/* Modal Copier Semaine */}
      <ModalCopierSemaine />

      {/* Modal simple de sélection */}
      {showSelectWeek && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Choisir la semaine à copier</h3>
            <select
              value={semaineSelectionnee}
              onChange={(e) => setSemaineSelectionnee(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '15px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">-- Sélectionner une semaine --</option>
              {semainesDisponibles.map((semaine, index) => (
                <option key={index} value={semaine.lundi}>
                  {semaine.label}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowSelectWeek(false);
                  setSemaineSelectionnee('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={copierDepuisSemaine}
                disabled={!semaineSelectionnee}
                style={{
                  padding: '8px 16px',
                  backgroundColor: semaineSelectionnee ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: semaineSelectionnee ? 'pointer' : 'not-allowed'
                }}
              >
                Copier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS pour l'animation de rotation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EmploiConsultation;