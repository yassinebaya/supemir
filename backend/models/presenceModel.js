const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true },

  cours: { type: String, required: true }, // Ø£Ùˆ ObjectId Ø¥Ø°Ø§ Ø¹Ø¯Ù„Øª Ø§Ù„Ù†Ø¸Ø§Ù…

  dateSession: { type: Date, required: true },

  present: { type: Boolean, default: false },

  remarque: { type: String },

  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  // ðŸ•’ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ (hh:mm)
  heure: {
    type: String,
    required: false // ÙŠÙ…ÙƒÙ†Ùƒ Ø¬Ø¹Ù„Ù‡ Ù…Ø·Ù„ÙˆØ¨ Ø¥Ø°Ø§ Ø£Ø±Ø¯Øª
  },

  // ðŸŒ… matin Ø£Ùˆ soir
  periode: {
    type: String,
    enum: ['matin', 'soir'],
    required: true
  }
  ,matiere: { type: String },
nomProfesseur: { type: String },


}, { timestamps: true });

module.exports = mongoose.model('Presence', presenceSchema);







