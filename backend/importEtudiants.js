const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const bcrypt = require('bcrypt');

// Importer votre modèle Etudiant
const Etudiant = require('./models/etudiantModel'); // Ajustez le chemin selon votre structure

/**
 * Script d'importation des étudiants depuis le fichier Excel
 * Usage: node importEtudiants.js
 */

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/votre_db';

// Mapping des filières Excel vers les types de formation du modèle
const MAPPING_TYPE_FORMATION = {
  'IRM': 'IRM',
  'MASI': 'MASI',
  'CYCLE_INGENIEUR': 'CYCLE_INGENIEUR',
  'LICENCE_PRO': 'LICENCE_PRO',
  'MASTER_PRO': 'MASTER_PRO'
};

// Mapping des spécialités selon le contexte
const MAPPING_SPECIALITES = {
  // Pour IRM
  'Développement informatique': 'Développement informatique',
  'Réseaux et cybersécurité': 'Réseaux et cybersécurité',
  'Génie informatique et innovation technologique': 'Génie informatique et innovation technologique',
  'Cybersécurité et transformation digitale': 'Cybersécurité et transformation digitale',
  
  // Pour MASI
  'Entreprenariat, audit et finance': 'Entreprenariat, audit et finance',
  'Développement commercial et marketing digital': 'Développement commercial et marketing digital',
  'Management des affaires et systèmes d\'information': 'Management des affaires et systèmes d\'information'
};

/**
 * Fonction pour mapper les données Excel vers le modèle Mongoose
 */
function mapperDonneesEtudiant(donneesExcel) {
  const etudiantData = {
    // Champs de base (directement mappés)
    prenom: donneesExcel.prenom?.trim(),
    nomDeFamille: donneesExcel.nomDeFamille?.trim(),
    email: donneesExcel.email?.toLowerCase().trim(),
    motDePasse: donneesExcel.motDePasse, // Sera hashé plus tard
    telephone: donneesExcel.telephone?.trim(),
    
    // Année scolaire (directement depuis Excel ou calculée)
    anneeScolaire: donneesExcel.anneeScolaire || Etudiant.getAnneeScolaireActuelle(),
    
    // Type de formation basé sur la filière Excel
    typeFormation: MAPPING_TYPE_FORMATION[donneesExcel.filiere] || donneesExcel.filiere,
    
    // Niveau (sera auto-assigné par le middleware du modèle pour LICENCE_PRO et MASTER_PRO)
    niveau: donneesExcel.niveau,
    
    // Inscription
    nouvelleInscription: donneesExcel.nouvelleInscription !== false,
    
    // Champs par défaut
    genre: 'Homme', // À ajuster selon vos besoins
    pays: donneesExcel.nationalite || 'Maroc',
    actif: true,
    paye: false,
    handicape: false,
    resident: false,
    fonctionnaire: false,
    mobilite: false
  };

  // Mapper les spécialités selon le type de formation
  if (donneesExcel.specialite) {
    const typeFormation = etudiantData.typeFormation;
    
    if (typeFormation === 'LICENCE_PRO') {
      // Pour les licences pro, mapper vers specialiteLicencePro
      etudiantData.specialiteLicencePro = donneesExcel.specialite;
    } else if (typeFormation === 'MASTER_PRO') {
      // Pour les masters pro, mapper vers specialiteMasterPro
      etudiantData.specialiteMasterPro = donneesExcel.specialite;
    } else if (typeFormation === 'CYCLE_INGENIEUR') {
      // Pour le cycle ingénieur, mapper vers specialiteIngenieur
      etudiantData.specialiteIngenieur = donneesExcel.specialite;
    } else {
      // Pour IRM et MASI, utiliser le champ specialite classique
      etudiantData.specialite = MAPPING_SPECIALITES[donneesExcel.specialite] || donneesExcel.specialite;
    }
  }

  // Mapper les options si présentes
  if (donneesExcel.option) {
    const typeFormation = etudiantData.typeFormation;
    
    if (typeFormation === 'LICENCE_PRO') {
      etudiantData.optionLicencePro = donneesExcel.option;
    } else if (typeFormation === 'MASTER_PRO') {
      etudiantData.optionMasterPro = donneesExcel.option;
    } else if (typeFormation === 'CYCLE_INGENIEUR') {
      etudiantData.optionIngenieur = donneesExcel.option;
    } else {
      etudiantData.option = donneesExcel.option;
    }
  }

  // CORRECTION: Gestion améliorée du prix total
  if (donneesExcel.prixTotal !== null && donneesExcel.prixTotal !== undefined && donneesExcel.prixTotal !== '' && donneesExcel.prixTotal !== 0) {
    etudiantData.prixTotal = Number(donneesExcel.prixTotal);
  }
  // Si pas de prix dans Excel, on ne définit pas le champ (le modèle peut avoir une valeur par défaut)

  // AJOUT: Autres champs du fichier Excel si disponibles
  if (donneesExcel.niveauFormation) {
    etudiantData.niveauFormation = donneesExcel.niveauFormation;
  }

  if (donneesExcel.filiere) {
    etudiantData.filiere = donneesExcel.filiere;
  }

  return etudiantData;
}

/**
 * Fonction pour hasher le mot de passe
 */
async function hashMotDePasse(motDePasse) {
  if (!motDePasse) {
    // Génération d'un mot de passe par défaut plus sécurisé
    const motDePasseDefaut = 'Super2025!';
    const saltRounds = 10;
    return await bcrypt.hash(motDePasseDefaut, saltRounds);
  }
  
  try {
    const saltRounds = 10;
    return await bcrypt.hash(motDePasse, saltRounds);
  } catch (error) {
    console.error('Erreur lors du hashage du mot de passe:', error);
    // Fallback avec un mot de passe sécurisé
    return await bcrypt.hash('Super2025!', 10);
  }
}

/**
 * Fonction pour lire et parser le fichier Excel
 */
function lireFichierExcel(cheminFichier) {
  try {
    console.log('📖 Lecture du fichier Excel:', cheminFichier);
    
    const workbook = XLSX.readFile(cheminFichier);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON avec options pour bien gérer les types
    const donnees = XLSX.utils.sheet_to_json(worksheet, {
      defval: null, // Valeur par défaut pour les cellules vides
      blankrows: false // Ignorer les lignes vides
    });
    
    console.log(`✅ ${donnees.length} étudiants trouvés dans le fichier Excel`);
    return donnees;
    
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier Excel:', error);
    throw error;
  }
}

/**
 * Fonction pour valider les données avant insertion
 */
function validerDonnees(etudiantData) {
  const erreurs = [];
  
  if (!etudiantData.prenom) erreurs.push('Prénom manquant');
  if (!etudiantData.nomDeFamille) erreurs.push('Nom de famille manquant');
  if (!etudiantData.email) erreurs.push('Email manquant');
  if (!etudiantData.typeFormation) erreurs.push('Type de formation manquant');
  
  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (etudiantData.email && !emailRegex.test(etudiantData.email)) {
    erreurs.push('Format d\'email invalide');
  }
  
  // Validation du niveau
  if (etudiantData.niveau && (etudiantData.niveau < 1 || etudiantData.niveau > 5)) {
    erreurs.push('Niveau doit être entre 1 et 5');
  }
  
  // Validation du prix si présent
  if (etudiantData.prixTotal && (isNaN(etudiantData.prixTotal) || etudiantData.prixTotal < 0)) {
    erreurs.push('Prix total doit être un nombre positif');
  }
  
  return erreurs;
}

/**
 * Fonction d'analyse préalable du fichier
 */
function analyserFichierExcel(donneesExcel) {
  console.log('\n📊 ANALYSE DÉTAILLÉE DU FICHIER:');
  
  // Statistiques générales
  const filieres = [...new Set(donneesExcel.map(e => e.filiere).filter(f => f))];
  const niveaux = [...new Set(donneesExcel.map(e => e.niveau).filter(f => f))].sort();
  const specialites = [...new Set(donneesExcel.map(e => e.specialite).filter(f => f))];
  
  console.log(`Total étudiants: ${donneesExcel.length}`);
  console.log('Filières trouvées:', filieres);
  console.log('Niveaux trouvés:', niveaux);
  console.log(`Spécialités uniques: ${specialites.length}`);
  
  // Analyse des prix
  const avecPrix = donneesExcel.filter(e => e.prixTotal && e.prixTotal > 0);
  const sansPrix = donneesExcel.filter(e => !e.prixTotal || e.prixTotal === 0);
  
  console.log(`\n💰 ANALYSE DES PRIX:`);
  console.log(`Étudiants avec prix: ${avecPrix.length}`);
  console.log(`Étudiants sans prix: ${sansPrix.length}`);
  
  if (avecPrix.length > 0) {
    const prix = avecPrix.map(e => e.prixTotal);
    const prixMin = Math.min(...prix);
    const prixMax = Math.max(...prix);
    const prixMoyen = Math.round(prix.reduce((a, b) => a + b, 0) / prix.length);
    
    console.log(`Prix min: ${prixMin.toLocaleString()} DH`);
    console.log(`Prix max: ${prixMax.toLocaleString()} DH`);
    console.log(`Prix moyen: ${prixMoyen.toLocaleString()} DH`);
  }
  
  // Répartition par filière et niveau
  console.log(`\n📈 RÉPARTITION PAR FILIÈRE:`);
  filieres.forEach(filiere => {
    const count = donneesExcel.filter(e => e.filiere === filiere).length;
    console.log(`${filiere}: ${count} étudiants`);
  });
}

/**
 * Fonction principale d'importation
 */
async function importerEtudiants() {
  try {
    console.log('🚀 Début de l\'importation des étudiants...');
    
    // 1. Connexion à MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connexion à MongoDB établie');
    
    // 2. Lecture du fichier Excel
    const cheminFichier = path.join(__dirname, 'etudiants_corrige_structure.xlsx');
    const donneesExcel = lireFichierExcel(cheminFichier);
    
    // 3. Analyse préalable du fichier
    analyserFichierExcel(donneesExcel);
    
    // 4. Demander confirmation avant l'import
    console.log(`\n⚠️  Vous allez importer ${donneesExcel.length} étudiants dans la base de données.`);
    console.log('Appuyez sur Ctrl+C pour annuler, ou attendez 3 secondes pour continuer...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Traitement et insertion
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    const erreurs = [];
    
    console.log('\n🔄 Début du traitement des données...');
    
    for (let i = 0; i < donneesExcel.length; i++) {
      const donneeBrute = donneesExcel[i];
      
      try {
        console.log(`\n[${i + 1}/${donneesExcel.length}] Traitement: ${donneeBrute.prenom} ${donneeBrute.nomDeFamille}`);
        
        // Mapper les données
        const etudiantData = mapperDonneesEtudiant(donneeBrute);
        
        // Valider les données
        const erreursValidation = validerDonnees(etudiantData);
        if (erreursValidation.length > 0) {
          throw new Error(`Validation échouée: ${erreursValidation.join(', ')}`);
        }
        
        // Vérifier si l'étudiant existe déjà
        const etudiantExistant = await Etudiant.findOne({ email: etudiantData.email });
        if (etudiantExistant) {
          console.log(`⚠️  Étudiant déjà existant: ${etudiantData.email}`);
          skipCount++;
          continue;
        }
        
        // Hasher le mot de passe
        etudiantData.motDePasse = await hashMotDePasse(etudiantData.motDePasse);
        
        // Créer l'étudiant (le middleware pre-save s'occupera de la validation et auto-assignation)
        const nouvelEtudiant = new Etudiant(etudiantData);
        await nouvelEtudiant.save();
        
        console.log(`✅ Étudiant créé avec succès: ${nouvelEtudiant.email}`);
        console.log(`   → Type: ${nouvelEtudiant.typeFormation}, Niveau: ${nouvelEtudiant.niveau}`);
        if (nouvelEtudiant.cycle) console.log(`   → Cycle: ${nouvelEtudiant.cycle}`);
        if (nouvelEtudiant.specialite) console.log(`   → Spécialité: ${nouvelEtudiant.specialite}`);
        if (nouvelEtudiant.prixTotal) console.log(`   → Prix: ${nouvelEtudiant.prixTotal.toLocaleString()} DH`);
        
        successCount++;
        
      } catch (error) {
        errorCount++;
        const messageErreur = `Ligne ${i + 1} (${donneeBrute.email || 'email manquant'}): ${error.message}`;
        erreurs.push(messageErreur);
        console.error(`❌ ${messageErreur}`);
        
        // Continuer même en cas d'erreur sur un étudiant
        continue;
      }
    }
    
    // 6. Rapport final détaillé
    console.log('\n🎯 RAPPORT FINAL DÉTAILLÉ:');
    console.log(`✅ Étudiants créés avec succès: ${successCount}`);
    console.log(`⚠️  Étudiants ignorés (déjà existants): ${skipCount}`);
    console.log(`❌ Erreurs rencontrées: ${errorCount}`);
    console.log(`📊 Taux de succès: ${Math.round((successCount / donneesExcel.length) * 100)}%`);
    
    if (erreurs.length > 0) {
      console.log('\n📋 DÉTAIL DES ERREURS:');
      erreurs.forEach((erreur, index) => {
        console.log(`${index + 1}. ${erreur}`);
      });
    }
    
    // 7. Vérification finale avec statistiques détaillées
    const totalEtudiants = await Etudiant.countDocuments();
    const etudiantsAvecPrix = await Etudiant.countDocuments({ 
      prixTotal: { $exists: true, $ne: null, $ne: 0 } 
    });
    const etudiantsSansPrix = totalEtudiants - etudiantsAvecPrix;
    
    console.log(`\n📈 STATISTIQUES FINALES DE LA BASE:`);
    console.log(`Total d'étudiants dans la base: ${totalEtudiants}`);
    console.log(`Étudiants avec prix: ${etudiantsAvecPrix}`);
    console.log(`Étudiants sans prix: ${etudiantsSansPrix}`);
    
    // 8. Suggérer des actions de suivi
    console.log(`\n💡 ACTIONS SUGGÉRÉES:`);
    if (etudiantsSansPrix > 0) {
      console.log(`- Exécuter le script de diagnostic: node diagnosticPrix.js`);
      console.log(`- Considérer mettre à jour les prix manquants`);
    }
    if (errorCount > 0) {
      console.log(`- Vérifier et corriger les ${errorCount} erreurs listées ci-dessus`);
    }
    console.log(`- Vérifier quelques étudiants créés dans votre interface d'administration`);
    
  } catch (error) {
    console.error('💥 Erreur critique:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnexion de MongoDB');
  }
}

/**
 * Fonction utilitaire pour nettoyer la collection (ATTENTION: supprime tout!)
 */
async function nettoyerCollection() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const count = await Etudiant.countDocuments();
    console.log(`⚠️  ${count} étudiants trouvés dans la collection`);
    
    if (count === 0) {
      console.log('✅ La collection est déjà vide');
      await mongoose.disconnect();
      return;
    }
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Êtes-vous sûr de vouloir supprimer TOUS les étudiants? (tapez "SUPPRIMER" pour confirmer): ', async (answer) => {
      if (answer === 'SUPPRIMER') {
        const result = await Etudiant.deleteMany({});
        console.log(`🗑️  ${result.deletedCount} étudiants supprimés`);
      } else {
        console.log('❌ Opération annulée');
      }
      rl.close();
      await mongoose.disconnect();
    });
    
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    await mongoose.disconnect();
  }
}

/**
 * Fonction pour afficher les statistiques sans importer
 */
async function afficherStatistiques() {
  try {
    const cheminFichier = path.join(__dirname, 'etudiants_corrige_structure.xlsx');
    const donneesExcel = lireFichierExcel(cheminFichier);
    
    analyserFichierExcel(donneesExcel);
    
    // Analyse des doublons potentiels
    console.log('\n🔍 VÉRIFICATION DES DOUBLONS:');
    const emails = donneesExcel.map(e => e.email?.toLowerCase().trim()).filter(e => e);
    const emailsUniques = [...new Set(emails)];
    const doublons = emails.length - emailsUniques.length;
    
    if (doublons > 0) {
      console.log(`⚠️  ${doublons} doublons d'email détectés dans le fichier Excel`);
      
      // Trouver les emails en doublon
      const compteurEmails = {};
      emails.forEach(email => {
        compteurEmails[email] = (compteurEmails[email] || 0) + 1;
      });
      
      const emailsEnDoublon = Object.entries(compteurEmails)
        .filter(([email, count]) => count > 1)
        .slice(0, 5); // Limiter l'affichage
      
      console.log('Exemples d\'emails en doublon:');
      emailsEnDoublon.forEach(([email, count]) => {
        console.log(`  ${email}: ${count} occurrences`);
      });
    } else {
      console.log('✅ Aucun doublon d\'email détecté');
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--clean')) {
  nettoyerCollection();
} else if (args.includes('--stats')) {
  afficherStatistiques();
} else if (args.includes('--help')) {
  console.log(`
📚 SCRIPT D'IMPORTATION DES ÉTUDIANTS - VERSION AMÉLIORÉE

Usage:
  node importEtudiants.js              # Importer les étudiants
  node importEtudiants.js --stats      # Afficher les statistiques du fichier Excel
  node importEtudiants.js --clean      # Nettoyer la collection (DANGER!)
  node importEtudiants.js --help       # Afficher cette aide

Prérequis:
  ✅ Node.js installé
  ✅ MongoDB en cours d'exécution
  ✅ Dépendances installées: npm install mongoose xlsx bcrypt
  ✅ Fichier 'etudiants_corrige_structure.xlsx' dans le dossier du script
  ✅ Modèle etudiantModel.js configuré

Configuration:
  - MONGODB_URI: Variable d'environnement pour la connexion MongoDB
  - Chemin du modèle: ./models/etudiantModel (ajustez si nécessaire)

Fonctionnalités:
  🔍 Analyse préalable du fichier Excel
  💰 Gestion améliorée des prix (null/undefined/0)
  🔒 Hashage sécurisé des mots de passe
  ✅ Validation complète des données
  📊 Rapport détaillé avec statistiques
  🚫 Évite les doublons par email
  ⚡ Gestion robuste des erreurs

Exemples:
  # Analyser d'abord le fichier
  node importEtudiants.js --stats
  
  # Puis importer
  node importEtudiants.js
  
  # Diagnostiquer les prix après import
  node diagnosticPrix.js
  `);
} else {
  // Import par défaut
  importerEtudiants();
}

module.exports = {
  importerEtudiants,
  nettoyerCollection,
  mapperDonneesEtudiant,
  afficherStatistiques
};