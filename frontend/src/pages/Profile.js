import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Phone, 
  User, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  GraduationCap,
  MapPin,
  CreditCard,
  FileText,
  Award
} from 'lucide-react';
import Sidebar from '../components/sidebaretudiant';
import { useNavigate } from 'react-router-dom';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const ProfileEtudiant = () => {
  const [etudiant, setEtudiant] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (role !== 'etudiant' || !token) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://195.179.229.230:5000/api/etudiant/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Échec de chargement du profil');
        }

        const data = await res.json();
        setEtudiant(data);
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

  const formaterDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Construire le nom complet à partir de prenom et nomDeFamille
  const getNomComplet = (etudiant) => {
    return `${etudiant.prenom || ''} ${etudiant.nomDeFamille || ''}`.trim();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Chargement du profil...</p>
      </div>
    );
  }

  if (!etudiant) {
    return (
      <div style={styles.errorContainer}>
        <XCircle size={48} color="#ef4444" />
        <p style={styles.errorText}>Étudiant non trouvé</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />

      <div style={styles.header}>
        <div style={{ ...styles.headerContent, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ ...styles.headerTitle, textAlign: 'center', width: '100%' }}>Mon Profil</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Profile Card */}
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarContainer}>
              {etudiant.image ? (
                <img
                  src={`http://195.179.229.230:5000${etudiant.image}`}
                  alt="Profil"
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <User size={40} color="#6b7280" />
                </div>
              )}
              <div style={styles.statusBadge}>
                {etudiant.actif ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : (
                  <XCircle size={16} color="#ef4444" />
                )}
              </div>
            </div>
            <div style={styles.profileInfo}>
              <h2 style={styles.profileName}>{getNomComplet(etudiant)}</h2>
              <p style={styles.profileEmail}>{etudiant.email}</p>
              <div style={styles.statusContainer}>
                <span style={{
                  ...styles.statusText,
                  color: etudiant.actif ? '#10b981' : '#ef4444'
                }}>
                  {etudiant.actif ? 'Compte Actif' : 'Compte Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards */}
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
                  <span style={styles.infoValue}>{etudiant.telephone}</span>
                </div>
              </div>
              <div style={styles.infoItem}>
                <Calendar size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Date de naissance</span>
                  <span style={styles.infoValue}>
                    {formaterDate(etudiant.dateNaissance)} ({calculerAge(etudiant.dateNaissance)})
                  </span>
                </div>
              </div>
              {etudiant.genre && (
                <div style={styles.infoItem}>
                  <GraduationCap size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Genre</span>
                    <span style={styles.infoValue}>{etudiant.genre}</span>
                  </div>
                </div>
              )}
              {etudiant.cin && (
                <div style={styles.infoItem}>
                  <FileText size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>CIN</span>
                    <span style={styles.infoValue}>{etudiant.cin}</span>
                  </div>
                </div>
              )}
              {etudiant.lieuNaissance && (
                <div style={styles.infoItem}>
                  <MapPin size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Lieu de naissance</span>
                    <span style={styles.infoValue}>{etudiant.lieuNaissance}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Academic Information */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <Award size={20} color="#7c3aed" />
              <h3 style={styles.cardTitle}>Informations Académiques</h3>
            </div>
            <div style={styles.cardContent}>
              {etudiant.niveau && (
                <div style={styles.infoItem}>
                  <GraduationCap size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Niveau</span>
                    <span style={styles.infoValue}>{etudiant.niveau}</span>
                  </div>
                </div>
              )}
              {etudiant.filiere && (
                <div style={styles.infoItem}>
                  <BookOpen size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Filière</span>
                    <span style={styles.infoValue}>{etudiant.filiere}</span>
                  </div>
                </div>
              )}
              {etudiant.specialite && (
                <div style={styles.infoItem}>
                  <Award size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Spécialité</span>
                    <span style={styles.infoValue}>{etudiant.specialite}</span>
                  </div>
                </div>
              )}
              {etudiant.codeEtudiant && (
                <div style={styles.infoItem}>
                  <FileText size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Code Étudiant</span>
                    <span style={styles.infoValue}>{etudiant.codeEtudiant}</span>
                  </div>
                </div>
              )}
              {/* NOUVEAU : Année scolaire */}
              {etudiant.anneeScolaire && (
                <div style={styles.infoItem}>
                  <Calendar size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Année scolaire</span>
                    <span style={styles.infoValue}>{etudiant.anneeScolaire}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          {(etudiant.prixTotal || etudiant.pourcentageBourse || etudiant.typePaiement) && (
            <div style={styles.infoCard}>
              <div style={styles.cardHeader}>
                <CreditCard size={20} color="#059669" />
                <h3 style={styles.cardTitle}>Informations Financières</h3>
              </div>
              <div style={styles.cardContent}>
                {etudiant.prixTotal && (
                  <div style={styles.infoItem}>
                    <CreditCard size={18} color="#6b7280" />
                    <div style={styles.infoDetails}>
                      <span style={styles.infoLabel}>Prix Total</span>
                      <span style={styles.infoValue}>{etudiant.prixTotal} DH</span>
                    </div>
                  </div>
                )}
                {etudiant.pourcentageBourse && (
                  <div style={styles.infoItem}>
                    <Award size={18} color="#6b7280" />
                    <div style={styles.infoDetails}>
                      <span style={styles.infoLabel}>Pourcentage Bourse</span>
                      <span style={styles.infoValue}>{etudiant.pourcentageBourse}%</span>
                    </div>
                  </div>
                )}
                {etudiant.typePaiement && (
                  <div style={styles.infoItem}>
                    <CreditCard size={18} color="#6b7280" />
                    <div style={styles.infoDetails}>
                      <span style={styles.infoLabel}>Type de Paiement</span>
                      <span style={styles.infoValue}>{etudiant.typePaiement}</span>
                    </div>
                  </div>
                )}
                <div style={styles.infoItem}>
                  <CheckCircle size={18} color={etudiant.paye ? "#10b981" : "#ef4444"} />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Statut Paiement</span>
                    <span style={{...styles.infoValue, color: etudiant.paye ? '#10b981' : '#ef4444'}}>
                      {etudiant.paye ? 'Payé' : 'Non Payé'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Courses Information */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <BookOpen size={20} color="#059669" />
              <h3 style={styles.cardTitle}>Mes classe</h3>
            </div>
            <div style={styles.cardContent}>
              {etudiant.cours && etudiant.cours.length > 0 ? (
                <div style={styles.coursesList}>
                  {etudiant.cours.map((cours, index) => (
                    <div key={index} style={styles.courseItem}>
                      <div style={styles.courseIcon}>
                        <BookOpen size={16} color="#059669" />
                      </div>
                      <span style={styles.courseName}>{cours}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.noCourses}>
                  <BookOpen size={32} color="#d1d5db" />
                  <p style={styles.noCoursesText}>Aucun cours inscrit</p>
                </div>
              )}
            </div>
          </div>
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
    margin: '0 0 0.5rem 0',
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
    alignItems: 'center',
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
  },
  
  courseName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#065f46',
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
  }
  
  @media (max-width: 768px) {
    .profile-header {
      flex-direction: column;
      text-align: center;
    }
    
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(styleSheet);

// Export par défaut pour résoudre l'erreur d'import
export default ProfileEtudiant;