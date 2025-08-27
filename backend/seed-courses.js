#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// ===== SCHÉMAS MONGOOSE =====
const coursSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  professeur: {
    type: [String],
    required: true,
    default: []
  },
}, { timestamps: true });

const Cours = mongoose.model('Cours', coursSchema);

// ===== STRUCTURE DE FORMATION =====
const STRUCTURE_FORMATION = {
  MASI: {
    nom: 'MASI',
    niveauxManuels: true,
    specialitesParNiveau: {
      3: ['Entreprenariat, audit et finance', 'Développement commercial et marketing digital'],
      4: ['Management des affaires et systèmes d\'information'],
      5: ['Management des affaires et systèmes d\'information']
    },
    options: {}
  },
  IRM: {
    nom: 'IRM',
    niveauxManuels: true,
    specialitesParNiveau: {
      3: ['Développement informatique', 'Réseaux et cybersécurité'],
      4: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale'],
      5: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale']
    },
    options: {}
  },
  CYCLE_INGENIEUR: {
    nom: 'École d\'Ingénieur',
    niveauxManuels: true,
    cycles: {
      'Classes Préparatoires Intégrées': {
        niveaux: [1, 2],
        specialites: [],
        options: {}
      },
      'Cycle Ingénieur': {
        niveaux: [3, 4, 5],
        specialites: [
          'Génie Informatique',
          'Génie Mécatronique',
          'Génie Civil'
        ],
        options: {
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
        }
      }
    }
  },
  LICENCE_PRO: {
    nom: 'Licence Professionnelle',
    typeFormation: 'LICENCE_PRO',
    niveauxManuels: false,
    niveauFixe: 3,
    specialites: [
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
    ],
    options: {
      'Développement Informatique Full Stack': [
        'Développement Mobile',
        'Intelligence Artificielle et Data Analytics',
        'Développement JAVA JEE',
        'Développement Gaming et VR'
      ],
      'Réseaux et Cybersécurité': [
        'Administration des Systèmes et Cloud Computing'
      ]
    }
  },
  MASTER_PRO: {
    nom: 'Master Professionnel',
    typeFormation: 'MASTER_PRO',
    niveauxManuels: false,
    niveauFixe: 4,
    specialites: [
      'Informatique, Data Sciences, Cloud, Cybersécurité & Intelligence Artificielle (DU IDCIA)',
      'QHSSE & Performance Durable',
      'Achat, Logistique et Supply Chain Management',
      'Management des Systèmes d\'Information',
      'Big Data et Intelligence Artificielle',
      'Cybersécurité et Transformation Digitale',
      'Génie Informatique et Innovation Technologique',
      'Finance, Audit & Entrepreneuriat',
      'Développement Commercial et Marketing Digital'
    ],
    options: {
      'Cybersécurité et Transformation Digitale': [
        'Systèmes de communication et Data center',
        'Management des Systèmes d\'Information'
      ],
      'Génie Informatique et Innovation Technologique': [
        'Génie Logiciel',
        'Intelligence Artificielle et Data Science'
      ]
    }
  }
};

// ===== GÉNÉRATION DES COURS AVEC NOMS SIMPLES =====
function generateCourses(formationFilter = null, yearFilter = null) {
  const courses = [];
  
  for (const [formationKey, formation] of Object.entries(STRUCTURE_FORMATION)) {
    // Filtrer les formations si spécifié
    if (formationFilter && !formationFilter.includes(formationKey)) {
      continue;
    }
    
    if (formationKey === 'CYCLE_INGENIEUR') {
      // Traitement spécial pour le cycle ingénieur
      for (const [cycleName, cycleData] of Object.entries(formation.cycles)) {
        
        for (const niveau of cycleData.niveaux) {
          // Filtrer les années si spécifié
          if (yearFilter && !yearFilter.includes(niveau)) {
            continue;
          }
          
          if (cycleName === 'Classes Préparatoires Intégrées') {
            // Classes préparatoires : nom simple
            const courseName = `Classes Préparatoires ${niveau} Année`;
            courses.push({
              nom: courseName,
              professeur: []
            });
          } else {
            // Cycle ingénieur avec spécialités
            for (const specialite of cycleData.specialites) {
              
              if (niveau === 5) {
                // Niveau 5 : avec options obligatoires
                const options = cycleData.options[specialite] || [];
                for (const option of options) {
                  const courseName = `${specialite} ${option} ${niveau} Année`;
                  courses.push({
                    nom: courseName,
                    professeur: []
                  });
                }
              } else {
                // Niveaux 3 et 4 : juste avec spécialité
                const courseName = `${specialite} ${niveau} Année`;
                courses.push({
                  nom: courseName,
                  professeur: []
                });
              }
            }
          }
        }
      }
    } else if (formationKey === 'LICENCE_PRO') {
      // Licence Pro : niveau fixe 3
      const niveau = formation.niveauFixe;
      if (!yearFilter || yearFilter.includes(niveau)) {
        for (const specialite of formation.specialites) {
          
          // Cours avec spécialité seulement
          const courseNameBase = `Licence Pro ${specialite}`;
          courses.push({
            nom: courseNameBase,
            professeur: []
          });
          
          // Cours avec options si disponibles
          const options = formation.options[specialite] || [];
          for (const option of options) {
            const courseName = `Licence Pro ${specialite} ${option}`;
            courses.push({
              nom: courseName,
              professeur: []
            });
          }
        }
      }
    } else if (formationKey === 'MASTER_PRO') {
      // Master Pro : niveau fixe 4
      const niveau = formation.niveauFixe;
      if (!yearFilter || yearFilter.includes(niveau)) {
        for (const specialite of formation.specialites) {
          
          // Cours avec spécialité seulement
          const courseNameBase = `Master Pro ${specialite}`;
          courses.push({
            nom: courseNameBase,
            professeur: []
          });
          
          // Cours avec options si disponibles
          const options = formation.options[specialite] || [];
          for (const option of options) {
            const courseName = `Master Pro ${specialite} ${option}`;
            courses.push({
              nom: courseName,
              professeur: []
            });
          }
        }
      }
    } else {
      // MASI et IRM : niveaux manuels avec spécialités selon le niveau
      const niveaux = [1, 2, 3, 4, 5]; // Tous les niveaux possibles
      
      for (const niveau of niveaux) {
        // Filtrer les années si spécifié
        if (yearFilter && !yearFilter.includes(niveau)) {
          continue;
        }
        
        if (niveau <= 2) {
          // Années 1 et 2 : pas de spécialités, juste le nom de formation + année
          const courseName = `${formationKey} ${niveau} Année`;
          courses.push({
            nom: courseName,
            professeur: []
          });
        } else {
          // Années 3, 4, 5 : avec spécialités spécifiques à chaque niveau
          const specialitesNiveau = formation.specialitesParNiveau?.[niveau] || [];
          
          if (specialitesNiveau.length === 0) {
            // Si pas de spécialités pour ce niveau, juste le nom de formation + année
            const courseName = `${formationKey} ${niveau} Année`;
            courses.push({
              nom: courseName,
              professeur: []
            });
          } else {
            // Avec spécialités pour ce niveau
            for (const specialite of specialitesNiveau) {
              const courseName = `${formationKey} ${specialite} ${niveau} Année`;
              courses.push({
                nom: courseName,
                professeur: []
              });
            }
          }
        }
      }
    }
  }
  
  return courses;
}

// ===== ANALYSE DES ARGUMENTS DE LA LIGNE DE COMMANDE =====
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    formations: null,
    years: null,
    dryRun: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--f' && i + 1 < args.length) {
      options.formations = args[i + 1].split(',').map(f => f.trim());
      i++;
    } else if (arg === '--years' && i + 1 < args.length) {
      options.years = args[i + 1].split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
      i++;
    } else if (arg === '--dry') {
      options.dryRun = true;
    }
  }
  
  return options;
}

// ===== FONCTION PRINCIPALE =====
async function main() {
  try {
    console.log('🚀 Générateur de Cours - Démarrage...\n');
    
    // Parse les arguments
    const options = parseArgs();
    
    console.log('📋 Configuration:');
    console.log(`   Formations: ${options.formations ? options.formations.join(', ') : 'TOUTES'}`);
    console.log(`   Années: ${options.years ? options.years.join(', ') : 'TOUTES'}`);
    console.log(`   Mode: ${options.dryRun ? 'DRY RUN (simulation)' : 'INSERTION EN DB'}\n`);
    
    // Génération des cours
    const courses = generateCourses(options.formations, options.years);
    console.log(`📚 ${courses.length} cours générés\n`);
    
    if (options.dryRun) {
      console.log('🔍 APERÇU DES COURS (mode dry run):');
      courses.forEach((course, index) => {
        console.log(`   ${index + 1}. ${course.nom}`);
      });
      console.log(`\n✅ Simulation terminée. ${courses.length} cours générés.`);
      return;
    }
    
    // Connexion à MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI non défini dans le fichier .env');
    }
    
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    // Insertion des cours avec upsert
    console.log('💾 Insertion des cours...');
    let created = 0;
    let existing = 0;
    
    for (const course of courses) {
      try {
        const existingCourse = await Cours.findOne({ nom: course.nom });
        
        if (existingCourse) {
          existing++;
          console.log(`🔄 Existe déjà: ${course.nom}`);
        } else {
          await Cours.create(course);
          created++;
          console.log(`✅ Créé: ${course.nom}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'insertion de "${course.nom}":`, error.message);
      }
    }
    
    // Résumé
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   ✅ Cours créés: ${created}`);
    console.log(`   🔄 Cours déjà existants: ${existing}`);
    console.log(`   📚 Total traité: ${created + existing}`);
    console.log(`   🎯 Total généré: ${courses.length}`);
    
    if (created + existing !== courses.length) {
      console.log(`   ⚠️  Différence détectée: ${courses.length - (created + existing)} cours non traités`);
    }
    
    console.log('\n🎉 Seeding terminé avec succès!');
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Déconnecté de MongoDB');
    }
  }
}

// ===== AIDE =====
function showHelp() {
  console.log(`
📚 Générateur de Cours - Aide

Usage: node seed-courses.js [options]

Options:
  --f formations     Limiter aux formations spécifiées (MASI,IRM,CYCLE_INGENIEUR,LICENCE_PRO,MASTER_PRO)
  --years années     Limiter aux années spécifiées (1,2,3,4,5)
  --dry             Mode simulation (affiche sans insérer en DB)
  --help            Afficher cette aide

Exemples de cours générés:
  IRM 1 Année
  IRM 2 Année
  IRM Développement informatique 3 Année
  IRM Génie informatique et innovation technologique 4 Année
  MASI 1 Année
  MASI 2 Année
  MASI Entreprenariat, audit et finance 3 Année
  MASI Management des affaires et systèmes d'information 4 Année
  Classes Préparatoires 1 Année
  Classes Préparatoires 2 Année
  Génie Informatique 3 Année
  Génie Informatique IA & Science des Données 5 Année
  Licence Pro Développement Informatique Full Stack
  Master Pro Cybersécurité et Transformation Digitale

Exemples d'utilisation:
  node seed-courses.js                                    # Tous les cours
  node seed-courses.js --f IRM,MASI                      # Seulement IRM et MASI
  node seed-courses.js --years 1,2                       # Seulement années 1 et 2
  node seed-courses.js --f CYCLE_INGENIEUR --dry         # Simulation École d'Ingénieur
  node seed-courses.js --f IRM --years 1,2,3             # IRM années 1, 2, 3 seulement

Variables d'environnement requises:
  MONGO_URI         URI de connexion MongoDB
`);
}

// Vérifier si l'aide est demandée
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Exécuter le script
main();