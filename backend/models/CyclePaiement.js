// models/CyclePaiement.js
const mongoose = require('mongoose');

const cyclePaiementSchema = new mongoose.Schema({
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professeur',
    required: true
  },
  numeroCycle: {
    type: Number,
    required: true,
    default: 1
  },
  
  // Période du cycle
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    default: null // null = cycle en cours
  },
  
  // Montants
  montantBrut: {
    type: Number,
    default: 0
  },
  ajustements: {
    type: Number,
    default: 0
  },
  montantNet: {
    type: Number,
    default: 0
  },
  
  // Statuts du processus
  statut: {
    type: String,
    enum: ['en_cours', 'valide_finance', 'paye_admin', 'archive'],
    default: 'en_cours'
  },
  
  // Étape 1: Validation par Finance
  valideParFinance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceProf',
    default: null
  },
  dateValidationFinance: {
    type: Date,
    default: null
  },
  notesFinance: {
    type: String,
    default: ''
  },
  
  // Étape 2: Paiement par Admin
  payeParAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  datePaiementAdmin: {
    type: Date,
    default: null
  },
  methodePaiement: {
    type: String,
    enum: ['virement', 'cheque', 'especes'],
    default: null
  },
  referencePaiement: {
    type: String,
    default: ''
  },
  notesAdmin: {
    type: String,
    default: ''
  },
  
  // Séances incluses dans ce cycle
  seancesIncluses: [{
    seanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seance'
    },
    cours: String,
    date: Date,
    heures: Number,
    montant: Number
  }],
  
  // Pénalités appliquées à ce cycle
  penalitesAppliquees: [{
    penaliteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PenaliteProfesseur'
    },
    motif: String,
    montant: Number
  }],
  
  creeParAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  actif: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index pour éviter les doublons et optimiser les requêtes
cyclePaiementSchema.index({ professeur: 1, numeroCycle: 1 }, { unique: true });
cyclePaiementSchema.index({ professeur: 1, statut: 1 });
cyclePaiementSchema.index({ statut: 1, actif: 1 });

// Méthodes du modèle
cyclePaiementSchema.methods.validerParFinance = function(financeId, notes = '') {
  this.statut = 'valide_finance';
  this.valideParFinance = financeId;
  this.dateValidationFinance = new Date();
  this.notesFinance = notes;
};

cyclePaiementSchema.methods.payerParAdmin = function(adminId, methodePaiement, reference = '', notes = '') {
  this.statut = 'paye_admin';
  this.payeParAdmin = adminId;
  this.datePaiementAdmin = new Date();
  this.methodePaiement = methodePaiement;
  this.referencePaiement = reference;
  this.notesAdmin = notes;
  this.dateFin = new Date(); // Fermer le cycle
};

cyclePaiementSchema.methods.archiverCycle = function() {
  this.statut = 'archive';
  this.dateFin = new Date();
};

// Méthode statique pour créer un nouveau cycle
cyclePaiementSchema.statics.creerNouveauCycle = async function(professeurId, adminId) {
  const CyclePaiement = this;
  
  // Trouver le dernier numéro de cycle pour ce professeur
  const dernierCycle = await CyclePaiement.findOne({
    professeur: professeurId
  }).sort({ numeroCycle: -1 });
  
  const nouveauNumero = dernierCycle ? dernierCycle.numeroCycle + 1 : 1;
  
  const nouveauCycle = new CyclePaiement({
    professeur: professeurId,
    numeroCycle: nouveauNumero,
    dateDebut: new Date(),
    creeParAdmin: adminId
  });
  
  await nouveauCycle.save();
  return nouveauCycle;
};

// Méthode statique pour obtenir le cycle en cours d'un professeur
cyclePaiementSchema.statics.getCycleEnCours = async function(professeurId) {
  return await this.findOne({
    professeur: professeurId,
    statut: 'en_cours',
    actif: true
  });
};

// Méthode statique pour calculer et mettre à jour un cycle
cyclePaiementSchema.statics.calculerCycle = async function(professeurId, cycleId) {
  const CyclePaiement = this;
  const Seance = mongoose.model('Seance');
  const PenaliteProfesseur = mongoose.model('PenaliteProfesseur');
  const Professeur = mongoose.model('Professeur');
  
  const cycle = await CyclePaiement.findById(cycleId);
  if (!cycle) throw new Error('Cycle non trouvé');
  
  const professeur = await Professeur.findById(professeurId);
  if (!professeur) throw new Error('Professeur non trouvé');
  
  // Récupérer toutes les séances non payées de ce professeur
  const seancesNonPayees = await Seance.find({
    professeur: professeurId,
    actif: true,
    payee: { $ne: true }, // Séances pas encore payées
    typeSeance: { $ne: 'rattrapage' }
  }).populate('coursId', 'nom').lean();
  
  let montantBrut = 0;
  const seancesIncluses = [];
  
  // Calculer le montant brut
  for (const seance of seancesNonPayees) {
    const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
    const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
    const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;
    
    const montantSeance = dureeHeures * (professeur.tarifHoraire || 0);
    montantBrut += montantSeance;
    
    // Résoudre le nom du cours
    let nomCours = 'Cours non spécifié';
    if (seance.coursId && seance.coursId.nom) {
      nomCours = seance.coursId.nom;
    } else if (seance.cours) {
      nomCours = seance.cours;
    }
    
    seancesIncluses.push({
      seanceId: seance._id,
      cours: nomCours,
      date: seance.dateSeance,
      heures: Math.round(dureeHeures * 100) / 100,
      montant: Math.round(montantSeance * 100) / 100
    });
  }
  
  // Appliquer les pénalités actives
  let ajustements = 0;
  const penalitesAppliquees = [];
  
  const penalites = await PenaliteProfesseur.find({
    professeur: professeurId,
    actif: true,
    $or: [
      { appliquePour: 'permanent' },
      { 
        appliquePour: 'mois_actuel',
        mois: { $in: [new Date().getMonth() + 1] }, // Simplification
        annee: new Date().getFullYear()
      }
    ]
  });
  
  for (const penalite of penalites) {
    let ajustement = 0;
    if (penalite.type === 'pourcentage') {
      ajustement = (montantBrut * penalite.valeur) / 100;
    } else {
      ajustement = penalite.valeur;
    }
    
    ajustements += ajustement;
    penalitesAppliquees.push({
      penaliteId: penalite._id,
      motif: penalite.motif,
      montant: ajustement
    });
  }
  
  // Mettre à jour le cycle
  cycle.montantBrut = Math.round(montantBrut * 100) / 100;
  cycle.ajustements = Math.round(ajustements * 100) / 100;
  cycle.montantNet = Math.round((montantBrut - ajustements) * 100) / 100;
  cycle.seancesIncluses = seancesIncluses;
  cycle.penalitesAppliquees = penalitesAppliquees;
  
  await cycle.save();
  return cycle;
};

module.exports = mongoose.model('CyclePaiement', cyclePaiementSchema);