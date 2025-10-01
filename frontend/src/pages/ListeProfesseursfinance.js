import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ListeEtudiants.css';
import Sidebar from '../components/Sidebar';

import { 
  User, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Eye, 
  EyeOff,
  Edit,
  BookOpen, 
  Calendar, 
  Cake, 
  RotateCcw, 
  X,
  Trash2,
  Mail,
  Plus,
  FileText,
  DollarSign,
  Building
} from "lucide-react";

const ListeProfesseurs = () => {
  const [professeurs, setProfesseurs] = useState([]);
  const [professeursFiltres, setProfesseursFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreGenre, setFiltreGenre] = useState('');
  const [filtreCours, setFiltreCours] = useState('');
  const [filtreMatiere, setFiltreMatiere] = useState('');
  const [filtreActif, setFiltreActif] = useState('');
  const [filtreTypeProfesseur, setFiltreTypeProfesseur] = useState(''); // Nouveau filtre
  const [pageActuelle, setPageActuelle] = useState(1);
  const [professeursParPage] = useState(10);
  const [loading, setLoading] = useState(true);
  
  // États pour le modal d'ajout
  const [showModal, setShowModal] = useState(false);
  const [formAjout, setFormAjout] = useState({
    nom: '',
    genre: 'Homme',
    dateNaissance: '',
    telephone: '',
    email: '',
    motDePasse: '',
    coursEnseignes: [], // Nouveau système
    notes: '',
    actif: true,
    estPermanent: true,
    tarifHoraire: ''
  });
  const [vueMode, setVueMode] = useState('tableau');

  // États pour les fichiers
  const [imageFile, setImageFile] = useState(null);
  const [documentsFiles, setDocumentsFiles] = useState({
    diplome: null,
    cv: null,
    rib: null,
    copieCin: null,
    engagement: null,
    vacataire: null
  });

  const [listeCours, setListeCours] = useState([]);
  const [messageAjout, setMessageAjout] = useState('');
  const [loadingAjout, setLoadingAjout] = useState(false);
  
  // États pour le modal de visualisation
  const [showViewModal, setShowViewModal] = useState(false);
  const [professeurSelectionne, setProfesseurSelectionne] = useState(null);
  
  // États pour le modal de modification
  const [showEditModal, setShowEditModal] = useState(false);
  const [formModifier, setFormModifier] = useState({
    nom: '',
    genre: 'Homme',
    dateNaissance: '',
    telephone: '',
    email: '',
    motDePasse: '',
    coursEnseignes: [],
    notes: '',
    actif: true,
    estPermanent: true,
    tarifHoraire: ''
  });
  const [imageFileModifier, setImageFileModifier] = useState(null);
  const [documentsFilesModifier, setDocumentsFilesModifier] = useState({
    diplome: null,
    cv: null,
    rib: null,
    copieCin: null,
    engagement: null,
    vacataire: null
  });
  const [messageModifier, setMessageModifier] = useState('');
  const [loadingModifier, setLoadingModifier] = useState(false);
  const [professeurAModifier, setProfesseurAModifier] = useState(null);
  
  // États pour la visibilité des mots de passe
  const [showPasswordAjout, setShowPasswordAjout] = useState(false);
  const [showPasswordModifier, setShowPasswordModifier] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfesseurs();
    fetchCours();
  }, []);

  useEffect(() => {
    filtrerProfesseurs();
  }, [professeurs, recherche, filtreGenre, filtreCours, filtreActif, filtreTypeProfesseur]);

  const fetchProfesseurs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://195.179.229.230:5000/api/professeurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfesseurs(res.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCours = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://195.179.229.230:5000/api/cours', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListeCours(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des cours:', err);
    }
  };

  const filtrerProfesseurs = () => {
    let resultats = professeurs;

    // Filtre par recherche
    if (recherche) {
      resultats = resultats.filter(p =>
        p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        p.telephone.includes(recherche) ||
        p.email.toLowerCase().includes(recherche.toLowerCase())
      );
    }

    // Filtre par genre
    if (filtreGenre) {
      resultats = resultats.filter(p => p.genre === filtreGenre);
    }

    // Filtre par cours (nouveau système)
    if (filtreCours) {
      resultats = resultats.filter(p => 
        p.coursEnseignes?.some(cours => 
          cours.nomCours.toLowerCase().includes(filtreCours.toLowerCase())
        ) ||
        p.cours?.some(cours => cours.toLowerCase().includes(filtreCours.toLowerCase()))
      );
    }

    // Filtre par matière (nouveau système)
    if (filtreMatiere) {
      resultats = resultats.filter(p => 
        p.coursEnseignes?.some(cours => 
          cours.matiere.toLowerCase().includes(filtreMatiere.toLowerCase())
        ) ||
        (p.matiere && p.matiere.toLowerCase().includes(filtreMatiere.toLowerCase()))
      );
    }

    // Filtre par statut actif
    if (filtreActif !== '') {
      resultats = resultats.filter(p => p.actif === (filtreActif === 'true'));
    }

    // Nouveau filtre par type de professeur
    if (filtreTypeProfesseur !== '') {
      resultats = resultats.filter(p => p.estPermanent === (filtreTypeProfesseur === 'permanent'));
    }

    setProfesseursFiltres(resultats);
    setPageActuelle(1);
  };

  // Fonctions pour gérer les cours enseignés
  const ajouterCoursEnseigneAjout = () => {
    setFormAjout({
      ...formAjout,
      coursEnseignes: [...formAjout.coursEnseignes, { nomCours: '', matiere: '' }]
    });
  };

  const supprimerCoursEnseigneAjout = (index) => {
    const nouveauxCours = formAjout.coursEnseignes.filter((_, i) => i !== index);
    setFormAjout({ ...formAjout, coursEnseignes: nouveauxCours });
  };

  const modifierCoursEnseigneAjout = (index, field, value) => {
    const nouveauxCours = [...formAjout.coursEnseignes];
    nouveauxCours[index][field] = value;
    setFormAjout({ ...formAjout, coursEnseignes: nouveauxCours });
  };

  // Mêmes fonctions pour la modification
  const ajouterCoursEnseigneModifier = () => {
    setFormModifier({
      ...formModifier,
      coursEnseignes: [...formModifier.coursEnseignes, { nomCours: '', matiere: '' }]
    });
  };

  const supprimerCoursEnseigneModifier = (index) => {
    const nouveauxCours = formModifier.coursEnseignes.filter((_, i) => i !== index);
    setFormModifier({ ...formModifier, coursEnseignes: nouveauxCours });
  };

  const modifierCoursEnseigneModifier = (index, field, value) => {
    const nouveauxCours = [...formModifier.coursEnseignes];
    nouveauxCours[index][field] = value;
    setFormModifier({ ...formModifier, coursEnseignes: nouveauxCours });
  };

  // Fonctions pour les documents
  const handleDocumentChangeAjout = (documentType, file) => {
    setDocumentsFiles({
      ...documentsFiles,
      [documentType]: file
    });
  };

  const handleDocumentChangeModifier = (documentType, file) => {
    setDocumentsFilesModifier({
      ...documentsFilesModifier,
      [documentType]: file
    });
  };

  // Fonctions pour le modal d'ajout
  const openModal = () => {
    setShowModal(true);
    setMessageAjout('');
  };

  const closeModal = () => {
    setShowModal(false);
    setFormAjout({
      nom: '',
      genre: 'Homme',
      dateNaissance: '',
      telephone: '',
      email: '',
      motDePasse: '',
      coursEnseignes: [],
      notes: '',
      actif: true,
      estPermanent: true,
      tarifHoraire: ''
    });
    setImageFile(null);
    setDocumentsFiles({
      diplome: null,
      cv: null,
      rib: null,
      copieCin: null,
      engagement: null,
      vacataire: null
    });
    setMessageAjout('');
  };

  const handleChangeAjout = (e) => {
    const { name, value, type, checked } = e.target;
    setFormAjout({ ...formAjout, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageChangeAjout = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmitAjout = async (e) => {
    e.preventDefault();
    setLoadingAjout(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Données de base
      formData.append('nom', formAjout.nom);
      formData.append('genre', formAjout.genre);
      formData.append('dateNaissance', formAjout.dateNaissance);
      formData.append('telephone', formAjout.telephone);
      formData.append('email', formAjout.email);
      formData.append('motDePasse', formAjout.motDePasse);
      formData.append('actif', formAjout.actif);
      formData.append('estPermanent', formAjout.estPermanent);
      formData.append('notes', formAjout.notes);
      
      // Tarif horaire pour entrepreneurs
      if (!formAjout.estPermanent && formAjout.tarifHoraire) {
        formData.append('tarifHoraire', formAjout.tarifHoraire);
      }
      
      // Cours enseignés (nouveau système)
      formData.append('coursEnseignes', JSON.stringify(formAjout.coursEnseignes));

      // Image
      if (imageFile) formData.append('image', imageFile);
      
      // Documents (pour tous les professeurs)
      Object.keys(documentsFiles).forEach(key => {
        if (documentsFiles[key]) {
          formData.append(key, documentsFiles[key]);
        }
      });

      await axios.post('http://195.179.229.230:5000/api/professeurs', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessageAjout('✅ Professeur ajouté avec succès');
      await fetchProfesseurs();
      
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (err) {
      setMessageAjout('❌ Erreur: ' + (err.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setLoadingAjout(false);
    }
  };

  // Fonctions pour le modal de modification
  const openEditModal = (professeur) => {
    setProfesseurAModifier(professeur);
    setFormModifier({
      nom: professeur.nom || '',
      genre: professeur.genre || 'Homme',
      dateNaissance: professeur.dateNaissance ? professeur.dateNaissance.slice(0, 10) : '',
      telephone: professeur.telephone || '',
      email: professeur.email || '',
      motDePasse: '',
      coursEnseignes: professeur.coursEnseignes || [],
      notes: professeur.notes || '',
      actif: professeur.actif ?? true,
      estPermanent: professeur.estPermanent ?? true,
      tarifHoraire: professeur.tarifHoraire || ''
    });
    setImageFileModifier(null);
    setDocumentsFilesModifier({
      diplome: null,
      cv: null,
      rib: null,
      copieCin: null,
      engagement: null,
      vacataire: null
    });
    setMessageModifier('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setProfesseurAModifier(null);
    setFormModifier({
      nom: '',
      genre: 'Homme',
      dateNaissance: '',
      telephone: '',
      email: '',
      motDePasse: '',
      coursEnseignes: [],
      notes: '',
      actif: true,
      estPermanent: true,
      tarifHoraire: ''
    });
    setImageFileModifier(null);
    setDocumentsFilesModifier({
      diplome: null,
      cv: null,
      rib: null,
      copieCin: null,
      engagement: null,
      vacataire: null
    });
    setMessageModifier('');
  };

  const handleChangeModifier = (e) => {
    const { name, value, type, checked } = e.target;
    setFormModifier({ ...formModifier, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageChangeModifier = (e) => {
    setImageFileModifier(e.target.files[0]);
  };

  const handleSubmitModifier = async (e) => {
    e.preventDefault();
    setLoadingModifier(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Données de base
      formData.append('nom', formModifier.nom);
      formData.append('genre', formModifier.genre);
      formData.append('dateNaissance', formModifier.dateNaissance);
      formData.append('telephone', formModifier.telephone);
      formData.append('email', formModifier.email);
      formData.append('actif', formModifier.actif);
      formData.append('estPermanent', formModifier.estPermanent);
      formData.append('notes', formModifier.notes);
      
      if (formModifier.motDePasse.trim() !== '') {
        formData.append('motDePasse', formModifier.motDePasse);
      }
      
      // Tarif horaire pour entrepreneurs
      if (!formModifier.estPermanent && formModifier.tarifHoraire) {
        formData.append('tarifHoraire', formModifier.tarifHoraire);
      }
      
      // Cours enseignés (nouveau système)
      formData.append('coursEnseignes', JSON.stringify(formModifier.coursEnseignes));

      // Image
      if (imageFileModifier) formData.append('image', imageFileModifier);
      
      // Documents (pour tous les professeurs)
      Object.keys(documentsFilesModifier).forEach(key => {
        if (documentsFilesModifier[key]) {
          formData.append(key, documentsFilesModifier[key]);
        }
      });

      await axios.put(`http://195.179.229.230:5000/api/professeurs/${professeurAModifier._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessageModifier('✅ Professeur modifié avec succès');
      await fetchProfesseurs();
      
      setTimeout(() => {
        closeEditModal();
      }, 1500);
      
    } catch (err) {
      setMessageModifier('❌ Erreur: ' + (err.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setLoadingModifier(false);
    }
  };

  const handleToggleActif = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://195.179.229.230:5000/api/professeurs/${id}/actif`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProfesseurs();
    } catch (err) {
      console.error('Erreur toggle actif:', err);
    }
  };

  const handleDelete = async (id) => {
    // Finance prof role cannot delete professors
    return;
  };

  const handleEdit = (professeur) => {
    openEditModal(professeur);
  };

  const handleView = (professeur) => {
    setProfesseurSelectionne(professeur);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setProfesseurSelectionne(null);
  };

  const viderFiltres = () => {
    setRecherche('');
    setFiltreGenre('');
    setFiltreCours('');
    setFiltreActif('');
    setFiltreMatiere('');
    setFiltreTypeProfesseur('');
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    const jour = String(date.getDate()).padStart(2, '0');
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const annee = date.getFullYear();
    return `${jour}-${mois}-${annee}`;
  };

  const calculerAge = (dateNaissance) => {
    const dob = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Fonction pour formater les cours enseignés
  const formatCoursEnseignes = (professeur) => {
    if (professeur.coursEnseignes && professeur.coursEnseignes.length > 0) {
      return professeur.coursEnseignes.map(cours => 
        `${cours.nomCours} (${cours.matiere})`
      ).join(', ');
    } else if (professeur.cours && professeur.cours.length > 0) {
      return professeur.cours.join(', ');
    }
    return 'Aucun cours';
  };

  // Pagination
  const indexDernierProfesseur = pageActuelle * professeursParPage;
  const indexPremierProfesseur = indexDernierProfesseur - professeursParPage;
  const professeursActuels = professeursFiltres.slice(indexPremierProfesseur, indexDernierProfesseur);
  const totalPages = Math.ceil(professeursFiltres.length / professeursParPage);

  const changerPage = (numerePage) => {
    setPageActuelle(numerePage);
  };

  // Obtenir tous les cours uniques pour le filtre
  const coursUniques = [...new Set(professeurs.flatMap(p => 
    p.coursEnseignes ? p.coursEnseignes.map(c => c.nomCours) : (p.cours || [])
  ))];

  if (loading) {
    return <div className="loading">Chargement des professeurs...</div>;
  }

  return (
    <div className="liste-etudiants-container" style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
    }}>
      <Sidebar onLogout={handleLogout} />

      <div className="header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ width: '100%', textAlign: 'center' }}>Liste des Professeurs</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {professeursFiltres.length} professeurs
          </div>
          
          <div className="vue-toggle">
            <button 
              onClick={() => setVueMode('tableau')}
              className={`btn-vue ${vueMode === 'tableau' ? 'active' : ''}`}
            >
              Tableau
            </button>
            <button 
              onClick={() => setVueMode('carte')}
              className={`btn-vue ${vueMode === 'carte' ? 'active' : ''}`}
            >
              Cartes
            </button>
          </div>
          
          <button onClick={openModal} className="btn-ajouter-etudiant">
            Ajouter un professeur
          </button>
        </div>
      </div>

      {/* Section des filtres MISE À JOUR */}
      <div className="filtres-section">
        <div className="filtres-row">
          <div className="filtre-groupe">
            <label>Rechercher:</label>
            <input
              type="text"
              placeholder="Nom, téléphone ou email..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="input-recherche"
            />
          </div>

          <div className="filtre-groupe">
            <label>Genre:</label>
            <select
              value={filtreGenre}
              onChange={(e) => setFiltreGenre(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </div>

          <div className="filtre-groupe">
            <label>Cours:</label>
            <select
              value={filtreCours}
              onChange={(e) => setFiltreCours(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous les cours</option>
              {coursUniques.map(cours => (
                <option key={cours} value={cours}>{cours}</option>
              ))}
            </select>
          </div>

          <div className="filtre-groupe">
            <label>Matière:</label>
            <input
              type="text"
              placeholder="Filtrer par matière..."
              value={filtreMatiere}
              onChange={(e) => setFiltreMatiere(e.target.value)}
              className="input-recherche"
            />
          </div>

          <div className="filtre-groupe">
            <label>Type:</label>
            <select
              value={filtreTypeProfesseur}
              onChange={(e) => setFiltreTypeProfesseur(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous</option>
              <option value="permanent">Permanent</option>
              <option value="entrepreneur">Entrepreneur</option>
            </select>
          </div>

          <div className="filtre-groupe">
            <label>Statut:</label>
            <select
              value={filtreActif}
              onChange={(e) => setFiltreActif(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>

          <button onClick={viderFiltres} className="btn-vider-filtres">
            Vider les filtres
          </button>
        </div>
      </div>

      {/* Vue Tableau MISE À JOUR */}
      {vueMode === 'tableau' ? (
        <div className="tableau-container">
          <table className="tableau-etudiants">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Genre</th>
                <th>Date de Naissance</th>
                <th>Âge</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Type</th>
                <th>Cours/Matières</th>
                <th>Statut</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {professeursActuels.length === 0 ? (
                <tr>
                  <td colSpan="11" className="aucun-resultat">
                    Aucun professeur trouvé
                  </td>
                </tr>
              ) : (
                professeursActuels.map((p) => (
                  <tr key={p._id}>
                    <td className="nom-colonne">{p.nom}</td>
                    <td>{p.genre}</td>
                    <td>{formatDate(p.dateNaissance)}</td>
                    <td>{calculerAge(p.dateNaissance)} ans</td>
                    <td>{p.telephone}</td>
                    <td>{p.email}</td>
                    <td>
                      <span className={`type-badge ${p.estPermanent ? 'permanent' : 'entrepreneur'}`}>
                        {p.estPermanent ? (
                          <>
                            <Building size={14} className="inline mr-1" />
                            Permanent
                          </>
                        ) : (
                          <>
                            <DollarSign size={14} className="inline mr-1" />
                            Entrepreneur
                          </>
                        )}
                      </span>
                    </td>
                    <td className="cours-colonne">
                      {formatCoursEnseignes(p)}
                    </td>
                    <td className="statut-colonne">
                      <div className="toggle-switch-container">
                        <span className={`statut-text ${p.actif ? 'actif' : 'inactif'}`}>
                          {p.actif ? 'Actif' : 'Inactif'}
                        </span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={p.actif}
                            onChange={() => handleToggleActif(p._id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </td>
                    <td className="image-colonne">
                      {p.image ? (
                        <img 
                          src={`http://195.179.229.230:5000${p.image}`} 
                          alt="professeur" 
                          className="image-etudiant"
                        />
                      ) : (
                        <div className="pas-image">N/A</div>
                      )}
                    </td>
                    <td className="actions-colonne">
                      <button 
                        onClick={() => handleView(p)}
                        className="btn-voir"
                      >
                        Voir
                      </button>
                      <button 
                        onClick={() => handleEdit(p)}
                        className="btn-modifier"
                      >
                        Modifier
                      </button>
                      {/* Delete button removed for finance_prof role */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Vue Cartes MISE À JOUR
        <div className="cartes-container">
          {professeursActuels.length === 0 ? (
            <div className="aucun-resultat-cartes">
              Aucun professeur trouvé
            </div>
          ) : (
            <div className="cartes-grid">
              {professeursActuels.map((p) => (
                <div key={p._id} className="carte-etudiant">
                  <div className="carte-header">
                    <div className="carte-image">
                      {p.image ? (
                        <img 
                          src={`http://195.179.229.230:5000${p.image}`} 
                          alt="professeur" 
                          className="carte-photo"
                        />
                      ) : (
                        <div className="carte-placeholder">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="carte-statut">
                      <span className={`statut-badge ${p.actif ? 'actif' : 'inactif'}`}>
                        {p.actif ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </span>
                    </div>
                  </div>
                  
                  <div className="carte-content">
                    <h3 className="carte-nom">{p.nom}</h3>
                    <div className="carte-info">
                      <div className="carte-detail">
                        <span className="carte-label">Genre:</span>
                        <span>
                          <User size={16} className="inline mr-1" /> {p.genre}
                        </span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Âge:</span>
                        <span>{calculerAge(p.dateNaissance)} ans</span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Téléphone:</span>
                        <span>
                          <Phone size={16} className="inline mr-1" /> {p.telephone}
                        </span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Email:</span>
                        <span>
                          <Mail size={16} className="inline mr-1" /> {p.email}
                        </span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Type:</span>
                        <span className={`type-badge ${p.estPermanent ? 'permanent' : 'entrepreneur'}`}>
                          {p.estPermanent ? (
                            <>
                              <Building size={16} className="inline mr-1" />
                              Permanent
                            </>
                          ) : (
                            <>
                              <DollarSign size={16} className="inline mr-1" />
                              Entrepreneur ({p.tarifHoraire ? `${p.tarifHoraire}€/h` : 'Tarif non défini'})
                            </>
                          )}
                        </span>
                      </div>
                      <div className="carte-detail cours-detail">
                        <span className="carte-label">Cours/Matières:</span>
                        <div className="carte-cours">
                          {formatCoursEnseignes(p)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="carte-actions">
                    <button 
                      onClick={() => handleView(p)}
                      className="btn-carte btn-voir"
                      title="Voir détails"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleEdit(p)}
                      className="btn-carte btn-modifier"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleToggleActif(p._id)}
                      className="btn-carte btn-toggle"
                      title={p.actif ? 'Désactiver' : 'Activer'}
                    >
                      <RotateCcw size={16} />
                    </button>
                    {/* Delete button removed for finance_prof role */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => changerPage(pageActuelle - 1)}
            disabled={pageActuelle === 1}
            className="btn-pagination"
          >
            ← Précédent
          </button>

          <div className="numeros-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(numero => (
              <button
                key={numero}
                onClick={() => changerPage(numero)}
                className={`btn-page ${pageActuelle === numero ? 'active' : ''}`}
              >
                {numero}
              </button>
            ))}
          </div>

          <button
            onClick={() => changerPage(pageActuelle + 1)}
            disabled={pageActuelle === totalPages}
            className="btn-pagination"
          >
            Suivant →
          </button>

          <div className="info-pagination">
            Page {pageActuelle} sur {totalPages} 
            ({indexPremierProfesseur + 1}-{Math.min(indexDernierProfesseur, professeursFiltres.length)} sur {professeursFiltres.length})
          </div>
        </div>
      )}

      {/* Modal d'ajout de professeur */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajouter un professeur</h3>
              <button className="btn-fermer-modal" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmitAjout} className="form-ajout-etudiant">
              {/* Informations de base */}
              <div className="form-section">
                <h4>Informations personnelles</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      placeholder="Nom complet"
                      value={formAjout.nom}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Genre *</label>
                    <select name="genre" value={formAjout.genre} onChange={handleChangeAjout}>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date de Naissance *</label>
                    <input
                      type="date"
                      name="dateNaissance"
                      value={formAjout.dateNaissance}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      type="text"
                      name="telephone"
                      placeholder="Téléphone"
                      value={formAjout.telephone}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formAjout.email}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mot de Passe *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswordAjout ? "text" : "password"}
                        name="motDePasse"
                        placeholder="Mot de passe"
                        value={formAjout.motDePasse}
                        onChange={handleChangeAjout}
                        required
                        minLength="6"
                        style={{ paddingRight: '35px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordAjout(!showPasswordAjout)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666'
                        }}
                      >
                        {showPasswordAjout ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut professionnel */}
              <div className="form-section">
                <h4>Statut professionnel</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Type de professeur *</label>
                    <select 
                      name="typeProfesseur" 
                      value={formAjout.estPermanent ? 'permanent' : 'entrepreneur'}
                      onChange={(e) => setFormAjout({
                        ...formAjout, 
                        estPermanent: e.target.value === 'permanent'
                      })}
                      required
                      className="select-avec-icone"
                    >
                      <option value="entrepreneur">🏢 Entrepreneur (Vacataire)</option>
                      <option value="permanent">🏛️ Permanent (Salarié)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="actif"
                        checked={formAjout.actif}
                        onChange={handleChangeAjout}
                      />
                      <span className="checkmark"></span>
                      Professeur actif
                    </label>
                  </div>
                </div>

                {!formAjout.estPermanent && (
                  <div className="form-group">
                    <label>Tarif Horaire (€) *</label>
                    <input
                      type="number"
                      name="tarifHoraire"
                      placeholder="Tarif horaire en euros"
                      value={formAjout.tarifHoraire}
                      onChange={handleChangeAjout}
                      required={!formAjout.estPermanent}
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              {/* Cours enseignés */}
              <div className="form-section">
                <h4>Cours enseignés</h4>
                
                {formAjout.coursEnseignes.map((cours, index) => (
                  <div key={index} className="cours-enseigne-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom du Cours</label>
                        <select
                          value={cours.nomCours}
                          onChange={(e) => modifierCoursEnseigneAjout(index, 'nomCours', e.target.value)}
                          required
                        >
                          <option value="">Sélectionner un cours</option>
                          {listeCours.map((c) => (
                            <option key={c._id} value={c.nom}>{c.nom}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Matière</label>
                        <input
                          type="text"
                          placeholder="Ex: Python, SQL, Mathématiques..."
                          value={cours.matiere}
                          onChange={(e) => modifierCoursEnseigneAjout(index, 'matiere', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <button
                          type="button"
                          onClick={() => supprimerCoursEnseigneAjout(index)}
                          className="btn-supprimer-cours"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={ajouterCoursEnseigneAjout}
                  className="btn-ajouter-cours"
                >
                  <Plus size={16} /> Ajouter un cours
                </button>
              </div>

              {/* Image */}
              <div className="form-section">
                <h4>Photo du professeur</h4>
                <div className="form-group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChangeAjout}
                    className="input-file"
                  />
                  {imageFile && (
                    <div className="image-preview">
                      <img 
                        src={URL.createObjectURL(imageFile)} 
                        alt="Aperçu" 
                        className="preview-image"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="form-section">
                <h4>Documents {formAjout.estPermanent ? '(Permanent)' : '(Entrepreneur)'}</h4>
                <div className="documents-grid">
                  <div className="form-group">
                    <label>Diplôme</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChangeAjout('diplome', e.target.files[0])}
                    />
                  </div>

                  <div className="form-group">
                    <label>CV</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleDocumentChangeAjout('cv', e.target.files[0])}
                    />
                  </div>

                  <div className="form-group">
                    <label>RIB</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChangeAjout('rib', e.target.files[0])}
                    />
                  </div>

                  <div className="form-group">
                    <label>Copie CIN</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChangeAjout('copieCin', e.target.files[0])}
                    />
                  </div>

                  <div className="form-group">
                    <label>Lettre d'engagement</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleDocumentChangeAjout('engagement', e.target.files[0])}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contrat {formAjout.estPermanent ? 'permanent' : 'vacataire'}</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleDocumentChangeAjout('vacataire', e.target.files[0])}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="form-section">
                <h4>Notes administratives</h4>
                <div className="form-group">
                  <textarea
                    name="notes"
                    placeholder="Notes supplémentaires..."
                    value={formAjout.notes}
                    onChange={handleChangeAjout}
                    rows="3"
                  />
                </div>
              </div>

              {messageAjout && (
                <div className={`message ${messageAjout.includes('✅') ? 'succes' : 'erreur'}`}>
                  {messageAjout}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-annuler"
                  disabled={loadingAjout}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-valider"
                  disabled={loadingAjout}
                >
                  {loadingAjout ? 'Ajout en cours...' : 'Ajouter le professeur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de visualisation MISE À JOUR */}
      {showViewModal && professeurSelectionne && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Informations du professeur</h3>
              <button className="btn-fermer-modal" onClick={closeViewModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="etudiant-details">
              <div className="etudiant-header">
                <div className="etudiant-image-section">
                  {professeurSelectionne.image ? (
                    <img 
                      src={`http://195.179.229.230:5000${professeurSelectionne.image}`} 
                      alt="Photo du professeur" 
                      className="etudiant-image-large"
                    />
                  ) : (
                    <div className="etudiant-image-placeholder">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <div className="etudiant-info-principal">
                  <h2>{professeurSelectionne.nom}</h2>
                  <div className="statut-badges">
                    <span className={`badge ${professeurSelectionne.actif ? 'actif' : 'inactif'}`}>
                      {professeurSelectionne.actif ? (
                        <>
                          <CheckCircle size={16} className="inline mr-1" /> Actif
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="inline mr-1" /> Inactif
                        </>
                      )}
                    </span>
                    <span className={`badge ${professeurSelectionne.estPermanent ? 'permanent' : 'entrepreneur'}`}>
                      {professeurSelectionne.estPermanent ? (
                        <>
                          <Building size={16} className="inline mr-1" /> Permanent
                        </>
                      ) : (
                        <>
                          <DollarSign size={16} className="inline mr-1" /> Entrepreneur
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="etudiant-info-grid">
                <div className="info-card">
                  <div className="info-label">Genre</div>
                  <div className="info-value">
                    <User size={16} className="inline mr-1" /> {professeurSelectionne.genre}
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Date de Naissance</div>
                  <div className="info-value">
                    <Calendar size={16} className="inline mr-1" /> {formatDate(professeurSelectionne.dateNaissance)}
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Âge</div>
                  <div className="info-value">
                    <Cake size={16} className="inline mr-1" /> {calculerAge(professeurSelectionne.dateNaissance)} ans
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Téléphone</div>
                  <div className="info-value">
                    <Phone size={16} className="inline mr-1" /> {professeurSelectionne.telephone}
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Email</div>
                  <div className="info-value">
                    <Mail size={16} className="inline mr-1" /> {professeurSelectionne.email}
                  </div>
                </div>

                {!professeurSelectionne.estPermanent && professeurSelectionne.tarifHoraire && (
                  <div className="info-card">
                    <div className="info-label">Tarif Horaire</div>
                    <div className="info-value">
                      <DollarSign size={16} className="inline mr-1" /> {professeurSelectionne.tarifHoraire}€/h
                    </div>
                  </div>
                )}
              </div>

              <div className="cours-section">
                <h4>
                  <BookOpen size={20} className="inline mr-2" /> Cours Enseignés
                </h4>
                <div className="cours-badges">
                  {professeurSelectionne.coursEnseignes && professeurSelectionne.coursEnseignes.length > 0 ? (
                    professeurSelectionne.coursEnseignes.map((cours, index) => (
                      <span key={index} className="cours-badge">
                        {cours.nomCours} - {cours.matiere}
                      </span>
                    ))
                  ) : professeurSelectionne.cours && professeurSelectionne.cours.length > 0 ? (
                    professeurSelectionne.cours.map((cours, index) => (
                      <span key={index} className="cours-badge">{cours}</span>
                    ))
                  ) : (
                    <span className="no-cours">Aucun cours assigné</span>
                  )}
                </div>
              </div>

              {/* Documents pour tous les professeurs */}
              {professeurSelectionne.documents && (
                <div className="documents-section">
                  <h4>
                    <FileText size={20} className="inline mr-2" /> Documents
                  </h4>
                  <div className="documents-grid">
                    {Object.entries(professeurSelectionne.documents).map(([type, path]) => (
                      path && (
                        <div key={type} className="document-item">
                          <span className="document-label">{type}:</span>
                          <a 
                            href={`http://195.179.229.230:5000${path}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            Voir le document
                          </a>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {professeurSelectionne.notes && (
                <div className="notes-section">
                  <h4>Notes administratives</h4>
                  <p>{professeurSelectionne.notes}</p>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  onClick={() => {
                    closeViewModal();
                    openEditModal(professeurSelectionne);
                  }}
                  className="btn-modifier-depuis-view"
                >
                  <Edit size={16} className="inline mr-1" /> Modifier
                </button>
                <button onClick={closeViewModal} className="btn-fermer">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification MISE À JOUR */}
      {showEditModal && professeurAModifier && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier le professeur</h3>
              <button className="btn-fermer-modal" onClick={closeEditModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmitModifier} className="form-ajout-etudiant">
              {/* Informations de base */}
              <div className="form-section">
                <h4>Informations personnelles</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      value={formModifier.nom}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Genre *</label>
                    <select name="genre" value={formModifier.genre} onChange={handleChangeModifier}>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date de Naissance *</label>
                    <input
                      type="date"
                      name="dateNaissance"
                      value={formModifier.dateNaissance}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      type="text"
                      name="telephone"
                      value={formModifier.telephone}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formModifier.email}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Nouveau Mot de Passe</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswordModifier ? "text" : "password"}
                        name="motDePasse"
                        placeholder="Laisser vide pour garder l'ancien"
                        value={formModifier.motDePasse}
                        onChange={handleChangeModifier}
                        minLength="6"
                        style={{ paddingRight: '35px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordModifier(!showPasswordModifier)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666'
                        }}
                      >
                        {showPasswordModifier ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <small style={{color: '#666', fontSize: '12px'}}>
                      Laisser vide pour conserver le mot de passe actuel
                    </small>
                  </div>
                </div>
              </div>

              {/* Statut professionnel */}
              <div className="form-section">
                <h4>Statut professionnel</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Type de professeur *</label>
                    <select 
                      name="typeProfesseur" 
                      value={formModifier.estPermanent ? 'permanent' : 'entrepreneur'}
                      onChange={(e) => setFormModifier({
                        ...formModifier, 
                        estPermanent: e.target.value === 'permanent'
                      })}
                      required
                      className="select-avec-icone"
                    >
                      <option value="entrepreneur">🏢 Entrepreneur (Vacataire)</option>
                      <option value="permanent">🏛️ Permanent (Salarié)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="actif"
                        checked={formModifier.actif}
                        onChange={handleChangeModifier}
                      />
                      <span className="checkmark"></span>
                      Professeur actif
                    </label>
                  </div>
                </div>

                {!formModifier.estPermanent && (
                  <div className="form-group">
                    <label>Tarif Horaire (€) *</label>
                    <input
                      type="number"
                      name="tarifHoraire"
                      placeholder="Tarif horaire en euros"
                      value={formModifier.tarifHoraire}
                      onChange={handleChangeModifier}
                      required={!formModifier.estPermanent}
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              {/* Cours enseignés */}
              <div className="form-section">
                <h4>Cours enseignés</h4>
                
                {formModifier.coursEnseignes.map((cours, index) => (
                  <div key={index} className="cours-enseigne-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom du Cours</label>
                        <select
                          value={cours.nomCours}
                          onChange={(e) => modifierCoursEnseigneModifier(index, 'nomCours', e.target.value)}
                          required
                        >
                          <option value="">Sélectionner un cours</option>
                          {listeCours.map((c) => (
                            <option key={c._id} value={c.nom}>{c.nom}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Matière</label>
                        <input
                          type="text"
                          placeholder="Ex: Python, SQL, Mathématiques..."
                          value={cours.matiere}
                          onChange={(e) => modifierCoursEnseigneModifier(index, 'matiere', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <button
                          type="button"
                          onClick={() => supprimerCoursEnseigneModifier(index)}
                          className="btn-supprimer-cours"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={ajouterCoursEnseigneModifier}
                  className="btn-ajouter-cours"
                >
                  <Plus size={16} /> Ajouter un cours
                </button>
              </div>

              {/* Image */}
              <div className="form-section">
                <h4>Photo du professeur</h4>
                <div className="form-group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChangeModifier}
                    className="input-file"
                  />
                  {professeurAModifier.image && (
                    <div className="image-actuelle">
                      <small>Image actuelle :</small>
                      <img 
                        src={`http://195.179.229.230:5000${professeurAModifier.image}`} 
                        alt="Image actuelle" 
                        className="image-preview"
                        style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}}
                      />
                    </div>
                  )}
                  {imageFileModifier && (
                    <div className="image-preview">
                      <small>Nouvelle image :</small>
                      <img 
                        src={URL.createObjectURL(imageFileModifier)} 
                        alt="Aperçu" 
                        className="preview-image"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="form-section">
                <h4>Documents {formModifier.estPermanent ? '(Permanent)' : '(Entrepreneur)'}</h4>
                <div className="documents-grid">
                  <div className="form-group">
                    <label>Diplôme</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChangeModifier('diplome', e.target.files[0])}
                    />
                    {professeurAModifier.documents?.diplome && (
                      <small>
                        Document actuel: 
                        <a href={`http://195.179.229.230:5000${professeurAModifier.documents.diplome}`} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>CV</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleDocumentChangeModifier('cv', e.target.files[0])}
                    />
                    {professeurAModifier.documents?.cv && (
                      <small>
                        Document actuel: 
                        <a href={`http://195.179.229.230:5000${professeurAModifier.documents.cv}`} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>RIB</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChangeModifier('rib', e.target.files[0])}
                    />
                    {professeurAModifier.documents?.rib && (
                      <small>
                        Document actuel: 
                        <a href={`http://195.179.229.230:5000${professeurAModifier.documents.rib}`} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Copie CIN</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChangeModifier('copieCin', e.target.files[0])}
                    />
                    {professeurAModifier.documents?.copieCin && (
                      <small>
                        Document actuel: 
                        <a href={`http://195.179.229.230:5000${professeurAModifier.documents.copieCin}`} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Lettre d'engagement</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleDocumentChangeModifier('engagement', e.target.files[0])}
                    />
                    {professeurAModifier.documents?.engagement && (
                      <small>
                        Document actuel: 
                        <a href={`http://195.179.229.230:5000${professeurAModifier.documents.engagement}`} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Contrat {formModifier.estPermanent ? 'permanent' : 'vacataire'}</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleDocumentChangeModifier('vacataire', e.target.files[0])}
                    />
                    {professeurAModifier.documents?.vacataire && (
                      <small>
                        Document actuel: 
                        <a href={`http://195.179.229.230:5000${professeurAModifier.documents.vacataire}`} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="form-section">
                <h4>Notes administratives</h4>
                <div className="form-group">
                  <textarea
                    name="notes"
                    placeholder="Notes supplémentaires..."
                    value={formModifier.notes}
                    onChange={handleChangeModifier}
                    rows="3"
                  />
                </div>
              </div>

              {messageModifier && (
                <div className={`message ${messageModifier.includes('✅') ? 'succes' : 'erreur'}`}>
                  {messageModifier}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn-annuler"
                  disabled={loadingModifier}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-valider"
                  disabled={loadingModifier}
                >
                  {loadingModifier ? 'Modification en cours...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styles CSS supplémentaires pour le nouveau système */}
      <style jsx>{`
        .modal-large {
          max-width: 900px !important;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .form-section h4 {
          margin: 0 0 20px 0;
          color: #374151;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
        }

        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group select:hover {
          border-color: #9ca3af;
        }

        .form-group option {
          padding: 8px 12px;
          background: white;
          color: #374151;
        }

        .form-group option:hover {
          background: #f3f4f6;
        }

        .select-avec-icone {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 8px center;
          background-repeat: no-repeat;
          background-size: 16px;
          appearance: none;
          padding-right: 40px;
        }

        .cours-enseigne-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          margin-bottom: 10px;
        }

        .btn-ajouter-cours {
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-ajouter-cours:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .btn-supprimer-cours {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 24px;
        }

        .btn-supprimer-cours:hover {
          background: #dc2626;
        }

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .documents-grid .form-group {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
        }

        .documents-grid .form-group label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          display: block;
        }

        .documents-grid input[type="file"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
        }

        .documents-grid small {
          display: block;
          margin-top: 5px;
          color: #6b7280;
          font-size: 12px;
        }

        .documents-grid small a {
          color: #3b82f6;
          text-decoration: none;
          margin-left: 5px;
        }

        .documents-grid small a:hover {
          text-decoration: underline;
        }

        .type-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .type-badge.permanent {
          background: #dcfdf7;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .type-badge.entrepreneur {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fbbf24;
        }

        .statut-badges {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .documents-section {
          margin: 20px 0;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .documents-section h4 {
          margin: 0 0 15px 0;
          color: #374151;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          margin-bottom: 8px;
        }

        .document-label {
          font-weight: 500;
          color: #374151;
          text-transform: capitalize;
        }

        .document-link {
          color: #3b82f6;
          text-decoration: none;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #3b82f6;
          transition: all 0.2s;
        }

        .document-link:hover {
          background: #3b82f6;
          color: white;
        }

        .notes-section {
          margin: 20px 0;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .notes-section h4 {
          margin: 0 0 10px 0;
          color: #374151;
          font-weight: 600;
        }

        .notes-section p {
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .documents-grid {
            grid-template-columns: 1fr;
          }

          .modal-large {
            max-width: 95vw;
            margin: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default ListeProfesseurs;