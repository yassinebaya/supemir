// models/HistoriquePaiement.js
const mongoose = require('mongoose');

const historiquePaiementSchema = new mongoose.Schema({
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professeur',
    required: true
  },
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CyclePaiement',
    required: true
  },
  numeroCycle: {
    type: Number,
    required: true
  },
  
  // Période du cycle payé
  periodeDebut: {
    type: Date,
    required: true
  },
  periodeFin: {
    type: Date,
    required: true
  },
  
  // Détails financiers
  nombreSeances: {
    type: Number,
    required: true,
    default: 0
  },
  totalHeures: {
    type: Number,
    required: true,
    default: 0
  },
  tarifHoraire: {
    type: Number,
    required: true,
    default: 0
  },
  montantBrut: {
    type: Number,
    required: true,
    default: 0
  },
  totalAjustements: {
    type: Number,
    default: 0
  },
  montantNet: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Détails des ajustements appliqués
  ajustementsAppliques: [{
    motif: String,
    type: {
      type: String,
      enum: ['pourcentage', 'montant_fixe']
    },
    valeur: Number,
    montantAjustement: Number,
    dateApplication: Date
  }],
  
  // Informations sur le paiement
  methodePaiement: {
    type: String,
    enum: ['virement', 'cheque', 'especes'],
    required: true
  },
  referencePaiement: {
    type: String,
    default: ''
  },
  datePaiement: {
    type: Date,
    required: true
  },
  
  // Qui a validé et payé
  valideParFinance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  dateValidationFinance: {
    type: Date
  },
  payeParAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Notes et commentaires
  notesFinance: {
    type: String,
    default: ''
  },
  notesAdmin: {
    type: String,
    default: ''
  },
  
  // Détail des séances payées
  seancesPayees: [{
    seanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seance'
    },
    cours: String,
    dateSeance: Date,
    heureDebut: String,
    heureFin: String,
    dureeHeures: Number,
    montantSeance: Number
  }],
  
  actif: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index pour optimiser les requêtes
historiquePaiementSchema.index({ professeur: 1, datePaiement: -1 });
historiquePaiementSchema.index({ datePaiement: -1 });
historiquePaiementSchema.index({ numeroCycle: 1, professeur: 1 });

// Méthode statique pour créer un historique depuis un cycle payé
historiquePaiementSchema.statics.creerDepuisCycle = async function(cycle) {
  const HistoriquePaiement = this;
  const Seance = mongoose.model('Seance');
  const PenaliteProfesseur = mongoose.model('PenaliteProfesseur');
  
  // Récupérer les détails des séances payées
  const seanceIds = cycle.seancesIncluses.map(s => s.seanceId);
  const seancesDetaillees = await Seance.find({
    _id: { $in: seanceIds }
  }).lean();
  
  const seancesPayees = seancesDetaillees.map(seance => {
    const seanceInclude = cycle.seancesIncluses.find(s => 
      s.seanceId.toString() === seance._id.toString()
    );
    
    return {
      seanceId: seance._id,
      cours: seanceInclude ? seanceInclude.cours : 'Cours non spécifié',
      dateSeance: seance.dateSeance,
      heureDebut: seance.heureDebut,
      heureFin: seance.heureFin,
      dureeHeures: seanceInclude ? seanceInclude.heures : 0,
      montantSeance: seanceInclude ? seanceInclude.montant : 0
    };
  });
  
  // Récupérer les ajustements appliqués
  const ajustementsAppliques = cycle.penalitesAppliquees.map(penalite => ({
    motif: penalite.motif,
    type: 'inconnu', // Vous pouvez enrichir cela
    valeur: 0,
    montantAjustement: penalite.montant,
    dateApplication: new Date()
  }));
  
  // Créer l'historique
  const historique = new HistoriquePaiement({
    professeur: cycle.professeur,
    cycleId: cycle._id,
    numeroCycle: cycle.numeroCycle,
    periodeDebut: cycle.dateDebut,
    periodeFin: cycle.dateFin,
    nombreSeances: cycle.seancesIncluses.length,
    totalHeures: cycle.seancesIncluses.reduce((acc, s) => acc + s.heures, 0),
    tarifHoraire: cycle.professeur.tarifHoraire || 0,
    montantBrut: cycle.montantBrut,
    totalAjustements: cycle.ajustements || 0,
    montantNet: cycle.montantNet,
    ajustementsAppliques: ajustementsAppliques,
    methodePaiement: cycle.methodePaiement,
    referencePaiement: cycle.referencePaiement,
    datePaiement: cycle.datePaiementAdmin,
    valideParFinance: cycle.valideParFinance,
    dateValidationFinance: cycle.dateValidationFinance,
    payeParAdmin: cycle.payeParAdmin,
    notesFinance: cycle.notesFinance,
    notesAdmin: cycle.notesAdmin,
    seancesPayees: seancesPayees
  });
  
  return await historique.save();
};

module.exports = mongoose.model('HistoriquePaiement', historiquePaiementSchema);