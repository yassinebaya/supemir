const mongoose = require('mongoose');

const formulaireEvaluationSchema = new mongoose.Schema({
  etudiant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etudiant',
    required: true
  },
  commercial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commercial',
    required: true
  },
  evaluateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Documents avec validation simple OUI/NON
  documents: {
    photo: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    cin: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    passeport: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    bac: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    releveNote: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    diplome: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    attestationReussite: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    releveNote1: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    releveNote2: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    releveNote3: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    premiereMasterIngenieur: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    },
    
    deuxiemeMasterIngenieur: {
      valide: {
        type: Boolean,
        default: false
      },
      commentaire: {
        type: String,
        default: ''
      }
    }
  },
  
  // Statut global de l'évaluation
  statutEvaluation: {
    type: String,
    enum: ['en_cours', 'complet', 'incomplet'],
    default: 'en_cours'
  },
  
  // Commentaire général
  commentaireGeneral: {
    type: String,
    default: ''
  },
  
  // Score automatique (nombre de documents valides)
  scoreDocuments: {
    type: Number,
    default: 0
  },
  
  // Pourcentage de documents valides
  pourcentageValidite: {
    type: Number,
    default: 0
  },
  
  // Date d'expiration de l'évaluation
  dateExpiration: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  
  // Date de finalisation
  dateFinale: {
    type: Date,
    default: null
  },
  
  // Indicateur si l'évaluation est expirée
  expire: {
    type: Boolean,
    default: false
  }
  
}, { 
  timestamps: true 
});

// Méthode pour calculer le score automatiquement
formulaireEvaluationSchema.methods.calculerScore = function() {
  let score = 0;
  let totalDocuments = 0;
  
  // Parcourir tous les documents
  for (const [docType, docData] of Object.entries(this.documents)) {
    totalDocuments++;
    if (docData.valide) {
      score++;
    }
  }
  
  this.scoreDocuments = score;
  this.pourcentageValidite = totalDocuments > 0 ? Math.round((score / totalDocuments) * 100) : 0;
  
  return {
    score: this.scoreDocuments,
    total: totalDocuments,
    pourcentage: this.pourcentageValidite
  };
};

// Méthode pour vérifier si l'évaluation est expirée
formulaireEvaluationSchema.methods.verifierExpiration = function() {
  const maintenant = new Date();
  this.expire = maintenant > this.dateExpiration;
  return this.expire;
};

// Méthode pour finaliser l'évaluation
formulaireEvaluationSchema.methods.finaliser = function(statut) {
  if (['complet', 'incomplet'].includes(statut)) {
    this.statutEvaluation = statut;
    this.dateFinale = new Date();
    this.calculerScore();
  }
  return this;
};

// Middleware pre-save
formulaireEvaluationSchema.pre('save', function(next) {
  this.calculerScore();
  this.verifierExpiration();
  next();
});

// Virtual pour savoir si l'évaluation peut encore être modifiée
formulaireEvaluationSchema.virtual('peutEtreModifiee').get(function() {
  return !this.expire && this.statutEvaluation === 'en_cours';
});

formulaireEvaluationSchema.set('toJSON', { virtuals: true });
formulaireEvaluationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FormulaireEvaluation', formulaireEvaluationSchema);