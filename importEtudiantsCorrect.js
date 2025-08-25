/**
 * SCRIPT D'ANALYSE DES ERREURS ET RÃ‰CUPÃ‰RATION
 * ==========================================
 * Analyse les 12 Ã©tudiants manquants et les rÃ©cupÃ¨re
 */

const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

// Configuration
const CONFIG = {
  mongoUri: 'mongodb://localhost:27017/supemir_db',
  csvFile: 'Etudient2024.2025 1.csv'
};

// SchÃ©ma simplifiÃ© pour la rÃ©cupÃ©ration
const etudiantSchema = new mongoose.Schema({
  prenom: { type: String, required: true },
  nomDeFamille: { type: String, required: true },
  genre: { type: String, enum: ['Homme', 'Femme'], required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  telephone: String,
  cin: String,
  passeport: String,
  dateNaissance: Date,
  lieuNaissance: String,
  pays: { type: String, default: 'MAROC' },
  cours: { type: [String], default: [] },
  niveau: Number,
  niveauFormation: { 
    type: String, 
    enum: ['FI', 'TA', 'Executive'],
    required: true
  },
  filiere: String,
  anneeScolaire: { type: String, required: true },
  typeFormation: String,
  option: String,
  specialite: String,
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
  // Champs supplÃ©mentaires
  adresse: String,
  ville: String,
  cne: String
}, { timestamps: true });

etudiantSchema.statics.getAnneeScolaireActuelle = function() {
  return '2024/2025';
};

const Etudiant = mongoose.model('Etudiant', etudiantSchema);

// Fonctions utilitaires
const cleanValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  if (!str || /^(NULL|null|N[Ã©e]ant|NÃ©ant|-)$/i.test(str)) return null;
  return str;
};

const toGenre = (genre) => {
  if (!genre) return 'Homme';
  const g = genre.toString().trim().toUpperCase();
  if (g === 'M' || g === 'MALE' || g === 'HOMME' || g === 'H') return 'Homme';
  if (g === 'F' || g === 'FEMALE' || g === 'FEMME') return 'Femme';
  return 'Homme';
};

const cleanPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.toString().replace(/[^\d+]/g, '');
  return cleaned || null;
};

const toNumber = (value) => {
  if (!value || value === '0') return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const toBoolean = (value) => {
  if (value === null || value === undefined || value === '') return false;
  const str = value.toString().trim();
  return str === '1' || /^(true|vrai|oui|yes)$/i.test(str);
};

const toDate = (value) => {
  if (!value) return null;
  const cleaned = cleanValue(value);
  if (!cleaned) return null;
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date;
};

const generateEmail = (prenom, nom, index) => {
  const cleanName = (str) => str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  
  const cleanPrenom = cleanName(prenom || 'etudiant');
  const cleanNom = cleanName(nom || 'inconnu');
  const timestamp = Date.now();
  return `${cleanPrenom}.${cleanNom}.${timestamp}.${index}@supemir.ma`;
};

const mapperNiveauFormation = (diplome) => {
  if (!diplome) return 'FI';
  
  const diplomeStr = diplome.toString().trim();
  const mappings = {
    'FI': 'FI',
    'fi': 'FI',
    'TA': 'TA', 
    'ta': 'TA',
    'ExÃ©cutive': 'Executive',
    'exÃ©cutive': 'Executive',
    'Executive': 'Executive',
    'executive': 'Executive'
  };

  return mappings[diplomeStr] || 'FI';
};

// Lire le CSV
const lireCSV = (cheminFichier) => {
  return new Promise((resolve, reject) => {
    const resultats = [];
    
    fs.createReadStream(cheminFichier)
      .pipe(csv())
      .on('data', (row) => {
        resultats.push(row);
      })
      .on('end', () => {
        resolve(resultats);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Fonction principale d'analyse
const analyserErreurs = async () => {
  try {
    console.log('ðŸ” ANALYSE DES ERREURS ET RÃ‰CUPÃ‰RATION');
    console.log('=====================================');
    
    // Connexion MongoDB
    await mongoose.connect(CONFIG.mongoUri);
    console.log('âœ… Connexion MongoDB rÃ©ussie');
    
    // VÃ©rifier l'Ã©tat actuel
    const totalActuel = await Etudiant.countDocuments();
    console.log(`ðŸ“Š Ã‰tudiants actuellement en base: ${totalActuel}`);
    
    const repartitionActuelle = await Etudiant.aggregate([
      { $group: { _id: "$niveauFormation", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('ðŸ“‹ RÃ©partition actuelle:');
    repartitionActuelle.forEach(item => {
      console.log(`   â€¢ ${item._id}: ${item.count}`);
    });
    
    // Lire le CSV pour identifier les manquants
    console.log('\nðŸ“„ Lecture du CSV...');
    const rows = await lireCSV(CONFIG.csvFile);
    console.log(`ðŸ“Š ${rows.length} lignes dans le CSV`);
    
    // RÃ©cupÃ©rer les emails des Ã©tudiants existants
    const etudiantsExistants = await Etudiant.find({}, { email: 1, prenom: 1, nomDeFamille: 1 });
    const emailsExistants = new Set(etudiantsExistants.map(e => e.email));
    
    console.log('\nðŸ” Identification des Ã©tudiants manquants...');
    
    const etudiantsManquants = [];
    const erreursDetaillees = [];
    
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const prenom = cleanValue(row.FirstName) || 'Inconnu';
        const nomDeFamille = cleanValue(row.LastName) || 'Inconnu';
        const emailRaw = cleanValue(row.Email);
        const email = emailRaw || generateEmail(prenom, nomDeFamille, i);
        
        // VÃ©rifier si cet Ã©tudiant est manquant
        if (!emailsExistants.has(email)) {
          console.log(`âŒ MANQUANT: Ligne ${i + 1} - ${prenom} ${nomDeFamille} (${email})`);
          
          // Essayer de crÃ©er le document pour voir l'erreur
          try {
            const genre = toGenre(row.Gender);
            const diplome = cleanValue(row['DiplÃ´me']);
            const niveauFormation = mapperNiveauFormation(diplome);
            
            const etudiantDoc = {
              prenom: prenom || 'Inconnu',
              nomDeFamille: nomDeFamille || 'Inconnu', 
              genre: genre || 'Homme',
              email: email,
              motDePasse: await bcrypt.hash('Supemir2024!', 10),
              telephone: cleanPhone(row.Gsm),
              cin: cleanValue(row.CINorPassPort),
              passeport: cleanValue(row.PassPort),
              dateNaissance: toDate(row.Birthday),
              lieuNaissance: cleanValue(row.PlaceOfBirth),
              pays: cleanValue(row.Country) || 'MAROC',
              adresse: cleanValue(row.Address),
              ville: cleanValue(row.City),
              cne: cleanValue(row.CNE),
              cours: [],
              niveau: toNumber(row.Niveau),
              niveauFormation: niveauFormation,
              filiere: cleanValue(row.Filier),
              anneeScolaire: Etudiant.getAnneeScolaireActuelle(),
              specialite: cleanValue(row.Specialiter),
              option: cleanValue(row.Option),
              diplomeAcces: cleanValue(row.DiplomeDacces),
              specialiteDiplomeAcces: cleanValue(row.SpecialiteDuDiplomeDaccese),
              mention: cleanValue(row.MontionDuBaccalaureat),
              lieuObtentionDiplome: cleanValue(row.LieuDoptentionduDiplome),
              serieBaccalaureat: cleanValue(row.SerieDuBaccalaureat),
              anneeBaccalaureat: toNumber(row.AnneeDuBaccalaureat),
              premiereAnneeInscription: toNumber(row.PremierAnneeDInscription),
              sourceInscription: cleanValue(row.Sourcedinscription),
              typePaiement: cleanValue(row.TypePayment),
              prixTotal: toNumber(row.PriceTotal),
              pourcentageBourse: toNumber(row.PourcentageDeLaBourseAccode),
              situation: cleanValue(row.SituationDeEtudiant),
              nouvelleInscription: toBoolean(row.IsNew),
              paye: toBoolean(row.Ispayed),
              handicape: toBoolean(row.Handicape),
              resident: toBoolean(row.Resident),
              fonctionnaire: toBoolean(row.Fonctionnaire),
              mobilite: toBoolean(row.EtudiantEnmobilite),
              codeEtudiant: cleanValue(row.Id),
              actif: !toBoolean(row.IsMarkedForDeletion),
              dateInscription: toDate(row.DateOfInscription) || new Date(),
              commercial: null,
              creeParAdmin: null
            };
            
            // Validation supplÃ©mentaire
            if (!etudiantDoc.prenom || etudiantDoc.prenom === 'Inconnu') {
              throw new Error('PrÃ©nom manquant ou invalide');
            }
            if (!etudiantDoc.nomDeFamille || etudiantDoc.nomDeFamille === 'Inconnu') {
              throw new Error('Nom de famille manquant ou invalide');
            }
            if (!['Homme', 'Femme'].includes(etudiantDoc.genre)) {
              throw new Error(`Genre invalide: "${etudiantDoc.genre}"`);
            }
            if (!['FI', 'TA', 'Executive'].includes(etudiantDoc.niveauFormation)) {
              throw new Error(`Niveau formation invalide: "${etudiantDoc.niveauFormation}"`);
            }
            if (!etudiantDoc.email || !etudiantDoc.email.includes('@')) {
              throw new Error(`Email invalide: "${etudiantDoc.email}"`);
            }
            
            etudiantsManquants.push(etudiantDoc);
            
          } catch (validationError) {
            erreursDetaillees.push({
              ligne: i + 1,
              prenom,
              nomDeFamille,
              email,
              erreur: validationError.message,
              donneesOriginales: row
            });
            console.log(`   ðŸ” Erreur validation: ${validationError.message}`);
          }
        }
      } catch (error) {
        console.log(`   âŒ Erreur traitement ligne ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`\nðŸ“Š RÃ‰SUMÃ‰:`);
    console.log(`   â€¢ Ã‰tudiants manquants identifiÃ©s: ${etudiantsManquants.length}`);
    console.log(`   â€¢ Erreurs de validation: ${erreursDetaillees.length}`);
    
    // Afficher les erreurs dÃ©taillÃ©es
    if (erreursDetaillees.length > 0) {
      console.log('\nðŸ” ERREURS DÃ‰TAILLÃ‰ES:');
      erreursDetaillees.forEach(erreur => {
        console.log(`\nLigne ${erreur.ligne}: ${erreur.prenom} ${erreur.nomDeFamille}`);
        console.log(`   Email: ${erreur.email}`);
        console.log(`   Erreur: ${erreur.erreur}`);
        console.log(`   DonnÃ©es originales: ${JSON.stringify(erreur.donneesOriginales, null, 2).substring(0, 300)}...`);
      });
    }
    
    // InsÃ©rer les Ã©tudiants rÃ©cupÃ©rables
    if (etudiantsManquants.length > 0) {
      console.log(`\nðŸ’¾ Insertion des ${etudiantsManquants.length} Ã©tudiants rÃ©cupÃ©rables...`);
      
      try {
        const result = await Etudiant.insertMany(etudiantsManquants, { ordered: false });
        console.log(`âœ… ${result.length} Ã©tudiants rÃ©cupÃ©rÃ©s avec succÃ¨s!`);
        
      } catch (err) {
        if (err.writeErrors) {
          const inserted = etudiantsManquants.length - err.writeErrors.length;
          console.log(`ðŸ“ ${inserted} Ã©tudiants rÃ©cupÃ©rÃ©s`);
          console.log(`âŒ ${err.writeErrors.length} erreurs persistantes`);
          
          err.writeErrors.forEach((error, index) => {
            console.log(`\nErreur ${index + 1}:`);
            console.log(`   Message: ${error.errmsg}`);
            console.log(`   Document: ${JSON.stringify(error.getOperation(), null, 2).substring(0, 200)}...`);
          });
        } else {
          console.error(`âŒ Erreur insertion: ${err.message}`);
        }
      }
    }
    
    // VÃ©rification finale
    const totalFinal = await Etudiant.countDocuments();
    console.log(`\nðŸ“Š Total final d'Ã©tudiants: ${totalFinal}`);
    
    const repartitionFinale = await Etudiant.aggregate([
      { $group: { _id: "$niveauFormation", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('ðŸ“‹ RÃ©partition finale:');
    repartitionFinale.forEach(item => {
      console.log(`   â€¢ ${item._id}: ${item.count}`);
    });
    
    if (totalFinal === 254) {
      console.log('\nðŸŽ‰ SUCCÃˆS! Tous les 254 Ã©tudiants sont maintenant en base!');
    } else {
      console.log(`\nâš ï¸  Il manque encore ${254 - totalFinal} Ã©tudiants`);
    }
    
  } catch (error) {
    console.error('âŒ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('ðŸ‘‹ Connexion fermÃ©e');
  }
};

// Lancement
if (require.main === module) {
  analyserErreurs().catch(console.error);
}

module.exports = { analyserErreurs };


