// models/PaiementProfesseur.js
const mongoose = require('mongoose');

const paiementProfesseurSchema = new mongoose.Schema({
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professeur',
    required: true
  },
  mois: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  annee: {
    type: Number,
    required: true
  },
  
  // Détails financiers
  montantBrut: {
    type: Number,
    required: true,
    default: 0
  },
  ajustements: {
    type: Number,
    default: 0
  },
  montantNet: {
    type: Number,
    required: true
  },
  
  // Statut du paiement
  statut: {
    type: String,
    enum: ['en_attente', 'valide', 'paye', 'annule'],
    default: 'en_attente'
  },
  
  // Informations de validation
  valideePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  dateValidation: {
    type: Date,
    default: null
  },
  
  // Informations de paiement
  payePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  datePaiement: {
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
  
  // Détails des séances incluses
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
  
  // Pénalités appliquées
  penalitesAppliquees: [{
    penaliteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PenaliteProfesseur'
    },
    motif: String,
    montant: Number
  }],
  
  // Notes et commentaires
  notes: {
    type: String,
    default: ''
  },
  
  // Traçabilité
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

// Index pour éviter les doublons
paiementProfesseurSchema.index({ professeur: 1, mois: 1, annee: 1 }, { unique: true });

// Méthode pour calculer automatiquement le montant net
paiementProfesseurSchema.methods.calculerMontantNet = function() {
  this.montantNet = this.montantBrut - this.ajustements;
  return this.montantNet;
};

// Méthode pour valider le paiement
paiementProfesseurSchema.methods.valider = function(adminId) {
  this.statut = 'valide';
  this.valideePar = adminId;
  this.dateValidation = new Date();
};

// Méthode pour marquer comme payé
paiementProfesseurSchema.methods.marquerPaye = function(adminId, methodePaiement, reference = '') {
  this.statut = 'paye';
  this.payePar = adminId;
  this.datePaiement = new Date();
  this.methodePaiement = methodePaiement;
  this.referencePaiement = reference;
};

module.exports = mongoose.model('PaiementProfesseur', paiementProfesseurSchema);