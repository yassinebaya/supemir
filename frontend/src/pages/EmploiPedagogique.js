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

const EmploiPedagogique = () => {
  const [jours] = useState(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']);
  
  // Remplacer la gestion des créneaux par cours
  const [creneauxCours, setCreneauxCours] = useState({});
  const [coursCreneauxSelectionne, setCoursCreneauxSelectionne] = useState('');
  const [showCreneauxModal, setShowCreneauxModal] = useState(false);
  const [tempCreneaux, setTempCreneaux] = useState([]);
  
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // ✅ FONCTIONS POUR GÉRER LES CRÉNEAUX PERSONNALISÉS

  // Charger les créneaux personnalisés par cours depuis le localStorage
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

  // Ouvrir le modal de gestion des créneaux pour un cours
  const ouvrirModalCreneaux = (coursId) => {
    setCoursCreneauxSelectionne(coursId);
    setTempCreneaux([...creneauxCours[coursId] || []]);
    setShowCreneauxModal(true);
  };

  // Ajouter un créneau pour le cours sélectionné
  const ajouterCreneau = () => {
    const nouveauId = Math.max(...tempCreneaux.map(c => c.id), 0) + 1;
    setTempCreneaux([...tempCreneaux, {
      id: nouveauId,
      debut: '08:00',
      fin: '10:00'
    }]);
  };

  // Supprimer un créneau pour le cours sélectionné
  const supprimerCreneau = (id) => {
    if (tempCreneaux.length <= 1) {
      setMessage({ type: 'error', text: 'Il faut au moins un créneau horaire' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    setTempCreneaux(tempCreneaux.filter(c => c.id !== id));
  };

  // Modifier un créneau pour le cours sélectionné
  const modifierCreneau = (id, field, value) => {
    setTempCreneaux(tempCreneaux.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  // Valider et sauvegarder les créneaux
  const sauvegarderCreneaux = () => {
    // Validation des créneaux
    const erreurs = [];
    
    for (let i = 0; i < tempCreneaux.length; i++) {
      const creneau = tempCreneaux[i];
      
      if (!creneau.debut || !creneau.fin) {
        erreurs.push(`Créneau ${i + 1}: Heures de début et fin obligatoires`);
        continue;
      }
      
      if (creneau.debut >= creneau.fin) {
        erreurs.push(`Créneau ${i + 1}: L'heure de fin doit être après l'heure de début`);
      }
      
      // Vérifier les chevauchements
      for (let j = i + 1; j < tempCreneaux.length; j++) {
        const autreCreneau = tempCreneaux[j];
        if (creneau.debut < autreCreneau.fin && creneau.fin > autreCreneau.debut) {
          erreurs.push(`Chevauchement entre les créneaux ${i + 1} et ${j + 1}`);
        }
      }
    }
    
    if (erreurs.length > 0) {
      setMessage({ type: 'error', text: erreurs.join('. ') });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }
    
    // Trier les créneaux par heure de début
    const creneauxTries = [...tempCreneaux].sort((a, b) => a.debut.localeCompare(b.debut));
    
    // Sauvegarder
    const newCreneauxCours = { ...creneauxCours, [coursCreneauxSelectionne]: [...creneauxTries] };
    localStorage.setItem('creneauxCoursPersonnalises', JSON.stringify(newCreneauxCours));
    setCreneauxCours(newCreneauxCours);
    setShowCreneauxModal(false);
    setMessage({ type: 'success', text: 'Créneaux horaires mis à jour pour ce cours' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    
    // Recharger les données avec les nouveaux créneaux
    fetchSeancesReelles();
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

  // Corriger le useEffect pour ne pas utiliser 'creneaux' global
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
          canDelete: true,
          filiere: userData.filiere,
          isGeneral: isGeneral
        });
        
        console.log('👤 Pédagogique connecté:', {
          nom: userData.nom,
          filiere: userData.filiere,
          role: userData.role,
          isGeneral
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
      
      // ✅ UTILISER LA ROUTE SPÉCIFIQUE POUR LES PÉDAGOGIQUES
      const coursUrl = permissions.isGeneral 
        ? 'http://195.179.229.230:5000/api/cours'
        : 'http://195.179.229.230:5000/api/pedagogique/cours';
        
      console.log(`📚 Chargement cours depuis: ${coursUrl}`);
      
      const resCours = await fetch(coursUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resCours.ok) {
        const coursData = await resCours.json();
        setCoursList(coursData);
        console.log(`✅ ${coursData.length} cours chargés pour ${permissions.isGeneral ? 'toutes filières' : 'filière ' + userInfo.filiere}`);
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
      
      const res = await fetch(`http://195.179.229.230:5000/api/seances/semaine/${lundiSemaine}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Données reçues du backend:', data.length, 'séances');
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
      console.error('❌ Erreur:', e);
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

  // ✅ COMPOSANT MODAL POUR GÉRER LES CRÉNEAUX
  const ModalCreneaux = () => {
    if (!showCreneauxModal) return null;

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
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Clock size={24} />
            Configurer les créneaux horaires pour {coursList.find(c => c._id === coursCreneauxSelectionne)?.nom}
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            {tempCreneaux.map((creneau, index) => (
              <div key={creneau.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ minWidth: '70px', fontWeight: '600', color: '#374151' }}>
                  Créneau {index + 1}:
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="time"
                    value={creneau.debut}
                    onChange={(e) => modifierCreneau(creneau.id, 'debut', e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  
                  <span style={{ color: '#6b7280' }}>à</span>
                  
                  <input
                    type="time"
                    value={creneau.fin}
                    onChange={(e) => modifierCreneau(creneau.id, 'fin', e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ 
                  flex: 1, 
                  padding: '8px 12px',
                  backgroundColor: '#e0f2fe',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#0369a1',
                  textAlign: 'center'
                }}>
                  {genererLabel(creneau.debut, creneau.fin)}
                </div>
                
                <button
                  onClick={() => supprimerCreneau(creneau.id)}
                  style={{
                    padding: '6px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Supprimer ce créneau"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={ajouterCreneau}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Plus size={16} />
              Ajouter un créneau
            </button>
          </div>

          <div style={{ 
            backgroundColor: '#fef3c7',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            <strong>Conseils :</strong>
            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
              <li>Les créneaux ne doivent pas se chevaucher</li>
              <li>L'heure de fin doit être après l'heure de début</li>
              <li>Les créneaux seront automatiquement triés par heure</li>
              <li>Ces modifications affecteront tous les emplois du temps</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowCreneauxModal(false);
                setTempCreneaux([]);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Annuler
            </button>
            
            <button
              onClick={sauvegarderCreneaux}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={16} />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    );
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
      marginTop: '20px',
      flexWrap: 'wrap'
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
    creneauxButton: {
      padding: '12px 24px',
      backgroundColor: '#8b5cf6',
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
      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
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
      width: 'calc(100% / 8)',
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
        {/* Informations utilisateur */}
        {userInfo && (
          <div style={{
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
          }}>
            <div>
              <div style={{ fontWeight: '600' }}>{userInfo.nom}</div>
              <div style={{ fontSize: '11px' }}>
                {permissions.isGeneral ? 'Pédagogique Général' : `Filière ${userInfo.filiere}`}
              </div>
            </div>
          </div>
        )}

        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1f2937' }}>
          <Calendar size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Interface Pédagogique - Emploi du Temps
        </h1>
        
        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
          Gestion et consultation des emplois du temps
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
              <>Filière {userInfo?.filiere} uniquement • Modification • Création • Suppression</>
            )}
          </div>
        </div>

        {/* Sélection des cours */}
        <div style={styles.coursSelection}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
            {permissions.isGeneral ? 
              'Sélectionner les classes à afficher (toutes filières) :' : 
              `Classes de votre filière (${userInfo?.filiere}) :`
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
                {cours.filiere && (
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    {cours.filiere}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation des semaines avec bouton pour configurer les créneaux */}
        <div style={styles.weekNavigation}>
          <button style={styles.weekButton} onClick={() => changeWeek(-1)}>
            <ChevronLeft size={16} />
            Semaine précédente
          </button>
          
          <div style={styles.weekInfo}>
            Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[6])}
          </div>
          
          <button style={styles.weekButton} onClick={() => changeWeek(1)}>
            Semaine suivante
            <ChevronRight size={16} />
          </button>

          {/* BOUTON POUR CONFIGURER LES CRÉNEAUX */}
          {selectedCours.map(coursId => (
            <button 
              key={coursId}
              style={styles.creneauxButton}
              onClick={() => ouvrirModalCreneaux(coursId)}
              title={`Configurer les créneaux pour ${coursList.find(c => c._id === coursId)?.nom}`}
            >
              <Settings size={16} />
              Configurer les heures ({coursList.find(c => c._id === coursId)?.nom})
            </button>
          ))}

          {/* Bouton pour copier la semaine précédente */}
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

          {/* Bouton pour afficher les statistiques de rattrapage */}
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

          {/* Nouveau bouton Historique Général */}
          <button 
            style={{
              ...styles.weekButton,
              backgroundColor: '#6b7280'
            }}
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

        {/* Affichage des créneaux actuels */}
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} />
            Créneaux horaires actuels :
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(creneauxCours[selectedCours[0]] || []).map((creneau, index) => (
              <span
                key={creneau.id}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: '1px solid #93c5fd'
                }}
              >
                {genererLabel(creneau.debut, creneau.fin)}
              </span>
            ))}
          </div>
          <small style={{ color: '#64748b', fontSize: '11px', marginTop: '8px', display: 'block' }}>
            Cliquez sur "Configurer les heures" pour modifier ces créneaux
          </small>
        </div>

        {/* Bouton de téléchargement */}
        {selectedCours.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button style={styles.downloadButton} onClick={() => {}}>
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
        const creneaux = creneauxCours[coursId] || [];

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
                        {genererLabel(creneau.debut, creneau.fin)}
                      </td>
                      {jours.map(jour => {
                        const key = `${jour}-${creneau.debut}-${creneau.fin}`;
                        const seanceData = emploiDuTemps[coursId]?.[key] || {};
                        
                        return (
                          <td key={jour} style={styles.cell}>
                            {/* Affichage en lecture seule avec boutons */}
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

                                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
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

                                  <button
                                    style={{
                                      fontSize: '10px',
                                      padding: '3px 6px',
                                      borderRadius: '3px',
                                      border: '1px solid #6b7280',
                                      background: '#6b7280',
                                      color: 'white',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '3px'
                                    }}
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
              • <strong>Configurer</strong> les créneaux horaires<br/>
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
            • Cliquez sur <strong>"Configurer les heures"</strong> pour personnaliser vos créneaux horaires<br/>
            • Cliquez sur <strong>"Modifier"</strong> pour changer les détails d'une séance<br/>
            • Cliquez sur <strong>"Ajouter séance"</strong> dans une case vide pour créer une nouvelle séance<br/>
            • <strong>IMPORTANT</strong> : Professeur et matière sont OBLIGATOIRES pour sauvegarder<br/>
            • Cliquez sur <strong>"Supprimer"</strong> pour effacer définitivement une séance<br/>
            • Les créneaux horaires personnalisés s'appliquent à tout l'emploi du temps
          </div>
        </div>
      )}

      {/* Modal pour configurer les créneaux */}
      <ModalCreneaux />

      {/* Modal Statistiques Rattrapages */}
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
            width: '900px',
            maxHeight: '85vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px' }}>
              📊 Statistiques des Rattrapages
            </h3>
            
            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>Chargement des statistiques...</div>
              </div>
            ) : (
              <div>
                {statsRattrapages.map(stat => (
                  <div key={stat._id} style={{
                    padding: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    backgroundColor: stat.seancesRattrapage > 0 ? '#fef2f2' : '#f9fafb'
                  }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      marginBottom: '12px',
                      fontSize: '16px',
                      color: stat.seancesRattrapage > 0 ? '#dc2626' : '#374151'
                    }}>
                      {stat.nomProfesseur}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>Total séances:</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stat.totalSeances}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#10b981' }}>Séances normales:</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{stat.seancesNormales}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#dc2626' }}>Rattrapages requis:</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>{stat.seancesRattrapage}</div>
                      </div>
                    </div>
                    
                    {/* Affichage du taux de présence */}
                    {stat.totalSeances > 0 && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        marginTop: '10px',
                        marginBottom: '10px',
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Taux de présence: <strong>{Math.round((stat.seancesNormales / stat.totalSeances) * 100)}%</strong></span>
                        <span>Taux de rattrapage: <strong style={{ color: '#dc2626' }}>{stat.pourcentageRattrapages || Math.round((stat.seancesRattrapage / stat.totalSeances) * 100)}%</strong></span>
                      </div>
                    )}
                    
                    {/* Détails des rattrapages SI le professeur en a */}
                    {stat.detailsRattrapages && stat.detailsRattrapages.length > 0 && (
                      <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        backgroundColor: '#fff7ed',
                        borderRadius: '6px',
                        border: '1px solid #fed7aa'
                      }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '13px', 
                          marginBottom: '10px',
                          color: '#c2410c',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>🔍</span>
                          Détails des {stat.detailsRattrapages.length} rattrapage(s)
                        </div>
                        
                        {stat.detailsRattrapages.map((rattrapage, idx) => (
                          <div key={idx} style={{
                            fontSize: '11px',
                            padding: '8px',
                            marginBottom: '6px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            border: '1px solid #fed7aa'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <strong style={{ color: '#7c2d12' }}>Séance:</strong> {rattrapage.cours} - {rattrapage.matiere}
                                <br />
                                <strong style={{ color: '#7c2d12' }}>Date:</strong> {new Date(rattrapage.dateSeance).toLocaleDateString('fr-FR')} 
                                {' '}({rattrapage.jour} {rattrapage.heureDebut}-{rattrapage.heureFin})
                                {rattrapage.salle && (
                                  <>
                                    <br />
                                    <strong style={{ color: '#7c2d12' }}>Salle:</strong> {rattrapage.salle}
                                  </>
                                )}
                              </div>
                              
                              <div style={{
                                backgroundColor: '#fef3c7',
                                padding: '6px',
                                borderRadius: '4px',
                                border: '1px solid #fde047'
                              }}>
                                <strong style={{ color: '#713f12' }}>📝 Marqué par:</strong>
                                <br />
                                <span style={{ color: '#0369a1', fontWeight: '600' }}>
                                  {rattrapage.marqueParNom || 'Système'}
                                </span>
                                <br />
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                                  {rattrapage.marqueParRole && `(${rattrapage.marqueParRole})`}
                                </span>
                                {rattrapage.marqueParEmail && (
                                  <>
                                    <br />
                                    <span style={{ fontSize: '10px', color: '#6b7280' }}>
                                      {rattrapage.marqueParEmail}
                                    </span>
                                  </>
                                )}
                                {rattrapage.dateRattrapage && (
                                  <>
                                    <br />
                                    <span style={{ fontSize: '10px', color: '#6b7280' }}>
                                      Le {new Date(rattrapage.dateRattrapage).toLocaleDateString('fr-FR')} 
                                      {' à '}
                                      {new Date(rattrapage.dateRattrapage).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {rattrapage.notes && (
                              <div style={{
                                marginTop: '6px',
                                padding: '4px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '3px',
                                fontSize: '10px',
                                color: '#075985'
                              }}>
                                <strong>Notes:</strong> {rattrapage.notes}
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
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
                    <div>Aucune donnée de rattrapage disponible</div>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              marginTop: '20px',
              paddingTop: '15px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setShowStatsRattrapages(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
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