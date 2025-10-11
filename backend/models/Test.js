const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  etudiant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etudiant',
    required: true
  },
  
  langue: {
    type: String,
    enum: ['anglais', 'francais'],
    required: true
  },
  
  niveau: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B1+', 'B2', 'Non déterminé'],
    default: 'Non déterminé'
  },
  
  score: {
    type: Number,
    default: 0
  },
  
  totalQuestions: {
    type: Number,
    required: true
  },
  
  // Stocker les réponses de l'étudiant
  reponses: {
    type: Map,
    of: Number, // questionId: reponseIndex (0, 1, 2, 3)
    default: {}
  },
  
  // Première erreur détectée
  premiereErreur: {
    step: {
      type: String,
      default: null
    },
    questionId: {
      type: Number,
      default: null
    }
  },
  
  // Temps écoulé en secondes
  tempsEcoule: {
    type: Number,
    default: 0
  },
  
  // Date de début et fin
  dateDebut: {
    type: Date,
    default: Date.now
  },
  
  dateFin: {
    type: Date,
    default: null
  },
  
  // Statut du test
  statut: {
    type: String,
    enum: ['en_cours', 'termine', 'expire'],
    default: 'en_cours'
  },
  
  // Détails par step pour le suivi
  detailsSteps: {
    type: Map,
    of: {
      bonnes: Number,
      mauvaises: Number,
      total: Number
    },
    default: {}
  }
  
}, { timestamps: true });

// Index pour recherche rapide
testSchema.index({ etudiant: 1, langue: 1 });

// RÉPONSES CORRECTES
const REPONSES_CORRECTES = {
  anglais: {
    1: 1, 2: 1, 3: 0, 4: 1, 5: 0, 6: 2, 7: 0, 8: 1, 9: 2, 10: 0,
    11: 0, 12: 2, 13: 1, 14: 2, 15: 0, 16: 2, 17: 1, 18: 1, 19: 1, 20: 2,
    21: 2, 22: 0, 23: 2, 24: 2, 25: 0, 26: 2, 27: 0, 28: 2, 29: 2, 30: 1,
    31: 2, 32: 2, 33: 0, 34: 2, 35: 1, 36: 1, 37: 2, 38: 0, 39: 2,
    40: 0, 41: 0, 42: 2, 43: 1,
    44: 1, 45: 1, 46: 1, 47: 2, 48: 0, 49: 2, 50: 0, 51: 2, 52: 3, 
    53: 3, 54: 2, 55: 0, 56: 0, 57: 1, 58: 2, 59: 3, 60: 0
  },
  francais: {
    1: 1, 2: 1, 3: 3, 4: 2, 5: 2,
    6: 0, 7: 0, 8: 2, 9: 3, 10: 2,
    11: 2, 12: 1, 13: 2, 14: 1, 15: 2, 16: 1,
    17: 2, 18: 3, 19: 2, 20: 1, 21: 1,
    22: 1, 23: 1, 24: 1, 25: 1, 26: 3
  }
};

// STRUCTURE DES STEPS
const STEPS_CONFIG = {
  anglais: {
    Step1: { debut: 1, fin: 20, niveau: 'A1' },
    Step2: { debut: 21, fin: 39, niveau: 'A2' },
    Step3: { debut: 40, fin: 43, niveau: 'B1' },
    Step4: { debut: 44, fin: 60, niveau: 'B2' }
  },
  francais: {
    A1: { debut: 1, fin: 5, niveau: 'A1' },
    A2: { debut: 6, fin: 10, niveau: 'A2' },
    B1: { debut: 11, fin: 16, niveau: 'B1' },
    'B1+': { debut: 17, fin: 21, niveau: 'B1+' },
    B2: { debut: 22, fin: 26, niveau: 'B2' }
  }
};

<<<<<<< HEAD
// ===== NOUVELLE MÉTHODE calculerNiveau =====
=======
// Méthode pour calculer le niveau basé sur la première erreur
>>>>>>> e28856574b6e7bd1a874030db05ceee60a1bcfab
testSchema.methods.calculerNiveau = function() {
  const reponsesCorrectes = REPONSES_CORRECTES[this.langue];
  const steps = STEPS_CONFIG[this.langue];
  
  let score = 0;
<<<<<<< HEAD
  let niveauFinal = 'A1'; // Niveau par défaut
  let premiereErreur = { step: null, questionId: null };
  let stepsPrecedentsCorrects = true;
  
  // Parcourir tous les steps dans l'ordre
  for (let [stepName, stepConfig] of Object.entries(steps)) {
    let toutesReponsesCorrectes = true;
    let toutesQuestionsRepondues = true;
    
    // Vérifier toutes les questions de ce step
=======
  let niveauFinal = this.langue === 'anglais' ? 'B2' : 'B2';
  let premiereErreur = { step: null, questionId: null };
  
  // Parcourir toutes les questions dans l'ordre
  for (let [stepName, stepConfig] of Object.entries(steps)) {
    let erreurTrouvee = false;
    
>>>>>>> e28856574b6e7bd1a874030db05ceee60a1bcfab
    for (let qId = stepConfig.debut; qId <= stepConfig.fin; qId++) {
      const reponseEtudiant = this.reponses.get(qId.toString());
      const reponseCorrecte = reponsesCorrectes[qId];
      
<<<<<<< HEAD
      // Si la question n'est pas répondue
      if (reponseEtudiant === undefined) {
        toutesQuestionsRepondues = false;
        toutesReponsesCorrectes = false;
        
        // Enregistrer la première erreur si ce n'est pas déjà fait
        if (!premiereErreur.questionId) {
          premiereErreur.step = stepName;
          premiereErreur.questionId = qId;
        }
      } 
      // Si la question est répondue
      else {
        if (reponseEtudiant === reponseCorrecte) {
          score++;
        } else {
          // Réponse incorrecte
          toutesReponsesCorrectes = false;
          
          // Enregistrer la première erreur si ce n'est pas déjà fait
          if (!premiereErreur.questionId) {
            premiereErreur.step = stepName;
            premiereErreur.questionId = qId;
=======
      if (reponseEtudiant !== undefined) {
        if (reponseEtudiant === reponseCorrecte) {
          score++;
        } else {
          // PREMIÈRE ERREUR TROUVÉE
          if (!premiereErreur.questionId) {
            premiereErreur.step = stepName;
            premiereErreur.questionId = qId;
            niveauFinal = stepConfig.niveau;
            erreurTrouvee = true;
>>>>>>> e28856574b6e7bd1a874030db05ceee60a1bcfab
          }
        }
      }
    }
    
<<<<<<< HEAD
    // Déterminer si ce step est COMPLET et CORRECT
    const stepCompletEtCorrect = toutesQuestionsRepondues && toutesReponsesCorrectes;
    
    // Si tous les steps précédents sont corrects ET ce step aussi
    if (stepsPrecedentsCorrects && stepCompletEtCorrect) {
      niveauFinal = stepConfig.niveau;
    } else {
      // Dès qu'un step n'est pas complet/correct, on arrête la progression
      stepsPrecedentsCorrects = false;
=======
    // Si erreur trouvée dans ce step, le niveau final est celui de ce step
    if (erreurTrouvee) {
      break;
>>>>>>> e28856574b6e7bd1a874030db05ceee60a1bcfab
    }
  }
  
  this.score = score;
  this.niveau = niveauFinal;
  this.premiereErreur = premiereErreur;
  
  return {
    niveau: niveauFinal,
    score: score,
    totalQuestions: this.totalQuestions,
    premiereErreur: premiereErreur
  };
};

// Méthode pour vérifier si le test est expiré (20 minutes)
testSchema.methods.estExpire = function() {
  const maintenant = new Date();
  const limite = new Date(this.dateDebut.getTime() + 20 * 60 * 1000); // 20 minutes
  return maintenant > limite;
};

// Méthode pour terminer le test
testSchema.methods.terminerTest = function() {
  this.statut = 'termine';
  this.dateFin = new Date();
  this.tempsEcoule = Math.floor((this.dateFin - this.dateDebut) / 1000);
  return this.calculerNiveau();
};

// Méthode statique pour obtenir le dernier test d'un étudiant
testSchema.statics.getDernierTest = function(etudiantId, langue) {
  return this.findOne({ etudiant: etudiantId, langue: langue })
    .sort({ createdAt: -1 });
};

// Méthode statique pour vérifier si l'étudiant a terminé les deux tests
testSchema.statics.aTermineLesDeuxTests = async function(etudiantId) {
  const testAnglais = await this.findOne({ 
    etudiant: etudiantId, 
    langue: 'anglais', 
    statut: 'termine' 
  });
  
  const testFrancais = await this.findOne({ 
    etudiant: etudiantId, 
    langue: 'francais', 
    statut: 'termine' 
  });
  
  return {
    anglaisTermine: !!testAnglais,
    francaisTermine: !!testFrancais,
    tousTermines: !!testAnglais && !!testFrancais,
    niveaux: {
      anglais: testAnglais?.niveau || 'Non testé',
      francais: testFrancais?.niveau || 'Non testé'
    }
  };
};

module.exports = mongoose.model('Test', testSchema);