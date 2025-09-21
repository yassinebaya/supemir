import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Settings,
  BookOpen,
  CreditCard,
  DollarSign
} from 'lucide-react';

const NotificationEtudiant = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
const loadMessageNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE}/messages/notifications-etudiant`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) return [];

    const data = await response.json();

    return data.map(msg => ({
      id: `message-${msg._id}`,
title: `Nouveau message de ${msg.expediteur?.nom || msg.expediteur?.nomComplet || 'Professeur'}`,
      message: msg.contenu || 'Vous avez reçu un message',
      date: msg.date,
      type: 'new_message',
      category: 'message',
      professeur: msg.professeur
    }));
  } catch (err) {
    console.error('Erreur chargement messages:', err);
    return [];
  }
};

  // Charger les notifications de paiement
  const loadPaymentNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/etudiant/notifications`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.map(notification => ({
          id: `payment-${notification.cours}-${Date.now()}`,
          title: `Paiement - ${notification.cours}`,
          message: notification.message,
          date: new Date().toISOString(),
          type: notification.type,
          cours: notification.cours,
          category: 'payment'
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur chargement notifications paiement:', error);
      return [];
    }
  };

  // Charger les notifications d'événements
  const loadEventNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/evenements/public`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Filtrer les événements des 7 prochains jours
        const today = new Date();
        const filtered = data.filter(e => {
          const eventDate = new Date(e.dateDebut);
          const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        });

        // Transformer les données pour correspondre au format attendu
        return filtered.map(e => ({
          id: `event-${e._id}`,
          title: e.titre,
          message: e.description || `Événement programmé le ${new Date(e.dateDebut).toLocaleDateString('fr-FR')}`,
          date: e.dateDebut,
          type: 'event_upcoming',
          category: 'event'
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur chargement notifications événements:', error);
      return [];
    }
  };

  // Charger toutes les notifications
 const loadNotifications = async () => {
  try {
    setLoading(true);
    
    const [messageNotifications, paymentNotifications, eventNotifications] = await Promise.all([
      loadMessageNotifications(),
      loadPaymentNotifications(),
      loadEventNotifications()
    ]);

    const allNotifications = [
      ...messageNotifications,
      ...paymentNotifications,
      ...eventNotifications
    ];

    // Trier les notifications
    const sortedNotifications = allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    setNotifications(sortedNotifications);
    setUnreadCount(sortedNotifications.length);
  } catch (error) {
    console.error('Erreur chargement notifications:', error);
  } finally {
    setLoading(false);
  }
};

  // Supprimer une notification
  const deleteNotification = async (notificationId, event) => {
    // Empêcher la propagation du clic vers le parent
    event.stopPropagation();
    
    try {
      // Supprimer la notification de l'état local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
    }
  };

  // Réinitialiser les notifications supprimées
  const resetDeletedNotifications = async () => {
    try {
      setResetLoading(true);
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recharger les notifications
      await loadNotifications();
      
      // Fermer le menu
      setShowMenu(false);
      
      alert('Notifications étudiant actualisées !');
      
    } catch (error) {
      console.error('❌ Erreur reset notifications:', error);
      alert('Erreur lors de l\'actualisation des notifications');
    } finally {
      setResetLoading(false);
    }
  };

  // Charger au montage du composant
  useEffect(() => {
    loadNotifications();
  }, []);

  // Actualisation automatique toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Obtenir l'icône selon le type de notification
const getNotificationIcon = (type, joursRestants = null) => {
  const iconProps = { size: 18 };

  switch (type) {
    case 'paiement_expiré':
      return <AlertTriangle {...iconProps} style={{ color: '#dc2626' }} />;
    case 'paiement_soon':
      return <CreditCard {...iconProps} style={{ color: '#ea580c' }} />;
    case 'event_upcoming':
      if (joursRestants === 0) {
        return <AlertTriangle {...iconProps} style={{ color: '#ef4444' }} />;
      } else if (joursRestants <= 2) {
        return <AlertCircle {...iconProps} style={{ color: '#f97316' }} />;
      } else {
        return <BookOpen {...iconProps} style={{ color: '#3b82f6' }} />;
      }
    case 'new_message':
      return <Bell {...iconProps} style={{ color: '#3b82f6' }} />;
    default:
      return <Bell {...iconProps} style={{ color: '#6b7280' }} />;
  }
};


  // Obtenir la couleur selon l'urgence
 const getPriorityStyles = (notification) => {
  const { type, category } = notification;

  if (category === 'payment') {
    if (type === 'paiement_expiré') {
      return {
        borderLeft: '4px solid #dc2626',
        backgroundColor: '#fef2f2',
        borderColor: '#fca5a5'
      };
    } else if (type === 'paiement_soon') {
      return {
        borderLeft: '4px solid #ea580c',
        backgroundColor: '#fff7ed',
        borderColor: '#fdba74'
      };
    }
  }

  if (category === 'event') {
    const joursRestants = getJoursRestants(notification.date);
    if (joursRestants === 0) {
      return {
        borderLeft: '4px solid #ef4444',
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca'
      };
    } else if (joursRestants <= 2) {
      return {
        borderLeft: '4px solid #f97316',
        backgroundColor: '#fff7ed',
        borderColor: '#fed7aa'
      };
    } else if (joursRestants <= 5) {
      return {
        borderLeft: '4px solid #eab308',
        backgroundColor: '#fefce8',
        borderColor: '#fde047'
      };
    }
  }

  if (category === 'message') {
    return {
      borderLeft: '4px solid #3b82f6',
      backgroundColor: '#eff6ff',
      borderColor: '#93c5fd'
    };
  }

  return {
    borderLeft: '4px solid #d1d5db',
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb'
  };
};


  // Formater le temps relatif
  const formatTimeAgo = (date, type = null) => {
    if (type === 'paiement_expiré' || type === 'paiement_soon') {
      return 'Paiement';
    }
    
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = eventDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    if (diffDays > 1) return `Dans ${diffDays} jours`;
    return 'Passé';
  };

  // Calculer les jours restants
  const getJoursRestants = (date) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = eventDate - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    if (notification.category === 'payment') {
      // Navigation vers les paiements
      if (onNavigate) {
        onNavigate('/etudiant/paiements');
      }
    } else if (notification.category === 'event') {
      // Navigation vers les événements publics
      if (onNavigate) {
        onNavigate('/evenements-etudiant');
      }
    }if (notification.category === 'message') {
  if (onNavigate) {
    onNavigate('/etudiant/messages');
  }
  setIsOpen(false);
}

    setIsOpen(false);
  };

  // Actualiser manuellement
  const handleRefresh = () => {
    loadNotifications();
  };
const messageCount = notifications.filter(n => n.category === 'message').length;

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
    
    notificationButtonHover: {
      color: '#1f2937',
      backgroundColor: '#f3f4f6',
      transform: 'scale(1.05)'
    },
    
    badge: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      backgroundColor: '#dc2626',
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
      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
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
      minWidth: '200px',
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
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: 'white',
      textAlign: 'center'
    },
    
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '4px'
    },
    
    statLabel: {
      fontSize: '14px',
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

  const getPriorityBadgeStyle = (notification) => {
    const baseStyle = { ...styles.priorityBadge };
    const { type, category } = notification;
    
    if (category === 'payment') {
      if (type === 'paiement_expiré') {
        return { ...baseStyle, backgroundColor: '#fef2f2', color: '#991b1b' };
      } else if (type === 'paiement_soon') {
        return { ...baseStyle, backgroundColor: '#fff7ed', color: '#9a3412' };
      }
    }
    
    if (category === 'event') {
      const joursRestants = getJoursRestants(notification.date);
      if (joursRestants === 0) {
        return { ...baseStyle, backgroundColor: '#fef2f2', color: '#991b1b' };
      } else if (joursRestants <= 2) {
        return { ...baseStyle, backgroundColor: '#fff7ed', color: '#9a3412' };
      } else if (joursRestants <= 5) {
        return { ...baseStyle, backgroundColor: '#fefce8', color: '#a16207' };
      }
    }
    
    return { ...baseStyle, backgroundColor: '#eff6ff', color: '#1d4ed8' };
  };

 const getPriorityLabel = (notification) => {
  const { type, category } = notification;

  if (category === 'payment') {
    if (type === 'paiement_expiré') {
      return { emoji: '🔴', text: 'Paiement expiré' };
    } else if (type === 'paiement_soon') {
      return { emoji: '🟡', text: 'Moins de 2 jours restants' };
    }
  }

  if (category === 'event') {
    const joursRestants = getJoursRestants(notification.date);
    if (joursRestants === 0) return { emoji: '🔥', text: 'Aujourd\'hui' };
    if (joursRestants <= 2) return { emoji: '⚠️', text: 'Urgent' };
    if (joursRestants <= 5) return { emoji: '💡', text: 'Bientôt' };
    return { emoji: '📚', text: 'À venir' };
  }

  if (category === 'message') {
    return { emoji: '✉️', text: 'Message reçu' };
  }

  return { emoji: '📄', text: 'Information' };
};


  // Compter les notifications par catégorie
  const paymentCount = notifications.filter(n => n.category === 'payment').length;
  const eventCount = notifications.filter(n => n.category === 'event').length;

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
          title="Notifications Étudiant"
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
                <h3 style={styles.headerTitle}>Notifications Étudiant</h3>
              <p style={styles.headerSubtitle}>
  {messageCount > 0 && `${messageCount} message(s)`}
  {paymentCount > 0 && ` • ${paymentCount} paiement(s)`}
  {eventCount > 0 && ` • ${eventCount} événement(s)`}
  {unreadCount === 0 && 'Aucune notification'}
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
                        <span>Actualiser tout</span>
                      </button>
                    </div>
                  )}
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
            <div style={styles.statsContainer}>
              <div style={styles.statValue}>{notifications.length}</div>
              <div style={styles.statLabel}>
                {paymentCount > 0 && eventCount > 0 && 'Paiements & Événements'}
                {paymentCount > 0 && eventCount === 0 && 'Notifications de paiement'}
                {paymentCount === 0 && eventCount > 0 && 'Événements à venir'}
                {paymentCount === 0 && eventCount === 0 && 'Aucune notification'}
              </div>
            </div>

            {/* Liste des notifications */}
            <div style={styles.notificationsList}>
              {loading ? (
                <div style={styles.loadingContainer}>
                  <Loader2 className="animate-spin" size={24} style={{ color: '#3b82f6' }} />
                  <span style={{ marginLeft: '8px' }}>Chargement...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div style={styles.emptyState}>
                  <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '12px' }} />
                  <p style={styles.emptyStateTitle}>Aucune notification</p>
                  <p style={styles.emptyStateText}>Vos paiements sont à jour et aucun événement n'est prévu prochainement.</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const priorityStyles = getPriorityStyles(notification);
                  const priorityLabel = getPriorityLabel(notification);
                  
                  return (
                    <div
                      key={notification.id}
                      style={{
                        ...styles.notificationItem,
                        ...priorityStyles
                      }}
                      className="notification-item"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div style={styles.notificationContent}>
                        <div style={styles.iconContainer}>
                          {getNotificationIcon(notification.type, getJoursRestants(notification.date))}
                        </div>
                        
                        <div style={styles.contentBody}>
                          <div style={styles.contentHeader}>
                            <h4 style={styles.notificationTitle}>
                              {notification.title}
                            </h4>
                            
                            <div style={styles.notificationActions}>
                              <span style={styles.timestamp}>
                                {formatTimeAgo(notification.date, notification.type)}
                              </span>
                              
                              <button
                                onClick={(e) => deleteNotification(notification.id, e)}
                                style={styles.deleteButton}
                                className="delete-button"
                                title="Supprimer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <p style={styles.notificationMessage}>
                            {notification.message}
                          </p>
                          
                          <div style={styles.footer}>
                            <div style={getPriorityBadgeStyle(notification)}>
                              <span>{priorityLabel.emoji}</span>
                              <span>{priorityLabel.text}</span>
                            </div>
                            
                            {notification.category === 'payment' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <DollarSign size={14} style={{ color: '#6b7280' }} />
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                  {notification.cours}
                                </span>
                              </div>
                            )}
                            
                            {notification.category === 'event' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={14} style={{ color: '#6b7280' }} />
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                  {new Date(notification.date).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={styles.dropdownFooter}>
              <button
                onClick={handleRefresh}
                disabled={loading}
                style={styles.refreshButton}
                className="refresh-button"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" style={{ marginRight: '4px' }} />
                    Actualisation...
                  </>
                ) : (
                  'Actualiser les notifications'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationEtudiant;