import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ListeEtudiants.css'; // Utilise les mêmes styles que ListeEtudiants
import { 
  User, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Eye, 
  BookOpen, 
  Calendar, 
  Cake, 
  X 
} from "lucide-react";
import SidebarProf from '../components/SidebarProf';

const EtudiantsProfesseur = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [etudiantsFiltres, setEtudiantsFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreGenre, setFiltreGenre] = useState('');
  const [filtreCours, setFiltreCours] = useState('');
  const [filtreActif, setFiltreActif] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [etudiantsParPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [vueMode, setVueMode] = useState('tableau'); // 'tableau' ou 'carte'

  // États pour le modal de visualisation
  const [showViewModal, setShowViewModal] = useState(false);
  const [etudiantSelectionne, setEtudiantSelectionne] = useState(null);

  useEffect(() => {
    fetchEtudiants();
  }, []);

  useEffect(() => {
    filtrerEtudiants();
  }, [etudiants, recherche, filtreGenre, filtreCours, filtreActif]);

  const fetchEtudiants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://195.179.229.230:5000/api/professeur/etudiants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEtudiants(res.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtrerEtudiants = () => {
    let resultats = etudiants;

    // Filtre par recherche (nom, téléphone, email)
    if (recherche) {
      resultats = resultats.filter(e =>
        e.nomComplet.toLowerCase().includes(recherche.toLowerCase()) ||
        e.telephone.includes(recherche) ||
        (e.email && e.email.toLowerCase().includes(recherche.toLowerCase()))
      );
    }

    // Filtre par genre
    if (filtreGenre) {
      resultats = resultats.filter(e => e.genre === filtreGenre);
    }

    // Filtre par cours
    if (filtreCours) {
      resultats = resultats.filter(e => 
        e.cours.some(cours => cours.toLowerCase().includes(filtreCours.toLowerCase()))
      );
    }

    // Filtre par statut actif
    if (filtreActif !== '') {
      resultats = resultats.filter(e => e.actif === (filtreActif === 'true'));
    }

    setEtudiantsFiltres(resultats);
    setPageActuelle(1); // Reset à la première page après filtrage
  };
   const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleView = async (etudiant) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const resEtudiant = await axios.get(`http://195.179.229.230:5000/api/etudiants/${etudiant._id}`, config);
      setEtudiantSelectionne(resEtudiant.data);
      setShowViewModal(true);
    } catch (err) {
      console.error('Erreur lors du chargement des détails de l\'étudiant:', err);
      // Fallback avec les données déjà disponibles
      setEtudiantSelectionne(etudiant);
      setShowViewModal(true);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setEtudiantSelectionne(null);
  };

  const viderFiltres = () => {
    setRecherche('');
    setFiltreGenre('');
    setFiltreCours('');
    setFiltreActif('');
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

  // Pagination
  const indexDernierEtudiant = pageActuelle * etudiantsParPage;
  const indexPremierEtudiant = indexDernierEtudiant - etudiantsParPage;
  const etudiantsActuels = etudiantsFiltres.slice(indexPremierEtudiant, indexDernierEtudiant);
  const totalPages = Math.ceil(etudiantsFiltres.length / etudiantsParPage);

  const changerPage = (numerePage) => {
    setPageActuelle(numerePage);
  };

  // Obtenir tous les cours uniques pour le filtre
  const coursUniques = [...new Set(etudiants.flatMap(e => e.cours || []))];

  if (loading) {
    return <div className="loading">Chargement des étudiants...</div>;
  }

  return (
    <div className="liste-etudiants-container" style={{
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
  }}>
              {/* Header */} <SidebarProf onLogout={handleLogout}/> {/* ✅ Utilisation du composant SidebarProfesseur */}

      <div className="header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ width: '100%', textAlign: 'center' }}>Liste de mes étudiants</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {etudiantsFiltres.length} étudiants
          </div>
          
          {/* Boutons de basculement vue */}
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
                <th>Nom Complet</th>
                <th>Genre</th>
                <th>Date de Naissance</th>
                <th>Âge</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Cours</th>
                <th>Statut</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {etudiantsActuels.length === 0 ? (
                <tr>
                  <td colSpan="10" className="aucun-resultat">
                    Aucun étudiant trouvé
                  </td>
                </tr>
              ) : (
                etudiantsActuels.map((e) => (
                  <tr key={e._id}>
                    <td className="nom-colonne">{e.nomComplet}</td>
                    <td>{e.genre}</td>
                    <td>{formatDate(e.dateNaissance)}</td>
                    <td>{calculerAge(e.dateNaissance)} ans</td>
                    <td>{e.telephone}</td>
                    <td>{e.email || 'N/A'}</td>
                    <td className="cours-colonne">
                      {(e.cours || []).join(', ')}
                    </td>
                    <td className="statut-colonne">
                      <span className={`statut-text ${e.actif ? 'actif' : 'inactif'}`}>
                        {e.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="image-colonne">
                      {e.image ? (
                        <img 
                          src={`http://195.179.229.230:5000${e.image}`} 
                          alt="etudiant" 
                          className="image-etudiant"
                        />
                      ) : (
                        <div className="pas-image">N/A</div>
                      )}
                    </td>
                    <td className="actions-colonne">
                      <button 
                        onClick={() => handleView(e)}
                        className="btn-voir"
                      >
                        Voir
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
          {etudiantsActuels.length === 0 ? (
            <div className="aucun-resultat-cartes">
              Aucun étudiant trouvé
            </div>
          ) : (
            <div className="cartes-grid">
              {etudiantsActuels.map((e) => (
                <div key={e._id} className="carte-etudiant">
                  <div className="carte-header">
                    <div className="carte-image">
                      {e.image ? (
                        <img 
                          src={`http://195.179.229.230:5000${e.image}`} 
                          alt="etudiant" 
                          className="carte-photo"
                        />
                      ) : (
                        <div className="carte-placeholder">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="carte-statut">
                      <span className={`statut-badge ${e.actif ? 'actif' : 'inactif'}`}>
                        {e.actif ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </span>
                    </div>
                  </div>
                  
                  <div className="carte-content">
                    <h3 className="carte-nom">{e.nomComplet}</h3>
                    <div className="carte-info">
                      <div className="carte-detail">
                        <span className="carte-label">Genre:</span>
                        <span>
                          <User size={16} className="inline mr-1" /> {e.genre}
                        </span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Âge:</span>
                        <span>{calculerAge(e.dateNaissance)} ans</span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Téléphone:</span>
                        <span>
                          <Phone size={16} className="inline mr-1" /> {e.telephone}
                        </span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Email:</span>
                        <span>{e.email || 'N/A'}</span>
                      </div>
                      <div className="carte-detail cours-detail">
                        <span className="carte-label">Cours:</span>
                        <div className="carte-cours">
                          {(e.cours || []).length > 0 ? (
                            e.cours.map((cours, index) => (
                              <span key={index} className="cours-tag">{cours}</span>
                            ))
                          ) : (
                            <span className="no-cours">Aucun cours</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="carte-actions">
                    <button 
                      onClick={() => handleView(e)}
                      className="btn-carte btn-voir"
                      title="Voir détails"
                    >
                      <Eye size={16} />
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
            ({indexPremierEtudiant + 1}-{Math.min(indexDernierEtudiant, etudiantsFiltres.length)} sur {etudiantsFiltres.length})
          </div>
        </div>
      )}

      {/* Modal de visualisation d'étudiant */}
      {showViewModal && etudiantSelectionne && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Informations de l'étudiant</h3>
              <button className="btn-fermer-modal" onClick={closeViewModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="etudiant-details">
              <div className="etudiant-header">
                <div className="etudiant-image-section">
                  {etudiantSelectionne.image ? (
                    <img 
                      src={`http://195.179.229.230:5000${etudiantSelectionne.image}`} 
                      alt="Photo de l'étudiant" 
                      className="etudiant-image-large"
                    />
                  ) : (
                    <div className="etudiant-image-placeholder">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <div className="etudiant-info-principal">
                  <h2>{etudiantSelectionne.nomComplet}</h2>
                  <div className="statut-badge">
                    <span className={`badge ${etudiantSelectionne.actif ? 'actif' : 'inactif'}`}>
                      {etudiantSelectionne.actif ? (
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
                    <User size={16} className="inline mr-1" /> {etudiantSelectionne.genre}
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Date de Naissance</div>
                  <div className="info-value">
                    <Calendar size={16} className="inline mr-1" /> {formatDate(etudiantSelectionne.dateNaissance)}
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Âge</div>
                  <div className="info-value">
                    <Cake size={16} className="inline mr-1" /> {calculerAge(etudiantSelectionne.dateNaissance)} ans
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Téléphone</div>
                  <div className="info-value">
                    <Phone size={16} className="inline mr-1" /> {etudiantSelectionne.telephone}
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Email</div>
                  <div className="info-value">
                    {etudiantSelectionne.email || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="cours-section">
                <h4>
                  <BookOpen size={20} className="inline mr-2" /> Cours Inscrits
                </h4>
                <div className="cours-badges">
                  {(etudiantSelectionne.cours || []).length > 0 ? (
                    etudiantSelectionne.cours.map((cours, index) => (
                      <span key={index} className="cours-badge">{cours}</span>
                    ))
                  ) : (
                    <span className="no-cours">Aucun cours inscrit</span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={closeViewModal} className="btn-fermer">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EtudiantsProfesseur;