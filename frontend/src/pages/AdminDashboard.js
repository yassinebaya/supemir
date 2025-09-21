import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { 
  Users, GraduationCap, Calendar, CreditCard, 
  UserCheck, UserX, TrendingUp, AlertTriangle 
} from 'lucide-react';
import './AdminDashboard.css';
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح
import RappelModal from '../components/RappelModal'; // adapte le chemin si besoin

import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
   const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/'); // أو navigate('/unauthorized')
    }
  }, [navigate]);
  
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalEtudiants: 0,
    etudiantsActifs: 0,
    etudiantsInactifs: 0,
    totalCours: 0,
    totalPaiements: 0,
    paiementsExpires: 0,
    totalEvenements: 0,
    presencesRecentes: 0,
    totalProfesseurs: 0 // ✅ حقل جديد
  });
  const [chartData, setChartData] = useState({
    coursStats: [],
    paiementsParMois: [],
    presenceStats: [],
    genreStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
const [rappelModal, setRappelModal] = useState(null);
const [editDate, setEditDate] = useState('');
const [editNote, setEditNote] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);
  useEffect(() => {
  const fetchRappels = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch('http://localhost:5000/api/rappels', { headers });
      if (!res.ok) throw new Error('Erreur lors du chargement des rappels');

      const data = await res.json();

      // ✅ تصفية التذكيرات حسب التاريخ الحالي
      const today = new Date();
      const rappelsAujourdhui = data.filter(r =>
        r.status === 'actif' &&
new Date(r.dateRappel).toDateString() <= today.toDateString()
      );

      console.log('📢 Rappels à afficher aujourd’hui:', rappelsAujourdhui);

      if (rappelsAujourdhui.length > 0) {
        setRappelModal(rappelsAujourdhui[0]);
        setEditDate(rappelsAujourdhui[0].dateRappel?.split('T')[0] || '');
        setEditNote(rappelsAujourdhui[0].note || '');
      }

    } catch (err) {
      console.error('❌ Erreur rappels:', err.message);
    }
  };

  fetchRappels();
}, []);

const handleUpdateRappel = async (id) => {
  const res = await fetch(`http://localhost:5000/api/rappels/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateRappel: editDate, note: editNote })
  });

  const updated = await res.json();
  setRappelModal(null);
  alert("تم التحديث بنجاح");
};

const handleDeleteRappel = async (id) => {
  const res = await fetch(`http://localhost:5000/api/rappels/${id}`, {
    method: 'DELETE'
  });

  if (res.ok) {
    setRappelModal(null);
    alert("تم الحذف بنجاح");
  }
};

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

      console.log('🔄 Début de récupération des données...');

      // Récupération parallèle des données - ✅ إضافة الأساتذة
      const [adminRes, etudiantsRes, coursRes, paiementsRes, evenementsRes, presencesRes, professeursRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/dashboard', { headers }),
        fetch('http://localhost:5000/api/etudiants', { headers }),
        fetch('http://localhost:5000/api/cours', { headers }),
        fetch('http://localhost:5000/api/paiements', { headers }),
        fetch('http://localhost:5000/api/evenements', { headers }),
        fetch('http://localhost:5000/api/presences', { headers }),
        fetch('http://localhost:5000/api/professeurs', { headers }) // ✅ جديد
      ]);

      // Vérification des statuts de réponse
      if (!adminRes.ok) throw new Error(`Erreur admin: ${adminRes.status}`);
      if (!etudiantsRes.ok) throw new Error(`Erreur étudiants: ${etudiantsRes.status}`);
      if (!coursRes.ok) throw new Error(`Erreur cours: ${coursRes.status}`);
      if (!paiementsRes.ok) throw new Error(`Erreur paiements: ${paiementsRes.status}`);
      if (!evenementsRes.ok) throw new Error(`Erreur événements: ${evenementsRes.status}`);
      if (!presencesRes.ok) throw new Error(`Erreur présences: ${presencesRes.status}`);
      if (!professeursRes.ok) throw new Error(`Erreur professeurs: ${professeursRes.status}`); // ✅ جديد

      // Conversion en JSON
      const adminData = await adminRes.json();
      const etudiants = await etudiantsRes.json();
      const cours = await coursRes.json();
      const paiements = await paiementsRes.json();
      const evenements = await evenementsRes.json();
      const presences = await presencesRes.json();
      const professeurs = await professeursRes.json(); // ✅ جديد

      console.log('📊 Données récupérées:', {
        admin: adminData,
        etudiants: etudiants.length,
        cours: cours.length,
        paiements: paiements.length,
        evenements: evenements.length,
        presences: presences.length,
        professeurs: professeurs.length // ✅ جديد
      });

      // Vérification de l'authentification
      if (adminData.message && adminData.message.includes('Token')) {
        setError('Session expirée - veuillez vous reconnecter');
        setLoading(false);
        return;
      }

      setAdmin(adminData.admin);
      
      // Validation des données
      const etudiantsValid = Array.isArray(etudiants) ? etudiants : [];
      const coursValid = Array.isArray(cours) ? cours : [];
      const paiementsValid = Array.isArray(paiements) ? paiements : [];
      const evenementsValid = Array.isArray(evenements) ? evenements : [];
      const presencesValid = Array.isArray(presences) ? presences : [];
      const professeursValid = Array.isArray(professeurs) ? professeurs : []; // ✅ جديد

      // Calcul des statistiques réelles
      const etudiantsActifs = etudiantsValid.filter(e => e.actif === true).length;
      const etudiantsInactifs = etudiantsValid.length - etudiantsActifs;

      // Récupération des paiements expirés
      let paiementsExpiresCount = 0;
      try {
        const paiementsExpRes = await fetch('http://localhost:5000/api/paiements/exp', { headers });
        if (paiementsExpRes.ok) {
          const paiementsExpires = await paiementsExpRes.json();
          paiementsExpiresCount = Array.isArray(paiementsExpires) ? paiementsExpires.length : 0;
        }
      } catch (err) {
        console.warn('⚠️ Impossible de récupérer les paiements expirés:', err);
      }

      const dashboardStats = {
        totalEtudiants: etudiantsValid.length,
        etudiantsActifs,
        etudiantsInactifs,
        totalCours: coursValid.length,
        totalPaiements: paiementsValid.length,
        paiementsExpires: paiementsExpiresCount,
        totalEvenements: evenementsValid.length,
        presencesRecentes: presencesValid.length,
        totalProfesseurs: professeursValid.length // ✅ جديد
      };

      setDashboardData(dashboardStats);
      console.log('📈 Statistiques calculées:', dashboardStats);

      // Préparation des données pour les graphiques
      prepareChartData(etudiantsValid, coursValid, paiementsValid, presencesValid);
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données:', error);
      setError(`Erreur de connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (etudiants, cours, paiements, presences) => {
    console.log('🎨 Préparation des graphiques...');

    // 1. Statistiques par cours (étudiants inscrits)
    const coursStats = cours.map(c => {
      const etudiantsInscrit = etudiants.filter(e => 
        Array.isArray(e.cours) && e.cours.includes(c.nom)
      ).length;
      
      return {
        nom: c.nom.length > 15 ? c.nom.substring(0, 15) + '...' : c.nom,
        nomComplet: c.nom,
        etudiants: etudiantsInscrit
      };
    }).filter(c => c.etudiants > 0);

    // 2. Statistiques par genre
    const hommes = etudiants.filter(e => e.genre === 'Homme').length;
    const femmes = etudiants.filter(e => e.genre === 'Femme').length;
    const genreStats = [
      { name: 'Hommes', value: hommes },
      { name: 'Femmes', value: femmes }
    ].filter(g => g.value > 0);

    // 3. Paiements par mois (derniers 6 mois)
    const paiementsParMois = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const moisNom = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      
      const count = paiements.filter(p => {
        if (!p.moisDebut) return false;
        const paiementDate = new Date(p.moisDebut);
        return paiementDate.getMonth() === date.getMonth() && 
               paiementDate.getFullYear() === date.getFullYear();
      }).length;
      
      paiementsParMois.push({ mois: moisNom, paiements: count });
    }

    // 4. Statistiques de présence
    const presents = presences.filter(p => p.present === true).length;
    const absents = presences.filter(p => p.present === false).length;
    
    const presenceStats = [
      { name: 'Présents', value: presents, color: '#10B981' },
      { name: 'Absents', value: absents, color: '#EF4444' }
    ].filter(p => p.value > 0);

    const chartDataResult = {
      coursStats,
      paiementsParMois,
      presenceStats,
      genreStats
    };

    console.log('📊 Données graphiques préparées:', chartDataResult);
    setChartData(chartDataResult);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement des données réelles...</p>
          <p className="loading-subtext">Récupération depuis la base de données</p>
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="admin-dashboard"style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
        }}>
      {/* Header */}
      <Sidebar onLogout={handleLogout} />
      <Header />
{rappelModal && (
  <RappelModal
    rappel={rappelModal}
    onClose={() => setRappelModal(null)}
    onUpdate={() => handleUpdateRappel(rappelModal._id)}
    onDelete={() => handleDeleteRappel(rappelModal._id)}
    editDate={editDate}
    setEditDate={setEditDate}
    editNote={editNote}
    setEditNote={setEditNote}
  />
)}

      <div className="dashboard-container">
        <div className="dashboard-content">
          {/* Cartes de statistiques principales */}
          <div className="stats-grid">
            <StatCard
              title="Total Étudiants"
              value={dashboardData.totalEtudiants}
              icon={Users}
              colorClass="blue"
              subtitle="Inscrits dans la base"
            />
            <StatCard
              title="Étudiants Actifs"
              value={dashboardData.etudiantsActifs}
              icon={UserCheck}
              colorClass="green"
              subtitle="En cours de formation"
            />
            <StatCard
              title="Total classes"
              value={dashboardData.totalCours}
              icon={GraduationCap}
              colorClass="purple"
              subtitle="Disponibles"
            />
            <StatCard
              title="Paiements Expirés"
              value={dashboardData.paiementsExpires}
              icon={AlertTriangle}
              colorClass="red"
              subtitle="Nécessitent suivi"
            />
          </div>

          {/* Cartes de statistiques secondaires */}
          <div className="stats-grid">
            <StatCard
              title="Total Paiements"
              value={dashboardData.totalPaiements}
              icon={CreditCard}
              colorClass="yellow"
              subtitle="Enregistrés en DB"
            />
            <StatCard
              title="Événements"
              value={dashboardData.totalEvenements}
              icon={Calendar}
              colorClass="indigo"
              subtitle="Planifiés"
            />
            <StatCard
              title="Étudiants Inactifs"
              value={dashboardData.etudiantsInactifs}
              icon={UserX}
              colorClass="gray"
              subtitle="Suspendus"
            />
            {/* ✅ البطاقة الجديدة - Total Professeurs */}
            <StatCard
              title="Total Professeurs"
              value={dashboardData.totalProfesseurs}
              icon={Users}
              colorClass="orange"
              subtitle="Enseignants enregistrés"
            />
          </div>

          {/* Graphiques principaux */}
          <div className="charts-grid">
            {/* Graphique des étudiants par cours */}
            <div className="chart-card">
              <div className="chart-header">
                <GraduationCap />
                <h3>Étudiants par Classe (Données Réelles)</h3>
              </div>
              {chartData.coursStats && chartData.coursStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.coursStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="nom" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value, 'Étudiants inscrits']}
                      labelFormatter={(label) => {
                        const cours = chartData.coursStats.find(c => c.nom === label);
                        return cours ? cours.nomComplet : label;
                      }}
                    />
                    <Bar dataKey="etudiants" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <GraduationCap />
                  <div>
                    <h4>Aucune classe avec étudiants inscrits</h4>
                    <p>Ajoutez des classes et des étudiants</p>
                  </div>
                </div>
              )}
            </div>

            {/* Graphique des paiements par mois */}
            <div className="chart-card">
              <div className="chart-header">
                <TrendingUp />
                <h3>Évolution Paiements (6 derniers mois)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.paiementsParMois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Paiements']} />
                  <Line 
                    type="monotone" 
                    dataKey="paiements" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphiques circulaires */}
          <div className="pie-charts-grid">
            {/* Répartition par genre */}
            <div className="chart-card">
              <div className="chart-header">
                <Users />
                <h3>Répartition par Genre</h3>
              </div>
              {chartData.genreStats && chartData.genreStats.length > 0 && chartData.genreStats.some(stat => stat.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.genreStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.genreStats.map((entry, index) => (
                        <Cell key={`cell-gender-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <Users />
                  <div>
                    <h4>Aucun étudiant enregistré</h4>
                    <p>Ajoutez des étudiants pour voir les statistiques</p>
                  </div>
                </div>
              )}
            </div>

            {/* Statistiques de présence */}
            <div className="chart-card">
              <div className="chart-header">
                <UserCheck />
                <h3>Statistiques de Présence</h3>
              </div>
              {chartData.presenceStats && chartData.presenceStats.length > 0 && chartData.presenceStats.some(stat => stat.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.presenceStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.presenceStats.map((entry, index) => (
                        <Cell key={`cell-presence-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <UserCheck />
                  <div>
                    <h4>Aucun enregistrement de présence</h4>
                    <p>Commencez à enregistrer les présences</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section d'alertes */}
          {dashboardData.paiementsExpires > 0 && (
            <div className="alert-section">
              <div className="alert-content">
                <AlertTriangle />
                <div className="alert-text">
                  <h3>⚠️ Paiements Expirés Détectés</h3>
                  <p>
                    <strong>{dashboardData.paiementsExpires}</strong> étudiant(s) ont des paiements expirés dans votre base de données.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Résumé avec données réelles */}
          <div className="summary-card">
            <h3 className="summary-header">
              📊 Résumé en Temps Réel
            </h3>
            <div className="summary-grid">
              <div className="summary-item blue">
                <p className="summary-item-label">Taux d'Activité</p>
                <p className="summary-item-value">
                  {dashboardData.totalEtudiants ? Math.round((dashboardData.etudiantsActifs / dashboardData.totalEtudiants) * 100) : 0}%
                </p>
                <p className="summary-item-detail">
                  {dashboardData.etudiantsActifs}/{dashboardData.totalEtudiants} étudiants actifs
                </p>
              </div>
              <div className="summary-item green">
                <p className="summary-item-label">Moyenne Étudiants/Classes</p>
                <p className="summary-item-value">
                  {dashboardData.totalCours ? Math.round(dashboardData.totalEtudiants / dashboardData.totalCours) : 0}
                </p>
                <p className="summary-item-detail">
                  {dashboardData.totalEtudiants} étudiants / {dashboardData.totalCours} classe
                </p>
              </div>
              <div className="summary-item purple">
                <p className="summary-item-label">Ratio Profs/Étudiants</p>
                <p className="summary-item-value">
                  {dashboardData.totalProfesseurs ? Math.round(dashboardData.totalEtudiants / dashboardData.totalProfesseurs) : 0}
                </p>
                <p className="summary-item-detail">
                  {dashboardData.totalEtudiants} étudiants / {dashboardData.totalProfesseurs} professeurs
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

export default AdminDashboard;