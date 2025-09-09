import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Phone, Mail, Users, TrendingUp, DollarSign, AlertCircle, Eye, Lock, Shield, CheckCircle, XCircle } from 'lucide-react';
import './CommercialPage.css';
import Sidebar from '../components/Sidebar';

const handleLogout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
  }
  window.location.href = '/';
};

const CommercialPage = () => {
  const [commerciaux, setCommerciaux] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [allEtudiants, setAllEtudiants] = useState([]);
  const [statistiques, setStatistiques] = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commercialToDelete, setCommercialToDelete] = useState(null);
  const [editingCommercial, setEditingCommercial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newCommercial, setNewCommercial] = useState({ 
    nom: '', 
    telephone: '', 
    email: '',
    motDePasse: '',
    confirmPassword: '',
    estAdminInscription: false,
    actif: true
  });

  // Get token from localStorage (or your auth system)
  const token = typeof window !== 'undefined' ? window.localStorage?.getItem('token') : null;
  const headers = { 
    'Authorization': `Bearer ${token}`, 
    'Content-Type': 'application/json' 
  };

  const fetchCommerciaux = async () => {
    try {
      const res = await fetch('http://195.179.229.230:5000/api/commerciaux', { headers });
      if (!res.ok) throw new Error('Erreur lors du chargement des commerciaux');
      const data = await res.json();
      setCommerciaux(data);
    } catch (error) {
      console.error('Erreur fetchCommerciaux:', error);
      setError('Impossible de charger les commerciaux');
    }
  };

  const fetchAllEtudiants = async () => {
    try {
      const res = await fetch('http://195.179.229.230:5000/api/etudiants', { headers });
      if (!res.ok) throw new Error('Erreur lors du chargement des étudiants');
      const data = await res.json();
      setAllEtudiants(data);
    } catch (error) {
      console.error('Erreur fetchAllEtudiants:', error);
    }
  };

  const fetchStatistiques = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://195.179.229.230:5000/api/commerciaux/statistiques', { headers });
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Transform the data to match expected format
      const transformedData = data.map(stat => ({
        nom: stat.commercialInfo?.nom || 'Commercial inconnu',
        chiffreAffaire: stat.chiffreAffaire || 0,
        totalRecu: stat.totalRecu || 0,
        reste: stat.reste || 0,
        countEtudiants: stat.countEtudiants || 0
      }));
      
      setStatistiques(transformedData);
      setError('');
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setError('Impossible de charger les statistiques de paiement');
      setStatistiques([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEtudiantsByCommercial = async (commercialId) => {
    try {
      const filtered = allEtudiants.filter(e => e.commercial === commercialId);
      setEtudiants(filtered);
    } catch (error) {
      console.error('Erreur fetchEtudiants:', error);
      setError('Impossible de charger les étudiants');
    }
  };

  const validateForm = () => {
    if (!newCommercial.nom.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!newCommercial.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCommercial.email)) {
      setError('Format d\'email invalide');
      return false;
    }
    
    if (!newCommercial.telephone.trim()) {
      setError('Le téléphone est requis');
      return false;
    }
    
    // Validation du mot de passe pour les nouveaux commerciaux
    if (!editingCommercial && !newCommercial.motDePasse) {
      setError('Le mot de passe est requis');
      return false;
    }
    
    // Vérification de la confirmation du mot de passe
    if (newCommercial.motDePasse && newCommercial.motDePasse !== newCommercial.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    // Validation de la force du mot de passe
    if (newCommercial.motDePasse && newCommercial.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    return true;
  };

  const handleCreateOrUpdateCommercial = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const url = editingCommercial 
        ? `http://195.179.229.230:5000/api/commerciaux/${editingCommercial._id}`
        : 'http://195.179.229.230:5000/api/commerciaux'; // Fixed endpoint consistency
      
      const method = editingCommercial ? 'PUT' : 'POST';
      
      // Préparer les données à envoyer
      const dataToSend = {
        nom: newCommercial.nom,
        telephone: newCommercial.telephone,
        email: newCommercial.email,
        estAdminInscription: newCommercial.estAdminInscription,
        actif: newCommercial.actif
      };
      
      // Inclure le mot de passe seulement s'il est fourni
      if (newCommercial.motDePasse) {
        dataToSend.motDePasse = newCommercial.motDePasse;
      }
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(dataToSend)
      });
      
      if (res.ok) {
        resetForm();
        await fetchCommerciaux();
        await fetchStatistiques();
        setShowModal(false);
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur création/modification commercial:', error);
      setError(error.message || 'Impossible de sauvegarder le commercial');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommercial = async () => {
    if (!commercialToDelete) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://195.179.229.230:5000/api/commerciaux/${commercialToDelete._id}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        await fetchCommerciaux();
        await fetchStatistiques();
        setShowDeleteModal(false);
        setCommercialToDelete(null);
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression commercial:', error);
      setError('Impossible de supprimer le commercial');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (commercial) => {
    try {
      setLoading(true);
      const res = await fetch(`http://195.179.229.230:5000/api/commerciaux/${commercial._id}/actif`, {
        method: 'PATCH',
        headers
      });
      
      if (res.ok) {
        await fetchCommerciaux();
        await fetchStatistiques();
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la modification du statut');
      }
    } catch (error) {
      console.error('Erreur toggle actif:', error);
      setError('Impossible de modifier le statut');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewCommercial({ 
      nom: '', 
      telephone: '', 
      email: '',
      motDePasse: '',
      confirmPassword: '',
      estAdminInscription: false,
      actif: true
    });
    setEditingCommercial(null);
    setShowPassword(false);
    setError('');
  };

  const openEditModal = (commercial) => {
    setEditingCommercial(commercial);
    setNewCommercial({
      nom: commercial.nom || '',
      telephone: commercial.telephone || '',
      email: commercial.email || '',
      motDePasse: '',
      confirmPassword: '',
      estAdminInscription: commercial.estAdminInscription || false,
      actif: commercial.actif !== false // Default to true if undefined
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCommercialClick = (commercial) => {
    setSelectedCommercial(commercial);
    fetchEtudiantsByCommercial(commercial._id);
  };

  const openStudentModal = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  useEffect(() => {
    fetchCommerciaux();
    fetchStatistiques();
    fetchAllEtudiants();
  }, []);

  return (
    <div className="commercial-page">
      <Sidebar onLogout={handleLogout} />
      
      <div className="container">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-info">
              <h1 className="page-title">Gestion Commerciale</h1>
            </div>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={20} />
              Nouveau Commercial
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            {error}
            <button 
              onClick={() => setError('')}
              className="error-close"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Statistics Table */}
        <div className="stats-card">
          <h2 className="section-title">
            <TrendingUp size={24} className="icon-blue" />
            Statistiques de Paiement
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Chargement des statistiques...</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Commercial</th>
                    <th>Étudiants</th>
                    <th>Chiffre d'affaires</th>
                    <th>Total Reçu</th>
                    <th>Reste à Payer</th>
                  </tr>
                </thead>
                <tbody>
                  {statistiques.length > 0 ? (
                    statistiques.map((stat, index) => (
                      <tr key={index}>
                        <td>
                          <div className="commercial-name">{stat.nom}</div>
                        </td>
                        <td>
                          <div className="student-count">{stat.countEtudiants || 0}</div>
                        </td>
                        <td className="amount blue">
                          {(stat.chiffreAffaire || 0).toLocaleString('fr-FR')} MAD
                        </td>
                        <td className="amount green">
                          {(stat.totalRecu || 0).toLocaleString('fr-FR')} MAD
                        </td>
                        <td className={`amount ${(stat.reste || 0) > 0 ? 'red' : 'green'}`}>
                          {(stat.reste || 0).toLocaleString('fr-FR')} MAD
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {error ? 'Erreur de chargement' : 'Aucune donnée disponible'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commercials List */}
        <div className="commercials-card">
          <h2 className="section-title">
            <Users size={24} className="icon-green" />
            Liste des Commerciaux ({commerciaux.length})
          </h2>
          
          <div className="commercials-grid">
            {commerciaux.map(commercial => (
              <div key={commercial._id} className="commercial-item">
                <div className="commercial-header">
                  <h3 className="commercial-name">{commercial.nom}</h3>
                  <div className="commercial-badges">
                    {commercial.estAdminInscription && (
                      <span className="badge admin-badge" title="Admin Inscription">
                        <Shield size={12} />
                        Admin
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleActive(commercial)}
                      className={`badge ${commercial.actif ? 'green-badge' : 'gray-badge'} clickable-badge`}
                      title={`Cliquer pour ${commercial.actif ? 'désactiver' : 'activer'}`}
                    >
                      {commercial.actif ? (
                        <>
                          <CheckCircle size={12} />
                          Actif
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          Inactif
                        </>
                      )}
                    </button>
                  </div>
                  <div className="commercial-actions">
                    <button
                      onClick={() => handleCommercialClick(commercial)}
                      className="btn-icon blue"
                      title="Voir les étudiants"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openEditModal(commercial)}
                      className="btn-icon yellow"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setCommercialToDelete(commercial);
                        setShowDeleteModal(true);
                      }}
                      className="btn-icon red"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="commercial-details">
                  {commercial.telephone && (
                    <div className="detail-item">
                      <Phone size={14} />
                      {commercial.telephone}
                    </div>
                  )}
                  {commercial.email && (
                    <div className="detail-item">
                      <Mail size={14} />
                      {commercial.email}
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="creation-date">
                      Créé le {new Date(commercial.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Students Section */}
        {selectedCommercial && (
          <div className="students-card">
            <h2 className="section-title">
              🎓 Étudiants de {selectedCommercial.nom} ({etudiants.length})
            </h2>
            
            {etudiants.length > 0 ? (
              <div className="students-grid">
                {etudiants.map(etudiant => (
                  <div key={etudiant._id} className="student-item">
                    <div className="student-header">
                      <h3 className="student-name">
                        {etudiant.prenom} {etudiant.nomDeFamille}
                      </h3>
                      <button
                        onClick={() => openStudentModal(etudiant)}
                        className="btn-icon blue"
                        title="Voir détails"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    
                    <div className="student-details">
                      <div className="detail-item">
                        <Mail size={14} />
                        {etudiant.email}
                      </div>
                      {etudiant.telephone && (
                        <div className="detail-item">
                          <Phone size={14} />
                          {etudiant.telephone}
                        </div>
                      )}
                      {etudiant.filiere && (
                        <div className="badge blue-badge">
                          📚 {etudiant.filiere}
                        </div>
                      )}
                      {etudiant.prixTotal && (
                        <div className="detail-item price">
                          <DollarSign size={14} />
                          {etudiant.prixTotal.toLocaleString('fr-FR')} MAD
                        </div>
                      )}
                      <div className={`badge ${etudiant.paye ? 'green-badge' : 'red-badge'}`}>
                        {etudiant.paye ? '✅ Payé' : '❌ Non payé'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-students">
                <Users size={48} />
                <p>Aucun étudiant trouvé pour ce commercial</p>
              </div>
            )}
          </div>
        )}

        {/* Modal for Add/Edit Commercial */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal large">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingCommercial ? 'Modifier Commercial' : 'Nouveau Commercial'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-close"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleCreateOrUpdateCommercial}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nom complet *</label>
                      <input
                        type="text"
                        value={newCommercial.nom}
                        onChange={e => setNewCommercial({ ...newCommercial, nom: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Téléphone *</label>
                      <input
                        type="tel"
                        value={newCommercial.telephone}
                        onChange={e => setNewCommercial({ ...newCommercial, telephone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={newCommercial.email}
                        onChange={e => setNewCommercial({ ...newCommercial, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        {editingCommercial ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                      </label>
                      <div className="password-input-container">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newCommercial.motDePasse}
                          onChange={e => setNewCommercial({ ...newCommercial, motDePasse: e.target.value })}
                          required={!editingCommercial}
                          placeholder={editingCommercial ? "Nouveau mot de passe..." : "Mot de passe..."}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>

                    {newCommercial.motDePasse && (
                      <div className="form-group">
                        <label>Confirmer le mot de passe *</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newCommercial.confirmPassword}
                          onChange={e => setNewCommercial({ ...newCommercial, confirmPassword: e.target.value })}
                          placeholder="Confirmer le mot de passe..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-checkboxes">
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newCommercial.estAdminInscription}
                          onChange={e => setNewCommercial({ ...newCommercial, estAdminInscription: e.target.checked })}
                        />
                        <span className="checkbox-text">
                          <Shield size={16} />
                          Admin Inscription (peut gérer les inscriptions)
                        </span>
                      </label>
                    </div>

                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newCommercial.actif}
                          onChange={e => setNewCommercial({ ...newCommercial, actif: e.target.checked })}
                        />
                        <span className="checkbox-text">
                          <CheckCircle size={16} />
                          Compte actif
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? 'Sauvegarde...' : editingCommercial ? 'Modifier' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="btn btn-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && commercialToDelete && (
          <div className="modal-overlay">
            <div className="modal small">
              <h3 className="modal-title">Confirmer la suppression</h3>
              <p className="modal-text">
                Êtes-vous sûr de vouloir supprimer le commercial <strong>{commercialToDelete.nom}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="modal-actions">
                <button
                  onClick={handleDeleteCommercial}
                  disabled={loading}
                  className="btn btn-danger"
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCommercialToDelete(null);
                  }}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {showStudentModal && selectedStudent && (
          <div className="modal-overlay">
            <div className="modal large">
              <div className="modal-header">
                <h3 className="modal-title">Détails de l'étudiant</h3>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="btn-close"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <div className="student-details-grid">
                  <div className="detail-group">
                    <label>Prénom</label>
                    <p>{selectedStudent.prenom}</p>
                  </div>
                  <div className="detail-group">
                    <label>Nom de famille</label>
                    <p>{selectedStudent.nomDeFamille}</p>
                  </div>
                  <div className="detail-group">
                    <label>Email</label>
                    <p>{selectedStudent.email}</p>
                  </div>
                  <div className="detail-group">
                    <label>Téléphone</label>
                    <p>{selectedStudent.telephone || 'Non renseigné'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Genre</label>
                    <p>{selectedStudent.genre || 'Non renseigné'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Date de naissance</label>
                    <p>
                      {selectedStudent.dateNaissance ? new Date(selectedStudent.dateNaissance).toLocaleDateString('fr-FR') : 'Non renseigné'}
                    </p>
                  </div>
                  <div className="detail-group">
                    <label>CIN</label>
                    <p>{selectedStudent.cin || 'Non renseigné'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Pays</label>
                    <p>{selectedStudent.pays || 'Non renseigné'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Filière</label>
                    <p>{selectedStudent.filiere || 'Non renseigné'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Spécialité</label>
                    <p>{selectedStudent.specialite || 'Non renseigné'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Niveau</label>
                    <p>{selectedStudent.niveau || 'Non renseigné'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Type de diplôme</label>
                    <p>{selectedStudent.typeDiplome || 'Non renseigné'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Prix total</label>
                    <p className="price-highlight">
                      {selectedStudent.prixTotal ? `${selectedStudent.prixTotal.toLocaleString('fr-FR')} MAD` : 'Non renseigné'}
                    </p>
                  </div>
                  <div className="detail-group">
                    <label>Pourcentage bourse</label>
                    <p>{selectedStudent.pourcentageBourse ? `${selectedStudent.pourcentageBourse}%` : 'Aucune'}</p>
                  </div>
                </div>

                <div className="status-badges">
                  <div className={`status-badge ${selectedStudent.paye ? 'green' : 'red'}`}>
                    <p>Paiement</p>
                    <span>{selectedStudent.paye ? '✅ Payé' : '❌ Non payé'}</span>
                  </div>
                  <div className={`status-badge ${selectedStudent.actif ? 'green' : 'gray'}`}>
                    <p>Statut</p>
                    <span>{selectedStudent.actif ? '✅ Actif' : '⏸️ Inactif'}</span>
                  </div>
                  <div className={`status-badge ${selectedStudent.handicape ? 'blue' : 'gray'}`}>
                    <p>Handicap</p>
                    <span>{selectedStudent.handicape ? '🦽 Oui' : '❌ Non'}</span>
                  </div>
                  <div className={`status-badge ${selectedStudent.resident ? 'purple' : 'gray'}`}>
                    <p>Résident</p>
                    <span>{selectedStudent.resident ? '🏠 Oui' : '❌ Non'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommercialPage;