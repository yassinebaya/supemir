// âœ… fichier: models/QrWeekPlanning.js
const mongoose = require('mongoose');

const qrWeekPlanningSchema = new mongoose.Schema({
  jour: { type: String, required: true }, // ex: "lundi"
  cours: { type: String, required: true },
  periode: { type: String, enum: ['matin', 'soir'], required: true },
  professeur: { type: mongoose.Schema.Types.ObjectId, ref: 'Professeur', required: true },
  matiere: { type: String, required: false },
  horaire: { type: String, required: true } // ex: "08:00-10:00"
});

module.exports = mongoose.model('QrWeekPlanning', qrWeekPlanningSchema);







