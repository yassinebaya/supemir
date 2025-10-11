import React, { useEffect, useState } from 'react';
import { Search, CreditCard, Calendar, User, BookOpen, DollarSign, Download, AlertTriangle, X, Grid, List, FileSpreadsheet, Edit, Trash2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import * as XLSX from 'xlsx';
import Sidebar from '../components/Sidebarpaiment';

const API_BASE_URL = 'http://195.179.229.230:5000/api';

const ListePaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [expirés, setExpirés] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [filteredPaiements, setFilteredPaiements] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    montant: '',
    note: '',
    numeroSerie: '',
    nombreMois: '',
    moisDebut: ''
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchPaiements();
  }, []);

  useEffect(() => {
    const filtered = paiements.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      return (
        p.etudiant?.nomComplet?.toLowerCase().includes(searchLower) ||
        (Array.isArray(p.cours) ? p.cours.join(', ') : p.cours)?.toLowerCase().includes(searchLower) ||
        p.note?.toLowerCase().includes(searchLower) ||
        p.numeroSerie?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredPaiements(filtered);
  }, [searchTerm, paiements]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const fetchPaiements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/paiements`, getAuthConfig());
      const data = await res.json();
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPaiements(sortedData);
      setFilteredPaiements(sortedData);
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
      alert('Erreur lors du chargement des paiements');
    }
  };

  const fetchExpirés = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/paiements/exp`, getAuthConfig());
      const data = await res.json();
      setExpirés(data);
    } catch (err) {
      console.error('Erreur fetch paiements expirés:', err);
    }
  };

  const toggleModal = () => {
    if (!showModal) fetchExpirés();
    setShowModal(!showModal);
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR');
  };

  const calculerDateFin = (debut, nombreMois) => {
    if (!debut) return '';
    const date = new Date(debut);
    date.setMonth(date.getMonth() + Number(nombreMois));
    return date.toLocaleDateString('fr-FR');
  };

  const payerEtudiant = (etudiantId, cours) => {
    localStorage.setItem('paiementPreRempli', JSON.stringify({
      etudiant: etudiantId,
      cours: cours
    }));
    window.location.href = '/ajouter-paiement';
  };

  // ✅ NOUVELLE FONCTION: Ouvrir le modal d'édition
  const openEditModal = (paiement) => {
    setSelectedPaiement(paiement);
    setEditForm({
      montant: paiement.montant,
      note: paiement.note || '',
      numeroSerie: paiement.numeroSerie || '',
      nombreMois: paiement.nombreMois,
      moisDebut: paiement.moisDebut ? new Date(paiement.moisDebut).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  // ✅ NOUVELLE FONCTION: Modifier un paiement
  const handleEditSubmit = async () => {
    if (!editForm.numeroSerie || editForm.numeroSerie.trim() === '') {
      alert('❌ Le numéro de série est obligatoire');
      return;
    }

    if (!editForm.montant || parseFloat(editForm.montant) <= 0) {
      alert('❌ Le montant doit être supérieur à 0');
      return;
    }

    try {
      const config = getAuthConfig();
      const response = await fetch(`${API_BASE_URL}/paiements/${selectedPaiement._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Paiement modifié avec succès');
        setShowEditModal(false);
        fetchPaiements(); // Recharger la liste
      } else {
        alert(`❌ ${data.error || 'Erreur lors de la modification'}`);
      }
    } catch (err) {
      console.error('Erreur modification:', err);
      alert('❌ Erreur lors de la modification du paiement');
    }
  };

  // ✅ NOUVELLE FONCTION: Supprimer un paiement
  const handleDelete = async (paiement) => {
    const confirmation = window.confirm(
      `⚠️ Êtes-vous sûr de vouloir supprimer ce paiement ?\n\n` +
      `Étudiant: ${paiement.etudiant?.nomComplet}\n` +
      `Montant: ${paiement.montant} DH\n` +
      `N° Série: ${paiement.numeroSerie}\n\n` +
      `Cette action est irréversible !`
    );

    if (!confirmation) return;

    try {
      const config = getAuthConfig();
      const response = await fetch(`${API_BASE_URL}/paiements/${paiement._id}`, {
        method: 'DELETE',
        headers: config.headers
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Paiement supprimé avec succès');
        fetchPaiements(); // Recharger la liste
      } else {
        alert(`❌ ${data.error || 'Erreur lors de la suppression'}`);
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('❌ Erreur lors de la suppression du paiement');
    }
  };

  const exportToExcel2025 = () => {
    try {
      const academicYearStart = new Date('2025-09-01');
      const academicYearEnd = new Date('2026-08-31');
      
      const paymentsFor2025 = paiements.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate >= academicYearStart && paymentDate <= academicYearEnd;
      });

      if (paymentsFor2025.length === 0) {
        alert('Aucun paiement trouvé pour l\'année académique 2025/2026');
        return;
      }

      const excelData = paymentsFor2025.map((p, index) => ({
        'N°': index + 1,
        'Nom Complet': p.etudiant?.nomComplet || 'N/A',
        'Classe': Array.isArray(p.cours) ? p.cours.join(', ') : p.cours,
        'N° Série': p.numeroSerie || 'N/A',
        'Montant (DH)': p.montant,
        'Date Début': formatDate(p.moisDebut),
        'Date Fin': calculerDateFin(p.moisDebut, p.nombreMois),
        'Durée (Mois)': p.nombreMois,
        'Date Paiement': formatDate(p.createdAt),
        'Note': p.note || '',
        'Statut Étudiant': p.etudiant?.actif ? 'Actif' : 'Inactif'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Paiements 2025-2026');

      const today = new Date();
      const filename = `Paiements_2025-2026_${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}.xlsx`;

      XLSX.writeFile(wb, filename);
      alert(`✅ Fichier Excel exporté avec succès!\n${paymentsFor2025.length} paiements exportés`);
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('❌ Erreur lors de l\'export Excel');
    }
  };

  const generatePDF = (p) => {
    const doc = new jsPDF('landscape', 'mm', [210, 100]);
    
    const colors = {
      primary: [0, 102, 204],
      secondary: [0, 153, 255],
      accent: [51, 51, 51],
      light: [240, 248, 255],
      border: [204, 204, 204],
      white: [255, 255, 255]
    };

    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(2);
    doc.rect(5, 5, 200, 90);
    
    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 84);

    doc.setFillColor(...colors.light);
    doc.rect(8, 8, 194, 25, 'F');
    
    doc.setTextColor(...colors.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SUPEMIR', 12, 16);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Empowering Your Future', 12, 20);
    
    doc.setFontSize(7);
    doc.text('Km 9 Casablanca-Rabat, Ain Sebaa', 12, 24);
    doc.text('Tél: +212 522 249 175', 12, 27);

    doc.setFillColor(...colors.primary);
    doc.roundedRect(140, 12, 55, 15, 2, 2, 'F');
    
    doc.setTextColor(...colors.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REÇU DE PAIEMENT', 167, 18, { align: 'center' });
    
    doc.setFontSize(7);
    const receiptNum = p.numeroSerie || `N° ${Date.now().toString().slice(-6)}`;
    doc.text(receiptNum, 167, 28, { align: 'center' });
    doc.text(formatDate(p.createdAt), 167, 31, { align: 'center' });

    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.line(12, 36, 198, 36);

    let yPos = 45;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Reçu de:', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(p.etudiant?.nomComplet || '___________________', 35, yPos);

    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1.5);
    doc.roundedRect(135, yPos - 8, 60, 14, 3, 3, 'FD');
    
    doc.setTextColor(...colors.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.montant} DH`, 165, yPos, { align: 'center' });

    yPos += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Formation:', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    const formation = Array.isArray(p.cours) ? p.cours.join(', ') : p.cours;
    doc.text(formation, 38, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Période:', 120, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatDate(p.moisDebut)} (${p.nombreMois} mois)`, 140, yPos);

    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Casablanca, le:', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(p.createdAt), 45, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Administration SUPEMIR:', 120, yPos - 3);
    
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.roundedRect(120, yPos, 50, 12, 2, 2, 'D');
    
    doc.setFontSize(7);
    doc.text('Signature & Cachet', 145, yPos + 6, { align: 'center' });

    if (p.note && p.note.trim() !== '') {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      const noteText = p.note.length > 60 ? p.note.substring(0, 60) + '...' : p.note;
      doc.text(`Note: ${noteText}`, 15, 78);
    }

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const openDetailModal = (paiement) => {
    setSelectedPaiement(paiement);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPaiement(null);
  };

  const CardView = ({ paiement }) => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardUserInfo}>
          <div style={styles.avatar}>
            <User size={24} color="white" />
          </div>
          <div>
            <h3 style={styles.cardUserName}>{paiement.etudiant?.nomComplet || '—'}</h3>
            <p style={styles.cardCourse}>
              <BookOpen size={16} style={{ marginRight: '4px' }} />
              {Array.isArray(paiement.cours) ? paiement.cours.join(', ') : paiement.cours}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => generatePDF(paiement)} style={styles.cardPdfButton} title="Télécharger PDF">
            <Download size={20} />
          </button>
          <button onClick={() => openEditModal(paiement)} style={{...styles.cardPdfButton, backgroundColor: '#FEF3C7', color: '#F59E0B'}} title="Modifier">
            <Edit size={20} />
          </button>
          <button onClick={() => handleDelete(paiement)} style={{...styles.cardPdfButton, backgroundColor: '#FEE2E2', color: '#EF4444'}} title="Supprimer">
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      
      <div style={styles.cardGrid}>
        <div style={styles.cardInfoItem}>
          <DollarSign size={16} color="#10B981" />
          <span style={styles.cardLabel}>Montant:</span>
          <span style={styles.cardAmount}>{paiement.montant} Dh</span>
        </div>
        <div style={styles.cardInfoItem}>
          <Calendar size={16} color="#3B82F6" />
          <span style={styles.cardLabel}>Durée:</span>
          <span style={styles.cardValue}>{paiement.nombreMois} mois</span>
        </div>
      </div>
      
      <div style={styles.cardDetails}>
        {paiement.numeroSerie && (
          <div style={styles.cardDetailRow}>
            <span style={styles.cardDetailLabel}>N° Série:</span>
            <span style={{...styles.cardDetailValue, fontFamily: 'monospace', fontSize: '12px'}}>{paiement.numeroSerie}</span>
          </div>
        )}
        <div style={styles.cardDetailRow}>
          <span style={styles.cardDetailLabel}>Début:</span>
          <span style={styles.cardDetailValue}>{formatDate(paiement.moisDebut)}</span>
        </div>
        <div style={styles.cardDetailRow}>
          <span style={styles.cardDetailLabel}>Payé le:</span>
          <span style={styles.cardDetailValue}>{formatDate(paiement.createdAt)}</span>
        </div>
        {paiement.note && (
          <div style={styles.cardNote}>
            <span style={styles.cardDetailLabel}>Note:</span>
            <p style={styles.cardNoteText}>{paiement.note}</p>
          </div>
        )}
      </div>
    </div>
  );

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(135deg, #f0f9ff 0%, #a6dbff 25%, #f3e8ff 100%)',
      padding: '24px',
    },
    maxWidth: {
      maxWidth: '1280px',
      margin: '0 auto',
    },
    header: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.05)',
      textAlign: 'center',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      margin: 0,
      color: '#1f2937'
    },
    controlsContainer: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px',
    },
    controlsRow: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    searchContainer: {
      position: 'relative',
      flex: '1',
      maxWidth: '400px',
    },
    searchInput: {
      width: '100%',
      paddingLeft: '40px',
      paddingRight: '16px',
      paddingTop: '12px',
      paddingBottom: '12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9CA3AF',
    },
    controlsRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    viewToggle: {
      display: 'flex',
      background: '#F3F4F6',
      borderRadius: '8px',
      padding: '4px',
    },
    viewButton: {
      padding: '8px',
      borderRadius: '6px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    viewButtonActive: {
      background: 'white',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      color: '#3B82F6',
    },
    alertButton: {
      background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    resultsCount: {
      marginBottom: '24px',
      color: '#6B7280',
    },
    tableContainer: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    thead: {
      background: 'linear-gradient(135deg, #F9FAFB 0%, #E0F2FE 100%)',
    },
    th: {
      padding: '16px 24px',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '600',
      color: '#111827',
      borderBottom: '1px solid #E5E7EB',
    },
    td: {
      padding: '16px 24px',
      color: '#374151',
      borderBottom: '1px solid #F3F4F6',
    },
    userCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    tableAvatar: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    userName: {
      fontWeight: '500',
      color: '#111827',
    },
    durationBadge: {
      background: '#DBEAFE',
      color: '#1E40AF',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500',
    },
    amount: {
      color: '#059669',
      fontWeight: '600',
    },
    actionButton: {
      padding: '8px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '24px',
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      border: '1px solid #E5E7EB',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    cardUserInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    avatar: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardUserName: {
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 4px 0',
      fontSize: '16px',
    },
    cardCourse: {
      fontSize: '14px',
      color: '#6B7280',
      display: 'flex',
      alignItems: 'center',
      margin: 0,
    },
    cardPdfButton: {
      padding: '8px',
      background: '#EFF6FF',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      color: '#3B82F6',
    },
    cardGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px',
    },
    cardInfoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cardLabel: {
      fontSize: '14px',
      color: '#6B7280',
    },
    cardAmount: {
      fontWeight: '500',
      color: '#059669',
    },
    cardValue: {
      fontWeight: '500',
      color: '#111827',
    },
    cardDetails: {
      borderTop: '1px solid #F3F4F6',
      paddingTop: '16px',
    },
    cardDetailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
      fontSize: '14px',
    },
    cardDetailLabel: {
      color: '#6B7280',
    },
    cardDetailValue: {
      fontWeight: '500',
      color: '#111827',
    },
    cardNote: {
      borderTop: '1px solid #F3F4F6',
      paddingTop: '12px',
      marginTop: '12px',
    },
    cardNoteText: {
      color: '#111827',
      marginTop: '4px',
      fontSize: '14px',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 1000,
    },
    modalContent: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'hidden',
    },
    modalHeader: {
      background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      color: 'white',
      padding: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
    },
    modalBody: {
      padding: '24px',
      overflowY: 'auto',
      maxHeight: '500px',
    },
    editModalHeader: {
      background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      color: 'white',
      padding: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#374151',
      fontSize: '14px',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '80px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #E5E7EB',
    },
    saveButton: {
      flex: 1,
      padding: '12px 20px',
      background: '#10B981',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
    },
    cancelButton: {
      flex: 1,
      padding: '12px 20px',
      background: '#F3F4F6',
      color: '#374151',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
    },
    closeButton: {
      color: 'white',
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      padding: '8px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          <h1 style={styles.title}>Liste des Paiements</h1>
        </div>

        <div style={styles.controlsContainer}>
          <div style={styles.controlsRow}>
            <div style={styles.searchContainer}>
              <div style={styles.searchIcon}>
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, classe, n° série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.controlsRight}>
              <button
                onClick={exportToExcel2025}
                style={{
                  ...styles.alertButton,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                }}
                title="Exporter vers Excel"
              >
                <FileSpreadsheet size={20} />
                <span>Excel 2025/26</span>
              </button>

              <div style={styles.viewToggle}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    ...styles.viewButton,
                    ...(viewMode === 'table' ? styles.viewButtonActive : {}),
                  }}
                >
                  <List size={20} />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  style={{
                    ...styles.viewButton,
                    ...(viewMode === 'cards' ? styles.viewButtonActive : {}),
                  }}
                >
                  <Grid size={20} />
                </button>
              </div>

              <button onClick={toggleModal} style={styles.alertButton}>
                <AlertTriangle size={20} />
                <span>Alertes</span>
              </button>
            </div>
          </div>
        </div>

        <div style={styles.resultsCount}>
          <p>
            {filteredPaiements.length} paiement{filteredPaiements.length > 1 ? 's' : ''} trouvé{filteredPaiements.length > 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
          </p>
        </div>

        {viewMode === 'table' ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Étudiant</th>
                  <th style={styles.th}>Classe</th>
                  <th style={styles.th}>N° Série</th>
                  <th style={styles.th}>Début</th>
                  <th style={styles.th}>Durée</th>
                  <th style={styles.th}>Montant</th>
                  <th style={styles.th}>Payé le</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaiements.map((p) => (
                  <tr key={p._id}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.tableAvatar}>
                          <User size={16} color="white" />
                        </div>
                        <span style={styles.userName}>{p.etudiant?.nomComplet || '—'}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {Array.isArray(p.cours) ? p.cours.join(', ') : p.cours}
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {p.numeroSerie || '—'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(p.moisDebut)}</td>
                    <td style={styles.td}>
                      <span style={styles.durationBadge}>{p.nombreMois} mois</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.amount}>{p.montant} Dh</span>
                    </td>
                    <td style={styles.td}>{formatDate(p.createdAt)}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openDetailModal(p)}
                          style={{
                            ...styles.actionButton,
                            backgroundColor: '#10B981',
                            color: 'white'
                          }}
                          title="Voir détails"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
                            <path d="M2.04834 12.3178C1.98398 12.1126 1.98398 11.8874 2.04834 11.6822C3.11287 8.64174 7.23449 4 12 4C16.7655 4 20.8871 8.64174 21.9517 11.6822C22.016 11.8874 22.016 12.1126 21.9517 12.3178C20.8871 15.3583 16.7655 20 12 20C7.23449 20 3.11287 15.3583 2.04834 12.3178Z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => generatePDF(p)}
                          style={{
                            ...styles.actionButton,
                            backgroundColor: '#3B82F6',
                            color: 'white'
                          }}
                          title="Télécharger PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          style={{
                            ...styles.actionButton,
                            backgroundColor: '#F59E0B',
                            color: 'white'
                          }}
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          style={{
                            ...styles.actionButton,
                            backgroundColor: '#EF4444',
                            color: 'white'
                          }}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.cardsGrid}>
            {filteredPaiements.map(p => (
              <CardView key={p._id} paiement={p} />
            ))}
          </div>
        )}

        {filteredPaiements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <CreditCard size={64} color="#D1D5DB" />
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginTop: '16px' }}>
              Aucun paiement trouvé
            </h3>
            <p style={{ color: '#6B7280' }}>
              {searchTerm ? 'Essayez avec d\'autres termes de recherche' : 'Aucun paiement enregistré'}
            </p>
          </div>
        )}

        {/* Modal Alertes */}
        {showModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  <AlertTriangle size={24} />
                  Paiements Expirés
                </h3>
                <button onClick={toggleModal} style={styles.closeButton}>
                  <X size={20} />
                </button>
              </div>
              <div style={styles.modalBody}>
                {expirés.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: '#DCFCE7',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}>
                      <span style={{ fontSize: '32px' }}>✅</span>
                    </div>
                    <p>Aucun paiement expiré</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {expirés.filter(p => p.etudiant?.actif).map(p => (
                      <div key={p._id} style={{
                        background: '#FFF7ED',
                        borderRadius: '12px',
                        padding: '16px',
                        borderLeft: '4px solid #F59E0B',
                      }}>
                        <div style={{ marginBottom: '12px' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontWeight: '600' }}>
                            {p.etudiant?.nomComplet}
                          </h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                            {Array.isArray(p.cours) ? p.cours.join(', ') : p.cours}
                          </p>
                        </div>
                        <button
                          onClick={() => payerEtudiant(p.etudiant?._id, p.cours)}
                          style={{
                            width: '100%',
                            background: '#059669',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500',
                          }}
                        >
                          💰 Payer maintenant
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Détails */}
        {showDetailModal && selectedPaiement && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={{
                ...styles.modalHeader,
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              }}>
                <h3 style={styles.modalTitle}>
                  <CreditCard size={24} />
                  Détails du Paiement
                </h3>
                <button onClick={closeDetailModal} style={styles.closeButton}>
                  <X size={20} />
                </button>
              </div>
              <div style={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Étudiant</div>
                    <div style={{ fontWeight: '600' }}>{selectedPaiement.etudiant?.nomComplet}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Montant</div>
                    <div style={{ fontWeight: '600', color: '#059669' }}>{selectedPaiement.montant} Dh</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>N° Série</div>
                    <div style={{ fontWeight: '600', fontFamily: 'monospace', fontSize: '14px' }}>
                      {selectedPaiement.numeroSerie || '—'}
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Durée</div>
                    <div style={{ fontWeight: '600' }}>{selectedPaiement.nombreMois} mois</div>
                  </div>
                </div>
                {selectedPaiement.note && (
                  <div style={{ background: '#FEF3C7', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#92400E', marginBottom: '8px', fontWeight: '500' }}>
                      📝 Note
                    </div>
                    <div style={{ fontSize: '14px', color: '#451A03' }}>{selectedPaiement.note}</div>
                  </div>
                )}
                <div style={styles.buttonGroup}>
                  <button
                    onClick={() => generatePDF(selectedPaiement)}
                    style={styles.saveButton}
                  >
                    <Download size={16} style={{ marginRight: '8px' }} />
                    Télécharger PDF
                  </button>
                  <button onClick={closeDetailModal} style={styles.cancelButton}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Édition */}
        {showEditModal && selectedPaiement && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.editModalHeader}>
                <h3 style={styles.modalTitle}>
                  <Edit size={24} />
                  Modifier le Paiement
                </h3>
                <button onClick={() => setShowEditModal(false)} style={styles.closeButton}>
                  <X size={20} />
                </button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Numéro de Série *</label>
                  <input
                    type="text"
                    value={editForm.numeroSerie}
                    onChange={(e) => setEditForm({ ...editForm, numeroSerie: e.target.value })}
                    style={styles.input}
                    placeholder="Ex: PAY-2025-001"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Montant (DH) *</label>
                  <input
                    type="number"
                    value={editForm.montant}
                    onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Date de début</label>
                  <input
                    type="date"
                    value={editForm.moisDebut}
                    onChange={(e) => setEditForm({ ...editForm, moisDebut: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre de mois</label>
                  <input
                    type="number"
                    value={editForm.nombreMois}
                    onChange={(e) => setEditForm({ ...editForm, nombreMois: e.target.value })}
                    style={styles.input}
                    min="1"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Note (optionnel)</label>
                  <textarea
                    value={editForm.note}
                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                    style={styles.textarea}
                    placeholder="Ajouter une note..."
                  />
                </div>

                <div style={styles.buttonGroup}>
                  <button onClick={handleEditSubmit} style={styles.saveButton}>
                    💾 Enregistrer
                  </button>
                  <button onClick={() => setShowEditModal(false)} style={styles.cancelButton}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListePaiements;