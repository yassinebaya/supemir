import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Award,
  AlertCircle,
  Download
} from 'lucide-react';
import Sidebar from '../components/sidberadmin';

const handleLogout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
  }
  window.location.href = '/';
};

const AdminTestsLangue = () => {
  const navigate = useNavigate();
  const [etudiants, setEtudiants] = useState([]);
  const [filteredEtudiants, setFilteredEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin' && role !== 'administratif') {
      navigate('/');
    } else {
      fetchEtudiants();
    }
  }, [navigate]);

  const fetchEtudiants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://195.179.229.230:5000/api/admin/etudiants-tests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // FILTRER uniquement les étudiants avec nouvelleInscription: true ET anneeScolaire: 2025/2026
      const nouveauxEtudiants = data.etudiants.filter(e => 
        e.nouvelleInscription === true && 
        e.anneeScolaire === '2025/2026'
      );
      
      setEtudiants(nouveauxEtudiants);
      setFilteredEtudiants(nouveauxEtudiants);
    } catch (error) {
      console.error('Erreur chargement étudiants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = etudiants;

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatut === 'termines') {
      filtered = filtered.filter(e => e.tests.tousTermines);
    } else if (filterStatut === 'en_attente') {
      filtered = filtered.filter(e => !e.tests.tousTermines);
    }

    setFilteredEtudiants(filtered);
  }, [searchTerm, filterStatut, etudiants]);

  const getNiveauBadgeStyle = (niveau) => {
    const styles = {
      'A1': { backgroundColor: '#fee2e2', color: '#991b1b' },
      'A2': { backgroundColor: '#fed7aa', color: '#9a3412' },
      'B1': { backgroundColor: '#fef3c7', color: '#854d0e' },
      'B1+': { backgroundColor: '#d9f99d', color: '#365314' },
      'B2': { backgroundColor: '#bbf7d0', color: '#14532d' },
      'Non testé': { backgroundColor: '#f3f4f6', color: '#4b5563' }
    };
    return styles[niveau] || styles['Non testé'];
  };

  const exportToCSV = () => {
    const csv = [
      ['Nom', 'Email', 'Téléphone', 'Niveau Anglais', 'Niveau Français', 'Statut'].join(','),
      ...filteredEtudiants.map(e => [
        e.nomComplet,
        e.email,
        e.telephone || 'N/A',
        e.tests.niveauAnglais,
        e.tests.niveauFrancais,
        e.tests.tousTermines ? 'Terminé' : 'En attente'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tests-langue-nouveaux-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: etudiants.length,
    termines: etudiants.filter(e => e.tests.tousTermines).length,
    enAttente: etudiants.filter(e => !e.tests.tousTermines).length
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '32px 16px'
    },
    maxWidth: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#111827',
      margin: 0
    },
    subtitle: {
      color: '#6b7280',
      marginTop: '4px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#16a34a',
      color: 'white',
      padding: '10px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    },
    statCard: {
      borderRadius: '8px',
      padding: '16px'
    },
    statLabel: {
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '8px'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold'
    },
    filterContainer: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap'
    },
    searchInputWrapper: {
      flex: 1,
      minWidth: '300px',
      position: 'relative'
    },
    searchInput: {
      width: '100%',
      paddingLeft: '40px',
      paddingRight: '16px',
      paddingTop: '10px',
      paddingBottom: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af'
    },
    selectWrapper: {
      position: 'relative',
      minWidth: '200px'
    },
    select: {
      width: '100%',
      paddingLeft: '40px',
      paddingRight: '32px',
      paddingTop: '10px',
      paddingBottom: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      cursor: 'pointer',
      outline: 'none'
    },
    tableWrapper: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      backgroundColor: '#f9fafb',
      padding: '12px 24px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '500',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #e5e7eb'
    },
    thCenter: {
      textAlign: 'center'
    },
    td: {
      padding: '16px 24px',
      borderBottom: '1px solid #f3f4f6'
    },
    tr: {
      transition: 'background-color 0.2s'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500',
      gap: '4px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 0'
    },
    loading: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
      margin: '0 auto 16px'
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#6b7280' }}>Chargement...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Tests de Langue - Nouveaux Étudiants</h1>
              <p style={styles.subtitle}>Suivi des tests de positionnement</p>
            </div>
            <button
              onClick={exportToCSV}
              style={styles.button}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
            >
              <Download style={{ height: '20px', width: '20px' }} />
              Exporter CSV
            </button>
          </div>

          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, backgroundColor: '#dbeafe' }}>
              <p style={{ ...styles.statLabel, color: '#1e40af' }}>Total Nouveaux Étudiants</p>
              <p style={{ ...styles.statValue, color: '#1e3a8a' }}>{stats.total}</p>
            </div>
            <div style={{ ...styles.statCard, backgroundColor: '#d1fae5' }}>
              <p style={{ ...styles.statLabel, color: '#065f46' }}>Tests Terminés</p>
              <p style={{ ...styles.statValue, color: '#064e3b' }}>{stats.termines}</p>
            </div>
            <div style={{ ...styles.statCard, backgroundColor: '#fef3c7' }}>
              <p style={{ ...styles.statLabel, color: '#92400e' }}>En Attente</p>
              <p style={{ ...styles.statValue, color: '#78350f' }}>{stats.enAttente}</p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={styles.card}>
          <div style={styles.filterContainer}>
            <div style={styles.searchInputWrapper}>
              <Search style={styles.searchIcon} size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={styles.selectWrapper}>
              <Filter style={styles.searchIcon} size={20} />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                style={styles.select}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="tous">Tous les statuts</option>
                <option value="termines">Tests terminés</option>
                <option value="en_attente">En attente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Étudiant</th>
                <th style={styles.th}>Contact</th>
                <th style={{ ...styles.th, ...styles.thCenter }}>Niveau Anglais</th>
                <th style={{ ...styles.th, ...styles.thCenter }}>Niveau Français</th>
                <th style={{ ...styles.th, ...styles.thCenter }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredEtudiants.map((etudiant) => (
                <tr 
                  key={etudiant._id} 
                  style={styles.tr}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={styles.td}>
                    <div style={{ fontWeight: '500', color: '#111827' }}>
                      {etudiant.nomComplet}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {etudiant.email}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {etudiant.telephone || 'N/A'}
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {etudiant.tests.anglaisTermine ? (
                      <span style={{ ...styles.badge, ...getNiveauBadgeStyle(etudiant.tests.niveauAnglais) }}>
                        <Award style={{ height: '16px', width: '16px' }} />
                        {etudiant.tests.niveauAnglais}
                      </span>
                    ) : (
                      <span style={{ ...styles.badge, backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                        <Clock style={{ height: '16px', width: '16px' }} />
                        En attente
                      </span>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {etudiant.tests.francaisTermine ? (
                      <span style={{ ...styles.badge, ...getNiveauBadgeStyle(etudiant.tests.niveauFrancais) }}>
                        <Award style={{ height: '16px', width: '16px' }} />
                        {etudiant.tests.niveauFrancais}
                      </span>
                    ) : (
                      <span style={{ ...styles.badge, backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                        <Clock style={{ height: '16px', width: '16px' }} />
                        En attente
                      </span>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {etudiant.tests.tousTermines ? (
                      <CheckCircle style={{ height: '24px', width: '24px', color: '#16a34a', margin: '0 auto' }} />
                    ) : (
                      <AlertCircle style={{ height: '24px', width: '24px', color: '#eab308', margin: '0 auto' }} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEtudiants.length === 0 && (
            <div style={styles.emptyState}>
              <AlertCircle style={{ height: '48px', width: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280' }}>Aucun étudiant trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTestsLangue;