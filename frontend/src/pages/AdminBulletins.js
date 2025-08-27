import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح

import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Eye, 
  Trash2, 
  Users, 
  BookOpen, 
  Calendar, 
  Star, 
  GraduationCap,
  FileText,
  TrendingUp,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PieChart,
  User,
  School,
  EyeOff,
  Table,
  MessageSquare
} from 'lucide-react';

const AdminBulletins = () => {
  const [bulletins, setBulletins] = useState([]);
  const [filteredBulletins, setFilteredBulletins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // États pour masquer/afficher les groupes
  const [hiddenGroups, setHiddenGroups] = useState({});

  // États pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    cours: '',
    semestre: '',
    professeur: '',
    etudiant: '',
    noteMin: '',
    noteMax: '',
    dateDebut: '',
    dateFin: '',
    status: '' // admis, echec, tous
  });

  // États pour les statistiques
  const [stats, setStats] = useState({
    total: 0,
    admis: 0,
    echecs: 0,
    moyenneGenerale: 0,
    coursUniques: 0,
    professeursUniques: 0
  });

  // Helper function to get proper names
  const getStudentName = (bulletin) => {
    if (!bulletin.etudiant) return 'Étudiant non défini';
    
    if (bulletin.etudiant.nomComplet) {
      return bulletin.etudiant.nomComplet;
    }
    
    const prenom = bulletin.etudiant.prenom || '';
    const nom = bulletin.etudiant.nomDeFamille || '';
    
    if (prenom || nom) {
      return `${prenom} ${nom}`.trim();
    }
    
    if (bulletin.etudiantNom && bulletin.etudiantNom !== 'N/A') {
      return bulletin.etudiantNom;
    }
    
    return 'Nom non renseigné';
  };

  const getProfessorName = (bulletin) => {
    if (!bulletin.professeur) return 'Professeur non défini';
    
    if (bulletin.professeur.nomComplet) {
      return bulletin.professeur.nomComplet;
    }
    
    const prenom = bulletin.professeur.prenom || '';
    const nom = bulletin.professeur.nom || '';
    
    if (prenom || nom) {
      return `${prenom} ${nom}`.trim();
    }
    
    if (bulletin.professeurNom && bulletin.professeurNom !== 'N/A') {
      return bulletin.professeurNom;
    }
    
    return 'Nom non renseigné';
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

  // Fetch data
  useEffect(() => {
    fetchBulletins();
  }, []);

  const fetchBulletins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/bulletins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Erreur lors du chargement');
      
      const data = await res.json();
      setBulletins(data);
      setFilteredBulletins(data);
      calculateStats(data);
      showNotification('Données chargées avec succès');
    } catch (error) {
      showNotification('Erreur lors du chargement des données', 'error');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data) => {
    const total = data.length;
    const admis = data.filter(b => b.moyenneFinale >= 10).length;
    const echecs = total - admis;
    const moyenneGenerale = total > 0 
      ? (data.reduce((sum, b) => sum + (b.moyenneFinale || 0), 0) / total).toFixed(2)
      : 0;
    const coursUniques = [...new Set(data.map(b => b.cours).filter(Boolean))].length;
    const professeursUniques = [...new Set(data.map(b => getProfessorName(b)).filter(name => name && name !== 'Professeur non défini' && name !== 'Nom non renseigné'))].length;

    setStats({
      total,
      admis,
      echecs,
      moyenneGenerale,
      coursUniques,
      professeursUniques
    });
  };

  // Grouper les bulletins par professeur/cours/semestre
  const groupBulletins = (bulletinsList) => {
    const grouped = {};
    bulletinsList.forEach(bulletin => {
      const profName = getProfessorName(bulletin);
      const key = `${profName}-${bulletin.cours}-${bulletin.semestre}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          key,
          professeur: profName,
          cours: bulletin.cours || 'Cours non défini',
          semestre: bulletin.semestre || 'Semestre non défini',
          dateCreation: bulletin.createdAt,
          etudiants: []
        };
      }
      
      grouped[key].etudiants.push({
        _id: bulletin._id,
        etudiant: bulletin.etudiant,
        etudiantNom: getStudentName(bulletin),
        note: bulletin.moyenneFinale || 0,
        notes: bulletin.notes || [],
        remarque: bulletin.remarque || '',
        dateCreation: bulletin.createdAt
      });
    });
    
    return Object.values(grouped).sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...bulletins];

    // Recherche générale
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(b =>
        getStudentName(b).toLowerCase().includes(searchTerm) ||
        getProfessorName(b).toLowerCase().includes(searchTerm) ||
        (b.cours || '').toLowerCase().includes(searchTerm) ||
        (b.remarque || '').toLowerCase().includes(searchTerm) ||
        (b.notes && b.notes.some(n => n.titre.toLowerCase().includes(searchTerm)))
      );
    }

    // Filtre par cours
    if (filters.cours) {
      filtered = filtered.filter(b => 
        b.cours && b.cours.toLowerCase().includes(filters.cours.toLowerCase())
      );
    }

    // Filtre par semestre
    if (filters.semestre) {
      filtered = filtered.filter(b => b.semestre === filters.semestre);
    }

    // Filtre par professeur
    if (filters.professeur) {
      filtered = filtered.filter(b =>
        getProfessorName(b).toLowerCase().includes(filters.professeur.toLowerCase())
      );
    }

    // Filtre par étudiant
    if (filters.etudiant) {
      filtered = filtered.filter(b =>
        getStudentName(b).toLowerCase().includes(filters.etudiant.toLowerCase())
      );
    }

    // Filtre par note min
    if (filters.noteMin) {
      filtered = filtered.filter(b => b.moyenneFinale >= parseFloat(filters.noteMin));
    }

    // Filtre par note max
    if (filters.noteMax) {
      filtered = filtered.filter(b => b.moyenneFinale <= parseFloat(filters.noteMax));
    }

    // Filtre par date
    if (filters.dateDebut) {
      filtered = filtered.filter(b => new Date(b.createdAt) >= new Date(filters.dateDebut));
    }

    if (filters.dateFin) {
      filtered = filtered.filter(b => new Date(b.createdAt) <= new Date(filters.dateFin));
    }

    // Filtre par status
    if (filters.status) {
      if (filters.status === 'admis') {
        filtered = filtered.filter(b => b.moyenneFinale >= 10);
      } else if (filters.status === 'echec') {
        filtered = filtered.filter(b => b.moyenneFinale < 10);
      }
    }

    setFilteredBulletins(filtered);
    calculateStats(filtered);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      cours: '',
      semestre: '',
      professeur: '',
      etudiant: '',
      noteMin: '',
      noteMax: '',
      dateDebut: '',
      dateFin: '',
      status: ''
    });
    setFilteredBulletins(bulletins);
    calculateStats(bulletins);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, bulletins]);

  // Calculer la moyenne de classe pour un groupe
  const calculateClassAverage = (etudiants) => {
    const validNotes = etudiants.filter(e => e.note && !isNaN(e.note));
    if (validNotes.length === 0) return 'N/A';
    
    const total = validNotes.reduce((sum, e) => sum + parseFloat(e.note), 0);
    return (total / validNotes.length).toFixed(2);
  };

  // View group details
  const viewGroupDetails = (group) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
  };

  // Delete group
  const deleteGroup = async (group) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer tous les bulletins de "${group.cours}" (${group.professeur}) ?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const promises = group.etudiants.map(etudiant => 
        fetch(`http://195.179.229.230:5000/api/bulletins/${etudiant._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(promises);
      
      showNotification(`${group.etudiants.length} bulletin(s) supprimé(s) avec succès`);
      fetchBulletins();
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };
    const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      ['Étudiant', 'Professeur', 'Cours', 'Semestre', 'Moyenne', 'Status', 'Remarque', 'Date'].join(','),
      ...filteredBulletins.map(b => [
        getStudentName(b),
        getProfessorName(b),
        b.cours || 'N/A',
        b.semestre || 'N/A',
        b.moyenneFinale || 0,
        b.moyenneFinale >= 10 ? 'Admis' : 'Échec',
        (b.remarque || 'Aucune remarque').replace(/,/g, ';'),
        new Date(b.createdAt).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulletins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('Export réalisé avec succès');
  };

  // Get unique values for filters
  const uniqueCours = [...new Set(bulletins.map(b => b.cours).filter(Boolean))];
  const uniqueProfesseurs = [...new Set(bulletins.map(b => getProfessorName(b)).filter(name => name && name !== 'Professeur non défini' && name !== 'Nom non renseigné'))];

  // Grouper les bulletins filtrés
  const groupedBulletins = groupBulletins(filteredBulletins);
  
  // Pagination pour les groupes
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGroups = groupedBulletins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(groupedBulletins.length / itemsPerPage);

  return (
    <div style={styles.container}>
      {/* Notification */}      <Sidebar onLogout={handleLogout} />

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
            <h1 style={styles.title}>
              Gestion des Bulletins - Administration
            </h1>
     
          </div>
          <div style={styles.headerActions}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{
                ...styles.secondaryButton,
                backgroundColor: showFilters ? '#e0f2fe' : '#f3f4f6'
              }}
            >
              <Filter size={18} />
              Filtres {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button 
              onClick={fetchBulletins}
              style={styles.secondaryButton}
              disabled={loading}
            >
              <RefreshCw size={18} />
              Actualiser
            </button>
            <button 
              onClick={exportData}
              style={styles.exportButton}
              disabled={filteredBulletins.length === 0}
            >
              <Download size={18} />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <FileText size={24} color="#3b82f6" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.total}</div>
              <div style={styles.statLabel}>Total Bulletins</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <TrendingUp size={24} color="#10b981" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.admis}</div>
              <div style={styles.statLabel}>Étudiants Admis</div>
              <div style={styles.statPercentage}>
                {stats.total > 0 ? Math.round((stats.admis / stats.total) * 100) : 0}%
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <AlertCircle size={24} color="#ef4444" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.echecs}</div>
              <div style={styles.statLabel}>Échecs</div>
              <div style={styles.statPercentage}>
                {stats.total > 0 ? Math.round((stats.echecs / stats.total) * 100) : 0}%
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <BarChart3 size={24} color="#f59e0b" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.moyenneGenerale}</div>
              <div style={styles.statLabel}>Moyenne Générale</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <BookOpen size={24} color="#8b5cf6" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.coursUniques}</div>
              <div style={styles.statLabel}>Cours Différents</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <School size={24} color="#06b6d4" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.professeursUniques}</div>
              <div style={styles.statLabel}>Professeurs Actifs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
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
                  placeholder="Nom étudiant, professeur, classe, remarques..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <BookOpen size={16} />
                  Classe
                </label>
                <select
                  value={filters.cours}
                  onChange={(e) => handleFilterChange('cours', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Tous les classe</option>
                  {uniqueCours.map(cours => (
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
                  <User size={16} />
                  Professeur
                </label>
                <select
                  value={filters.professeur}
                  onChange={(e) => handleFilterChange('professeur', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Tous les professeurs</option>
                  {uniqueProfesseurs.map(prof => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Users size={16} />
                  Étudiant
                </label>
                <input
                  type="text"
                  placeholder="Nom de l'étudiant..."
                  value={filters.etudiant}
                  onChange={(e) => handleFilterChange('etudiant', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Star size={16} />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Tous</option>
                  <option value="admis">Admis seulement</option>
                  <option value="echec">Échecs seulement</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Note minimum</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  placeholder="0"
                  value={filters.noteMin}
                  onChange={(e) => handleFilterChange('noteMin', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Note maximum</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  placeholder="20"
                  value={filters.noteMax}
                  onChange={(e) => handleFilterChange('noteMax', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date début</label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date fin</label>
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
              <div style={styles.resultsInfo}>
                <span style={styles.resultsCount}>
                  {groupedBulletins.length} groupe(s) trouvé(s) - {filteredBulletins.length} bulletins
                </span>
                {filteredBulletins.length !== bulletins.length && (
                  <span style={styles.filterActive}>Filtres actifs</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={styles.content}>
        {loading ? (
          <div style={styles.loadingState}>
            <RefreshCw size={48} color="#3b82f6" />
            <p>Chargement des données...</p>
          </div>
        ) : groupedBulletins.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={64} color="#9ca3af" />
            <h3 style={styles.emptyTitle}>
              {bulletins.length === 0 ? 'Aucun bulletin trouvé' : 'Aucun résultat'}
            </h3>
            <p style={styles.emptyText}>
              {bulletins.length === 0 
                ? 'Les bulletins créés par les professeurs apparaîtront ici'
                : 'Essayez de modifier vos critères de recherche'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Groupes de Bulletins */}
            <div style={styles.groupedBulletins}>
              {currentGroups.map((group, index) => (
                <div key={index} style={styles.groupCard}>
                  <div style={styles.groupHeader}>
                    <div style={styles.groupInfo}>
                      <h3 style={styles.groupTitle}>
                        <School size={20} color="#3b82f6" />
                        {group.cours} - {group.semestre}
                      </h3>
                      <div style={styles.groupMeta}>
                        <span style={styles.groupProfessor}>
                          <User size={14} />
                          Professeur: {group.professeur}
                        </span>
                        <span style={styles.groupStudents}>
                          <Users size={14} />
                          {group.etudiants.length} étudiant(s)
                        </span>
                        <span style={styles.groupAverage}>
                          <Star size={14} />
                          Moyenne: {calculateClassAverage(group.etudiants)}/20
                        </span>
                        <span style={styles.groupRemarques}>
                          <MessageSquare size={14} />
                          {group.etudiants.filter(e => e.remarque && e.remarque.trim()).length} remarque(s)
                        </span>
                      </div>
                    </div>
                    <div style={styles.groupActions}>
                      <button
                        onClick={() => toggleGroupVisibility(group.key)}
                        style={{...styles.iconButton, color: hiddenGroups[group.key] ? '#6b7280' : '#3b82f6'}}
                        title={hiddenGroups[group.key] ? "Afficher les étudiants" : "Masquer les étudiants"}
                      >
                        {hiddenGroups[group.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => viewGroupDetails(group)}
                        style={{...styles.iconButton, color: '#059669'}}
                        title="Voir détails complets"
                      >
                        <Table size={16} />
                      </button>
                      <button
                        onClick={() => deleteGroup(group)}
                        style={{...styles.iconButton, color: '#ef4444'}}
                        title="Supprimer tout le groupe"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={styles.groupContent}>
                    <div style={styles.groupStats}>
                      <div style={styles.statItem}>
                        <TrendingUp size={16} color="#10b981" />
                        <span>Admis: {group.etudiants.filter(e => e.note >= 10).length}</span>
                      </div>
                      <div style={styles.statItem}>
                        <AlertCircle size={16} color="#ef4444" />
                        <span>Échecs: {group.etudiants.filter(e => e.note < 10).length}</span>
                      </div>
                      <div style={styles.statItem}>
                        <BarChart3 size={16} color="#f59e0b" />
                        <span>Note max: {Math.max(...group.etudiants.map(e => e.note || 0))}/20</span>
                      </div>
                      {group.dateCreation && (
                        <div style={styles.statItem}>
                          <Calendar size={16} />
                          <span>
                            Créé: {new Date(group.dateCreation).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tableau des étudiants avec remarques - masquable */}
                    {!hiddenGroups[group.key] && (
                      <div style={styles.studentsPreview}>
                        <div style={styles.studentsTable}>
                          <div style={styles.tableHeaderCompact}>
                            <span style={styles.headerCell}>Étudiant</span>
                            <span style={styles.headerCell}>Moyenne</span>
                            <span style={styles.headerCell}>Status</span>
                            <span style={styles.headerCell}>Remarque</span>
                            <span style={styles.headerCell}>Date</span>
                          </div>
                          {group.etudiants.map((etudiant, idx) => (
                            <div key={idx} style={styles.tableRowCompact}>
                              <span style={styles.studentName}>
                                <Users size={14} />
                                {etudiant.etudiantNom}
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
                              <span style={styles.remarqueCell}>
                                {etudiant.remarque && etudiant.remarque.trim() ? (
                                  <div style={styles.remarquePreview}>
                                    <MessageSquare size={12} color="#6b7280" />
                                    <span style={styles.remarqueText}>
                                      {etudiant.remarque.length > 30 
                                        ? `${etudiant.remarque.substring(0, 30)}...`
                                        : etudiant.remarque
                                      }
                                    </span>
                                  </div>
                                ) : (
                                  <span style={styles.noRemarque}>Aucune remarque</span>
                                )}
                              </span>
                              <span style={styles.dateText}>
                                {new Date(etudiant.dateCreation).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <div style={styles.paginationInfo}>
                  Affichage {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, groupedBulletins.length)} sur {groupedBulletins.length} groupes
                </div>
                <div style={styles.paginationButtons}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={styles.paginationButton}
                  >
                    Précédent
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          ...styles.paginationButton,
                          backgroundColor: currentPage === pageNum ? '#3b82f6' : 'white',
                          color: currentPage === pageNum ? 'white' : '#374151'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={styles.paginationButton}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal pour voir tous les détails d'un groupe */}
      {showDetailModal && selectedGroup && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <Table size={20} />
                Détails Complets - {selectedGroup.cours} ({selectedGroup.semestre})
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedGroup(null);
                }}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Informations du groupe */}
              <div style={styles.viewSection}>
                <h3 style={styles.viewSectionTitle}>
                  <User size={18} />
                  Informations du Groupe
                </h3>
                <div style={styles.groupInfoGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Professeur:</span>
                    <span style={styles.detailValue}>{selectedGroup.professeur}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Classe:</span>
                    <span style={styles.detailValue}>{selectedGroup.cours}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Semestre:</span>
                    <span style={styles.detailValue}>{selectedGroup.semestre}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Nombre d'étudiants:</span>
                    <span style={styles.detailValue}>{selectedGroup.etudiants.length}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Moyenne de classe:</span>
                    <span style={styles.detailValue}>{calculateClassAverage(selectedGroup.etudiants)}/20</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Remarques renseignées:</span>
                    <span style={styles.detailValue}>
                      {selectedGroup.etudiants.filter(e => e.remarque && e.remarque.trim()).length} / {selectedGroup.etudiants.length}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Date de création:</span>
                    <span style={styles.detailValue}>
                      {new Date(selectedGroup.dateCreation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistiques détaillées */}
              <div style={styles.viewSection}>
                <h3 style={styles.viewSectionTitle}>
                  <BarChart3 size={18} />
                  Statistiques Détaillées
                </h3>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{selectedGroup.etudiants.length}</div>
                    <div style={styles.statLabel}>Total Étudiants</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{selectedGroup.etudiants.filter(e => e.note >= 10).length}</div>
                    <div style={styles.statLabel}>Admis</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{selectedGroup.etudiants.filter(e => e.note < 10).length}</div>
                    <div style={styles.statLabel}>Échecs</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{calculateClassAverage(selectedGroup.etudiants)}</div>
                    <div style={styles.statLabel}>Moyenne</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{Math.max(...selectedGroup.etudiants.map(e => e.note || 0))}</div>
                    <div style={styles.statLabel}>Note Max</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statNumber}>{Math.min(...selectedGroup.etudiants.map(e => e.note || 0))}</div>
                    <div style={styles.statLabel}>Note Min</div>
                  </div>
                </div>
              </div>

              {/* Tableau complet des étudiants avec remarques */}
              <div style={styles.viewSection}>
                <h3 style={styles.viewSectionTitle}>
                  <Users size={18} />
                  Liste Complète des Étudiants ({selectedGroup.etudiants.length})
                </h3>
                <div style={styles.detailedTable}>
                  <table style={styles.viewTable}>
                    <thead>
                      <tr style={styles.viewTableHeader}>
                        <th style={styles.viewTableHeaderCell}>#</th>
                        <th style={styles.viewTableHeaderCell}>Étudiant</th>
                        <th style={styles.viewTableHeaderCell}>Moyenne</th>
                        <th style={styles.viewTableHeaderCell}>Status</th>
                        <th style={styles.viewTableHeaderCell}>Évaluations</th>
                        <th style={styles.viewTableHeaderCell}>Remarques du Professeur</th>
                        <th style={styles.viewTableHeaderCell}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroup.etudiants
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
                                <span>{etudiant.etudiantNom}</span>
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
                              {etudiant.notes && etudiant.notes.length > 0 ? (
                                <div style={styles.evaluationsList}>
                                  {etudiant.notes.map((note, i) => (
                                    <div key={i} style={styles.evaluationItem}>
                                      <span style={styles.evaluationTitle}>{note.titre}</span>
                                      <span style={styles.evaluationNote}>{note.note}/20</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={styles.noEvaluations}>Aucune évaluation</span>
                              )}
                            </td>
                            <td style={styles.viewTableCell}>
                              {etudiant.remarque && etudiant.remarque.trim() ? (
                                <div style={styles.remarqueDetailled}>
                                  <MessageSquare size={14} color="#3b82f6" />
                                  <span style={styles.remarqueFullText}>
                                    {etudiant.remarque}
                                  </span>
                                </div>
                              ) : (
                                <span style={styles.noRemarqueDetailed}>Aucune remarque</span>
                              )}
                            </td>
                            <td style={styles.viewTableCell}>
                              <span style={styles.dateText}>
                                {new Date(etudiant.dateCreation).toLocaleDateString('fr-FR')}
                              </span>
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
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  
  // Notification
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

  // Header

   header: {
    backgroundColor: 'white',
    borderBottom: '2px solid #e5e7eb',
    padding: '24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',          // Nouveau
    justifyContent: 'center'  // Nouveau
  },
  headerContent: {
    maxWidth: '1400px',
    width: '100%',           // Modifié
    display: 'flex',
    flexDirection: 'column', // Changé
    alignItems: 'center',    // Changé
    gap: '20px',
    textAlign: 'center'      // Nouveau
  },
  headerTitle: {
    width: '100%',          // Modifié
    display: 'flex',
    flexDirection: 'column', // Nouveau
    alignItems: 'center'    // Nouveau
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center' // Nouveau
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
    fontWeight: '400'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center' // Nouveau
  },

  // Statistics Section
  statsSection: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '24px'
  },
  statsGrid: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    backgroundColor: '#fefefe',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    lineHeight: 1,
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statPercentage: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px'
  },

  // Filters Section
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
  resultsInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  resultsCount: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  filterActive: {
    fontSize: '12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: '500'
  },

  // Content
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px'
  },

  // Grouped Bulletins
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
  groupProfessor: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#f3e8ff',
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
    backgroundColor: '#e0f2fe',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: '500'
  },
  groupAverage: {
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
  groupRemarques: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#e0e7ff',
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

  // Students Preview Table avec remarques
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
    gridTemplateColumns: '2fr 120px 120px 2fr 120px',
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
    gridTemplateColumns: '2fr 120px 120px 2fr 120px',
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
  remarqueCell: {
    display: 'flex',
    alignItems: 'center'
  },
  remarquePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f8fafc',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  remarqueText: {
    fontSize: '12px',
    color: '#374151',
    fontStyle: 'italic'
  },
  noRemarque: {
    color: '#9ca3af',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  dateText: {
    color: '#6b7280',
    fontSize: '13px'
  },

  // Pagination
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    padding: '16px 0'
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#6b7280'
  },
  paginationButtons: {
    display: 'flex',
    gap: '8px'
  },
  paginationButton: {
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Buttons
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
  exportButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
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

  // Form Elements
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
  select: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s ease'
  },

  // States
  loadingState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280'
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
  },

  // Modal
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
    maxWidth: '1200px',
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
    fontSize: '24px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease'
  },
  modalContent: {
    padding: '24px',
    maxHeight: 'calc(90vh - 140px)',
    overflowY: 'auto'
  },

  // Modal Detail Styles
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
  groupInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: '14px',
    color: '#111827',
    fontWeight: '500'
  },

  // Detailed Table
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
    verticalAlign: 'top'
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
  evaluationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  evaluationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    fontSize: '12px'
  },
  evaluationTitle: {
    color: '#6b7280',
    fontWeight: '500'
  },
  evaluationNote: {
    color: '#111827',
    fontWeight: '600'
  },
  noEvaluations: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic'
  },

  // Styles pour les remarques dans le modal détaillé
  remarqueDetailled: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#f0f9ff',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e0f2fe',
    maxWidth: '300px'
  },
  remarqueFullText: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.4',
    fontStyle: 'italic'
  },
  noRemarqueDetailed: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px'
  },

  // Responsive styles
  '@media (max-width: 768px)': {
    headerContent: {
      flexDirection: 'column',
      alignItems: 'stretch'
    },
    statsGrid: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px'
    },
    filtersGrid: {
      gridTemplateColumns: '1fr',
      gap: '12px'
    },
    groupMeta: {
      flexDirection: 'column',
      gap: '8px'
    },
    tableHeaderCompact: {
      gridTemplateColumns: '2fr 80px 80px 1fr 80px',
      gap: '8px',
      fontSize: '12px'
    },
    tableRowCompact: {
      gridTemplateColumns: '2fr 80px 80px 1fr 80px',
      gap: '8px'
    },
    remarquePreview: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '4px'
    },
    remarqueText: {
      fontSize: '11px'
    },
    pagination: {
      flexDirection: 'column',
      gap: '12px'
    },
    groupInfoGrid: {
      gridTemplateColumns: '1fr',
      gap: '8px'
    },
    viewTableHeaderCell: {
      padding: '12px 8px',
      fontSize: '12px'
    },
    viewTableCell: {
      padding: '12px 8px',
      fontSize: '12px'
    },
    remarqueDetailled: {
      maxWidth: 'none',
      width: '100%'
    }
  }
};

export default AdminBulletins;