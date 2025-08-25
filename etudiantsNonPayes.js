/**
 * Script pour identifier les Ã©tudiants non payÃ©s
 * ----------------------------------------------
 * Affiche la liste dÃ©taillÃ©e des Ã©tudiants qui n'ont pas encore payÃ©
 * 
 * UTILISATION:
 *   node etudiantsNonPayes.js "mongodb://localhost:27017/supemir_db"
 */

const mongoose = require('mongoose');

// ModÃ¨les
let Etudiant, Paiement;

try {
  Etudiant = require('./models/Etudiant');
  Paiement = require('./models/Paiement');
} catch (e) {
  console.log('ðŸ“š Utilisation des schÃ©mas intÃ©grÃ©s...');
  
  const etudiantSchema = new mongoose.Schema({
    prenom: String,
    nomDeFamille: String,
    email: String,
    telephone: String,
    codeEtudiant: String,
    filiere: String,
    niveau: Number,
    typeFormation: String,
    specialite: String,
    specialiteLicencePro: String,
    specialiteMasterPro: String,
    anneeScolaire: String,
    paye: { type: Boolean, default: false },
    prixTotal: Number,
    sourceInscription: String,
    actif: { type: Boolean, default: true }
  }, { timestamps: true });
  
  const paiementSchema = new mongoose.Schema({
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Etudiant',
      required: true
    },
    montant: Number,
    datePaiementOriginal: Date
  }, { timestamps: true });
  
  Etudiant = mongoose.model('Etudiant', etudiantSchema);
  Paiement = mongoose.model('Paiement', paiementSchema);
}

// ========= Fonctions principales =========

async function getUnpaidStudents() {
  console.log('ðŸ” RECHERCHE DES Ã‰TUDIANTS NON PAYÃ‰S');
  console.log('='.repeat(50));
  
  // MÃ©thode 1: Ã‰tudiants avec paye = false
  const etudiantsNonPayesFlag = await Etudiant.find(
    { 
      paye: false,
      actif: true // Seulement les Ã©tudiants actifs
    },
    {
      prenom: 1,
      nomDeFamille: 1,
      email: 1,
      telephone: 1,
      codeEtudiant: 1,
      filiere: 1,
      niveau: 1,
      typeFormation: 1,
      specialite: 1,
      specialiteLicencePro: 1,
      specialiteMasterPro: 1,
      prixTotal: 1,
      sourceInscription: 1,
      createdAt: 1
    }
  ).sort({ nomDeFamille: 1, prenom: 1 });
  
  console.log(`ðŸ“Š Ã‰tudiants avec paye=false: ${etudiantsNonPayesFlag.length}`);
  
  // MÃ©thode 2: Ã‰tudiants sans aucun paiement enregistrÃ©
  const etudiantsAvecPaiements = await Paiement.distinct('etudiant');
  const etudiantsSansPaiements = await Etudiant.find(
    {
      _id: { $nin: etudiantsAvecPaiements },
      actif: true
    },
    {
      prenom: 1,
      nomDeFamille: 1,
      email: 1,
      telephone: 1,
      codeEtudiant: 1,
      filiere: 1,
      niveau: 1,
      typeFormation: 1,
      paye: 1,
      prixTotal: 1
    }
  ).sort({ nomDeFamille: 1, prenom: 1 });
  
  console.log(`ðŸ“Š Ã‰tudiants sans paiements: ${etudiantsSansPaiements.length}`);
  
  return { etudiantsNonPayesFlag, etudiantsSansPaiements };
}

async function displayUnpaidStudentsDetails(etudiantsNonPayes) {
  console.log('\nðŸ‘¤ DÃ‰TAILS DES Ã‰TUDIANTS NON PAYÃ‰S');
  console.log('='.repeat(50));
  
  if (etudiantsNonPayes.length === 0) {
    console.log('ðŸŽ‰ Aucun Ã©tudiant non payÃ© trouvÃ© !');
    return;
  }
  
  etudiantsNonPayes.forEach((etudiant, index) => {
    console.log(`\nðŸ“ Ã‰tudiant ${index + 1}:`);
    console.log(`   ðŸ‘¤ Nom: ${etudiant.prenom} ${etudiant.nomDeFamille}`);
    console.log(`   ðŸ“§ Email: ${etudiant.email || 'Non renseignÃ©'}`);
    console.log(`   ðŸ“± TÃ©lÃ©phone: ${etudiant.telephone || 'Non renseignÃ©'}`);
    console.log(`   ðŸ†” Code Ã©tudiant: ${etudiant.codeEtudiant || 'Non renseignÃ©'}`);
    console.log(`   ðŸŽ“ Formation: ${etudiant.typeFormation || 'Non dÃ©finie'}`);
    console.log(`   ðŸ“š FiliÃ¨re: ${etudiant.filiere || 'Non dÃ©finie'}`);
    console.log(`   ðŸ“Š Niveau: ${etudiant.niveau || 'Non dÃ©fini'}`);
    
    // SpÃ©cialitÃ© selon le type de formation
    let specialite = 'Non dÃ©finie';
    if (etudiant.specialiteLicencePro) {
      specialite = etudiant.specialiteLicencePro;
    } else if (etudiant.specialiteMasterPro) {
      specialite = etudiant.specialiteMasterPro;
    } else if (etudiant.specialite) {
      specialite = etudiant.specialite;
    }
    console.log(`   ðŸ”¬ SpÃ©cialitÃ©: ${specialite}`);
    
    console.log(`   ðŸ’° Prix total: ${etudiant.prixTotal ? etudiant.prixTotal.toLocaleString() + ' MAD' : 'Non dÃ©fini'}`);
    console.log(`   ðŸ“ Source inscription: ${etudiant.sourceInscription || 'Non renseignÃ©e'}`);
    console.log(`   ðŸ“… Inscrit le: ${etudiant.createdAt ? new Date(etudiant.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}`);
    console.log(`   âœ… Statut paiement: ${etudiant.paye ? 'PayÃ©' : 'NON PAYÃ‰'}`);
  });
}

async function generateUnpaidStudentsReport(etudiantsNonPayes) {
  console.log('\nðŸ“‹ RAPPORT RÃ‰SUMÃ‰ DES Ã‰TUDIANTS NON PAYÃ‰S');
  console.log('='.repeat(50));
  
  if (etudiantsNonPayes.length === 0) {
    console.log('ðŸŽ‰ Tous les Ã©tudiants ont payÃ© !');
    return;
  }
  
  // Statistiques par formation
  const parFormation = {};
  const parFiliere = {};
  const parNiveau = {};
  let montantTotalDu = 0;
  let etudiantsAvecMontant = 0;
  
  etudiantsNonPayes.forEach(etudiant => {
    // Par formation
    const formation = etudiant.typeFormation || 'Non dÃ©finie';
    parFormation[formation] = (parFormation[formation] || 0) + 1;
    
    // Par filiÃ¨re
    const filiere = etudiant.filiere || 'Non dÃ©finie';
    parFiliere[filiere] = (parFiliere[filiere] || 0) + 1;
    
    // Par niveau
    const niveau = etudiant.niveau ? `Niveau ${etudiant.niveau}` : 'Niveau non dÃ©fini';
    parNiveau[niveau] = (parNiveau[niveau] || 0) + 1;
    
    // Montant
    if (etudiant.prixTotal) {
      montantTotalDu += etudiant.prixTotal;
      etudiantsAvecMontant++;
    }
  });
  
  console.log(`ðŸ“Š Total Ã©tudiants non payÃ©s: ${etudiantsNonPayes.length}`);
  console.log(`ðŸ’° Montant total dÃ»: ${montantTotalDu.toLocaleString()} MAD`);
  console.log(`ðŸ“ˆ Montant moyen: ${etudiantsAvecMontant > 0 ? Math.round(montantTotalDu / etudiantsAvecMontant).toLocaleString() : 'N/A'} MAD`);
  
  console.log('\nðŸ“š RÃ©partition par type de formation:');
  Object.entries(parFormation)
    .sort(([,a], [,b]) => b - a)
    .forEach(([formation, count]) => {
      console.log(`   ${formation}: ${count} Ã©tudiant(s)`);
    });
  
  console.log('\nðŸŽ“ RÃ©partition par filiÃ¨re:');
  Object.entries(parFiliere)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) // Top 10
    .forEach(([filiere, count]) => {
      console.log(`   ${filiere}: ${count} Ã©tudiant(s)`);
    });
  
  console.log('\nðŸ“Š RÃ©partition par niveau:');
  Object.entries(parNiveau)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([niveau, count]) => {
      console.log(`   ${niveau}: ${count} Ã©tudiant(s)`);
    });
  
  return {
    total: etudiantsNonPayes.length,
    montantTotalDu,
    parFormation,
    parFiliere,
    parNiveau
  };
}

async function generateContactList(etudiantsNonPayes) {
  console.log('\nðŸ“ž LISTE DE CONTACT (Ã‰TUDIANTS NON PAYÃ‰S)');
  console.log('='.repeat(50));
  
  const etudiantsAvecContact = etudiantsNonPayes.filter(e => e.email || e.telephone);
  
  if (etudiantsAvecContact.length === 0) {
    console.log('âŒ Aucun contact disponible pour les Ã©tudiants non payÃ©s');
    return;
  }
  
  console.log(`ðŸ“‹ ${etudiantsAvecContact.length}/${etudiantsNonPayes.length} Ã©tudiants avec contact disponible:\n`);
  
  etudiantsAvecContact.forEach((etudiant, index) => {
    const nom = `${etudiant.prenom} ${etudiant.nomDeFamille}`;
    const formation = etudiant.typeFormation || 'Formation non dÃ©finie';
    const prix = etudiant.prixTotal ? `${etudiant.prixTotal.toLocaleString()} MAD` : 'Prix non dÃ©fini';
    
    console.log(`${index + 1}. ${nom}`);
    if (etudiant.email) console.log(`   ðŸ“§ ${etudiant.email}`);
    if (etudiant.telephone) console.log(`   ðŸ“± ${etudiant.telephone}`);
    console.log(`   ðŸŽ“ ${formation} - ðŸ’° ${prix}`);
    console.log('');
  });
  
  // Export CSV pour usage externe
  console.log('ðŸ’¾ DonnÃ©es CSV pour export:');
  console.log('Nom,PrÃ©nom,Email,TÃ©lÃ©phone,Formation,Prix');
  etudiantsAvecContact.forEach(etudiant => {
    const csv = [
      etudiant.nomDeFamille || '',
      etudiant.prenom || '',
      etudiant.email || '',
      etudiant.telephone || '',
      etudiant.typeFormation || '',
      etudiant.prixTotal || ''
    ].join(',');
    console.log(csv);
  });
}

async function checkPaymentDiscrepancies() {
  console.log('\nðŸ” VÃ‰RIFICATION DES INCOHÃ‰RENCES');
  console.log('='.repeat(50));
  
  // Ã‰tudiants marquÃ©s comme payÃ©s mais sans paiements enregistrÃ©s
  const etudiantsAvecPaiements = await Paiement.distinct('etudiant');
  const etudiantsMarquesPayesSansPaiements = await Etudiant.find({
    paye: true,
    _id: { $nin: etudiantsAvecPaiements }
  }, {
    prenom: 1,
    nomDeFamille: 1,
    email: 1,
    codeEtudiant: 1
  });
  
  // Ã‰tudiants avec paiements mais marquÃ©s comme non payÃ©s
  const etudiantsAvecPaiementsNonMarques = await Etudiant.find({
    paye: false,
    _id: { $in: etudiantsAvecPaiements }
  }, {
    prenom: 1,
    nomDeFamille: 1,
    email: 1,
    codeEtudiant: 1
  });
  
  console.log(`âš ï¸  Ã‰tudiants marquÃ©s payÃ©s sans paiements: ${etudiantsMarquesPayesSansPaiements.length}`);
  console.log(`âš ï¸  Ã‰tudiants avec paiements non marquÃ©s: ${etudiantsAvecPaiementsNonMarques.length}`);
  
  if (etudiantsMarquesPayesSansPaiements.length > 0) {
    console.log('\nðŸ”´ Ã‰tudiants marquÃ©s payÃ©s sans paiements:');
    etudiantsMarquesPayesSansPaiements.forEach(e => {
      console.log(`   - ${e.prenom} ${e.nomDeFamille} (${e.email})`);
    });
  }
  
  if (etudiantsAvecPaiementsNonMarques.length > 0) {
    console.log('\nðŸŸ¡ Ã‰tudiants avec paiements non marquÃ©s:');
    etudiantsAvecPaiementsNonMarques.forEach(e => {
      console.log(`   - ${e.prenom} ${e.nomDeFamille} (${e.email})`);
    });
  }
  
  return {
    marquesPayesSansPaiements: etudiantsMarquesPayesSansPaiements.length,
    avecPaiementsNonMarques: etudiantsAvecPaiementsNonMarques.length
  };
}

// ========= Main =========
async function main() {
  console.log('ðŸ’³ ANALYSE DES Ã‰TUDIANTS NON PAYÃ‰S\n');
  
  const mongoUri = process.argv[2] || 'mongodb://localhost:27017/supemir_db';
  
  try {
    console.log('ðŸ”Œ Connexion Ã  MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('âœ… ConnectÃ© Ã  MongoDB');
    
    // VÃ©rification des incohÃ©rences
    await checkPaymentDiscrepancies();
    
    // Recherche des Ã©tudiants non payÃ©s
    const { etudiantsNonPayesFlag, etudiantsSansPaiements } = await getUnpaidStudents();
    
    // Utiliser la liste des Ã©tudiants avec paye=false (plus fiable)
    const etudiantsNonPayes = etudiantsNonPayesFlag;
    
    // Affichage dÃ©taillÃ©
    await displayUnpaidStudentsDetails(etudiantsNonPayes);
    
    // Rapport rÃ©sumÃ©
    await generateUnpaidStudentsReport(etudiantsNonPayes);
    
    // Liste de contact
    await generateContactList(etudiantsNonPayes);
    
    console.log('\nðŸŽ¯ ACTIONS RECOMMANDÃ‰ES:');
    if (etudiantsNonPayes.length > 0) {
      console.log('1. ðŸ“§ Envoyer des rappels de paiement aux Ã©tudiants listÃ©s');
      console.log('2. ðŸ“± Contacter par tÃ©lÃ©phone les Ã©tudiants sans email');
      console.log('3. ðŸ’¾ Exporter la liste CSV pour suivi commercial');
      console.log('4. ðŸ“Š Analyser les raisons du non-paiement par formation');
    } else {
      console.log('ðŸŽ‰ Tous les Ã©tudiants actifs ont payÃ© !');
    }
    
    console.log('\nâœ… Analyse terminÃ©e !');
    
  } catch (error) {
    console.error('\nâŒ Erreur:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('ðŸ”Œ DÃ©connectÃ© de MongoDB');
  }
}

// Point d'entrÃ©e avec options
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
ðŸ“‹ SCRIPT D'ANALYSE DES Ã‰TUDIANTS NON PAYÃ‰S

UTILISATION:
  node etudiantsNonPayes.js [mongoUri]
  
ARGUMENTS:
  mongoUri : URI MongoDB (dÃ©faut: mongodb://localhost:27017/supemir_db)
  
OPTIONS:
  --help, -h : Affiche cette aide
  
FONCTIONNALITÃ‰S:
  âœ… Liste dÃ©taillÃ©e des Ã©tudiants non payÃ©s
  ðŸ“Š Statistiques par formation/filiÃ¨re/niveau
  ðŸ“ž Liste de contact avec emails/tÃ©lÃ©phones
  ðŸ’¾ Export CSV pour suivi commercial
  ðŸ” DÃ©tection d'incohÃ©rences dans les paiements
`);
  process.exit(0);
} else {
  main().catch(error => {
    console.error('ðŸ’¥ Erreur non gÃ©rÃ©e:', error);
    process.exit(1);
  });
}

module.exports = {
  getUnpaidStudents,
  displayUnpaidStudentsDetails,
  generateUnpaidStudentsReport,
  generateContactList,
  checkPaymentDiscrepancies
};


