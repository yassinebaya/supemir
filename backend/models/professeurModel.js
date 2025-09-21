const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const professeurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  
  genre: {
    type: String,
    enum: ['Homme', 'Femme'],
    required: true
  },
  
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  
  motDePasse: {
    type: String,
    required: true
  },
  
  telephone: {
    type: String,
    required: false,
    trim: true
  },
  
  dateNaissance: {
    type: Date,
    required: false
  },
  
  image: {
    type: String, // URL de l'image ou chemin local (uploads/...)
    default: ''
  },
  
  actif: {
    type: Boolean,
    default: true
  },
  
  // ===== NOUVEAU SYSTÈME : COURS AVEC MATIÈRES ASSOCIÉES =====
  coursEnseignes: [{
    nomCours: {
      type: String,
      required: true,
      trim: true
    },
    matiere: {
      type: String,
      required: true,
      trim: true
    },
    // Optionnel : ajouter des informations supplémentaires
    niveau: {
      type: String,
      required: false
    },
    heuresParSemaine: {
      type: Number,
      required: false,
      min: 0
    }
  }],
  
  // ===== ANCIENS CHAMPS (gardés pour compatibilité) =====
  cours: {
    type: [String],
    default: []
  },
  
  matiere: {
    type: String,
    required: false
  },
  
  // ===== STATUT PROFESSIONNEL =====
  // Checkbox : coché = permanent, non coché = temporaire/entrepreneur
  estPermanent: {
    type: Boolean,
    default: true
  },
  // Ajoutez ces champs dans le professeurSchema :

creeParPedagogique: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Pedagogique',
  default: null
},

creeParAdmin: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
  default: null
},

// Champ pour identifier le type de créateur
typeDeCree: {
  type: String,
  enum: ['admin', 'pedagogique', 'auto'],
  default: 'admin'
},
  // Si estPermanent = false, alors c'est un entrepreneur
  // et on peut saisir le tarif horaire
  tarifHoraire: {
    type: Number,
    required: function() {
      return !this.estPermanent; // Obligatoire seulement si entrepreneur
    },
    min: 0,
    validate: {
      validator: function(value) {
        // Si c'est un entrepreneur, le tarif doit être > 0
        if (!this.estPermanent && (!value || value <= 0)) {
          return false;
        }
        return true;
      },
      message: 'Le tarif horaire est obligatoire pour les entrepreneurs et doit être supérieur à 0'
    }
  },
  
  // ===== DOCUMENTS POUR LES ENTREPRENEURS =====
  documents: {
    diplome: {
      type: String, // Chemin vers le fichier diplôme
      default: '',
      validate: {
        validator: function(value) {
          // Si entrepreneur et diplôme fourni, vérifier le format
          if (!this.estPermanent && value) {
            return /\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(value);
          }
          return true;
        },
        message: 'Format de fichier diplôme invalide'
      }
    },
    cv: {
      type: String, // Chemin vers le fichier CV
      default: '',
      validate: {
        validator: function(value) {
          if (!this.estPermanent && value) {
            return /\.(pdf|doc|docx)$/i.test(value);
          }
          return true;
        },
        message: 'Format de fichier CV invalide'
      }
    },
    rib: {
      type: String, // Chemin vers le fichier RIB
      default: '',
      validate: {
        validator: function(value) {
          if (!this.estPermanent && value) {
            return /\.(pdf|jpg|jpeg|png)$/i.test(value);
          }
          return true;
        },
        message: 'Format de fichier RIB invalide'
      }
    },
    copieCin: {
      type: String, // Chemin vers copie CIN
      default: '',
      validate: {
        validator: function(value) {
          if (!this.estPermanent && value) {
            return /\.(pdf|jpg|jpeg|png)$/i.test(value);
          }
          return true;
        },
        message: 'Format de fichier CIN invalide'
      }
    },
    engagement: {
      type: String, // Chemin vers lettre d'engagement
      default: '',
      validate: {
        validator: function(value) {
          if (!this.estPermanent && value) {
            return /\.(pdf|doc|docx)$/i.test(value);
          }
          return true;
        },
        message: 'Format de fichier engagement invalide'
      }
    },
    vacataire: {
      type: String, // Chemin vers contrat vacataire
      default: '',
      validate: {
        validator: function(value) {
          if (!this.estPermanent && value) {
            return /\.(pdf|doc|docx)$/i.test(value);
          }
          return true;
        },
        message: 'Format de fichier contrat vacataire invalide'
      }
    }
  },
  
  // ===== INFORMATIONS SUPPLÉMENTAIRES =====
  lastSeen: {
    type: Date,
    default: null
  },
  
  // Informations administratives
  dateEmbauche: {
    type: Date,
    default: Date.now
  },
  
  // Statut du dossier (pour les entrepreneurs)
  statutDossier: {
    type: String,
    enum: ['complet', 'incomplet', 'en_attente', 'valide', 'rejete'],
    default: function() {
      return this.estPermanent ? 'complet' : 'incomplet';
    }
  },
  
  // Notes administratives
  notes: {
    type: String,
    default: ''
  }
  
}, { 
  timestamps: true,
  // Index pour optimiser les recherches
  indexes: [
    { email: 1 },
    { actif: 1 },
    { estPermanent: 1 },
    { 'coursEnseignes.nomCours': 1 },
    { 'coursEnseignes.matiere': 1 }
  ]
});

// ===== MÉTHODES D'INSTANCE =====

// Méthode pour comparer le mot de passe
professeurSchema.methods.comparePassword = function(motDePasse) {
  return bcrypt.compare(motDePasse, this.motDePasse);
};

// Méthode pour obtenir le nom complet formaté
professeurSchema.methods.getNomComplet = function() {
  return this.nom.trim();
};

// Méthode pour vérifier si le dossier est complet (entrepreneurs)
professeurSchema.methods.isDossierComplet = function() {
  if (this.estPermanent) {
    return true; // Les permanents n'ont pas besoin de dossier complet
  }
  
  // Pour les entrepreneurs, vérifier les documents obligatoires
  const documentsObligatoires = ['diplome', 'cv', 'rib', 'copieCin'];
  return documentsObligatoires.every(doc => 
    this.documents[doc] && this.documents[doc].trim() !== ''
  );
};

// Méthode pour obtenir les cours enseignés (format lisible)
professeurSchema.methods.getCoursFormattes = function() {
  return this.coursEnseignes.map(cours => 
    `${cours.nomCours} (${cours.matiere})`
  ).join(', ');
};

// Méthode pour calculer le nombre total d'heures par semaine
professeurSchema.methods.getTotalHeuresParSemaine = function() {
  return this.coursEnseignes.reduce((total, cours) => 
    total + (cours.heuresParSemaine || 0), 0
  );
};

// ===== MIDDLEWARE PRE-SAVE =====

// Hash du mot de passe avant sauvegarde
professeurSchema.pre('save', async function(next) {
  try {
    // Hash du mot de passe seulement s'il a été modifié
    if (this.isModified('motDePasse')) {
      const salt = await bcrypt.genSalt(10);
      this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    }
    
    // Validation entrepreneur
    if (!this.estPermanent) {
      // Vérifier le tarif horaire
      if (!this.tarifHoraire || this.tarifHoraire <= 0) {
        const error = new Error('Le tarif horaire est obligatoire pour les entrepreneurs et doit être supérieur à 0');
        return next(error);
      }
    } else {
      // Si permanent, effacer le tarif horaire
      this.tarifHoraire = undefined;
    }
    
    // Mettre à jour le statut du dossier automatiquement
    if (!this.estPermanent) {
      this.statutDossier = this.isDossierComplet() ? 'complet' : 'incomplet';
    }
    
    // Synchroniser avec l'ancien système (cours/matiere)
    if (this.coursEnseignes && this.coursEnseignes.length > 0) {
      // Extraire tous les cours uniques
      const coursUniques = [...new Set(this.coursEnseignes.map(c => c.nomCours))];
      this.cours = coursUniques;
      
      // Prendre la première matière comme matière principale (compatibilité)
      this.matiere = this.coursEnseignes[0].matiere;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// ===== MIDDLEWARE POST-SAVE =====

// Après sauvegarde, mettre à jour les collections liées (Cours, etc.)
professeurSchema.post('save', async function(doc) {
  try {
    // Ici vous pouvez ajouter la logique pour mettre à jour
    // la collection Cours avec les nouveaux cours/matières
    console.log(`Professeur ${doc.nom} sauvegardé avec ${doc.coursEnseignes.length} cours`);
  } catch (error) {
    console.error('Erreur post-save professeur:', error);
  }
});

// ===== MÉTHODES STATIQUES =====

// Trouver les professeurs par cours
professeurSchema.statics.findByCours = function(nomCours) {
  return this.find({
    'coursEnseignes.nomCours': nomCours,
    actif: true
  });
};

// Trouver les professeurs par matière
professeurSchema.statics.findByMatiere = function(matiere) {
  return this.find({
    'coursEnseignes.matiere': new RegExp(matiere, 'i'),
    actif: true
  });
};

// Obtenir les statistiques
professeurSchema.statics.getStatistiques = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalProfesseurs: { $sum: 1 },
        professeursActifs: { 
          $sum: { $cond: ['$actif', 1, 0] } 
        },
        professeursPermanents: { 
          $sum: { $cond: ['$estPermanent', 1, 0] } 
        },
        entrepreneursActifs: { 
          $sum: { 
            $cond: [
              { $and: ['$actif', { $eq: ['$estPermanent', false] }] }, 
              1, 
              0
            ] 
          } 
        }
      }
    }
  ]);
};

// ===== VIRTUAL FIELDS =====

// Champ virtuel pour le type de professeur
professeurSchema.virtual('typeProfesseur').get(function() {
  return this.estPermanent ? 'Permanent' : 'Entrepreneur';
});

// Champ virtuel pour le statut complet
professeurSchema.virtual('dossierCompletInfo').get(function() {
  if (this.estPermanent) {
    return { complet: true, message: 'Professeur permanent' };
  }
  
  const complet = this.isDossierComplet();
  return {
    complet,
    message: complet ? 'Dossier complet' : 'Documents manquants'
  };
});

// Inclure les champs virtuels dans JSON
professeurSchema.set('toJSON', { virtuals: true });
professeurSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Professeur', professeurSchema);