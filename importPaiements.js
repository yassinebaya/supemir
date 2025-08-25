/**
 * Import intelligent des paiements avec liaison aux Ã©tudiants
 * ----------------------------------------------------------
 * Importe les paiements depuis le CSV et les lie automatiquement
 * aux Ã©tudiants existants en base de donnÃ©es
 * 
 * PRÃ‰REQUIS:
 *   npm i mongoose csv-parse
 *
 * UTILISATION:
 *   node importPaiements.js "mongodb://localhost:27017/supemir_db" "~/Downloads/paiment2024.2025.csv"
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const { parse } = require('csv-parse');

// ====== ModÃ¨les ======
let Etudiant, Paiement;

try {
  Etudiant = require('./models/Etudiant');
  Paiement = require('./models/Paiement');
} catch (e) {
  console.log('ðŸ“š CrÃ©ation des schÃ©mas...');
  
  // SchÃ©ma Etudiant (simplifiÃ© pour la liaison)
  const etudiantSchema = new mongoose.Schema({
    prenom: String,
    nomDeFamille: String,
    email: String,
    codeEtudiant: String,
    filiere: String,
    niveau: Number,
    typeFormation: String,
    anneeScolaire: String,
    paye: { type: Boolean, default: false }
  }, { timestamps: true });
  
  // SchÃ©ma Paiement selon votre structure
  const paiementSchema = new mongoose.Schema({
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Etudiant',
      required: true
    },
    cours: {
      type: [String],
      required: true
    },
    moisDebut: {
      type: Date,
      required: true
    },
    nombreMois: {
      type: Number,
      required: true
    },
    montant: {
      type: Number,
      required: true
    },
    note: {
      type: String
    },
    creePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    // Champs additionnels pour traÃ§abilitÃ©
    idPaiementOriginal: Number,
    numeroFacture: String,
    saisonPaiement: String,
    datePaiementOriginal: Date
  }, {
    timestamps: true
  });
  
  Etudiant = mongoose.model('Etudiant', etudiantSchema);
  Paiement = mongoose.model('Paiement', paiementSchema);
}

// ========= Helpers =========

const NULLIFY = v => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s || /^NULL$/i.test(s)) return null;
  return s;
};

const toDateOrNull = v => {
  const s = NULLIFY(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const toNumber = v => {
  const s = (v || '').toString().trim();
  if (!s || s === 'NULL') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * DÃ©termine le cours basÃ© sur la filiÃ¨re et le niveau de l'Ã©tudiant
 */
const determinerCours = (filiere, niveau, typeFormation, specialite) => {
  const cours = [];
  
  if (!filiere && !typeFormation) {
    return ['Formation GÃ©nÃ©rale'];
  }
  
  // Cours basÃ©s sur le type de formation
  switch (typeFormation) {
    case 'CYCLE_INGENIEUR':
      if (niveau <= 2) {
        cours.push('Classes PrÃ©paratoires IntÃ©grÃ©es');
      } else {
        cours.push('Cycle IngÃ©nieur');
        if (filiere) cours.push(filiere);
      }
      break;
      
    case 'LICENCE_PRO':
      cours.push('Licence Professionnelle');
      if (specialite) cours.push(specialite);
      break;
      
    case 'MASTER_PRO':
      cours.push('Master Professionnel');
      if (specialite) cours.push(specialite);
      break;
      
    case 'MASI':
      cours.push('MASI');
      if (specialite) cours.push(specialite);
      break;
      
    case 'IRM':
      cours.push('IRM');
      if (specialite) cours.push(specialite);
      break;
      
    default:
      if (filiere) {
        cours.push(filiere);
      } else {
        cours.push('Formation GÃ©nÃ©rale');
      }
  }
  
  return cours.length > 0 ? cours : ['Formation GÃ©nÃ©rale'];
};

/**
 * Calcule le nombre de mois et le mois de dÃ©but basÃ© sur la date de paiement
 */
const calculerPeriodePaiement = (datePaiement, saisonPaiement) => {
  const date = new Date(datePaiement);
  const annee = date.getFullYear();
  const mois = date.getMonth() + 1;
  
  let moisDebut;
  let nombreMois;
  
  // Logique basÃ©e sur la saison acadÃ©mique
  if (saisonPaiement === '2024/2025') {
    if (mois >= 9) {
      // Septembre Ã  dÃ©cembre = premier semestre
      moisDebut = new Date(2024, 8, 1); // 1er septembre 2024
      nombreMois = 4;
    } else if (mois >= 1 && mois <= 4) {
      // Janvier Ã  avril = second semestre
      moisDebut = new Date(2025, 0, 1); // 1er janvier 2025
      nombreMois = 4;
    } else {
      // Mai Ã  aoÃ»t = pÃ©riode d'Ã©tÃ©/rattrapage
      moisDebut = new Date(2025, 4, 1); // 1er mai 2025
      nombreMois = 2;
    }
  } else {
    // Fallback: utiliser le mois de paiement
    moisDebut = new Date(date.getFullYear(), date.getMonth(), 1);
    nombreMois = 1;
  }
  
  return { moisDebut, nombreMois };
};

/**
 * Trouve l'Ã©tudiant correspondant au RegistrarId
 */
const trouverEtudiant = async (registrarId, etudiants) => {
  // D'abord essayer par codeEtudiant (mapping direct)
  let etudiant = etudiants.find(e => e.codeEtudiant == registrarId);
  
  if (etudiant) {
    return etudiant;
  }
  
  // Si pas trouvÃ©, essayer par _id (au cas oÃ¹)
  etudiant = etudiants.find(e => e._id.toString().includes(registrarId.toString().slice(-6)));
  
  if (etudiant) {
    return etudiant;
  }
  
  // Essayer par index dans l'ordre d'insertion
  if (registrarId <= etudiants.length) {
    return etudiants[registrarId - 1];
  }
  
  return null;
};

/**
 * Mapping CSV vers schÃ©ma Paiement
 */
const mapPaiementToSchema = async (csvData, etudiants) => {
  const registrarId = toNumber(csvData.RegistrarId);
  const montant = toNumber(csvData.PricePayed);
  const datePaiement = toDateOrNull(csvData.DatePayed);
  const saisonPaiement = NULLIFY(csvData.Season);
  const commentaire = NULLIFY(csvData.Comment);
  const numeroFacture = NULLIFY(csvData.Bill);
  const idPaiementOriginal = toNumber(csvData.Id);
  
  if (!registrarId || !montant || !datePaiement) {
    throw new Error(`DonnÃ©es manquantes: RegistrarId=${registrarId}, Montant=${montant}, Date=${datePaiement}`);
  }
  
  // Trouver l'Ã©tudiant correspondant
  const etudiant = await trouverEtudiant(registrarId, etudiants);
  
  if (!etudiant) {
    throw new Error(`Ã‰tudiant non trouvÃ© pour RegistrarId: ${registrarId}`);
  }
  
  // DÃ©terminer les cours et la pÃ©riode
  const cours = determinerCours(
    etudiant.filiere, 
    etudiant.niveau, 
    etudiant.typeFormation,
    etudiant.specialite || etudiant.specialiteLicencePro || etudiant.specialiteMasterPro
  );
  
  const { moisDebut, nombreMois } = calculerPeriodePaiement(datePaiement, saisonPaiement);
  
  return {
    etudiant: etudiant._id,
    cours,
    moisDebut,
    nombreMois,
    montant,
    note: commentaire || `Paiement importÃ© - Facture: ${numeroFacture || 'N/A'}`,
    creePar: null,
    idPaiementOriginal,
    numeroFacture,
    saisonPaiement,
    datePaiementOriginal: datePaiement
  };
};

// ========= Fonctions principales =========

async function analyzePaymentStructure(csvPath) {
  console.log('ðŸ” Analyse de la structure des paiements...');
  
  const rows = await readCSV(csvPath);
  console.log(`ðŸ“Š ${rows.length} paiements dÃ©tectÃ©s`);
  
  // Statistiques
  const stats = {
    registrarIds: new Set(),
    totalMontant: 0,
    montantMin: Infinity,
    montantMax: 0,
    paiementsParMois: new Map(),
    saisons: new Set(),
    paiementsAvecFacture: 0
  };
  
  rows.forEach(row => {
    if (row.RegistrarId) stats.registrarIds.add(row.RegistrarId);
    
    const montant = toNumber(row.PricePayed);
    if (montant) {
      stats.totalMontant += montant;
      stats.montantMin = Math.min(stats.montantMin, montant);
      stats.montantMax = Math.max(stats.montantMax, montant);
    }
    
    if (row.Season) stats.saisons.add(row.Season);
    if (row.Bill) stats.paiementsAvecFacture++;
    
    const date = toDateOrNull(row.DatePayed);
    if (date) {
      const moisAnnee = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      stats.paiementsParMois.set(moisAnnee, (stats.paiementsParMois.get(moisAnnee) || 0) + 1);
    }
  });
  
  console.log('\nðŸ“ˆ Statistiques des paiements:');
  console.log(`   ðŸ’° Montant total: ${stats.totalMontant.toLocaleString()} MAD`);
  console.log(`   ðŸ“Š Montant moyen: ${Math.round(stats.totalMontant / rows.length).toLocaleString()} MAD`);
  console.log(`   ðŸ“‰ Montant min: ${stats.montantMin === Infinity ? 'N/A' : stats.montantMin.toLocaleString()} MAD`);
  console.log(`   ðŸ“ˆ Montant max: ${stats.montantMax.toLocaleString()} MAD`);
  console.log(`   ðŸ‘¥ Ã‰tudiants concernÃ©s: ${stats.registrarIds.size}`);
  console.log(`   ðŸ§¾ Paiements avec facture: ${stats.paiementsAvecFacture}/${rows.length}`);
  console.log(`   ðŸ“… Saisons: ${Array.from(stats.saisons).join(', ')}`);
  
  console.log('\nðŸ“… RÃ©partition par mois:');
  Array.from(stats.paiementsParMois.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([mois, count]) => {
      console.log(`   ${mois}: ${count} paiements`);
    });
  
  return { rows, stats };
}

async function loadExistingStudents() {
  console.log('ðŸ‘¥ Chargement des Ã©tudiants existants...');
  
  const etudiants = await Etudiant.find({}, {
    prenom: 1,
    nomDeFamille: 1,
    codeEtudiant: 1,
    filiere: 1,
    niveau: 1,
    typeFormation: 1,
    specialite: 1,
    specialiteLicencePro: 1,
    specialiteMasterPro: 1,
    email: 1
  }).lean();
  
  console.log(`âœ… ${etudiants.length} Ã©tudiants chargÃ©s`);
  
  // Analyse de la correspondance potentielle
  const etudiantsAvecCode = etudiants.filter(e => e.codeEtudiant).length;
  console.log(`   ðŸ“Š Ã‰tudiants avec codeEtudiant: ${etudiantsAvecCode}/${etudiants.length}`);
  
  return etudiants;
}

async function processPayments(rows, etudiants) {
  console.log('\nâš™ï¸  Traitement des paiements...');
  
  let processedCount = 0;
  let linkedCount = 0;
  let errorCount = 0;
  const errors = [];
  
  const docs = [];
  
  for (const [index, row] of rows.entries()) {
    try {
      const paiementDoc = await mapPaiementToSchema(row, etudiants);
      docs.push(paiementDoc);
      linkedCount++;
      
      if ((index + 1) % 100 === 0) {
        console.log(`   âœ… ${index + 1}/${rows.length} paiements traitÃ©s...`);
      }
      
    } catch (error) {
      errorCount++;
      errors.push({
        ligne: index + 1,
        registrarId: row.RegistrarId,
        montant: row.PricePayed,
        erreur: error.message
      });
      
      if (error.message.includes('Ã‰tudiant non trouvÃ©')) {
        // Continue avec les autres paiements
        continue;
      } else {
        console.warn(`âš ï¸  Ligne ${index + 1}: ${error.message}`);
      }
    }
    
    processedCount++;
  }
  
  console.log(`\nðŸ“Š RÃ©sultats du traitement:`);
  console.log(`   âœ… Paiements traitÃ©s: ${processedCount}/${rows.length}`);
  console.log(`   ðŸ”— Paiements liÃ©s aux Ã©tudiants: ${linkedCount}`);
  console.log(`   âŒ Erreurs: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log(`\nâš ï¸  Erreurs dÃ©taillÃ©es (${Math.min(10, errors.length)} premiÃ¨res):`);
    errors.slice(0, 10).forEach(err => {
      console.log(`   Ligne ${err.ligne}: RegistrarId=${err.registrarId}, Montant=${err.montant} â†’ ${err.erreur}`);
    });
    
    if (errors.length > 10) {
      console.log(`   ... et ${errors.length - 10} autres erreurs`);
    }
    
    // Analyse des erreurs
    const etudiantsNonTrouves = errors.filter(e => e.erreur.includes('Ã‰tudiant non trouvÃ©')).length;
    console.log(`\nðŸ“Š Types d'erreurs:`);
    console.log(`   ðŸ‘¤ Ã‰tudiants non trouvÃ©s: ${etudiantsNonTrouves}`);
    console.log(`   ðŸ’¾ Autres erreurs: ${errors.length - etudiantsNonTrouves}`);
  }
  
  return { docs, linkedCount, errors };
}

async function importToDatabase(docs) {
  console.log('\nðŸ’¾ Import des paiements en base...');
  
  if (docs.length === 0) {
    console.log('âŒ Aucun paiement Ã  insÃ©rer');
    return;
  }
  
  try {
    // VÃ©rifier les doublons existants
    const existingPayments = await Paiement.find({
      idPaiementOriginal: { $in: docs.map(d => d.idPaiementOriginal).filter(Boolean) }
    });
    
    if (existingPayments.length > 0) {
      console.log(`âš ï¸  ${existingPayments.length} paiements dÃ©jÃ  existants dÃ©tectÃ©s`);
    }
    
    const result = await Paiement.insertMany(docs, { 
      ordered: false,
      writeConcern: { w: 1 }
    });
    
    console.log(`ðŸŽ‰ SUCCÃˆS ! ${result.length} paiements importÃ©s !`);
    
    // Mettre Ã  jour le statut de paiement des Ã©tudiants
    await updateStudentPaymentStatus(docs);
    
  } catch (error) {
    if (error.writeErrors && error.writeErrors.length > 0) {
      const inserted = error.result.insertedCount || 0;
      const duplicates = error.writeErrors.filter(e => 
        e.errmsg && e.errmsg.includes('duplicate key')
      ).length;
      
      console.log(`âœ… ${inserted} paiements importÃ©s`);
      console.log(`ðŸ”„ ${duplicates} doublons ignorÃ©s`);
      
      // Mettre Ã  jour le statut mÃªme en cas d'erreurs partielles
      if (inserted > 0) {
        await updateStudentPaymentStatus(docs);
      }
      
    } else {
      console.error('âŒ Erreur d\'import:', error.message);
      throw error;
    }
  }
}

async function updateStudentPaymentStatus(paiementDocs) {
  console.log('ðŸ”„ Mise Ã  jour du statut de paiement des Ã©tudiants...');
  
  const etudiantsPayes = [...new Set(paiementDocs.map(p => p.etudiant.toString()))];
  
  const updateResult = await Etudiant.updateMany(
    { _id: { $in: etudiantsPayes } },
    { paye: true }
  );
  
  console.log(`âœ… ${updateResult.modifiedCount} Ã©tudiants marquÃ©s comme payÃ©s`);
}

async function generatePaymentReport() {
  console.log('\nðŸ“‹ RAPPORT DES PAIEMENTS IMPORTÃ‰S');
  console.log('='.repeat(50));
  
  const totalPaiements = await Paiement.countDocuments();
  const sommeTotale = await Paiement.aggregate([
    { $group: { _id: null, total: { $sum: '$montant' } } }
  ]);
  
  const paiementsParFormation = await Paiement.aggregate([
    {
      $lookup: {
        from: 'etudiants',
        localField: 'etudiant',
        foreignField: '_id',
        as: 'etudiantInfo'
      }
    },
    { $unwind: '$etudiantInfo' },
    {
      $group: {
        _id: '$etudiantInfo.typeFormation',
        count: { $sum: 1 },
        totalMontant: { $sum: '$montant' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  console.log(`ðŸ’° Total paiements: ${totalPaiements}`);
  console.log(`ðŸ’µ Somme totale: ${sommeTotale[0]?.total?.toLocaleString() || 0} MAD`);
  
  console.log('\nðŸ“Š RÃ©partition par formation:');
  paiementsParFormation.forEach(formation => {
    console.log(`   ${formation._id || 'Non dÃ©finie'}: ${formation.count} paiements (${formation.totalMontant.toLocaleString()} MAD)`);
  });
  
  // Ã‰tudiants payÃ©s vs non payÃ©s
  const etudiantsPayes = await Etudiant.countDocuments({ paye: true });
  const etudiantsTotal = await Etudiant.countDocuments();
  
  console.log(`\nðŸ‘¥ Statut des Ã©tudiants:`);
  console.log(`   âœ… PayÃ©s: ${etudiantsPayes}/${etudiantsTotal}`);
  console.log(`   â³ Non payÃ©s: ${etudiantsTotal - etudiantsPayes}/${etudiantsTotal}`);
  
  return {
    totalPaiements,
    sommeTotale: sommeTotale[0]?.total || 0,
    paiementsParFormation,
    etudiantsPayes,
    etudiantsTotal
  };
}

// ========= Main =========
async function main() {
  console.log('ðŸ’³ IMPORT INTELLIGENT DES PAIEMENTS\n');
  
  const mongoUri = process.argv[2] || 'mongodb://localhost:27017/supemir_db';
  const csvPath = process.argv[3] || path.join(os.homedir(), 'Downloads', 'paiment2024.2025.csv');
  
  try {
    // VÃ©rifications
    if (!fs.existsSync(csvPath)) {
      throw new Error(`âŒ Fichier CSV non trouvÃ©: ${csvPath}`);
    }
    
    console.log('ðŸ”Œ Connexion Ã  MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('âœ… ConnectÃ© Ã  MongoDB');
    
    // VÃ©rifier que les Ã©tudiants existent
    const countEtudiants = await Etudiant.countDocuments();
    if (countEtudiants === 0) {
      throw new Error('âŒ Aucun Ã©tudiant trouvÃ© en base. Importez d\'abord les Ã©tudiants.');
    }
    console.log(`âœ… ${countEtudiants} Ã©tudiants trouvÃ©s en base`);
    
    // Traitement
    const { rows } = await analyzePaymentStructure(csvPath);
    const etudiants = await loadExistingStudents();
    const { docs, linkedCount } = await processPayments(rows, etudiants);
    
    if (docs.length > 0) {
      await importToDatabase(docs);
      await generatePaymentReport();
    } else {
      console.log('âŒ Aucun paiement n\'a pu Ãªtre liÃ© aux Ã©tudiants');
    }
    
    console.log('\nðŸŽ‰ Import des paiements terminÃ© !');
    
  } catch (error) {
    console.error('\nâŒ Erreur fatale:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('ðŸ”Œ DÃ©connectÃ© de MongoDB');
  }
}

// ========= CSV Reader =========
function readCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(csvPath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
        delimiter: ','
      }))
      .on('data', rec => rows.push(rec))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

// ExÃ©cution
if (require.main === module) {
  main().catch(error => {
    console.error('ðŸ’¥ Erreur non gÃ©rÃ©e:', error);
    process.exit(1);
  });
}

module.exports = {
  determinerCours,
  calculerPeriodePaiement,
  trouverEtudiant,
  mapPaiementToSchema
};


