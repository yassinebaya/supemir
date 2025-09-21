import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Phone, 
  User, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  GraduationCap,
  Award,
  Building,
  DollarSign,
  FileText,
  Clock,
  Users,
  Badge,
  Download,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../components/SidebarProf';
import { useNavigate } from 'react-router-dom';
import HeaderProf from '../components/Headerprof';
 
const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const ProfileProfesseur = () => {
  const [professeur, setProfesseur] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (!token || role !== 'prof') {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://195.179.229.230:5000/api/professeur/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Échec de chargement du profil');
        }

        const data = await res.json();
        setProfesseur(data);
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const calculerAge = (dateNaissance) => {
    if (!dateNaissance) return 'N/A';
    const dob = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} ans`;
  };

  const getStatutDossierColor = (statut) => {
    switch (statut) {
      case 'complet':
      case 'valide':
        return '#10b981';
      case 'en_attente':
        return '#f59e0b';
      case 'incomplet':
      case 'rejete':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatutDossierText = (statut) => {
    switch (statut) {
      case 'complet': return 'Dossier Complet';
      case 'valide': return 'Dossier Validé';
      case 'en_attente': return 'En Attente de Validation';
      case 'incomplet': return 'Dossier Incomplet';
      case 'rejete': return 'Dossier Rejeté';
      default: return 'Statut Inconnu';
    }
  };

  const downloadDocument = (docPath, docName) => {
    if (!docPath) return;
    
    const link = document.createElement('a');
    link.href = `http://195.179.229.230:5000${docPath}`;
    link.download = docName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Chargement du profil...</p>
      </div>
    );
  }

  if (!professeur) {
    return (
      <div style={styles.errorContainer}>
        <XCircle size={48} color="#ef4444" />
        <p style={styles.errorText}>Professeur non trouvé</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />

      {/* Header */}
      <div style={styles.header}>
        <div style={{ ...styles.headerContent, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ ...styles.headerTitle, textAlign: 'center', width: '100%' }}>Mon Profil</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Profile Card */}
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarContainer}>
              {professeur.image ? (
                <img
                  src={`http://195.179.229.230:5000${professeur.image}`}
                  alt="Profil"
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <GraduationCap size={40} color="#6b7280" />
                </div>
              )}
              <div style={styles.statusBadge}>
                {professeur.actif ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : (
                  <XCircle size={16} color="#ef4444" />
                )}
              </div>
            </div>
            <div style={styles.profileInfo}>
              <h2 style={styles.profileName}>{professeur.nom}</h2>
              <p style={styles.profileEmail}>{professeur.email}</p>
              <div style={styles.badgeContainer}>
                <div style={{
                  ...styles.typeBadge,
                  backgroundColor: professeur.estPermanent ? '#dbeafe' : '#fef3c7',
                  color: professeur.estPermanent ? '#1e40af' : '#d97706'
                }}>
                  <Badge size={14} />
                  {professeur.estPermanent ? 'Professeur Permanent' : 'Professeur Entrepreneur'}
                </div>
                {!professeur.estPermanent && (
                  <div style={{
                    ...styles.statutBadge,
                    backgroundColor: getStatutDossierColor(professeur.statutDossier) + '20',
                    color: getStatutDossierColor(professeur.statutDossier)
                  }}>
                    {getStatutDossierText(professeur.statutDossier)}
                  </div>
                )}
              </div>
              <div style={styles.statusContainer}>
                <span style={{
                  ...styles.statusText,
                  color: professeur.actif ? '#10b981' : '#ef4444'
                }}>
                  {professeur.actif ? 'Compte Actif' : 'Compte Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards Grid */}
        <div style={styles.cardsGrid}>
          {/* Personal Information */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <User size={20} color="#4f46e5" />
              <h3 style={styles.cardTitle}>Informations Personnelles</h3>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.infoItem}>
                <Phone size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Téléphone</span>
                  <span style={styles.infoValue}>{professeur.telephone || 'Non renseigné'}</span>
                </div>
              </div>
              <div style={styles.infoItem}>
                <Calendar size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Date de naissance</span>
                  <span style={styles.infoValue}>
                    {professeur.dateNaissance ? 
                      `${professeur.dateNaissance.split('T')[0]} (${calculerAge(professeur.dateNaissance)})` : 
                      'Non renseigné'
                    }
                  </span>
                </div>
              </div>
              {professeur.genre && (
                <div style={styles.infoItem}>
                  <User size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Genre</span>
                    <span style={styles.infoValue}>{professeur.genre}</span>
                  </div>
                </div>
              )}
              {professeur.dateEmbauche && (
                <div style={styles.infoItem}>
                  <Building size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Date d'embauche</span>
                    <span style={styles.infoValue}>
                      {new Date(professeur.dateEmbauche).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          {!professeur.estPermanent && (
            <div style={styles.infoCard}>
              <div style={styles.cardHeader}>
                <DollarSign size={20} color="#059669" />
                <h3 style={styles.cardTitle}>Informations Professionnelles</h3>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.infoItem}>
                  <DollarSign size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Tarif horaire</span>
                    <span style={styles.infoValue}>
                      {professeur.tarifHoraire ? `${professeur.tarifHoraire} DH/heure` : 'Non défini'}
                    </span>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <Clock size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Total heures/semaine</span>
                    <span style={styles.infoValue}>
                      {professeur.coursEnseignes ? 
                        professeur.coursEnseignes.reduce((total, cours) => total + (cours.heuresParSemaine || 0), 0) + ' heures'
                        : '0 heures'
                      }
                    </span>
                  </div>
                </div>
                {professeur.notes && (
                  <div style={styles.infoItem}>
                    <FileText size={18} color="#6b7280" />
                    <div style={styles.infoDetails}>
                      <span style={styles.infoLabel}>Notes administratives</span>
                      <span style={styles.infoValue}>{professeur.notes}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Courses Information */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <BookOpen size={20} color="#059669" />
              <h3 style={styles.cardTitle}>Mes Cours</h3>
            </div>
            <div style={styles.cardContent}>
              {professeur.coursEnseignes && professeur.coursEnseignes.length > 0 ? (
                <div style={styles.coursesList}>
                  {professeur.coursEnseignes.map((cours, index) => (
                    <div key={index} style={styles.courseItem}>
                      <div style={styles.courseIcon}>
                        <BookOpen size={16} color="#059669" />
                      </div>
                      <div style={styles.courseDetails}>
                        <span style={styles.courseName}>{cours.nomCours}</span>
                        <div style={styles.courseInfo}>
                          <span style={styles.courseMatiere}>{cours.matiere}</span>
                          {cours.niveau && (
                            <span style={styles.courseNiveau}>• {cours.niveau}</span>
                          )}
                          {cours.heuresParSemaine && (
                            <span style={styles.courseHeures}>• {cours.heuresParSemaine}h/sem</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : professeur.cours && professeur.cours.length > 0 ? (
                // Fallback pour l'ancien système
                <div style={styles.coursesList}>
                  {professeur.cours.map((cours, index) => (
                    <div key={index} style={styles.courseItem}>
                      <div style={styles.courseIcon}>
                        <BookOpen size={16} color="#059669" />
                      </div>
                      <div style={styles.courseDetails}>
                        <span style={styles.courseName}>{cours}</span>
                        {professeur.matiere && (
                          <div style={styles.courseInfo}>
                            <span style={styles.courseMatiere}>{professeur.matiere}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.noCourses}>
                  <BookOpen size={32} color="#d1d5db" />
                  <p style={styles.noCoursesText}>Aucun cours assigné</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents (for entrepreneurs only) */}
          {!professeur.estPermanent && professeur.documents && (
            <div style={styles.infoCard}>
              <div style={styles.cardHeader}>
                <FileText size={20} color="#7c3aed" />
                <h3 style={styles.cardTitle}>Mes Documents</h3>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.documentsList}>
                  {Object.entries(professeur.documents).map(([key, value]) => {
                    const documentNames = {
                      diplome: 'Diplôme',
                      cv: 'CV',
                      rib: 'RIB',
                      copieCin: 'Copie CIN',
                      engagement: 'Lettre d\'engagement',
                      vacataire: 'Contrat vacataire'
                    };
                    
                    return (
                      <div key={key} style={styles.documentItem}>
                        <div style={styles.documentInfo}>
                          <FileText size={16} color="#6b7280" />
                          <span style={styles.documentName}>{documentNames[key]}</span>
                        </div>
                        <div style={styles.documentStatus}>
                          {value && value.trim() !== '' ? (
                            <div style={styles.documentActions}>
                              <CheckCircle size={16} color="#10b981" />
                              <button
                                style={styles.downloadButton}
                                onClick={() => downloadDocument(value, documentNames[key])}
                              >
                                <Download size={14} />
                                Télécharger
                              </button>
                            </div>
                          ) : (
                            <div style={styles.documentMissing}>
                              <AlertCircle size={16} color="#ef4444" />
                              <span style={styles.missingText}>Non fourni</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '1rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  
  headerTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  
  profileHeader: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #e5e7eb',
  },
  
  avatarPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #e5e7eb',
  },
  
  statusBadge: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    padding: '0.25rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  
  profileName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.25rem 0',
  },
  
  profileEmail: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 0.75rem 0',
  },
  
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  
  typeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  statutBadge: {
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  statusText: {
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f3f4f6',
  },
  
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  
  infoDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  
  infoLabel: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  infoValue: {
    fontSize: '0.875rem',
    color: '#1f2937',
    fontWeight: '500',
  },
  
  coursesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  
  courseItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f0fdf4',
    borderRadius: '0.5rem',
    border: '1px solid #dcfce7',
  },
  
  courseIcon: {
    padding: '0.375rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.375rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  
  courseDetails: {
    flex: 1,
    minWidth: 0,
  },
  
  courseName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#065f46',
    display: 'block',
    marginBottom: '0.25rem',
  },
  
  courseInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  
  courseMatiere: {
    fontWeight: '500',
    color: '#059669',
  },
  
  courseNiveau: {
    color: '#6b7280',
  },
  
  courseHeures: {
    color: '#6b7280',
  },
  
  noCourses: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem',
    textAlign: 'center',
  },
  
  noCoursesText: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0,
  },
  
  documentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  
  documentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#fafafa',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  },
  
  documentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  documentName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
  },
  
  documentStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  documentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  documentMissing: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  missingText: {
    fontSize: '0.75rem',
    color: '#ef4444',
    fontWeight: '500',
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
  },
  
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  loadingText: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
  },
  
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
  },
  
  errorText: {
    fontSize: '1rem',
    color: '#ef4444',
    margin: 0,
  },
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: #e5e7eb !important;
  }
  
  .download-button:hover {
    background-color: #e5e7eb;
  }
  
  @media (max-width: 768px) {
    .profile-header {
      flex-direction: column;
      text-align: center;
    }
    
    .cards-grid {
      grid-template-columns: 1fr;
    }
    
    .badge-container {
      justify-content: center;
    }
    
    .document-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ProfileProfesseur;