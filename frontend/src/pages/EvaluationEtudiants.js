import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Search,
  Eye,
  Edit,
  Plus,
  AlertCircle,
  Calendar,
  UserCheck,
  GraduationCap,
  Phone,
  Mail
} from "lucide-react";
import Sidebar from '../components/sidberadmin';


const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const EvaluationEtudiants = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [etudiantsFiltres, setEtudiantsFiltres] = useState([]);
  const [commerciaux, setCommerciaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreCommercial, setFiltreCommercial] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [etudiantSelectionne, setEtudiantSelectionne] = useState(null);
  const [evaluationDetails, setEvaluationDetails] = useState(null);
  const [evaluationForm, setEvaluationForm] = useState({
    documents: {},
    commentaireGeneral: ''
  });
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [messageEvaluation, setMessageEvaluation] = useState('');

  // Documents avec leurs descriptions
  const documentsConfig = [
    { key: 'photo', label: 'Photo', description: 'Photo d\'identité de l\'étudiant' },
    { key: 'cin', label: 'CIN', description: 'Carte d\'identité nationale' },
    { key: 'passeport', label: 'Passeport', description: 'Copie du passeport' },
    { key: 'bac', label: 'Baccalauréat', description: 'Diplôme du baccalauréat' },
    { key: 'releveNote', label: 'Relevé de notes', description: 'Relevé de notes principal' },
    { key: 'diplome', label: 'Diplôme', description: 'Diplôme d\'accès' },
    { key: 'attestationReussite', label: 'Attestation de réussite', description: 'Attestation de réussite' },
    { key: 'releveNote1', label: 'Relevé de notes 1', description: 'Premier relevé de notes' },
    { key: 'releveNote2', label: 'Relevé de notes 2', description: 'Deuxième relevé de notes' },
    { key: 'releveNote3', label: 'Relevé de notes 3', description: 'Troisième relevé de notes' },
    { key: 'premiereMasterIngenieur', label: '1ère Master/Ingénieur', description: 'Première année Master/Ingénieur' },
    { key: 'deuxiemeMasterIngenieur', label: '2ème Master/Ingénieur', description: 'Deuxième année Master/Ingénieur' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const filtrerEtudiants = useCallback(() => {
    let resultats = etudiants;

    if (recherche) {
      resultats = resultats.filter(e => {
        const nomComplet = `${e.prenom || ''} ${e.nomDeFamille || ''}`.toLowerCase();
        return (
          nomComplet.includes(recherche.toLowerCase()) ||
          (e.email && e.email.toLowerCase().includes(recherche.toLowerCase())) ||
          (e.telephone && e.telephone.includes(recherche)) ||
          (e.codeEtudiant && e.codeEtudiant.toLowerCase().includes(recherche.toLowerCase()))
        );
      });
    }

    if (filtreCommercial) {
      resultats = resultats.filter(e => e.commercial && e.commercial._id === filtreCommercial);
    }

    if (filtreStatut) {
      if (filtreStatut === 'pas_evaluation') {
        resultats = resultats.filter(e => !e.evaluationExistante);
      } else {
        resultats = resultats.filter(e => 
          e.evaluationExistante?.statutEvaluation === filtreStatut
        );
      }
    }

    setEtudiantsFiltres(resultats);
  }, [etudiants, recherche, filtreCommercial, filtreStatut]);

  useEffect(() => {
    filtrerEtudiants();
  }, [etudiants, recherche, filtreCommercial, filtreStatut, filtrerEtudiants]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Récupérer les étudiants avec évaluations
      const resEtudiants = await axios.get('http://195.179.229.230:5000/api/etudiants-evaluation', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filtrer uniquement les étudiants de l'année 2025/2026
      const etudiantsFiltered = resEtudiants.data.filter(
        etudiant => etudiant.anneeScolaire === '2025/2026'
      );
      
      setEtudiants(etudiantsFiltered);

      // Récupérer les commerciaux
      const resCommerciaux = await axios.get('http://195.179.229.230:5000/api/commerciaux', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommerciaux(resCommerciaux.data);

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setLoading(false);
    }
  };

  const voirDetails = async (etudiant) => {
    if (!etudiant.evaluationExistante) return;
    
    setEtudiantSelectionne(etudiant);
    setLoadingEvaluation(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://195.179.229.230:5000/api/evaluation/${etudiant.evaluationExistante._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEvaluationDetails(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      alert('Erreur lors du chargement des détails de l\'évaluation');
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const ouvrirEvaluation = async (etudiant) => {
    setEtudiantSelectionne(etudiant);
    
    // Si une évaluation existe déjà et n'est pas finalisée, la charger
    if (etudiant.evaluationExistante && etudiant.evaluationExistante.statutEvaluation === 'en_cours') {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://195.179.229.230:5000/api/evaluation/${etudiant.evaluationExistante._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setEvaluationForm({
          documents: res.data.documents || {},
          commentaireGeneral: res.data.commentaireGeneral || ''
        });
      } catch (err) {
        console.error('Erreur lors du chargement de l\'évaluation:', err);
        resetEvaluationForm();
      }
    } else {
      resetEvaluationForm();
    }
    
    setShowEvaluationModal(true);
  };

  const resetEvaluationForm = () => {
    const emptyDocuments = {};
    documentsConfig.forEach(doc => {
      emptyDocuments[doc.key] = { valide: false, commentaire: '' };
    });
    
    setEvaluationForm({
      documents: emptyDocuments,
      commentaireGeneral: ''
    });
  };

  const handleDocumentChange = (docKey, field, value) => {
    setEvaluationForm(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: {
          ...prev.documents[docKey] || { valide: false, commentaire: '' },
          [field]: value
        }
      }
    }));
  };

  const sauvegarderEvaluation = async () => {
    try {
      setLoadingEvaluation(true);
      const token = localStorage.getItem('token');

      let url, method;
      if (etudiantSelectionne.evaluationExistante && etudiantSelectionne.evaluationExistante.statutEvaluation === 'en_cours') {
        // Mettre à jour évaluation existante
        url = `http://195.179.229.230:5000/api/evaluation/${etudiantSelectionne.evaluationExistante._id}`;
        method = 'put';
      } else {
        // Créer nouvelle évaluation
        url = `http://195.179.229.230:5000/api/evaluations/${etudiantSelectionne._id}`;
        method = 'post';
      }

      await axios[method](url, evaluationForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessageEvaluation('✅ Évaluation sauvegardée avec succès');
      
      // Actualiser les données
      await fetchData();
      
      setTimeout(() => {
        setShowEvaluationModal(false);
        setMessageEvaluation('');
      }, 2000);

    } catch (err) {
      setMessageEvaluation('❌ Erreur lors de la sauvegarde: ' + (err.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const finaliserEvaluation = async (statut) => {
    try {
      setLoadingEvaluation(true);
      const token = localStorage.getItem('token');

      let evaluationId = etudiantSelectionne.evaluationExistante?._id;
      
      // Si pas d'évaluation existante, la créer d'abord
      if (!evaluationId) {
        const createRes = await axios.post(
          `http://195.179.229.230:5000/api/evaluations/${etudiantSelectionne._id}`,
          evaluationForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        evaluationId = createRes.data._id;
      } else if (etudiantSelectionne.evaluationExistante.statutEvaluation === 'en_cours') {
        // Sauvegarder les changements d'abord
        await axios.put(
          `http://195.179.229.230:5000/api/evaluation/${evaluationId}`,
          evaluationForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Finaliser l'évaluation
      await axios.put(
        `http://195.179.229.230:5000/api/evaluation/${evaluationId}/finaliser`,
        { 
          statut,
          commentaireGeneral: evaluationForm.commentaireGeneral 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessageEvaluation(`✅ Évaluation finalisée comme ${statut}`);
      
      // Actualiser les données
      await fetchData();
      
      setTimeout(() => {
        setShowEvaluationModal(false);
        setMessageEvaluation('');
      }, 2000);

    } catch (err) {
      setMessageEvaluation('❌ Erreur lors de la finalisation: ' + (err.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const getStatutBadge = (evaluation) => {
    if (!evaluation) {
      return <span className="badge badge-warning">Pas d'évaluation</span>;
    }

    const style = {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500'
    };

    switch (evaluation.statutEvaluation) {
      case 'complet':
        return <span style={{...style, backgroundColor: '#dcfce7', color: '#166534'}}>Complet</span>;
      case 'incomplet':
        return <span style={{...style, backgroundColor: '#fef2f2', color: '#991b1b'}}>Incomplet</span>;
      case 'en_cours':
        return <span style={{...style, backgroundColor: '#dbeafe', color: '#1e40af'}}>En cours</span>;
      default:
        return <span style={{...style, backgroundColor: '#f3f4f6', color: '#374151'}}>Inconnu</span>;
    }
  };

  // Calculer les statistiques
  const statistiques = {
    total: etudiantsFiltres.length,
    complet: etudiantsFiltres.filter(e => e.evaluationExistante?.statutEvaluation === 'complet').length,
    incomplet: etudiantsFiltres.filter(e => e.evaluationExistante?.statutEvaluation === 'incomplet').length,
    enCours: etudiantsFiltres.filter(e => e.evaluationExistante?.statutEvaluation === 'en_cours').length,
    pasEvaluation: etudiantsFiltres.filter(e => !e.evaluationExistante).length
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6b7280' }}>Chargement des étudiants 2025/2026...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '20px'
    }}>
      <Sidebar onLogout={handleLogout} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
   
    
        {/* Cartes de statistiques */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Total étudiants */}
            <div style={{
              backgroundColor: '#f0f9ff',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    Total Étudiants 2025/2026
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    {statistiques.total}
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={24} style={{ color: 'white' }} />
                </div>
              </div>
            </div>

            {/* Évaluations complètes */}
            <div style={{
              backgroundColor: '#f0fdf4',
              borderLeft: '4px solid #10b981',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    Évaluations Complètes
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    {statistiques.complet}
                  </p>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: '#059669'
                  }}>
                    {statistiques.total > 0 ? 
                      `${Math.round((statistiques.complet / statistiques.total) * 100)}%` : 
                      '0%'
                    }
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={24} style={{ color: 'white' }} />
                </div>
              </div>
            </div>

            {/* Évaluations incomplètes */}
            <div style={{
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    Évaluations Incomplètes
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    {statistiques.incomplet}
                  </p>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: '#dc2626'
                  }}>
                    {statistiques.total > 0 ? 
                      `${Math.round((statistiques.incomplet / statistiques.total) * 100)}%` : 
                      '0%'
                    }
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <XCircle size={24} style={{ color: 'white' }} />
                </div>
              </div>
            </div>

            {/* Évaluations en cours */}
            <div style={{
              backgroundColor: '#fffbeb',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    En Cours d'Évaluation
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    {statistiques.enCours}
                  </p>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: '#d97706'
                  }}>
                    {statistiques.total > 0 ? 
                      `${Math.round((statistiques.enCours / statistiques.total) * 100)}%` : 
                      '0%'
                    }
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#f59e0b',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={24} style={{ color: 'white' }} />
                </div>
              </div>
            </div>

            {/* Pas d'évaluation */}
            <div style={{
              backgroundColor: '#f9fafb',
              borderLeft: '4px solid #6b7280',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    Pas d'Évaluation
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    {statistiques.pasEvaluation}
                  </p>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {statistiques.total > 0 ? 
                      `${Math.round((statistiques.pasEvaluation / statistiques.total) * 100)}%` : 
                      '0%'
                    }
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#6b7280',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertCircle size={24} style={{ color: 'white' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ minWidth: '200px' }}>
              <select
                value={filtreCommercial}
                onChange={(e) => setFiltreCommercial(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Tous les commerciaux</option>
                {commerciaux.map((commercial) => (
                  <option key={commercial._id} value={commercial._id}>
                    {commercial.nomComplet || commercial.nom}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '200px' }}>
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Tous les statuts</option>
                <option value="complet">Complet</option>
                <option value="incomplet">Incomplet</option>
                <option value="en_cours">En cours</option>
                <option value="pas_evaluation">Pas d'évaluation</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#dbeafe',
              borderRadius: '8px',
              color: '#1e40af'
            }}>
              <Calendar size={16} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {etudiantsFiltres.length} étudiant(s) trouvé(s)
              </span>
            </div>
          </div>
        </div>

        {/* Liste des étudiants */}
        <div style={{ padding: '20px' }}>
          {etudiantsFiltres.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 8px 0' }}>Aucun étudiant trouvé</h3>
              <p style={{ margin: 0 }}>
                {filtreCommercial || recherche || filtreStatut
                  ? 'Essayez de modifier vos filtres'
                  : 'Aucun étudiant pour l\'année 2025/2026'
                }
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {etudiantsFiltres.map((etudiant) => (
                <div
                  key={etudiant._id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Header de la carte */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: etudiant.image ? 'transparent' : '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {etudiant.image ? (
                        <img 
                          src={`http://195.179.229.230:5000${etudiant.image}`}
                          alt={`${etudiant.prenom} ${etudiant.nomDeFamille}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <User size={24} style={{ color: '#9ca3af' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#1f2937'
                      }}>
                        {etudiant.prenom} {etudiant.nomDeFamille}
                      </h3>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {etudiant.codeEtudiant}
                      </p>
                      {getStatutBadge(etudiant.evaluationExistante)}
                    </div>
                  </div>

                  {/* Informations de l'étudiant */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <Mail size={14} style={{ color: '#6b7280' }} />
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        {etudiant.email}
                      </span>
                    </div>
                    
                    {etudiant.telephone && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <Phone size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#374151' }}>
                          {etudiant.telephone}
                        </span>
                      </div>
                    )}

                    {etudiant.typeFormation && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <GraduationCap size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#374151' }}>
                          {etudiant.typeFormation} {etudiant.niveau && `- ${etudiant.niveau}`}
                        </span>
                      </div>
                    )}

                    {etudiant.commercial && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <UserCheck size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#374151' }}>
                          {etudiant.commercial.nom} {etudiant.commercial.prenom}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end'
                  }}>
                    {etudiant.evaluationExistante && 
                     (etudiant.evaluationExistante.statutEvaluation === 'complet' || 
                      etudiant.evaluationExistante.statutEvaluation === 'incomplet') && (
                      <button
                        onClick={() => voirDetails(etudiant)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                      >
                        <Eye size={16} />
                        Voir détails
                      </button>
                    )}

                    {(!etudiant.evaluationExistante || 
                      etudiant.evaluationExistante.statutEvaluation === 'en_cours') && (
                      <button
                        onClick={() => ouvrirEvaluation(etudiant)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: etudiant.evaluationExistante ? '#f59e0b' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = etudiant.evaluationExistante ? '#d97706' : '#059669';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = etudiant.evaluationExistante ? '#f59e0b' : '#10b981';
                        }}
                      >
                        {etudiant.evaluationExistante ? <Edit size={16} /> : <Plus size={16} />}
                        {etudiant.evaluationExistante ? 'Modifier' : 'Commencer évaluation'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'évaluation */}
      {showEvaluationModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            {/* Header du modal */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{
                    margin: '0 0 8px 0',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    Évaluation des documents
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {etudiantSelectionne?.prenom} {etudiantSelectionne?.nomDeFamille}
                  </p>
                </div>
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div style={{
              padding: '24px',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {/* Message de statut */}
              {messageEvaluation && (
                <div style={{
                  padding: '12px 16px',
                  marginBottom: '20px',
                  backgroundColor: messageEvaluation.includes('✅') ? '#f0fdf4' : '#fef2f2',
                  color: messageEvaluation.includes('✅') ? '#065f46' : '#991b1b',
                  borderRadius: '8px',
                  border: `1px solid ${messageEvaluation.includes('✅') ? '#bbf7d0' : '#fecaca'}`
                }}>
                  {messageEvaluation}
                </div>
              )}

              {/* Grille des documents */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {documentsConfig.map((doc) => (
                  <div
                    key={doc.key}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <h4 style={{
                          margin: '0 0 4px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {doc.label}
                        </h4>
                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {doc.description}
                        </p>
                      </div>
                      <FileText size={20} style={{ color: '#6b7280' }} />
                    </div>

                    {/* Switch pour document valide */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        <input
                          type="checkbox"
                          checked={evaluationForm.documents[doc.key]?.valide || false}
                          onChange={(e) => handleDocumentChange(doc.key, 'valide', e.target.checked)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{
                          color: evaluationForm.documents[doc.key]?.valide ? '#059669' : '#6b7280'
                        }}>
                          Document valide
                        </span>
                      </label>
                    </div>

                    {/* Commentaire */}
                    <textarea
                      placeholder="Commentaire (optionnel)..."
                      value={evaluationForm.documents[doc.key]?.commentaire || ''}
                      onChange={(e) => handleDocumentChange(doc.key, 'commentaire', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Commentaire général */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Commentaire général
                </h4>
                <textarea
                  placeholder="Commentaire général sur l'évaluation..."
                  value={evaluationForm.commentaireGeneral}
                  onChange={(e) => setEvaluationForm(prev => ({
                    ...prev,
                    commentaireGeneral: e.target.value
                  }))}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Footer du modal */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowEvaluationModal(false)}
                disabled={loadingEvaluation}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loadingEvaluation ? 'not-allowed' : 'pointer',
                  opacity: loadingEvaluation ? 0.5 : 1
                }}
              >
                Annuler
              </button>

              <button
                onClick={sauvegarderEvaluation}
                disabled={loadingEvaluation}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loadingEvaluation ? 'not-allowed' : 'pointer',
                  opacity: loadingEvaluation ? 0.5 : 1
                }}
              >
                {loadingEvaluation ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>

              <button
                onClick={() => finaliserEvaluation('complet')}
                disabled={loadingEvaluation}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loadingEvaluation ? 'not-allowed' : 'pointer',
                  opacity: loadingEvaluation ? 0.5 : 1
                }}
              >
                Finaliser - Complet
              </button>

              <button
                onClick={() => finaliserEvaluation('incomplet')}
                disabled={loadingEvaluation}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loadingEvaluation ? 'not-allowed' : 'pointer',
                  opacity: loadingEvaluation ? 0.5 : 1
                }}
              >
                Finaliser - Incomplet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && evaluationDetails && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            {/* Header du modal */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{
                    margin: '0 0 8px 0',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    Détails de l'évaluation
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {evaluationDetails.etudiant?.prenom} {evaluationDetails.etudiant?.nomDeFamille}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div style={{
              padding: '24px',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {/* Statut */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: evaluationDetails.statutEvaluation === 'complet' ? '#f0fdf4' : '#fef2f2',
                borderRadius: '8px',
                border: `1px solid ${evaluationDetails.statutEvaluation === 'complet' ? '#bbf7d0' : '#fecaca'}`
              }}>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: evaluationDetails.statutEvaluation === 'complet' ? '#065f46' : '#991b1b'
                }}>
                  Statut: {evaluationDetails.statutEvaluation === 'complet' ? 'Complet' : 'Incomplet'}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: evaluationDetails.statutEvaluation === 'complet' ? '#065f46' : '#991b1b'
                }}>
                  Score: {evaluationDetails.scoreDocuments || 0}/{documentsConfig.length} documents valides
                </p>
              </div>

              {/* Documents */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {documentsConfig.map((doc) => {
                  const docData = evaluationDetails.documents?.[doc.key];
                  return (
                    <div
                      key={doc.key}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: docData?.valide ? '#f0fdf4' : '#fef2f2'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {doc.label}
                        </h4>
                        {docData?.valide ? (
                          <CheckCircle size={20} style={{ color: '#10b981' }} />
                        ) : (
                          <XCircle size={20} style={{ color: '#ef4444' }} />
                        )}
                      </div>

                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: docData?.valide ? '#059669' : '#dc2626'
                      }}>
                        {docData?.valide ? 'Document valide' : 'Document non valide'}
                      </p>

                      {docData?.commentaire && (
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#6b7280',
                          backgroundColor: 'white',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {docData.commentaire}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Commentaire général */}
              {evaluationDetails.commentaireGeneral && (
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f9fafb'
                }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    Commentaire général
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.5'
                  }}>
                    {evaluationDetails.commentaireGeneral}
                  </p>
                </div>
              )}
            </div>

            {/* Footer du modal */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EvaluationEtudiants;