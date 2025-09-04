const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pedagogiqueSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true 
  },
  
  telephone: { 
    type: String 
  },
  
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  motDePasse: { 
    type: String, 
    required: true 
  },
  
  // Filière(s) que ce pédagogique peut gérer
  filiere: {
    type: String,
    enum: ['IRM', 'MASI', 'CYCLE_INGENIEUR', 'LICENCE_PRO', 'MASTER_PRO', 'GENERAL'],
    required: true
  },
  
  // Pour le pédagogique général, on peut spécifier les filières accessibles
  filieresList: {
    type: [String],
    enum: ['IRM', 'MASI', 'CYCLE_INGENIEUR', 'LICENCE_PRO', 'MASTER_PRO'],
    default: function() {
      if (this.filiere === 'GENERAL') {
        return ['IRM', 'MASI', 'CYCLE_INGENIEUR', 'LICENCE_PRO', 'MASTER_PRO'];
      }
      return [this.filiere];
    }
  },
  
  // Type de pédagogique
  type: {
    type: String,
    enum: ['SPECIFIQUE', 'GENERAL'],
    default: 'SPECIFIQUE'
  },
  
  actif: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Hashage du mot de passe avant sauvegarde
pedagogiqueSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
  next();
});

// Méthode pour comparer les mots de passe
pedagogiqueSchema.methods.comparePassword = function (motDePasse) {
  return bcrypt.compare(motDePasse, this.motDePasse);
};

// Méthode pour vérifier si le pédagogique peut accéder à une filière
pedagogiqueSchema.methods.peutAccederFiliere = function (filiere) {
  if (this.type === 'GENERAL') {
    return this.filieresList.includes(filiere);
  }
  return this.filiere === filiere;
};

// Méthode pour obtenir toutes les filières accessibles
pedagogiqueSchema.methods.getFilieresAccessibles = function () {
  if (this.type === 'GENERAL') {
    return this.filieresList;
  }
  return [this.filiere];
};

module.exports = mongoose.model('Pedagogique', pedagogiqueSchema);