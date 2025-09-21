import React, { useEffect, useState, useRef } from 'react';
import { Send, User, Search, X, Bell, Trash2, MoreVertical, Check, CheckCheck, Paperclip , Mic } from 'lucide-react';
import './message.css';
import Sidebar from '../components/SidebarProf'; // Composant sidebar pour professeu
const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const MicIcon = Mic;

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'il y a quelques secondes';
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
  return `le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// ✅ Composant UserAvatar réutilisable
const UserAvatar = ({ user, size = 48 }) => {
  const [imageError, setImageError] = useState(false);
  
  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath.trim() === '') return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/')) {
      return `http://localhost:5000${imagePath}`;
    }
    
    return `http://localhost:5000/${imagePath}`;
  };

  const imageUrl = getImageUrl(user?.image);
  
  if (!imageUrl || imageError) {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: user?.genre === 'Femme' ? '#ec4899' : '#3b82f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <User size={size * 0.5} style={{ color: 'white' }} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={user?.nom || 'Avatar'}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0
      }}
      onError={() => setImageError(true)}
    />
  );
};

// ✅ Composant Modal de confirmation
const ConfirmModal = ({ show, onClose, onConfirm, title, message }) => {
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
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Composant de chargement
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
    <div style={{
      width: '20px',
      height: '20px',
      border: '2px solid #e4e6ea',
      borderTop: '2px solid #0084ff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const MessageProf = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [fichier, setFichier] = useState(null);
  const [contenu, setContenu] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [lastMessageByUser, setLastMessageByUser] = useState({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingEtudiants, setIsLoadingEtudiants] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioChunksRef = useRef([]);

const [isRecording, setIsRecording] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState(null);
const [audioBlob, setAudioBlob] = useState(null);

  // ✅ Fonction pour faire défiler vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Récupérer les informations de l'utilisateur actuel (professeur)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token manquant');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/professeur/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération de l\'utilisateur');
        }
        
        const data = await response.json();
        setCurrentUser(data);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur actuel:', error);
        setError('Erreur lors de la récupération de l\'utilisateur');
      }
    };
    fetchCurrentUser();
  }, []);

  // ✅ Récupérer les étudiants avec gestion d'erreur améliorée
  useEffect(() => {
    const fetchEtudiants = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token manquant');
        return;
      }

      setIsLoadingEtudiants(true);
      try {
        const response = await fetch('http://localhost:5000/api/professeur/mes-etudiants-messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des étudiants');
        }
        
        const data = await response.json();
        setEtudiants(Array.isArray(data) ? data : []);
        
        // Extraire le dernier message pour chaque étudiant
        const lastMessages = {};
        data.forEach(etudiant => {
          if (etudiant?.dernierMessage) {
            lastMessages[etudiant._id] = etudiant.dernierMessage;
          }
        });
        setLastMessageByUser(lastMessages);
      } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error);
        setError('Erreur lors de la récupération des étudiants');
      } finally {
        setIsLoadingEtudiants(false);
      }
    };
    fetchEtudiants();
  }, [refresh]);

  // ✅ Récupérer les messages non lus avec gestion d'erreur
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/messages/unread-by-sender', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUnreadCounts(data || {});
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des messages non lus:', error);
      }
    };
    fetchUnreadCounts();
  }, [refresh]);

  // ✅ Vérifier le statut en ligne des utilisateurs
  useEffect(() => {
    const checkOnlineStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/users/online-status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setOnlineUsers(new Set(data.onlineUsers || []));
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut en ligne:', error);
      }
    };
    
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Récupérer les messages de la conversation et marquer comme lus
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedEtudiant?._id) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      setIsLoadingMessages(true);
      try {
        const response = await fetch(`http://localhost:5000/api/messages/professeur/${selectedEtudiant._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des messages');
        }
        
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
        
        // Marquer les messages comme lus
        await fetch('http://localhost:5000/api/messages/mark-conversation-read', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ expediteurId: selectedEtudiant._id })
        });
        
        // Mettre à jour le compteur de messages non lus
        setUnreadCounts(prev => ({
          ...prev,
          [selectedEtudiant._id]: 0
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        setError('Erreur lors de la récupération des messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedEtudiant, refresh]);

  // ✅ Envoyer un message avec gestion d'erreur améliorée
  const envoyerMessage = async () => {
    if ((!contenu.trim() && !fichier) || !selectedEtudiant?._id || isSending) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token manquant');
      return;
    }

    setIsSending(true);
    const formData = new FormData();
    formData.append('destinataireId', selectedEtudiant._id);
    formData.append('roleDestinataire', 'Etudiant');
    if (contenu.trim()) formData.append('contenu', contenu.trim());
    if (fichier) formData.append('fichier', fichier);

    try {
      const response = await fetch('http://localhost:5000/api/messages/upload-prof', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error("Erreur lors de l'envoi");

      const result = await response.json();

      // ✅ Ajouter le message directement à l'état
      setMessages((prev) => [...prev, result.data]);

      setContenu('');
      setFichier(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Optionnel, si d'autres hooks utilisent `refresh`
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      setError("Erreur lors de l'envoi du message");
    } finally {
      setIsSending(false);
    }
  };

  // ✅ Supprimer un message avec confirmation
  const handleDeleteMessage = (messageId) => {
    if (!messageId) return;
    setMessageToDelete(messageId);
    setShowConfirmModal(true);
    setShowDropdown(null);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token manquant');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/messages/${messageToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du message');
      }
      
      setRefresh(prev => !prev);
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      setError('Erreur lors de la suppression du message');
    } finally {
      setShowConfirmModal(false);
      setMessageToDelete(null);
    }
  };
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioBlob(audioBlob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  } catch (err) {
    console.error("Erreur microphone:", err);
    alert("Impossible d'accéder au micro.");
  }
};

const stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], 'audio_message.webm', { type: 'audio/webm' });
      setAudioBlob(blob); // إن أردت تشغيله محليًا

      // الآن نرسله للسيرفر مثل أي ملف:
      const token = localStorage.getItem('token');
      if (!token || !selectedEtudiant?._id) return;

      const formData = new FormData();
      formData.append('destinataireId', selectedEtudiant._id);
      formData.append('roleDestinataire', 'Etudiant');
      formData.append('fichier', file);

      try {
        const response = await fetch('http://localhost:5000/api/messages/upload-prof', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const result = await response.json();
        setMessages((prev) => [...prev, result.data]);
        setRefresh(prev => !prev);
      } catch (err) {
        console.error('Erreur envoi audio:', err);
        setError("Erreur lors de l'envoi de l'audio");
      }
    };

    mediaRecorder.stop();
    setIsRecording(false);
  }
};


  // ✅ Filtrer les étudiants de manière sécurisée
  const filteredEtudiants = etudiants.filter(etudiant => {
    if (!etudiant) return false;
    
    const nom = etudiant.nom || '';
    const prenom = etudiant.prenom || '';
    const email = etudiant.email || '';
    const classe = etudiant.classe || '';
    
    return nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
           prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           classe.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ✅ Gérer l'appui sur Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyerMessage();
    }
  };

  // ✅ Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ✅ Fonction pour formater le temps du dernier message
  const formatLastMessageTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    
    if (isNaN(messageDate.getTime())) return '';
    
    const diff = now - messageDate;
    
    if (diff < 60000) return 'maintenant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}j`;
    return messageDate.toLocaleDateString('fr-FR');
  };

  // ✅ Trier les étudiants par dernière activité
  const sortedEtudiants = filteredEtudiants.sort((a, b) => {
    const lastMessageA = lastMessageByUser[a._id];
    const lastMessageB = lastMessageByUser[b._id];
    
    if (!lastMessageA && !lastMessageB) return 0;
    if (!lastMessageA) return 1;
    if (!lastMessageB) return -1;
    
    return new Date(lastMessageB.date) - new Date(lastMessageA.date);
  });

  // ✅ Gérer la fermeture de l'erreur
  const dismissError = () => {
    setError(null);
  };

  // ✅ Fonction pour obtenir le nom du fichier
  const getFileName = (filePath) => {
    if (!filePath) return 'Fichier';
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };

  // ✅ Fonction pour obtenir l'extension du fichier
  const getFileExtension = (filePath) => {
    if (!filePath) return '';
    const parts = filePath.split('.');
    return parts[parts.length - 1].toLowerCase();
  };

  // ✅ Fonction pour obtenir l'icône du fichier
  const getFileIcon = (filePath) => {
    const ext = getFileExtension(filePath);
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex',           background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)'
 }}> <Sidebar onLogout={handleLogout} />
      <div style={{ flexGrow: 1, padding: '20px' }}>
    <div style={{
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: 'white',
  padding: '12px 20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '20px'
}}>
  <h2 style={{
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1c1e21',
    textAlign: 'center',
    margin: 0
  }}>
     Messagerie Étudiants
  </h2>
</div>


        
        {/* Affichage des erreurs */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
            <button
              onClick={dismissError}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 4px'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 100px)' }}>
          {/* ✅ Sidebar des étudiants */}
          <div style={{ 
            width: '360px', 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', 
            overflow: 'hidden' 
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e4e6ea' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: '#1c1e21' }}>
                Conversations
              </h3>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#65676b' }} />
                <input
                  type="text"
                  placeholder="Rechercher un étudiant"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    border: 'none',
                    borderRadius: '20px',
                    backgroundColor: '#f0f2f5',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            
            <div style={{ height: 'calc(100% - 90px)', overflowY: 'auto' }}>
              {isLoadingEtudiants ? (
                <LoadingSpinner />
              ) : sortedEtudiants.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#65676b' }}>
                  {searchTerm ? 'Aucun étudiant trouvé' : 'Aucun étudiant disponible'}
                </div>
              ) : (
                sortedEtudiants.map((etudiant) => {
                  const lastMessage = lastMessageByUser[etudiant._id];
                  const isUnread = unreadCounts[etudiant._id] > 0;
                  
                  return (
                    <div
                      key={etudiant._id}
                      onClick={() => setSelectedEtudiant(etudiant)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        backgroundColor: selectedEtudiant?._id === etudiant._id ? '#e7f3ff' : 'transparent',
                        borderLeft: selectedEtudiant?._id === etudiant._id ? '3px solid #1877f2' : '3px solid transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedEtudiant?._id !== etudiant._id) {
                          e.currentTarget.style.backgroundColor = '#f2f3f4';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedEtudiant?._id !== etudiant._id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ position: 'relative', marginRight: '12px' }}>
                        <UserAvatar user={etudiant} size={56} />
                        {onlineUsers.has(etudiant._id) && (
                          <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#42b883',
                            borderRadius: '50%',
                            border: '2px solid white'
                          }} />
                        )}
                        {isUnread && (
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            backgroundColor: '#e41e3f',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600'
                          }}>
                            {unreadCounts[etudiant._id]}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '2px'
                        }}>
                          <div style={{ 
                            fontWeight: isUnread ? '600' : '500', 
                            color: '#1c1e21', 
                            fontSize: '15px' 
                          }}>
{etudiant.nomComplet}
                          </div>
                          {lastMessage && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#65676b',
                              flexShrink: 0,
                              marginLeft: '8px'
                            }}>
                              {formatLastMessageTime(lastMessage.date)}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: isUnread ? '#1c1e21' : '#65676b' }}>
                          {lastMessage ? (
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lastMessage.roleExpediteur === 'Professeur' ? 'Vous : ' : ''}
                              {lastMessage.contenu || 'Fichier envoyé'}
                            </div>
                          ) : (
                            <div style={{ fontStyle: 'italic', color: '#888' }}>
                              Aucun message pour le moment
                            </div>
                          )}

                          {etudiant.classe && (
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                              Classe : {etudiant.classe}
                            </div>
                          )}
                          
                        {etudiant.cours && etudiant.cours.length > 0 && (
  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
    {etudiant.cours.join(', ')}
  </div>
)}

                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ✅ Zone de conversation */}
          <div style={{ 
            flex: 1, 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            {selectedEtudiant ? (
              <>
                <div style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid #e4e6ea', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px' 
                }}>
                  <UserAvatar user={selectedEtudiant} size={40} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1c1e21' }}>
{selectedEtudiant.nomComplet}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#65676b' }}>
                      {onlineUsers.has(selectedEtudiant._id) ? (
                        'En ligne'
                      ) : selectedEtudiant.lastSeen ? (
                        `Hors ligne - Dernière activité : ${formatTimeAgo(selectedEtudiant.lastSeen)}`
                      ) : (
                        'Hors ligne - Dernière activité inconnue'
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  {isLoadingMessages ? (
                    <LoadingSpinner />
                  ) : messages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      color: '#65676b',
                      fontSize: '14px',
                      marginTop: '20px'
                    }}>
                      Aucun message dans cette conversation
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      if (!message) return null;
                      
                      const isOwnMessage = message.roleExpediteur === 'Professeur';
                      const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.roleExpediteur === 'Professeur');
                      
                      return (
                   <div
                          key={message._id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            marginBottom: '12px',
                            flexDirection: isOwnMessage ? 'row-reverse' : 'row'
                          }}
                        >
                          {showAvatar && (
                            <UserAvatar user={selectedEtudiant} size={32} />
                          )}
                          
                          <div style={{
                            maxWidth: '70%',
                            backgroundColor: isOwnMessage ? '#0084ff' : '#e4e6ea',
                            borderRadius: '18px',
                            padding: '8px 12px',
                            position: 'relative',
                            marginLeft: !isOwnMessage && !showAvatar ? '40px' : '0'
                          }}>
                            {/* Contenu du message */}
                            {message.contenu && (
                              <div style={{
                                color: isOwnMessage ? 'white' : '#1c1e21',
                                fontSize: '14px',
                                lineHeight: '1.4',
                                marginBottom: message.fichier ? '8px' : '0'
                              }}>
                                {message.contenu}
                              </div>
                            )}
                            {message.fichier && getFileExtension(message.fichier) === 'webm' && (
  <audio controls src={`http://localhost:5000${message.fichier}`} style={{ marginTop: '8px', width: '100%' }} />
)}

                            {/* Fichier attaché */}
                            {message.fichier && (
                              <div style={{
                                backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.1)' : '#f0f2f5',
                                borderRadius: '8px',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: message.contenu ? '8px' : '0'
                              }}>
                                <span style={{ fontSize: '16px' }}>
                                  {getFileIcon(message.fichier)}
                                </span>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    fontSize: '13px',
                                    color: isOwnMessage ? 'white' : '#1c1e21',
                                    fontWeight: '500'
                                  }}>
                                    {getFileName(message.fichier)}
                                  </div>
                                  <div style={{
                                    fontSize: '11px',
                                    color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#65676b'
                                  }}>
                                    {getFileExtension(message.fichier).toUpperCase()}
                                  </div>
                                </div>
                                <a
                                  href={`http://localhost:5000${message.fichier}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : '#e4e6ea',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: isOwnMessage ? 'white' : '#1c1e21',
                                    textDecoration: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Ouvrir
                                </a>
                              </div>
                            )}
                            
                            {/* Menu dropdown pour supprimer */}
                            {isOwnMessage && (
                              <div style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px'
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDropdown(showDropdown === message._id ? null : message._id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    opacity: 0.7,
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                                  onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                                >
                                  <MoreVertical size={14} />
                                </button>
                                
                                {showDropdown === message._id && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: '0',
                                    backgroundColor: 'white',
                                    border: '1px solid #e4e6ea',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    zIndex: 1000,
                                    minWidth: '120px'
                                  }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMessage(message._id);
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        color: '#e41e3f',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        borderRadius: '6px'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <Trash2 size={14} />
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Indicateur de statut de lecture */}
                          {isOwnMessage && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginTop: '8px',
                              marginRight: '4px'
                            }}>
                              {message.lu ? (
                                <CheckCheck size={14} style={{ color: '#0084ff' }} />
                              ) : (
                                <Check size={14} style={{ color: '#65676b' }} />
                              )}
                            </div>
                          )}
                          
                          {/* Heure du message */}
                          <div style={{
                            fontSize: '11px',
                            color: '#65676b',
                            alignSelf: 'flex-end',
                            marginTop: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            {formatTimeAgo(message.date)}
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Indicateur de frappe */}
                  {isTyping && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <UserAvatar user={selectedEtudiant} size={24} />
                      <div style={{
                        backgroundColor: '#e4e6ea',
                        borderRadius: '18px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        fontStyle: 'italic',
                        color: '#65676b'
                      }}>
                        {selectedEtudiant.prenom} est en train d'écrire...
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Zone de saisie */}
                <div style={{ 
                  padding: '16px 20px', 
                  borderTop: '1px solid #e4e6ea',
                  backgroundColor: 'white'
                }}>
                  {/* Aperçu du fichier sélectionné */}
                  {fichier && (
                    <div style={{
                      backgroundColor: '#f0f2f5',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '16px' }}>
                        {getFileIcon(fichier.name)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: '#1c1e21', fontWeight: '500' }}>
                          {fichier.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#65676b' }}>
                          {(fichier.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFichier(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '50%',
                          color: '#65676b'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e4e6ea'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: '12px',
                    backgroundColor: '#f0f2f5',
                    borderRadius: '20px',
                    padding: '8px 12px'
                  }}>
                    {/* Bouton d'attachement */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => setFichier(e.target.files[0])}
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar,.mp3,.wav,.ogg,.mp4,.avi,.mov,.mkv"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        color: '#0084ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e4e6ea'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <Paperclip size={20} />
                    </button>
                  <button
  onClick={isRecording ? stopRecording : startRecording}
  title={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
  style={{
    backgroundColor: isRecording ? '#ef4444' : '#f0f2f5',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    color: isRecording ? 'white' : '#0084ff'
  }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isRecording ? '#dc2626' : '#e4e6ea'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isRecording ? '#ef4444' : '#f0f2f5'}
>
  {isRecording ? <X size={18} /> : <MicIcon size={18} />}
</button>


                    {/* Zone de texte */}
                    <textarea
                      value={contenu}
                      onChange={(e) => setContenu(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Écrivez votre message..."
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontSize: '15px',
                        backgroundColor: 'transparent',
                        minHeight: '20px',
                        maxHeight: '100px',
                        padding: '8px 0',
                        fontFamily: 'inherit'
                      }}
                      rows="1"
                    />
                    
                    {/* Bouton d'envoi */}
                    <button
                      onClick={envoyerMessage}
                      disabled={(!contenu.trim() && !fichier) || isSending}
                      style={{
                        background: (!contenu.trim() && !fichier) || isSending ? '#bcc0c4' : '#0084ff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        cursor: (!contenu.trim() && !fichier) || isSending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {isSending ? (
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #ffffff',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      ) : (
                        <Send size={16} style={{ color: 'white' }} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px',
                color: '#65676b'
              }}>
                <div style={{ fontSize: '64px' }}>💬</div>
                <h3 style={{ fontSize: '20px', fontWeight: '500', margin: 0 }}>
                  Sélectionnez un étudiant
                </h3>
                <p style={{ fontSize: '14px', textAlign: 'center', margin: 0 }}>
                  Choisissez un étudiant dans la liste pour commencer une conversation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        show={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setMessageToDelete(null);
        }}
        onConfirm={confirmDeleteMessage}
        title="Supprimer le message"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
      />
      
      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Scrollbar personnalisée */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Animation pour les messages */
        .message-enter {
          opacity: 0;
          transform: translateY(20px);
          animation: messageEnter 0.3s ease-out forwards;
        }
        
        @keyframes messageEnter {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Effet hover pour les éléments interactifs */
        .hover-effect {
          transition: all 0.2s ease;
        }
        
        .hover-effect:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default MessageProf;