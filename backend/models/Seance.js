const mongoose = require('mongoose');

const seanceSchema = new mongoose.Schema({
  jour: {
    type: String,
    required: true,
    enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  },
  heureDebut: {
    type: String,
    required: true
  },
  heureFin: {
    type: String,
    required: true
  },
  cours: {
    type: String,
    required: true
  },
  // NOUVEAU CHAMP - Référence ID du cours pour éviter les problèmes de noms
  coursId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours',
    default: null
  },
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professeur',
    required: true
  },
  matiere: {
    type: String,
    default: ''
  },
  salle: {
    type: String,
    default: ''
  },
  
  // ===== NOUVEAUX CHAMPS POUR LE SYSTÈME DE TEMPLATES =====
  
  // Type de séance
  typeSeance: {
    type: String,
    enum: ['template', 'reelle', 'exception', 'rattrapage'],
    default: 'reelle'
  },
  
  // Pour les séances réelles : date exacte
  dateSeance: {
    type: Date,
    default: null
  },
  
  // Pour les templates : période de validité
  dateDebutTemplate: {
    type: Date,
    default: null
  },
  
  dateFinTemplate: {
    type: Date,
    default: null
  },
  
  // Pour les exceptions : référence au template original
  templateOriginal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seance',
    default: null
  },
  
  // Statut actif/inactif
  actif: {
    type: Boolean,
    default: true
  },
  creeParPedagogique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedagogique',
    default: null
  },
  
  modifieParPedagogique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedagogique',
    default: null
  },
  
  // Notes pour les modifications
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// ===== MÉTHODES STATIQUES POUR GÉNÉRATION AUTOMATIQUE =====

// Générer les séances d'une semaine à partir des templates - VERSION AMÉLIORÉE
seanceSchema.statics.genererSeancesSemaine = async function(dateLundi) {
  try {
    const Seance = this;
    const Cours = mongoose.model('Cours');
    
    const lundiSemaine = new Date(dateLundi);
    lundiSemaine.setHours(0, 0, 0, 0);
    const dimancheSemaine = new Date(lundiSemaine.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    console.log(`🔄 Génération pour semaine: ${lundiSemaine.toDateString()}`);
    
    // Vérifier si les séances de cette semaine existent déjà
    const seancesExistantes = await Seance.find({
      typeSeance: 'reelle',
      dateSeance: {
        $gte: lundiSemaine,
        $lte: dimancheSemaine
      }
    });
    
    if (seancesExistantes.length > 0) {
      console.log(`✅ ${seancesExistantes.length} séances déjà générées pour cette semaine`);
      return seancesExistantes;
    }
    
    // Récupérer tous les templates actifs
    const templates = await Seance.find({
      typeSeance: 'template',
      actif: true,
      $or: [
        { dateDebutTemplate: { $lte: lundiSemaine } },
        { dateDebutTemplate: null }
      ],
      $and: [
        {
          $or: [
            { dateFinTemplate: { $gte: lundiSemaine } },
            { dateFinTemplate: null }
          ]
        }
      ]
    }).populate('professeur');
    
    console.log(`📋 Templates trouvés: ${templates.length}`);
    
    const nouvellesSeances = [];
    
    for (const template of templates) {
      // ===== GESTION INTELLIGENTE DES COURS =====
      let coursNom = template.cours;
      let coursId = template.coursId;
      
      // Si coursId existe, vérifier qu'il est encore valide
      if (coursId) {
        const coursDoc = await Cours.findById(coursId);
        if (coursDoc) {
          coursNom = coursDoc.nom; // Utiliser le nom à jour
        } else {
          console.warn(`⚠️ Cours avec ID ${coursId} non trouvé, recherche par nom...`);
          coursId = null; // Reset pour chercher par nom
        }
      }
      
      // Si pas de coursId ou coursId invalide, chercher par nom
      if (!coursId) {
        const coursDoc = await Cours.findOne({ nom: coursNom });
        if (coursDoc) {
          coursId = coursDoc._id;
          // Mettre à jour le template avec l'ID trouvé
          await Seance.findByIdAndUpdate(template._id, { coursId: coursDoc._id });
          console.log(`🔗 Template mis à jour avec coursId: ${coursDoc.nom}`);
        } else {
          console.error(`❌ Cours "${coursNom}" non trouvé dans la base de données`);
          continue; // Ignorer ce template
        }
      }
      
      // Calculer la date exacte de la séance
      const jourIndex = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].indexOf(template.jour);
      if (jourIndex === -1) {
        console.warn(`⚠️ Jour invalide: ${template.jour}`);
        continue;
      }
      
      const dateSeance = new Date(lundiSemaine.getTime() + jourIndex * 24 * 60 * 60 * 1000);
      
      // Vérifier s'il y a une exception pour cette date
      const exception = await Seance.findOne({
        typeSeance: 'exception',
        templateOriginal: template._id,
        dateSeance: dateSeance
      });
      
      if (exception) {
        // Utiliser l'exception au lieu du template
        nouvellesSeances.push(exception);
        console.log(`🔄 Exception utilisée pour ${coursNom} - ${template.jour}`);
        continue;
      }
      
      // Créer la séance réelle basée sur le template
      const nouvelleSeance = new Seance({
        typeSeance: 'reelle',
        dateSeance,
        jour: template.jour,
        heureDebut: template.heureDebut,
        heureFin: template.heureFin,
        cours: coursNom, // Nom du cours
        coursId: coursId, // ID du cours pour référence
        professeur: template.professeur._id,
        matiere: template.matiere,
        salle: template.salle,
        actif: true
      });
      
      await nouvelleSeance.save();
      nouvellesSeances.push(nouvelleSeance);
      console.log(`✅ Séance créée: ${coursNom} - ${template.jour} ${template.heureDebut}-${template.heureFin}`);
    }
    
    console.log(`🎉 ${nouvellesSeances.length} nouvelles séances générées pour la semaine du ${lundiSemaine.toDateString()}`);
    return nouvellesSeances;
    
  } catch (error) {
    console.error('❌ Erreur génération séances:', error);
    throw error;
  }
};

// Méthode pour synchroniser les noms de cours avec les IDs
seanceSchema.statics.synchroniserCours = async function() {
  try {
    const Seance = this;
    const Cours = mongoose.model('Cours');
    
    console.log('🔄 Synchronisation des cours en cours...');
    
    // Trouve toutes les séances sans coursId
    const seancesSansCoursId = await Seance.find({
      coursId: { $exists: false }
    });
    
    let misesAJour = 0;
    
    for (const seance of seancesSansCoursId) {
      const coursDoc = await Cours.findOne({ nom: seance.cours });
      if (coursDoc) {
        await Seance.findByIdAndUpdate(seance._id, { 
          coursId: coursDoc._id 
        });
        misesAJour++;
      }
    }
    
    console.log(`✅ ${misesAJour} séances synchronisées`);
    return misesAJour;
    
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    throw error;
  }
};

// Calculer automatiquement les heures et montants
seanceSchema.methods.calculerDureeEtMontant = async function() {
  // Calculer la durée
  const [heureD, minuteD] = this.heureDebut.split(':').map(Number);
  const [heureF, minuteF] = this.heureFin.split(':').map(Number);
  const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;
  
  // Calculer le montant si entrepreneur
  let montant = 0;
  if (this.professeur) {
    const professeur = await mongoose.model('Professeur').findById(this.professeur);
    if (professeur && !professeur.estPermanent && professeur.tarifHoraire) {
      montant = dureeHeures * professeur.tarifHoraire;
    }
  }
  
  return {
    dureeHeures: Math.round(dureeHeures * 100) / 100,
    montant: Math.round(montant * 100) / 100
  };
};

// Méthode pour obtenir le cours complet (avec populate)
seanceSchema.methods.getCours = async function() {
  if (this.coursId) {
    const Cours = mongoose.model('Cours');
    return await Cours.findById(this.coursId);
  }
  return null;
};

// Validation pre-save pour s'assurer de la cohérence
seanceSchema.pre('save', async function(next) {
  // Si on a un coursId mais pas de nom de cours, récupérer le nom
  if (this.coursId && !this.cours) {
    const Cours = mongoose.model('Cours');
    const coursDoc = await Cours.findById(this.coursId);
    if (coursDoc) {
      this.cours = coursDoc.nom;
    }
  }
  
  // Si on a un nom de cours mais pas d'ID, chercher l'ID
  if (this.cours && !this.coursId) {
    const Cours = mongoose.model('Cours');
    const coursDoc = await Cours.findOne({ nom: this.cours });
    if (coursDoc) {
      this.coursId = coursDoc._id;
    }
  }
  
  next();
});

// Index pour optimiser les requêtes
seanceSchema.index({ typeSeance: 1, dateSeance: 1 });
seanceSchema.index({ typeSeance: 1, actif: 1 });
seanceSchema.index({ professeur: 1, dateSeance: 1 });
seanceSchema.index({ coursId: 1, typeSeance: 1 });

module.exports = mongoose.model('Seance', seanceSchema);