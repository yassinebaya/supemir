// ===== CORRECTION SCHÉMA PARTNER =====

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerSchema = new mongoose.Schema({
  nomPartner: {
    type: String,
    required: [true, 'Le nom du partner est obligatoire'],
    trim: true,
    unique: true
  },
  email: { 
    type: String, 
    required: [true, 'L\'email est obligatoire'], 
    unique: true,
    lowercase: true, // Convertit automatiquement en minuscules
    trim: true,
    validate: {
      validator: function(email) {
        // Expression régulière simple pour valider l'email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Format d\'email invalide'
    }
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  active: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index pour améliorer les performances de recherche
partnerSchema.index({ nomPartner: 1 });
partnerSchema.index({ email: 1 });
partnerSchema.index({ active: 1 });

// Hash du mot de passe avant sauvegarde
partnerSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthodes du schéma
partnerSchema.methods.comparePassword = function(motDePasse) {
  return bcrypt.compare(motDePasse, this.motDePasse);
};

partnerSchema.statics.getPartnersActifs = function() {
  return this.find({ active: true }).sort({ nomPartner: 1 });
};

partnerSchema.statics.getTousLesPartners = function() {
  return this.find({}).sort({ nomPartner: 1 });
};

partnerSchema.methods.toggleActive = function() {
  this.active = !this.active;
  return this.save();
};

partnerSchema.methods.changerMotDePasse = async function(nouveauMotDePasse) {
  this.motDePasse = nouveauMotDePasse;
  return this.save();
};

// Virtual pour le statut
partnerSchema.virtual('statut').get(function() {
  return this.active ? 'Actif' : 'Inactif';
});

// Exclure le mot de passe des réponses JSON
partnerSchema.methods.toJSON = function() {
  const partnerObject = this.toObject();
  delete partnerObject.motDePasse;
  return partnerObject;
};

partnerSchema.set('toObject', { virtuals: true });
partnerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Partner', partnerSchema);

// ===== CORRECTION FRONTEND - PartnersPage.js =====

// Dans la fonction validateForm, remplacez la validation email par :
const validateForm = () => {
  if (!newPartner.nomPartner.trim()) {
    setError('Le nom du partner est requis');
    return false;
  }
  if (!newPartner.email.trim()) {
    setError('L\'email du partner est requis');
    return false;
  }
  if (!editingPartner && (!newPartner.motDePasse || newPartner.motDePasse.length < 6)) {
    setError('Le mot de passe doit contenir au moins 6 caractères');
    return false;
  }
  if (editingPartner && newPartner.motDePasse && newPartner.motDePasse.length < 6) {
    setError('Le mot de passe doit contenir au moins 6 caractères');
    return false;
  }
  
  // CORRECTION : Validation email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // SANS échappement des backslashes
  if (!emailRegex.test(newPartner.email)) {
    setError('Format d\'email invalide');
    return false;
  }
  
  return true;
};

// ===== TEST POUR VÉRIFIER =====

// Emails qui DOIVENT fonctionner :
// - ofppt@gmail.com
// - partner@yahoo.fr  
// - test.email@domain.org
// - user123@site.co.ma

// La regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ accepte :
// - Au moins un caractère avant le @
// - Un seul @
// - Au moins un caractère après le @
// - Un point suivi d'au moins un caractère

console.log('Test email validation:');
const testEmails = ['ofppt@gmail.com', 'invalid-email', 'test@domain.fr'];
const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
testEmails.forEach(email => {
  console.log(`${email}: ${regex.test(email) ? 'VALID' : 'INVALID'}`);
});