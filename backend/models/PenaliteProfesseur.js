// 1. NOUVEAU MODÈLE : PenaliteProfesseur
const mongoose = require('mongoose');

const penaliteProfesseurSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['pourcentage', 'montant_fixe'],
    required: true
  },
  valeur: {
    type: Number,
    required: true
  },
  montantOriginal: {
    type: Number,
    required: true
  },
  montantAjuste: {
    type: Number,
    required: true
  },
  motif: {
    type: String,
    required: true
  },
  appliquePour: {
    type: String,
    enum: ['mois_actuel', 'permanent'],
    default: 'mois_actuel'
  },
  appliquePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  dateApplication: {
    type: Date,
    default: Date.now
  },
  actif: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index pour éviter les doublons
penaliteProfesseurSchema.index({ professeur: 1, mois: 1, annee: 1 });

module.exports = mongoose.model('PenaliteProfesseur', penaliteProfesseurSchema);
