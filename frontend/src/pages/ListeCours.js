import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Download, Clock, GraduationCap, Briefcase } from 'lucide-react';
import Sidebar from '../components/Sidebar'; // ✅ استيراد صحيح

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

  const getNombreEtudiants = (nomCours, regimeFormation = null) => {
    return etudiants.filter(e => {
      if (e.anneeScolaire !== '2025/2026') {
        return false;
      }
      
      const coursEtudiant = e.cours;
      let isInCours = false;
      
      if (Array.isArray(coursEtudiant)) {
        isInCours = coursEtudiant.includes(nomCours);
      } else if (typeof coursEtudiant === 'string') {
        isInCours = coursEtudiant.split(',').map(s => s.trim()).includes(nomCours);
      }
      
      if (!isInCours) return false;
      
      if (regimeFormation) {
        const coursNameLower = nomCours.toLowerCase();
        const isTA = coursNameLower.includes(' ta');
        
        if (regimeFormation === 'TA') {
          return isTA;
        } else if (regimeFormation === 'FI') {
          return !isTA;
        }
      }
      
      return true;
    }).length;
  };

  const getNombreReinscriptions = (nomCours, regimeFormation = null) => {
    return etudiants.filter(e => {
      if (e.anneeScolaire !== '2025/2026') {
        return false;
      }

      // Filter for re-enrollments only
      if (e.nouvelleInscription !== false) {
        return false;
      }
      
      const coursEtudiant = e.cours;
      let isInCours = false;
      
      if (Array.isArray(coursEtudiant)) {
        isInCours = coursEtudiant.includes(nomCours);
      } else if (typeof coursEtudiant === 'string') {
        isInCours = coursEtudiant.split(',').map(s => s.trim()).includes(nomCours);
      }
      
      if (!isInCours) return false;
      
      if (regimeFormation) {
        const coursNameLower = nomCours.toLowerCase();
        const isTA = coursNameLower.includes(' ta');
        
        if (regimeFormation === 'TA') {
          return isTA;
        } else if (regimeFormation === 'FI') {
          return !isTA;
        }
      }
      
      return true;
    }).length;
  };

  const isLicenceProOrMasterPro = (nomCours) => {
    const coursLower = nomCours.toLowerCase();
    return coursLower.includes('licence pro') || coursLower.includes('master pro');
  };

  const exportToExcel = (typeTable, regimeFormation = null) => {
    let worksheetData = [];
    let filteredCours = [];

    if (typeTable === 'licence_master') {
      worksheetData = [["Nom du Cours", "Nombre d'Étudiants", "Réinscriptions", "Executive"]];
      filteredCours = cours.filter(c => {
        const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
        const nombreEtudiants = getNombreEtudiants(c.nom);
        return isLicenceMaster && nombreEtudiants > 0;
      });
    } else {
      worksheetData = [["Nom du Cours", "Régime de Formation", "Nombre d'Étudiants", "Réinscriptions"]];
      filteredCours = cours.filter(c => {
        const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
        const nombreEtudiants = getNombreEtudiants(c.nom, regimeFormation);
        return !isLicenceMaster && nombreEtudiants > 0;
      });
    }

    filteredCours.forEach(c => {
      if (typeTable === 'licence_master') {
        const nombreEtudiants = getNombreEtudiants(c.nom);
        const nombreReinscriptions = getNombreReinscriptions(c.nom);
        const coursNameLower = c.nom.toLowerCase();
        const isExecutive = coursNameLower.includes('executive') || coursNameLower.includes('exécutif');
        worksheetData.push([c.nom, nombreEtudiants, nombreReinscriptions, isExecutive ? 'Oui' : 'Non']);
      } else {
        const nombreEtudiants = getNombreEtudiants(c.nom, regimeFormation);
        const nombreReinscriptions = getNombreReinscriptions(c.nom, regimeFormation);
        worksheetData.push([c.nom, regimeFormation, nombreEtudiants, nombreReinscriptions]);
      }
    });

    try {
      if (typeof window.XLSX === 'undefined') {
        alert('La bibliothèque Excel n\'est pas chargée.');
        return;
      }

      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.aoa_to_sheet(worksheetData);

      ws['!cols'] = typeTable === 'licence_master' 
        ? [{ wch: 60 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
        : [{ wch: 50 }, { wch: 25 }, { wch: 20 }, { wch: 15 }];

      const sheetName = typeTable === 'licence_master' 
        ? 'Licences & Masters Pro'
        : `Cours ${regimeFormation}`;
      
      window.XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const fileName = typeTable === 'licence_master'
        ? `licences_masters_pro_${dateStr}.xlsx`
        : `cours_${regimeFormation}_${dateStr}.xlsx`;

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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    mainContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem 1rem'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      padding: '1.5rem',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    iconBox: {
      padding: '0.75rem',
      borderRadius: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    taIcon: {
      background: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    fiIcon: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    },
    licenceMasterIcon: {
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    exportButton: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      fontSize: '0.95rem'
    },
    tableContainer: {
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      marginBottom: '3rem'
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
    thCenter: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
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
    td: {
      padding: '1rem 1.5rem',
      color: '#1f2937',
      borderRight: '1px solid #f1f5f9'
    },
    tdCenter: {
      padding: '1rem 1.5rem',
      textAlign: 'center',
      color: '#1f2937',
      borderRight: '1px solid #f1f5f9'
    },
    tdLast: {
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
    regimeBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-block'
    },
    taBadge: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    fiBadge: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    executiveBadge: {
      backgroundColor: '#f3e8ff',
      color: '#6b21a8',
      padding: '0.25rem 0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
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
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      color: '#6b7280'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={handleLogout} />
        <div style={styles.loadingContainer}>
          Chargement des données...
        </div>
      </div>
    );
  }

  const renderTableTA = () => {
    const regimeFormation = 'TA';
    const filteredCours = cours.filter(c => {
      const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
      return !isLicenceMaster && getNombreEtudiants(c.nom, regimeFormation) > 0;
    });
    
    const total = filteredCours.reduce((sum, c) => sum + getNombreEtudiants(c.nom, regimeFormation), 0);
    const totalReinscriptions = filteredCours.reduce((sum, c) => sum + getNombreReinscriptions(c.nom, regimeFormation), 0);

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <div style={{...styles.iconBox, ...styles.taIcon}}>
              <Clock size={24} color="white" />
            </div>
            <span>Temps Aménagé (TA)</span>
          </div>
          <button
            onClick={() => exportToExcel('ta', regimeFormation)}
            style={styles.exportButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Download size={18} />
            Exporter Excel
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Nom du Cours</th>
                <th style={styles.thCenter}>Régime</th>
                <th style={styles.thCenter}>Nombre d'Étudiants</th>
                <th style={styles.thLast}>Réinscriptions</th>
              </tr>
            </thead>
            <tbody style={styles.tbody}>
              {filteredCours.map((c, index) => {
                const nombreEtudiants = getNombreEtudiants(c.nom, regimeFormation);
                const nombreReinscriptions = getNombreReinscriptions(c.nom, regimeFormation);
                
                return (
                  <tr 
                    key={`${c._id || index}-${regimeFormation}`}
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
                      <span style={{...styles.regimeBadge, ...styles.taBadge}}>
                        TA
                      </span>
                    </td>
                    <td style={styles.tdCenter}>
                      <div style={styles.studentBadge}>
                        <Users size={12} />
                        {nombreEtudiants}
                      </div>
                    </td>
                    <td style={styles.tdLast}>
                      <div style={styles.studentBadge}>
                        <Users size={12} />
                        {nombreReinscriptions}
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr style={styles.totalRow}>
                <td style={styles.totalLabel} colSpan="2">
                  Total ({filteredCours.length} cours)
                </td>
                <td style={styles.totalValue}>
                  {total} étudiants
                </td>
                <td style={styles.totalValue}>
                  {totalReinscriptions} réinscriptions
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTableFI = () => {
    const regimeFormation = 'FI';
    const filteredCours = cours.filter(c => {
      const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
      return !isLicenceMaster && getNombreEtudiants(c.nom, regimeFormation) > 0;
    });
    
    const total = filteredCours.reduce((sum, c) => sum + getNombreEtudiants(c.nom, regimeFormation), 0);
    const totalReinscriptions = filteredCours.reduce((sum, c) => sum + getNombreReinscriptions(c.nom, regimeFormation), 0);

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <div style={{...styles.iconBox, ...styles.fiIcon}}>
              <GraduationCap size={24} color="white" />
            </div>
            <span>Formation Initiale (FI)</span>
          </div>
          <button
            onClick={() => exportToExcel('fi', regimeFormation)}
            style={styles.exportButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Download size={18} />
            Exporter Excel
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Nom du Cours</th>
                <th style={styles.thCenter}>Régime</th>
                <th style={styles.thCenter}>Nombre d'Étudiants</th>
                <th style={styles.thLast}>Réinscriptions</th>
              </tr>
            </thead>
            <tbody style={styles.tbody}>
              {filteredCours.map((c, index) => {
                const nombreEtudiants = getNombreEtudiants(c.nom, regimeFormation);
                const nombreReinscriptions = getNombreReinscriptions(c.nom, regimeFormation);
                
                return (
                  <tr 
                    key={`${c._id || index}-${regimeFormation}`}
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
                      <span style={{...styles.regimeBadge, ...styles.fiBadge}}>
                        FI
                      </span>
                    </td>
                    <td style={styles.tdCenter}>
                      <div style={styles.studentBadge}>
                        <Users size={12} />
                        {nombreEtudiants}
                      </div>
                    </td>
                    <td style={styles.tdLast}>
                      <div style={styles.studentBadge}>
                        <Users size={12} />
                        {nombreReinscriptions}
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr style={styles.totalRow}>
                <td style={styles.totalLabel} colSpan="2">
                  Total ({filteredCours.length} cours)
                </td>
                <td style={styles.totalValue}>
                  {total} étudiants
                </td>
                <td style={styles.totalValue}>
                  {totalReinscriptions} réinscriptions
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTableLicenceMaster = () => {
    const filteredCours = cours.filter(c => {
      const isLicenceMaster = isLicenceProOrMasterPro(c.nom);
      return isLicenceMaster && getNombreEtudiants(c.nom) > 0;
    });
    
    const total = filteredCours.reduce((sum, c) => sum + getNombreEtudiants(c.nom), 0);
    const totalReinscriptions = filteredCours.reduce((sum, c) => sum + getNombreReinscriptions(c.nom), 0);

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <div style={{...styles.iconBox, ...styles.licenceMasterIcon}}>
              <Briefcase size={24} color="white" />
            </div>
            <span>Licences Pro & Masters Pro</span>
          </div>
          <button
            onClick={() => exportToExcel('licence_master')}
            style={styles.exportButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Download size={18} />
            Exporter Excel
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Nom du Cours</th>
                <th style={styles.thCenter}>Nombre d'Étudiants</th>
                <th style={styles.thCenter}>Réinscriptions</th>
                <th style={styles.thLast}>Executive</th>
              </tr>
            </thead>
            <tbody style={styles.tbody}>
              {filteredCours.map((c, index) => {
                const nombreEtudiants = getNombreEtudiants(c.nom);
                const nombreReinscriptions = getNombreReinscriptions(c.nom);
                const coursNameLower = c.nom.toLowerCase();
                const isExecutive = coursNameLower.includes('executive') || coursNameLower.includes('exécutif');
                
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
                    <td style={styles.tdCenter}>
                      <div style={styles.studentBadge}>
                        <Users size={12} />
                        {nombreReinscriptions}
                      </div>
                    </td>
                    <td style={styles.tdLast}>
                      <span style={styles.executiveBadge}>
                        <Briefcase size={12} />
                        {isExecutive ? 'Oui' : 'Non'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr style={styles.totalRow}>
                <td style={styles.totalLabel}>
                  Total ({filteredCours.length} cours)
                </td>
                <td style={styles.totalValue}>
                  {total} étudiants
                </td>
                <td style={styles.totalValue}>
                  {totalReinscriptions} réinscriptions
                </td>
                <td style={styles.totalValue}>
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      <div style={styles.mainContent}>
        {renderTableFI()}
        {renderTableTA()}
        {renderTableLicenceMaster()}
      </div>
    </div>
  );
};

export default TableCours;