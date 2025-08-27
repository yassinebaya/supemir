const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const commercialSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  telephone: { type: String },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

// Ù‚Ø¨Ù„ Ø§Ù„Ø­ÙØ¸ØŒ Ø¹Ù…Ù„ Ù‡Ø§Ø´ Ù„ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±
commercialSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
  next();
});

// Ù„Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±
commercialSchema.methods.comparePassword = function (motDePasse) {
  return bcrypt.compare(motDePasse, this.motDePasse);
};

module.exports = mongoose.model('Commercial', commercialSchema);







