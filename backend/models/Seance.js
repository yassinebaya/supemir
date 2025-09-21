const mongoose = require('mongoose');

const seanceSchema = new mongoose.Schema({
  jour: {
    type: String,
    required: true,
    enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  },
  heureDebut: {
    type: String, // format HH:mm
    required: true
  },
  heureFin: {
    type: String,
    required: true
  },
  cours: {
    type: String, // âœ… string comme dans Etudiant.cours
    required: true
  },
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professeur',
    required: true
  },
  matiere: {
    type: String, // âœ… AJOUTÃ‰: champ pour la matiÃ¨re
    default: ''
  },
  salle: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Seance', seanceSchema);






