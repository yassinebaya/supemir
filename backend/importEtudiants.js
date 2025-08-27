/**
 * Import CSV Étudiants - Adapté pour Dashboard Formations
 * ======================================================
 * Script d'import spécialement conçu pour votre fichier CSV
 * avec adaptation directe pour les filtres FT/TA/Executive
 * 
 * PRÉREQUIS:
 *   npm i mongoose csv-parse
 *
 * UTILISATION:
 *   node import-csv-adapte.js "mongodb://localhost:27017/supemir_db" "Etudient2024.2025.csv"
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const { parse } = require('csv-parse');

// ====== Utiliser votre modèle existant ======
let Etudiant;
try {
  Etudiant = require('./models/Etudiant');
} catch (e) {
  console.log('⚠️  Modèle Etudiant non trouvé, utilisation du schéma intégré');
  
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
    pays: String,
    cours: { type: [String], default: [] },
    niveau: Number,
    niveauFormation: String,
    filiere: String,
    anneeScolaire: {
      type: String,
      required: true,
      validate: {
        validator: v => /^\d{4}\/\d{4}$/.test(v),
        message: "L'année scolaire doit être au format YYYY/YYYY"
      }
    },
    cycle: {
      type: String,
      enum: ['Classes Préparatoires Intégrées', 'Cycle Ingénieur'],
      default: undefined
    },
    specialiteIngenieur: {
      type: String,
      enum: ['Génie Informatique', 'Génie Mécatronique', 'Génie Civil']
    },
    optionIngenieur: {
      type: String,
      enum: [
        'Sécurité & Mobilité Informatique', 'IA & Science des Données',
        'Réseaux & Cloud Computing', 'Génie Mécanique', 'Génie Industriel',
        'Automatisation', 'Structures & Ouvrages d\'art',
        'Bâtiment & Efficacité Énergétique', 'Géotechnique & Infrastructures'
      ]
    },
    typeFormation: {
      type: String,
      enum: ['CYCLE_INGENIEUR', 'LICENCE_PRO', 'MASTER_PRO', 'MASI', 'IRM']
    },
    specialiteLicencePro: {
      type: String,
      enum: [
        'Marketing digital e-business Casablanca', 'Tests Logiciels avec Tests Automatisés',
        'Gestion de la Qualité', 'Développement Informatique Full Stack',
        'Administration des Systèmes, Bases de Données, Cybersécurité et Cloud Computing',
        'Réseaux et Cybersécurité', 'Finance, Audit & Entrepreneuriat',
        'Développement Commercial et Marketing Digital',
        'Management et Conduite de Travaux – Cnam', 'Electrotechnique et systèmes – Cnam',
        'Informatique – Cnam'
      ]
    },
    optionLicencePro: {
      type: String,
      enum: [
        'Développement Mobile', 'Intelligence Artificielle et Data Analytics',
        'Développement JAVA JEE', 'Développement Gaming et VR',
        'Administration des Systèmes et Cloud Computing'
      ]
    },
    specialiteMasterPro: {
      type: String,
      enum: [
        'Informatique, Data Sciences, Cloud, Cybersécurité & Intelligence Artificielle (DU IDCIA)',
        'QHSSE & Performance Durable', 'Achat, Logistique et Supply Chain Management',
        'Management des Systèmes d\'Information', 'Big Data et Intelligence Artificielle',
        'Cybersécurité et Transformation Digitale', 'Génie Informatique et Innovation Technologique',
        'Finance, Audit & Entrepreneuriat', 'Développement Commercial et Marketing Digital'
      ]
    },
    optionMasterPro: {
      type: String,
      enum: [
        'Systèmes de communication et Data center', 'Management des Systèmes d\'Information',
        'Génie Logiciel', 'Intelligence Artificielle et Data Science'
      ]
    },
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
    nouvelleInscription: { type: Boolean, default: true },
    paye: { type: Boolean, default: false },
    handicape: { type: Boolean, default: false },
    resident: { type: Boolean, default: false },
    fonctionnaire: { type: Boolean, default: false },
    mobilite: { type: Boolean, default: false },
    codeEtudiant: String,
    dateEtReglement: String,
    image: { type: String, default: '' },
    commercial: { type: mongoose.Schema.Types.ObjectId, ref: 'Commercial', default: null },
    actif: { type: Boolean, default: true },
    lastSeen: { type: Date, default: null },
    dateInscription: { type: Date, default: Date.now },
    creeParAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
  }, { timestamps: true });

  Etudiant = mongoose.model('Etudiant', etudiantSchema);
}

// ========= MAPPING EXACT DE VOTRE CSV =========
const CSV_COLUMNS = {
  Id: 0,
  FirstName: 1,
  LastName: 2,
  Gender: 3,
  CINorPassPort: 4,
  Birthday: 5,
  PlaceOfBirth: 6,
  Country: 7,
  Formation: 8,
  Niveau: 9,
  SalsemanId: 10,
  AnneeDuBaccalaureat: 11,
  CNE: 12,
  DiplomeDacces: 13,
  DocumentFournis: 14,
  Email: 15,
  EtudiantEnmobilite: 16,
  Filier: 17,
  Fonctionnaire: 18,
  Gsm: 19,
  Handicape: 20,
  LieuDoptentionduDiplome: 21,
  NiveauFormation: 22,
  Option: 23,
  PassPort: 24,
  PourcentageDeLaBourseAccode: 25,
  PremierAnneeDInscription: 26,
  Resident: 27,
  SerieDuBaccalaureat: 28,
  SituationDeEtudiant: 29,
  SpecialiteDuDiplomeDaccese: 30,
  Diplôme: 31,
  Sourcedinscription: 32,
  PriceTotal: 33,
  TypePayment: 34,
  IsNew: 35,
  Ecole: 36,
  Specialiter: 37,
  DateOfInscription: 38,
  MontionDuBaccalaureat: 39,
  CopyCNI: 40,
  CopyNote: 41,
  FileRegistered: 42,
  OriginalBac: 43,
  Photo: 44,
  EngagmentPayment: 45,
  Ispayed: 46,
  DTSBac: 47,
  DiplomeLicence: 48,
  PassPortPaypar: 49,
  DeletionDate: 50,
  IsMarkedForDeletion: 51,
  PersoneSourceDinscription: 52,
  Address: 53,
  City: 54
};

// ========= FONCTIONS UTILITAIRES =========
const NULLIFY = v => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s || /^(NULL|null|N[ée]ant|Néant|-)$/i.test(s) || s === '0001-01-01 00:00:00.0000000') return null;
  return s;
};

const toGenre = g => {
  const genre = (g || '').toString().trim().toUpperCase();
  if (genre === 'M' || genre === 'MALE' || genre === 'HOMME') return 'Homme';
  if (genre === 'F' || genre === 'FEMALE' || genre === 'FEMME') return 'Femme';
  return null;
};

const cleanPhone = p => {
  if (!p) return null;
  const cleaned = p.toString().replace(/[^\d+]/g, '');
  return cleaned || null;
};

const toNumber = v => {
  if (!v) return null;
  const s = v.toString().trim();
  if (!s || s === '0') return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const toBoolean = v => {
  if (v === null || v === undefined) return false;
  const s = v.toString().trim();
  return s === '1' || /^(true|vrai|oui|yes)$/i.test(s);
};

const toDate = v => {
  if (!v) return null;
  const s = NULLIFY(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const genFakeEmail = (prenom, nom, index) => {
  const cleanName = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const cleanPrenom = cleanName(prenom || 'etudiant');
  const cleanNom = cleanName(nom || 'inconnu');
  return `${cleanPrenom}.${cleanNom}.${Date.now()}${index}@supemir.ma`;
};

// ========= DÉTECTION INTELLIGENTE DES FORMATIONS =========


  
  return null;
};

/**
 * Détermine FT/TA/Executive basé sur les données CSV
 */
const determinerModeFormation = (niveauFormation, filiere, sourceInscription, typePayment) => {
  const texte = `${niveauFormation || ''} ${filiere || ''} ${sourceInscription || ''} ${typePayment || ''}`.toLowerCase();
  
  // Détection TA (Temps Alterné)
  if (/\bta\b|alternan|alterné|apprenti|entreprise|stage/i.test(texte)) {
    return 'TA';
  }
  
  // Détection Executive
  if (/executive|exec|soir|weekend|professionnel|exp[eé]riment[eé]|cadre/i.test(texte)) {
    return 'Executive';
  }
  
  // Par défaut: FT
  return 'FT';
};

/**
 * Mappe les spécialités vers les champs appropriés
 */
const mapperSpecialites = (specialite, filiere, typeFormation) => {
  if (!specialite && !filiere) return {};
  
  const texte = `${specialite || ''} ${filiere || ''}`.toLowerCase();
  const updates = {};
  
  // Mapping Licence Pro
  if (typeFormation === 'LICENCE_PRO') {
    const mappingLicence = {
      'Développement Informatique Full Stack': /d[eé]v.*info|full.*stack|informatique.*d[eé]v/i,
      'Réseaux et Cybersécurité': /r[eé]seau|cyber|s[eé]curit[eé]/i,
      'Marketing digital e-business Casablanca': /marketing.*digital|e-business/i,
      'Gestion de la Qualité': /qualit[eé]|gestion.*qualit[eé]/i,
      'Finance, Audit & Entrepreneuriat': /finance|audit|entrepreneur/i,
      'Tests Logiciels avec Tests Automatisés': /test.*logiciel/i,
      'Administration des Systèmes, Bases de Données, Cybersécurité et Cloud Computing': /admin.*syst|base.*donn|cloud/i
    };
    
    for (const [spec, pattern] of Object.entries(mappingLicence)) {
      if (pattern.test(texte)) {
        updates.specialiteLicencePro = spec;
        break;
      }
    }
  }
  
  // Mapping Master Pro
  else if (typeFormation === 'MASTER_PRO') {
    const mappingMaster = {
      'Big Data et Intelligence Artificielle': /big.*data|intelligence.*artificielle|ia\b/i,
      'Cybersécurité et Transformation Digitale': /cyber.*digital|transformation.*digitale/i,
      'Génie Informatique et Innovation Technologique': /g[eé]nie.*info|innovation/i,
      'Management des Systèmes d\'Information': /management.*info|msi/i,
      'Finance, Audit & Entrepreneuriat': /finance|audit|entrepreneur/i
    };
    
    for (const [spec, pattern] of Object.entries(mappingMaster)) {
      if (pattern.test(texte)) {
        updates.specialiteMasterPro = spec;
        break;
      }
    }
  }
  
  // Mapping Ingénieur
  else if (typeFormation === 'CYCLE_INGENIEUR') {
    const mappingIngenieur = {
      'Génie Informatique': /informatique|info/i,
      'Génie Mécatronique': /m[eé]catronique|m[eé]canique/i,
      'Génie Civil': /civil/i
    };
    
    for (const [spec, pattern] of Object.entries(mappingIngenieur)) {
      if (pattern.test(texte)) {
        updates.specialiteIngenieur = spec;
        break;
      }
    }
  }
  
  return updates;
};

// ========= FONCTION PRINCIPALE D'IMPORT =========
async function main() {
  const mongoUri = process.argv[2] || 'mongodb://localhost:27017/supemir_db';
  const csvPath = process.argv[3] || path.join(process.cwd(), 'Etudient2024.2025.csv');

  console.log('🚀 Import CSV Étudiants avec adaptation Dashboard');
  console.log(`📁 Fichier CSV: ${csvPath}`);
  console.log(`🗄️  Base de données: ${mongoUri}`);

  try {
    // Connexion DB
    await mongoose.connect(mongoUri);
    console.log('✅ Connexion réussie');

    // Lecture CSV
    const rows = await readCSV(csvPath);
    console.log(`📊 ${rows.length} lignes lues`);

    // Traitement des données
    const docs = [];
    const erreurs = [];
    const statistiques = {
      total: 0,
      FT: 0,
      TA: 0,
      Executive: 0,
      LICENCE_PRO: 0,
      MASTER_PRO: 0,
      CYCLE_INGENIEUR: 0,
      MASI: 0,
      IRM: 0,
      Autres: 0
    };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!Array.isArray(row) || row.length < 20) continue;

        const get = (colName) => row[CSV_COLUMNS[colName]];

        // Extraction des données de base
        const prenom = NULLIFY(get('FirstName')) || 'Inconnu';
        const nomDeFamille = NULLIFY(get('LastName')) || 'Inconnu';
        const genre = toGenre(get('Gender'));
        const rawEmail = NULLIFY(get('Email'));
        const telephone = cleanPhone(get('Gsm'));
        const cin = NULLIFY(get('CINorPassPort'));
        const passeport = NULLIFY(get('PassPort'));
        const pays = NULLIFY(get('Country'));
        const niveau = toNumber(get('Niveau'));
        const filiere = NULLIFY(get('Filier'));
        const niveauFormationRaw = NULLIFY(get('NiveauFormation'));
        const specialite = NULLIFY(get('Specialiter'));
        const diplome = NULLIFY(get('Diplôme'));
        const sourceInscription = NULLIFY(get('Sourcedinscription'));
        const typePaiement = NULLIFY(get('TypePayment'));
        const prixTotal = toNumber(get('PriceTotal'));
        const dateNaissance = toDate(get('Birthday'));
        const lieuNaissance = NULLIFY(get('PlaceOfBirth'));

        // Booléens
        const nouvelleInscription = toBoolean(get('IsNew'));
        const paye = toBoolean(get('Ispayed'));
        const handicape = toBoolean(get('Handicape'));
        const resident = toBoolean(get('Resident'));
        const fonctionnaire = toBoolean(get('Fonctionnaire'));
        const mobilite = toBoolean(get('EtudiantEnmobilite'));

        // Détermination du type de formation (CYCLE_INGENIEUR, LICENCE_PRO, etc.)
        const typeFormation = determinerTypeFormation(filiere, niveauFormationRaw, diplome, specialite);
        
        // Détermination du niveau de formation (FT, TA, Executive)
        const niveauFormation = determinerNiveauFormation(niveauFormationRaw, filiere, sourceInscription, typePaiement);

        // Email
        const email = rawEmail || genFakeEmail(prenom, nomDeFamille, i);

        // Mapping des spécialités
        const specialitesMapping = mapperSpecialites(specialite, filiere, typeFormation);

        // Construction du document
        const etudiantDoc = {
          prenom,
          nomDeFamille,
          genre,
          email,
          motDePasse: 'super123',
          telephone,
          cin,
          passeport,
          dateNaissance,
          lieuNaissance,
          pays,
          cours: [],
          niveau,
          niveauFormation,
          filiere,
          anneeScolaire: '2024/2025',
          cycle: null,
          typeFormation,
          
          // Spécialités mappées
          ...specialitesMapping,
          
          // Champs génériques
          option: NULLIFY(get('Option')),
          specialite,
          typeDiplome: null,
          diplomeAcces: NULLIFY(get('DiplomeDacces')),
          specialiteDiplomeAcces: NULLIFY(get('SpecialiteDuDiplomeDaccese')),
          mention: NULLIFY(get('MontionDuBaccalaureat')),
          lieuObtentionDiplome: NULLIFY(get('LieuDoptentionduDiplome')),
          serieBaccalaureat: NULLIFY(get('SerieDuBaccalaureat')),
          anneeBaccalaureat: toNumber(get('AnneeDuBaccalaureat')),
          premiereAnneeInscription: toNumber(get('PremierAnneeDInscription')),
          sourceInscription,
          typePaiement,
          prixTotal,
          pourcentageBourse: toNumber(get('PourcentageDeLaBourseAccode')),
          situation: NULLIFY(get('SituationDeEtudiant')),
          
          // Statuts
          nouvelleInscription,
          paye,
          handicape,
          resident,
          fonctionnaire,
          mobilite,
          
          // Autres
          codeEtudiant: NULLIFY(get('Id')),
          dateEtReglement: null,
          image: '',
          commercial: null,
          actif: !toBoolean(get('IsMarkedForDeletion')),
          lastSeen: null,
          dateInscription: toDate(get('DateOfInscription')) || new Date(),
          creeParAdmin: null
        };

        docs.push(etudiantDoc);
        
        // Statistiques
        statistiques.total++;
        statistiques[niveauFormation]++; // FT, TA, Executive
        if (typeFormation) {
          statistiques[typeFormation]++;
        } else {
          statistiques.Autres++;
        }

      } catch (error) {
        erreurs.push({ ligne: i + 1, erreur: error.message });
      }
    }

    // Filtrage et validation
    const ready = docs.filter(d => d.prenom && d.nomDeFamille && d.genre);
    console.log(`✅ ${ready.length} documents valides préparés`);

    // Affichage des statistiques avant insertion
    console.log('\n📊 Répartition par mode de formation:');
    console.log(`   • FT (Full Time): ${statistiques.FT}`);
    console.log(`   • TA (Temps Alterné): ${statistiques.TA}`);
    console.log(`   • Executive: ${statistiques.Executive}`);

    console.log('\n📊 Répartition par type de formation:');
    console.log(`   • LICENCE_PRO: ${statistiques.LICENCE_PRO}`);
    console.log(`   • MASTER_PRO: ${statistiques.MASTER_PRO}`);
    console.log(`   • CYCLE_INGENIEUR: ${statistiques.CYCLE_INGENIEUR}`);
    console.log(`   • MASI: ${statistiques.MASI}`);
    console.log(`   • IRM: ${statistiques.IRM}`);
    console.log(`   • Autres: ${statistiques.Autres}`);

    // Insertion en base
    try {
      const result = await Etudiant.insertMany(ready, { ordered: false });
      console.log(`\n🎉 ${result.length} étudiants importés avec succès !`);
    } catch (err) {
      if (err.writeErrors) {
        const inserted = ready.length - err.writeErrors.length;
        const duplicates = err.writeErrors.filter(e => 
          (e.errmsg || '').includes('duplicate key')
        ).length;
        
        console.log(`\n📝 ${inserted} étudiants importés`);
        console.log(`🔄 ${duplicates} doublons ignorés`);
        console.log(`❌ ${err.writeErrors.length - duplicates} autres erreurs`);
      } else {
        throw err;
      }
    }

    if (erreurs.length > 0) {
      console.log(`\n⚠️  ${erreurs.length} erreurs de parsing détectées`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Import terminé');
  }
}

// ========= LECTEUR CSV =========
function readCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(csvPath)
      .pipe(parse({
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
        bom: true
      }))
      .on('data', rec => rows.push(rec))
      .on('end', () => resolve(rows.slice(1))) // Skip header
      .on('error', reject);
  });
}

main().catch(console.error);