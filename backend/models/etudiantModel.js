
const mongoose = require('mongoose');

const etudiantSchema = new mongoose.Schema({
  prenom: {
    type: String,
    required: true
  },
  nomDeFamille: {
    type: String,
    required: true
  },
  
  genre: {
    type: String,
    enum: ['Homme', 'Femme'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  motDePasse: {
    type: String,
    required: true
  },
  telephone: String,
  cin: String,
  passeport: String,
  dateNaissance: Date,
  lieuNaissance: String,
  pays: String,
  cours: {
    type: [String],
    default: []
  },
  niveau: Number,
  niveauFormation: String,
  filiere: String,
  
  // NOUVEAU: Année scolaire
  anneeScolaire: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}\/\d{4}$/.test(v);
      },
      message: 'L\'année scolaire doit être au format YYYY/YYYY (ex: 2025/2026)'
    }
  },
  
  // NOUVEAU: Système de cycle d'ingénieur
  cycle: {
    type: String,
    enum: [
      'Classes Préparatoires Intégrées',
      'Cycle Ingénieur'
    ],
    default: undefined
  },
  
  // Pour le Cycle Ingénieur uniquement
  specialiteIngenieur: {
    type: String,
    enum: [
      'Génie Informatique', 
      'Génie Mécatronique', 
      'Génie Civil'
    ]
  },
  
  optionIngenieur: {
    type: String,
    enum: [
      'Sécurité & Mobilité Informatique',
      'IA & Science des Données',
      'Réseaux & Cloud Computing',
      'Génie Mécanique',
      'Génie Industriel',
      'Automatisation',
      'Structures & Ouvrages d\'art',
      'Bâtiment & Efficacité Énergétique',
      'Géotechnique & Infrastructures'
    ]
  },
  
  // NOUVEAU: Type de formation pour différencier les parcours
  typeFormation: {
    type: String,
    enum: [
      'CYCLE_INGENIEUR',
      'LICENCE_PRO',
      'MASTER_PRO',
      'MASI',
      'IRM'
    ]
  },
  
  // NOUVEAU: Spécialités pour Licences Professionnelles
  specialiteLicencePro: {
    type: String,
    enum: [
      'Marketing digital e-business Casablanca',
      'Tests Logiciels avec Tests Automatisés',
      'Gestion de la Qualité',
      'Développement Informatique Full Stack',
      'Administration des Systèmes, Bases de Données, Cybersécurité et Cloud Computing',
      'Réseaux et Cybersécurité',
      'Finance, Audit & Entrepreneuriat',
      'Développement Commercial et Marketing Digital',
      'Management et Conduite de Travaux – Cnam',
      'Electrotechnique et systèmes – Cnam',
      'Informatique – Cnam'
    ]
  },
  
  // NOUVEAU: Options pour Licences Professionnelles
  optionLicencePro: {
    type: String,
    enum: [
      'Développement Mobile',
      'Intelligence Artificielle et Data Analytics',
      'Développement JAVA JEE',
      'Développement Gaming et VR',
      'Administration des Systèmes et Cloud Computing'
    ],
      set: v => (v === '' ? undefined : v)   // ← ajoute ça

  },
  
  // NOUVEAU: Spécialités pour Masters Professionnels
  specialiteMasterPro: {
    type: String,
    enum: [
      'Informatique, Data Sciences, Cloud, Cybersécurité & Intelligence Artificielle (DU IDCIA)',
      'QHSSE & Performance Durable',
      'Achat, Logistique et Supply Chain Management',
      'Management des Systèmes d\'Information',
      'Big Data et Intelligence Artificielle',
      'Cybersécurité et Transformation Digitale',
      'Génie Informatique et Innovation Technologique',
      'Finance, Audit & Entrepreneuriat',
      'Développement Commercial et Marketing Digital'
    ]
  },
  
  // NOUVEAU: Options pour Masters Professionnels
  optionMasterPro: {
    type: String,
    enum: [
      'Systèmes de communication et Data center',
      'Management des Systèmes d\'Information',
      'Génie Logiciel',
      'Intelligence Artificielle et Data Science'
    ],
      set: v => (v === '' ? undefined : v)   // ← ajoute ça

  },
  
  // Champs existants
  option: String,
  specialite: String,
  typeDiplome: String,
  diplomeAcces: String,
  specialiteDiplomeAcces: String,
  mention: String,
  lieuObtentionDiplome: String,
  serieBaccalaureat: String,
  anneeBaccalaureat: Number,
  premiereAnneeInscription: Number,
  sourceInscription: String,
  typePaiement: String,
  prixTotal: Number,
  pourcentageBourse: Number,
  situation: String,
  nouvelleInscription: {
    type: Boolean,
    default: true
  },
  paye: {
    type: Boolean,
    default: false
  },
  handicape: {
    type: Boolean,
    default: false
  },
  resident: {
    type: Boolean,
    default: false
  },
  fonctionnaire: {
    type: Boolean,
    default: false
  },
  mobilite: {
    type: Boolean,
    default: false
  },
  codeEtudiant: String,
  dateEtReglement: String,
  image: {
    type: String,
    default: ''
  },
  commercial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commercial',
    default: null
  },
  actif: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: null
  },
  dateInscription: {
    type: Date,
    default: Date.now
  },
  creeParAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, { timestamps: true });

// Virtual pour le nom complet
etudiantSchema.virtual('nomComplet').get(function () {
  return `${this.nomDeFamille || ''} ${this.prenom || ''}`.trim();
});

// Virtual pour le parcours complet
etudiantSchema.virtual('parcoursComplet').get(function () {
  let parcours = [];
  
  if (this.typeFormation) {
    parcours.push(`Formation: ${this.typeFormation}`);
  }
  
  if (this.cycle) {
    parcours.push(`Cycle: ${this.cycle}`);
  }
  
  if (this.specialiteIngenieur) {
    parcours.push(`Spécialité: ${this.specialiteIngenieur}`);
  }
  if (this.optionIngenieur) {
    parcours.push(`Option: ${this.optionIngenieur}`);
  }
  
  if (this.specialiteLicencePro) {
    parcours.push(`Spécialité: ${this.specialiteLicencePro}`);
  }
  if (this.optionLicencePro) {
    parcours.push(`Option: ${this.optionLicencePro}`);
  }
  
  if (this.specialiteMasterPro) {
    parcours.push(`Spécialité: ${this.specialiteMasterPro}`);
  }
  if (this.optionMasterPro) {
    parcours.push(`Option: ${this.optionMasterPro}`);
  }
  
  if (this.specialite) {
    parcours.push(`Spécialité: ${this.specialite}`);
  }
  if (this.option) {
    parcours.push(`Option: ${this.option}`);
  }
  
  if (this.anneeScolaire) {
    parcours.push(`Année: ${this.anneeScolaire}`);
  }
  
  return parcours.join(' | ');
});

// ===== NOUVELLES MÉTHODES POUR AUTO-ASSIGNATION =====

// Méthode statique pour déterminer automatiquement le niveau selon le type de formation
etudiantSchema.statics.determinerNiveauAutomatique = function(typeFormation, niveauFourni) {
  // Auto-assignation des niveaux pour Licence Pro et Master Pro
  if (typeFormation === 'LICENCE_PRO') {
    return 3; // Licence Pro = toujours niveau 3
  } else if (typeFormation === 'MASTER_PRO') {
    return 4; // Master Pro = toujours niveau 4
  }
  
  // Pour les autres formations, garder le niveau fourni
  return niveauFourni;
};

// Méthode statique pour générer l'année scolaire actuelle
etudiantSchema.statics.getAnneeScolaireActuelle = function() {
  const now = new Date();
  const anneeActuelle = now.getFullYear();
  const mois = now.getMonth() + 1;
  
  if (mois >= 9) {
    return `${anneeActuelle}/${anneeActuelle + 1}`;
  } else {
    return `${anneeActuelle - 1}/${anneeActuelle}`;
  }
};

// Méthode statique pour générer les années scolaires disponibles
etudiantSchema.statics.getAnneesScolairesDisponibles = function(nbAnnees = 10) {
  const anneeScolaireActuelle = this.getAnneeScolaireActuelle();
  const [anneeDebut] = anneeScolaireActuelle.split('/').map(Number);
  const annees = [];
  
  for (let i = -5; i < nbAnnees - 5; i++) {
    const debut = anneeDebut + i;
    const fin = debut + 1;
    annees.push(`${debut}/${fin}`);
  }
  
  return annees.sort();
};

// Méthode pour vérifier si l'étudiant est dans l'année scolaire actuelle
etudiantSchema.methods.estDansAnneeScolaireActuelle = function() {
  const anneeScolaireActuelle = this.constructor.getAnneeScolaireActuelle();
  return this.anneeScolaire === anneeScolaireActuelle;
};

// Méthode pour déterminer automatiquement le cycle basé sur le niveau et le type de formation
etudiantSchema.methods.determinerCycle = function() {
  if (this.typeFormation === 'CYCLE_INGENIEUR') {
    if (this.niveau >= 1 && this.niveau <= 2) {
      this.cycle = 'Classes Préparatoires Intégrées';
      this.specialiteIngenieur = undefined;
      this.optionIngenieur = undefined;
    } else if (this.niveau >= 3 && this.niveau <= 5) {
      this.cycle = 'Cycle Ingénieur';
    }
  } else {
    this.cycle = undefined;
    this.specialiteIngenieur = undefined;
    this.optionIngenieur = undefined;
  }
  return this.cycle;
};

// Méthode pour valider la cohérence du parcours (MODIFIÉE)
etudiantSchema.methods.validerParcours = function() {
  const erreurs = [];
  
  if (this.typeFormation === 'CYCLE_INGENIEUR') {
    if (this.niveau >= 1 && this.niveau <= 2) {
      if (this.cycle !== 'Classes Préparatoires Intégrées') {
        erreurs.push('Les niveaux 1-2 doivent être en Classes Préparatoires Intégrées');
      }
      if (this.specialiteIngenieur) {
        erreurs.push('Pas de spécialité d\'ingénieur en Classes Préparatoires');
      }
      if (this.optionIngenieur) {
        erreurs.push('Pas d\'option d\'ingénieur en Classes Préparatoires');
      }
    }
    
    if (this.niveau >= 3 && this.niveau <= 5) {
      if (this.cycle !== 'Cycle Ingénieur') {
        erreurs.push('Les niveaux 3-5 doivent être en Cycle Ingénieur');
      }
      if (this.niveau >= 3 && !this.specialiteIngenieur) {
        erreurs.push('Spécialité d\'ingénieur requise à partir du niveau 3');
      }
      if (this.niveau === 5 && !this.optionIngenieur) {
        erreurs.push('Option d\'ingénieur requise au niveau 5');
      }
    }
    
    if (this.specialiteIngenieur && this.optionIngenieur) {
      const optionsParSpecialite = {
        'Génie Informatique': [
          'Sécurité & Mobilité Informatique',
          'IA & Science des Données',
          'Réseaux & Cloud Computing'
        ],
        'Génie Mécatronique': [
          'Génie Mécanique',
          'Génie Industriel',
          'Automatisation'
        ],
        'Génie Civil': [
          'Structures & Ouvrages d\'art',
          'Bâtiment & Efficacité Énergétique',
          'Géotechnique & Infrastructures'
        ]
      };
      
      const optionsValides = optionsParSpecialite[this.specialiteIngenieur] || [];
      if (!optionsValides.includes(this.optionIngenieur)) {
        erreurs.push(`L'option "${this.optionIngenieur}" n'est pas valide pour la spécialité "${this.specialiteIngenieur}"`);
      }
    }
    
    if (this.specialiteLicencePro || this.optionLicencePro || this.specialiteMasterPro || this.optionMasterPro) {
      erreurs.push('Les champs licence pro et master pro ne sont pas disponibles pour CYCLE_INGENIEUR');
    }
    
  } else if (this.typeFormation === 'LICENCE_PRO') {
    // NIVEAU AUTO-ASSIGNÉ À 3 - PAS DE VALIDATION DE NIVEAU REQUIS
    if (!this.specialiteLicencePro) {
      erreurs.push('Une spécialité est obligatoire pour Licence Professionnelle');
    }
    
    if (this.optionLicencePro) {
      const optionsParSpecialiteLicence = {
        'Développement Informatique Full Stack': [
          'Développement Mobile',
          'Intelligence Artificielle et Data Analytics',
          'Développement JAVA JEE',
          'Développement Gaming et VR'
        ],
        'Réseaux et Cybersécurité': [
          'Administration des Systèmes et Cloud Computing'
        ]
      };
      
      const optionsValides = optionsParSpecialiteLicence[this.specialiteLicencePro] || [];
      if (this.optionLicencePro && !optionsValides.includes(this.optionLicencePro)) {
        erreurs.push(`L'option "${this.optionLicencePro}" n'est pas valide pour la spécialité "${this.specialiteLicencePro}"`);
      }
    }
    
    if (this.cycle || this.specialiteIngenieur || this.optionIngenieur || this.specialiteMasterPro || this.optionMasterPro) {
      erreurs.push('Les champs ingénieur et master pro ne sont pas disponibles pour LICENCE_PRO');
    }
    
  } else if (this.typeFormation === 'MASTER_PRO') {
    // NIVEAU AUTO-ASSIGNÉ À 4 - PAS DE VALIDATION DE NIVEAU REQUIS
    if (!this.specialiteMasterPro) {
      erreurs.push('Une spécialité est obligatoire pour Master Professionnel');
    }
    
    if (this.optionMasterPro) {
      const optionsParSpecialiteMaster = {
        'Cybersécurité et Transformation Digitale': [
          'Systèmes de communication et Data center',
          'Management des Systèmes d\'Information'
        ],
        'Génie Informatique et Innovation Technologique': [
          'Génie Logiciel',
          'Intelligence Artificielle et Data Science'
        ]
      };
      
      const optionsValides = optionsParSpecialiteMaster[this.specialiteMasterPro] || [];
      if (this.optionMasterPro && !optionsValides.includes(this.optionMasterPro)) {
        erreurs.push(`L'option "${this.optionMasterPro}" n'est pas valide pour la spécialité "${this.specialiteMasterPro}"`);
      }
    }
    
    if (this.cycle || this.specialiteIngenieur || this.optionIngenieur || this.specialiteLicencePro || this.optionLicencePro) {
      erreurs.push('Les champs ingénieur et licence pro ne sont pas disponibles pour MASTER_PRO');
    }
    
  } else if (this.typeFormation === 'MASI' || this.typeFormation === 'IRM') {
    if (this.niveau >= 3 && !this.specialite) {
      erreurs.push(`Une spécialité est obligatoire à partir du niveau 3 pour ${this.typeFormation}`);
    }
    
    if (this.niveau === 5 && !this.option) {
      erreurs.push(`Une option est obligatoire au niveau 5 pour ${this.typeFormation}`);
    }
    
    if (this.typeFormation && this.specialite && this.niveau) {
      const STRUCTURE_FORMATION = {
        MASI: {
          3: ['Entreprenariat, audit et finance', 'Développement commercial et marketing digital'],
          4: ['Management des affaires et systèmes d\'information'],
          5: ['Management des affaires et systèmes d\'information']
        },
        IRM: {
          3: ['Développement informatique', 'Réseaux et cybersécurité'],
          4: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale'],
          5: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale']
        }
      };
      
      const specialitesDisponibles = STRUCTURE_FORMATION[this.typeFormation]?.[this.niveau] || [];
      if (specialitesDisponibles.length > 0 && !specialitesDisponibles.includes(this.specialite)) {
        erreurs.push(`La spécialité "${this.specialite}" n'est pas disponible pour ${this.typeFormation} niveau ${this.niveau}`);
      }
    }
    
    if (this.cycle || this.specialiteIngenieur || this.optionIngenieur || this.specialiteLicencePro || this.optionLicencePro || this.specialiteMasterPro || this.optionMasterPro) {
      erreurs.push('Les champs cycle, licence pro et master pro ne sont disponibles que pour leurs formations respectives');
    }
  }
  
  return erreurs;
};

// MIDDLEWARE PRE-SAVE MODIFIÉ
etudiantSchema.pre('save', function(next) {
  // Si l'année scolaire n'est pas définie, utiliser l'année scolaire actuelle
  if (!this.anneeScolaire) {
    this.anneeScolaire = this.constructor.getAnneeScolaireActuelle();
  }
  
  // ===== AUTO-ASSIGNATION DU NIVEAU SELON LE TYPE DE FORMATION =====
  if (this.typeFormation) {
    this.niveau = this.constructor.determinerNiveauAutomatique(this.typeFormation, this.niveau);
  }
  
  // Déterminer automatiquement le cycle basé sur le niveau et le type de formation
  if (this.niveau && this.typeFormation) {
    this.determinerCycle();
  }
  
  // Valider la cohérence du parcours
  const erreurs = this.validerParcours();
  if (erreurs.length > 0) {
    return next(new Error(`Erreurs de validation du parcours: ${erreurs.join(', ')}`));
  }
  
  next();
});

// Méthodes statiques existantes...
etudiantSchema.statics.getOptionsParSpecialiteIngenieur = function(specialite) {
  const optionsParSpecialite = {
    'Génie Informatique': [
      'Sécurité & Mobilité Informatique',
      'IA & Science des Données',
      'Réseaux & Cloud Computing'
    ],
    'Génie Mécatronique': [
      'Génie Mécanique',
      'Génie Industriel',
      'Automatisation'
    ],
    'Génie Civil': [
      'Structures & Ouvrages d\'art',
      'Bâtiment & Efficacité Énergétique',
      'Géotechnique & Infrastructures'
    ]
  };
  
  return optionsParSpecialite[specialite] || [];
};

etudiantSchema.statics.getOptionsParSpecialiteLicencePro = function(specialite) {
  const optionsParSpecialite = {
    'Développement Informatique Full Stack': [
      'Développement Mobile',
      'Intelligence Artificielle et Data Analytics',
      'Développement JAVA JEE',
      'Développement Gaming et VR'
    ],
    'Réseaux et Cybersécurité': [
      'Administration des Systèmes et Cloud Computing'
    ]
  };
  
  return optionsParSpecialite[specialite] || [];
};

etudiantSchema.statics.getOptionsParSpecialiteMasterPro = function(specialite) {
  const optionsParSpecialite = {
    'Cybersécurité et Transformation Digitale': [
      'Systèmes de communication et Data center',
      'Management des Systèmes d\'Information'
    ],
    'Génie Informatique et Innovation Technologique': [
      'Génie Logiciel',
      'Intelligence Artificielle et Data Science'
    ]
  };
  
  return optionsParSpecialite[specialite] || [];
};

etudiantSchema.statics.getSpecialitesLicencePro = function() {
  return [
    'Marketing digital e-business Casablanca',
    'Tests Logiciels avec Tests Automatisés',
    'Gestion de la Qualité',
    'Développement Informatique Full Stack',
    'Administration des Systèmes, Bases de Données, Cybersécurité et Cloud Computing',
    'Réseaux et Cybersécurité',
    'Finance, Audit & Entrepreneuriat',
    'Développement Commercial et Marketing Digital',
    'Management et Conduite de Travaux – Cnam',
    'Electrotechnique et systèmes – Cnam',
    'Informatique – Cnam'
  ];
};

etudiantSchema.statics.getSpecialitesMasterPro = function() {
  return [
    'Informatique, Data Sciences, Cloud, Cybersécurité & Intelligence Artificielle (DU IDCIA)',
    'QHSSE & Performance Durable',
    'Achat, Logistique et Supply Chain Management',
    'Management des Systèmes d\'Information',
    'Big Data et Intelligence Artificielle',
    'Cybersécurité et Transformation Digitale',
    'Génie Informatique et Innovation Technologique',
    'Finance, Audit & Entrepreneuriat',
    'Développement Commercial et Marketing Digital'
  ];
};

etudiantSchema.statics.getCycleParNiveau = function(niveau) {
  if (niveau >= 1 && niveau <= 2) {
    return 'Classes Préparatoires Intégrées';
  } else if (niveau >= 3 && niveau <= 5) {
    return 'Cycle Ingénieur';
  }
  return null;
};

etudiantSchema.set('toObject', { virtuals: true });
etudiantSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Etudiant', etudiantSchema);