const mongoose = require('mongoose');

const coursSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
professeur: {
  type: [String], // âœ… Ù…ØµÙÙˆÙØ© Ù…Ù† Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ø£Ø³Ø§ØªØ°Ø©
  required: true,
  default: []
},
}, { timestamps: true });

module.exports = mongoose.model('Cours', coursSchema);







