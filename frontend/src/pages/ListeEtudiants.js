import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ListeEtudiants.css';
import '../styles/partner-styles.css';
import Sidebar from '../components/Sidebar';

import { 
  User, 
  CheckCircle, 
  XCircle,
   Award, Shield, Clock, Plus,
  Phone, 
  Eye, 
  Edit,   
  BookOpen, 
  Calendar, 
  Cake, 
  RotateCcw, 
  X,
  Trash2,
  UserCheck,
  IdCard,
  MapPin,
  GraduationCap,
  CreditCard,
  FileText
} from "lucide-react";

// Liste complète des pays
const PAYS_LISTE = [
  'Afghanistan', 'Afrique du Sud', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola', 'Antigua-et-Barbuda', 'Arabie saoudite', 'Argentine', 'Arménie', 'Australie', 'Autriche', 'Azerbaïdjan',
  'Bahamas', 'Bahreïn', 'Bangladesh', 'Barbade', 'Belgique', 'Belize', 'Bénin', 'Bhoutan', 'Biélorussie', 'Birmanie', 'Bolivie', 'Bosnie-Herzégovine', 'Botswana', 'Brésil', 'Brunei', 'Bulgarie', 'Burkina Faso', 'Burundi',
  'Cambodge', 'Cameroun', 'Canada', 'Cap-Vert', 'Centrafrique', 'Chili', 'Chine', 'Chypre', 'Colombie', 'Comores', 'Congo', 'Congo démocratique', 'Corée du Nord', 'Corée du Sud', 'Costa Rica', 'Côte d\'Ivoire', 'Croatie', 'Cuba',
  'Danemark', 'Djibouti', 'Dominique',
  'Égypte', 'Émirats arabes unis', 'Équateur', 'Érythrée', 'Espagne', 'Estonie', 'États-Unis', 'Éthiopie',
  'Fidji', 'Finlande', 'France',
  'Gabon', 'Gambie', 'Géorgie', 'Ghana', 'Grèce', 'Grenade', 'Guatemala', 'Guinée', 'Guinée-Bissau', 'Guinée équatoriale', 'Guyana',
  'Haïti', 'Honduras', 'Hongrie',
  'Îles Cook', 'Îles Marshall', 'Inde', 'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande', 'Israël', 'Italie',
  'Jamaïque', 'Japon', 'Jordanie',
  'Kazakhstan', 'Kenya', 'Kirghizistan', 'Kiribati', 'Koweït',
  'Laos', 'Lesotho', 'Lettonie', 'Liban', 'Liberia', 'Libye', 'Liechtenstein', 'Lituanie', 'Luxembourg',
  'Macédoine du Nord', 'Madagascar', 'Malaisie', 'Malawi', 'Maldives', 'Mali', 'Malte', 'Maroc', 'Maurice', 'Mauritanie', 'Mexique', 'Micronésie', 'Moldavie', 'Monaco', 'Mongolie', 'Monténégro', 'Mozambique',
  'Namibie', 'Nauru', 'Népal', 'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norvège', 'Nouvelle-Zélande',
  'Oman', 'Ouganda', 'Ouzbékistan',
  'Pakistan', 'Palaos', 'Palestine', 'Panama', 'Papouasie-Nouvelle-Guinée', 'Paraguay', 'Pays-Bas', 'Pérou', 'Philippines', 'Pologne', 'Portugal',
  'Qatar',
  'République dominicaine', 'République tchèque', 'Roumanie', 'Royaume-Uni', 'Russie', 'Rwanda',
  'Saint-Christophe-et-Niévès', 'Saint-Marin', 'Saint-Vincent-et-les-Grenadines', 'Sainte-Lucie', 'Salomon', 'Salvador', 'Samoa', 'São Tomé-et-Principe', 'Sénégal', 'Serbie', 'Seychelles', 'Sierra Leone', 'Singapour', 'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Soudan du Sud', 'Sri Lanka', 'Suède', 'Suisse', 'Suriname', 'Swaziland', 'Syrie',
  'Tadjikistan', 'Tanzanie', 'Tchad', 'Thaïlande', 'Timor oriental', 'Togo', 'Tonga', 'Trinité-et-Tobago', 'Tunisie', 'Turkménistan', 'Turquie', 'Tuvalu',
  'Ukraine', 'Uruguay',
  'Vanuatu', 'Vatican', 'Venezuela', 'Viêt Nam',
  'Yémen',
  'Zambie', 'Zimbabwe'
];

// ====== Utils auto-cours ======
const normalize = (s = "") =>
  s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // accents ➜ simple
    .replace(/&/g, "et")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const buildCoursCandidates = (f) => {
  const out = [];
  const n = Number(f.niveau || 0);
  const y = f.niveau ? `${f.niveau} Année` : "";

  if (!f.filiere) return out;

  if (f.filiere === "MASI") {
    if (n >= 1 && n <= 2) out.push(`MASI ${y}`);
    if ((n === 3 || n === 4) && f.specialite) out.push(`MASI ${f.specialite} ${y}`);
    if (n === 5) {
      if (f.specialite && f.option) out.push(`MASI ${f.specialite} ${f.option} ${y}`); // ✅ le plus précis
      if (f.option) out.push(`MASI ${f.option} ${y}`);
      if (f.specialite) out.push(`MASI ${f.specialite} ${y}`);
    }
  } else if (f.filiere === "IRM") {
    if (n >= 1 && n <= 2) out.push(`IRM ${y}`);
    if ((n === 3 || n === 4) && f.specialite) out.push(`IRM ${f.specialite} ${y}`);
    if (n === 5) {
      if (f.specialite && f.option) out.push(`IRM ${f.specialite} ${f.option} ${y}`); // ✅ le plus précis
      if (f.option) out.push(`IRM ${f.option} ${y}`);
      if (f.specialite) out.push(`IRM ${f.specialite} ${y}`);
    }
  } else if (f.filiere === "CYCLE_INGENIEUR") {
    if (n >= 1 && n <= 2) out.push(`Classes Préparatoires ${y}`);
    if (n >= 3) {
      if (n === 5 && f.optionIngenieur) out.push(`${f.optionIngenieur} 5 Année`);
      if (f.specialiteIngenieur) out.push(`${f.specialiteIngenieur} ${y}`);
    }
  } else if (f.filiere === "LICENCE_PRO") {
    if (f.specialiteLicencePro) {
      let s = `Licence Pro ${f.specialiteLicencePro}`;
      if (f.optionLicencePro) s += ` - ${f.optionLicencePro}`;
      out.push(s);
    }
  } else if (f.filiere === "MASTER_PRO") {
    if (f.specialiteMasterPro) {
      let s = `Master Pro ${f.specialiteMasterPro}`;
      if (f.optionMasterPro) s += ` - ${f.optionMasterPro}`;
      out.push(s);
    }
  }

  return out.filter(Boolean);
};

const pickBestCours = (listeCours, candidates) => {
  if (!Array.isArray(listeCours) || listeCours.length === 0) return null;
  const noms = listeCours.map(c => c.nom || c);
  const normNoms = noms.map(normalize);

  // 1) match exact normalisé
  for (const cand of candidates) {
    const nc = normalize(cand);
    const idx = normNoms.findIndex(n => n === nc);
    if (idx !== -1) return noms[idx];
  }
  // 2) "contains" (cand ⊆ cours)
  for (const cand of candidates) {
    const nc = normalize(cand);
    let bestIdx = -1, bestScore = 0;
    normNoms.forEach((n, i) => {
      const score = n.includes(nc) ? nc.length / n.length : 0;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    if (bestIdx !== -1) return noms[bestIdx];
  }
  // 3) recouvrement de tokens (secours)
  if (candidates.length) {
    const tokens = Array.from(new Set(normalize(candidates[0]).split(" ").filter(Boolean)));
    let bestIdx = -1, hitsMax = 0;
    normNoms.forEach((n, i) => {
      let hits = tokens.reduce((acc, t) => acc + (n.includes(t) ? 1 : 0), 0);
      const yearMatch = n.match(/(\d)\s+annee/);
      const askedYear = candidates[0].match(/(\d)\s+Année/);
      if (yearMatch && askedYear && yearMatch[1] === askedYear[1]) hits += 0.5;
      if (hits > hitsMax) { hitsMax = hits; bestIdx = i; }
    });
    if (bestIdx !== -1 && hitsMax > 0) return noms[bestIdx];
  }
  return null;
};

const autoAssignCours = (form, setForm, listeCours, isLockedByUser) => {
  const cands = buildCoursCandidates(form);
  if (!cands.length || isLockedByUser) return;
  const best = pickBestCours(listeCours, cands);
  if (!best) return;
  setForm(prev => {
    const current = prev.cours || [];
    if (current.includes(best)) return prev;
    // on remplace par la meilleure suggestion (l'utilisateur peut toujours re-cliquer les chips)
    return { ...prev, cours: [best] };
  });
};

const STRUCTURE_FORMATION = {
  MASI: {
    nom: 'MASI',
    niveauxManuels: true,
    // لاستعمال بسيط سريع (مثلاً عرض عام)
    specialites: [
      'Entreprenariat, audit et finance',
      'Développement commercial et marketing digital'
    ],
    // 👇 الهيكلة اللي كيعتمد عليها الفرونت لاشتقاق الاختيارات حسب المستوى
    niveaux: {
      1: { specialites: [] },
      2: { specialites: [] },
      3: { specialites: [
        'Entreprenariat, audit et finance',
        'Développement commercial et marketing digital'
      ]},
      4: { specialites: ["Management des affaires et systèmes d'information"] },
      5: { 
        specialites: ["Management des affaires et systèmes d'information"],
        // 👇 OPTIONS ديال MASI كيكونو غير فالمستوى 5 حسب التخصص
        options: {
          "Management des affaires et systèmes d'information": [
            'Finance & Audit',
            'Management SI',
            'Entrepreneuriat & Innovation',
            'Marketing & Ventes',
            'Contrôle de Gestion'
          ]
        }
      }
    }
  },

  IRM: {
    nom: 'IRM',
    niveauxManuels: true,
    // لائحة عامة
    specialites: [
      'Développement informatique',
      'Réseaux et cybersécurité'
    ],
    // 👇 الهيكلة اللي كيعتمد عليها الفرونت
    niveaux: {
      1: { specialites: [] },
      2: { specialites: [] },
      3: { specialites: [
        'Développement informatique',
        'Réseaux et cybersécurité'
      ]},
      4: { specialites: [
        'Génie informatique et innovation technologique',
        'Cybersécurité et transformation digitale'
      ]},
      5: { 
        specialites: [
          'Génie informatique et innovation technologique',
          'Cybersécurité et transformation digitale'
        ],
        // 👇 OPTIONS ديال IRM كيكونو غير فالمستوى 5 حسب التخصص
        options: {
          'Génie informatique et innovation technologique': [
            'Génie Logiciel',
            'IA & Data Science',
            'DevOps & Cloud',
            'Full Stack'
          ],
          'Cybersécurité et transformation digitale': [
            'Sécurité Réseaux',
            'Audit & Gouvernance',
            'Cloud & Data Center',
            "Management des Systèmes d'Information"
          ]
        }
      }
    }
  },

  CYCLE_INGENIEUR: {
    nom: "CYCLE_INGENIEUR",
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
        // 👇 OPTIONS حسب التخصص (كتبان خصوصاً فالسنة 5)
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
            "Structures & Ouvrages d'art",
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
    niveauFixe: 3, // 👈 LP ديما المستوى 3
    // نفس التخصصات كما فالـbackend
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
      'Informatique – Cnam',
      'Achat & Logistique'
    ],
    // نفس الOPTIONS كما فالتحقق ديال الباك
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
    niveauFixe: 4, // 👈 MP ديما المستوى 4
    // نفس التخصصات كما فالـbackend
    specialites: [
      'Informatique, Data Sciences, Cloud, Cybersécurité & Intelligence Artificielle (DU IDCIA)',
      'QHSSE & Performance Durable',
      'Achat, Logistique et Supply Chain Management',
      "Management des Systèmes d'Information",
      'Big Data et Intelligence Artificielle',
      'Cybersécurité et Transformation Digitale',
      'Génie Informatique et Innovation Technologique',
      'Finance, Audit & Entrepreneuriat',
      'Développement Commercial et Marketing Digital'
    ],
    // نفس الOPTIONS كما فالتحقق ديال الباك
    options: {
      'Cybersécurité et Transformation Digitale': [
        'Systèmes de communication et Data center',
        "Management des Systèmes d'Information"
      ],
      'Génie Informatique et Innovation Technologique': [
        'Génie Logiciel',
        'Intelligence Artificielle et Data Science'
      ]
    }
  }
};


const FILIERE_BY_MODE = {
  FI: ['MASI', 'IRM', 'CYCLE_INGENIEUR'],
  TA: ['MASI', 'IRM', 'CYCLE_INGENIEUR'],
  Executive: ['LICENCE_PRO', 'MASTER_PRO'] // زِد MBA_EXEC إذا كاين
};

const getFilieresParMode = (mode) => FILIERE_BY_MODE[mode] || [];

// Fonctions utilitaires pour la formation adaptées au nouveau modèle
// Fonctions utilitaires pour la formation adaptées au nouveau modèle
const getSpecialitesDisponibles = (filiere, niveau) => {
  const formationData = STRUCTURE_FORMATION[filiere];
  if (!formationData) return [];
  
  // Pour LICENCE_PRO et MASTER_PRO, retourner toutes les spécialités
  if (filiere === 'LICENCE_PRO' || filiere === 'MASTER_PRO') {
    return formationData.specialites || [];
  }
  
  // Pour MASI et IRM, logique basée sur le niveau (selon validation backend)
  const niveauInt = parseInt(niveau);
  if (niveauInt < 3) return [];
  
  if (filiere === 'MASI') {
    if (niveauInt === 3) {
      return ['Entreprenariat, audit et finance', 'Développement commercial et marketing digital'];
    } else if (niveauInt >= 4) {
      return ['Management des affaires et systèmes d\'information'];
    }
  }
  
  if (filiere === 'IRM') {
    if (niveauInt === 3) {
      return ['Développement informatique', 'Réseaux et cybersécurité'];
    } else if (niveauInt >= 4) {
      return ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale'];
    }
  }
  
  return formationData.specialites || [];
};

const getOptionsDisponibles = (filiere, niveau, specialite) => {
  if (!filiere || !STRUCTURE_FORMATION[filiere]) return [];
  
  const formationData = STRUCTURE_FORMATION[filiere];
  
  // Pour LICENCE_PRO et MASTER_PRO, retourner les options spécifiques à la spécialité
  if (filiere === 'LICENCE_PRO' || filiere === 'MASTER_PRO') {
    if (!specialite) return [];
    return formationData.options[specialite] || [];
  }
  
  // Pour MASI et IRM - options disponibles seulement en 5ème année
if (!specialite || String(niveau) !== '5') return [];  
  const niveauData = formationData.niveaux[5];
  return niveauData && niveauData.options && niveauData.options[specialite] 
    ? niveauData.options[specialite] 
    : [];
};

// Fonction pour obtenir le cycle selon le niveau (pour École d'Ingénieur)
const getCycleParNiveau = (niveau) => {
  const niveauInt = parseInt(niveau);
  if (niveauInt <= 2) return 'Classes Préparatoires Intégrées';
  if (niveauInt >= 3) return 'Cycle Ingénieur';
  return '';
};

const getTypeFormation = (niveau) => {
  const niveauInt = parseInt(niveau);
  if (niveauInt <= 2) return 'Tronc commun';
  if (niveauInt <= 4) return 'Spécialité';
  if (niveauInt === 5) return 'Option';
  return '';
};

const isChampDisponible = (champ, filiere, niveau) => {
  const niveauInt = parseInt(niveau);
  
  switch(champ) {
    case 'specialite':
      return niveauInt >= 3 && filiere;
    case 'option':
      return niveauInt === 5 && filiere;
    default:
      return true;
  }
};

const getSpecialitesIngenieur = (cycle) => {
  if (!cycle || !STRUCTURE_FORMATION.CYCLE_INGENIEUR.cycles[cycle]) return [];
  return STRUCTURE_FORMATION.CYCLE_INGENIEUR.cycles[cycle].specialites || [];
};

const getOptionsIngenieur = (cycle, specialite) => {
  if (!cycle || !specialite || !STRUCTURE_FORMATION.CYCLE_INGENIEUR.cycles[cycle]) return [];
  const cycleData = STRUCTURE_FORMATION.CYCLE_INGENIEUR.cycles[cycle];
  return cycleData.options && cycleData.options[specialite] 
    ? cycleData.options[specialite] 
    : [];
};

const isTypeFormationIngenieur = (filiere) => {
  return filiere === 'CYCLE_INGENIEUR';
};

const isChampDisponibleIngenieur = (champ, filiere, niveau, cycle) => {
  if (!isTypeFormationIngenieur(filiere)) return false;
  const niveauInt = parseInt(niveau);
  switch(champ) {
    case 'cycle':
      return true;
    case 'specialiteIngenieur':
      return cycle === 'Cycle Ingénieur' && niveauInt >= 3;
    case 'optionIngenieur':
      return cycle === 'Cycle Ingénieur' && niveauInt === 5;
    default:
      return true;
  }
};

// Handler de changement de formation compatible ingénieur
// Fonction de gestion des changements de formation adaptée au nouveau modèle backend
const handleFormationChange = (formSetter, currentForm) => (field, value) => {
  const newForm = { ...currentForm };
  
  if (field === 'niveauFormation') {
    newForm.niveauFormation = value;
    // Reset tout quand on change le mode
    newForm.filiere = '';
    newForm.niveau = '';
    newForm.cycle = undefined; // Important : undefined au lieu de ''
    newForm.specialite = '';
    newForm.option = '';
    newForm.specialiteIngenieur = undefined;
    newForm.optionIngenieur = undefined;
    newForm.specialiteLicencePro = undefined;
    newForm.optionLicencePro = undefined;
    newForm.specialiteMasterPro = undefined;
    newForm.optionMasterPro = undefined;
    newForm.cours = [];
  }
  
  if (field === 'filiere') {
    newForm.filiere = value;
    newForm.cours = [];
    
    // SOLUTION : Reset explicite selon le type de filière
    if (value === 'MASI' || value === 'IRM') {
      // Pour MASI/IRM : pas de cycle ni de champs ingénieur
      delete newForm.cycle;
      delete newForm.specialiteIngenieur;
      delete newForm.optionIngenieur;
      delete newForm.specialiteLicencePro;
      delete newForm.optionLicencePro;
      delete newForm.specialiteMasterPro;
      delete newForm.optionMasterPro;
    } else if (value === 'CYCLE_INGENIEUR') {
      // Pour CYCLE_INGENIEUR : reset les autres
      delete newForm.specialiteLicencePro;
      delete newForm.optionLicencePro;
      delete newForm.specialiteMasterPro;
      delete newForm.optionMasterPro;
      delete newForm.specialite;
      delete newForm.option;
      // Le cycle sera défini automatiquement selon le niveau
    } else if (value === 'LICENCE_PRO') {
      // Pour LICENCE_PRO : niveau fixe 3
      newForm.niveau = '3';
      delete newForm.cycle;
      delete newForm.specialiteIngenieur;
      delete newForm.optionIngenieur;
      delete newForm.specialiteMasterPro;
      delete newForm.optionMasterPro;
      delete newForm.specialite;
      delete newForm.option;
    } else if (value === 'MASTER_PRO') {
      // Pour MASTER_PRO : niveau fixe 4
      newForm.niveau = '4';
      delete newForm.cycle;
      delete newForm.specialiteIngenieur;
      delete newForm.optionIngenieur;
      delete newForm.specialiteLicencePro;
      delete newForm.optionLicencePro;
      delete newForm.specialite;
      delete newForm.option;
    }
    
    // Réinitialiser les champs génériques
    newForm.specialite = '';
    newForm.option = '';
    
  } else if (field === 'niveau') {
    newForm.niveau = value;
    newForm.cours = []; // reset classe quand on change de niveau
    
    // Pour CYCLE_INGENIEUR seulement, définir le cycle
    if (newForm.filiere === 'CYCLE_INGENIEUR') {
      const nouveauCycle = getCycleParNiveau(value);
      newForm.cycle = nouveauCycle;
      
      // Réinitialiser les spécialités/options selon le cycle
      if (nouveauCycle === 'Classes Préparatoires Intégrées') {
        delete newForm.specialiteIngenieur;
        delete newForm.optionIngenieur;
      } else if (nouveauCycle === 'Cycle Ingénieur') {
        // Vérifier si la spécialité actuelle est toujours valide
        const specialitesDisponibles = getSpecialitesIngenieur(nouveauCycle);
        if (!specialitesDisponibles.includes(newForm.specialiteIngenieur)) {
          delete newForm.specialiteIngenieur;
        }
        
        // Réinitialiser l'option si pas en 5ème année
        if (parseInt(value) !== 5) {
          delete newForm.optionIngenieur;
        }
      }
    } else {
      // Pour MASI/IRM : gérer spécialités/options selon niveau
      if ((newForm.filiere === 'MASI' || newForm.filiere === 'IRM')) {
        const niveauInt = parseInt(value);
        if (niveauInt <= 2) {
          newForm.specialite = '';
          newForm.option = '';
        } else if (niveauInt <= 4) {
          newForm.option = '';
          // Vérifier si la spécialité actuelle est toujours valide
          const specialitesDisponibles = getSpecialitesDisponibles(newForm.filiere, value);
          if (!specialitesDisponibles.includes(newForm.specialite)) {
            newForm.specialite = '';
          }
        }
        // Important : s'assurer qu'il n'y a pas de cycle
        delete newForm.cycle;
      }
    }
    
  } else if (field === 'specialiteIngenieur') {
    newForm.specialiteIngenieur = value;
    // Réinitialiser l'option d'ingénieur
    delete newForm.optionIngenieur;
    
  } else if (field === 'optionIngenieur') {
    newForm.optionIngenieur = value;
    
  } else if (field === 'specialiteLicencePro') {
    newForm.specialiteLicencePro = value;
    // Réinitialiser l'option Licence Pro
    delete newForm.optionLicencePro;
    
  } else if (field === 'optionLicencePro') {
    newForm.optionLicencePro = value;
    
  } else if (field === 'specialiteMasterPro') {
    newForm.specialiteMasterPro = value;
    // Réinitialiser l'option Master Pro
    delete newForm.optionMasterPro;
    
  } else if (field === 'optionMasterPro') {
    newForm.optionMasterPro = value;
    
  } else if (field === 'specialite') {
    newForm.specialite = value;
    // Réinitialiser l'option
    const optionsDisponibles = getOptionsDisponibles(newForm.filiere, newForm.niveau, value);
    if (!optionsDisponibles.includes(newForm.option)) {
      newForm.option = '';
    }
    
  } else if (field === 'option') {
    newForm.option = value;
    
  } else {
    // Pour tous les autres champs
    newForm[field] = value;
  }
  
  formSetter(newForm);
};

const handleFormationChangeIngenieurCorrige = (formSetter, currentForm) => (field, value) => {
  const newForm = { ...currentForm };
  
  if (field === 'niveau') {
    newForm.niveau = value;
    if (isTypeFormationIngenieur(newForm.filiere)) {
      const nouveauCycle = getCycleParNiveau(value);
      newForm.cycle = nouveauCycle;
      if (nouveauCycle === 'Classes Préparatoires Intégrées') {
        newForm.specialiteIngenieur = '';
        newForm.optionIngenieur = '';
      } else if (nouveauCycle === 'Cycle Ingénieur') {
        const specialitesDisponibles = getSpecialitesIngenieur(nouveauCycle);
        if (!specialitesDisponibles.includes(newForm.specialiteIngenieur)) {
          newForm.specialiteIngenieur = '';
        }
        if (parseInt(value) !== 5) {
          newForm.optionIngenieur = '';
        }
      }
    } else if (newForm.filiere !== 'LICENCE_PRO' && newForm.filiere !== 'MASTER_PRO') {
      // Logique pour MASI et IRM seulement
      const niveauInt = parseInt(value);
      if (niveauInt <= 2) {
        newForm.specialite = '';
        newForm.option = '';
      } else if (niveauInt <= 4) {
        newForm.option = '';
        const specialitesDisponibles = getSpecialitesDisponibles(newForm.filiere, value);
        if (!specialitesDisponibles.includes(newForm.specialite)) {
          newForm.specialite = '';
        }
      }
    }
  } else if (field === 'filiere') {
    newForm.filiere = value;
    
    // Réinitialiser tous les champs de formation
    newForm.cycle = '';
    newForm.specialiteIngenieur = '';
    newForm.optionIngenieur = '';
    newForm.specialite = '';
    newForm.option = '';
    newForm.specialiteLicencePro = '';
    newForm.optionLicencePro = '';
    newForm.specialiteMasterPro = '';
    newForm.optionMasterPro = '';
    
    // Pour les licences et masters professionnels, ne pas réinitialiser le niveau
    if (value === 'LICENCE_PRO' || value === 'MASTER_PRO') {
      // Garder le niveau actuel ou le vider selon le besoin
      // newForm.niveau = ''; // Décommentez si vous voulez vider le niveau
    } else if (value !== 'LICENCE_PRO' && value !== 'MASTER_PRO') {
      // Pour les autres filières, réinitialiser le niveau
      newForm.niveau = '';
    }
    
    if (isTypeFormationIngenieur(value)) {
      const cycleInitial = getCycleParNiveau(newForm.niveau) || '';
      newForm.cycle = cycleInitial;
    }
  } else if (field === 'cycle') {
    newForm.cycle = value;
    newForm.specialiteIngenieur = '';
    newForm.optionIngenieur = '';
  } else if (field === 'specialiteIngenieur') {
    newForm.specialiteIngenieur = value;
    const optionsDisponibles = getOptionsIngenieur(newForm.cycle, value);
    if (!optionsDisponibles.includes(newForm.optionIngenieur)) {
      newForm.optionIngenieur = '';
    }
  } else if (field === 'optionIngenieur') {
    newForm.optionIngenieur = value;
  } else if (field === 'specialiteLicencePro') {
    newForm.specialiteLicencePro = value;
    // Réinitialiser l'option si elle n'est plus disponible
    const formationData = STRUCTURE_FORMATION[newForm.filiere];
    if (formationData && formationData.options[value] && !formationData.options[value].includes(newForm.optionLicencePro)) {
      newForm.optionLicencePro = '';
    }
  } else if (field === 'optionLicencePro') {
    newForm.optionLicencePro = value;
  } else if (field === 'specialiteMasterPro') {
    newForm.specialiteMasterPro = value;
    // Réinitialiser l'option si elle n'est plus disponible
    const formationData = STRUCTURE_FORMATION[newForm.filiere];
    if (formationData && formationData.options[value] && !formationData.options[value].includes(newForm.optionMasterPro)) {
      newForm.optionMasterPro = '';
    }
  } else if (field === 'optionMasterPro') {
    newForm.optionMasterPro = value;
  } else if (field === 'specialite') {
    newForm.specialite = value;
    const optionsDisponibles = getOptionsDisponibles(newForm.filiere, newForm.niveau, value);
    if (!optionsDisponibles.includes(newForm.option)) {
      newForm.option = '';
    }
  } else {
    newForm[field] = value;
  }
  
  formSetter(newForm);
};

const genererAnneeScolaireActuelle = () => {
  const anneeActuelle = new Date().getFullYear();
  const moisActuel = new Date().getMonth() + 1; // JavaScript months are 0-indexed
  
  // Si nous sommes entre septembre et décembre, l'année scolaire commence cette année
  // Sinon, elle a commencé l'année précédente
  const anneeDebut = moisActuel >= 9 ? anneeActuelle : anneeActuelle - 1;
  const anneeFin = anneeDebut + 1;
  
  return `${anneeDebut}/${anneeFin}`;
};

// 3. Fonction de validation de l'année scolaire
const validerAnneeScolaire = (anneeScolaire) => {
  if (!anneeScolaire) return "L'année scolaire est obligatoire";
  
  const regex = /^\d{4}\/\d{4}$/;
  if (!regex.test(anneeScolaire)) {
    return "L'année scolaire doit être au format YYYY/YYYY (ex: 2025/2026)";
  }
  
  const [annee1, annee2] = anneeScolaire.split('/').map(Number);
  if (annee2 !== annee1 + 1) {
    return "La deuxième année doit être consécutive à la première (ex: 2025/2026)";
  }
  
  return null; // Validation réussie
};

// Fonction de validation complète adaptée au nouveau modèle backend
const validerFormationComplete = (form) => {
  const erreurs = [];
  // المود ضروري
if (!form.niveauFormation) {
  erreurs.push('Le type de formation (FI/TA/Executive) est obligatoire');
} else {
  // الفِيليير مختارة خصها تكون مسموحة لهاد المود
  const allowed = new Set(getFilieresParMode(form.niveauFormation));
  if (form.filiere && !allowed.has(form.filiere)) {
    erreurs.push(`La filière "${form.filiere}" n'est pas autorisée pour ${form.niveauFormation}`);
  }
}

  if (!form.filiere) {
    erreurs.push('La filière est obligatoire');
    return erreurs;
  }

  // Validation spécifique pour LICENCE_PRO (niveau 3 auto-assigné)
  if (form.filiere === 'LICENCE_PRO') {
    if (!form.specialiteLicencePro) {
      erreurs.push('Une spécialité Licence Pro est obligatoire');
    }
    
    const formationData = STRUCTURE_FORMATION.LICENCE_PRO;
    if (form.specialiteLicencePro && !formationData.specialites.includes(form.specialiteLicencePro)) {
      erreurs.push('Cette spécialité n\'est pas disponible pour la Licence Pro');
    }
    
    const optionsDisponibles = formationData.options[form.specialiteLicencePro] || [];
    if (optionsDisponibles.length > 0 && !form.optionLicencePro) {
      erreurs.push('Une option Licence Pro est obligatoire pour cette spécialité');
    }
    
    if (form.optionLicencePro && !optionsDisponibles.includes(form.optionLicencePro)) {
      erreurs.push('Cette option n\'est pas disponible pour cette spécialité Licence Pro');
    }
    
    return erreurs;
  }
  
  // Validation spécifique pour MASTER_PRO (niveau 4 auto-assigné)
  if (form.filiere === 'MASTER_PRO') {
    if (!form.specialiteMasterPro) {
      erreurs.push('Une spécialité Master Pro est obligatoire');
    }
    
    const formationData = STRUCTURE_FORMATION.MASTER_PRO;
    if (form.specialiteMasterPro && !formationData.specialites.includes(form.specialiteMasterPro)) {
      erreurs.push('Cette spécialité n\'est pas disponible pour le Master Pro');
    }
    
    const optionsDisponibles = formationData.options[form.specialiteMasterPro] || [];
    if (optionsDisponibles.length > 0 && !form.optionMasterPro) {
      erreurs.push('Une option Master Pro est obligatoire pour cette spécialité');
    }
    
    if (form.optionMasterPro && !optionsDisponibles.includes(form.optionMasterPro)) {
      erreurs.push('Cette option n\'est pas disponible pour cette spécialité Master Pro');
    }
    
    return erreurs;
  }

  // Validation pour les formations avec niveau manuel (MASI, IRM, CYCLE_INGENIEUR)
  if (!form.niveau) {
    erreurs.push('Le niveau est obligatoire');
    return erreurs;
  }
  
  const niveauInt = parseInt(form.niveau);
  
  if (isTypeFormationIngenieur(form.filiere)) {
    // Validation pour École d'Ingénieur
    if (!form.cycle) {
      erreurs.push('Le cycle est obligatoire pour la formation d\'ingénieur');
    }
    if (form.cycle === 'Cycle Ingénieur' && niveauInt >= 3 && !form.specialiteIngenieur) {
      erreurs.push('Une spécialité d\'ingénieur est obligatoire à partir de la 3ème année');
    }
    if (form.cycle === 'Cycle Ingénieur' && niveauInt === 5 && !form.optionIngenieur) {
      erreurs.push('Une option d\'ingénieur est obligatoire en 5ème année');
    }
    
    const cycleAttendu = getCycleParNiveau(form.niveau);
    if (form.cycle !== cycleAttendu) {
      erreurs.push(`Le cycle "${form.cycle}" ne correspond pas au niveau ${form.niveau}`);
    }
    
    if (form.cycle === 'Cycle Ingénieur' && form.specialiteIngenieur && form.optionIngenieur) {
      const optionsDisponibles = getOptionsIngenieur(form.cycle, form.specialiteIngenieur);
      if (!optionsDisponibles.includes(form.optionIngenieur)) {
        erreurs.push('Cette option n\'est pas disponible pour cette spécialité d\'ingénieur');
      }
    }
  } else {
    // Pour MASI et IRM
    if (niveauInt >= 3 && !form.specialite) {
      erreurs.push('Une spécialité est obligatoire à partir de la 3ème année pour ' + form.filiere);
    }
    if (niveauInt === 5 && !form.option) {
      erreurs.push('Une option est obligatoire en 5ème année pour ' + form.filiere);
    }
    
    if (form.filiere && form.niveau && form.specialite) {
      const specialitesDisponibles = getSpecialitesDisponibles(form.filiere, form.niveau);
      if (!specialitesDisponibles.includes(form.specialite)) {
        erreurs.push('Cette spécialité n\'est pas disponible pour ce niveau et cette filière');
      }
    }
    
    if (form.filiere && parseInt(form.niveau) === 5

 && form.specialite && form.option) {
      const optionsDisponibles = getOptionsDisponibles(form.filiere, form.niveau, form.specialite);
      if (!optionsDisponibles.includes(form.option)) {
        erreurs.push('Cette option n\'est pas disponible pour cette spécialité');
      }
    }
  }
  
  return erreurs;
};
const getCoursFiltre = (listeCours, form) => {
  if (!form.filiere || !listeCours.length) return [];
  const candidats = buildCoursCandidates(form);
  if (!candidats.length) return [];
  
  return listeCours.filter(cours => {
    const nomCours = normalize(cours.nom || cours);
    return candidats.some(candidat => {
      const nc = normalize(candidat);
      return nomCours.includes(nc) || nc.includes(nomCours);
    });
  });
};
// Génération du code étudiant compatible ingénieur
const genererCodeEtudiantMisAJour = (form) => {
  if (!form.filiere || !form.prenom || !form.nomDeFamille) {
    return '';
  }
  
  const annee = new Date().getFullYear();
  let filiereCode;
  
  if (isTypeFormationIngenieur(form.filiere)) {
    if (form.specialiteIngenieur) {
      const codeSpecialite = {
        'Génie Informatique': 'GI',
        'Génie Mécatronique': 'GM',
        'Génie Civil': 'GC'
      };
      filiereCode = codeSpecialite[form.specialiteIngenieur] || 'ING';
    } else {
      filiereCode = 'ING';
    }
  } else if (form.filiere === 'LICENCE_PRO') {
    filiereCode = 'LP';
  } else if (form.filiere === 'MASTER_PRO') {
    filiereCode = 'MP';
  } else {
    filiereCode = form.filiere;
  }
  
  const niveau = form.niveau || '';
  const initiales = (form.prenom.charAt(0) + form.nomDeFamille.charAt(0)).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${filiereCode}${niveau}${annee}${initiales}${timestamp}`;
};

// Composant FormationSelector adapté au nouveau modèle backend
const FormationSelector = ({ form, onChange, prefix = '' }) => {
  const formationData = form.filiere ? STRUCTURE_FORMATION[form.filiere] : null;
  const isIngenieur = form.filiere === 'CYCLE_INGENIEUR';
  const hasNiveauFixe = formationData && !formationData.niveauxManuels;
  const allowedFilieres = getFilieresParMode(form.niveauFormation || '');

  // Pour les formations avec niveau auto-assigné, afficher le niveau fixe
  const niveauAffiche = hasNiveauFixe ? formationData.niveauFixe : form.niveau;
  
  return (
    <div className="formation-selector">
      <div className="form-row">
       <div className="form-group">
  <label>Filière *</label>
  <select
    name="filiere"
    value={form.filiere}
    onChange={(e) => onChange('filiere', e.target.value)}
    required
    disabled={!form.niveauFormation} // ما نسمحش بالاختيار قبل ما يختار المود
  >
    {!form.niveauFormation ? (
      <option value="">Choisissez d'abord FI / TA / Executive</option>
    ) : (
      <>
        <option value="">Sélectionner le type de formation...</option>
        {allowedFilieres.map((key) => (
          <option key={key} value={key}>
            {STRUCTURE_FORMATION[key]?.nom || key}
          </option>
        ))}
      </>
    )}
  </select>
  {!form.niveauFormation && (
    <small style={{color:'#666'}}>Veuillez choisir le mode (FI / TA / Executive) d'abord</small>
  )}
</div>

        
        {/* Niveau - manuel pour certaines formations, auto-assigné pour d'autres */}
        <div className="form-group">
          <label>
            Niveau
            {hasNiveauFixe && (
              <span className="auto-assigned"> (Auto-assigné)</span>
            )}
          </label>
          {hasNiveauFixe ? (
            <input
              type="text"
              value={`Niveau ${niveauAffiche}`}
              disabled
              style={{ backgroundColor: '#f0f0f0', color: '#666' }}
            />
          ) : (
            <select
              name="niveau"
              value={form.niveau || ''}
              onChange={(e) => onChange('niveau', e.target.value)}
              required={form.filiere && !hasNiveauFixe}
            >
              <option value="">Sélectionner le niveau...</option>
              <option value="1">1ère année</option>
              <option value="2">2ème année</option>
              <option value="3">3ème année</option>
              <option value="4">4ème année</option>
              <option value="5">5ème année</option>
            </select>
          )}
        </div>
      </div>
      
      {/* Cycle pour École d'Ingénieur */}
      {isIngenieur && form.niveau && (
        <div className="form-group">
          <label>Cycle *</label>
          <input
            type="text"
            value={form.cycle || getCycleParNiveau(form.niveau)}
            disabled
            style={{ backgroundColor: '#f0f0f0', color: '#666' }}
          />
          <small style={{color: '#666', fontSize: '12px'}}>
            Le cycle est déterminé automatiquement selon le niveau
          </small>
        </div>
      )}
      
      {/* Spécialité d'Ingénieur */}
      {isIngenieur && form.niveau >= 3 && (
        <div className="form-group">
          <label>Spécialité d'Ingénieur *</label>
          <select
            name="specialiteIngenieur"
            value={form.specialiteIngenieur || ''}
            onChange={(e) => onChange('specialiteIngenieur', e.target.value)}
            required
          >
            <option value="">Sélectionner la spécialité...</option>
            {formationData.cycles['Cycle Ingénieur'].specialites.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Option d'Ingénieur */}
{isIngenieur && Number(form.niveau) === 5 && form.specialiteIngenieur && (
        <div className="form-group">
          <label>Option d'Ingénieur *</label>
          <select
            name="optionIngenieur"
            value={form.optionIngenieur || ''}
            onChange={(e) => onChange('optionIngenieur', e.target.value)}
            required
          >
            <option value="">Sélectionner l'option...</option>
            {formationData.cycles['Cycle Ingénieur'].options[form.specialiteIngenieur]?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Spécialité Licence Pro */}
      {form.filiere === 'LICENCE_PRO' && (
        <div className="form-group">
          <label>Spécialité Licence Pro *</label>
          <select
            name="specialiteLicencePro"
            value={form.specialiteLicencePro || ''}
            onChange={(e) => onChange('specialiteLicencePro', e.target.value)}
            required
          >
            <option value="">Sélectionner une spécialité...</option>
            {formationData.specialites.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Option Licence Pro */}
      {form.filiere === 'LICENCE_PRO' && form.specialiteLicencePro && formationData.options[form.specialiteLicencePro] && (
        <div className="form-group">
          <label>Option Licence Pro</label>
          <select
            name="optionLicencePro"
            value={form.optionLicencePro || ''}
            onChange={(e) => onChange('optionLicencePro', e.target.value)}
          >
            <option value="">Sélectionner une option...</option>
            {formationData.options[form.specialiteLicencePro].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Spécialité Master Pro */}
      {form.filiere === 'MASTER_PRO' && (
        <div className="form-group">
          <label>Spécialité Master Pro *</label>
          <select
            name="specialiteMasterPro"
            value={form.specialiteMasterPro || ''}
            onChange={(e) => onChange('specialiteMasterPro', e.target.value)}
            required
          >
            <option value="">Sélectionner une spécialité...</option>
            {formationData.specialites.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Option Master Pro */}
      {form.filiere === 'MASTER_PRO' && form.specialiteMasterPro && formationData.options[form.specialiteMasterPro] && (
        <div className="form-group">
          <label>Option Master Pro</label>
          <select
            name="optionMasterPro"
            value={form.optionMasterPro || ''}
            onChange={(e) => onChange('optionMasterPro', e.target.value)}
          >
            <option value="">Sélectionner une option...</option>
            {formationData.options[form.specialiteMasterPro].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Spécialité pour MASI/IRM */}
      {(form.filiere === 'MASI' || form.filiere === 'IRM') && Number(form.niveau) >= 3 && (
        <div className="form-group">
          <label>Spécialité *</label>
          <select
            name="specialite"
            value={form.specialite || ''}
            onChange={(e) => onChange('specialite', e.target.value)}
            required
          >
            <option value="">Sélectionner la spécialité...</option>
            {getSpecialitesDisponibles(form.filiere, form.niveau).map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Option pour MASI/IRM */}
      {(form.filiere === 'MASI' || form.filiere === 'IRM') && parseInt(form.niveau) === 5

 && form.specialite && (

        <div className="form-group">
          <label>Option *</label>
          <select
            name="option"
            value={form.option || ''}
            onChange={(e) => onChange('option', e.target.value)}
            required
          >
            <option value="">Sélectionner l'option...</option>
            {getOptionsDisponibles(form.filiere, form.niveau, form.specialite).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Indicateur de parcours */}
      {form.filiere && (
        <div className="parcours-indicator">
          <h5>Parcours sélectionné :</h5>
          <div className="parcours-path">
            <span className="parcours-item filiere">
              {formationData?.nom || form.filiere}
            </span>
            {niveauAffiche && (
              <>
                <span className="parcours-arrow">→</span>
                <span className="parcours-item niveau">
                  Niveau {niveauAffiche}
                  {hasNiveauFixe && <small> (auto)</small>}
                </span>
              </>
            )}
            {form.cycle && (
              <>
                <span className="parcours-arrow">→</span>
                <span className="parcours-item cycle">{form.cycle}</span>
              </>
            )}
            {(form.specialiteIngenieur || form.specialiteLicencePro || form.specialiteMasterPro || form.specialite) && (
              <>
                <span className="parcours-arrow">→</span>
                <span className="parcours-item specialite">
                  {form.specialiteIngenieur || form.specialiteLicencePro || form.specialiteMasterPro || form.specialite}
                </span>
              </>
            )}
            {(form.optionIngenieur || form.optionLicencePro || form.optionMasterPro || form.option) && (
              <>
                <span className="parcours-arrow">→</span>
                <span className="parcours-item option">
                  {form.optionIngenieur || form.optionLicencePro || form.optionMasterPro || form.option}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ListeEtudiants = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [etudiantsFiltres, setEtudiantsFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreGenre, setFiltreGenre] = useState('');
  const [filtreCours, setFiltreCours] = useState('');
  const [filtreActif, setFiltreActif] = useState('');
  const [filtreCommercial, setFiltreCommercial] = useState('');
  const [filtreAnneeScolaire, setFiltreAnneeScolaire] = useState('');
  const [filtrePartner, setFiltrePartner] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [etudiantsParPage] = useState(10);
  const [loading, setLoading] = useState(true);
  
  // États pour le verrouillage de l'auto-sélection des cours
  const [lockCoursAjout, setLockCoursAjout] = useState(false);
  const [lockCoursModifier, setLockCoursModifier] = useState(false);
  
  // États pour le modal d'ajout
  const [showModal, setShowModal] = useState(false);
  const [formAjout, setFormAjout] = useState({
    prenom: '',
    nomDeFamille: '',
    genre: 'Homme',
    dateNaissance: '',
    telephone: '',
    email: '',
    motDePasse: '',
    cin: '',
    passeport: '',
    anneeScolaire: genererAnneeScolaireActuelle(),
    lieuNaissance: '',
    pays: '',
    cours: [],
    niveau: '',
    niveauFormation: '',
    filiere: '',
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
    modePaiement: 'mensuel',
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
    // Nouveaux champs pour le modèle backend
    specialiteLicencePro: '',
    optionLicencePro: '',
    specialiteMasterPro: '',
    optionMasterPro: '',
    // Nouveaux champs supplémentaires
    telephoneResponsable: '',
    codeBaccalaureat: '',
    codeMassar: '',
    // Nouveaux champs Partner
    isPartner: false,
    prixTotalPartner: ''
  });
  
  const [vueMode, setVueMode] = useState('tableau');
  const [imageFile, setImageFile] = useState(null);
  const [listeCours, setListeCours] = useState([]);
  const [listeCommerciaux, setListeCommerciaux] = useState([]);
  const [messageAjout, setMessageAjout] = useState('');
  const [loadingAjout, setLoadingAjout] = useState(false);
  
  // États pour le modal de visualisation
  const [showViewModal, setShowViewModal] = useState(false);
  const [etudiantSelectionne, setEtudiantSelectionne] = useState(null);
  
  // États pour le modal de modification
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [formModifier, setFormModifier] = useState({
    prenom: '',
    nomDeFamille: '',
    genre: 'Homme',
    dateNaissance: '',
    anneeScolaire: genererAnneeScolaireActuelle(),
    telephone: '',
    email: '',
    motDePasse: '',
    cin: '',
    passeport: '',
    lieuNaissance: '',
    pays: '',
    cours: [],
    niveau: '',
    niveauFormation: '',
    filiere: '',
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
    modePaiement: 'mensuel',
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
    // Nouveaux champs pour le modèle backend
    specialiteLicencePro: '',
    optionLicencePro: '',
    specialiteMasterPro: '',
    optionMasterPro: '',
    // Nouveaux champs supplémentaires
    telephoneResponsable: '',
    codeBaccalaureat: '',
    codeMassar: '',
    // Nouveaux champs Partner
    isPartner: false,
    prixTotalPartner: ''
  });
  
  const [imageFileModifier, setImageFileModifier] = useState(null);
  const [messageModifier, setMessageModifier] = useState('');
  const [loadingModifier, setLoadingModifier] = useState(false);
  const [etudiantAModifier, setEtudiantAModifier] = useState(null);
  
  // Nouveaux états pour les documents avec commentaires
  const [documentsAjout, setDocumentsAjout] = useState({
    documentCin: null,
    documentBacCommentaire: null,
    documentReleveNoteBac: null,
    documentDiplomeCommentaire: null,
    documentAttestationReussiteCommentaire: null,
    documentReleveNotesFormationCommentaire: null,
    documentPasseport: null,
    documentBacOuAttestationBacCommentaire: null,
    documentAuthentificationBac: null,
    documentAuthenticationDiplome: null,
    documentEngagementCommentaire: null
  });

  const [commentairesAjout, setCommentairesAjout] = useState({
    commentaireCin: '',
    commentaireBacCommentaire: '',
    commentaireReleveNoteBac: '',
    commentaireDiplomeCommentaire: '',
    commentaireAttestationReussiteCommentaire: '',
    commentaireReleveNotesFormationCommentaire: '',
    commentairePasseport: '',
    commentaireBacOuAttestationBacCommentaire: '',
    commentaireAuthentificationBac: '',
    commentaireAuthenticationDiplome: '',
    commentaireEngagementCommentaire: ''
  });

  const [documentsModifier, setDocumentsModifier] = useState({
    documentCin: null,
    documentBacCommentaire: null,
    documentReleveNoteBac: null,
    documentDiplomeCommentaire: null,
    documentAttestationReussiteCommentaire: null,
    documentReleveNotesFormationCommentaire: null,
    documentPasseport: null,
    documentBacOuAttestationBacCommentaire: null,
    documentAuthentificationBac: null,
    documentAuthenticationDiplome: null,
    documentEngagementCommentaire: null
  });

  const [commentairesModifier, setCommentairesModifier] = useState({
    commentaireCin: '',
    commentaireBacCommentaire: '',
    commentaireReleveNoteBac: '',
    commentaireDiplomeCommentaire: '',
    commentaireAttestationReussiteCommentaire: '',
    commentaireReleveNotesFormationCommentaire: '',
    commentairePasseport: '',
    commentaireBacOuAttestationBacCommentaire: '',
    commentaireAuthentificationBac: '',
    commentaireAuthenticationDiplome: '',
    commentaireEngagementCommentaire: ''
  });
  
  const coursFiltresModif = getCoursFiltre(listeCours, formModifier);
  const navigate = useNavigate();

  // Handlers pour la formation intelligente
  const handleFormationChangeAjout = handleFormationChange(setFormAjout, formAjout);
  const handleFormationChangeModifier = handleFormationChange(setFormModifier, formModifier);

  useEffect(() => {
    fetchEtudiants();
    fetchCours();
    fetchCommerciaux();
  }, []);

  useEffect(() => {
    filtrerEtudiants();
  }, [etudiants, recherche, filtreGenre, filtreCours, filtreActif, filtreCommercial, filtreAnneeScolaire, filtrePartner]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-assign pour AJOUT
  useEffect(() => {
    autoAssignCours(formAjout, setFormAjout, listeCours, lockCoursAjout);
  }, [
    formAjout.filiere, formAjout.niveau,
    formAjout.specialite, formAjout.option,
    formAjout.cycle, formAjout.specialiteIngenieur, formAjout.optionIngenieur,
    formAjout.specialiteLicencePro, formAjout.optionLicencePro,
    formAjout.specialiteMasterPro, formAjout.optionMasterPro,
    listeCours, lockCoursAjout
  ]);

  // Auto-assign pour MODIFICATION
  useEffect(() => {
    autoAssignCours(formModifier, setFormModifier, listeCours, lockCoursModifier);
  }, [
    formModifier.filiere, formModifier.niveau,
    formModifier.specialite, formModifier.option,
    formModifier.cycle, formModifier.specialiteIngenieur, formModifier.optionIngenieur,
    formModifier.specialiteLicencePro, formModifier.optionLicencePro,
    formModifier.specialiteMasterPro, formModifier.optionMasterPro,
    listeCours, lockCoursModifier
  ]);

  // Génération automatique du code étudiant pour l'ajout
  useEffect(() => {
    if (formAjout.filiere && formAjout.prenom && formAjout.nomDeFamille) {
      const codeGenere = genererCodeEtudiantMisAJour(formAjout);
      if (codeGenere !== formAjout.codeEtudiant) {
        setFormAjout(prev => ({ ...prev, codeEtudiant: codeGenere }));
      }
    }
  }, [formAjout.filiere, formAjout.niveau, formAjout.prenom, formAjout.nomDeFamille, formAjout.specialiteIngenieur]);

  // Génération automatique du code étudiant pour la modification
  useEffect(() => {
    if (formModifier.filiere && formModifier.prenom && formModifier.nomDeFamille) {
      const codeGenere = genererCodeEtudiantMisAJour(formModifier);
      if (!formModifier.codeEtudiant) {
        setFormModifier(prev => ({ ...prev, codeEtudiant: codeGenere }));
      }
    }
  }, [formModifier.filiere, formModifier.niveau, formModifier.prenom, formModifier.nomDeFamille, formModifier.specialiteIngenieur]);

  const fetchEtudiants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://195.179.229.230:5000/api/etudiants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEtudiants(res.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCours = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://195.179.229.230:5000/api/cours', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListeCours(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des cours:', err);
    }
  };

  const fetchCommerciaux = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://195.179.229.230:5000/api/commerciaux', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListeCommerciaux(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des commerciaux:', err);
      setListeCommerciaux([]);
    }
  };

  const filtrerEtudiants = () => {
    let resultats = etudiants;

    // Filtre par recherche (prénom, nom de famille, téléphone, email)
    if (recherche) {
      resultats = resultats.filter(e => {
        const nomComplet = `${e.prenom || ''} ${e.nomDeFamille || ''}`.toLowerCase();
        return (
          nomComplet.includes(recherche.toLowerCase()) ||
          (e.telephone && e.telephone.includes(recherche)) ||
          (e.email && e.email.toLowerCase().includes(recherche.toLowerCase())) ||
          (e.cin && e.cin.toLowerCase().includes(recherche.toLowerCase())) ||
          (e.codeMassar && e.codeMassar.toLowerCase().includes(recherche.toLowerCase())) ||
          (e.codeEtudiant && e.codeEtudiant.toLowerCase().includes(recherche.toLowerCase()))
        );
      });
    }

    if (filtreGenre) {
      resultats = resultats.filter(e => e.genre === filtreGenre);
    }

    if (filtreCours) {
      resultats = resultats.filter(e => 
        e.cours && e.cours.some(cours => cours.toLowerCase().includes(filtreCours.toLowerCase()))
      );
    }

    if (filtreActif !== '') {
      resultats = resultats.filter(e => e.actif === (filtreActif === 'true'));
    }

    if (filtreCommercial) {
      resultats = resultats.filter(e => e.commercial === filtreCommercial);
    }

    if (filtreAnneeScolaire) {
      resultats = resultats.filter(e => e.anneeScolaire === filtreAnneeScolaire);
    }

    if (filtrePartner !== '') {
      resultats = resultats.filter(e => e.isPartner === (filtrePartner === 'true'));
    }

    setEtudiantsFiltres(resultats);
    setPageActuelle(1);
  };

  // Fonctions pour le modal d'ajout
  const openModal = () => {
    setShowModal(true);
    setMessageAjout('');
    setLockCoursAjout(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormAjout({
      prenom: '',
      nomDeFamille: '',
      genre: 'Homme',
      dateNaissance: '',
      telephone: '',
      email: '',
      motDePasse: '',
      cin: '',
      passeport: '',
      anneeScolaire: genererAnneeScolaireActuelle(),
      lieuNaissance: '',
      pays: '',
      cours: [],
      niveau: '',
      niveauFormation: '',
      filiere: '',
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
      modePaiement: 'mensuel',
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
      // Nouveaux champs pour le modèle backend
      specialiteLicencePro: '',
      optionLicencePro: '',
      specialiteMasterPro: '',
      optionMasterPro: '',
      // Nouveaux champs supplémentaires
      telephoneResponsable: '',
      codeBaccalaureat: '',
      codeMassar: '',
      // Nouveaux champs Partner
      isPartner: false,
      prixTotalPartner: ''
    });
    setDocumentsAjout({
      documentCin: null,
      documentBacCommentaire: null,
      documentReleveNoteBac: null,
      documentDiplomeCommentaire: null,
      documentAttestationReussiteCommentaire: null,
      documentReleveNotesFormationCommentaire: null,
      documentPasseport: null,
      documentBacOuAttestationBacCommentaire: null,
      documentAuthentificationBac: null,
      documentAuthenticationDiplome: null,
      documentEngagementCommentaire: null
    });
    setCommentairesAjout({
      commentaireCin: '',
      commentaireBacCommentaire: '',
      commentaireReleveNoteBac: '',
      commentaireDiplomeCommentaire: '',
      commentaireAttestationReussiteCommentaire: '',
      commentaireReleveNotesFormationCommentaire: '',
      commentairePasseport: '',
      commentaireBacOuAttestationBacCommentaire: '',
      commentaireAuthentificationBac: '',
      commentaireAuthenticationDiplome: '',
      commentaireEngagementCommentaire: ''
    });
    setImageFile(null);
    setMessageAjout('');
    setLockCoursAjout(false);
  };
const coursFiltres = getCoursFiltre(listeCours, formAjout);

  // Fonctions pour le modal de modification
  const openEditModal = (etudiant) => {
    console.log('🔍 Données étudiant reçues:', etudiant); // Pour débugger
    
    setEtudiantAModifier(etudiant);
    setFormModifier({
      prenom: etudiant.prenom || '',
      nomDeFamille: etudiant.nomDeFamille || '',
      genre: etudiant.genre || 'Homme',
      dateNaissance: etudiant.dateNaissance ? etudiant.dateNaissance.slice(0, 10) : '',
      telephone: etudiant.telephone || '',
      email: etudiant.email || '',
      motDePasse: '', // Toujours vide pour modification
      cin: etudiant.cin || '',
      passeport: etudiant.passeport || '',
      lieuNaissance: etudiant.lieuNaissance || '',
      pays: etudiant.pays || '',
      cours: etudiant.cours || [],
      niveau: etudiant.niveau != null ? String(etudiant.niveau) : '',
      niveauFormation: etudiant.niveauFormation || '',
      filiere: etudiant.filiere || '',
      option: etudiant.option || '',
      specialite: etudiant.specialite || '',
      typeDiplome: etudiant.typeDiplome || '',
      diplomeAcces: etudiant.diplomeAcces || '',
      specialiteDiplomeAcces: etudiant.specialiteDiplomeAcces || '',
      mention: etudiant.mention || '',
      anneeScolaire: etudiant.anneeScolaire || genererAnneeScolaireActuelle(),
      lieuObtentionDiplome: etudiant.lieuObtentionDiplome || '',
      serieBaccalaureat: etudiant.serieBaccalaureat || '',
      anneeBaccalaureat: etudiant.anneeBaccalaureat || '',
      premiereAnneeInscription: etudiant.premiereAnneeInscription || '',
      sourceInscription: etudiant.sourceInscription || '',
      dateInscription: etudiant.dateInscription ? etudiant.dateInscription.slice(0, 10) : '',
      typePaiement: etudiant.typePaiement || '',
      modePaiement: etudiant.modePaiement || 'mensuel',
      prixTotal: etudiant.prixTotal || '',
      pourcentageBourse: etudiant.pourcentageBourse || '',
      situation: etudiant.situation || '',
      codeEtudiant: etudiant.codeEtudiant || '',
      dateEtReglement: etudiant.dateEtReglement || '',
      actif: etudiant.actif ?? true,
      nouvelleInscription: etudiant.nouvelleInscription ?? true,
      paye: etudiant.paye ?? false,
      handicape: etudiant.handicape ?? false,
      resident: etudiant.resident ?? false,
      fonctionnaire: etudiant.fonctionnaire ?? false,
      mobilite: etudiant.mobilite ?? false,
      commercial: etudiant.commercial || '',
      cycle: etudiant.cycle || '',
      specialiteIngenieur: etudiant.specialiteIngenieur || '',
      optionIngenieur: etudiant.optionIngenieur || '',
      
      // 🔥 SOLUTION : Pré-remplir avec les données existantes
      specialiteLicencePro: etudiant.specialiteLicencePro || '',
      optionLicencePro: etudiant.optionLicencePro || '',
      specialiteMasterPro: etudiant.specialiteMasterPro || '',
      optionMasterPro: etudiant.optionMasterPro || '',
      // Nouveaux champs supplémentaires
      telephoneResponsable: etudiant.telephoneResponsable || '',
      codeBaccalaureat: etudiant.codeBaccalaureat || '',
      codeMassar: etudiant.codeMassar || '',
      // Nouveaux champs Partner
      isPartner: etudiant.isPartner || false,
      prixTotalPartner: etudiant.prixTotalPartner || ''
    });
    
    // Pré-remplir les commentaires des documents
    setCommentairesModifier({
      commentaireCin: etudiant.documents?.cin?.commentaire || '',
      commentaireBacCommentaire: etudiant.documents?.bacCommentaire?.commentaire || '',
      commentaireReleveNoteBac: etudiant.documents?.releveNoteBac?.commentaire || '',
      commentaireDiplomeCommentaire: etudiant.documents?.diplomeCommentaire?.commentaire || '',
      commentaireAttestationReussiteCommentaire: etudiant.documents?.attestationReussiteCommentaire?.commentaire || '',
      commentaireReleveNotesFormationCommentaire: etudiant.documents?.releveNotesFormationCommentaire?.commentaire || '',
      commentairePasseport: etudiant.documents?.passeport?.commentaire || '',
      commentaireBacOuAttestationBacCommentaire: etudiant.documents?.bacOuAttestationBacCommentaire?.commentaire || '',
      commentaireAuthentificationBac: etudiant.documents?.authentificationBac?.commentaire || '',
      commentaireAuthenticationDiplome: etudiant.documents?.authenticationDiplome?.commentaire || '',
      commentaireEngagementCommentaire: etudiant.documents?.engagementCommentaire?.commentaire || ''
    });
    
    console.log('✅ FormModifier mis à jour:', {
      filiere: etudiant.filiere,
      niveau: etudiant.niveau,
      specialiteLicencePro: etudiant.specialiteLicencePro,
      optionLicencePro: etudiant.optionLicencePro,
      specialiteMasterPro: etudiant.specialiteMasterPro,
      optionMasterPro: etudiant.optionMasterPro
    }); // Pour vérifier que ça marche
    
    setImageFileModifier(null);
    setMessageModifier('');
    setShowEditModal(true);
    setLockCoursModifier(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEtudiantAModifier(null);
    setFormModifier({
      prenom: '',
      nomDeFamille: '',
      genre: 'Homme',
      dateNaissance: '',
      telephone: '',
      anneeScolaire: genererAnneeScolaireActuelle(),
      email: '',
      motDePasse: '',
      cin: '',
      passeport: '',
      lieuNaissance: '',
      pays: '',
      cours: [],
      niveau: '',
      niveauFormation: '',
      filiere: '',
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
      modePaiement: 'mensuel',
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
      // 🔥 AJOUT DES CHAMPS MANQUANTS
      specialiteLicencePro: '',
      optionLicencePro: '',
      specialiteMasterPro: '',
      optionMasterPro: '',
      // Nouveaux champs supplémentaires
      telephoneResponsable: '',
      codeBaccalaureat: '',
      codeMassar: '',
      // Nouveaux champs Partner
      isPartner: false,
      prixTotalPartner: ''
    });
    setDocumentsModifier({
      documentCin: null,
      documentBacCommentaire: null,
      documentReleveNoteBac: null,
      documentDiplomeCommentaire: null,
      documentAttestationReussiteCommentaire: null,
      documentReleveNotesFormationCommentaire: null,
      documentPasseport: null,
      documentBacOuAttestationBacCommentaire: null,
      documentAuthentificationBac: null,
      documentAuthenticationDiplome: null,
      documentEngagementCommentaire: null
    });
    setCommentairesModifier({
      commentaireCin: '',
      commentaireBacCommentaire: '',
      commentaireReleveNoteBac: '',
      commentaireDiplomeCommentaire: '',
      commentaireAttestationReussiteCommentaire: '',
      commentaireReleveNotesFormationCommentaire: '',
      commentairePasseport: '',
      commentaireBacOuAttestationBacCommentaire: '',
      commentaireAuthentificationBac: '',
      commentaireAuthenticationDiplome: '',
      commentaireEngagementCommentaire: ''
    });
    setImageFileModifier(null);
    setMessageModifier('');
    setLockCoursModifier(false);
  };

  // Handler de changement pour inclure les champs ingénieur
  const handleChangeAjout = (e) => {
    const { name, value, type, checked } = e.target;
    if ([
      'niveau', 'filiere', 'specialite', 'option', 'cycle',
      'specialiteIngenieur', 'optionIngenieur',
      'specialiteLicencePro', 'optionLicencePro',
      'specialiteMasterPro', 'optionMasterPro',
      'niveauFormation'
    ].includes(name)) {
      setLockCoursAjout(false);
      // Ne pas passer de valeurs vides pour les champs enum
      const cleanValue = type === 'checkbox' ? checked : (value || undefined);
      handleFormationChangeAjout(name, cleanValue);
    } else {
      setFormAjout({ ...formAjout, [name]: type === 'checkbox' ? checked : value });
    }
  };

  // 🔥 MISE À JOUR DU handleChangeModifier pour inclure tous les champs :
  const handleChangeModifier = (e) => {
    const { name, value, type, checked } = e.target;
    // 🔥 AJOUT DES NOUVEAUX CHAMPS
    if ([
      'niveau', 'filiere', 'specialite', 'option', 'cycle',
      'specialiteIngenieur', 'optionIngenieur',
      'specialiteLicencePro', 'optionLicencePro',
      'specialiteMasterPro', 'optionMasterPro',
      'niveauFormation'
    ].includes(name)) {
      setLockCoursModifier(false);
      // Ne pas passer de valeurs vides pour les champs enum
      const cleanValue = type === 'checkbox' ? checked : (value || undefined);
      handleFormationChangeModifier(name, cleanValue);
    } else {
      setFormModifier({ ...formModifier, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleSelectCoursAjout = (coursNom) => {
    const nouveauxCours = formAjout.cours.includes(coursNom)
      ? formAjout.cours.filter(c => c !== coursNom)
      : [...formAjout.cours, coursNom];
    setFormAjout({ ...formAjout, cours: nouveauxCours });
    setLockCoursAjout(true);
  };

  const handleImageChangeAjout = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleDocumentChangeAjout = (e) => {
    const { name, files } = e.target;
    setDocumentsAjout(prev => ({
      ...prev,
      [name]: files[0] || null
    }));
  };

  const handleCommentaireChangeAjout = (e) => {
    const { name, value } = e.target;
    setCommentairesAjout(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAjout = async (e) => {
    e.preventDefault();
    const erreurAnneeScolaire = validerAnneeScolaire(formAjout.anneeScolaire);
    if (erreurAnneeScolaire) {
      setMessageAjout('❌ ' + erreurAnneeScolaire);
      return;
    }
    const erreursFormation = validerFormationComplete(formAjout);
    if (erreursFormation.length > 0) {
      setMessageAjout('❌ Erreurs de formation: ' + erreursFormation.join(', '));
      return;
    }
    setLoadingAjout(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // NETTOYER les données avant l'envoi
      const formAjoutClean = { ...formAjout };
      
      // Supprimer les champs non pertinents selon la filière
      if (formAjoutClean.filiere === 'MASI' || formAjoutClean.filiere === 'IRM') {
        delete formAjoutClean.cycle;
        delete formAjoutClean.specialiteIngenieur;
        delete formAjoutClean.optionIngenieur;
        delete formAjoutClean.specialiteLicencePro;
        delete formAjoutClean.optionLicencePro;
        delete formAjoutClean.specialiteMasterPro;
        delete formAjoutClean.optionMasterPro;
      } else if (formAjoutClean.filiere === 'CYCLE_INGENIEUR') {
        delete formAjoutClean.specialiteLicencePro;
        delete formAjoutClean.optionLicencePro;
        delete formAjoutClean.specialiteMasterPro;
        delete formAjoutClean.optionMasterPro;
        delete formAjoutClean.specialite;
        delete formAjoutClean.option;
      } else if (formAjoutClean.filiere === 'LICENCE_PRO') {
        delete formAjoutClean.cycle;
        delete formAjoutClean.specialiteIngenieur;
        delete formAjoutClean.optionIngenieur;
        delete formAjoutClean.specialiteMasterPro;
        delete formAjoutClean.optionMasterPro;
        delete formAjoutClean.specialite;
        delete formAjoutClean.option;
      } else if (formAjoutClean.filiere === 'MASTER_PRO') {
        delete formAjoutClean.cycle;
        delete formAjoutClean.specialiteIngenieur;
        delete formAjoutClean.optionIngenieur;
        delete formAjoutClean.specialiteLicencePro;
        delete formAjoutClean.optionLicencePro;
        delete formAjoutClean.specialite;
        delete formAjoutClean.option;
      }
      
      Object.keys(formAjoutClean).forEach(key => {
        if (key === 'cours') {
          formAjoutClean[key].forEach(c => formData.append('cours[]', c));
        } else {
          const valeur = formAjoutClean[key];
          const valeurAEnvoyer = (valeur !== undefined && valeur !== null)
            ? (typeof valeur === 'boolean' ? valeur.toString() : valeur.toString())
            : '';
          formData.append(key, valeurAEnvoyer);
        }
      });
      if (imageFile) formData.append('image', imageFile);
      
      // Nouveaux documents avec commentaires
      Object.keys(documentsAjout).forEach(key => {
        if (documentsAjout[key]) {
          formData.append(key, documentsAjout[key]);
        }
      });
      
      // Commentaires des documents
      Object.keys(commentairesAjout).forEach(key => {
        formData.append(key, commentairesAjout[key]);
      });
      
      const response = await axios.post('http://195.179.229.230:5000/api/etudiants', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessageAjout('✅ Étudiant ajouté avec succès');
      setEtudiants([...etudiants, response.data]);
          await fetchEtudiants();

      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (err) {
      setMessageAjout('❌ Erreur: ' + (err.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setLoadingAjout(false);
    }
  };

  const handleSelectCoursModifier = (coursNom) => {
    const nouveauxCours = formModifier.cours.includes(coursNom)
      ? formModifier.cours.filter(c => c !== coursNom)
      : [...formModifier.cours, coursNom];
    setFormModifier({ ...formModifier, cours: nouveauxCours });
    setLockCoursModifier(true);
  };

  const handleImageChangeModifier = (e) => {
    setImageFileModifier(e.target.files[0]);
  };

  const handleDocumentChangeModifier = (e) => {
    const { name, files } = e.target;
    setDocumentsModifier(prev => ({
      ...prev,
      [name]: files[0] || null
    }));
  };

  const handleCommentaireChangeModifier = (e) => {
    const { name, value } = e.target;
    setCommentairesModifier(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitModifier = async (e) => {
    e.preventDefault();
    
    // Validation de l'année scolaire
    const erreurAnneeScolaire = validerAnneeScolaire(formModifier.anneeScolaire);
    if (erreurAnneeScolaire) {
      setMessageModifier('❌ ' + erreurAnneeScolaire);
      return;
    }
    
    // Validation de la formation
    const erreursFormation = validerFormationComplete(formModifier);
    if (erreursFormation.length > 0) {
      setMessageModifier('❌ Erreurs de formation: ' + erreursFormation.join(', '));
      return;
    }
    
    setLoadingModifier(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // NETTOYER les données avant l'envoi
      const formModifierClean = { ...formModifier };
      
      // Supprimer les champs non pertinents selon la filière
      if (formModifierClean.filiere === 'MASI' || formModifierClean.filiere === 'IRM') {
        delete formModifierClean.cycle;
        delete formModifierClean.specialiteIngenieur;
        delete formModifierClean.optionIngenieur;
        delete formModifierClean.specialiteLicencePro;
        delete formModifierClean.optionLicencePro;
        delete formModifierClean.specialiteMasterPro;
        delete formModifierClean.optionMasterPro;
      } else if (formModifierClean.filiere === 'CYCLE_INGENIEUR') {
        delete formModifierClean.specialiteLicencePro;
        delete formModifierClean.optionLicencePro;
        delete formModifierClean.specialiteMasterPro;
        delete formModifierClean.optionMasterPro;
        delete formModifierClean.specialite;
        delete formModifierClean.option;
      } else if (formModifierClean.filiere === 'LICENCE_PRO') {
        delete formModifierClean.cycle;
        delete formModifierClean.specialiteIngenieur;
        delete formModifierClean.optionIngenieur;
        delete formModifierClean.specialiteMasterPro;
        delete formModifierClean.optionMasterPro;
        delete formModifierClean.specialite;
        delete formModifierClean.option;
      } else if (formModifierClean.filiere === 'MASTER_PRO') {
        delete formModifierClean.cycle;
        delete formModifierClean.specialiteIngenieur;
        delete formModifierClean.optionIngenieur;
        delete formModifierClean.specialiteLicencePro;
        delete formModifierClean.optionLicencePro;
        delete formModifierClean.specialite;
        delete formModifierClean.option;
      }
      
      Object.keys(formModifierClean).forEach(key => {
        if (key === 'cours') {
          formModifierClean[key].forEach(c => formData.append('cours[]', c));
        } else if (key === 'motDePasse' && formModifierClean[key].trim() === '') {
          return; // Ne pas envoyer mot de passe vide
        } else {
          const valeur = formModifierClean[key];
          formData.append(
            key,
            typeof valeur === 'boolean'
              ? valeur.toString()
              : (valeur !== undefined ? valeur : '')
          );
        }
      });

      if (imageFileModifier) formData.append('image', imageFileModifier);
      
      // Nouveaux documents avec commentaires
      Object.keys(documentsModifier).forEach(key => {
        if (documentsModifier[key]) {
          formData.append(key, documentsModifier[key]);
        }
      });
      
      // Commentaires des documents
      Object.keys(commentairesModifier).forEach(key => {
        formData.append(key, commentairesModifier[key]);
      });
      
      const response = await axios.put(`http://195.179.229.230:5000/api/etudiants/${etudiantAModifier._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessageModifier('✅ Étudiant modifié avec succès');
      setEtudiants(etudiants.map(e => e._id === etudiantAModifier._id ? response.data : e));
          await fetchEtudiants();

      setTimeout(() => {
        closeEditModal();
      }, 2000);
      
    } catch (err) {
      setMessageModifier('❌ Erreur: ' + (err.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setLoadingModifier(false);
    }
  };

  const handleToggleActif = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`http://195.179.229.230:5000/api/etudiants/${id}/actif`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEtudiants(etudiants.map(e => e._id === id ? res.data : e));
    } catch (err) {
      console.error('Erreur toggle actif:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("🛑 Êtes-vous sûr de vouloir supprimer cet étudiant ?")) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://195.179.229.230:5000/api/etudiants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEtudiants(etudiants.filter(e => e._id !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleEdit = (etudiant) => {
    openEditModal(etudiant);
  };

  const handleView = (etudiant) => {
    setEtudiantSelectionne(etudiant);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setEtudiantSelectionne(null);
  };

  const viderFiltres = () => {
    setRecherche('');
    setFiltreGenre('');
    setFiltreCours('');
    setFiltreActif('');
    setFiltreCommercial('');
    setFiltreAnneeScolaire('');
    setFiltrePartner('');
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    const jour = String(date.getDate()).padStart(2, '0');
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const annee = date.getFullYear();
    return `${jour}-${mois}-${annee}`;
  };

  const calculerAge = (dateNaissance) => {
    if (!dateNaissance) return 'N/A';
    const dob = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const getNomCommercial = (commercialId) => {
    if (!commercialId) return 'Aucun';
    const commercial = listeCommerciaux.find(c => c._id === commercialId);
    return commercial ? (commercial.nomComplet || commercial.nom) : 'Commercial supprimé';
  };

  const getNomComplet = (etudiant) => {
    return `${etudiant.prenom || ''} ${etudiant.nomDeFamille || ''}`.trim();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Pagination
  const indexDernierEtudiant = pageActuelle * etudiantsParPage;
  const indexPremierEtudiant = indexDernierEtudiant - etudiantsParPage;
  const etudiantsActuels = etudiantsFiltres.slice(indexPremierEtudiant, indexDernierEtudiant);
  const totalPages = Math.ceil(etudiantsFiltres.length / etudiantsParPage);

  const changerPage = (numerePage) => {
    setPageActuelle(numerePage);
  };

  // Obtenir tous les cours uniques pour le filtre
  const coursUniques = [...new Set(etudiants.flatMap(e => e.cours || []))];

  // Obtenir toutes les années scolaires uniques pour le filtre
  const annesScolairesUniques = [...new Set(etudiants.map(e => e.anneeScolaire).filter(Boolean))];

  if (loading) {
    return <div className="loading">Chargement des étudiants...</div>;
  }

  return (
    <div className="liste-etudiants-container" style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)'
    }}>
      <Sidebar onLogout={handleLogout} />

      <div className="header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ width: '100%', textAlign: 'center' }}>Liste des Étudiants</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {etudiantsFiltres.length} étudiants
          </div>
          
          <div className="vue-toggle">
            <button 
              onClick={() => setVueMode('tableau')}
              className={`btn-vue ${vueMode === 'tableau' ? 'active' : ''}`}
            >
              Tableau
            </button>
            <button 
              onClick={() => setVueMode('carte')}
              className={`btn-vue ${vueMode === 'carte' ? 'active' : ''}`}
            >
              Cartes
            </button>
          </div>
          
          <button onClick={openModal} className="btn-ajouter-etudiant">
            Ajouter un étudiant
          </button>
        </div>
      </div>

      {/* Section des filtres */}
      <div className="filtres-section">
        <div className="filtres-row">
          <div className="filtre-groupe">
            <label>Rechercher:</label>
            <input
              type="text"
              placeholder="Nom, téléphone, CIN, code..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="input-recherche"
            />
          </div>

          <div className="filtre-groupe">
            <label>Genre:</label>
            <select
              value={filtreGenre}
              onChange={(e) => setFiltreGenre(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </div>

          <div className="filtre-groupe">
            <label>Classe:</label>
            <select
              value={filtreCours}
              onChange={(e) => setFiltreCours(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous les classes</option>
              {coursUniques.map(cours => (
                <option key={cours} value={cours}>{cours}</option>
              ))}
            </select>
          </div>

          <div className="filtre-groupe">
            <label>Statut:</label>
            <select
              value={filtreActif}
              onChange={(e) => setFiltreActif(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>

          <div className="filtre-groupe">
            <label>Commercial:</label>
            <select
              value={filtreCommercial}
              onChange={(e) => setFiltreCommercial(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous les commerciaux</option>
              {listeCommerciaux.map(commercial => (
                <option key={commercial._id} value={commercial._id}>
                  {commercial.nomComplet || commercial.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="filtre-groupe">
            <label>Année Scolaire:</label>
            <select
              value={filtreAnneeScolaire}
              onChange={(e) => setFiltreAnneeScolaire(e.target.value)}
              className="select-filtre"
            >
              <option value="">Toutes les années</option>
              {annesScolairesUniques.map(annee => (
                <option key={annee} value={annee}>{annee}</option>
              ))}
            </select>
          </div>

          <div className="filtre-groupe">
            <label>Type:</label>
            <select
              value={filtrePartner}
              onChange={(e) => setFiltrePartner(e.target.value)}
              className="select-filtre"
            >
              <option value="">Tous les types</option>
              <option value="true">Partners</option>
              <option value="false">Normaux</option>
            </select>
          </div>

          <button onClick={viderFiltres} className="btn-vider-filtres">
            Vider les filtres
          </button>
        </div>
      </div>

      {/* Vue Tableau ou Cartes */}
      {vueMode === 'tableau' ? (
        // VUE TABLEAU
        <div className="tableau-container">
          <table className="tableau-etudiants">
            <thead>
              <tr>
                <th>Nom Complet</th>
                <th>Genre</th>
                <th>Date de Naissance</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>CIN</th>
                <th>Code Massar</th>
                <th>Code Étudiant</th>
                <th>Type</th>
                <th>Commercial</th>
                <th>Classe</th>
                <th>Statut</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {etudiantsActuels.length === 0 ? (
                <tr>
                  <td colSpan="14" className="aucun-resultat">
                    Aucun étudiant trouvé
                  </td>
                </tr>
              ) : (
                etudiantsActuels.map((e) => (
                  <tr key={e._id}>
                    <td className="nom-colonne">{getNomComplet(e)}</td>
                    <td>{e.genre}</td>
                    <td>{formatDate(e.dateNaissance)}</td>
                    <td>{e.telephone}</td>
                    <td>{e.email}</td>
                    <td>{e.cin || 'N/A'}</td>
                    <td>{e.codeMassar || 'N/A'}</td>
                    <td>{e.codeEtudiant || 'N/A'}</td>
                    <td className="type-colonne">
                      <span className={`type-badge ${e.isPartner ? 'partner' : 'normal'}`}>
                        {e.isPartner ? '🤝 Partner' : '👤 Normal'}
                      </span>
                    </td>
                    <td className="commercial-colonne">
                      {getNomCommercial(e.commercial)}
                    </td>
                    <td className="cours-colonne">
                      {e.cours ? e.cours.join(', ') : 'Aucun'}
                    </td>
                    <td className="statut-colonne">
                      <div className="toggle-switch-container">
                        <span className={`statut-text ${e.actif ? 'actif' : 'inactif'}`}>
                          {e.actif ? 'Actif' : 'Inactif'}
                        </span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={e.actif}
                            onChange={() => handleToggleActif(e._id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </td>
                    <td className="image-colonne">
                      {e.image ? (
                        <img 
                          src={`http://195.179.229.230:5000${e.image}`} 
                          alt={getNomComplet(e)} 
                          className="image-etudiant"
                        />
                      ) : (
                        <div className="pas-image">N/A</div>
                      )}
                    </td>
                    <td className="actions-colonne">
                      <button 
                        onClick={() => handleView(e)}
                        className="btn-voir"
                      >
                      <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(e)}
                        className="btn-modifier"
                      >
                      <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(e._id)}
                        className="btn-supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // VUE CARTES
        <div className="cartes-container">
          {etudiantsActuels.length === 0 ? (
            <div className="aucun-resultat-cartes">
              Aucun étudiant trouvé
            </div>
          ) : (
            <div className="cartes-grid">
              {etudiantsActuels.map((e) => (
                <div key={e._id} className="carte-etudiant">
                  <div className="carte-header">
                    <div className="carte-image">
                      {e.image ? (
                        <img 
                          src={`http://195.179.229.230:5000${e.image}`} 
                          alt="etudiant" 
                          className="carte-photo"
                        />
                      ) : (
                        <div className="carte-placeholder">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="carte-statut">
                      <span className={`statut-badge ${e.actif ? 'actif' : 'inactif'}`}>
                        {e.actif ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </span>
                    </div>
                  </div>
                  
                  <div className="carte-content">
                    <h3 className="carte-nom">{getNomComplet(e)}</h3>
                    <div className="carte-info">
                      <div className="carte-detail">
                        <span className="carte-label">Année Scolaire:</span>
                        <span>
                          <Calendar size={16} className="inline mr-1" /> 
                          {e.anneeScolaire || 'N/A'}
                        </span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Genre:</span>
                        <span>
                          <User size={16} className="inline mr-1" /> {e.genre}
                        </span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Âge:</span>
                        <span>{calculerAge(e.dateNaissance)} ans</span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Téléphone:</span>
                        <span>
                          <Phone size={16} className="inline mr-1" /> {e.telephone}
                        </span>
                      </div>
                      <div className="carte-detail">
                        <span className="carte-label">Email:</span>
                        <span>{e.email}</span>
                      </div>
                      {e.cin && (
                        <div className="carte-detail">
                          <span className="carte-label">CIN:</span>
                          <span>
                            <IdCard size={16} className="inline mr-1" /> {e.cin}
                          </span>
                        </div>
                      )}
                      {e.codeMassar && (
                        <div className="carte-detail">
                          <span className="carte-label">Code Massar:</span>
                          <span>
                            <IdCard size={16} className="inline mr-1" /> {e.codeMassar}
                          </span>
                        </div>
                      )}
                      {e.codeEtudiant && (
                        <div className="carte-detail">
                          <span className="carte-label">Code:</span>
                          <span>{e.codeEtudiant}</span>
                        </div>
                      )}
                      <div className="carte-detail">
                        <span className="carte-label">Type:</span>
                        <span className={`type-badge-card ${e.isPartner ? 'partner' : 'normal'}`}>
                          {e.isPartner ? '🤝 Partner' : '👤 Normal'}
                        </span>
                      </div>
                      {e.isPartner && e.prixTotalPartner && (
                        <div className="carte-detail">
                          <span className="carte-label">Prix Partner:</span>
                          <span>{e.prixTotalPartner} DH</span>
                        </div>
                      )}
                      <div className="carte-detail">
                        <span className="carte-label">Commercial:</span>
                        <span>
                          <UserCheck size={16} className="inline mr-1" /> 
                          {getNomCommercial(e.commercial)}
                        </span>
                      </div>
                      <div className="carte-detail cours-detail">
                        <span className="carte-label">Classe:</span>
                        <div className="carte-cours">
                          {e.cours && e.cours.length > 0 ? (
                            e.cours.map((cours, index) => (
                              <span key={index} className="cours-tag">{cours}</span>
                            ))
                          ) : (
                            <span className="no-cours">Aucun classe</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="carte-actions">
                    <button 
                      onClick={() => handleView(e)}
                      className="btn-carte btn-voir"
                      title="Voir détails"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleEdit(e)}
                      className="btn-carte btn-modifier"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleToggleActif(e._id)}
                      className="btn-carte btn-toggle"
                      title={e.actif ? 'Désactiver' : 'Activer'}
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(e._id)}
                      className="btn-carte btn-supprimer"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => changerPage(pageActuelle - 1)}
            disabled={pageActuelle === 1}
            className="btn-pagination"
          >
            Précédent
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => changerPage(i + 1)}
              className={`btn-pagination ${pageActuelle === i + 1 ? 'active' : ''}`}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            onClick={() => changerPage(pageActuelle + 1)}
            disabled={pageActuelle === totalPages}
            className="btn-pagination"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal d'ajout d'étudiant */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajouter un étudiant</h3>
              <button className="btn-fermer-modal" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmitAjout} className="form-ajout-etudiant">
              {/* Section Informations personnelles */}
              <div className="form-section">
                <h4><User size={20} className="inline mr-2" />Informations personnelles</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      name="prenom"
                      placeholder="Prénom"
                      value={formAjout.prenom}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom de Famille *</label>
                    <input
                      type="text"
                      name="nomDeFamille"
                      placeholder="Nom de famille"
                      value={formAjout.nomDeFamille}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Genre *</label>
                    <select name="genre" value={formAjout.genre} onChange={handleChangeAjout}>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date de Naissance *</label>
                    <input
                      type="date"
                      name="dateNaissance"
                      value={formAjout.dateNaissance}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      type="text"
                      name="telephone"
                      placeholder="Téléphone"
                      value={formAjout.telephone}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formAjout.email}
                      onChange={handleChangeAjout}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>CIN</label>
                    <input
                      type="text"
                      name="cin"
                      placeholder="Numéro CIN"
                      value={formAjout.cin}
                      onChange={handleChangeAjout}
                    />
                  </div>
                  <div className="form-group">
                    <label>Passeport</label>
                    <input
                      type="text"
                      name="passeport"
                      placeholder="Numéro passeport"
                      value={formAjout.passeport}
                      onChange={handleChangeAjout}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Lieu de Naissance</label>
                    <input
                      type="text"
                      name="lieuNaissance"
                      placeholder="Lieu de naissance"
                      value={formAjout.lieuNaissance}
                      onChange={handleChangeAjout}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pays</label>
                    <select
                      name="pays"
                      value={formAjout.pays}
                      onChange={handleChangeAjout}
                    >
                      <option value="">Sélectionner un pays...</option>
                      {PAYS_LISTE.map((pays) => (
                        <option key={pays} value={pays}>{pays}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone du Responsable</label>
                    <input
                      type="text"
                      name="telephoneResponsable"
                      placeholder="Téléphone du responsable"
                      value={formAjout.telephoneResponsable}
                      onChange={handleChangeAjout}
                    />
                  </div>
                  <div className="form-group">
                    <label>Code du Baccalauréat</label>
                    <input
                      type="text"
                      name="codeBaccalaureat"
                      placeholder="Code du baccalauréat"
                      value={formAjout.codeBaccalaureat}
                      onChange={handleChangeAjout}
                    />
                  </div>
                  <div className="form-group">
                    <label>Code Massar</label>
                    <input
                      type="text"
                      name="codeMassar"
                      placeholder="Code Massar"
                      value={formAjout.codeMassar}
                      onChange={handleChangeAjout}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mot de Passe *</label>
                  <input
                    type="password"
                    name="motDePasse"
                    placeholder="Mot de passe"
                    value={formAjout.motDePasse}
                    onChange={handleChangeAjout}
                    required
                    minLength="6"
                  />
                </div>
              </div>

              {/* Section Formation Intelligente */}
              <div className="form-section">
                <h4><GraduationCap size={20} className="inline mr-2" />Formation Intelligente</h4>
                
                {/* Nouveau champ année scolaire */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Année Scolaire *</label>
                    <input
                      type="text"
                      name="anneeScolaire"
                      placeholder="YYYY/YYYY (ex: 2025/2026)"
                      value={formAjout.anneeScolaire}
                      onChange={handleChangeAjout}
                      required
                      pattern="^\d{4}/\d{4}$"
                      title="Format: YYYY/YYYY (ex: 2025/2026)"
                    />
                    <small style={{color: '#666', fontSize: '12px'}}>
                      Format obligatoire: YYYY/YYYY (ex: 2025/2026)
                    </small>
                  </div>
                </div>
                <div className="form-group">
                    <label>Niveau de Formation</label>
                    <select
                      name="niveauFormation"
                      value={formAjout.niveauFormation}
                      onChange={handleChangeAjout}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="FI">FI</option>
                      <option value="TA">TA</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                <FormationSelector 
                  form={formAjout} 
                  onChange={handleFormationChangeAjout} 
                />
                
                <div className="form-row">
                  
                  <div className="form-group">
                    <label>Type de Diplôme</label>
                    <input
                      type="text"
                      name="typeDiplome"
                      placeholder="Type de diplôme"
                      value={formAjout.typeDiplome}
                      onChange={handleChangeAjout}
                    />
                  </div>
                </div>

                <div className="form-group">
  <label>Classes</label>
  {coursFiltres.length > 0 ? (
    <div className="cours-selection-container">
      {coursFiltres.map((cours) => (
        <div
          key={cours._id}
          className={`cours-chip ${formAjout.cours.includes(cours.nom) ? 'selected' : ''}`}
          onClick={() => handleSelectCoursAjout(cours.nom)}
        >
          <span className="cours-nom">{cours.nom}</span>
          {formAjout.cours.includes(cours.nom) && (
            <span className="cours-check">✓</span>
          )}
        </div>
      ))}
    </div>
  ) : (
    <p style={{color: '#666', textAlign: 'center'}}>
      Sélectionnez votre formation d'abord
    </p>
  )}
</div>
              </div>

              {/* Section Diplôme d'accès */}
              <div className="form-section">
                <h4><Award size={20} className="inline mr-2" />Diplôme d'accès</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Diplôme d'Accès</label>
                    <input
                      type="text"
                      name="diplomeAcces"
                      placeholder="Diplôme d'accès"
                      value={formAjout.diplomeAcces}
                      onChange={handleChangeAjout}
                    />
                  </div>
                  <div className="form-group">
                    <label>Spécialité Diplôme d'Accès</label>
                    <input
                      type="text"
                      name="specialiteDiplomeAcces"
                      placeholder="Spécialité du diplôme d'accès"
                      value={formAjout.specialiteDiplomeAcces}
                      onChange={handleChangeAjout}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mention</label>
                    <input
                      type="text"
                      name="mention"
                      placeholder="Mention"
                      value={formAjout.mention}
                      onChange={handleChangeAjout}
                    />
                  </div>
                  <div className="form-group">
                    <label>Lieu d'Obtention du Diplôme</label>
                    <input
                      type="text"
                      name="lieuObtentionDiplome"
                      placeholder="Lieu d'obtention"
                      value={formAjout.lieuObtentionDiplome}
                      onChange={handleChangeAjout}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Série Baccalauréat</label>
                    <input
                      type="text"
                      name="serieBaccalaureat"
                      placeholder="Série du baccalauréat"
                      value={formAjout.serieBaccalaureat}
                      onChange={handleChangeAjout}
                    />
                  </div>
                  <div className="form-group">
                    <label>Année Baccalauréat</label>
                    <input
                      type="number"
                      name="anneeBaccalaureat"
                      placeholder="Année du baccalauréat"
                      value={formAjout.anneeBaccalaureat}
                      onChange={handleChangeAjout}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Première Année d'Inscription</label>
                    <input
                      type="number"
                      name="premiereAnneeInscription"
                      placeholder="Première année d'inscription"
                      value={formAjout.premiereAnneeInscription}
                      onChange={handleChangeAjout}
                      min="1900"
                      max={new Date().getFullYear() + 10}
                    />
                  </div>
                  <div className="form-group">
                    <label>Source d'Inscription</label>
                    <input
                      type="text"
                      name="sourceInscription"
                      placeholder="Source d'inscription"
                      value={formAjout.sourceInscription}
                      onChange={handleChangeAjout}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date d'Inscription</label>
                  <input
                    type="date"
                    name="dateInscription"
                    value={formAjout.dateInscription}
                    onChange={handleChangeAjout}
                  />
                </div>
              </div>

              {/* Section Système Partner */}
              <div className="form-section">
                <h4>🤝 Système Partner</h4>
                
                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isPartner"
                        checked={formAjout.isPartner}
                        onChange={handleChangeAjout}
                      />
                      Étudiant Partenaire
                    </label>
                    <small style={{color: '#666', fontSize: '12px'}}>
                      Cocher si cet étudiant fait partie du programme partenaire
                    </small>
                  </div>
                </div>

                {formAjout.isPartner && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Prix Total Partner *</label>
                      <input
                        type="number"
                        name="prixTotalPartner"
                        placeholder="Prix total pour partner"
                        value={formAjout.prixTotalPartner}
                        onChange={handleChangeAjout}
                        required={formAjout.isPartner}
                        min="1000"
                        max="99999"
                        step="1"
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        Prix spécial pour les étudiants partenaires (séparé du prix normal)
                      </small>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Inscription et Paiement */}
              <div className="form-section">
                <h4><CreditCard size={20} className="inline mr-2" />Inscription et Paiement</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Code Étudiant</label>
                    <input
                      type="text"
                      name="codeEtudiant"
                      placeholder="Code étudiant (généré automatiquement)"
                      value={formAjout.codeEtudiant}
                      onChange={handleChangeAjout}
                      readOnly
                      style={{backgroundColor: '#f0f0f0'}}
                    />
                    <small style={{color: '#666', fontSize: '12px'}}>
                      Le code sera généré automatiquement basé sur la formation et le nom
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Commercial</label>
                    <select 
                      name="commercial" 
                      value={formAjout.commercial} 
                      onChange={handleChangeAjout}
                    >
                      <option value="">Aucun commercial assigné</option>
                      {listeCommerciaux.map((commercial) => (
                        <option key={commercial._id} value={commercial._id}>
                          {commercial.nomComplet || commercial.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mode de Paiement *</label>
                    <select
                      name="modePaiement"
                      value={formAjout.modePaiement}
                      onChange={handleChangeAjout}
                      required
                    >
                      <option value="semestriel">Semestriel (2 tranches)</option>
                      <option value="trimestriel">Trimestriel (3 tranches)</option>
                      <option value="mensuel">Mensuel (10 tranches)</option>
                      <option value="annuel">Annuel (paiement complet)</option>
                    </select>
                    <small style={{color: '#666', fontSize: '12px'}}>
                      Semestriel par défaut. Annuel = paiement immédiat complet.
                    </small>
                  </div>
                  {!formAjout.isPartner && (
                    <div className="form-group">
                      <label>Prix Total</label>
                      <input
                        type="number"
                        name="prixTotal"
                        placeholder="Prix total (optionnel)"
                        value={formAjout.prixTotal}
                        onChange={handleChangeAjout}
                        min="0"
                        max="99999"
                        step="1"
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        Champ optionnel - peut être rempli plus tard
                      </small>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pourcentage Bourse (%)</label>
                    <input
                      type="number"
                      name="pourcentageBourse"
                      placeholder="Pourcentage de bourse"
                      value={formAjout.pourcentageBourse}
                      onChange={handleChangeAjout}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type de Paiement</label>
                    <input
                      type="text"
                      name="typePaiement"
                      placeholder="Type de paiement"
                      value={formAjout.typePaiement}
                      onChange={handleChangeAjout}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Situation</label>
                    <input
                      type="text"
                      name="situation"
                      placeholder="Situation"
                      value={formAjout.situation}
                      onChange={handleChangeAjout}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date et Règlement</label>
                  <input
                    type="text"
                    name="dateEtReglement"
                    placeholder="Date et règlement"
                    value={formAjout.dateEtReglement}
                    onChange={handleChangeAjout}
                  />
                </div>
              </div>

              {/* Section Autres informations */}
              <div className="form-section">
                <h4><FileText size={20} className="inline mr-2" />Autres informations</h4>
                
                <div className="form-group">
                  <label>Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChangeAjout}
                  />
                </div>

                {/* Section Documents avec commentaires */}
                <div className="documents-section">
                  <h5>Documents avec Commentaires</h5>
                  
                  {/* CIN */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document CIN</label>
                      <input
                        type="file"
                        name="documentCin"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire CIN</label>
                      <input
                        type="text"
                        name="commentaireCin"
                        placeholder="Commentaire pour le CIN"
                        value={commentairesAjout.commentaireCin}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Bac avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Bac</label>
                      <input
                        type="file"
                        name="documentBacCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Bac</label>
                      <input
                        type="text"
                        name="commentaireBacCommentaire"
                        placeholder="Commentaire pour le Bac"
                        value={commentairesAjout.commentaireBacCommentaire}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Relevé de Notes Bac */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Relevé de Notes Bac</label>
                      <input
                        type="file"
                        name="documentReleveNoteBac"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Relevé Notes Bac</label>
                      <input
                        type="text"
                        name="commentaireReleveNoteBac"
                        placeholder="Commentaire pour le relevé de notes bac"
                        value={commentairesAjout.commentaireReleveNoteBac}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Bac ou Attestation Bac avec commentaire - NOUVEAU */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bac ou Attestation Bac</label>
                      <input
                        type="file"
                        name="documentBacOuAttestationBacCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Bac/Attestation</label>
                      <input
                        type="text"
                        name="commentaireBacOuAttestationBacCommentaire"
                        placeholder="Commentaire pour le bac ou attestation"
                        value={commentairesAjout.commentaireBacOuAttestationBacCommentaire}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Authentification Bac - NOUVEAU */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Authentification Bac</label>
                      <input
                        type="file"
                        name="documentAuthentificationBac"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Authentification Bac</label>
                      <input
                        type="text"
                        name="commentaireAuthentificationBac"
                        placeholder="Commentaire pour l'authentification bac"
                        value={commentairesAjout.commentaireAuthentificationBac}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Diplôme avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Diplôme</label>
                      <input
                        type="file"
                        name="documentDiplomeCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Diplôme</label>
                      <input
                        type="text"
                        name="commentaireDiplomeCommentaire"
                        placeholder="Commentaire pour le diplôme"
                        value={commentairesAjout.commentaireDiplomeCommentaire}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Authentication Diplôme - NOUVEAU */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Authentication Diplôme</label>
                      <input
                        type="file"
                        name="documentAuthenticationDiplome"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Authentication Diplôme</label>
                      <input
                        type="text"
                        name="commentaireAuthenticationDiplome"
                        placeholder="Commentaire pour l'authentication diplôme"
                        value={commentairesAjout.commentaireAuthenticationDiplome}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Attestation de Réussite avec commentaire - NOUVEAU */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Attestation de Réussite</label>
                      <input
                        type="file"
                        name="documentAttestationReussiteCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Attestation de Réussite</label>
                      <input
                        type="text"
                        name="commentaireAttestationReussiteCommentaire"
                        placeholder="Commentaire pour l'attestation de réussite"
                        value={commentairesAjout.commentaireAttestationReussiteCommentaire}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Relevé de Notes Formation avec commentaire - NOUVEAU */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Relevé de Notes Formation</label>
                      <input
                        type="file"
                        name="documentReleveNotesFormationCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Relevé Notes Formation</label>
                      <input
                        type="text"
                        name="commentaireReleveNotesFormationCommentaire"
                        placeholder="Commentaire pour le relevé de notes formation"
                        value={commentairesAjout.commentaireReleveNotesFormationCommentaire}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Passeport */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Passeport</label>
                      <input
                        type="file"
                        name="documentPasseport"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Passeport</label>
                      <input
                        type="text"
                        name="commentairePasseport"
                        placeholder="Commentaire pour le passeport"
                        value={commentairesAjout.commentairePasseport}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>

                  {/* Engagement avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Engagement</label>
                      <input
                        type="file"
                        name="documentEngagementCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeAjout}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Engagement</label>
                      <input
                        type="text"
                        name="commentaireEngagementCommentaire"
                        placeholder="Commentaire pour l'engagement"
                        value={commentairesAjout.commentaireEngagementCommentaire}
                        onChange={handleCommentaireChangeAjout}
                      />
                    </div>
                  </div>
                </div>

                <div className="checkbox-grid">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="actif"
                        checked={formAjout.actif}
                        onChange={handleChangeAjout}
                      />
                      Étudiant actif
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="paye"
                        checked={formAjout.paye}
                        onChange={handleChangeAjout}
                      />
                      Payé
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="nouvelleInscription"
                        checked={formAjout.nouvelleInscription}
                        onChange={handleChangeAjout}
                      />
                      Nouvelle inscription
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="handicape"
                        checked={formAjout.handicape}
                        onChange={handleChangeAjout}
                      />
                      Handicapé
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="resident"
                        checked={formAjout.resident}
                        onChange={handleChangeAjout}
                      />
                      Résident
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="fonctionnaire"
                        checked={formAjout.fonctionnaire}
                        onChange={handleChangeAjout}
                      />
                      Fonctionnaire
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="mobilite"
                        checked={formAjout.mobilite}
                        onChange={handleChangeAjout}
                      />
                      Mobilité
                    </label>
                  </div>
                </div>
              </div>

              {messageAjout && (
                <div className={`message-ajout ${messageAjout.includes('✅') ? 'success' : 'error'}`}>
                  {messageAjout}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-annuler">
                  Annuler
                </button>
                <button type="submit" disabled={loadingAjout} className="btn-enregistrer">
                  {loadingAjout ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification d'étudiant */}
      {showEditModal && etudiantAModifier && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier l'étudiant</h3>
              <button className="btn-fermer-modal" onClick={closeEditModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmitModifier} className="form-ajout-etudiant">
              {/* Section Informations personnelles */}
              <div className="form-section">
                <h4><User size={20} className="inline mr-2" />Informations personnelles</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      name="prenom"
                      placeholder="Prénom"
                      value={formModifier.prenom}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom de Famille *</label>
                    <input
                      type="text"
                      name="nomDeFamille"
                      placeholder="Nom de famille"
                      value={formModifier.nomDeFamille}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Genre *</label>
                    <select name="genre" value={formModifier.genre} onChange={handleChangeModifier}>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date de Naissance *</label>
                    <input
                      type="date"
                      name="dateNaissance"
                      value={formModifier.dateNaissance}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      type="text"
                      name="telephone"
                      placeholder="Téléphone"
                      value={formModifier.telephone}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formModifier.email}
                      onChange={handleChangeModifier}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>CIN</label>
                    <input
                      type="text"
                      name="cin"
                      placeholder="Numéro CIN"
                      value={formModifier.cin}
                      onChange={handleChangeModifier}
                    />
                  </div>
                  <div className="form-group">
                    <label>Passeport</label>
                    <input
                      type="text"
                      name="passeport"
                      placeholder="Numéro passeport"
                      value={formModifier.passeport}
                      onChange={handleChangeModifier}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Lieu de Naissance</label>
                    <input
                      type="text"
                      name="lieuNaissance"
                      placeholder="Lieu de naissance"
                      value={formModifier.lieuNaissance}
                      onChange={handleChangeModifier}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pays</label>
                    <select
                      name="pays"
                      value={formModifier.pays}
                      onChange={handleChangeModifier}
                    >
                      <option value="">Sélectionner un pays...</option>
                      {PAYS_LISTE.map((pays) => (
                        <option key={pays} value={pays}>{pays}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone du Responsable</label>
                    <input
                      type="text"
                      name="telephoneResponsable"
                      placeholder="Téléphone du responsable"
                      value={formModifier.telephoneResponsable}
                      onChange={handleChangeModifier}
                    />
                  </div>
                  <div className="form-group">
                    <label>Code du Baccalauréat</label>
                    <input
                      type="text"
                      name="codeBaccalaureat"
                      placeholder="Code du baccalauréat"
                      value={formModifier.codeBaccalaureat}
                      onChange={handleChangeModifier}
                    />
                  </div>
                  <div className="form-group">
                    <label>Code Massar</label>
                    <input
                      type="text"
                      name="codeMassar"
                      placeholder="Code Massar"
                      value={formModifier.codeMassar}
                      onChange={handleChangeModifier}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nouveau Mot de Passe</label>
                  <input
                    type="password"
                    name="motDePasse"
                    placeholder="Laisser vide pour garder l'ancien"
                    value={formModifier.motDePasse}
                    onChange={handleChangeModifier}
                    minLength="6"
                  />
                  <small style={{color: '#666', fontSize: '12px'}}>
                    Laisser vide pour conserver le mot de passe actuel
                  </small>
                </div>
              </div>

              {/* Section Formation Intelligente */}
              <div className="form-section">
                <h4><GraduationCap size={20} className="inline mr-2" />Formation Intelligente</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Année Scolaire *</label>
                    <input
                      type="text"
                      name="anneeScolaire"
                      placeholder="YYYY/YYYY (ex: 2025/2026)"
                      value={formModifier.anneeScolaire}
                      onChange={handleChangeModifier}
                      required
                      pattern="^\d{4}/\d{4}$"
                      title="Format: YYYY/YYYY (ex: 2025/2026)"
                    />
                    <small style={{color: '#666', fontSize: '12px'}}>
                      Format obligatoire: YYYY/YYYY (ex: 2025/2026)
                    </small>
                  </div>
                </div>
                <div className="form-group">
                    <label>Niveau de Formation</label>
                    <select
                      name="niveauFormation"
                      value={formModifier.niveauFormation}
                      onChange={handleChangeModifier}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="FI">FI</option>
                      <option value="TA">TA</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                <FormationSelector 
                  form={formModifier} 
                  onChange={handleFormationChangeModifier} 
                />
                
                <div className="form-row">
                  
                  <div className="form-group">
                    <label>Type de Diplôme</label>
                    <input
                      type="text"
                      name="typeDiplome"
                      placeholder="Type de diplôme"
                      value={formModifier.typeDiplome}
                      onChange={handleChangeModifier}
                    />
                  </div>
                </div>

                <div className="form-group">
  <label>Classes</label>
  {coursFiltresModif.length > 0 ? (
    <div className="cours-selection-container">
      {coursFiltresModif.map((cours) => (
        <div
          key={cours._id}
          className={`cours-chip ${formModifier.cours.includes(cours.nom) ? 'selected' : ''}`}
          onClick={() => handleSelectCoursModifier(cours.nom)}
        >
          <span className="cours-nom">{cours.nom}</span>
          {formModifier.cours.includes(cours.nom) && (
            <span className="cours-check">✓</span>
          )}
        </div>
      ))}
    </div>
  ) : (
    <p style={{color: '#666', textAlign: 'center', padding: '10px'}}>
      Sélectionnez d'abord votre formation complète
    </p>
  )}
  {formModifier.cours.length > 0 && (
    <div className="cours-selectionnes">
      <small>Classes sélectionnées: {formModifier.cours.join(', ')}</small>
    </div>
  )}
</div>
              </div>

              {/* Section Diplôme d'accès */}
              <div className="form-section">
                <h4><Award size={20} className="inline mr-2" />Diplôme d'accès</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Diplôme d'Accès</label>
                    <input
                      type="text"
                      name="diplomeAcces"
                      placeholder="Diplôme d'accès"
                      value={formModifier.diplomeAcces}
                      onChange={handleChangeModifier}
                    />
                  </div>
                  <div className="form-group">
                    <label>Spécialité Diplôme d'Accès</label>
                    <input
                      type="text"
                      name="specialiteDiplomeAcces"
                      placeholder="Spécialité du diplôme d'accès"
                      value={formModifier.specialiteDiplomeAcces}
                      onChange={handleChangeModifier}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mention</label>
                    <input
                      type="text"
                      name="mention"
                      placeholder="Mention"
                      value={formModifier.mention}
                      onChange={handleChangeModifier}
                    />
                  </div>
                  <div className="form-group">
                    <label>Lieu d'Obtention du Diplôme</label>
                    <input
                      type="text"
                      name="lieuObtentionDiplome"
                      placeholder="Lieu d'obtention"
                      value={formModifier.lieuObtentionDiplome}
                      onChange={handleChangeModifier}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Série Baccalauréat</label>
                    <input
                      type="text"
                      name="serieBaccalaureat"
                      placeholder="Série du baccalauréat"
                      value={formModifier.serieBaccalaureat}
                      onChange={handleChangeModifier}
                    />
                  </div>
                  <div className="form-group">
                    <label>Année Baccalauréat</label>
                    <input
                      type="number"
                      name="anneeBaccalaureat"
                      placeholder="Année du baccalauréat"
                      value={formModifier.anneeBaccalaureat}
                      onChange={handleChangeModifier}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Première Année d'Inscription</label>
                    <input
                      type="number"
                      name="premiereAnneeInscription"
                      placeholder="Première année d'inscription"
                      value={formModifier.premiereAnneeInscription}
                      onChange={handleChangeModifier}
                      min="1900"
                      max={new Date().getFullYear() + 10}
                    />
                  </div>
                  <div className="form-group">
                    <label>Source d'Inscription</label>
                    <input
                      type="text"
                      name="sourceInscription"
                      placeholder="Source d'inscription"
                      value={formModifier.sourceInscription}
                      onChange={handleChangeModifier}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date d'Inscription</label>
                  <input
                    type="date"
                    name="dateInscription"
                    value={formModifier.dateInscription}
                    onChange={handleChangeModifier}
                  />
                </div>
              </div>

              {/* Section Système Partner */}
              <div className="form-section">
                <h4>🤝 Système Partner</h4>
                
                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isPartner"
                        checked={formModifier.isPartner}
                        onChange={handleChangeModifier}
                      />
                      Étudiant Partenaire
                    </label>
                    <small style={{color: '#666', fontSize: '12px'}}>
                      Cocher si cet étudiant fait partie du programme partenaire
                    </small>
                  </div>
                </div>

                {formModifier.isPartner && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Prix Total Partner *</label>
                      <input
                        type="number"
                        name="prixTotalPartner"
                        placeholder="Prix total pour partner"
                        value={formModifier.prixTotalPartner}
                        onChange={handleChangeModifier}
                        required={formModifier.isPartner}
                        min="1000"
                        max="99999"
                        step="1"
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        Prix spécial pour les étudiants partenaires (séparé du prix normal)
                      </small>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Inscription et Paiement */}
              <div className="form-section">
                <h4><CreditCard size={20} className="inline mr-2" />Inscription et Paiement</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Code Étudiant</label>
                    <input
                      type="text"
                      name="codeEtudiant"
                      placeholder="Code étudiant"
                      value={formModifier.codeEtudiant}
                      onChange={handleChangeModifier}
                    />
                  </div>
                  <div className="form-group">
                    <label>Commercial</label>
                    <select 
                      name="commercial" 
                      value={formModifier.commercial} 
                      onChange={handleChangeModifier}
                    >
                      <option value="">Aucun commercial assigné</option>
                      {listeCommerciaux.map((commercial) => (
                        <option key={commercial._id} value={commercial._id}>
                          {commercial.nomComplet || commercial.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mode de Paiement *</label>
                    <select
                      name="modePaiement"
                      value={formModifier.modePaiement}
                      onChange={handleChangeModifier}
                      required
                    >
                      <option value="semestriel">Semestriel (2 tranches)</option>
                      <option value="trimestriel">Trimestriel (3 tranches)</option>
                      <option value="mensuel">Mensuel (10 tranches)</option>
                      <option value="annuel">Annuel (paiement complet)</option>
                    </select>
                    <small style={{color: '#666', fontSize: '12px'}}>
                      Semestriel par défaut. Annuel = paiement immédiat complet.
                    </small>
                  </div>
                  {!formModifier.isPartner && (
                    <div className="form-group">
                      <label>Prix Total</label>
                      <input
                        type="number"
                        name="prixTotal"
                        placeholder="Prix total (optionnel)"
                        value={formModifier.prixTotal}
                        onChange={handleChangeModifier}
                        min="0"
                        max="99999"
                        step="1"
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        Champ optionnel - peut être rempli plus tard
                      </small>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pourcentage Bourse (%)</label>
                    <input
                      type="number"
                      name="pourcentageBourse"
                      placeholder="Pourcentage de bourse"
                      value={formModifier.pourcentageBourse}
                      onChange={handleChangeModifier}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type de Paiement</label>
                    <input
                      type="text"
                      name="typePaiement"
                      placeholder="Type de paiement"
                      value={formModifier.typePaiement}
                      onChange={handleChangeModifier}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Situation</label>
                    <input
                      type="text"
                      name="situation"
                      placeholder="Situation"
                      value={formModifier.situation}
                      onChange={handleChangeModifier}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date et Règlement</label>
                  <input
                    type="text"
                    name="dateEtReglement"
                    placeholder="Date et règlement"
                    value={formModifier.dateEtReglement}
                    onChange={handleChangeModifier}
                  />
                </div>
              </div>

              {/* Section Autres informations */}
              <div className="form-section">
                <h4><FileText size={20} className="inline mr-2" />Autres informations</h4>
                
                <div className="form-group">
                  <label>Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChangeModifier}
                  />
                </div>

                {/* Section Documents avec commentaires */}
                <div className="documents-section">
                  <h5>Documents avec Commentaires</h5>
                  
                  {/* CIN */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document CIN</label>
                      <input
                        type="file"
                        name="documentCin"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire CIN</label>
                      <input
                        type="text"
                        name="commentaireCin"
                        placeholder="Commentaire pour le CIN"
                        value={commentairesModifier.commentaireCin}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Bac avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Bac</label>
                      <input
                        type="file"
                        name="documentBacCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Bac</label>
                      <input
                        type="text"
                        name="commentaireBacCommentaire"
                        placeholder="Commentaire pour le Bac"
                        value={commentairesModifier.commentaireBacCommentaire}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Relevé de Notes Bac */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Relevé de Notes Bac</label>
                      <input
                        type="file"
                        name="documentReleveNoteBac"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Relevé Notes Bac</label>
                      <input
                        type="text"
                        name="commentaireReleveNoteBac"
                        placeholder="Commentaire pour le relevé de notes bac"
                        value={commentairesModifier.commentaireReleveNoteBac}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Bac ou Attestation Bac avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bac ou Attestation Bac</label>
                      <input
                        type="file"
                        name="documentBacOuAttestationBacCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Bac/Attestation</label>
                      <input
                        type="text"
                        name="commentaireBacOuAttestationBacCommentaire"
                        placeholder="Commentaire pour le bac ou attestation"
                        value={commentairesModifier.commentaireBacOuAttestationBacCommentaire}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Authentification Bac */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Authentification Bac</label>
                      <input
                        type="file"
                        name="documentAuthentificationBac"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Authentification Bac</label>
                      <input
                        type="text"
                        name="commentaireAuthentificationBac"
                        placeholder="Commentaire pour l'authentification bac"
                        value={commentairesModifier.commentaireAuthentificationBac}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Diplôme avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Diplôme</label>
                      <input
                        type="file"
                        name="documentDiplomeCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Diplôme</label>
                      <input
                        type="text"
                        name="commentaireDiplomeCommentaire"
                        placeholder="Commentaire pour le diplôme"
                        value={commentairesModifier.commentaireDiplomeCommentaire}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Authentication Diplôme */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Authentication Diplôme</label>
                      <input
                        type="file"
                        name="documentAuthenticationDiplome"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Authentication Diplôme</label>
                      <input
                        type="text"
                        name="commentaireAuthenticationDiplome"
                        placeholder="Commentaire pour l'authentication diplôme"
                        value={commentairesModifier.commentaireAuthenticationDiplome}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Attestation de Réussite avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Attestation de Réussite</label>
                      <input
                        type="file"
                        name="documentAttestationReussiteCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Attestation de Réussite</label>
                      <input
                        type="text"
                        name="commentaireAttestationReussiteCommentaire"
                        placeholder="Commentaire pour l'attestation de réussite"
                        value={commentairesModifier.commentaireAttestationReussiteCommentaire}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Relevé de Notes Formation avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Relevé de Notes Formation</label>
                      <input
                        type="file"
                        name="documentReleveNotesFormationCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Relevé Notes Formation</label>
                      <input
                        type="text"
                        name="commentaireReleveNotesFormationCommentaire"
                        placeholder="Commentaire pour le relevé de notes formation"
                        value={commentairesModifier.commentaireReleveNotesFormationCommentaire}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Passeport */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Passeport</label>
                      <input
                        type="file"
                        name="documentPasseport"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Passeport</label>
                      <input
                        type="text"
                        name="commentairePasseport"
                        placeholder="Commentaire pour le passeport"
                        value={commentairesModifier.commentairePasseport}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>

                  {/* Engagement avec commentaire */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Engagement</label>
                      <input
                        type="file"
                        name="documentEngagementCommentaire"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChangeModifier}
                      />
                    </div>
                    <div className="form-group">
                      <label>Commentaire Engagement</label>
                      <input
                        type="text"
                        name="commentaireEngagementCommentaire"
                        placeholder="Commentaire pour l'engagement"
                        value={commentairesModifier.commentaireEngagementCommentaire}
                        onChange={handleCommentaireChangeModifier}
                      />
                    </div>
                  </div>
                </div>

                <div className="checkbox-grid">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="actif"
                        checked={formModifier.actif}
                        onChange={handleChangeModifier}
                      />
                      Étudiant actif
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="paye"
                        checked={formModifier.paye}
                        onChange={handleChangeModifier}
                      />
                      Payé
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="nouvelleInscription"
                        checked={formModifier.nouvelleInscription}
                        onChange={handleChangeModifier}
                      />
                      Nouvelle inscription
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="handicape"
                        checked={formModifier.handicape}
                        onChange={handleChangeModifier}
                      />
                      Handicapé
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="resident"
                        checked={formModifier.resident}
                        onChange={handleChangeModifier}
                      />
                      Résident
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="fonctionnaire"
                        checked={formModifier.fonctionnaire}
                        onChange={handleChangeModifier}
                      />
                      Fonctionnaire
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="mobilite"
                        checked={formModifier.mobilite}
                        onChange={handleChangeModifier}
                      />
                      Mobilité
                    </label>
                  </div>
                </div>
              </div>

              {messageModifier && (
                <div className={`message-ajout ${messageModifier.includes('✅') ? 'success' : 'error'}`}>
                  {messageModifier}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closeEditModal} className="btn-annuler">
                  Annuler
                </button>
                <button type="submit" disabled={loadingModifier} className="btn-enregistrer">
                  {loadingModifier ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de visualisation d'étudiant */}
      {showViewModal && etudiantSelectionne && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails de l'étudiant</h3>
              <button className="btn-fermer-modal" onClick={closeViewModal}>×</button>
            </div>
            
            <div className="view-content">
              {/* Section Informations personnelles */}
              <div className="view-section">
                <h4><User size={20} className="section-icon" />Informations personnelles</h4>
                <div className="student-header">
                  <div className="student-photo">
                    {etudiantSelectionne.image ? (
                      <img 
                        src={`http://195.179.229.230:5000${etudiantSelectionne.image}`} 
                        alt={getNomComplet(etudiantSelectionne)} 
                        className="view-photo"
                      />
                    ) : (
                      <div className="view-photo-placeholder">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <div className="student-basic-info">
                    <h3 className="student-name">{getNomComplet(etudiantSelectionne)}</h3>
                    <div className="student-status">
                      <span className={`status-badge ${etudiantSelectionne.actif ? 'actif' : 'inactif'}`}>
                        {etudiantSelectionne.actif ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {etudiantSelectionne.actif ? 'Actif' : 'Inactif'}
                      </span>
                      {etudiantSelectionne.paye && (
                        <span className="status-badge paye">
                          <CheckCircle size={16} />
                          Payé
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Genre:</span>
                    <span className="info-value">
                      <User size={16} className="info-icon" />
                      {etudiantSelectionne.genre}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date de naissance:</span>
                    <span className="info-value">
                      <Cake size={16} className="info-icon" />
                      {formatDate(etudiantSelectionne.dateNaissance)} ({calculerAge(etudiantSelectionne.dateNaissance)} ans)
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Téléphone:</span>
                    <span className="info-value">
                      <Phone size={16} className="info-icon" />
                      {etudiantSelectionne.telephone || 'N/A'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{etudiantSelectionne.email}</span>
                  </div>
                  {etudiantSelectionne.cin && (
                    <div className="info-row">
                      <span className="info-label">CIN:</span>
                      <span>
                        <IdCard size={16} className="inline mr-1" /> {etudiantSelectionne.cin}
                      </span>
                    </div>
                  )}
                  {etudiantSelectionne.codeMassar && (
                    <div className="info-row">
                      <span className="info-label">Code Massar:</span>
                      <span>
                        <IdCard size={16} className="inline mr-1" /> {etudiantSelectionne.codeMassar}
                      </span>
                    </div>
                  )}
                  {etudiantSelectionne.passeport && (
                    <div className="info-row">
                      <span className="info-label">Passeport:</span>
                      <span className="info-value">{etudiantSelectionne.passeport}</span>
                    </div>
                  )}
                  {etudiantSelectionne.lieuNaissance && (
                    <div className="info-row">
                      <span className="info-label">Lieu de naissance:</span>
                      <span className="info-value">
                        <MapPin size={16} className="info-icon" />
                        {etudiantSelectionne.lieuNaissance}
                      </span>
                    </div>
                  )}
                  {etudiantSelectionne.pays && (
                    <div className="info-row">
                      <span className="info-label">Pays:</span>
                      <span className="info-value">{etudiantSelectionne.pays}</span>
                    </div>
                  )}
                  {etudiantSelectionne.telephoneResponsable && (
                    <div className="info-row">
                      <span className="info-label">Téléphone du Responsable:</span>
                      <span className="info-value">
                        <Phone size={16} className="info-icon" />
                        {etudiantSelectionne.telephoneResponsable}
                      </span>
                    </div>
                  )}
                  {etudiantSelectionne.codeBaccalaureat && (
                    <div className="info-row">
                      <span className="info-label">Code du Baccalauréat:</span>
                      <span className="info-value">{etudiantSelectionne.codeBaccalaureat}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Formation */}
              <div className="view-section">
                <h4><GraduationCap size={20} className="section-icon" />Formation</h4>
                <div className="info-grid">
                  {etudiantSelectionne.anneeScolaire && (
                    <div className="info-row">
                      <span className="info-label">Année Scolaire:</span>
                      <span className="info-value">
                        <Calendar size={16} className="info-icon" />
                        {etudiantSelectionne.anneeScolaire}
                      </span>
                    </div>
                  )}
                  {etudiantSelectionne.niveau && (
                    <div className="info-row">
                      <span className="info-label">Niveau:</span>
                      <span className="info-value">{etudiantSelectionne.niveau}</span>
                    </div>
                  )}
                  {etudiantSelectionne.niveauFormation && (
                    <div className="info-row">
                      <span className="info-label">Niveau de formation:</span>
                      <span className="info-value">{etudiantSelectionne.niveauFormation}</span>
                    </div>
                  )}
                  {etudiantSelectionne.filiere && (
                    <div className="info-row">
                      <span className="info-label">Filière:</span>
                      <span className="info-value">{etudiantSelectionne.filiere}</span>
                    </div>
                  )}
                  {etudiantSelectionne.cycle && (
                    <div className="info-row">
                      <span className="info-label">Cycle:</span>
                      <span className="info-value">{etudiantSelectionne.cycle}</span>
                    </div>
                  )}
                  {etudiantSelectionne.specialiteIngenieur && (
                    <div className="info-row">
                      <span className="info-label">Spécialité d'Ingénieur:</span>
                      <span className="info-value">{etudiantSelectionne.specialiteIngenieur}</span>
                    </div>
                  )}
                  {etudiantSelectionne.optionIngenieur && (
                    <div className="info-row">
                      <span className="info-label">Option d'Ingénieur:</span>
                      <span className="info-value">{etudiantSelectionne.optionIngenieur}</span>
                    </div>
                  )}
                  {etudiantSelectionne.specialiteLicencePro && (
                    <div className="info-row">
                      <span className="info-label">Spécialité Licence Pro:</span>
                      <span className="info-value">{etudiantSelectionne.specialiteLicencePro}</span>
                    </div>
                  )}
                  {etudiantSelectionne.optionLicencePro && (
                    <div className="info-row">
                      <span className="info-label">Option Licence Pro:</span>
                      <span className="info-value">{etudiantSelectionne.optionLicencePro}</span>
                    </div>
                  )}
                  {etudiantSelectionne.specialiteMasterPro && (
                    <div className="info-row">
                      <span className="info-label">Spécialité Master Pro:</span>
                      <span className="info-value">{etudiantSelectionne.specialiteMasterPro}</span>
                    </div>
                  )}
                  {etudiantSelectionne.optionMasterPro && (
                    <div className="info-row">
                      <span className="info-label">Option Master Pro:</span>
                      <span className="info-value">{etudiantSelectionne.optionMasterPro}</span>
                    </div>
                  )}
                  {etudiantSelectionne.option && (
                    <div className="info-row">
                      <span className="info-label">Option:</span>
                      <span className="info-value">{etudiantSelectionne.option}</span>
                    </div>
                  )}
                  {etudiantSelectionne.specialite && (
                    <div className="info-row">
                      <span className="info-label">Spécialité:</span>
                      <span className="info-value">{etudiantSelectionne.specialite}</span>
                    </div>
                  )}
                  {etudiantSelectionne.typeDiplome && (
                    <div className="info-row">
                      <span className="info-label">Type de diplôme:</span>
                      <span className="info-value">{etudiantSelectionne.typeDiplome}</span>
                    </div>
                  )}
                  {etudiantSelectionne.cours && etudiantSelectionne.cours.length > 0 && (
                    <div className="info-row full-width">
                      <span className="info-label">Classe:</span>
                      <div className="cours-tags">
                        {etudiantSelectionne.cours.map((cours, index) => (
                          <span key={index} className="cours-tag">
                            <BookOpen size={14} className="info-icon" />
                            {cours}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Diplôme et Parcours */}
              <div className="view-section">
                <h4><Award size={20} className="section-icon" />Diplôme et Parcours antérieur</h4>
                <div className="info-grid">
                  {etudiantSelectionne.diplomeAcces && (
                    <div className="info-row">
                      <span className="info-label">Diplôme d'accès:</span>
                      <span className="info-value">{etudiantSelectionne.diplomeAcces}</span>
                    </div>
                  )}
                  {etudiantSelectionne.specialiteDiplomeAcces && (
                    <div className="info-row">
                      <span className="info-label">Spécialité du diplôme d'accès:</span>
                      <span className="info-value">{etudiantSelectionne.specialiteDiplomeAcces}</span>
                    </div>
                  )}
                  {etudiantSelectionne.mention && (
                    <div className="info-row">
                      <span className="info-label">Mention:</span>
                      <span className="info-value">{etudiantSelectionne.mention}</span>
                    </div>
                  )}
                  {etudiantSelectionne.lieuObtentionDiplome && (
                    <div className="info-row">
                      <span className="info-label">Lieu d'obtention du diplôme:</span>
                      <span className="info-value">
                        <MapPin size={16} className="info-icon" />
                        {etudiantSelectionne.lieuObtentionDiplome}
                      </span>
                    </div>
                  )}
                  {etudiantSelectionne.serieBaccalaureat && (
                    <div className="info-row">
                      <span className="info-label">Série du baccalauréat:</span>
                      <span className="info-value">{etudiantSelectionne.serieBaccalaureat}</span>
                    </div>
                  )}
                  {etudiantSelectionne.anneeBaccalaureat && (
                    <div className="info-row">
                      <span className="info-label">Année du baccalauréat:</span>
                      <span className="info-value">{etudiantSelectionne.anneeBaccalaureat}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Inscription et Paiement */}
              <div className="view-section">
                <h4><CreditCard size={20} className="section-icon" />Inscription et Paiement</h4>
                <div className="info-grid">
                  {etudiantSelectionne.codeEtudiant && (
                    <div className="info-row">
                      <span className="info-label">Code étudiant:</span>
                      <span className="info-value">{etudiantSelectionne.codeEtudiant}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Commercial:</span>
                    <span className="info-value">
                      <UserCheck size={16} className="info-icon" />
                      {getNomCommercial(etudiantSelectionne.commercial)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Type d'étudiant:</span>
                    <span className="info-value">
                      <span className={`type-badge ${etudiantSelectionne.isPartner ? 'partner' : 'normal'}`}>
                        {etudiantSelectionne.isPartner ? '🤝 Partner' : '👤 Normal'}
                      </span>
                    </span>
                  </div>
                  {etudiantSelectionne.isPartner && etudiantSelectionne.prixTotalPartner && (
                    <div className="info-row">
                      <span className="info-label">Prix Partner:</span>
                      <span className="info-value">{etudiantSelectionne.prixTotalPartner} DH</span>
                    </div>
                  )}
                  {etudiantSelectionne.sourceInscription && (
                    <div className="info-row">
                      <span className="info-label">Source d'inscription:</span>
                      <span className="info-value">{etudiantSelectionne.sourceInscription}</span>
                    </div>
                  )}
                  {etudiantSelectionne.modePaiement && (
                    <div className="info-row">
                      <span className="info-label">Mode de paiement:</span>
                      <span className="info-value">
                        <CreditCard size={16} className="info-icon" />
                        {etudiantSelectionne.modePaiement}
                      </span>
                    </div>
                  )}
                  {etudiantSelectionne.prixTotal && (
                    <div className="info-row">
                      <span className="info-label">Prix total:</span>
                      <span className="info-value">{etudiantSelectionne.prixTotal} DH</span>
                    </div>
                  )}
                  {etudiantSelectionne.pourcentageBourse && (
                    <div className="info-row">
                      <span className="info-label">Pourcentage bourse:</span>
                      <span className="info-value">{etudiantSelectionne.pourcentageBourse}%</span>
                    </div>
                  )}
                  {etudiantSelectionne.typePaiement && (
                    <div className="info-row">
                      <span className="info-label">Type de paiement:</span>
                      <span className="info-value">{etudiantSelectionne.typePaiement}</span>
                    </div>
                  )}
                  {etudiantSelectionne.situation && (
                    <div className="info-row">
                      <span className="info-label">Situation:</span>
                      <span className="info-value">{etudiantSelectionne.situation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Documents */}
              {etudiantSelectionne.documents && Object.keys(etudiantSelectionne.documents).length > 0 && (
                <div className="view-section">
                  <h4><FileText size={20} className="section-icon" />Documents et Pièces Justificatives</h4>
                  <div className="documents-professional-grid">
                    {Object.entries(etudiantSelectionne.documents).map(([key, doc]) => {
                      if (doc && doc.fichier) {
                        // Convertir le nom du champ en libellé lisible
                        const getDocumentLabel = (key) => {
                          const labels = {
                            'cin': 'CIN',
                            'bacCommentaire': 'Baccalauréat',
                            'releveNoteBac': 'Relevé de Notes Bac',
                            'diplomeCommentaire': 'Diplôme',
                            'attestationReussiteCommentaire': 'Attestation de Réussite',
                            'releveNotesFormationCommentaire': 'Relevé de Notes Formation',
                            'passeport': 'Passeport',
                            'bacOuAttestationBacCommentaire': 'Bac ou Attestation Bac',
                            'authentificationBac': 'Authentification Bac',
                            'authenticationDiplome': 'Authentication Diplôme',
                            'engagementCommentaire': 'Engagement'
                          };
                          return labels[key] || key.replace(/([A-Z])/g, ' $1').trim();
                        };

                        return (
                          <div key={key} className="document-item">
                            <div className="document-info">
                              <FileText size={16} className="info-icon" />
                              <div className="document-details">
                                <span className="document-name">{getDocumentLabel(key)}</span>
                                {doc.commentaire && (
                                  <small className="document-comment">� {doc.commentaire}</small>
                                )}
                                {doc.dateUpload && (
                                  <small className="document-date">
                                    Ajouté le {formatDate(doc.dateUpload)}
                                  </small>
                                )}
                              </div>
                            </div>
                            <a 
                              href={`http://195.179.229.230:5000${doc.fichier}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn-voir-document"
                            >
                              Voir
                            </a>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  {Object.keys(etudiantSelectionne.documents).filter(key => 
                    etudiantSelectionne.documents[key] && etudiantSelectionne.documents[key].fichier
                  ).length === 0 && (
                    <div className="no-documents-message">
                      <FileText size={48} className="no-docs-icon" />
                      <h4>Aucun document disponible</h4>
                      <p>Aucune pièce justificative n'a été téléchargée pour cet étudiant.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Section Statuts spéciaux */}
              <div className="view-section">
                <h4><Shield size={20} className="section-icon" />Statuts spéciaux</h4>
                <div className="statuts-grid">
                  {etudiantSelectionne.handicape && (
                    <span className="statut-special handicape">♿ Handicapé</span>
                  )}
                  {etudiantSelectionne.resident && (
                    <span className="statut-special resident">🏠 Résident</span>
                  )}
                  {etudiantSelectionne.fonctionnaire && (
                    <span className="statut-special fonctionnaire">👨‍💼 Fonctionnaire</span>
                  )}
                  {etudiantSelectionne.mobilite && (
                    <span className="statut-special mobilite">🌍 Mobilité</span>
                  )}
                </div>
                {!etudiantSelectionne.handicape && !etudiantSelectionne.resident && 
                 !etudiantSelectionne.fonctionnaire && !etudiantSelectionne.mobilite && (
                  <p className="no-statut">Aucun statut spécial</p>
                )}
              </div>

              {/* Section Dates importantes */}
              {(etudiantSelectionne.dateInscription || etudiantSelectionne.dateEtReglement || 
                etudiantSelectionne.premiereAnneeInscription || etudiantSelectionne.lastSeen ||
                etudiantSelectionne.createdAt || etudiantSelectionne.updatedAt) && (
                <div className="view-section">
                  <h4><Calendar size={20} className="section-icon" />Dates importantes</h4>
                  <div className="info-grid">
                    {etudiantSelectionne.dateInscription && (
                      <div className="info-row">
                        <span className="info-label">Date d'inscription:</span>
                        <span className="info-value">
                          <Calendar size={16} className="info-icon" />
                          {formatDate(etudiantSelectionne.dateInscription)}
                        </span>
                      </div>
                    )}
                    {etudiantSelectionne.premiereAnneeInscription && (
                      <div className="info-row">
                        <span className="info-label">Première année d'inscription:</span>
                        <span className="info-value">{etudiantSelectionne.premiereAnneeInscription}</span>
                      </div>
                    )}
                    {etudiantSelectionne.dateEtReglement && (
                      <div className="info-row">
                        <span className="info-label">Date et règlement:</span>
                        <span className="info-value">{etudiantSelectionne.dateEtReglement}</span>
                      </div>
                    )}
                    {etudiantSelectionne.lastSeen && (
                      <div className="info-row">
                        <span className="info-label">Dernière connexion:</span>
                        <span className="info-value">
                         
                          <Clock size={16} className="info-icon" />
                          {formatDate(etudiantSelectionne.lastSeen)}
                        </span>
                      </div>
                    )}
                    {etudiantSelectionne.createdAt && (
                      <div className="info-row">
                        <span className="info-label">Créé le:</span>
                        <span className="info-value">
                          <Plus size={16} className="info-icon" />
                          {formatDate(etudiantSelectionne.createdAt)}
                        </span>
                      </div>
                    )}
                    {etudiantSelectionne.updatedAt && (
                      <div className="info-row">
                        <span className="info-label">Dernière modification:</span>
                        <span className="info-value">
                          <Edit size={16} className="info-icon" />
                          {formatDate(etudiantSelectionne.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions view-actions">
              <button onClick={() => handleEdit(etudiantSelectionne)} className="btn-modifier">
                <Edit size={16} className="info-icon" />
                Modifier
              </button>
              <button onClick={closeViewModal} className="btn-fermer">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListeEtudiants;