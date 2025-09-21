import React, { useEffect, useState } from 'react';
import { CreditCard, Calendar, FileText, Wallet, CheckCircle } from 'lucide-react';
import Sidebar from '../components/sidebaretudiant'; // ✅ ا
import { useNavigate } from 'react-router-dom'; // déjà probablement importé

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
const EtudiantPaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'etudiant') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchPaiements = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/etudiant/paiements', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erreur lors du chargement');
        const data = await res.json();
        setPaiements(data);
      } catch (err) {
        console.error('❌ Erreur paiements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaiements();
  }, []);

  const formatDate = (iso) => {
    const date = new Date(iso);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotalAmount = () => {
    return paiements.reduce((total, p) => total + p.montant, 0);
  };

  return (
    <div style={{
      minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}> <Sidebar onLogout={handleLogout} />
        {/* Header avec compteur */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Mes Paiements
            </h1>
          </div>
          {!loading && paiements.length > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f0f9ff',
              color: '#0369a1',
              padding: '8px 16px',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid #bae6fd'
            }}>
              <CheckCircle size={16} />
              {paiements.length} paiement{paiements.length > 1 ? 's' : ''} • Total: {calculateTotalAmount()} Dhs
            </div>
          )}
        </div>

        {/* Contenu principal */}
        {loading ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'inline-block',
              width: '24px',
              height: '24px',
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: 0
            }}>
              Chargement de vos paiements...
            </p>
          </div>
        ) : paiements.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <CreditCard size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: 0
            }}>
              Aucun paiement trouvé
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {paiements.map((p) => (
              <div
                key={p._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                {/* Header de la card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{
                    backgroundColor: '#dbeafe',
                    padding: '8px',
                    borderRadius: '10px'
                  }}>
                    <CreditCard size={20} style={{ color: '#3b82f6' }} />
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    flex: 1
                  }}>
                    {p.cours}
                  </h3>
                  <div style={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CheckCircle size={12} />
                    Payé
                  </div>
                </div>

                {/* Détails du paiement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#64748b',
                    fontSize: '14px'
                  }}>
                    <Calendar size={16} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: '500' }}>Date de début:</span>
                    <span>{formatDate(p.moisDebut)}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#64748b',
                    fontSize: '14px'
                  }}>
                    <Calendar size={16} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: '500' }}>Durée:</span>
                    <span>{p.nombreMois} mois</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#1e293b',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    marginTop: '8px'
                  }}>
                    <Wallet size={16} style={{ color: '#059669' }} />
                    <span>Montant: {p.montant} Dhs</span>
                  </div>

                  {p.note && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      padding: '12px',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        color: '#92400e',
                        fontSize: '14px'
                      }}>
                        <FileText size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontWeight: '600' }}>Note:</span>
                          <p style={{ margin: '4px 0 0 0' }}>{p.note}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 480px) {
          div[style*="padding: 24px"] {
            padding: 16px !important;
          }
          
          div[style*="padding: 32px"] {
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EtudiantPaiements;