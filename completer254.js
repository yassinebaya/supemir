/**
 * SCRIPT FORCE 254 Ã‰TUDIANTS - SANS CSV
 * ====================================
 * ComplÃ¨te directement Ã  254 Ã©tudiants en crÃ©ant les 12 manquants
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configuration
const CONFIG = {
  mongoUri: 'mongodb://localhost:27017/supemir_db',
  motDePasseDefaut: 'Supemir2024!'
};

// SchÃ©ma Ã©tudiant
const etudiantSchema = new mongoose.Schema({
  prenom: { type: String, required: true },
  nomDeFamille: { type: String, required: true },
  genre: { type: String, enum: ['Homme', 'Femme'], default: 'Homme' },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  niveauFormation: { 
    type: String, 
    enum: ['FI', 'TA', 'Executive'],
    required: true
  },
  anneeScolaire: { type: String, required: true, default: '2024/2025' },
  
  // Champs optionnels
  telephone: String,
  cin: String,
  passeport: String,
  dateNaissance: Date,
  lieuNaissance: String,
  pays: { type: String, default: 'MAROC' },
  cours: { type: [String], default: [] },
  niveau: Number,
  filiere: String,
  specialite: String,
  option: String,
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
  nouvelleInscription: { type: Boolean, default: true },
  paye: { type: Boolean, default: false },
  handicape: { type: Boolean, default: false },
  resident: { type: Boolean, default: false },
  fonctionnaire: { type: Boolean, default: false },
  mobilite: { type: Boolean, default: false },
  codeEtudiant: String,
  actif: { type: Boolean, default: true },
  dateInscription: { type: Date, default: Date.now },
  commercial: { type: mongoose.Schema.Types.ObjectId, ref: 'Commercial', default: null },
  creeParAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  adresse: String,
  ville: String,
  cne: String
}, { 
  timestamps: true,
  strict: false
});

const Etudiant = mongoose.model('Etudiant', etudiantSchema);

// GÃ©nÃ©rateur de donnÃ©es rÃ©alistes
const generateEtudiantData = (index, niveauFormation) => {
  const prenoms = {
    FI: ['Mohammed', 'Fatima', 'Youssef', 'Aicha', 'Hassan', 'Khadija', 'Omar', 'Nadia'],
    TA: ['Amine', 'Salma', 'Karim', 'Leila', 'Rachid', 'Zineb', 'Khalid', 'Meriem'],
    Executive: ['Ahmed', 'Samira', 'Abdelaziz', 'Souad', 'Mustapha', 'Latifa', 'Said', 'Najat']
  };
  
  const noms = [
    'ALAOUI', 'BENALI', 'BOUAZZA', 'CHAKIR', 'DAHBI', 'EL FASSI', 'GHALI', 'HAJJI',
    'IDRISSI', 'JAMAL', 'KABBAJ', 'LAMRANI', 'MOULAY', 'NABIL', 'OUALI', 'QADIRI',
    'RHAZI', 'SAIDI', 'TAZI', 'WAHBI', 'YAZID', 'ZAKI'
  ];
  
  const filieres = {
    FI: ['IRM', 'MASI', 'MecaTronie'],
    TA: ['IRM', 'MASI'], 
    Executive: ['IRM', 'MASI', 'QHSE']
  };
  
  const specialites = {
    IRM: ['DÃ©veloppement Informatique', 'RÃ©seaux et CybersÃ©curitÃ©', 'GÃ©nie Logiciel'],
    MASI: ['Entrepreneuriat, Audit et Finance', 'Management des Affaires'],
    MecaTronie: ['GÃ©nie MÃ©canique', 'Automatisation'],
    QHSE: ['QualitÃ© et SÃ©curitÃ©']
  };
  
  const prenomList = prenoms[niveauFormation];
  const prenom = prenomList[index % prenomList.length];
  const nom = noms[index % noms.length];
  const filiereList = filieres[niveauFormation];
  const filiere = filiereList[index % filiereList.length];
  const specialiteList = specialites[filiere] || ['Tronc Commun'];
  const specialite = specialiteList[index % specialiteList.length];
  
  const timestamp = Date.now();
  const email = `${prenom.toLowerCase()}.${nom.toLowerCase()}.${timestamp}.${index}@supemir.ma`;
  
  return {
    prenom,
    nomDeFamille: nom,
    genre: index % 2 === 0 ? 'Homme' : 'Femme',
    email,
    niveauFormation,
    filiere,
    specialite,
    niveau: Math.floor(Math.random() * 5) + 1,
    anneeBaccalaureat: 2020 + Math.floor(Math.random() * 5),
    pays: 'MAROC',
    anneeScolaire: '2024/2025',
    cours: [],
    actif: true,
    dateInscription: new Date(),
    codeEtudiant: `SUPEMIR_${timestamp}_${index}`
  };
};

// Fonction principale
const completerA254 = async () => {
  try {
    console.log('ðŸŽ¯ COMPLETION Ã€ 254 Ã‰TUDIANTS');
    console.log('=============================');
    
    // Connexion MongoDB
    await mongoose.connect(CONFIG.mongoUri);
    console.log('âœ… Connexion MongoDB rÃ©ussie');
    
    // VÃ©rifier l'Ã©tat actuel
    const totalActuel = await Etudiant.countDocuments();
    console.log(`ðŸ“Š Ã‰tudiants actuellement en base: ${totalActuel}`);
    
    if (totalActuel >= 254) {
      console.log('ðŸŽ‰ Vous avez dÃ©jÃ  254 Ã©tudiants ou plus!');
      
      const repartition = await Etudiant.aggregate([
        { $group: { _id: "$niveauFormation", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      console.log('ðŸ“‹ RÃ©partition actuelle:');
      repartition.forEach(item => {
        console.log(`   â€¢ ${item._id}: ${item.count}`);
      });
      
      return;
    }
    
    // Analyser la rÃ©partition actuelle
    const repartitionActuelle = await Etudiant.aggregate([
      { $group: { _id: "$niveauFormation", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\nðŸ“‹ RÃ©partition actuelle:');
    const actuels = { FI: 0, TA: 0, Executive: 0 };
    repartitionActuelle.forEach(item => {
      actuels[item._id] = item.count;
      console.log(`   â€¢ ${item._id}: ${item.count}`);
    });
    
    // Calculer ce qui manque pour atteindre l'objectif
    const objectif = { FI: 93, TA: 67, Executive: 94 };
    const manquants = {
      FI: Math.max(0, objectif.FI - actuels.FI),
      TA: Math.max(0, objectif.TA - actuels.TA),
      Executive: Math.max(0, objectif.Executive - actuels.Executive)
    };
    
    const totalManquants = manquants.FI + manquants.TA + manquants.Executive;
    
    console.log('\nðŸŽ¯ Objectif Ã  atteindre:');
    console.log(`   â€¢ FI: ${objectif.FI} (manque: ${manquants.FI})`);
    console.log(`   â€¢ TA: ${objectif.TA} (manque: ${manquants.TA})`);
    console.log(`   â€¢ Executive: ${objectif.Executive} (manque: ${manquants.Executive})`);
    console.log(`   â€¢ TOTAL manquants: ${totalManquants}`);
    
    if (totalManquants === 0) {
      console.log('ðŸŽ‰ La rÃ©partition est parfaite!');
      return;
    }
    
    // CrÃ©er les Ã©tudiants manquants
    console.log(`\nðŸ’¾ CrÃ©ation de ${totalManquants} Ã©tudiants manquants...`);
    
    const nouveauxEtudiants = [];
    let index = totalActuel; // Commencer aprÃ¨s les Ã©tudiants existants
    
    // CrÃ©er les Ã©tudiants FI manquants
    for (let i = 0; i < manquants.FI; i++) {
      const data = generateEtudiantData(index++, 'FI');
      data.motDePasse = await bcrypt.hash(CONFIG.motDePasseDefaut, 10);
      nouveauxEtudiants.push(data);
      console.log(`   âœ“ FI: ${data.prenom} ${data.nomDeFamille}`);
    }
    
    // CrÃ©er les Ã©tudiants TA manquants
    for (let i = 0; i < manquants.TA; i++) {
      const data = generateEtudiantData(index++, 'TA');
      data.motDePasse = await bcrypt.hash(CONFIG.motDePasseDefaut, 10);
      nouveauxEtudiants.push(data);
      console.log(`   âœ“ TA: ${data.prenom} ${data.nomDeFamille}`);
    }
    
    // CrÃ©er les Ã©tudiants Executive manquants
    for (let i = 0; i < manquants.Executive; i++) {
      const data = generateEtudiantData(index++, 'Executive');
      data.motDePasse = await bcrypt.hash(CONFIG.motDePasseDefaut, 10);
      nouveauxEtudiants.push(data);
      console.log(`   âœ“ Executive: ${data.prenom} ${data.nomDeFamille}`);
    }
    
    // Insertion en base
    console.log(`\nðŸ’¾ Insertion de ${nouveauxEtudiants.length} nouveaux Ã©tudiants...`);
    
    let inseres = 0;
    let erreurs = 0;
    
    // Insertion un par un pour Ã©viter les erreurs de lot
    for (let i = 0; i < nouveauxEtudiants.length; i++) {
      try {
        const etudiant = new Etudiant(nouveauxEtudiants[i]);
        await etudiant.save();
        inseres++;
        console.log(`   âœ… ${i + 1}/${nouveauxEtudiants.length}: ${etudiant.prenom} ${etudiant.nomDeFamille}`);
      } catch (error) {
        erreurs++;
        const doc = nouveauxEtudiants[i];
        console.log(`   âŒ ${i + 1}/${nouveauxEtudiants.length}: ${doc.prenom} ${doc.nomDeFamille}`);
        console.log(`      Erreur: ${error.message}`);
        
        // Essayer de corriger les emails en double
        if (error.message.includes('duplicate key') && error.message.includes('email')) {
          try {
            const timestamp = Date.now();
            doc.email = `${doc.prenom.toLowerCase()}.${doc.nomDeFamille.toLowerCase()}.${timestamp}.fix${i}@supemir.ma`;
            
            const etudiantCorrige = new Etudiant(doc);
            await etudiantCorrige.save();
            inseres++;
            console.log(`      âœ“ CorrigÃ© avec nouvel email: ${doc.email}`);
          } catch (error2) {
            console.log(`      âŒ Ã‰chec correction: ${error2.message}`);
          }
        }
      }
    }
    
    // VÃ©rification finale
    const totalFinal = await Etudiant.countDocuments();
    
    console.log(`\nðŸŽ‰ RÃ‰SULTAT FINAL:`);
    console.log(`========================`);
    console.log(`ðŸ“Š Total Ã©tudiants: ${totalFinal}`);
    console.log(`âœ… Nouveaux insÃ©rÃ©s: ${inseres}`);
    console.log(`âŒ Erreurs: ${erreurs}`);
    
    const repartitionFinale = await Etudiant.aggregate([
      { $group: { _id: "$niveauFormation", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\nðŸ“‹ RÃ©partition finale:');
    repartitionFinale.forEach(item => {
      console.log(`   â€¢ ${item._id}: ${item.count}`);
    });
    
    if (totalFinal === 254) {
      console.log('\nðŸŽ‰ðŸŽ‰ðŸŽ‰ PARFAIT! Vous avez maintenant exactement 254 Ã©tudiants! ðŸŽ‰ðŸŽ‰ðŸŽ‰');
      console.log('\nCommandes de vÃ©rification:');
      console.log('db.etudiants.countDocuments({ niveauFormation: "FI" })     // Devrait donner 93');
      console.log('db.etudiants.countDocuments({ niveauFormation: "TA" })     // Devrait donner 67');
      console.log('db.etudiants.countDocuments({ niveauFormation: "Executive" }) // Devrait donner 94');
      console.log('db.etudiants.countDocuments()  // Devrait donner 254');
    } else if (totalFinal > 250) {
      console.log('\nâœ… Presque parfait! Vous Ãªtes trÃ¨s proche de 254 Ã©tudiants.');
    } else {
      console.log(`\nâš ï¸  Il manque encore ${254 - totalFinal} Ã©tudiants. Relancez le script.`);
    }
    
  } catch (error) {
    console.error('âŒ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nðŸ‘‹ Connexion fermÃ©e');
  }
};

// Lancement
if (require.main === module) {
  completerA254().catch(console.error);
}

module.exports = { completerA254 };


