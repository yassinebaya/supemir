import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Search, Plus, X, Languages, Award, AlertCircle } from 'lucide-react';
import Sidebar from '../components/sidberadmin';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const AssignerLangues = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [coursLangues, setCoursLangues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCours, setSelectedCours] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('tous');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resEtudiants, resCours] = await Promise.all([
        fetch('http://195.179.229.230:5000/api/admin/etudiants-tests', config),
        fetch('http://195.179.229.230:5000/api/cours/langues', config)
      ]);

      if (resEtudiants.ok && resCours.ok) {
        const etudiantsResponse = await resEtudiants.json();
        const coursData = await resCours.json();
        
        // Extraire les étudiants du format de réponse
        const etudiantsData = etudiantsResponse.etudiants || etudiantsResponse;
        
        setEtudiants(etudiantsData);
        setCoursLangues(coursData);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setMessage('❌ Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const assignerCours = async (etudiantId, coursNom) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://195.179.229.230:5000/api/etudiants/${etudiantId}/cours-langue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coursLangue: coursNom })
      });

      if (response.ok) {
        setMessage('✅ Étudiant assigné avec succès');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage('❌ ' + (error.error || 'Erreur lors de l\'assignation'));
      }
    } catch (err) {
      setMessage('❌ Erreur: ' + err.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const retirerCours = async (etudiantId, coursNom) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://195.179.229.230:5000/api/etudiants/${etudiantId}/cours-langue/${encodeURIComponent(coursNom)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        setMessage('✅ Étudiant retiré avec succès');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage('❌ ' + (error.error || 'Erreur lors du retrait'));
      }
    } catch (err) {
      setMessage('❌ Erreur: ' + err.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getNiveauLangue = (etudiant, langue) => {
    // Format AdminTestsLangue
    if (etudiant.tests) {
      return langue === 'français' 
        ? etudiant.tests.niveauFrancais || 'Non testé'
        : etudiant.tests.niveauAnglais || 'Non testé';
    }
    
    // Format original (au cas où)
    if (!etudiant.niveauxLangues) return 'Non testé';
    return langue === 'français' 
      ? etudiant.niveauxLangues.francais || 'Non testé'
      : etudiant.niveauxLangues.anglais || 'Non testé';
  };

  const getTestePasse = (etudiant, langue) => {
    // Format AdminTestsLangue
    if (etudiant.tests) {
      return langue === 'français'
        ? etudiant.tests.francaisTermine || false
        : etudiant.tests.anglaisTermine || false;
    }
    
    // Format original
    if (!etudiant.testsLangues) return false;
    return langue === 'français'
      ? etudiant.testsLangues.francais?.passe || false
      : etudiant.testsLangues.anglais?.passe || false;
  };

  const etudiantEstDansCours = (etudiant, coursNom) => {
    return etudiant.coursLangues && etudiant.coursLangues.includes(coursNom);
  };

  const getLangueDuCours = (coursNom) => {
    const nomLower = coursNom.toLowerCase();
    if (nomLower.includes('français') || nomLower.includes('francais')) return 'français';
    if (nomLower.includes('anglais') || nomLower.includes('english')) return 'anglais';
    return null;
  };

  const etudiantsFiltres = etudiants.filter(e => {
    const matchSearch = 
      (e.nomComplet && e.nomComplet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!selectedCours) return matchSearch;

    const langue = getLangueDuCours(selectedCours);
    if (!langue) return matchSearch;

    const niveau = getNiveauLangue(e, langue);
    
    if (filtreNiveau === 'tous') return matchSearch;
    if (filtreNiveau === 'non_teste') return matchSearch && niveau === 'Non testé';
    return matchSearch && niveau === filtreNiveau;
  });

  const getNiveauBadgeStyle = (niveau) => {
    const styles = {
      'A1': { backgroundColor: '#fee2e2', color: '#991b1b' },
      'A2': { backgroundColor: '#fed7aa', color: '#9a3412' },
      'B1': { backgroundColor: '#fef3c7', color: '#854d0e' },
      'B1+': { backgroundColor: '#d9f99d', color: '#365314' },
      'B2': { backgroundColor: '#bbf7d0', color: '#14532d' },
      'Non testé': { backgroundColor: '#f3f4f6', color: '#6b7280' },
      'Non déterminé': { backgroundColor: '#f3f4f6', color: '#6b7280' }
    };
    return styles[niveau] || styles['Non testé'];
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #fef3c7 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px'
    },
    iconBox: {
      padding: '12px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: 0
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginTop: '4px'
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontWeight: '500',
      fontSize: '14px'
    },
    messageSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #6ee7b7'
    },
    messageError: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    },
    filters: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px'
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    input: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      width: '100%',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    select: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      cursor: 'pointer',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      backgroundColor: '#f9fafb',
      borderBottom: '2px solid #e5e7eb'
    },
    thCenter: {
      textAlign: 'center'
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #f3f4f6'
    },
    tdCenter: {
      textAlign: 'center'
    },
    tr: {
      transition: 'background-color 0.2s'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      gap: '6px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s'
    },
    buttonAssigner: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    buttonRetirer: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 16px',
      color: '#6b7280'
    },
    loading: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #f59e0b',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
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

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.iconBox}>
              <Languages size={28} color="white" />
            </div>
            <div>
              <h1 style={styles.title}>Assigner Étudiants aux Cours de Langues</h1>
              <p style={styles.subtitle}>
                Gérer l'affectation des étudiants aux cours de Français et Anglais
              </p>
            </div>
          </div>

          {message && (
            <div style={{
              ...styles.message,
              ...(message.includes('✅') ? styles.messageSuccess : styles.messageError)
            }}>
              {message}
            </div>
          )}

          {/* Filtres */}
          <div style={styles.filters}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>
                <Search size={16} />
                Rechercher étudiant
              </label>
              <input
                type="text"
                placeholder="Nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>
                <BookOpen size={16} />
                Cours de langue
              </label>
              <select
                value={selectedCours}
                onChange={(e) => {
                  setSelectedCours(e.target.value);
                  setFiltreNiveau('tous');
                }}
                style={styles.select}
                onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="">-- Sélectionner un cours --</option>
                {coursLangues.map(c => (
                  <option key={c._id} value={c.nom}>{c.nom}</option>
                ))}
              </select>
            </div>

            {selectedCours && (
              <div style={styles.filterGroup}>
                <label style={styles.label}>
                  <Award size={16} />
                  Filtrer par niveau
                </label>
                <select
                  value={filtreNiveau}
                  onChange={(e) => setFiltreNiveau(e.target.value)}
                  style={styles.select}
                  onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="tous">Tous les niveaux</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B1+">B1+</option>
                  <option value="B2">B2</option>
                  <option value="non_teste">Non testé</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Étudiant</th>
                <th style={styles.th}>Contact</th>
                <th style={{ ...styles.th, ...styles.thCenter }}>Niveau Français</th>
                <th style={{ ...styles.th, ...styles.thCenter }}>Niveau Anglais</th>
                <th style={{ ...styles.th, ...styles.thCenter }}>Cours Assignés</th>
                <th style={{ ...styles.th, ...styles.thCenter }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {etudiantsFiltres.map(e => {
                const niveauFr = getNiveauLangue(e, 'français');
                const niveauEn = getNiveauLangue(e, 'anglais');
                const testeFr = getTestePasse(e, 'français');
                const testeEn = getTestePasse(e, 'anglais');

                return (
                  <tr 
                    key={e._id}
                    style={styles.tr}
                    onMouseOver={(ev) => ev.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(ev) => ev.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={styles.td}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {e.nomComplet}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        {e.email}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                        {e.telephone || 'N/A'}
                      </div>
                    </td>
                    <td style={{ ...styles.td, ...styles.tdCenter }}>
                      <span style={{ ...styles.badge, ...getNiveauBadgeStyle(niveauFr) }}>
                        {testeFr ? <Award size={14} /> : <AlertCircle size={14} />}
                        {niveauFr}
                      </span>
                    </td>
                    <td style={{ ...styles.td, ...styles.tdCenter }}>
                      <span style={{ ...styles.badge, ...getNiveauBadgeStyle(niveauEn) }}>
                        {testeEn ? <Award size={14} /> : <AlertCircle size={14} />}
                        {niveauEn}
                      </span>
                    </td>
                    <td style={{ ...styles.td, ...styles.tdCenter }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                        {e.coursLangues && e.coursLangues.length > 0 ? (
                          e.coursLangues.map((c, idx) => (
                            <span 
                              key={idx} 
                              style={{
                                ...styles.badge,
                                backgroundColor: '#d1fae5',
                                color: '#065f46'
                              }}
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '13px', color: '#9ca3af' }}>Aucun</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...styles.td, ...styles.tdCenter }}>
                      {selectedCours ? (
                        etudiantEstDansCours(e, selectedCours) ? (
                          <button
                            onClick={() => retirerCours(e._id, selectedCours)}
                            style={{ ...styles.button, ...styles.buttonRetirer }}
                            onMouseOver={(ev) => {
                              ev.currentTarget.style.backgroundColor = '#991b1b';
                              ev.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(ev) => {
                              ev.currentTarget.style.backgroundColor = '#fee2e2';
                              ev.currentTarget.style.color = '#991b1b';
                            }}
                          >
                            <X size={16} />
                            Retirer
                          </button>
                        ) : (
                          <button
                            onClick={() => assignerCours(e._id, selectedCours)}
                            style={{ ...styles.button, ...styles.buttonAssigner }}
                            onMouseOver={(ev) => {
                              ev.currentTarget.style.backgroundColor = '#1e40af';
                              ev.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(ev) => {
                              ev.currentTarget.style.backgroundColor = '#dbeafe';
                              ev.currentTarget.style.color = '#1e40af';
                            }}
                          >
                            <Plus size={16} />
                            Assigner
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                          Sélectionnez un cours
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {etudiantsFiltres.length === 0 && (
            <div style={styles.emptyState}>
              <AlertCircle size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
              <p>Aucun étudiant trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignerLangues;