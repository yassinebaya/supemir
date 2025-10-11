import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  BookOpen, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit2,
  Save,
  X,
  Filter
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const GestionCoursPedagogique = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [etudiantsFiltres, setEtudiantsFiltres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreFiliere, setFiltreFiliere] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [etudiantSelectionne, setEtudiantSelectionne] = useState(null);
  const [coursCompatibles, setCoursCompatibles] = useState([]);
  const [coursSelectionnes, setCoursSelectionnes] = useState([]);
  const [loadingCours, setLoadingCours] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchEtudiants();
  }, []);

  useEffect(() => {
    filtrerEtudiants();
  }, [etudiants, recherche, filtreFiliere, filtreNiveau]);

  // Add CSS animations
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .table-row {
        animation: slideIn 0.3s ease-out;
      }

      @media (max-width: 1024px) {
        .main-content {
          padding: 16px 8px;
        }
        
        .header {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .filtres-row {
          flex-direction: column;
        }
        
        .search-box, .filter-select {
          width: 100%;
        }
      }

      @media (max-width: 768px) {
        .table-container {
          overflow-x: auto;
        }
        
        .modal-content {
          margin: 0;
          border-radius: 0;
          max-height: 100vh;
        }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const fetchEtudiants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://195.179.229.230:5000/api/pedagogique/mes-etudiants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEtudiants(res.data);
    } catch (err) {
      console.error('Erreur chargement étudiants:', err);
      setMessage({ 
        type: 'error', 
        text: 'Erreur lors du chargement des étudiants' 
      });
    } finally {
      setLoading(false);
    }
  };

  const filtrerEtudiants = () => {
    let resultats = etudiants;

    // Pas de filtre sur prixTotal - tous les étudiants sont affichés

    if (recherche) {
      resultats = resultats.filter(e => {
        const nomComplet = `${e.prenom} ${e.nomDeFamille}`.toLowerCase();
        return nomComplet.includes(recherche.toLowerCase()) ||
               e.email?.toLowerCase().includes(recherche.toLowerCase()) ||
               e.codeEtudiant?.toLowerCase().includes(recherche.toLowerCase());
      });
    }

    if (filtreFiliere) {
      resultats = resultats.filter(e => e.filiere === filtreFiliere);
    }

    if (filtreNiveau) {
      resultats = resultats.filter(e => String(e.niveau) === filtreNiveau);
    }

    setEtudiantsFiltres(resultats);
  };

  const ouvrirModalEdition = async (etudiant) => {
    setEtudiantSelectionne(etudiant);
    setCoursSelectionnes(etudiant.cours || []);
    setShowEditModal(true);
    setMessage({ type: '', text: '' });
    
    try {
      setLoadingCours(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://195.179.229.230:5000/api/pedagogique/mes-etudiants/${etudiant._id}/cours-compatibles`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCoursCompatibles(res.data.coursCompatibles);
    } catch (err) {
      console.error('Erreur chargement cours compatibles:', err);
      setMessage({ 
        type: 'error', 
        text: 'Erreur lors du chargement des cours compatibles' 
      });
    } finally {
      setLoadingCours(false);
    }
  };

  const fermerModal = () => {
    setShowEditModal(false);
    setEtudiantSelectionne(null);
    setCoursCompatibles([]);
    setCoursSelectionnes([]);
    setMessage({ type: '', text: '' });
  };

  const toggleCours = (nomCours) => {
    setCoursSelectionnes(prev => {
      if (prev.includes(nomCours)) {
        return prev.filter(c => c !== nomCours);
      } else {
        return [...prev, nomCours];
      }
    });
  };

  const enregistrerCours = async () => {
    if (!etudiantSelectionne) return;

    try {
      setLoadingCours(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `http://195.179.229.230:5000/api/pedagogique/mes-etudiants/${etudiantSelectionne._id}/cours`,
        { cours: coursSelectionnes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ 
        type: 'success', 
        text: 'Cours modifiés avec succès' 
      });

      await fetchEtudiants();

      setTimeout(() => {
        fermerModal();
      }, 2000);

    } catch (err) {
      console.error('Erreur modification cours:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Erreur lors de la modification' 
      });
    } finally {
      setLoadingCours(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const filieresUniques = [...new Set(etudiants.map(e => e.filiere).filter(Boolean))];
  const niveauxUniques = [...new Set(etudiants.map(e => e.niveau).filter(Boolean))].sort();

  const viderFiltres = () => {
    setRecherche('');
    setFiltreFiliere('');
    setFiltreNiveau('');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement des étudiants...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={styles.contentWrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerTop}>
              <div>
                <h1 style={styles.title}>
                  <Users size={32} color="#4f46e5" />
                  Gestion des Cours
                </h1>
                <p style={styles.subtitle}>
                  Modifier les classes des étudiants • {etudiantsFiltres.length} étudiant{etudiantsFiltres.length > 1 ? 's' : ''}
                </p>
              </div>
              <div style={styles.stats}>
                <div style={styles.statCard}>
                  <Users size={20} />
                  <div>
                    <span style={styles.statNumber}>{etudiantsFiltres.length}</span>
                    <span style={styles.statLabel}>Étudiants</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={styles.filtresSection}>
          <div style={styles.filtresContainer}>
            <div style={styles.filtresRow}>
              <div style={styles.filtreGroupe}>
                <div style={styles.inputWithIcon}>
                  <Search size={20} color="#6b7280" style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Rechercher (nom, email, code)..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    style={styles.inputRecherche}
                  />
                </div>
              </div>

              <div style={styles.filtreGroupe}>
                <label style={styles.filtreLabel}>Filière:</label>
                <select
                  value={filtreFiliere}
                  onChange={(e) => setFiltreFiliere(e.target.value)}
                  style={styles.selectFiltre}
                >
                  <option value="">Toutes les filières</option>
                  {filieresUniques.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filtreGroupe}>
                <label style={styles.filtreLabel}>Niveau:</label>
                <select
                  value={filtreNiveau}
                  onChange={(e) => setFiltreNiveau(e.target.value)}
                  style={styles.selectFiltre}
                >
                  <option value="">Tous les niveaux</option>
                  {niveauxUniques.map(n => (
                    <option key={n} value={n}>{n}ème année</option>
                  ))}
                </select>
              </div>

              <button onClick={viderFiltres} style={styles.btnViderFiltres}>
                <Filter size={16} />
                Vider
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {message.text && message.type !== 'success' && (
            <div style={{
              ...styles.messageBox,
              backgroundColor: message.type === 'error' ? '#fef2f2' : '#eff6ff',
              color: message.type === 'error' ? '#991b1b' : '#1e40af',
              border: `1px solid ${message.type === 'error' ? '#fecaca' : '#dbeafe'}`
            }}>
              {message.type === 'error' ? <XCircle size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Étudiant</th>
                  <th style={styles.th}>Filière</th>
                  <th style={styles.th}>Niveau</th>
                  <th style={styles.th}>Spécialité</th>
                  <th style={styles.th}>Classes actuelles</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {etudiantsFiltres.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.noData}>
                      <AlertCircle size={32} color="#9ca3af" />
                      <p>Aucun étudiant trouvé</p>
                    </td>
                  </tr>
                ) : (
                  etudiantsFiltres.map(etudiant => (
                    <tr key={etudiant._id} style={styles.tableRow} className="table-row">
                      <td style={styles.td}>
                        <div style={styles.etudiantInfo}>
                          <strong>{etudiant.prenom} {etudiant.nomDeFamille}</strong>
                          <small style={styles.etudiantEmail}>{etudiant.email}</small>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badgeFiliere}>{etudiant.filiere}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badgeNiveau}>{etudiant.niveau}ème année</span>
                      </td>
                      <td style={styles.td}>
                        <small style={styles.specialiteText}>
                          {etudiant.specialite || 
                           etudiant.specialiteIngenieur || 
                           etudiant.specialiteLicencePro || 
                           etudiant.specialiteMasterPro || 
                           '-'}
                        </small>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.coursList}>
                          {etudiant.cours && etudiant.cours.length > 0 ? (
                            etudiant.cours.map((c, i) => (
                              <span key={i} style={styles.coursTag}>{c}</span>
                            ))
                          ) : (
                            <span style={styles.noCours}>Aucune classe</span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => ouvrirModalEdition(etudiant)}
                          style={styles.btnEdit}
                        >
                          <Edit2 size={16} />
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showEditModal && etudiantSelectionne && (
        <div style={styles.modalOverlay} onClick={fermerModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Modifier les classes</h3>
                <p style={styles.modalSubtitle}>
                  {etudiantSelectionne.prenom} {etudiantSelectionne.nomDeFamille}
                  <br />
                  <small>
                    {etudiantSelectionne.filiere} - {etudiantSelectionne.niveau}ème année
                  </small>
                </p>
              </div>
              <button onClick={fermerModal} style={styles.btnClose}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {message.text && (
                <div style={{
                  ...styles.messageBox,
                  backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: message.type === 'success' ? '#166534' : '#991b1b',
                  border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  <span>{message.text}</span>
                </div>
              )}

              {loadingCours ? (
                <div style={styles.loadingCours}>
                  <div style={styles.spinner}></div>
                  <p>Chargement des cours compatibles...</p>
                </div>
              ) : (
                <>
                  <div style={styles.infoBox}>
                    <AlertCircle size={18} color="#1e40af" />
                    <div>
                      <strong style={styles.infoBoxTitle}>Règle importante :</strong>
                      <p style={styles.infoBoxText}>
                        Vous pouvez uniquement changer vers des classes de la même filière,
                        même niveau et même spécialité.
                      </p>
                    </div>
                  </div>

                  <div style={styles.coursSection}>
                    <h4 style={styles.coursSectionTitle}>Classes compatibles</h4>
                    {coursCompatibles.length === 0 ? (
                      <p style={styles.noCoursCompatible}>
                        Aucune classe compatible trouvée pour cet étudiant
                      </p>
                    ) : (
                      <div style={styles.coursGrid}>
                        {coursCompatibles.map(cours => (
                          <div
                            key={cours._id}
                            style={{
                              ...styles.coursCard,
                              borderColor: coursSelectionnes.includes(cours.nom) ? '#3b82f6' : '#e5e7eb',
                              backgroundColor: coursSelectionnes.includes(cours.nom) ? '#eff6ff' : '#ffffff'
                            }}
                            onClick={() => toggleCours(cours.nom)}
                          >
                            <div style={styles.coursCardHeader}>
                              <BookOpen size={16} color="#4f46e5" />
                              <span style={styles.coursNom}>{cours.nom}</span>
                            </div>
                            {cours.professeur && cours.professeur.length > 0 && (
                              <div style={styles.coursProf}>
                                Professeur(s): {cours.professeur.join(', ')}
                              </div>
                            )}
                            <div style={styles.coursCheckbox}>
                              {coursSelectionnes.includes(cours.nom) ? (
                                <CheckCircle size={18} color="#3b82f6" />
                              ) : (
                                <div style={styles.uncheckedCircle}></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {coursSelectionnes.length > 0 && (
                    <div style={styles.selectionSummary}>
                      <strong style={styles.summaryTitle}>Classes sélectionnées :</strong>
                      <div style={styles.selectedCoursTags}>
                        {coursSelectionnes.map((c, i) => (
                          <span key={i} style={styles.selectedTag}>
                            {c}
                            <button
                              onClick={() => toggleCours(c)}
                              style={styles.removeTag}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={fermerModal} style={styles.btnCancel}>
                Annuler
              </button>
              <button
                onClick={enregistrerCours}
                style={{
                  ...styles.btnSave,
                  opacity: loadingCours || coursSelectionnes.length === 0 ? 0.5 : 1,
                  cursor: loadingCours || coursSelectionnes.length === 0 ? 'not-allowed' : 'pointer'
                }}
                disabled={loadingCours || coursSelectionnes.length === 0}
              >
                {loadingCours ? (
                  <>
                    <div style={styles.spinnerSmall}></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
  },

  contentWrapper: {
    flex: 1,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '20px 0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
  },

  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
  },

  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },

  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },

  stats: {
    display: 'flex',
    gap: '1rem',
  },

  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    borderRadius: '12px',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },

  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'block',
  },

  statLabel: {
    fontSize: '12px',
    opacity: 0.9,
  },

  filtresSection: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 0',
  },

  filtresContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
  },

  filtresRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'end',
    flexWrap: 'wrap',
  },

  filtreGroupe: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '150px',
  },

  filtreLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },

  inputWithIcon: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  searchIcon: {
    position: 'absolute',
    left: '12px',
    zIndex: 1,
  },

  inputRecherche: {
    width: '280px',
    padding: '10px 12px 10px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },

  selectFiltre: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
  },

  btnViderFiltres: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  mainContent: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '24px 16px',
  },

  messageBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  },

  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  th: {
    padding: '16px 20px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },

  td: {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
  },

  tableRow: {
    transition: 'background-color 0.2s ease',
  },

  etudiantInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  etudiantEmail: {
    color: '#6b7280',
    fontSize: '12px',
  },

  badgeFiliere: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500',
  },

  badgeNiveau: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500',
  },

  specialiteText: {
    color: '#6b7280',
    fontSize: '13px',
  },

  coursList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },

  coursTag: {
    padding: '4px 10px',
    backgroundColor: '#f3e8ff',
    color: '#6b21a8',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },

  noCours: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontSize: '12px',
  },

  btnEdit: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'transform 0.2s ease',
  },

  noData: {
    textAlign: 'center',
    padding: '48px 20px',
    color: '#9ca3af',
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
  },

  modalTitle: {
    margin: 0,
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: '600',
  },

  modalSubtitle: {
    margin: '8px 0 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },

  btnClose: {
    padding: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },

  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },

  infoBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '8px',
    marginBottom: '24px',
  },

  infoBoxTitle: {
    color: '#1e40af',
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
  },

  infoBoxText: {
    margin: 0,
    color: '#1e40af',
    fontSize: '14px',
  },

  coursSection: {
    marginBottom: '24px',
  },

  coursSectionTitle: {
    margin: '0 0 16px 0',
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: '600',
  },

  coursGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
  },

  coursCard: {
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },

  coursCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },

  coursNom: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '14px',
  },

  coursProf: {
    color: '#6b7280',
    fontSize: '12px',
    marginTop: '8px',
  },

  coursCheckbox: {
    position: 'absolute',
    top: '16px',
    right: '16px',
  },

  uncheckedCircle: {
    width: '18px',
    height: '18px',
    border: '2px solid #d1d5db',
    borderRadius: '50%',
  },

  selectionSummary: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },

  summaryTitle: {
    display: 'block',
    marginBottom: '12px',
    color: '#1f2937',
    fontSize: '14px',
  },

  selectedCoursTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },

  selectedTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },

  removeTag: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '20px',
    lineHeight: 1,
    padding: 0,
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background 0.2s',
  },

  modalFooter: {
    display: 'flex',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid #e5e7eb',
    justifyContent: 'flex-end',
  },

  btnCancel: {
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'background 0.2s',
  },

  btnSave: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'transform 0.2s',
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: '16px',
    flex: 1,
  },

  loadingCours: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    color: '#6b7280',
  },

  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  loadingText: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },

  noCoursCompatible: {
    textAlign: 'center',
    padding: '32px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
};

export default GestionCoursPedagogique;