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
  
  // ✅ NOUVEAU: Numéro de série unique et obligatoire
  numeroSerie: {
    type: String,
    required: [false, 'Le numéro de série est obligatoire'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return v && v.length >= 3; // Minimum 3 caractères
      },
      message: 'Le numéro de série doit contenir au moins 3 caractères'
    }
  },
  
  // Type de paiement pour différencier inscription/formation
  typePaiement: {
    type: String,
    enum: ['inscription', 'formation', 'autre'],
    default: 'formation'
  },
  
  // Pour compatibilité avec l'ancien code
  estInscription: {
    type: Boolean,
    default: false
  },
  
  // Numéro de tranche (pour les paiements échelonnés)
  numeroTranche: {
    type: Number,
    default: null
  },
  
  // Mode de paiement associé (pour référence)
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

// ============================================
// MÉTHODES UTILITAIRES
// ============================================

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
    $or: [
      { typePaiement: 'inscription' },
      { estInscription: true }
    ]
  }).sort({ createdAt: 1 });
};

// Méthode statique pour obtenir les paiements de formation d'un étudiant
paiementSchema.statics.getPaiementsFormation = async function(etudiantId) {
  return await this.find({
    etudiant: etudiantId,
    $or: [
      { typePaiement: 'formation' },
      { estInscription: false }
    ]
  }).sort({ createdAt: 1 });
};

// ✅ NOUVEAU: Méthode pour vérifier si un numéro de série existe
paiementSchema.statics.serieExiste = async function(numeroSerie, excludeId = null) {
  const query = { 
    numeroSerie: numeroSerie.trim().toUpperCase() 
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const paiement = await this.findOne(query);
  return paiement !== null;
};

// ✅ NOUVEAU: Générer un numéro de série automatique (optionnel)
paiementSchema.statics.genererNumeroSerie = async function() {
  const annee = new Date().getFullYear();
  const mois = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Compter les paiements du mois en cours
  const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const finMois = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  const count = await this.countDocuments({
    createdAt: { $gte: debutMois, $lte: finMois }
  });
  
  const numero = String(count + 1).padStart(4, '0');
  return `PAY-${annee}${mois}-${numero}`;
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

// ✅ NOUVEAU: Statistiques par numéro de série
paiementSchema.statics.getStatistiquesSeries = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: {
          $substr: ['$numeroSerie', 0, 11] // Grouper par préfixe (ex: PAY-202501)
        },
        totalMontant: { $sum: '$montant' },
        nombrePaiements: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// ✅ NOUVEAU: Méthode d'instance pour obtenir les infos complètes
paiementSchema.methods.getInfosCompletes = async function() {
  await this.populate('etudiant', 'nomComplet telephone email');
  await this.populate('creePar', 'nom email');
  return this;
};

// ============================================
// HOOKS (Middleware)
// ============================================

// Hook avant la sauvegarde pour synchroniser estInscription avec typePaiement
paiementSchema.pre('save', function(next) {
  if (this.typePaiement === 'inscription') {
    this.estInscription = true;
  } else if (this.typePaiement === 'formation') {
    this.estInscription = false;
  }
  next();
});

// ✅ NOUVEAU: Hook pour formater automatiquement le numéro de série
paiementSchema.pre('save', function(next) {
  if (this.numeroSerie) {
    this.numeroSerie = this.numeroSerie.trim().toUpperCase();
  }
  next();
});

// Hook après suppression pour nettoyer les références
paiementSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    console.log(`Paiement supprimé: ${doc.numeroSerie}`);
    // Vous pouvez ajouter ici une logique pour logger la suppression
    // ou mettre à jour d'autres collections si nécessaire
  }
});

// ============================================
// INDEX POUR OPTIMISER LES REQUÊTES
// ============================================

// Index unique pour le numéro de série
paiementSchema.index({ numeroSerie: 1 }, { unique: true });

// Index composés pour les recherches fréquentes
paiementSchema.index({ etudiant: 1, typePaiement: 1 });
paiementSchema.index({ etudiant: 1, createdAt: -1 });
paiementSchema.index({ etudiant: 1, numeroTranche: 1 });
paiementSchema.index({ createdAt: -1 });
paiementSchema.index({ typePaiement: 1, createdAt: -1 });

// ✅ NOUVEAU: Index pour recherche par série
paiementSchema.index({ numeroSerie: 'text' });

// Index pour les statistiques
paiementSchema.index({ createdAt: 1, typePaiement: 1 });

// ============================================
// MÉTHODES VIRTUELLES
// ============================================

// Virtual pour obtenir la date de fin du paiement
paiementSchema.virtual('dateFin').get(function() {
  const dateFin = new Date(this.moisDebut);
  dateFin.setMonth(dateFin.getMonth() + this.nombreMois);
  return dateFin;
});

// Virtual pour vérifier si le paiement est expiré
paiementSchema.virtual('estExpire').get(function() {
  return new Date() > this.dateFin;
});

// Virtual pour calculer les jours restants
paiementSchema.virtual('joursRestants').get(function() {
  const maintenant = new Date();
  const difference = this.dateFin - maintenant;
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
});


paiementSchema.set('toJSON', { virtuals: true });
paiementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Paiement', paiementSchema);