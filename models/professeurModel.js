const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const professeurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  
    genre: {
    type: String,
    enum: ['Homme', 'Femme'],
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  motDePasse: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: false
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
  cours: {
    type: [String], // Liste des noms des cours
    default: []
  },
  matiere: {
  type: String,
  required: true // Ø£Ùˆ false Ø¥Ø°Ø§ Ø£Ø±Ø¯Øª ØªØ±ÙƒÙ‡ Ø§Ø®ØªÙŠØ§Ø±ÙŠ
},

  lastSeen: {
  type: Date,
  default: null
}

}, { timestamps: true });

// MÃ©thode pour comparer le mot de passe
professeurSchema.methods.comparePassword = function (mot) {
  return bcrypt.compare(mot, this.motDePasse);
};

module.exports = mongoose.model('Professeur', professeurSchema);







