// Test de debug pour vérifier l'envoi des données LICENCE_PRO
console.log('=== TEST DEBUG - Données envoyées au backend ===');

// Simulation des données du formulaire frontend
const formAjoutTest = {
  prenom: 'Test',
  nomDeFamille: 'Etudiant',
  genre: 'Homme',
  dateNaissance: '2000-01-01',
  telephone: '0612345678',
  email: 'test@example.com',
  motDePasse: 'password123',
  cin: '12345678',
  passeport: '',
  anneeScolaire: '2025/2026',
  lieuNaissance: 'Casablanca',
  pays: 'Maroc',
  cours: [],
  niveau: 3, // Doit être auto-assigné par le backend
  niveauFormation: '',
  filiere: 'LICENCE_PRO', // Frontend envoie ceci
  option: '',
  specialite: '',
  typeDiplome: '',
  diplomeAcces: '',
  specialiteDiplomeAcces: '',
  mention: '',
  lieuObtentionDiplome: '',
  serieBaccalaureat: '',
  anneeBaccalaureat: '',
  premiereAnneeInscription: '',
  sourceInscription: '',
  dateInscription: '',
  typePaiement: '',
  prixTotal: '',
  pourcentageBourse: '',
  situation: '',
  codeEtudiant: '',
  dateEtReglement: '',
  actif: true,
  nouvelleInscription: true,
  paye: false,
  handicape: false,
  resident: false,
  fonctionnaire: false,
  mobilite: false,
  commercial: '',
  cycle: '',
  specialiteIngenieur: '',
  optionIngenieur: '',
  // NOUVEAUX CHAMPS - Ceux qui doivent être envoyés
  specialiteLicencePro: 'Informatique – Cnam',
  optionLicencePro: '',
  specialiteMasterPro: '',
  optionMasterPro: ''
};

console.log('✅ Données Frontend à envoyer:');
console.log(JSON.stringify(formAjoutTest, null, 2));

// Simulation du mapping backend
const mappingFiliere = {
  'CYCLE_INGENIEUR': 'CYCLE_INGENIEUR',
  'MASI': 'MASI',
  'IRM': 'IRM',
  'LICENCE_PRO': 'LICENCE_PRO',
  'MASTER_PRO': 'MASTER_PRO'
};

const typeFormationFinal = mappingFiliere[formAjoutTest.filiere];
console.log(`\n🎯 Mapping: filiere "${formAjoutTest.filiere}" → typeFormation "${typeFormationFinal}"`);

// Simulation de l'auto-assignation du niveau
let niveauFinal = parseInt(formAjoutTest.niveau) || null;

if (typeFormationFinal === 'LICENCE_PRO') {
  niveauFinal = 3; // Auto-assigné
  console.log(`🚀 Auto-assignation niveau: LICENCE_PRO → niveau ${niveauFinal}`);
} else if (typeFormationFinal === 'MASTER_PRO') {
  niveauFinal = 4; // Auto-assigné
  console.log(`🚀 Auto-assignation niveau: MASTER_PRO → niveau ${niveauFinal}`);
}

// Simulation de la structure de données backend finale
const etudiantDataSimule = {
  prenom: formAjoutTest.prenom.trim(),
  nomDeFamille: formAjoutTest.nomDeFamille.trim(),
  niveau: niveauFinal,
  filiere: formAjoutTest.filiere?.trim() || '',
  typeFormation: typeFormationFinal
};

if (typeFormationFinal === 'LICENCE_PRO') {
  etudiantDataSimule.specialiteLicencePro = formAjoutTest.specialiteLicencePro?.trim() || undefined;
  etudiantDataSimule.optionLicencePro = formAjoutTest.optionLicencePro?.trim() || undefined;
  etudiantDataSimule.cycle = undefined;
  etudiantDataSimule.specialiteIngenieur = undefined;
  etudiantDataSimule.optionIngenieur = undefined;
  etudiantDataSimule.specialiteMasterPro = undefined;
  etudiantDataSimule.optionMasterPro = undefined;
  etudiantDataSimule.specialite = '';
  etudiantDataSimule.option = '';
}

console.log('\n📊 Structure finale pour MongoDB:');
console.log(JSON.stringify(etudiantDataSimule, null, 2));

// Test de vérification
console.log('\n🧪 VÉRIFICATIONS:');

if (typeFormationFinal === 'LICENCE_PRO') {
  console.log(`✅ Type de formation: ${typeFormationFinal}`);
  console.log(`✅ Niveau auto-assigné: ${niveauFinal}`);
  console.log(`✅ Spécialité Licence Pro: ${etudiantDataSimule.specialiteLicencePro || 'NON DÉFINIE ❌'}`);
  
  if (!etudiantDataSimule.specialiteLicencePro) {
    console.log('❌ PROBLÈME: specialiteLicencePro est undefined !');
    console.log('🔧 Cause possible: Le frontend n\'envoie pas specialiteLicencePro ou il est vide');
  } else {
    console.log('✅ specialiteLicencePro est correctement définie');
  }
  
  if (etudiantDataSimule.specialite !== '') {
    console.log('⚠️  WARNING: Le champ specialite devrait être vide pour LICENCE_PRO');
  }
  
  if (etudiantDataSimule.cycle !== undefined) {
    console.log('⚠️  WARNING: Le champ cycle devrait être undefined pour LICENCE_PRO');
  }
}

console.log('\n🎯 DIAGNOSTIC:');
console.log('1. Le frontend doit envoyer "specialiteLicencePro" avec une valeur');
console.log('2. Le backend doit mapper "filiere" → "typeFormation"');  
console.log('3. Le backend doit auto-assigner niveau 3 pour LICENCE_PRO');
console.log('4. Le backend doit sauvegarder "specialiteLicencePro" dans la base');

console.log('\n🔍 POUR DÉBUGGER:');
console.log('- Vérifier que le FormationSelector envoie specialiteLicencePro');
console.log('- Vérifier les logs du backend lors de la création');
console.log('- Vérifier que le schéma MongoDB accepte specialiteLicencePro');

// Test de validation du schéma
const specialitesLicenceProValides = [
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

const specialiteTest = 'Informatique – Cnam';
if (specialitesLicenceProValides.includes(specialiteTest)) {
  console.log(`✅ La spécialité "${specialiteTest}" est valide selon le schéma backend`);
} else {
  console.log(`❌ La spécialité "${specialiteTest}" n'est PAS valide selon le schéma backend`);
  console.log('Spécialités valides:', specialitesLicenceProValides);
}
