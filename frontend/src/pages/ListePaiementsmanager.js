import React, { useEffect, useState } from 'react';
import { Search, CreditCard, Calendar, User, BookOpen, DollarSign, Download, AlertTriangle, X, Grid, List, Filter } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from '../components/Sidebarpaiment'; // ✅ استيراد صحيح

const ListePaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [expirés, setExpirés] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'cards'
  const [filteredPaiements, setFilteredPaiements] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState(null);
const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
const [filters, setFilters] = useState({
  dateDebut: '',
  dateFin: '',
  montantMin: '',
  montantMax: '',
  cours: '',
  dureeMin: '',
  dureeMax: '',
  statut: '', // 'actif', 'expire', 'tous'
  etudiantActif: 'tous', // 'actif', 'inactif', 'tous'
  dateCreationDebut: '',
  dateCreationFin: '',
  note: false // true pour afficher seulement ceux avec des notes
});
  useEffect(() => {
    fetchPaiements();
  }, []);

  // Fonction de recherche
 useEffect(() => {
  let filtered = paiements.filter(p => {
    // Recherche par texte (existante)
    const matchesSearch = p.etudiant?.nomComplet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(p.cours) ? p.cours.join(', ') : p.cours)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.note?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtres avancés
    // Filtre par date de début
    if (filters.dateDebut) {
      const debutPaiement = new Date(p.moisDebut);
      const filtreDebut = new Date(filters.dateDebut);
      if (debutPaiement < filtreDebut) return false;
    }

    if (filters.dateFin) {
      const finPaiement = new Date(p.moisDebut);
      finPaiement.setMonth(finPaiement.getMonth() + Number(p.nombreMois));
      const filtreFin = new Date(filters.dateFin);
      if (finPaiement > filtreFin) return false;
    }

    // Filtre par montant
    if (filters.montantMin && p.montant < Number(filters.montantMin)) return false;
    if (filters.montantMax && p.montant > Number(filters.montantMax)) return false;

    // Filtre par cours
    if (filters.cours) {
      const coursStr = Array.isArray(p.cours) ? p.cours.join(', ') : p.cours;
      if (!coursStr.toLowerCase().includes(filters.cours.toLowerCase())) return false;
    }

    // Filtre par durée
    if (filters.dureeMin && p.nombreMois < Number(filters.dureeMin)) return false;
    if (filters.dureeMax && p.nombreMois > Number(filters.dureeMax)) return false;

    // Filtre par statut (actif/expiré)
    if (filters.statut && filters.statut !== 'tous') {
      const maintenant = new Date();
      const finPaiement = new Date(p.moisDebut);
      finPaiement.setMonth(finPaiement.getMonth() + Number(p.nombreMois));
      
      const estExpire = finPaiement < maintenant;
      
      if (filters.statut === 'actif' && estExpire) return false;
      if (filters.statut === 'expire' && !estExpire) return false;
    }

    // Filtre par étudiant actif/inactif
    if (filters.etudiantActif !== 'tous') {
      if (filters.etudiantActif === 'actif' && !p.etudiant?.actif) return false;
      if (filters.etudiantActif === 'inactif' && p.etudiant?.actif) return false;
    }

    // Filtre par date de création
    if (filters.dateCreationDebut) {
      const dateCreation = new Date(p.createdAt);
      const filtreCreationDebut = new Date(filters.dateCreationDebut);
      if (dateCreation < filtreCreationDebut) return false;
    }

    if (filters.dateCreationFin) {
      const dateCreation = new Date(p.createdAt);
      const filtreCreationFin = new Date(filters.dateCreationFin);
      if (dateCreation > filtreCreationFin) return false;
    }

    // Filtre par note
    if (filters.note && !p.note) return false;

    return true;
  });

  setFilteredPaiements(filtered);
}, [searchTerm, paiements, filters]);
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const fetchPaiements = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/paiements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      // Trier les paiements par date de création décroissante (plus récent en premier)
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setPaiements(sortedData);
      setFilteredPaiements(sortedData);
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
    }
  };

  const fetchExpirés = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/paiements/exp', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
const resetFilters = () => {
  setFilters({
    dateDebut: '',
    dateFin: '',
    montantMin: '',
    montantMax: '',
    cours: '',
    dureeMin: '',
    dureeMax: '',
    statut: '',
    etudiantActif: 'tous',
    dateCreationDebut: '',
    dateCreationFin: '',
    note: false
  });
  setSearchTerm('');
};const getActiveFiltersCount = () => {
  return Object.values(filters).filter(value => 
    value !== '' && value !== false && value !== 'tous'
  ).length;
};
  const calculerDateFin = (debut, nombreMois) => {
    if (!debut) return '';
    const date = new Date(debut);
    date.setMonth(date.getMonth() + Number(nombreMois));
    return date.toLocaleDateString('fr-FR');
  };
const AdvancedFilters = () => (
  <div style={styles.filtersContainer}>
    <button
      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
      style={styles.filtersToggle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Filter size={20} />
        <span>Filtres avancés</span>
        {getActiveFiltersCount() > 0 && (
          <span style={styles.filterBadge}>
            {getActiveFiltersCount()}
          </span>
        )}
      </div>
      <span style={{ 
        transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease'
      }}>
        ▼
      </span>
    </button>
    
    <div style={styles.filtersContent}>
      <div style={styles.filtersGrid}>
        {/* Filtres par date */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date de début (après)</label>
          <input
            type="date"
            value={filters.dateDebut}
            onChange={(e) => setFilters({...filters, dateDebut: e.target.value})}
            style={styles.filterInput}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date de fin (avant)</label>
          <input
            type="date"
            value={filters.dateFin}
            onChange={(e) => setFilters({...filters, dateFin: e.target.value})}
            style={styles.filterInput}
          />
        </div>
        
        {/* Filtres par montant */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Montant minimum (Dh)</label>
          <input
            type="number"
            value={filters.montantMin}
            onChange={(e) => setFilters({...filters, montantMin: e.target.value})}
            style={styles.filterInput}
            placeholder="0"
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Montant maximum (Dh)</label>
          <input
            type="number"
            value={filters.montantMax}
            onChange={(e) => setFilters({...filters, montantMax: e.target.value})}
            style={styles.filterInput}
            placeholder="10000"
          />
        </div>
        
        {/* Filtre par cours */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Classe</label>
          <input
            type="text"
            value={filters.cours}
            onChange={(e) => setFilters({...filters, cours: e.target.value})}
            style={styles.filterInput}
            placeholder="Nom de la classe..."
          />
        </div>
        
        {/* Filtres par durée */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Durée minimum (mois)</label>
          <input
            type="number"
            value={filters.dureeMin}
            onChange={(e) => setFilters({...filters, dureeMin: e.target.value})}
            style={styles.filterInput}
            placeholder="1"
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Durée maximum (mois)</label>
          <input
            type="number"
            value={filters.dureeMax}
            onChange={(e) => setFilters({...filters, dureeMax: e.target.value})}
            style={styles.filterInput}
            placeholder="12"
          />
        </div>
        
        {/* Filtre par statut */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Statut du paiement</label>
          <select
            value={filters.statut}
            onChange={(e) => setFilters({...filters, statut: e.target.value})}
            style={styles.filterSelect}
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="expire">Expiré</option>
          </select>
        </div>
        
        {/* Filtre par étudiant actif */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Étudiant</label>
          <select
            value={filters.etudiantActif}
            onChange={(e) => setFilters({...filters, etudiantActif: e.target.value})}
            style={styles.filterSelect}
          >
            <option value="tous">Tous les étudiants</option>
            <option value="actif">Étudiants inactifs</option>
            <option value="inactif">Étudiants actifs</option>
          </select>
        </div>
        
        {/* Filtres par date de création */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Créé après</label>
          <input
            type="date"
            value={filters.dateCreationDebut}
            onChange={(e) => setFilters({...filters, dateCreationDebut: e.target.value})}
            style={styles.filterInput}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Créé avant</label>
          <input
            type="date"
            value={filters.dateCreationFin}
            onChange={(e) => setFilters({...filters, dateCreationFin: e.target.value})}
            style={styles.filterInput}
          />
        </div>
        
        {/* Filtre par note */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Notes</label>
          <div style={styles.filterCheckbox}>
            <input
              type="checkbox"
              checked={filters.note}
              onChange={(e) => setFilters({...filters, note: e.target.checked})}
              id="noteFilter"
            />
            <label htmlFor="noteFilter">Seulement avec notes</label>
          </div>
        </div>
      </div>
      
      <div style={styles.filtersActions}>
        <button
          onClick={resetFilters}
          style={{
            ...styles.filterButton,
            ...styles.resetButton
          }}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  </div>
);

  const payerEtudiant = (etudiantId, cours) => {
    localStorage.setItem('paiementPreRempli', JSON.stringify({
      etudiant: etudiantId,
      cours: cours
    }));
    window.location.href = '/ajouter-paiement';
  };

const generatePDF = (p) => {
  // Format chèque bancaire standard
  const doc = new jsPDF('landscape', 'mm', [210, 100]); // Format chèque allongé
  
  // Couleurs SUPEMIR
  const colors = {
    primary: [0, 102, 204],         // Bleu SUPEMIR principal
    secondary: [0, 153, 255],       // Bleu SUPEMIR clair
    accent: [51, 51, 51],           // Gris foncé
    dark: [44, 62, 80],             // Gris très foncé
    light: [240, 248, 255],         // Bleu très clair
    border: [204, 204, 204],        // Gris bordure
    white: [255, 255, 255],
    success: [230, 0, 57]           // Rose/Rouge L'école
  };

  // === BORDURES DE CHÈQUE PROFESSIONNELLES ===
  // Bordure principale épaisse
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(2);
  doc.rect(5, 5, 200, 90);
  
  // Bordure interne fine
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, 194, 84);

  // === EN-TÊTE PROFESSIONNEL SUPEMIR ===
  // Fond d'en-tête léger
  doc.setFillColor(...colors.light);
  doc.rect(8, 8, 194, 25, 'F');
  
  // Logo SUPEMIR depuis public/images avec gestion d'erreur améliorée
  let logoLoaded = false;
  try {
    // Essayer différents chemins possibles
    const logoPath = window.location.origin + '/images/super.png';
    doc.addImage(logoPath, 'PNG', 12, 12, 25, 12);
    logoLoaded = true;
  } catch (error) {
    try {
      // Essayer le chemin direct
      doc.addImage('/images/super.png', 'PNG', 12, 12, 25, 12);
      logoLoaded = true;
    } catch (error2) {
      try {
        // Essayer sans le slash initial
        doc.addImage('images/super.png', 'PNG', 12, 12, 25, 12);
        logoLoaded = true;
      } catch (error3) {
        console.log('Logo SUPEMIR non trouvé, utilisation du fallback');
        console.log('Erreurs:', error, error2, error3);
      }
    }
  }
  
  // Si le logo ne charge pas, dessiner l'étoile SUPEMIR stylisée
  if (!logoLoaded) {
    const centerX = 19;
    const centerY = 19;
    const outerRadius = 5;
    const innerRadius = 2.5;
    const spikes = 8;
    
    doc.setFillColor(...colors.primary);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    
    // Créer les points de l'étoile
    let starPath = '';
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        starPath += `M ${x} ${y} `;
      } else {
        starPath += `L ${x} ${y} `;
      }
    }
    starPath += 'Z';
    
    // Dessiner l'étoile avec des lignes
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const nextRadius = (i + 1) % 2 === 0 ? outerRadius : innerRadius;
      const nextAngle = ((i + 1) * Math.PI) / spikes;
      const nextX = centerX + Math.cos(nextAngle) * nextRadius;
      const nextY = centerY + Math.sin(nextAngle) * nextRadius;
      
      doc.line(x, y, nextX, nextY);
    }
    
    // Cercle central
    doc.setFillColor(...colors.white);
    doc.circle(centerX, centerY, 1.5, 'F');
  }
  
  // Informations SUPEMIR avec plus d'espace
  doc.setTextColor(...colors.primary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SUPEMIR', 45, 14);  // Plus d'espace - décalé à droite
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Empowering Your Future', 45, 18);
  
  doc.setTextColor(...colors.accent);
  doc.setFontSize(7);
  doc.text('Km 9 au sud de la route n°1 Casablanca-Rabat, Ain Sebaa', 45, 22);
  doc.text('Tél: +212 522 249 175 | Email: infos@supemir.com', 45, 25);

  // Titre REÇU à droite avec encadré
  doc.setFillColor(...colors.primary);
  doc.roundedRect(140, 12, 55, 15, 2, 2, 'F');
  
  doc.setTextColor(...colors.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REÇU DE PAIEMENT', 167, 18, { align: 'center' });
  
  // Numéro et date dans un encadré plus grand
  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(140, 28, 55, 6, 1, 1, 'FD');  // Hauteur augmentée de 4 à 6
  
  doc.setTextColor(...colors.primary);
  doc.setFontSize(7);
  const receiptNum = `N° SUPEMIR-${Date.now().toString().slice(-6)}`;
  doc.text(receiptNum, 167, 31, { align: 'center' });  // Position ajustée
  doc.text(new Date().toLocaleDateString('fr-FR'), 167, 33.5, { align: 'center' });  // Position ajustée

  // === LIGNE DE SÉPARATION ÉLÉGANTE ===
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1);
  doc.line(12, 36, 198, 36);
  
  // Petite ligne décorative
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.3);
  doc.line(12, 37, 198, 37);

  // === CORPS DU CHÈQUE PROFESSIONNEL ===
  let yPos = 45;

  // Section "Reçu de" avec design moderne
  doc.setFontSize(9);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Reçu de:', 15, yPos);
  
  // Ligne élégante pour le nom
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.5);
  doc.line(32, yPos + 1, 125, yPos + 1);
  
  // Nom de l'étudiant
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...colors.primary);
  doc.text(p.etudiant?.nomComplet || '___________________', 35, yPos - 1);

  // Montant dans un encadré professionnel
  doc.setFillColor(...colors.light);
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1.5);
  doc.roundedRect(135, yPos - 8, 60, 14, 3, 3, 'FD');
  
  doc.setTextColor(...colors.primary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${p.montant} DH`, 165, yPos - 1, { align: 'center' });

  // === DEUXIÈME LIGNE - MONTANT EN LETTRES ===
  yPos += 12;
  
  doc.setFontSize(9);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('La somme de:', 15, yPos);
  
  // Ligne pour montant en lettres
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.5);
  doc.line(42, yPos + 1, 195, yPos + 1);
  
  // Montant en lettres
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...colors.accent);
  const montantEnLettres = convertirMontantEnLettres(p.montant);
  doc.text(montantEnLettres, 45, yPos - 1);

  // === TROISIÈME LIGNE - DÉTAILS ===
  yPos += 12;
  
  // Formation/Cours
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Formation:', 15, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.accent);
  const formation = Array.isArray(p.cours) ? p.cours.join(', ') : p.cours;
  // Limiter la longueur du texte pour éviter le débordement
  const formationText = formation.length > 25 ? formation.substring(0, 25) + '...' : formation;
  doc.text(formationText, 38, yPos);
  
  // Période
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Période:', 120, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.accent);
  doc.text(`${formatDate(p.moisDebut)} (${p.nombreMois} mois)`, 140, yPos);

  // === SECTION SIGNATURE ET VALIDATION ===
  yPos += 15;
  
  // Date de paiement
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Casablanca, le:', 15, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.accent);
  doc.text(formatDate(p.createdAt), 45, yPos);
  
  // Zone signature professionnelle
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Administration SUPEMIR:', 120, yPos - 3);
  
  // Encadré signature élégant
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1);
  doc.roundedRect(120, yPos, 50, 12, 2, 2, 'D');
  
  doc.setFontSize(7);
  doc.setTextColor(...colors.secondary);
  doc.text('Signature & Cachet', 145, yPos + 6, { align: 'center' });

  // === BANDE DE VALIDATION FINALE ===
  yPos = 85;
  
 
  // Note si présente (positionnée mieux)
  if (p.note && p.note.trim() !== '') {
    doc.setTextColor(...colors.accent);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    const noteText = p.note.length > 60 ? p.note.substring(0, 60) + '...' : p.note;
    doc.text(`Note: ${noteText}`, 15, 78);
  }

  // === GÉNÉRATION ET OUVERTURE ===
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

// Fonction améliorée pour convertir le montant en lettres
function convertirMontantEnLettres(montant) {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dixaines = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (montant === 0) return 'zéro dirhams';
  if (montant === 1) return 'un dirham';
  
  let result = '';
  
  if (montant >= 1000) {
    const milliers = Math.floor(montant / 1000);
    result += milliers === 1 ? 'mille ' : convertirCentaines(milliers) + ' mille ';
    montant = montant % 1000;
  }
  
  if (montant >= 100) {
    const centaines = Math.floor(montant / 100);
    result += centaines === 1 ? 'cent ' : unites[centaines] + ' cents ';
    montant = montant % 100;
  }
  
  if (montant >= 20) {
    const diz = Math.floor(montant / 10);
    const unit = montant % 10;
    result += dizaines[diz];
    if (unit > 0) result += '-' + unites[unit];
    result += ' ';
  } else if (montant >= 10) {
    result += dixaines[montant - 10] + ' ';
  } else if (montant > 0) {
    result += unites[montant] + ' ';
  }
  
  result += 'dirhams';
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function convertirCentaines(nombre) {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dixaines = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  let result = '';
  
  if (nombre >= 100) {
    const centaines = Math.floor(nombre / 100);
    result += centaines === 1 ? 'cent' : unites[centaines] + ' cents';
    nombre = nombre % 100;
    if (nombre > 0) result += ' ';
  }
  
  if (nombre >= 20) {
    const diz = Math.floor(nombre / 10);
    const unit = nombre % 10;
    result += dizaines[diz];
    if (unit > 0) result += '-' + unites[unit];
  } else if (nombre >= 10) {
    result += dixaines[nombre - 10];
  } else if (nombre > 0) {
    result += unites[nombre];
  }
  
  return result;
}

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
              {paiement.cours}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => generatePDF(paiement)}
            style={styles.cardPdfButton}
            title="Télécharger PDF"
          >
            <Download size={20} />
          </button>
          <button
            onClick={() => openDetailModal(paiement)}
            style={{
              ...styles.cardPdfButton,
              backgroundColor: '#ECFDF5',
              color: '#10B981',
              marginLeft: '8px',
            }}
            title="Voir détails"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
              <path d="M2.04834 12.3178C1.98398 12.1126 1.98398 11.8874 2.04834 11.6822C3.11287 8.64174 7.23449 4 12 4C16.7655 4 20.8871 8.64174 21.9517 11.6822C22.016 11.8874 22.016 12.1126 21.9517 12.3178C20.8871 15.3583 16.7655 20 12 20C7.23449 20 3.11287 15.3583 2.04834 12.3178Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
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
        <div style={styles.cardDetailRow}>
          <span style={styles.cardDetailLabel}>Début:</span>
          <span style={styles.cardDetailValue}>{formatDate(paiement.moisDebut)}</span>
        </div>
        <div style={styles.cardDetailRow}>
          <span style={styles.cardDetailLabel}>Fin:</span>
          <span style={styles.cardDetailValue}>{calculerDateFin(paiement.moisDebut, paiement.nombreMois)}</span>
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
  backgroundColor: 'white', // Fond blanc
  borderRadius: '1rem',
  padding: '1.5rem',
  marginBottom: '2rem',
  boxShadow: '0 10px 15px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '0.5rem',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box'
},
title: {
  fontSize: '32px',
  fontWeight: 'bold',
  margin: 0,
  color: '#1f2937'
},
subtitle: {
  fontSize: '0.9rem',
  color: '#6b7280',
  margin: 0
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
      flexDirection: 'row',
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
      transition: 'all 0.3s ease',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
      transition: 'all 0.3s ease',
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
    tbody: {
      background: 'white',
    },
    tr: {
      borderBottom: '1px solid #F3F4F6',
      transition: 'background-color 0.2s ease',
    },
    trHover: {
      backgroundColor: '#F9FAFB',
    },
    td: {
      padding: '16px 24px',
      color: '#374151',
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
      background: '#3B82F6',
      color: 'white',
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
      transition: 'all 0.3s ease',
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
      transition: 'all 0.3s ease',
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
    emptyState: {
      textAlign: 'center',
      padding: '48px 0',
    },
    emptyIcon: {
      width: '64px',
      height: '64px',
      color: '#D1D5DB',
      margin: '0 auto 16px',
    }, filtersContainer: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    marginBottom: '24px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  
  filtersToggle: {
    width: '100%',
    background: '#F8FAFC',
    border: 'none',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#1F2937',
    borderBottom: showAdvancedFilters ? '1px solid #E5E7EB' : 'none',
  },
  
  filtersContent: {
    padding: showAdvancedFilters ? '24px' : '0',
    maxHeight: showAdvancedFilters ? '1000px' : '0',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  
  filterInput: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  
  filterSelect: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
  },
  
  filterCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  
  filtersActions: {
    display: 'flex',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB',
  },
  
  filterButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  
  applyButton: {
    background: '#3B82F6',
    color: 'white',
  },
  
  resetButton: {
    background: '#F3F4F6',
    color: '#6B7280',
  },
  
  filterBadge: {
    background: '#EFF6FF',
    color: '#1D4ED8',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '8px',
  },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#111827',
      marginBottom: '8px',
    },
    emptyText: {
      color: '#6B7280',
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
      maxWidth: '500px',
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
    modalCloseButton: {
      color: 'white',
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      padding: '8px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    modalBody: {
      padding: '24px',
      overflowY: 'auto',
      maxHeight: '400px',
    },
    modalEmpty: {
      textAlign: 'center',
      padding: '32px 0',
    },
    modalEmptyIcon: {
      width: '64px',
      height: '64px',
      background: '#DCFCE7',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
    },
    modalList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    modalItem: {
      background: '#FFF7ED',
      borderRadius: '12px',
      padding: '16px',
      borderLeft: '4px solid #F59E0B',
    },
    modalItemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    modalItemName: {
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 4px 0',
    },
    modalItemCourse: {
      fontSize: '14px',
      color: '#6B7280',
      margin: 0,
    },
    modalItemAmount: {
      color: '#F59E0B',
      fontWeight: 'bold',
    },
    modalItemDetails: {
      fontSize: '14px',
      color: '#6B7280',
      marginBottom: '12px',
    },
    modalItemExpiry: {
      fontWeight: '500',
      color: '#DC2626',
    },
    modalPayButton: {
      width: '100%',
      background: '#059669',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s ease',
    },
    detailModal: {
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
    detailModalContent: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'hidden',
    },
    detailModalHeader: {
      background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      color: 'white',
      padding: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailModalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
    },
    detailModalBody: {
      padding: '24px',
      overflowY: 'auto',
      maxHeight: '500px',
    },
    detailGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '24px',
    },
    detailItem: {
      background: '#F8FAFC',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
    },
    detailLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#64748B',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    detailValue: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1E293B',
    },
    detailFullWidth: {
      gridColumn: '1 / -1',
    },
    detailNote: {
      background: '#FEF3C7',
      border: '1px solid #FCD34D',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px',
    },
    detailNoteLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#92400E',
      marginBottom: '8px',
    },
    detailNoteText: {
      fontSize: '14px',
      color: '#451A03',
      lineHeight: '1.5',
    },
    detailActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #E2E8F0',
    },
    detailActionButton: {
      flex: 1,
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
    },
    detailPdfButton: {
      background: '#3B82F6',
      color: 'white',
    },
    detailCloseButton: {
      background: '#F1F5F9',
      color: '#475569',
    },
    responsive: {
      '@media (max-width: 768px)': {
        controlsRow: {
          flexDirection: 'column',
          alignItems: 'stretch',
        },
        searchContainer: {
          maxWidth: '100%',
        },
        title: {
          fontSize: '2rem',
        },
        cardsGrid: {
          gridTemplateColumns: '1fr',
        },
      },
    },
  };

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={{ 
          ...styles.header, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center' 
        }}>
          <h1 style={{ ...styles.title, textAlign: 'center', width: '100%' }}>
             Liste des Paiements
          </h1>
    
        </div>

        {/* Controls */}
        <div style={styles.controlsContainer}>
          <div style={styles.controlsRow}>
            {/* Search Bar */}
            <div style={styles.searchContainer}>
              <div style={styles.searchIcon}>
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, classe ou note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div style={styles.controlsRight}>
              {/* View Toggle */}
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

              {/* Alert Button */}
              <button
                onClick={toggleModal}
                style={styles.alertButton}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <AlertTriangle size={20} />
                <span>Alertes</span>
              </button>
            </div>
          </div>
        </div>
<AdvancedFilters />
<div style={styles.resultsCount}>
  <p>
    {filteredPaiements.length} paiement{filteredPaiements.length > 1 ? 's' : ''} trouvé{filteredPaiements.length > 1 ? 's' : ''}
    {searchTerm && ` pour "${searchTerm}"`}
    {getActiveFiltersCount() > 0 && (
      <span style={{ color: '#3B82F6', fontWeight: '500' }}>
        {' '}• {getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''} actif{getActiveFiltersCount() > 1 ? 's' : ''}
      </span>
    )}
  </p>
</div>
        {/* Results Count */}
        

        {/* Content */}
        {viewMode === 'table' ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Étudiant</th>
                  <th style={styles.th}>Classe</th>
                  <th style={styles.th}>Début</th>
                  <th style={styles.th}>Fin</th>
                  <th style={styles.th}>Durée</th>
                  <th style={styles.th}>Montant</th>
                  <th style={styles.th}>Payé le</th>
                  <th style={styles.th}>Note</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody style={styles.tbody}>
                {filteredPaiements
                  .slice() // نسخ المصفوفة حتى لا نعدل الأصلية
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((p, index) => (
                  <tr 
                    key={p._id} 
                    style={styles.tr}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = index % 2 === 0 ? 'white' : '#FAFAFA'}
                  >
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.tableAvatar}>
                          <User size={16} color="white" />
                        </div>
                        <span style={styles.userName}>{p.etudiant?.nomComplet || '—'}</span>
                      </div>
                    </td>
<td>{Array.isArray(p.cours) ? p.cours.join(', ') : p.cours}</td>
                    <td style={styles.td}>{formatDate(p.moisDebut)}</td>
                    <td style={styles.td}>{calculerDateFin(p.moisDebut, p.nombreMois)}</td>
                    <td style={styles.td}>
                      <span style={styles.durationBadge}>
                        {p.nombreMois} mois
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.amount}>{p.montant} Dh</span>
                    </td>
<td style={styles.td}>{formatDate(p.createdAt)}</td>
                    <td style={styles.td} title={p.note}>
                      {p.note ? (p.note.length > 20 ? p.note.substring(0, 20) + '...' : p.note) : '—'}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openDetailModal(p)}
                          style={{
                            ...styles.actionButton,
                            backgroundColor: '#10B981',
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
                          title="Voir détails"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
                            <path d="M2.04834 12.3178C1.98398 12.1126 1.98398 11.8874 2.04834 11.6822C3.11287 8.64174 7.23449 4 12 4C16.7655 4 20.8871 8.64174 21.9517 11.6822C22.016 11.8874 22.016 12.1126 21.9517 12.3178C20.8871 15.3583 16.7655 20 12 20C7.23449 20 3.11287 15.3583 2.04834 12.3178Z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => generatePDF(p)}
                          style={styles.actionButton}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563EB'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#3B82F6'}
                          title="Télécharger PDF"
                        >
                          <Download size={16} />
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
            {filteredPaiements
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(p => (
                <CardView key={p._id} paiement={p} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredPaiements.length === 0 && (
          <div style={styles.emptyState}>
            <CreditCard size={64} color="#D1D5DB" />
            <h3 style={styles.emptyTitle}>Aucun paiement trouvé</h3>
            <p style={styles.emptyText}>
              {searchTerm ? 'Essayez avec d\'autres termes de recherche' : 'Aucun paiement enregistré pour le moment'}
            </p>
          </div>
        )}

        {/* Modal des paiements expirés */}
        {showModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  <AlertTriangle size={24} />
                  Paiements Expirés
                </h3>
                <button
                  onClick={toggleModal}
                  style={styles.modalCloseButton}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                >
                  <X size={20} />
                </button>
              </div>
              {/* ✅ زر فتح صفحة paiements-exp */}
              <div style={{ padding: '0 24px 16px 24px', textAlign: 'right' }}>
                <button
                  onClick={() => window.location.href = '/paiements-exp'}
                  style={{
                    background: 'linear-gradient(to right, #ef4444, #f97316)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: 'white',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    float: 'right'
                  }}
                >
                  <AlertTriangle size={18} />
                  Voir tous
                </button>
              </div>
              <div style={styles.modalBody}>
                {expirés.length === 0 ? (
                  <div style={styles.modalEmpty}>
                    <div style={styles.modalEmptyIcon}>
                      <span style={{ fontSize: '32px' }}>✅</span>
                    </div>
                    <p style={styles.emptyText}>Aucun paiement expiré pour l'instant</p>
                  </div>
                ) : (
                  <div style={styles.modalList}>
                    {expirés
                      .filter(p => p.etudiant?.actif)
                      .map(p => (
                        <div key={p._id} style={styles.modalItem}>
                          <div style={styles.modalItemHeader}>
                            <div>
                              <h4 style={styles.modalItemName}>{p.etudiant?.nomComplet}</h4>
                              <p style={styles.modalItemCourse}>{p.cours}</p>
                            </div>
                            <span style={styles.modalItemAmount}>{p.montant} Dh</span>
                          </div>
                          
                          <div style={styles.modalItemDetails}>
                            <p>⏳ Du {formatDate(p.moisDebut)} pendant {p.nombreMois} mois</p>
                            <p style={styles.modalItemExpiry}>
                              📆 Expire le : {calculerDateFin(p.moisDebut, p.nombreMois)}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => payerEtudiant(p.etudiant?._id, p.cours)}
                            style={styles.modalPayButton}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
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

        {/* Modal des détails du paiement */}
        {showDetailModal && selectedPaiement && (
          <div style={styles.detailModal}>
            <div style={styles.detailModalContent}>
              <div style={styles.detailModalHeader}>
                <h3 style={styles.detailModalTitle}>
                  <CreditCard size={24} />
                  Détails du Paiement
                </h3>
                <button
                  onClick={closeDetailModal}
                  style={styles.modalCloseButton}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={styles.detailModalBody}>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>
                      <User size={16} />
                      Étudiant
                    </div>
                    <div style={styles.detailValue}>
                      {selectedPaiement.etudiant?.nomComplet || '—'}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>
                      <BookOpen size={16} />
                      Classe
                    </div>
                    <div style={styles.detailValue}>
                      {Array.isArray(selectedPaiement.cours) 
                        ? selectedPaiement.cours.join(', ') 
                        : selectedPaiement.cours}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>
                      <DollarSign size={16} />
                      Montant
                    </div>
                    <div style={{...styles.detailValue, color: '#059669'}}>
                      {selectedPaiement.montant} Dh
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>
                      <Calendar size={16} />
                      Durée
                    </div>
                    <div style={styles.detailValue}>
                      {selectedPaiement.nombreMois} mois
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>
                      <Calendar size={16} />
                      Date de début
                    </div>
                    <div style={styles.detailValue}>
                      {formatDate(selectedPaiement.moisDebut)}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>
                      <Calendar size={16} />
                      Date de fin
                    </div>
                    <div style={styles.detailValue}>
                      {calculerDateFin(selectedPaiement.moisDebut, selectedPaiement.nombreMois)}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>
                      <Calendar size={16} />
                      Payé le
                    </div>
                    <div style={styles.detailValue}>
                      {formatDate(selectedPaiement.createdAt)}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>
                      ID de paiement
                    </div>
                    <div style={{...styles.detailValue, fontSize: '14px', fontFamily: 'monospace'}}>
                      {selectedPaiement._id}
                    </div>
                  </div>
                </div>
                {selectedPaiement.note && (
                  <div style={styles.detailNote}>
                    <div style={styles.detailNoteLabel}>
                      📝 Note
                    </div>
                    <div style={styles.detailNoteText}>
                      {selectedPaiement.note}
                    </div>
                  </div>
                )}
                <div style={styles.detailActions}>
                  <button
                    onClick={() => generatePDF(selectedPaiement)}
                    style={{
                      ...styles.detailActionButton,
                      ...styles.detailPdfButton,
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563EB'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3B82F6'}
                  >
                    <Download size={16} />
                    Télécharger PDF
                  </button>
                  <button
                    onClick={closeDetailModal}
                    style={{
                      ...styles.detailActionButton,
                      ...styles.detailCloseButton,
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#E2E8F0'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                  >
                    <X size={16} />
                    Fermer
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