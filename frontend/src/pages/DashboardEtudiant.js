import React, { useEffect, useState } from 'react';
import { 
  User, Calendar, XCircle, CheckCircle, CreditCard,
  UserCheck, AlertTriangle, GraduationCap, TrendingUp,
  BookOpen, Clock, Award, Mail, Phone, UserCircle,
  Target, Activity, Star, CheckSquare, FileText,
  Database, Wifi, DollarSign, Users, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebaretudiant from '../components/sidebaretudiant';
import Headeretudiant from '../components/Headeretudiant';
import ModalPaiementExpire from '../components/ModalPaiementExpire';

import './AdminDashboard.css';

const DashboardEtudiant = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'etudiant') {
      navigate('/'); // Redirection si pas étudiant
    }
  }, [navigate]);

  const [etudiant, setEtudiant] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalPresences: 0,
    totalAbsences: 0,
    totalPaiements: 0,
    paiementsExpires: 0,
    coursInscrits: 0,
    tauxPresence: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token manquant - veuillez vous reconnecter');
        setLoading(false);
        return;
      }

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('🔄 Début de récupération des données étudiant...');

      // Récupération parallèle des données
      const [profileRes, presencesRes, absencesRes, paiementsRes] = await Promise.all([
        fetch('http://195.179.229.230:5000/api/etudiant/profile', { headers }),
        fetch('http://195.179.229.230:5000/api/etudiant/presences', { headers }),
        fetch('http://195.179.229.230:5000/api/etudiant/absences', { headers }),
        fetch('http://195.179.229.230:5000/api/etudiant/paiements', { headers })
      ]);

      // Vérification des statuts de réponse
      if (!profileRes.ok) throw new Error(`Erreur profil: ${profileRes.status}`);
      if (!presencesRes.ok) throw new Error(`Erreur présences: ${presencesRes.status}`);
      if (!absencesRes.ok) throw new Error(`Erreur absences: ${absencesRes.status}`);
      if (!paiementsRes.ok) throw new Error(`Erreur paiements: ${paiementsRes.status}`);

      // Conversion en JSON
      const etudiantData = await profileRes.json();
      const presences = await presencesRes.json();
      const absences = await absencesRes.json();
      const paiements = await paiementsRes.json();

      console.log('📊 Données étudiant récupérées:', {
        etudiant: etudiantData,
        presences: presences.length,
        absences: absences.length,
        paiements: paiements.length
      });

      setEtudiant(etudiantData);
      
      // Vérifier si le modal a déjà été affiché pour cet utilisateur
      const modalShown = localStorage.getItem('welcomeModalShownStudent');
      if (!modalShown) {
        setShowWelcomeModal(true);
      }
      
      // Validation des données
      const presencesValid = Array.isArray(presences) ? presences : [];
      const absencesValid = Array.isArray(absences) ? absences : [];
      const paiementsValid = Array.isArray(paiements) ? paiements : [];

      // Calcul du taux de présence
      const totalSeances = presencesValid.length + absencesValid.length;
      const tauxPresence = totalSeances > 0 ? Math.round((presencesValid.length / totalSeances) * 100) : 0;

      // Recherche des paiements expirés
      const today = new Date();
      const paiementsExpires = paiementsValid.filter(p => {
        if (!p.moisFin) return false;
        const dateFin = new Date(p.moisFin);
        return dateFin < today;
      });

      // Nombre de cours inscrits
      const coursInscrits = Array.isArray(etudiantData.cours) ? etudiantData.cours.length : 0;

      const dashboardStats = {
        totalPresences: presencesValid.length,
        totalAbsences: absencesValid.length,
        totalPaiements: paiementsValid.length,
        paiementsExpires: paiementsExpires.length,
        coursInscrits,
        tauxPresence
      };

      setDashboardData(dashboardStats);
      console.log('📈 Statistiques étudiant calculées:', dashboardStats);
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données:', error);
      setError(`Erreur de connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('welcomeModalShownStudent'); // Réinitialiser le modal pour la prochaine connexion
    window.location.href = '/';
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    // Marquer que le modal a été affiché pour ne plus le montrer
    localStorage.setItem('welcomeModalShownStudent', 'true');
  };

  // Modal de bienvenue
  const WelcomeModal = () => {
    if (!showWelcomeModal || !etudiant) return null;

    const currentDate = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '90%',
          position: 'relative',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
        }}>
          <button
            onClick={closeWelcomeModal}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '5px'
            }}
          >
            <X size={20} />
          </button>
          
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            🎓
          </div>
          
          <h2 style={{
            color: '#1f2937',
            marginBottom: '15px',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Bonjour {etudiant.nomComplet || 'Étudiant'} !
          </h2>
          
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            marginBottom: '10px'
          }}>
            {currentDate}
          </p>
          
          <div style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 25px',
            borderRadius: '25px',
            display: 'inline-block',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '25px'
          }}>
            Connexion réussie
          </div>
          
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
            marginBottom: '25px'
          }}>
            Bienvenue sur votre espace étudiant
          </p>
          
          <button
            onClick={closeWelcomeModal}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Commencer
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement de votre tableau de bord...</p>
          <p className="loading-subtext">Récupération de vos données personnelles</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">        
        <div className="error-content">
          <AlertTriangle className="error-icon" />
          <h2 className="error-title">Erreur de Connexion</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              onClick={fetchDashboardData}
              className="error-btn primary"
            >
              Réessayer
            </button>
            <button 
              onClick={handleLogout}
              className="error-btn secondary"
            >
              Se reconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, colorClass, trend, subtitle }) => (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value || 0}</p>
          {subtitle && (
            <p className="stat-card-subtitle">{subtitle}</p>
          )}
          {trend && (
            <p className="stat-card-trend">
              <TrendingUp />
              {trend}
            </p>
          )}
        </div>
        <div className="stat-card-icon">
          <Icon />
        </div>
      </div>
    </div>
  );

  // Fonction pour obtenir l'icône de statut d'assiduité
  const getAssiduitéIcon = (taux) => {
    if (taux >= 80) return <Award className="inline-icon" />;
    if (taux >= 60) return <CheckCircle className="inline-icon" />;
    if (taux >= 40) return <AlertTriangle className="inline-icon" />;
    return <XCircle className="inline-icon" />;
  };

  // Fonction pour obtenir l'icône d'engagement
  const getEngagementIcon = (coursCount) => {
    if (coursCount >= 3) return <Star className="inline-icon" />;
    if (coursCount >= 2) return <CheckSquare className="inline-icon" />;
    if (coursCount >= 1) return <BookOpen className="inline-icon" />;
    return <Clock className="inline-icon" />;
  };

  // Fonction pour obtenir l'icône de statut paiement
  const getPaymentStatusIcon = (expired) => {
    return expired === 0 ? <CheckCircle className="inline-icon" /> : <AlertTriangle className="inline-icon" />;
  };

  return (
    <div className="admin-dashboard" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
        }}>
      {/* Header */}
      <Headeretudiant />
      
      {/* Modal de bienvenue */}
      <WelcomeModal />
      
      <ModalPaiementExpire />

      <Sidebaretudiant onLogout={handleLogout} />

      <div className="dashboard-container">
        <div className="dashboard-content">
          {/* Informations personnelles */}
          {etudiant && (
            <div className="summary-card" style={{ marginBottom: '2rem' }}>
              <h3 className="summary-header">
                <UserCircle className="inline-icon" style={{ marginRight: '8px' }} />
                Bonjour {etudiant.nomComplet}
              </h3>
              <div className="summary-grid">
                <div className="summary-item blue">
                  <p className="summary-item-label">
                    <Mail className="inline-icon" style={{ marginRight: '4px' }} />
                    Email
                  </p>
                  <p className="summary-item-value" style={{ fontSize: '1rem' }}>
                    {etudiant.email}
                  </p>
                </div>
                <div className="summary-item green">
                  <p className="summary-item-label">
                    <Phone className="inline-icon" style={{ marginRight: '4px' }} />
                    Téléphone
                  </p>
                  <p className="summary-item-value" style={{ fontSize: '1rem' }}>
                    {etudiant.telephone}
                  </p>
                </div>
                <div className="summary-item purple">
                  <p className="summary-item-label">
                    <Activity className="inline-icon" style={{ marginRight: '4px' }} />
                    Statut
                  </p>
                  <p className="summary-item-value" style={{ fontSize: '1rem' }}>
                    {etudiant.actif ? (
                      <>
                        <CheckCircle className="inline-icon" style={{ marginRight: '4px' }} />
                        Actif
                      </>
                    ) : (
                      <>
                        <XCircle className="inline-icon" style={{ marginRight: '4px' }} />
                        Inactif
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cartes de statistiques principales */}
          <div className="stats-grid">
            <StatCard
              title="Présences"
              value={dashboardData.totalPresences}
              icon={CheckCircle}
              colorClass="green"
              subtitle="Séances assistées"
            />
            <StatCard
              title="Absences"
              value={dashboardData.totalAbsences}
              icon={XCircle}
              colorClass="red"
              subtitle="Séances manquées"
            />
            <StatCard
              title="classe Inscrits"
              value={dashboardData.coursInscrits}
              icon={GraduationCap}
              colorClass="blue"
              subtitle="Formations suivies"
            />
            <StatCard
              title="Paiements"
              value={dashboardData.totalPaiements}
              icon={CreditCard}
              colorClass="yellow"
              subtitle="Total effectués"
            />
          </div>

          {/* Section d'alertes pour paiements expirés */}
          {dashboardData.paiementsExpires > 0 && (
            <div className="alert-section">
              <div className="alert-content">
                <AlertTriangle />
                <div className="alert-text">
                  <h3>
                    <AlertTriangle className="inline-icon" style={{ marginRight: '8px' }} />
                    Paiements Expirés
                  </h3>
                  <p>
                    Vous avez <strong>{dashboardData.paiementsExpires}</strong> paiement(s) expiré(s).
                    Veuillez contacter l'administration pour renouveler vos cotisations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Résumé de performance */}
          <div className="summary-card">
            <h3 className="summary-header">
              <Target className="inline-icon" style={{ marginRight: '8px' }} />
              Votre Performance
            </h3>
            <div className="summary-grid">
              <div className="summary-item blue">
                <p className="summary-item-label">
                  <TrendingUp className="inline-icon" style={{ marginRight: '4px' }} />
                  Assiduité
                </p>
                <p className="summary-item-value">
                  {getAssiduitéIcon(dashboardData.tauxPresence)}
                  <span style={{ marginLeft: '4px' }}>
                    {dashboardData.tauxPresence >= 80 ? 'Excellent' : 
                     dashboardData.tauxPresence >= 60 ? 'Bien' : 
                     dashboardData.tauxPresence >= 40 ? 'À améliorer' : 'Insuffisant'}
                  </span>
                </p>
                <p className="summary-item-detail">
                  {dashboardData.totalPresences} présences / {dashboardData.totalPresences + dashboardData.totalAbsences} séances
                </p>
              </div>
              <div className="summary-item green">
                <p className="summary-item-label">
                  <Users className="inline-icon" style={{ marginRight: '4px' }} />
                  Engagement
                </p>
                <p className="summary-item-value">
                  {getEngagementIcon(dashboardData.coursInscrits)}
                  <span style={{ marginLeft: '4px' }}>
                    {dashboardData.coursInscrits >= 3 ? 'Très actif' : 
                     dashboardData.coursInscrits >= 2 ? 'Actif' : 
                     dashboardData.coursInscrits >= 1 ? 'En formation' : 'Débutant'}
                  </span>
                </p>
                <p className="summary-item-detail">
                  {dashboardData.coursInscrits} cours suivis
                </p>
              </div>
              <div className="summary-item purple">
                <p className="summary-item-label">
                  <DollarSign className="inline-icon" style={{ marginRight: '4px' }} />
                  Statut Paiements
                </p>
                <p className="summary-item-value">
                  {getPaymentStatusIcon(dashboardData.paiementsExpires)}
                  <span style={{ marginLeft: '4px' }}>
                    {dashboardData.paiementsExpires === 0 ? 'À jour' : 'Action requise'}
                  </span>
                </p>
                <p className="summary-item-detail">
                  {dashboardData.totalPaiements} paiements effectués
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEtudiant;