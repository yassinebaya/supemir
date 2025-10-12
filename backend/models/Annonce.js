const mongoose = require('mongoose');

const annonceSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  cours: [{
    type: String,
    required: true
  }],
  
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professeur',
    required: true
  },
  
  dateDebut: {
    type: Date,
    required: true
  },
  
  dateFin: {
    type: Date,
    required: true
  },
  
  actif: {
    type: Boolean,
    default: true
  },
  
  priorite: {
    type: String,
    enum: ['normale', 'importante', 'urgente'],
    default: 'normale'
  },
  
  // Pour tracker qui a vu l'annonce
  vuesPar: [{
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Etudiant'
    },
    dateVue: {
      type: Date,
      default: Date.now
    }
  }]
  
}, { timestamps: true });

// Index pour optimiser les recherches
annonceSchema.index({ cours: 1, actif: 1, dateFin: 1 });
annonceSchema.index({ professeur: 1 });

// Méthode pour vérifier si l'annonce est encore valide
annonceSchema.methods.estValide = function() {
  const maintenant = new Date();
  return this.actif && 
         this.dateDebut <= maintenant && 
         this.dateFin >= maintenant;
};

// Méthode statique pour obtenir les annonces actives pour un étudiant
annonceSchema.statics.getAnnoncesActives = function(coursEtudiant) {
  const maintenant = new Date();
  return this.find({
    cours: { $in: coursEtudiant },
    actif: true,
    dateDebut: { $lte: maintenant },
    dateFin: { $gte: maintenant }
  })
  .populate('professeur', 'nom email')
  .sort({ priorite: -1, createdAt: -1 });
};

// Middleware pour désactiver automatiquement les annonces expirées
annonceSchema.pre('find', function() {
  const maintenant = new Date();
  this.where({ dateFin: { $gte: maintenant } });
});

module.exports = mongoose.model('Annonce', annonceSchema);