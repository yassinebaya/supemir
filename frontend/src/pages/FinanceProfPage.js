import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Phone, Mail, Users, TrendingUp, DollarSign, AlertCircle, Eye, Lock, Shield, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import './CommercialPage.css'; // Utilise le même CSS que la page commerciale
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح

const handleLogout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
  }
  window.location.href = '/';
};

const FinanceProfPage = () => {
  const [profs, setProfs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profToDelete, setProfToDelete] = useState(null);
  const [editingProf, setEditingProf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newProf, setNewProf] = useState({ 
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

  const fetchProfs = async () => {
    try {
      const res = await fetch('http://195.179.229.230:5000/api/admin/financeprofs', { headers });
      if (!res.ok) throw new Error('Erreur lors du chargement des professeurs');
      const data = await res.json();
      setProfs(data.data || data);
    } catch (error) {
      console.error('Erreur fetchProfs:', error);
      setError('Impossible de charger les professeurs de finance');
    }
  };

  const validateForm = () => {
    if (!newProf.nom.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!newProf.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newProf.email)) {
      setError('Format d\'email invalide');
      return false;
    }
    
    if (!newProf.telephone.trim()) {
      setError('Le téléphone est requis');
      return false;
    }
    
    // Validation du mot de passe pour les nouveaux professeurs
    if (!editingProf && !newProf.motDePasse) {
      setError('Le mot de passe est requis');
      return false;
    }
    
    // Vérification de la confirmation du mot de passe
    if (newProf.motDePasse && newProf.motDePasse !== newProf.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    // Validation de la force du mot de passe
    if (newProf.motDePasse && newProf.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    return true;
  };

  const handleCreateOrUpdateProf = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const url = editingProf 
        ? `http://195.179.229.230:5000/api/admin/financeprofs/${editingProf._id}`
        : 'http://195.179.229.230:5000/api/admin/financeprofs';
      
      const method = editingProf ? 'PUT' : 'POST';
      
      // Préparer les données à envoyer
      const dataToSend = {
        nom: newProf.nom,
        telephone: newProf.telephone,
        email: newProf.email,
        actif: newProf.actif
      };
      
      // Inclure le mot de passe seulement s'il est fourni
      if (newProf.motDePasse) {
        dataToSend.motDePasse = newProf.motDePasse;
      }
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(dataToSend)
      });
      
      if (res.ok) {
        resetForm();
        await fetchProfs();
        setShowModal(false);
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur création/modification prof:', error);
      setError(error.message || 'Impossible de sauvegarder le professeur');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProf = async () => {
    if (!profToDelete) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://195.179.229.230:5000/api/admin/financeprofs/${profToDelete._id}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        await fetchProfs();
        setShowDeleteModal(false);
        setProfToDelete(null);
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression prof:', error);
      setError('Impossible de supprimer le professeur');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (prof) => {
    try {
      setLoading(true);
      const res = await fetch(`http://195.179.229.230:5000/api/admin/financeprofs/${prof._id}/toggle-status`, {
        method: 'PATCH',
        headers
      });
      
      if (res.ok) {
        await fetchProfs();
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
    setNewProf({ 
      nom: '', 
      telephone: '', 
      email: '',
      motDePasse: '',
      confirmPassword: '',
      actif: true
    });
    setEditingProf(null);
    setShowPassword(false);
    setError('');
  };

  const openEditModal = (prof) => {
    setEditingProf(prof);
    setNewProf({
      nom: prof.nom || '',
      telephone: prof.telephone || '',
      email: prof.email || '',
      motDePasse: '',
      confirmPassword: '',
      actif: prof.actif !== false
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  useEffect(() => {
    fetchProfs();
  }, []);

  return (
    <div className="commercial-page">
      <Sidebar onLogout={handleLogout} />
      
      <div className="container">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-info">
              <h1 className="page-title">Gestion des Professeurs de Finance</h1>
            </div>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={20} />
              Nouveau Professeur
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

        {/* Profs List */}
        <div className="commercials-card">
          <h2 className="section-title">
            <GraduationCap size={24} className="icon-green" />
            Professeurs de Finance ({profs.length})
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Chargement des professeurs...</p>
            </div>
          ) : (
            <div className="commercials-grid">
              {profs.map(prof => (
                <div key={prof._id} className="commercial-item">
                  <div className="commercial-header">
                    <h3 className="commercial-name">{prof.nom}</h3>
                    <div className="commercial-actions">
                      <button
                        onClick={() => handleToggleActive(prof)}
                        className={`badge ${prof.actif ? 'green-badge' : 'red-badge'}`}
                        title={`Cliquer pour ${prof.actif ? 'désactiver' : 'activer'}`}
                        style={{ 
                          cursor: 'pointer',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {prof.actif ? (
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
                        onClick={() => openEditModal(prof)}
                        className="btn-icon yellow"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setProfToDelete(prof);
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
                    {prof.telephone && (
                      <div className="detail-item">
                        <Phone size={14} />
                        {prof.telephone}
                      </div>
                    )}
                    {prof.email && (
                      <div className="detail-item">
                        <Mail size={14} />
                        {prof.email}
                      </div>
                    )}
                    <div className="detail-small">
                      Créé le {new Date(prof.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {profs.length === 0 && !loading && (
            <div className="no-students">
              <GraduationCap size={48} />
              <p>Aucun professeur de finance trouvé</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                Créer le premier professeur
              </button>
            </div>
          )}
        </div>

        {/* Modal for Add/Edit Prof */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingProf ? 'Modifier Professeur' : 'Nouveau Professeur'}
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
                    value={newProf.nom}
                    onChange={e => setNewProf({ ...newProf, nom: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="tel"
                    value={newProf.telephone}
                    onChange={e => setNewProf({ ...newProf, telephone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newProf.email}
                    onChange={e => setNewProf({ ...newProf, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    {editingProf ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newProf.motDePasse}
                      onChange={e => setNewProf({ ...newProf, motDePasse: e.target.value })}
                      required={!editingProf}
                      placeholder={editingProf ? "Nouveau mot de passe..." : "Mot de passe..."}
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

                {newProf.motDePasse && (
                  <div className="form-group">
                    <label>Confirmer le mot de passe *</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newProf.confirmPassword}
                      onChange={e => setNewProf({ ...newProf, confirmPassword: e.target.value })}
                      placeholder="Confirmer le mot de passe..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newProf.actif}
                      onChange={e => setNewProf({ ...newProf, actif: e.target.checked })}
                    />
                    <CheckCircle size={16} />
                    Compte actif
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    onClick={handleCreateOrUpdateProf}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Sauvegarde...' : editingProf ? 'Modifier' : 'Ajouter'}
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
        {showDeleteModal && profToDelete && (
          <div className="modal-overlay">
            <div className="modal small">
              <div className="modal-header">
                <h3 className="modal-title">Confirmer la suppression</h3>
              </div>
              <div className="modal-body">
                <p className="modal-text">
                  Êtes-vous sûr de vouloir supprimer le professeur <strong>{profToDelete.nom}</strong> ?
                  Cette action est irréversible.
                </p>
                <div className="modal-actions">
                  <button
                    onClick={handleDeleteProf}
                    disabled={loading}
                    className="btn btn-danger"
                  >
                    {loading ? 'Suppression...' : 'Supprimer'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProfToDelete(null);
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

export default FinanceProfPage;