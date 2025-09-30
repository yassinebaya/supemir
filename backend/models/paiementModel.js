const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
  etudiant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etudiant',
    required: true
  },
  cours: {
    type: [String],
    required: true
  },
  moisDebut: {
    type: Date,
    required: true
  },
  nombreMois: {
    type: Number,
    required: true
  },
  montant: {
    type: Number,
    required: true
  },
  note: {
    type: String
  },
  
  // NOUVEAU: Type de paiement pour différencier
  typePaiement: {
    type: String,
    enum: ['inscription', 'formation', 'autre'],
    default: 'formation'
  },
  
  // NOUVEAU: Numéro de tranche (optionnel)
  numeroTranche: {
    type: Number,
    default: null
  },
  
  // NOUVEAU: Mode de paiement associé (pour référence)
  modePaiement: {
    type: String,
    enum: ['annuel', 'semestriel', 'trimestriel', 'mensuel'],
    default: null
  },
  
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// MÉTHODES UTILITAIRES

// Méthode statique pour calculer le total payé par un étudiant
paiementSchema.statics.getTotalPayeParEtudiant = async function(etudiantId) {
  const result = await this.aggregate([
    { $match: { etudiant: new mongoose.Types.ObjectId(etudiantId) } },
    { $group: { _id: null, total: { $sum: '$montant' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

// Méthode statique pour obtenir les paiements d'inscription d'un étudiant
paiementSchema.statics.getPaiementsInscription = async function(etudiantId) {
  return await this.find({
    etudiant: etudiantId,
    estInscription: true
  }).sort({ createdAt: 1 });
};

// Méthode statique pour obtenir les paiements de formation d'un étudiant
paiementSchema.statics.getPaiementsFormation = async function(etudiantId) {
  return await this.find({
    etudiant: etudiantId,
    estInscription: false
  }).sort({ createdAt: 1 });
};

// Méthode statique pour obtenir les revenus mensuels
paiementSchema.statics.getRevenusMensuels = async function(annee, mois) {
  const debutMois = new Date(annee, mois - 1, 1);
  const finMois = new Date(annee, mois, 0);
  
  const result = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: debutMois,
          $lte: finMois
        }
      }
    },
    {
      $group: {
        _id: '$typePaiement',
        total: { $sum: '$montant' },
        nombre: { $sum: 1 }
      }
    }
  ]);
  
  return result;
};

// Index pour optimiser les requêtes
paiementSchema.index({ etudiant: 1, typePaiement: 1 });
paiementSchema.index({ createdAt: 1 });
paiementSchema.index({ etudiant: 1, numeroTranche: 1 });

module.exports = mongoose.model('Paiement', paiementSchema);