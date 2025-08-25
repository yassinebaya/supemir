const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
contenu: {
  type: String,
  required: function () {
    return !this.fichier;
  },
  trim: true
},

    fichier: { type: String }, // â¬…ï¸ Ø±Ø§Ø¨Ø· Ø§Ù„Ù…Ù„Ù

  expediteur: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'roleExpediteur'
  },
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'roleDestinataire'
  },
  roleExpediteur: {
    type: String,
    required: true,
    enum: ['Etudiant', 'Professeur']
  },
  roleDestinataire: {
    type: String,
    required: true,
    enum: ['Etudiant', 'Professeur']
  },
  // Champs supplÃ©mentaires pour faciliter les requÃªtes
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professeur'
  },
  etudiant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etudiant'
  },
  date: {
    type: Date,
    default: Date.now
  },
  lu: {
    type: Boolean,
    default: false
  },
  dateLecture: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour optimiser les requÃªtes
messageSchema.index({ expediteur: 1, destinataire: 1, date: -1 });
messageSchema.index({ professeur: 1, etudiant: 1, date: 1 });
messageSchema.index({ destinataire: 1, roleDestinataire: 1, lu: 1 });

module.exports = mongoose.model('Message', messageSchema);






