const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('./models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const Commercial = require('./models/commercialModel');
const Administratif = require('./models/Administratif');
const FinanceProf = require('./models/financeProfModel');
const FormulaireEvaluation = require('./models/FormulaireEvaluation');

const Bulletin = require('./models/Bulletin'); // en haut
const PaiementManager = require('./models/paiementManagerModel');
const Pedagogique = require('./models/Pedagogique');
const { NotificationSupprimee, Configuration } = require('./models/notificationModel');
const { authPedagogique, authAdminOuPedagogique, filtrerParFiliere } = require('./middlewares/pedagogique');


const Etudiant = require('./models/etudiantModel');
const multer = require('multer');
const path = require('path');
const uploadMessageFile = require('./middlewares/uploadMessageFile');
const Rappel = require('./models/RappelPaiement');

const Cours = require('./models/coursModel');
const Paiement = require('./models/paiementModel'); // تأكد أنك قمت بإنشاء الملف
const Evenement = require('./models/evenementModel');
const Presence = require('./models/presenceModel');
const Professeur = require('./models/professeurModel'); // تأكد أنك أنشأت هذا الملف
const authAdmin = require('./middlewares/authAdmin');
const authPaiementManager = require('./middlewares/authPaiementManager');
const authProfesseur = require('./middlewares/authProfesseur');
const authEtudiant = require('./middlewares/authEtudiant');
const Document = require('./models/documentModel');
const Exercice = require('./models/exerciceModel');
const Message = require('./models/messageModel');
const Seance = require('./models/Seance');
const authAdminOrPaiementManager = require('./middlewares/authAdminOrPaiementManager');

const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use('/documents', express.static('documents'));
function genererLienLive(nomCours) {
  const dateStr = new Date().toISOString().split('T')[0]; // ex: 2025-07-07
  const nomSession = `Zettat_${nomCours}_${dateStr}`.replace(/\s+/g, '_');
  return `https://meet.jit.si/${nomSession}`;
}

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connexion à MongoDB réussie'))
.catch((err) => console.error('❌ Erreur MongoDB:', err));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // مجلد الصور
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
// Middleware combiné pour admin et pédagogique
const authAdminOrPedagogique = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, 'jwt_secret_key');
    
    // Vérifier si c'est un admin
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({ message: 'Admin non trouvé' });
      }
      req.user = {
        id: decoded.id,
        role: 'admin',
        nom: decoded.nom
      };
      req.adminId = decoded.id;
      req.admin = admin;
      return next();
    }
    
    // Vérifier si c'est un pédagogique
    if (decoded.role === 'pedagogique') {
      if (Pedagogique) {
        const pedagogique = await Pedagogique.findById(decoded.id);
        if (!pedagogique || !pedagogique.actif) {
          return res.status(401).json({ message: 'Compte pédagogique invalide' });
        }
        req.user = {
          id: decoded.id,
          role: 'pedagogique',
          filiere: pedagogique.filiere,
          nom: decoded.nom,
          estGeneral: pedagogique.filiere === 'GENERAL'
        };
      } else {
        req.user = {
          id: decoded.id,
          role: 'pedagogique',
          filiere: decoded.filiere,
          nom: decoded.nom,
          estGeneral: decoded.filiere === 'GENERAL'
        };
      }
      return next();
    }

    // Vérifier si c'est un professeur de finance
    if (decoded.role === 'finance_prof') {
      const financeProf = await FinanceProf.findById(decoded.id);
      if (!financeProf || !financeProf.actif) {
        return res.status(401).json({ message: 'Compte professeur finance invalide' });
      }
      req.user = {
        id: decoded.id,
        role: 'finance_prof',
        nom: financeProf.nom
      };
      req.profId = decoded.id;
      req.financeProf = financeProf;
      return next();
    }
    
    return res.status(403).json({ message: 'Accès refusé - Rôle admin, pédagogique ou finance requis' });
    
  } catch (error) {
    console.error('Erreur auth:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};
const authCommercial = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const commercial = await Commercial.findById(decoded.id);

    if (!commercial) {
      return res.status(404).json({ message: 'Commercial non trouvé' });
    }

    if (!commercial.actif) {
      return res.status(403).json({ message: '⛔ Compte commercial inactif' });
    }

    req.commercialId = commercial._id;
    req.commercial = commercial;
    req.userRole = 'commercial';
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide ou expiré', error: err.message });
  }
};
const multerDocuments = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads/professeurs/documents');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const nom = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
    cb(null, nom);
  }
});

const uploadDocuments = multer({
  storage: multerDocuments,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé. Formats acceptés: PDF, DOC, DOCX, JPG, PNG'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max par fichier
  }
});

// Combined auth middleware - allows both admin and commercial access
const authAdminOrCommercial = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    const decoded = jwt.verify(token, 'jwt_secret_key');
    
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(404).json({ message: 'Administrateur non trouvé' });
      }
      req.userId = admin._id;
      req.user = admin;
      req.userRole = 'admin';
    } else if (decoded.role === 'commercial') {
      const commercial = await Commercial.findById(decoded.id);
      if (!commercial) {
        return res.status(404).json({ message: 'Commercial non trouvé' });
      }
      if (!commercial.actif) {
        return res.status(403).json({ message: '⛔ Compte commercial inactif' });
      }
      req.commercialId = commercial._id;
      req.commercial = commercial;
      req.userRole = 'commercial';
    } else {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide ou expiré', error: err.message });
  }
};


const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));
app.get('/api/evenements/public', async (req, res) => {
  try {
    const today = new Date();
    const events = await Evenement.find({
      dateFin: { $gte: today }
    }).sort({ dateDebut: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
const genererToken = (admin) => {
    return jwt.sign({ id: admin._id }, 'jwt_secret_key', { expiresIn: '7d' });
};

// 📁 إعداد رفع الوثائق (PDF, Word)
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'documents/'); // مجلد الوثائق
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + unique + ext);
  }
});



const documentUpload = multer({
  storage: documentStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return cb(new Error('Seuls les fichiers PDF et Word sont autorisés'));
    }
    cb(null, true);
  }
});
const exerciceUpload = multer({ storage: storage }); // utiliser نفس multer
const storageVieScolaire = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads/vieScolaire');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadVieScolaire = multer({ storage: storageVieScolaire });

// ✅ Inscription Admin
app.post('/api/admin/register', async (req, res) => {
    try {
        const { nom, email, motDePasse } = req.body;

        const existe = await Admin.findOne({ email });
        if (existe) return res.status(400).json({ message: 'Email déjà utilisé' });

        const hashed = await bcrypt.hash(motDePasse, 10);
        const admin = new Admin({ nom, email, motDePasse: hashed });
        await admin.save();

        const token = genererToken(admin);
        res.status(201).json({ admin, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/documents', (req, res, next) => {
  // التحقق من الدور
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requis' });

  try {
    const decoded = jwt.verify(token, 'jwt_secret_key');
    req.utilisateur = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
}, documentUpload.single('fichier'), async (req, res) => {
  try {
    const { titre, cours } = req.body;

    const fichier = `/documents/${req.file.filename}`;

    const doc = new Document({
      titre,
      cours,
      fichier,
      creePar: req.utilisateur.id
    });

    await doc.save();
    res.status(201).json({ message: '📄 Document ajouté', document: doc });
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur upload document', error: err.message });
  }
});


app.get('/api/etudiant/notifications', authEtudiant, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.etudiantId);
    const aujourdHui = new Date();

    const paiements = await Paiement.find({ etudiant: req.etudiantId });

    // Grouper les paiements par cours
    const paiementsParCours = new Map();

    for (const p of paiements) {
      for (const nomCours of p.cours) {
        if (!paiementsParCours.has(nomCours)) {
          paiementsParCours.set(nomCours, []);
        }
        paiementsParCours.get(nomCours).push(p);
      }
    }

    const notifications = [];

    for (const [cours, paiementsCours] of paiementsParCours.entries()) {
      // Construire les périodes {debut, fin} pour chaque paiement
      const periodes = paiementsCours.map(p => {
        const debut = new Date(p.moisDebut);
        const fin = new Date(debut);
        fin.setMonth(fin.getMonth() + p.nombreMois);
        return { debut, fin };
      });

      // Trier les périodes par date de début
      periodes.sort((a, b) => a.debut - b.debut);

      // Fusionner les périodes qui se chevauchent ou se suivent
      const fusionnees = [];
      let current = periodes[0];

      for (let i = 1; i < periodes.length; i++) {
        const next = periodes[i];
        if (next.debut <= current.fin) {
          // Chevauchement ou continuité
          current.fin = new Date(Math.max(current.fin.getTime(), next.fin.getTime()));
        } else {
          fusionnees.push(current);
          current = next;
        }
      }
      fusionnees.push(current);

      // Vérifier si aujourd'hui est dans une des périodes fusionnées
      let estActif = false;
      let joursRestants = null;

      for (const periode of fusionnees) {
        if (aujourdHui >= periode.debut && aujourdHui <= periode.fin) {
          estActif = true;
          joursRestants = Math.ceil((periode.fin - aujourdHui) / (1000 * 60 * 60 * 24));
          break;
        }
      }

      if (!estActif) {
        const derniereFin = fusionnees[fusionnees.length - 1].fin;
        const joursDepuis = Math.ceil((aujourdHui - derniereFin) / (1000 * 60 * 60 * 24));
        notifications.push({
          type: 'paiement_expire',
          cours,
          message: `💰 Le paiement pour le cours "${cours}" a expiré depuis ${joursDepuis} jour(s).`
        });
      } else if (joursRestants <= 2) {
        notifications.push({
          type: 'paiement_bientot',
          cours,
          message: `⏳ Le paiement pour le cours "${cours}" expirera dans ${joursRestants} jour(s).`
        });
      }
    }

    res.json(notifications);
  } catch (err) {
    console.error('Erreur lors du chargement des notifications paiement étudiant:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route protégée : Dashboard admin
app.get('/api/admin/dashboard', authAdminOrPaiementManager, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-motDePasse');
    res.json({ message: 'Bienvenue sur le tableau de bord', admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Logout (le client supprime simplement le token)
app.post('/api/admin/logout', (req, res) => {
    res.json({ message: 'Déconnexion réussie' });
});




const uploadMultiple = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'fichierInscrit', maxCount: 1 },
  { name: 'originalBac', maxCount: 1 },
  { name: 'releveNotes', maxCount: 1 },
  { name: 'copieCni', maxCount: 1 },
  { name: 'fichierPassport', maxCount: 1 }, // Renommé pour éviter la confusion
  { name: 'dtsBac2', maxCount: 1 },
  { name: 'licence', maxCount: 1 }
]);
// Route POST pour créer un étudiant
app.post('/api/etudiants', authAdmin, uploadMultiple, async (req, res) => {
  try {
    const {
      prenom, nomDeFamille, genre, dateNaissance, telephone, email, motDePasse, cours,
      actif, commercial, cin, passeport, lieuNaissance, pays, niveau, niveauFormation,
      filiere, option, specialite, typeDiplome, diplomeAcces, specialiteDiplomeAcces,
      mention, lieuObtentionDiplome, serieBaccalaureat, anneeBaccalaureat,
      premiereAnneeInscription, sourceInscription, typePaiement, prixTotal,
      pourcentageBourse, situation, nouvelleInscription, paye, handicape,
      resident, fonctionnaire, mobilite, codeEtudiant, dateEtReglement,
      typeFormation, cycle, specialiteIngenieur, optionIngenieur, anneeScolaire,
      specialiteLicencePro, optionLicencePro, specialiteMasterPro, optionMasterPro,
      modePaiement
    } = req.body;

    // Validation des champs obligatoires
    if (!prenom || !nomDeFamille || !telephone || !email || !motDePasse || !dateNaissance) {
      return res.status(400).json({
        message: 'Les champs prenom, nomDeFamille, telephone, email, motDePasse et dateNaissance sont obligatoires'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    // Validation du mot de passe
    if (motDePasse.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // CORRECTION: Validation du mode de paiement avec toutes les valeurs
    if (modePaiement && !['semestriel', 'trimestriel', 'mensuel', 'annuel'].includes(modePaiement)) {
      return res.status(400).json({ 
        message: 'Le mode de paiement doit être "semestriel", "trimestriel", "mensuel" ou "annuel"' 
      });
    }

    // Vérification de l'unicité de l'email
    const existe = await Etudiant.findOne({ email });
    if (existe) return res.status(400).json({ message: 'Email déjà utilisé' });

    // Vérification de l'unicité du code étudiant
    if (codeEtudiant) {
      const codeExiste = await Etudiant.findOne({ codeEtudiant });
      if (codeExiste) return res.status(400).json({ message: 'Code étudiant déjà utilisé' });
    }

    // Détermination automatique du type de formation
    let typeFormationFinal = typeFormation;
    if (!typeFormationFinal && filiere) {
      const mappingFiliere = {
        'CYCLE_INGENIEUR': 'CYCLE_INGENIEUR',
        'MASI': 'MASI',
        'IRM': 'IRM',
        'LICENCE_PRO': 'LICENCE_PRO',
        'MASTER_PRO': 'MASTER_PRO'
      };
      typeFormationFinal = mappingFiliere[filiere];
    }

    // Auto-assignation du niveau
    let niveauFinal = parseInt(niveau) || null;
    
    if (typeFormationFinal === 'LICENCE_PRO') {
      niveauFinal = 3; // Licence Pro = toujours niveau 3
    } else if (typeFormationFinal === 'MASTER_PRO') {
      niveauFinal = 4; // Master Pro = toujours niveau 4
    }

    // Validation selon le type de formation
    if (typeFormationFinal === 'CYCLE_INGENIEUR') {
      if (!niveauFinal || niveauFinal < 1 || niveauFinal > 5) {
        return res.status(400).json({ 
          message: 'Le niveau doit être entre 1 et 5 pour la formation d\'ingénieur' 
        });
      }

      let cycleCalcule = cycle;
      if (niveauFinal >= 1 && niveauFinal <= 2) {
        cycleCalcule = 'Classes Préparatoires Intégrées';
      } else if (niveauFinal >= 3 && niveauFinal <= 5) {
        cycleCalcule = 'Cycle Ingénieur';
      }

      if (niveauFinal >= 1 && niveauFinal <= 2) {
        if (specialiteIngenieur || optionIngenieur) {
          return res.status(400).json({ 
            message: 'Pas de spécialité ou option d\'ingénieur en Classes Préparatoires' 
          });
        }
      }

      if (niveauFinal >= 3 && niveauFinal <= 5) {
        if (!specialiteIngenieur) {
          return res.status(400).json({ 
            message: 'Une spécialité d\'ingénieur est obligatoire à partir de la 3ème année' 
          });
        }
        if (niveauFinal === 5 && !optionIngenieur) {
          return res.status(400).json({ 
            message: 'Une option d\'ingénieur est obligatoire en 5ème année' 
          });
        }
      }

      if (specialiteIngenieur && optionIngenieur) {
        const STRUCTURE_OPTIONS_INGENIEUR = {
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
        };

        if (!STRUCTURE_OPTIONS_INGENIEUR[specialiteIngenieur] || 
            !STRUCTURE_OPTIONS_INGENIEUR[specialiteIngenieur].includes(optionIngenieur)) {
          return res.status(400).json({ 
            message: `L'option "${optionIngenieur}" n'est pas disponible pour la spécialité "${specialiteIngenieur}"` 
          });
        }
      }

      if (specialiteLicencePro || optionLicencePro || specialiteMasterPro || optionMasterPro) {
        return res.status(400).json({ 
          message: 'Les champs Licence Pro et Master Pro ne sont pas disponibles pour CYCLE_INGENIEUR' 
        });
      }

    } else if (typeFormationFinal === 'LICENCE_PRO') {
      if (!specialiteLicencePro) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour Licence Professionnelle' 
        });
      }

      if (optionLicencePro) {
        const OPTIONS_LICENCE_PRO = {
          'Développement Informatique Full Stack': [
            'Développement Mobile',
            'Intelligence Artificielle et Data Analytics',
            'Développement JAVA JEE',
            'Développement Gaming et VR'
          ],
          'Réseaux et Cybersécurité': [
            'Administration des Systèmes et Cloud Computing'
          ]
        };

        const optionsDisponibles = OPTIONS_LICENCE_PRO[specialiteLicencePro];
        if (!optionsDisponibles || !optionsDisponibles.includes(optionLicencePro)) {
          return res.status(400).json({ 
            message: `L'option "${optionLicencePro}" n'est pas disponible pour la spécialité "${specialiteLicencePro}"` 
          });
        }
      }

      if (cycle || specialiteIngenieur || optionIngenieur || specialiteMasterPro || optionMasterPro) {
        return res.status(400).json({ 
          message: 'Les champs Cycle Ingénieur et Master Pro ne sont pas disponibles pour LICENCE_PRO' 
        });
      }

    } else if (typeFormationFinal === 'MASTER_PRO') {
      if (!specialiteMasterPro) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour Master Professionnel' 
        });
      }

      if (optionMasterPro) {
        const OPTIONS_MASTER_PRO = {
          'Cybersécurité et Transformation Digitale': [
            'Systèmes de communication et Data center',
            'Management des Systèmes d\'Information'
          ],
          'Génie Informatique et Innovation Technologique': [
            'Génie Logiciel',
            'Intelligence Artificielle et Data Science'
          ]
        };

        const optionsDisponibles = OPTIONS_MASTER_PRO[specialiteMasterPro];
        if (!optionsDisponibles || !optionsDisponibles.includes(optionMasterPro)) {
          return res.status(400).json({ 
            message: `L'option "${optionMasterPro}" n'est pas disponible pour la spécialité "${specialiteMasterPro}"` 
          });
        }
      }

      if (cycle || specialiteIngenieur || optionIngenieur || specialiteLicencePro || optionLicencePro) {
        return res.status(400).json({ 
          message: 'Les champs Cycle Ingénieur et Licence Pro ne sont pas disponibles pour MASTER_PRO' 
        });
      }

    } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
      if (!niveauFinal) {
        return res.status(400).json({ 
          message: `Le niveau est obligatoire pour ${typeFormationFinal}` 
        });
      }
      
      if (niveauFinal >= 3 && !specialite) {
        return res.status(400).json({ 
          message: `Une spécialité est obligatoire à partir de la 3ème année pour ${typeFormationFinal}` 
        });
      }

      if (niveauFinal === 5 && !option) {
        return res.status(400).json({ 
          message: `Une option est obligatoire en 5ème année pour ${typeFormationFinal}` 
        });
      }

      if (specialite) {
        const STRUCTURE_FORMATION = {
          MASI: {
            3: ['Entreprenariat, audit et finance', 'Développement commercial et marketing digital'],
            4: ['Management des affaires et systèmes d\'information'],
            5: ['Management des affaires et systèmes d\'information']
          },
          IRM: {
            3: ['Développement informatique', 'Réseaux et cybersécurité'],
            4: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale'],
            5: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale']
          }
        };

        const specialitesDisponibles = STRUCTURE_FORMATION[typeFormationFinal]?.[niveauFinal] || [];
        if (specialitesDisponibles.length > 0 && !specialitesDisponibles.includes(specialite)) {
          return res.status(400).json({ 
            message: `La spécialité "${specialite}" n'est pas disponible pour ${typeFormationFinal} niveau ${niveauFinal}` 
          });
        }
      }

      if (cycle || specialiteIngenieur || optionIngenieur || specialiteLicencePro || optionLicencePro || specialiteMasterPro || optionMasterPro) {
        return res.status(400).json({ 
          message: 'Les champs Cycle Ingénieur, Licence Pro et Master Pro ne sont pas disponibles pour les formations MASI/IRM' 
        });
      }
    }

    // Gestion des cours avec limite
    const MAX_ETUDIANTS = 20;
    let coursArray = [];

    if (cours) {
      const coursDemandes = Array.isArray(cours) ? cours : [cours];
      for (let coursNom of coursDemandes) {
        const suffixes = ['', ' A', ' B', ' C', ' D', ' E', ' F', ' G'];
        let nomAvecSuffixe = '';
        let coursTrouve = false;

        for (let suffix of suffixes) {
          nomAvecSuffixe = coursNom + suffix;

          let coursExiste = await Cours.findOne({ nom: nomAvecSuffixe });
          if (!coursExiste) {
            const coursOriginal = await Cours.findOne({ nom: coursNom });
            let professeurs = [];
            if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
              professeurs = coursOriginal.professeur;
            } else {
              const prof = await Professeur.findOne({ cours: coursNom });
              if (prof) professeurs = [prof.nom];
            }
            const nouveauCours = new Cours({
              nom: nomAvecSuffixe,
              professeur: professeurs,
              creePar: req.adminId
            });
            await nouveauCours.save();
            for (const nomProf of professeurs) {
              await Professeur.updateOne(
                { nom: nomProf },
                { $addToSet: { cours: nomAvecSuffixe } }
              );
            }
            coursExiste = nouveauCours;
          }

          const count = await Etudiant.countDocuments({ cours: nomAvecSuffixe });
          if (count < MAX_ETUDIANTS) {
            coursArray.push(nomAvecSuffixe);
            coursTrouve = true;
            break;
          }
        }

        if (!coursTrouve) {
          const nextSuffix = ' ' + String.fromCharCode(65 + suffixes.length);
          const nomNouveau = `${coursNom}${nextSuffix}`;
          const coursOriginal = await Cours.findOne({ nom: coursNom });
          let professeurs = [];
          if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
            professeurs = coursOriginal.professeur;
          } else {
            const prof = await Professeur.findOne({ cours: coursNom });
            if (prof) professeurs = [prof.nom];
          }
          const nouveauCours = new Cours({
            nom: nomNouveau,
            professeur: professeurs,
            creePar: req.adminId
          });
          await nouveauCours.save();
          for (const nomProf of professeurs) {
            await Professeur.updateOne(
              { nom: nomProf },
              { $addToSet: { cours: nomNouveau } }
            );
          }
          coursArray.push(nomNouveau);
        }
      }
    }

    // Traitement des fichiers
    const getFilePath = (fileField) => {
      return req.files && req.files[fileField] && req.files[fileField][0] 
        ? `/uploads/${req.files[fileField][0].filename}` 
        : '';
    };

    const imagePath = getFilePath('image');
    const fichierInscritPath = getFilePath('fichierInscrit');
    const originalBacPath = getFilePath('originalBac');
    const releveNotesPath = getFilePath('releveNotes');
    const copieCniPath = getFilePath('copieCni');
    const fichierPassportPath = getFilePath('fichierPassport');
    const dtsBac2Path = getFilePath('dtsBac2');
    const licencePath = getFilePath('licence');
    
    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Fonctions utilitaires
    const toDate = (d) => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    };

    const toBool = (v) => v === 'true' || v === true;
    
    const toNumber = (v) => {
      if (!v || v === '') return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };

    const dateNaissanceFormatted = toDate(dateNaissance);
    const dateEtReglementFormatted = toDate(dateEtReglement);

    const boolFields = ['actif', 'paye', 'handicape', 'resident', 'fonctionnaire', 'mobilite', 'nouvelleInscription'];
    boolFields.forEach(field => {
      if (req.body[field] !== undefined) req.body[field] = toBool(req.body[field]);
    });

    const prixTotalNum = toNumber(prixTotal);
    const pourcentageBourseNum = toNumber(pourcentageBourse);
    const anneeBacNum = toNumber(anneeBaccalaureat);
    const premiereInscriptionNum = toNumber(premiereAnneeInscription);

    if (pourcentageBourseNum && (pourcentageBourseNum < 0 || pourcentageBourseNum > 100)) {
      return res.status(400).json({ message: 'Le pourcentage de bourse doit être entre 0 et 100' });
    }

    // Logique automatique pour le mode de paiement annuel
    if (modePaiement === 'annuel' && paye === undefined) {
      req.body.paye = true;
    }

    // Création de l'étudiant
    const etudiantData = {
      prenom: prenom.trim(),
      nomDeFamille: nomDeFamille.trim(),
      genre,
      dateNaissance: dateNaissanceFormatted,
      telephone: telephone.trim(),
      email: email.toLowerCase().trim(),
      motDePasse: hashedPassword,
      cin: cin?.trim() || '',
      passeport: passeport?.trim() || '',
      lieuNaissance: lieuNaissance?.trim() || '',
      pays: pays?.trim() || '',
      niveau: niveauFinal,
      niveauFormation: niveauFormation?.trim() || '',
      filiere: filiere?.trim() || '',
      typeFormation: typeFormationFinal,
      typeDiplome: typeDiplome?.trim() || '',
      diplomeAcces: diplomeAcces?.trim() || '',
      specialiteDiplomeAcces: specialiteDiplomeAcces?.trim() || '',
      mention: mention?.trim() || '',
      lieuObtentionDiplome: lieuObtentionDiplome?.trim() || '',
      serieBaccalaureat: serieBaccalaureat?.trim() || '',
      anneeBaccalaureat: anneeBacNum,
      premiereAnneeInscription: premiereInscriptionNum,
      sourceInscription: sourceInscription?.trim() || '',
      typePaiement: typePaiement?.trim() || '',
      prixTotal: prixTotalNum,
      pourcentageBourse: pourcentageBourseNum,
      situation: situation?.trim() || '',
      codeEtudiant: codeEtudiant?.trim() || '',
      dateEtReglement: dateEtReglementFormatted,
      cours: coursArray,
      modePaiement: modePaiement || 'semestriel',
      
      // Fichiers
      image: imagePath,
      fichierInscrit: fichierInscritPath,
      originalBac: originalBacPath,
      releveNotes: releveNotesPath,
      copieCni: copieCniPath,
      passport: fichierPassportPath,
      dtsBac2: dtsBac2Path,
      licence: licencePath,
      
      // Champs booléens
      actif: req.body.actif,
      paye: req.body.paye,
      handicape: req.body.handicape,
      resident: req.body.resident,
      fonctionnaire: req.body.fonctionnaire,
      mobilite: req.body.mobilite,
      nouvelleInscription: req.body.nouvelleInscription,
      commercial: commercial || null,
      creeParAdmin: req.adminId,
      
      anneeScolaire: anneeScolaire || undefined
    };

    // Assignation des champs spécifiques selon le type de formation
    if (typeFormationFinal === 'CYCLE_INGENIEUR') {
      const cycleCalcule = niveauFinal >= 1 && niveauFinal <= 2 ? 'Classes Préparatoires Intégrées' : 'Cycle Ingénieur';
      etudiantData.cycle = cycleCalcule;
      etudiantData.specialiteIngenieur = specialiteIngenieur?.trim() || undefined;
      etudiantData.optionIngenieur = optionIngenieur?.trim() || undefined;
      etudiantData.specialite = '';
      etudiantData.option = '';
      etudiantData.specialiteLicencePro = undefined;
      etudiantData.optionLicencePro = undefined;
      etudiantData.specialiteMasterPro = undefined;
      etudiantData.optionMasterPro = undefined;
      
    } else if (typeFormationFinal === 'LICENCE_PRO') {
      etudiantData.specialiteLicencePro = specialiteLicencePro?.trim() || undefined;
      etudiantData.optionLicencePro = optionLicencePro?.trim() || undefined;
      etudiantData.cycle = undefined;
      etudiantData.specialiteIngenieur = undefined;
      etudiantData.optionIngenieur = undefined;
      etudiantData.specialiteMasterPro = undefined;
      etudiantData.optionMasterPro = undefined;
      etudiantData.specialite = '';
      etudiantData.option = '';
      
    } else if (typeFormationFinal === 'MASTER_PRO') {
      etudiantData.specialiteMasterPro = specialiteMasterPro?.trim() || undefined;
      etudiantData.optionMasterPro = optionMasterPro?.trim() || undefined;
      etudiantData.cycle = undefined;
      etudiantData.specialiteIngenieur = undefined;
      etudiantData.optionIngenieur = undefined;
      etudiantData.specialiteLicencePro = undefined;
      etudiantData.optionLicencePro = undefined;
      etudiantData.specialite = '';
      etudiantData.option = '';
      
    } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
      etudiantData.specialite = specialite?.trim() || '';
      etudiantData.option = option?.trim() || '';
      etudiantData.cycle = undefined;
      etudiantData.specialiteIngenieur = undefined;
      etudiantData.optionIngenieur = undefined;
      etudiantData.specialiteLicencePro = undefined;
      etudiantData.optionLicencePro = undefined;
      etudiantData.specialiteMasterPro = undefined;
      etudiantData.optionMasterPro = undefined;
    }

    const etudiant = new Etudiant(etudiantData);
    const etudiantSauve = await etudiant.save();
    
    // Préparer la réponse sans le mot de passe
    const etudiantResponse = etudiantSauve.toObject();
    delete etudiantResponse.motDePasse;

    res.status(201).json(etudiantResponse);

  } catch (err) {
    console.error('Erreur ajout étudiant:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} déjà utilisé par un autre étudiant` });
    }

    res.status(500).json({
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});

// Route PUT pour modifier un étudiant
app.put('/api/etudiants/:id', authAdmin, uploadMultiple, async (req, res) => {
  try {
    const {
      prenom, nomDeFamille, genre, dateNaissance, telephone, email, motDePasse, cours,
      actif, commercial, cin, passeport, lieuNaissance, pays, niveau, niveauFormation,
      filiere, option, specialite, typeDiplome, diplomeAcces, specialiteDiplomeAcces,
      mention, lieuObtentionDiplome, serieBaccalaureat, anneeBaccalaureat,
      premiereAnneeInscription, sourceInscription, typePaiement, prixTotal,
      pourcentageBourse, situation, nouvelleInscription, paye, handicape,
      resident, fonctionnaire, mobilite, codeEtudiant, dateEtReglement,
      typeFormation, cycle, specialiteIngenieur, optionIngenieur, anneeScolaire,
      specialiteLicencePro, optionLicencePro, specialiteMasterPro, optionMasterPro,
      modePaiement
    } = req.body;

    // Rechercher l'étudiant existant
    const etudiantExistant = await Etudiant.findById(req.params.id);
    if (!etudiantExistant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    // CORRECTION: Validation du mode de paiement avec toutes les valeurs
    if (modePaiement && !['semestriel', 'trimestriel', 'mensuel', 'annuel'].includes(modePaiement)) {
      return res.status(400).json({ 
        message: 'Le mode de paiement doit être "semestriel", "trimestriel", "mensuel" ou "annuel"' 
      });
    }

    // Détecter si c'est une nouvelle année scolaire
    const estNouvelleAnneeScolaire = anneeScolaire && 
                                    anneeScolaire.trim() !== '' && 
                                    anneeScolaire !== etudiantExistant.anneeScolaire;

    if (estNouvelleAnneeScolaire) {
      // Code pour nouvelle année scolaire (si nécessaire)
      // ... (code existant pour nouvelle année)
    }

    // Modification normale
    const filiereFinale = filiere || etudiantExistant.filiere;
    let typeFormationFinal = typeFormation || etudiantExistant.typeFormation;
    
    if (!typeFormationFinal && filiereFinale) {
      const mappingFiliere = {
        'CYCLE_INGENIEUR': 'CYCLE_INGENIEUR',
        'MASI': 'MASI',
        'IRM': 'IRM',
        'LICENCE_PRO': 'LICENCE_PRO',
        'MASTER_PRO': 'MASTER_PRO'
      };
      typeFormationFinal = mappingFiliere[filiereFinale];
    }

    // Détermination du niveau
    let niveauFinal;
    if (niveau !== undefined && niveau !== null && niveau !== '') {
      niveauFinal = parseInt(niveau);
    } else {
      niveauFinal = etudiantExistant.niveau;
    }
    
    // Auto-assignation du niveau pour LP et MP
    if (typeFormationFinal === 'LICENCE_PRO') {
      niveauFinal = 3;
    } else if (typeFormationFinal === 'MASTER_PRO') {
      niveauFinal = 4;
    }

    // Validation selon le type de formation
    if (typeFormationFinal === 'CYCLE_INGENIEUR') {
      if (!niveauFinal || niveauFinal < 1 || niveauFinal > 5) {
        return res.status(400).json({ 
          message: 'Le niveau doit être entre 1 et 5 pour la formation d\'ingénieur' 
        });
      }

      if (niveauFinal >= 1 && niveauFinal <= 2) {
        if (specialiteIngenieur || optionIngenieur) {
          return res.status(400).json({ 
            message: 'Pas de spécialité ou option d\'ingénieur en Classes Préparatoires' 
          });
        }
      }

      if (niveauFinal >= 3 && niveauFinal <= 5) {
        const specialiteAUtiliser = specialiteIngenieur !== undefined 
          ? specialiteIngenieur 
          : etudiantExistant.specialiteIngenieur;
        
        if (!specialiteAUtiliser) {
          return res.status(400).json({ 
            message: 'Une spécialité d\'ingénieur est obligatoire à partir de la 3ème année' 
          });
        }
        
        if (niveauFinal === 5) {
          const optionAUtiliser = optionIngenieur !== undefined 
            ? optionIngenieur 
            : etudiantExistant.optionIngenieur;
          
          if (!optionAUtiliser) {
            return res.status(400).json({ 
              message: 'Une option d\'ingénieur est obligatoire en 5ème année' 
            });
          }
          
          const STRUCTURE_OPTIONS_INGENIEUR = {
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
          };

          const optionsDisponibles = STRUCTURE_OPTIONS_INGENIEUR[specialiteAUtiliser];
          
          if (!optionsDisponibles || !optionsDisponibles.includes(optionAUtiliser)) {
            return res.status(400).json({ 
              message: `L'option "${optionAUtiliser}" n'est pas disponible pour la spécialité "${specialiteAUtiliser}". Options disponibles: ${optionsDisponibles ? optionsDisponibles.join(', ') : 'aucune'}` 
            });
          }
        }
      }

      if (specialiteLicencePro || optionLicencePro || specialiteMasterPro || optionMasterPro) {
        return res.status(400).json({ 
          message: 'Les champs Licence Pro et Master Pro ne sont pas disponibles pour CYCLE_INGENIEUR' 
        });
      }

    } else if (typeFormationFinal === 'LICENCE_PRO') {
      const specialiteSource = specialiteLicencePro || etudiantExistant.specialiteLicencePro;
      if (!specialiteSource) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour Licence Professionnelle' 
        });
      }

      const optionSource = optionLicencePro || etudiantExistant.optionLicencePro;
      if (optionSource) {
        const OPTIONS_LICENCE_PRO = {
          'Développement Informatique Full Stack': [
            'Développement Mobile',
            'Intelligence Artificielle et Data Analytics',
            'Développement JAVA JEE',
            'Développement Gaming et VR'
          ],
          'Réseaux et Cybersécurité': [
            'Administration des Systèmes et Cloud Computing'
          ]
        };

        const optionsDisponibles = OPTIONS_LICENCE_PRO[specialiteSource];
        if (!optionsDisponibles || !optionsDisponibles.includes(optionSource)) {
          return res.status(400).json({ 
            message: `L'option "${optionSource}" n'est pas disponible pour cette spécialité` 
          });
        }
      }

    } else if (typeFormationFinal === 'MASTER_PRO') {
      const specialiteSource = specialiteMasterPro || etudiantExistant.specialiteMasterPro;
      if (!specialiteSource) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour Master Professionnel' 
        });
      }

      const optionSource = optionMasterPro || etudiantExistant.optionMasterPro;
      if (optionSource) {
        const OPTIONS_MASTER_PRO = {
          'Cybersécurité et Transformation Digitale': [
            'Systèmes de communication et Data center',
            'Management des Systèmes d\'Information'
          ],
          'Génie Informatique et Innovation Technologique': [
            'Génie Logiciel',
            'Intelligence Artificielle et Data Science'
          ]
        };

        const optionsDisponibles = OPTIONS_MASTER_PRO[specialiteSource];
        if (!optionsDisponibles || !optionsDisponibles.includes(optionSource)) {
          return res.status(400).json({ 
            message: `L'option "${optionSource}" n'est pas disponible pour cette spécialité` 
          });
        }
      }

    } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
      if (!niveauFinal) {
        return res.status(400).json({ 
          message: `Le niveau est obligatoire pour ${typeFormationFinal}` 
        });
      }
      
      if (niveauFinal >= 3) {
        const specialiteAUtiliser = specialite !== undefined ? specialite : etudiantExistant.specialite;
        
        if (!specialiteAUtiliser || specialiteAUtiliser.trim() === '') {
          return res.status(400).json({ 
            message: `Une spécialité est obligatoire à partir de la 3ème année pour ${typeFormationFinal}` 
          });
        }
      }

      if (niveauFinal === 5) {
        const optionAUtiliser = option !== undefined ? option : etudiantExistant.option;
        
        if (!optionAUtiliser || optionAUtiliser.trim() === '') {
          return res.status(400).json({ 
            message: `Une option est obligatoire en 5ème année pour ${typeFormationFinal}` 
          });
        }
      }

      if (specialite !== undefined || niveauFinal !== etudiantExistant.niveau) {
        const specialiteAValider = specialite !== undefined ? specialite : etudiantExistant.specialite;
        if (specialiteAValider && specialiteAValider.trim() !== '') {
          const STRUCTURE_FORMATION = {
            MASI: {
              3: ['Entreprenariat, audit et finance', 'Développement commercial et marketing digital'],
              4: ['Management des affaires et systèmes d\'information'],
              5: ['Management des affaires et systèmes d\'information']
            },
            IRM: {
              3: ['Développement informatique', 'Réseaux et cybersécurité'],
              4: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale'],
              5: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale']
            }
          };

          const specialitesDisponibles = STRUCTURE_FORMATION[typeFormationFinal]?.[niveauFinal] || [];
          
          if (specialitesDisponibles.length > 0 && !specialitesDisponibles.includes(specialiteAValider)) {
            return res.status(400).json({ 
              message: `La spécialité "${specialiteAValider}" n'est pas disponible pour ${typeFormationFinal} niveau ${niveauFinal}. Spécialités disponibles: ${specialitesDisponibles.join(', ')}` 
            });
          }
        }
      }
    }

    // Gestion des cours avec limite
    const MAX_ETUDIANTS = 20;
    let coursArray = etudiantExistant.cours || [];

    if (cours) {
      const coursDemandes = Array.isArray(cours) ? cours : [cours];
      coursArray = [];
      
      for (let coursNom of coursDemandes) {
        const suffixes = ['', ' A', ' B', ' C', ' D', ' E', ' F', ' G'];
        let nomAvecSuffixe = '';
        let coursTrouve = false;

        for (let suffix of suffixes) {
          nomAvecSuffixe = coursNom + suffix;

          let coursExiste = await Cours.findOne({ nom: nomAvecSuffixe });
          if (!coursExiste) {
            const coursOriginal = await Cours.findOne({ nom: coursNom });
            let professeurs = [];
            if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
              professeurs = coursOriginal.professeur;
            } else {
              const prof = await Professeur.findOne({ cours: coursNom });
              if (prof) professeurs = [prof.nom];
            }
            const nouveauCours = new Cours({
              nom: nomAvecSuffixe,
              professeur: professeurs,
              creePar: req.adminId
            });
            await nouveauCours.save();
            for (const nomProf of professeurs) {
              await Professeur.updateOne(
                { nom: nomProf },
                { $addToSet: { cours: nomAvecSuffixe } }
              );
            }
            coursExiste = nouveauCours;
          }

          // Compter en excluant l'étudiant actuel
          const count = await Etudiant.countDocuments({ 
            cours: nomAvecSuffixe,
            _id: { $ne: req.params.id }
          });
          if (count < MAX_ETUDIANTS) {
            coursArray.push(nomAvecSuffixe);
            coursTrouve = true;
            break;
          }
        }

        if (!coursTrouve) {
          const nextSuffix = ' ' + String.fromCharCode(65 + suffixes.length);
          const nomNouveau = `${coursNom}${nextSuffix}`;
          const coursOriginal = await Cours.findOne({ nom: coursNom });
          let professeurs = [];
          if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
            professeurs = coursOriginal.professeur;
          } else {
            const prof = await Professeur.findOne({ cours: coursNom });
            if (prof) professeurs = [prof.nom];
          }
          const nouveauCours = new Cours({
            nom: nomNouveau,
            professeur: professeurs,
            creePar: req.adminId
          });
          await nouveauCours.save();
          for (const nomProf of professeurs) {
            await Professeur.updateOne(
              { nom: nomProf },
              { $addToSet: { cours: nomNouveau } }
            );
          }
          coursArray.push(nomNouveau);
        }
      }
    }

    // Fonctions utilitaires
    const toDate = (val) => {
      if (!val) return undefined;
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    };

    const toNumber = (val) => {
      if (val === undefined || val === '' || val === null) return undefined;
      const n = parseFloat(val);
      return isNaN(n) ? undefined : n;
    };

    const toBool = (val) => val === 'true' || val === true;

    // Validations des champs obligatoires
    if (prenom !== undefined && !prenom.trim()) {
      return res.status(400).json({ message: 'Le prénom est obligatoire' });
    }
    if (nomDeFamille !== undefined && !nomDeFamille.trim()) {
      return res.status(400).json({ message: 'Le nom de famille est obligatoire' });
    }
    if (telephone !== undefined && !telephone.trim()) {
      return res.status(400).json({ message: 'Le téléphone est obligatoire' });
    }
    if (email !== undefined && !email.trim()) {
      return res.status(400).json({ message: 'L\'email est obligatoire' });
    }

    // Validation de l'email si fourni
    if (email && email !== etudiantExistant.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      const emailExiste = await Etudiant.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: req.params.id } 
      });
      if (emailExiste) {
        return res.status(400).json({ message: 'Email déjà utilisé par un autre étudiant' });
      }
    }

    // Validation du code étudiant si fourni
    if (codeEtudiant && codeEtudiant !== etudiantExistant.codeEtudiant) {
      const codeExiste = await Etudiant.findOne({ 
        codeEtudiant: codeEtudiant.trim(),
        _id: { $ne: req.params.id }
      });
      if (codeExiste) {
        return res.status(400).json({ message: 'Code étudiant déjà utilisé' });
      }
    }

    // Validation du pourcentage de bourse
    const pourcentageBourseNum = toNumber(pourcentageBourse);
    if (pourcentageBourseNum && (pourcentageBourseNum < 0 || pourcentageBourseNum > 100)) {
      return res.status(400).json({ message: 'Le pourcentage de bourse doit être entre 0 et 100' });
    }

    // Traitement des fichiers uploadés
    const getFilePath = (fileField) => {
      return req.files && req.files[fileField] && req.files[fileField][0] 
        ? `/uploads/${req.files[fileField][0].filename}` 
        : undefined;
    };

    const imagePath = getFilePath('image');
    const fichierInscritPath = getFilePath('fichierInscrit');
    const originalBacPath = getFilePath('originalBac');
    const releveNotesPath = getFilePath('releveNotes');
    const copieCniPath = getFilePath('copieCni');
    const fichierPassportPath = getFilePath('fichierPassport');
    const dtsBac2Path = getFilePath('dtsBac2');
    const licencePath = getFilePath('licence');

    // Créer l'objet de modifications
    const modifications = {};

    // Appliquer toutes les modifications reçues
    if (prenom !== undefined) modifications.prenom = prenom.trim();
    if (nomDeFamille !== undefined) modifications.nomDeFamille = nomDeFamille.trim();
    if (genre !== undefined) modifications.genre = genre;
    if (dateNaissance !== undefined) modifications.dateNaissance = toDate(dateNaissance);
    if (telephone !== undefined) modifications.telephone = telephone.trim();
    if (email !== undefined) modifications.email = email.toLowerCase().trim();
    if (cours !== undefined) modifications.cours = coursArray;
    if (actif !== undefined) modifications.actif = toBool(actif);
    if (cin !== undefined) modifications.cin = cin.trim();
    if (passeport !== undefined) modifications.passeport = passeport.trim();
    if (lieuNaissance !== undefined) modifications.lieuNaissance = lieuNaissance.trim();
    if (pays !== undefined) modifications.pays = pays.trim();
    
    // Toujours assigner le niveau final calculé
    modifications.niveau = niveauFinal;
    
    if (niveauFormation !== undefined) modifications.niveauFormation = niveauFormation.trim();
    if (filiere !== undefined) modifications.filiere = filiere.trim();
    modifications.typeFormation = typeFormationFinal;
    if (typeDiplome !== undefined) modifications.typeDiplome = typeDiplome.trim();
    if (diplomeAcces !== undefined) modifications.diplomeAcces = diplomeAcces.trim();
    if (specialiteDiplomeAcces !== undefined) modifications.specialiteDiplomeAcces = specialiteDiplomeAcces.trim();
    if (mention !== undefined) modifications.mention = mention.trim();
    if (lieuObtentionDiplome !== undefined) modifications.lieuObtentionDiplome = lieuObtentionDiplome.trim();
    if (serieBaccalaureat !== undefined) modifications.serieBaccalaureat = serieBaccalaureat.trim();
    if (anneeBaccalaureat !== undefined) modifications.anneeBaccalaureat = toNumber(anneeBaccalaureat);
    if (premiereAnneeInscription !== undefined) modifications.premiereAnneeInscription = toNumber(premiereAnneeInscription);
    if (sourceInscription !== undefined) modifications.sourceInscription = sourceInscription.trim();
    if (typePaiement !== undefined) modifications.typePaiement = typePaiement.trim();
    if (prixTotal !== undefined) modifications.prixTotal = toNumber(prixTotal);
    if (pourcentageBourse !== undefined) modifications.pourcentageBourse = toNumber(pourcentageBourse);
    if (situation !== undefined) modifications.situation = situation.trim();
    if (nouvelleInscription !== undefined) modifications.nouvelleInscription = toBool(nouvelleInscription);
    if (paye !== undefined) modifications.paye = toBool(paye);
    if (handicape !== undefined) modifications.handicape = toBool(handicape);
    if (resident !== undefined) modifications.resident = toBool(resident);
    if (fonctionnaire !== undefined) modifications.fonctionnaire = toBool(fonctionnaire);
    if (mobilite !== undefined) modifications.mobilite = toBool(mobilite);
    if (codeEtudiant !== undefined) modifications.codeEtudiant = codeEtudiant.trim();
    if (dateEtReglement !== undefined) modifications.dateEtReglement = toDate(dateEtReglement);
    if (commercial !== undefined) {
      modifications.commercial = (commercial === null || commercial === '' || commercial === 'null') ? null : commercial;
    }
    if (anneeScolaire !== undefined) modifications.anneeScolaire = anneeScolaire;
    if (modePaiement !== undefined) modifications.modePaiement = modePaiement;

    // Validation du mot de passe si fourni
    if (motDePasse !== undefined && motDePasse !== null && motDePasse.trim() !== '') {
      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      const hashedPassword = await bcrypt.hash(motDePasse.trim(), 10);
      modifications.motDePasse = hashedPassword;
    }

    // Logique automatique pour le mode de paiement annuel
    if (modePaiement === 'annuel' && paye === undefined) {
      modifications.paye = true;
    }

    // Assignation des champs spécifiques selon le type de formation
    if (typeFormationFinal === 'CYCLE_INGENIEUR') {
      const cycleCalcule = niveauFinal >= 1 && niveauFinal <= 2 ? 'Classes Préparatoires Intégrées' : 'Cycle Ingénieur';
      modifications.cycle = cycleCalcule;
      
      if (specialiteIngenieur !== undefined) {
        modifications.specialiteIngenieur = specialiteIngenieur?.trim() || undefined;
        
        // Si on change de spécialité, on efface l'option pour éviter l'incompatibilité
        if (specialiteIngenieur !== etudiantExistant.specialiteIngenieur) {
          modifications.optionIngenieur = undefined;
        }
      }
      
      if (optionIngenieur !== undefined) {
        modifications.optionIngenieur = optionIngenieur?.trim() || undefined;
      }
      
      // Nettoyer les autres champs
      modifications.specialite = '';
      modifications.option = '';
      modifications.specialiteLicencePro = undefined;
      modifications.optionLicencePro = undefined;
      modifications.specialiteMasterPro = undefined;
      modifications.optionMasterPro = undefined;
      
    } else if (typeFormationFinal === 'LICENCE_PRO') {
      if (specialiteLicencePro !== undefined) modifications.specialiteLicencePro = specialiteLicencePro?.trim() || undefined;
      if (optionLicencePro !== undefined) modifications.optionLicencePro = optionLicencePro?.trim() || undefined;
      modifications.cycle = undefined;
      modifications.specialiteIngenieur = undefined;
      modifications.optionIngenieur = undefined;
      modifications.specialiteMasterPro = undefined;
      modifications.optionMasterPro = undefined;
      modifications.specialite = '';
      modifications.option = '';
      
    } else if (typeFormationFinal === 'MASTER_PRO') {
      if (specialiteMasterPro !== undefined) modifications.specialiteMasterPro = specialiteMasterPro?.trim() || undefined;
      if (optionMasterPro !== undefined) modifications.optionMasterPro = optionMasterPro?.trim() || undefined;
      modifications.cycle = undefined;
      modifications.specialiteIngenieur = undefined;
      modifications.optionIngenieur = undefined;
      modifications.specialiteLicencePro = undefined;
      modifications.optionLicencePro = undefined;
      modifications.specialite = '';
      modifications.option = '';
      
    } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
      if (specialite !== undefined) modifications.specialite = specialite?.trim() || '';
      if (option !== undefined) modifications.option = option?.trim() || '';
      
      // Nettoyer les autres champs
      modifications.cycle = undefined;
      modifications.specialiteIngenieur = undefined;
      modifications.optionIngenieur = undefined;
      modifications.specialiteLicencePro = undefined;
      modifications.optionLicencePro = undefined;
      modifications.specialiteMasterPro = undefined;
      modifications.optionMasterPro = undefined;
    }

    // Traitement des fichiers uploadés
    if (imagePath !== undefined) modifications.image = imagePath;
    if (fichierInscritPath !== undefined) modifications.fichierInscrit = fichierInscritPath;
    if (originalBacPath !== undefined) modifications.originalBac = originalBacPath;
    if (releveNotesPath !== undefined) modifications.releveNotes = releveNotesPath;
    if (copieCniPath !== undefined) modifications.copieCni = copieCniPath;
    if (fichierPassportPath !== undefined) modifications.passport = fichierPassportPath;
    if (dtsBac2Path !== undefined) modifications.dtsBac2 = dtsBac2Path;
    if (licencePath !== undefined) modifications.licence = licencePath;

    // Ajouter les informations de modification
    modifications.updatedAt = new Date();
    modifications.modifiePar = req.adminId;

    // Mise à jour du document existant
    const etudiantMiseAJour = await Etudiant.findByIdAndUpdate(
      req.params.id,
      modifications,
      { 
        new: true,
        runValidators: true
      }
    );

    if (!etudiantMiseAJour) {
      return res.status(404).json({ message: 'Étudiant non trouvé lors de la mise à jour' });
    }

    // Retourner le document mis à jour (sans mot de passe)
    const etudiantResponse = etudiantMiseAJour.toObject();
    delete etudiantResponse.motDePasse;

    res.status(200).json({
      message: 'Étudiant mis à jour avec succès',
      data: etudiantResponse,
      isNewSchoolYear: false
    });

  } catch (err) {
    console.error('Erreur lors de la mise à jour étudiant:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} déjà utilisé par un autre étudiant` });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID étudiant invalide' });
    }

    res.status(500).json({
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});
// ===== ROUTE POUR OBTENIR LES INFORMATIONS DE FORMATION (POUR LE FRONTEND) =====

// Ajoutez cette route pour que le frontend puisse récupérer les informations sans envoyer le niveau
app.get('/api/formations/info', authAdmin, (req, res) => {
  try {
    const formationsInfo = {
      CYCLE_INGENIEUR: {
        niveauAuto: false, // Le niveau doit être fourni
        niveauxDisponibles: [1, 2, 3, 4, 5],
        requiresSpecialite: true,
        requiresOption: true,
        specialites: ['Génie Informatique', 'Génie Mécatronique', 'Génie Civil']
      },
      LICENCE_PRO: {
        niveauAuto: true, // Niveau auto-assigné à 3
        niveauAssigne: 3,
        requiresSpecialite: true,
        requiresOption: false, // Optionnel
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
        ]
      },
      MASTER_PRO: {
        niveauAuto: true, // Niveau auto-assigné à 4
        niveauAssigne: 4,
        requiresSpecialite: true,
        requiresOption: false, // Optionnel
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
        ]
      },
      MASI: {
        niveauAuto: false,
        niveauxDisponibles: [1, 2, 3, 4, 5],
        requiresSpecialite: true,
        requiresOption: true
      },
      IRM: {
        niveauAuto: false,
        niveauxDisponibles: [1, 2, 3, 4, 5],
        requiresSpecialite: true,
        requiresOption: true
      }
    };

    res.json(formationsInfo);
  } catch (err) {
    console.error('❌ Erreur récupération infos formations:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});
// Route pour la mise à jour du profil étudiant (email et mot de passe uniquement)
app.put('/api/etudiant/profil', authEtudiant, async (req, res) => {
  try {
    const { email, motDePasse, motDePasseActuel } = req.body;

    // Récupérer l'étudiant actuel
    const etudiant = await Etudiant.findById(req.etudiantId);
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    // Vérification du mot de passe actuel (obligatoire pour toute modification)
    if (!motDePasseActuel || motDePasseActuel.trim() === '') {
      return res.status(400).json({ message: 'Mot de passe actuel requis' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasseActuel, etudiant.motDePasse);
    if (!motDePasseValide) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    const modifications = {};

    // Mise à jour de l'email
    if (email && email.trim() !== '') {
      const emailTrimmed = email.toLowerCase().trim();
      
      // Validation du format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      // Vérifier que l'email n'est pas déjà utilisé par un autre étudiant
      const emailExiste = await Etudiant.findOne({ 
        email: emailTrimmed, 
        _id: { $ne: req.etudiantId } 
      });
      
      if (emailExiste) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      modifications.email = emailTrimmed;
    }

    // Mise à jour du mot de passe
    if (motDePasse && motDePasse.trim() !== '') {
      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      }

      const hashedPassword = await bcrypt.hash(motDePasse.trim(), 10);
      modifications.motDePasse = hashedPassword;
    }

    // Vérifier qu'au moins une modification est demandée
    if (Object.keys(modifications).length === 0) {
      return res.status(400).json({ message: 'Aucune modification à effectuer' });
    }

    // Appliquer les modifications
    modifications.updatedAt = new Date();

    const etudiantMiseAJour = await Etudiant.findByIdAndUpdate(
      req.etudiantId,
      modifications,
      { new: true, runValidators: true }
    );

    // Retourner la réponse sans le mot de passe
    const response = {
      _id: etudiantMiseAJour._id,
      email: etudiantMiseAJour.email,
      prenom: etudiantMiseAJour.prenom,
      nomDeFamille: etudiantMiseAJour.nomDeFamille,
      updatedAt: etudiantMiseAJour.updatedAt
    };

    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      etudiant: response
    });

  } catch (err) {
    console.error('Erreur mise à jour profil étudiant:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    res.status(500).json({
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});
// Route pour la mise à jour du profil professeur (email et mot de passe uniquement)
app.put('/api/professeur/profil', authProfesseur, async (req, res) => {
  try {
    const { email, motDePasse, motDePasseActuel } = req.body;

    // Récupérer le professeur actuel
    const professeur = await Professeur.findById(req.professeurId);
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    // Vérification du mot de passe actuel (obligatoire pour toute modification)
    if (!motDePasseActuel || motDePasseActuel.trim() === '') {
      return res.status(400).json({ message: 'Mot de passe actuel requis' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasseActuel, professeur.motDePasse);
    if (!motDePasseValide) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    const modifications = {};

    // Mise à jour de l'email
    if (email && email.trim() !== '') {
      const emailTrimmed = email.toLowerCase().trim();
      
      // Validation du format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      // Vérifier que l'email n'est pas déjà utilisé par un autre professeur
      const emailExiste = await Professeur.findOne({ 
        email: emailTrimmed, 
        _id: { $ne: req.professeurId } 
      });
      
      if (emailExiste) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      modifications.email = emailTrimmed;
    }

    // Mise à jour du mot de passe
    if (motDePasse && motDePasse.trim() !== '') {
      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      }

      const hashedPassword = await bcrypt.hash(motDePasse.trim(), 10);
      modifications.motDePasse = hashedPassword;
    }

    // Vérifier qu'au moins une modification est demandée
    if (Object.keys(modifications).length === 0) {
      return res.status(400).json({ message: 'Aucune modification à effectuer' });
    }

    // Appliquer les modifications
    modifications.updatedAt = new Date();

    const professeurMiseAJour = await Professeur.findByIdAndUpdate(
      req.professeurId,
      modifications,
      { new: true, runValidators: true }
    );

    // Retourner la réponse sans le mot de passe
    const response = {
      _id: professeurMiseAJour._id,
      email: professeurMiseAJour.email,
      nom: professeurMiseAJour.nom,
      genre: professeurMiseAJour.genre,
      telephone: professeurMiseAJour.telephone,
      matiere: professeurMiseAJour.matiere,
      updatedAt: professeurMiseAJour.updatedAt
    };

    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      professeur: response
    });

  } catch (err) {
    console.error('Erreur mise à jour profil professeur:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    res.status(500).json({
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});
// ===== NOUVELLE ROUTE PUT - DUPLICATION ÉTUDIANT =====
app.put('/api/etudiants/:id', authAdmin, uploadMultiple, async (req, res) => {
  try {
    const {
      prenom, nomDeFamille, genre, dateNaissance, telephone, email, motDePasse, cours,
      actif, cin, passeport, lieuNaissance, pays, niveau, niveauFormation,
      filiere, option, specialite, typeDiplome, diplomeAcces, specialiteDiplomeAcces,
      mention, lieuObtentionDiplome, serieBaccalaureat, anneeBaccalaureat,
      premiereAnneeInscription, sourceInscription, typePaiement, prixTotal,
      pourcentageBourse, situation, nouvelleInscription, paye, handicape,
      resident, fonctionnaire, mobilite, codeEtudiant, dateEtReglement,
      commercial,
      // Nouveaux champs pour le système de formation intelligent
      cycle, specialiteIngenieur, optionIngenieur, anneeScolaire
    } = req.body;

    // 1. 🔍 RECHERCHER L'ÉTUDIANT EXISTANT
    const etudiantExistant = await Etudiant.findById(req.params.id);
    if (!etudiantExistant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    console.log(`📋 Étudiant trouvé: ${etudiantExistant.prenom} ${etudiantExistant.nomDeFamille}`);

    // 2. 🎯 DÉTECTER SI C'EST UNE NOUVELLE ANNÉE SCOLAIRE
    const estNouvelleAnneeScolaire = anneeScolaire && 
                                    anneeScolaire.trim() !== '' && 
                                    anneeScolaire !== etudiantExistant.anneeScolaire;

    if (estNouvelleAnneeScolaire) {
      console.log(`🆕 NOUVELLE ANNÉE SCOLAIRE DÉTECTÉE: ${etudiantExistant.anneeScolaire} → ${anneeScolaire}`);
      
      // 📋 CRÉER UNE COPIE POUR LA NOUVELLE ANNÉE SCOLAIRE
      const donneesCopiees = {
        prenom: etudiantExistant.prenom,
        nomDeFamille: etudiantExistant.nomDeFamille,
        genre: etudiantExistant.genre,
        dateNaissance: etudiantExistant.dateNaissance,
        telephone: etudiantExistant.telephone,
        email: etudiantExistant.email, // 📧 GARDER LE MÊME EMAIL
        motDePasse: etudiantExistant.motDePasse, // 🔐 GARDER LE MÊME MOT DE PASSE
        cours: etudiantExistant.cours,
        actif: etudiantExistant.actif,
        cin: etudiantExistant.cin,
        passeport: etudiantExistant.passeport,
        lieuNaissance: etudiantExistant.lieuNaissance,
        pays: etudiantExistant.pays,
        niveau: etudiantExistant.niveau,
        niveauFormation: etudiantExistant.niveauFormation,
        filiere: etudiantExistant.filiere,
        option: etudiantExistant.option,
        specialite: etudiantExistant.specialite,
        typeDiplome: etudiantExistant.typeDiplome,
        diplomeAcces: etudiantExistant.diplomeAcces,
        specialiteDiplomeAcces: etudiantExistant.specialiteDiplomeAcces,
        mention: etudiantExistant.mention,
        lieuObtentionDiplome: etudiantExistant.lieuObtentionDiplome,
        serieBaccalaureat: etudiantExistant.serieBaccalaureat,
        anneeBaccalaureat: etudiantExistant.anneeBaccalaureat,
        premiereAnneeInscription: etudiantExistant.premiereAnneeInscription,
        sourceInscription: etudiantExistant.sourceInscription,
        typePaiement: etudiantExistant.typePaiement,
        prixTotal: etudiantExistant.prixTotal,
        pourcentageBourse: etudiantExistant.pourcentageBourse,
        situation: etudiantExistant.situation,
        nouvelleInscription: etudiantExistant.nouvelleInscription,
        paye: etudiantExistant.paye,
        handicape: etudiantExistant.handicape,
        resident: etudiantExistant.resident,
        fonctionnaire: etudiantExistant.fonctionnaire,
        mobilite: etudiantExistant.mobilite,
        codeEtudiant: etudiantExistant.codeEtudiant,
        dateEtReglement: etudiantExistant.dateEtReglement,
        
        // 🚨 IMPORTANT: Reset du commercial pour éviter double comptage du CA
        commercial: null, // ← TOUJOURS NULL POUR NOUVELLE ANNÉE
        
        cycle: etudiantExistant.cycle,
        specialiteIngenieur: etudiantExistant.specialiteIngenieur,
        optionIngenieur: etudiantExistant.optionIngenieur,
        anneeScolaire: anneeScolaire, // 🎯 NOUVELLE ANNÉE SCOLAIRE
        
        // Copier les fichiers
        image: etudiantExistant.image,
        fichierInscrit: etudiantExistant.fichierInscrit,
        originalBac: etudiantExistant.originalBac,
        releveNotes: etudiantExistant.releveNotes,
        copieCni: etudiantExistant.copieCni,
        passport: etudiantExistant.passport,
        dtsBac2: etudiantExistant.dtsBac2,
        licence: etudiantExistant.licence,
        
        // Garder l'admin créateur original
        creeParAdmin: etudiantExistant.creeParAdmin
      };

      // Appliquer les autres modifications si présentes
      const applyModifications = (data) => {
        const toDate = (val) => {
          if (!val) return undefined;
          const date = new Date(val);
          return isNaN(date.getTime()) ? undefined : date;
        };

        const toNumber = (val) => {
          if (val === undefined || val === '' || val === null) return undefined;
          const n = parseFloat(val);
          return isNaN(n) ? undefined : n;
        };

        const toBool = (val) => val === 'true' || val === true;

        if (prenom !== undefined) data.prenom = prenom.trim();
        if (nomDeFamille !== undefined) data.nomDeFamille = nomDeFamille.trim();
        if (genre !== undefined) data.genre = genre;
        if (dateNaissance !== undefined) data.dateNaissance = toDate(dateNaissance);
        if (telephone !== undefined) data.telephone = telephone.trim();
        if (cours !== undefined) data.cours = Array.isArray(cours) ? cours : (cours ? [cours] : []);
        if (actif !== undefined) data.actif = toBool(actif);
        if (cin !== undefined) data.cin = cin.trim();
        if (passeport !== undefined) data.passeport = passeport.trim();
        if (lieuNaissance !== undefined) data.lieuNaissance = lieuNaissance.trim();
        if (pays !== undefined) data.pays = pays.trim();
        if (niveau !== undefined) data.niveau = toNumber(niveau);
        if (niveauFormation !== undefined) data.niveauFormation = niveauFormation.trim();
        if (filiere !== undefined) data.filiere = filiere.trim();
        if (option !== undefined) data.option = option?.trim() || '';
        if (specialite !== undefined) data.specialite = specialite?.trim() || '';
        if (typeDiplome !== undefined) data.typeDiplome = typeDiplome.trim();
        if (diplomeAcces !== undefined) data.diplomeAcces = diplomeAcces.trim();
        if (specialiteDiplomeAcces !== undefined) data.specialiteDiplomeAcces = specialiteDiplomeAcces.trim();
        if (mention !== undefined) data.mention = mention.trim();
        if (lieuObtentionDiplome !== undefined) data.lieuObtentionDiplome = lieuObtentionDiplome.trim();
        if (serieBaccalaureat !== undefined) data.serieBaccalaureat = serieBaccalaureat.trim();
        if (anneeBaccalaureat !== undefined) data.anneeBaccalaureat = toNumber(anneeBaccalaureat);
        if (premiereAnneeInscription !== undefined) data.premiereAnneeInscription = toNumber(premiereAnneeInscription);
        if (sourceInscription !== undefined) data.sourceInscription = sourceInscription.trim();
        if (typePaiement !== undefined) data.typePaiement = typePaiement.trim();
        if (prixTotal !== undefined) data.prixTotal = toNumber(prixTotal);
        if (pourcentageBourse !== undefined) data.pourcentageBourse = toNumber(pourcentageBourse);
        if (situation !== undefined) data.situation = situation.trim();
        if (nouvelleInscription !== undefined) data.nouvelleInscription = toBool(nouvelleInscription);
        if (paye !== undefined) data.paye = toBool(paye);
        if (handicape !== undefined) data.handicape = toBool(handicape);
        if (resident !== undefined) data.resident = toBool(resident);
        if (fonctionnaire !== undefined) data.fonctionnaire = toBool(fonctionnaire);
        if (mobilite !== undefined) data.mobilite = toBool(mobilite);
        if (codeEtudiant !== undefined) data.codeEtudiant = codeEtudiant.trim();
        if (dateEtReglement !== undefined) data.dateEtReglement = toDate(dateEtReglement);
        
        // 🎯 GESTION SPÉCIALE DU COMMERCIAL POUR NOUVELLE ANNÉE
        if (commercial !== undefined) {
          data.commercial = (commercial === null || commercial === '' || commercial === 'null') ? null : commercial;
        }
        
        if (cycle !== undefined) data.cycle = cycle?.trim() || undefined;
        if (specialiteIngenieur !== undefined) data.specialiteIngenieur = specialiteIngenieur?.trim() || undefined;
        if (optionIngenieur !== undefined) data.optionIngenieur = optionIngenieur?.trim() || undefined;

        return data;
      };

      // Traitement des fichiers uploadés
      const getFilePath = (fileField) => {
        return req.files && req.files[fileField] && req.files[fileField][0] 
          ? `/uploads/${req.files[fileField][0].filename}` 
          : undefined;
      };

      const imagePath = getFilePath('image');
      const fichierInscritPath = getFilePath('fichierInscrit');
      const originalBacPath = getFilePath('originalBac');
      const releveNotesPath = getFilePath('releveNotes');
      const copieCniPath = getFilePath('copieCni');
      const fichierPassportPath = getFilePath('fichierPassport');
      const dtsBac2Path = getFilePath('dtsBac2');
      const licencePath = getFilePath('licence');

      if (imagePath !== undefined) donneesCopiees.image = imagePath;
      if (fichierInscritPath !== undefined) donneesCopiees.fichierInscrit = fichierInscritPath;
      if (originalBacPath !== undefined) donneesCopiees.originalBac = originalBacPath;
      if (releveNotesPath !== undefined) donneesCopiees.releveNotes = releveNotesPath;
      if (copieCniPath !== undefined) donneesCopiees.copieCni = copieCniPath;
      if (fichierPassportPath !== undefined) donneesCopiees.passport = fichierPassportPath;
      if (dtsBac2Path !== undefined) donneesCopiees.dtsBac2 = dtsBac2Path;
      if (licencePath !== undefined) donneesCopiees.licence = licencePath;

      // Appliquer les modifications
      const donneesFinales = applyModifications(donneesCopiees);

      // 🆕 CRÉER LE NOUVEAU DOCUMENT POUR LA NOUVELLE ANNÉE
      // 🎯 SOLUTION: Créer d'abord le nouveau, puis désactiver l'ancien
      
      // 1️⃣ Modifier temporairement l'email de l'étudiant existant
      await Etudiant.findByIdAndUpdate(etudiantExistant._id, {
        email: `${etudiantExistant.email}_archived_${Date.now()}`,
        actif: false, // Marquer comme inactif
        archivedAt: new Date()
      });

      // 2️⃣ Créer le nouveau document avec l'email original
      const nouvelEtudiant = new Etudiant({
        ...donneesFinales,
        createdAt: new Date(),
        modifiePar: req.adminId,
        versionOriginalId: etudiantExistant._id
      });

      const etudiantSauvegarde = await nouvelEtudiant.save();

      console.log(`✅ Nouvelle année scolaire créée - ID: ${etudiantSauvegarde._id}`);
      console.log(`📋 Document original conservé - ID: ${etudiantExistant._id}`);
      console.log(`💼 Commercial reset à null pour éviter double comptage du CA`);

      // 📤 RETOURNER SEULEMENT LE NOUVEAU DOCUMENT
      const etudiantResponse = etudiantSauvegarde.toObject();
      delete etudiantResponse.motDePasse;

      return res.status(201).json({
        message: `Nouvel étudiant créé pour l'année scolaire ${anneeScolaire}`,
        data: etudiantResponse,
        originalId: etudiantExistant._id,
        newId: etudiantSauvegarde._id,
        isNewSchoolYear: true
      });
    }

    // 3. ✏️ MODIFICATION NORMALE (PAS DE NOUVELLE ANNÉE SCOLAIRE)
    console.log(`✏️ Modification normale de l'étudiant existant`);
    
    const modifications = {};

    // Validation de l'email si fourni
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      // Vérification de l'unicité de l'email (sauf pour l'étudiant actuel)
      const emailExiste = await Etudiant.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: req.params.id } 
      });
      if (emailExiste) {
        return res.status(400).json({ message: 'Email déjà utilisé par un autre étudiant' });
      }
      modifications.email = email.toLowerCase().trim();
    }

    // Validation du mot de passe si fourni
    if (motDePasse !== undefined && motDePasse !== null && motDePasse.trim() !== '') {
      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      const hashedPassword = await bcrypt.hash(motDePasse.trim(), 10);
      modifications.motDePasse = hashedPassword;
    }

    // Fonctions utilitaires
    const toDate = (val) => {
      if (!val) return undefined;
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    };

    const toNumber = (val) => {
      if (val === undefined || val === '' || val === null) return undefined;
      const n = parseFloat(val);
      return isNaN(n) ? undefined : n;
    };

    const toBool = (val) => val === 'true' || val === true;

    // Appliquer toutes les modifications reçues
    if (prenom !== undefined) modifications.prenom = prenom.trim();
    if (nomDeFamille !== undefined) modifications.nomDeFamille = nomDeFamille.trim();
    if (genre !== undefined) modifications.genre = genre;
    if (dateNaissance !== undefined) modifications.dateNaissance = toDate(dateNaissance);
    if (telephone !== undefined) modifications.telephone = telephone.trim();
    if (cours !== undefined) modifications.cours = Array.isArray(cours) ? cours : (cours ? [cours] : []);
    if (actif !== undefined) modifications.actif = toBool(actif);
    if (cin !== undefined) modifications.cin = cin.trim();
    if (passeport !== undefined) modifications.passeport = passeport.trim();
    if (lieuNaissance !== undefined) modifications.lieuNaissance = lieuNaissance.trim();
    if (pays !== undefined) modifications.pays = pays.trim();
    if (niveau !== undefined) modifications.niveau = toNumber(niveau);
    if (niveauFormation !== undefined) modifications.niveauFormation = niveauFormation.trim();
    if (filiere !== undefined) modifications.filiere = filiere.trim();
    if (option !== undefined) modifications.option = option?.trim() || '';
    if (specialite !== undefined) modifications.specialite = specialite?.trim() || '';
    if (typeDiplome !== undefined) modifications.typeDiplome = typeDiplome.trim();
    if (diplomeAcces !== undefined) modifications.diplomeAcces = diplomeAcces.trim();
    if (specialiteDiplomeAcces !== undefined) modifications.specialiteDiplomeAcces = specialiteDiplomeAcces.trim();
    if (mention !== undefined) modifications.mention = mention.trim();
    if (lieuObtentionDiplome !== undefined) modifications.lieuObtentionDiplome = lieuObtentionDiplome.trim();
    if (serieBaccalaureat !== undefined) modifications.serieBaccalaureat = serieBaccalaureat.trim();
    if (anneeBaccalaureat !== undefined) modifications.anneeBaccalaureat = toNumber(anneeBaccalaureat);
    if (premiereAnneeInscription !== undefined) modifications.premiereAnneeInscription = toNumber(premiereAnneeInscription);
    if (sourceInscription !== undefined) modifications.sourceInscription = sourceInscription.trim();
    if (typePaiement !== undefined) modifications.typePaiement = typePaiement.trim();
    if (prixTotal !== undefined) modifications.prixTotal = toNumber(prixTotal);
    if (pourcentageBourse !== undefined) modifications.pourcentageBourse = toNumber(pourcentageBourse);
    if (situation !== undefined) modifications.situation = situation.trim();
    if (nouvelleInscription !== undefined) modifications.nouvelleInscription = toBool(nouvelleInscription);
    if (paye !== undefined) modifications.paye = toBool(paye);
    if (handicape !== undefined) modifications.handicape = toBool(handicape);
    if (resident !== undefined) modifications.resident = toBool(resident);
    if (fonctionnaire !== undefined) modifications.fonctionnaire = toBool(fonctionnaire);
    if (mobilite !== undefined) modifications.mobilite = toBool(mobilite);
    if (codeEtudiant !== undefined) modifications.codeEtudiant = codeEtudiant.trim();
    if (dateEtReglement !== undefined) modifications.dateEtReglement = toDate(dateEtReglement);
    if (commercial !== undefined) {
      modifications.commercial = (commercial === null || commercial === '' || commercial === 'null') ? null : commercial;
    }
    if (cycle !== undefined) modifications.cycle = cycle?.trim() || undefined;
    if (specialiteIngenieur !== undefined) modifications.specialiteIngenieur = specialiteIngenieur?.trim() || undefined;
    if (optionIngenieur !== undefined) modifications.optionIngenieur = optionIngenieur?.trim() || undefined;

    // Traitement des fichiers uploadés
    const getFilePath = (fileField) => {
      return req.files && req.files[fileField] && req.files[fileField][0] 
        ? `/uploads/${req.files[fileField][0].filename}` 
        : undefined;
    };

    const imagePath = getFilePath('image');
    const fichierInscritPath = getFilePath('fichierInscrit');
    const originalBacPath = getFilePath('originalBac');
    const releveNotesPath = getFilePath('releveNotes');
    const copieCniPath = getFilePath('copieCni');
    const fichierPassportPath = getFilePath('fichierPassport');
    const dtsBac2Path = getFilePath('dtsBac2');
    const licencePath = getFilePath('licence');

    if (imagePath !== undefined) modifications.image = imagePath;
    if (fichierInscritPath !== undefined) modifications.fichierInscrit = fichierInscritPath;
    if (originalBacPath !== undefined) modifications.originalBac = originalBacPath;
    if (releveNotesPath !== undefined) modifications.releveNotes = releveNotesPath;
    if (copieCniPath !== undefined) modifications.copieCni = copieCniPath;
    if (fichierPassportPath !== undefined) modifications.passport = fichierPassportPath;
    if (dtsBac2Path !== undefined) modifications.dtsBac2 = dtsBac2Path;
    if (licencePath !== undefined) modifications.licence = licencePath;

    // Ajouter les informations de modification
    modifications.updatedAt = new Date();
    modifications.modifiePar = req.adminId;

    // 4. 💾 MISE À JOUR DU DOCUMENT EXISTANT
    const etudiantMiseAJour = await Etudiant.findByIdAndUpdate(
      req.params.id,
      modifications,
      { 
        new: true, // Retourner le document mis à jour
        runValidators: true // Exécuter les validations Mongoose
      }
    );

    console.log(`✅ Étudiant mis à jour avec succès - ID: ${etudiantMiseAJour._id}`);

    // 📤 RETOURNER LE DOCUMENT MIS À JOUR (sans mot de passe)
    const etudiantResponse = etudiantMiseAJour.toObject();
    delete etudiantResponse.motDePasse;

    res.status(200).json({
      message: 'Étudiant mis à jour avec succès',
      data: etudiantResponse,
      isNewSchoolYear: false
    });

  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour étudiant:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} déjà utilisé par un autre étudiant` });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID étudiant invalide' });
    }

    res.status(500).json({
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});
// ===== ROUTE GET MODIFIÉE POUR FILTRAGE PAR ANNÉE =====

// ===== NOUVELLE ROUTE POUR STATISTIQUES DÉTAILLÉES =====
app.get('/api/statistiques', authAdmin, async (req, res) => {
  try {
    const { anneeScolaire } = req.query;
    
    let matchStage = {};
    if (anneeScolaire && anneeScolaire !== 'toutes') {
      matchStage.anneeScolaire = anneeScolaire;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            filiere: '$filiere',
            niveauFormation: '$niveauFormation',
            cycle: '$cycle',
            niveau: '$niveau'
          },
          totalEtudiants: { $sum: 1 },
          etudiantsActifs: { $sum: { $cond: ['$actif', 1, 0] } },
          etudiantsPayes: { $sum: { $cond: ['$paye', 1, 0] } },
          chiffreAffaireTotal: { $sum: { $toDouble: '$prixTotal' } },
          chiffreAffairePaye: {
            $sum: { $cond: ['$paye', { $toDouble: '$prixTotal' }, 0] }
          },
          montantMoyenParEtudiant: { $avg: { $toDouble: '$prixTotal' } }
        }
      },
      {
        $addFields: {
          chiffreAffaireRestant: {
            $subtract: ['$chiffreAffaireTotal', '$chiffreAffairePaye']
          },
          tauxRecouvrement: {
            $cond: [
              { $gt: ['$chiffreAffaireTotal', 0] },
              {
                $multiply: [
                  { $divide: ['$chiffreAffairePaye', '$chiffreAffaireTotal'] },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { 'chiffreAffaireTotal': -1 } }
    ];

    const statistiquesDetaillees = await Etudiant.aggregate(pipeline);

    res.json({
      success: true,
      data: statistiquesDetaillees,
      filter: { anneeScolaire: anneeScolaire || 'toutes' }
    });

  } catch (err) {
    console.error('❌ Erreur statistiques détaillées:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});


// Route PUT pour modifier un bulletin
app.put('/api/bulletins/:id', authProfesseur, async (req, res) => {
  try {
    const { etudiant, cours, semestre, notes, remarque } = req.body;
    
    // Calcul de la moyenne
    let total = 0;
    let coefTotal = 0;
    for (let n of notes) {
      total += n.note * n.coefficient;
      coefTotal += n.coefficient;
    }
    const moyenne = coefTotal > 0 ? (total / coefTotal).toFixed(2) : null;
    
    const bulletin = await Bulletin.findOneAndUpdate(
      { _id: req.params.id, professeur: req.professeurId },
      {
        etudiant,
        cours,
        semestre,
        notes,
        remarque,
        moyenneFinale: moyenne
      },
      { new: true }
    );
    
    if (!bulletin) {
      return res.status(404).json({ message: 'Bulletin non trouvé' });
    }
    
    res.json({ message: '✅ Bulletin modifié', bulletin });
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', error: err.message });
  }
});

// Route DELETE pour supprimer un bulletin
app.delete('/api/bulletins/:id', authProfesseur, async (req, res) => {
  try {
    const bulletin = await Bulletin.findOneAndDelete({
      _id: req.params.id,
      professeur: req.professeurId
    });
    
    if (!bulletin) {
      return res.status(404).json({ message: 'Bulletin non trouvé' });
    }
    
    res.json({ message: '✅ Bulletin supprimé' });
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', error: err.message });
  }
});

// Lister tous les étudiants
app.get('/api/etudiants', authAdminOrPaiementManager, async (req, res) => {
  try {
    // 🎯 FILTRE PRINCIPAL: Exclure seulement les étudiants avec email archivé
    const baseFilter = {
      email: { $not: /.*_archived_.*/ }, // ❌ Exclure les emails avec "_archived_"
      archivedAt: { $exists: false } // ❌ Exclure ceux explicitement archivés
    };

    console.log('🔍 Filtre appliqué:', JSON.stringify(baseFilter, null, 2));

    // 📋 RÉCUPÉRER LES ÉTUDIANTS
    const etudiants = await Etudiant.find(baseFilter)
      .select('-motDePasse') // ❌ إخفاء كلمة المرور
      .sort({ createdAt: -1 }) // Trier par date de création (plus récent en premier)
      .populate('creeParAdmin', 'nom email'); // Populer l'admin créateur

    console.log(`✅ ${etudiants.length} étudiants visibles récupérés`);

    res.json(etudiants);

  } catch (err) {
    console.error('❌ Erreur lors de la récupération des étudiants:', err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/etudiant', authAdmin, async (req, res) => {
  try {
    const etudiants = await Etudiant.find()
      .select('-motDePasse') // ❌ إخفاء كلمة المرور
      .populate('creeParAdmin', 'nom email');
    res.json(etudiants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 📌 توليد QR - فقط من طرف الأدمين
// ✅ Nouveau endpoint pour générer le QR d'une seule journée










app.post('/api/cours', authAdmin , async (req, res) => {
  try {
    let { nom, professeur } = req.body;

    // ✅ تحويل professeur إلى مصفوفة إذا لم يكن مصفوفة
  if (!Array.isArray(professeur)) {
  professeur = professeur ? [professeur] : [];
}


    // التحقق من عدم تكرار الكورس
    const existe = await Cours.findOne({ nom });
    if (existe) return res.status(400).json({ message: 'Cours déjà existant' });

    const cours = new Cours({
      nom,
      professeur, // مصفوفة من الأسماء
      creePar: req.adminId
    });

    await cours.save();

    // تحديث كل أستاذ وربط الكورس به
    for (const profNom of professeur) {
      const prof = await Professeur.findOne({ nom: profNom });
      if (prof && !prof.cours.includes(nom)) {
        prof.cours.push(nom);
        await prof.save();
      }
    }

    res.status(201).json(cours);
  } catch (err) {
    console.error('❌ Erreur ajout cours:', err);
    res.status(500).json({ error: err.message || 'Erreur inconnue côté serveur' });
  }
});




// Mise à jour de l'état actif de l'étudiant
// ✅ Basculer le statut actif d’un étudiant
app.patch('/api/etudiants/:id/actif', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id);
    if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

    etudiant.actif = !etudiant.actif;
    await etudiant.save();

    res.json(etudiant);
  } catch (err) {
    console.error('Erreur PATCH actif:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/etudiants/:id', authAdmin, async (req, res) => {
  try {
    await Etudiant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Étudiant supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});
// ✅ Obtenir un seul étudiant
app.get('/api/etudiants/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id);
    if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });
    res.json(etudiant);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
app.post('/api/evenements', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { titre, description, dateDebut, dateFin, type } = req.body;

    const evenement = new Evenement({
      titre,
      description,
      dateDebut: new Date(dateDebut),
      dateFin: dateFin ? new Date(dateFin) : new Date(dateDebut),
      type,
      creePar: req.adminId
    });

    await evenement.save();
    res.status(201).json(evenement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/evenements', authAdminOrPaiementManager, async (req, res) => {
  try {
    const evenements = await Evenement.find().sort({ dateDebut: 1 });
    res.json(evenements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ Route pour modifier un événement
app.put('/api/evenements/:id', authAdmin, async (req, res) => {
  try {
    const { titre, description, dateDebut, dateFin, type } = req.body;
    
    // Vérifier que l'événement existe
    const evenement = await Evenement.findById(req.params.id);
    if (!evenement) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Préparer les données de mise à jour
    const updateData = {
      titre,
      description,
      dateDebut: new Date(dateDebut),
      dateFin: dateFin ? new Date(dateFin) : new Date(dateDebut),
      type
    };

    // Mettre à jour l'événement
    const evenementModifie = await Evenement.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );

    console.log('✅ Événement modifié:', evenementModifie);
    res.json(evenementModifie);
    
  } catch (err) {
    console.error('❌ Erreur lors de la modification:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la modification de l\'événement',
      error: err.message 
    });
  }
});

// ✅ Route pour supprimer un événement
app.delete('/api/evenements/:id', authAdmin, async (req, res) => {
  try {
    // Vérifier que l'événement existe
    const evenement = await Evenement.findById(req.params.id);
    if (!evenement) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Supprimer l'événement
    await Evenement.findByIdAndDelete(req.params.id);
    
    console.log('✅ Événement supprimé avec l\'ID:', req.params.id);
    res.json({ 
      message: 'Événement supprimé avec succès',
      evenementSupprime: {
        id: evenement._id,
        titre: evenement.titre
      }
    });
    
  } catch (err) {
    console.error('❌ Erreur lors de la suppression:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de l\'événement',
      error: err.message 
    });
  }
});

// ✅ Route pour obtenir un seul événement (optionnel - pour les détails)
app.get('/api/evenements/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const evenement = await Evenement.findById(req.params.id).populate('creePar', 'nom email');
    
    if (!evenement) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.json(evenement);
    
  } catch (err) {
    console.error('❌ Erreur lors de la récupération:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'événement',
      error: err.message 
    });
  }
});
app.post('/api/qr-session/complete', authProfesseur, async (req, res) => {
  const { cours, dateSession, heure, periode, matiere, nomProfesseur } = req.body;

  try {
    // 🧑‍🎓 جلب كل الطلبة في هذا القسم
    const etudiants = await Etudiant.find({ cours });

    // ✅ جلب الحضور الموجود فعلاً (أي الذين قاموا بمسح الـ QR)
    const presencesExistantes = await Presence.find({
      cours,
      dateSession: new Date(dateSession),
      heure,
      periode
    });

    const idsDejaPresents = presencesExistantes.map(p => String(p.etudiant));

    // 🟥 استخراج الطلبة الذين لم يحضروا
    const absents = etudiants.filter(e => !idsDejaPresents.includes(String(e._id)));

    // 🔁 تسجيل كل طالب كغائب
    for (let etu of absents) {
      await Presence.create({
        etudiant: etu._id,
        cours,
        dateSession: new Date(dateSession),
        present: false,
        creePar: req.professeurId,
        heure,
        periode,
        matiere,
        nomProfesseur
      });
    }

    res.json({ message: `✅ تم تسجيل الغياب: ${absents.length} طالب غائب` });

  } catch (err) {
    console.error('❌ خطأ:', err);
    res.status(500).json({ error: '❌ خطأ في الخادم أثناء إكمال الحضور' });
  }
});

app.get('/api/professeur/presences', authProfesseur, async (req, res) => {
  const data = await Presence.find({ creePar: req.professeurId }).populate('etudiant', 'nomComplet');
  res.json(data);
});
app.get('/api/presences', authAdminOrPaiementManager, async (req, res) => {
  try {
    const data = await Presence.find().populate('etudiant', 'nomComplet');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// middleware: authProfesseur يجب أن تتأكد أنك تستعمل
app.get('/api/professeur/etudiants', authProfesseur, async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.professeurId);
    if (!professeur) {
      return res.status(404).json({ message: 'Pas de professeur' });
    }

    const etudiants = await Etudiant.find({
      cours: { $in: professeur.cours },
      actif: true
    }).select('-motDePasse'); // ✅ Exclure seulement le mot de passe, garder l'email

    res.json(etudiants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 📁 routes/professeur.js أو ضمن app.js إذا كل شيء في ملف واحد
app.get('/api/professeur/presences', authProfesseur, async (req, res) => {
  try {
    const data = await Presence.find({ creePar: req.professeurId })
      .populate('etudiant', 'nomComplet telephone')
      .sort({ dateSession: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/professeur/absences', authProfesseur, async (req, res) => {
  try {
    const absences = await Presence.find({
      creePar: req.professeurId,
      present: false
    }).populate('etudiant', 'nomComplet telephone');

    res.json(absences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ فقط الكورسات التي يدرسها هذا الأستاذ
app.get('/api/professeur/mes-cours', authProfesseur, async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.professeurId);
    if (!professeur) return res.status(404).json({ message: 'Professeur non trouvé' });

    // جلب الكورسات التي عنده فقط
    const cours = await Cours.find({ professeur: professeur.nom }); // أو _id إذا كنت تستخدم ObjectId
    res.json(cours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/presences', authProfesseur, async (req, res) => {
  try {
    const { etudiant, cours, dateSession, present, remarque, heure, periode } = req.body;

    // ✅ تحقق أن هذا الأستاذ يدرّس هذا الكورس
    const prof = await Professeur.findById(req.professeurId);
    if (!prof.cours.includes(cours)) {
      return res.status(403).json({ message: '❌ Vous ne pouvez pas marquer la présence pour ce cours.' });
    }

    // ✅ إنشاء كائن présence جديد مع الوقت والفترة
    const presence = new Presence({
      etudiant,
      cours,
      dateSession: new Date(dateSession),
      present,
      remarque,
      heure,    // 🆕 وقت الحضور بصيغة "08:30"
      periode,  // 🆕 'matin' أو 'soir'
      creePar: req.professeurId,
         matiere: prof.matiere,           // ✅ المادة تلقائياً من حساب الأستاذ
      nomProfesseur: prof.nom   
    });

    await presence.save();
    res.status(201).json(presence);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Ajoutez ces routes à votre app.js après les routes existantes

// ✅ Route pour récupérer toutes les notifications
// 🔧 API de notifications corrigée avec debug



// 🔧 Route de débogage spéciale
app.get('/api/debug/notifications', authAdmin, async (req, res) => {
  try {
    const aujourdHui = new Date();
    const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
    const finMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() + 1, 0);

    // Étudiant spécifique
    const etudiantId = "685dd93cdb5dd547333fe5bb";
    const etudiant = await Etudiant.findById(etudiantId);
    
    // Ses présences ce mois
    const presences = await Presence.find({
      etudiant: etudiantId,
      dateSession: { $gte: debutMois, $lte: finMois }
    });

    // Ses absences ce mois
    const absences = presences.filter(p => !p.present);

    res.json({
      etudiant: {
        nom: etudiant.nomComplet,
        actif: etudiant.actif,
        cours: etudiant.cours
      },
      periode: {
        debut: debutMois,
        fin: finMois
      },
      presences: {
        total: presences.length,
        presents: presences.filter(p => p.present).length,
        absents: absences.length,
        details: absences.map(p => ({
          date: p.dateSession,
          cours: p.cours,
          present: p.present
        }))
      },
      shouldTriggerNotification: absences.length >= 3
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route pour les statistiques du dashboard
app.get('/api/dashboard/stats', authAdmin, async (req, res) => {
  try {
    const aujourdHui = new Date();
    
    // Compter les étudiants actifs
    const etudiantsActifs = await Etudiant.countDocuments({ actif: true });
    
    // Compter les cours
    const totalCours = await Cours.countDocuments();
    
    // Paiements expirés ce mois
    const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
    const paiementsExpiresCount = await Paiement.aggregate([
      {
        $addFields: {
          dateFin: {
            $dateAdd: {
              startDate: "$moisDebut",
              unit: "month",
              amount: "$nombreMois"
            }
          }
        }
      },
      {
        $match: {
          dateFin: { $lt: aujourdHui }
        }
      },
      {
        $count: "total"
      }
    ]);
    
    // Événements cette semaine
    const finSemaine = new Date();
    finSemaine.setDate(finSemaine.getDate() + 7);
    const evenementsSemaine = await Evenement.countDocuments({
      dateDebut: { $gte: aujourdHui, $lte: finSemaine }
    });

    // Absences cette semaine
    const debutSemaine = new Date();
    debutSemaine.setDate(debutSemaine.getDate() - 7);
    const absencesSemaine = await Presence.countDocuments({
      dateSession: { $gte: debutSemaine, $lte: aujourdHui },
      present: false
    });

    res.json({
      etudiantsActifs,
      totalCours,
      paiementsExpires: paiementsExpiresCount[0]?.total || 0,
      evenementsSemaine,
      absencesSemaine,
      timestamp: new Date()
    });

  } catch (err) {
    console.error('❌ Erreur stats dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route pour marquer une notification comme lue (optionnel)
app.post('/api/notifications/:id/mark-read',authAdminOrPaiementManager, (req, res) => {
  // Dans une vraie application, vous stockeriez l'état "lu" en base
  // Pour l'instant, on retourne juste un succès
  res.json({ message: 'Notification marquée comme lue', id: req.params.id });
});
// 📄 Route: GET /api/documents
// مرئية للجميع
app.get('/api/documents', authEtudiant, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.etudiantId);
    const documents = await Document.find({
      cours: { $in: etudiant.cours }
    }).sort({ dateAjout: -1 });

    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.get('/api/professeur/documents', authProfesseur, async (req, res) => {
  try {
    const docs = await Document.find({ creePar: req.professeurId }).sort({ dateUpload: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});app.delete('/api/documents/:id', authProfesseur, async (req, res) => {
  try {
    const documentId = req.params.id;
    const professeurId = req.professeurId; // ✅ depuis le middleware authProfesseur

    // Vérifier que le document appartient à ce professeur
    const document = await Document.findOne({ 
      _id: documentId, 
      creePar: professeurId   // ✅ champ correct
    });

    if (!document) {
      return res.status(404).json({ 
        message: 'Document non trouvé ou accès refusé' 
      });
    }

    // ✅ Optionnel: supprimer le fichier du dossier local (si nécessaire)
    // const fs = require('fs');
    // const filePath = path.join(__dirname, 'documents', path.basename(document.fichier));
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }

    // Supprimer le document de la base
    await Document.findByIdAndDelete(documentId);

    res.json({ message: '✅ Document supprimé avec succès' });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression', 
      error: error.message 
    });
  }
});



// ✅ BACKEND: Retourne les cours de l'étudiant + leurs professeurs
app.get('/api/etudiant/mes-cours', authEtudiant, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.etudiantId);
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    const coursAvecProfs = await Promise.all(
      etudiant.cours.map(async (nomCours) => {
        const professeurs = await Professeur.find({ cours: nomCours })
          .select('_id nom matiere');
        return { nomCours, professeurs };
      })
    );

    res.status(200).json(coursAvecProfs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// ✅ BACKEND: Envoi d'un exercice à un prof spécifique
app.post(
  '/api/etudiant/exercices',
  authEtudiant,
  exerciceUpload.single('fichier'),
  async (req, res) => {
    try {
      const { titre, cours, type, numero, professeurId } = req.body;

      // ✅ التحقق من الحقول المطلوبة
      if (!titre || !cours || !type || !numero || !professeurId || !req.file) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
      }

      // ✅ التأكد أن الأستاذ يدرّس هذا الكورس
      const professeur = await Professeur.findById(professeurId);
      if (!professeur || !professeur.cours.includes(cours)) {
        return res.status(400).json({
          message: '❌ Le professeur sélectionné n\'enseigne pas ce cours.'
        });
      }

      // ✅ إنشاء التمرين
      const fichier = `/uploads/${req.file.filename}`;
      const exercice = new Exercice({
        titre,
        cours,
        type,
        numero,
        fichier,
        etudiant: req.etudiantId,
        professeur: professeurId
      });

      await exercice.save();
      res.status(201).json({
        message: '✅ Exercice envoyé avec succès',
        exercice
      });
    } catch (err) {
      console.error('❌ Erreur envoi exercice:', err);
      res.status(500).json({
        message: '❌ Erreur lors de l\'envoi du devoir',
        error: err.message
      });
    }
  }
);


// DELETE - Supprimer un exercice (par l'étudiant sous 24h)
app.delete('/api/etudiant/exercices/:id', authEtudiant, async (req, res) => {
  try {
    const exercice = await Exercice.findOne({ _id: req.params.id, etudiant: req.etudiantId });

    if (!exercice) {
      return res.status(404).json({ message: 'Exercice introuvable' });
    }

    const maintenant = new Date();
    const diffHeures = (maintenant - exercice.dateEnvoi) / (1000 * 60 * 60);

    if (diffHeures > 24) {
      return res.status(403).json({ message: '⛔ Impossible de supprimer après 24h' });
    }

    // Optionnel : supprimer fichier physique
    const fs = require('fs');
    if (fs.existsSync(`.${exercice.fichier}`)) {
      fs.unlinkSync(`.${exercice.fichier}`);
    }

    await exercice.deleteOne();
    res.json({ message: '✅ Exercice supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur suppression', error: err.message });
  }
});

// ✅ Route pour obtenir le nombre de notifications non lues
app.get('/api/notifications/unread-count', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Cette route utilise la même logique que /api/notifications
    // mais retourne seulement le nombre
    const notifications = [];
    const aujourdHui = new Date();
    
    // Paiements expirés et expirant
    const paiements = await Paiement.find()
      .populate('etudiant', 'nomComplet actif')
      .sort({ moisDebut: -1 });

    const latestPaiementMap = new Map();
    for (const p of paiements) {
      const key = `${p.etudiant?._id}_${p.cours}`;
      if (!latestPaiementMap.has(key)) {
        latestPaiementMap.set(key, p);
      }
    }

    for (const paiement of latestPaiementMap.values()) {
      if (!paiement.etudiant?.actif) continue;
      const debut = new Date(paiement.moisDebut);
      const fin = new Date(debut);
      fin.setMonth(fin.getMonth() + Number(paiement.nombreMois));
      const joursRestants = Math.ceil((fin - aujourdHui) / (1000 * 60 * 60 * 24));

      if (joursRestants < 0 || joursRestants <= 7) {
        notifications.push({ type: 'payment' });
      }
    }

    // Absences répétées
    const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
    const presences = await Presence.find({
      dateSession: { $gte: debutMois, $lte: aujourdHui },
      present: false
    }).populate('etudiant', 'nomComplet actif');

    const absencesParEtudiant = {};
    for (const presence of presences) {
      if (!presence.etudiant?.actif) continue;
      const etudiantId = presence.etudiant._id.toString();
      absencesParEtudiant[etudiantId] = (absencesParEtudiant[etudiantId] || 0) + 1;
    }

    for (const count of Object.values(absencesParEtudiant)) {
      if (count >= 3) {
        notifications.push({ type: 'absence' });
      }
    }

    // Événements à venir
    const dans7jours = new Date();
    dans7jours.setDate(dans7jours.getDate() + 7);
    const evenements = await Evenement.find({
      dateDebut: { $gte: aujourdHui, $lte: dans7jours }
    });

    notifications.push(...evenements.map(() => ({ type: 'event' })));

    res.json({ count: notifications.length });

  } catch (err) {
    console.error('❌ Erreur unread count:', err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ Route pour supprimer une notification
app.delete('/api/notifications/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    console.log("🗑️ Tentative de suppression notification:", notificationId);
    
    // Étant donné que les notifications sont générées dynamiquement,
    // nous devons les stocker temporairement ou utiliser une autre approche
    
    // OPTION 1: Stockage temporaire en mémoire (simple mais limité)
    if (!global.deletedNotifications) {
      global.deletedNotifications = new Set();
    }
    
    // Ajouter l'ID à la liste des notifications supprimées
    global.deletedNotifications.add(notificationId);
    
    console.log("✅ Notification marquée comme supprimée:", notificationId);
    console.log("📋 Total notifications supprimées:", global.deletedNotifications.size);
    
    res.json({ 
      message: 'Notification supprimée avec succès',
      id: notificationId,
      success: true
    });

  } catch (err) {
    console.error('❌ Erreur suppression notification:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de la notification',
      details: err.message 
    });
  }
});

// ✅ Modifier la route GET notifications pour exclure les notifications supprimées

// 🔒 GET /api/professeur/exercices/:cours
app.get('/api/professeur/exercices/:cours', authProfesseur, async (req, res) => {
  try {
    const { cours } = req.params;

    // ✅ جلب التمارين فقط التي أُرسلت لهذا الأستاذ
    const exercices = await Exercice.find({ 
      cours, 
      professeur: req.professeurId // ✅ هذا هو الفرق
    }).populate('etudiant', 'nomComplet email');

    res.json(exercices);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route GET – Etudiant voir ses propres exercices
app.get('/api/etudiant/mes-exercices', authEtudiant, async (req, res) => {
  try {
    const exercices = await Exercice.find({ etudiant: req.etudiantId })
      .populate('professeur', 'nom matiere') // ✅ إظهار اسم ومادة الأستاذ
      .sort({ dateUpload: -1 });

    res.json(exercices);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


// 🔒 PUT /api/professeur/exercices/:id/remarque
app.put('/api/professeur/exercices/:id/remarque', authProfesseur, async (req, res) => {
  try {
    const { remarque } = req.body;
    const { id } = req.params;

    const exercice = await Exercice.findByIdAndUpdate(
      id,
      { remarque },
      { new: true }
    );

    if (!exercice) return res.status(404).json({ message: 'Exercice non trouvé' });

    res.json({ message: '✅ Remarque ajoutée', exercice });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.get('/api/live/:cours', authProfesseur, (req, res) => {
  const { cours } = req.params;
  const lien = genererLienLive(cours);
  res.json({ lien });
});
app.delete('/api/cours/:id', authAdmin, async (req, res) => {
  try {
    const coursId = req.params.id;

    const cours = await Cours.findById(coursId);
    if (!cours) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }

    // ✅ Supprimer le cours de la base
    await Cours.findByIdAndDelete(coursId);

    // ✅ Supprimer le nom du cours chez tous les étudiants
    await Etudiant.updateMany(
      { cours: cours.nom },
      { $pull: { cours: cours.nom } }
    );

    // ✅ Supprimer le nom du cours chez tous les professeurs
    await Professeur.updateMany(
      { cours: cours.nom },
      { $pull: { cours: cours.nom } }
    );

    res.json({ message: `✅ Cours "${cours.nom}" supprimé avec succès` });
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur lors de la suppression', error: err.message });
  }
});



// ✅ Route pour vider la liste des notifications supprimées (optionnel - pour admin)

app.post('/api/contact/send', async (req, res) => {
  try {
    const newMessage = new ContactMessage(req.body);
    await newMessage.save();
    res.status(201).json({ message: '✅ Message envoyé avec succès' });
  } catch (err) {
    console.error('❌ Erreur enregistrement message:', err);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
});

// 🔐 Route protégée - vue admin
app.get('/api/admin/contact-messages', authAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ date: -1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error('❌ Erreur récupération messages:', err);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
});
app.delete('/api/admin/contact-messages/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: '❌ Message non trouvé' });
    }

    res.status(200).json({ message: '✅ Message supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression message:', error);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
});

app.post('/api/admin/qr-week-bulk', async (req, res) => {
  try {
    const { planning } = req.body;

    if (!Array.isArray(planning) || planning.length === 0) {
      return res.status(400).json({ message: 'Données de planning manquantes' });
    }

    const results = [];

    for (const item of planning) {
      const { jour, periode, cours, matiere, professeur, horaire } = item;

      // ✅ Vérifie que tout est bien fourni, y compris `horaire`
      if (!jour || !periode || !cours || !matiere || !professeur || !horaire) {
        continue; // Ignore les lignes incomplètes
      }

      const existe = await QrWeekPlanning.findOne({
        jour,
        periode,
        cours,
      });

      if (existe) {
        existe.matiere = matiere;
        existe.professeur = professeur;
        existe.horaire = horaire; // ✅ met à jour aussi l’horaire
        await existe.save();
        results.push({ updated: existe._id });
      } else {
        const nouv = new QrWeekPlanning({
          jour,
          periode,
          cours,
          matiere,
          professeur,
          horaire // ✅ nouveau champ
        });
        await nouv.save();
        results.push({ created: nouv._id });
      }
    }

    res.status(201).json({ message: '✅ Planning enregistré avec succès', details: results });
  } catch (err) {
    console.error('❌ Erreur bulk qr-week:', err);
    res.status(500).json({ message: '❌ Erreur serveur lors de l’enregistrement du planning' });
  }
});


app.post('/api/qretudiant', authEtudiant, async (req, res) => {
  try {
    const etudiant = req.user;

    const niveau = Array.isArray(etudiant.cours) ? etudiant.cours[0] : etudiant.cours;

    const { date, periode } = req.body;

    if (!date || !periode) {
      return res.status(400).json({ message: 'Date et période requises' });
    }

    const session = await QrSession.findOne({
      date,
      periode,
      cours: niveau // المقارنة هنا حسب أول مستوى فقط
    });

    if (!session) {
      return res.status(404).json({ message: 'Aucune session trouvée pour ce niveau' });
    }

    res.status(200).json({ message: 'Session trouvée', session });

  } catch (err) {
    console.error('Erreur dans /api/qretudiant:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// backend/app.js ou routes/admin.js

app.post('/api/etudiant/qr-presence', authEtudiant, async (req, res) => {
  try {
    const { date, periode, cours, horaire } = req.body;

    // ✅ تحقق من المعطيات الأساسية
    if (!date || !periode || !cours || !horaire) {
      return res.status(400).json({ message: '❌ QR invalide - données manquantes' });
    }

    const now = new Date();
    const heureActuelle = now.toTimeString().slice(0, 5); // "14:25"

    // ✅ ابحث عن الجلسة في QrSession
    const session = await QrSession.findOne({ date, periode, cours, horaire }).populate('professeur');

    if (!session) {
      return res.status(404).json({ message: '❌ QR session non trouvée pour ce cours et horaire' });
    }

    // ✅ تحقق أن التوقيت الحالي داخل النافذة الزمنية
    const [startHour, endHour] = horaire.split('-'); // Exemple: '08:00', '10:00'
    if (heureActuelle < startHour || heureActuelle > endHour) {
      return res.status(400).json({
        message: `⛔ Vous êtes hors de la plage horaire autorisée (${horaire})`
      });
    }

    // ✅ تحقق من الطالب
    const etudiant = await Etudiant.findById(req.etudiantId);
    if (!etudiant) return res.status(404).json({ message: '❌ Étudiant introuvable' });

    const niveauEtudiant = Array.isArray(etudiant.cours) ? etudiant.cours[0] : etudiant.cours;
    if (!niveauEtudiant || niveauEtudiant !== cours) {
      return res.status(403).json({ message: `❌ Ce QR n'est pas destiné à votre niveau (${cours})` });
    }

    // ✅ تحقق من عدم تكرار الحضور في نفس التوقيت
    const dejaPresente = await Presence.findOne({
      etudiant: etudiant._id,
      cours: niveauEtudiant,
      dateSession: date,
      periode,
      heure: horaire // لازم تبحث بنفس `horaire`!
    });

    if (dejaPresente) {
      return res.status(400).json({ message: '⚠️ Présence déjà enregistrée pour ce créneau horaire' });
    }

    // ✅ إنشاء الحضور
    const presence = new Presence({
      etudiant: etudiant._id,
      cours: niveauEtudiant,
      dateSession: date,
      periode,
heure: horaire, // ✅ استخدم التوقيت الرسمي للجلسة
      present: true,
      remarque: 'QR auto',
      matiere: session.matiere || 'Non spécifiée',
      nomProfesseur: session.professeur?.nom || session.professeur?.nomComplet || 'Non spécifié',
      creePar: session.professeur?._id || null
    });

    await presence.save();

    res.status(201).json({ message: '✅ Présence enregistrée avec succès', presence });

  } catch (error) {
    console.error('❌ Erreur dans qr-presence:', error);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
});


// ✅ Route: Supprimer toutes les QR sessions d'un jour donné
app.delete('/api/admin/qr-day-delete', authAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ message: '❌ Date requise pour supprimer les sessions QR' });
    }

    // ✅ Supprimer les sessions QR de ce jour
    const deleted = await QrSession.deleteMany({ date });

    // (Optionnel) Supprimer aussi les présences associées à ce jour
    // await Presence.deleteMany({ dateSession: date });

    res.status(200).json({ message: `✅ ${deleted.deletedCount} sessions QR supprimées pour ${date}` });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des QR sessions:', error);
    res.status(500).json({ message: '❌ Erreur serveur lors de la suppression' });
  }
});

// ✅ Route: Récupérer toutes les sessions QR planifiées pour une date donnée
app.get('/api/admin/qr-day-sessions', authAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: '❌ Date requise pour obtenir les sessions' });
    }

    const qrSessions = await QrSession.find({ date }).populate('professeur');
    res.status(200).json({ qrSessions });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sessions QR:', error);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
});

// Modifier une session individuelle
app.put('/api/admin/qr-session/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { matiere, professeur, periode, horaire } = req.body;
    
    const session = await QrSession.findByIdAndUpdate(id, {
      matiere,
      professeur,
      periode,
      horaire
    }, { new: true });
    
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }
    
    res.json({ message: 'Session modifiée avec succès', session });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une session individuelle
app.delete('/api/admin/qr-session/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await QrSession.findByIdAndDelete(id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }
    
    res.json({ message: 'Session supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// 🔔 إشعارات الأستاذ - الأحداث القادمة فقط
app.get('/api/professeur/notifications', authProfesseur, async (req, res) => {
  try {
    const notifications = [];

    const aujourdHui = new Date();
    const dans7jours = new Date();
    dans7jours.setDate(aujourdHui.getDate() + 7);

    const evenements = await Evenement.find({
      dateDebut: { $gte: aujourdHui, $lte: dans7jours }
    }).sort({ dateDebut: 1 });

    for (const e of evenements) {
      const joursRestants = Math.ceil((new Date(e.dateDebut) - aujourdHui) / (1000 * 60 * 60 * 24));

      notifications.push({
        id: `event_${e._id}`,
        title: `📅 ${e.titre}`,
        message:
          joursRestants === 0
            ? `📌 Aujourd'hui: ${e.titre}`
            : `⏳ Dans ${joursRestants} jour(s): ${e.titre}`,
        date: e.dateDebut
      });
    }

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir la liste des notifications supprimées (debug)
app.get('/api/notifications/deleted', authAdminOrPaiementManager, (req, res) => {
  try {
    if (!global.deletedNotifications) {
      global.deletedNotifications = new Set();
    }
    
    res.json({
      deletedNotifications: Array.from(global.deletedNotifications),
      count: global.deletedNotifications.size
    });

  } catch (err) {
    console.error('❌ Erreur get deleted notifications:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération',
      details: err.message 
    });
  }
});

app.get('/api/professeurs/:id/rapport', authAdminOrPedagogique, async (req, res) => {
  try {
    const professeurId = req.params.id;
    const { mois, annee } = req.query;
    
    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    // ✅ MODIFICATION: Construire le filtre avec dateSeance
    let dateFilter = {
      typeSeance: { $in: ['reelle', 'exception'] }, // ✅ EXCLURE les rattrapages
      actif: true
    };
    
    if (mois && annee) {
      const startDate = new Date(annee, mois - 1, 1);
      const endDate = new Date(annee, mois, 0, 23, 59, 59);
      dateFilter.dateSeance = { // ✅ Utiliser dateSeance
        $gte: startDate,
        $lte: endDate
      };
    } else if (annee) {
      const startDate = new Date(annee, 0, 1);
      const endDate = new Date(annee, 11, 31, 23, 59, 59);
      dateFilter.dateSeance = { // ✅ Utiliser dateSeance
        $gte: startDate,
        $lte: endDate
      };
    }

    // Récupérer les séances du professeur (sans rattrapages)
    const seances = await Seance.find({
      professeur: professeurId,
      ...dateFilter
    }).sort({ dateSeance: 1, heureDebut: 1 }); // ✅ Trier par dateSeance

    const statistiques = calculerStatistiquesProfesseur(seances, professeur);

    res.json({
      professeur: {
        _id: professeur._id,
        nom: professeur.nom,
        email: professeur.email,
        estPermanent: professeur.estPermanent,
        tarifHoraire: professeur.tarifHoraire
      },
      periode: {
        mois: mois ? parseInt(mois) : null,
        annee: annee ? parseInt(annee) : null
      },
      statistiques,
      seances: seances.map(seance => ({
        _id: seance._id,
        jour: seance.jour,
        heureDebut: seance.heureDebut,
        heureFin: seance.heureFin,
        cours: seance.cours,
        matiere: seance.matiere,
        salle: seance.salle,
        dureeHeures: calculerDureeSeance(seance.heureDebut, seance.heureFin),
        dateSeance: seance.dateSeance, // ✅ Ajouter la vraie date
        typeSeance: seance.typeSeance // ✅ Ajouter le type pour info
      })),
      note: "Séances en rattrapage exclues des statistiques" // ✅ Indicateur
    });

  } catch (err) {
    console.error('Erreur rapport professeur:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour obtenir tous les rapports mensuels (CORRIGÉE)
app.get('/api/professeurs/rapports/mensuel', authAdminOrPedagogique, async (req, res) => {
  try {
    const { mois, annee } = req.query;
    
    if (!mois || !annee) {
      return res.status(400).json({ 
        message: 'Mois et année sont requis (ex: ?mois=1&annee=2025)' 
      });
    }

    const startDate = new Date(annee, mois - 1, 1);
    const endDate = new Date(annee, mois, 0, 23, 59, 59);

    // Récupérer tous les professeurs actifs
    const professeurs = await Professeur.find({ actif: true });
    
    const rapports = [];

    for (const professeur of professeurs) {
      // ✅ MODIFICATION: Utiliser dateSeance et exclure les rattrapages
      const seances = await Seance.find({
        professeur: professeur._id,
        dateSeance: { // ✅ Utiliser dateSeance au lieu de createdAt
          $gte: startDate,
          $lte: endDate
        },
        typeSeance: { $in: ['reelle', 'exception'] }, // ✅ EXCLURE les rattrapages
        actif: true
      });

      const statistiques = calculerStatistiquesProfesseur(seances, professeur);
      
      rapports.push({
        professeur: {
          _id: professeur._id,
          nom: professeur.nom,
          email: professeur.email,
          estPermanent: professeur.estPermanent,
          tarifHoraire: professeur.tarifHoraire
        },
        statistiques,
        nombreSeances: seances.length
      });
    }

    // Trier par total payé
    rapports.sort((a, b) => {
      if (!a.professeur.estPermanent && b.professeur.estPermanent) return -1;
      if (a.professeur.estPermanent && !b.professeur.estPermanent) return 1;
      return b.statistiques.totalAPayer - a.statistiques.totalAPayer;
    });

    const totauxGeneraux = {
      totalProfesseurs: rapports.length,
      totalHeures: rapports.reduce((sum, r) => sum + r.statistiques.totalHeures, 0),
      totalPermanents: rapports.filter(r => r.professeur.estPermanent).length,
      totalEntrepreneurs: rapports.filter(r => !r.professeur.estPermanent).length,
      totalAPayer: rapports.reduce((sum, r) => sum + r.statistiques.totalAPayer, 0),
      totalSeances: rapports.reduce((sum, r) => sum + r.nombreSeances, 0)
    };

    res.json({
      periode: {
        mois: parseInt(mois),
        annee: parseInt(annee),
        nomMois: obtenirNomMois(parseInt(mois))
      },
      totauxGeneraux,
      rapports,
      note: "Séances en rattrapage exclues des statistiques" // ✅ Indicateur
    });

  } catch (err) {
    console.error('Erreur rapports mensuels:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour obtenir le rapport annuel d'un professeur (CORRIGÉE)
app.get('/api/professeurs/:id/rapport/annuel', authAdminOrPedagogique, async (req, res) => {
  try {
    const professeurId = req.params.id;
    const { annee } = req.query;
    
    if (!annee) {
      return res.status(400).json({ message: 'Année requise (ex: ?annee=2025)' });
    }

    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    const rapportsMensuels = [];
    let totauxAnnuels = {
      totalHeures: 0,
      totalSeances: 0,
      totalAPayer: 0
    };

    // Générer le rapport pour chaque mois
    for (let mois = 1; mois <= 12; mois++) {
      const startDate = new Date(annee, mois - 1, 1);
      const endDate = new Date(annee, mois, 0, 23, 59, 59);

      // ✅ MODIFICATION: Utiliser dateSeance et exclure rattrapages
      const seances = await Seance.find({
        professeur: professeurId,
        dateSeance: { // ✅ Utiliser dateSeance
          $gte: startDate,
          $lte: endDate
        },
        typeSeance: { $in: ['reelle', 'exception'] }, // ✅ EXCLURE rattrapages
        actif: true
      });

      const statistiques = calculerStatistiquesProfesseur(seances, professeur);
      
      rapportsMensuels.push({
        mois,
        nomMois: obtenirNomMois(mois),
        statistiques,
        nombreSeances: seances.length
      });

      totauxAnnuels.totalHeures += statistiques.totalHeures;
      totauxAnnuels.totalSeances += seances.length;
      totauxAnnuels.totalAPayer += statistiques.totalAPayer;
    }

    res.json({
      professeur: {
        _id: professeur._id,
        nom: professeur.nom,
        email: professeur.email,
        estPermanent: professeur.estPermanent,
        tarifHoraire: professeur.tarifHoraire
      },
      annee: parseInt(annee),
      totauxAnnuels,
      rapportsMensuels,
      note: "Séances en rattrapage exclues des statistiques annuelles" // ✅ Indicateur
    });

  } catch (err) {
    console.error('Erreur rapport annuel:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// Nouvelle route pour voir les rattrapages d'un professeur
app.get('/api/professeurs/:id/rattrapages', authAdminOrPedagogique, async (req, res) => {
  try {
    const professeurId = req.params.id;
    const { mois, annee } = req.query;
    
    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    let dateFilter = {
      professeur: professeurId,
      typeSeance: 'rattrapage', // ✅ SEULEMENT les rattrapages
      actif: true
    };
    
    if (mois && annee) {
      const startDate = new Date(annee, mois - 1, 1);
      const endDate = new Date(annee, mois, 0, 23, 59, 59);
      dateFilter.dateSeance = { $gte: startDate, $lte: endDate };
    } else if (annee) {
      const startDate = new Date(annee, 0, 1);
      const endDate = new Date(annee, 11, 31, 23, 59, 59);
      dateFilter.dateSeance = { $gte: startDate, $lte: endDate };
    }
    
    const rattrapages = await Seance.find(dateFilter)
      .sort({ dateSeance: 1, heureDebut: 1 });

    let totalHeuresRattrapage = 0;
    const rattrapagesAvecDuree = rattrapages.map(seance => {
      const dureeHeures = calculerDureeSeance(seance.heureDebut, seance.heureFin);
      totalHeuresRattrapage += dureeHeures;
      
      return {
        _id: seance._id,
        jour: seance.jour,
        heureDebut: seance.heureDebut,
        heureFin: seance.heureFin,
        cours: seance.cours,
        matiere: seance.matiere,
        salle: seance.salle,
        dateSeance: seance.dateSeance,
        dureeHeures: dureeHeures,
        notes: seance.notes
      };
    });
    
    res.json({
      professeur: {
        _id: professeur._id,
        nom: professeur.nom,
        email: professeur.email
      },
      periode: {
        mois: mois ? parseInt(mois) : null,
        annee: annee ? parseInt(annee) : null
      },
      statistiquesRattrapages: {
        totalRattrapages: rattrapages.length,
        totalHeuresRattrapage: Math.round(totalHeuresRattrapage * 100) / 100
      },
      rattrapages: rattrapagesAvecDuree
    });

  } catch (err) {
    console.error('Erreur rattrapages:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// Route pour que le professeur voie ses propres statistiques
app.get('/api/professeurs/mon-rapport', authProfesseur, async (req, res) => {
  try {
    const { mois, annee } = req.query;
    
    const professeur = await Professeur.findById(req.professeurId);
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    // Construire le filtre de date
    let dateFilter = {};
    if (mois && annee) {
      const startDate = new Date(annee, mois - 1, 1);
      const endDate = new Date(annee, mois, 0, 23, 59, 59);
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
    } else if (annee) {
      const startDate = new Date(annee, 0, 1);
      const endDate = new Date(annee, 11, 31, 23, 59, 59);
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
    } else {
      // Par défaut, mois actuel
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    const seances = await Seance.find({
      professeur: req.professeurId,
      ...dateFilter
    }).sort({ jour: 1, heureDebut: 1 });

    const statistiques = calculerStatistiquesProfesseur(seances, professeur);

    res.json({
      professeur: {
        nom: professeur.nom,
        email: professeur.email,
        estPermanent: professeur.estPermanent,
        tarifHoraire: professeur.tarifHoraire
      },
      periode: {
        mois: mois ? parseInt(mois) : null,
        annee: annee ? parseInt(annee) : null
      },
      statistiques,
      seances: seances.map(seance => ({
        jour: seance.jour,
        heureDebut: seance.heureDebut,
        heureFin: seance.heureFin,
        cours: seance.cours,
        matiere: seance.matiere,
        salle: seance.salle,
        dureeHeures: calculerDureeSeance(seance.heureDebut, seance.heureFin)
      }))
    });

  } catch (err) {
    console.error('Erreur rapport professeur:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ===== FONCTIONS UTILITAIRES =====

function calculerDureeSeance(heureDebut, heureFin) {
  const [heureD, minuteD] = heureDebut.split(':').map(Number);
  const [heureF, minuteF] = heureFin.split(':').map(Number);
  
  const minutesDebut = heureD * 60 + minuteD;
  const minutesFin = heureF * 60 + minuteF;
  
  return (minutesFin - minutesDebut) / 60; // Retourne en heures
}

function calculerStatistiquesProfesseur(seances, professeur) {
  const totalHeures = seances.reduce((total, seance) => {
    return total + calculerDureeSeance(seance.heureDebut, seance.heureFin);
  }, 0);

  const coursUniques = [...new Set(seances.map(s => s.cours))];
  const matieresUniques = [...new Set(seances.map(s => s.matiere).filter(Boolean))];
  
  // Grouper par jour pour voir la répartition
  const repartitionJours = {};
  seances.forEach(seance => {
    if (!repartitionJours[seance.jour]) {
      repartitionJours[seance.jour] = 0;
    }
    repartitionJours[seance.jour] += calculerDureeSeance(seance.heureDebut, seance.heureFin);
  });

  // Calculer le montant à payer (pour les entrepreneurs)
  let totalAPayer = 0;
  if (!professeur.estPermanent && professeur.tarifHoraire) {
    totalAPayer = totalHeures * professeur.tarifHoraire;
  }

  return {
    totalHeures: Math.round(totalHeures * 100) / 100, // Arrondir à 2 décimales
    totalSeances: seances.length,
    coursUniques: coursUniques.length,
    matieresUniques: matieresUniques.length,
    tarifHoraire: professeur.tarifHoraire || 0,
    totalAPayer: Math.round(totalAPayer * 100) / 100,
    repartitionJours,
    moyenneHeuresParJour: Object.keys(repartitionJours).length > 0 
      ? Math.round((totalHeures / Object.keys(repartitionJours).length) * 100) / 100 
      : 0
  };
}

function obtenirNomMois(numeroMois) {
  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return mois[numeroMois - 1] || 'Inconnu';
}
app.post('/api/seances', authAdmin, async (req, res) => {
  try {
    const { jour, heureDebut, heureFin, cours, professeur, matiere, salle } = req.body;

    if (!jour || !heureDebut || !heureFin || !cours || !professeur) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const coursDoc = await Cours.findById(cours);
    if (!coursDoc) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }

    const seance = new Seance({
      jour,
      heureDebut,
      heureFin,
      cours: coursDoc.nom, // حفظ الاسم
      coursId: cours, // حفظ الـ ID
      professeur,
      matiere: matiere || '',
      salle: salle || ''
    });

    await seance.save();

    res.status(201).json({ message: 'Séance ajoutée avec succès', seance });
  } catch (err) {
    console.error('Erreur ajout séance:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// Route pour créer un template (emploi du temps de base)
app.post('/api/seances/template', authAdmin, async (req, res) => {
  try {
    const {
      jour, heureDebut, heureFin, cours, professeur, 
      matiere, salle, dateDebutTemplate, dateFinTemplate
    } = req.body;
    
    // التحقق من وجود الكورس
    const coursDoc = await Cours.findById(cours);
    if (!coursDoc) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    const template = new Seance({
      typeSeance: 'template',
      jour, heureDebut, heureFin, 
      cours: coursDoc.nom, // حفظ الاسم
      coursId: cours, // حفظ الـ ID
      professeur, matiere, salle, 
      dateDebutTemplate, dateFinTemplate,
      actif: true
    });
    
    await template.save();
    
    res.status(201).json({
      message: 'Template créé avec succès',
      template
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour obtenir tous les templates
app.get('/api/seances/templates', authAdmin, async (req, res) => {
  try {
    const templates = await Seance.find({ typeSeance: 'template' })
      .populate('professeur', 'nom email estPermanent')
      .sort({ jour: 1, heureDebut: 1 });
    
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour générer les séances automatiquement
app.post('/api/seances/generer/:nbSemaines', authAdmin, async (req, res) => {
  try {
    const nbSemaines = parseInt(req.params.nbSemaines) || 4;
    
    const aujourdhui = new Date();
    const jourSemaine = aujourdhui.getDay();
    const lundiActuel = new Date(aujourdhui.getTime() - (jourSemaine - 1) * 24 * 60 * 60 * 1000);
    lundiActuel.setHours(0, 0, 0, 0);
    
    const resultats = [];
    
    for (let i = 0; i < nbSemaines; i++) {
      const lundiSemaine = new Date(lundiActuel.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const seances = await Seance.genererSeancesSemaine(lundiSemaine);
      resultats.push({
        semaine: lundiSemaine.toDateString(),
        seances: seances.length
      });
    }
    
    res.json({
      message: `Séances générées pour ${nbSemaines} semaines`,
      resultats
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour créer une exception (modifier une séance pour une semaine spécifique)
app.post('/api/seances/template/exception', authAdmin, async (req, res) => {
  try {
    const {
      templateId, dateSeance, action, // 'modifier' ou 'annuler'
      nouveauProfesseur, nouvelleMatiere, nouvelleSalle, notes
    } = req.body;
    
    const template = await Seance.findById(templateId);
    if (!template || template.typeSeance !== 'template') {
      return res.status(404).json({ message: 'Template non trouvé' });
    }
    
    if (action === 'annuler') {
      // Créer une exception "annulée"
      const exception = new Seance({
        typeSeance: 'exception',
        templateOriginal: templateId,
        dateSeance: new Date(dateSeance),
        jour: template.jour,
        heureDebut: template.heureDebut,
        heureFin: template.heureFin,
        cours: template.cours,
        professeur: template.professeur,
        matiere: template.matiere,
        salle: template.salle,
        actif: false, // Séance annulée
        notes: notes || 'Cours annulé'
      });
      
      await exception.save();
      res.json({ message: 'Cours annulé pour cette date', exception });
      
    } else if (action === 'modifier') {
      // Créer une exception modifiée
      const exception = new Seance({
        typeSeance: 'exception',
        templateOriginal: templateId,
        dateSeance: new Date(dateSeance),
        jour: template.jour,
        heureDebut: template.heureDebut,
        heureFin: template.heureFin,
        cours: template.cours,
        professeur: nouveauProfesseur || template.professeur,
        matiere: nouvelleMatiere || template.matiere,
        salle: nouvelleSalle || template.salle,
        actif: true,
        notes: notes || 'Modification ponctuelle'
      });
      
      await exception.save();
      res.json({ message: 'Exception créée avec succès', exception });
    }
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route modifiée pour récupérer les séances du professeur (avec calculs)
app.get('/api/seances/professeur', authProfesseur, async (req, res) => {
  try {
    const { semaine } = req.query; // Format: YYYY-MM-DD (lundi de la semaine)
    
    let dateFilter = {};
    if (semaine) {
      const lundiSemaine = new Date(semaine);
      const dimancheSemaine = new Date(lundiSemaine.getTime() + 6 * 24 * 60 * 60 * 1000);
      dateFilter = {
        dateSeance: {
          $gte: lundiSemaine,
          $lte: dimancheSemaine
        }
      };
    }
    
    const seances = await Seance.find({
      professeur: req.professeurId,
      typeSeance: { $in: ['reelle', 'exception'] },
      actif: true,
      ...dateFilter
    }).populate('professeur', 'nom estPermanent tarifHoraire')
      .sort({ dateSeance: 1, heureDebut: 1 });
    
    // Ajouter les calculs à chaque séance
    const seancesAvecCalculs = await Promise.all(
      seances.map(async (seance) => {
        const calculs = await seance.calculerDureeEtMontant();
        return {
          ...seance.toObject(),
          dureeHeures: calculs.dureeHeures,
          montant: calculs.montant
        };
      })
    );
    
    res.json(seancesAvecCalculs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour calculs mensuels d'un professeur
app.get('/api/professeurs/:id/calculs/:annee/:mois', authAdmin, async (req, res) => {
  try {
    const { id, annee, mois } = req.params;
    
    const startDate = new Date(annee, mois - 1, 1);
    const endDate = new Date(annee, mois, 0, 23, 59, 59);
    
    const seances = await Seance.find({
      professeur: id,
      typeSeance: { $in: ['reelle', 'exception'] },
      actif: true,
      dateSeance: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('professeur');
    
    let totalHeures = 0;
    let totalMontant = 0;
    const seancesDetaillees = [];
    
    for (const seance of seances) {
      const calculs = await seance.calculerDureeEtMontant();
      totalHeures += calculs.dureeHeures;
      totalMontant += calculs.montant;
      
      seancesDetaillees.push({
        date: seance.dateSeance,
        jour: seance.jour,
        cours: seance.cours,
        matiere: seance.matiere,
        salle: seance.salle,
        duree: calculs.dureeHeures,
        montant: calculs.montant
      });
    }
    
    const professeur = seances[0]?.professeur;
    
    res.json({
      professeur: {
        _id: professeur._id,
        nom: professeur.nom,
        estPermanent: professeur.estPermanent,
        tarifHoraire: professeur.tarifHoraire
      },
      periode: { mois: parseInt(mois), annee: parseInt(annee) },
      statistiques: {
        totalHeures: Math.round(totalHeures * 100) / 100,
        totalSeances: seances.length,
        totalMontant: Math.round(totalMontant * 100) / 100
      },
      seances: seancesDetaillees
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ===== SCRIPT DE GÉNÉRATION AUTOMATIQUE =====

// Fonction à exécuter chaque week-end pour générer les séances
const genererSeancesAutomatique = async () => {
  try {
    console.log('🔄 Génération automatique des séances...');
    
    // Générer pour les 2 prochaines semaines
    const aujourdhui = new Date();
    const jourSemaine = aujourdhui.getDay();
    const lundiActuel = new Date(aujourdhui.getTime() - (jourSemaine - 1) * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < 2; i++) {
      const lundiSemaine = new Date(lundiActuel.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      await Seance.genererSeancesSemaine(lundiSemaine);
    }
    
    console.log('✅ Génération automatique terminée');
  } catch (error) {
    console.error('❌ Erreur génération automatique:', error);
  }
};



// Route pour modifier une séance - CORRIGÉE
app.put('/api/seances/:id', authAdmin, async (req, res) => {
  try {
    // ✅ AJOUT: Inclure matiere et salle dans la destructuration
    const { jour, heureDebut, heureFin, cours, professeur, matiere, salle } = req.body;

    // ✅ Récupérer le nom du cours à partir de l'ID
    const coursDoc = await Cours.findById(cours);
    if (!coursDoc) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }

    const seance = await Seance.findByIdAndUpdate(
      req.params.id,
      {
        jour,
        heureDebut,
        heureFin,
        cours: coursDoc.nom, // ✅ Utiliser le nom du cours
        professeur,
        matiere: matiere || '', // ✅ IMPORTANT: Inclure la matière
        salle: salle || '' // ✅ IMPORTANT: Inclure la salle
      },
      { new: true }
    );

    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    res.json({ message: 'Séance modifiée avec succès', seance });
  } catch (err) {
    console.error('Erreur modification séance:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour récupérer toutes les séances (pour admin) - INCHANGÉE
app.get('/api/seances', authAdmin, async (req, res) => {
  try {
    const seances = await Seance.find()
      .populate('professeur', 'nom')
      .sort({ jour: 1, heureDebut: 1 });

    res.json(seances);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour récupérer les séances pour les étudiants - MODIFIÉE
app.get('/api/seances/etudiant', authEtudiant, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.etudiantId);
    const coursNoms = etudiant.cours; // Array de strings comme ['france', 'ji']

    // ✅ Chercher les séances par nom de cours au lieu d'ID
    const seances = await Seance.find({ cours: { $in: coursNoms } })
      .populate('professeur', 'nom')
      .sort({ jour: 1, heureDebut: 1 });

    res.json(seances);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// إضافة هذا Route في ملف routes الخاص بك
app.get('/api/professeurs/periodes-disponibles', authAdmin, async (req, res) => {
  try {
    // الحصول على كل السنوات والشهور المتاحة من الحصص
    const periodesSeances = await Seance.aggregate([
      {
        $match: {
          createdAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            annee: { $year: "$createdAt" },
            mois: { $month: "$createdAt" }
          }
        }
      },
      {
        $sort: { "_id.annee": -1, "_id.mois": -1 }
      }
    ]);

    // استخراج السنوات الفريدة
    const annees = [...new Set(periodesSeances.map(p => p._id.annee))];
    
    // تجميع الشهور حسب السنة
    const moisParAnnee = {};
    periodesSeances.forEach(p => {
      if (!moisParAnnee[p._id.annee]) {
        moisParAnnee[p._id.annee] = [];
      }
      moisParAnnee[p._id.annee].push(p._id.mois);
    });

    // ترتيب الشهور وإزالة التكرار
    Object.keys(moisParAnnee).forEach(annee => {
      moisParAnnee[annee] = [...new Set(moisParAnnee[annee])].sort((a, b) => a - b);
    });

    res.json({
      annees: annees.sort((a, b) => b - a), // ترتيب تنازلي
      moisParAnnee,
      periodeActuelle: {
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear()
      },
      totalPeriodes: periodesSeances.length
    });
  } catch (err) {
    console.error('Erreur périodes disponibles:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// للتحقق من وجود بيانات لفترة معينة
app.get('/api/professeurs/verifier-periode/:annee/:mois', authAdmin, async (req, res) => {
  try {
    const { annee, mois } = req.params;
    
    const startDate = new Date(annee, mois - 1, 1);
    const endDate = new Date(annee, mois, 0, 23, 59, 59);
    
    const count = await Seance.countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    res.json({
      disponible: count > 0,
      nombreSeances: count,
      periode: { mois: parseInt(mois), annee: parseInt(annee) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.get('/api/seances/semaine/:lundiSemaine', authAdmin, async (req, res) => {
  try {
    const toStartOfDay = d => { const nd = new Date(d); nd.setHours(0,0,0,0); return nd; };
    const toEndOfDay   = d => { const nd = new Date(d); nd.setHours(23,59,59,999); return nd; };

    // parse محليًا بدل ISO/UTC
    const [y,m,d] = (req.params.lundiSemaine||'').split('-').map(Number);
    let startDate = new Date(y, (m-1), d); // محلي 00:00
    // ثبّت الإثنين
    const jsDay = startDate.getDay();             // 0..6
    const delta = (jsDay + 6) % 7;                // كم نرجع لنصل للإثنين
    startDate.setDate(startDate.getDate() - delta);
    startDate = toStartOfDay(startDate);

    // نهاية الأسبوع (السبت عندك لأن الجدول 6 أيام)
    const endDate = toEndOfDay(new Date(startDate.getTime() + 6*24*60*60*1000));

    const seances = await Seance.find({
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { $gte: startDate, $lte: endDate }
    })
    .populate('professeur', 'nom email estPermanent tarifHoraire')
    .sort({ dateSeance: 1, heureDebut: 1 });

    return res.json(seances);
  } catch (err) {
    console.error('Erreur chargement séances semaine:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// DELETE /api/seances/:id - Version corrigée
app.delete('/api/seances/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Seance.findById(id);
    if (!doc) {
      return res.status(404).json({ ok: false, message: 'Séance introuvable' });
    }

    // SUPPRESSION AUTORISÉE pour tous les types
    await doc.deleteOne();
    return res.json({ ok: true, deletedId: id });
    
  } catch (err) {
    console.error('Erreur suppression:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});



// DELETE /api/seances/exception/by-slot
app.delete('/api/seances/exception/by-slot', authAdmin, async (req, res) => {
  try {
    const { cours, dateSeance, heureDebut, heureFin } = req.body; // أو req.query
    const q = {
      cours,
      dateSeance: new Date(dateSeance),
      heureDebut,
      heureFin,
      typeSeance: 'exception'
    };
    const doc = await Seance.findOneAndDelete(q);
    if (!doc) return res.status(404).json({ ok:false, message:'Exception introuvable' });
    return res.json({ ok:true, deletedId: doc._id });
  } catch (err) {
    console.error('Erreur suppression slot:', err);
    return res.status(500).json({ ok:false, error: err.message });
  }
});

// Remplacer la route POST /api/seances/exception dans votre backend

app.post('/api/seances/exception', authAdmin, async (req, res) => {
  try {
    const { cours, professeur, matiere, salle, dateSeance, jour, heureDebut, heureFin } = req.body;

    // ✅ CORRECTION : Ajouter la validation de dateSeance
    if (!dateSeance) {
      return res.status(400).json({ 
        ok: false, 
        error: 'La date de séance est obligatoire' 
      });
    }

    // mfتاح التفرد: cours + dateSeance + heureDebut + heureFin + typeSeance='exception'
    const q = { 
      cours,
      dateSeance: new Date(dateSeance), // ✅ IMPORTANT : Convertir en Date
      heureDebut,
      heureFin,
      typeSeance: 'exception'
    };

    const update = {
      cours,
      professeur,
      matiere,
      salle,
      jour,
      dateSeance: new Date(dateSeance), // ✅ IMPORTANT : Ajouter dateSeance
      typeSeance: 'exception',
      actif: true
    };

    const doc = await Seance.findOneAndUpdate(q, { $set: update }, { new: true, upsert: true })
      .populate('professeur', 'nom email estPermanent tarifHoraire');

    console.log('✅ Séance exception créée/mise à jour:', {
      cours,
      dateSeance: new Date(dateSeance),
      professeur: doc.professeur?.nom,
      matiere,
      salle
    });

    return res.json({ ok: true, seance: doc });

  } catch (err) {
    console.error('❌ Erreur exception:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Ajouter cette route dans votre backend (app.js)

app.post('/api/seances/copier-semaine', authAdminOrPedagogique, async (req, res) => {
  try {
    const { lundiSource, lundiDestination } = req.body;
    
    if (!lundiSource || !lundiDestination) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Les dates source et destination sont obligatoires' 
      });
    }

    console.log('Copie demandée:', { lundiSource, lundiDestination });

    // 1. Calculer les dates de la semaine source
    const dateSource = new Date(lundiSource);
    const dimancheSource = new Date(dateSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);

    console.log('Période source:', { 
      debut: dateSource.toISOString(), 
      fin: dimancheSource.toISOString() 
    });

    // 2. Récupérer toutes les séances de la semaine source
    const seancesSource = await Seance.find({
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { 
        $gte: dateSource, 
        $lte: dimancheSource 
      },
      actif: true
    }).populate('professeur', 'nom email');

    console.log(`${seancesSource.length} séances trouvées pour la semaine source`);

    if (seancesSource.length === 0) {
      return res.json({
        ok: true,
        message: 'Aucune séance à copier pour cette semaine',
        seancesCrees: 0
      });
    }

    // 3. Calculer la différence en jours entre les deux semaines
    const differenceJours = Math.round((new Date(lundiDestination) - new Date(lundiSource)) / (1000 * 60 * 60 * 24));
    console.log('Différence en jours:', differenceJours);

    // 4. Créer les nouvelles séances pour la semaine destination
    const nouvellesSeances = [];
    const erreurs = [];

    for (const seanceSource of seancesSource) {
      try {
        // Calculer la nouvelle date
        const nouvelleDateSeance = new Date(seanceSource.dateSeance);
        nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + differenceJours);

        // Vérifier si une séance existe déjà à ce créneau
        const seanceExistante = await Seance.findOne({
          cours: seanceSource.cours,
          dateSeance: nouvelleDateSeance,
          heureDebut: seanceSource.heureDebut,
          heureFin: seanceSource.heureFin,
          typeSeance: { $in: ['reelle', 'exception'] }
        });

        if (seanceExistante) {
          console.log(`Séance déjà existante ignorée:`, {
            cours: seanceSource.cours,
            date: nouvelleDateSeance.toISOString().split('T')[0],
            heure: `${seanceSource.heureDebut}-${seanceSource.heureFin}`
          });
          continue;
        }

        // Créer la nouvelle séance
        const nouvelleSeance = new Seance({
          cours: seanceSource.cours,
          coursId: seanceSource.coursId,
          professeur: seanceSource.professeur._id || seanceSource.professeur,
          matiere: seanceSource.matiere,
          salle: seanceSource.salle,
          dateSeance: nouvelleDateSeance,
          jour: seanceSource.jour,
          heureDebut: seanceSource.heureDebut,
          heureFin: seanceSource.heureFin,
          typeSeance: 'exception', // Les copies sont toujours des exceptions
          actif: true,
          notes: `Copié depuis ${seanceSource.dateSeance.toISOString().split('T')[0]}`
        });

        const seanceSauvee = await nouvelleSeance.save();
        nouvellesSeances.push(seanceSauvee);

        console.log(`Séance copiée:`, {
          cours: seanceSource.cours,
          de: seanceSource.dateSeance.toISOString().split('T')[0],
          vers: nouvelleDateSeance.toISOString().split('T')[0],
          heure: `${seanceSource.heureDebut}-${seanceSource.heureFin}`,
          professeur: seanceSource.professeur?.nom
        });

      } catch (error) {
        console.error('Erreur lors de la copie d\'une séance:', error);
        erreurs.push({
          seanceId: seanceSource._id,
          cours: seanceSource.cours,
          erreur: error.message
        });
      }
    }

    // 5. Retourner le résultat
    const response = {
      ok: true,
      message: `${nouvellesSeances.length} séances copiées avec succès`,
      seancesCrees: nouvellesSeances.length,
      seancesSource: seancesSource.length,
      semaineSource: lundiSource,
      semaineDestination: lundiDestination,
      erreurs: erreurs.length > 0 ? erreurs : undefined
    };

    console.log('Résultat final:', response);
    res.json(response);

  } catch (error) {
    console.error('Erreur lors de la copie de semaine:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur interne lors de la copie',
      details: error.message
    });
  }
});


// Route pour copier une semaine (pédagogique)
app.post('/api/pedagogique/seances/copier-semaine', authPedagogique, async (req, res) => {
  try {
    const { lundiSource, lundiDestination } = req.body;
    
    if (!lundiSource || !lundiDestination) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Les dates source et destination sont obligatoires' 
      });
    }

    // Calculer les dates de la semaine source
    const dateSource = new Date(lundiSource);
    const dimancheSource = new Date(dateSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);

    console.log(`📅 Copie pédagogique demandée par ${req.user.nom} (${req.user.filiere || 'TOUTES'}):`, { 
      lundiSource, 
      lundiDestination 
    });

    // Construire le filtre pour les cours selon les permissions
    let coursFilter = {};
    if (req.user.role !== 'pedagogique_general' && req.user.role !== 'admin') {
      const coursFiliere = await Cours.find({ filiere: req.user.filiere }).select('nom');
      const nomsCoursFiliere = coursFiliere.map(c => c.nom);
      coursFilter = { cours: { $in: nomsCoursFiliere } };
    }

    // Récupérer les séances de la semaine source (filtrées par filière si nécessaire)
    const seancesSource = await Seance.find({
      ...coursFilter,
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { 
        $gte: dateSource, 
        $lte: dimancheSource 
      },
      actif: true
    }).populate('professeur', 'nom email');

    console.log(`${seancesSource.length} séances trouvées pour copie (filière: ${req.user.filiere || 'TOUTES'})`);

    if (seancesSource.length === 0) {
      return res.json({
        ok: true,
        message: 'Aucune séance à copier pour cette semaine dans votre filière',
        seancesCrees: 0
      });
    }

    // Calculer la différence en jours
    const differenceJours = Math.round((new Date(lundiDestination) - new Date(lundiSource)) / (1000 * 60 * 60 * 24));
    console.log('Différence en jours:', differenceJours);

    // Créer les nouvelles séances
    const nouvellesSeances = [];
    const erreurs = [];

    for (const seanceSource of seancesSource) {
      try {
        // Calculer la nouvelle date
        const nouvelleDateSeance = new Date(seanceSource.dateSeance);
        nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + differenceJours);

        // Vérifier si une séance existe déjà
        const seanceExistante = await Seance.findOne({
          cours: seanceSource.cours,
          dateSeance: nouvelleDateSeance,
          heureDebut: seanceSource.heureDebut,
          heureFin: seanceSource.heureFin,
          typeSeance: { $in: ['reelle', 'exception'] }
        });

        if (seanceExistante) {
          console.log(`Séance déjà existante ignorée:`, {
            cours: seanceSource.cours,
            date: nouvelleDateSeance.toISOString().split('T')[0]
          });
          continue;
        }

        // Créer la nouvelle séance
        const nouvelleSeance = new Seance({
          cours: seanceSource.cours,
          coursId: seanceSource.coursId,
          professeur: seanceSource.professeur._id || seanceSource.professeur,
          matiere: seanceSource.matiere,
          salle: seanceSource.salle,
          dateSeance: nouvelleDateSeance,
          jour: seanceSource.jour,
          heureDebut: seanceSource.heureDebut,
          heureFin: seanceSource.heureFin,
          typeSeance: 'exception',
          actif: true,
          creePar: req.user._id,
          dateCreation: new Date(),
          notes: `Copié par ${req.user.nom} depuis ${seanceSource.dateSeance.toISOString().split('T')[0]}`
        });

        const seanceSauvee = await nouvelleSeance.save();
        nouvellesSeances.push(seanceSauvee);

        console.log(`Séance copiée par pédagogique:`, {
          cours: seanceSource.cours,
          de: seanceSource.dateSeance.toISOString().split('T')[0],
          vers: nouvelleDateSeance.toISOString().split('T')[0],
          par: req.user.nom
        });

      } catch (error) {
        console.error('Erreur lors de la copie d\'une séance:', error);
        erreurs.push({
          seanceId: seanceSource._id,
          cours: seanceSource.cours,
          erreur: error.message
        });
      }
    }

    const response = {
      ok: true,
      message: `${nouvellesSeances.length} séances copiées avec succès par ${req.user.nom}`,
      seancesCrees: nouvellesSeances.length,
      seancesSource: seancesSource.length,
      filiere: req.user.filiere || 'TOUTES',
      semaineSource: lundiSource,
      semaineDestination: lundiDestination,
      erreurs: erreurs.length > 0 ? erreurs : undefined
    };

    res.json(response);

  } catch (error) {
    console.error('Erreur lors de la copie de semaine pédagogique:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur interne lors de la copie',
      details: error.message
    });
  }
});

// Route pour copier la semaine précédente (pédagogique)
app.post('/api/pedagogique/seances/copier-semaine-precedente', authPedagogique, async (req, res) => {
  try {
    const { lundiDestination } = req.body;
    
    if (!lundiDestination) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Date de destination obligatoire' 
      });
    }

    // Calculer la semaine précédente
    const dateDestination = new Date(lundiDestination);
    const lundiSource = new Date(dateDestination);
    lundiSource.setDate(lundiSource.getDate() - 7);

    console.log(`📅 Copie semaine précédente par ${req.user.nom}:`, { 
      de: lundiSource.toISOString().split('T')[0], 
      vers: lundiDestination 
    });

    // Construire le filtre pour les cours selon les permissions
    let coursFilter = {};
    if (req.user.role !== 'pedagogique_general' && req.user.role !== 'admin') {
      const coursFiliere = await Cours.find({ filiere: req.user.filiere }).select('nom');
      const nomsCoursFiliere = coursFiliere.map(c => c.nom);
      coursFilter = { cours: { $in: nomsCoursFiliere } };
    }

    // Récupérer les séances de la semaine source
    const dimancheSource = new Date(lundiSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);

    const seancesSource = await Seance.find({
      ...coursFilter,
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { 
        $gte: lundiSource, 
        $lte: dimancheSource 
      },
      actif: true
    });

    console.log(`${seancesSource.length} séances trouvées à copier`);

    if (seancesSource.length === 0) {
      return res.json({
        ok: true,
        message: 'Aucune séance à copier pour la semaine précédente dans votre filière',
        seancesCrees: 0
      });
    }

    // Copier vers la semaine destination
    const nouvellesSeances = [];

    for (const seanceSource of seancesSource) {
      // Calculer la nouvelle date (+ 7 jours)
      const nouvelleDateSeance = new Date(seanceSource.dateSeance);
      nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + 7);

      // Vérifier si séance existe déjà
      const existe = await Seance.findOne({
        cours: seanceSource.cours,
        dateSeance: nouvelleDateSeance,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin
      });

      if (existe) continue;

      // Créer nouvelle séance
      const nouvelleSeance = new Seance({
        cours: seanceSource.cours,
        coursId: seanceSource.coursId,
        professeur: seanceSource.professeur,
        matiere: seanceSource.matiere,
        salle: seanceSource.salle,
        dateSeance: nouvelleDateSeance,
        jour: seanceSource.jour,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin,
        typeSeance: 'exception',
        actif: true,
        creePar: req.user._id,
        dateCreation: new Date()
      });

      await nouvelleSeance.save();
      nouvellesSeances.push(nouvelleSeance);
    }

    res.json({
      ok: true,
      message: `${nouvellesSeances.length} séances copiées depuis la semaine précédente`,
      seancesCrees: nouvellesSeances.length
    });

  } catch (error) {
    console.error('Erreur copie semaine précédente:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Route pour obtenir les semaines disponibles (pédagogique)
app.get('/api/pedagogique/seances/semaines-disponibles', authPedagogique, async (req, res) => {
  try {
    // Construire le filtre selon les permissions
    let coursFilter = {};
    if (req.user.role !== 'pedagogique_general' && req.user.role !== 'admin') {
      const coursFiliere = await Cours.find({ filiere: req.user.filiere }).select('nom');
      const nomsCoursFiliere = coursFiliere.map(c => c.nom);
      coursFilter = { cours: { $in: nomsCoursFiliere } };
    }

    const semaines = await Seance.aggregate([
      {
        $match: {
          ...coursFilter,
          typeSeance: { $in: ['reelle', 'exception'] },
          dateSeance: { $exists: true },
          actif: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateSeance' },
            week: { $week: '$dateSeance' }
          },
          lundiSemaine: { $min: '$dateSeance' },
          nombreSeances: { $sum: 1 },
          cours: { $addToSet: '$cours' }
        }
      },
      {
        $sort: { lundiSemaine: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Calculer le lundi de chaque semaine
    const semainesFormatees = semaines.map(s => {
      const date = new Date(s.lundiSemaine);
      const jour = date.getDay();
      const diff = date.getDate() - jour + (jour === 0 ? -6 : 1);
      const lundi = new Date(date.setDate(diff));
      
      return {
        lundiSemaine: lundi.toISOString().split('T')[0],
        nombreSeances: s.nombreSeances,
        nombreCours: s.cours.length,
        periode: `${lundi.toLocaleDateString('fr-FR')} - ${new Date(lundi.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}`
      };
    });

    res.json(semainesFormatees);
  } catch (error) {
    console.error('Erreur récupération semaines pédagogique:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour toutes les semaines (pédagogique général)
app.get('/api/pedagogique/seances/semaines-disponibles/toutes', authPedagogique, async (req, res) => {
  try {
    // Vérifier que c'est un pédagogique général
    if (req.user.role !== 'pedagogique_general' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux pédagogiques généraux' });
    }

    const semaines = await Seance.aggregate([
      {
        $match: {
          typeSeance: { $in: ['reelle', 'exception'] },
          dateSeance: { $exists: true },
          actif: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateSeance' },
            week: { $week: '$dateSeance' }
          },
          lundiSemaine: { $min: '$dateSeance' },
          nombreSeances: { $sum: 1 },
          cours: { $addToSet: '$cours' }
        }
      },
      {
        $sort: { lundiSemaine: -1 }
      },
      {
        $limit: 20
      }
    ]);

    const semainesFormatees = semaines.map(s => {
      const date = new Date(s.lundiSemaine);
      const jour = date.getDay();
      const diff = date.getDate() - jour + (jour === 0 ? -6 : 1);
      const lundi = new Date(date.setDate(diff));
      
      return {
        lundiSemaine: lundi.toISOString().split('T')[0],
        nombreSeances: s.nombreSeances,
        nombreCours: s.cours.length,
        periode: `${lundi.toLocaleDateString('fr-FR')} - ${new Date(lundi.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}`
      };
    });

    res.json(semainesFormatees);
  } catch (error) {
    console.error('Erreur récupération toutes semaines:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour les semaines avec séances (format simple)
app.get('/api/pedagogique/seances/semaines-avec-seances', authPedagogique, async (req, res) => {
  try {
    // Construire le filtre selon les permissions
    let coursFilter = {};
    if (req.user.role !== 'pedagogique_general' && req.user.role !== 'admin') {
      const coursFiliere = await Cours.find({ filiere: req.user.filiere }).select('nom');
      const nomsCoursFiliere = coursFiliere.map(c => c.nom);
      coursFilter = { cours: { $in: nomsCoursFiliere } };
    }

    const semaines = await Seance.aggregate([
      {
        $match: {
          ...coursFilter,
          typeSeance: { $in: ['reelle', 'exception'] },
          dateSeance: { $exists: true },
          actif: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: { $year: "$dateSeance" },
                  month: { $month: "$dateSeance" },
                  day: { 
                    $subtract: [
                      { $dayOfMonth: "$dateSeance" },
                      { $subtract: [{ $dayOfWeek: "$dateSeance" }, 2] }
                    ]
                  }
                }
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    const result = semaines.map(s => ({
      lundi: s._id,
      label: `Semaine du ${new Date(s._id).toLocaleDateString('fr-FR')} (${s.count} séances - ${req.user.filiere || 'TOUTES'})`,
      count: s.count
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur semaines avec séances:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour les statistiques de rattrapages
app.get('/api/pedagogique/rattrapages/statistiques', authPedagogique, async (req, res) => {
  try {
    // Construire le filtre selon les permissions
    let coursFilter = {};
    if (req.user.role !== 'pedagogique_general' && req.user.role !== 'admin') {
      const coursFiliere = await Cours.find({ filiere: req.user.filiere }).select('nom');
      const nomsCoursFiliere = coursFiliere.map(c => c.nom);
      coursFilter = { cours: { $in: nomsCoursFiliere } };
    }

    const statistiques = await Seance.aggregate([
      {
        $match: {
          ...coursFilter,
          dateSeance: { $exists: true },
          professeur: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'professeurs',
          localField: 'professeur',
          foreignField: '_id',
          as: 'profInfo'
        }
      },
      {
        $unwind: '$profInfo'
      },
      {
        $group: {
          _id: '$professeur',
          nomProfesseur: { $first: '$profInfo.nom' },
          totalSeances: { $sum: 1 },
          seancesNormales: {
            $sum: {
              $cond: [
                { $ne: ['$typeSeance', 'rattrapage'] },
                1,
                0
              ]
            }
          },
          seancesRattrapage: {
            $sum: {
              $cond: [
                { $eq: ['$typeSeance', 'rattrapage'] },
                1,
                0
              ]
            }
          },
          detailsRattrapages: {
            $push: {
              $cond: [
                { $eq: ['$typeSeance', 'rattrapage'] },
                {
                  cours: '$cours',
                  matiere: '$matiere',
                  dateSeance: '$dateSeance',
                  jour: '$jour',
                  heureDebut: '$heureDebut',
                  heureFin: '$heureFin',
                  salle: '$salle',
                  notes: '$notes'
                },
                null
              ]
            }
          }
        }
      },
      {
        $addFields: {
          detailsRattrapages: {
            $filter: {
              input: '$detailsRattrapages',
              cond: { $ne: ['$this', null] }
            }
          }
        }
      },
      {
        $sort: { seancesRattrapage: -1, nomProfesseur: 1 }
      }
    ]);

    res.json({
      success: true,
      statistiques,
      filiere: req.user.filiere || 'TOUTES',
      generePar: req.user.nom
    });
  } catch (error) {
    console.error('Erreur statistiques rattrapages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour obtenir les semaines disponibles (optionnel)
app.get('/api/seances/semaines-disponibles', authAdmin, async (req, res) => {
  try {
    const semaines = await Seance.aggregate([
      {
        $match: {
          typeSeance: { $in: ['reelle', 'exception'] },
          dateSeance: { $exists: true },
          actif: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateSeance' },
            week: { $week: '$dateSeance' }
          },
          lundiSemaine: { $min: '$dateSeance' },
          nombreSeances: { $sum: 1 },
          cours: { $addToSet: '$cours' }
        }
      },
      {
        $sort: { lundiSemaine: -1 }
      },
      {
        $limit: 20 // Limiter aux 20 dernières semaines
      }
    ]);

    // Calculer le lundi de chaque semaine
    const semainesFormatees = semaines.map(s => {
      const date = new Date(s.lundiSemaine);
      const jour = date.getDay();
      const diff = date.getDate() - jour + (jour === 0 ? -6 : 1);
      const lundi = new Date(date.setDate(diff));
      
      return {
        lundiSemaine: lundi.toISOString().split('T')[0],
        nombreSeances: s.nombreSeances,
        nombreCours: s.cours.length,
        periode: `${lundi.toLocaleDateString('fr-FR')} - ${new Date(lundi.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}`
      };
    });

    res.json(semainesFormatees);
  } catch (error) {
    console.error('Erreur récupération semaines:', error);
    res.status(500).json({ error: error.message });
  }
});
// Route simple pour copier la semaine précédente vers la semaine actuelle
app.post('/api/seances/copier-semaine-precedente', authAdminOrPedagogique, async (req, res) => {
  try {
    const { lundiDestination } = req.body;
    
    if (!lundiDestination) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Date de destination obligatoire' 
      });
    }

    // Calculer la semaine précédente (7 jours avant)
    const dateDestination = new Date(lundiDestination);
    const lundiSource = new Date(dateDestination);
    lundiSource.setDate(lundiSource.getDate() - 7);

    console.log('Copie simple:', { 
      de: lundiSource.toISOString().split('T')[0], 
      vers: lundiDestination 
    });

    // Récupérer les séances de la semaine source
    const dimancheSource = new Date(lundiSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);

    const seancesSource = await Seance.find({
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { 
        $gte: lundiSource, 
        $lte: dimancheSource 
      },
      actif: true
    });

    console.log(`${seancesSource.length} séances trouvées à copier`);

    if (seancesSource.length === 0) {
      return res.json({
        ok: true,
        message: 'Aucune séance à copier pour la semaine précédente',
        seancesCrees: 0
      });
    }

    // Copier vers la semaine destination
    const nouvellesSeances = [];

    for (const seanceSource of seancesSource) {
      // Calculer la nouvelle date (+ 7 jours)
      const nouvelleDateSeance = new Date(seanceSource.dateSeance);
      nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + 7);

      // Vérifier si séance existe déjà
      const existe = await Seance.findOne({
        cours: seanceSource.cours,
        dateSeance: nouvelleDateSeance,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin
      });

      if (existe) continue; // Ignorer si existe déjà

      // Créer nouvelle séance
      const nouvelleSeance = new Seance({
        cours: seanceSource.cours,
        coursId: seanceSource.coursId,
        professeur: seanceSource.professeur,
        matiere: seanceSource.matiere,
        salle: seanceSource.salle,
        dateSeance: nouvelleDateSeance,
        jour: seanceSource.jour,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin,
        typeSeance: 'exception',
        actif: true
      });

      await nouvelleSeance.save();
      nouvellesSeances.push(nouvelleSeance);
    }

    res.json({
      ok: true,
      message: `${nouvellesSeances.length} séances copiées`,
      seancesCrees: nouvellesSeances.length
    });

  } catch (error) {
    console.error('Erreur copie simple:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Route pour avoir les semaines avec séances (format simple)
app.get('/api/seances/semaines-avec-seances', authAdminOrPedagogique, async (req, res) => {
  try {
    const semaines = await Seance.aggregate([
      {
        $match: {
          typeSeance: { $in: ['reelle', 'exception'] },
          dateSeance: { $exists: true },
          actif: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: { $year: "$dateSeance" },
                  month: { $month: "$dateSeance" },
                  day: { 
                    $subtract: [
                      { $dayOfMonth: "$dateSeance" },
                      { $subtract: [{ $dayOfWeek: "$dateSeance" }, 2] }
                    ]
                  }
                }
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    const result = semaines.map(s => ({
      lundi: s._id,
      label: `Semaine du ${new Date(s._id).toLocaleDateString('fr-FR')} (${s.count} séances)`,
      count: s.count
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur semaines:', error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/seances/professeur', authProfesseur, async (req, res) => {
  try {
    const seances = await Seance.find({ professeur: req.professeurId })
      .populate('professeur', 'nom') // Populate le professeur pour avoir le nom
      .sort({ jour: 1, heureDebut: 1 });

    res.json(seances);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.post('/api/login', async (req, res) => {
  const { email, motDePasse } = req.body;
  
  // ✅ Essayer comme admin
  const admin = await Admin.findOne({ email });
  if (admin && await bcrypt.compare(motDePasse, admin.motDePasse)) {
    const token = jwt.sign({ id: admin._id, role: 'admin' }, 'jwt_secret_key', { expiresIn: '7d' });
    return res.json({ user: admin, token, role: 'admin' });
  }

  // ✅ Essayer comme administratif
  const administratif = await Administratif.findOne({ email });
  if (administratif && await administratif.comparePassword(motDePasse)) {
    if (!administratif.actif) {
      return res.status(403).json({ message: '⛔ Votre compte administratif est inactif.' });
    }
    
    const token = jwt.sign({ 
      id: administratif._id, 
      role: 'administratif',
      nom: administratif.nom
    }, 'jwt_secret_key', { expiresIn: '7d' });
    
    return res.json({ 
      user: {
        id: administratif._id,
        nom: administratif.nom,
        email: administratif.email,
        telephone: administratif.telephone,
        role: 'administratif'
      }, 
      token, 
      role: 'administratif' 
    });
  }

  // ✅ Essayer comme pédagogique  
  const pedagogique = await Pedagogique.findOne({ email });
  if (pedagogique && await pedagogique.comparePassword(motDePasse)) {
    if (!pedagogique.actif) {
      return res.status(403).json({ message: 'Votre compte pédagogique est inactif.' });
    }
    
    const token = jwt.sign({ 
      id: pedagogique._id, 
      role: 'pedagogique',
      filiere: pedagogique.filiere,
      nom: pedagogique.nom
    }, 'jwt_secret_key', { expiresIn: '7d' });
    
    return res.json({ 
      user: {
        id: pedagogique._id,
        nom: pedagogique.nom,
        email: pedagogique.email,
        filiere: pedagogique.filiere,
        role: 'pedagogique'
      }, 
      token, 
      role: 'pedagogique' 
    });
  }

  // ✅ Essayer comme gestionnaire de paiement
  const paiementManager = await PaiementManager.findOne({ email });
  if (paiementManager && await paiementManager.comparePassword(motDePasse)) {
    if (!paiementManager.actif) {
      return res.status(403).json({ message: '⛔ Votre compte gestionnaire est inactif' });
    }
    const token = jwt.sign({ id: paiementManager._id, role: 'paiement_manager' }, 'jwt_secret_key', { expiresIn: '7d' });
    return res.json({ user: paiementManager, token, role: 'paiement_manager' });
  }

  // ✅ Essayer comme professeur de finance
  const financeProf = await FinanceProf.findOne({ email });
  if (financeProf && await financeProf.comparePassword(motDePasse)) {
    if (!financeProf.actif) {
      return res.status(403).json({ message: '⛔ Votre compte professeur de finance est inactif' });
    }
    const token = jwt.sign({ id: financeProf._id, role: 'finance_prof' }, 'jwt_secret_key', { expiresIn: '7d' });
    return res.json({ user: financeProf, token, role: 'finance_prof' });
  }

  // ✅ Essayer comme professeur
  const professeur = await Professeur.findOne({ email });
  if (professeur && await professeur.comparePassword(motDePasse)) {
    if (!professeur.actif) {
      return res.status(403).json({ message: '⛔️ Votre compte est inactif. Veuillez contacter l\'administration.' });
    }

    // ✅ Mise à jour de lastSeen
    professeur.lastSeen = new Date();
    await professeur.save();

    const token = jwt.sign({ id: professeur._id, role: 'prof' }, 'jwt_secret_key', { expiresIn: '7d' });
    return res.json({ user: professeur, token, role: 'prof' });
  }

  // ✅ Essayer comme commercial
  const commercial = await Commercial.findOne({ email });
  if (commercial && await commercial.comparePassword(motDePasse)) {
    if (!commercial.actif) {
      return res.status(403).json({ message: '⛔️ Votre compte commercial est inactif.' });
    }
    const token = jwt.sign({ id: commercial._id, role: 'commercial' }, 'jwt_secret_key', { expiresIn: '7d' });
    return res.json({ user: commercial, token, role: 'commercial' });
  }

  // ✅ Essayer comme étudiant
  const etudiant = await Etudiant.findOne({ email });
  if (etudiant && await bcrypt.compare(motDePasse, etudiant.motDePasse)) {
    if (!etudiant.actif) {
      return res.status(403).json({ message: '⛔️ Votre compte est désactivé. Contactez l\'administration.' });
    }
    etudiant.lastSeen = new Date();
    await etudiant.save();

    const token = jwt.sign({ id: etudiant._id, role: 'etudiant' }, 'jwt_secret_key', { expiresIn: '7d' });
    return res.json({ user: etudiant, token, role: 'etudiant' });
  }
  
  // ❌ Si aucun ne correspond
  return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
});
// route: POST /api/professeurs/login
;





// routes/professeurs.js
app.patch('/api/professeurs/:id/actif', authAdminOrPedagogique, async (req, res) => {
  try {
    const prof = await Professeur.findById(req.params.id);
    if (!prof) return res.status(404).json({ message: 'Professeur introuvable' });

    prof.actif = !prof.actif;
    await prof.save();

    res.json(prof); // ✅ نرجع بيانات الأستاذ المحدثة
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.get('/api/etudiant/profile', authEtudiant, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.etudiantId).select('-motDePasse'); // ✅ هنا التعديل
    if (!etudiant) return res.status(404).json({ message: 'Étudiant introuvable' });
    res.json(etudiant);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب الملف الشخصي', error: err.message });
  }
});


// ✅ 🟢 جلسات الحضور
app.get('/api/etudiant/presences', authEtudiant, async (req, res) => {
  try {
    const presences = await Presence.find({ etudiant: req.etudiantId, present: true });
    res.json(presences);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الحضور', error: err.message });
  }
});


// ✅ 🔴 الغيابات
app.get('/api/etudiant/absences', authEtudiant, async (req, res) => {
  try {
    const absences = await Presence.find({ etudiant: req.etudiantId, present: false });
    res.json(absences);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الغيابات', error: err.message });
  }
});


// ✅ 💰 الدفعات
app.get('/api/etudiant/paiements', authEtudiant, async (req, res) => {
  try {
    const paiements = await Paiement.find({ etudiant: req.etudiantId });
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الدفعات', error: err.message });
  }
});



app.delete('/api/professeurs/:id', authAdminOrPedagogique, async (req, res) => {
  try {
    await Professeur.findByIdAndDelete(req.params.id);
    res.json({ message: 'Professeur supprimé avec succès' });
  } catch (err) {
    console.error('❌ Erreur suppression:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
  }
});

app.get('/api/presences/:etudiantId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const result = await Presence.find({ etudiant: req.params.etudiantId }).sort({ dateSession: -1 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/presences/etudiant/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const presences = await Presence.find({ etudiant: req.params.id }).sort({ dateSession: -1 });
    res.json(presences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ Modifier un étudiant



app.get('/api/etudiants/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id);
    if (!etudiant) return res.status(404).json({ message: "Étudiant introuvable" });
    res.json(etudiant);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

app.get('/api/paiements/etudiant/:etudiantId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const paiements = await Paiement.find({ etudiant: req.params.etudiantId });
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des paiements", error: err.message });
  }
});

// Lister les cours
// Récupérer un seul cours avec détails
// 📌 Route: GET /api/cours/:id
// ✅ Lister tous les cours (IMPORTANT!)
app.get('/api/cours', authAdminOrPaiementManager  , async (req, res) => {
  try {
    const cours = await Cours.find();
    res.json(cours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// routes/professeur.js أو في ملف Express المناسب
app.get('/api/admin/professeurs-par-cours/:coursNom', async (req, res) => {
  try {
    const coursNom = req.params.coursNom;

    const profs = await Professeur.find({ cours: coursNom }).select('_id nom matiere');
    res.json(profs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// À ajouter dans votre app.js - Routes CRUD pour gérer les Administratifs

// GET - Liste de tous les administratifs
app.get('/api/administratifs', authAdmin, async (req, res) => {
  try {
    const administratifs = await Administratif.find()
      .select('-motDePasse') // Exclure le mot de passe
      .sort({ createdAt: -1 });
    res.json(administratifs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET - Un administratif par ID
app.get('/api/administratifs/:id', authAdmin, async (req, res) => {
  try {
    const administratif = await Administratif.findById(req.params.id)
      .select('-motDePasse');
    
    if (!administratif) {
      return res.status(404).json({ message: 'Administratif non trouvé' });
    }
    
    res.json(administratif);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// POST - Créer un nouvel administratif
app.post('/api/administratifs', authAdmin, async (req, res) => {
  try {
    const { nom, telephone, email, motDePasse, actif } = req.body;

    // Validation
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
    }

    if (motDePasse.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier si l'email existe déjà
    const existe = await Administratif.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const administratif = new Administratif({ 
      nom, 
      telephone, 
      email, 
      motDePasse, // Sera hashé automatiquement
      actif: actif !== undefined ? actif : true
    });

    await administratif.save();

    // Retourner sans le mot de passe
    const administratifResponse = administratif.toObject();
    delete administratifResponse.motDePasse;

    res.status(201).json({ 
      message: 'Administratif créé avec succès', 
      administratif: administratifResponse 
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
});

// PUT - Modifier un administratif
app.put('/api/administratifs/:id', authAdmin, async (req, res) => {
  try {
    const { nom, telephone, email, motDePasse, actif } = req.body;

    const administratif = await Administratif.findById(req.params.id);
    if (!administratif) {
      return res.status(404).json({ message: 'Administratif non trouvé' });
    }

    // Vérifier l'unicité de l'email
    if (email && email !== administratif.email) {
      const emailExiste = await Administratif.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExiste) {
        return res.status(400).json({ message: 'Email déjà utilisé par un autre administratif' });
      }
    }

    // Mise à jour des champs
    if (nom) administratif.nom = nom;
    if (telephone !== undefined) administratif.telephone = telephone;
    if (email) administratif.email = email;
    if (actif !== undefined) administratif.actif = actif;

    // Mise à jour du mot de passe si fourni
    if (motDePasse) {
      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      administratif.motDePasse = motDePasse; // Sera hashé automatiquement
    }

    await administratif.save();

    // Retourner sans le mot de passe
    const administratifResponse = administratif.toObject();
    delete administratifResponse.motDePasse;

    res.json({ 
      message: 'Administratif mis à jour avec succès', 
      administratif: administratifResponse 
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
});

// DELETE - Supprimer un administratif
app.delete('/api/administratifs/:id', authAdmin, async (req, res) => {
  try {
    const administratif = await Administratif.findById(req.params.id);
    if (!administratif) {
      return res.status(404).json({ message: 'Administratif non trouvé' });
    }

    await Administratif.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Administratif supprimé avec succès',
      administratif: {
        id: administratif._id,
        nom: administratif.nom,
        email: administratif.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// PATCH - Activer/Désactiver un administratif
app.patch('/api/administratifs/:id/actif', authAdmin, async (req, res) => {
  try {
    const administratif = await Administratif.findById(req.params.id);
    if (!administratif) {
      return res.status(404).json({ message: 'Administratif non trouvé' });
    }

    administratif.actif = !administratif.actif;
    await administratif.save();

    // Retourner sans le mot de passe
    const administratifResponse = administratif.toObject();
    delete administratifResponse.motDePasse;

    res.json({ 
      message: `Administratif ${administratif.actif ? 'activé' : 'désactivé'} avec succès`, 
      administratif: administratifResponse 
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET - Statistiques des administratifs (optionnel)
app.get('/api/administratifs/stats/dashboard', authAdmin, async (req, res) => {
  try {
    const totalAdministratifs = await Administratif.countDocuments();
    const administratifsActifs = await Administratif.countDocuments({ actif: true });
    const administratifsInactifs = await Administratif.countDocuments({ actif: false });
    
    const recentAdministratifs = await Administratif.find()
      .select('-motDePasse')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalAdministratifs,
      administratifsActifs,
      administratifsInactifs,
      recentAdministratifs
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.get('/api/professeur/profile', authProfesseur, async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.professeurId).select('-motDePasse');
    if (!professeur) return res.status(404).json({ message: 'Professeur introuvable' });
    res.json(professeur);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// Route pour permettre aux commerciaux d'accéder à la liste des cours
// À ajouter dans votre fichier de routes backend

// GET - Liste des cours accessible aux commerciaux (lecture seule)
app.get('/api/commercial/cours', authCommercial, async (req, res) => {
  try {
    // Les commerciaux peuvent seulement voir les cours, pas les créer/modifier/supprimer
    const cours = await Cours.find()
      .select('nom professeur') // Sélectionner seulement les champs nécessaires
      .sort({ nom: 1 }); // Trier par nom alphabétiquement
    
    res.json(cours);
  } catch (err) {
    console.error('Erreur lors de la récupération des cours pour commercial:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des cours',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  }
});

// Alternative: Modifier la route existante pour accepter les deux types d'auth
// (Si vous préférez cette approche)
app.get('/api/cours', authAdminOrPaiementManager,async (req, res) => {
  try {
    // Vérifier d'abord si c'est un admin
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    let isCommercial = false;
    
    if (adminToken) {
      try {
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
        if (decoded.adminId) {
          isAdmin = true;
        } else if (decoded.commercialId) {
          isCommercial = true;
        }
      } catch (jwtError) {
        return res.status(401).json({ message: 'Token invalide' });
      }
    }
    
    if (!isAdmin && !isCommercial) {
      return res.status(401).json({ message: 'Accès non autorisé' });
    }
    
    // Les deux peuvent voir les cours, mais avec des niveaux de détail différents
    const selectFields = isAdmin 
      ? '' // Admin voit tout
      : 'nom professeur'; // Commercial voit seulement nom et professeur
    
    const cours = await Cours.find()
      .select(selectFields)
      .sort({ nom: 1 });
    
    res.json(cours);
  } catch (err) {
    console.error('Erreur lors de la récupération des cours:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des cours',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  }
});

// Route spécifique pour les commerciaux - obtenir les cours avec nombre d'étudiants
app.get('/api/commercial/cours/disponibles', authCommercial, async (req, res) => {
  try {
    const cours = await Cours.find().select('nom professeur').sort({ nom: 1 });
    
    // Ajouter le nombre d'étudiants pour chaque cours (optionnel)
    const coursAvecStats = await Promise.all(
      cours.map(async (c) => {
        const nombreEtudiants = await Etudiant.countDocuments({ 
          cours: c.nom,
          commercial: req.commercialId 
        });
        
        return {
          _id: c._id,
          nom: c.nom,
          professeur: c.professeur,
          nombreEtudiants: nombreEtudiants
        };
      })
    );
    
    res.json(coursAvecStats);
  } catch (err) {
    console.error('Erreur lors de la récupération des cours disponibles:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des cours disponibles',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  }
});

app.get('/api/cours/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id).populate('creePar', 'nom email');
    if (!cours) return res.status(404).json({ message: 'Cours introuvable' });
    res.json(cours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/professeurs', authAdminOrPaiementManager, async (req, res) => {
  try {
    const professeurs = await Professeur.find().sort({ createdAt: -1 });
    res.json(professeurs);
  } catch (err) {
    console.error('❌ Erreur lors de l\'affichage des professeurs:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// Enhanced API route with pagination
app.get('/api/actualites', async (req, res) => {
  try {
    const { category, search, sortBy, page = 1, limit = 5 } = req.query;

    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { excerpt: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await Actualite.countDocuments(query);
    
    // Fetch actualités with pagination
    const actualites = await Actualite.find(query)
      .sort({ isPinned: -1, date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      actualites,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: skip + actualites.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.post('/api/actualites', authAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, excerpt, content, category, author, date, tags, type, isPinned } = req.body;

    const nouvelleActualite = new Actualite({
      title,
      excerpt,
      content,
      category,
      author,
      date: date || new Date(),
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      type,
      isPinned: isPinned === 'true',
      image: req.file ? `/uploads/${req.file.filename}` : ''
    });

    await nouvelleActualite.save();
    res.status(201).json(nouvelleActualite);
  } catch (err) {
    res.status(400).json({ message: 'Erreur ajout actualité', error: err.message });
  }
});
app.delete('/api/actualites/:id', authAdmin, async (req, res) => {
  try {
    const deleted = await Actualite.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Actualité non trouvée' });
    }
    res.json({ message: 'Actualité supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur suppression', error: err.message });
  }
});
// ✏️ تعديل actualité
app.put('/api/actualites/:id', authAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, excerpt, content, category, author, date, tags, type, isPinned } = req.body;

    const actualisation = {
      title,
      excerpt,
      content,
      category,
      author,
      date: date || new Date(),
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      type,
      isPinned: isPinned === 'true'
    };

    if (req.file) {
      actualisation.image = `/uploads/${req.file.filename}`;
    }

    const updated = await Actualite.findByIdAndUpdate(req.params.id, actualisation, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Actualité non trouvée' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Erreur mise à jour', error: err.message });
  }
});


app.get('/api/revenus/modes-paiement/:anneeScolaire', authAdminOrPaiementManager, async (req, res) => {
  try {
    const anneeScolaire = req.params.anneeScolaire;
    
    // Filtrer les étudiants selon l'année scolaire
    const filter = { actif: true };
    if (anneeScolaire && anneeScolaire !== 'toutes') {
      filter.anneeScolaire = anneeScolaire;
    }
    
    const etudiants = await Etudiant.find(filter);
    
    // Calculer les statistiques par mode de paiement
    const stats = {
      totalEtudiants: etudiants.length,
      totalCA: 0,
      repartitionModes: {
        annuel: { count: 0, ca: 0 },
        semestriel: { count: 0, ca: 0 },
        trimestriel: { count: 0, ca: 0 },
        mensuel: { count: 0, ca: 0 }
      }
    };
    
    etudiants.forEach(etudiant => {
      const prixTotal = parseFloat(etudiant.prixTotal) || 0;
      const mode = etudiant.modePaiement || 'semestriel';
      
      stats.totalCA += prixTotal;
      if (stats.repartitionModes[mode]) {
        stats.repartitionModes[mode].count += 1;
        stats.repartitionModes[mode].ca += prixTotal;
      }
    });
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erreur lors du calcul des modes de paiement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route sans paramètre pour "toutes les années"
app.get('/api/revenus/modes-paiement', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiants = await Etudiant.find({ actif: true });
    
    const stats = {
      totalEtudiants: etudiants.length,
      totalCA: 0,
      repartitionModes: {
        annuel: { count: 0, ca: 0 },
        semestriel: { count: 0, ca: 0 },
        trimestriel: { count: 0, ca: 0 },
        mensuel: { count: 0, ca: 0 }
      }
    };
    
    etudiants.forEach(etudiant => {
      const prixTotal = parseFloat(etudiant.prixTotal) || 0;
      const mode = etudiant.modePaiement || 'semestriel';
      
      stats.totalCA += prixTotal;
      if (stats.repartitionModes[mode]) {
        stats.repartitionModes[mode].count += 1;
        stats.repartitionModes[mode].ca += prixTotal;
      }
    });
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erreur lors du calcul des modes de paiement:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Route pour obtenir les prévisions mensuelles détaillées
app.get('/api/revenus/previsions-mensuelles/:anneeScolaire', authAdminOrPaiementManager, async (req, res) => {
  try {
    const anneeScolaire = req.params.anneeScolaire;
    
    // Filtrer les étudiants selon l'année scolaire
    const filter = { actif: true };
    if (anneeScolaire && anneeScolaire !== 'toutes') {
      filter.anneeScolaire = anneeScolaire;
    }
    
    const etudiants = await Etudiant.find(filter);
    
    // Générer les 12 mois de l'année scolaire
    const mois = [
      'Septembre', 'Octobre', 'Novembre', 'Décembre',
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août'
    ];
    
    const previsions = mois.map((nomMois, indexMois) => {
      const revenus = {
        mois: nomMois,
        annuel: 0,
        semestriel: 0,
        trimestriel: 0,
        mensuel: 0,
        total: 0,
        details: {
          annuel: { etudiants: 0, description: 'Paiement complet' },
          semestriel: { etudiants: 0, description: 'Tranches semestrielles' },
          trimestriel: { etudiants: 0, description: 'Tranches trimestrielles' },
          mensuel: { etudiants: 0, description: 'Paiements mensuels' }
        }
      };

      etudiants.forEach(etudiant => {
        const prixTotal = parseFloat(etudiant.prixTotal) || 0;
        const mode = etudiant.modePaiement || 'semestriel';

        switch (mode) {
          case 'annuel':
            // Paiement annuel en septembre (mois 0)
            if (indexMois === 0) {
              revenus.annuel += prixTotal;
              revenus.details.annuel.etudiants += 1;
            }
            break;

          case 'semestriel':
            // 2 tranches : septembre (mois 0) et février (mois 5)
            if (indexMois === 0 || indexMois === 5) {
              revenus.semestriel += Math.round(prixTotal / 2);
              revenus.details.semestriel.etudiants += 1;
            }
            break;

          case 'trimestriel':
            // 3 tranches : septembre (0), janvier (4), mai (8)
            if (indexMois === 0 || indexMois === 4 || indexMois === 8) {
              revenus.trimestriel += Math.round(prixTotal / 3);
              revenus.details.trimestriel.etudiants += 1;
            }
            break;

          case 'mensuel':
            // 10 tranches : septembre à juin (mois 0 à 9)
            if (indexMois >= 0 && indexMois <= 9) {
              revenus.mensuel += Math.round(prixTotal / 10);
              revenus.details.mensuel.etudiants += 1;
            }
            break;
        }
      });

      revenus.total = revenus.annuel + revenus.semestriel + revenus.trimestriel + revenus.mensuel;
      return revenus;
    });
    
    // Calculer le total annuel
    const totalAnnuel = previsions.reduce((sum, mois) => sum + mois.total, 0);
    
    res.json({
      previsions,
      totalAnnuel,
      anneeScolaire: anneeScolaire || 'toutes'
    });
    
  } catch (error) {
    console.error('Erreur lors du calcul des prévisions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route sans paramètre pour "toutes les années"
app.get('/api/revenus/previsions-mensuelles', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiants = await Etudiant.find({ actif: true });
    
    // Générer les 12 mois de l'année scolaire
    const mois = [
      'Septembre', 'Octobre', 'Novembre', 'Décembre',
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août'
    ];
    
    const previsions = mois.map((nomMois, indexMois) => {
      const revenus = {
        mois: nomMois,
        annuel: 0,
        semestriel: 0,
        trimestriel: 0,
        mensuel: 0,
        total: 0,
        details: {
          annuel: { etudiants: 0, description: 'Paiement complet' },
          semestriel: { etudiants: 0, description: 'Tranches semestrielles' },
          trimestriel: { etudiants: 0, description: 'Tranches trimestrielles' },
          mensuel: { etudiants: 0, description: 'Paiements mensuels' }
        }
      };

      etudiants.forEach(etudiant => {
        const prixTotal = parseFloat(etudiant.prixTotal) || 0;
        const mode = etudiant.modePaiement || 'semestriel';

        switch (mode) {
          case 'annuel':
            if (indexMois === 0) {
              revenus.annuel += prixTotal;
              revenus.details.annuel.etudiants += 1;
            }
            break;
          case 'semestriel':
            if (indexMois === 0 || indexMois === 5) {
              revenus.semestriel += Math.round(prixTotal / 2);
              revenus.details.semestriel.etudiants += 1;
            }
            break;
          case 'trimestriel':
            if (indexMois === 0 || indexMois === 4 || indexMois === 8) {
              revenus.trimestriel += Math.round(prixTotal / 3);
              revenus.details.trimestriel.etudiants += 1;
            }
            break;
          case 'mensuel':
            if (indexMois >= 0 && indexMois <= 9) {
              revenus.mensuel += Math.round(prixTotal / 10);
              revenus.details.mensuel.etudiants += 1;
            }
            break;
        }
      });

      revenus.total = revenus.annuel + revenus.semestriel + revenus.trimestriel + revenus.mensuel;
      return revenus;
    });
    
    const totalAnnuel = previsions.reduce((sum, mois) => sum + mois.total, 0);
    
    res.json({
      previsions,
      totalAnnuel,
      anneeScolaire: 'toutes'
    });
    
  } catch (error) {
    console.error('Erreur lors du calcul des prévisions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Route pour obtenir toutes les années scolaires disponibles
app.get('/api/revenus/annees-disponibles', authAdminOrPaiementManager, async (req, res) => {
  try {
    const annees = await Etudiant.distinct('anneeScolaire', { anneeScolaire: { $ne: null } });
    
    // Trier avec 2025/2026 en premier
    const anneesTriees = annees.sort((a, b) => {
      if (a === '2025/2026') return -1;
      if (b === '2025/2026') return 1;
      return b.localeCompare(a);
    });
    
    res.json(anneesTriees);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des années:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Route pour export Excel des prévisions (optionnel)
app.get('/api/revenus/export/:anneeScolaire', authAdminOrPaiementManager, async (req, res) => {
  try {
    const anneeScolaire = req.params.anneeScolaire;
    
    // Récupérer les données de prévisions
    // (Réutiliser la logique de la route previsions-mensuelles)
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=previsions-revenus-${anneeScolaire || 'toutes'}.xlsx`);
    
    // Générer le fichier Excel ici (utiliser une librairie comme xlsx)
    // res.send(excelBuffer);
    
    res.json({ message: 'Export en cours de développement' });
    
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/revenus/export', authAdminOrPaiementManager, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=previsions-revenus-toutes.xlsx');
    
    res.json({ message: 'Export en cours de développement' });
    
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/etudiants/:etudiantId/mode-paiement', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.etudiantId);
    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé" });
    }

    if (etudiant.modePaiement === 'annuel') {
      return res.json({
        modePaiement: 'annuel',
        description: 'Paiement annuel complet',
        utiliseChampPaye: true,
        paye: etudiant.paye
      });
    }

    const infos = Etudiant.getInfosPaiement(etudiant.modePaiement, etudiant.prixTotal);
    
    res.json({
      modePaiement: etudiant.modePaiement,
      prixTotal: etudiant.prixTotal,
      infos: infos,
      utiliseChampPaye: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/paiements/etudiant/:etudiantId/info', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiantId = req.params.etudiantId;
    
    const etudiant = await Etudiant.findById(etudiantId);
    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé" });
    }

    const paiements = await Paiement.find({ etudiant: etudiantId });
    
    // Séparation des paiements
    const paiementsInscription = paiements.filter(p => 
      p.typePaiement === 'inscription' || p.estInscription === true
    );
    const paiementsFormation = paiements.filter(p => 
      p.typePaiement === 'formation' || p.estInscription === false
    );
    
    const totalInscription = paiementsInscription.reduce((acc, p) => acc + p.montant, 0);
    const totalFormation = paiementsFormation.reduce((acc, p) => acc + p.montant, 0);
    const totalGeneral = totalInscription + totalFormation;
    
    // LOGIQUE CORRIGÉE : 
    // 1. Prix total = 90000 DH (formation)
    // 2. Après inscription de 3000 DH → reste 87000 DH à diviser
    const prixTotalOriginal = etudiant.prixTotal; // 90000
    const montantFormationADiviser = Math.max(0, prixTotalOriginal - totalInscription); // 90000 - 3000 = 87000
    const resteFormation = Math.max(0, montantFormationADiviser - totalFormation);
    
    let infosMode = null;
    let prochaineTranche = null;

    // Calcul des tranches sur le montant formation restant après inscription
    if (etudiant.modePaiement !== 'annuel' && montantFormationADiviser > 0) {
      switch (etudiant.modePaiement) {
        case 'semestriel':
          infosMode = {
            nombreTranches: 2,
            montantParTranche: Math.round(montantFormationADiviser / 2), // 87000 / 2 = 43500
            moisParTranche: 5,
            description: "2 tranches semestrielles",
            baseCalcul: montantFormationADiviser
          };
          break;
        case 'trimestriel':
          infosMode = {
            nombreTranches: 3,
            montantParTranche: Math.round(montantFormationADiviser / 3), // 87000 / 3 = 29000
            moisParTranche: 3,
            description: "3 tranches trimestrielles",
            baseCalcul: montantFormationADiviser
          };
          break;
        case 'mensuel':
          infosMode = {
            nombreTranches: 10,
            montantParTranche: Math.round(montantFormationADiviser / 10), // 87000 / 10 = 8700
            moisParTranche: 1,
            description: "10 tranches mensuelles",
            baseCalcul: montantFormationADiviser
          };
          break;
      }

      if (infosMode && resteFormation > 0) {
        const nombreTranchesFormationPayees = paiementsFormation.length;
        
        if (nombreTranchesFormationPayees < infosMode.nombreTranches) {
          let montantProchaineTranche;
          
          if (nombreTranchesFormationPayees === infosMode.nombreTranches - 1) {
            // Dernière tranche : prendre le reste exact pour éviter les arrondis
            montantProchaineTranche = resteFormation;
          } else {
            // Tranches normales : utiliser le montant calculé
            montantProchaineTranche = Math.min(infosMode.montantParTranche, resteFormation);
          }
          
          prochaineTranche = {
            numeroTranche: nombreTranchesFormationPayees + 1,
            montant: montantProchaineTranche,
            nombreMois: infosMode.moisParTranche,
            description: `Tranche formation ${nombreTranchesFormationPayees + 1}/${infosMode.nombreTranches}`,
            typePayment: 'formation'
          };
        }
      }
    }

    // Vérifier si inscription est due
    let inscriptionDue = totalInscription === 0;

    res.json({
      etudiant: {
        id: etudiant._id,
        nomComplet: `${etudiant.prenom} ${etudiant.nomDeFamille}`.trim(),
        prixTotal: etudiant.prixTotal,
        modePaiement: etudiant.modePaiement,
        paye: etudiant.paye
      },
      totaux: {
        inscription: totalInscription,
        formation: totalFormation,
        general: totalGeneral,
        prixTotalOriginal: prixTotalOriginal, // 90000
        montantFormationADiviser: montantFormationADiviser, // 87000 après inscription
        resteAPayer: resteFormation,
        inscriptionDue: inscriptionDue
      },
      paiements: {
        inscription: paiementsInscription,
        formation: paiementsFormation,
        tous: paiements
      },
      infosModesPaiement: infosMode,
      prochaineTranche: prochaineTranche,
      
      // Debug détaillé
      debug: {
        prixTotalOriginal: prixTotalOriginal, // 90000
        totalInscription: totalInscription, // 3000
        montantFormationADiviser: montantFormationADiviser, // 87000
        totalFormation: totalFormation, // Ce qui a été payé en formation
        resteFormation: resteFormation, // Ce qui reste à payer
        nombreTranchesFormationPayees: paiementsFormation.length,
        montantParTranche: infosMode?.montantParTranche // 8700 pour mensuel
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des informations", error: err.message });
  }
});

// API POST inchangée
app.post('/api/paiements', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { etudiant, cours, moisDebut, nombreMois, montant, note, estInscription, typePaiement } = req.body;
    const coursArray = Array.isArray(cours) ? cours : [cours];

    // Déterminer le type de paiement
    let typePaymentFinal = typePaiement || 'formation';
    if (estInscription === true) {
      typePaymentFinal = 'inscription';
    }

    // Calculer le numéro de tranche SEULEMENT pour les paiements de formation
    let numeroTranche = null;
    if (typePaymentFinal === 'formation') {
      const paiementsFormationExistants = await Paiement.find({
        etudiant,
        $or: [
          { typePaiement: 'formation' },
          { estInscription: false }
        ]
      });
      numeroTranche = paiementsFormationExistants.length + 1;
    }

    const paiement = new Paiement({
      etudiant,
      cours: coursArray,
      moisDebut: new Date(moisDebut || Date.now()),
      nombreMois: nombreMois || (typePaymentFinal === 'inscription' ? 0 : 1),
      montant,
      note,
      typePaiement: typePaymentFinal,
      estInscription: typePaymentFinal === 'inscription',
      numeroTranche: numeroTranche,
      creePar: req.adminId
    });

    await paiement.save();

    // Calcul pour marquer l'étudiant comme payé
    const paiementsFormation = await Paiement.find({ 
      etudiant, 
      $or: [
        { typePaiement: 'formation' },
        { estInscription: false }
      ]
    });
    const paiementsInscription = await Paiement.find({ 
      etudiant, 
      $or: [
        { typePaiement: 'inscription' },
        { estInscription: true }
      ]
    });
    
    const totalPayeFormation = paiementsFormation.reduce((acc, p) => acc + p.montant, 0);
    const totalInscription = paiementsInscription.reduce((acc, p) => acc + p.montant, 0);

    // Mise à jour du statut de l'étudiant
    const etudiantDoc = await Etudiant.findById(etudiant);
    if (etudiantDoc) {
      if (etudiantDoc.modePaiement === 'annuel') {
        // Pour mode annuel : ne pas modifier automatiquement
      } else {
        // Calculer le montant formation requis après inscription
        const montantFormationRequis = Math.max(0, etudiantDoc.prixTotal - totalInscription);
        
        if (totalPayeFormation >= montantFormationRequis) {
          etudiantDoc.paye = true;
        } else {
          etudiantDoc.paye = false;
        }
        await etudiantDoc.save();
      }
    }

    res.status(201).json({ 
      message: 'Paiement ajouté avec succès', 
      paiement,
      totalPayeFormation,
      montantFormationRequis: etudiantDoc ? Math.max(0, etudiantDoc.prixTotal - totalInscription) : 0,
      modePaiement: etudiantDoc?.modePaiement,
      typePaiement: typePaymentFinal,
      numeroTranche: numeroTranche
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Nouvelle route API à ajouter dans votre serveur
// À ajouter dans votre fichier serveur (app.js ou server.js)

app.get('/api/revenus/previsions/:anneeScolaire', authAdmin, async (req, res) => {
  try {
    const anneeScolaire = decodeURIComponent(req.params.anneeScolaire);
    
    console.log(`Calcul des prévisions pour l'année: "${anneeScolaire}"`);
    
    if (!anneeScolaire || anneeScolaire === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Année scolaire non fournie ou invalide'
      });
    }
    
    // Récupérer les étudiants pour l'année scolaire
    const query = anneeScolaire === 'toutes' ? { actif: true } : { anneeScolaire, actif: true };
    const etudiants = await Etudiant.find(query);
    
    console.log(`Nombre d'étudiants trouvés: ${etudiants.length} pour l'année: "${anneeScolaire}"`);
    
    // Récupérer TOUS les paiements pour ces étudiants
    const etudiantIds = etudiants.map(e => e._id);
    const paiements = await Paiement.find({ 
      etudiant: { $in: etudiantIds } 
    }).populate('etudiant', 'modePaiement prixTotal anneeScolaire nomComplet');
    
    console.log(`Nombre de paiements trouvés: ${paiements.length}`);
    
    // Séparer les paiements inscription vs formation
    const paiementsInscription = paiements.filter(p => 
      p.typePaiement === 'inscription' || p.estInscription === true
    );
    const paiementsFormation = paiements.filter(p => 
      p.typePaiement === 'formation' || p.estInscription === false
    );
    
    console.log(`Paiements inscription: ${paiementsInscription.length}, Formation: ${paiementsFormation.length}`);
    
    // ANALYSE DES PAIEMENTS D'INSCRIPTION PAR ÉTUDIANT
    console.log('=== ANALYSE DES PAIEMENTS D\'INSCRIPTION ===');
    const analysePaiementsInscription = {};
    paiementsInscription.forEach(paiement => {
      const etudiantId = paiement.etudiant._id.toString();
      if (!analysePaiementsInscription[etudiantId]) {
        analysePaiementsInscription[etudiantId] = {
          nomEtudiant: paiement.etudiant.nomComplet || 'Nom non disponible',
          paiements: [],
          total: 0
        };
      }
      analysePaiementsInscription[etudiantId].paiements.push({
        montant: paiement.montant,
        date: paiement.dateCreation || paiement.createdAt
      });
      analysePaiementsInscription[etudiantId].total += paiement.montant;
    });

    // Afficher l'analyse
    Object.entries(analysePaiementsInscription).forEach(([etudiantId, data]) => {
      console.log(`Étudiant: ${data.nomEtudiant}`);
      console.log(`  - Nombre de paiements d'inscription: ${data.paiements.length}`);
      console.log(`  - Total inscription payé: ${data.total} MAD`);
    });
    console.log('=== FIN ANALYSE INSCRIPTIONS ===');
    
    // Calculer les montants réels
    const totalInscriptionReel = paiementsInscription.reduce((sum, p) => sum + p.montant, 0);
    const totalFormationReel = paiementsFormation.reduce((sum, p) => sum + p.montant, 0);
    
    // Générer les prévisions par mois
    const mois = [
      'Septembre', 'Octobre', 'Novembre', 'Décembre',
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août'
    ];

    const previsions = mois.map((nomMois, indexMois) => {
      const revenus = {
        mois: nomMois,
        inscription: 0,
        annuel: 0,
        semestriel: 0,
        trimestriel: 0,
        mensuel: 0,
        total: 0,
        details: {
          inscription: { etudiants: 0 },
          annuel: { etudiants: 0 },
          semestriel: { etudiants: 0 },
          trimestriel: { etudiants: 0 },
          mensuel: { etudiants: 0 }
        }
      };

      etudiants.forEach(etudiant => {
        const prixTotal = parseFloat(etudiant.prixTotal) || 0;
        const mode = etudiant.modePaiement || 'semestriel';

        // Récupérer les paiements d'inscription réels pour cet étudiant
        const paiementsInscriptionEtudiant = paiementsInscription.filter(p => 
          p.etudiant && p.etudiant._id && p.etudiant._id.toString() === etudiant._id.toString()
        );
        
        // Calculer le total d'inscription réellement payé
        const totalInscriptionPaye = paiementsInscriptionEtudiant.reduce((sum, p) => sum + p.montant, 0);
        
        // CORRECTION PRINCIPALE : Calculer le prix formation individuel
        // Si l'étudiant a payé une inscription, on la déduit du prix total
        // Sinon, on utilise tout le prix total comme formation
        const prixFormation = totalInscriptionPaye > 0 ? 
          Math.max(0, prixTotal - totalInscriptionPaye) : 
          prixTotal;

        console.log(`Étudiant ${etudiant.nomComplet}: Prix total ${prixTotal}, Inscription payée ${totalInscriptionPaye}, Formation ${prixFormation}, Mode: ${mode}`);

        // CORRECTION INSCRIPTION : SEULEMENT en septembre ET SEULEMENT pour les étudiants qui ont payé
        if (indexMois === 0 && totalInscriptionPaye > 0) {
          revenus.inscription += totalInscriptionPaye;
          revenus.details.inscription.etudiants += 1;
          console.log(`  → Inscription comptée: ${totalInscriptionPaye} MAD`);
        }

        // FORMATION selon le mode de paiement - UTILISEZ prixFormation calculé individuellement
        switch (mode) {
          case 'annuel':
            if (indexMois === 0) {
              revenus.annuel += prixFormation;
              revenus.details.annuel.etudiants += 1;
              console.log(`  → Annuel: ${prixFormation} MAD (était ${prixTotal}, inscription déduite: ${totalInscriptionPaye})`);
            }
            break;

          case 'semestriel':
            if (indexMois === 0 || indexMois === 5) {
              const montantSemestriel = Math.round(prixFormation / 2);
              revenus.semestriel += montantSemestriel;
              revenus.details.semestriel.etudiants += 1;
              console.log(`  → Semestriel mois ${nomMois}: ${montantSemestriel} MAD (${prixFormation}/2, inscription déduite: ${totalInscriptionPaye})`);
            }
            break;

          case 'trimestriel':
            if (indexMois === 0 || indexMois === 4 || indexMois === 8) {
              const montantTrimestriel = Math.round(prixFormation / 3);
              revenus.trimestriel += montantTrimestriel;
              revenus.details.trimestriel.etudiants += 1;
              console.log(`  → Trimestriel mois ${nomMois}: ${montantTrimestriel} MAD (${prixFormation}/3, inscription déduite: ${totalInscriptionPaye})`);
            }
            break;

          case 'mensuel':
            if (indexMois >= 0 && indexMois <= 9) {
              const montantMensuel = Math.round(prixFormation / 10);
              revenus.mensuel += montantMensuel;
              revenus.details.mensuel.etudiants += 1;
              console.log(`  → Mensuel mois ${nomMois}: ${montantMensuel} MAD (${prixFormation}/10, inscription déduite: ${totalInscriptionPaye})`);
            }
            break;
        }
      });

      revenus.total = revenus.inscription + revenus.annuel + revenus.semestriel + revenus.trimestriel + revenus.mensuel;
      
      if (revenus.total > 0) {
        console.log(`Mois ${nomMois}: Inscription=${revenus.inscription}, Annuel=${revenus.annuel}, Semestriel=${revenus.semestriel}, Trimestriel=${revenus.trimestriel}, Mensuel=${revenus.mensuel}, Total=${revenus.total}`);
      }
      
      return revenus;
    });

    // Statistiques globales
    const stats = {
      totalEtudiants: etudiants.length,
      totalInscriptionReel: totalInscriptionReel,
      totalFormationReel: totalFormationReel,
      totalCAPrevisionnel: previsions.reduce((sum, m) => sum + m.total, 0),
      repartitionModes: {
        annuel: { count: 0, ca: 0 },
        semestriel: { count: 0, ca: 0 },
        trimestriel: { count: 0, ca: 0 },
        mensuel: { count: 0, ca: 0 }
      }
    };

    // Calculer la répartition par mode
    etudiants.forEach(etudiant => {
      const mode = etudiant.modePaiement || 'semestriel';
      const prixTotal = parseFloat(etudiant.prixTotal) || 0;
      
      if (stats.repartitionModes[mode]) {
        stats.repartitionModes[mode].count += 1;
        stats.repartitionModes[mode].ca += prixTotal;
      }
    });

    console.log('=== RÉSUMÉ FINAL ===');
    console.log('Statistiques calculées:', stats);
    console.log('Total CA prévisionnel:', stats.totalCAPrevisionnel);
    console.log('Étudiants avec inscription payée:', Object.keys(analysePaiementsInscription).length);
    console.log('===================');

    res.json({
      success: true,
      anneeScolaire: anneeScolaire,
      statistiques: stats,
      previsionsMensuelles: previsions,
      debug: {
        anneeScolaireRecue: req.params.anneeScolaire,
        anneeScolaireDecode: anneeScolaire,
        totalEtudiants: etudiants.length,
        totalPaiements: paiements.length,
        paiementsInscription: paiementsInscription.length,
        paiementsFormation: paiementsFormation.length,
        totalInscriptionReel: totalInscriptionReel,
        totalFormationReel: totalFormationReel,
        etudiantsAvecInscription: Object.keys(analysePaiementsInscription).length,
        analysePaiementsInscription: analysePaiementsInscription,
        exempleCalcul: etudiants.length > 0 ? {
          etudiant: etudiants[0].nomComplet,
          prixTotal: etudiants[0].prixTotal,
          inscriptionPayee: analysePaiementsInscription[etudiants[0]._id.toString()]?.total || 0,
          prixFormation: analysePaiementsInscription[etudiants[0]._id.toString()] ? 
            (parseFloat(etudiants[0].prixTotal) || 0) - analysePaiementsInscription[etudiants[0]._id.toString()].total :
            (parseFloat(etudiants[0].prixTotal) || 0),
          mode: etudiants[0].modePaiement
        } : null
      }
    });

  } catch (err) {
    console.error('Erreur API revenus:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du calcul des revenus', 
      error: err.message 
    });
  }
});
app.post('/api/messages/upload', authEtudiant, uploadMessageFile.single('fichier'), async (req, res) => {
  try {
    const { contenu, destinataireId, roleDestinataire } = req.body;

    const hasContenu = contenu && contenu.trim() !== '';
    const hasFile = !!req.file;

    if (!hasContenu && !hasFile) {
      return res.status(400).json({ message: 'Le contenu du message ou le fichier est requis.' });
    }

    const messageData = {
      expediteur: req.etudiantId,
      roleExpediteur: 'Etudiant',
      destinataire: destinataireId,
      roleDestinataire: 'Professeur',
      etudiant: req.etudiantId,
      professeur: destinataireId,
    };

    if (hasContenu) messageData.contenu = contenu.trim();
    if (hasFile) messageData.fichier = `/uploads/messages/${req.file.filename}`;

    const newMessage = new Message(messageData);
    await newMessage.save();

    res.status(201).json({
      message: 'Message envoyé avec succès.',
      data: newMessage,
    });
  } catch (err) {
    console.error('Erreur lors de l’envoi du message avec fichier:', err);
    res.status(500).json({ message: 'Une erreur est survenue sur le serveur.' });
  }
});app.get('/api/etudiant/me', authEtudiant, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.etudiantId).select('-motDePasse');
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }
    res.json(etudiant);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});app.get('/api/etudiant/mes-professeurs-messages', authEtudiant, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.etudiantId);
    const coursEtudiant = etudiant.cours;

    const professeurs = await Professeur.find({
      cours: { $in: coursEtudiant },
      actif: true
    }).select('_id nom cours image genre lastSeen');

    // Pour chaque professeur, obtenir le dernier message
    const professeursAvecMessages = await Promise.all(
      professeurs.map(async (prof) => {
        const dernierMessage = await Message.findOne({
          $or: [
            { expediteur: prof._id, destinataire: req.etudiantId },
            { expediteur: req.etudiantId, destinataire: prof._id }
          ]
        })
        .sort({ date: -1 })
        .select('contenu date roleExpediteur');

        return {
          ...prof.toObject(),
          dernierMessage
        };
      })
    );

    res.json(professeursAvecMessages);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


app.post('/api/bulletins', authProfesseur, async (req, res) => {
  try {
    const { etudiant, cours, semestre, notes, remarque } = req.body;

    // ✅ Calcul de la moyenne finale
    let total = 0;
    let coefTotal = 0;
    for (let n of notes) {
      total += n.note * n.coefficient;
      coefTotal += n.coefficient;
    }

    const moyenne = coefTotal > 0 ? (total / coefTotal).toFixed(2) : null;

    const bulletin = new Bulletin({
      etudiant,
      professeur: req.professeurId,
      cours,
      semestre,
      notes,
      remarque,
      moyenneFinale: moyenne
    });

    await bulletin.save();
    res.status(201).json({ message: '✅ Bulletin créé', bulletin });

  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', error: err.message });
  }
});

app.get('/api/bulletins/etudiant/me', authEtudiant, async (req, res) => {
  try {
    // 1. Vérifier que l'étudiant existe toujours
    const etudiantExists = await Etudiant.findById(req.etudiantId);
    if (!etudiantExists) {
      return res.status(404).json({
        success: false,
        message: "Étudiant non trouvé"
      });
    }

    // 2. Récupérer les bulletins avec une structure garantie
    const bulletins = await Bulletin.find({ etudiant: req.etudiantId })
      .populate('etudiant', 'prenom nomDeFamille')
      .populate('professeur', 'nom prenom')
      .lean(); // Convertit en objet JS simple

    // 3. Formater la réponse de manière fiable
    const response = {
      success: true,
      count: bulletins.length,
      bulletins: bulletins.map(b => ({
        _id: b._id,
        cours: b.cours || 'Non spécifié',
        semestre: b.semestre || 'Année',
        notes: Array.isArray(b.notes) ? b.notes : [],
        moyenneFinale: b.moyenneFinale ?? null,
        remarque: b.remarque || '',
        createdAt: b.createdAt,
        etudiant: {
          _id: b.etudiant?._id,
          nomComplet: b.etudiant 
            ? `${b.etudiant.prenom || ''} ${b.etudiant.nomDeFamille || ''}`.trim() 
            : 'N/A'
        },
        professeur: {
          _id: b.professeur?._id,
          nomComplet: b.professeur
            ? `${b.professeur.prenom || ''} ${b.professeur.nom || ''}`.trim()
            : 'N/A'
        }
      }))
    };

    // 4. Renvoyer même si tableau vide (pour éviter les erreurs front)
    res.json(response);

  } catch (err) {
    console.error('Erreur bulletins:', {
      error: err.message,
      etudiantId: req.etudiantId,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
// Voir les bulletins que le prof a créés
app.get('/api/bulletins/professeur', authProfesseur, async (req, res) => {
  try {
    const bulletins = await Bulletin.find({ professeur: req.professeurId })
      .populate({
        path: 'etudiant',
        select: 'prenom nomDeFamille nomComplet', // Sélection multiple
        transform: doc => doc ? {
          _id: doc._id,
          nomComplet: doc.nomComplet || `${doc.prenom || ''} ${doc.nomDeFamille || ''}`.trim(),
          prenom: doc.prenom,
          nomDeFamille: doc.nomDeFamille
        } : null
      })
      .sort({ createdAt: -1 });
    
    res.json(bulletins);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Admin: voir tous
app.get('/api/bulletins',authAdminOrPaiementManager , async (req, res) => {
  try {
    const bulletins = await Bulletin.find()
      .populate({
        path: 'etudiant',
        select: 'prenom nomDeFamille nomComplet',
        transform: doc => doc ? {
          _id: doc._id,
          nomComplet: doc.nomComplet || `${doc.prenom || ''} ${doc.nomDeFamille || ''}`.trim()
        } : null
      })
      .populate({
        path: 'professeur',
        select: 'nom prenom',
        transform: doc => doc ? {
          _id: doc._id,
          nomComplet: `${doc.prenom || ''} ${doc.nom || ''}`.trim()
        } : null
      })
      .sort({ createdAt: -1 });

    res.json(bulletins.map(b => ({
      ...b.toObject(),
      // Formatage cohérent
      etudiantNom: b.etudiant?.nomComplet || 'N/A',
      professeurNom: b.professeur?.nomComplet || 'N/A'
    })));
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des bulletins',
      details: error.message 
    });
  }
});

// ✅ Lister les paiements



app.get('/api/paiements/exp', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiants = await Etudiant.find({ actif: true });
    const paiements = await Paiement.find({}).lean();

    const expires = [];

    for (const etudiant of etudiants) {
      if (!etudiant.cours || etudiant.cours.length === 0) continue;

      for (const nomCours of etudiant.cours) {
        const paiementsCours = paiements.filter(p =>
          p.etudiant?.toString() === etudiant._id.toString() &&
          p.cours.includes(nomCours)
        );

        const prixTotal = etudiant.prixTotal || 0;
        const montantPaye = paiementsCours.reduce((acc, p) => acc + (p.montant || 0), 0);
        const reste = Math.max(0, prixTotal - montantPaye);

        // ✅ Si l'étudiant a payé le prix complet, ne pas l'afficher dans les expirés
        if (reste <= 0) {
          continue; // Paiement complet, pas d'expiration
        }

        // ✅ Si aucun paiement, utiliser la date d'inscription comme référence
        if (paiementsCours.length === 0) {
          expires.push({
            etudiant: {
              _id: etudiant._id,
              prenom: etudiant.prenom,
              nomDeFamille: etudiant.nomDeFamille,
              nomComplet: etudiant.nomComplet,
              telephone: etudiant.telephone,
              email: etudiant.email,
              image: etudiant.image,
              actif: etudiant.actif
            },
            cours: nomCours,
            derniereFin: etudiant.dateInscription || etudiant.createdAt || new Date(), // ✅ Date d'inscription
            prixTotal,
            montantPaye: 0,
            reste: prixTotal,
            type: 'nouveau' // ✅ Pour identifier les nouveaux étudiants
          });
          continue;
        }

        // ✅ Si il y a des paiements mais pas complets
        paiementsCours.sort((a, b) => new Date(a.moisDebut) - new Date(b.moisDebut));

        const fusionnees = [];
        for (const paiement of paiementsCours) {
          const debut = new Date(paiement.moisDebut);
          const fin = new Date(paiement.moisDebut);
          fin.setMonth(fin.getMonth() + (paiement.nombreMois || 1));

          if (fusionnees.length === 0) {
            fusionnees.push({ debut, fin });
          } else {
            const derniere = fusionnees[fusionnees.length - 1];
            const unJourApres = new Date(derniere.fin);
            unJourApres.setDate(unJourApres.getDate() + 1);

            if (debut <= unJourApres) {
              derniere.fin = fin > derniere.fin ? fin : derniere.fin;
            } else {
              fusionnees.push({ debut, fin });
            }
          }
        }

        const dernierePeriode = fusionnees[fusionnees.length - 1];
        const maintenant = new Date();

        // ✅ Seulement si la période est expirée ET qu'il reste à payer
        if (reste > 0 && dernierePeriode.fin < maintenant) {
          expires.push({
            etudiant: {
              _id: etudiant._id,
              prenom: etudiant.prenom,
              nomDeFamille: etudiant.nomDeFamille,
              nomComplet: etudiant.nomComplet,
              telephone: etudiant.telephone,
              email: etudiant.email,
              image: etudiant.image,
              actif: etudiant.actif
            },
            cours: nomCours,
            derniereFin: dernierePeriode.fin,
            prixTotal,
            montantPaye,
            reste,
            type: 'expire' // ✅ Pour identifier les vrais expirés
          });
        }
      }
    }

    // Trier par nombre de jours expirés (les plus urgents en premier)
    expires.sort((a, b) => {
      const aJours = Math.ceil((new Date() - new Date(a.derniereFin)) / (1000 * 60 * 60 * 24));
      const bJours = Math.ceil((new Date() - new Date(b.derniereFin)) / (1000 * 60 * 60 * 24));
      return bJours - aJours;
    });

    res.json(expires);
  } catch (error) {
    console.error('Erreur paiements expirés:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des paiements expirés',
      error: error.message
    });
  }
});




// Exemple de route dans Express (dans routes/statistiques.js par exemple)



// ✅ Route pour supprimer un message
app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const messageId = req.params.messageId;

    // Vérifier si le message existe
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est l'expéditeur du message
    if (message.expediteur.toString() !== decoded.id) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce message' });
    }

    // Supprimer le message
    await Message.findByIdAndDelete(messageId);
    
    res.json({ 
      message: 'Message supprimé avec succès', 
      messageId: messageId 
    });
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


// Route pour supprimer une notification avec sauvegarde du contexte
app.delete('/api/notifications/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Suppression notification: ${id}`);
    
    // Extraire les informations de l'ID de notification
    const [type, , etudiantId, nombreAbsences] = id.split('_');
    
    if (type === 'absence' && etudiantId) {
      // Sauvegarder la suppression avec le contexte
      const suppressionKey = `absence_${etudiantId}`;
      
      await NotificationSupprimee.findOneAndUpdate(
        { key: suppressionKey, type: 'absence_frequent' },
        {
          key: suppressionKey,
          type: 'absence_frequent',
          etudiantId: etudiantId,
          nombreAbsencesAuMomentSuppression: parseInt(nombreAbsences) || 0,
          dateSuppression: new Date(),
          supprimePar: req.user.id // ID de l'admin qui a supprimé
        },
        { upsert: true, new: true }
      );
      
      console.log(`✅ Suppression sauvegardée pour étudiant ${etudiantId} avec ${nombreAbsences} absences`);
    }
    
    res.json({ 
      success: true, 
      message: 'Notification supprimée avec succès',
      context: type === 'absence' ? {
        etudiantId,
        nombreAbsences: parseInt(nombreAbsences) || 0
      } : null
    });
    
  } catch (err) {
    console.error('❌ Erreur suppression notification:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route pour restaurer les notifications supprimées
app.post('/api/notifications/reset-deleted', authAdminOrPaiementManager, async (req, res) => {
  try {
    const result = await NotificationSupprimee.deleteMany({});
    
    console.log(`🔄 ${result.deletedCount} notifications supprimées restaurées`);
    
    res.json({
      success: true,
      restoredCount: result.deletedCount,
      message: 'Toutes les notifications supprimées ont été restaurées'
    });
    
  } catch (err) {
    console.error('❌ Erreur restauration notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route pour configurer les seuils d'absence
app.post('/api/notifications/seuils-absence', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { normal, urgent, critique } = req.body;
    
    // Valider les seuils
    if (!normal || !urgent || !critique || normal >= urgent || urgent >= critique) {
      return res.status(400).json({
        error: 'Les seuils doivent être: normal < urgent < critique'
      });
    }
    
    // Sauvegarder en base (vous pouvez créer un modèle Configuration)
    await Configuration.findOneAndUpdate(
      { key: 'seuils_absence' },
      {
        key: 'seuils_absence',
        value: { normal, urgent, critique },
        modifiePar: req.user.id,
        dateModification: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log(`⚙️ Seuils d'absence mis à jour: ${normal}/${urgent}/${critique}`);
    
    res.json({
      success: true,
      seuils: { normal, urgent, critique },
      message: 'Seuils d\'absence mis à jour avec succès'
    });
    
  } catch (err) {
    console.error('❌ Erreur mise à jour seuils:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route de statistiques détaillées pour les absences
app.get('/api/notifications/stats-absences', authAdmin, async (req, res) => {
  try {
    const etudiantsActifs = await Etudiant.find({ actif: true });
    const stats = {
      totalEtudiants: etudiantsActifs.length,
      parSeuil: {
        normal: 0,    // 10-14 absences
        urgent: 0,    // 15-19 absences
        critique: 0   // 20+ absences
      },
      repartition: [],
      moyenneAbsences: 0
    };
    
    let totalAbsences = 0;
    
    for (const etudiant of etudiantsActifs) {
      const absences = await Presence.countDocuments({
        etudiant: etudiant._id,
        present: false
      });
      
      totalAbsences += absences;
      
      stats.repartition.push({
        etudiantId: etudiant._id,
        nom: etudiant.nomComplet,
        absences: absences,
        niveau: absences >= 20 ? 'critique' : 
                absences >= 15 ? 'urgent' : 
                absences >= 10 ? 'normal' : 'ok'
      });
      
      if (absences >= 20) stats.parSeuil.critique++;
      else if (absences >= 15) stats.parSeuil.urgent++;
      else if (absences >= 10) stats.parSeuil.normal++;
    }
    
    stats.moyenneAbsences = Math.round(totalAbsences / etudiantsActifs.length * 100) / 100;
    
    // Trier par nombre d'absences décroissant
    stats.repartition.sort((a, b) => b.absences - a.absences);
    
    res.json(stats);
    
  } catch (err) {
    console.error('❌ Erreur stats absences:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route pour marquer un message comme lu
app.patch('/api/messages/:messageId/read', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est le destinataire
    if (message.destinataire.toString() !== decoded.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Marquer comme lu
    message.lu = true;
    message.dateLecture = new Date();
    await message.save();

    res.json({ message: 'Message marqué comme lu' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir le nombre de messages non lus
app.get('/api/messages/unread-count', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const userId = decoded.id;
    const role = decoded.role === 'etudiant' ? 'Etudiant' : 'Professeur';

    const unreadCount = await Message.countDocuments({
      destinataire: userId,
      roleDestinataire: role,
      lu: { $ne: true }
    });

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir les messages non lus par expéditeur
app.get('/api/messages/unread-by-sender', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const userId = decoded.id;
    const role = decoded.role === 'etudiant' ? 'Etudiant' : 'Professeur';

    const unreadMessages = await Message.aggregate([
      {
        $match: {
          destinataire: new mongoose.Types.ObjectId(userId),
          roleDestinataire: role,
          lu: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$expediteur',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convertir en objet pour faciliter l'utilisation côté frontend
    const unreadCounts = {};
    unreadMessages.forEach(item => {
      unreadCounts[item._id.toString()] = item.count;
    });

    res.json(unreadCounts);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.put('/api/rappels/:id', async (req, res) => {
  try {
    const { dateRappel, note } = req.body;
    const updated = await Rappel.findByIdAndUpdate(
      req.params.id,
      { dateRappel, note },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rappels', async (req, res) => {
  try {
    console.log('📥 Body reçu:', req.body); // <= هذا مهم
    const { etudiant, cours, montantRestant, note, dateRappel } = req.body;

    if (!etudiant || !cours || !montantRestant || !dateRappel) {
      return res.status(400).json({ message: 'Champs manquants' });
    }

    const rappel = new Rappel({ etudiant, cours, montantRestant, note, dateRappel });
    await rappel.save();
    res.status(201).json(rappel);
  } catch (err) {
    console.error('❌ Erreur POST /rappels:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.get('/api/vie-scolaire', async (req, res) => {
  try {
    const { cycle, year, category, search, limit = 10, page = 1 } = req.query;
    
    // Construction du filtre
    const filter = {};
    if (cycle) filter.cycle = cycle;
    if (year) filter.year = year;
    if (category && category !== 'all') filter.category = category;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { fullDescription: { $regex: search, $options: 'i' } },
        { lieu: { $regex: search, $options: 'i' } },
        { organisateur: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageSize = parseInt(limit);
    const currentPage = parseInt(page);
    const skip = (currentPage - 1) * pageSize;
    
    // Compter le total des documents
    const total = await Activity.countDocuments(filter);
    
    // Récupérer les activités avec pagination
    const activities = await Activity.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select('-__v');
    
    res.json({
      data: activities,
      currentPage,
      totalPages: Math.ceil(total / pageSize),
      totalItems: total,
      success: true
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des activités',
      success: false
    });
  }
});

// GET une activité par ID
app.get('/api/vie-scolaire/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: 'ID d\'activité invalide',
        success: false
      });
    }
    
    const activity = await Activity.findById(req.params.id).select('-__v');
    
    if (!activity) {
      return res.status(404).json({ 
        error: 'Activité non trouvée',
        success: false
      });
    }
    
    res.json(activity);
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de l\'activité',
      success: false
    });
  }
});

// POST créer une nouvelle activité (admin uniquement)
app.post('/api/vie-scolaire', authAdmin, uploadVieScolaire.array('images', 10), async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      category,
      description,
      fullDescription,
      participants,
      lieu,
      organisateur,
      materiel,
      year,
      cycle
    } = req.body;
    
    // Validation des champs requis
    if (!title || !date || !category || !description || !year || !cycle) {
      return res.status(400).json({
        error: 'Les champs title, date, category, description, year et cycle sont requis',
        success: false
      });
    }
    
    // Traitement des images uploadées
    const images = req.files ? req.files.map(file => `/uploads/vieScolaire/${file.filename}`) : [];
    
    // Création de l'activité
    const activity = new Activity({
      title: title.trim(),
      date: new Date(date),
      time: time?.trim(),
      category,
      description: description.trim(),
      fullDescription: fullDescription?.trim(),
      participants: participants ? parseInt(participants) : undefined,
      lieu: lieu?.trim(),
      organisateur: organisateur?.trim(),
      materiel: materiel?.trim(),
      images,
      year,
      cycle
    });
    
    await activity.save();
    
    res.status(201).json({
      data: activity,
      message: 'Activité créée avec succès',
      success: true
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error);
    
    // Supprimer les fichiers uploadés en cas d'erreur
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Erreur lors de la suppression du fichier:', err);
        });
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Erreur de validation des données',
        details: error.message,
        success: false
      });
    }
    
    res.status(500).json({
      error: 'Erreur serveur lors de la création de l\'activité',
      success: false
    });
  }
});
app.get('/api/commerciaux', authAdmin, async (req, res) => {
  try {
    const commerciaux = await Commercial.find()
      .select('-motDePasse') // Don't send password
      .sort({ createdAt: -1 });
    res.json(commerciaux);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Create new commercial
app.post('/api/commerciaux', authAdmin, async (req, res) => {
  try {
    const { nom, telephone, email, motDePasse, estAdminInscription, actif } = req.body;

    // Check if email already exists
    const existe = await Commercial.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Validate required fields
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
    }

    // Validate password strength
    if (motDePasse.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const commercial = new Commercial({ 
      nom, 
      telephone, 
      email, 
      motDePasse, // Will be hashed by pre-save middleware
      estAdminInscription: estAdminInscription || false,
      actif: actif !== undefined ? actif : true
    });

    await commercial.save();

    // Remove password from response
    const commercialResponse = commercial.toObject();
    delete commercialResponse.motDePasse;

    res.status(201).json({ 
      message: '✅ Commercial ajouté avec succès', 
      commercial: commercialResponse 
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
});

// ✅ Update commercial
app.put('/api/commerciaux/:id', authAdmin, async (req, res) => {
  try {
    const { nom, telephone, email, motDePasse, estAdminInscription, actif } = req.body;

    const commercial = await Commercial.findById(req.params.id);
    if (!commercial) {
      return res.status(404).json({ message: 'Commercial non trouvé' });
    }

    // Check if email is taken by another commercial
    if (email && email !== commercial.email) {
      const existingCommercial = await Commercial.findOne({ email, _id: { $ne: req.params.id } });
      if (existingCommercial) {
        return res.status(400).json({ message: 'Email déjà utilisé par un autre commercial' });
      }
    }

    // Update fields
    if (nom) commercial.nom = nom;
    if (telephone !== undefined) commercial.telephone = telephone;
    if (email) commercial.email = email;
    if (estAdminInscription !== undefined) commercial.estAdminInscription = estAdminInscription;
    if (actif !== undefined) commercial.actif = actif;

    // Update password if provided
    if (motDePasse) {
      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      commercial.motDePasse = motDePasse; // Will be hashed by pre-save middleware
    }

    await commercial.save();

    // Remove password from response
    const commercialResponse = commercial.toObject();
    delete commercialResponse.motDePasse;

    res.json({ 
      message: '✅ Commercial mis à jour avec succès', 
      commercial: commercialResponse 
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
});

// ✅ Delete commercial but keep students (set commercial to null)
app.delete('/api/commerciaux/:id', authAdmin, async (req, res) => {
  try {
    const commercial = await Commercial.findById(req.params.id);
    if (!commercial) {
      return res.status(404).json({ message: 'Commercial non trouvé' });
    }

    // Instead of preventing deletion, update students to remove commercial reference
    const studentsCount = await Etudiant.countDocuments({ commercial: req.params.id });
    
    if (studentsCount > 0) {
      // Set commercial to null for all associated students
      await Etudiant.updateMany(
        { commercial: req.params.id },
        { $unset: { commercial: "" } } // This removes the field entirely
        // OR use: { $set: { commercial: null } } // This sets it to null
      );
      
      console.log(`✅ ${studentsCount} étudiant(s) mis à jour - commercial retiré`);
    }

    // Now delete the commercial
    await Commercial.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: `✅ Commercial supprimé avec succès. ${studentsCount} étudiant(s) n'ont plus de commercial assigné.`,
      studentsAffected: studentsCount
    });
  } catch (err) {
    console.error('Erreur suppression commercial:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Alternative version: Delete commercial and assign students to a default/admin commercial
app.delete('/api/commerciaux/:id', authAdmin, async (req, res) => {
  try {
    const commercial = await Commercial.findById(req.params.id);
    if (!commercial) {
      return res.status(404).json({ message: 'Commercial non trouvé' });
    }

    const studentsCount = await Etudiant.countDocuments({ commercial: req.params.id });
    
    if (studentsCount > 0) {
      // Option 1: Remove commercial reference entirely
      await Etudiant.updateMany(
        { commercial: req.params.id },
        { $unset: { commercial: "" } }
      );
      
      /* Option 2: Assign to a default admin commercial
      const adminCommercial = await Commercial.findOne({ estAdminInscription: true, actif: true });
      if (adminCommercial) {
        await Etudiant.updateMany(
          { commercial: req.params.id },
          { $set: { commercial: adminCommercial._id } }
        );
      } else {
        // If no admin found, just remove the reference
        await Etudiant.updateMany(
          { commercial: req.params.id },
          { $unset: { commercial: "" } }
        );
      }
      */
    }

    await Commercial.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: `✅ Commercial supprimé avec succès. ${studentsCount} étudiant(s) n'ont plus de commercial assigné.`,
      studentsAffected: studentsCount
    });
  } catch (err) {
    console.error('Erreur suppression commercial:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Also update the statistics endpoint to handle students without commercials
app.get('/api/commerciaux/statistiques', authAdmin, async (req, res) => {
  try {
    const commerciauxStats = await Etudiant.aggregate([
      { $match: { commercial: { $ne: null, $exists: true } } }, // Only students with commercials
      {
        $lookup: {
          from: 'paiements',
          localField: '_id',
          foreignField: 'etudiant',
          as: 'paiements'
        }
      },
      {
        $group: {
          _id: '$commercial',
          chiffreAffaire: { $sum: '$prixTotal' },
          totalRecu: { 
            $sum: { 
              $reduce: {
                input: '$paiements',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.montant'] }
              }
            }
          },
          countEtudiants: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          commercial: '$_id',
          chiffreAffaire: 1,
          totalRecu: 1,
          reste: { $subtract: ['$chiffreAffaire', '$totalRecu'] },
          countEtudiants: 1
        }
      }
    ]);

    // Get commercial info for each result
    const results = await Promise.all(
      commerciauxStats.map(async (item) => {
        const commercial = await Commercial.findById(item.commercial)
          .select('nom email telephone actif estAdminInscription');
        return { 
          ...item, 
          commercialInfo: commercial || { nom: 'Commercial supprimé' }
        };
      })
    );

    // Include commercials with no students
    const allCommerciaux = await Commercial.find().select('nom email telephone actif estAdminInscription');
    const commerciauxWithStats = allCommerciaux.map(commercial => {
      const existingStat = results.find(r => r.commercial.toString() === commercial._id.toString());
      if (existingStat) {
        return existingStat;
      } else {
        return {
          commercial: commercial._id,
          chiffreAffaire: 0,
          totalRecu: 0,
          reste: 0,
          countEtudiants: 0,
          commercialInfo: commercial
        };
      }
    });

    // Optional: Add statistics for students without commercials
    const studentsWithoutCommercial = await Etudiant.countDocuments({ 
      $or: [
        { commercial: null }, 
        { commercial: { $exists: false } }
      ] 
    });

    if (studentsWithoutCommercial > 0) {
      const orphanedStudentsStats = await Etudiant.aggregate([
        { 
          $match: { 
            $or: [
              { commercial: null }, 
              { commercial: { $exists: false } }
            ] 
          } 
        },
        {
          $lookup: {
            from: 'paiements',
            localField: '_id',
            foreignField: 'etudiant',
            as: 'paiements'
          }
        },
        {
          $group: {
            _id: null,
            chiffreAffaire: { $sum: '$prixTotal' },
            totalRecu: { 
              $sum: { 
                $reduce: {
                  input: '$paiements',
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.montant'] }
                }
              }
            },
            countEtudiants: { $sum: 1 }
          }
        }
      ]);

      if (orphanedStudentsStats.length > 0) {
        const orphanStat = orphanedStudentsStats[0];
        commerciauxWithStats.push({
          commercial: null,
          chiffreAffaire: orphanStat.chiffreAffaire,
          totalRecu: orphanStat.totalRecu,
          reste: orphanStat.chiffreAffaire - orphanStat.totalRecu,
          countEtudiants: orphanStat.countEtudiants,
          commercialInfo: { 
            nom: '🔸 Étudiants sans commercial',
            email: '',
            telephone: '',
            actif: true
          }
        });
      }
    }

    res.json(commerciauxWithStats);
  } catch (err) {
    console.error('Erreur statistiques commerciaux:', err);
    res.status(500).json({
      message: 'Erreur lors du calcul des statistiques',
      error: err.message
    });
  }
});

// ✅ Toggle commercial active status
app.patch('/api/commerciaux/:id/actif', authAdmin, async (req, res) => {
  try {
    const commercial = await Commercial.findById(req.params.id);
    if (!commercial) {
      return res.status(404).json({ message: 'Commercial non trouvé' });
    }

    commercial.actif = !commercial.actif;
    await commercial.save();

    // Remove password from response
    const commercialResponse = commercial.toObject();
    delete commercialResponse.motDePasse;

    res.json({ 
      message: `✅ Statut modifié: ${commercial.actif ? 'Actif' : 'Inactif'}`, 
      commercial: commercialResponse 
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// ===== ROUTES SPÉCIFIQUES POUR LE DASHBOARD PÉDAGOGIQUE =====

// ✅ Get statistics for commercials
app.get('/api/commerciaux/statistiques', authAdmin, async (req, res) => {
  try {
    const commerciauxStats = await Etudiant.aggregate([
      { $match: { commercial: { $ne: null } } },
      {
        $lookup: {
          from: 'paiements', // Make sure this matches your payments collection name
          localField: '_id',
          foreignField: 'etudiant',
          as: 'paiements'
        }
      },
      {
        $group: {
          _id: '$commercial',
          chiffreAffaire: { $sum: '$prixTotal' },
          totalRecu: { 
            $sum: { 
              $reduce: {
                input: '$paiements',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.montant'] }
              }
            }
          },
          countEtudiants: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          commercial: '$_id',
          chiffreAffaire: 1,
          totalRecu: 1,
          reste: { $subtract: ['$chiffreAffaire', '$totalRecu'] },
          countEtudiants: 1
        }
      }
    ]);

    // Get commercial info for each result
    const results = await Promise.all(
      commerciauxStats.map(async (item) => {
        const commercial = await Commercial.findById(item.commercial)
          .select('nom email telephone actif estAdminInscription');
        return { 
          ...item, 
          commercialInfo: commercial || { nom: 'Commercial supprimé' }
        };
      })
    );

    // Also include commercials with no students
    const allCommerciaux = await Commercial.find().select('nom email telephone actif estAdminInscription');
    const commerciauxWithStats = allCommerciaux.map(commercial => {
      const existingStat = results.find(r => r.commercial.toString() === commercial._id.toString());
      if (existingStat) {
        return existingStat;
      } else {
        return {
          commercial: commercial._id,
          chiffreAffaire: 0,
          totalRecu: 0,
          reste: 0,
          countEtudiants: 0,
          commercialInfo: commercial
        };
      }
    });

    res.json(commerciauxWithStats);
  } catch (err) {
    console.error('Erreur statistiques commerciaux:', err);
    res.status(500).json({
      message: 'Erreur lors du calcul des statistiques',
      error: err.message
    });
  }
});
// PUT modifier une activité (admin uniquement)
app.put('/api/vie-scolaire/:id', authAdmin, uploadVieScolaire.array('images', 10), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: 'ID d\'activité invalide',
        success: false
      });
    }
    
    const {
      title,
      date,
      time,
      category,
      description,
      fullDescription,
      participants,
      lieu,
      organisateur,
      materiel,
      year,
      cycle,
      keepExistingImages
    } = req.body;
    
    const existingActivity = await Activity.findById(req.params.id);
    if (!existingActivity) {
      return res.status(404).json({
        error: 'Activité non trouvée',
        success: false
      });
    }
    
    // Traitement des nouvelles images
    const newImages = req.files ? req.files.map(file => `/uploads/vieScolaire/${file.filename}`) : [];
    
    // Gestion des images existantes
    let finalImages = [];
    if (keepExistingImages === 'true') {
      finalImages = [...existingActivity.images, ...newImages];
    } else {
      finalImages = newImages.length > 0 ? newImages : existingActivity.images;
    }
    
    // Données à mettre à jour
    const updateData = {
      title: title?.trim() || existingActivity.title,
      date: date ? new Date(date) : existingActivity.date,
      time: time?.trim() || existingActivity.time,
      category: category || existingActivity.category,
      description: description?.trim() || existingActivity.description,
      fullDescription: fullDescription?.trim() || existingActivity.fullDescription,
      participants: participants ? parseInt(participants) : existingActivity.participants,
      lieu: lieu?.trim() || existingActivity.lieu,
      organisateur: organisateur?.trim() || existingActivity.organisateur,
      materiel: materiel?.trim() || existingActivity.materiel,
      images: finalImages,
      year: year || existingActivity.year,
      cycle: cycle || existingActivity.cycle
    };
    
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      data: updatedActivity,
      message: 'Activité mise à jour avec succès',
      success: true
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'activité:', error);
    
    // Supprimer les nouveaux fichiers uploadés en cas d'erreur
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Erreur lors de la suppression du fichier:', err);
        });
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Erreur de validation des données',
        details: error.message,
        success: false
      });
    }
    
    res.status(500).json({
      error: 'Erreur serveur lors de la mise à jour de l\'activité',
      success: false
    });
  }
});

// DELETE supprimer une activité (admin uniquement)
app.delete('/api/vie-scolaire/:id', authAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: 'ID d\'activité invalide',
        success: false
      });
    }
    
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        error: 'Activité non trouvée',
        success: false
      });
    }
    
    // Supprimer les images associées
    if (activity.images && activity.images.length > 0) {
      activity.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, 'public', imagePath);
        fs.unlink(fullPath, (err) => {
          if (err) console.error('Erreur lors de la suppression de l\'image:', err);
        });
      });
    }
    
    await Activity.findByIdAndDelete(req.params.id);
    
    res.json({
      message: 'Activité supprimée avec succès',
      success: true
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'activité:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la suppression de l\'activité',
      success: false
    });
  }
});

// DELETE supprimer une image spécifique d'une activité (admin uniquement)
app.delete('/api/vie-scolaire/:id/images/:imageIndex', authAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: 'ID d\'activité invalide',
        success: false
      });
    }
    
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        error: 'Activité non trouvée',
        success: false
      });
    }
    
    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex < 0 || imageIndex >= activity.images.length) {
      return res.status(400).json({
        error: 'Index d\'image invalide',
        success: false
      });
    }
    
    // Supprimer le fichier physique
    const imagePath = activity.images[imageIndex];
    const fullPath = path.join(__dirname, 'public', imagePath);
    fs.unlink(fullPath, (err) => {
      if (err) console.error('Erreur lors de la suppression de l\'image:', err);
    });
    
    // Retirer l'image du tableau
    activity.images.splice(imageIndex, 1);
    await activity.save();
    
    res.json({
      data: activity,
      message: 'Image supprimée avec succès',
      success: true
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la suppression de l\'image',
      success: false
    });
  }
});
app.get('/api/rappels', async (req, res) => {
  try {
    const rappels = await Rappel.find({ status: 'actif' })
      .populate('etudiant', 'nomComplet'); // نجلب فقط الاسم الكامل

    res.json(rappels); // نرسلها للـ frontend
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.delete('/api/rappels/:id', async (req, res) => {
  try {
    await Rappel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rappel supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route pour envoyer un message
app.post('/api/messages', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const { contenu, destinataireId, roleDestinataire } = req.body;

    if (!contenu || !destinataireId || !roleDestinataire) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const message = new Message({
      contenu,
      destinataire: destinataireId,
      expediteur: decoded.id,
      roleExpediteur: decoded.role === 'etudiant' ? 'Etudiant' : 'Professeur',
      roleDestinataire,
      date: new Date(),
      lu: false
    });

    // Ajouter les champs pour la filtration
    if (decoded.role === 'etudiant') {
      message.professeur = destinataireId;
      message.etudiant = decoded.id;
    } else if (decoded.role === 'prof') {
      message.professeur = decoded.id;
      message.etudiant = destinataireId;
    }

    const savedMessage = await message.save();
    
    // Populer les données pour la réponse
    await savedMessage.populate('expediteur', 'nom nomComplet email');
    await savedMessage.populate('destinataire', 'nom nomComplet email');

    res.status(201).json({ 
      message: 'Message envoyé avec succès', 
      data: savedMessage 
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour marquer tous les messages d'une conversation comme lus
app.patch('/api/messages/mark-conversation-read', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const { expediteurId } = req.body;

    if (!expediteurId) {
      return res.status(400).json({ message: 'ID de l\'expéditeur manquant' });
    }

    const role = decoded.role === 'etudiant' ? 'Etudiant' : 'Professeur';

    await Message.updateMany(
      {
        destinataire: decoded.id,
        roleDestinataire: role,
        expediteur: expediteurId,
        lu: { $ne: true }
      },
      {
        $set: {
          lu: true,
          dateLecture: new Date()
        }
      }
    );

    res.json({ message: 'Messages marqués comme lus' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir tous les messages pour un utilisateur
app.get('/api/messages', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const userId = decoded.id;
    const role = decoded.role === 'etudiant' ? 'Etudiant' : 'Professeur';

    const messages = await Message.find({
      $or: [
        { destinataire: userId, roleDestinataire: role },
        { expediteur: userId, roleExpediteur: role }
      ]
    })
    .sort({ date: -1 })
    .populate('expediteur', 'nom nomComplet email')
    .populate('destinataire', 'nom nomComplet email');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir les messages entre un professeur et un étudiant spécifique (pour le professeur)
app.get('/api/messages/professeur/:etudiantId', authProfesseur, async (req, res) => {
  try {
    const messages = await Message.find({
      professeur: req.professeurId,
      etudiant: req.params.etudiantId
    })
    .sort({ date: 1 })
    .populate('expediteur', 'nom nomComplet')
    .populate('destinataire', 'nom nomComplet');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir les messages entre un étudiant et un professeur spécifique (pour l'étudiant)
app.get('/api/messages/etudiant/:professeurId', authEtudiant, async (req, res) => {
  try {
    const messages = await Message.find({
      professeur: req.params.professeurId,
      etudiant: req.etudiantId
    })
    .sort({ date: 1 })
    .populate('expediteur', 'nom nomComplet')
    .populate('destinataire', 'nom nomComplet');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir les professeurs de l'étudiant
app.get('/api/etudiant/mes-professeurs', authEtudiant, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.etudiantId);
    const coursEtudiant = etudiant.cours;

    const professeurs = await Professeur.find({
      cours: { $in: coursEtudiant },
      actif: true
    }).select('_id nom cours image genre');

    res.json(professeurs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir les professeurs avec leurs derniers messages (pour l'étudiant)


// ✅ Route pour vérifier le statut en ligne des utilisateurs
app.get('/api/users/online-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    // Pour une vraie application, vous devriez implémenter un système de présence
    // Ici, on simule avec des utilisateurs aléatoires en ligne
    const onlineUsers = []; // Remplacez par votre logique de présence

    res.json({ onlineUsers });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ Route pour obtenir les informations de l'utilisateur actuel (étudiant)
app.get('/api/messages/notifications-etudiant', authEtudiant, async (req, res) => {
  try {
    const messages = await Message.find({
      destinataire: req.etudiantId,
      roleDestinataire: 'Etudiant',
      lu: false
    })
    .sort({ date: -1 })
    .limit(10)
    .populate({
      path: 'expediteur',
      select: 'nom nomComplet email image',
      model: 'Professeur'
    });

    res.json(messages);
  } catch (err) {
    console.error('Erreur chargement notifications messages:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.get('/api/notifications', authAdminOrPaiementManager, async (req, res) => {
  try {
    const notifications = [];
    const aujourdHui = new Date();

    // 1. Traitement des paiements expirés et nouveaux
    const etudiants = await Etudiant.find({ actif: true })
    const paiements = await Paiement.find().populate('etudiant', 'nomComplet actif image telephone email').lean();

    for (const etudiant of etudiants) {
      if (!etudiant.cours || etudiant.cours.length === 0) continue;

      for (const nomCours of etudiant.cours) {
        // Filtrer et trier les paiements pour cet étudiant et ce cours
        const paiementsCours = paiements
          .filter(p => 
            p.etudiant?._id.toString() === etudiant._id.toString() && 
            p.cours.includes(nomCours)
          )
          .sort((a, b) => new Date(a.moisDebut).getTime() - new Date(b.moisDebut).getTime());

        const prixTotal = etudiant.prixTotal || 0;
        const montantPaye = paiementsCours.reduce((acc, p) => acc + (p.montant || 0), 0);
        const reste = Math.max(0, prixTotal - montantPaye);

        // Ignorer si paiement complet
        if (reste <= 0) continue;

        let derniereFin;
        let typeNotification = '';

        // Cas nouveau sans paiement
        if (paiementsCours.length === 0) {
          derniereFin = etudiant.dateInscription || etudiant.createdAt;
          typeNotification = 'payment_new';
        } else {
          // Fusionner les périodes de paiement
          const fusionnees = [];
          for (const paiement of paiementsCours) {
            const debut = new Date(paiement.moisDebut);
            const fin = new Date(debut);
            fin.setMonth(fin.getMonth() + (paiement.nombreMois || 1));

            if (fusionnees.length === 0) {
              fusionnees.push({ debut, fin });
            } else {
              const derniere = fusionnees[fusionnees.length - 1];
              const unJourApres = new Date(derniere.fin);
              unJourApres.setDate(unJourApres.getDate() + 1);

              if (debut <= unJourApres) {
                derniere.fin = fin > derniere.fin ? fin : derniere.fin;
              } else {
                fusionnees.push({ debut, fin });
              }
            }
          }
          derniereFin = fusionnees[fusionnees.length - 1].fin;
          typeNotification = derniereFin < aujourdHui ? 'payment_expired' : 'payment_active';
        }

        // Créer notification si nouveau ou expiré
        if (typeNotification === 'payment_new' || (typeNotification === 'payment_expired' && reste > 0)) {
          const joursExpires = Math.ceil((aujourdHui - derniereFin) / (1000 * 60 * 60 * 24));
          
          notifications.push({
            id: `payment_${typeNotification}_${etudiant._id}_${nomCours}`,
            type: typeNotification,
            title: typeNotification === 'payment_new' 
              ? 'Nouvel étudiant non payé' 
              : 'Paiement expiré',
            message: typeNotification === 'payment_new'
              ? `🆕 ${etudiant.nomComplet} inscrit à "${nomCours}" n'a encore effectué aucun paiement`
              : `💰 Paiement de ${etudiant.nomComplet} pour "${nomCours}" a expiré il y a ${joursExpires} jour(s)`,
            priority: typeNotification === 'payment_new' ? 'high' : 'urgent',
            timestamp: derniereFin,
            data: {
              etudiantId: etudiant._id,
              etudiantNom: etudiant.nomComplet,
              etudiantInfo: {
                telephone: etudiant.telephone,
                email: etudiant.email,
                image: etudiant.image
              },
              cours: nomCours,
              joursExpires,
              prixTotal,
              montantPaye,
              reste,
              derniereFin
            }
          });
        }
      }
    }

    // 2. Traitement des paiements qui expirent bientôt (7 jours ou moins)
    for (const etudiant of etudiants) {
      if (!etudiant.cours || etudiant.cours.length === 0) continue;

      for (const nomCours of etudiant.cours) {
        const paiementsCours = paiements
          .filter(p => 
            p.etudiant?._id.toString() === etudiant._id.toString() && 
            p.cours.includes(nomCours)
          )
          .sort((a, b) => new Date(a.moisDebut).getTime() - new Date(b.moisDebut).getTime());

        if (paiementsCours.length === 0) continue;

        // Fusionner les périodes
        const fusionnees = [];
        for (const paiement of paiementsCours) {
          const debut = new Date(paiement.moisDebut);
          const fin = new Date(debut);
          fin.setMonth(fin.getMonth() + (paiement.nombreMois || 1));

          if (fusionnees.length === 0) {
            fusionnees.push({ debut, fin });
          } else {
            const derniere = fusionnees[fusionnees.length - 1];
            const unJourApres = new Date(derniere.fin);
            unJourApres.setDate(unJourApres.getDate() + 1);

            if (debut <= unJourApres) {
              derniere.fin = fin > derniere.fin ? fin : derniere.fin;
            } else {
              fusionnees.push({ debut, fin });
            }
          }
        }

        const derniereFin = fusionnees[fusionnees.length - 1].fin;
        const joursRestants = Math.ceil((derniereFin - aujourdHui) / (1000 * 60 * 60 * 24));

        // Notification pour paiement expirant bientôt (entre 1 et 7 jours)
        if (joursRestants <= 7 && joursRestants > 0) {
          notifications.push({
            id: `payment_expiring_${etudiant._id}_${nomCours}`,
            type: 'payment_expiring',
            title: 'Paiement expirant bientôt',
            message: `⏳ Paiement de ${etudiant.nomComplet} pour "${nomCours}" expire dans ${joursRestants} jour(s)`,
            priority: joursRestants <= 3 ? 'high' : 'medium',
            timestamp: derniereFin,
            data: {
              etudiantId: etudiant._id,
              etudiantNom: etudiant.nomComplet,
              etudiantInfo: {
                telephone: etudiant.telephone,
                email: etudiant.email,
                image: etudiant.image
              },
              cours: nomCours,
              joursRestants,
              dateExpiration: derniereFin
            }
          });
        }
      }
    }

    // 3. Traitement des absences
    const SEUILS_ABSENCE = { NORMAL: 10, URGENT: 15, CRITIQUE: 20 };
    for (const etudiant of etudiants) {
      const absences = await Presence.find({
        etudiant: etudiant._id,
        present: false,
      }).lean();

      const nombreAbsences = absences.length;
      const notificationSupprimee = await NotificationSupprimee.findOne({
        key: `absence_${etudiant._id}`,
        type: 'absence_frequent',
      }).lean();

      let doitCreerNotification = false;
      let priorite = 'medium';
      let titre = '';
      let message = '';

      if (nombreAbsences >= SEUILS_ABSENCE.CRITIQUE) {
        priorite = 'urgent';
        titre = 'CRITIQUE: Absences excessives';
        message = `${etudiant.nomComplet} a ${nombreAbsences} absences (seuil critique: ${SEUILS_ABSENCE.CRITIQUE})`;
        doitCreerNotification = !notificationSupprimee || notificationSupprimee.nombreAbsencesAuMomentSuppression < nombreAbsences;
      } else if (nombreAbsences >= SEUILS_ABSENCE.URGENT) {
        priorite = 'high';
        titre = 'URGENT: Absences répétées';
        message = `${etudiant.nomComplet} a ${nombreAbsences} absences (seuil urgent: ${SEUILS_ABSENCE.URGENT})`;
        doitCreerNotification = !notificationSupprimee || notificationSupprimee.nombreAbsencesAuMomentSuppression < nombreAbsences;
      } else if (nombreAbsences >= SEUILS_ABSENCE.NORMAL) {
        priorite = 'medium';
        titre = 'Attention: Absences multiples';
        message = `${etudiant.nomComplet} a ${nombreAbsences} absences (seuil normal: ${SEUILS_ABSENCE.NORMAL})`;
        doitCreerNotification = !notificationSupprimee || notificationSupprimee.nombreAbsencesAuMomentSuppression < nombreAbsences;
      }

      if (doitCreerNotification) {
        const absencesParCours = {};
        for (const absence of absences) {
          absencesParCours[absence.cours] = (absencesParCours[absence.cours] || 0) + 1;
        }

        notifications.push({
          id: `absence_frequent_${etudiant._id}_${nombreAbsences}`,
          type: 'absence_frequent',
          title: titre,
          message: message,
          priority: priorite,
          timestamp: new Date(),
          data: {
            etudiantId: etudiant._id,
            etudiantNom: etudiant.nomComplet,
            nombreAbsences,
            seuil: priorite.toLowerCase(),
            absencesParCours,
            derniereAbsence: absences.length > 0 ? absences[absences.length - 1].dateSession : null,
          },
        });
      }
    }

    // 4. Traitement des événements à venir
    const dans7jours = new Date();
    dans7jours.setDate(dans7jours.getDate() + 7);
    const evenements = await Evenement.find({
      dateDebut: { $gte: aujourdHui, $lte: dans7jours },
    }).sort({ dateDebut: 1 }).lean();

    for (const evenement of evenements) {
      const joursRestants = Math.ceil((new Date(evenement.dateDebut) - aujourdHui) / (1000 * 60 * 60 * 24));
      let priorite = 'medium';
      if (joursRestants === 0) priorite = 'urgent';
      else if (joursRestants === 1) priorite = 'high';

      notifications.push({
        id: `event_upcoming_${evenement._id}`,
        type: 'event_upcoming',
        title: `${evenement.type} programmé`,
        message: joursRestants === 0
          ? `${evenement.titre} prévu aujourd'hui`
          : `${evenement.titre} prévu dans ${joursRestants} jour(s)`,
        priority: priorite,
        timestamp: evenement.dateDebut,
        data: {
          evenementId: evenement._id,
          titre: evenement.titre,
          type: evenement.type,
          dateDebut: evenement.dateDebut,
          joursRestants,
        },
      });
    }

    // Tri final par priorité et date
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    res.json({
      notifications,
      total: notifications.length,
      urgent: notifications.filter(n => n.priority === 'urgent').length,
      high: notifications.filter(n => n.priority === 'high').length,
      medium: notifications.filter(n => n.priority === 'medium').length,
    });
  } catch (err) {
    console.error('❌ Erreur notifications:', err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/messages/notifications-professeur', authProfesseur, async (req, res) => {
  try {
    const messages = await Message.find({
      destinataire: req.professeurId,
      roleDestinataire: 'Professeur',
      lu: false
    })
    .sort({ date: -1 })
    .limit(10)
    .populate({
      path: 'expediteur',
      select: 'nom nomComplet email',
      model: 'Etudiant'
    });

    res.json(messages);
  } catch (err) {
    console.error('Erreur notifications professeur:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route : GET /api/messages/notifications-etudiant
app.get('/notifications-etudiant', authEtudiant, async (req, res) => {
  try {
    const messages = await Message.find({
      etudiant: req.etudiantId,
      roleExpediteur: 'Professeur',
      lu: false
    })
    .populate('professeur', 'nom image')
    .sort({ date: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Exemple Express
// backend route

app.put('/update-profil', authAdmin, async (req, res) => {
  const { nom, email, ancienMotDePasse, nouveauMotDePasse } = req.body;

  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ message: 'Admin introuvable' });

    // Mise à jour du nom si fourni
    if (nom) {
      admin.nom = nom;
    }

    // Mise à jour de l'email si fourni
    if (email) {
      admin.email = email;
    }

    // Mise à jour du mot de passe si fourni
    if (ancienMotDePasse && nouveauMotDePasse) {
      const isMatch = await bcrypt.compare(ancienMotDePasse, admin.motDePasse);
      if (!isMatch) return res.status(401).json({ message: 'Ancien mot de passe incorrect' });

      const salt = await bcrypt.genSalt(10);
      admin.motDePasse = await bcrypt.hash(nouveauMotDePasse, salt);
    }

    await admin.save();
    res.json({ 
      message: 'Profil mis à jour avec succès',
      admin: {
        id: admin._id,
        nom: admin.nom,
        email: admin.email
      }
    });

  } catch (err) {
    console.error('Erreur update admin:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.get('/api/professeur/mes-etudiants-messages', authProfesseur, async (req, res) => {
  try {
    // 1. Récupérer les cours du professeur connecté
    const professeur = await Professeur.findById(req.professeurId).select('cours');
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur introuvable' });
    }

    // 2. Trouver les étudiants qui ont au moins un cours commun
    const etudiants = await Etudiant.find({
      cours: { $in: professeur.cours }
    }).select('_id nomComplet email image genre lastSeen cours');

    // 3. Récupérer les messages de ce professeur
    const messages = await Message.find({ professeur: req.professeurId }).sort({ date: -1 });

    // 4. Mapper le dernier message par étudiant
    const lastMessagesMap = new Map();
    for (const msg of messages) {
      const etuId = msg.etudiant.toString();
      if (!lastMessagesMap.has(etuId)) {
        lastMessagesMap.set(etuId, {
          contenu: msg.contenu,
          date: msg.date,
          roleExpediteur: msg.roleExpediteur,
          fichier: msg.fichier
        });
      }
    }

    // 5. Fusionner les données des étudiants avec leur dernier message
    const result = etudiants.map(etudiant => ({
      ...etudiant.toObject(),
      dernierMessage: lastMessagesMap.get(etudiant._id.toString()) || null
    }));

    res.json(result);
  } catch (err) {
    console.error('Erreur lors de la récupération des étudiants:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.post('/api/messages/upload-prof', authProfesseur, uploadMessageFile.single('fichier'), async (req, res) => {
  try {
    const { contenu, destinataireId, roleDestinataire } = req.body;

    const hasContenu = contenu && contenu.trim() !== '';
    const hasFile = !!req.file;

    if (!hasContenu && !hasFile) {
      return res.status(400).json({ message: 'يجب أن يحتوي الرسالة على نص أو ملف مرفق' });
    }

    const messageData = {
      expediteur: req.professeurId,
      roleExpediteur: 'Professeur',
      destinataire: destinataireId,
      roleDestinataire: 'Etudiant',
      professeur: req.professeurId,
      etudiant: destinataireId,
    };

    if (hasContenu) messageData.contenu = contenu.trim();
    if (hasFile) messageData.fichier = `/uploads/messages/${req.file.filename}`;

    const newMessage = new Message(messageData);
    await newMessage.save();

    res.status(201).json({
      message: 'تم إرسال الرسالة بنجاح',
      data: newMessage,
    });
  } catch (err) {
    console.error('خطأ أثناء إرسال الرسالة من الأستاذ:', err);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});
// ✅ Route pour obtenir les informations du professeur connecté
app.get('/api/professeur/me', authProfesseur, async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.professeurId).select('-motDePasse');
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }
    res.json(professeur);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// GET - Récupérer les étudiants du commercial connecté
app.get('/api/commercial/etudiants', authCommercial, async (req, res) => {
  try {
    const etudiants = await Etudiant.find({ commercial: req.commercialId });
    res.json(etudiants);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des étudiants' });
  }
});

// PUT - Modifier un étudiant du commercial
// ===== ROUTE POST - CRÉATION D'ÉTUDIANT PAR COMMERCIAL =====
app.post('/api/commercial/etudiants', authCommercial, uploadMultiple, async (req, res) => {
  try {
    const {
      prenom, nomDeFamille, genre, dateNaissance, telephone, email, motDePasse, cours,
      actif, commercial, cin, passeport, lieuNaissance, pays, niveau, niveauFormation,
      filiere, option, specialite, typeDiplome, diplomeAcces, specialiteDiplomeAcces,
      mention, lieuObtentionDiplome, serieBaccalaureat, anneeBaccalaureat,
      premiereAnneeInscription, sourceInscription, typePaiement, prixTotal,
      pourcentageBourse, situation, nouvelleInscription, paye, handicape,
      resident, fonctionnaire, mobilite, codeEtudiant, dateEtReglement,
      // Nouveaux champs pour le système de formation intelligent
      cycle, specialiteIngenieur, optionIngenieur, anneeScolaire,
      // Nouveaux champs pour LICENCE_PRO et MASTER_PRO
      specialiteLicencePro, optionLicencePro, specialiteMasterPro, optionMasterPro
    } = req.body;

    // Validation des champs obligatoires
    if (!prenom || !nomDeFamille || !telephone || !email || !motDePasse || !dateNaissance) {
      return res.status(400).json({
        message: 'Les champs prenom, nomDeFamille, telephone, email, motDePasse et dateNaissance sont obligatoires'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    // Validation du mot de passe
    if (motDePasse.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérification de l'unicité de l'email
    const existe = await Etudiant.findOne({ email });
    if (existe) return res.status(400).json({ message: 'Email déjà utilisé' });

    // Vérification de l'unicité du code étudiant
    if (codeEtudiant) {
      const codeExiste = await Etudiant.findOne({ codeEtudiant });
      if (codeExiste) return res.status(400).json({ message: 'Code étudiant déjà utilisé' });
    }

    // ===== VALIDATION DU SYSTÈME DE FORMATION INTELLIGENT =====
    
    // Définir les structures de formation
    const STRUCTURE_OPTIONS_INGENIEUR = {
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
    };

    const STRUCTURE_OPTIONS_LICENCE_PRO = {
      'Développement Informatique Full Stack': [
        'Développement Mobile',
        'Intelligence Artificielle et Data Analytics',
        'Développement JAVA JEE',
        'Développement Gaming et VR'
      ],
      'Réseaux et Cybersécurité': [
        'Administration des Systèmes et Cloud Computing'
      ]
    };

    const STRUCTURE_OPTIONS_MASTER_PRO = {
      'Cybersécurité et Transformation Digitale': [
        'Systèmes de communication et Data center',
        'Management des Systèmes d\'Information'
      ],
      'Génie Informatique et Innovation Technologique': [
        'Génie Logiciel',
        'Intelligence Artificielle et Data Science'
      ]
    };
    
    // Déterminer automatiquement le niveau et le cycle
    let niveauFinal = parseInt(niveau);
    let cycleFinal = cycle;
    
    // Auto-assignation du niveau pour LICENCE_PRO et MASTER_PRO
    if (filiere === 'LICENCE_PRO') {
      niveauFinal = 3;
    } else if (filiere === 'MASTER_PRO') {
      niveauFinal = 4;
    }
    
    // Auto-assignation du cycle pour CYCLE_INGENIEUR
    if (filiere === 'CYCLE_INGENIEUR' && niveauFinal) {
      if (niveauFinal >= 1 && niveauFinal <= 2) {
        cycleFinal = 'Classes Préparatoires Intégrées';
      } else if (niveauFinal >= 3 && niveauFinal <= 5) {
        cycleFinal = 'Cycle Ingénieur';
      }
    }

    // ===== VALIDATION SPÉCIFIQUE PAR TYPE DE FORMATION =====
    
    if (filiere === 'CYCLE_INGENIEUR') {
      // Validation formation d'ingénieur
      if (!cycleFinal) {
        return res.status(400).json({ 
          message: 'Le cycle est obligatoire pour la formation d\'ingénieur' 
        });
      }

      // Validation cohérence niveau/cycle
      if (niveauFinal >= 1 && niveauFinal <= 2 && cycleFinal !== 'Classes Préparatoires Intégrées') {
        return res.status(400).json({ 
          message: 'Les niveaux 1-2 doivent être en Classes Préparatoires Intégrées' 
        });
      }

      if (niveauFinal >= 3 && niveauFinal <= 5 && cycleFinal !== 'Cycle Ingénieur') {
        return res.status(400).json({ 
          message: 'Les niveaux 3-5 doivent être en Cycle Ingénieur' 
        });
      }

      // Validation spécialité d'ingénieur
      if (cycleFinal === 'Cycle Ingénieur' && niveauFinal >= 3 && !specialiteIngenieur) {
        return res.status(400).json({ 
          message: 'Une spécialité d\'ingénieur est obligatoire à partir de la 3ème année du Cycle Ingénieur' 
        });
      }

      // Validation option d'ingénieur
      if (cycleFinal === 'Cycle Ingénieur' && niveauFinal === 5 && !optionIngenieur) {
        return res.status(400).json({ 
          message: 'Une option d\'ingénieur est obligatoire en 5ème année du Cycle Ingénieur' 
        });
      }

      // Validation cohérence spécialité/option
      if (specialiteIngenieur && optionIngenieur) {
        if (!STRUCTURE_OPTIONS_INGENIEUR[specialiteIngenieur] || 
            !STRUCTURE_OPTIONS_INGENIEUR[specialiteIngenieur].includes(optionIngenieur)) {
          return res.status(400).json({ 
            message: 'Cette option n\'est pas disponible pour cette spécialité d\'ingénieur' 
          });
        }
      }

    } else if (filiere === 'LICENCE_PRO') {
      // Validation Licence Professionnelle
      if (!specialiteLicencePro) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour la Licence Professionnelle' 
        });
      }

      // Validation option si elle existe pour cette spécialité
      const optionsDisponibles = STRUCTURE_OPTIONS_LICENCE_PRO[specialiteLicencePro] || [];
      if (optionsDisponibles.length > 0 && !optionLicencePro) {
        return res.status(400).json({ 
          message: 'Une option est obligatoire pour cette spécialité de Licence Professionnelle' 
        });
      }

      if (optionLicencePro && !optionsDisponibles.includes(optionLicencePro)) {
        return res.status(400).json({ 
          message: 'Cette option n\'est pas disponible pour cette spécialité de Licence Professionnelle' 
        });
      }

    } else if (filiere === 'MASTER_PRO') {
      // Validation Master Professionnel
      if (!specialiteMasterPro) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour le Master Professionnel' 
        });
      }

      // Validation option si elle existe pour cette spécialité
      const optionsDisponibles = STRUCTURE_OPTIONS_MASTER_PRO[specialiteMasterPro] || [];
      if (optionsDisponibles.length > 0 && !optionMasterPro) {
        return res.status(400).json({ 
          message: 'Une option est obligatoire pour cette spécialité de Master Professionnel' 
        });
      }

      if (optionMasterPro && !optionsDisponibles.includes(optionMasterPro)) {
        return res.status(400).json({ 
          message: 'Cette option n\'est pas disponible pour cette spécialité de Master Professionnel' 
        });
      }

    } else if (filiere === 'MASI' || filiere === 'IRM') {
      // Validation anciennes formations
      if (niveauFinal >= 3 && !specialite) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire à partir de la 3ème année' 
        });
      }

      if (niveauFinal === 5 && !option) {
        return res.status(400).json({ 
          message: 'Une option est obligatoire en 5ème année' 
        });
      }

      // Validation cohérence filière/spécialité/option
      if (filiere && specialite) {
        const STRUCTURE_FORMATION = {
          MASI: {
            3: [
              'Entreprenariat, audit et finance',
              'Développement commercial et marketing digital'
            ],
            4: [
              'Management des affaires et systèmes d\'information'
            ],
            5: [
              'Management des affaires et systèmes d\'information'
            ]
          },
          IRM: {
            3: [
              'Développement informatique',
              'Réseaux et cybersécurité'
            ],
            4: [
              'Génie informatique et innovation technologique',
              'Cybersécurité et transformation digitale'
            ],
            5: [
              'Génie informatique et innovation technologique',
              'Cybersécurité et transformation digitale'
            ]
          }
        };

        const specialitesDisponibles = STRUCTURE_FORMATION[filiere]?.[niveauFinal] || [];
        if (!specialitesDisponibles.includes(specialite)) {
          return res.status(400).json({ 
            message: 'Cette spécialité n\'est pas disponible pour ce niveau et cette filière' 
          });
        }
      }
    }

    // ===== GESTION DES COURS AVEC LIMITE =====
    const MAX_ETUDIANTS = 20;
    let coursArray = [];

    if (cours) {
      const coursDemandes = Array.isArray(cours) ? cours : [cours];
      for (let coursNom of coursDemandes) {
        const suffixes = ['', ' A', ' B', ' C', ' D', ' E', ' F', ' G'];
        let nomAvecSuffixe = '';
        let coursTrouve = false;

        for (let suffix of suffixes) {
          nomAvecSuffixe = coursNom + suffix;

          let coursExiste = await Cours.findOne({ nom: nomAvecSuffixe });
          if (!coursExiste) {
            const coursOriginal = await Cours.findOne({ nom: coursNom });
            let professeurs = [];
            if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
              professeurs = coursOriginal.professeur;
            } else {
              const prof = await Professeur.findOne({ cours: coursNom });
              if (prof) professeurs = [prof.nom];
            }
            const nouveauCours = new Cours({
              nom: nomAvecSuffixe,
              professeur: professeurs,
              creePar: req.commercialId
            });
            await nouveauCours.save();
            for (const nomProf of professeurs) {
              await Professeur.updateOne(
                { nom: nomProf },
                { $addToSet: { cours: nomAvecSuffixe } }
              );
            }
            coursExiste = nouveauCours;
          }

          const count = await Etudiant.countDocuments({ cours: nomAvecSuffixe });
          if (count < MAX_ETUDIANTS) {
            coursArray.push(nomAvecSuffixe);
            coursTrouve = true;
            break;
          }
        }

        if (!coursTrouve) {
          const nextSuffix = ' ' + String.fromCharCode(65 + suffixes.length); // H
          const nomNouveau = `${coursNom}${nextSuffix}`;
          const coursOriginal = await Cours.findOne({ nom: coursNom });
          let professeurs = [];
          if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
            professeurs = coursOriginal.professeur;
          } else {
            const prof = await Professeur.findOne({ cours: coursNom });
            if (prof) professeurs = [prof.nom];
          }
          const nouveauCours = new Cours({
            nom: nomNouveau,
            professeur: professeurs,
            creePar: req.commercialId
          });
          await nouveauCours.save();
          for (const nomProf of professeurs) {
            await Professeur.updateOne(
              { nom: nomProf },
              { $addToSet: { cours: nomNouveau } }
            );
          }
          coursArray.push(nomNouveau);
        }
      }
    }

    // ===== TRAITEMENT DES FICHIERS =====
    
    // Fonction pour traiter les chemins des fichiers
    const getFilePath = (fileField) => {
      return req.files && req.files[fileField] && req.files[fileField][0] 
        ? `/uploads/${req.files[fileField][0].filename}` 
        : '';
    };

    // Récupération des chemins de tous les fichiers
    const imagePath = getFilePath('image');
    const fichierInscritPath = getFilePath('fichierInscrit');
    const originalBacPath = getFilePath('originalBac');
    const releveNotesPath = getFilePath('releveNotes');
    const copieCniPath = getFilePath('copieCni');
    const fichierPassportPath = getFilePath('fichierPassport');
    const dtsBac2Path = getFilePath('dtsBac2');
    const licencePath = getFilePath('licence');
    
    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Fonctions utilitaires pour la conversion des données
    const toDate = (d) => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    };

    const toBool = (v) => v === 'true' || v === true;
    
    const toNumber = (v) => {
      if (!v || v === '') return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };

    // Conversion des dates
    const dateNaissanceFormatted = toDate(dateNaissance);
    const dateEtReglementFormatted = toDate(dateEtReglement);

    // Conversion des booléens
    const boolFields = ['actif', 'paye', 'handicape', 'resident', 'fonctionnaire', 'mobilite', 'nouvelleInscription'];
    boolFields.forEach(field => {
      if (req.body[field] !== undefined) req.body[field] = toBool(req.body[field]);
    });

    // Conversion des nombres
    const prixTotalNum = toNumber(prixTotal);
    const pourcentageBourseNum = toNumber(pourcentageBourse);
    const anneeBacNum = toNumber(anneeBaccalaureat);
    const premiereInscriptionNum = toNumber(premiereAnneeInscription);

    // Validation du pourcentage de bourse
    if (pourcentageBourseNum && (pourcentageBourseNum < 0 || pourcentageBourseNum > 100)) {
      return res.status(400).json({ message: 'Le pourcentage de bourse doit être entre 0 et 100' });
    }

    // ===== CRÉATION DE L'ÉTUDIANT =====
    const etudiantData = {
      prenom: prenom.trim(),
      nomDeFamille: nomDeFamille.trim(),
      genre,
      dateNaissance: dateNaissanceFormatted,
      telephone: telephone.trim(),
      email: email.toLowerCase().trim(),
      motDePasse: hashedPassword,
      cin: cin?.trim() || '',
      passeport: passeport?.trim() || '',
      lieuNaissance: lieuNaissance?.trim() || '',
      pays: pays?.trim() || '',
      niveau: niveauFinal,
      niveauFormation: niveauFormation?.trim() || '',
      filiere: filiere?.trim() || '',
      typeDiplome: typeDiplome?.trim() || '',
      diplomeAcces: diplomeAcces?.trim() || '',
      specialiteDiplomeAcces: specialiteDiplomeAcces?.trim() || '',
      mention: mention?.trim() || '',
      lieuObtentionDiplome: lieuObtentionDiplome?.trim() || '',
      serieBaccalaureat: serieBaccalaureat?.trim() || '',
      anneeBaccalaureat: anneeBacNum,
      premiereAnneeInscription: premiereInscriptionNum,
      sourceInscription: sourceInscription?.trim() || '',
      typePaiement: typePaiement?.trim() || '',
      prixTotal: prixTotalNum,
      pourcentageBourse: pourcentageBourseNum,
      situation: situation?.trim() || '',
      codeEtudiant: codeEtudiant?.trim() || '',
      dateEtReglement: dateEtReglementFormatted,
      cours: coursArray,
      
      // Tous les fichiers
      image: imagePath,
      fichierInscrit: fichierInscritPath,
      originalBac: originalBacPath,
      releveNotes: releveNotesPath,
      copieCni: copieCniPath,
      passport: fichierPassportPath,
      dtsBac2: dtsBac2Path,
      licence: licencePath,
      
      // Champs booléens
      actif: req.body.actif,
      paye: req.body.paye,
      handicape: req.body.handicape,
      resident: req.body.resident,
      fonctionnaire: req.body.fonctionnaire,
      mobilite: req.body.mobilite,
      nouvelleInscription: req.body.nouvelleInscription,
      
      // Lier au commercial au lieu d'admin
      commercial: req.commercialId,
      creeParAdmin: null,
      
      // Année scolaire
      anneeScolaire: anneeScolaire || undefined,

      // Déterminer le type de formation basé sur la filière
      typeFormation: filiere
    };

    // Ajouter les champs spécifiques selon le type de formation
    if (filiere === 'CYCLE_INGENIEUR') {
      // Formation d'ingénieur
      etudiantData.cycle = cycleFinal;
      etudiantData.specialiteIngenieur = specialiteIngenieur?.trim() || undefined;
      etudiantData.optionIngenieur = optionIngenieur?.trim() || undefined;
      // Laisser les anciens champs vides
      etudiantData.specialite = '';
      etudiantData.option = '';
      etudiantData.specialiteLicencePro = undefined;
      etudiantData.optionLicencePro = undefined;
      etudiantData.specialiteMasterPro = undefined;
      etudiantData.optionMasterPro = undefined;
      
    } else if (filiere === 'LICENCE_PRO') {
      // Licence Professionnelle
      etudiantData.specialiteLicencePro = specialiteLicencePro?.trim() || '';
      etudiantData.optionLicencePro = optionLicencePro?.trim() || '';
      // Laisser les autres champs vides/undefined
      etudiantData.cycle = undefined;
      etudiantData.specialiteIngenieur = undefined;
      etudiantData.optionIngenieur = undefined;
      etudiantData.specialite = '';
      etudiantData.option = '';
      etudiantData.specialiteMasterPro = undefined;
      etudiantData.optionMasterPro = undefined;
      
    } else if (filiere === 'MASTER_PRO') {
      // Master Professionnel
      etudiantData.specialiteMasterPro = specialiteMasterPro?.trim() || '';
      etudiantData.optionMasterPro = optionMasterPro?.trim() || '';
      // Laisser les autres champs vides/undefined
      etudiantData.cycle = undefined;
      etudiantData.specialiteIngenieur = undefined;
      etudiantData.optionIngenieur = undefined;
      etudiantData.specialite = '';
      etudiantData.option = '';
      etudiantData.specialiteLicencePro = undefined;
      etudiantData.optionLicencePro = undefined;
      
    } else {
      // Anciennes formations (MASI, IRM)
      etudiantData.specialite = specialite?.trim() || '';
      etudiantData.option = option?.trim() || '';
      // Laisser les nouveaux champs undefined
      etudiantData.cycle = undefined;
      etudiantData.specialiteIngenieur = undefined;
      etudiantData.optionIngenieur = undefined;
      etudiantData.specialiteLicencePro = undefined;
      etudiantData.optionLicencePro = undefined;
      etudiantData.specialiteMasterPro = undefined;
      etudiantData.optionMasterPro = undefined;
    }

    const etudiant = new Etudiant(etudiantData);
    const etudiantSauve = await etudiant.save();
    
    // Préparer la réponse sans le mot de passe
    const etudiantResponse = etudiantSauve.toObject();
    delete etudiantResponse.motDePasse;

    res.status(201).json(etudiantResponse);

  } catch (err) {
    console.error('❌ Erreur ajout étudiant (commercial):', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} déjà utilisé par un autre étudiant` });
    }

    res.status(500).json({
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});






// ===== ROUTES PÉDAGOGIQUES CORRIGÉES - VERSION FINALE =====
// REMPLACEZ VOS ROUTES ACTUELLES PAR CELLES-CI

// 1. Route pour obtenir les étudiants





// Route pour marquer une séance en rattrapage
app.put('/api/pedagogique/seances/:id/rattrapage', authPedagogique, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`📝 Tentative marquage rattrapage: ${id} par user: ${userId}`);
    
    // Vérifier que la séance existe
    const seance = await Seance.findById(id);
    if (!seance) {
      console.log(`❌ Séance non trouvée: ${id}`);
      return res.status(404).json({ error: 'Séance non trouvée' });
    }
    
    console.log(`✅ Séance trouvée: ${seance.cours} - ${seance.jour} ${seance.heureDebut}`);
    
    // Vérifier permissions pour pédagogique spécifique
    if (req.user.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ 
        filiere: req.user.filiere,
        actif: true,
        cours: seance.cours
      });

      if (etudiants.length === 0) {
        console.log(`🚫 Permission refusée - Filière: ${req.user.filiere}, Cours: ${seance.cours}`);
        return res.status(403).json({
          error: `Vous n'avez pas l'autorisation de modifier cette séance`
        });
      }
    }
    
    // Marquer comme rattrapage
    seance.typeSeance = 'rattrapage';
    seance.modifieParPedagogique = userId;
    seance.notes = `Marquée en rattrapage le ${new Date().toLocaleString('fr-FR')} par ${req.user.nom || 'Pédagogique'}`;
    
    await seance.save();
    
    console.log(`✅ Séance marquée en rattrapage: ${id}`);
    
    res.json({ 
      ok: true, 
      message: 'Séance marquée en rattrapage',
      seance 
    });
    
  } catch (error) {
    console.error('❌ Erreur marquer rattrapage:', error);
    res.status(500).json({ error: 'Erreur serveur lors du marquage rattrapage' });
  }
});

// Route pour obtenir les statistiques de rattrapages (VERSION AMÉLIORÉE)
app.get('/api/pedagogique/rattrapages/statistiques', authPedagogique, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userInfo = await Pedagogique.findById(userId);
    if (!userInfo) {
      return res.status(404).json({ error: 'Utilisateur pédagogique non trouvé' });
    }
    
    let pipeline = [];
    
    // Filtrer par filière si pas pédagogique général
    if (userInfo.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ 
        filiere: userInfo.filiere,
        actif: true 
      });
      
      const coursDeFiliere = new Set();
      etudiants.forEach(etudiant => {
        if (etudiant.cours && Array.isArray(etudiant.cours)) {
          etudiant.cours.forEach(coursNom => {
            coursDeFiliere.add(coursNom);
          });
        }
      });
      
      const coursArray = Array.from(coursDeFiliere);
      
      pipeline.push({
        $match: {
          cours: { $in: coursArray }
        }
      });
    }
    
    // Pipeline amélioré avec plus de détails
    pipeline.push(
      {
        $lookup: {
          from: 'professeurs',
          localField: 'professeur',
          foreignField: '_id',
          as: 'prof'
        }
      },
      { $unwind: '$prof' },
      {
        $group: {
          _id: '$professeur',
          nomProfesseur: { $first: '$prof.nom' },
          totalSeances: { $sum: 1 },
          seancesNormales: {
            $sum: {
              $cond: [
                { $in: ['$typeSeance', ['reelle', 'exception']] },
                1,
                0
              ]
            }
          },
          seancesRattrapage: {
            $sum: {
              $cond: [
                { $eq: ['$typeSeance', 'rattrapage'] },
                1,
                0
              ]
            }
          },
          // NOUVEAU : Détails des rattrapages
          detailsRattrapages: {
            $push: {
              $cond: [
                { $eq: ['$typeSeance', 'rattrapage'] },
                {
                  cours: '$cours',
                  matiere: '$matiere',
                  salle: '$salle',
                  jour: '$jour',
                  heureDebut: '$heureDebut',
                  heureFin: '$heureFin',
                  dateSeance: '$dateSeance',
                  notes: '$notes'
                },
                null
              ]
            }
          }
        }
      },
      {
        $addFields: {
          detailsRattrapages: {
            $filter: {
              input: '$detailsRattrapages',
              cond: { $ne: ['$$this', null] }
            }
          }
        }
      },
      { $sort: { seancesRattrapage: -1, nomProfesseur: 1 } }
    );
    
    const stats = await Seance.aggregate(pipeline);
    
    console.log(`Stats calculées avec détails: ${stats.length} professeurs`);
    
    res.json({ ok: true, statistiques: stats, filiere: userInfo.filiere });
    
  } catch (error) {
    console.error('Erreur stats rattrapages:', error);
    res.status(500).json({ error: 'Erreur serveur lors du calcul des statistiques' });
  }
});















// ===== ROUTE PUT - MODIFICATION D'ÉTUDIANT PAR COMMERCIAL =====
// ===== ROUTE PUT - MODIFICATION D'ÉTUDIANT PAR COMMERCIAL (avec logique de copie) =====
app.put('/api/commercial/etudiants/:id', authCommercial, uploadMultiple, async (req, res) => {
  try {
    const {
      prenom, nomDeFamille, genre, dateNaissance, telephone, email, motDePasse, cours,
      actif, cin, passeport, lieuNaissance, pays, niveau, niveauFormation,
      filiere, option, specialite, typeDiplome, diplomeAcces, specialiteDiplomeAcces,
      mention, lieuObtentionDiplome, serieBaccalaureat, anneeBaccalaureat,
      premiereAnneeInscription, sourceInscription, typePaiement, prixTotal,
      pourcentageBourse, situation, nouvelleInscription, paye, handicape,
      resident, fonctionnaire, mobilite, codeEtudiant, dateEtReglement,
      typeFormation, cycle, specialiteIngenieur, optionIngenieur, anneeScolaire,
      specialiteLicencePro, optionLicencePro, specialiteMasterPro, optionMasterPro
    } = req.body;

    // 1. RECHERCHER L'ETUDIANT EXISTANT (verification d'autorisation)
    const etudiantExistant = await Etudiant.findOne({ 
      _id: req.params.id, 
      commercial: req.commercialId 
    });
    
    if (!etudiantExistant) {
      return res.status(404).json({ 
        message: 'Étudiant non trouvé ou vous n\'êtes pas autorisé à le modifier' 
      });
    }

    console.log(`📋 Étudiant trouvé: ${etudiantExistant.prenom} ${etudiantExistant.nomDeFamille}`);
    console.log(`📋 Données reçues - Niveau: "${niveau}", Filière: "${filiere}"`);
    console.log(`📋 Spécialité reçue: "${specialiteIngenieur}", Option reçue: "${optionIngenieur}"`);

    // 2. DETECTER SI C'EST UNE NOUVELLE ANNEE SCOLAIRE
    const estNouvelleAnneeScolaire = anneeScolaire && 
                                    anneeScolaire.trim() !== '' && 
                                    anneeScolaire !== etudiantExistant.anneeScolaire;

    if (estNouvelleAnneeScolaire) {
      console.log(`🆕 NOUVELLE ANNÉE SCOLAIRE DÉTECTÉE: ${etudiantExistant.anneeScolaire} → ${anneeScolaire}`);
      
      // DETERMINATION AUTOMATIQUE DU TYPE DE FORMATION
      let typeFormationFinal;
      if (filiere) {
        const mappingFiliere = {
          'CYCLE_INGENIEUR': 'CYCLE_INGENIEUR',
          'MASI': 'MASI',
          'IRM': 'IRM',
          'LICENCE_PRO': 'LICENCE_PRO',
          'MASTER_PRO': 'MASTER_PRO'
        };
        typeFormationFinal = mappingFiliere[filiere];
      } else {
        typeFormationFinal = typeFormation || etudiantExistant.typeFormation;
      }

      // AUTO-ASSIGNATION DU NIVEAU
      let niveauFinal = parseInt(niveau) || null;
      
      // Auto-assignation du niveau selon le type de formation
      if (typeFormationFinal === 'LICENCE_PRO') {
        niveauFinal = 3; // Licence Pro = toujours niveau 3
      } else if (typeFormationFinal === 'MASTER_PRO') {
        niveauFinal = 4; // Master Pro = toujours niveau 4
      }

      // VALIDATION SELON LE TYPE DE FORMATION
      
      if (typeFormationFinal === 'CYCLE_INGENIEUR') {
        // Validation pour formation d'ingénieur
        if (!niveauFinal || niveauFinal < 1 || niveauFinal > 5) {
          return res.status(400).json({ 
            message: 'Le niveau doit être entre 1 et 5 pour la formation d\'ingénieur' 
          });
        }

        let cycleCalcule = cycle;
        if (niveauFinal >= 1 && niveauFinal <= 2) {
          cycleCalcule = 'Classes Préparatoires Intégrées';
        } else if (niveauFinal >= 3 && niveauFinal <= 5) {
          cycleCalcule = 'Cycle Ingénieur';
        }

        if (niveauFinal >= 1 && niveauFinal <= 2) {
          if (specialiteIngenieur || optionIngenieur) {
            return res.status(400).json({ 
              message: 'Pas de spécialité ou option d\'ingénieur en Classes Préparatoires' 
            });
          }
        }

        if (niveauFinal >= 3 && niveauFinal <= 5) {
          if (!specialiteIngenieur) {
            return res.status(400).json({ 
              message: 'Une spécialité d\'ingénieur est obligatoire à partir de la 3ème année' 
            });
          }
          if (niveauFinal === 5 && !optionIngenieur) {
            return res.status(400).json({ 
              message: 'Une option d\'ingénieur est obligatoire en 5ème année' 
            });
          }
        }

        if (specialiteIngenieur && optionIngenieur) {
          const STRUCTURE_OPTIONS_INGENIEUR = {
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
          };

          if (!STRUCTURE_OPTIONS_INGENIEUR[specialiteIngenieur] || 
              !STRUCTURE_OPTIONS_INGENIEUR[specialiteIngenieur].includes(optionIngenieur)) {
            return res.status(400).json({ 
              message: `L'option "${optionIngenieur}" n'est pas disponible pour la spécialité "${specialiteIngenieur}"` 
            });
          }
        }

        if (specialiteLicencePro || optionLicencePro || specialiteMasterPro || optionMasterPro) {
          return res.status(400).json({ 
            message: 'Les champs Licence Pro et Master Pro ne sont pas disponibles pour CYCLE_INGENIEUR' 
          });
        }

      } else if (typeFormationFinal === 'LICENCE_PRO') {
        // VALIDATION POUR LICENCE PRO (NIVEAU AUTO-ASSIGNE A 3)
        
        if (!specialiteLicencePro) {
          return res.status(400).json({ 
            message: 'Une spécialité est obligatoire pour Licence Professionnelle' 
          });
        }

        if (optionLicencePro) {
          const OPTIONS_LICENCE_PRO = {
            'Développement Informatique Full Stack': [
              'Développement Mobile',
              'Intelligence Artificielle et Data Analytics',
              'Développement JAVA JEE',
              'Développement Gaming et VR'
            ],
            'Réseaux et Cybersécurité': [
              'Administration des Systèmes et Cloud Computing'
            ]
          };

          const optionsDisponibles = OPTIONS_LICENCE_PRO[specialiteLicencePro];
          if (!optionsDisponibles || !optionsDisponibles.includes(optionLicencePro)) {
            return res.status(400).json({ 
              message: `L'option "${optionLicencePro}" n'est pas disponible pour la spécialité "${specialiteLicencePro}"` 
            });
          }
        }

        const specialitesAvecOptions = [
          'Développement Informatique Full Stack',
          'Réseaux et Cybersécurité'
        ];

        if (optionLicencePro && !specialitesAvecOptions.includes(specialiteLicencePro)) {
          return res.status(400).json({ 
            message: `La spécialité "${specialiteLicencePro}" ne propose pas d'options` 
          });
        }

        if (cycle || specialiteIngenieur || optionIngenieur || specialiteMasterPro || optionMasterPro) {
          return res.status(400).json({ 
            message: 'Les champs Cycle Ingénieur et Master Pro ne sont pas disponibles pour LICENCE_PRO' 
          });
        }

      } else if (typeFormationFinal === 'MASTER_PRO') {
        // VALIDATION POUR MASTER PRO (NIVEAU AUTO-ASSIGNE A 4)
        
        if (!specialiteMasterPro) {
          return res.status(400).json({ 
            message: 'Une spécialité est obligatoire pour Master Professionnel' 
          });
        }

        if (optionMasterPro) {
          const OPTIONS_MASTER_PRO = {
            'Cybersécurité et Transformation Digitale': [
              'Systèmes de communication et Data center',
              'Management des Systèmes d\'Information'
            ],
            'Génie Informatique et Innovation Technologique': [
              'Génie Logiciel',
              'Intelligence Artificielle et Data Science'
            ]
          };

          const optionsDisponibles = OPTIONS_MASTER_PRO[specialiteMasterPro];
          if (!optionsDisponibles || !optionsDisponibles.includes(optionMasterPro)) {
            return res.status(400).json({ 
              message: `L'option "${optionMasterPro}" n'est pas disponible pour la spécialité "${specialiteMasterPro}"` 
            });
          }
        }

        const specialitesAvecOptions = [
          'Cybersécurité et Transformation Digitale',
          'Génie Informatique et Innovation Technologique'
        ];

        if (optionMasterPro && !specialitesAvecOptions.includes(specialiteMasterPro)) {
          return res.status(400).json({ 
            message: `La spécialité "${specialiteMasterPro}" ne propose pas d'options` 
          });
        }

        if (cycle || specialiteIngenieur || optionIngenieur || specialiteLicencePro || optionLicencePro) {
          return res.status(400).json({ 
            message: 'Les champs Cycle Ingénieur et Licence Pro ne sont pas disponibles pour MASTER_PRO' 
          });
        }

      } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
        // VALIDATION POUR LES ANCIENNES FORMATIONS (MASI, IRM)
        
        if (!niveauFinal) {
          return res.status(400).json({ 
            message: `Le niveau est obligatoire pour ${typeFormationFinal}` 
          });
        }
        
        if (niveauFinal >= 3 && !specialite) {
          return res.status(400).json({ 
            message: `Une spécialité est obligatoire à partir de la 3ème année pour ${typeFormationFinal}` 
          });
        }

        if (niveauFinal === 5 && !option) {
          return res.status(400).json({ 
            message: `Une option est obligatoire en 5ème année pour ${typeFormationFinal}` 
          });
        }

        if (specialite) {
          const STRUCTURE_FORMATION = {
            MASI: {
              3: ['Entreprenariat, audit et finance', 'Développement commercial et marketing digital'],
              4: ['Management des affaires et systèmes d\'information'],
              5: ['Management des affaires et systèmes d\'information']
            },
            IRM: {
              3: ['Développement informatique', 'Réseaux et cybersécurité'],
              4: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale'],
              5: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale']
            }
          };

          const specialitesDisponibles = STRUCTURE_FORMATION[typeFormationFinal]?.[niveauFinal] || [];
          if (specialitesDisponibles.length > 0 && !specialitesDisponibles.includes(specialite)) {
            return res.status(400).json({ 
              message: `La spécialité "${specialite}" n'est pas disponible pour ${typeFormationFinal} niveau ${niveauFinal}` 
            });
          }
        }

        if (cycle || specialiteIngenieur || optionIngenieur || specialiteLicencePro || optionLicencePro || specialiteMasterPro || optionMasterPro) {
          return res.status(400).json({ 
            message: 'Les champs Cycle Ingénieur, Licence Pro et Master Pro ne sont pas disponibles pour les formations MASI/IRM' 
          });
        }
      }

      // GESTION DES COURS AVEC LIMITE
      const MAX_ETUDIANTS = 20;
      let coursArray = [];

      if (cours) {
        const coursDemandes = Array.isArray(cours) ? cours : [cours];
        for (let coursNom of coursDemandes) {
          const suffixes = ['', ' A', ' B', ' C', ' D', ' E', ' F', ' G'];
          let nomAvecSuffixe = '';
          let coursTrouve = false;

          for (let suffix of suffixes) {
            nomAvecSuffixe = coursNom + suffix;

            let coursExiste = await Cours.findOne({ nom: nomAvecSuffixe });
            if (!coursExiste) {
              const coursOriginal = await Cours.findOne({ nom: coursNom });
              let professeurs = [];
              if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
                professeurs = coursOriginal.professeur;
              } else {
                const prof = await Professeur.findOne({ cours: coursNom });
                if (prof) professeurs = [prof.nom];
              }
              const nouveauCours = new Cours({
                nom: nomAvecSuffixe,
                professeur: professeurs,
                creePar: req.commercialId
              });
              await nouveauCours.save();
              for (const nomProf of professeurs) {
                await Professeur.updateOne(
                  { nom: nomProf },
                  { $addToSet: { cours: nomAvecSuffixe } }
                );
              }
              coursExiste = nouveauCours;
            }

            const count = await Etudiant.countDocuments({ cours: nomAvecSuffixe });
            if (count < MAX_ETUDIANTS) {
              coursArray.push(nomAvecSuffixe);
              coursTrouve = true;
              break;
            }
          }

          if (!coursTrouve) {
            const nextSuffix = ' ' + String.fromCharCode(65 + suffixes.length);
            const nomNouveau = `${coursNom}${nextSuffix}`;
            const coursOriginal = await Cours.findOne({ nom: coursNom });
            let professeurs = [];
            if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
              professeurs = coursOriginal.professeur;
            } else {
              const prof = await Professeur.findOne({ cours: coursNom });
              if (prof) professeurs = [prof.nom];
            }
            const nouveauCours = new Cours({
              nom: nomNouveau,
              professeur: professeurs,
              creePar: req.commercialId
            });
            await nouveauCours.save();
            for (const nomProf of professeurs) {
              await Professeur.updateOne(
                { nom: nomProf },
                { $addToSet: { cours: nomNouveau } }
              );
            }
            coursArray.push(nomNouveau);
          }
        }
      }

      // TRAITEMENT DES FICHIERS
      const getFilePath = (fileField) => {
        return req.files && req.files[fileField] && req.files[fileField][0] 
          ? `/uploads/${req.files[fileField][0].filename}` 
          : '';
      };

      const imagePath = getFilePath('image');
      const fichierInscritPath = getFilePath('fichierInscrit');
      const originalBacPath = getFilePath('originalBac');
      const releveNotesPath = getFilePath('releveNotes');
      const copieCniPath = getFilePath('copieCni');
      const fichierPassportPath = getFilePath('fichierPassport');
      const dtsBac2Path = getFilePath('dtsBac2');
      const licencePath = getFilePath('licence');

      // Fonctions utilitaires
      const toDate = (d) => {
        if (!d) return null;
        const date = new Date(d);
        return isNaN(date.getTime()) ? null : date;
      };

      const toBool = (v) => v === 'true' || v === true;
      
      const toNumber = (v) => {
        if (!v || v === '') return null;
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      };

      const dateNaissanceFormatted = toDate(dateNaissance);
      const dateEtReglementFormatted = toDate(dateEtReglement);

      const boolFields = ['actif', 'paye', 'handicape', 'resident', 'fonctionnaire', 'mobilite', 'nouvelleInscription'];
      boolFields.forEach(field => {
        if (req.body[field] !== undefined) req.body[field] = toBool(req.body[field]);
      });

      const prixTotalNum = toNumber(prixTotal);
      const pourcentageBourseNum = toNumber(pourcentageBourse);
      const anneeBacNum = toNumber(anneeBaccalaureat);
      const premiereInscriptionNum = toNumber(premiereAnneeInscription);

      if (pourcentageBourseNum && (pourcentageBourseNum < 0 || pourcentageBourseNum > 100)) {
        return res.status(400).json({ message: 'Le pourcentage de bourse doit être entre 0 et 100' });
      }

      // CREER UNE COPIE POUR LA NOUVELLE ANNEE SCOLAIRE
      const donneesCopiees = {
        prenom: prenom?.trim() || etudiantExistant.prenom,
        nomDeFamille: nomDeFamille?.trim() || etudiantExistant.nomDeFamille,
        genre: genre || etudiantExistant.genre,
        dateNaissance: dateNaissanceFormatted || etudiantExistant.dateNaissance,
        telephone: telephone?.trim() || etudiantExistant.telephone,
        email: email?.toLowerCase().trim() || etudiantExistant.email,
        motDePasse: etudiantExistant.motDePasse, // Garder le même mot de passe
        cin: cin?.trim() || etudiantExistant.cin || '',
        passeport: passeport?.trim() || etudiantExistant.passeport || '',
        lieuNaissance: lieuNaissance?.trim() || etudiantExistant.lieuNaissance || '',
        pays: pays?.trim() || etudiantExistant.pays || '',
        niveau: niveauFinal, // LE NIVEAU EST MAINTENANT AUTO-ASSIGNE
        niveauFormation: niveauFormation?.trim() || etudiantExistant.niveauFormation || '',
        filiere: filiere?.trim() || etudiantExistant.filiere || '',
        typeFormation: typeFormationFinal,
        typeDiplome: typeDiplome?.trim() || etudiantExistant.typeDiplome || '',
        diplomeAcces: diplomeAcces?.trim() || etudiantExistant.diplomeAcces || '',
        specialiteDiplomeAcces: specialiteDiplomeAcces?.trim() || etudiantExistant.specialiteDiplomeAcces || '',
        mention: mention?.trim() || etudiantExistant.mention || '',
        lieuObtentionDiplome: lieuObtentionDiplome?.trim() || etudiantExistant.lieuObtentionDiplome || '',
        serieBaccalaureat: serieBaccalaureat?.trim() || etudiantExistant.serieBaccalaureat || '',
        anneeBaccalaureat: anneeBacNum || etudiantExistant.anneeBaccalaureat,
        premiereAnneeInscription: premiereInscriptionNum || etudiantExistant.premiereAnneeInscription,
        sourceInscription: sourceInscription?.trim() || etudiantExistant.sourceInscription || '',
        typePaiement: typePaiement?.trim() || etudiantExistant.typePaiement || '',
        prixTotal: prixTotalNum || etudiantExistant.prixTotal,
        pourcentageBourse: pourcentageBourseNum || etudiantExistant.pourcentageBourse,
        situation: situation?.trim() || etudiantExistant.situation || '',
        codeEtudiant: codeEtudiant?.trim() || etudiantExistant.codeEtudiant || '',
        dateEtReglement: dateEtReglementFormatted || etudiantExistant.dateEtReglement,
        cours: coursArray.length > 0 ? coursArray : etudiantExistant.cours,
        
        // Fichiers
        image: imagePath || etudiantExistant.image,
        fichierInscrit: fichierInscritPath || etudiantExistant.fichierInscrit,
        originalBac: originalBacPath || etudiantExistant.originalBac,
        releveNotes: releveNotesPath || etudiantExistant.releveNotes,
        copieCni: copieCniPath || etudiantExistant.copieCni,
        passport: fichierPassportPath || etudiantExistant.passport,
        dtsBac2: dtsBac2Path || etudiantExistant.dtsBac2,
        licence: licencePath || etudiantExistant.licence,
        
        // Champs booléens
        actif: req.body.actif !== undefined ? req.body.actif : etudiantExistant.actif,
        paye: req.body.paye !== undefined ? req.body.paye : etudiantExistant.paye,
        handicape: req.body.handicape !== undefined ? req.body.handicape : etudiantExistant.handicape,
        resident: req.body.resident !== undefined ? req.body.resident : etudiantExistant.resident,
        fonctionnaire: req.body.fonctionnaire !== undefined ? req.body.fonctionnaire : etudiantExistant.fonctionnaire,
        mobilite: req.body.mobilite !== undefined ? req.body.mobilite : etudiantExistant.mobilite,
        nouvelleInscription: req.body.nouvelleInscription !== undefined ? req.body.nouvelleInscription : etudiantExistant.nouvelleInscription,
        
        // IMPORTANT: Garder le commercial actuel pour nouvelle année (pas reset à null comme admin)
        commercial: req.commercialId,
        
        anneeScolaire: anneeScolaire, // NOUVELLE ANNEE SCOLAIRE
        
        // Commercial créateur (équivalent de creeParAdmin pour commercial)
        creeParCommercial: etudiantExistant.commercial || req.commercialId,
        creeParAdmin: null
      };

      // ASSIGNATION DES CHAMPS SPECIFIQUES SELON LE TYPE DE FORMATION
      
      if (typeFormationFinal === 'CYCLE_INGENIEUR') {
        // Formation d'ingénieur
        const cycleCalcule = niveauFinal >= 1 && niveauFinal <= 2 ? 'Classes Préparatoires Intégrées' : 'Cycle Ingénieur';
        donneesCopiees.cycle = cycleCalcule;
        donneesCopiees.specialiteIngenieur = specialiteIngenieur?.trim() || undefined;
        donneesCopiees.optionIngenieur = optionIngenieur?.trim() || undefined;
        donneesCopiees.specialite = '';
        donneesCopiees.option = '';
        donneesCopiees.specialiteLicencePro = undefined;
        donneesCopiees.optionLicencePro = undefined;
        donneesCopiees.specialiteMasterPro = undefined;
        donneesCopiees.optionMasterPro = undefined;
        
      } else if (typeFormationFinal === 'LICENCE_PRO') {
        // Licence Professionnelle - NIVEAU AUTO-ASSIGNE A 3
        donneesCopiees.specialiteLicencePro = specialiteLicencePro?.trim() || undefined;
        donneesCopiees.optionLicencePro = optionLicencePro?.trim() || undefined;
        donneesCopiees.cycle = undefined;
        donneesCopiees.specialiteIngenieur = undefined;
        donneesCopiees.optionIngenieur = undefined;
        donneesCopiees.specialiteMasterPro = undefined;
        donneesCopiees.optionMasterPro = undefined;
        donneesCopiees.specialite = '';
        donneesCopiees.option = '';
        
      } else if (typeFormationFinal === 'MASTER_PRO') {
        // Master Professionnel - NIVEAU AUTO-ASSIGNE A 4
        donneesCopiees.specialiteMasterPro = specialiteMasterPro?.trim() || undefined;
        donneesCopiees.optionMasterPro = optionMasterPro?.trim() || undefined;
        donneesCopiees.cycle = undefined;
        donneesCopiees.specialiteIngenieur = undefined;
        donneesCopiees.optionIngenieur = undefined;
        donneesCopiees.specialiteLicencePro = undefined;
        donneesCopiees.optionLicencePro = undefined;
        donneesCopiees.specialite = '';
        donneesCopiees.option = '';
        
      } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
        // Anciennes formations
        donneesCopiees.specialite = specialite?.trim() || '';
        donneesCopiees.option = option?.trim() || '';
        donneesCopiees.cycle = undefined;
        donneesCopiees.specialiteIngenieur = undefined;
        donneesCopiees.optionIngenieur = undefined;
        donneesCopiees.specialiteLicencePro = undefined;
        donneesCopiees.optionLicencePro = undefined;
        donneesCopiees.specialiteMasterPro = undefined;
        donneesCopiees.optionMasterPro = undefined;
      }

      // Validation supplémentaire de l'email si modifié
      if (email && email !== etudiantExistant.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Format d\'email invalide' });
        }

        // Vérification de l'unicité de l'email (exclure l'étudiant existant)
        const emailExiste = await Etudiant.findOne({ 
          email: email.toLowerCase().trim(),
          _id: { $ne: req.params.id }
        });
        if (emailExiste) {
          return res.status(400).json({ message: 'Email déjà utilisé par un autre étudiant' });
        }
      }

      // Validation du mot de passe si fourni
      if (motDePasse !== undefined && motDePasse !== null && motDePasse.trim() !== '') {
        if (motDePasse.length < 6) {
          return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
        }
        const hashedPassword = await bcrypt.hash(motDePasse.trim(), 10);
        donneesCopiees.motDePasse = hashedPassword;
      }

      // CREER LE NOUVEAU DOCUMENT POUR LA NOUVELLE ANNEE
      // 1 Modifier temporairement l'email de l'étudiant existant
      await Etudiant.findByIdAndUpdate(etudiantExistant._id, {
        email: `${etudiantExistant.email}_archived_${Date.now()}`,
        actif: false, // Marquer comme inactif
        archivedAt: new Date()
      });

      // 2 Créer le nouveau document avec l'email original
      const nouvelEtudiant = new Etudiant({
        ...donneesCopiees,
        createdAt: new Date(),
        modifiePar: req.commercialId,
        versionOriginalId: etudiantExistant._id
      });

      const etudiantSauvegarde = await nouvelEtudiant.save();

      console.log(`✅ Nouvelle année scolaire créée - ID: ${etudiantSauvegarde._id}`);
      console.log(`📋 Document original conservé - ID: ${etudiantExistant._id}`);
      console.log(`💼 Commercial maintenu: ${req.commercialId}`);

      // RETOURNER SEULEMENT LE NOUVEAU DOCUMENT
      const etudiantResponse = etudiantSauvegarde.toObject();
      delete etudiantResponse.motDePasse;

      return res.status(201).json({
        message: `Nouvel étudiant créé pour l'année scolaire ${anneeScolaire}`,
        data: etudiantResponse,
        originalId: etudiantExistant._id,
        newId: etudiantSauvegarde._id,
        isNewSchoolYear: true
      });
    }

    // 3. MODIFICATION NORMALE (PAS DE NOUVELLE ANNEE SCOLAIRE)
    console.log(`✏️ Modification normale de l'étudiant existant`);
    
    // DETERMINATION CORRIGEE DU TYPE DE FORMATION
    const filiereFinale = filiere !== undefined ? filiere : etudiantExistant.filiere;

    // CORRECTION PRINCIPALE: Toujours dériver le type de formation de la filière finale
    let typeFormationFinal;

    if (filiereFinale) {
      const mappingFiliere = {
        'CYCLE_INGENIEUR': 'CYCLE_INGENIEUR',
        'MASI': 'MASI',
        'IRM': 'IRM',
        'LICENCE_PRO': 'LICENCE_PRO',
        'MASTER_PRO': 'MASTER_PRO'
      };
      typeFormationFinal = mappingFiliere[filiereFinale];
    } else {
      // Si pas de filière, utiliser le typeFormation fourni ou existant
      typeFormationFinal = typeFormation !== undefined ? typeFormation : etudiantExistant.typeFormation;
    }

    console.log(`🔍 Formation déterminée: Filière="${filiereFinale}" -> Type="${typeFormationFinal}"`);
    console.log(`📋 Anciennes données: Filière="${etudiantExistant.filiere}", Type="${etudiantExistant.typeFormation}"`);

    // DETERMINATION DU NIVEAU
    let niveauFinal;
    if (niveau !== undefined && niveau !== null && niveau !== '') {
      niveauFinal = parseInt(niveau);
      console.log(`✅ Nouveau niveau explicite reçu: "${niveau}" -> ${niveauFinal}`);
    } else {
      niveauFinal = etudiantExistant.niveau;
      console.log(`✅ Niveau gardé de l'existant: ${niveauFinal}`);
    }

    // Auto-assignation du niveau pour LP et MP seulement
    if (typeFormationFinal === 'LICENCE_PRO') {
      niveauFinal = 3;
      console.log(`🔒 Niveau forcé à 3 pour Licence Pro`);
    } else if (typeFormationFinal === 'MASTER_PRO') {
      niveauFinal = 4;
      console.log(`🔒 Niveau forcé à 4 pour Master Pro`);
    }

    console.log(`✅ Niveau final déterminé: ${niveauFinal} (Type: ${typeFormationFinal})`);

    // VALIDATION CORRIGEE SELON LE TYPE DE FORMATION
    
    if (typeFormationFinal === 'CYCLE_INGENIEUR') {
      console.log(`🔍 Validation CYCLE_INGENIEUR - Niveau: ${niveauFinal}`);
      
      // Validation du niveau
      if (!niveauFinal || niveauFinal < 1 || niveauFinal > 5) {
        return res.status(400).json({ 
          message: 'Le niveau doit être entre 1 et 5 pour la formation d\'ingénieur' 
        });
      }

      // Validation pour Classes Préparatoires (années 1-2)
      if (niveauFinal >= 1 && niveauFinal <= 2) {
        if (specialiteIngenieur || optionIngenieur) {
          return res.status(400).json({ 
            message: 'Pas de spécialité ou option d\'ingénieur en Classes Préparatoires' 
          });
        }
      }

      // Validation pour Cycle Ingénieur (années 3-5)
      if (niveauFinal >= 3 && niveauFinal <= 5) {
        // CORRECTION : Déterminer quelle spécialité utiliser
        const specialiteAUtiliser = specialiteIngenieur !== undefined 
          ? specialiteIngenieur 
          : etudiantExistant.specialiteIngenieur;
        
        console.log(`🔍 Spécialité à utiliser: "${specialiteAUtiliser}"`);
        
        if (!specialiteAUtiliser) {
          return res.status(400).json({ 
            message: 'Une spécialité d\'ingénieur est obligatoire à partir de la 3ème année' 
          });
        }
        
        // VALIDATION DE L'OPTION POUR LA 5EME ANNEE SEULEMENT
        if (niveauFinal === 5) {
          const optionAUtiliser = optionIngenieur !== undefined 
            ? optionIngenieur 
            : etudiantExistant.optionIngenieur;
          
          console.log(`🔍 Option à utiliser (année 5): "${optionAUtiliser}"`);
          
          if (!optionAUtiliser) {
            return res.status(400).json({ 
              message: 'Une option d\'ingénieur est obligatoire en 5ème année' 
            });
          }
          
          // VALIDATION DE LA COMPATIBILITE SPECIALITE-OPTION
          const STRUCTURE_OPTIONS_INGENIEUR = {
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
          };

          const optionsDisponibles = STRUCTURE_OPTIONS_INGENIEUR[specialiteAUtiliser];
          console.log(`🔍 Options disponibles pour "${specialiteAUtiliser}":`, optionsDisponibles);
          
          if (!optionsDisponibles || !optionsDisponibles.includes(optionAUtiliser)) {
            return res.status(400).json({ 
              message: `L'option "${optionAUtiliser}" n'est pas disponible pour la spécialité "${specialiteAUtiliser}". Options disponibles: ${optionsDisponibles ? optionsDisponibles.join(', ') : 'aucune'}` 
            });
          }
        }
      }

      // Vérifier qu'on n'a pas de champs LP/MP
      if (specialiteLicencePro || optionLicencePro || specialiteMasterPro || optionMasterPro) {
        return res.status(400).json({ 
          message: 'Les champs Licence Pro et Master Pro ne sont pas disponibles pour CYCLE_INGENIEUR' 
        });
      }

    } else if (typeFormationFinal === 'LICENCE_PRO') {
      console.log(`🔍 Validation LICENCE_PRO`);
      
      const specialiteSource = specialiteLicencePro !== undefined 
        ? specialiteLicencePro 
        : etudiantExistant.specialiteLicencePro;
      if (!specialiteSource) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour Licence Professionnelle' 
        });
      }

      const optionSource = optionLicencePro !== undefined 
        ? optionLicencePro 
        : etudiantExistant.optionLicencePro;
      if (optionSource) {
        const OPTIONS_LICENCE_PRO = {
          'Développement Informatique Full Stack': [
            'Développement Mobile',
            'Intelligence Artificielle et Data Analytics',
            'Développement JAVA JEE',
            'Développement Gaming et VR'
          ],
          'Réseaux et Cybersécurité': [
            'Administration des Systèmes et Cloud Computing'
          ]
        };

        const optionsDisponibles = OPTIONS_LICENCE_PRO[specialiteSource];
        if (!optionsDisponibles || !optionsDisponibles.includes(optionSource)) {
          return res.status(400).json({ 
            message: `L'option "${optionSource}" n'est pas disponible pour cette spécialité` 
          });
        }
      }

    } else if (typeFormationFinal === 'MASTER_PRO') {
      console.log(`🔍 Validation MASTER_PRO`);
      
      const specialiteSource = specialiteMasterPro !== undefined 
        ? specialiteMasterPro 
        : etudiantExistant.specialiteMasterPro;
      if (!specialiteSource) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour Master Professionnel' 
        });
      }

      const optionSource = optionMasterPro !== undefined 
        ? optionMasterPro 
        : etudiantExistant.optionMasterPro;
      if (optionSource) {
        const OPTIONS_MASTER_PRO = {
          'Cybersécurité et Transformation Digitale': [
            'Systèmes de communication et Data center',
            'Management des Systèmes d\'Information'
          ],
          'Génie Informatique et Innovation Technologique': [
            'Génie Logiciel',
            'Intelligence Artificielle et Data Science'
          ]
        };

        const optionsDisponibles = OPTIONS_MASTER_PRO[specialiteSource];
        if (!optionsDisponibles || !optionsDisponibles.includes(optionSource)) {
          return res.status(400).json({ 
            message: `L'option "${optionSource}" n'est pas disponible pour cette spécialité` 
          });
        }
      }

    } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
      console.log(`🔍 Validation ${typeFormationFinal} - Niveau: ${niveauFinal}`);
      
      if (!niveauFinal) {
        return res.status(400).json({ 
          message: `Le niveau est obligatoire pour ${typeFormationFinal}` 
        });
      }
      
      // Validation spécialité pour niveau >= 3
      if (niveauFinal >= 3) {
        const specialiteAUtiliser = specialite !== undefined ? specialite : etudiantExistant.specialite;
        console.log(`🔍 Validation spécialité - Fournie: "${specialite}", Existante: "${etudiantExistant.specialite}", À utiliser: "${specialiteAUtiliser}"`);
        
        if (!specialiteAUtiliser || specialiteAUtiliser.trim() === '') {
          return res.status(400).json({ 
            message: `Une spécialité est obligatoire à partir de la 3ème année pour ${typeFormationFinal}` 
          });
        }
      }

      // Validation option pour niveau 5
      if (niveauFinal === 5) {
        const optionAUtiliser = option !== undefined ? option : etudiantExistant.option;
        console.log(`🔍 Validation option - Fournie: "${option}", Existante: "${etudiantExistant.option}", À utiliser: "${optionAUtiliser}"`);
        
        if (!optionAUtiliser || optionAUtiliser.trim() === '') {
          return res.status(400).json({ 
            message: `Une option est obligatoire en 5ème année pour ${typeFormationFinal}` 
          });
        }
      }

      // Validation structure formation
      if (specialite !== undefined || niveauFinal !== etudiantExistant.niveau) {
        const specialiteAValider = specialite !== undefined ? specialite : etudiantExistant.specialite;
        if (specialiteAValider && specialiteAValider.trim() !== '') {
          const STRUCTURE_FORMATION = {
            MASI: {
              3: ['Entreprenariat, audit et finance', 'Développement commercial et marketing digital'],
              4: ['Management des affaires et systèmes d\'information'],
              5: ['Management des affaires et systèmes d\'information']
            },
            IRM: {
              3: ['Développement informatique', 'Réseaux et cybersécurité'],
              4: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale'],
              5: ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale']
            }
          };

          const specialitesDisponibles = STRUCTURE_FORMATION[typeFormationFinal]?.[niveauFinal] || [];
          console.log(`🔍 Spécialités disponibles pour ${typeFormationFinal} niveau ${niveauFinal}:`, specialitesDisponibles);
          
          if (specialitesDisponibles.length > 0 && !specialitesDisponibles.includes(specialiteAValider)) {
            return res.status(400).json({ 
              message: `La spécialité "${specialiteAValider}" n'est pas disponible pour ${typeFormationFinal} niveau ${niveauFinal}. Spécialités disponibles: ${specialitesDisponibles.join(', ')}` 
            });
          }
        }
      }
    }

    // GESTION DES COURS AVEC LIMITE
    const MAX_ETUDIANTS = 20;
    let coursArray = etudiantExistant.cours || [];

    if (cours !== undefined) {
      const coursDemandes = Array.isArray(cours) ? cours : (cours ? [cours] : []);
      coursArray = [];
      
      for (let coursNom of coursDemandes) {
        if (!coursNom || coursNom.trim() === '') continue;
        
        const suffixes = ['', ' A', ' B', ' C', ' D', ' E', ' F', ' G'];
        let nomAvecSuffixe = '';
        let coursTrouve = false;

        for (let suffix of suffixes) {
          nomAvecSuffixe = coursNom + suffix;

          let coursExiste = await Cours.findOne({ nom: nomAvecSuffixe });
          if (!coursExiste) {
            const coursOriginal = await Cours.findOne({ nom: coursNom });
            let professeurs = [];
            if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
              professeurs = coursOriginal.professeur;
            } else {
              const prof = await Professeur.findOne({ cours: coursNom });
              if (prof) professeurs = [prof.nom];
            }
            const nouveauCours = new Cours({
              nom: nomAvecSuffixe,
              professeur: professeurs,
              creePar: req.commercialId
            });
            await nouveauCours.save();
            for (const nomProf of professeurs) {
              await Professeur.updateOne(
                { nom: nomProf },
                { $addToSet: { cours: nomAvecSuffixe } }
              );
            }
            coursExiste = nouveauCours;
          }

          // Compter en excluant l'étudiant actuel pour éviter les faux positifs
          const count = await Etudiant.countDocuments({ 
            cours: nomAvecSuffixe,
            _id: { $ne: req.params.id }
          });
          if (count < MAX_ETUDIANTS) {
            coursArray.push(nomAvecSuffixe);
            coursTrouve = true;
            break;
          }
        }

        if (!coursTrouve) {
          const nextSuffix = ' ' + String.fromCharCode(65 + suffixes.length);
          const nomNouveau = `${coursNom}${nextSuffix}`;
          const coursOriginal = await Cours.findOne({ nom: coursNom });
          let professeurs = [];
          if (coursOriginal && Array.isArray(coursOriginal.professeur)) {
            professeurs = coursOriginal.professeur;
          } else {
            const prof = await Professeur.findOne({ cours: coursNom });
            if (prof) professeurs = [prof.nom];
          }
          const nouveauCours = new Cours({
            nom: nomNouveau,
            professeur: professeurs,
            creePar: req.commercialId
          });
          await nouveauCours.save();
          for (const nomProf of professeurs) {
            await Professeur.updateOne(
              { nom: nomProf },
              { $addToSet: { cours: nomNouveau } }
            );
          }
          coursArray.push(nomNouveau);
        }
      }
    }

    // FONCTIONS UTILITAIRES
    const toDate = (val) => {
      if (!val) return undefined;
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    };

    const toNumber = (val) => {
      if (val === undefined || val === '' || val === null) return undefined;
      const n = parseFloat(val);
      return isNaN(n) ? undefined : n;
    };

    const toBool = (val) => val === 'true' || val === true;

    // VALIDATIONS DES CHAMPS OBLIGATOIRES
    if (prenom !== undefined && !prenom.trim()) {
      return res.status(400).json({ message: 'Le prénom est obligatoire' });
    }
    if (nomDeFamille !== undefined && !nomDeFamille.trim()) {
      return res.status(400).json({ message: 'Le nom de famille est obligatoire' });
    }
    if (telephone !== undefined && !telephone.trim()) {
      return res.status(400).json({ message: 'Le téléphone est obligatoire' });
    }
    if (email !== undefined && !email.trim()) {
      return res.status(400).json({ message: 'L\'email est obligatoire' });
    }

    // Validation de l'email si fourni
    if (email && email !== etudiantExistant.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      // Vérification de l'unicité de l'email (sauf pour l'étudiant actuel)
      const emailExiste = await Etudiant.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: req.params.id } 
      });
      if (emailExiste) {
        return res.status(400).json({ message: 'Email déjà utilisé par un autre étudiant' });
      }
    }

    // Validation du code étudiant si fourni
    if (codeEtudiant && codeEtudiant !== etudiantExistant.codeEtudiant) {
      const codeExiste = await Etudiant.findOne({ 
        codeEtudiant: codeEtudiant.trim(),
        _id: { $ne: req.params.id }
      });
      if (codeExiste) {
        return res.status(400).json({ message: 'Code étudiant déjà utilisé' });
      }
    }

    // Validation du pourcentage de bourse
    const pourcentageBourseNum = toNumber(pourcentageBourse);
    if (pourcentageBourseNum !== undefined && (pourcentageBourseNum < 0 || pourcentageBourseNum > 100)) {
      return res.status(400).json({ message: 'Le pourcentage de bourse doit être entre 0 et 100' });
    }

    // TRAITEMENT DES FICHIERS UPLOADES
    const getFilePath = (fileField) => {
      return req.files && req.files[fileField] && req.files[fileField][0] 
        ? `/uploads/${req.files[fileField][0].filename}` 
        : undefined;
    };

    const imagePath = getFilePath('image');
    const fichierInscritPath = getFilePath('fichierInscrit');
    const originalBacPath = getFilePath('originalBac');
    const releveNotesPath = getFilePath('releveNotes');
    const copieCniPath = getFilePath('copieCni');
    const fichierPassportPath = getFilePath('fichierPassport');
    const dtsBac2Path = getFilePath('dtsBac2');
    const licencePath = getFilePath('licence');

    // CREER L'OBJET DE MODIFICATIONS
    const modifications = {};

    // Appliquer toutes les modifications reçues
    if (prenom !== undefined) modifications.prenom = prenom.trim();
    if (nomDeFamille !== undefined) modifications.nomDeFamille = nomDeFamille.trim();
    if (genre !== undefined) modifications.genre = genre;
    if (dateNaissance !== undefined) modifications.dateNaissance = toDate(dateNaissance);
    if (telephone !== undefined) modifications.telephone = telephone.trim();
    if (email !== undefined) modifications.email = email.toLowerCase().trim();
    if (cours !== undefined) modifications.cours = coursArray;
    if (actif !== undefined) modifications.actif = toBool(actif);
    if (cin !== undefined) modifications.cin = cin.trim();
    if (passeport !== undefined) modifications.passeport = passeport.trim();
    if (lieuNaissance !== undefined) modifications.lieuNaissance = lieuNaissance.trim();
    if (pays !== undefined) modifications.pays = pays.trim();
    
    // LIGNE CRUCIALE: TOUJOURS ASSIGNER LE NIVEAU FINAL CALCULE
    modifications.niveau = niveauFinal;
    console.log(`🔥 ASSIGNATION NIVEAU DANS MODIFICATIONS: ${niveauFinal}`);
    
    if (niveauFormation !== undefined) modifications.niveauFormation = niveauFormation.trim();
    if (filiere !== undefined) modifications.filiere = filiere.trim();
    modifications.typeFormation = typeFormationFinal;
    if (typeDiplome !== undefined) modifications.typeDiplome = typeDiplome.trim();
    if (diplomeAcces !== undefined) modifications.diplomeAcces = diplomeAcces.trim();
    if (specialiteDiplomeAcces !== undefined) modifications.specialiteDiplomeAcces = specialiteDiplomeAcces.trim();
    if (mention !== undefined) modifications.mention = mention.trim();
    if (lieuObtentionDiplome !== undefined) modifications.lieuObtentionDiplome = lieuObtentionDiplome.trim();
    if (serieBaccalaureat !== undefined) modifications.serieBaccalaureat = serieBaccalaureat.trim();
    if (anneeBaccalaureat !== undefined) modifications.anneeBaccalaureat = toNumber(anneeBaccalaureat);
    if (premiereAnneeInscription !== undefined) modifications.premiereAnneeInscription = toNumber(premiereAnneeInscription);
    if (sourceInscription !== undefined) modifications.sourceInscription = sourceInscription.trim();
    if (typePaiement !== undefined) modifications.typePaiement = typePaiement.trim();
    if (prixTotal !== undefined) modifications.prixTotal = toNumber(prixTotal);
    if (pourcentageBourse !== undefined) modifications.pourcentageBourse = toNumber(pourcentageBourse);
    if (situation !== undefined) modifications.situation = situation.trim();
    if (nouvelleInscription !== undefined) modifications.nouvelleInscription = toBool(nouvelleInscription);
    if (paye !== undefined) modifications.paye = toBool(paye);
    if (handicape !== undefined) modifications.handicape = toBool(handicape);
    if (resident !== undefined) modifications.resident = toBool(resident);
    if (fonctionnaire !== undefined) modifications.fonctionnaire = toBool(fonctionnaire);
    if (mobilite !== undefined) modifications.mobilite = toBool(mobilite);
    if (codeEtudiant !== undefined) modifications.codeEtudiant = codeEtudiant.trim();
    if (dateEtReglement !== undefined) modifications.dateEtReglement = toDate(dateEtReglement);
    if (anneeScolaire !== undefined) modifications.anneeScolaire = anneeScolaire;

    // S'assurer que le commercial reste le même (sécurité)
    modifications.commercial = req.commercialId;

    // Validation du mot de passe si fourni
    if (motDePasse !== undefined && motDePasse !== null && motDePasse.trim() !== '') {
      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      const hashedPassword = await bcrypt.hash(motDePasse.trim(), 10);
      modifications.motDePasse = hashedPassword;
    }

    // ASSIGNATION DES CHAMPS SPECIFIQUES SELON LE TYPE DE FORMATION
    if (typeFormationFinal === 'CYCLE_INGENIEUR') {
      // Formation d'ingénieur
      const cycleCalcule = niveauFinal >= 1 && niveauFinal <= 2 ? 'Classes Préparatoires Intégrées' : 'Cycle Ingénieur';
      modifications.cycle = cycleCalcule;
      
      // CORRECTION : Gestion intelligente des spécialités et options d'ingénieur
      if (specialiteIngenieur !== undefined) {
        modifications.specialiteIngenieur = specialiteIngenieur?.trim() || undefined;
        
        // Si on change de spécialité, on efface l'option pour éviter l'incompatibilité
        if (specialiteIngenieur !== etudiantExistant.specialiteIngenieur) {
          console.log(`🔄 Changement de spécialité détecté: "${etudiantExistant.specialiteIngenieur}" -> "${specialiteIngenieur}"`);
          console.log(`🔄 Effacement de l'ancienne option: "${etudiantExistant.optionIngenieur}"`);
          modifications.optionIngenieur = undefined;
        }
      }
      
      if (optionIngenieur !== undefined) {
        modifications.optionIngenieur = optionIngenieur?.trim() || undefined;
      }
      
      // Nettoyer les autres champs
      modifications.specialite = '';
      modifications.option = '';
      modifications.specialiteLicencePro = undefined;
      modifications.optionLicencePro = undefined;
      modifications.specialiteMasterPro = undefined;
      modifications.optionMasterPro = undefined;
      
    } else if (typeFormationFinal === 'LICENCE_PRO') {
      // Licence Professionnelle
      if (specialiteLicencePro !== undefined) modifications.specialiteLicencePro = specialiteLicencePro?.trim() || undefined;
      if (optionLicencePro !== undefined) modifications.optionLicencePro = optionLicencePro?.trim() || undefined;
      modifications.cycle = undefined;
      modifications.specialiteIngenieur = undefined;
      modifications.optionIngenieur = undefined;
      modifications.specialiteMasterPro = undefined;
      modifications.optionMasterPro = undefined;
      modifications.specialite = '';
      modifications.option = '';
      
    } else if (typeFormationFinal === 'MASTER_PRO') {
      // Master Professionnel
      if (specialiteMasterPro !== undefined) modifications.specialiteMasterPro = specialiteMasterPro?.trim() || undefined;
      if (optionMasterPro !== undefined) modifications.optionMasterPro = optionMasterPro?.trim() || undefined;
      modifications.cycle = undefined;
      modifications.specialiteIngenieur = undefined;
      modifications.optionIngenieur = undefined;
      modifications.specialiteLicencePro = undefined;
      modifications.optionLicencePro = undefined;
      modifications.specialite = '';
      modifications.option = '';
      
    } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
      // Anciennes formations
      console.log(`🔍 Assignation ${typeFormationFinal} - Spécialité: "${specialite}", Option: "${option}"`);
      
      if (specialite !== undefined) modifications.specialite = specialite?.trim() || '';
      if (option !== undefined) modifications.option = option?.trim() || '';
      
      // Nettoyer les autres champs
      modifications.cycle = undefined;
      modifications.specialiteIngenieur = undefined;
      modifications.optionIngenieur = undefined;
      modifications.specialiteLicencePro = undefined;
      modifications.optionLicencePro = undefined;
      modifications.specialiteMasterPro = undefined;
      modifications.optionMasterPro = undefined;
    }

    // TRAITEMENT DES FICHIERS UPLOADES
    if (imagePath !== undefined) modifications.image = imagePath;
    if (fichierInscritPath !== undefined) modifications.fichierInscrit = fichierInscritPath;
    if (originalBacPath !== undefined) modifications.originalBac = originalBacPath;
    if (releveNotesPath !== undefined) modifications.releveNotes = releveNotesPath;
    if (copieCniPath !== undefined) modifications.copieCni = copieCniPath;
    if (fichierPassportPath !== undefined) modifications.passport = fichierPassportPath;
    if (dtsBac2Path !== undefined) modifications.dtsBac2 = dtsBac2Path;
    if (licencePath !== undefined) modifications.licence = licencePath;

    // Ajouter les informations de modification
    modifications.updatedAt = new Date();
    modifications.modifiePar = req.commercialId;

    console.log(`🔍 Modifications finales à appliquer:`, {
      niveau: modifications.niveau,
      filiere: modifications.filiere,
      typeFormation: modifications.typeFormation,
      specialiteIngenieur: modifications.specialiteIngenieur,
      optionIngenieur: modifications.optionIngenieur,
      specialite: modifications.specialite,
      option: modifications.option,
      specialiteLicencePro: modifications.specialiteLicencePro,
      optionLicencePro: modifications.optionLicencePro,
      specialiteMasterPro: modifications.specialiteMasterPro,
      optionMasterPro: modifications.optionMasterPro
    });

    // 4. MISE A JOUR DU DOCUMENT EXISTANT
    const etudiantMiseAJour = await Etudiant.findByIdAndUpdate(
      req.params.id,
      modifications,
      { 
        new: true, // Retourner le document mis à jour
        runValidators: true // Exécuter les validations Mongoose
      }
    );

    if (!etudiantMiseAJour) {
      return res.status(404).json({ message: 'Étudiant non trouvé lors de la mise à jour' });
    }

    console.log(`✅ Étudiant mis à jour avec succès - ID: ${etudiantMiseAJour._id}`);
    console.log(`📋 Nouveau niveau: ${etudiantMiseAJour.niveau}`);
    console.log(`📋 Nouvelle filière: ${etudiantMiseAJour.filiere}`);
    console.log(`📋 Nouveau type de formation: ${etudiantMiseAJour.typeFormation}`);
    console.log(`📋 Nouvelle spécialité ingénieur: ${etudiantMiseAJour.specialiteIngenieur}`);
    console.log(`📋 Nouvelle option ingénieur: ${etudiantMiseAJour.optionIngenieur}`);
    console.log(`📋 Nouvelle spécialité MASI/IRM: ${etudiantMiseAJour.specialite}`);
    console.log(`📋 Nouvelle option MASI/IRM: ${etudiantMiseAJour.option}`);

    // RETOURNER LE DOCUMENT MIS A JOUR (sans mot de passe)
    const etudiantResponse = etudiantMiseAJour.toObject();
    delete etudiantResponse.motDePasse;

    res.status(200).json({
      message: 'Étudiant mis à jour avec succès',
      data: etudiantResponse,
      isNewSchoolYear: false
    });

  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour étudiant (commercial):', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} déjà utilisé par un autre étudiant` });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID étudiant invalide' });
    }

    res.status(500).json({
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});
app.get('/api/comercial/stats', authCommercial, async (req, res) => {
  try {
    const { anneeScolaire, personnel } = req.query;
    
    // Log pour déboguer
    console.log('=== DEBUG API STATS ===');
    console.log('Query params:', { anneeScolaire, personnel });
    console.log('req.commercialId:', req.commercialId); // Changé de req.user
    console.log('========================');
    
    // Construction du filtre de base
    let filter = {};
    
    // Filtre par année scolaire
    if (anneeScolaire && anneeScolaire.trim() !== '') {
      filter.anneeScolaire = anneeScolaire;
    }
    
    // Filtre personnel : si personnel=true, filtrer par le commercial connecté
    if (personnel === 'true') {
      if (!req.commercialId) { // Changé de req.user.id
        return res.status(400).json({ 
          message: 'ID du commercial non trouvé dans le token',
          debug: {
            commercialIdExists: !!req.commercialId,
            commercialId: req.commercialId
          }
        });
      }
      
      const commercialId = req.commercialId; // Changé de req.user.id
      filter.commercial = new mongoose.Types.ObjectId(commercialId);
      
      console.log('Filter personnel:', filter);
    }
    
    // Statistiques de base
    const totalEtudiants = await Etudiant.countDocuments(filter);
    const etudiantsActifs = await Etudiant.countDocuments({ ...filter, actif: true });
    const etudiantsPayes = await Etudiant.countDocuments({ ...filter, paye: true });
    
    // Répartition par genre
    const repartitionGenre = await Etudiant.aggregate([
      { $match: { ...filter, genre: { $exists: true, $ne: null } } },
      { $group: { _id: '$genre', count: { $sum: 1 } }}
    ]);
    
    const genreStats = {
      hommes: repartitionGenre.find(g => g._id === 'Homme')?.count || 0,
      femmes: repartitionGenre.find(g => g._id === 'Femme')?.count || 0
    };
    
    // Répartition par type de formation
    const repartitionTypeFormation = await Etudiant.aggregate([
      { $match: { ...filter, typeFormation: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: '$typeFormation', count: { $sum: 1 } }},
      { $sort: { count: -1 } }
    ]);
    
    const typeFormationStats = {};
    repartitionTypeFormation.forEach(t => {
      if (t._id && t._id.trim() !== '') {
        typeFormationStats[t._id] = t.count;
      }
    });
    
    // Répartition par niveau
    const repartitionNiveau = await Etudiant.aggregate([
      { $match: { ...filter, niveau: { $exists: true, $ne: null } } },
      { $group: { _id: '$niveau', count: { $sum: 1 } }},
      { $sort: { _id: 1 } }
    ]);
    
    const niveauStats = {};
    repartitionNiveau.forEach(n => {
      if (n._id != null) {
        niveauStats[n._id] = n.count;
      }
    });
    
    // Évolution par année scolaire - Version simplifiée
    let evolutionFilter = {};
    if (personnel === 'true' && req.commercialId) { // Changé de req.user.id
      evolutionFilter.commercial = new mongoose.Types.ObjectId(req.commercialId);
    }
    
    const repartitionAnneeScolaire = await Etudiant.aggregate([
      { $match: { 
        ...evolutionFilter,
        anneeScolaire: { $exists: true, $ne: null, $ne: "" } 
      } },
      { $group: { _id: '$anneeScolaire', count: { $sum: 1 } }},
      { $sort: { _id: 1 } }
    ]);
    
    const anneeScolaireStats = {};
    const evolutionAnneeScolaire = [];
    repartitionAnneeScolaire.forEach(a => {
      if (a._id && a._id.trim() !== '') {
        anneeScolaireStats[a._id] = a.count;
        evolutionAnneeScolaire.push({
          anneeScolaire: a._id,
          count: a.count
        });
      }
    });
    
    // Calcul du chiffre d'affaires - Version simplifiée
    const chiffreAffaireResult = await Etudiant.aggregate([
      { $match: { 
          ...filter, 
          prixTotal: { $exists: true, $type: "number", $gt: 0 } 
      }},
      { $group: { _id: null, total: { $sum: '$prixTotal' } }}
    ]);
    
    const chiffreAffaire = chiffreAffaireResult[0]?.total || 0;
    
    // Top commerciaux - Version simplifiée (seulement en vue générale)
    let topCommerciaux = [];
    if (personnel !== 'true') {
      try {
        // Version très simplifiée pour éviter l'erreur $type
        topCommerciaux = await Commercial.aggregate([
          { 
            $lookup: {
              from: 'etudiants',
              localField: '_id',
              foreignField: 'commercial',
              as: 'etudiants'
            }
          },
          {
            $addFields: {
              etudiantsFiltres: anneeScolaire && anneeScolaire.trim() !== '' 
                ? {
                    $filter: {
                      input: '$etudiants',
                      cond: { $eq: ['$$this.anneeScolaire', anneeScolaire] }
                    }
                  }
                : '$etudiants'
            }
          },
          { 
            $project: {
              nomComplet: { 
                $trim: {
                  input: { 
                    $concat: [
                      { $ifNull: ['$nom', ''] }, 
                      ' ', 
                      { $ifNull: ['$telephone', ''] }
                    ]
                  }
                }
              },
              nom: { $ifNull: ['$nom', 'N/A'] },
              telephone: { $ifNull: ['$telephone', 'N/A'] },
              count: { $size: '$etudiantsFiltres' },
              chiffreAffaire: { 
                $sum: {
                  $map: {
                    input: '$etudiantsFiltres',
                    as: 'etudiant',
                    in: { $ifNull: ['$$etudiant.prixTotal', 0] }
                  }
                }
              }
            }
          },
          { $match: { count: { $gt: 0 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]);
      } catch (commercialError) {
        console.error('Erreur agrégation commerciaux:', commercialError);
        topCommerciaux = [];
      }
    }
    
    // Étudiants récents
    const etudiantsRecents = await Etudiant.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('prenom nomDeFamille typeFormation specialite filiere dateInscription createdAt paye image anneeScolaire')
      .lean();
    
    // Calcul du taux de conversion
    const tauxConversion = totalEtudiants > 0 
      ? Math.round((etudiantsPayes / totalEtudiants) * 100) 
      : 0;
    
    console.log('=== RÉSULTATS ===');
    console.log('Total étudiants:', totalEtudiants);
    console.log('Chiffre affaire:', chiffreAffaire);
    console.log('================');
    
    res.json({
      totalEtudiants,
      nouveauxEtudiants: totalEtudiants,
      etudiantsActifs,
      etudiantsInactifs: Math.max(0, totalEtudiants - etudiantsActifs),
      etudiantsPayes,
      etudiantsNonPayes: Math.max(0, totalEtudiants - etudiantsPayes),
      repartitionGenre: genreStats,
      repartitionTypeFormation: typeFormationStats,
      repartitionNiveau: niveauStats,
      repartitionAnneeScolaire: anneeScolaireStats,
      evolutionAnneeScolaire,
      chiffreAffaire,
      topCommerciaux,
      etudiantsRecents,
      tauxConversion,
      vuePersonnelle: personnel === 'true'
    });
    
  } catch (err) {
    console.error('=== ERREUR API STATS ===');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('========================');
    
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack
      } : 'Erreur interne'
    });
  }
});
// PATCH - Toggle actif pour étudiant du commercial
app.patch('/api/commercial/etudiants/:id/actif', authCommercial, async (req, res) => {
  try {
    const etudiant = await Etudiant.findOne({ _id: req.params.id, commercial: req.commercialId });
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé ou non autorisé' });
    }

    etudiant.actif = !etudiant.actif;
    await etudiant.save();
    res.json(etudiant);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la modification du statut' });
  }
});

// DELETE - Supprimer un étudiant du commercial
app.delete('/api/commercial/etudiants/:id', authCommercial, async (req, res) => {
  try {
    const etudiant = await Etudiant.findOne({ _id: req.params.id, commercial: req.commercialId });
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé ou non autorisé' });
    }

    await Etudiant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Étudiant supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});





// 1. Créer un gestionnaire de paiement (POST)
app.post('/api/admin/paiement-managers', authAdmin, async (req, res) => {
  try {
    const { nom, email, telephone, motDePasse } = req.body;

    // Validation
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
    }

    // Vérifier si l'email existe déjà
    const existingManager = await PaiementManager.findOne({ email });
    if (existingManager) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer le manager
    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const manager = new PaiementManager({
      nom,
      email,
      telephone,
      motDePasse: hashedPassword,
      actif: true
    });

    await manager.save();

    // Retourner les données sans le mot de passe
    const managerData = manager.toObject();
    delete managerData.motDePasse;

    res.status(201).json(managerData);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 2. Lire tous les gestionnaires (GET)
app.get('/api/admin/paiement-managers', authAdmin, async (req, res) => {
  try {
    const managers = await PaiementManager.find({}, { motDePasse: 0 });
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 3. Lire un gestionnaire spécifique (GET)
app.get('/api/admin/paiement-managers/:id', authAdmin, async (req, res) => {
  try {
    const manager = await PaiementManager.findById(req.params.id, { motDePasse: 0 });
    if (!manager) {
      return res.status(404).json({ message: 'Gestionnaire non trouvé' });
    }
    res.json(manager);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 4. Mettre à jour un gestionnaire (PUT)
app.put('/api/admin/paiement-managers/:id', authAdmin, async (req, res) => {
  try {
    const { nom, email, telephone, motDePasse, actif } = req.body;
    const updates = {};

    if (nom) updates.nom = nom;
    if (email) updates.email = email;
    if (telephone) updates.telephone = telephone;
    if (typeof actif !== 'undefined') updates.actif = actif;

    // Si mot de passe fourni
    if (motDePasse) {
      updates.motDePasse = await bcrypt.hash(motDePasse, 10);
    }

    const manager = await PaiementManager.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, select: '-motDePasse' }
    );

    if (!manager) {
      return res.status(404).json({ message: 'Gestionnaire non trouvé' });
    }

    res.json(manager);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 5. Supprimer un gestionnaire (DELETE)
app.delete('/api/admin/paiement-managers/:id', authAdmin, async (req, res) => {
  try {
    const manager = await PaiementManager.findByIdAndDelete(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: 'Gestionnaire non trouvé' });
    }
    res.json({ message: 'Gestionnaire supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 6. Activer/Désactiver un gestionnaire (PATCH)
app.patch('/api/admin/paiement-managers/:id/toggle-active', authAdmin, async (req, res) => {
  try {
    const manager = await PaiementManager.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: 'Gestionnaire non trouvé' });
    }

    manager.actif = !manager.actif;
    await manager.save();

    res.json({ 
      message: `Compte ${manager.actif ? 'activé' : 'désactivé'} avec succès`,
      actif: manager.actif
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.get('/api/paiements', authAdminOrPaiementManager, async (req, res) => {
  try {
    const paiements = await Paiement.find()
      .populate('etudiant', 'prenom nomDeFamille nomComplet telephone modePaiement') // AJOUTER modePaiement
      .populate('creePar', 'nom');

    res.json(paiements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/paiements/etudiant/:etudiantId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const paiements = await Paiement.find({ etudiant: req.params.etudiantId })
      .populate('etudiant', 'modePaiement prixTotal paye'); // AJOUTER les infos nécessaires
    
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des paiements", error: err.message });
  }
});
app.get('/api/paiement-manager/etudiants', authPaiementManager, async (req, res) => {
  try {
    const { actif, paye } = req.query;
    let query = {};

    if (actif) query.actif = actif === 'true';
    if (paye) query.paye = paye === 'true';

    const etudiants = await Etudiant.find(query)
      .select('prenom nomDeFamille email telephone prixTotal paye actif cours');
    
    res.json(etudiants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Obtenir la liste des cours
app.get('/api/paiement-manager/cours', authPaiementManager, async (req, res) => {
  try {
    const cours = await Cours.find({}).select('nom prix');
    res.json(cours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Obtenir les paiements d'un étudiant
app.get('/api/paiement-manager/paiements/etudiant/:etudiantId', authPaiementManager, async (req, res) => {
  try {
    const paiements = await Paiement.find({ etudiant: req.params.etudiantId })
      .sort({ moisDebut: -1 });
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Ajouter un nouveau paiement
app.post('/api/paiement-manager/paiements', authPaiementManager, async (req, res) => {
  try {
    const { etudiant, cours, moisDebut, nombreMois, montant, note } = req.body;

    // Validation
    if (!etudiant || !cours || !moisDebut || !montant) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const nouveauPaiement = new Paiement({
      etudiant,
      cours: Array.isArray(cours) ? cours : [cours],
      moisDebut: new Date(moisDebut),
      nombreMois,
      montant,
      note,
      creePar: req.managerId
    });

    await nouveauPaiement.save();

    // Mettre à jour le statut de paiement de l'étudiant
    await updateStatutPaiementEtudiant(etudiant);

    res.status(201).json(nouveauPaiement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 5. Obtenir les paiements récents
app.get('/api/paiement-manager/paiements', authPaiementManager, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const paiements = await Paiement.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('etudiant', 'prenom nomDeFamille');
    
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Gestion des rappels
app.post('/api/paiement-manager/rappels', authPaiementManager, async (req, res) => {
  try {
    const { etudiant, cours, montantRestant, note, dateRappel } = req.body;

    const nouveauRappel = new Rappel({
      etudiant,
      cours,
      montantRestant,
      note,
      dateRappel: new Date(dateRappel),
      creePar: req.managerId
    });

    await nouveauRappel.save();
    res.status(201).json(nouveauRappel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 7. Statistiques de paiement
app.get('/api/paiement-manager/statistiques', authPaiementManager, async (req, res) => {
  try {
    const stats = await Paiement.aggregate([
      {
        $group: {
          _id: null,
          totalPaiements: { $sum: "$montant" },
          count: { $sum: 1 },
          moyenne: { $avg: "$montant" }
        }
      }
    ]);

    const etudiantsAvecReste = await Etudiant.aggregate([
      { $match: { actif: true } },
      {
        $lookup: {
          from: "paiements",
          localField: "_id",
          foreignField: "etudiant",
          as: "paiements"
        }
      },
      {
        $addFields: {
          totalPaye: { $sum: "$paiements.montant" },
          resteAPayer: { $subtract: ["$prixTotal", { $sum: "$paiements.montant" }] }
        }
      },
      { $match: { resteAPayer: { $gt: 0 } } },
      { $count: "count" }
    ]);

    res.json({
      totalPaiements: stats[0]?.totalPaiements || 0,
      nombrePaiements: stats[0]?.count || 0,
      moyennePaiement: stats[0]?.moyenne || 0,
      etudiantsAvecReste: etudiantsAvecReste[0]?.count || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fonction utilitaire pour mettre à jour le statut de paiement
async function updateStatutPaiementEtudiant(etudiantId) {
  const paiements = await Paiement.find({ etudiant: etudiantId });
  const totalPaye = paiements.reduce((acc, p) => acc + p.montant, 0);
  const etudiant = await Etudiant.findById(etudiantId);
  
  if (etudiant) {
    etudiant.paye = totalPaye >= etudiant.prixTotal;
    await etudiant.save();
  }
}







app.get('/api/paiement-manager/paiements/:id', authPaiementManager, async (req, res) => {
  try {
    const cacheKey = `paiement_${req.params.id}`;
    const cachedData = paiementCache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const paiement = await Paiement.findById(req.params.id)
      .populate('etudiant', 'prenom nomDeFamille telephone email prixTotal')
      .populate('creePar', 'nom telephone');
    
    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    // Calculer le statut
    const finPaiement = new Date(paiement.moisDebut);
    finPaiement.setMonth(finPaiement.getMonth() + paiement.nombreMois);
    const estExpire = finPaiement < new Date();

    const response = {
      ...paiement.toObject(),
      statut: estExpire ? 'expiré' : 'actif',
      dateFin: finPaiement
    };

    paiementCache.set(cacheKey, response);
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: err.message 
    });
  }
});


app.get('/api/paiement-manager/paiements/exp', authPaiementManager, async (req, res) => {
  try {
    const etudiants = await Etudiant.find({ actif: true });
    const paiements = await Paiement.find({}).lean();

    const expires = [];

    for (const etudiant of etudiants) {
      if (!etudiant.cours || etudiant.cours.length === 0) continue;

      for (const nomCours of etudiant.cours) {
        const paiementsCours = paiements.filter(p =>
          p.etudiant?.toString() === etudiant._id.toString() &&
          p.cours.includes(nomCours)
        );

        const prixTotal = etudiant.prixTotal || 0;
        const montantPaye = paiementsCours.reduce((acc, p) => acc + (p.montant || 0), 0);
        const reste = Math.max(0, prixTotal - montantPaye);

        // ✅ Si l'étudiant a payé le prix complet, ne pas l'afficher dans les expirés
        if (reste <= 0) {
          continue; // Paiement complet, pas d'expiration
        }

        // ✅ Si aucun paiement, utiliser la date d'inscription comme référence
        if (paiementsCours.length === 0) {
          expires.push({
            etudiant: {
              _id: etudiant._id,
              prenom: etudiant.prenom,
              nomDeFamille: etudiant.nomDeFamille,
              nomComplet: etudiant.nomComplet,
              telephone: etudiant.telephone,
              email: etudiant.email,
              image: etudiant.image,
              actif: etudiant.actif
            },
            cours: nomCours,
            derniereFin: etudiant.dateInscription || etudiant.createdAt || new Date(),
            prixTotal,
            montantPaye: 0,
            reste: prixTotal,
            type: 'nouveau'
          });
          continue;
        }

        // ✅ Si il y a des paiements mais pas complets
        paiementsCours.sort((a, b) => new Date(a.moisDebut) - new Date(b.moisDebut));

        const fusionnees = [];
        for (const paiement of paiementsCours) {
          const debut = new Date(paiement.moisDebut);
          const fin = new Date(paiement.moisDebut);
          fin.setMonth(fin.getMonth() + (paiement.nombreMois || 1));

          if (fusionnees.length === 0) {
            fusionnees.push({ debut, fin });
          } else {
            const derniere = fusionnees[fusionnees.length - 1];
            const unJourApres = new Date(derniere.fin);
            unJourApres.setDate(unJourApres.getDate() + 1);

            if (debut <= unJourApres) {
              derniere.fin = fin > derniere.fin ? fin : derniere.fin;
            } else {
              fusionnees.push({ debut, fin });
            }
          }
        }

        const dernierePeriode = fusionnees[fusionnees.length - 1];
        const maintenant = new Date();

        // ✅ Seulement si la période est expirée ET qu'il reste à payer
        if (reste > 0 && dernierePeriode.fin < maintenant) {
          expires.push({
            etudiant: {
              _id: etudiant._id,
              prenom: etudiant.prenom,
              nomDeFamille: etudiant.nomDeFamille,
              nomComplet: etudiant.nomComplet,
              telephone: etudiant.telephone,
              email: etudiant.email,
              image: etudiant.image,
              actif: etudiant.actif
            },
            cours: nomCours,
            derniereFin: dernierePeriode.fin,
            prixTotal,
            montantPaye,
            reste,
            type: 'expire'
          });
        }
      }
    }

    // ✅ IMPORTANT : Trier par nombre de jours expirés (les plus urgents en premier)
    expires.sort((a, b) => {
      const aJours = Math.ceil((new Date() - new Date(a.derniereFin)) / (1000 * 60 * 60 * 24));
      const bJours = Math.ceil((new Date() - new Date(b.derniereFin)) / (1000 * 60 * 60 * 24));
      return bJours - aJours;
    });

    // ✅ CORRECTION PRINCIPALE : Envoyer la réponse ICI, pas dans la boucle
    res.json(expires);

  } catch (error) {
    console.error('Erreur paiements expirés (Manager):', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des paiements expirés',
      error: error.message
    });
  }
});


app.get('/api/paiement-manager/paiements', authPaiementManager, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sort = '-createdAt', 
      search,
      dateDebut,
      dateFin,
      montantMin,
      montantMax,
      statut
    } = req.query;
    
    let query = {};
    
    // Filtre de recherche texte
    if (search) {
      query.$or = [
        { 'etudiant.nomComplet': { $regex: search, $options: 'i' } },
        { cours: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtres avancés
    if (dateDebut || dateFin) {
      query.moisDebut = {};
      if (dateDebut) query.moisDebut.$gte = new Date(dateDebut);
      if (dateFin) query.moisDebut.$lte = new Date(dateFin);
    }

    if (montantMin || montantMax) {
      query.montant = {};
      if (montantMin) query.montant.$gte = Number(montantMin);
      if (montantMax) query.montant.$lte = Number(montantMax);
    }

    if (statut === 'expire') {
      query.$expr = {
        $lt: [
          { $dateAdd: { startDate: "$moisDebut", unit: "month", amount: "$nombreMois" } },
          new Date()
        ]
      };
    } else if (statut === 'actif') {
      query.$expr = {
        $gte: [
          { $dateAdd: { startDate: "$moisDebut", unit: "month", amount: "$nombreMois" } },
          new Date()
        ]
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { 
          path: 'etudiant', 
          select: 'prenom nomDeFamille nomComplet telephone email actif',
          match: { actif: true } // Seulement les étudiants actifs
        },
        { path: 'creePar', select: 'nom' }
      ]
    };

    const result = await Paiement.paginate(query, options);
    
    // Filtrer les résultats où l'étudiant est null (si inactif)
    const filteredDocs = result.docs.filter(doc => doc.etudiant !== null);
    
    res.json({
      paiements: filteredDocs,
      total: result.totalDocs,
      pages: result.totalPages,
      currentPage: result.page
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: err.message 
    });
  }
});
app.get('/api/admin/profile', authAdmin, async (req, res) => {
  try {
    console.log('📝 Route profile GET appelée - Admin ID:', req.adminId);
    
    const admin = await Admin.findById(req.adminId).select('-motDePasse');
    if (!admin) {
      console.log('❌ Admin non trouvé');
      return res.status(404).json({ error: 'Admin non trouvé' });
    }
    
    console.log('✅ Admin trouvé:', admin.nom);
    res.json(admin);
  } catch (err) {
    console.error('❌ Erreur route profile GET:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/profile', authAdmin, async (req, res) => {
  try {
    console.log('📝 Route profile PUT appelée - Admin ID:', req.adminId);
    console.log('📝 Body reçu:', req.body);
    
    const { nom, email, ancienMotDePasse, nouveauMotDePasse } = req.body;
    const admin = await Admin.findById(req.adminId);
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin non trouvé' });
    }
    
    const updates = {};
    
    if (nom && nom.trim() !== admin.nom) {
      updates.nom = nom.trim();
    }
    
    if (email && email.trim() !== admin.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Format d\'email invalide' });
      }
      
      const existingAdmin = await Admin.findOne({ 
        email: email.trim(),
        _id: { $ne: req.adminId } 
      });
      if (existingAdmin) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      
      updates.email = email.trim();
    }
    
    if (ancienMotDePasse && nouveauMotDePasse) {
      const isValidPassword = await admin.comparePassword(ancienMotDePasse);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Ancien mot de passe incorrect' });
      }
      
      if (nouveauMotDePasse.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      }
      
      const salt = await bcrypt.genSalt(10);
      updates.motDePasse = await bcrypt.hash(nouveauMotDePasse, salt);
    } else if (ancienMotDePasse && !nouveauMotDePasse) {
      return res.status(400).json({ error: 'Le nouveau mot de passe est requis' });
    } else if (!ancienMotDePasse && nouveauMotDePasse) {
      return res.status(400).json({ error: 'L\'ancien mot de passe est requis' });
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucune modification détectée' });
    }
    
    console.log('📝 Mises à jour à appliquer:', Object.keys(updates));
    
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.adminId,
      updates,
      { new: true, runValidators: true }
    ).select('-motDePasse');
    
    console.log('✅ Admin mis à jour avec succès');
    
    res.json({
      message: 'Profil mis à jour avec succès',
      admin: updatedAdmin,
      modifiedFields: Object.keys(updates)
    });
    
  } catch (err) {
    console.error('❌ Erreur route profile PUT:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});
// ===== ROUTES PÉDAGOGIQUE CORRIGÉES - VERSION FINALE =====

// 1. Route pour obtenir les étudiants (CORRIGÉE)
app.get('/api/pedagogique/etudiants', authPedagogique, async (req, res) => {
  try {
    const filierePedagogique = req.user.filiere;
    const estGeneral = filierePedagogique === 'GENERAL';
    
    let query = {};
    if (!estGeneral) {
      // Pédagogique spécifique : seulement sa filière
      query.filiere = filierePedagogique;
    }
    // Pour le général : query reste vide = tous les étudiants
    
    const etudiants = await Etudiant.find(query)
      .populate('commercial', 'nom nomComplet')
      .sort({ createdAt: -1 });

    console.log(`📚 Pédagogique ${estGeneral ? 'GÉNÉRAL' : req.user.filiere} - ${etudiants.length} étudiants trouvés${estGeneral ? ' (Toutes filières)' : ''}`);
    
    res.json(etudiants);
  } catch (error) {
    console.error('Erreur récupération étudiants pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 2. Route pour obtenir les cours (CORRIGÉE)
app.get('/api/pedagogique/cours', authPedagogique, async (req, res) => {
  try {
    const estGeneral = req.user.filiere === 'GENERAL';
    
    if (estGeneral) {
      // Pédagogique général : TOUS les cours
      const tousCours = await Cours.find({}).sort({ nom: 1 });
      console.log(`📚 Pédagogique GÉNÉRAL - ${tousCours.length} cours trouvés (Tous)`);
      return res.json(tousCours);
    }
    
    // Pédagogique spécifique : logique actuelle
    const tousCours = await Cours.find({}).sort({ nom: 1 });
    const etudiants = await Etudiant.find({ filiere: req.user.filiere });
    const coursDeFiliere = new Set();
    
    etudiants.forEach(etudiant => {
      if (etudiant.cours && Array.isArray(etudiant.cours)) {
        etudiant.cours.forEach(coursNom => {
          coursDeFiliere.add(coursNom);
        });
      }
    });
    
    const coursFiltres = tousCours.filter(cours => 
      coursDeFiliere.has(cours.nom) || 
      cours.nom.toLowerCase().includes(req.user.filiere.toLowerCase())
    );
    
    console.log(`📚 Pédagogique ${req.user.filiere} - ${coursFiltres.length} cours trouvés`);
    res.json(coursFiltres);
    
  } catch (error) {
    console.error('Erreur récupération cours pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



// 4. Route pour les statistiques (CORRIGÉE)
app.get('/api/pedagogique/dashboard-stats', authPedagogique, async (req, res) => {
  try {
    let query = {};
    const estGeneral = req.user.filiere === 'GENERAL';
    
    if (!estGeneral) {
      query.filiere = req.user.filiere;
    }
    // Pour le général : query reste vide = tous les étudiants
    
    const etudiants = await Etudiant.find(query);
    
    const stats = {
      filiere: req.user.filiere,
      estGeneral: estGeneral,
      
      // Statistiques générales
      totalEtudiants: etudiants.length,
      etudiantsActifs: etudiants.filter(e => e.actif).length,
      etudiantsInactifs: etudiants.filter(e => !e.actif).length,
      etudiantsPayes: etudiants.filter(e => e.paye).length,
      etudiantsNonPayes: etudiants.filter(e => !e.paye).length,
      nouveauxEtudiants: etudiants.filter(e => e.nouvelleInscription).length,
      
      // Statistiques financières
      chiffreAffaireTotal: etudiants.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
      chiffreAffairePaye: etudiants.filter(e => e.paye).reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
      chiffreAffaireNonPaye: etudiants.filter(e => !e.paye).reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0),
      moyennePrixFormation: etudiants.length > 0 ? etudiants.reduce((sum, e) => sum + (parseFloat(e.prixTotal) || 0), 0) / etudiants.length : 0,
      tauxPaiement: etudiants.length > 0 ? (etudiants.filter(e => e.paye).length / etudiants.length * 100) : 0,
      
      // Répartitions
      repartitionFiliere: {},
      repartitionNiveau: {},
      repartitionAnneeScolaire: {},
      repartitionSpecialite: {},
      repartitionGenre: {
        homme: etudiants.filter(e => e.genre === 'Homme').length,
        femme: etudiants.filter(e => e.genre === 'Femme').length
      }
    };
    
    // Répartition par filière (TOUJOURS calculée, utile pour le général)
    etudiants.forEach(e => {
      const filiere = e.filiere || 'Non définie';
      if (!stats.repartitionFiliere[filiere]) {
        stats.repartitionFiliere[filiere] = { total: 0, payes: 0, ca: 0 };
      }
      stats.repartitionFiliere[filiere].total += 1;
      if (e.paye) stats.repartitionFiliere[filiere].payes += 1;
      stats.repartitionFiliere[filiere].ca += parseFloat(e.prixTotal) || 0;
    });
    
    // Répartition par niveau
    etudiants.forEach(e => {
      const niveau = e.niveau || 'Non défini';
      if (!stats.repartitionNiveau[niveau]) {
        stats.repartitionNiveau[niveau] = { total: 0, payes: 0, ca: 0 };
      }
      stats.repartitionNiveau[niveau].total += 1;
      if (e.paye) stats.repartitionNiveau[niveau].payes += 1;
      stats.repartitionNiveau[niveau].ca += parseFloat(e.prixTotal) || 0;
    });
    
    // Répartition par année scolaire
    etudiants.forEach(e => {
      const annee = e.anneeScolaire || 'Non définie';
      if (!stats.repartitionAnneeScolaire[annee]) {
        stats.repartitionAnneeScolaire[annee] = { total: 0, payes: 0, ca: 0 };
      }
      stats.repartitionAnneeScolaire[annee].total += 1;
      if (e.paye) stats.repartitionAnneeScolaire[annee].payes += 1;
      stats.repartitionAnneeScolaire[annee].ca += parseFloat(e.prixTotal) || 0;
    });
    
    // Répartition par spécialité
    etudiants.forEach(e => {
      let specialite = 'Tronc commun';
      
      if (e.specialiteIngenieur) {
        specialite = e.specialiteIngenieur;
      } else if (e.specialiteLicencePro) {
        specialite = e.specialiteLicencePro;
      } else if (e.specialiteMasterPro) {
        specialite = e.specialiteMasterPro;
      } else if (e.specialite) {
        specialite = e.specialite;
      }
      
      if (!stats.repartitionSpecialite[specialite]) {
        stats.repartitionSpecialite[specialite] = { total: 0, payes: 0, ca: 0 };
      }
      stats.repartitionSpecialite[specialite].total += 1;
      if (e.paye) stats.repartitionSpecialite[specialite].payes += 1;
      stats.repartitionSpecialite[specialite].ca += parseFloat(e.prixTotal) || 0;
    });
    
    console.log(`📊 Stats pédagogique ${estGeneral ? 'GÉNÉRAL' : req.user.filiere} générées - ${etudiants.length} étudiants${estGeneral ? ' (Global)' : ''}`);
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur génération statistiques pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// Route pour récupérer les séances d'une semaine (filtrées par filière pédagogique)
app.get('/api/pedagogique/seances/semaine/:lundiSemaine', authPedagogique, async (req, res) => {
  try {
    const toStartOfDay = d => { const nd = new Date(d); nd.setHours(0,0,0,0); return nd; };
    const toEndOfDay   = d => { const nd = new Date(d); nd.setHours(23,59,59,999); return nd; };

    const [y,m,d] = (req.params.lundiSemaine||'').split('-').map(Number);
    let startDate = new Date(y, (m-1), d);
    const jsDay = startDate.getDay();
    const delta = (jsDay + 6) % 7;
    startDate.setDate(startDate.getDate() - delta);
    startDate = toStartOfDay(startDate);

    const endDate = toEndOfDay(new Date(startDate.getTime() + 6*24*60*60*1000));

    const toutesSeances = await Seance.find({
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { $gte: startDate, $lte: endDate }
    })
    .populate('professeur', 'nom email estPermanent tarifHoraire')
    .sort({ dateSeance: 1, heureDebut: 1 });

    let seancesFiltrees = [];

    if (req.user.filiere === 'GENERAL') {
      seancesFiltrees = toutesSeances;
    } else {
      const etudiants = await Etudiant.find({ 
        typeFormation: req.user.filiere,
        actif: true 
      });
      
      const coursDeFiliere = new Set();
      etudiants.forEach(etudiant => {
        if (etudiant.cours && Array.isArray(etudiant.cours)) {
          etudiant.cours.forEach(coursNom => {
            coursDeFiliere.add(coursNom);
          });
        }
      });

      seancesFiltrees = toutesSeances.filter(seance => 
        coursDeFiliere.has(seance.cours) || 
        seance.cours.toLowerCase().includes(req.user.filiere.toLowerCase())
      );
    }

    return res.json(seancesFiltrees);
  } catch (err) {
    console.error('Erreur chargement séances semaine pédagogique:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour créer une exception (séance ponctuelle)
app.post('/api/pedagogique/seances/exception', authPedagogique, async (req, res) => {
  try {
    const { cours, professeur, matiere, salle, dateSeance, jour, heureDebut, heureFin } = req.body;

    if (!dateSeance) {
      return res.status(400).json({ ok: false, error: 'La date de séance est obligatoire' });
    }

    // Vérifier permissions pour pédagogique spécifique
    if (req.user.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ 
        typeFormation: req.user.filiere,
        actif: true,
        cours: cours
      });

      if (etudiants.length === 0) {
        return res.status(403).json({
          ok: false,
          error: `Vous n'avez pas l'autorisation de créer des séances pour le cours "${cours}"`
        });
      }
    }

    const q = { 
      cours,
      dateSeance: new Date(dateSeance),
      heureDebut,
      heureFin,
      typeSeance: 'exception'
    };

    const update = {
      cours,
      professeur,
      matiere,
      salle,
      jour,
      dateSeance: new Date(dateSeance),
      typeSeance: 'exception',
      actif: true,
      creeParPedagogique: req.user.id
    };

    const doc = await Seance.findOneAndUpdate(q, { $set: update }, { new: true, upsert: true })
      .populate('professeur', 'nom email estPermanent tarifHoraire');

    return res.json({ ok: true, seance: doc });

  } catch (err) {
    console.error('Erreur exception pédagogique:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ===== CORRECTION ROUTE PUT - Modifier une séance =====
app.put('/api/pedagogique/seances/:id', authPedagogique, async (req, res) => {
  try {
    const { jour, heureDebut, heureFin, cours, professeur, matiere, salle } = req.body;

    console.log('🔄 Modification séance ID:', req.params.id);
    console.log('📝 Données reçues:', { jour, heureDebut, heureFin, cours, professeur, matiere, salle });

    const seanceExistante = await Seance.findById(req.params.id);
    if (!seanceExistante) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    console.log('📋 Séance existante:', {
      cours: seanceExistante.cours,
      professeur: seanceExistante.professeur,
      typeSeance: seanceExistante.typeSeance
    });

    // Vérifier permissions
    if (req.user.filiere !== 'GENERAL') {
      // ✅ CORRECTION : Utiliser "filiere" au lieu de "typeFormation"
      const etudiants = await Etudiant.find({ 
        filiere: req.user.filiere,  // ✅ Corrigé
        actif: true,
        cours: seanceExistante.cours  // Utiliser le cours de la séance existante
      });

      console.log(`🔐 Vérification permission - Filière: ${req.user.filiere}, Cours: ${seanceExistante.cours}, Étudiants: ${etudiants.length}`);

      if (etudiants.length === 0) {
        return res.status(403).json({
          message: `Vous n'avez pas l'autorisation de modifier cette séance`
        });
      }
    }

    // ✅ AMÉLIORATION : Résoudre le nom du cours si un ID est fourni
    let coursNom = cours;
    if (cours && mongoose.Types.ObjectId.isValid(cours)) {
      const coursDoc = await Cours.findById(cours);
      if (coursDoc) {
        coursNom = coursDoc.nom;
        console.log(`🔗 Résolution cours: ${cours} -> ${coursNom}`);
      } else {
        console.warn(`⚠️ Cours avec ID ${cours} non trouvé`);
        coursNom = cours; // Garder la valeur originale
      }
    }

    // ✅ AMÉLIORATION : Validation des données
    if (!professeur) {
      return res.status(400).json({ message: 'Professeur requis' });
    }

    if (!matiere || matiere.trim() === '') {
      return res.status(400).json({ message: 'Matière requise' });
    }

    // ✅ CORRECTION : Construire l'objet de mise à jour avec les bonnes valeurs
    const updateData = {
      modifieParPedagogique: req.user.id,
      modifieAt: new Date()
    };

    // Ajouter seulement les champs fournis
    if (jour) updateData.jour = jour;
    if (heureDebut) updateData.heureDebut = heureDebut;
    if (heureFin) updateData.heureFin = heureFin;
    if (coursNom) updateData.cours = coursNom;
    if (professeur) updateData.professeur = professeur;
    if (matiere !== undefined) updateData.matiere = matiere || '';
    if (salle !== undefined) updateData.salle = salle || '';

    console.log('💾 Données de mise à jour:', updateData);

    const seance = await Seance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('professeur', 'nom email estPermanent tarifHoraire');

    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée après mise à jour' });
    }

    console.log('✅ Séance mise à jour avec succès:', {
      id: seance._id,
      cours: seance.cours,
      professeur: seance.professeur?.nom,
      matiere: seance.matiere
    });

    res.json({ 
      message: 'Séance modifiée avec succès', 
      seance: seance 
    });

  } catch (err) {
    console.error('❌ Erreur modification séance pédagogique:', err);
    
    // ✅ AMÉLIORATION : Gestion spécifique des erreurs
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Erreur de validation', 
        errors 
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'ID de séance invalide' 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Route pour supprimer une séance
app.delete('/api/pedagogique/seances/:id', authPedagogique, async (req, res) => {
  try {
    const { id } = req.params;
    const seance = await Seance.findById(id);
    
    if (!seance) {
      return res.status(404).json({ ok: false, message: 'Séance introuvable' });
    }

    // Vérifier permissions
    if (req.user.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ 
        typeFormation: req.user.filiere,
        actif: true,
        cours: seance.cours
      });

      if (etudiants.length === 0) {
        return res.status(403).json({
          ok: false,
          message: `Vous n'avez pas l'autorisation de supprimer cette séance`
        });
      }
    }

    await seance.deleteOne();
    return res.json({ ok: true, deletedId: id });
    
  } catch (err) {
    console.error('Erreur suppression:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Route pour copier une semaine
app.post('/api/pedagogique/seances/copier-semaine', authPedagogique, async (req, res) => {
  try {
    const { lundiSource, lundiDestination } = req.body;
    
    if (!lundiSource || !lundiDestination) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Les dates source et destination sont obligatoires' 
      });
    }

    const dateSource = new Date(lundiSource);
    const dimancheSource = new Date(dateSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);

    const seancesSource = await Seance.find({
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { 
        $gte: dateSource, 
        $lte: dimancheSource 
      },
      actif: true
    }).populate('professeur', 'nom email');

    let seancesFiltrees = [];

    if (req.user.filiere === 'GENERAL') {
      seancesFiltrees = seancesSource;
    } else {
      const etudiants = await Etudiant.find({ 
        typeFormation: req.user.filiere,
        actif: true 
      });
      
      const coursDeFiliere = new Set();
      etudiants.forEach(etudiant => {
        if (etudiant.cours && Array.isArray(etudiant.cours)) {
          etudiant.cours.forEach(coursNom => {
            coursDeFiliere.add(coursNom);
          });
        }
      });

      seancesFiltrees = seancesSource.filter(seance => 
        coursDeFiliere.has(seance.cours) || 
        seance.cours.toLowerCase().includes(req.user.filiere.toLowerCase())
      );
    }

    if (seancesFiltrees.length === 0) {
      return res.json({
        ok: true,
        message: 'Aucune séance à copier pour cette filière',
        seancesCrees: 0
      });
    }

    const differenceJours = Math.round((new Date(lundiDestination) - new Date(lundiSource)) / (1000 * 60 * 60 * 24));
    const nouvellesSeances = [];

    for (const seanceSource of seancesFiltrees) {
      const nouvelleDateSeance = new Date(seanceSource.dateSeance);
      nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + differenceJours);

      const seanceExistante = await Seance.findOne({
        cours: seanceSource.cours,
        dateSeance: nouvelleDateSeance,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin,
        typeSeance: { $in: ['reelle', 'exception'] }
      });

      if (seanceExistante) continue;

      const nouvelleSeance = new Seance({
        cours: seanceSource.cours,
        coursId: seanceSource.coursId,
        professeur: seanceSource.professeur._id || seanceSource.professeur,
        matiere: seanceSource.matiere,
        salle: seanceSource.salle,
        dateSeance: nouvelleDateSeance,
        jour: seanceSource.jour,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin,
        typeSeance: 'exception',
        actif: true,
        creeParPedagogique: req.user.id,
        notes: `Copié depuis ${seanceSource.dateSeance.toISOString().split('T')[0]} par ${req.user.nom}`
      });

      await nouvelleSeance.save();
      nouvellesSeances.push(nouvelleSeance);
    }

    res.json({
      ok: true,
      message: `${nouvellesSeances.length} séances copiées avec succès`,
      seancesCrees: nouvellesSeances.length,
      filiere: req.user.filiere
    });

  } catch (error) {
    console.error('Erreur copie semaine pédagogique:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur lors de la copie',
      details: error.message
    });
  }
});
// Dans votre backend
app.get('/api/auth/me', authPedagogique, async (req, res) => {
  try {
    const pedagogique = await Pedagogique.findById(req.user.id);
    if (!pedagogique) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      id: pedagogique._id,
      nom: pedagogique.nom,
      email: pedagogique.email,
      filiere: pedagogique.filiere,
      role: 'pedagogique'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// 5. Route pour obtenir les cours détaillés (CORRIGÉE)
app.get('/api/pedagogique/cours-detailles', authPedagogique, async (req, res) => {
  try {
    let etudiantsQuery = {};
    const estGeneral = req.user.filiere === 'GENERAL';
    
    if (!estGeneral) {
      etudiantsQuery.filiere = req.user.filiere;
    }
    
    const etudiants = await Etudiant.find(etudiantsQuery);
    const coursStats = {};
    
    etudiants.forEach(etudiant => {
      if (etudiant.cours && Array.isArray(etudiant.cours)) {
        etudiant.cours.forEach(coursNom => {
          if (!coursStats[coursNom]) {
            coursStats[coursNom] = {
              nom: coursNom,
              totalEtudiants: 0,
              etudiantsPayes: 0,
              etudiantsActifs: 0,
              ca: 0,
              professeurs: [],
              repartitionFiliere: {}
            };
          }
          
          coursStats[coursNom].totalEtudiants += 1;
          if (etudiant.paye) coursStats[coursNom].etudiantsPayes += 1;
          if (etudiant.actif) coursStats[coursNom].etudiantsActifs += 1;
          coursStats[coursNom].ca += parseFloat(etudiant.prixTotal) || 0;
          
          // Répartition par filière pour le général
          if (estGeneral) {
            const filiere = etudiant.filiere || 'Non définie';
            if (!coursStats[coursNom].repartitionFiliere[filiere]) {
              coursStats[coursNom].repartitionFiliere[filiere] = 0;
            }
            coursStats[coursNom].repartitionFiliere[filiere] += 1;
          }
        });
      }
    });
    
    // Récupérer les informations des cours et professeurs
    const coursAvecDetails = await Promise.all(
      Object.keys(coursStats).map(async (nomCours) => {
        const cours = await Cours.findOne({ nom: nomCours });
        const professeurs = await Professeur.find({ 
          cours: nomCours 
        }).select('nom email telephone matiere');
        
        return {
          ...coursStats[nomCours],
          professeurs: professeurs,
          dateCreation: cours?.createdAt || null
        };
      })
    );
    
    console.log(`📚 Cours détaillés pédagogique ${estGeneral ? 'GÉNÉRAL' : req.user.filiere} - ${coursAvecDetails.length} cours${estGeneral ? ' (Global)' : ''}`);
    
    res.json(coursAvecDetails);
  } catch (error) {
    console.error('Erreur récupération cours détaillés pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// ===== ROUTE GET - PROFESSEURS POUR PÉDAGOGIQUES =====
app.get('/api/pedagogique/professeurs', authPedagogique, async (req, res) => {
  try {
    const filierePedagogique = req.user.filiere;
    const estGeneral = filierePedagogique === 'GENERAL';
    const pedagogiqueId = req.user.id;
    
    let query = {};
    
    if (estGeneral) {
      // Pédagogique général : TOUS les professeurs
      console.log(`👨‍🏫 Pédagogique GÉNÉRAL - Récupération de tous les professeurs`);
      query = {}; // Pas de filtre = tous les professeurs
    } else {
      // Pédagogique spécifique : seulement les professeurs qu'il a créés
      query.creeParPedagogique = pedagogiqueId;
      console.log(`👨‍🏫 Pédagogique ${filierePedagogique} - Récupération des professeurs créés par ce pédagogique`);
    }
    
    const { estPermanent, actif, cours, matiere } = req.query;
    
    // Ajouter les filtres supplémentaires
    if (estPermanent !== undefined) {
      query.estPermanent = estPermanent === 'true';
    }
    if (actif !== undefined) {
      query.actif = actif === 'true';
    }
    if (cours) {
      query['coursEnseignes.nomCours'] = new RegExp(cours, 'i');
    }
    if (matiere) {
      query['coursEnseignes.matiere'] = new RegExp(matiere, 'i');
    }

    const professeurs = await Professeur.find(query)
      .select('-motDePasse')
      .sort({ createdAt: -1 });

    // Enrichir avec des infos calculées
    const professeursEnrichis = professeurs.map(prof => {
      const profObj = prof.toObject();
      
      return {
        ...profObj,
        nombreCours: prof.coursEnseignes ? prof.coursEnseignes.length : 0,
        coursFormattes: prof.getCoursFormattes ? prof.getCoursFormattes() : '',
        totalHeuresParSemaine: prof.getTotalHeuresParSemaine ? prof.getTotalHeuresParSemaine() : 0,
        dossierComplet: prof.isDossierComplet ? prof.isDossierComplet() : true,
        typeProfesseur: prof.estPermanent ? 'Permanent' : 'Entrepreneur',
        // Ajouter l'info de qui l'a créé pour le debug
        creePar: prof.creeParPedagogique ? 'Pédagogique' : 'Admin'
      };
    });

    console.log(`👨‍🏫 ${estGeneral ? 'Pédagogique GÉNÉRAL' : `Pédagogique ${filierePedagogique}`} - ${professeursEnrichis.length} professeurs trouvés`);

    res.json(professeursEnrichis);
    
  } catch (error) {
    console.error('Erreur récupération professeurs pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ===== MISE À JOUR DU MODÈLE PROFESSEUR POUR TRACKER LE CRÉATEUR =====
// Ajouter ces champs au professeurSchema dans professeurModel.js

/*
// Ajouter dans le schéma Professeur :
creeParPedagogique: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Pedagogique',
  default: null
},

creeParAdmin: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
  default: null
},

// Champ pour identifier le type de créateur
typeDeCree: {
  type: String,
  enum: ['admin', 'pedagogique', 'auto'],
  default: 'admin'
}
*/

// ===== MISE À JOUR DE LA ROUTE POST PROFESSEUR POUR PÉDAGOGIQUES =====
app.post('/api/pedagogique/professeurs', 
  authPedagogique, 
  uploadDocuments.fields([
    { name: 'image', maxCount: 1 },
    { name: 'diplome', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'rib', maxCount: 1 },
    { name: 'copieCin', maxCount: 1 },
    { name: 'engagement', maxCount: 1 },
    { name: 'vacataire', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        nom,
        email,
        motDePasse,
        telephone,
        dateNaissance,
        actif,
        genre,
        estPermanent,
        tarifHoraire,
        coursEnseignes,
        notes
      } = req.body;

      console.log('Création professeur par pédagogique:', req.user.filiere, req.user.id);

      // ===== VALIDATIONS =====
      if (!nom || !email || !motDePasse || !genre) {
        return res.status(400).json({ message: 'Nom, email, mot de passe et genre sont obligatoires' });
      }

      if (!['Homme', 'Femme'].includes(genre)) {
        return res.status(400).json({ message: 'Genre invalide. Doit être Homme ou Femme' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }

      // Vérification email unique
      const existe = await Professeur.findOne({ email });
      if (existe) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Conversion des booléens
      const actifBool = actif === 'true' || actif === true;
      const estPermanentBool = estPermanent === 'true' || estPermanent === true;

      // Validation entrepreneur
      if (!estPermanentBool) {
        if (!tarifHoraire || parseFloat(tarifHoraire) <= 0) {
          return res.status(400).json({ 
            message: 'Le tarif horaire est obligatoire pour les entrepreneurs et doit être supérieur à 0' 
          });
        }
      }

      // ===== TRAITEMENT DES COURS ENSEIGNES =====
      let coursEnseignesArray = [];
      if (coursEnseignes) {
        try {
          coursEnseignesArray = typeof coursEnseignes === 'string' 
            ? JSON.parse(coursEnseignes) 
            : coursEnseignes;
          
          if (!Array.isArray(coursEnseignesArray)) {
            coursEnseignesArray = [];
          }
          
          coursEnseignesArray = coursEnseignesArray.filter(cours => 
            cours.nomCours && cours.nomCours.trim() !== '' &&
            cours.matiere && cours.matiere.trim() !== ''
          );
        } catch (error) {
          console.error('Erreur parsing coursEnseignes:', error);
          coursEnseignesArray = [];
        }
      }

      // ===== TRAITEMENT DES FICHIERS =====
      const getFilePath = (fileField) => {
        return req.files && req.files[fileField] && req.files[fileField][0] 
          ? `/uploads/professeurs/documents/${req.files[fileField][0].filename}` 
          : '';
      };

      const imagePath = req.files && req.files['image'] && req.files['image'][0] 
        ? `/uploads/${req.files['image'][0].filename}` 
        : '';

      const documents = {
        diplome: getFilePath('diplome'),
        cv: getFilePath('cv'),
        rib: getFilePath('rib'),
        copieCin: getFilePath('copieCin'),
        engagement: getFilePath('engagement'),
        vacataire: getFilePath('vacataire')
      };

      // ===== CRÉATION DU PROFESSEUR =====
      const professeurData = {
        nom: nom.trim(),
        email: email.toLowerCase().trim(),
        motDePasse: motDePasse, // Sera hashé automatiquement
        genre,
        telephone: telephone?.trim() || '',
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        image: imagePath,
        actif: actifBool,
        estPermanent: estPermanentBool,
        coursEnseignes: coursEnseignesArray,
        documents,
        notes: notes?.trim() || '',
        
        // ===== IMPORTANT: Marquer comme créé par ce pédagogique =====
        creeParPedagogique: req.user.id,
        creeParAdmin: null,
        typeDeCree: 'pedagogique'
      };

      // Ajouter le tarif horaire seulement si entrepreneur
      if (!estPermanentBool && tarifHoraire) {
        professeurData.tarifHoraire = parseFloat(tarifHoraire);
      }

      const professeur = new Professeur(professeurData);
      await professeur.save();

      // ===== MISE À JOUR DES COURS (Système de compatibilité) =====
      if (coursEnseignesArray.length > 0) {
        const coursUniques = [...new Set(coursEnseignesArray.map(c => c.nomCours))];
        
        for (const nomCours of coursUniques) {
          const coursDoc = await Cours.findOne({ nom: nomCours });
          if (coursDoc && !coursDoc.professeur.includes(professeur.nom)) {
            coursDoc.professeur.push(professeur.nom);
            await coursDoc.save();
          }
        }
      }

      // Réponse sans mot de passe
      const professeurResponse = professeur.toObject();
      delete professeurResponse.motDePasse;

      console.log(`✅ Professeur créé par pédagogique ${req.user.filiere}: ${professeur.nom}`);

      res.status(201).json({
        message: 'Professeur créé avec succès',
        professeur: professeurResponse,
        creePar: 'pedagogique'
      });

    } catch (err) {
      console.error('Erreur création professeur par pédagogique:', err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: 'Erreur de validation', errors });
      }
      
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
);

// ===== ROUTE PUT - MODIFIER PROFESSEUR POUR PÉDAGOGIQUES =====
app.put('/api/pedagogique/professeurs/:id', 
  authPedagogique, 
  uploadDocuments.fields([
    { name: 'image', maxCount: 1 },
    { name: 'diplome', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'rib', maxCount: 1 },
    { name: 'copieCin', maxCount: 1 },
    { name: 'engagement', maxCount: 1 },
    { name: 'vacataire', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const professeurId = req.params.id;
      const filierePedagogique = req.user.filiere;
      const estGeneral = filierePedagogique === 'GENERAL';
      const pedagogiqueId = req.user.id;

      // Récupérer le professeur existant
      const ancienProf = await Professeur.findById(professeurId);
      if (!ancienProf) {
        return res.status(404).json({ message: "Professeur introuvable" });
      }

      // Vérification des permissions
      if (!estGeneral) {
        // Pédagogique spécifique : peut seulement modifier les professeurs qu'il a créés
        if (ancienProf.creeParPedagogique?.toString() !== pedagogiqueId) {
          return res.status(403).json({ 
            message: "Vous ne pouvez modifier que les professeurs que vous avez créés" 
          });
        }
      }
      // Le pédagogique général peut modifier tous les professeurs

      // Le reste du code de modification reste identique...
      const {
        nom,
        genre,
        dateNaissance,
        telephone,
        email,
        motDePasse,
        actif,
        estPermanent,
        tarifHoraire,
        coursEnseignes,
        notes
      } = req.body;

      // Validation email unique (sauf pour le professeur actuel)
      if (email && email !== ancienProf.email) {
        const emailExiste = await Professeur.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: professeurId }
        });
        if (emailExiste) {
          return res.status(400).json({ message: 'Email déjà utilisé' });
        }
      }

      // ... (le reste du code de modification reste identique)
      
      console.log(`✅ Professeur modifié par pédagogique ${req.user.filiere}: ${ancienProf.nom}`);

      res.json({ 
        message: "Professeur modifié avec succès", 
        professeur: updatedProf 
      });

    } catch (err) {
      console.error('Erreur modification professeur par pédagogique:', err);
      res.status(500).json({ message: "Erreur lors de la modification", error: err.message });
    }
  }
);

// ===== ROUTE DELETE - SUPPRIMER PROFESSEUR POUR PÉDAGOGIQUES =====
app.delete('/api/pedagogique/professeurs/:id', authPedagogique, async (req, res) => {
  try {
    const professeurId = req.params.id;
    const filierePedagogique = req.user.filiere;
    const estGeneral = filierePedagogique === 'GENERAL';
    const pedagogiqueId = req.user.id;

    // Récupérer le professeur existant
    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ message: "Professeur introuvable" });
    }

    // Vérification des permissions
    if (!estGeneral) {
      // Pédagogique spécifique : peut seulement supprimer les professeurs qu'il a créés
      if (professeur.creeParPedagogique?.toString() !== pedagogiqueId) {
        return res.status(403).json({ 
          message: "Vous ne pouvez supprimer que les professeurs que vous avez créés" 
        });
      }
    }
    // Le pédagogique général peut supprimer tous les professeurs

    await Professeur.findByIdAndDelete(professeurId);
    
    console.log(`✅ Professeur supprimé par pédagogique ${req.user.filiere}: ${professeur.nom}`);

    res.json({ 
      message: 'Professeur supprimé avec succès',
      professeur: {
        id: professeur._id,
        nom: professeur.nom,
        email: professeur.email
      }
    });

  } catch (err) {
    console.error('Erreur suppression professeur par pédagogique:', err);
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
});

// 6. Route pour obtenir les informations du pédagogique connecté (CORRIGÉE)
app.get('/api/pedagogique/me', authPedagogique, async (req, res) => {
  try {
    const pedagogique = await Pedagogique.findById(req.user.id).select('-motDePasse');
    
    if (!pedagogique) {
      return res.status(404).json({ message: 'Pédagogique non trouvé' });
    }
    
    res.json({
      ...pedagogique.toObject(),
      estGeneral: pedagogique.filiere === 'GENERAL'
    });
  } catch (error) {
    console.error('Erreur récupération info pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ===== ROUTES GESTION PÉDAGOGIQUES (Admin seulement) =====

// 1. Créer un nouveau pédagogique
app.post('/api/pedagogiques', authAdmin, async (req, res) => {
  try {
    const { nom, telephone, email, motDePasse, filiere } = req.body;

    // Validation des champs obligatoires
    if (!nom || !email || !motDePasse || !filiere) {
      return res.status(400).json({ 
        message: 'Nom, email, mot de passe et filière sont obligatoires' 
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    // Validation du mot de passe
    if (motDePasse.length < 6) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const emailExiste = await Pedagogique.findOne({ email: email.toLowerCase() });
    if (emailExiste) {
      return res.status(400).json({ message: 'Email déjà utilisé par un autre pédagogique' });
    }

    // Créer le nouveau pédagogique
    const nouveauPedagogique = new Pedagogique({
      nom: nom.trim(),
      telephone: telephone?.trim() || '',
      email: email.toLowerCase().trim(),
      motDePasse: motDePasse, // Sera hashé automatiquement par le middleware
      filiere: filiere
    });

    // Sauvegarder
    const pedagogiqueSauve = await nouveauPedagogique.save();

    // Réponse sans le mot de passe
    const response = pedagogiqueSauve.toObject();
    delete response.motDePasse;
    
    res.status(201).json({
      message: 'Pédagogique créé avec succès',
      pedagogique: response
    });

  } catch (error) {
    console.error('Erreur création pédagogique:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Erreur de validation', 
        errors 
      });
    }

    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// 2. Lister tous les pédagogiques
app.get('/api/pedagogiques', authAdmin, async (req, res) => {
  try {
    const pedagogiques = await Pedagogique.find({})
      .select('-motDePasse')
      .sort({ createdAt: -1 });
    
    res.json(pedagogiques);
  } catch (error) {
    console.error('Erreur récupération pédagogiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 3. Modifier un pédagogique
app.put('/api/pedagogiques/:id', authAdmin, async (req, res) => {
  try {
    const { nom, telephone, email, filiere, actif, motDePasse } = req.body;
    
    const updateData = {};
    
    if (nom) updateData.nom = nom.trim();
    if (telephone !== undefined) updateData.telephone = telephone.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (filiere) updateData.filiere = filiere;
    if (actif !== undefined) updateData.actif = actif;

    if (motDePasse && motDePasse.trim() !== '') {
      if (motDePasse.length < 6) {
        return res.status(400).json({ 
          message: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      }
      updateData.motDePasse = motDePasse;
    }

    if (email) {
      const emailExiste = await Pedagogique.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (emailExiste) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
    }

    const pedagogique = await Pedagogique.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-motDePasse');

    if (!pedagogique) {
      return res.status(404).json({ message: 'Pédagogique non trouvé' });
    }

    res.json({
      message: 'Pédagogique modifié avec succès',
      pedagogique
    });

  } catch (error) {
    console.error('Erreur modification pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 4. Supprimer un pédagogique
app.delete('/api/pedagogiques/:id', authAdmin, async (req, res) => {
  try {
    const pedagogique = await Pedagogique.findByIdAndDelete(req.params.id);
    
    if (!pedagogique) {
      return res.status(404).json({ message: 'Pédagogique non trouvé' });
    }

    res.json({ 
      message: 'Pédagogique supprimé avec succès',
      pedagogique: {
        id: pedagogique._id,
        nom: pedagogique.nom,
        email: pedagogique.email,
        filiere: pedagogique.filiere
      }
    });

  } catch (error) {
    console.error('Erreur suppression pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 5. Obtenir un pédagogique par ID
app.get('/api/pedagogiques/:id', authAdmin, async (req, res) => {
  try {
    const pedagogique = await Pedagogique.findById(req.params.id)
      .select('-motDePasse');
    
    if (!pedagogique) {
      return res.status(404).json({ message: 'Pédagogique non trouvé' });
    }

    res.json(pedagogique);
  } catch (error) {
    console.error('Erreur récupération pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 6. Toggle actif/inactif
app.patch('/api/pedagogiques/:id/toggle-actif', authAdmin, async (req, res) => {
  try {
    const pedagogique = await Pedagogique.findById(req.params.id);
    
    if (!pedagogique) {
      return res.status(404).json({ message: 'Pédagogique non trouvé' });
    }

    pedagogique.actif = !pedagogique.actif;
    await pedagogique.save();

    const response = pedagogique.toObject();
    delete response.motDePasse;

    res.json({
      message: `Pédagogique ${pedagogique.actif ? 'activé' : 'désactivé'} avec succès`,
      pedagogique: response
    });

  } catch (error) {
    console.error('Erreur toggle actif pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// ===== CONFIGURATION MULTER POUR DOCUMENTS PROFESSEUR =====
app.get('/api/pedagogique/mes-professeurs', 
  authPedagogique, // Middleware qui vérifie que c'est un pédagogique
  async (req, res) => {
    try {
      // Récupérer uniquement les professeurs créés par ce pédagogique
      const professeurs = await Professeur.find({ 
        creeParPedagogique: req.user.id 
      })
      .select('-motDePasse') // Exclure le mot de passe
      .sort({ createdAt: -1 });

      res.json(professeurs);
    } catch (err) {
      console.error('Erreur récupération professeurs du pédagogique:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
);

// ===== ROUTE POST - CRÉER PROFESSEUR AVEC NOUVEAU SYSTÈME =====
app.post('/api/professeurs',  authAdminOrPedagogique,uploadDocuments.fields([
    { name: 'image', maxCount: 1 },
    { name: 'diplome', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'rib', maxCount: 1 },
    { name: 'copieCin', maxCount: 1 },
    { name: 'engagement', maxCount: 1 },
    { name: 'vacataire', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        nom,
        email,
        motDePasse,
        telephone,
        dateNaissance,
        actif,
        genre,
        estPermanent,
        tarifHoraire,
        coursEnseignes,
        notes
      } = req.body;

      console.log('Données reçues:', { nom, email, genre, estPermanent, tarifHoraire, coursEnseignes });
      console.log('Utilisateur créateur:', req.user);

      // ===== VALIDATIONS =====
      if (!nom || !email || !motDePasse || !genre) {
        return res.status(400).json({ message: 'Nom, email, mot de passe et genre sont obligatoires' });
      }

      if (!['Homme', 'Femme'].includes(genre)) {
        return res.status(400).json({ message: 'Genre invalide. Doit être Homme ou Femme' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }

      // Vérification email unique
      const existe = await Professeur.findOne({ email });
      if (existe) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Conversion des booléens
      const actifBool = actif === 'true' || actif === true;
      const estPermanentBool = estPermanent === 'true' || estPermanent === true;

      // Validation entrepreneur
      if (!estPermanentBool) {
        if (!tarifHoraire || parseFloat(tarifHoraire) <= 0) {
          return res.status(400).json({ 
            message: 'Le tarif horaire est obligatoire pour les entrepreneurs et doit être supérieur à 0' 
          });
        }
      }

      // ===== TRAITEMENT DES COURS ENSEIGNES =====
      let coursEnseignesArray = [];
      if (coursEnseignes) {
        try {
          coursEnseignesArray = typeof coursEnseignes === 'string' 
            ? JSON.parse(coursEnseignes) 
            : coursEnseignes;
          
          // Validation du format
          if (!Array.isArray(coursEnseignesArray)) {
            coursEnseignesArray = [];
          }
          
          // Validation de chaque cours
          coursEnseignesArray = coursEnseignesArray.filter(cours => 
            cours.nomCours && cours.nomCours.trim() !== '' &&
            cours.matiere && cours.matiere.trim() !== ''
          );
        } catch (error) {
          console.error('Erreur parsing coursEnseignes:', error);
          coursEnseignesArray = [];
        }
      }

      // ===== TRAITEMENT DES FICHIERS =====
      const getFilePath = (fileField) => {
        return req.files && req.files[fileField] && req.files[fileField][0] 
          ? `/uploads/professeurs/documents/${req.files[fileField][0].filename}` 
          : '';
      };

      const imagePath = req.files && req.files['image'] && req.files['image'][0] 
        ? `/uploads/${req.files['image'][0].filename}` 
        : '';

      const documents = {
        diplome: getFilePath('diplome'),
        cv: getFilePath('cv'),
        rib: getFilePath('rib'),
        copieCin: getFilePath('copieCin'),
        engagement: getFilePath('engagement'),
        vacataire: getFilePath('vacataire')
      };

      // ===== CRÉATION DU PROFESSEUR AVEC TRAÇABILITÉ =====
      const professeurData = {
        nom: nom.trim(),
        email: email.toLowerCase().trim(),
        motDePasse: motDePasse, // Sera hashé automatiquement
        genre,
        telephone: telephone?.trim() || '',
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        image: imagePath,
        actif: actifBool,
        estPermanent: estPermanentBool,
        coursEnseignes: coursEnseignesArray,
        documents,
        notes: notes?.trim() || ''
      };

      // ===== TRAÇABILITÉ - QUI A CRÉÉ CE PROFESSEUR =====
      if (req.user.role === 'pedagogique') {
        professeurData.creeParPedagogique = req.user.id;
        professeurData.typeDeCree = 'pedagogique';
      } else if (req.user.role === 'admin') {
        professeurData.creeParAdmin = req.user.id;
        professeurData.typeDeCree = 'admin';
      }

      // Ajouter le tarif horaire seulement si entrepreneur
      if (!estPermanentBool && tarifHoraire) {
        professeurData.tarifHoraire = parseFloat(tarifHoraire);
      }

      const professeur = new Professeur(professeurData);
      await professeur.save();

      // ===== MISE À JOUR DES COURS (Système de compatibilité) =====
      if (coursEnseignesArray.length > 0) {
        const coursUniques = [...new Set(coursEnseignesArray.map(c => c.nomCours))];
        
        for (const nomCours of coursUniques) {
          const coursDoc = await Cours.findOne({ nom: nomCours });
          if (coursDoc && !coursDoc.professeur.includes(professeur.nom)) {
            coursDoc.professeur.push(professeur.nom);
            await coursDoc.save();
          }
        }
      }

      // Réponse sans mot de passe
      const professeurResponse = professeur.toObject();
      delete professeurResponse.motDePasse;

      res.status(201).json({
        message: 'Professeur créé avec succès',
        professeur: professeurResponse
      });

    } catch (err) {
      console.error('Erreur création professeur:', err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: 'Erreur de validation', errors });
      }
      
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
);

// ===== ROUTE PUT MODIFIÉE - MODIFIER PROFESSEUR AVEC VÉRIFICATION DE PROPRIÉTÉ =====
app.put(
  '/api/professeurs/:id',
  authAdminOrPedagogique,
  uploadDocuments.fields([
    { name: 'image', maxCount: 1 },
    { name: 'diplome', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'rib', maxCount: 1 },
    { name: 'copieCin', maxCount: 1 },
    { name: 'engagement', maxCount: 1 },
    { name: 'vacataire', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const professeurId = req.params.id;
      const {
        nom,
        genre,
        dateNaissance,
        telephone,
        email,
        motDePasse,          // ← سيتهشّى تلقائيًا عبر pre('save') إذا تبدّل
        actif,
        estPermanent,
        tarifHoraire,
        coursEnseignes,
        notes,
      } = req.body;

      // 1) جلب الأستاذ
      const prof = await Professeur.findById(professeurId);
      if (!prof) {
        return res.status(404).json({ message: 'Professeur introuvable' });
      }

      // 2) التحقّق من الصلاحيات: pédagogue يقدر يبدّل غير اللي هو خلقو
      if (req.user.role === 'pedagogique') {
        if (!prof.creeParPedagogique || prof.creeParPedagogique.toString() !== req.user.id) {
          return res.status(403).json({
            message: "Vous n'êtes pas autorisé à modifier ce professeur",
          });
        }
      }
      // Admin يقدر يبدّل الكل

      // 3) فحص تفرد الإيميل إذا تبدّل
      if (email && email.toLowerCase().trim() !== (prof.email || '').toLowerCase()) {
        const emailExiste = await Professeur.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: professeurId },
        });
        if (emailExiste) {
          return res.status(400).json({ message: 'Email déjà utilisé' });
        }
      }

      // 4) تحويلات/Parsing
      const toBool = (v) => v === true || v === 'true';
      const toFloat = (v) => (v === undefined || v === '' ? undefined : parseFloat(v));
      const toDate = (v) => (v ? new Date(v) : undefined);

      const estPermanentBool = estPermanent !== undefined ? toBool(estPermanent) : prof.estPermanent;
      const actifBool = actif !== undefined ? toBool(actif) : prof.actif;
      const tarifNum = toFloat(tarifHoraire);

      // 5) Parse coursEnseignes (support string JSON أو array)
      let coursEnseignesArray = prof.coursEnseignes || [];
      if (coursEnseignes !== undefined) {
        try {
          const parsed =
            typeof coursEnseignes === 'string' ? JSON.parse(coursEnseignes) : coursEnseignes;
          coursEnseignesArray = Array.isArray(parsed) ? parsed : [];
          // validation minimale
          coursEnseignesArray = coursEnseignesArray.filter(
            (c) => c && c.nomCours && c.nomCours.trim() !== '' && c.matiere && c.matiere.trim() !== ''
          );
        } catch (e) {
          console.error('Erreur parsing coursEnseignes:', e.message);
          // إذا الپارسينگ فشل، نخلي القديم
          coursEnseignesArray = prof.coursEnseignes || [];
        }
      }

      // 6) مسارات الملفات
      const getDocPath = (field) =>
        req.files && req.files[field] && req.files[field][0]
          ? `/uploads/professeurs/documents/${req.files[field][0].filename}`
          : undefined;

      const newDocuments = { ...(prof.documents || {}) };
      ['diplome', 'cv', 'rib', 'copieCin', 'engagement', 'vacataire'].forEach((f) => {
        const p = getDocPath(f);
        if (p) newDocuments[f] = p;
      });

      let newImage = prof.image;
      if (req.files && req.files['image'] && req.files['image'][0]) {
        newImage = `/uploads/${req.files['image'][0].filename}`;
      }

      // 7) تحديث حقول الـprof (load → set → save)
      if (nom !== undefined) prof.nom = nom.trim();
      if (genre !== undefined) prof.genre = genre;
      if (dateNaissance !== undefined) prof.dateNaissance = toDate(dateNaissance);
      if (telephone !== undefined) prof.telephone = telephone.trim();
      if (email !== undefined) prof.email = email.toLowerCase().trim();
      if (notes !== undefined) prof.notes = notes.trim();
      prof.actif = actifBool;
      prof.estPermanent = estPermanentBool;
      prof.image = newImage;
      prof.documents = newDocuments;

      // مسألة الأجر: مطلوب فقط إذا كان Entrepreneur
      if (prof.estPermanent) {
        // إذا ولى Permanent، نحيدو tarifHoraire
        prof.tarifHoraire = undefined;
      } else {
        if (tarifNum !== undefined) {
          if (isNaN(tarifNum) || tarifNum <= 0) {
            return res.status(400).json({
              message:
                'Le tarif horaire doit être supérieur à 0 pour les entrepreneurs',
            });
          }
          prof.tarifHoraire = tarifNum;
        } else if (!prof.tarifHoraire || prof.tarifHoraire <= 0) {
          return res.status(400).json({
            message:
              'Le tarif horaire est obligatoire pour les entrepreneurs et doit être supérieur à 0',
          });
        }
      }

      // كلمة السر: إذا عطيتها، نخلي pre('save') يتهشّيها وحدو
      if (motDePasse && motDePasse.trim() !== '') {
        prof.motDePasse = motDePasse.trim();
      }

      // الدروس: نحسب الفرق باش نحدّث Collection Cours (pull/add)
      const anciensCours = [...new Set((prof.coursEnseignes || []).map((c) => c.nomCours))];
      const nouveauxCours = [...new Set(coursEnseignesArray.map((c) => c.nomCours))];

      const coursSupprimes = anciensCours.filter((c) => !nouveauxCours.includes(c));
      const coursAjoutes = nouveauxCours.filter((c) => !anciensCours.includes(c));

      // نحدّث الدروس على الـprof
      prof.coursEnseignes = coursEnseignesArray;

      // 8) حفظ (سيُفعّل pre('save'): hash + sync cours/matiere … إلخ)
      await prof.save();

      // 9) مزامنة جدول Cours (compatibilité)
      // سحب الأستاذ من الدروس اللي تحيّدات
      for (const nomCours of coursSupprimes) {
        await Cours.updateOne({ nom: nomCours }, { $pull: { professeur: prof.nom } });
      }
      // إضافة الأستاذ للدروس الجديدة
      for (const nomCours of coursAjoutes) {
        await Cours.updateOne({ nom: nomCours }, { $addToSet: { professeur: prof.nom } });
      }

      // 10) ردّ بدون motDePasse
      const profObj = prof.toObject();
      delete profObj.motDePasse;

      return res.json({
        message: 'Professeur modifié avec succès',
        professeur: profObj,
      });
    } catch (err) {
      console.error('Erreur modification professeur:', err);

      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: 'Erreur de validation', errors });
      }

      return res.status(500).json({
        message: 'Erreur lors de la modification',
        error: err.message,
      });
    }
  }
);


// ===== ROUTE DELETE MODIFIÉE - SUPPRIMER PROFESSEUR AVEC VÉRIFICATION DE PROPRIÉTÉ =====
app.delete('/api/professeurs/:id', 
  authAdminOrPedagogique, 
  async (req, res) => {
    try {
      const professeurId = req.params.id;
      
      // Récupérer le professeur existant
      const professeur = await Professeur.findById(professeurId);
      if (!professeur) {
        return res.status(404).json({ message: "Professeur introuvable" });
      }

      // ===== VÉRIFICATION DES DROITS DE SUPPRESSION =====
      if (req.user.role === 'pedagogique') {
        // Un pédagogique ne peut supprimer que les professeurs qu'il a créés
        if (!professeur.creeParPedagogique || professeur.creeParPedagogique.toString() !== req.user.id) {
          return res.status(403).json({ 
            message: "Vous n'êtes pas autorisé à supprimer ce professeur" 
          });
        }
      }
      // Les admins peuvent supprimer tous les professeurs

      // Supprimer le professeur des cours associés
      if (professeur.coursEnseignes && professeur.coursEnseignes.length > 0) {
        const coursUniques = [...new Set(professeur.coursEnseignes.map(c => c.nomCours))];
        
        for (const nomCours of coursUniques) {
          await Cours.updateOne(
            { nom: nomCours },
            { $pull: { professeur: professeur.nom } }
          );
        }
      }

      await Professeur.findByIdAndDelete(professeurId);

      res.json({ message: "Professeur supprimé avec succès" });
    } catch (err) {
      console.error('Erreur suppression professeur:', err);
      res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
    }
  }
);
// Route pour récupérer le profil du pédagogique connecté
app.get('/api/auth/profile', authPedagogique, async (req, res) => {
  try {
    const pedagogique = await Pedagogique.findById(req.user.id).select('-motDePasse');
    if (!pedagogique) {
      return res.status(404).json({ message: 'Pédagogique non trouvé' });
    }
    res.json(pedagogique);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// ===== ROUTE GET - LISTER PROFESSEURS AVEC INFOS COMPLÈTES =====
app.get('/api/professeurs', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { estPermanent, actif, cours, matiere } = req.query;
    
    let query = {};
    
    // Filtres
    if (estPermanent !== undefined) {
      query.estPermanent = estPermanent === 'true';
    }
    if (actif !== undefined) {
      query.actif = actif === 'true';
    }
    if (cours) {
      query['coursEnseignes.nomCours'] = new RegExp(cours, 'i');
    }
    if (matiere) {
      query['coursEnseignes.matiere'] = new RegExp(matiere, 'i');
    }

    const professeurs = await Professeur.find(query)
      .select('-motDePasse')
      .sort({ createdAt: -1 });

    // Enrichir avec des infos calculées
    const professeursEnrichis = professeurs.map(prof => {
      const profObj = prof.toObject();
      
      return {
        ...profObj,
        nombreCours: prof.coursEnseignes ? prof.coursEnseignes.length : 0,
        coursFormattes: prof.getCoursFormattes ? prof.getCoursFormattes() : '',
        totalHeuresParSemaine: prof.getTotalHeuresParSemaine ? prof.getTotalHeuresParSemaine() : 0,
        dossierComplet: prof.isDossierComplet ? prof.isDossierComplet() : true,
        typeProfesseur: prof.estPermanent ? 'Permanent' : 'Entrepreneur'
      };
    });

    res.json(professeursEnrichis);
  } catch (err) {
    console.error('Erreur récupération professeurs:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ===== ROUTE GET - DÉTAILS D'UN PROFESSEUR =====
app.get('/api/professeurs/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.params.id)
      .select('-motDePasse');

    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    // Enrichir avec des infos calculées
    const profObj = professeur.toObject();
    const professeurEnrichi = {
      ...profObj,
      nombreCours: professeur.coursEnseignes ? professeur.coursEnseignes.length : 0,
      coursFormattes: professeur.getCoursFormattes ? professeur.getCoursFormattes() : '',
      totalHeuresParSemaine: professeur.getTotalHeuresParSemaine ? professeur.getTotalHeuresParSemaine() : 0,
      dossierComplet: professeur.isDossierComplet ? professeur.isDossierComplet() : true,
      typeProfesseur: professeur.estPermanent ? 'Permanent' : 'Entrepreneur'
    };

    res.json(professeurEnrichi);
  } catch (err) {
    console.error('Erreur récupération professeur:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// GET - Récupérer tous les étudiants avec filtrage
app.get('/api/etudiants-evaluation', authAdmin, async (req, res) => {
  try {
    const { commercialId } = req.query;
    
    let filter = {};
    if (commercialId) {
      filter.commercial = commercialId;
    }
    
    const etudiants = await Etudiant.find(filter)
      .select('-motDePasse')
      .populate('commercial', 'nom prenom email')
      .populate('creeParAdmin', 'nom email')
      .sort({ createdAt: -1 });
    
    // Pour chaque étudiant, vérifier s'il a déjà une évaluation
    const etudiantsAvecEvaluation = await Promise.all(
      etudiants.map(async (etudiant) => {
        const evaluation = await FormulaireEvaluation.findOne({ 
          etudiant: etudiant._id 
        }).sort({ createdAt: -1 });
        
        return {
          ...etudiant.toObject(),
          evaluationExistante: evaluation ? {
            _id: evaluation._id,
            statutEvaluation: evaluation.statutEvaluation,
            scoreDocuments: evaluation.scoreDocuments,
            pourcentageValidite: evaluation.pourcentageValidite,
            expire: evaluation.expire,
            dateExpiration: evaluation.dateExpiration,
            peutEtreModifiee: evaluation.peutEtreModifiee
          } : null
        };
      })
    );
    
    res.json(etudiantsAvecEvaluation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Créer une nouvelle évaluation pour un étudiant
app.post('/api/evaluations/:etudiantId', authAdmin, async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const { documents, commentaireGeneral } = req.body;
    
    // Vérifier si l'étudiant existe
    const etudiant = await Etudiant.findById(etudiantId).populate('commercial');
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }
    
    // Vérifier s'il existe déjà une évaluation en cours
    let evaluation = await FormulaireEvaluation.findOne({
      etudiant: etudiantId,
      statutEvaluation: 'en_cours'
    });
    
    if (evaluation) {
      // Mettre à jour l'évaluation existante
      if (documents) {
        evaluation.documents = { ...evaluation.documents, ...documents };
      }
      if (commentaireGeneral !== undefined) {
        evaluation.commentaireGeneral = commentaireGeneral;
      }
      await evaluation.save();
    } else {
      // Créer nouvelle évaluation
      evaluation = new FormulaireEvaluation({
        etudiant: etudiantId,
        commercial: etudiant.commercial._id,
        evaluateur: req.adminId,
        documents: documents || {},
        commentaireGeneral: commentaireGeneral || ''
      });
      await evaluation.save();
    }
    
    // Peupler les références pour la réponse
    await evaluation.populate([
      { path: 'etudiant', select: 'prenom nomDeFamille email typeFormation' },
      { path: 'commercial', select: 'nom prenom email' },
      { path: 'evaluateur', select: 'nom email' }
    ]);
    
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Récupérer une évaluation spécifique
app.get('/api/evaluation/:evaluationId', authAdmin, async (req, res) => {
  try {
    const evaluation = await FormulaireEvaluation.findById(req.params.evaluationId)
      .populate('etudiant', 'prenom nomDeFamille email typeFormation niveau specialite')
      .populate('commercial', 'nom prenom email')
      .populate('evaluateur', 'nom email');
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }
    
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Mettre à jour une évaluation
app.put('/api/evaluation/:evaluationId', authAdmin, async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { documents, commentaireGeneral } = req.body;
    
    const evaluation = await FormulaireEvaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }
    
    // Vérifier si l'évaluation peut être modifiée
    if (!evaluation.peutEtreModifiee) {
      return res.status(400).json({ 
        message: 'Cette évaluation ne peut plus être modifiée (expirée ou finalisée)' 
      });
    }
    
    // Mettre à jour les documents
    if (documents) {
      evaluation.documents = { ...evaluation.documents, ...documents };
    }
    
    // Mettre à jour le commentaire général
    if (commentaireGeneral !== undefined) {
      evaluation.commentaireGeneral = commentaireGeneral;
    }
    
    await evaluation.save();
    
    await evaluation.populate([
      { path: 'etudiant', select: 'prenom nomDeFamille email typeFormation' },
      { path: 'commercial', select: 'nom prenom email' },
      { path: 'evaluateur', select: 'nom email' }
    ]);
    
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Finaliser une évaluation (Complet/Incomplet)
app.put('/api/evaluation/:evaluationId/finaliser', authAdmin, async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { statut, commentaireGeneral } = req.body;
    
    if (!['complet', 'incomplet'].includes(statut)) {
      return res.status(400).json({ 
        message: 'Statut invalide. Doit être "complet" ou "incomplet"' 
      });
    }
    
    const evaluation = await FormulaireEvaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }
    
    // Vérifier si l'évaluation peut être modifiée
    if (!evaluation.peutEtreModifiee) {
      return res.status(400).json({ 
        message: 'Cette évaluation ne peut plus être modifiée (expirée ou finalisée)' 
      });
    }
    
    // Finaliser l'évaluation
    evaluation.finaliser(statut);
    if (commentaireGeneral) {
      evaluation.commentaireGeneral = commentaireGeneral;
    }
    
    await evaluation.save();
    
    await evaluation.populate([
      { path: 'etudiant', select: 'prenom nomDeFamille email typeFormation' },
      { path: 'commercial', select: 'nom prenom email' },
      { path: 'evaluateur', select: 'nom email' }
    ]);
    
    res.json({
      message: `Évaluation marquée comme ${statut}`,
      evaluation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Récupérer toutes les évaluations avec filtres
app.get('/api/evaluations', authAdmin, async (req, res) => {
  try {
    const { 
      commercialId, 
      statut, 
      expire, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    let filter = {};
    
    if (commercialId) filter.commercial = commercialId;
    if (statut) filter.statutEvaluation = statut;
    if (expire !== undefined) filter.expire = expire === 'true';
    
    const skip = (page - 1) * limit;
    
    const evaluations = await FormulaireEvaluation.find(filter)
      .populate('etudiant', 'prenom nomDeFamille email typeFormation')
      .populate('commercial', 'nom prenom email')
      .populate('evaluateur', 'nom email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await FormulaireEvaluation.countDocuments(filter);
    
    res.json({
      evaluations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Supprimer une évaluation (seulement si en cours)
app.delete('/api/evaluation/:evaluationId', authAdmin, async (req, res) => {
  try {
    const evaluation = await FormulaireEvaluation.findById(req.params.evaluationId);
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }
    
    // Ne permettre la suppression que si l'évaluation est en cours
    if (evaluation.statutEvaluation !== 'en_cours') {
      return res.status(400).json({ 
        message: 'Impossible de supprimer une évaluation finalisée' 
      });
    }
    
    await FormulaireEvaluation.findByIdAndDelete(req.params.evaluationId);
    
    res.json({ message: 'Évaluation supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ===== ROUTE GET - STATISTIQUES PROFESSEURS =====
app.get('/api/professeurs/stats/dashboard', authAdmin, async (req, res) => {
  try {
    const stats = await Professeur.getStatistiques();
    
    const coursStats = await Professeur.aggregate([
      { $unwind: '$coursEnseignes' },
      {
        $group: {
          _id: '$coursEnseignes.nomCours',
          nombreProfesseurs: { $sum: 1 },
          matieres: { $addToSet: '$coursEnseignes.matiere' }
        }
      },
      { $sort: { nombreProfesseurs: -1 } },
      { $limit: 10 }
    ]);

    const matiereStats = await Professeur.aggregate([
      { $unwind: '$coursEnseignes' },
      {
        $group: {
          _id: '$coursEnseignes.matiere',
          nombreProfesseurs: { $sum: 1 },
          cours: { $addToSet: '$coursEnseignes.nomCours' }
        }
      },
      { $sort: { nombreProfesseurs: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      statistiquesGenerales: stats[0] || {
        totalProfesseurs: 0,
        professeursActifs: 0,
        professeursPermanents: 0,
        entrepreneursActifs: 0
      },
      topCours: coursStats,
      topMatieres: matiereStats
    });

  } catch (err) {
    console.error('Erreur statistiques professeurs:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ===== ROUTE GET - PROFESSEURS POUR PÉDAGOGIQUES =====
app.get('/api/pedagogique/professeurs', authPedagogique, async (req, res) => {
  try {
    const filierePedagogique = req.user.filiere;
    const estGeneral = filierePedagogique === 'GENERAL';
    const pedagogiqueId = req.user.id;
    
    let query = {};
    
    if (estGeneral) {
      // Pédagogique général : TOUS les professeurs
      console.log(`👨‍🏫 Pédagogique GÉNÉRAL - Récupération de tous les professeurs`);
      query = {}; // Pas de filtre = tous les professeurs
    } else {
      // Pédagogique spécifique : seulement les professeurs qu'il a créés
      query.creeParPedagogique = pedagogiqueId;
      console.log(`👨‍🏫 Pédagogique ${filierePedagogique} - Récupération des professeurs créés par ce pédagogique`);
    }
    
    const { estPermanent, actif, cours, matiere } = req.query;
    
    // Ajouter les filtres supplémentaires
    if (estPermanent !== undefined) {
      query.estPermanent = estPermanent === 'true';
    }
    if (actif !== undefined) {
      query.actif = actif === 'true';
    }
    if (cours) {
      query['coursEnseignes.nomCours'] = new RegExp(cours, 'i');
    }
    if (matiere) {
      query['coursEnseignes.matiere'] = new RegExp(matiere, 'i');
    }

    const professeurs = await Professeur.find(query)
      .select('-motDePasse')
      .sort({ createdAt: -1 });

    // Enrichir avec des infos calculées
    const professeursEnrichis = professeurs.map(prof => {
      const profObj = prof.toObject();
      
      return {
        ...profObj,
        nombreCours: prof.coursEnseignes ? prof.coursEnseignes.length : 0,
        coursFormattes: prof.getCoursFormattes ? prof.getCoursFormattes() : '',
        totalHeuresParSemaine: prof.getTotalHeuresParSemaine ? prof.getTotalHeuresParSemaine() : 0,
        dossierComplet: prof.isDossierComplet ? prof.isDossierComplet() : true,
        typeProfesseur: prof.estPermanent ? 'Permanent' : 'Entrepreneur',
        // Ajouter l'info de qui l'a créé pour le debug
        creePar: prof.creeParPedagogique ? 'Pédagogique' : 'Admin'
      };
    });

    console.log(`👨‍🏫 ${estGeneral ? 'Pédagogique GÉNÉRAL' : `Pédagogique ${filierePedagogique}`} - ${professeursEnrichis.length} professeurs trouvés`);

    res.json(professeursEnrichis);
    
  } catch (error) {
    console.error('Erreur récupération professeurs pédagogique:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// CREATE - Ajouter un nouveau professeur de finance
app.post('/api/admin/financeprofs', authAdmin, async (req, res) => {
  try {
    const { nom, telephone, email, motDePasse } = req.body;

    // Validation des champs requis
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const existingProf = await FinanceProf.findOne({ email });
    if (existingProf) {
      return res.status(400).json({
        success: false,
        message: 'Un professeur avec cet email existe déjà'
      });
    }

    // Créer le nouveau professeur
    const newProf = new FinanceProf({
      nom,
      telephone,
      email,
      motDePasse
    });

    await newProf.save();

    // Retourner sans le mot de passe
    const profSansMotDePasse = newProf.toObject();
    delete profSansMotDePasse.motDePasse;

    res.status(201).json({
      success: true,
      message: 'Professeur de finance créé avec succès',
      data: profSansMotDePasse
    });

  } catch (error) {
    console.error('Erreur lors de la création du professeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// READ - Obtenir tous les professeurs de finance
app.get('/api/admin/financeprofs', authAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtres optionnels
    const filters = {};
    if (req.query.actif !== undefined) {
      filters.actif = req.query.actif === 'true';
    }
    if (req.query.search) {
      filters.$or = [
        { nom: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const profs = await FinanceProf.find(filters)
      .select('-motDePasse')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FinanceProf.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: profs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des professeurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// READ - Obtenir un professeur par ID
app.get('/api/admin/financeprofs/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const prof = await FinanceProf.findById(id).select('-motDePasse');
    
    if (!prof) {
      return res.status(404).json({
        success: false,
        message: 'Professeur de finance non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: prof
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du professeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// UPDATE - Mettre à jour un professeur
app.put('/api/admin/financeprofs/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, telephone, email, actif } = req.body;

    const prof = await FinanceProf.findById(id);
    if (!prof) {
      return res.status(404).json({
        success: false,
        message: 'Professeur de finance non trouvé'
      });
    }

    // Vérifier si l'email est unique
    if (email && email !== prof.email) {
      const existingProf = await FinanceProf.findOne({ email });
      if (existingProf) {
        return res.status(400).json({
          success: false,
          message: 'Un professeur avec cet email existe déjà'
        });
      }
    }

    // Mettre à jour les champs
    if (nom) prof.nom = nom;
    if (telephone !== undefined) prof.telephone = telephone;
    if (email) prof.email = email;
    if (actif !== undefined) prof.actif = actif;

    await prof.save();

    // Retourner sans le mot de passe
    const profSansMotDePasse = prof.toObject();
    delete profSansMotDePasse.motDePasse;

    res.status(200).json({
      success: true,
      message: 'Professeur mis à jour avec succès',
      data: profSansMotDePasse
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// DELETE - Supprimer un professeur
app.delete('/api/admin/financeprofs/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const prof = await FinanceProf.findById(id);
    if (!prof) {
      return res.status(404).json({
        success: false,
        message: 'Professeur de finance non trouvé'
      });
    }

    await FinanceProf.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Professeur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// PATCH - Activer/Désactiver un professeur
app.patch('/api/admin/financeprofs/:id/toggle-status', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const prof = await FinanceProf.findById(id);
    if (!prof) {
      return res.status(404).json({
        success: false,
        message: 'Professeur de finance non trouvé'
      });
    }

    prof.actif = !prof.actif;
    await prof.save();

    const profSansMotDePasse = prof.toObject();
    delete profSansMotDePasse.motDePasse;

    res.status(200).json({
      success: true,
      message: `Professeur ${prof.actif ? 'activé' : 'désactivé'} avec succès`,
      data: profSansMotDePasse
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});
// ===== MISE À JOUR DU MODÈLE PROFESSEUR POUR TRACKER LE CRÉATEUR =====
// Ajouter ces champs au professeurSchema dans professeurModel.js

/*
// Ajouter dans le schéma Professeur :
creeParPedagogique: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Pedagogique',
  default: null
},

creeParAdmin: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
  default: null
},

// Champ pour identifier le type de créateur
typeDeCree: {
  type: String,
  enum: ['admin', 'pedagogique', 'auto'],
  default: 'admin'
}
*/

// ===== MISE À JOUR DE LA ROUTE POST PROFESSEUR POUR PÉDAGOGIQUES =====
app.post('/api/pedagogique/professeurs', 
  authPedagogique, 
  uploadDocuments.fields([
    { name: 'image', maxCount: 1 },
    { name: 'diplome', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'rib', maxCount: 1 },
    { name: 'copieCin', maxCount: 1 },
    { name: 'engagement', maxCount: 1 },
    { name: 'vacataire', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        nom,
        email,
        motDePasse,
        telephone,
        dateNaissance,
        actif,
        genre,
        estPermanent,
        tarifHoraire,
        coursEnseignes,
        notes
      } = req.body;

      console.log('Création professeur par pédagogique:', req.user.filiere, req.user.id);

      // ===== VALIDATIONS =====
      if (!nom || !email || !motDePasse || !genre) {
        return res.status(400).json({ message: 'Nom, email, mot de passe et genre sont obligatoires' });
      }

      if (!['Homme', 'Femme'].includes(genre)) {
        return res.status(400).json({ message: 'Genre invalide. Doit être Homme ou Femme' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }

      // Vérification email unique
      const existe = await Professeur.findOne({ email });
      if (existe) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Conversion des booléens
      const actifBool = actif === 'true' || actif === true;
      const estPermanentBool = estPermanent === 'true' || estPermanent === true;

      // Validation entrepreneur
      if (!estPermanentBool) {
        if (!tarifHoraire || parseFloat(tarifHoraire) <= 0) {
          return res.status(400).json({ 
            message: 'Le tarif horaire est obligatoire pour les entrepreneurs et doit être supérieur à 0' 
          });
        }
      }

      // ===== TRAITEMENT DES COURS ENSEIGNES =====
      let coursEnseignesArray = [];
      if (coursEnseignes) {
        try {
          coursEnseignesArray = typeof coursEnseignes === 'string' 
            ? JSON.parse(coursEnseignes) 
            : coursEnseignes;
          
          if (!Array.isArray(coursEnseignesArray)) {
            coursEnseignesArray = [];
          }
          
          coursEnseignesArray = coursEnseignesArray.filter(cours => 
            cours.nomCours && cours.nomCours.trim() !== '' &&
            cours.matiere && cours.matiere.trim() !== ''
          );
        } catch (error) {
          console.error('Erreur parsing coursEnseignes:', error);
          coursEnseignesArray = [];
        }
      }

      // ===== TRAITEMENT DES FICHIERS =====
      const getFilePath = (fileField) => {
        return req.files && req.files[fileField] && req.files[fileField][0] 
          ? `/uploads/professeurs/documents/${req.files[fileField][0].filename}` 
          : '';
      };

      const imagePath = req.files && req.files['image'] && req.files['image'][0] 
        ? `/uploads/${req.files['image'][0].filename}` 
        : '';

      const documents = {
        diplome: getFilePath('diplome'),
        cv: getFilePath('cv'),
        rib: getFilePath('rib'),
        copieCin: getFilePath('copieCin'),
        engagement: getFilePath('engagement'),
        vacataire: getFilePath('vacataire')
      };

      // ===== CRÉATION DU PROFESSEUR =====
      const professeurData = {
        nom: nom.trim(),
        email: email.toLowerCase().trim(),
        motDePasse: motDePasse, // Sera hashé automatiquement
        genre,
        telephone: telephone?.trim() || '',
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        image: imagePath,
        actif: actifBool,
        estPermanent: estPermanentBool,
        coursEnseignes: coursEnseignesArray,
        documents,
        notes: notes?.trim() || '',
        
        // ===== IMPORTANT: Marquer comme créé par ce pédagogique =====
        creeParPedagogique: req.user.id,
        creeParAdmin: null,
        typeDeCree: 'pedagogique'
      };

      // Ajouter le tarif horaire seulement si entrepreneur
      if (!estPermanentBool && tarifHoraire) {
        professeurData.tarifHoraire = parseFloat(tarifHoraire);
      }

      const professeur = new Professeur(professeurData);
      await professeur.save();

      // ===== MISE À JOUR DES COURS (Système de compatibilité) =====
      if (coursEnseignesArray.length > 0) {
        const coursUniques = [...new Set(coursEnseignesArray.map(c => c.nomCours))];
        
        for (const nomCours of coursUniques) {
          const coursDoc = await Cours.findOne({ nom: nomCours });
          if (coursDoc && !coursDoc.professeur.includes(professeur.nom)) {
            coursDoc.professeur.push(professeur.nom);
            await coursDoc.save();
          }
        }
      }

      // Réponse sans mot de passe
      const professeurResponse = professeur.toObject();
      delete professeurResponse.motDePasse;

      console.log(`✅ Professeur créé par pédagogique ${req.user.filiere}: ${professeur.nom}`);

      res.status(201).json({
        message: 'Professeur créé avec succès',
        professeur: professeurResponse,
        creePar: 'pedagogique'
      });

    } catch (err) {
      console.error('Erreur création professeur par pédagogique:', err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: 'Erreur de validation', errors });
      }
      
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
);

// ===== ROUTE PUT - MODIFIER PROFESSEUR POUR PÉDAGOGIQUES =====
app.put('/api/pedagogique/professeurs/:id', 
  authPedagogique, 
  uploadDocuments.fields([
    { name: 'image', maxCount: 1 },
    { name: 'diplome', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'rib', maxCount: 1 },
    { name: 'copieCin', maxCount: 1 },
    { name: 'engagement', maxCount: 1 },
    { name: 'vacataire', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const professeurId = req.params.id;
      const filierePedagogique = req.user.filiere;
      const estGeneral = filierePedagogique === 'GENERAL';
      const pedagogiqueId = req.user.id;

      // Récupérer le professeur existant
      const ancienProf = await Professeur.findById(professeurId);
      if (!ancienProf) {
        return res.status(404).json({ message: "Professeur introuvable" });
      }

      // Vérification des permissions
      if (!estGeneral) {
        // Pédagogique spécifique : peut seulement modifier les professeurs qu'il a créés
        if (ancienProf.creeParPedagogique?.toString() !== pedagogiqueId) {
          return res.status(403).json({ 
            message: "Vous ne pouvez modifier que les professeurs que vous avez créés" 
          });
        }
      }
      // Le pédagogique général peut modifier tous les professeurs

      // Le reste du code de modification reste identique...
      const {
        nom,
        genre,
        dateNaissance,
        telephone,
        email,
        motDePasse,
        actif,
        estPermanent,
        tarifHoraire,
        coursEnseignes,
        notes
      } = req.body;

      // Validation email unique (sauf pour le professeur actuel)
      if (email && email !== ancienProf.email) {
        const emailExiste = await Professeur.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: professeurId }
        });
        if (emailExiste) {
          return res.status(400).json({ message: 'Email déjà utilisé' });
        }
      }

      // ... (le reste du code de modification reste identique)
      
      console.log(`✅ Professeur modifié par pédagogique ${req.user.filiere}: ${ancienProf.nom}`);

      res.json({ 
        message: "Professeur modifié avec succès", 
        professeur: updatedProf 
      });

    } catch (err) {
      console.error('Erreur modification professeur par pédagogique:', err);
      res.status(500).json({ message: "Erreur lors de la modification", error: err.message });
    }
  }
);

// ===== ROUTE DELETE - SUPPRIMER PROFESSEUR POUR PÉDAGOGIQUES =====
app.delete('/api/pedagogique/professeurs/:id', authPedagogique, async (req, res) => {
  try {
    const professeurId = req.params.id;
    const filierePedagogique = req.user.filiere;
    const estGeneral = filierePedagogique === 'GENERAL';
    const pedagogiqueId = req.user.id;

    // Récupérer le professeur existant
    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ message: "Professeur introuvable" });
    }

    // Vérification des permissions
    if (!estGeneral) {
      // Pédagogique spécifique : peut seulement supprimer les professeurs qu'il a créés
      if (professeur.creeParPedagogique?.toString() !== pedagogiqueId) {
        return res.status(403).json({ 
          message: "Vous ne pouvez supprimer que les professeurs que vous avez créés" 
        });
      }
    }
    // Le pédagogique général peut supprimer tous les professeurs

    await Professeur.findByIdAndDelete(professeurId);
    
    console.log(`✅ Professeur supprimé par pédagogique ${req.user.filiere}: ${professeur.nom}`);

    res.json({ 
      message: 'Professeur supprimé avec succès',
      professeur: {
        id: professeur._id,
        nom: professeur.nom,
        email: professeur.email
      }
    });

  } catch (err) {
    console.error('Erreur suppression professeur par pédagogique:', err);
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
});

// ===== ROUTE POST - AJOUTER/MODIFIER COURS POUR UN PROFESSEUR =====
app.post('/api/professeurs/:id/cours', authAdminOrPedagogique, async (req, res) => {
  try {
    const { coursEnseignes } = req.body; // Array de {nomCours, matiere, niveau?, heuresParSemaine?}
    
    if (!Array.isArray(coursEnseignes)) {
      return res.status(400).json({ message: 'coursEnseignes doit être un tableau' });
    }

    const professeur = await Professeur.findById(req.params.id);
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    // Validation des cours
    const coursValides = coursEnseignes.filter(cours => 
      cours.nomCours && cours.nomCours.trim() !== '' &&
      cours.matiere && cours.matiere.trim() !== ''
    );

    professeur.coursEnseignes = coursValides;
    await professeur.save();

    res.json({
      message: 'Cours mis à jour avec succès',
      coursEnseignes: professeur.coursEnseignes
    });

  } catch (err) {
    console.error('Erreur mise à jour cours:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ===== ROUTE DELETE - SUPPRIMER UN COURS SPÉCIFIQUE =====
app.delete('/api/professeurs/:id/cours/:coursIndex', authAdminOrPedagogique, async (req, res) => {
  try {
    const { id, coursIndex } = req.params;
    
    const professeur = await Professeur.findById(id);
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    const index = parseInt(coursIndex);
    if (index < 0 || index >= professeur.coursEnseignes.length) {
      return res.status(400).json({ message: 'Index de cours invalide' });
    }

    const coursSupprime = professeur.coursEnseignes[index];
    professeur.coursEnseignes.splice(index, 1);
    await professeur.save();

    res.json({
      message: `Cours "${coursSupprime.nomCours} (${coursSupprime.matiere})" supprimé`,
      coursEnseignes: professeur.coursEnseignes
    });

  } catch (err) {
    console.error('Erreur suppression cours:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Exposer le dossier pour servir les documents
app.use('/uploads/professeurs/documents', express.static('uploads/professeurs/documents'));
// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});