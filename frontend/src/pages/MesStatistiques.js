import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Book,
  Download,
  BarChart3
} from 'lucide-react';

const MesStatistiques = () => {
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear()
  });
  const [viewMode, setViewMode] = useState('mensuel'); // 'mensuel' ou 'annuel'
  const [message, setMessage] = useState({ type: '', text: '' });

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    fetchRapport();
  }, [selectedPeriod, viewMode]);

  const fetchRapport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (viewMode === 'mensuel') {
        params.append('mois', selectedPeriod.mois);
      }
      params.append('annee', selectedPeriod.annee);
      
      const res = await fetch(
        `http://195.179.229.230:5000/api/professeurs/mon-rapport?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.ok) {
        const data = await res.json();
        setRapport(data);
        setMessage({ 
          type: 'success', 
          text: `Statistiques chargées pour ${viewMode === 'mensuel' ? mois[selectedPeriod.mois - 1] : ''} ${selectedPeriod.annee}` 
        });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement des statistiques' });
      }
    } catch (err) {
      console.error('Erreur statistiques:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const downloadRapport = () => {
    if (!rapport) return;

    const prof = rapport.professeur;
    const stats = rapport.statistiques;
    
    let content = '';
    content += `Mes Statistiques - ${prof.nom}\n`;
    content += `Période: ${viewMode === 'mensuel' ? mois[selectedPeriod.mois - 1] : 'Année'} ${selectedPeriod.annee}\n`;
    content += `Type: ${prof.estPermanent ? 'Permanent' : 'Entrepreneur'}\n\n`;
    
    content += `RESUME\n`;
    content += `Total Heures: ${stats.totalHeures}h\n`;
    content += `Total Séances: ${stats.totalSeances}\n`;
    content += `Cours Différents: ${stats.coursUniques}\n`;
    content += `Matières Différentes: ${stats.matieresUniques}\n`;
    content += `Moyenne Heures/Jour: ${stats.moyenneHeuresParJour}h\n`;
    
    if (!prof.estPermanent) {
      content += `Tarif Horaire: ${stats.tarifHoraire} DH/h\n`;
      content += `Total Gagné: ${stats.totalAPayer.toFixed(2)} DH\n`;
    }
    content += `\n`;
    
    // Répartition par jour
    content += `REPARTITION PAR JOUR\n`;
    Object.entries(stats.repartitionJours).forEach(([jour, heures]) => {
      content += `${jour}: ${heures}h\n`;
    });
    content += `\n`;
    
    // Détail des séances
    if (rapport.seances && rapport.seances.length > 0) {
      content += `DETAIL DES SEANCES\n`;
      content += `Jour;Heure Début;Heure Fin;Cours;Matière;Salle;Durée\n`;
      
      rapport.seances.forEach(seance => {
        content += `${seance.jour};${seance.heureDebut};${seance.heureFin};${seance.cours};${seance.matiere || ''};${seance.salle || ''};${seance.dureeHeures}h\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mes_stats_${viewMode}_${selectedPeriod.mois || 'annee'}_${selectedPeriod.annee}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({ type: 'success', text: 'Rapport téléchargé avec succès !' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      textAlign: 'center'
    },
    controls: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    controlRow: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      marginBottom: '15px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#059669',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      fontWeight: '500'
    },
    buttonWarning: {
      backgroundColor: '#f59e0b'
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statCard: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#059669'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6b7280',
      marginTop: '5px'
    },
    entrepreneurInfo: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      border: '2px solid #f59e0b'
    },
    permanentInfo: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      border: '2px solid #059669'
    },
    repartitionContainer: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    dayBar: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px'
    },
    dayLabel: {
      width: '100px',
      fontSize: '14px',
      fontWeight: '500'
    },
    barContainer: {
      flex: 1,
      height: '20px',
      backgroundColor: '#f3f4f6',
      borderRadius: '10px',
      overflow: 'hidden',
      marginRight: '10px'
    },
    bar: {
      height: '100%',
      backgroundColor: '#059669',
      borderRadius: '10px',
      transition: 'width 0.3s ease'
    },
    barValue: {
      fontSize: '12px',
      fontWeight: '500',
      color: '#374151'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    th: {
      backgroundColor: '#f8fafc',
      padding: '12px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '2px solid #e5e7eb'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e5e7eb'
    },
    message: {
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    successMessage: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0'
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1f2937' }}>
          <BarChart3 size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Mes Statistiques d'Enseignement
        </h1>
      </div>

      {/* Contrôles */}
      <div style={styles.controls}>
        <div style={styles.controlRow}>
          <select
            style={styles.select}
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="mensuel">Vue Mensuelle</option>
            <option value="annuel">Vue Annuelle</option>
          </select>

          {viewMode === 'mensuel' && (
            <select
              style={styles.select}
              value={selectedPeriod.mois}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
            >
              {mois.map((m, index) => (
                <option key={index} value={index + 1}>{m}</option>
              ))}
            </select>
          )}

          <select
            style={styles.select}
            value={selectedPeriod.annee}
            onChange={(e) => setSelectedPeriod(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <button
            style={styles.button}
            onClick={fetchRapport}
            disabled={loading}
          >
            <TrendingUp size={16} />
            Actualiser
          </button>

          <button
            style={{ ...styles.button, ...styles.buttonWarning }}
            onClick={downloadRapport}
            disabled={!rapport}
          >
            <Download size={16} />
            Télécharger
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.errorMessage : styles.successMessage)
        }}>
          {message.text}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Chargement de vos statistiques...
        </div>
      )}

      {rapport && !loading && (
        <>
          {/* Informations du professeur */}
          <div style={rapport.professeur.estPermanent ? styles.permanentInfo : styles.entrepreneurInfo}>
            <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
              {rapport.professeur.nom}
            </h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: rapport.professeur.estPermanent ? '#d1fae5' : '#fef3c7',
                color: rapport.professeur.estPermanent ? '#065f46' : '#92400e',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {rapport.professeur.estPermanent ? 'Professeur Permanent' : 'Entrepreneur'}
              </span>
              {!rapport.professeur.estPermanent && (
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Tarif: {rapport.professeur.tarifHoraire} DH/heure
                </span>
              )}
            </div>
          </div>

          {/* Statistiques principales */}
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{rapport.statistiques.totalHeures}h</div>
              <div style={styles.statLabel}>
                <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Total Heures
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{rapport.statistiques.totalSeances}</div>
              <div style={styles.statLabel}>
                <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Séances
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{rapport.statistiques.coursUniques}</div>
              <div style={styles.statLabel}>
                <Book size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Cours Différents
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{rapport.statistiques.moyenneHeuresParJour}h</div>
              <div style={styles.statLabel}>
                <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                Moyenne/Jour
              </div>
            </div>
            {!rapport.professeur.estPermanent && (
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{rapport.statistiques.totalAPayer.toFixed(2)} DH</div>
                <div style={styles.statLabel}>
                  <DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                  Total Gagné
                </div>
              </div>
            )}
          </div>

          {/* Répartition par jour */}
          {Object.keys(rapport.statistiques.repartitionJours).length > 0 && (
            <div style={styles.repartitionContainer}>
              <h4 style={{ margin: '0 0 20px 0', color: '#374151' }}>
                Répartition des Heures par Jour
              </h4>
              {Object.entries(rapport.statistiques.repartitionJours).map(([jour, heures]) => {
                const maxHeures = Math.max(...Object.values(rapport.statistiques.repartitionJours));
                const percentage = maxHeures > 0 ? (heures / maxHeures) * 100 : 0;
                
                return (
                  <div key={jour} style={styles.dayBar}>
                    <div style={styles.dayLabel}>{jour}</div>
                    <div style={styles.barContainer}>
                      <div style={{ ...styles.bar, width: `${percentage}%` }}></div>
                    </div>
                    <div style={styles.barValue}>{heures}h</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Détail des séances (pour vue mensuelle) */}
          {viewMode === 'mensuel' && rapport.seances && rapport.seances.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                Détail de Mes Séances - {mois[selectedPeriod.mois - 1]} {selectedPeriod.annee}
              </h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Jour</th>
                    <th style={styles.th}>Horaire</th>
                    <th style={styles.th}>Cours</th>
                    <th style={styles.th}>Matière</th>
                    <th style={styles.th}>Salle</th>
                    <th style={styles.th}>Durée</th>
                    {!rapport.professeur.estPermanent && <th style={styles.th}>Montant</th>}
                  </tr>
                </thead>
                <tbody>
                  {rapport.seances.map((seance, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{seance.jour}</td>
                      <td style={styles.td}>{seance.heureDebut} - {seance.heureFin}</td>
                      <td style={styles.td}>{seance.cours}</td>
                      <td style={styles.td}>{seance.matiere || '-'}</td>
                      <td style={styles.td}>{seance.salle || '-'}</td>
                      <td style={styles.td}>{seance.dureeHeures}h</td>
                      {!rapport.professeur.estPermanent && (
                        <td style={styles.td}>
                          {(seance.dureeHeures * rapport.professeur.tarifHoraire).toFixed(2)} DH
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Résumé pour vue annuelle */}
          {viewMode === 'annuel' && (
            <div style={styles.repartitionContainer}>
              <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                Résumé Annuel {selectedPeriod.annee}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
                    Heures Total Année
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                    {rapport.statistiques.totalHeures}h
                  </div>
                </div>
                
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
                    Séances Total Année
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                    {rapport.statistiques.totalSeances}
                  </div>
                </div>
                
                {!rapport.professeur.estPermanent && (
                  <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
                      Total Gagné Année
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                      {rapport.statistiques.totalAPayer.toFixed(2)} DH
                    </div>
                  </div>
                )}
                
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
                    Moyenne Heures/Mois
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                    {(rapport.statistiques.totalHeures / 12).toFixed(1)}h
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!rapport && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Aucune donnée disponible pour cette période
        </div>
      )}
    </div>
  );
};

export default MesStatistiques;