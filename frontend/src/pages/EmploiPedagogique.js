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
  X,
  Clock,
  Settings
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import HistoriqueModal from '../components/HistoriqueModal';
import './EmploiPedagogique.css';

const EmploiPedagogique = () => {
  const [jours] = useState(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']);
  
  // MODIFICATION: Structure des créneaux par jour
  const [creneauxCours, setCreneauxCours] = useState({});
  const [coursCreneauxSelectionne, setCoursCreneauxSelectionne] = useState('');
  const [showCreneauxModal, setShowCreneauxModal] = useState(false);
  const [tempCreneaux, setTempCreneaux] = useState({}); // CHANGÉ: {} au lieu de []
  const [jourActif, setJourActif] = useState('Lundi'); // NOUVEAU: jour actif dans le modal
  
  const [coursList, setCoursList] = useState([]);
  const [profList, setProfList] = useState([]);
  const [selectedCours, setSelectedCours] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [seancesReelles, setSeancesReelles] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [emploiDuTemps, setEmploiDuTemps] = useState({});
  const [copyLoading, setCopyLoading] = useState(false);

  // États spécifiques aux pédagogiques
  const [userInfo, setUserInfo] = useState(null);
  const [permissions, setPermissions] = useState({
    canModify: false,
    canCreate: false,
    canDelete: false,
    filiere: null,
    isGeneral: false
  });

  // États pour les rattrapages
  const [showStatsRattrapages, setShowStatsRattrapages] = useState(false);
  const [statsRattrapages, setStatsRattrapages] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // États pour l'historique
  const [showHistorique, setShowHistorique] = useState(false);
  const [selectedSeanceForHistory, setSelectedSeanceForHistory] = useState(null);

  // NOUVELLE FONCTION: Obtenir la clé de la semaine
  const getSemaineKey = (currentWeek) => {
    const weekDates = getWeekDates(currentWeek);
    const lundi = weekDates[0];
    const y = lundi.getFullYear();
    const m = String(lundi.getMonth() + 1).padStart(2, '0');
    const d = String(lundi.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // FONCTIONS POUR GÉRER LES CRÉNEAUX PAR JOUR

  // Charger les créneaux personnalisés depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('creneauxCoursPersonnalises');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setCreneauxCours(parsed);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des créneaux par cours:', error);
      }
    }
  }, []);

  // Générer un label automatique pour un créneau
  const genererLabel = (debut, fin) => {
    if (!debut || !fin) return '';
    const formatTime = (time) => {
      const [hour, min] = time.split(':');
      return `${parseInt(hour)}h${min !== '00' ? min : ''}`;
    };
    return `${formatTime(debut)} - ${formatTime(fin)}`;
  };

  // MODIFIÉ: Ouvrir le modal de gestion des créneaux pour un cours et une semaine
  const ouvrirModalCreneaux = (coursId) => {
    setCoursCreneauxSelectionne(coursId);
    
    const semaineKey = getSemaineKey(currentWeek);
    
    // Charger les créneaux existants pour cette semaine ou créer structure vide
    const creneauxExistants = creneauxCours[coursId]?.[semaineKey] || {};
    const tempInitial = {};
    
    jours.forEach(jour => {
      // Vérifier s'il y a des créneaux pour cette semaine spécifique
      if (typeof creneauxExistants === 'object' && !Array.isArray(creneauxExistants)) {
        tempInitial[jour] = creneauxExistants[jour] || [];
      } else {
        // Structure vide si pas de créneaux pour cette semaine
        tempInitial[jour] = [];
      }
    });
    
    setTempCreneaux(tempInitial);
    setJourActif('Lundi');
    setShowCreneauxModal(true);
  };

  // MODIFIÉ: Ajouter un créneau pour le jour actif
  const ajouterCreneau = () => {
    const creneauxJour = tempCreneaux[jourActif] || [];
    const nouveauId = Math.max(...creneauxJour.map(c => c.id), 0) + 1;
    
    setTempCreneaux(prev => ({
      ...prev,
      [jourActif]: [
        ...creneauxJour,
        { id: nouveauId, debut: '08:00', fin: '10:00' }
      ]
    }));
  };

  // MODIFIÉ: Supprimer un créneau du jour actif
  const supprimerCreneau = (id) => {
    const creneauxJour = tempCreneaux[jourActif] || [];
    
    setTempCreneaux(prev => ({
      ...prev,
      [jourActif]: creneauxJour.filter(c => c.id !== id)
    }));
  };

  // MODIFIÉ: Modifier un créneau du jour actif
  const modifierCreneau = (id, field, value) => {
    setTempCreneaux(prev => ({
      ...prev,
      [jourActif]: (prev[jourActif] || []).map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  // NOUVEAU: Copier créneaux vers autres jours
  const copierVersAutresJours = () => {
    const creneauxSource = tempCreneaux[jourActif] || [];
    
    if (creneauxSource.length === 0) {
      setMessage({ type: 'warning', text: `Aucun créneau à copier depuis ${jourActif}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    if (window.confirm(`Copier les ${creneauxSource.length} créneaux de ${jourActif} vers tous les autres jours ?`)) {
      setTempCreneaux(prev => {
        const nouveau = { ...prev };
        let maxId = Math.max(...Object.values(prev).flat().map(c => c.id), 0);
        
        jours.forEach(jour => {
          if (jour !== jourActif) {
            nouveau[jour] = creneauxSource.map((creneau) => ({
              ...creneau,
              id: ++maxId
            }));
          }
        });
        return nouveau;
      });
      
      setMessage({ type: 'success', text: `Créneaux de ${jourActif} copiés vers tous les jours` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // NOUVEAU: Vider tous les jours
  const viderTousLesJours = () => {
    if (window.confirm('Supprimer tous les créneaux de tous les jours ?')) {
      const tempVide = {};
      jours.forEach(jour => {
        tempVide[jour] = [];
      });
      setTempCreneaux(tempVide);
      
      setMessage({ type: 'info', text: 'Tous les créneaux ont été supprimés' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // NOUVELLE FONCTION: Copier les créneaux d'une semaine à l'autre
  const copierCreneauxSemaine = (coursId, semaineSrcKey, semaineDestKey) => {
    const creneauxSource = creneauxCours[coursId]?.[semaineSrcKey];
    
    if (!creneauxSource) {
      setMessage({ type: 'warning', text: 'Aucun créneau à copier depuis la semaine précédente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    if (window.confirm('Copier les créneaux de la semaine précédente vers cette semaine ?')) {
      const newCreneauxCours = {
        ...creneauxCours,
        [coursId]: {
          ...creneauxCours[coursId],
          [semaineDestKey]: { ...creneauxSource }
        }
      };
      
      localStorage.setItem('creneauxCoursPersonnalises', JSON.stringify(newCreneauxCours));
      setCreneauxCours(newCreneauxCours);
      
      // Recharger les créneaux temporaires
      setTempCreneaux({ ...creneauxSource });
      
      setMessage({ 
        type: 'success', 
        text: 'Créneaux copiés depuis la semaine précédente' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // MODIFIÉ: Valider et sauvegarder les créneaux par jour
  const sauvegarderCreneaux = () => {
    // Validation pour chaque jour
    const erreurs = [];
    let totalCreneaux = 0;
    
    jours.forEach(jour => {
      const creneauxJour = tempCreneaux[jour] || [];
      totalCreneaux += creneauxJour.length;
      
      for (let i = 0; i < creneauxJour.length; i++) {
        const creneau = creneauxJour[i];
        
        if (!creneau.debut || !creneau.fin) {
          erreurs.push(`${jour} - Créneau ${i + 1}: Heures obligatoires`);
          continue;
        }
        
        if (creneau.debut >= creneau.fin) {
          erreurs.push(`${jour} - Créneau ${i + 1}: Heure fin après début`);
        }
        
        // Vérifier chevauchements dans le même jour
        for (let j = i + 1; j < creneauxJour.length; j++) {
          const autreCreneau = creneauxJour[j];
          if (creneau.debut < autreCreneau.fin && creneau.fin > autreCreneau.debut) {
            erreurs.push(`${jour}: Chevauchement créneaux ${i + 1} et ${j + 1}`);
          }
        }
      }
    });
    
    if (erreurs.length > 0) {
      setMessage({ type: 'error', text: erreurs.slice(0, 3).join('. ') + (erreurs.length > 3 ? '...' : '') });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }
    
    // Trier les créneaux de chaque jour
    const creneauxTries = {};
    jours.forEach(jour => {
      creneauxTries[jour] = [...(tempCreneaux[jour] || [])].sort((a, b) => a.debut.localeCompare(b.debut));
    });
    
    const semaineKey = getSemaineKey(currentWeek);
    const weekDates = getWeekDates(currentWeek);

    // Sauvegarder avec la nouvelle structure incluant la semaine
    const newCreneauxCours = { 
      ...creneauxCours, 
      [coursCreneauxSelectionne]: {
        ...creneauxCours[coursCreneauxSelectionne],
        [semaineKey]: creneauxTries
      }
    };
    
    localStorage.setItem('creneauxCoursPersonnalises', JSON.stringify(newCreneauxCours));
    setCreneauxCours(newCreneauxCours);
    setShowCreneauxModal(false);
    
    setMessage({ 
      type: 'success', 
      text: `Créneaux mis à jour pour la semaine du ${formatDate(weekDates[0])}: ${totalCreneaux} créneaux` 
    });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    
    // Recharger les données avec les nouveaux créneaux
    fetchSeancesReelles();
  };

  // MODIFIÉ: Fonction pour obtenir les créneaux d'un jour spécifique pour la semaine actuelle
  const getCreneauxPourJour = (coursId, jour) => {
    const semaineKey = getSemaineKey(currentWeek);
    const creneauxCoursData = creneauxCours[coursId]?.[semaineKey];
    
    if (!creneauxCoursData) {
      // Pas de créneaux pour cette semaine, retourner vide
      return [];
    }
    
    // Structure jour par jour pour cette semaine
    return creneauxCoursData[jour] || [];
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

  // Charger les données
  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchData();
    }
  }, [userInfo]);

  useEffect(() => {
    if (coursList.length > 0 && selectedCours.length === 0) {
      setSelectedCours([coursList[0]._id]);
    }
  }, [coursList.length]);

  useEffect(() => {
    if (coursList.length > 0 && userInfo) {
      fetchSeancesReelles();
    }
  }, [currentWeek, coursList.length, userInfo]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUserInfo(userData);
        
        const isGeneral = userData.filiere === 'GENERAL' || userData.role === 'pedagogique_general';
        setPermissions({
          canModify: true,
          canCreate: true,
          canDelete: true,
          filiere: userData.filiere,
          isGeneral: isGeneral
        });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la récupération des informations utilisateur' });
      }
    } catch (err) {
      console.error('Erreur fetchUserInfo:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const coursUrl = permissions.isGeneral 
        ? 'http://195.179.229.230:5000/api/cours'
        : 'http://195.179.229.230:5000/api/pedagogique/cours';
        
      const resCours = await fetch(coursUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resCours.ok) {
        const coursData = await resCours.json();
        setCoursList(coursData);
      }

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
      
      const res = await fetch(`http://195.179.229.230:5000/api/seances/semaine/${lundiSemaine}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSeancesReelles(data);
        
        if (coursList.length > 0 && data.length > 0) {
          organiserSeances(data);
          setMessage({ 
            type: 'success', 
            text: `${data.length} séances chargées pour la semaine du ${formatDate(weekDates[0])}` 
          });
        } else if (data.length === 0) {
          setEmploiDuTemps({});
          setMessage({ 
            type: 'warning', 
            text: `Aucune séance trouvée pour la semaine du ${formatDate(weekDates[0])}` 
          });
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: `Erreur ${res.status}: ${res.statusText}` 
        });
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion. Vérifiez que le serveur backend est démarré.' 
      });
    }
    
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const organiserSeances = (seancesData) => {
    const emploi = {};
    
    seancesData.forEach((seance) => {
      let coursObj = null;
      
      if (seance.coursId) {
        coursObj = coursList.find(c => c._id === seance.coursId);
      }
      
      if (!coursObj && seance.cours) {
        coursObj = coursList.find(c => c._id === seance.cours);
        if (!coursObj) {
          coursObj = coursList.find(c => c.nom === seance.cours);
        }
      }

      if (!coursObj) {
        console.warn(`Cours non trouvé pour la séance:`, seance);
        return;
      }

      const coursId = coursObj._id;
      const jourKey = getJourForSeance(seance) || 'Lundi';
      const hDeb = normalizeTime(seance.heureDebut);
      const hFin = normalizeTime(seance.heureFin);
      const key = `${jourKey}-${hDeb}-${hFin}`;

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
        } else if (matieresPossibles.length === 0) {
          newState[coursId][key].matiere = '';
        }
      }
      
      if (field === 'professeur' && (!value || value === '')) {
        newState[coursId][key].matiere = '';
      }
      
      return newState;
    });
  };

  const startEdit = (coursId, jour, creneau) => {
    const key = `${jour}-${creneau.debut}-${creneau.fin}`;
    setEditing({ coursId, key });
    
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

  const saveEdit = async (coursId, jour, creneau) => {
    try {
      const key = `${jour}-${creneau.debut}-${creneau.fin}`;
      const s = emploiDuTemps[coursId]?.[key] || {};
      
      if (!s.professeur || s.professeur.trim() === '') {
        setMessage({ type: 'error', text: 'Veuillez sélectionner un professeur avant de sauvegarder' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }
      
      if (!s.matiere || s.matiere.trim() === '') {
        setMessage({ type: 'error', text: 'Veuillez sélectionner une matière avant de sauvegarder' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      const token = localStorage.getItem('token');
      const dateISO = getISOForJourInCurrentWeek(jour);
      
      const payload = {
        cours: coursId,
        professeur: s.professeur,
        matiere: s.matiere,
        salle: s.salle || '',
        dateSeance: dateISO,
        jour,
        heureDebut: creneau.debut,
        heureFin: creneau.fin
      };

      let res;
      if (s.typeSeance === 'exception' && s.seanceId) {
        res = await fetch(`http://195.179.229.230:5000/api/seances/${s.seanceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('http://195.179.229.230:5000/api/seances/exception', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        setMessage({ type: 'error', text: `Erreur: ${errorData.error || 'Échec de sauvegarde'}` });
        return;
      }

      setMessage({ type: 'success', text: 'Séance sauvegardée avec succès' });
      setEditing(null);
      await fetchSeancesReelles();

    } catch (e) {
      console.error('Erreur:', e);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const deleteSeance = async (coursId, jour, creneau, seanceData) => {
    const seanceId = seanceData.seanceId;
    
    if (!seanceId) {
      setMessage({ type: 'error', text: 'Impossible de supprimer : ID de séance manquant' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (!window.confirm('Supprimer cette séance définitivement ?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://195.179.229.230:5000/api/seances/${seanceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Séance supprimée avec succès' });
        await fetchSeancesReelles();
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: `Erreur: ${errorData.error || 'Échec de suppression'}` });
      }
    } catch (e) {
      console.error('Erreur réseau:', e);
      setMessage({ type: 'error', text: 'Erreur de connexion lors de la suppression' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const marquerRattrapage = async (coursId, jour, creneau, seanceData) => {
    if (!permissions.canModify) {
      setMessage({ 
        type: 'error', 
        text: 'Vous n\'avez pas les permissions pour marquer les rattrapages' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const seanceId = seanceData.seanceId;
    
    if (!seanceId || !/^[0-9a-fA-F]{24}$/.test(seanceId)) {
      setMessage({ type: 'error', text: 'ID de séance invalide' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (!window.confirm('Marquer cette séance comme rattrapage ?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://195.179.229.230:5000/api/pedagogique/seances/${seanceId}/rattrapage`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Séance marquée en rattrapage' });
        await fetchSeancesReelles();
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: `Erreur: ${errorData.error}` });
      }
    } catch (e) {
      console.error('Erreur marquer rattrapage:', e);
      setMessage({ type: 'error', text: 'Erreur lors du marquage' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const fetchStatsRattrapages = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/pedagogique/rattrapages/statistiques', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStatsRattrapages(data.statistiques);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement des statistiques' });
      }
    } catch (err) {
      console.error('Erreur stats:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoadingStats(false);
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

  // COMPOSANT MODAL MODIFIÉ POUR CRÉNEAUX SEMAINE PAR SEMAINE
  const ModalCreneaux = () => {
    if (!showCreneauxModal) return null;

    const semaineActuelle = getSemaineKey(currentWeek);
    const dateSemainePrecedente = new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    const semainePrecedente = getSemaineKey(dateSemainePrecedente);
    const hasCreneauxSemainePrecedente = creneauxCours[coursCreneauxSelectionne]?.[semainePrecedente];

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3 className="modal-header">
            <Clock size={24} />
            Configurer les créneaux par jour - {coursList.find(c => c._id === coursCreneauxSelectionne)?.nom}
          </h3>

          {/* AJOUTÉ: Info semaine et bouton copie */}
          <div className="semaine-info">
            Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[6])}
          </div>

          {/* NOUVEAU: Bouton pour copier depuis la semaine précédente */}
          {hasCreneauxSemainePrecedente && (
            <div className="semaine-actions">
              <button
                onClick={() => {
                  copierCreneauxSemaine(coursCreneauxSelectionne, semainePrecedente, semaineActuelle);
                }}
                className="modal-action-button copy-week"
              >
                📅 Copier les créneaux de la semaine précédente ({formatDate(new Date(dateSemainePrecedente.getTime() + 6 * 24 * 60 * 60 * 1000))})
              </button>
            </div>
          )}
          
          {/* Onglets pour les jours */}
          <div className="modal-tabs">
            {jours.map(jour => (
              <button
                key={jour}
                onClick={() => setJourActif(jour)}
                className={`modal-tab ${jourActif === jour ? 'active' : ''}`}
              >
                {jour}
                <div className="tab-count">
                  {(tempCreneaux[jour] || []).length} créneaux
                </div>
              </button>
            ))}
          </div>

          {/* Configuration pour le jour actif */}
          <div className="tab-content">
            <h4 className="tab-title">
              📅 Créneaux pour {jourActif}
              <span className="tab-badge">
                {(tempCreneaux[jourActif] || []).length} séance(s)
              </span>
            </h4>

            {(tempCreneaux[jourActif] || []).map((creneau, index) => (
              <div key={creneau.id} className="creneau-row">
                <span className="creneau-label">
                  Séance {index + 1}:
                </span>
                
                <div className="creneau-inputs">
                  <input
                    type="time"
                    value={creneau.debut}
                    onChange={(e) => modifierCreneau(creneau.id, 'debut', e.target.value)}
                    className="creneau-time-input"
                  />
                  
                  <span className="creneau-separator">à</span>
                  
                  <input
                    type="time"
                    value={creneau.fin}
                    onChange={(e) => modifierCreneau(creneau.id, 'fin', e.target.value)}
                    className="creneau-time-input"
                  />
                </div>
                
                <div className="creneau-preview">
                  {genererLabel(creneau.debut, creneau.fin)}
                </div>
                
                <button
                  onClick={() => supprimerCreneau(creneau.id)}
                  className="creneau-delete"
                  title="Supprimer ce créneau"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Message si aucun créneau */}
            {(!tempCreneaux[jourActif] || tempCreneaux[jourActif].length === 0) && (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div>Aucun créneau configuré pour {jourActif}</div>
                <div className="text-xs mt-10">
                  Cliquez sur "Ajouter un créneau" pour commencer
                </div>
              </div>
            )}

            {/* Bouton d'ajout */}
            <div className="text-center">
              <button
                onClick={ajouterCreneau}
                className="add-creneau-button"
              >
                <Plus size={16} />
                Ajouter un créneau à {jourActif}
              </button>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="modal-actions">
            <button
              onClick={copierVersAutresJours}
              className="modal-action-button copy"
            >
              📋 Copier {jourActif} vers autres jours
            </button>
            
            <button
              onClick={viderTousLesJours}
              className="modal-action-button clear"
            >
              🗑️ Vider tous les jours
            </button>
          </div>

          {/* Résumé global */}
          <div className="modal-summary">
            <div className="summary-title">
              📊 Résumé de la configuration
            </div>
            <div className="summary-grid">
              {jours.map(jour => (
                <div key={jour} className="summary-item">
                  <div className="summary-item-title">{jour}</div>
                  <div className="summary-item-count">
                    {(tempCreneaux[jour] || []).length} créneaux
                  </div>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <strong>Total:</strong> {Object.values(tempCreneaux).flat().length} créneaux sur la semaine
            </div>
          </div>

          {/* Boutons de validation */}
          <div className="modal-buttons">
            <button
              onClick={() => {
                setShowCreneauxModal(false);
                setTempCreneaux({});
                setJourActif('Lundi');
              }}
              className="modal-button cancel"
            >
              Annuler
            </button>
            
            <button
              onClick={sauvegarderCreneaux}
              className="modal-button save"
            >
              <Save size={16} />
              Sauvegarder la configuration
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <Sidebar onLogout={handleLogout} />
        <div className="loading">
          <div>Chargement de l'emploi du temps...</div>
          <div>Récupération des données depuis la base de données</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar onLogout={handleLogout} />
      
      <div className="header">
        {/* Informations utilisateur */}
        {userInfo && (
          <div className="user-info">
            <div>
              <div className="user-info-name">{userInfo.nom}</div>
              <div className="user-info-role">
                {permissions.isGeneral ? 'Pédagogique Général' : `Filière ${userInfo.filiere}`}
              </div>
            </div>
          </div>
        )}

        <h1>
          <Calendar size={24} />
          Interface Pédagogique - Emploi du Temps
        </h1>
        
        <div className="header-subtitle">
          Gestion et consultation des emplois du temps
        </div>
      </div>

      <div className="controls">
        {/* Information sur les permissions */}
        <div className={`permissions-info ${permissions.isGeneral ? 'general' : 'specific'}`}>
          <div className="permissions-title">Vos permissions :</div>
          <div className="permissions-details">
            {permissions.isGeneral ? (
              <>Accès à toutes les filières • Modification • Création • Suppression</>
            ) : (
              <>Filière {userInfo?.filiere} uniquement • Modification • Création • Suppression</>
            )}
          </div>
        </div>

        {/* Sélection des cours */}
        <div className="cours-selection">
          <h3>
            {permissions.isGeneral ? 
              'Sélectionner les classes à afficher (toutes filières) :' : 
              `Classes de votre filière (${userInfo?.filiere}) :`
            }
          </h3>
          <div className="cours-grid">
            {coursList.map(cours => (
              <div
                key={cours._id}
                className={`cours-card ${selectedCours.includes(cours._id) ? 'selected' : ''}`}
                onClick={() => toggleCours(cours._id)}
              >
                {cours.nom}
                {cours.filiere && (
                  <div className="cours-card-filiere">
                    {cours.filiere}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation des semaines */}
        <div className="week-navigation">
          <button className="week-button" onClick={() => changeWeek(-1)}>
            <ChevronLeft size={16} />
            Semaine précédente
          </button>
          
          <div className="week-info">
            Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[6])}
          </div>
          
          <button className="week-button" onClick={() => changeWeek(1)}>
            Semaine suivante
            <ChevronRight size={16} />
          </button>

          {/* Boutons pour configurer les créneaux - MODIFIÉ avec info semaine */}
          {selectedCours.map(coursId => {
            const semaineKey = getSemaineKey(currentWeek);
            const hasCreneauxPourCetteSemaine = creneauxCours[coursId]?.[semaineKey];
            
            return (
              <button 
                key={coursId}
                className={`creneaux-button ${hasCreneauxPourCetteSemaine ? 'has-creneaux' : ''}`}
                onClick={() => ouvrirModalCreneaux(coursId)}
                title={`Configurer les créneaux pour ${coursList.find(c => c._id === coursId)?.nom} - Semaine du ${formatDate(weekDates[0])}`}
              >
                <Settings size={16} />
                Configurer les heures ({coursList.find(c => c._id === coursId)?.nom})
                {hasCreneauxPourCetteSemaine && (
                  <span className="badge-configured">✓ Configuré</span>
                )}
              </button>
            );
          })}

          <button 
            className={`week-button copy ${copyLoading ? 'loading' : ''}`}
            onClick={copierSemainePrecedente}
            disabled={copyLoading}
          >
            {copyLoading ? 'Copie...' : 'Copier Semaine -1'}
          </button>

          <button 
            className="week-button stats"
            onClick={() => {
              setShowStatsRattrapages(true);
              fetchStatsRattrapages();
            }}
          >
            Stats Rattrapages
          </button>

          <button 
            className="week-button history"
            onClick={() => {
              setSelectedSeanceForHistory(null);
              setShowHistorique(true);
            }}
            title="Voir l'historique de toutes les séances"
          >
            <Clock size={16} />
            Historique Général
          </button>
        </div>
{/* AFFICHAGE DES CRÉNEAUX CONFIGURÉS PAR COURS */}
        {selectedCours.length > 0 && (
          <div className="creneaux-display">
            <h4>
              <Clock size={16} />
              Configuration des créneaux pour la semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[6])}
            </h4>
            
            {selectedCours.map(coursId => {
              const cours = coursList.find(c => c._id === coursId);
              if (!cours) return null;
              
              const semaineKey = getSemaineKey(currentWeek);
              const creneauxCetteSemaine = creneauxCours[coursId]?.[semaineKey];
              const hasCreneaux = creneauxCetteSemaine && Object.keys(creneauxCetteSemaine).length > 0;
              
              // Vérifier s'il y a des séances réelles
              const hasSeances = emploiDuTemps[coursId] && Object.keys(emploiDuTemps[coursId]).length > 0;
              
              // Calculer le nombre total de créneaux
              let totalCreneaux = 0;
              if (hasCreneaux) {
                jours.forEach(jour => {
                  const creneauxJour = creneauxCetteSemaine[jour] || [];
                  totalCreneaux += creneauxJour.length;
                });
              }
              
              // Calculer le nombre de séances
              let totalSeances = 0;
              if (hasSeances) {
                totalSeances = Object.keys(emploiDuTemps[coursId]).length;
              }
              
              return (
                <div key={coursId} className="creneaux-cours-container">
                  <div className="creneaux-cours-header">
                    <div className="cours-name-badge">
                      📚 {cours.nom}
                    </div>
                    <div className="creneaux-status">
                      {hasCreneaux ? (
                        <span className="badge-configured">
                          ✓ {totalCreneaux} créneau(x) configuré(s)
                        </span>
                      ) : hasSeances ? (
                        <span className="badge-has-seances">
                          📋 {totalSeances} séance(s) programmée(s)
                        </span>
                      ) : (
                        <span className="badge-not-configured">
                          ⚠ Aucune séance ni créneau
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {hasCreneaux ? (
                    <div className="creneaux-grid">
                      {jours.map(jour => {
                        const creneauxJour = getCreneauxPourJour(coursId, jour);
                        return (
                          <div key={jour} className="creneaux-jour">
                            <div className="creneaux-jour-title">
                              {jour}
                            </div>
                            
                            {creneauxJour.length > 0 ? (
                              <div className="creneaux-jour-list">
                                {creneauxJour.map((creneau, index) => (
                                  <span key={creneau.id || index} className="creneau-item">
                                    {genererLabel(creneau.debut, creneau.fin)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="creneaux-jour-empty">
                                Aucun créneau
                              </div>
                            )}
                            
                            <div className="creneaux-jour-count">
                              {creneauxJour.length} séance(s)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : hasSeances ? (
                    <div>
                      <div className="creneaux-info-seances">
                        <div className="info-icon">ℹ️</div>
                        <div className="info-text">
                          <strong>Séances détectées automatiquement</strong>
                          <p>
                            Cette classe a {totalSeances} séance(s) programmée(s) cette semaine. 
                          </p>
                        </div>
                        <button
                          onClick={() => ouvrirModalCreneaux(coursId)}
                          className="configure-button-inline"
                        >
                          <Settings size={14} />
                          Configurer des créneaux
                        </button>
                      </div>
                      
                      {/* Afficher les séances par jour */}
                      <div className="seances-detected-grid">
                        {jours.map(jour => {
                          // Récupérer toutes les séances pour ce jour
                          const seancesJour = [];
                          if (emploiDuTemps[coursId]) {
                            Object.keys(emploiDuTemps[coursId]).forEach(key => {
                              // key format: "Lundi-08:00-10:00"
                              const parties = key.split('-');
                              if (parties.length >= 3) {
                                const keyJour = parties[0];
                                const debut = parties[parties.length - 2];
                                const fin = parties[parties.length - 1];
                                
                                if (keyJour === jour) {
                                  seancesJour.push({ debut, fin });
                                }
                              }
                            });
                          }
                          
                          // Trier les séances par heure
                          seancesJour.sort((a, b) => a.debut.localeCompare(b.debut));
                          
                          return (
                            <div key={jour} className="seance-detected-jour">
                              <div className="seance-detected-jour-title">
                                {jour}
                              </div>
                              
                              {seancesJour.length > 0 ? (
                                <div className="seance-detected-jour-list">
                                  {seancesJour.map((seance, index) => (
                                    <span key={index} className="seance-detected-item">
                                      {genererLabel(seance.debut, seance.fin)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="seance-detected-jour-empty">
                                  Aucune séance
                                </div>
                              )}
                              
                              <div className="seance-detected-jour-count">
                                {seancesJour.length} séance(s)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div style={{ 
                        fontSize: '11px', 
                        marginTop: '10px', 
                        padding: '10px', 
                        background: '#fff9e6',
                        borderRadius: '6px',
                        color: '#856404'
                      }}>
                        💡 <strong>Astuce :</strong> Configurez des créneaux fixes pour définir votre planning hebdomadaire standard.
                      </div>
                    </div>
                  ) : (
                    <div className="creneaux-empty-state">
                      <div className="empty-icon">📅</div>
                      <div className="empty-text">
                        Aucune séance ni créneau pour cette semaine
                      </div>
                      <button
                        onClick={() => ouvrirModalCreneaux(coursId)}
                        className="configure-button-inline"
                      >
                        <Settings size={14} />
                        Configurer maintenant
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="creneaux-help">
              💡 <strong>Info :</strong> Les séances s'affichent automatiquement. 
              Configurez des créneaux fixes pour mieux organiser votre emploi du temps.
            </div>
          </div>
        )}

        {selectedCours.length > 0 && (
          <div className="text-center" style={{ marginTop: '25px' }}>
            <button className="download-button" onClick={() => {}}>
              <Download size={18} />
              Télécharger l'emploi du temps
            </button>
          </div>
        )}
        {selectedCours.length > 0 && (
          <div className="text-center" style={{ marginTop: '25px' }}>
            <button className="download-button" onClick={() => {}}>
              <Download size={18} />
              Télécharger l'emploi du temps
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tableaux pour chaque cours sélectionné - MODIFIÉ pour jour par jour */}
      {selectedCours.map(coursId => {
        const cours = coursList.find(c => c._id === coursId);
        if (!cours) return null;

        return (
          <div key={coursId} className="table-container">
            <div className="table-actions">
              <div className="course-title">
                <Calendar size={18} />
                Séances: {cours.nom}
              </div>
              
              <div className="flex" style={{alignItems: 'center', gap: '10px'}}>
                <span className="text-sm">
                  Semaine du {formatDate(weekDates[0])}
                </span>
                <button 
                  className="refresh-button"
                  onClick={fetchSeancesReelles}
                >
                  <RefreshCw size={14} />
                  Actualiser
                </button>
              </div>
            </div>
            
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Horaires</th>
                    {jours.map((jour, index) => (
                      <th key={jour}>
                        {jour}<br />
                        <small>{formatDate(weekDates[index])}</small>
                        <div style={{
                          fontSize: '10px',
                          marginTop: '4px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          padding: '2px 6px',
                          borderRadius: '8px'
                        }}>
                          {getCreneauxPourJour(coursId, jour).length} créneaux
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
           

           <tbody>
  {(() => {
    // SOLUTION COMPLÈTE : Fusionner créneaux configurés ET séances existantes
    const tousLesCreneauxMap = new Map();
    
    // ÉTAPE 1 : Récupérer TOUTES les séances existantes pour ce cours
    if (emploiDuTemps[coursId]) {
      Object.keys(emploiDuTemps[coursId]).forEach(seanceKey => {
        // Format: "Lundi-08:00-10:00" ou "Mardi-14:30-16:30"
        const parties = seanceKey.split('-');
        if (parties.length >= 3) {
          // Extraire les heures (les 2 derniers éléments)
          const debut = parties[parties.length - 2];
          const fin = parties[parties.length - 1];
          const creneauKey = `${debut}-${fin}`;
          
          if (!tousLesCreneauxMap.has(creneauKey)) {
            tousLesCreneauxMap.set(creneauKey, {
              debut: debut,
              fin: fin,
              id: creneauKey,
              source: 'seance' // Provient d'une séance réelle
            });
          }
        }
      });
    }
    
    // ÉTAPE 2 : Ajouter les créneaux configurés (sans écraser les existants)
    jours.forEach(jour => {
      const creneauxJour = getCreneauxPourJour(coursId, jour);
      creneauxJour.forEach(creneau => {
        const creneauKey = `${creneau.debut}-${creneau.fin}`;
        if (!tousLesCreneauxMap.has(creneauKey)) {
          tousLesCreneauxMap.set(creneauKey, {
            ...creneau,
            source: 'config' // Provient de la configuration
          });
        }
      });
    });
    
    // Convertir en tableau et trier par heure de début
    const tousLesCreneaux = Array.from(tousLesCreneauxMap.values())
      .sort((a, b) => a.debut.localeCompare(b.debut));
    
    // Si aucun créneau (ni configuré ni séance), afficher message
    if (tousLesCreneaux.length === 0) {
      return (
        <tr>
          <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
            <div className="empty-state">
              Aucun créneau configuré et aucune séance existante.
              <br />
              Cliquez sur "Configurer les heures" pour définir vos créneaux horaires.
            </div>
          </td>
        </tr>
      );
    }
    
    return tousLesCreneaux.map(creneauRef => (
      <tr key={`${creneauRef.debut}-${creneauRef.fin}`}>
        <td className="time-cell">
          {genererLabel(creneauRef.debut, creneauRef.fin)}
          {/* Badge pour voir la source du créneau (debug) */}
          {process.env.NODE_ENV === 'development' && (
            <small style={{ display: 'block', fontSize: '9px', color: '#888' }}>
              {creneauRef.source === 'seance' ? '(séance)' : '(config)'}
            </small>
          )}
        </td>
        {jours.map(jour => {
          const key = `${jour}-${creneauRef.debut}-${creneauRef.fin}`;
          const seanceData = emploiDuTemps[coursId]?.[key];
          
          // Vérifier si ce jour a ce créneau dans la configuration
          const creneauxJour = getCreneauxPourJour(coursId, jour);
          const creneauExiste = creneauxJour.some(c => 
            c.debut === creneauRef.debut && c.fin === creneauRef.fin
          );
          
          // LOGIQUE D'AFFICHAGE:
          // 1. Si séance existe → toujours afficher
          // 2. Si pas de séance MAIS créneau configuré → afficher "Ajouter"
          // 3. Si pas de séance ET pas configuré → afficher "Pas de cours"
          
          const aSeance = seanceData && (seanceData.seanceId || seanceData.professeur);
          
          return (
            <td key={jour} className={`cell ${!creneauExiste && !aSeance ? 'cell-disabled' : ''}`}>
              {/* CAS 1: Séance existante (lecture seule) */}
              {aSeance && editing?.coursId !== coursId && editing?.key !== key ? (
                <div className="cell-content-readonly">
                  <div className="professor-name">
                    {profList.find(p => p._id === seanceData.professeur)?.nom || '—'}
                  </div>
                  {seanceData.matiere && (
                    <div className="matiere-info">
                      {seanceData.matiere}
                    </div>
                  )}
                  {seanceData.salle && (
                    <div className="salle-info">
                      Salle: {seanceData.salle}
                    </div>
                  )}
                  <div style={{ fontSize: '9px', marginTop: '4px' }}>
                    <span className={`status-badge ${seanceData.actif ? 'status-active' : 'status-inactive'}`}>
                      {seanceData.typeSeance || 'reelle'}
                    </span>
                  </div>
                  {seanceData.actif === false && (
                    <div className="canceled-label">
                      ANNULÉ
                    </div>
                  )}

                  <div className="cell-actions">
                    <button
                      className="action-button edit"
                      onClick={() => startEdit(coursId, jour, creneauRef)}
                    >
                      <Edit size={8} />
                      Modifier
                    </button>

                    <button
                      className="action-button history"
                      onClick={() => {
                        setSelectedSeanceForHistory(seanceData.seanceId);
                        setShowHistorique(true);
                      }}
                      title="Voir l'historique de cette séance"
                    >
                      <Clock size={8} />
                      Historique
                    </button>

                    <button
                      className="action-button delete"
                      onClick={() => deleteSeance(coursId, jour, creneauRef, seanceData)}
                      title="Supprimer cette séance"
                    >
                      <Trash2 size={8} />
                      Supprimer
                    </button>

                    <button
                      className="action-button rattrapage"
                      onClick={() => marquerRattrapage(coursId, jour, creneauRef, seanceData)}
                      title="Marquer comme rattrapage"
                    >
                      Rattrapage
                    </button>
                  </div>
                </div>
              ) : null}

              {/* CAS 2: Mode édition */}
              {editing?.coursId === coursId && editing?.key === key && (
                <div className="cell-content-edit">
                  <select
                    className="form-select"
                    value={seanceData?.professeur || ''}
                    onChange={(e) => updateCase(coursId, jour, creneauRef, 'professeur', e.target.value)}
                  >
                    <option value="">-- Professeur --</option>
                    {getProfesseursPourCours(coursId).map(prof => (
                      <option key={prof._id} value={prof._id}>
                        {prof.nom} {prof.estPermanent ? '(Permanent)' : '(Entrepreneur)'}
                      </option>
                    ))}
                  </select>

                  {seanceData?.professeur ? (
                    (() => {
                      const mats = getMatieresProfesseurPourCours(seanceData.professeur, coursId);
                      return mats.length > 0 ? (
                        <select
                          className="form-select"
                          value={seanceData.matiere || ''}
                          onChange={(e) => updateCase(coursId, jour, creneauRef, 'matiere', e.target.value)}
                        >
                          <option value="">-- Matière --</option>
                          {mats.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      ) : (
                        <input
                          className="form-input"
                          placeholder="Matière..."
                          value={seanceData.matiere || ''}
                          onChange={(e) => updateCase(coursId, jour, creneauRef, 'matiere', e.target.value)}
                        />
                      );
                    })()
                  ) : (
                    <input
                      className="form-input disabled"
                      placeholder="Sélectionnez d'abord un professeur"
                      value=""
                      disabled
                    />
                  )}

                  <input
                    className="form-input"
                    placeholder="Salle..."
                    value={seanceData?.salle || ''}
                    onChange={(e) => updateCase(coursId, jour, creneauRef, 'salle', e.target.value)}
                  />

                  <div className="form-actions">
                    <button
                      className="form-button save"
                      onClick={() => saveEdit(coursId, jour, creneauRef)}
                    >
                      <Save size={10} />
                      Enregistrer
                    </button>
                    <button
                      className="form-button cancel"
                      onClick={cancelEdit}
                    >
                      <X size={10} />
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* CAS 3: Bouton "Ajouter" (seulement si créneau configuré ET pas de séance) */}
              {!aSeance && editing?.coursId !== coursId && editing?.key !== key && creneauExiste && (
                <div style={{ textAlign: 'center' }}>
                  <button
                    className="add-button"
                    onClick={() => startEdit(coursId, jour, creneauRef)}
                  >
                    <Plus size={12} />
                    Ajouter séance
                  </button>
                </div>
              )}

              {/* CAS 4: Cellule désactivée (pas de créneau configuré, pas de séance) */}
              {!aSeance && !creneauExiste && editing?.coursId !== coursId && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  fontSize: '11px',
                  padding: '10px'
                }}>
                  Pas de cours
                </div>
              )}
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
        );
      })}

      {/* États vides */}
      {selectedCours.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">
            Consulter l'Emploi du Temps
          </div>
          <div className="empty-state-description">
            Sélectionnez une classe ci-dessus pour voir ses séances programmées.
          </div>
          
          <div className="empty-state-features">
            <div className="features-title">
              Fonctionnalités disponibles
            </div>
            <div className="features-list">
              • <strong>Consulter</strong> les séances de la semaine<br/>
              • <strong>Modifier</strong> une séance existante<br/>
              • <strong>Ajouter</strong> une nouvelle séance<br/>
              • <strong>Supprimer</strong> une séance<br/>
              • <strong>Configurer</strong> les créneaux horaires par jour<br/>
              • <strong>Télécharger</strong> l'emploi du temps
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {selectedCours.length > 0 && (
        <div className="instructions">
          <h4>
            📋 Mode Consultation et Modification
          </h4>
          <div className="instructions-content">
            • Cliquez sur <strong>"Configurer les heures"</strong> pour personnaliser vos créneaux par jour (ex: Lundi 4 créneaux, Mardi 2 créneaux)<br/>
            • Cliquez sur <strong>"Modifier"</strong> pour changer les détails d'une séance<br/>
            • Cliquez sur <strong>"Ajouter séance"</strong> dans une case vide pour créer une nouvelle séance<br/>
            • <strong>IMPORTANT</strong> : Professeur et matière sont OBLIGATOIRES pour sauvegarder<br/>
            • Cliquez sur <strong>"Supprimer"</strong> pour effacer définitivement une séance<br/>
            • Les créneaux horaires sont maintenant configurables semaine par semaine
          </div>
        </div>
      )}

      {/* Modal pour configurer les créneaux */}
      <ModalCreneaux />

      {/* Modal Statistiques Rattrapages */}
      {showStatsRattrapages && (
        <div className="modal-overlay">
          <div className="modal-content-large">
            <h3>📊 Statistiques des Rattrapages</h3>
            
            {loadingStats ? (
              <div className="loading-stats">
                <div>Chargement des statistiques...</div>
              </div>
            ) : (
              <div>
                {statsRattrapages.map(stat => (
                  <div key={stat._id} className={`stat-card ${stat.seancesRattrapage > 0 ? 'has-rattrapage' : ''}`}>
                    <div className="stat-header">
                      {stat.nomProfesseur}
                    </div>
                    
                    <div className="stat-grid">
                      <div className="stat-item">
                        <div className="stat-label">Total séances:</div>
                        <div className="stat-value">{stat.totalSeances}</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-label">Séances normales:</div>
                        <div className="stat-value normal">{stat.seancesNormales}</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-label">Rattrapages requis:</div>
                        <div className="stat-value rattrapage">{stat.seancesRattrapage}</div>
                      </div>
                    </div>
                    
                    {stat.totalSeances > 0 && (
                      <div className="stat-taux">
                        <span>Taux de présence: <strong>{Math.round((stat.seancesNormales / stat.totalSeances) * 100)}%</strong></span>
                        <span>Taux de rattrapage: <strong className="rattrapage">{stat.pourcentageRattrapages || Math.round((stat.seancesRattrapage / stat.totalSeances) * 100)}%</strong></span>
                      </div>
                    )}
                  </div>
                ))}
                
                {statsRattrapages.length === 0 && (
                  <div className="empty-stats">
                    <div>📊</div>
                    <div>Aucune donnée de rattrapage disponible</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="modal-footer">
              <button
                onClick={() => setShowStatsRattrapages(false)}
                className="modal-button cancel"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      <HistoriqueModal
        show={showHistorique}
        onClose={() => setShowHistorique(false)}
        seanceId={selectedSeanceForHistory}
      />
    </div>
  );
};

export default EmploiPedagogique;