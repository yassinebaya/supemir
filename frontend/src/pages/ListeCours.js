import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const TableCours = () => {
  const [cours, setCours] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const resCours = await fetch('http://195.179.229.230:5000/api/cours', config);
        const resEtudiants = await fetch('http://195.179.229.230:5000/api/etudiants', config);

        if (resCours.ok && resEtudiants.ok) {
          const coursData = await resCours.json();
          const etudiantsData = await resEtudiants.json();
          
          setCours(coursData);
          setEtudiants(etudiantsData);
        }
      } catch (err) {
        console.error('Erreur de chargement:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour compter les étudiants dans chaque cours (exclut ceux avec prixTotal = 0 et filtre par année scolaire)
  const getNombreEtudiants = (nomCours) => {
    return etudiants.filter(e => {
      // Vérifier d'abord si l'étudiant a un prixTotal > 0
      if (e.prixTotal === 0 || e.prixTotal === null || e.prixTotal === undefined) {
        return false;
      }
      
      // Vérifier si l'étudiant est de l'année scolaire 2025/2026
      if (e.anneeScolaire !== '2025/2026') {
        return false;
      }
      
      // Puis vérifier si l'étudiant est inscrit dans ce cours
      const coursEtudiant = e.cours;
      if (Array.isArray(coursEtudiant)) {
        return coursEtudiant.includes(nomCours);
      }
      if (typeof coursEtudiant === 'string') {
        return coursEtudiant.split(',').map(s => s.trim()).includes(nomCours);
      }
      return false;
    }).length;
  };

  // Fonction pour exporter en Excel
  const exportToExcel = () => {
    const worksheetData = [
      ["Nom du Cours", "Nombre d'Étudiants"]
    ];

    cours.forEach(c => {
      const nombreEtudiants = getNombreEtudiants(c.nom);
      worksheetData.push([c.nom, nombreEtudiants]);
    });

    try {
      if (typeof window.XLSX === 'undefined') {
        alert('La bibliothèque Excel n\'est pas chargée.');
        return;
      }

      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.aoa_to_sheet(worksheetData);

      ws['!cols'] = [
        { wch: 30 }, // Nom du cours
        { wch: 20 }  // Nombre d'étudiants
      ];

      window.XLSX.utils.book_append_sheet(wb, ws, 'Cours');

      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const fileName = `cours_${dateStr}.xlsx`;

      window.XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erreur lors de l\'exportation Excel:', error);
      alert('Erreur lors de l\'exportation du fichier Excel.');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    header: {
      backdropFilter: 'blur(10px)',
      backgroundColor: 'white',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    iconContainer: {
      padding: '0.75rem',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      borderRadius: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #1f2937, #4b5563)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: '0'
    },
    exportButton: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      fontSize: '1rem'
    },
    tableContainer: {
      backdropFilter: 'blur(10px)',
      backgroundColor: 'white',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.875rem'
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0'
    },
    th: {
      padding: '1rem 1.5rem',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderRight: '1px solid #e2e8f0'
    },
    thLast: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      fontWeight: '600',
      color: '#374151'
    },
    tbody: {
      backgroundColor: 'white'
    },
    tr: {
      borderBottom: '1px solid #f1f5f9',
      transition: 'background-color 0.2s ease'
    },
    trHover: {
      backgroundColor: '#f8fafc'
    },
    td: {
      padding: '1rem 1.5rem',
      color: '#1f2937',
      borderRight: '1px solid #f1f5f9'
    },
    tdCenter: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      color: '#1f2937'
    },
    coursName: {
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    studentBadge: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      color: '#6b7280'
    },
    emptyContainer: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6b7280'
    },
    totalRow: {
      backgroundColor: '#f1f5f9',
      fontWeight: '600',
      borderTop: '2px solid #e2e8f0'
    },
    totalLabel: {
      padding: '1rem 1.5rem',
      color: '#374151',
      fontWeight: '600',
      borderRight: '1px solid #e2e8f0'
    },
    totalValue: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      color: '#374151',
      fontWeight: '600'
    }
  };

  const totalEtudiants = cours.reduce((total, c) => total + getNombreEtudiants(c.nom), 0);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          Chargement des données...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconContainer}>
              <BookOpen size={24} color="white" />
            </div>
            <h1 style={styles.title}>Table des Cours</h1>
          </div>
          <button
            onClick={exportToExcel}
            style={styles.exportButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Download size={20} />
            Exporter Excel
          </button>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {cours.length === 0 ? (
            <div style={styles.emptyContainer}>
              <BookOpen size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                Aucun cours disponible
              </h3>
              <p style={{ color: '#9ca3af' }}>Ajoutez des cours pour voir les statistiques</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.th}>Nom du Cours</th>
                  <th style={styles.thLast}>Nombre d'Étudiants</th>
                </tr>
              </thead>
              <tbody style={styles.tbody}>
                {cours.map((c, index) => {
                  const nombreEtudiants = getNombreEtudiants(c.nom);
                  return (
                    <tr 
                      key={c._id || index}
                      style={styles.tr}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={styles.td}>
                        <div style={styles.coursName}>
                          <BookOpen size={16} color="#6b7280" />
                          {c.nom}
                        </div>
                      </td>
                      <td style={styles.tdCenter}>
                        <div style={styles.studentBadge}>
                          <Users size={12} />
                          {nombreEtudiants}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Ligne de total */}
                <tr style={styles.totalRow}>
                  <td style={styles.totalLabel}>
                    Total ({cours.length} cours)
                  </td>
                  <td style={styles.totalValue}>
                    {totalEtudiants} étudiants
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableCours;