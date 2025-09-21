import React, { useState, useEffect } from 'react';
import { X, Clock, User, Mail, Calendar } from 'lucide-react';

const HistoriqueModal = ({ show, onClose, seanceId = null }) => {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchHistorique();
    }
  }, [show, seanceId]);

  const fetchHistorique = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = seanceId 
        ? `http://195.179.229.230:5000/api/seances/historique/${seanceId}`
        : 'http://195.179.229.230:5000/api/seances/historique';
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setHistorique(data);
      } else {
        console.error('Erreur lors du chargement de l\'historique');
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action) => {
    const colors = {
      'creation': '#10b981',
      'modification': '#f59e0b',
      'suppression': '#ef4444',
      'rattrapage': '#8b5cf6'
    };
    return colors[action] || '#6b7280';
  };

  const getActionLabel = (action) => {
    const labels = {
      'creation': 'Création',
      'modification': 'Modification',
      'suppression': 'Suppression',
      'rattrapage': 'Rattrapage'
    };
    return labels[action] || action;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': '#dc2626',
      'pedagogique': '#059669',
      'finance_prof': '#7c3aed',
      'administratif': '#0369a1'
    };
    return colors[role] || '#6b7280';
  };

  if (!show) return null;

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
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h3 style={{ margin: 0, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={24} />
            {seanceId ? 'Historique de la séance' : 'Historique de toutes les séances'}
          </h3>
          
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#6b7280' }}>Chargement de l'historique...</div>
          </div>
        ) : historique.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
            <div style={{ fontSize: '16px', color: '#6b7280' }}>Aucun historique disponible</div>
          </div>
        ) : (
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            {historique.map((item, index) => (
              <div
                key={item.id}
                style={{
                  padding: '18px',
                  marginBottom: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '20px',
                  alignItems: 'start'
                }}>
                  {/* Informations de la séance */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '10px'
                    }}>
                      <Calendar size={16} style={{ color: '#3b82f6' }} />
                      <span style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>
                        {item.cours}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                      <div>
                        <strong>Professeur:</strong> {item.professeur || 'Non défini'}
                      </div>
                      <div>
                        <strong>Matière:</strong> {item.matiere || 'Non défini'}
                      </div>
                      <div>
                        <strong>Salle:</strong> {item.salle || 'Non défini'}
                      </div>
                      <div>
                        <strong>Date séance:</strong> {item.dateSeance ? 
                          new Date(item.dateSeance).toLocaleDateString('fr-FR') : 'Non défini'}
                      </div>
                    </div>
                  </div>

                  {/* Informations de traçabilité */}
                  <div style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    border: `2px solid ${getActionColor(item.derniereAction?.action)}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'white',
                        backgroundColor: getActionColor(item.derniereAction?.action)
                      }}>
                        {getActionLabel(item.derniereAction?.action)}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <User size={14} />
                        <span style={{ fontWeight: '600' }}>
                          {item.derniereAction?.utilisateur}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor: getRoleColor(item.derniereAction?.role),
                          color: 'white'
                        }}>
                          {item.derniereAction?.role}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Mail size={14} />
                        <span style={{ color: '#6b7280' }}>
                          {item.derniereAction?.email}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        <span style={{ color: '#6b7280' }}>
                          {formatDate(item.derniereAction?.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates de création et modification */}
                <div style={{
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <span>Créé le: {formatDate(item.dateCreation)}</span>
                  <span>Modifié le: {formatDate(item.derniereMiseAJour)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          paddingTop: '15px',
          borderTop: '2px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
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
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoriqueModal;