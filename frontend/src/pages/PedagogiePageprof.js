import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ListeEtudiants.css'; // Utilise les mêmes styles que ListeEtudiants
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
  Mail
} from "lucide-react";

const PedagogiePageprof = () => {
  const [professeurs, setProfesseurs] = useState([]);
  const [professeursFiltres, setProfesseursFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreGenre, setFiltreGenre] = useState('');
  const [filtreCours, setFiltreCours] = useState('');
  const [filtreMatiere, setFiltreMatiere] = useState('');
  const [filtreActif, setFiltreActif] = useState('');
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
    cours: [],
    matiere: '',
    actif: true,
    estPermanent: true
  });
  const [vueMode, setVueMode] = useState('tableau'); // 'tableau' ou 'carte'

  const [imageFile, setImageFile] = useState(null);
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
    cours: [],
    matiere: '',
    actif: true,
    estPermanent: true
  });
  const [imageFileModifier, setImageFileModifier] = useState(null);
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
  }, [professeurs, recherche, filtreGenre, filtreCours, filtreActif]);

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

    // Filtre par recherche (nom, téléphone, email)
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

    // Filtre par cours
    if (filtreCours) {
      resultats = resultats.filter(p => 
        p.cours.some(cours => cours.toLowerCase().includes(filtreCours.toLowerCase()))
      );
    }
    // Filtre par matière
    if (filtreMatiere) {
      resultats = resultats.filter(p => 
        p.matiere && p.matiere.toLowerCase().includes(filtreMatiere.toLowerCase())
      );
    }

    // Filtre par statut actif
    if (filtreActif !== '') {
      resultats = resultats.filter(p => p.actif === (filtreActif === 'true'));
    }

    setProfesseursFiltres(resultats);
    setPageActuelle(1);
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
      cours: [],
      matiere: '',
      actif: true,
      estPermanent: true
    });
    setImageFile(null);
    setMessageAjout('');
  };

  const handleChangeAjout = (e) => {
    const { name, value, type, checked } = e.target;
    setFormAjout({ ...formAjout, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSelectCoursAjout = (coursNom) => {
    const nouveauxCours = formAjout.cours.includes(coursNom)
      ? formAjout.cours.filter(c => c !== coursNom)
      : [...formAjout.cours, coursNom];
    setFormAjout({ ...formAjout, cours: nouveauxCours });
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
      formData.append('nom', formAjout.nom);
      formData.append('genre', formAjout.genre);
      formData.append('dateNaissance', formAjout.dateNaissance);
      formData.append('telephone', formAjout.telephone);
      formData.append('email', formAjout.email);
      formData.append('motDePasse', formAjout.motDePasse);
      formData.append('actif', formAjout.actif);
      formData.append('matiere', formAjout.matiere);
      formData.append('estPermanent', formAjout.estPermanent);

      formAjout.cours.forEach(c => formData.append('cours[]', c));
      if (imageFile) formData.append('image', imageFile);

      await axios.post('http://195.179.229.230:5000/api/professeurs', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessageAjout('✅ Professeur ajouté avec succès');
      
      // Rafraîchir la liste des professeurs
      await fetchProfesseurs();
      
      setFormAjout({
        nom: '',
        genre: 'Homme',
        dateNaissance: '',
        telephone: '',
        email: '',
        motDePasse: '',
        cours: [],
        matiere: '',
        actif: true,
        estPermanent: true
      });
      setImageFile(null);
      
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
      cours: professeur.cours || [],
      matiere: professeur.matiere || '',
      actif: professeur.actif ?? true,
      estPermanent: professeur.estPermanent ?? true
    });
    setImageFileModifier(null);
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
      cours: [],
      matiere: '',
      actif: true,
      estPermanent: true
    });
    setImageFileModifier(null);
    setMessageModifier('');
  };

  const handleChangeModifier = (e) => {
    const { name, value, type, checked } = e.target;
    setFormModifier({ ...formModifier, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSelectCoursModifier = (coursNom) => {
    const nouveauxCours = formModifier.cours.includes(coursNom)
      ? formModifier.cours.filter(c => c !== coursNom)
      : [...formModifier.cours, coursNom];
    setFormModifier({ ...formModifier, cours: nouveauxCours });
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
      formData.append('nom', formModifier.nom);
      formData.append('genre', formModifier.genre);
      formData.append('dateNaissance', formModifier.dateNaissance);
      formData.append('telephone', formModifier.telephone);
      formData.append('email', formModifier.email);
      
      if (formModifier.motDePasse.trim() !== '') {
        formData.append('motDePasse', formModifier.motDePasse);
      }
      
      formData.append('actif', formModifier.actif);
      formData.append('matiere', formModifier.matiere);
      formData.append('estPermanent', formModifier.estPermanent);

      formModifier.cours.forEach(c => formData.append('cours[]', c));
      if (imageFileModifier) formData.append('image', imageFileModifier);

      await axios.put(`http://195.179.229.230:5000/api/professeurs/${professeurAModifier._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessageModifier('✅ Professeur modifié avec succès');
      
      // Rafraîchir la liste des professeurs
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
      // Rafraîchir la liste après le toggle
      await fetchProfesseurs();
    } catch (err) {
      console.error('Erreur toggle actif:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("🛑 Êtes-vous sûr de vouloir supprimer ce professeur ?")) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://195.179.229.230:5000/api/professeurs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Rafraîchir la liste après suppression
      await fetchProfesseurs();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
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

  // Pagination
  const indexDernierProfesseur = pageActuelle * professeursParPage;
  const indexPremierProfesseur = indexDernierProfesseur - professeursParPage;
  const professeursActuels = professeursFiltres.slice(indexPremierProfesseur, indexDernierProfesseur);
  const totalPages = Math.ceil(professeursFiltres.length / professeursParPage);

  const changerPage = (numerePage) => {
    setPageActuelle(numerePage);
  };

  // Obtenir tous les cours uniques pour le filtre
  const coursUniques = [...new Set(professeurs.flatMap(p => p.cours))];

  if (loading) {
    return <div className="loading">Chargement des professeurs...</div>;
  }

  return (
    <div className="liste-etudiants-container" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
        }}>
      <Sidebar onLogout={handleLogout} />

      {/* Ajouter les styles CSS */}
      <style jsx>{`
        .cours-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .cours-section h4 {
          margin: 0 0 15px 0;
          color: #374151;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cours-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-start;
        }

        .cours-badge {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          display: inline-block;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
          transition: all 0.2s ease;
        }

        .cours-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .no-cours {
          color: #64748b;
          font-style: italic;
          padding: 8px 12px;
          background-color: #f1f5f9;
          border-radius: 6px;
          border: 1px dashed #cbd5e1;
        }

        .inline {
          display: inline;
          margin-right: 4px;
        }

        .mr-1 {
          margin-right: 4px;
        }

        .mr-2 {
          margin-right: 8px;
        }

        .etudiant-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .info-card {
          background: white;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 768px) {
          .cours-badges {
            flex-direction: column;
          }
          
          .cours-badge {
            text-align: center;
          }
          
          .etudiant-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

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

      {/* Section des filtres */}
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
            <label>Classe:</label>
            <select
              value={filtreCours}
              onChange={(e) => setFiltreCours(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous les classes</option>
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

      {/* Vue Tableau ou Cartes */}
      {vueMode === 'tableau' ? (
        // VUE TABLEAU
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
                <th>Matière</th>
                <th>Classe</th>
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
                    <td>{p.matiere || 'Non définie'}</td>
                    <td className="cours-colonne">
                      {p.cours?.join(', ') || 'Aucun cours'}
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
                      <button 
                        onClick={() => handleDelete(p._id)}
                        className="btn-supprimer"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // VUE CARTES
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
                        <span className="carte-label">Matière:</span>
                        <span>
                          <BookOpen size={16} className="inline mr-1" /> {p.matiere || 'Non définie'}
                        </span>
                      </div>
                      <div className="carte-detail cours-detail">
                        <span className="carte-label">Classe:</span>
                        <div className="carte-cours">
                          {p.cours.length > 0 ? (
                            p.cours.map((cours, index) => (
                              <span key={index} className="cours-tag">{cours}</span>
                            ))
                          ) : (
                            <span className="no-cours">Aucun classe</span>
                          )}
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
                    <button 
                      onClick={() => handleDelete(p._id)}
                      className="btn-carte btn-supprimer"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajouter un professeur</h3>
              <button className="btn-fermer-modal" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmitAjout} className="form-ajout-etudiant">
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
                      color: '#666',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPasswordAjout ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Matière *</label>
                <input
                  type="text"
                  name="matiere"
                  placeholder="Matière enseignée"
                  value={formAjout.matiere}
                  onChange={handleChangeAjout}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cours (multi-sélection possible)</label>
                <div className="cours-selection-container">
                  {listeCours.map((cours) => (
                    <div
                      key={cours._id}
                      className={`cours-chip ${formAjout.cours.includes(cours.nom) ? 'selected' : ''}`}
                      onClick={() => handleSelectCoursAjout(cours.nom)}
                    >
                      <span className="cours-nom">{cours.nom}</span>
                      {formAjout.cours.includes(cours.nom) && (
                        <span className="cours-check">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                {formAjout.cours.length > 0 && (
                  <div className="cours-selectionnes">
                    <small>Cours sélectionnés: {formAjout.cours.join(', ')}</small></div>
                )}
              </div>

              <div className="form-group">
                <label>Image du professeur</label>
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

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="estPermanent"
                    checked={formAjout.estPermanent}
                    onChange={handleChangeAjout}
                  />
                  <span className="checkmark"></span>
                  Professeur permanent
                </label>
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

      {/* Modal de visualisation */}
   {/* Modal de visualisation de professeur */}
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
            <div className="statut-badge">
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

          <div className="info-card">
            <div className="info-label">Matière</div>
            <div className="info-value">
              <BookOpen size={16} className="inline mr-1" /> {professeurSelectionne.matiere || 'Non définie'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Type de contrat</div>
            <div className="info-value">
              {professeurSelectionne.estPermanent ? '📋 Permanent' : '📄 Temporaire'}
            </div>
          </div>
        </div>

        <div className="cours-section">
          <h4>
            <BookOpen size={20} className="inline mr-2" /> Cours Enseignés
          </h4>
          <div className="cours-badges">
            {professeurSelectionne.cours.length > 0 ? (
              professeurSelectionne.cours.map((cours, index) => (
                <span key={index} className="cours-badge">{cours}</span>
              ))
            ) : (
              <span className="no-cours">Aucun cours assigné</span>
            )}
          </div>
        </div>

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

      {/* Modal de modification */}
    {/* Modal de modification de professeur */}
{showEditModal && professeurAModifier && (
  <div className="modal-overlay" onClick={closeEditModal}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Modifier le professeur</h3>
        <button className="btn-fermer-modal" onClick={closeEditModal}>×</button>
      </div>
      
      <form onSubmit={handleSubmitModifier} className="form-ajout-etudiant">
        <div className="form-group">
          <label>Nom *</label>
          <input
            type="text"
            name="nom"
            placeholder="Nom complet"
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
            placeholder="Téléphone"
            value={formModifier.telephone}
            onChange={handleChangeModifier}
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
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
                color: '#666',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPasswordModifier ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <small style={{color: '#666', fontSize: '12px'}}>
            Laisser vide pour conserver le mot de passe actuel
          </small>
        </div>

        <div className="form-group">
          <label>Matière *</label>
          <input
            type="text"
            name="matiere"
            placeholder="Matière enseignée"
            value={formModifier.matiere}
            onChange={handleChangeModifier}
            required
          />
        </div>

        <div className="form-group">
          <label>Cours (multi-sélection possible)</label>
          <div className="cours-selection-container">
            {listeCours.map((cours) => (
              <div
                key={cours._id}
                className={`cours-chip ${formModifier.cours.includes(cours.nom) ? 'selected' : ''}`}
                onClick={() => handleSelectCoursModifier(cours.nom)}
              >
                <span className="cours-nom">{cours.nom}</span>
                {formModifier.cours.includes(cours.nom) && (
                  <span className="cours-check">✓</span>
                )}
              </div>
            ))}
          </div>
          {formModifier.cours.length > 0 && (
            <div className="cours-selectionnes">
              <small>Cours sélectionnés: {formModifier.cours.join(', ')}</small>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleImageChangeModifier}
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
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="actif"
              checked={formModifier.actif}
              onChange={handleChangeModifier}
            />
            Professeur actif
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="estPermanent"
              checked={formModifier.estPermanent}
              onChange={handleChangeModifier}
            />
            Professeur permanent
          </label>
        </div>

        {messageModifier && (
          <div className={`message-ajout ${messageModifier.includes('✅') ? 'success' : 'error'}`}>
            {messageModifier}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={closeEditModal} className="btn-annuler">
            Annuler
          </button>
          <button type="submit" disabled={loadingModifier} className="btn-enregistrer">
            {loadingModifier ? 'Modification...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default PedagogiePageprof;