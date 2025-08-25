/**
 * Script d'Adaptation des Formations pour Dashboard
 * ------------------------------------------------
 * Ce script met Ã  jour les Ã©tudiants existants pour que votre dashboard
 * puisse correctement identifier les formations FT, TA et Executive
 * 
 * UTILISATION:
 *   node adapter-formations.js "mongodb://localhost:27017/supemir_db"
 */

const mongoose = require('mongoose');

// ====== Utiliser votre modÃ¨le existant ======
let Etudiant;
try {
  Etudiant = require('./models/etudiantModel');
} catch (e) {
  
  process.exit(1);
}

// ========= Fonctions de dÃ©tection et adaptation =========

/**
 * DÃ©termine le type de formation basÃ© sur les donnÃ©es existantes
 */
const determinerTypeFormation = (etudiant) => {
  const niveau = (etudiant.niveauFormation || '').toLowerCase();
  const filiere = (etudiant.filiere || '').toLowerCase();
  const cycle = (etudiant.cycle || '').toLowerCase();
  const specialite = (etudiant.specialite || '').toLowerCase();
  
  // Recherche de patterns spÃ©cifiques
  const texteComplet = `${niveau} ${filiere} ${cycle} ${specialite}`.toLowerCase();
  
  // 1. DÃ©tection MASI/IRM (formations spÃ©cifiques)
  if (/masi/i.test(texteComplet)) return 'MASI';
  if (/irm/i.test(texteComplet)) return 'IRM';
  
  // 2. DÃ©tection des formations acadÃ©miques
  if (/licence.*prof/i.test(texteComplet) || /licence.*pro/i.test(texteComplet)) return 'LICENCE_PRO';
  if (/master/i.test(texteComplet)) return 'MASTER_PRO';
  if (/ing[eÃ©]nieur/i.test(texteComplet) || /cycle.*ing/i.test(texteComplet)) return 'CYCLE_INGENIEUR';
  
  return null; // Pas de type de formation spÃ©cifique trouvÃ©
};

/**
 * Adapte le niveauFormation pour inclure les indicateurs FT/TA/Executive
 */
const adapterNiveauFormation = (etudiant) => {
  const niveau = etudiant.niveauFormation || '';
  const filiere = etudiant.filiere || '';
  
  // Si dÃ©jÃ  adaptÃ©, on ne modifie pas
  if (/\b(FT|TA|Executive)\b/i.test(niveau)) {
    return niveau;
  }
  
  // Patterns de dÃ©tection pour diffÃ©rents types
  const texteAnalyse = `${niveau} ${filiere}`.toLowerCase();
  
  // DÃ©tection TA (Temps AlternÃ©)
  if (/alternan|alternÃ©|apprenti|ta\b|temps.*altern/i.test(texteAnalyse)) {
    return `${niveau} - TA`.trim();
  }
  
  // DÃ©tection Executive
  if (/executive|exec|cadre|professionnel.*exp[eÃ©]riment[eÃ©]|soir/i.test(texteAnalyse)) {
    return `${niveau} - Executive`.trim();
  }
  
  // Par dÃ©faut: FT (Full Time) pour les formations classiques
  if (niveau && !/(non|d[eÃ©]fini|vide)/i.test(niveau)) {
    return `${niveau} - FT`.trim();
  }
  
  return niveau;
};

/**
 * Mappe les spÃ©cialitÃ©s vers les bons champs selon le type de formation
 */
const mapperSpecialites = (etudiant, typeFormation) => {
  const specialite = etudiant.specialite || '';
  const filiere = etudiant.filiere || '';
  
  const updates = {};
  
  if (!specialite && !filiere) return updates;
  
  const texteSpec = `${specialite} ${filiere}`.toLowerCase();
  
  // Mapping pour Licence Pro
  if (typeFormation === 'LICENCE_PRO') {
    const mappingLicencePro = {
      'Marketing digital e-business Casablanca': /marketing.*digital|e-business|casablanca/i,
      'Tests Logiciels avec Tests AutomatisÃ©s': /test.*logiciel|test.*automat/i,
      'Gestion de la QualitÃ©': /gestion.*qualit[eÃ©]/i,
      'DÃ©veloppement Informatique Full Stack': /d[eÃ©]veloppement.*informatique|full.*stack|dev.*info/i,
      'Administration des SystÃ¨mes, Bases de DonnÃ©es, CybersÃ©curitÃ© et Cloud Computing': /admin.*syst[eÃ¨]me|base.*donn[eÃ©]e|cybersÃ©curit[eÃ©]|cloud/i,
      'RÃ©seaux et CybersÃ©curitÃ©': /r[eÃ©]seau.*cyber|cyber.*r[eÃ©]seau|s[eÃ©]curit[eÃ©].*r[eÃ©]seau/i,
      'Finance, Audit & Entrepreneuriat': /finance|audit|entrepreneur/i,
      'DÃ©veloppement Commercial et Marketing Digital': /commercial.*marketing|marketing.*commercial/i,
      'Informatique â€“ Cnam': /informatique.*cnam|cnam.*informatique/i
    };
    
    for (const [spec, pattern] of Object.entries(mappingLicencePro)) {
      if (pattern.test(texteSpec)) {
        updates.specialiteLicencePro = spec;
        break;
      }
    }
  }
  
  // Mapping pour Master Pro
  else if (typeFormation === 'MASTER_PRO') {
    const mappingMasterPro = {
      'Big Data et Intelligence Artificielle': /big.*data|intelligence.*artificielle|ia\b/i,
      'CybersÃ©curitÃ© et Transformation Digitale': /cyber.*digital|digital.*cyber|transformation.*digitale/i,
      'GÃ©nie Informatique et Innovation Technologique': /g[eÃ©]nie.*informatique|innovation.*technologique/i,
      'Finance, Audit & Entrepreneuriat': /finance|audit|entrepreneur/i,
      'Management des SystÃ¨mes d\'Information': /management.*information|msi|syst[eÃ¨]me.*information/i,
      'DÃ©veloppement Commercial et Marketing Digital': /commercial.*marketing|marketing.*commercial/i
    };
    
    for (const [spec, pattern] of Object.entries(mappingMasterPro)) {
      if (pattern.test(texteSpec)) {
        updates.specialiteMasterPro = spec;
        break;
      }
    }
  }
  
  // Mapping pour Cycle IngÃ©nieur
  else if (typeFormation === 'CYCLE_INGENIEUR') {
    const mappingIngenieur = {
      'GÃ©nie Informatique': /g[eÃ©]nie.*informatique|informatique/i,
      'GÃ©nie MÃ©catronique': /g[eÃ©]nie.*m[eÃ©]catronique|m[eÃ©]catronique|m[eÃ©]canique/i,
      'GÃ©nie Civil': /g[eÃ©]nie.*civil|civil/i
    };
    
    for (const [spec, pattern] of Object.entries(mappingIngenieur)) {
      if (pattern.test(texteSpec)) {
        updates.specialiteIngenieur = spec;
        break;
      }
    }
  }
  
  return updates;
};

// ========= Main Script =========
async function main() {
  const mongoUri = process.argv[2] || 'mongodb://localhost:27017/supemir_db';
  
  
  
  
  try {
    // Connexion Ã  la base de donnÃ©es
    await mongoose.connect(mongoUri);
    
    
    // RÃ©cupÃ©ration de tous les Ã©tudiants
    const etudiants = await Etudiant.find({});
    
    
    if (etudiants.length === 0) {
      
      return;
    }
    
    let compteurMisAJour = 0;
    const statistiques = {
      typeFormationAjoute: 0,
      niveauFormationAdapte: 0,
      specialiteMappee: 0,
      erreurs: 0
    };
    
    // Traitement par lots pour Ã©viter la surcharge mÃ©moire
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < etudiants.length; i += BATCH_SIZE) {
      const batch = etudiants.slice(i, i + BATCH_SIZE);
      
      for (const etudiant of batch) {
        try {
          let modifie = false;
          const updates = {};
          
          // 1. DÃ©terminer et ajouter le typeFormation si manquant
          if (!etudiant.typeFormation) {
            const typeDetecte = determinerTypeFormation(etudiant);
            if (typeDetecte) {
              updates.typeFormation = typeDetecte;
              statistiques.typeFormationAjoute++;
              modifie = true;
            }
          }
          
          // 2. Adapter le niveauFormation pour inclure FT/TA/Executive
          const niveauAdapte = adapterNiveauFormation(etudiant);
          if (niveauAdapte !== etudiant.niveauFormation) {
            updates.niveauFormation = niveauAdapte;
            statistiques.niveauFormationAdapte++;
            modifie = true;
          }
          
          // 3. Mapper les spÃ©cialitÃ©s si un typeFormation est dÃ©fini
          const typeFormation = updates.typeFormation || etudiant.typeFormation;
          if (typeFormation) {
            const specialitesMapping = mapperSpecialites(etudiant, typeFormation);
            if (Object.keys(specialitesMapping).length > 0) {
              Object.assign(updates, specialitesMapping);
              statistiques.specialiteMappee++;
              modifie = true;
            }
          }
          
          // 4. Appliquer les mises Ã  jour si nÃ©cessaire
          if (modifie) {
            await Etudiant.findByIdAndUpdate(etudiant._id, updates);
            compteurMisAJour++;
            
            // Log pÃ©riodique
            if (compteurMisAJour % 50 === 0) {
              
            }
          }
          
        } catch (error) {
          
          statistiques.erreurs++;
        }
      }
    }
    
    // Statistiques finales
    
    
    
    
    
    
    
    if (statistiques.erreurs > 0) {
      
    }
    
    // VÃ©rification des rÃ©sultats
    
    const verification = await Etudiant.aggregate([
      {
        $group: {
          _id: '$niveauFormation',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    
    verification.forEach(item => {
      if (item._id) {
        
      }
    });
    
    const verificationTypes = await Etudiant.aggregate([
      {
        $group: {
          _id: '$typeFormation',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    
    verificationTypes.forEach(item => {
      
    });
    
  } catch (error) {
    
  } finally {
    await mongoose.disconnect();
    
  }
}

// Gestion des erreurs non capturÃ©es
process.on('unhandledRejection', (reason, promise) => {
  
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  
  process.exit(1);
});

// ExÃ©cution du script
if (require.main === module) {
  main().catch(e => {
    
    process.exit(1);
  });
}

module.exports = { main };


