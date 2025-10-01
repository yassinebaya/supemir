import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Phone, Mail, Users, TrendingUp, DollarSign, AlertCircle, Eye, Lock, Shield, CheckCircle, XCircle } from 'lucide-react';
import './CommercialPage.css'; // Utilise le même CSS que la page commerciale
import Sidebar from '../components/Sidebar';

const handleLogout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
  }
  window.location.href = '/';
};

const AdministratifPage = () => {
  const [administratifs, setAdministratifs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [administratifToDelete, setAdministratifToDelete] = useState(null);
  const [editingAdministratif, setEditingAdministratif] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newAdministratif, setNewAdministratif] = useState({ 
    nom: '', 
    telephone: '', 
    email: '',
    motDePasse: '',
    confirmPassword: '',
    actif: true
  });

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? window.localStorage?.getItem('token') : null;
  const headers = { 
    'Authorization': `Bearer ${token}`, 
    'Content-Type': 'application/json' 
  };

  const fetchAdministratifs = async () => {
    try {
      const res = await fetch('http://195.179.229.230:5000/api/administratifs', { headers });
      if (!res.ok) throw new Error('Erreur lors du chargement des administratifs');
      const data = await res.json();
      setAdministratifs(data);
    } catch (error) {
      console.error('Erreur fetchAdministratifs:', error);
      setError('Impossible de charger les administratifs');
    }
  };

  const validateForm = () => {
    if (!newAdministratif.nom.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!newAdministratif.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdministratif.email)) {
      setError('Format d\'email invalide');
      return false;
    }
    
    // Validation du mot de passe pour les nouveaux administratifs
    if (!editingAdministratif && !newAdministratif.motDePasse) {
      setError('Le mot de passe est requis');
      return false;
    }
    
    // Vérification de la confirmation du mot de passe
    if (newAdministratif.motDePasse && newAdministratif.motDePasse !== newAdministratif.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    // Validation de la force du mot de passe
    if (newAdministratif.motDePasse && newAdministratif.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    return true;
  };

  const handleCreateOrUpdateAdministratif = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const url = editingAdministratif 
        ? `http://195.179.229.230:5000/api/administratifs/${editingAdministratif._id}`
        : 'http://195.179.229.230:5000/api/administratifs';
      
      const method = editingAdministratif ? 'PUT' : 'POST';
      
      // Préparer les données à envoyer
      const dataToSend = {
        nom: newAdministratif.nom,
        telephone: newAdministratif.telephone,
        email: newAdministratif.email,
        actif: newAdministratif.actif
      };
      
      // Inclure le mot de passe seulement s'il est fourni
      if (newAdministratif.motDePasse) {
        dataToSend.motDePasse = newAdministratif.motDePasse;
      }
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(dataToSend)
      });
      
      if (res.ok) {
        resetForm();
        await fetchAdministratifs();
        setShowModal(false);
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur création/modification administratif:', error);
      setError(error.message || 'Impossible de sauvegarder l\'administratif');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdministratif = async () => {
    if (!administratifToDelete) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://195.179.229.230:5000/api/administratifs/${administratifToDelete._id}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        await fetchAdministratifs();
        setShowDeleteModal(false);
        setAdministratifToDelete(null);
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression administratif:', error);
      setError('Impossible de supprimer l\'administratif');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (administratif) => {
    try {
      setLoading(true);
      const res = await fetch(`http://195.179.229.230:5000/api/administratifs/${administratif._id}/actif`, {
        method: 'PATCH',
        headers
      });
      
      if (res.ok) {
        await fetchAdministratifs();
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
    setNewAdministratif({ 
      nom: '', 
      telephone: '', 
      email: '',
      motDePasse: '',
      confirmPassword: '',
      actif: true
    });
    setEditingAdministratif(null);
    setShowPassword(false);
    setError('');
  };

  const openEditModal = (administratif) => {
    setEditingAdministratif(administratif);
    setNewAdministratif({
      nom: administratif.nom || '',
      telephone: administratif.telephone || '',
      email: administratif.email || '',
      motDePasse: '',
      confirmPassword: '',
      actif: administratif.actif !== false
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  useEffect(() => {
    fetchAdministratifs();
  }, []);

  return (
    <div className="commercial-page">
      <Sidebar onLogout={handleLogout} />
      
      <div className="container">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-info">
              <h1 className="page-title">Gestion des Scolarité</h1>
            </div>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={20} />
              Nouvelle Scolarité
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
              className="btn-close"
              style={{ marginLeft: 'auto' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Administratifs List */}
        <div className="commercials-card">
          <h2 className="section-title">
            <Shield size={24} className="icon-green" />
            Scolarité ({administratifs.length})
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Chargement des administratifs...</p>
            </div>
          ) : (
            <div className="commercials-grid">
              {administratifs.map(administratif => (
                <div key={administratif._id} className="commercial-item">
                  <div className="commercial-header">
                    <h3 className="commercial-name">{administratif.nom}</h3>
                    <div className="commercial-actions">
                      <button
                        onClick={() => handleToggleActive(administratif)}
                        className={`badge ${administratif.actif ? 'green-badge' : 'red-badge'}`}
                        title={`Cliquer pour ${administratif.actif ? 'désactiver' : 'activer'}`}
                        style={{ 
                          cursor: 'pointer',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {administratif.actif ? (
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
                      <button
                        onClick={() => openEditModal(administratif)}
                        className="btn-icon yellow"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setAdministratifToDelete(administratif);
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
                    {administratif.telephone && (
                      <div className="detail-item">
                        <Phone size={14} />
                        {administratif.telephone}
                      </div>
                    )}
                    {administratif.email && (
                      <div className="detail-item">
                        <Mail size={14} />
                        {administratif.email}
                      </div>
                    )}
                    <div className="detail-small">
                      Créé le {new Date(administratif.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {administratifs.length === 0 && !loading && (
            <div className="no-students">
              <Shield size={48} />
              <p>Aucun administratif trouvé</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                Créer le premier administratif
              </button>
            </div>
          )}
        </div>

        {/* Modal for Add/Edit Administratif */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingAdministratif ? 'Modifier Scolarité' : 'Nouvelle Scolarité'}
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
                <div className="form-group">
                  <label>Nom complet *</label>
                  <input
                    type="text"
                    value={newAdministratif.nom}
                    onChange={e => setNewAdministratif({ ...newAdministratif, nom: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={newAdministratif.telephone}
                    onChange={e => setNewAdministratif({ ...newAdministratif, telephone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newAdministratif.email}
                    onChange={e => setNewAdministratif({ ...newAdministratif, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    {editingAdministratif ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newAdministratif.motDePasse}
                      onChange={e => setNewAdministratif({ ...newAdministratif, motDePasse: e.target.value })}
                      required={!editingAdministratif}
                      placeholder={editingAdministratif ? "Nouveau mot de passe..." : "Mot de passe..."}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>

                {newAdministratif.motDePasse && (
                  <div className="form-group">
                    <label>Confirmer le mot de passe *</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newAdministratif.confirmPassword}
                      onChange={e => setNewAdministratif({ ...newAdministratif, confirmPassword: e.target.value })}
                      placeholder="Confirmer le mot de passe..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newAdministratif.actif}
                      onChange={e => setNewAdministratif({ ...newAdministratif, actif: e.target.checked })}
                    />
                    <CheckCircle size={16} />
                    Compte actif
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    onClick={handleCreateOrUpdateAdministratif}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Sauvegarde...' : editingAdministratif ? 'Modifier' : 'Ajouter'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && administratifToDelete && (
          <div className="modal-overlay">
            <div className="modal small">
              <div className="modal-header">
                <h3 className="modal-title">Confirmer la suppression</h3>
              </div>
              <div className="modal-body">
                <p className="modal-text">
                  Êtes-vous sûr de vouloir supprimer l'administratif <strong>{administratifToDelete.nom}</strong> ?
                  Cette action est irréversible.
                </p>
                <div className="modal-actions">
                  <button
                    onClick={handleDeleteAdministratif}
                    disabled={loading}
                    className="btn btn-danger"
                  >
                    {loading ? 'Suppression...' : 'Supprimer'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setAdministratifToDelete(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdministratifPage;