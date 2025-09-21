const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
  etudiant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etudiant',
    required: true
  },
 cours: {
  type: [String], // âœ… Array Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† String
  required: true
}
,
  moisDebut: {
    type: Date,
    required: true // Ù…Ø«Ù„: 2025-06-01
  },
  nombreMois: {
    type: Number,
    required: true // Ù…Ø«Ù„: 2 (Ø´Ù‡Ø±ÙŠÙ†)
  },
  montant: {
    type: Number,
    required: true // Ù…Ø«Ù„: 300
  },
  note: {
    type: String // Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ø®ØªÙŠØ§Ø±ÙŠØ©
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin' // Ù…Ù† Ù‚Ø§Ù… Ø¨Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø¯ÙØ¹
  }
}, {
  timestamps: true // createdAt Ùˆ updatedAt
});

module.exports = mongoose.model('Paiement', paiementSchema);







