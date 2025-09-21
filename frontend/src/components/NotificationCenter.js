import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  UserX,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Eye,
  ExternalLink,
  RotateCcw,
  Settings,
  BarChart3,
  Sliders,
  Users,
  TrendingUp
} from 'lucide-react';

const NotificationCenter = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showSeuils, setShowSeuils] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [seuils, setSeuils] = useState({ normal: 10, urgent: 15, critique: 20 });
  const [statsAbsences, setStatsAbsences] = useState(null);
  const [seuilsLoading, setSeuilsLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  // Configuration de l'API
  const API_BASE = 'http://localhost:5000/api';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowMenu(false);
        setShowSeuils(false);
        setShowStats(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/notifications`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.total || 0);
        if (data.seuils) {
          setSeuils(data.seuils);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques du dashboard
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    }
  };

  // Charger les statistiques d'absences détaillées
  const loadStatsAbsences = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/stats-absences`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatsAbsences(data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement stats absences:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Afficher un message informatif pour les notifications d'absence
        if (data.context && data.context.etudiantId) {
          console.log(`✅ Notification d'absence supprimée pour l'étudiant. Elle sera recréée si les absences augmentent.`);
        }
      } else {
        console.error('❌ Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
    }
  };

  // Réinitialiser les notifications supprimées
  const resetDeletedNotifications = async () => {
    try {
      setResetLoading(true);
      const response = await fetch(`${API_BASE}/notifications/reset-deleted`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notifications supprimées réinitialisées:', data);
        
        await loadNotifications();
        setShowMenu(false);
        alert(`${data.restoredCount} notifications ont été restaurées !`);
        
      } else {
        console.error('❌ Erreur lors de la réinitialisation');
        alert('Erreur lors de la réinitialisation des notifications');
      }
    } catch (error) {
      console.error('❌ Erreur reset notifications:', error);
      alert('Erreur lors de la réinitialisation des notifications');
    } finally {
      setResetLoading(false);
    }
  };

  // Mettre à jour les seuils d'absence
  const updateSeuils = async (nouveauxSeuils) => {
    try {
      setSeuilsLoading(true);
      const response = await fetch(`${API_BASE}/notifications/seuils-absence`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(nouveauxSeuils)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSeuils(data.seuils);
        setShowSeuils(false);
        alert('Seuils mis à jour avec succès !');
        
        // Recharger les notifications avec les nouveaux seuils
        await loadNotifications();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour seuils:', error);
      alert('Erreur lors de la mise à jour des seuils');
    } finally {
      setSeuilsLoading(false);
    }
  };

  // Charger au montage du composant
  useEffect(() => {
    loadNotifications();
    loadStats();
  }, []);

  // Actualisation automatique toutes les 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
      loadStats();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (type, priority, data) => {
    const iconProps = { size: 18 };
    
    switch (type) {
      case 'payment_expired':
      case 'payment_expiring':
        return <CreditCard {...iconProps} style={{ color: '#ef4444' }} />;
      case 'absence_frequent':
        // Icône différente selon le niveau de criticité
        if (data && data.seuil === 'critique') {
          return <AlertTriangle {...iconProps} style={{ color: '#dc2626' }} />;
        } else if (data && data.seuil === 'urgent') {
          return <UserX {...iconProps} style={{ color: '#ea580c' }} />;
        }
        return <UserX {...iconProps} style={{ color: '#f97316' }} />;
      case 'event_upcoming':
        return <Calendar {...iconProps} style={{ color: '#3b82f6' }} />;
      default:
        return <Bell {...iconProps} style={{ color: '#6b7280' }} />;
    }
  };

  // Obtenir la couleur selon la priorité et le type
  const getPriorityStyles = (priority, type, data) => {
    // Styles spéciaux pour les notifications d'absence critique
    if (type === 'absence_frequent' && data && data.seuil === 'critique') {
      return {
        borderLeft: '4px solid #dc2626',
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
      };
    }
    
    switch (priority) {
      case 'urgent':
        return {
          borderLeft: '4px solid #ef4444',
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca'
        };
      case 'high':
        return {
          borderLeft: '4px solid #f97316',
          backgroundColor: '#fff7ed',
          borderColor: '#fed7aa'
        };
      case 'medium':
        return {
          borderLeft: '4px solid #eab308',
          backgroundColor: '#fefce8',
          borderColor: '#fde047'
        };
      default:
        return {
          borderLeft: '4px solid #d1d5db',
          backgroundColor: '#f9fafb',
          borderColor: '#e5e7eb'
        };
    }
  };

  // Formater le message pour les absences avec plus de détails
  const formatAbsenceMessage = (notification) => {
    if (notification.type !== 'absence_frequent' || !notification.data) {
      return notification.message;
    }

    const { nombreAbsences, seuil, absencesParCours } = notification.data;
    const coursDetails = absencesParCours ? 
      Object.entries(absencesParCours)
        .map(([cours, nb]) => `${cours}: ${nb}`)
        .join(', ') : '';

    return `${notification.message}${coursDetails ? ` (${coursDetails})` : ''}`;
  };

  // Formater le temps relatif
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    switch (notification.type) {
      case 'payment_expired':
      case 'payment_expiring':
        if (onNavigate) onNavigate('/liste-paiements');
        break;
      case 'absence_frequent':
        if (onNavigate) onNavigate('/liste-presences');
        break;
      case 'event_upcoming':
        if (onNavigate) onNavigate('/calendrier');
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  // Actualiser manuellement
  const handleRefresh = () => {
    loadNotifications();
    loadStats();
  };

  // Composant pour configurer les seuils
  const SeuilsConfig = () => {
    const [tempSeuils, setTempSeuils] = useState(seuils);

    const handleSave = () => {
      if (tempSeuils.normal >= tempSeuils.urgent || tempSeuils.urgent >= tempSeuils.critique) {
        alert('Les seuils doivent être: normal < urgent < critique');
        return;
      }
      updateSeuils(tempSeuils);
    };

    return (
      <div style={{
        position: 'absolute',
        top: '100%',
        right: '0',
        marginTop: '4px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        border: '1px solid #e5e7eb',
        minWidth: '320px',
        zIndex: 60,
        padding: '20px'
      }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Configuration des seuils d'absence
        </h4>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Seuil Normal (notification jaune)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min="1"
              value={tempSeuils.normal}
              onChange={(e) => setTempSeuils(prev => ({ ...prev, normal: parseInt(e.target.value) || 1 }))}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>séances</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Seuil Urgent (notification orange)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min="1"
              value={tempSeuils.urgent}
              onChange={(e) => setTempSeuils(prev => ({ ...prev, urgent: parseInt(e.target.value) || 1 }))}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>séances</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Seuil Critique (notification rouge)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min="1"
              value={tempSeuils.critique}
              onChange={(e) => setTempSeuils(prev => ({ ...prev, critique: parseInt(e.target.value) || 1 }))}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>séances</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowSeuils(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={seuilsLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: seuilsLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {seuilsLoading && <Loader2 size={14} className="animate-spin" />}
            Sauvegarder
          </button>
        </div>
      </div>
    );
  };

  // Composant pour afficher les statistiques détaillées
  const StatsAbsences = () => {
    useEffect(() => {
      if (showStats && !statsAbsences) {
        loadStatsAbsences();
      }
    }, [showStats]);

    if (!statsAbsences) {
      return (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '4px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          minWidth: '400px',
          zIndex: 60,
          padding: '20px',
          textAlign: 'center'
        }}>
          <Loader2 className="animate-spin" size={24} style={{ color: '#3b82f6' }} />
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
            Chargement des statistiques...
          </p>
        </div>
      );
    }

    return (
      <div style={{
        position: 'absolute',
        top: '100%',
        right: '0',
        marginTop: '4px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        border: '1px solid #e5e7eb',
        minWidth: '450px',
        maxHeight: '400px',
        zIndex: 60,
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            📊 Statistiques des absences
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706' }}>
                {statsAbsences.parSeuil.normal}
              </div>
              <div style={{ fontSize: '12px', color: '#92400e' }}>Normal ({seuils.normal}+)</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fed7aa', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ea580c' }}>
                {statsAbsences.parSeuil.urgent}
              </div>
              <div style={{ fontSize: '12px', color: '#9a3412' }}>Urgent ({seuils.urgent}+)</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fecaca', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                {statsAbsences.parSeuil.critique}
              </div>
              <div style={{ fontSize: '12px', color: '#991b1b' }}>Critique ({seuils.critique}+)</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
            <span>Total étudiants: {statsAbsences.totalEtudiants}</span>
            <span>Moyenne: {statsAbsences.moyenneAbsences} absences</span>
          </div>
        </div>

        <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '12px' }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', padding: '0 8px' }}>
            Top 10 des absences
          </h5>
          {statsAbsences.repartition.slice(0, 10).map((etudiant, index) => (
            <div
              key={etudiant.etudiantId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                margin: '4px 0',
                borderRadius: '6px',
                backgroundColor: etudiant.niveau === 'critique' ? '#fef2f2' :
                                etudiant.niveau === 'urgent' ? '#fff7ed' :
                                etudiant.niveau === 'normal' ? '#fefce8' : '#f9fafb',
                border: `1px solid ${
                  etudiant.niveau === 'critique' ? '#fecaca' :
                  etudiant.niveau === 'urgent' ? '#fed7aa' :
                  etudiant.niveau === 'normal' ? '#fde047' : '#e5e7eb'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#6b7280',
                  minWidth: '20px'
                }}>
                  #{index + 1}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>
                  {etudiant.nom}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: etudiant.niveau === 'critique' ? '#dc2626' :
                         etudiant.niveau === 'urgent' ? '#ea580c' :
                         etudiant.niveau === 'normal' ? '#d97706' : '#6b7280'
                }}>
                  {etudiant.absences}
                </span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  backgroundColor: etudiant.niveau === 'critique' ? '#dc2626' :
                                  etudiant.niveau === 'urgent' ? '#ea580c' :
                                  etudiant.niveau === 'normal' ? '#d97706' : '#6b7280',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {etudiant.niveau.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const styles = {
    container: {
      position: 'relative'
    },
    
    notificationButton: {
      position: 'relative',
      padding: '12px',
      color: '#6b7280',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    
    badge: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      backgroundColor: '#ef4444',
      color: 'white',
      fontSize: '11px',
      fontWeight: 'bold',
      borderRadius: '50%',
      height: '20px',
      width: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'pulse 2s infinite',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
    },
    
    dropdown: {
      position: 'absolute',
      right: '0',
      top: '100%',
      marginTop: '8px',
      width: '420px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid #e5e7eb',
      zIndex: 50,
      maxHeight: '500px',
      overflow: 'hidden',
      animation: 'slideDown 0.2s ease'
    },
    
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
    },
    
    headerTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      margin: 0
    },
    
    headerSubtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '4px 0 0 0'
    },
    
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      position: 'relative'
    },
    
    actionButton: {
      padding: '8px',
      color: '#6b7280',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    
    menuButton: {
      padding: '8px',
      color: '#6b7280',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    },
    
    settingsMenu: {
      position: 'absolute',
      top: '100%',
      right: '0',
      marginTop: '4px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e5e7eb',
      minWidth: '250px',
      zIndex: 60,
      animation: 'slideDown 0.15s ease'
    },
    
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      border: 'none',
      backgroundColor: 'transparent',
      width: '100%',
      textAlign: 'left',
      fontSize: '14px',
      color: '#374151'
    },
    
    menuItemDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    
    statsContainer: {
      padding: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    },
    
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '12px',
      textAlign: 'center'
    },
    
    statCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '12px',
      backdropFilter: 'blur(10px)'
    },
    
    statValue: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '4px'
    },
    
    statLabel: {
      fontSize: '11px',
      opacity: 0.9
    },
    
    notificationsList: {
      maxHeight: '320px',
      overflowY: 'auto',
      padding: '8px'
    },
    
    notificationItem: {
      padding: '16px',
      marginBottom: '8px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      backgroundColor: 'white'
    },
    
    notificationContent: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    },
    
    iconContainer: {
      padding: '8px',
      backgroundColor: 'white',
      borderRadius: '50%',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      flexShrink: 0
    },
    
    contentBody: {
      flex: 1,
      minWidth: 0
    },
    
    contentHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '4px'
    },
    
    notificationTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f2937',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      flex: 1,
      paddingRight: '8px'
    },
    
    notificationActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexShrink: 0
    },
    
    timestamp: {
      fontSize: '12px',
      color: '#6b7280'
    },
    
    deleteButton: {
      padding: '4px',
      color: '#9ca3af',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.7
    },
    
    notificationMessage: {
      fontSize: '13px',
      color: '#4b5563',
      lineHeight: '1.5',
      marginBottom: '8px'
    },
    
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '8px'
    },
    
    priorityBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600'
    },
    
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: '#6b7280'
    },
    
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: '#6b7280',
      textAlign: 'center'
    },
    
    emptyStateTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '4px',
      color: '#1f2937'
    },
    
    emptyStateText: {
      fontSize: '14px'
    },
    
    dropdownFooter: {
      padding: '16px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      textAlign: 'center'
    },
    
    refreshButton: {
      fontSize: '14px',
      color: '#3b82f6',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'color 0.2s ease'
    }
  };

  const getPriorityBadgeStyle = (priority, type, data) => {
    const baseStyle = { ...styles.priorityBadge };
    
    // Style spécial pour les notifications d'absence critique
    if (type === 'absence_frequent' && data && data.seuil === 'critique') {
      return { ...baseStyle, backgroundColor: '#fef2f2', color: '#991b1b', fontWeight: 'bold' };
    }
    
    switch (priority) {
      case 'urgent':
        return { ...baseStyle, backgroundColor: '#fef2f2', color: '#991b1b' };
      case 'high':
        return { ...baseStyle, backgroundColor: '#fff7ed', color: '#9a3412' };
      case 'medium':
        return { ...baseStyle, backgroundColor: '#fefce8', color: '#a16207' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .notification-item:hover {
            transform: translateX(6px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .notification-item:hover .delete-button {
            opacity: 1 !important;
          }
          
          .action-button:hover {
            background-color: rgba(255, 255, 255, 0.8) !important;
            color: #374151 !important;
          }
          
          .menu-button:hover {
            background-color: rgba(255, 255, 255, 0.8) !important;
            color: #374151 !important;
          }
          
          .menu-item:hover {
            background-color: #f3f4f6 !important;
          }
          
          .menu-item:hover:not(.menu-item-disabled) {
            background-color: #f3f4f6 !important;
          }
          
          .refresh-button:hover {
            color: #1d4ed8 !important;
          }
          
          .notification-button:hover {
            color: #1f2937 !important;
            background-color: #f3f4f6 !important;
            transform: scale(1.05);
          }
          
          .notification-button:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
          }
          
          .delete-button:hover {
            background-color: #fee2e2 !important;
            color: #dc2626 !important;
            transform: scale(1.1);
          }
        `}
      </style>
      
      <div style={styles.container} ref={dropdownRef}>
        {/* Bouton Notifications */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={styles.notificationButton}
          className="notification-button"
          title="Centre de notifications"
        >
          <Bell size={22} />
          
          {/* Badge de notification */}
          {unreadCount > 0 && (
            <span style={styles.badge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown des notifications */}
        {isOpen && (
          <div style={styles.dropdown}>
            {/* Header */}
            <div style={styles.header}>
              <div>
                <h3 style={styles.headerTitle}>Notifications</h3>
                <p style={styles.headerSubtitle}>
                  {unreadCount > 0 ? `${unreadCount} nouvelle(s)` : 'Tout est à jour'}
                </p>
              </div>
              
              <div style={styles.headerActions}>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  style={styles.actionButton}
                  className="action-button"
                  title="Actualiser"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Clock size={16} />
                  )}
                </button>
                
                {/* Menu des paramètres */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    style={styles.menuButton}
                    className="menu-button"
                    title="Options"
                  >
                    <Settings size={16} />
                  </button>
                  
                  {/* Menu déroulant */}
                  {showMenu && (
                    <div style={styles.settingsMenu}>
                      <button
                        onClick={() => {
                          setShowSeuils(true);
                          setShowStats(false);
                          setShowMenu(false);
                        }}
                        style={styles.menuItem}
                        className="menu-item"
                      >
                        <Sliders size={16} />
                        <span>Configurer les seuils d'absence</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowStats(true);
                          setShowSeuils(false);
                          setShowMenu(false);
                        }}
                        style={styles.menuItem}
                        className="menu-item"
                      >
                        <BarChart3 size={16} />
                        <span>Statistiques des absences</span>
                      </button>
                      
                      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }} />
                      
                      <button
                        onClick={resetDeletedNotifications}
                        disabled={resetLoading}
                        style={{
                          ...styles.menuItem,
                          ...(resetLoading ? styles.menuItemDisabled : {})
                        }}
                        className={`menu-item ${resetLoading ? 'menu-item-disabled' : ''}`}
                      >
                        {resetLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <RotateCcw size={16} />
                        )}
                        <span>Restaurer les notifications supprimées</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Panels de configuration */}
                  {showSeuils && <SeuilsConfig />}
                  {showStats && <StatsAbsences />}
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  style={styles.actionButton}
                  className="action-button"
                  title="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Statistiques rapides */}
            {stats && (
              <div style={styles.statsContainer}>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{stats.etudiantsActifs}</div>
                    <div style={styles.statLabel}>Étudiants actifs</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{stats.paiementsExpires}</div>
                    <div style={styles.statLabel}>Paiements expirés</div></div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{stats.absencesSignalees}</div>
                    <div style={styles.statLabel}>Absences signalées</div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des notifications */}
            <div style={styles.notificationsList}>
              {loading ? (
                <div style={styles.loadingContainer}>
                  <Loader2 size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
                  <span style={{ marginLeft: '12px' }}>Chargement...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div style={styles.emptyState}>
                  <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
                  <h4 style={styles.emptyStateTitle}>Tout est en ordre !</h4>
                  <p style={styles.emptyStateText}>
                    Aucune notification pour le moment
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      ...styles.notificationItem,
                      ...getPriorityStyles(notification.priority, notification.type, notification.data)
                    }}
                    className="notification-item"
                  >
                    <div style={styles.notificationContent}>
                      {/* Icône */}
                      <div style={styles.iconContainer}>
                        {getNotificationIcon(notification.type, notification.priority, notification.data)}
                      </div>
                      
                      {/* Contenu principal */}
                      <div style={styles.contentBody}>
                        <div style={styles.contentHeader}>
                          <h4 style={styles.notificationTitle}>
                            {notification.title}
                          </h4>
                          
                          <div style={styles.notificationActions}>
                            <span style={styles.timestamp}>
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            
                            <button
                              onClick={(e) => deleteNotification(notification.id, e)}
                              style={styles.deleteButton}
                              className="delete-button"
                              title="Supprimer cette notification"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Message */}
                        <p style={styles.notificationMessage}>
                          {formatAbsenceMessage(notification)}
                        </p>
                        
                        {/* Footer avec badge priorité */}
                        <div style={styles.footer}>
                          <span 
                            style={getPriorityBadgeStyle(notification.priority, notification.type, notification.data)}
                          >
                            {notification.type === 'absence_frequent' && notification.data?.seuil === 'critique' ? (
                              <>
                                <AlertTriangle size={12} />
                                CRITIQUE
                              </>
                            ) : notification.priority === 'urgent' ? (
                              <>
                                <AlertCircle size={12} />
                                URGENT
                              </>
                            ) : notification.priority === 'high' ? (
                              <>
                                <AlertTriangle size={12} />
                                IMPORTANT
                              </>
                            ) : notification.priority === 'medium' ? (
                              <>
                                <Info size={12} />
                                NORMAL
                              </>
                            ) : (
                              <>
                                <Info size={12} />
                                INFO
                              </>
                            )}
                          </span>
                          
                          {/* Détails supplémentaires pour les absences */}
                          {notification.type === 'absence_frequent' && notification.data && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Users size={12} />
                              {notification.data.seuil?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer avec bouton d'actualisation */}
            <div style={styles.dropdownFooter}>
              <button
                onClick={handleRefresh}
                disabled={loading}
                style={styles.refreshButton}
                className="refresh-button"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} />
                    Actualisation...
                  </>
                ) : (
                  <>
                    <Clock size={14} style={{ marginRight: '6px' }} />
                    Actualiser les notifications
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;