// models/RappelPaiement.js
const mongoose = require('mongoose');

const RappelPaiementSchema = new mongoose.Schema({
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true },
  cours: { type: String, required: true },
  montantRestant: { type: Number, required: true },
  note: { type: String },
  dateRappel: { type: Date, required: true },
  status: { type: String, default: 'actif' } // 'actif' Ø£Ùˆ 'terminÃ©'
}, { timestamps: true });

module.exports = mongoose.model('RappelPaiement', RappelPaiementSchema);







