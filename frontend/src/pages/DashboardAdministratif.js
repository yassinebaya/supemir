import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { 
  Users, GraduationCap, Calendar, CreditCard, 
  UserCheck, UserX, TrendingUp, AlertTriangle 
} from 'lucide-react';
import Sidebar from '../components/sidberadmin';

const handleLogout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
  }
  window.location.href = '/';
};
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalEtudiants: 0,
    etudiantsActifs: 0,
    etudiantsInactifs: 0,
    totalCours: 0,
    totalPaiements: 0,
    paiementsExpires: 0,
    totalEvenements: 0,
    presencesRecentes: 0,
    totalProfesseurs: 0
  });
  
  const [chartData, setChartData] = useState({
    coursStats: [],
    paiementsParMois: [],
    presenceStats: [],
    genreStats: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      // Récupération parallèle des données
      const [etudiantsRes, coursRes, paiementsRes, evenementsRes, presencesRes, professeursRes] = await Promise.all([
        fetch('http://195.179.229.230:5000/api/etudiants', { headers }),
        fetch('http://195.179.229.230:5000/api/cours', { headers }),
        fetch('http://195.179.229.230:5000/api/paiements', { headers }),
        fetch('http://195.179.229.230:5000/api/evenements', { headers }),
        fetch('http://195.179.229.230:5000/api/presences', { headers }),
        fetch('http://195.179.229.230:5000/api/professeurs', { headers })
      ]);

      // Vérification des statuts
      if (!etudiantsRes.ok) throw new Error(`Erreur étudiants: ${etudiantsRes.status}`);
      if (!coursRes.ok) throw new Error(`Erreur cours: ${coursRes.status}`);
      if (!paiementsRes.ok) throw new Error(`Erreur paiements: ${paiementsRes.status}`);
      if (!evenementsRes.ok) throw new Error(`Erreur événements: ${evenementsRes.status}`);
      if (!presencesRes.ok) throw new Error(`Erreur présences: ${presencesRes.status}`);
      if (!professeursRes.ok) throw new Error(`Erreur professeurs: ${professeursRes.status}`);

      // Conversion en JSON
      const etudiants = await etudiantsRes.json();
      const cours = await coursRes.json();
      const paiements = await paiementsRes.json();
      const evenements = await evenementsRes.json();
      const presences = await presencesRes.json();
      const professeurs = await professeursRes.json();

      // Validation des données
      const etudiantsValid = Array.isArray(etudiants) ? etudiants : [];
      const coursValid = Array.isArray(cours) ? cours : [];
      const paiementsValid = Array.isArray(paiements) ? paiements : [];
      const evenementsValid = Array.isArray(evenements) ? evenements : [];
      const presencesValid = Array.isArray(presences) ? presences : [];
      const professeursValid = Array.isArray(professeurs) ? professeurs : [];

      // Calcul des statistiques
      const etudiantsActifs = etudiantsValid.filter(e => e.actif === true).length;
      const etudiantsInactifs = etudiantsValid.length - etudiantsActifs;

      // Paiements expirés
      let paiementsExpiresCount = 0;
      try {
        const paiementsExpRes = await fetch('http://195.179.229.230:5000/api/paiements/exp', { headers });
        if (paiementsExpRes.ok) {
          const paiementsExpires = await paiementsExpRes.json();
          paiementsExpiresCount = Array.isArray(paiementsExpires) ? paiementsExpires.length : 0;
        }
      } catch (err) {
        console.warn('Impossible de récupérer les paiements expirés:', err);
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
        totalProfesseurs: professeursValid.length
      };

      setDashboardData(dashboardStats);
      prepareChartData(etudiantsValid, coursValid, paiementsValid, presencesValid);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      setError(`Erreur de connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (etudiants, cours, paiements, presences) => {
    // Statistiques par cours
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

    // Statistiques par genre
    const hommes = etudiants.filter(e => e.genre === 'Homme').length;
    const femmes = etudiants.filter(e => e.genre === 'Femme').length;
    const genreStats = [
      { name: 'Hommes', value: hommes },
      { name: 'Femmes', value: femmes }
    ].filter(g => g.value > 0);

    // Paiements par mois
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

    // Statistiques de présence
    const presents = presences.filter(p => p.present === true).length;
    const absents = presences.filter(p => p.present === false).length;
    
    const presenceStats = [
      { name: 'Présents', value: presents, color: '#10B981' },
      { name: 'Absents', value: absents, color: '#EF4444' }
    ].filter(p => p.value > 0);

    setChartData({
      coursStats,
      paiementsParMois,
      presenceStats,
      genreStats
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle style={{ 
            height: '48px', 
            width: '48px', 
            color: '#ef4444', 
            margin: '0 auto 16px' 
          }} />
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '8px' 
          }}>
            Erreur de Connexion
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>{error}</p>
          <button 
            onClick={fetchDashboardData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, bgColor, textColor, subtitle }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '24px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: '0' }}>{title}</p>
          <p style={{ 
            color: textColor, 
            fontSize: '30px', 
            fontWeight: 'bold', 
            margin: '4px 0 0 0' 
          }}>
            {value || 0}
          </p>
          {subtitle && (
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>{subtitle}</p>
          )}
        </div>
        <div style={{
          padding: '12px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6'
        }}>
          <Icon style={{ height: '32px', width: '32px', color: '#6b7280' }} />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, icon: Icon, iconColor, children, isEmpty, emptyIcon: EmptyIcon, emptyText }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Icon style={{ height: '24px', width: '24px', color: iconColor, marginRight: '8px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0' }}>{title}</h3>
      </div>
      {isEmpty ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '256px',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center' }}>
            <EmptyIcon style={{ height: '48px', width: '48px', margin: '0 auto 8px', color: '#9ca3af' }} />
            <p style={{ margin: '0' }}>{emptyText}</p>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
          }
          .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 24px;
          }
          @media (max-width: 768px) {
            .charts-grid {
              grid-template-columns: 1fr;
            }
            .stats-grid {
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }
          }
        `}
      </style>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* En-tête */}      <Sidebar onLogout={handleLogout} />

        
          {/* Cartes de statistiques principales */}
          <div className="stats-grid">
            <StatCard
              title="Total Étudiants"
              value={dashboardData.totalEtudiants}
              icon={Users}
              textColor="#2563eb"
              subtitle="Inscrits dans la base"
            />
            <StatCard
              title="Étudiants Actifs"
              value={dashboardData.etudiantsActifs}
              icon={UserCheck}
              textColor="#059669"
              subtitle="En cours de formation"
            />
            <StatCard
              title="Total Classes"
              value={dashboardData.totalCours}
              icon={GraduationCap}
              textColor="#7c3aed"
              subtitle="Disponibles"
            />
            <StatCard
              title="Paiements Expirés"
              value={dashboardData.paiementsExpires}
              icon={AlertTriangle}
              textColor="#dc2626"
              subtitle="Nécessitent suivi"
            />
          </div>

          {/* Cartes de statistiques secondaires */}
          <div className="stats-grid">
            <StatCard
              title="Total Paiements"
              value={dashboardData.totalPaiements}
              icon={CreditCard}
              textColor="#d97706"
              subtitle="Enregistrés"
            />
            <StatCard
              title="Événements"
              value={dashboardData.totalEvenements}
              icon={Calendar}
              textColor="#4f46e5"
              subtitle="Planifiés"
            />
            <StatCard
              title="Étudiants Inactifs"
              value={dashboardData.etudiantsInactifs}
              icon={UserX}
              textColor="#6b7280"
              subtitle="Suspendus"
            />
            <StatCard
              title="Total Professeurs"
              value={dashboardData.totalProfesseurs}
              icon={Users}
              textColor="#ea580c"
              subtitle="Enseignants"
            />
          </div>

          {/* Graphiques principaux */}
          <div className="charts-grid">
            <ChartCard
              title="Étudiants par Classe"
              icon={GraduationCap}
              iconColor="#2563eb"
              isEmpty={!chartData.coursStats || chartData.coursStats.length === 0}
              emptyIcon={GraduationCap}
              emptyText="Aucune classe avec étudiants"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.coursStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nom" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Étudiants inscrits']}
                    labelFormatter={(label) => {
                      const cours = chartData.coursStats.find(c => c.nom === label);
                      return cours ? cours.nomComplet : label;
                    }}
                  />
                  <Bar dataKey="etudiants" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Évolution Paiements"
              icon={TrendingUp}
              iconColor="#059669"
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.paiementsParMois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => [value, 'Paiements']} />
                  <Line 
                    type="monotone" 
                    dataKey="paiements" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Graphiques circulaires */}
          <div className="charts-grid">
            <ChartCard
              title="Répartition par Genre"
              icon={Users}
              iconColor="#7c3aed"
              isEmpty={!chartData.genreStats || chartData.genreStats.length === 0 || !chartData.genreStats.some(stat => stat.value > 0)}
              emptyIcon={Users}
              emptyText="Aucun étudiant enregistré"
            >
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
            </ChartCard>

            <ChartCard
              title="Statistiques de Présence"
              icon={UserCheck}
              iconColor="#059669"
              isEmpty={!chartData.presenceStats || chartData.presenceStats.length === 0 || !chartData.presenceStats.some(stat => stat.value > 0)}
              emptyIcon={UserCheck}
              emptyText="Aucun enregistrement de présence"
            >
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
            </ChartCard>
          </div>

          {/* Alerte paiements expirés */}
          {dashboardData.paiementsExpires > 0 && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AlertTriangle style={{ height: '24px', width: '24px', color: '#dc2626', marginRight: '12px' }} />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#991b1b', margin: '0 0 4px 0' }}>
                    ⚠️ Paiements Expirés Détectés
                  </h3>
                  <p style={{ color: '#b91c1c', margin: '0' }}>
                    <strong>{dashboardData.paiementsExpires}</strong> étudiant(s) ont des paiements expirés.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Résumé statistiques */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '24px' }}>
              📊 Résumé Statistiques
            </h3>
            <div className="summary-grid">
              <div style={{
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#2563eb', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                  Taux d'Activité
                </p>
                <p style={{ color: '#1e40af', fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
                  {dashboardData.totalEtudiants ? Math.round((dashboardData.etudiantsActifs / dashboardData.totalEtudiants) * 100) : 0}%
                </p>
                <p style={{ color: '#2563eb', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {dashboardData.etudiantsActifs}/{dashboardData.totalEtudiants} étudiants actifs
                </p>
              </div>
              <div style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#059669', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                  Moyenne Étudiants/Classe
                </p>
                <p style={{ color: '#047857', fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
                  {dashboardData.totalCours ? Math.round(dashboardData.totalEtudiants / dashboardData.totalCours) : 0}
                </p>
                <p style={{ color: '#059669', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {dashboardData.totalEtudiants} étudiants / {dashboardData.totalCours} classes
                </p>
              </div>
              <div style={{
                backgroundColor: '#faf5ff',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#7c3aed', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                  Ratio Profs/Étudiants
                </p>
                <p style={{ color: '#6d28d9', fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
                  {dashboardData.totalProfesseurs ? Math.round(dashboardData.totalEtudiants / dashboardData.totalProfesseurs) : 0}
                </p>
                <p style={{ color: '#7c3aed', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {dashboardData.totalEtudiants} étudiants / {dashboardData.totalProfesseurs} professeurs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;