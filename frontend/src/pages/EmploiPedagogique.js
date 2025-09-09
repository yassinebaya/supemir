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
  Shield,
  Info,
  User
} from 'lucide-react';
import Sidebar from '../components/Sidebar'; // ✅ ا
 const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const EmploiPedagogique = () => {
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
  
  // États spécifiques aux pédagogiques
  const [userInfo, setUserInfo] = useState(null);
  const [permissions, setPermissions] = useState({
    canModify: false,
    canCreate: false,
    canDelete: false,
    filiere: null,
    isGeneral: false
  });
  
  // États pour la copie de semaine
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
  const [semainesDisponibles, setSemainesDisponibles] = useState([]);
  const [semaineSource, setSemaineSource] = useState('');
  const [semaineDestination, setSemaineDestination] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [showSelectWeek, setShowSelectWeek] = useState(false);
  const [semaineSelectionnee, setSemaineSelectionnee] = useState('');

  // États pour les rattrapages
  const [showStatsRattrapages, setShowStatsRattrapages] = useState(false);
  const [statsRattrapages, setStatsRattrapages] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

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

  // Charger les informations de l'utilisateur et ses permissions
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
        
        // Déterminer les permissions selon le type de pédagogique
        const isGeneral = userData.filiere === 'GENERAL' || userData.role === 'pedagogique_general';
        setPermissions({
          canModify: true,
          canCreate: true,
          canDelete: true, // ✅ CHANGEMENT: Permettre la suppression pour tous les pédagogiques
          filiere: userData.filiere,
          isGeneral: isGeneral
        });
        
        console.log('👤 Utilisateur connecté:', {
          nom: userData.nom,
          filiere: userData.filiere,
          role: userData.role,
          isGeneral,
          canDelete: true // ✅ AJOUT: Log pour vérifier
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
      
      // Récupérer les cours filtrés par filière pour les pédagogiques
      const coursUrl = permissions.isGeneral 
        ? 'http://195.179.229.230:5000/api/cours'
        : 'http://195.179.229.230:5000/api/pedagogique/cours';
        
      const resCours = await fetch(coursUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resCours.ok) {
        const coursData = await resCours.json();
        setCoursList(coursData);
        console.log(`📚 ${coursData.length} cours chargés pour la filière ${userInfo.filiere || 'TOUTES'}`);
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
      
      console.log('🔍 Récupération séances pédagogique pour:', lundiSemaine);
      
      // Utiliser l'endpoint pédagogique avec filtrage automatique
      const url = permissions.isGeneral 
        ? `http://195.179.229.230:5000/api/pedagogique/seances/semaine/${lundiSemaine}/toutes`
        : `http://195.179.229.230:5000/api/pedagogique/seances/semaine/${lundiSemaine}`;
        
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Séances pédagogique reçues:', data.length);
        
        setSeancesReelles(data);
        
        if (coursList.length > 0 && data.length > 0) {
          organiserSeances(data);
          setMessage({ 
            type: 'success', 
            text: `${data.length} séances chargées pour votre filière (${userInfo.filiere || 'TOUTES'})` 
          });
        } else if (data.length === 0) {
          setEmploiDuTemps({});
          setMessage({ 
            type: 'warning', 
            text: `Aucune séance trouvée pour votre filière cette semaine` 
          });
        }
      } else {
        console.error('❌ Erreur HTTP:', res.status);
        setMessage({ type: 'error', text: `Erreur ${res.status} lors du chargement` });
      }
    } catch (err) {
      console.error('❌ Erreur réseau:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    }
    
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const organiserSeances = (seancesData) => {
    const emploi = {};
    
    seancesData.forEach((seance, index) => {
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
        console.warn(`⚠️ Cours non trouvé pour la séance:`, seance);
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
        dateSeance: seance.dateSeance,
        creePar: seance.creePar || null, // Info de traçabilité
        modifiePar: seance.modifiePar || null,
        dateModification: seance.dateModification || null
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
    if (!permissions.canModify) {
      setMessage({ 
        type: 'error', 
        text: 'Vous n\'avez pas les permissions pour modifier les séances' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

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
    
    // ✅ CORRECTION : Récupérer le nom du cours à partir de l'ID
    const coursObj = coursList.find(c => c._id === coursId);
    if (!coursObj) {
      setMessage({ type: 'error', text: 'Cours introuvable' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    const payload = {
      cours: coursObj.nom,  // ✅ Envoyer le NOM du cours au lieu de l'ID
      professeur: s.professeur,
      matiere: s.matiere,
      salle: s.salle || '',
      dateSeance: dateISO,
      jour,
      heureDebut: creneau.debut,
      heureFin: creneau.fin
    };

    console.log('✅ Sauvegarde pédagogique:', payload);

    let res;
    if (s.typeSeance === 'exception' && s.seanceId) {
      // Mise à jour via l'API pédagogique
      res = await fetch(`http://195.179.229.230:5000/api/pedagogique/seances/${s.seanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } else {
      // Création via l'API pédagogique
      res = await fetch('http://195.179.229.230:5000/api/pedagogique/seances/exception', {
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
    console.log('✅ Séance sauvegardée par pédagogique:', result);

    setMessage({ type: 'success', text: 'Séance sauvegardée avec succès' });
    setEditing(null);
    await fetchSeancesReelles();

  } catch (e) {
    console.error('❌ Erreur:', e);
    setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
  } finally {
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }
};

  const deleteSeance = async (coursId, jour, creneau, seanceData) => {
    // ✅ CHANGEMENT: Simplifier la vérification des permissions
    if (!permissions.canDelete) {
      setMessage({ 
        type: 'error', 
        text: 'Vous n\'avez pas les permissions pour supprimer des séances' 
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

    if (!window.confirm('Supprimer définitivement cette séance ?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://195.179.229.230:5000/api/pedagogique/seances/${seanceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Séance supprimée avec succès' });
        await fetchSeancesReelles();
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: `Erreur: ${errorData.error}` });
      }
    } catch (e) {
      console.error('Erreur suppression:', e);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
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

  // Fonctions de copie adaptées aux pédagogiques
  const fetchSemainesDisponibles = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = permissions.isGeneral 
        ? 'http://195.179.229.230:5000/api/pedagogique/seances/semaines-disponibles/toutes'
        : 'http://195.179.229.230:5000/api/pedagogique/seances/semaines-disponibles';
        
      const res = await fetch(url, {
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

  const copierSemaine = async () => {
    if (!semaineSource || !semaineDestination) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner les semaines source et destination' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setCopyLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/pedagogique/seances/copier-semaine', {
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
          text: `${result.seancesCrees} séances copiées avec succès` 
        });
        
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

  // Fonction pour copier la semaine précédente (corrigée)
  const copierSemainePrecedente = async () => {
    const lundiActuel = weekDates[0].toISOString().split('T')[0];
    if (!window.confirm('Copier toutes les séances de la semaine précédente vers la semaine actuelle ?')) {
      return;
    }
    setCopyLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ CORRECTION: Utiliser l'API standard au lieu de l'API pédagogique
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

  // Fonction pour charger les semaines disponibles (corrigée)
  const chargerSemaines = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // ✅ CORRECTION: Utiliser l'API standard 
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

  // Fonction pour copier depuis une semaine choisie (corrigée)
  const copierDepuisSemaine = async () => {
    if (!semaineSelectionnee) return;
    setCopyLoading(true);
    setShowSelectWeek(false);
    try {
      const token = localStorage.getItem('token');
      const lundiActuel = weekDates[0].toISOString().split('T')[0];
      
      // ✅ CORRECTION: Utiliser l'API standard
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

    let csvContent = `Emploi du Temps Pédagogique - ${userInfo?.nom || 'Utilisateur'}\n`;
    csvContent += `Filière: ${userInfo?.filiere || 'Non spécifiée'}\n`;
    csvContent += `Semaine du ${formatDate(weekDates[0])} au ${formatDate(weekDates[5])}\n\n`;
    
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
          const modification = seanceData.modifiePar ? ' [MODIFIÉ]' : '';
          
          csvContent += `"${profNom}${matiere ? ' - ' + matiere : ''}${salle ? ' (Salle: ' + salle + ')' : ''}${statut}${modification}";`;
        });
        csvContent += '\n';
      });
      
      csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `emploi_pedagogique_${formatDate(weekDates[0]).replace('/', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({ type: 'success', text: 'Emploi du temps téléchargé avec succès !' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const styles = {
    container: {
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 25%, #f3e8ff 100%)', // Vert au lieu de bleu
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
      textAlign: 'center',
      position: 'relative'
    },
    userInfo: {
      position: 'absolute',
      top: '15px',
      right: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: '#059669',
      backgroundColor: '#d1fae5',
      padding: '6px 12px',
      borderRadius: '6px'
    },
    permissionsBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '11px',
      padding: '4px 8px',
      borderRadius: '4px',
      marginTop: '4px'
    },
    permissionsGeneral: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    permissionsSpecific: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
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
      backgroundColor: '#d1fae5', // Vert au lieu de bleu
      borderColor: '#059669',
      color: '#065f46'
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
      backgroundColor: '#059669', // Vert au lieu d'orange
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
      backgroundColor: '#059669', // Vert au lieu d'orange
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
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
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
      backgroundColor: '#059669', // Vert au lieu de gris
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
      backgroundColor: '#059669', // Vert au lieu de bleu
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
    cellContentModified: {
      backgroundColor: '#fef3c7', // Jaune pour les séances modifiées par pédagogiques
      border: '1px solid #f59e0b'
    },
    cellContentRattrapage: {
      backgroundColor: '#fee2e2', // Rouge clair
      border: '2px solid #dc2626',
      borderRadius: '4px',
      padding: '8px',
      fontSize: '11px',
      color: '#991b1b',
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
      backgroundColor: '#d1fae5', // Vert au lieu de bleu
      color: '#065f46',
      border: '1px solid #10b981'
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
      backgroundColor: '#e0f2fe',
      color: '#0891b2',
      border: '1px solid #67e8f9'
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
    },
    statusModified: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    }
  };

  // Modal de copie de semaine adapté
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
          
          {/* Avertissement pour les permissions */}
          {!permissions.isGeneral && (
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '13px',
              color: '#92400e',
              border: '1px solid #fbbf24'
            }}>
              <Info size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Seules les séances de votre filière ({userInfo?.filiere}) seront copiées.
            </div>
          )}
          
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
                backgroundColor: copyLoading || !semaineSource || !semaineDestination ? '#9ca3af' : '#059669',
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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div>Chargement de l'emploi du temps pédagogique...</div>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Vérification des permissions et chargement des données
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div>Erreur d'authentification</div>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Impossible de récupérer les informations utilisateur
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
              <Sidebar onLogout={handleLogout} />
        
      <div style={styles.header}>
        {/* Informations utilisateur */}
        <div style={styles.userInfo}>
          <User size={16} />
          <div>
            <div style={{ fontWeight: '600' }}>{userInfo.nom}</div>
            <div style={permissions.isGeneral ? styles.permissionsGeneral : styles.permissionsSpecific}>
              <Shield size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {permissions.isGeneral ? 'Pédagogique Général' : `Filière ${userInfo.filiere}`}
            </div>
          </div>
        </div>

        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#065f46' }}>
          <Calendar size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Emploi du Temps Pédagogique
        </h1>
        
        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
          Interface dédiée aux responsables pédagogiques
        </div>
      </div>

      <div style={styles.controls}>
        {/* Information sur les permissions */}
        <div style={{
          backgroundColor: permissions.isGeneral ? '#fef3c7' : '#e0f2fe',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: `1px solid ${permissions.isGeneral ? '#fbbf24' : '#67e8f9'}`
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
            Vos permissions :
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {permissions.isGeneral ? (
              <>Accès à toutes les filières • Modification • Création • Suppression</>
            ) : (
              <>Filière {userInfo.filiere} uniquement • Modification • Création</>
            )}
          </div>
        </div>

        {/* Sélection des cours */}
        <div style={styles.coursSelection}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
            {permissions.isGeneral ? 
              'Sélectionner les classes à afficher :' : 
              `Classes de votre filière (${userInfo.filiere}) :`
            }
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
                {cours.typeFormation && (
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    {cours.typeFormation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation des semaines avec 2 boutons de copie seulement */}
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
          
          {/* SEULEMENT 2 BOUTONS DE COPIE */}
          <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
            {/* Bouton 1: Copier semaine précédente */}
            <button 
              style={{
                ...styles.weekButton,
                backgroundColor: copyLoading ? '#9ca3af' : '#10b981',
                cursor: (!permissions.canCreate || copyLoading) ? 'not-allowed' : 'pointer',
                opacity: !permissions.canCreate ? 0.5 : 1
              }}
              onClick={copierSemainePrecedente}
              disabled={copyLoading || !permissions.canCreate}
              title={!permissions.canCreate ? "Vous n'avez pas les permissions pour copier des semaines" : ""}
            >
              {copyLoading ? 'Copie...' : 'Copier Semaine -1'}
            </button>
            
            {/* Bouton 2: Choisir semaine à copier */}
            <button 
              style={{
                ...styles.weekButton,
                backgroundColor: '#8b5cf6',
                opacity: permissions.canCreate ? 1 : 0.5,
                cursor: permissions.canCreate ? 'pointer' : 'not-allowed'
              }}
              onClick={chargerSemaines}
              disabled={!permissions.canCreate}
              title={!permissions.canCreate ? "Vous n'avez pas les permissions pour copier des semaines" : ""}
            >
              Choisir Semaine
            </button>
            
            {/* Bouton statistiques rattrapages */}
            <button 
              style={{
                ...styles.weekButton,
                backgroundColor: '#f59e0b'
              }}
              onClick={() => {
                setShowStatsRattrapages(true);
                fetchStatsRattrapages();
              }}
            >
              Stats Rattrapages
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
                {cours.nom}
                {cours.typeFormation && (
                  <span style={{ 
                    fontSize: '12px', 
                    backgroundColor: '#e0f2fe', 
                    color: '#0891b2',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {cours.typeFormation}
                  </span>
                )}
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
                        const isModified = seanceData.modifiePar || seanceData.creePar;
                        
                        return (
                          <td key={jour} style={styles.cell}>
                            {/* Affichage spécial pour les séances en rattrapage */}
                            {seanceData.typeSeance === 'rattrapage' ? (
                              <div style={{
                                backgroundColor: '#fee2e2', // Rouge clair
                                border: '2px solid #dc2626',
                                borderRadius: '4px',
                                padding: '8px',
                                fontSize: '11px',
                                color: '#991b1b',
                                height: '100%'
                              }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#dc2626' }}>
                                  {profList.find(p => p._id === seanceData.professeur)?.nom || '—'}
                                </div>
                                <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>
                                  À RATTRAPER
                                </div>
                                {seanceData.matiere && (
                                  <div style={{ marginBottom: '2px', fontSize: '10px', color: '#7c2d12' }}>
                                    📚 {seanceData.matiere}
                                  </div>
                                )}
                                {seanceData.salle && (
                                  <div style={{ marginBottom: '2px', fontSize: '10px', color: '#7c2d12' }}>
                                    🏛️ Salle: {seanceData.salle}
                                  </div>
                                )}
                                <div style={{ fontSize: '9px', marginTop: '4px', backgroundColor: '#dc2626', color: 'white', padding: '2px 4px', borderRadius: '2px', textAlign: 'center' }}>
                                  RATTRAPAGE REQUIS
                                </div>
                                {seanceData.notes && (
                                  <div style={{ fontSize: '8px', marginTop: '4px', fontStyle: 'italic', color: '#7c2d12' }}>
                                    {seanceData.notes}
                                  </div>
                                )}
                              </div>
                            ) : 
                            /* Affichage en lecture seule */
                            ((seanceData.seanceId || seanceData.typeSeance) && editing?.coursId !== coursId && editing?.key !== key) ? (
                              <div style={{
                                ...styles.cellContentReadOnly,
                                ...(isModified ? styles.cellContentModified : {})
                              }}>
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
                                  {isModified && (
                                    <span style={{
                                      ...styles.statusBadge,
                                      ...styles.statusModified,
                                      marginLeft: '4px'
                                    }}>
                                      MODIFIÉ
                                    </span>
                                  )}
                                </div>
                                {seanceData.actif === false && (
                                  <div style={{ fontSize: '9px', color: '#dc2626', marginTop: '2px' }}>
                                    ANNULÉ
                                  </div>
                                )}

                                {/* Boutons d'action avec permissions */}
                                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  {permissions.canModify && (
                                    <button
                                      style={{ 
                                        fontSize: '10px', 
                                        padding: '3px 6px', 
                                        borderRadius: '3px', 
                                        border: '1px solid #059669', 
                                        cursor: 'pointer',
                                        backgroundColor: '#059669',
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
                                  )}

                                  {permissions.canDelete && (
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
                                  )}

                                  {permissions.canModify && seanceData.typeSeance !== 'rattrapage' && (
                                    <button
                                      style={{
                                        fontSize: '10px',
                                        padding: '3px 6px',
                                        borderRadius: '3px',
                                        border: '1px solid #f59e0b',
                                        background: '#f59e0b',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '3px'
                                      }}
                                      onClick={() => marquerRattrapage(coursId, jour, creneau, seanceData)}
                                      title="Marquer comme rattrapage"
                                    >
                                      Rattrapage
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Bouton Ajouter si pas de séance et permissions */
                              editing?.coursId !== coursId && editing?.key !== key && permissions.canCreate && (
                                <div style={{ textAlign: 'center' }}>
                                  <button
                                    style={{ 
                                      fontSize: 11, 
                                      padding: '8px 12px', 
                                      borderRadius: 4, 
                                      border: '2px dashed #10b981', 
                                      cursor: 'pointer',
                                      backgroundColor: '#f0fdf4',
                                      color: '#065f46',
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

                            {/* Mode édition */}
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
                            
                            {/* Message pour cases vides sans permissions */}
                            {!seanceData.seanceId && !seanceData.typeSeance && editing?.coursId !== coursId && editing?.key !== key && !permissions.canCreate && (
                              <div style={{ 
                                textAlign: 'center', 
                                color: '#9ca3af', 
                                fontSize: '11px',
                                padding: '20px 8px'
                              }}>
                                Aucune séance
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
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📚</div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            Interface Pédagogique
          </div>
          <div>
            {permissions.isGeneral ? 
              'Sélectionnez une classe ci-dessus pour consulter son emploi du temps.' :
              `Sélectionnez une classe de votre filière (${userInfo.filiere}) pour consulter son emploi du temps.`
            }
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #10b981'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#065f46' }}>
              Fonctionnalités disponibles
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#374151' }}>
              {permissions.canModify && '• Modifier les séances existantes'}<br/>
              {permissions.canCreate && '• Créer de nouvelles séances (exceptions)'}<br/>
              {permissions.canDelete && '• Supprimer des séances'}<br/>
              • Télécharger l'emploi du temps<br/>
              • Copier des semaines d'emploi du temps
            </div>
          </div>
        </div>
      )}

      {/* Instructions adaptées aux pédagogiques */}
      {selectedCours.length > 0 && (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '14px' }}>
            📋 Interface Pédagogique - Mode {permissions.isGeneral ? 'Général' : 'Filière'}
          </h4>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
            {permissions.canModify && (
              <>• Cliquez sur <strong>"Modifier"</strong> pour ajuster les détails d'une séance<br/></>
            )}
            {permissions.canCreate && (
              <>• Cliquez sur <strong>"Ajouter séance"</strong> pour créer une exception ponctuelle<br/></>
            )}
            • <strong>OBLIGATOIRE</strong> : Professeur et matière requis pour sauvegarder<br/>
            {permissions.canDelete && (
              <>• <strong>"Supprimer"</strong> efface définitivement une séance<br/></>
            )}
            • Les modifications créent des <strong>exceptions</strong> marquées "MODIFIÉ"<br/>
            {!permissions.isGeneral && (
              <>• <strong>Restriction</strong> : Accès limité aux cours de votre filière ({userInfo.filiere})<br/></>
            )}
            • Toutes vos actions sont tracées pour la gestion pédagogique
          </div>
        </div>
      )}

      {/* Modal Copier Semaine */}
      <ModalCopierSemaine />

      {/* Modal Statistiques Rattrapages AMÉLIORÉ */}
      {showStatsRattrapages && (
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
            padding: '25px',
            borderRadius: '10px',
            width: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Statistiques des Rattrapages</h3>
            
            {loadingStats ? (
              <div>Chargement...</div>
            ) : (
              <div>
                {statsRattrapages.map(stat => (
                  <div key={stat._id} style={{
                    padding: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    backgroundColor: stat.seancesRattrapage > 0 ? '#fef2f2' : '#f9fafb'
                  }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      marginBottom: '10px',
                      fontSize: '16px',
                      color: stat.seancesRattrapage > 0 ? '#dc2626' : '#374151'
                    }}>
                      {stat.nomProfesseur}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Total séances:</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stat.totalSeances}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#10b981' }}>Séances normales:</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{stat.seancesNormales}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#dc2626' }}>Rattrapages requis:</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>{stat.seancesRattrapage}</div>
                      </div>
                    </div>
                    
                    {stat.totalSeances > 0 && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        marginBottom: '10px',
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px'
                      }}>
                        Taux de présence: <strong>{Math.round((stat.seancesNormales / stat.totalSeances) * 100)}%</strong>
                      </div>
                    )}
                    
                    {/* NOUVEAU : Détails des rattrapages */}
                    {stat.detailsRattrapages && stat.detailsRattrapages.length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
                          Détails des séances à rattraper:
                        </div>
                        {stat.detailsRattrapages.map((detail, index) => (
                          <div key={index} style={{
                            padding: '8px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            marginBottom: '5px',
                            fontSize: '12px'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#991b1b' }}>
                              {detail.cours} - {detail.matiere}
                            </div>
                            <div style={{ color: '#7c2d12' }}>
                              {detail.jour} {detail.heureDebut}-{detail.heureFin}
                              {detail.salle && ` | Salle: ${detail.salle}`}
                            </div>
                            <div style={{ color: '#7c2d12', fontSize: '11px', marginTop: '2px' }}>
                              Date: {new Date(detail.dateSeance).toLocaleDateString('fr-FR')}
                            </div>
                            {detail.notes && (
                              <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#6b7280', marginTop: '4px' }}>
                                {detail.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {statsRattrapages.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280'
                  }}>
                    Aucune donnée de rattrapage disponible
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => setShowStatsRattrapages(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal simple de sélection de semaine */}
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
            width: '500px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#065f46' }}>
              Choisir la semaine à copier
            </h3>
            
            <select
              value={semaineSelectionnee}
              onChange={(e) => setSemaineSelectionnee(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">-- Sélectionner une semaine --</option>
              {semainesDisponibles.map((semaine, index) => (
                <option key={index} value={semaine.lundi}>
                  {semaine.label}
                </option>
              ))}
            </select>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowSelectWeek(false);
                  setSemaineSelectionnee('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Annuler
              </button>
              <button
                onClick={copierDepuisSemaine}
                disabled={!semaineSelectionnee || copyLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!semaineSelectionnee || copyLoading) ? '#9ca3af' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!semaineSelectionnee || copyLoading) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copyLoading && (
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {copyLoading ? 'Copie en cours...' : 'Copier vers cette semaine'}
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

export default EmploiPedagogique;