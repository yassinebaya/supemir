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
  Settings
} from 'lucide-react';

const NotificationProf = ({ onNavigate }) => {
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

  // Charger les notifications
 const loadNotifications = async () => {
  try {
    setLoading(true);

    const [msgRes, evtRes] = await Promise.all([
      fetch(`${API_BASE}/messages/notifications-professeur`, {
        headers: getAuthHeaders()
      }),
      fetch(`${API_BASE}/evenements/public`, {
        headers: getAuthHeaders()
      })
    ]);

    const messages = msgRes.ok ? await msgRes.json() : [];
    const evenements = evtRes.ok ? await evtRes.json() : [];

    const formattedMessages = messages.map(msg => ({
      id: `msg-${msg._id}`,
      title: `Message de ${msg.expediteur?.nomComplet || 'Étudiant inconnu'}`,
      message: msg.contenu || 'Vous avez reçu un message',
      date: msg.date,
      type: 'message',
      category: 'message'
    }));

const now = new Date();

const in7days = new Date();
in7days.setDate(now.getDate() + 7);

const formattedEvents = evenements
  .filter(evt => {
    const date = new Date(evt.dateDebut);
    return date >= now && date <= in7days;
  })
  .map(evt => ({
    id: `evt-${evt._id}`,
    title: `Événement: ${evt.titre}`,
    message: evt.description || 'Événement prévu',
    date: evt.dateDebut,
    type: 'evenement',
    category: 'evenement'
  }));



    const all = [...formattedMessages, ...formattedEvents];
    const sorted = all.sort((a, b) => new Date(b.date) - new Date(a.date));

    setNotifications(sorted);
    setUnreadCount(sorted.length);
  } catch (error) {
    console.error('❌ Erreur chargement notifications prof:', error);
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

  // Réinitialiser les notifications supprimées (fonction placeholder pour la cohérence du design)
  const resetDeletedNotifications = async () => {
    try {
      setResetLoading(true);
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recharger les notifications
      await loadNotifications();
      
      // Fermer le menu
      setShowMenu(false);
      
      alert('Notifications professeur actualisées !');
      
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

    if (type === 'message') {
      return <Bell {...iconProps} style={{ color: '#3b82f6' }} />;
    }

    // Ancienne logique pour événements
    if (joursRestants === 0) {
      return <AlertTriangle {...iconProps} style={{ color: '#ef4444' }} />;
    } else if (joursRestants <= 2) {
      return <AlertCircle {...iconProps} style={{ color: '#f97316' }} />;
    } else {
      return <Calendar {...iconProps} style={{ color: '#3b82f6' }} />;
    }
  };

  // ✅ إصلاح 1: إضافة parameter category
  const getPriorityStyles = (joursRestants, category = '') => {
    if (category === 'message') {
      return {
        borderLeft: '4px solid #3b82f6',
        backgroundColor: '#eff6ff',
        borderColor: '#93c5fd'
      };
    }

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
    } else {
      return {
        borderLeft: '4px solid #d1d5db',
        backgroundColor: '#f9fafb',
        borderColor: '#e5e7eb'
      };
    }
  };

  // ✅ إصلاح 2: إضافة parameter category
  const getPriorityLabel = (joursRestants, category = '') => {
    if (category === 'message') {
      return { emoji: '✉️', text: 'Message reçu' };
    }
    if (joursRestants === 0) return { emoji: '🔥', text: 'Aujourd\'hui' };
    if (joursRestants <= 2) return { emoji: '⚠️', text: 'Urgent' };
    if (joursRestants <= 5) return { emoji: '💡', text: 'Bientôt' };
    return { emoji: 'ℹ️', text: 'À venir' };
  };

  // Formater le temps relatif
  const formatTimeAgo = (date) => {
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

  // ✅ إصلاح 4: تحسين التوجيه حسب نوع الإشعار
  const handleNotificationClick = (notification) => {
    if (onNavigate) {
      if (notification.category === 'message') {
        onNavigate('/professeur/messages');
      } else {
        onNavigate('/evenements-prof');
      }
    }
    setIsOpen(false);
  };

  // Actualiser manuellement
  const handleRefresh = () => {
    loadNotifications();
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
    
    notificationButtonHover: {
      color: '#1f2937',
      backgroundColor: '#f3f4f6',
      transform: 'scale(1.05)'
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

  const getPriorityBadgeStyle = (joursRestants, category) => {
    const baseStyle = { ...styles.priorityBadge };
    
    if (category === 'message') {
      return { ...baseStyle, backgroundColor: '#eff6ff', color: '#1e40af' };
    }
    
    if (joursRestants === 0) {
      return { ...baseStyle, backgroundColor: '#fef2f2', color: '#991b1b' };
    } else if (joursRestants <= 2) {
      return { ...baseStyle, backgroundColor: '#fff7ed', color: '#9a3412' };
    } else if (joursRestants <= 5) {
      return { ...baseStyle, backgroundColor: '#fefce8', color: '#a16207' };
    } else {
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
          title="Notifications Professeur"
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
                <h3 style={styles.headerTitle}>Notifications Professeur</h3>
                {/* ✅ إصلاح 5: تحسين عرض الإحصائيات */}
                <p style={styles.headerSubtitle}>
                  {notifications.filter(n => n.category === 'message').length} message(s) • 
                  {notifications.filter(n => n.category !== 'message').length} événement(s)
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
                        <span>Actualiser les événements</span>
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
              <div style={styles.statLabel}>Messages et événements</div>
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
                  <p style={styles.emptyStateText}>Pas de nouveaux messages ou événements 📧</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const joursRestants = getJoursRestants(notification.date);
                  // ✅ إصلاح 3: تمرير category للدوال
                  const priority = getPriorityLabel(joursRestants, notification.category);
                  const priorityStyle = getPriorityStyles(joursRestants, notification.category);
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        ...styles.notificationItem,
                        ...priorityStyle
                      }}
                      className="notification-item"
                    >
                      <div style={styles.notificationContent}>
                        {/* Icône */}
                        <div style={styles.iconContainer}>
                          {getNotificationIcon(notification.type, joursRestants)}
                        </div>
                        
                        {/* Contenu */}
                        <div style={styles.contentBody}>
                          <div style={styles.contentHeader}>
                            <h4 style={styles.notificationTitle}>
                              {notification.title}
                            </h4>
                            
                            <div style={styles.notificationActions}>
                              <span style={styles.timestamp}>
                                {formatTimeAgo(notification.date)}
                              </span>
                              
                              {/* Bouton de suppression */}
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
                          
                          <p style={styles.notificationMessage}>
                            {notification.message}
                          </p>
                          
                          {/* Footer avec badge de priorité */}
                          <div style={styles.footer}>
                            <span style={getPriorityBadgeStyle(joursRestants, notification.category)}>
                              {priority.emoji} {priority.text}
                            </span>
                            
                            <ExternalLink size={14} style={{ color: '#9ca3af' }} />
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
                style={styles.refreshButton}
                className="refresh-button"
              >
                Actualiser les notifications
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationProf;