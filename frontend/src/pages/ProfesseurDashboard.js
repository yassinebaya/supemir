import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, BookOpen, Calendar, UserX, TrendingUp, Award, Clock, Activity, AlertTriangle, User, X } from 'lucide-react';
import './AdminDashboard.css'; // ✅ Utilisation du même fichier CSS
import SidebarProf from '../components/SidebarProf';
import { useNavigate } from 'react-router-dom';
import HeaderProf from '../components/Headerprof';

const ProfesseurDashboard = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [cours, setCours] = useState([]);
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [professeur, setProfesseur] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Fonction pour calculer la tendance de présence par jour
  const calculerTendancePresence = () => {
    const derniersSeptJours = [];
    const aujourdhui = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(aujourdhui);
      date.setDate(date.getDate() - i);
      
      const presencesDuJour = presences.filter(p => {
        const datePresence = new Date(p.date || p.createdAt);
        return datePresence.toDateString() === date.toDateString();
      });
      
      const totalDuJour = presencesDuJour.length;
      const presentsDuJour = presencesDuJour.filter(p => p.present).length;
      const tauxDuJour = totalDuJour > 0 ? Math.round((presentsDuJour / totalDuJour) * 100) : 0;
      
      derniersSeptJours.push({
        jour: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        presence: tauxDuJour,
        date: date.toISOString().split('T')[0]
      });
    }
    
    return derniersSeptJours;
  };

  // Calculs des statistiques en temps réel
  const tendancePresence = calculerTendancePresence();
const navigate = useNavigate();

 useEffect(() => {
  const fetchInfos = async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // ✅ Vérification de l'authentification et du rôle
    if (!token || role !== 'prof') {
      navigate('/'); // redirection vers la page d'accueil
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resEt, resCours, resPre] = await Promise.all([
        fetch('http://195.179.229.230:5000/api/professeur/etudiants', { headers }),
        fetch('http://195.179.229.230:5000/api/professeur/mes-cours', { headers }),
        fetch('http://195.179.229.230:5000/api/professeur/presences', { headers })
      ]);

      if (resEt.ok) {
        const etudiantsData = await resEt.json();
        setEtudiants(etudiantsData);
      }
      if (resCours.ok) {
        const coursData = await resCours.json();
        setCours(coursData);
      }
      if (resPre.ok) {
        const presencesData = await resPre.json();
        setPresences(presencesData);
      }
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      setError(`Erreur de connexion: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  fetchInfos();
}, [navigate]);

useEffect(() => {
  const fetchProf = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/professeur/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setProfesseur(data);
        
        // Vérifier si le modal a déjà été affiché pour cet utilisateur
        const modalShown = localStorage.getItem('welcomeModalShown');
        if (!modalShown) {
          setShowWelcomeModal(true);
        }
      }
    } catch (err) {
      console.error("Erreur de chargement du professeur", err);
    }
  };

  fetchProf();
}, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('welcomeModalShown'); // Réinitialiser le modal pour la prochaine connexion
    window.location.href = '/';
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    // Marquer que le modal a été affiché pour ne plus le montrer
    localStorage.setItem('welcomeModalShown', 'true');
  };

  // Calculs des statistiques
  const totalCours = cours.length;
  const totalPresences = presences.length;
  const totalEtudiants = etudiants.length;
  const absents = presences.filter(p => !p.present).length;
  const presents = totalPresences - absents;
  const tauxPresenceGlobal = totalPresences > 0 ? Math.round((presents / totalPresences) * 100) : 0;

  // Données pour les graphiques
  const presenceData = [
    { name: 'Présents', value: presents, color: '#22c55e' },
    { name: 'Absents', value: absents, color: '#ef4444' }
  ];

  // Utiliser les vraies données de tendance ou des données de fallback
  const tendanceData = tendancePresence.length > 0 ? tendancePresence : Array.from({ length: 7 }, (_, i) => ({
    jour: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
    presence: Math.floor(Math.random() * 20) + 70
  }));

  const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value || 0}</p>
          {subtitle && (
            <p className="stat-card-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="stat-card-icon">
          <Icon />
        </div>
      </div>
    </div>
  );

  // Modal de bienvenue
  const WelcomeModal = () => {
    if (!showWelcomeModal || !professeur) return null;

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
            👋
          </div>
          
          <h2 style={{
            color: '#1f2937',
            marginBottom: '15px',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Bonjour {professeur.nom || professeur.prenom || 'Professeur'} !
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
            Bienvenue sur votre tableau de bord professeur
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
          <p className="loading-text">Chargement des données...</p>
          <p className="loading-subtext">Récupération des informations professeur</p>
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
              onClick={() => window.location.reload()}
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

  return (
    <div className="admin-dashboard"  style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
        }}> {/* ✅ Utilisation de la même classe principale */}
    <HeaderProf />

      {/* Modal de bienvenue */}
      <WelcomeModal />

      {/* Header */} <SidebarProf onLogout={handleLogout} /> {/* ✅ Utilisation du composant SidebarProfesseur */}
      <div className="dashboard-header">
        <div
          className="dashboard-header-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
      

          <div className="dashboard-title-section" style={{ textAlign: 'center' }}>
          </div>
        </div>
      </div>

      <div 
        className="dashboard-container"
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
        }}
      >
        <div className="dashboard-content">
          {/* Cartes de statistiques principales */}
          <div className="stats-grid">
            <StatCard
              title="Total Étudiants"
              value={totalEtudiants}
              icon={Users}
              colorClass="blue"
              subtitle="Sous ma responsabilité"
            />
            <StatCard
              title="Cours Actifs"
              value={totalCours}
              icon={BookOpen}
              colorClass="green"
              subtitle="En cours"
            />
            <StatCard
              title="Séances"
              value={totalPresences}
              icon={Calendar}
              colorClass="purple"
              subtitle="Enregistrées"
            />
            <StatCard
              title="Taux de Présence"
              value={`${tauxPresenceGlobal}%`}
              icon={Activity}
              colorClass="indigo"
              subtitle="Moyenne globale"
            />
          </div>

          {/* Graphique de présence */}
          <div className="chart-card">
            <div className="chart-header">
              <Activity />
              <h3>Répartition des Présences</h3>
            </div>
            {presenceData.some(p => p.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={presenceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {presenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <Activity />
                <div>
                  <h4>Aucune présence enregistrée</h4>
                  <p>Commencez à enregistrer les présences</p>
                </div>
              </div>
            )}
          </div>

          {/* Tendance de présence */}
          <div className="chart-card">
            <div className="chart-header">
              <TrendingUp />
              <h3>Tendance de Présence (7 derniers jours)</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="presence" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Résumé avec données réelles */}
          <div className="summary-card">
            <h3 className="summary-header">
              📊 Résumé en Temps Réel
            </h3>
            <div className="summary-grid">
              <div className="summary-item blue">
                <p className="summary-item-label">Étudiants par Cours</p>
                <p className="summary-item-value">
                  {totalCours ? Math.round(totalEtudiants / totalCours) : 0}
                </p>
                <p className="summary-item-detail">
                  {totalEtudiants} étudiants / {totalCours} cours
                </p>
              </div>
              <div className="summary-item green">
                <p className="summary-item-label">Présences Moyennes</p>
                <p className="summary-item-value">
                  {totalEtudiants ? Math.round(totalPresences / totalEtudiants) : 0}
                </p>
                <p className="summary-item-detail">
                  Par étudiant
                </p>
              </div>
              <div className="summary-item purple">
                <p className="summary-item-label">Taux de Réussite</p>
                <p className="summary-item-value">
                  {tauxPresenceGlobal}%
                </p>
                <p className="summary-item-detail">
                  Basé sur les présences
                </p>
              </div>
            </div>
          </div>

          {/* Informations de debug */}
          
        </div>
      </div>
    </div>
  );
};

export default ProfesseurDashboard;