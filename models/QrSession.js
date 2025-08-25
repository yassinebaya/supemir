// âœ… fichier: models/QrSession.js
const mongoose = require('mongoose');

const qrSessionSchema = new mongoose.Schema({
  date: { type: String, required: true }, // format YYYY-MM-DD
  periode: { type: String, enum: ['matin', 'soir'], required: true },
cours: { type: String, required: true },
  professeur: { type: mongoose.Schema.Types.ObjectId, ref: 'Professeur', required: true },
  matiere: { type: String },
  horaire: { type: String, required: true } // ex: "08:00-10:00"

});

module.exports = mongoose.model('QrSession', qrSessionSchema);







