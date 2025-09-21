import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  BookOpen, 
  Users, 
  Calendar,
  FileText,
  Star,
  AlertCircle,
  Check,
  GraduationCap,
  Eye,
  Table,
  Filter,
  Search,
  Download,
  RefreshCw,
  EyeOff,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Sidebar from '../components/SidebarProf'; // Composant sidebar pour professeur




  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const ProfAjouterBulletin = () => {
  const [cours, setCours] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [filteredBulletins, setFilteredBulletins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingBulletin, setViewingBulletin] = useState(null);
  const [editingBulletin, setEditingBulletin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // États pour masquer/afficher les étudiants
  const [hiddenGroups, setHiddenGroups] = useState({});
  
  // Filtres avancés
  const [filters, setFilters] = useState({
    cours: '',
    semestre: '',
    evaluation: '',
    search: '',
    dateDebut: '',
    dateFin: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Nouvelles structures pour le système amélioré
  const [evaluations, setEvaluations] = useState([
    { titre: '', coefficient: '' }
  ]);
  const [etudiantsNotes, setEtudiantsNotes] = useState({});
  
  const [form, setForm] = useState({
    cours: '',
    semestre: 'S1'
  });

  // Fonction helper pour obtenir le nom complet
  const getStudentFullName = (student) => {
    if (!student) return 'N/A';
    if (student.nomComplet) return student.nomComplet;
    if (student.nomDeFamille || student.prenom) {
      return `${student.nomDeFamille || ''} ${student.prenom || ''}`.trim();
    }
    return 'N/A';
  };

  // Fonction pour basculer la visibilité d'un groupe
  const toggleGroupVisibility = (groupKey) => {
    setHiddenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Notification system
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Reset form
  const resetForm = () => {
    setForm({
      cours: '',
      semestre: 'S1'
    });
    setEvaluations([{ titre: '', coefficient: '' }]);
    setEtudiantsNotes({});
    setEditingBulletin(null);
  };

  // Grouper les bulletins par cours/semestre/evaluation
  const groupBulletins = (bulletinsList) => {
    const grouped = {};
    bulletinsList.forEach(bulletin => {
      const evaluationTitle = bulletin.notes && bulletin.notes.length > 0 ? bulletin.notes[0].titre : 'Sans titre';
      const key = `${bulletin.cours}-${bulletin.semestre}-${evaluationTitle}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          key,
          cours: bulletin.cours,
          semestre: bulletin.semestre,
          evaluation: evaluationTitle,
          coefficient: bulletin.notes && bulletin.notes.length > 0 ? bulletin.notes[0].coefficient : 0,
          dateCreation: bulletin.dateCreation,
          etudiants: []
        };
      }
      
      grouped[key].etudiants.push({
        _id: bulletin._id,
        etudiant: bulletin.etudiant,
        note: bulletin.notes && bulletin.notes.length > 0 ? bulletin.notes[0].note : 0,
        remarque: bulletin.remarque
      });
    });
    
    return Object.values(grouped);
  };

  // Appliquer les filtres
  const applyFilters = () => {
    let filtered = [...bulletins];
    
    if (filters.cours) {
      filtered = filtered.filter(b => b.cours.toLowerCase().includes(filters.cours.toLowerCase()));
    }
    
    if (filters.semestre) {
      filtered = filtered.filter(b => b.semestre === filters.semestre);
    }
    
    if (filters.evaluation) {
      filtered = filtered.filter(b => 
        b.notes && b.notes.length > 0 && 
        b.notes[0].titre.toLowerCase().includes(filters.evaluation.toLowerCase())
      );
    }
    
    if (filters.search) {
      filtered = filtered.filter(b => {
        const studentName = getStudentFullName(b.etudiant);
        return studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
               b.cours.toLowerCase().includes(filters.search.toLowerCase()) ||
               (b.notes && b.notes.length > 0 && b.notes[0].titre.toLowerCase().includes(filters.search.toLowerCase()));
      });
    }
    
    if (filters.dateDebut) {
      filtered = filtered.filter(b => new Date(b.dateCreation) >= new Date(filters.dateDebut));
    }
    
    if (filters.dateFin) {
      filtered = filtered.filter(b => new Date(b.dateCreation) <= new Date(filters.dateFin));
    }
    
    setFilteredBulletins(filtered);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      cours: '',
      semestre: '',
      evaluation: '',
      search: '',
      dateDebut: '',
      dateFin: ''
    });
    setFilteredBulletins(bulletins);
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [filters, bulletins]);

  // Fetch cours
  useEffect(() => {
    const fetchCours = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/professeur/mes-cours', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCours(data);
      } catch (error) {
        showNotification('Erreur lors du chargement des cours', 'error');
      }
    };
    fetchCours();
  }, []);

  // Fetch bulletins
  useEffect(() => {
    const fetchBulletins = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/bulletins/professeur', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setBulletins(data);
        setFilteredBulletins(data);
      } catch (error) {
        showNotification('Erreur lors du chargement des bulletins', 'error');
      }
    };
    fetchBulletins();
  }, []);

  // Fetch students when course selected
  useEffect(() => {
    if (!form.cours) {
      setEtudiants([]);
      setEtudiantsNotes({});
      return;
    }
    
    const fetchEtudiants = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/professeur/etudiants', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const etudiantsDuCours = data.filter(e =>
          Array.isArray(e.cours) && e.cours.includes(form.cours)
        );
        setEtudiants(etudiantsDuCours);
        
        // Initialiser les notes pour chaque étudiant
        const initialNotes = {};
        etudiantsDuCours.forEach(etudiant => {
          initialNotes[etudiant._id] = {
            nomComplet: getStudentFullName(etudiant),
            notes: [],
            remarque: ''
          };
        });
        setEtudiantsNotes(initialNotes);
      } catch (error) {
        showNotification('Erreur lors du chargement des étudiants', 'error');
      }
    };
    fetchEtudiants();
  }, [form.cours]);

  // Mettre à jour les notes des étudiants quand les évaluations changent
  useEffect(() => {
    if (Object.keys(etudiantsNotes).length > 0) {
      const updatedNotes = { ...etudiantsNotes };
      Object.keys(updatedNotes).forEach(etudiantId => {
        const currentNotes = updatedNotes[etudiantId].notes;
        const newNotes = evaluations.map((_, index) => 
          currentNotes[index] ? currentNotes[index] : ''
        );
        updatedNotes[etudiantId].notes = newNotes;
      });
      setEtudiantsNotes(updatedNotes);
    }
  }, [evaluations]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Gestion des évaluations
  const handleEvaluationChange = (index, field, value) => {
    const newEvaluations = [...evaluations];
    newEvaluations[index][field] = value;
    setEvaluations(newEvaluations);
  };

  const addEvaluation = () => {
    setEvaluations([...evaluations, { titre: '', coefficient: '' }]);
  };

  const removeEvaluation = (index) => {
    if (evaluations.length > 1) {
      const newEvaluations = evaluations.filter((_, i) => i !== index);
      setEvaluations(newEvaluations);
    }
  };

  // Gestion des notes individuelles des étudiants
  const handleEtudiantNoteChange = (etudiantId, evaluationIndex, note) => {
    const updated = { ...etudiantsNotes };
    updated[etudiantId].notes[evaluationIndex] = note;
    setEtudiantsNotes(updated);
  };

  const handleEtudiantRemarqueChange = (etudiantId, remarque) => {
    const updated = { ...etudiantsNotes };
    updated[etudiantId].remarque = remarque;
    setEtudiantsNotes(updated);
  };

  // Calculer la moyenne pour un étudiant
  const calculateAverage = (notes, coefficients) => {
    const validNotes = notes.filter((note, index) => 
      note && note.trim() !== '' && coefficients[index] && coefficients[index].coefficient
    );
    
    if (validNotes.length === 0) return 'N/A';
    
    let total = 0;
    let coefTotal = 0;
    notes.forEach((note, index) => {
      if (note && note.trim() !== '' && coefficients[index] && coefficients[index].coefficient) {
        const noteValue = parseFloat(note);
        const coefValue = parseFloat(coefficients[index].coefficient);
        if (!isNaN(noteValue) && !isNaN(coefValue)) {
          total += noteValue * coefValue;
          coefTotal += coefValue;
        }
      }
    });
    
    return coefTotal > 0 ? (total / coefTotal).toFixed(2) : 'N/A';
  };

  // Calculer la moyenne de classe pour une évaluation
  const calculateClassAverage = (etudiants) => {
    const validNotes = etudiants.filter(e => e.note && !isNaN(e.note));
    if (validNotes.length === 0) return 'N/A';
    
    const total = validNotes.reduce((sum, e) => sum + parseFloat(e.note), 0);
    return (total / validNotes.length).toFixed(2);
  };

  const handleSubmitAll = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const promises = [];
      
      // Pour chaque évaluation, créer des bulletins séparés
      evaluations.forEach((evaluation, evalIndex) => {
        if (evaluation.titre.trim() && evaluation.coefficient) {
          // Pour chaque étudiant qui a une note pour cette évaluation
          Object.keys(etudiantsNotes).forEach(etudiantId => {
            const etudiantData = etudiantsNotes[etudiantId];
            const note = etudiantData.notes[evalIndex];
            
            if (note && note.trim() !== '') {
              const bulletinData = {
                etudiant: etudiantId,
                cours: form.cours,
                semestre: form.semestre,
                notes: [{
                  titre: evaluation.titre,
                  note: parseFloat(note),
                  coefficient: parseFloat(evaluation.coefficient)
                }],
                remarque: etudiantData.remarque,
                moyenneFinale: parseFloat(note)
              };
              
              promises.push(
                fetch('http://localhost:5000/api/bulletins', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(bulletinData)
                })
              );
            }
          });
        }
      });
      
      if (promises.length === 0) {
        showNotification('Aucune note valide à enregistrer', 'error');
        return;
      }
      
      await Promise.all(promises);
      
      showNotification(`${promises.length} bulletin(s) créé(s) avec succès`);
      setShowModal(false);
      resetForm();
      
      // Refresh bulletins list
      const bulletinsRes = await fetch('http://localhost:5000/api/bulletins/professeur', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bulletinsData = await bulletinsRes.json();
      setBulletins(bulletinsData);
      setFilteredBulletins(bulletinsData);
      
    } catch (error) {
      showNotification(error.message || 'Erreur lors de la soumission', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroup = (group) => {
    setViewingBulletin(group);
    setShowViewModal(true);
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer tous les bulletins de "${group.evaluation}" ?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const promises = group.etudiants.map(etudiant => 
        fetch(`http://localhost:5000/api/bulletins/${etudiant._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(promises);
      
      showNotification(`${group.etudiants.length} bulletin(s) supprimé(s) avec succès`);
      
      // Refresh bulletins
      const bulletinsRes = await fetch('http://localhost:5000/api/bulletins/professeur', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bulletinsData = await bulletinsRes.json();
      setBulletins(bulletinsData);
      setFilteredBulletins(bulletinsData);
      
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/bulletins/professeur', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBulletins(data);
      setFilteredBulletins(data);
      showNotification('Données actualisées');
    } catch (error) {
      showNotification('Erreur lors de l\'actualisation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Grouper les bulletins filtrés
  const groupedBulletins = groupBulletins(filteredBulletins);

  return (
    <div style={styles.container}>
              <Sidebar onLogout={handleLogout} />
        
      {/* Notification */}
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: notification.type === 'error' ? '#dc2626' : '#166534',
          border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#86efac'}`
        }}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTitle}>
            <h1 style={styles.title}>Gestion des Bulletins</h1>
          </div>
          <div style={styles.headerActions}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{...styles.secondaryButton, backgroundColor: showFilters ? '#e0f2fe' : '#f3f4f6'}}
            >
              <Filter size={18} />
              Filtres {showFilters ? '▲' : '▼'}
            </button>
            <button 
              onClick={refreshData}
              style={styles.secondaryButton}
              disabled={loading}
            >
              <RefreshCw size={18} />
              Actualiser
            </button>
            <button 
              onClick={openCreateModal}
              style={styles.primaryButton}
              disabled={loading}
            >
              <Plus size={20} />
              Nouveaux Bulletins
            </button>
          </div>
        </div>
      </div>

      {/* Filtres Avancés */}
      {showFilters && (
        <div style={styles.filtersSection}>
          <div style={styles.filtersContainer}>
            <div style={styles.filtersGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Search size={16} />
                  Recherche générale
                </label>
                <input
                  type="text"
                  placeholder="Nom étudiant, cours, évaluation..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <BookOpen size={16} />
                  Cours
                </label>
                <select
                  value={filters.cours}
                  onChange={(e) => handleFilterChange('cours', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Tous les cours</option>
                  {[...new Set(bulletins.map(b => b.cours))].map(cours => (
                    <option key={cours} value={cours}>{cours}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} />
                  Semestre
                </label>
                <select
                  value={filters.semestre}
                  onChange={(e) => handleFilterChange('semestre', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Tous les semestres</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="Année">Année</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Star size={16} />
                  Évaluation
                </label>
                <input
                  type="text"
                  placeholder="Nom de l'évaluation..."
                  value={filters.evaluation}
                  onChange={(e) => handleFilterChange('evaluation', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} />
                  Date début
                </label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} />
                  Date fin
                </label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.filtersActions}>
              <button onClick={resetFilters} style={styles.resetButton}>
                <RefreshCw size={16} />
                Réinitialiser
              </button>
              <div style={styles.resultsCount}>
                {filteredBulletins.length} résultat(s) trouvé(s)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulletins Groupés */}
      <div style={styles.content}>
        {groupedBulletins.length > 0 ? (
          <div style={styles.groupedBulletins}>
            {groupedBulletins.map((group, index) => (
              <div key={index} style={styles.groupCard}>
                <div style={styles.groupHeader}>
                  <div style={styles.groupInfo}>
                    <h3 style={styles.groupTitle}>
                      <Table size={20} color="#3b82f6" />
                      {group.evaluation}
                    </h3>
                    <div style={styles.groupMeta}>
                      <span style={styles.groupCourse}>
                        <BookOpen size={14} />
                        {group.cours}
                      </span>
                      <span style={styles.groupSemester}>
                        <Calendar size={14} />
                        {group.semestre}
                      </span>
                      <span style={styles.groupCoeff}>
                        <Star size={14} />
                        Coef: {group.coefficient}
                      </span>
                      <span style={styles.groupStudents}>
                        <Users size={14} />
                        {group.etudiants.length} étudiant(s)
                      </span>
                    </div>
                  </div>
                  <div style={styles.groupActions}>
                    <button
                      onClick={() => toggleGroupVisibility(group.key)}
                      style={{...styles.iconButton, color: hiddenGroups[group.key] ? '#6b7280' : '#3b82f6'}}
                      title={hiddenGroups[group.key] ? "Afficher les étudiants" : "Masquer les étudiants"}
                    >
                      {hiddenGroups[group.key] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                    <button
                      onClick={() => handleViewGroup(group)}
                      style={{...styles.iconButton, color: '#059669'}}
                      title="Voir détails"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      style={{...styles.iconButton, color: '#ef4444'}}
                      title="Supprimer tout"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={styles.groupContent}>
                  <div style={styles.groupStats}>
                    <div style={styles.statItem}>
                      <Star size={16} color="#f59e0b" />
                      <span>Moyenne classe: {calculateClassAverage(group.etudiants)}/20</span>
                    </div>
                    <div style={styles.statItem}>
                      <Users size={16} color="#10b981" />
                      <span>Admis: {group.etudiants.filter(e => e.note >= 10).length}</span>
                    </div>
                    <div style={styles.statItem}>
                      <Users size={16} color="#ef4444" />
                      <span>Échecs: {group.etudiants.filter(e => e.note < 10).length}</span>
                    </div>
                    {group.dateCreation && (
                      <div style={styles.statItem}>
                        <Calendar size={16} />
                        <span>
                          {new Date(group.dateCreation).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tableau des étudiants - masquable */}
                  {!hiddenGroups[group.key] && (
                    <div style={styles.studentsPreview}>
                      <div style={styles.studentsTable}>
                        <div style={styles.tableHeaderCompact}>
                          <span style={styles.headerCell}>Étudiant</span>
                          <span style={styles.headerCell}>Note</span>
                          <span style={styles.headerCell}>Status</span>
                        </div>
                        {group.etudiants.slice(0, 10).map((etudiant, idx) => (
                          <div key={idx} style={styles.tableRowCompact}>
                            <span style={styles.studentName}>
                              <Users size={14} />
                              {getStudentFullName(etudiant.etudiant)}
                            </span>
                            <span style={{
                              ...styles.noteValue,
                              color: etudiant.note >= 10 ? '#059669' : '#dc2626'
                            }}>
                              {etudiant.note}/20
                            </span>
                            <span style={styles.statusBadge}>
                              {etudiant.note >= 10 ? (
                                <span style={{...styles.badge, backgroundColor: '#dcfce7', color: '#166534'}}>
                                  ✓ Admis
                                </span>
                              ) : (
                                <span style={{...styles.badge, backgroundColor: '#fee2e2', color: '#dc2626'}}>
                                  ✗ Échec
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                        {group.etudiants.length > 10 && (
                          <div style={styles.moreStudents}>
                            <span>... et {group.etudiants.length - 10} autre(s) étudiant(s)</span>
                            <button
                              onClick={() => handleViewGroup(group)}
                              style={styles.viewAllButton}
                            >
                              Voir tous
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <FileText size={48} color="#9ca3af" />
            <h3 style={styles.emptyTitle}>
              {bulletins.length === 0 ? 'Aucun bulletin créé' : 'Aucun résultat trouvé'}
            </h3>
            <p style={styles.emptyText}>
              {bulletins.length === 0 
                ? 'Commencez par créer des bulletins pour votre classe'
                : 'Essayez de modifier vos critères de recherche'
              }
            </p>
            {bulletins.length === 0 && (
              <button onClick={openCreateModal} style={styles.primaryButton}>
                <Plus size={20} />
                Créer des bulletins
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de visualisation détaillée du groupe */}
      {showViewModal && viewingBulletin && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <Eye size={20} />
                {viewingBulletin.evaluation} - {viewingBulletin.cours} ({viewingBulletin.semestre})
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingBulletin(null);
                }}
                style={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Statistiques détaillées */}
              <div style={styles.viewSection}>
                <h3 style={styles.viewSectionTitle}>
                  <Star size={18} />
                  Statistiques de l'évaluation
                </h3>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{viewingBulletin.etudiants.length}</div>
                    <div style={styles.statLabel}>Étudiants</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{calculateClassAverage(viewingBulletin.etudiants)}</div>
                    <div style={styles.statLabel}>Moyenne classe</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                      {viewingBulletin.etudiants.filter(e => e.note >= 10).length}
                    </div>
                    <div style={styles.statLabel}>Admis</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                      {viewingBulletin.etudiants.filter(e => e.note < 10).length}
                    </div>
                    <div style={styles.statLabel}>Échecs</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{viewingBulletin.coefficient}</div>
                    <div style={styles.statLabel}>Coefficient</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                      {Math.max(...viewingBulletin.etudiants.map(e => e.note))}
                    </div>
                    <div style={styles.statLabel}>Note max</div>
                  </div>
                </div>
              </div>

              {/* Tableau détaillé de tous les étudiants */}
              <div style={styles.viewSection}>
                <h3 style={styles.viewSectionTitle}>
                  <Users size={18} />
                  Détail des notes ({viewingBulletin.etudiants.length} étudiants)
                </h3>
                <div style={styles.detailedTable}>
                  <table style={styles.viewTable}>
                    <thead>
                      <tr style={styles.viewTableHeader}>
                        <th style={styles.viewTableHeaderCell}>#</th>
                        <th style={styles.viewTableHeaderCell}>Étudiant</th>
                        <th style={styles.viewTableHeaderCell}>Note</th>
                        <th style={styles.viewTableHeaderCell}>Status</th>
                        <th style={styles.viewTableHeaderCell}>Remarques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingBulletin.etudiants
                        .sort((a, b) => b.note - a.note)
                        .map((etudiant, index) => (
                          <tr key={etudiant._id} style={styles.viewTableRow}>
                            <td style={styles.viewTableCell}>
                              <div style={styles.rankBadge}>
                                {index + 1}
                              </div>
                            </td>
                            <td style={styles.viewTableCell}>
                              <div style={styles.studentInfoDetailed}>
                                <Users size={16} color="#6366f1" />
                                <span>{getStudentFullName(etudiant.etudiant)}</span>
                              </div>
                            </td>
                            <td style={styles.viewTableCell}>
                              <span style={{
                                ...styles.noteDisplay,
                                color: etudiant.note >= 10 ? '#059669' : '#dc2626',
                                backgroundColor: etudiant.note >= 10 ? '#f0fdf4' : '#fef2f2'
                              }}>
                                {etudiant.note}/20
                              </span>
                            </td>
                            <td style={styles.viewTableCell}>
                              {etudiant.note >= 10 ? (
                                <span style={{...styles.statusBadge, backgroundColor: '#dcfce7', color: '#166534'}}>
                                  ✓ Admis
                                </span>
                              ) : (
                                <span style={{...styles.statusBadge, backgroundColor: '#fee2e2', color: '#dc2626'}}>
                                  ✗ Échec
                                </span>
                              )}
                            </td>
                            <td style={styles.viewTableCell}>
                              {etudiant.remarque ? (
                                <div style={styles.remarquePreview}>
                                  {etudiant.remarque.length > 50 
                                    ? `${etudiant.remarque.substring(0, 50)}...`
                                    : etudiant.remarque
                                  }
                                </div>
                              ) : (
                                <span style={styles.noRemarque}>Aucune remarque</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour création groupée */}
      {showModal && !editingBulletin && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <Table size={24} />
                Créer les Bulletins - Mode Tableau
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Sélection du cours et semestre */}
              <div style={styles.courseSelection}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <BookOpen size={16} />
                    Cours enseigné
                  </label>
                  <select
                    name="cours"
                    value={form.cours}
                    onChange={handleFormChange}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choisir un cours --</option>
                    {cours.map(c => (
                      <option key={c._id} value={c.nom}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Calendar size={16} />
                    Semestre
                  </label>
                  <select
                    name="semestre"
                    value={form.semestre}
                    onChange={handleFormChange}
                    style={styles.select}
                    required
                  >
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="Année">Année</option>
                  </select>
                </div>
              </div>

              {/* Configuration des évaluations */}
              {form.cours && (
                <div style={styles.evaluationsSection}>
                  <div style={styles.evaluationsHeader}>
                    <h3 style={styles.sectionTitle}>
                      <Star size={20} />
                      Configuration des Évaluations
                    </h3>
                    <button
                      type="button"
                      onClick={addEvaluation}
                      style={styles.addButton}
                    >
                      <Plus size={16} />
                      Ajouter Évaluation
                    </button>
                  </div>

                  <div style={styles.evaluationsList}>
                    {evaluations.map((evaluation, index) => (
                      <div key={index} style={styles.evaluationRow}>
                        <div style={styles.evaluationNumber}>{index + 1}</div>
                        <input
                          placeholder="Titre de l'évaluation (ex: Examen 1, DS1...)"
                          value={evaluation.titre}
                          onChange={(e) => handleEvaluationChange(index, 'titre', e.target.value)}
                          style={styles.input}
                        />
                        <input
                          placeholder="Coefficient"
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={evaluation.coefficient}
                          onChange={(e) => handleEvaluationChange(index, 'coefficient', e.target.value)}
                          style={styles.inputSmall}
                        />
                        {evaluations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEvaluation(index)}
                            style={styles.deleteButton}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tableau des notes */}
              {form.cours && etudiants.length > 0 && evaluations.some(e => e.titre.trim()) && (
                <div style={styles.notesTableSection}>
                  <h3 style={styles.sectionTitle}>
                    <Users size={20} />
                    Saisie des Notes - {etudiants.length} étudiant(s)
                  </h3>
                  
                  <div style={styles.tableContainer}>
                    <table style={styles.notesTable}>
                      <thead>
                        <tr style={styles.tableHeaderRow}>
                          <th style={styles.studentColumn}>Étudiant</th>
                          {evaluations.map((evaluation, index) => (
                            evaluation.titre.trim() && (
                              <th key={index} style={styles.noteColumn}>
                                {evaluation.titre}
                                <div style={styles.coefficientInfo}>
                                  Coef: {evaluation.coefficient}
                                </div>
                              </th>
                            )
                          ))}
                          <th style={styles.averageColumn}>Moyenne</th>
                          <th style={styles.remarqueColumn}>Remarques</th>
                        </tr>
                      </thead>
                      <tbody>
                        {etudiants.map(etudiant => (
                          <tr key={etudiant._id} style={styles.tableRow}>
                            <td style={styles.studentCell}>
                              <div style={styles.studentInfo}>
                                <Users size={16} color="#6366f1" />
                                {getStudentFullName(etudiant)}
                              </div>
                            </td>
                            {evaluations.map((evaluation, evalIndex) => (
                              evaluation.titre.trim() && (
                                <td key={evalIndex} style={styles.noteCell}>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="20"
                                    placeholder="Note/20"
                                    value={etudiantsNotes[etudiant._id]?.notes[evalIndex] || ''}
                                    onChange={(e) => handleEtudiantNoteChange(etudiant._id, evalIndex, e.target.value)}
                                    style={styles.noteInput}
                                  />
                                </td>
                              )
                            ))}
                            <td style={styles.averageCell}>
                              <span style={styles.averageValue}>
                                {calculateAverage(
                                  etudiantsNotes[etudiant._id]?.notes || [],
                                  evaluations
                                )}
                              </span>
                            </td>
                            <td style={styles.remarqueCell}>
                              <textarea
                                placeholder="Remarques..."
                                value={etudiantsNotes[etudiant._id]?.remarque || ''}
                                onChange={(e) => handleEtudiantRemarqueChange(etudiant._id, e.target.value)}
                                style={styles.remarqueInput}
                                rows="2"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {form.cours && etudiants.length === 0 && (
                <div style={styles.noStudents}>
                  <Users size={32} color="#9ca3af" />
                  <p>Aucun étudiant trouvé pour ce cours</p>
                </div>
              )}

              {form.cours && etudiants.length > 0 && evaluations.some(e => e.titre.trim()) && (
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    style={styles.cancelButton}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmitAll}
                    style={styles.primaryButton}
                    disabled={loading}
                  >
                    <Save size={16} />
                    {loading ? 'Création...' : 'Enregistrer tous les bulletins'}
                  </button>
                </div>
              )}
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
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  notification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 1001,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontWeight: '500'
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',          // Ajouté
    justifyContent: 'center'  // Ajouté pour centrer horizontalement
  },
  headerContent: {
    maxWidth: '1400px',
    width: '100%',            // Ajouté
    display: 'flex',
    flexDirection: 'column',  // Changé de row à column
    alignItems: 'center',     // Changé pour centrer les éléments
    gap: '20px'               // Ajusté l'espacement
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center'       // Ajouté pour centrer le texte
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center'  // Ajouté pour centrer les boutons
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px'
  },
  // Vos autres styles...
  // Styles pour les filtres
  filtersSection: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  filtersContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px'
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  filtersActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6'
  },
  resetButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  resultsCount: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },

  // Styles pour l'affichage groupé
  groupedBulletins: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease'
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f3f4f6'
  },
  groupInfo: {
    flex: 1
  },
  groupTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  groupMeta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  groupCourse: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#e0f2fe',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: '500'
  },
  groupSemester: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#fef3c7',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: '500'
  },
  groupCoeff: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#f0fdf4',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: '500'
  },
  groupStudents: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: '500'
  },
  groupActions: {
    display: 'flex',
    gap: '8px'
  },
  groupContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  groupStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },

  // Styles pour le tableau des étudiants condensé
  studentsPreview: {
    backgroundColor: '#fefefe',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  studentsTable: {
    width: '100%'
  },
  tableHeaderCompact: {
    display: 'grid',
    gridTemplateColumns: '2fr 100px 120px',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  headerCell: {
    display: 'flex',
    alignItems: 'center'
  },
  tableRowCompact: {
    display: 'grid',
    gridTemplateColumns: '2fr 100px 120px',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease'
  },
  studentName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827'
  },
  noteValue: {
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
  },
  moreStudents: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic'
  },
  viewAllButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Styles pour les modals
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalLarge: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '1400px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  closeButton: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  modalContent: {
    padding: '24px',
    maxHeight: 'calc(90vh - 140px)',
    overflowY: 'auto'
  },

  // Styles pour le modal de visualisation détaillée
  viewSection: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  viewSectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  // Styles pour le tableau détaillé
  detailedTable: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb'
  },
  viewTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  viewTableHeader: {
    backgroundColor: '#f9fafb'
  },
  viewTableHeaderCell: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb'
  },
  viewTableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease'
  },
  viewTableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#111827',
    verticalAlign: 'middle'
  },
  rankBadge: {
    width: '32px',
    height: '32px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600'
  },
  studentInfoDetailed: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  noteDisplay: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600'
  },
  remarquePreview: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: '1.4'
  },
  noRemarque: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic'
  },

  // Styles communs
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  addButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  iconButton: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteButton: {
    backgroundColor: 'transparent',
    color: '#ef4444',
    border: 'none',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  cancelButton: {
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Styles pour les formulaires
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s ease'
  },
  inputSmall: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    width: '100px',
    transition: 'border-color 0.2s ease'
  },
  select: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s ease'
  },

  // Styles pour les sections du modal de création
  courseSelection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  evaluationsSection: {
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: '#fefefe',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  evaluationsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  evaluationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  evaluationRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 120px auto',
    gap: '12px',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  evaluationNumber: {
    width: '32px',
    height: '32px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600'
  },
  notesTableSection: {
    marginBottom: '32px'
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  notesTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeaderRow: {
    backgroundColor: '#f9fafb'
  },
  studentColumn: {
    padding: '16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    minWidth: '200px',
    position: 'sticky',
    left: 0,
    backgroundColor: '#f9fafb',
    zIndex: 10
  },
  noteColumn: {
    padding: '16px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    minWidth: '120px'
  },
  averageColumn: {
    padding: '16px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    minWidth: '100px',
    backgroundColor: '#fef3c7'
  },
  remarqueColumn: {
    padding: '16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    minWidth: '200px'
  },
  coefficientInfo: {
    fontSize: '11px',
    fontWeight: '400',
    color: '#6b7280',
    marginTop: '4px'
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease'
  },
  studentCell: {
    padding: '16px',
    borderRight: '1px solid #f3f4f6',
    position: 'sticky',
    left: 0,
    backgroundColor: 'white',
    zIndex: 5
  },
  studentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500'
  },
  noteCell: {
    padding: '12px',
    textAlign: 'center',
    borderRight: '1px solid #f3f4f6'
  },
  averageCell: {
    padding: '12px',
    textAlign: 'center',
    backgroundColor: '#fffbeb',
    borderRight: '1px solid #f3f4f6'
  },
  averageValue: {
    fontWeight: '600',
    color: '#059669',
    fontSize: '15px'
  },
  remarqueCell: {
    padding: '12px'
  },
  noteInput: {
    width: '80px',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center',
    transition: 'border-color 0.2s ease'
  },
  remarqueInput: {
    width: '100%',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    resize: 'vertical',
    minHeight: '50px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease'
  },
  noStudents: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '16px 0 8px 0',
    color: '#111827'
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '24px'
  }
};

export default ProfAjouterBulletin;