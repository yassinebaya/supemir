import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Users, AlertCircle, CheckCircle, XCircle, Building, ToggleLeft, ToggleRight, Mail, Key } from 'lucide-react';
import './CommercialPage.css'; // Utilise le même CSS que la page commerciale
import Sidebar from '../components/Sidebar';

const handleLogout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
  }
  window.location.href = '/';
};

const PartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'true', 'false'
  const [newPartner, setNewPartner] = useState({ 
    nomPartner: '',
    email: '',
    motDePasse: '',
    active: true
  });
  const [passwordData, setPasswordData] = useState({
    nouveauMotDePasse: '',
    confirmerMotDePasse: ''
  });

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? window.localStorage?.getItem('token') : null;
  const headers = { 
    'Authorization': `Bearer ${token}`, 
    'Content-Type': 'application/json' 
  };

  const fetchPartners = async () => {
    try {
      setLoading(true);
      let url = 'http://195.179.229.230:5000/api/partners';
      
      // Ajouter le filtre si nécessaire
      if (filterActive !== 'all') {
        url += `?active=${filterActive}`;
      }
      
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Erreur lors du chargement des partners');
      const data = await res.json();
      
      if (data.success) {
        setPartners(data.data);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur fetchPartners:', error);
      setError('Impossible de charger les partners');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('http://195.179.229.230:5000/api/partners/stats', { headers });
      if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur fetchStats:', error);
      // Les stats ne sont pas critiques, on ne bloque pas l'interface
    }
  };

  const validateForm = () => {
    if (!newPartner.nomPartner.trim()) {
      setError('Le nom du partner est requis');
      return false;
    }
    if (!newPartner.email.trim()) {
      setError('L\'email du partner est requis');
      return false;
    }
    if (!editingPartner && (!newPartner.motDePasse || newPartner.motDePasse.length < 6)) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (editingPartner && newPartner.motDePasse && newPartner.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    // Validation email
// CORRECT - Sans doubles backslashes
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    if (!emailRegex.test(newPartner.email)) {
      setError('Format d\'email invalide');
      return false;
    }
    
    return true;
  };

  const validatePasswordForm = () => {
    if (!passwordData.nouveauMotDePasse || passwordData.nouveauMotDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (passwordData.nouveauMotDePasse !== passwordData.confirmerMotDePasse) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleCreateOrUpdatePartner = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const url = editingPartner 
        ? `http://195.179.229.230:5000/api/partners/${editingPartner._id}`
        : 'http://195.179.229.230:5000/api/partners';
      
      const method = editingPartner ? 'PUT' : 'POST';
      
      const dataToSend = {
        nomPartner: newPartner.nomPartner.trim(),
        email: newPartner.email.trim(),
        active: newPartner.active
      };
      
      // Ajouter le mot de passe seulement si nécessaire
      if (!editingPartner || (editingPartner && newPartner.motDePasse)) {
        dataToSend.motDePasse = newPartner.motDePasse;
      }
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(dataToSend)
      });
      
      const data = await res.json();
      
      if (data.success) {
        resetForm();
        await fetchPartners();
        await fetchStats();
        setShowModal(false);
        setError('');
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur création/modification partner:', error);
      setError(error.message || 'Impossible de sauvegarder le partner');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://195.179.229.230:5000/api/partners/${selectedPartner._id}/change-password`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          nouveauMotDePasse: passwordData.nouveauMotDePasse
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowPasswordModal(false);
        setSelectedPartner(null);
        setPasswordData({ nouveauMotDePasse: '', confirmerMotDePasse: '' });
        setError('');
      } else {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      setError(error.message || 'Impossible de changer le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://195.179.229.230:5000/api/partners/${partnerToDelete._id}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await res.json();
      
      if (data.success) {
        await fetchPartners();
        await fetchStats();
        setShowDeleteModal(false);
        setPartnerToDelete(null);
        setError('');
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression partner:', error);
      setError(error.message || 'Impossible de supprimer le partner');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (partner) => {
    try {
      setLoading(true);
      const res = await fetch(`http://195.179.229.230:5000/api/partners/${partner._id}/toggle`, {
        method: 'PATCH',
        headers
      });
      
      const data = await res.json();
      
      if (data.success) {
        await fetchPartners();
        await fetchStats();
        setError('');
      } else {
        throw new Error(data.message || 'Erreur lors de la modification du statut');
      }
    } catch (error) {
      console.error('Erreur toggle active:', error);
      setError('Impossible de modifier le statut');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewPartner({ 
      nomPartner: '',
      email: '',
      motDePasse: '',
      active: true
    });
    setEditingPartner(null);
    setError('');
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setNewPartner({
      nomPartner: partner.nomPartner || '',
      email: partner.email || '',
      motDePasse: '', // Ne pas préremplir le mot de passe
      active: partner.active !== false
    });
    setShowModal(true);
  };

  const openPasswordModal = (partner) => {
    setSelectedPartner(partner);
    setPasswordData({ nouveauMotDePasse: '', confirmerMotDePasse: '' });
    setShowPasswordModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Filtrer les partners
  const filteredPartners = partners.filter(partner => {
    if (filterActive === 'all') return true;
    return partner.active === (filterActive === 'true');
  });

  const partnersActifs = partners.filter(p => p.active).length;
  const partnersInactifs = partners.filter(p => !p.active).length;

  useEffect(() => {
    fetchPartners();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [filterActive]);

  return (
    <div className="commercial-page">
      <Sidebar onLogout={handleLogout} />
      
      <div className="container">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-info">
              <h1 className="page-title">Gestion des Partners</h1>
              <p className="page-subtitle">
                Gérer les partenaires de l'établissement
                {stats && (
                  <span className="stats-indicator">
                    • {stats.partners?.total || 0} partner(s) • {partnersActifs} actif(s)
                  </span>
                )}
              </p>
            </div>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={20} />
              Nouveau Partner
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-content">
            <h3 className="filters-title">Filtres</h3>
            <div className="filters-group">
              <button
                onClick={() => setFilterActive('all')}
                className={`filter-btn ${filterActive === 'all' ? 'active' : ''}`}
              >
                <Users size={16} />
                Tous ({partners.length})
              </button>
              <button
                onClick={() => setFilterActive('true')}
                className={`filter-btn ${filterActive === 'true' ? 'active' : ''}`}
              >
                <CheckCircle size={16} />
                Actifs ({partnersActifs})
              </button>
              <button
                onClick={() => setFilterActive('false')}
                className={`filter-btn ${filterActive === 'false' ? 'active' : ''}`}
              >
                <XCircle size={16} />
                Inactifs ({partnersInactifs})
              </button>
            </div>
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

        {/* Partners List */}
        <div className="commercials-card">
          <h2 className="section-title">
            <Building size={24} className="icon-blue" />
            Liste des Partners ({filteredPartners.length})
            {filterActive !== 'all' && (
              <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#6b7280' }}>
                - Filtré par: {filterActive === 'true' ? 'Actifs' : 'Inactifs'}
              </span>
            )}
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Chargement des partners...</p>
            </div>
          ) : (
            <div className="commercials-grid">
              {filteredPartners.map(partner => (
                <div key={partner._id} className="commercial-item">
                  <div className="commercial-header">
                    <h3 className="commercial-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building size={18} style={{ color: '#3b82f6' }} />
                      {partner.nomPartner}
                    </h3>
                    <div className="commercial-actions">
                      <button
                        onClick={() => handleToggleActive(partner)}
                        className={`badge ${partner.active ? 'green-badge' : 'red-badge'}`}
                        title={`Cliquer pour ${partner.active ? 'désactiver' : 'activer'}`}
                        style={{ 
                          cursor: 'pointer',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {partner.active ? (
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
                        onClick={() => openPasswordModal(partner)}
                        className="btn-icon blue"
                        title="Changer mot de passe"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(partner)}
                        className="btn-icon yellow"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setPartnerToDelete(partner);
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
                    {/* Badge statut */}
                    <div 
                      className="status-badge"
                      style={{
                        backgroundColor: partner.active ? '#10b981' : '#ef4444',
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
                      {partner.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {partner.active ? 'ACTIF' : 'INACTIF'}
                    </div>
                    
                    {/* Email */}
                    <div className="detail-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Mail size={14} style={{ color: '#6b7280' }} />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>{partner.email}</span>
                    </div>
                    
                    <div className="detail-small">
                      Créé le {new Date(partner.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    {partner.updatedAt && partner.updatedAt !== partner.createdAt && (
                      <div className="detail-small">
                        Modifié le {new Date(partner.updatedAt).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredPartners.length === 0 && !loading && (
            <div className="no-students">
              <Building size={48} />
              <p>
                {filterActive === 'all' 
                  ? 'Aucun partner trouvé' 
                  : `Aucun partner ${filterActive === 'true' ? 'actif' : 'inactif'} trouvé`
                }
              </p>
              {filterActive === 'all' && (
                <button className="btn btn-primary" onClick={openAddModal}>
                  Créer le premier partner
                </button>
              )}
            </div>
          )}
        </div>

        {/* Statistics Card */}
        {stats && (
          <div className="stats-card" style={{ marginTop: '2rem' }}>
            <h3 className="stats-title">Statistiques</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.partners?.total || 0}</div>
                <div className="stat-label">Total Partners</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#10b981' }}>{stats.partners?.actifs || 0}</div>
                <div className="stat-label">Partners Actifs</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#ef4444' }}>{stats.partners?.inactifs || 0}</div>
                <div className="stat-label">Partners Inactifs</div>
              </div>
              {stats.etudiants && Array.isArray(stats.etudiants) && stats.etudiants.length > 0 && (
                <div className="stat-item">
                  <div className="stat-value">{stats.etudiants.reduce((sum, item) => sum + item.count, 0)}</div>
                  <div className="stat-label">Étudiants Associés</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for Add/Edit Partner */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingPartner ? 'Modifier Partner' : 'Nouveau Partner'}
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
                  <label>Nom du Partner *</label>
                  <input
                    type="text"
                    value={newPartner.nomPartner}
                    onChange={e => setNewPartner({ ...newPartner, nomPartner: e.target.value })}
                    required
                    placeholder="Nom du partner..."
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#6b7280' 
                    }} />
                    <input
                      type="email"
                      value={newPartner.email}
                      onChange={e => setNewPartner({ ...newPartner, email: e.target.value })}
                      required
                      placeholder="email@exemple.com"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {editingPartner ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#6b7280' 
                    }} />
                    <input
                      type="password"
                      value={newPartner.motDePasse}
                      onChange={e => setNewPartner({ ...newPartner, motDePasse: e.target.value })}
                      required={!editingPartner}
                      placeholder={editingPartner ? "Nouveau mot de passe..." : "Mot de passe..."}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {editingPartner 
                      ? 'Laissez vide pour conserver le mot de passe actuel'
                      : 'Minimum 6 caractères requis'
                    }
                  </small>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newPartner.active}
                      onChange={e => setNewPartner({ ...newPartner, active: e.target.checked })}
                    />
                    <CheckCircle size={16} />
                    Partner actif
                  </label>
                  <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    Les partners inactifs n'apparaîtront pas dans les listes de sélection
                  </small>
                </div>

                <div className="modal-actions">
                  <button
                    onClick={handleCreateOrUpdatePartner}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Sauvegarde...' : editingPartner ? 'Modifier' : 'Ajouter'}
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

        {/* Password Change Modal */}
        {showPasswordModal && selectedPartner && (
          <div className="modal-overlay">
            <div className="modal small">
              <div className="modal-header">
                <h3 className="modal-title">Changer le mot de passe</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedPartner(null);
                    setPasswordData({ nouveauMotDePasse: '', confirmerMotDePasse: '' });
                  }}
                  className="btn-close"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-text" style={{ marginBottom: '1rem' }}>
                  Changer le mot de passe de <strong>{selectedPartner.nomPartner}</strong>
                </p>

                <div className="form-group">
                  <label>Nouveau mot de passe *</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#6b7280' 
                    }} />
                    <input
                      type="password"
                      value={passwordData.nouveauMotDePasse}
                      onChange={e => setPasswordData({ ...passwordData, nouveauMotDePasse: e.target.value })}
                      placeholder="Nouveau mot de passe..."
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirmer le mot de passe *</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#6b7280' 
                    }} />
                    <input
                      type="password"
                      value={passwordData.confirmerMotDePasse}
                      onChange={e => setPasswordData({ ...passwordData, confirmerMotDePasse: e.target.value })}
                      placeholder="Confirmer le mot de passe..."
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <small style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block', marginBottom: '1rem' }}>
                  Le mot de passe doit contenir au moins 6 caractères
                </small>

                <div className="modal-actions">
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Modification...' : 'Changer le mot de passe'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedPartner(null);
                      setPasswordData({ nouveauMotDePasse: '', confirmerMotDePasse: '' });
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
        {showDeleteModal && partnerToDelete && (
          <div className="modal-overlay">
            <div className="modal small">
              <div className="modal-header">
                <h3 className="modal-title">Confirmer la suppression</h3>
              </div>
              <div className="modal-body">
                <p className="modal-text">
                  Êtes-vous sûr de vouloir supprimer le partner <strong>{partnerToDelete.nomPartner}</strong> ?
                  Cette action est irréversible.
                </p>
                {/* Warning message */}
                <div style={{ 
                  background: '#fef3cd', 
                  border: '1px solid #facc15', 
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginTop: '1rem',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                    <strong>Attention</strong>
                  </div>
                  Si des étudiants sont associés à ce partner, la suppression sera impossible.
                </div>
                
                <div className="modal-actions">
                  <button
                    onClick={handleDeletePartner}
                    disabled={loading}
                    className="btn btn-danger"
                  >
                    {loading ? 'Suppression...' : 'Supprimer'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setPartnerToDelete(null);
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
        .stats-indicator {
          color: #3b82f6;
          font-weight: 600;
        }
        
        .filters-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }
        
        .filters-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .filters-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        
        .filters-group {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }
        
        .filter-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        
        .filter-btn.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }
        
        .stats-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .stats-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1rem 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .stat-item {
          text-align: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .btn-icon.blue {
          background: #3b82f6;
          color: white;
        }

        .btn-icon.blue:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default PartnersPage;