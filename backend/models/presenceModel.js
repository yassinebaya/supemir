const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true },
  cours: { type: String, required: true },
  dateSession: { type: Date, required: true },
  
  // 🆕 Nouveaux champs pour la gestion complète des présences
  present: { type: Boolean, default: false },
  absent: { type: Boolean, default: false },
  retard: { type: Boolean, default: false },
  
  // 🆕 Temps de retard en minutes
  retardMinutes: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 120 // Maximum 2 heures de retard
  },
  
  remarque: { type: String },
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  
  // Informations de session
  heure: {
    type: String,
    required: false
  },
  periode: {
    type: String,
    enum: ['matin', 'soir'],
    required: true
  },
  matiere: { type: String },
  nomProfesseur: { type: String },
  
  seanceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Seance', 
    required: true 
  },
  coursId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cours' 
  }

}, { timestamps: true });

// 🆕 Index pour améliorer les performances de recherche
presenceSchema.index({ etudiant: 1, cours: 1, dateSession: 1 });
presenceSchema.index({ dateSession: 1, periode: 1 });
presenceSchema.index({ seanceId: 1, etudiant: 1 }, { unique: true });

// 🆕 Méthode virtuelle pour obtenir le statut global
presenceSchema.virtual('statutGlobal').get(function() {
  if (this.retard) return 'retard';
  if (this.absent) return 'absent';
  if (this.present) return 'present';
  return 'indéterminé';
});

// 🆕 Méthode pour formater le temps de retard
presenceSchema.methods.getTempsRetardFormate = function() {
  if (!this.retard || this.retardMinutes === 0) return '';
  
  const heures = Math.floor(this.retardMinutes / 60);
  const minutes = this.retardMinutes % 60;
  
  if (heures > 0) {
    return `${heures}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }
  return `${minutes}min`;
};

module.exports = mongoose.model('Presence', presenceSchema);
