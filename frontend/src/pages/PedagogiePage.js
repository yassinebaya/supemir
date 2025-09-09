import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Phone, Mail, Users, GraduationCap, AlertCircle, Eye, CheckCircle, XCircle, BookOpen, Crown, Shield } from 'lucide-react';
import './CommercialPage.css'; // Utilise le même CSS que la page commerciale
import Sidebar from '../components/Sidebar';

const handleLogout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
  }
  window.location.href = '/';
};

const PedagogiePage = () => {
  const [pedagogiques, setPedagogiques] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pedagogiqueToDelete, setPedagogiqueToDelete] = useState(null);
  const [editingPedagogique, setEditingPedagogique] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPedagogique, setNewPedagogique] = useState({ 
    nom: '', 
    telephone: '', 
    email: '',
    motDePasse: '',
    confirmPassword: '',
    filiere: '',
    actif: true
  });

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? window.localStorage?.getItem('token') : null;
  const headers = { 
    'Authorization': `Bearer ${token}`, 
    'Content-Type': 'application/json' 
  };

  // Options de filières disponibles avec l'option GENERAL
  const FILIERES = [
    { value: 'GENERAL', label: '🌟 GÉNÉRAL - Toutes les filières', isGeneral: true },
    { value: 'IRM', label: 'IRM - Informatique Réseaux et Multimédia' },
    { value: 'MASI', label: 'MASI - Management et Administration des Systèmes d\'Information' },
    { value: 'CYCLE_INGENIEUR', label: 'École d\'Ingénieur' },
    { value: 'LICENCE_PRO', label: 'Licence Professionnelle' },
    { value: 'MASTER_PRO', label: 'Master Professionnel' }
  ];

  const fetchPedagogiques = async () => {
    try {
      const res = await fetch('http://195.179.229.230:5000/api/pedagogiques', { headers });
      if (!res.ok) throw new Error('Erreur lors du chargement des pédagogiques');
      const data = await res.json();
      setPedagogiques(data);
    } catch (error) {
      console.error('Erreur fetchPedagogiques:', error);
      setError('Impossible de charger les pédagogiques');
    }
  };

  const validateForm = () => {
    if (!newPedagogique.nom.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!newPedagogique.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPedagogique.email)) {
      setError('Format d\'email invalide');
      return false;
    }
    
    if (!newPedagogique.filiere) {
      setError('La filière est requise');
      return false;
    }
    
    // Validation du mot de passe pour les nouveaux pédagogiques
    if (!editingPedagogique && !newPedagogique.motDePasse) {
      setError('Le mot de passe est requis');
      return false;
    }
    
    // Vérification de la confirmation du mot de passe
    if (newPedagogique.motDePasse && newPedagogique.motDePasse !== newPedagogique.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    // Validation de la force du mot de passe
    if (newPedagogique.motDePasse && newPedagogique.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    return true;
  };

  const handleCreateOrUpdatePedagogique = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const url = editingPedagogique 
        ? `http://195.179.229.230:5000/api/pedagogiques/${editingPedagogique._id}`
        : 'http://195.179.229.230:5000/api/pedagogiques';
      
      const method = editingPedagogique ? 'PUT' : 'POST';
      
      // Préparer les données à envoyer
      const dataToSend = {
        nom: newPedagogique.nom,
        telephone: newPedagogique.telephone,
        email: newPedagogique.email,
        filiere: newPedagogique.filiere,
        actif: newPedagogique.actif
      };
      
      // Inclure le mot de passe seulement s'il est fourni
      if (newPedagogique.motDePasse) {
        dataToSend.motDePasse = newPedagogique.motDePasse;
      }
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(dataToSend)
      });
      
      if (res.ok) {
        resetForm();
        await fetchPedagogiques();
        setShowModal(false);
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur création/modification pédagogique:', error);
      setError(error.message || 'Impossible de sauvegarder le pédagogique');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePedagogique = async () => {
    if (!pedagogiqueToDelete) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://195.179.229.230:5000/api/pedagogiques/${pedagogiqueToDelete._id}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        await fetchPedagogiques();
        setShowDeleteModal(false);
        setPedagogiqueToDelete(null);
        setError('');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression pédagogique:', error);
      setError('Impossible de supprimer le pédagogique');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (pedagogique) => {
    try {
      setLoading(true);
      const res = await fetch(`http://195.179.229.230:5000/api/pedagogiques/${pedagogique._id}/toggle-actif`, {
        method: 'PATCH',
        headers
      });
      
      if (res.ok) {
        await fetchPedagogiques();
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
    setNewPedagogique({ 
      nom: '', 
      telephone: '', 
      email: '',
      motDePasse: '',
      confirmPassword: '',
      filiere: '',
      actif: true
    });
    setEditingPedagogique(null);
    setShowPassword(false);
    setError('');
  };

  const openEditModal = (pedagogique) => {
    setEditingPedagogique(pedagogique);
    setNewPedagogique({
      nom: pedagogique.nom || '',
      telephone: pedagogique.telephone || '',
      email: pedagogique.email || '',
      motDePasse: '',
      confirmPassword: '',
      filiere: pedagogique.filiere || '',
      actif: pedagogique.actif !== false
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getFiliereLabel = (filiere) => {
    const filiereObj = FILIERES.find(f => f.value === filiere);
    return filiereObj ? filiereObj.label : filiere;
  };

  const getFiliereColor = (filiere) => {
    const colors = {
      'GENERAL': '#9333ea', // Violet pour général
      'IRM': '#3b82f6',
      'MASI': '#10b981',
      'CYCLE_INGENIEUR': '#8b5cf6',
      'LICENCE_PRO': '#f59e0b',
      'MASTER_PRO': '#ef4444'
    };
    return colors[filiere] || '#6b7280';
  };

  const isGeneral = (filiere) => filiere === 'GENERAL';

  // Séparer les pédagogiques généraux et spécifiques
  const pedagogiquesGeneraux = pedagogiques.filter(p => p.filiere === 'GENERAL');
  const pedagogiquesSpecifiques = pedagogiques.filter(p => p.filiere !== 'GENERAL');

  useEffect(() => {
    fetchPedagogiques();
  }, []);

  return (
    <div className="commercial-page">
      <Sidebar onLogout={handleLogout} />
      
      <div className="container">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-info">
              <h1 className="page-title">Gestion des Pédagogiques</h1>
              <p className="page-subtitle">
                Gérer les comptes pédagogiques par filière 
                {pedagogiquesGeneraux.length > 0 && (
                  <span className="general-indicator"> • {pedagogiquesGeneraux.length} général(aux)</span>
                )}
              </p>
            </div>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={20} />
              Nouveau Pédagogique
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

        {/* Section Pédagogiques Généraux */}
        {pedagogiquesGeneraux.length > 0 && (
          <div className="commercials-card" style={{ marginBottom: '2rem' }}>
            <h2 className="section-title">
              <Crown size={24} style={{ color: '#9333ea' }} />
              Pédagogiques Généraux ({pedagogiquesGeneraux.length})
              <span style={{ 
                fontSize: '0.875rem', 
                fontWeight: 'normal', 
                color: '#6b7280',
                marginLeft: '0.5rem'
              }}>
                Accès à toutes les filières
              </span>
            </h2>
            
            <div className="commercials-grid">
              {pedagogiquesGeneraux.map(pedagogique => (
                <div key={pedagogique._id} className="commercial-item" style={{ border: '2px solid #9333ea' }}>
                  <div className="commercial-header">
                    <h3 className="commercial-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Crown size={18} style={{ color: '#9333ea' }} />
                      {pedagogique.nom}
                    </h3>
                    <div className="commercial-actions">
                      <button
                        onClick={() => handleToggleActive(pedagogique)}
                        className={`badge ${pedagogique.actif ? 'green-badge' : 'red-badge'}`}
                        title={`Cliquer pour ${pedagogique.actif ? 'désactiver' : 'activer'}`}
                        style={{ 
                          cursor: 'pointer',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {pedagogique.actif ? (
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
                        onClick={() => openEditModal(pedagogique)}
                        className="btn-icon yellow"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setPedagogiqueToDelete(pedagogique);
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
                    {/* Badge filière GENERAL */}
                    <div 
                      className="filiere-badge"
                      style={{
                        backgroundColor: '#9333ea',
                        background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 2px 4px rgba(147, 51, 234, 0.3)'
                      }}
                    >
                      <Shield size={16} />
                      PÉDAGOGIQUE GÉNÉRAL
                    </div>
                    
                    {pedagogique.telephone && (
                      <div className="detail-item">
                        <Phone size={14} />
                        {pedagogique.telephone}
                      </div>
                    )}
                    {pedagogique.email && (
                      <div className="detail-item">
                        <Mail size={14} />
                        {pedagogique.email}
                      </div>
                    )}
                    <div className="detail-small">
                      Créé le {new Date(pedagogique.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Pédagogiques Spécifiques */}
        <div className="commercials-card">
          <h2 className="section-title">
            <BookOpen size={24} className="icon-green" />
            Pédagogiques par Filière ({pedagogiquesSpecifiques.length})
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Chargement des pédagogiques...</p>
            </div>
          ) : (
            <div className="commercials-grid">
              {pedagogiquesSpecifiques.map(pedagogique => (
                <div key={pedagogique._id} className="commercial-item">
                  <div className="commercial-header">
                    <h3 className="commercial-name">{pedagogique.nom}</h3>
                    <div className="commercial-actions">
                      <button
                        onClick={() => handleToggleActive(pedagogique)}
                        className={`badge ${pedagogique.actif ? 'green-badge' : 'red-badge'}`}
                        title={`Cliquer pour ${pedagogique.actif ? 'désactiver' : 'activer'}`}
                        style={{ 
                          cursor: 'pointer',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {pedagogique.actif ? (
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
                        onClick={() => openEditModal(pedagogique)}
                        className="btn-icon yellow"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setPedagogiqueToDelete(pedagogique);
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
                    {/* Badge filière */}
                    <div 
                      className="filiere-badge"
                      style={{
                        backgroundColor: getFiliereColor(pedagogique.filiere),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <GraduationCap size={12} />
                      {pedagogique.filiere}
                    </div>
                    
                    {pedagogique.telephone && (
                      <div className="detail-item">
                        <Phone size={14} />
                        {pedagogique.telephone}
                      </div>
                    )}
                    {pedagogique.email && (
                      <div className="detail-item">
                        <Mail size={14} />
                        {pedagogique.email}
                      </div>
                    )}
                    <div className="detail-small">
                      Créé le {new Date(pedagogique.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pedagogiques.length === 0 && !loading && (
            <div className="no-students">
              <BookOpen size={48} />
              <p>Aucun pédagogique trouvé</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                Créer le premier pédagogique
              </button>
            </div>
          )}
        </div>

        {/* Modal for Add/Edit Pédagogique */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingPedagogique ? 'Modifier Pédagogique' : 'Nouveau Pédagogique'}
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
                    value={newPedagogique.nom}
                    onChange={e => setNewPedagogique({ ...newPedagogique, nom: e.target.value })}
                    required
                    placeholder="Nom du pédagogique..."
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={newPedagogique.telephone}
                    onChange={e => setNewPedagogique({ ...newPedagogique, telephone: e.target.value })}
                    placeholder="Numéro de téléphone..."
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newPedagogique.email}
                    onChange={e => setNewPedagogique({ ...newPedagogique, email: e.target.value })}
                    required
                    placeholder="Adresse email..."
                  />
                </div>

                <div className="form-group">
                  <label>Filière / Type d'accès *</label>
                  <select
                    value={newPedagogique.filiere}
                    onChange={e => setNewPedagogique({ ...newPedagogique, filiere: e.target.value })}
                    required
                  >
                    <option value="">Choisir un type d'accès...</option>
                    {FILIERES.map(filiere => (
                      <option 
                        key={filiere.value} 
                        value={filiere.value}
                        style={filiere.isGeneral ? { 
                          fontWeight: 'bold', 
                          background: '#f3f4f6',
                          color: '#9333ea'
                        } : {}}
                      >
                        {filiere.label}
                      </option>
                    ))}
                  </select>
                  {newPedagogique.filiere === 'GENERAL' && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.75rem', 
                      background: '#f0f9ff', 
                      border: '1px solid #0ea5e9',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Shield size={16} style={{ color: '#0ea5e9' }} />
                        <strong>Pédagogique Général</strong>
                      </div>
                      Ce pédagogique aura accès à <strong>toutes les filières</strong> et pourra voir tous les étudiants, cours et professeurs de l'établissement.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    {editingPedagogique ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPedagogique.motDePasse}
                      onChange={e => setNewPedagogique({ ...newPedagogique, motDePasse: e.target.value })}
                      required={!editingPedagogique}
                      placeholder={editingPedagogique ? "Nouveau mot de passe..." : "Mot de passe..."}
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

                {newPedagogique.motDePasse && (
                  <div className="form-group">
                    <label>Confirmer le mot de passe *</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPedagogique.confirmPassword}
                      onChange={e => setNewPedagogique({ ...newPedagogique, confirmPassword: e.target.value })}
                      placeholder="Confirmer le mot de passe..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newPedagogique.actif}
                      onChange={e => setNewPedagogique({ ...newPedagogique, actif: e.target.checked })}
                    />
                    <CheckCircle size={16} />
                    Compte actif
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    onClick={handleCreateOrUpdatePedagogique}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Sauvegarde...' : editingPedagogique ? 'Modifier' : 'Ajouter'}
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
        {showDeleteModal && pedagogiqueToDelete && (
          <div className="modal-overlay">
            <div className="modal small">
              <div className="modal-header">
                <h3 className="modal-title">Confirmer la suppression</h3>
              </div>
              <div className="modal-body">
                <p className="modal-text">
                  Êtes-vous sûr de vouloir supprimer le pédagogique <strong>{pedagogiqueToDelete.nom}</strong>
                  {pedagogiqueToDelete.filiere === 'GENERAL' && (
                    <span style={{ color: '#9333ea', fontWeight: 'bold' }}> (GÉNÉRAL)</span>
                  )} ?
                  Cette action est irréversible.
                </p>
                <div className="modal-actions">
                  <button
                    onClick={handleDeletePedagogique}
                    disabled={loading}
                    className="btn btn-danger"
                  >
                    {loading ? 'Suppression...' : 'Supprimer'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setPedagogiqueToDelete(null);
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

      <style jsx>{`
        .general-indicator {
          color: #9333ea;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default PedagogiePage;