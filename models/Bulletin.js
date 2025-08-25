const mongoose = require('mongoose');

const bulletinSchema = new mongoose.Schema({
  etudiant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etudiant',
    required: true
  },
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professeur',
    required: true
  },
  cours: {
    type: String, // nom du cours (ex: "Math A")
    required: true
  },
  semestre: {
    type: String,
    default: 'AnnÃ©e' // ou S1, S2...
  },
  notes: [
    {
      titre: { type: String, required: true },       // ex: "Devoir 1"
      note: { type: Number, required: true },         // ex: 15.5
      coefficient: { type: Number, required: true }   // ex: 0.4
    }
  ],
  moyenneFinale: {
    type: Number,
    default: null
  },
  remarque: String
}, { timestamps: true });

module.exports = mongoose.model('Bulletin', bulletinSchema);







