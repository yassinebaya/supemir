const mongoose = require('mongoose');

const evenementSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: { type: String },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date },
  type: { type: String, enum: ['paiement', 'examen', 'rÃ©union', 'formation', 'vacances', 'autre'], default: 'autre' },
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Evenement', evenementSchema);







