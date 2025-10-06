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
const PaiementProfesseur = require('./models/PaiementProfesseur');
const CyclePaiement = require('./models/CyclePaiement');
const Partner = require('./models/partner'); // Ajuste le chemin selon ta structure
const Test = require('./models/Test.js');
const FinanceProf = require('./models/financeProfModel');
const FormulaireEvaluation = require('./models/FormulaireEvaluation');
const PenaliteProfesseur = require('./models/PenaliteProfesseur');
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


// REMPLACEZ votre middleware authCommercial par celui-ci dans server.js

const authCommercial = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    const decoded = jwt.verify(token, 'jwt_secret_key');
    console.log('🔍 Token décodé:', decoded);
    
    // Check token type and handle accordingly
    if (decoded.type === 'partner') {
      // Handle partner authentication
      const partner = await Partner.findById(decoded.id);

      if (!partner) {
        return res.status(404).json({ message: 'Partner non trouvé' });
      }

      if (!partner.active) {
        return res.status(403).json({ message: '⛔ Compte partner inactif' });
      }

      console.log('✅ Authentification Partner réussie pour:', partner.email);

      // Set partner-specific request properties
      req.partnerId = partner._id;        // IMPORTANT: Pour les opérations partner
      req.commercial = partner;           // Keep for compatibility
      req.isPartner = true;              // Flag pour identifier un partner
      req.isAdmin = false;               // Pas un admin
      req.user = partner;                // Référence générique
      
    } else if (decoded.type === 'admin' || decoded.role === 'admin') {
      // Handle admin authentication
      const admin = await Admin.findById(decoded.id);

      if (!admin) {
        return res.status(404).json({ message: 'Admin non trouvé' });
      }

      if (!admin.actif) {
        return res.status(403).json({ message: '⛔ Compte admin inactif' });
      }

      console.log('✅ Authentification Admin réussie pour:', admin.email);

      // Set admin-specific request properties
      req.adminId = admin._id;
      req.commercial = admin;            // Keep for compatibility
      req.isPartner = false;
      req.isAdmin = true;                // Flag pour identifier un admin
      req.user = admin;
      
    } else {
      // Handle commercial authentication (comportement par défaut)
      const commercial = await Commercial.findById(decoded.id);

      if (!commercial) {
        return res.status(404).json({ message: 'Commercial non trouvé' });
      }

      if (!commercial.actif) {
        return res.status(403).json({ message: '⛔ Compte commercial inactif' });
      }

      console.log('✅ Authentification Commercial réussie pour:', commercial.email);

      // Set commercial-specific request properties
      req.commercialId = commercial._id;
      req.commercial = commercial;
      req.isPartner = false;
      req.isAdmin = false;
      req.user = commercial;
      req.userRole = 'commercial';
    }
    
    next();
  } catch (err) {
    console.error('❌ Erreur middleware auth:', err);
    res.status(401).json({ 
      message: 'Token invalide ou expiré', 
      error: err.message 
    });
  }
};


// Stockage pour les professeurs (gardez l'existant)
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

// NOUVEAU : Stockage séparé pour les étudiants
const multerEtudiants = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir;
    if (file.fieldname === 'image') {
      dir = path.join(__dirname, 'uploads');
    } else {
      dir = path.join(__dirname, 'documents'); // Documents étudiants dans /documents
    }
    
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

// Configuration pour les étudiants (utilise le nouveau stockage)
const uploadEtudiants = multer({
  storage: multerEtudiants, // ← Changement ici
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'documentCin', maxCount: 1 },
  { name: 'documentBacCommentaire', maxCount: 1 },
  { name: 'documentReleveNoteBac', maxCount: 1 },
  { name: 'documentDiplomeCommentaire', maxCount: 1 },
  { name: 'documentAttestationReussiteCommentaire', maxCount: 1 },
  { name: 'documentReleveNotesFormationCommentaire', maxCount: 1 },
  { name: 'documentPasseport', maxCount: 1 },
  { name: 'documentBacOuAttestationBacCommentaire', maxCount: 1 },
  { name: 'documentAuthentificationBac', maxCount: 1 },
  { name: 'documentAuthenticationDiplome', maxCount: 1 },
  { name: 'documentEngagementCommentaire', maxCount: 1 }
]);
// Configuration pour les professeurs (sans .fields() - pour usage dynamique)
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
    fileSize: 5 * 1024 * 1024
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


app.put('/api/commercial/etudiants/:id', authCommercial, uploadEtudiants, async (req, res) => {
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
      specialiteLicencePro, optionLicencePro, specialiteMasterPro, optionMasterPro,
      modePaiement,
      
      // NOUVEAUX CHAMPS
      telephoneResponsable,
      codeBaccalaureat,
      
      // NOUVEAUX CHAMPS PARTNER
      isPartner,
      prixTotalPartner,
      
      // COMMENTAIRES POUR LES DOCUMENTS
      commentaireCin,
      commentaireBacCommentaire,
      commentaireReleveNoteBac,
      commentaireDiplomeCommentaire,
      commentaireAttestationReussiteCommentaire,
      commentaireReleveNotesFormationCommentaire,
      commentairePasseport,
      commentaireBacOuAttestationBacCommentaire,
      commentaireAuthentificationBac,
      commentaireAuthenticationDiplome,
      commentaireEngagementCommentaire
    } = req.body;

    // 1. RECHERCHER L'ÉTUDIANT EXISTANT (vérification d'autorisation)
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

    // Validation du mode de paiement
    if (modePaiement && !['semestriel', 'trimestriel', 'mensuel', 'annuel'].includes(modePaiement)) {
      return res.status(400).json({ 
        message: 'Le mode de paiement doit être "semestriel", "trimestriel", "mensuel" ou "annuel"' 
      });
    }

    // NOUVEAU: Validation des champs Partner
    if (isPartner !== undefined) {
      const isPartnerBool = isPartner === 'true' || isPartner === true;
      if (isPartnerBool && prixTotalPartner !== undefined) {
        if (!prixTotalPartner || parseFloat(prixTotalPartner) <= 0) {
          return res.status(400).json({ 
            message: 'Le prix total Partner est obligatoire et doit être supérieur à 0 pour les étudiants partenaires' 
          });
        }
      }
    }

    // 2. DÉTECTER SI C'EST UNE NOUVELLE ANNÉE SCOLAIRE
    const estNouvelleAnneeScolaire = anneeScolaire && 
                                    anneeScolaire.trim() !== '' && 
                                    anneeScolaire !== etudiantExistant.anneeScolaire;

    if (estNouvelleAnneeScolaire) {
      console.log(`🆕 NOUVELLE ANNÉE SCOLAIRE DÉTECTÉE: ${etudiantExistant.anneeScolaire} → ${anneeScolaire}`);
      
      // DÉTERMINATION AUTOMATIQUE DU TYPE DE FORMATION
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
        // VALIDATION POUR LICENCE PRO (NIVEAU AUTO-ASSIGNÉ À 3)
        
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
        // VALIDATION POUR MASTER PRO (NIVEAU AUTO-ASSIGNÉ À 4)
        
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
    3: [
      'Entreprenariat, audit et finance', 
      'Développement commercial et marketing digital'
    ],
    4: [
      'Finance et Stratégie Entrepreneuriale Master 1',
      'Développement Commercial et Marketing Digital Master 1'
    ],
    5: [
      'Finance et Stratégie Entrepreneuriale Master 2',
      'Développement Commercial et Marketing Digital Master 2'
    ]
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
      const MAX_ETUDIANTS = 50;
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

      const getDocumentPath = (documentField) => {
        return req.files && req.files[documentField] && req.files[documentField][0] 
          ? `/documents/${req.files[documentField][0].filename}` 
          : '';
      };

      const imagePath = getFilePath('image');
      
      // Traitement des nouveaux documents
      const documentsData = {
        cin: {
          fichier: getDocumentPath('documentCin'),
          commentaire: commentaireCin || ''
        },
        bacCommentaire: {
          fichier: getDocumentPath('documentBacCommentaire'),
          commentaire: commentaireBacCommentaire || ''
        },
        releveNoteBac: {
          fichier: getDocumentPath('documentReleveNoteBac'),
          commentaire: commentaireReleveNoteBac || ''
        },
        diplomeCommentaire: {
          fichier: getDocumentPath('documentDiplomeCommentaire'),
          commentaire: commentaireDiplomeCommentaire || ''
        },
        attestationReussiteCommentaire: {
          fichier: getDocumentPath('documentAttestationReussiteCommentaire'),
          commentaire: commentaireAttestationReussiteCommentaire || ''
        },
        releveNotesFormationCommentaire: {
          fichier: getDocumentPath('documentReleveNotesFormationCommentaire'),
          commentaire: commentaireReleveNotesFormationCommentaire || ''
        },
        passeport: {
          fichier: getDocumentPath('documentPasseport'),
          commentaire: commentairePasseport || ''
        },
        bacOuAttestationBacCommentaire: {
          fichier: getDocumentPath('documentBacOuAttestationBacCommentaire'),
          commentaire: commentaireBacOuAttestationBacCommentaire || ''
        },
        authentificationBac: {
          fichier: getDocumentPath('documentAuthentificationBac'),
          commentaire: commentaireAuthentificationBac || ''
        },
        authenticationDiplome: {
          fichier: getDocumentPath('documentAuthenticationDiplome'),
          commentaire: commentaireAuthenticationDiplome || ''
        },
        engagementCommentaire: {
          fichier: getDocumentPath('documentEngagementCommentaire'),
          commentaire: commentaireEngagementCommentaire || ''
        }
      };

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
      const prixTotalPartnerNum = isPartner ? toNumber(prixTotalPartner) || 0 : 0;
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

      // CRÉER UNE COPIE POUR LA NOUVELLE ANNÉE SCOLAIRE
      const donneesCopiees = {
        prenom: prenom?.trim() || etudiantExistant.prenom,
        nomDeFamille: nomDeFamille?.trim() || etudiantExistant.nomDeFamille,
        genre: genre || etudiantExistant.genre,
        dateNaissance: dateNaissanceFormatted || etudiantExistant.dateNaissance,
        telephone: telephone?.trim() || etudiantExistant.telephone,
        telephoneResponsable: telephoneResponsable?.trim() || etudiantExistant.telephoneResponsable || '',
        email: email?.toLowerCase().trim() || etudiantExistant.email,
        motDePasse: etudiantExistant.motDePasse, // Garder le même mot de passe
        cin: cin?.trim() || etudiantExistant.cin || '',
        passeport: passeport?.trim() || etudiantExistant.passeport || '',
        codeBaccalaureat: codeBaccalaureat?.trim() || etudiantExistant.codeBaccalaureat || '',
        documents: Object.keys(documentsData).some(key => documentsData[key].fichier || documentsData[key].commentaire) 
          ? documentsData 
          : etudiantExistant.documents || {},
        lieuNaissance: lieuNaissance?.trim() || etudiantExistant.lieuNaissance || '',
        pays: pays?.trim() || etudiantExistant.pays || '',
        niveau: niveauFinal, // LE NIVEAU EST MAINTENANT AUTO-ASSIGNÉ
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
        modePaiement: modePaiement || etudiantExistant.modePaiement || 'semestriel',
        
        // Image
        image: imagePath || etudiantExistant.image,
        
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
        
        anneeScolaire: anneeScolaire, // NOUVELLE ANNÉE SCOLAIRE
        
        // Commercial créateur (équivalent de creeParAdmin pour commercial)
        creeParCommercial: etudiantExistant.commercial || req.commercialId,
        creeParAdmin: null,

        // NOUVEAUX CHAMPS PARTNER
        isPartner: isPartner !== undefined ? toBool(isPartner) : etudiantExistant.isPartner || false,
        prixTotalPartner: prixTotalPartnerNum || etudiantExistant.prixTotalPartner || 0
      };

      // ASSIGNATION DES CHAMPS SPÉCIFIQUES SELON LE TYPE DE FORMATION
      
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
        // Licence Professionnelle - NIVEAU AUTO-ASSIGNÉ À 3
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
        // Master Professionnel - NIVEAU AUTO-ASSIGNÉ À 4
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

      // CRÉER LE NOUVEAU DOCUMENT POUR LA NOUVELLE ANNÉE
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

    // 3. MODIFICATION NORMALE (PAS DE NOUVELLE ANNÉE SCOLAIRE)
    console.log(`✏️ Modification normale de l'étudiant existant`);
    
    // DÉTERMINATION CORRIGÉE DU TYPE DE FORMATION
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

    // DÉTERMINATION DU NIVEAU
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

    // VALIDATION CORRIGÉE SELON LE TYPE DE FORMATION
    
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
        
        // VALIDATION DE L'OPTION POUR LA 5ÈME ANNÉE SEULEMENT
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
          
          // VALIDATION DE LA COMPATIBILITÉ SPÉCIALITÉ-OPTION
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
    3: [
      'Entreprenariat, audit et finance', 
      'Développement commercial et marketing digital'
    ],
    4: [
      'Finance et Stratégie Entrepreneuriale Master 1',
      'Développement Commercial et Marketing Digital Master 1'
    ],
    5: [
      'Finance et Stratégie Entrepreneuriale Master 2',
      'Développement Commercial et Marketing Digital Master 2'
    ]
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
    const MAX_ETUDIANTS = 50;
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

    // TRAITEMENT DES FICHIERS UPLOADÉS
    const getDocumentPath = (documentField) => {
      return req.files && req.files[documentField] && req.files[documentField][0] 
        ? `/documents/${req.files[documentField][0].filename}` 
        : undefined;
    };

    const imagePath = req.files && req.files['image'] && req.files['image'][0] 
      ? `/uploads/${req.files['image'][0].filename}` 
      : undefined;

    // CRÉER L'OBJET DE MODIFICATIONS
    const modifications = {};

    // Appliquer toutes les modifications reçues
    if (prenom !== undefined) modifications.prenom = prenom.trim();
    if (nomDeFamille !== undefined) modifications.nomDeFamille = nomDeFamille.trim();
    if (genre !== undefined) modifications.genre = genre;
    if (dateNaissance !== undefined) modifications.dateNaissance = toDate(dateNaissance);
    if (telephone !== undefined) modifications.telephone = telephone.trim();
    if (telephoneResponsable !== undefined) modifications.telephoneResponsable = telephoneResponsable?.trim() || '';
    if (email !== undefined) modifications.email = email.toLowerCase().trim();
    if (cours !== undefined) modifications.cours = coursArray;
    if (actif !== undefined) modifications.actif = toBool(actif);
    if (cin !== undefined) modifications.cin = cin.trim();
    if (passeport !== undefined) modifications.passeport = passeport.trim();
    if (codeBaccalaureat !== undefined) modifications.codeBaccalaureat = codeBaccalaureat?.trim() || '';
    if (lieuNaissance !== undefined) modifications.lieuNaissance = lieuNaissance.trim();
    if (pays !== undefined) modifications.pays = pays.trim();
    
    // LIGNE CRUCIALE: TOUJOURS ASSIGNER LE NIVEAU FINAL CALCULÉ
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
    if (modePaiement !== undefined) modifications.modePaiement = modePaiement;

    // NOUVEAUX CHAMPS PARTNER
    if (isPartner !== undefined) modifications.isPartner = toBool(isPartner);
    if (prixTotalPartner !== undefined) modifications.prixTotalPartner = toNumber(prixTotalPartner) || 0;

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

    // Logique automatique pour le mode de paiement annuel
    if (modePaiement === 'annuel' && paye === undefined) {
      modifications.paye = true;
    }

    // ASSIGNATION DES CHAMPS SPÉCIFIQUES SELON LE TYPE DE FORMATION
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

    // TRAITEMENT DES FICHIERS UPLOADÉS
    if (imagePath !== undefined) modifications.image = imagePath;

    // Mise à jour des documents (seulement si de nouveaux fichiers ou commentaires sont fournis)
    const documentsExistants = etudiantExistant.documents || {};
    const nouveauxDocuments = {};

    // Types de documents avec leurs commentaires
    const typesDocuments = [
      { key: 'cin', fileField: 'documentCin', commentField: 'commentaireCin' },
      { key: 'bacCommentaire', fileField: 'documentBacCommentaire', commentField: 'commentaireBacCommentaire' },
      { key: 'releveNoteBac', fileField: 'documentReleveNoteBac', commentField: 'commentaireReleveNoteBac' },
      { key: 'diplomeCommentaire', fileField: 'documentDiplomeCommentaire', commentField: 'commentaireDiplomeCommentaire' },
      { key: 'attestationReussiteCommentaire', fileField: 'documentAttestationReussiteCommentaire', commentField: 'commentaireAttestationReussiteCommentaire' },
      { key: 'releveNotesFormationCommentaire', fileField: 'documentReleveNotesFormationCommentaire', commentField: 'commentaireReleveNotesFormationCommentaire' },
      { key: 'passeport', fileField: 'documentPasseport', commentField: 'commentairePasseport' },
      { key: 'bacOuAttestationBacCommentaire', fileField: 'documentBacOuAttestationBacCommentaire', commentField: 'commentaireBacOuAttestationBacCommentaire' },
      { key: 'authentificationBac', fileField: 'documentAuthentificationBac', commentField: 'commentaireAuthentificationBac' },
      { key: 'authenticationDiplome', fileField: 'documentAuthenticationDiplome', commentField: 'commentaireAuthenticationDiplome' },
      { key: 'engagementCommentaire', fileField: 'documentEngagementCommentaire', commentField: 'commentaireEngagementCommentaire' }
    ];

    typesDocuments.forEach(type => {
      const documentExistant = documentsExistants[type.key] || {};
      const nouveauFichier = getDocumentPath(type.fileField);
      const nouveauCommentaire = req.body[type.commentField];

      nouveauxDocuments[type.key] = {
        fichier: nouveauFichier !== undefined ? nouveauFichier : documentExistant.fichier || '',
        commentaire: nouveauCommentaire !== undefined ? nouveauCommentaire : documentExistant.commentaire || ''
      };
    });

    modifications.documents = nouveauxDocuments;

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

    // 4. MISE À JOUR DU DOCUMENT EXISTANT
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

    // RETOURNER LE DOCUMENT MIS À JOUR (sans mot de passe)
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

app.post('/api/commercial/etudiants', authCommercial, uploadEtudiants, async (req, res) => {
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
      specialiteLicencePro, optionLicencePro, specialiteMasterPro, optionMasterPro,
      modePaiement,
      
      // NOUVEAUX CHAMPS
      telephoneResponsable,
      codeBaccalaureat,
      
      // NOUVEAUX CHAMPS PARTNER
      isPartner,
      prixTotalPartner,
      
      // COMMENTAIRES POUR LES DOCUMENTS
      commentaireCin,
      commentaireBacCommentaire,
      commentaireReleveNoteBac,
      commentaireDiplomeCommentaire,
      commentaireAttestationReussiteCommentaire,
      commentaireReleveNotesFormationCommentaire,
      commentairePasseport,
      commentaireBacOuAttestationBacCommentaire,
      commentaireAuthentificationBac,
      commentaireAuthenticationDiplome,
      commentaireEngagementCommentaire
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

    // Validation du mode de paiement
    if (modePaiement && !['semestriel', 'trimestriel', 'mensuel', 'annuel'].includes(modePaiement)) {
      return res.status(400).json({ 
        message: 'Le mode de paiement doit être "semestriel", "trimestriel", "mensuel" ou "annuel"' 
      });
    }

    // NOUVEAU: Validation des champs Partner
    const isPartnerBool = isPartner === 'true' || isPartner === true;
    if (isPartnerBool) {
      if (!prixTotalPartner || parseFloat(prixTotalPartner) <= 0) {
        return res.status(400).json({ 
          message: 'Le prix total Partner est obligatoire et doit être supérieur à 0 pour les étudiants partenaires' 
        });
      }
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

    // ===== VALIDATION SPÉCIFIQUE PAR TYPE DE FORMATION =====
    
    if (typeFormationFinal === 'CYCLE_INGENIEUR') {
      // Validation formation d'ingénieur
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

    } else if (typeFormationFinal === 'LICENCE_PRO') {
      // Validation Licence Professionnelle
      if (!specialiteLicencePro) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour la Licence Professionnelle' 
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

    } else if (typeFormationFinal === 'MASTER_PRO') {
      // Validation Master Professionnel
      if (!specialiteMasterPro) {
        return res.status(400).json({ 
          message: 'Une spécialité est obligatoire pour le Master Professionnel' 
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

    } else if (typeFormationFinal === 'MASI' || typeFormationFinal === 'IRM') {
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

      if (typeFormationFinal && specialite) {
        const STRUCTURE_FORMATION = {
        MASI: {
    3: [
      'Entreprenariat, audit et finance', 
      'Développement commercial et marketing digital'
    ],
    4: [
      'Finance et Stratégie Entrepreneuriale Master 1',
      'Développement Commercial et Marketing Digital Master 1'
    ],
    5: [
      'Finance et Stratégie Entrepreneuriale Master 2',
      'Développement Commercial et Marketing Digital Master 2'
    ]
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
    }

    // ===== GESTION DES COURS AVEC LIMITE =====
    const MAX_ETUDIANTS = 50;
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

    // Fonction pour obtenir le chemin des fichiers documents
    const getDocumentPath = (documentField) => {
      return req.files && req.files[documentField] && req.files[documentField][0] 
        ? `/documents/${req.files[documentField][0].filename}` 
        : '';
    };

    // Image de profil
    const imagePath = req.files && req.files['image'] && req.files['image'][0] 
      ? `/uploads/${req.files['image'][0].filename}` 
      : '';

    // Traitement des nouveaux documents
    const documentsData = {
      cin: {
        fichier: getDocumentPath('documentCin'),
        commentaire: commentaireCin || ''
      },
      bacCommentaire: {
        fichier: getDocumentPath('documentBacCommentaire'),
        commentaire: commentaireBacCommentaire || ''
      },
      releveNoteBac: {
        fichier: getDocumentPath('documentReleveNoteBac'),
        commentaire: commentaireReleveNoteBac || ''
      },
      diplomeCommentaire: {
        fichier: getDocumentPath('documentDiplomeCommentaire'),
        commentaire: commentaireDiplomeCommentaire || ''
      },
      attestationReussiteCommentaire: {
        fichier: getDocumentPath('documentAttestationReussiteCommentaire'),
        commentaire: commentaireAttestationReussiteCommentaire || ''
      },
      releveNotesFormationCommentaire: {
        fichier: getDocumentPath('documentReleveNotesFormationCommentaire'),
        commentaire: commentaireReleveNotesFormationCommentaire || ''
      },
      passeport: {
        fichier: getDocumentPath('documentPasseport'),
        commentaire: commentairePasseport || ''
      },
      bacOuAttestationBacCommentaire: {
        fichier: getDocumentPath('documentBacOuAttestationBacCommentaire'),
        commentaire: commentaireBacOuAttestationBacCommentaire || ''
      },
      authentificationBac: {
        fichier: getDocumentPath('documentAuthentificationBac'),
        commentaire: commentaireAuthentificationBac || ''
      },
      authenticationDiplome: {
        fichier: getDocumentPath('documentAuthenticationDiplome'),
        commentaire: commentaireAuthenticationDiplome || ''
      },
      engagementCommentaire: {
        fichier: getDocumentPath('documentEngagementCommentaire'),
        commentaire: commentaireEngagementCommentaire || ''
      }
    };
    
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
    const prixTotalPartnerNum = isPartnerBool ? toNumber(prixTotalPartner) || 0 : 0;
    const pourcentageBourseNum = toNumber(pourcentageBourse);
    const anneeBacNum = toNumber(anneeBaccalaureat);
    const premiereInscriptionNum = toNumber(premiereAnneeInscription);

    // Validation du pourcentage de bourse
    if (pourcentageBourseNum && (pourcentageBourseNum < 0 || pourcentageBourseNum > 100)) {
      return res.status(400).json({ message: 'Le pourcentage de bourse doit être entre 0 et 100' });
    }

    // Logique automatique pour le mode de paiement annuel
    if (modePaiement === 'annuel' && paye === undefined) {
      req.body.paye = true;
    }

    // ===== CRÉATION DE L'ÉTUDIANT =====
    const etudiantData = {
      prenom: prenom.trim(),
      nomDeFamille: nomDeFamille.trim(),
      genre,
      dateNaissance: dateNaissanceFormatted,
      telephone: telephone.trim(),
      telephoneResponsable: telephoneResponsable?.trim() || '',
      email: email.toLowerCase().trim(),
      motDePasse: hashedPassword,
      cin: cin?.trim() || '',
      passeport: passeport?.trim() || '',
      codeBaccalaureat: codeBaccalaureat?.trim() || '',
      documents: documentsData,
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
      image: imagePath,
      
      // Champs booléens
      actif: req.body.actif,
      paye: req.body.paye,
      handicape: req.body.handicape,
      resident: req.body.resident,
      fonctionnaire: req.body.fonctionnaire,
      mobilite: req.body.mobilite,
      nouvelleInscription: req.body.nouvelleInscription,
      
      // Lier au commercial (pas d'admin)
      commercial: req.commercialId,
      creeParAdmin: null,
      creeParCommercial: req.commercialId,
      
      // Année scolaire
      anneeScolaire: anneeScolaire || undefined,

      // NOUVEAUX CHAMPS PARTNER
      isPartner: isPartnerBool,
      prixTotalPartner: prixTotalPartnerNum
    };

    // Ajouter les champs spécifiques selon le type de formation
    if (typeFormationFinal === 'CYCLE_INGENIEUR') {
      // Formation d'ingénieur
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
      // Licence Professionnelle
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
      // Master Professionnel
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
      // Anciennes formations
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

app.put('/api/pedagogique/etudiant/:id/cours', authPedagogique, async (req, res) => {
  try {
    const { cours } = req.body;
    const etudiantId = req.params.id;
    
    // Utiliser directement req.pedagogique si disponible
    const pedagogique = req.pedagogique || await Pedagogique.findById(req.pedagogiqueId || req.user.id);
    
    if (!pedagogique) {
      return res.status(403).json({ message: 'Pédagogique non trouvé' });
    }
    
    // Récupérer l'étudiant
    const etudiant = await Etudiant.findById(etudiantId);
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }
    
    // Vérifier les permissions
    const filiereEtudiant = etudiant.typeFormation || etudiant.filiere;
    let hasAccess = false;
    
    if (pedagogique.type === 'GENERAL') {
      hasAccess = pedagogique.filieresList.includes(filiereEtudiant);
    } else {
      hasAccess = pedagogique.filiere === filiereEtudiant;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ 
        message: `Vous n'avez pas accès à cette filière (${filiereEtudiant})`
      });
    }
    
    // Mettre à jour UNIQUEMENT les cours
    etudiant.cours = cours;
    await etudiant.save({ validateBeforeSave: false });
    
    res.status(200).json({
      message: 'Classes mis à jour avec succès',
      etudiant: {
        _id: etudiant._id,
        nomComplet: etudiant.nomComplet,
        cours: etudiant.cours
      }
    });
    
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: err.message 
    });
  }
});
// À ajouter dans votre fichier principal du serveur (après les autres routes)

// ===== ROUTES PARTNERS =====

// 1. Route pour récupérer les étudiants partners
app.get('/api/partners/etudiants', authCommercial, async (req, res) => {
  try {
    let etudiants;

    if (req.isPartner) {
      // Si c'est un partner, récupérer seulement ses étudiants
      if (!req.partnerId) {
        return res.status(400).json({ message: 'Partner ID manquant' });
      }
      
      etudiants = await Etudiant.find({ 
        nomPartner: req.partnerId,
        isPartner: true 
      })
      .populate('nomPartner', 'nomPartner active')
      .sort({ createdAt: -1 });
      
      console.log(`Partner ${req.partnerId} has ${etudiants.length} students`);
      
    } else if (req.isAdmin) {
      // Si c'est un admin, récupérer tous les étudiants partners
      etudiants = await Etudiant.find({ isPartner: true })
        .populate('nomPartner', 'nomPartner active')
        .sort({ createdAt: -1 });
        
      console.log(`Admin retrieved ${etudiants.length} total partner students`);
      
    } else {
      return res.status(403).json({ 
        message: 'Accès non autorisé - seuls les partners et admins peuvent accéder à cette route' 
      });
    }
    
    res.json(etudiants);
  } catch (err) {
    console.error('Erreur récupération étudiants partner:', err);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des étudiants',
      details: err.message 
    });
  }
});

// REMPLACEZ votre route POST /api/partners/etudiants par celle-ci dans server.js

app.post('/api/partners/etudiants', authCommercial, uploadEtudiants, async (req, res) => {
  try {
    console.log('Route POST /api/partners/etudiants appelée');
    console.log('req.isPartner:', req.isPartner);
    console.log('req.partnerId:', req.partnerId);

    // Vérifier l'accès partner
    if (!req.isPartner && !req.isAdmin) {
      return res.status(403).json({ 
        message: 'Accès non autorisé - seuls les partners peuvent créer des étudiants',
        debug: { isPartner: req.isPartner, isAdmin: req.isAdmin }
      });
    }
    
    if (req.isPartner && !req.partnerId) {
      return res.status(400).json({ message: 'Partner ID manquant' });
    }

    const {
      prenom, nomDeFamille, genre, dateNaissance, telephone, email, motDePasse,
      cin, passeport, lieuNaissance, pays, cours, niveau, niveauFormation, filiere,
      option, specialite, typeDiplome, diplomeAcces, specialiteDiplomeAcces,
      mention, lieuObtentionDiplome, serieBaccalaureat, anneeBaccalaureat,
      premiereAnneeInscription, sourceInscription, dateInscription, typePaiement,
      prixTotal, pourcentageBourse, situation, codeEtudiant, dateEtReglement,
      actif, nouvelleInscription, paye, handicape, resident, fonctionnaire,
      mobilite, cycle, specialiteIngenieur, optionIngenieur,
      specialiteLicencePro, optionLicencePro, specialiteMasterPro, optionMasterPro,
      anneeScolaire, modePaiement, telephoneResponsable, codeBaccalaureat,
      prixTotalPartner, typeFormation,
      // Document comments
      commentaireCin, commentaireBacCommentaire, commentaireReleveNoteBac,
      commentaireDiplomeCommentaire, commentaireAttestationReussiteCommentaire,
      commentaireReleveNotesFormationCommentaire, commentairePasseport,
      commentaireBacOuAttestationBacCommentaire, commentaireAuthentificationBac,
      commentaireAuthenticationDiplome, commentaireEngagementCommentaire
    } = req.body;

    // Validation des champs obligatoires
    if (!prenom || !nomDeFamille || !telephone || !email || !motDePasse || !dateNaissance) {
      return res.status(400).json({
        message: 'Les champs prenom, nomDeFamille, telephone, email, motDePasse et dateNaissance sont obligatoires'
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    // Vérifier l'unicité de l'email
    const existingStudent = await Etudiant.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ error: 'Un étudiant avec cet email existe déjà' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 12);

    // Traitement des fichiers
    const processFiles = () => {
      const files = {};
      if (req.files) {
        if (req.files.image) {
          files.image = `/uploads/${req.files.image[0].filename}`;
        }
      }
      return files;
    };

    const files = processFiles();

    // Traitement des documents avec commentaires
    const documentsData = {};
    const documentsMapping = {
      'documentCin': 'cin',
      'documentBacCommentaire': 'bacCommentaire',
      'documentReleveNoteBac': 'releveNoteBac',
      'documentDiplomeCommentaire': 'diplomeCommentaire',
      'documentAttestationReussiteCommentaire': 'attestationReussiteCommentaire',
      'documentReleveNotesFormationCommentaire': 'releveNotesFormationCommentaire',
      'documentPasseport': 'passeport',
      'documentBacOuAttestationBacCommentaire': 'bacOuAttestationBacCommentaire',
      'documentAuthentificationBac': 'authentificationBac',
      'documentAuthenticationDiplome': 'authenticationDiplome',
      'documentEngagementCommentaire': 'engagementCommentaire'
    };

    // Initialiser la structure des documents
    Object.keys(documentsMapping).forEach(fileKey => {
      const docKey = documentsMapping[fileKey];
      
      if (!documentsData[docKey]) {
        documentsData[docKey] = {
          fichier: '',
          commentaire: ''
        };
      }
      
      if (req.files && req.files[fileKey]) {
        documentsData[docKey].fichier = `/documents/${req.files[fileKey][0].filename}`;
      }
    });

    // Ajouter les commentaires
    const commentairesMapping = {
      'commentaireCin': 'cin',
      'commentaireBacCommentaire': 'bacCommentaire',
      'commentaireReleveNoteBac': 'releveNoteBac',
      'commentaireDiplomeCommentaire': 'diplomeCommentaire',
      'commentaireAttestationReussiteCommentaire': 'attestationReussiteCommentaire',
      'commentaireReleveNotesFormationCommentaire': 'releveNotesFormationCommentaire',
      'commentairePasseport': 'passeport',
      'commentaireBacOuAttestationBacCommentaire': 'bacOuAttestationBacCommentaire',
      'commentaireAuthentificationBac': 'authentificationBac',
      'commentaireAuthenticationDiplome': 'authenticationDiplome',
      'commentaireEngagementCommentaire': 'engagementCommentaire'
    };

    Object.keys(commentairesMapping).forEach(commentKey => {
      const docKey = commentairesMapping[commentKey];
      const commentValue = req.body[commentKey];
      
      if (!documentsData[docKey]) {
        documentsData[docKey] = {
          fichier: '',
          commentaire: ''
        };
      }
      
      if (commentValue) {
        documentsData[docKey].commentaire = commentValue;
      }
    });

    // ===== FONCTION POUR NETTOYER LES VALEURS ENUM =====
    const cleanEnumValue = (value) => {
      // Si la valeur est undefined, null, ou chaîne vide, retourner undefined
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      // Sinon, retourner la valeur nettoyée
      return value.trim();
    };

    // Préparer les données de l'étudiant avec nettoyage des enum
    const etudiantData = {
      prenom, nomDeFamille, genre, 
      dateNaissance: new Date(dateNaissance),
      telephone, email, motDePasse: hashedPassword,
      cin: cin || '', passeport: passeport || '',
      lieuNaissance: lieuNaissance || '', pays: pays || '',
      cours: Array.isArray(cours) ? cours : (cours ? [cours] : []),
      niveau: parseInt(niveau) || undefined,
      niveauFormation, filiere, option, specialite, typeDiplome,
      diplomeAcces, specialiteDiplomeAcces, mention, lieuObtentionDiplome,
      serieBaccalaureat, anneeBaccalaureat: parseInt(anneeBaccalaureat) || undefined,
      premiereAnneeInscription: parseInt(premiereAnneeInscription) || undefined,
      sourceInscription, dateInscription, typePaiement,
      prixTotal: parseFloat(prixTotal) || 0,
      pourcentageBourse: parseFloat(pourcentageBourse) || 0,
      situation, codeEtudiant, dateEtReglement,
      actif: actif !== 'false',
      nouvelleInscription: nouvelleInscription !== 'false',
      paye: paye === 'true',
      handicape: handicape === 'true',
      resident: resident === 'true',
      fonctionnaire: fonctionnaire === 'true',
      mobilite: mobilite === 'true',
      
      // ===== NETTOYAGE DES CHAMPS ENUM CRITIQUES =====
      cycle: cleanEnumValue(cycle),
      specialiteIngenieur: cleanEnumValue(specialiteIngenieur),
      optionIngenieur: cleanEnumValue(optionIngenieur),
      specialiteLicencePro: cleanEnumValue(specialiteLicencePro),
      optionLicencePro: cleanEnumValue(optionLicencePro),
      specialiteMasterPro: cleanEnumValue(specialiteMasterPro),
      optionMasterPro: cleanEnumValue(optionMasterPro),
      
      typeFormation: cleanEnumValue(typeFormation),
      anneeScolaire: anneeScolaire || Etudiant.getAnneeScolaireActuelle(),
      modePaiement: modePaiement || 'mensuel',
      telephoneResponsable, codeBaccalaureat,
      
      // Champs partner spécifiques
      isPartner: true,
      nomPartner: req.isPartner ? req.partnerId : null,
      prixTotalPartner: parseFloat(prixTotalPartner) || 0,
      
      // Fichiers et documents
      ...files,
      documents: documentsData
    };

    console.log('Creating student for partner:', req.partnerId);
    console.log('Enum values after cleaning:', {
      cycle: etudiantData.cycle,
      specialiteIngenieur: etudiantData.specialiteIngenieur,
      optionIngenieur: etudiantData.optionIngenieur,
      specialiteLicencePro: etudiantData.specialiteLicencePro,
      specialiteMasterPro: etudiantData.specialiteMasterPro
    });

    const nouvelEtudiant = new Etudiant(etudiantData);
    await nouvelEtudiant.save();

    // Populer les infos du partner avant de répondre
    if (req.isPartner) {
      await nouvelEtudiant.populate('nomPartner', 'nomPartner active');
    }

    console.log('Student created successfully:', nouvelEtudiant.codeEtudiant);
    
    // Retourner sans le mot de passe
    const etudiantResponse = nouvelEtudiant.toObject();
    delete etudiantResponse.motDePasse;
    
    res.status(201).json(etudiantResponse);

  } catch (error) {
    console.error('Erreur création étudiant partner:', error);
    res.status(400).json({ 
      error: 'Erreur lors de la création de l\'étudiant',
      details: error.message 
    });
  }
});

// 3. Route pour modifier un étudiant partner
app.put('/api/partners/etudiants/:id', authCommercial, uploadEtudiants, async (req, res) => {
  try {
    // Trouver l'étudiant existant (doit appartenir à ce partner)
    const etudiantExistant = await Etudiant.findOne({ 
      _id: req.params.id, 
      nomPartner: req.partnerId,
      isPartner: true
    });
    
    if (!etudiantExistant) {
      return res.status(404).json({ 
        message: 'Étudiant non trouvé ou vous n\'êtes pas autorisé à le modifier' 
      });
    }

    // Utiliser la même logique de modification que dans le code commercial
    // mais avec les validations partner
    
    const modifications = {};
    
    // Traiter tous les champs de modification (similaire au code commercial)
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        modifications[key] = req.body[key];
      }
    });

    // S'assurer que les champs partner sont maintenus
    modifications.isPartner = true;
    modifications.nomPartner = req.partnerId;
    modifications.updatedAt = new Date();

    const etudiantMiseAJour = await Etudiant.findByIdAndUpdate(
      req.params.id,
      modifications,
      { 
        new: true,
        runValidators: true
      }
    );

    await etudiantMiseAJour.populate('nomPartner', 'nomPartner active');

    const etudiantResponse = etudiantMiseAJour.toObject();
    delete etudiantResponse.motDePasse;

    res.status(200).json({
      message: 'Étudiant mis à jour avec succès',
      data: etudiantResponse
    });

  } catch (err) {
    console.error('Erreur mise à jour étudiant partner:', err);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});

// 4. Route pour supprimer un étudiant partner
app.delete('/api/partners/etudiants/:id', authCommercial, async (req, res) => {
  try {
    const etudiant = await Etudiant.findOne({
      _id: req.params.id,
      nomPartner: req.partnerId,
      isPartner: true
    });

    if (!etudiant) {
      return res.status(404).json({ 
        message: 'Étudiant non trouvé ou vous n\'êtes pas autorisé à le supprimer' 
      });
    }

    await Etudiant.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Étudiant supprimé avec succès' });
  } catch (err) {
    console.error('Erreur suppression étudiant partner:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Route pour toggle le statut actif d'un étudiant partner
app.patch('/api/partners/etudiants/:id/actif', authCommercial, async (req, res) => {
  try {
    const etudiant = await Etudiant.findOne({
      _id: req.params.id,
      nomPartner: req.partnerId,
      isPartner: true
    });

    if (!etudiant) {
      return res.status(404).json({ 
        message: 'Étudiant non trouvé ou vous n\'êtes pas autorisé à le modifier' 
      });
    }

    etudiant.actif = !etudiant.actif;
    await etudiant.save();
    
    await etudiant.populate('nomPartner', 'nomPartner active');
    
    res.json(etudiant);
  } catch (err) {
    console.error('Erreur toggle actif étudiant partner:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Route pour récupérer les cours (fallback)
app.get('/api/partnerscours', authCommercial, async (req, res) => {
  try {
    // Si c'est un partner ou admin, retourner tous les cours
    if (req.isPartner || req.isAdmin) {
      const cours = await Cours.find({}).sort({ nom: 1 });
      res.json(cours);
    } else {
      res.status(403).json({ message: 'Accès interdit' });
    }
  } catch (err) {
    console.error('Erreur récupération cours partner:', err);
    res.status(500).json({ error: err.message });
  }
});





// Route pour obtenir les statistiques des étudiants Partners
app.get('/api/stats/partners', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Obtenir les statistiques avec la méthode du schéma
    const stats = await Etudiant.getStatsPartners();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error('Erreur lors de la récupération des stats partners:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});

// Route alternative plus détaillée pour les statistiques
app.get('/api/stats/partners/detailed', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Statistiques détaillées
    const partnersDetail = await Etudiant.find({ isPartner: true })
      .select('prenom nomDeFamille prixTotalPartner dateInscription')
      .lean();

    const normalDetail = await Etudiant.find({ isPartner: false })
      .select('prenom nomDeFamille prixTotal dateInscription')
      .lean();

    // Calculs
    const partnersCount = partnersDetail.length;
    const normalCount = normalDetail.length;
    const partnersRevenue = partnersDetail.reduce((sum, etudiant) => sum + (etudiant.prixTotalPartner || 0), 0);
    const normalRevenue = normalDetail.reduce((sum, etudiant) => sum + (etudiant.prixTotal || 0), 0);
    const totalRevenue = partnersRevenue + normalRevenue;

    res.json({
      success: true,
      data: {
        partners: {
          nombre: partnersCount,
          chiffreAffaire: partnersRevenue,
          pourcentageRevenue: totalRevenue > 0 ? ((partnersRevenue / totalRevenue) * 100).toFixed(2) : 0,
          etudiants: partnersDetail
        },
        normal: {
          nombre: normalCount,
          chiffreAffaire: normalRevenue,
          pourcentageRevenue: totalRevenue > 0 ? ((normalRevenue / totalRevenue) * 100).toFixed(2) : 0,
          etudiants: normalDetail
        },
        total: {
          nombre: partnersCount + normalCount,
          chiffreAffaire: totalRevenue
        }
      }
    });

  } catch (err) {
    console.error('Erreur lors de la récupération des stats détaillées partners:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: err.message
    });
  }
});

// Route pour obtenir les types de documents disponibles
app.get('/api/documents/types', authAdminOrPaiementManager, (req, res) => {
  try {
    const typesDocuments = Etudiant.getTypesDocuments();
    res.status(200).json(typesDocuments);
  } catch (err) {
    console.error('Erreur lors de la récupération des types de documents:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Route pour obtenir le statut des documents d'un étudiant
app.get('/api/etudiants/:id/documents/status', authAdmin, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id);
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    const statusDocuments = etudiant.getStatusDocuments();
    res.status(200).json(statusDocuments);
  } catch (err) {
    console.error('Erreur lors de la récupération du statut des documents:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Route pour ajouter/modifier un document spécifique
app.post('/api/etudiants/:id/documents/:typeDocument', authAdmin, uploadEtudiants, async (req, res) => {
  try {
    const { id, typeDocument } = req.params;
    const { commentaire } = req.body;

    const etudiant = await Etudiant.findById(id);
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    // Vérifier si le type de document est valide
    const typesValides = Etudiant.getTypesDocuments().map(t => t.key);
    if (!typesValides.includes(typeDocument)) {
      return res.status(400).json({ message: 'Type de document invalide' });
    }

    // Obtenir le fichier uploadé
    const documentField = `document${typeDocument.charAt(0).toUpperCase() + typeDocument.slice(1)}`;
    const nouveauFichier = req.files && req.files[documentField] && req.files[documentField][0] 
      ? `/documents/${req.files[documentField][0].filename}` 
      : undefined;

    // Si aucun fichier ni commentaire fourni
    if (!nouveauFichier && !commentaire) {
      return res.status(400).json({ message: 'Aucun fichier ou commentaire fourni' });
    }

    // Mettre à jour le document
    const documentExistant = etudiant.documents?.[typeDocument] || {};
    
    if (!etudiant.documents) {
      etudiant.documents = {};
    }
    
    etudiant.documents[typeDocument] = {
      fichier: nouveauFichier || documentExistant.fichier || '',
      commentaire: commentaire !== undefined ? commentaire : documentExistant.commentaire || ''
    };

    await etudiant.save();

    res.status(200).json({
      message: 'Document mis à jour avec succès',
      document: etudiant.documents[typeDocument]
    });

  } catch (err) {
    console.error('Erreur lors de la mise à jour du document:', err);
    res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
  }
});
// ===== ROUTES POUR LES TESTS DE LANGUE =====
// Importer le modèle Test en haut de votre fichier app.js
// const Test = require('./models/Test');
// GET - Liste des étudiants avec leurs niveaux de langue (Admin/Administratif)
// GET - Liste des étudiants avec leurs niveaux de langue (Admin/Administratif)
app.get('/api/admin/etudiants-tests', authAdmin, async (req, res) => {
  try {
    console.log('📋 Récupération des tests pour tous les étudiants');
    
    // Récupérer tous les étudiants actifs
    const etudiants = await Etudiant.find({ actif: true })
      .select('prenom nomDeFamille email telephone nouvelleInscription anneeScolaire') // AJOUT de anneeScolaire
      .sort({ nomDeFamille: 1 });

    // Pour chaque étudiant, récupérer ses résultats de tests
    const etudiantsAvecTests = await Promise.all(
      etudiants.map(async (etudiant) => {
        const statutTests = await Test.aTermineLesDeuxTests(etudiant._id);
        
        return {
          _id: etudiant._id,
          nomComplet: `${etudiant.nomDeFamille} ${etudiant.prenom}`,
          email: etudiant.email,
          telephone: etudiant.telephone,
          nouvelleInscription: etudiant.nouvelleInscription,
          anneeScolaire: etudiant.anneeScolaire, // AJOUT
          tests: {
            anglaisTermine: statutTests.anglaisTermine,
            francaisTermine: statutTests.francaisTermine,
            tousTermines: statutTests.tousTermines,
            niveauAnglais: statutTests.niveaux.anglais,
            niveauFrancais: statutTests.niveaux.francais
          }
        };
      })
    );

    console.log(`✅ ${etudiantsAvecTests.length} étudiants récupérés avec leurs tests`);

    res.json({
      success: true,
      total: etudiantsAvecTests.length,
      etudiants: etudiantsAvecTests
    });

  } catch (error) {
    console.error('❌ Erreur récupération étudiants-tests:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données',
      error: error.message
    });
  }
});

// GET - Détails des tests d'un étudiant spécifique (Admin)
app.get('/api/admin/etudiants/:id/tests-details', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const etudiant = await Etudiant.findById(id).select('prenom nomDeFamille email');
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    // Récupérer tous les tests de cet étudiant
    const tests = await Test.find({ etudiant: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      etudiant: {
        _id: etudiant._id,
        nomComplet: `${etudiant.nomDeFamille} ${etudiant.prenom}`,
        email: etudiant.email
      },
      tests: tests
    });

  } catch (error) {
    console.error('❌ Erreur récupération détails tests:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails',
      error: error.message
    });
  }
});
app.get('/api/tests/statut', authEtudiant, async (req, res) => {
  console.log('🎯 Route /api/tests/statut appelée');
  console.log('👤 req.etudiantId:', req.etudiantId);
  
  try {
    const etudiantId = req.etudiantId;
    
    if (!etudiantId) {
      console.log('❌ Pas d\'etudiantId dans la requête');
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    console.log('🔍 Recherche étudiant:', etudiantId);
    const etudiant = await Etudiant.findById(etudiantId);
    
    if (!etudiant) {
      console.log('❌ Étudiant non trouvé');
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }
    
    console.log('✅ Étudiant trouvé:', etudiant.email);
    console.log('📝 nouvelleInscription:', etudiant.nouvelleInscription);
    
    const statutTests = await Test.aTermineLesDeuxTests(etudiantId);
    console.log('📊 Statut tests:', statutTests);
    
    res.json({
      success: true,
      nouvelleInscription: etudiant.nouvelleInscription,
      ...statutTests
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération statut tests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du statut', 
      error: error.message 
    });
  }
});

// POST - Démarrer un nouveau test
app.post('/api/tests/demarrer', authEtudiant, async (req, res) => {
  try {
    const etudiantId = req.etudiantId;
    const { langue } = req.body;
    
    if (!['anglais', 'francais'].includes(langue)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Langue invalide. Utilisez "anglais" ou "francais"' 
      });
    }
    
    // Vérifier si un test en cours existe déjà
    const testEnCours = await Test.findOne({
      etudiant: etudiantId,
      langue: langue,
      statut: 'en_cours'
    });
    
    if (testEnCours) {
      // Vérifier si le test est expiré
      if (testEnCours.estExpire()) {
        testEnCours.statut = 'expire';
        await testEnCours.save();
      } else {
        return res.json({
          success: true,
          test: testEnCours,
          message: 'Test en cours trouvé'
        });
      }
    }
    
    // Créer un nouveau test
    const nouveauTest = new Test({
      etudiant: etudiantId,
      langue: langue,
      totalQuestions: langue === 'anglais' ? 60 : 26,
      dateDebut: new Date(),
      statut: 'en_cours'
    });
    
    await nouveauTest.save();
    
    res.json({
      success: true,
      test: nouveauTest,
      message: 'Test démarré avec succès'
    });
    
  } catch (error) {
    console.error('Erreur démarrage test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du démarrage du test', 
      error: error.message 
    });
  }
});

// PUT - Sauvegarder une réponse
app.put('/api/tests/:testId/reponse', authEtudiant, async (req, res) => {
  try {
    const { testId } = req.params;
    const { questionId, reponseIndex } = req.body;
    
    const test = await Test.findById(testId);
    
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test non trouvé' 
      });
    }
    
    // Vérifier que c'est bien le test de cet étudiant
    if (test.etudiant.toString() !== req.etudiantId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    if (test.statut !== 'en_cours') {
      return res.status(400).json({ 
        success: false, 
        message: 'Ce test est déjà terminé ou expiré' 
      });
    }
    
    // Vérifier si le test est expiré (20 minutes)
    if (test.estExpire()) {
      test.statut = 'expire';
      await test.save();
      return res.status(400).json({ 
        success: false, 
        message: 'Le test a expiré (temps limite de 20 minutes dépassé)',
        expire: true
      });
    }
    
    // Sauvegarder la réponse
    test.reponses.set(questionId.toString(), reponseIndex);
    await test.save();
    
    res.json({
      success: true,
      message: 'Réponse sauvegardée',
      test: test
    });
    
  } catch (error) {
    console.error('Erreur sauvegarde réponse:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la sauvegarde de la réponse', 
      error: error.message 
    });
  }
});

// POST - Terminer le test et calculer le niveau
app.post('/api/tests/:testId/terminer', authEtudiant, async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId);
    
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test non trouvé' 
      });
    }
    
    // Vérifier que c'est bien le test de cet étudiant
    if (test.etudiant.toString() !== req.etudiantId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    if (test.statut !== 'en_cours') {
      return res.status(400).json({ 
        success: false, 
        message: 'Ce test est déjà terminé' 
      });
    }
    
    // Terminer le test et calculer le niveau
    const resultat = test.terminerTest();
    await test.save();
    
    // Vérifier si les deux tests sont terminés pour mettre à jour nouvelleInscription
    const statutTests = await Test.aTermineLesDeuxTests(req.etudiantId);
    
    if (statutTests.tousTermines) {
      await Etudiant.findByIdAndUpdate(req.etudiantId, {
        nouvelleInscription: false
      });
    }
    
    res.json({
      success: true,
      message: 'Test terminé avec succès',
      resultat: resultat,
      tousTestsTermines: statutTests.tousTermines
    });
    
  } catch (error) {
    console.error('Erreur terminaison test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la terminaison du test', 
      error: error.message 
    });
  }
});

// GET - Obtenir le résultat d'un test terminé
app.get('/api/tests/:testId/resultat', authEtudiant, async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId);
    
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test non trouvé' 
      });
    }
    
    // Vérifier que c'est bien le test de cet étudiant
    if (test.etudiant.toString() !== req.etudiantId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    if (test.statut === 'en_cours') {
      return res.status(400).json({ 
        success: false, 
        message: 'Le test n\'est pas encore terminé' 
      });
    }
    
    res.json({
      success: true,
      test: {
        langue: test.langue,
        niveau: test.niveau,
        score: test.score,
        totalQuestions: test.totalQuestions,
        tempsEcoule: test.tempsEcoule,
        dateDebut: test.dateDebut,
        dateFin: test.dateFin,
        premiereErreur: test.premiereErreur
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération résultat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du résultat', 
      error: error.message 
    });
  }
});

// GET - Obtenir les questions du test (sans les réponses correctes)
app.get('/api/tests/questions/:langue', authEtudiant, async (req, res) => {
  try {
    const { langue } = req.params;
    
    if (!['anglais', 'francais'].includes(langue)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Langue invalide' 
      });
    }
    
    // Importer les questions depuis un fichier séparé ou les définir ici
    const questions = require(`./data/questions_${langue}.json`);
    
    res.json({
      success: true,
      questions: questions,
      totalQuestions: questions.length,
      dureeMinutes: 20
    });
    
  } catch (error) {
    console.error('Erreur récupération questions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des questions', 
      error: error.message 
    });
  }
});
// Route pour supprimer un document spécifique
app.delete('/api/etudiants/:id/documents/:typeDocument', authAdmin, async (req, res) => {
  try {
    const { id, typeDocument } = req.params;

    const etudiant = await Etudiant.findById(id);
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    // Vérifier si le type de document est valide
    const typesValides = Etudiant.getTypesDocuments().map(t => t.key);
    if (!typesValides.includes(typeDocument)) {
      return res.status(400).json({ message: 'Type de document invalide' });
    }

    // Supprimer le document
    if (etudiant.documents && etudiant.documents[typeDocument]) {
      etudiant.documents[typeDocument] = {
        fichier: '',
        commentaire: ''
      };
      await etudiant.save();
    }

    res.status(200).json({ message: 'Document supprimé avec succès' });

  } catch (err) {
    console.error('Erreur lors de la suppression du document:', err);
    res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
  }
});

// Route pour télécharger un document
app.get('/api/etudiants/:id/documents/:typeDocument/download', authAdmin, async (req, res) => {
  try {
    const { id, typeDocument } = req.params;

    const etudiant = await Etudiant.findById(id);
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    const document = etudiant.documents?.[typeDocument];
    if (!document || !document.fichier) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // Construire le chemin vers le fichier - CORRECTION ICI
    const filePath = path.join(__dirname, 'public', document.fichier);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }

    // NOUVEAU: Obtenir l'extension et le nom original du fichier
    const originalFilename = path.basename(document.fichier);
    const ext = path.extname(document.fichier).toLowerCase();
    
    // NOUVEAU: Définir le type MIME correct selon l'extension
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // NOUVEAU: Définir les headers appropriés
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
    
    // Télécharger le fichier avec le bon nom et type
    res.download(filePath, originalFilename, (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erreur lors du téléchargement' });
        }
      }
    });

  } catch (err) {
    console.error('Erreur lors du téléchargement du document:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
    }
  }
});
// ===== ROUTE POUR OBTENIR LES INFORMATIONS DE FORMATION (POUR LE FRONTEND) =====
// Helper pour ajouter la traçabilité aux séances
const addTraceabilityToSeance = (seanceData, userInfo, actionType) => {
  return {
    ...seanceData,
    lastActionById: userInfo.id,
    lastActionByName: userInfo.nom,
    lastActionByEmail: userInfo.email,
    lastActionByRole: userInfo.role,
    lastActionType: actionType,
    lastActionAt: new Date()
  };
};
// Ajoutez cette route pour que le frontend puisse récupérer les informations sans envoyer le niveau
app.get('/api/formations/info', authAdminOrPaiementManager, (req, res) => {
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
app.put('/api/etudiants/:id', authAdmin, uploadEtudiants, async (req, res) => {
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
      cycle, specialiteIngenieur, optionIngenieur, anneeScolaire,
      // Champs Partner
      isPartner, nomPartner, prixTotalPartner
    } = req.body;

    // 1. 🔍 RECHERCHER L'ÉTUDIANT EXISTANT
    const etudiantExistant = await Etudiant.findById(req.params.id);
    if (!etudiantExistant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    console.log(`📋 Étudiant trouvé: ${etudiantExistant.prenom} ${etudiantExistant.nomDeFamille}`);

    // NOUVEAU: Validation des champs Partner
    if (isPartner !== undefined) {
      const isPartnerBool = isPartner === 'true' || isPartner === true;
      
      if (isPartnerBool) {
        // Validation du nom du partner
        if (nomPartner !== undefined && (!nomPartner || nomPartner.trim() === '')) {
          return res.status(400).json({ 
            message: 'Le nom du partner est obligatoire pour les étudiants partenaires' 
          });
        }
        
        if (prixTotalPartner !== undefined && (!prixTotalPartner || parseFloat(prixTotalPartner) <= 0)) {
          return res.status(400).json({ 
            message: 'Le prix total Partner est obligatoire et doit être supérieur à 0 pour les étudiants partenaires' 
          });
        }
      }
    }

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
        
        // Champs Partner
        isPartner: etudiantExistant.isPartner,
        nomPartner: etudiantExistant.nomPartner,
        prixTotalPartner: etudiantExistant.prixTotalPartner,
        
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
        
        // Champs Partner
        if (isPartner !== undefined) data.isPartner = toBool(isPartner);
        if (nomPartner !== undefined) data.nomPartner = nomPartner?.trim() || '';
        if (prixTotalPartner !== undefined) data.prixTotalPartner = toNumber(prixTotalPartner) || 0;

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
    
    // Champs Partner
    if (isPartner !== undefined) modifications.isPartner = toBool(isPartner);
    if (nomPartner !== undefined) modifications.nomPartner = nomPartner?.trim() || '';
    if (prixTotalPartner !== undefined) modifications.prixTotalPartner = toNumber(prixTotalPartner) || 0;

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


// Route POST pour créer un étudiant
app.post('/api/etudiants', authAdmin, uploadEtudiants, async (req, res) => {
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
      modePaiement, telephoneResponsable, codeMassar, codeBaccalaureat,
      isPartner, nomPartner, prixTotalPartner
    } = req.body;

    // Validation des champs obligatoires
    if (!prenom || !nomDeFamille || !telephone || !email || !motDePasse || !dateNaissance || !genre) {
      return res.status(400).json({
        message: 'Les champs prenom, nomDeFamille, telephone, email, motDePasse, dateNaissance et genre sont obligatoires'
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

    // Validation du mode de paiement
    if (modePaiement && !['semestriel', 'trimestriel', 'mensuel', 'annuel'].includes(modePaiement)) {
      return res.status(400).json({ 
        message: 'Le mode de paiement doit être "semestriel", "trimestriel", "mensuel" ou "annuel"' 
      });
    }

    // Validation du genre
    if (!['Homme', 'Femme'].includes(genre)) {
      return res.status(400).json({ message: 'Le genre doit être "Homme" ou "Femme"' });
    }

    // Vérification de l'unicité de l'email
    const existe = await Etudiant.findOne({ email });
    if (existe) return res.status(400).json({ message: 'Email déjà utilisé' });

    // Vérification de l'unicité du code étudiant
    if (codeEtudiant) {
      const codeExiste = await Etudiant.findOne({ codeEtudiant });
      if (codeExiste) return res.status(400).json({ message: 'Code étudiant déjà utilisé' });
    }

    // Vérification de l'unicité du code Massar
    if (codeMassar) {
      const codeMassarExiste = await Etudiant.findOne({ codeMassar });
      if (codeMassarExiste) return res.status(400).json({ message: 'Code Massar déjà utilisé' });
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
    3: [
      'Entreprenariat, audit et finance', 
      'Développement commercial et marketing digital'
    ],
    4: [
      'Finance et Stratégie Entrepreneuriale Master 1',
      'Développement Commercial et Marketing Digital Master 1'
    ],
    5: [
      'Finance et Stratégie Entrepreneuriale Master 2',
      'Développement Commercial et Marketing Digital Master 2'
    ]
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

    // Validation Partner
    if (isPartner === true || isPartner === 'true') {
      if (!nomPartner || nomPartner.trim() === '') {
        return res.status(400).json({ 
          message: 'Le nom du partner est obligatoire pour un étudiant partner' 
        });
      }
      if (!prixTotalPartner || parseFloat(prixTotalPartner) <= 0) {
        return res.status(400).json({ 
          message: 'Le prix total partner doit être supérieur à 0 pour un étudiant partner' 
        });
      }
    }

    // Gestion des cours avec limite
    const MAX_ETUDIANTS = 50;
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

    // Gestion des documents avec commentaires
    const documents = {};
    const typesDocuments = [
      'cin', 'bacCommentaire', 'releveNoteBac', 'diplomeCommentaire',
      'attestationReussiteCommentaire', 'releveNotesFormationCommentaire',
      'passeport', 'bacOuAttestationBacCommentaire', 'authentificationBac',
      'authenticationDiplome', 'engagementCommentaire'
    ];

    typesDocuments.forEach(type => {
      const fichier = getFilePath(type);
      const commentaire = req.body[`${type}_commentaire`] || '';
      
      if (fichier || commentaire) {
        documents[type] = {
          fichier: fichier,
          commentaire: commentaire
        };
      }
    });

    const imagePath = getFilePath('image');
    
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

    const boolFields = ['actif', 'paye', 'handicape', 'resident', 'fonctionnaire', 'mobilite', 'nouvelleInscription', 'isPartner'];
    boolFields.forEach(field => {
      if (req.body[field] !== undefined) req.body[field] = toBool(req.body[field]);
    });

    const prixTotalNum = toNumber(prixTotal);
    const prixTotalPartnerNum = toNumber(prixTotalPartner);
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
      codeMassar: codeMassar?.trim() || '',
      passeport: passeport?.trim() || '',
      codeBaccalaureat: codeBaccalaureat?.trim() || '',
      telephoneResponsable: telephoneResponsable?.trim() || '',
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
      modePaiement: modePaiement || 'mensuel',
      
      // Nouveaux champs Partner - CORRIGÉ
      isPartner: req.body.isPartner || false,
      nomPartner: (nomPartner && nomPartner.trim() !== '') ? nomPartner.trim() : null,
      prixTotalPartner: prixTotalPartnerNum || 0,
      
      // Système de documents
      documents: documents,
      
      // Image
      image: imagePath,
      
      // Champs booléens
      actif: req.body.actif !== undefined ? req.body.actif : true,
      paye: req.body.paye || false,
      handicape: req.body.handicape || false,
      resident: req.body.resident || false,
      fonctionnaire: req.body.fonctionnaire || false,
      mobilite: req.body.mobilite || false,
      nouvelleInscription: req.body.nouvelleInscription !== undefined ? req.body.nouvelleInscription : true,
      commercial: commercial || null,
      creeParAdmin: req.adminId,
      
      anneeScolaire: anneeScolaire || Etudiant.getAnneeScolaireActuelle()
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
// PUT - Mise à jour du profil par l'étudiant (informations limitées)
app.put('/api/etudiant/mon-profil', authEtudiant, uploadEtudiants, async (req, res) => {
  try {
    const etudiantId = req.etudiantId;
    const etudiant = await Etudiant.findById(etudiantId);
    
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    const {
      telephone,
      telephoneResponsable,
      dateNaissance,
      lieuNaissance,
      pays,
      cin,
      codeMassar,
      passeport,
      codeBaccalaureat,
      serieBaccalaureat,
      anneeBaccalaureat,
      lieuObtentionDiplome,
      diplomeAcces,
      specialiteDiplomeAcces,
      mention,
      email,
      nouveauMotDePasse,
      motDePasseActuel
    } = req.body;

    const modifications = {};

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

    // Informations personnelles
    if (telephone !== undefined) modifications.telephone = telephone.trim();
    if (telephoneResponsable !== undefined) modifications.telephoneResponsable = telephoneResponsable?.trim() || '';
    if (dateNaissance !== undefined) modifications.dateNaissance = toDate(dateNaissance);
    if (lieuNaissance !== undefined) modifications.lieuNaissance = lieuNaissance?.trim() || '';
    if (pays !== undefined) modifications.pays = pays?.trim() || '';
    if (cin !== undefined) modifications.cin = cin?.trim() || '';
    if (codeMassar !== undefined) modifications.codeMassar = codeMassar?.trim() || '';
    if (passeport !== undefined) modifications.passeport = passeport?.trim() || '';
    if (codeBaccalaureat !== undefined) modifications.codeBaccalaureat = codeBaccalaureat?.trim() || '';

    // Informations académiques secondaires
    if (serieBaccalaureat !== undefined) modifications.serieBaccalaureat = serieBaccalaureat?.trim() || '';
    if (anneeBaccalaureat !== undefined) modifications.anneeBaccalaureat = toNumber(anneeBaccalaureat);
    if (lieuObtentionDiplome !== undefined) modifications.lieuObtentionDiplome = lieuObtentionDiplome?.trim() || '';
    if (diplomeAcces !== undefined) modifications.diplomeAcces = diplomeAcces?.trim() || '';
    if (specialiteDiplomeAcces !== undefined) modifications.specialiteDiplomeAcces = specialiteDiplomeAcces?.trim() || '';
    if (mention !== undefined) modifications.mention = mention?.trim() || '';

    // Gestion de l'image
    if (req.files && req.files['image'] && req.files['image'][0]) {
      modifications.image = `/uploads/${req.files['image'][0].filename}`;
    }

    // Gestion de l'email
    if (email && email !== etudiant.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
      }

      const emailExiste = await Etudiant.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: etudiantId } 
      });
      
      if (emailExiste) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      
      modifications.email = email.toLowerCase().trim();
    }

    // Gestion du mot de passe
    if (nouveauMotDePasse && nouveauMotDePasse.trim() !== '') {
      if (!motDePasseActuel) {
        return res.status(400).json({ message: 'Mot de passe actuel requis' });
      }

      const motDePasseValide = await bcrypt.compare(motDePasseActuel, etudiant.motDePasse);
      if (!motDePasseValide) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }

      if (nouveauMotDePasse.length < 6) {
        return res.status(400).json({ 
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
        });
      }

      modifications.motDePasse = await bcrypt.hash(nouveauMotDePasse.trim(), 10);
    }

    // ===== GESTION DES DOCUMENTS =====
    const documentsExistants = etudiant.documents || {};
    const nouveauxDocuments = {};

    const typesDocuments = [
      { key: 'cin', fileField: 'documentCin' },
      { key: 'bacCommentaire', fileField: 'documentBacCommentaire' },
      { key: 'releveNoteBac', fileField: 'documentReleveNoteBac' },
      { key: 'diplomeCommentaire', fileField: 'documentDiplomeCommentaire' },
      { key: 'attestationReussiteCommentaire', fileField: 'documentAttestationReussiteCommentaire' },
      { key: 'passeport', fileField: 'documentPasseport' }
    ];

    typesDocuments.forEach(type => {
      const documentExistant = documentsExistants[type.key] || {};
      const nouveauFichier = req.files && req.files[type.fileField] && req.files[type.fileField][0]
        ? `/documents/${req.files[type.fileField][0].filename}`
        : undefined;

      nouveauxDocuments[type.key] = {
        fichier: nouveauFichier !== undefined ? nouveauFichier : documentExistant.fichier || '',
        commentaire: documentExistant.commentaire || ''
      };
    });

    modifications.documents = nouveauxDocuments;

    // Appliquer les modifications
    Object.keys(modifications).forEach(key => {
      etudiant[key] = modifications[key];
    });

    etudiant.markModified('documents');
    await etudiant.save();

    const etudiantResponse = etudiant.toObject();
    delete etudiantResponse.motDePasse;

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      etudiant: etudiantResponse
    });

  } catch (error) {
    console.error('Erreur mise à jour profil étudiant:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email ou code déjà utilisé' });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
});
// Route PUT pour modifier un étudiant
app.put('/api/etudiants/:id', authAdmin, uploadEtudiants, async (req, res) => {
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
      modePaiement,
      telephoneResponsable,
      codeBaccalaureat,
      isPartner,
      nomPartner,
      prixTotalPartner,
      commentaireCin,
      commentaireBacCommentaire,
      commentaireReleveNoteBac,
      commentaireDiplomeCommentaire,
      commentaireAttestationReussiteCommentaire,
      commentaireReleveNotesFormationCommentaire,
      commentairePasseport,
      commentaireBacOuAttestationBacCommentaire,
      commentaireAuthentificationBac,
      commentaireAuthenticationDiplome,
      commentaireEngagementCommentaire
    } = req.body;

    const etudiantExistant = await Etudiant.findById(req.params.id);
    if (!etudiantExistant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    if (modePaiement && !['semestriel', 'trimestriel', 'mensuel', 'annuel'].includes(modePaiement)) {
      return res.status(400).json({ 
        message: 'Le mode de paiement doit être "semestriel", "trimestriel", "mensuel" ou "annuel"' 
      });
    }

    if (isPartner !== undefined) {
      const isPartnerBool = isPartner === 'true' || isPartner === true;
      
      if (isPartnerBool) {
        if (nomPartner !== undefined && (!nomPartner || nomPartner.trim() === '')) {
          return res.status(400).json({ 
            message: 'Le nom du partner est obligatoire pour les étudiants partenaires' 
          });
        }
        
        if (prixTotalPartner !== undefined && (!prixTotalPartner || parseFloat(prixTotalPartner) <= 0)) {
          return res.status(400).json({ 
            message: 'Le prix total Partner est obligatoire et doit être supérieur à 0 pour les étudiants partenaires' 
          });
        }
      }
    }

    const getDocumentPath = (documentField) => {
      return req.files && req.files[documentField] && req.files[documentField][0] 
        ? `/documents/${req.files[documentField][0].filename}` 
        : undefined;
    };

    const imagePath = req.files && req.files['image'] && req.files['image'][0] 
      ? `/uploads/${req.files['image'][0].filename}` 
      : undefined;

    const toDate = (val) => {
      if (!val) return undefined;
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    };

    const toNumber = (val) => {
      if (val === undefined || val === '' || val === null) return undefined;
      const n = parseFloat(val);
      return isNaN(n)? undefined : n;
    };

    const toBool = (val) => val === 'true' || val === true;

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

    if (codeEtudiant && codeEtudiant !== etudiantExistant.codeEtudiant) {
      const codeExiste = await Etudiant.findOne({ 
        codeEtudiant: codeEtudiant.trim(),
        _id: { $ne: req.params.id } 
      });
      if (codeExiste) {
        return res.status(400).json({ message: 'Code étudiant déjà utilisé par un autre étudiant' });
      }
    }

    const modifications = {};

    if (prenom !== undefined) modifications.prenom = prenom.trim();
    if (nomDeFamille !== undefined) modifications.nomDeFamille = nomDeFamille.trim();
    if (genre !== undefined) modifications.genre = genre;
    if (dateNaissance !== undefined) modifications.dateNaissance = toDate(dateNaissance);
    if (telephone !== undefined) modifications.telephone = telephone.trim();
    if (telephoneResponsable !== undefined) modifications.telephoneResponsable = telephoneResponsable?.trim() || '';
    if (email !== undefined) modifications.email = email.toLowerCase().trim();
    if (cin !== undefined) modifications.cin = cin.trim();
    if (passeport !== undefined) modifications.passeport = passeport.trim();
    if (codeBaccalaureat !== undefined) modifications.codeBaccalaureat = codeBaccalaureat?.trim() || '';
    if (lieuNaissance !== undefined) modifications.lieuNaissance = lieuNaissance.trim();
    if (pays !== undefined) modifications.pays = pays.trim();
    if (niveau !== undefined) modifications.niveau = toNumber(niveau);
    if (niveauFormation !== undefined) modifications.niveauFormation = niveauFormation.trim();
    if (filiere !== undefined) modifications.filiere = filiere.trim();
    if (typeFormation !== undefined) modifications.typeFormation = typeFormation;
    if (modePaiement !== undefined) modifications.modePaiement = modePaiement;
    if (anneeScolaire !== undefined) modifications.anneeScolaire = anneeScolaire;
    if (actif !== undefined) modifications.actif = toBool(actif);
    if (paye !== undefined) modifications.paye = toBool(paye);
    if (handicape !== undefined) modifications.handicape = toBool(handicape);
    if (resident !== undefined) modifications.resident = toBool(resident);
    if (fonctionnaire !== undefined) modifications.fonctionnaire = toBool(fonctionnaire);
    if (mobilite !== undefined) modifications.mobilite = toBool(mobilite);
    if (nouvelleInscription !== undefined) modifications.nouvelleInscription = toBool(nouvelleInscription);
    if (commercial !== undefined) modifications.commercial = commercial || null;
    if (codeEtudiant !== undefined) modifications.codeEtudiant = codeEtudiant?.trim() || '';
    if (dateEtReglement !== undefined) modifications.dateEtReglement = toDate(dateEtReglement);
    if (prixTotal !== undefined) modifications.prixTotal = toNumber(prixTotal);
    if (pourcentageBourse !== undefined) modifications.pourcentageBourse = toNumber(pourcentageBourse);
    if (situation !== undefined) modifications.situation = situation?.trim() || '';
    if (sourceInscription !== undefined) modifications.sourceInscription = sourceInscription?.trim() || '';
    if (typePaiement !== undefined) modifications.typePaiement = typePaiement?.trim() || '';
    if (typeDiplome !== undefined) modifications.typeDiplome = typeDiplome?.trim() || '';
    if (diplomeAcces !== undefined) modifications.diplomeAcces = diplomeAcces?.trim() || '';
    if (specialiteDiplomeAcces !== undefined) modifications.specialiteDiplomeAcces = specialiteDiplomeAcces?.trim() || '';
    if (mention !== undefined) modifications.mention = mention?.trim() || '';
    if (lieuObtentionDiplome !== undefined) modifications.lieuObtentionDiplome = lieuObtentionDiplome?.trim() || '';
    if (serieBaccalaureat !== undefined) modifications.serieBaccalaureat = serieBaccalaureat?.trim() || '';
    if (anneeBaccalaureat !== undefined) modifications.anneeBaccalaureat = toNumber(anneeBaccalaureat);
    if (premiereAnneeInscription !== undefined) modifications.premiereAnneeInscription = toNumber(premiereAnneeInscription);
    
    // NOUVEAUX CHAMPS PARTNER - VERSION CORRIGÉE
    if (isPartner !== undefined) {
      const isPartnerBool = toBool(isPartner);
      modifications.isPartner = isPartnerBool;
      
      if (!isPartnerBool) {
        modifications.nomPartner = null;
        modifications.prixTotalPartner = 0;
      }
    }

    if (nomPartner !== undefined) {
      if (nomPartner && nomPartner.trim() !== '') {
        modifications.nomPartner = nomPartner.trim();
      } else {
        modifications.nomPartner = null;
      }
    }

    if (prixTotalPartner !== undefined) {
      modifications.prixTotalPartner = toNumber(prixTotalPartner) || 0;
    }
    
    if (specialite !== undefined) modifications.specialite = specialite?.trim() || '';
    if (option !== undefined) modifications.option = option?.trim() || '';
    if (cycle !== undefined) modifications.cycle = cycle;
    if (specialiteIngenieur !== undefined) modifications.specialiteIngenieur = specialiteIngenieur?.trim() || undefined;
    if (optionIngenieur !== undefined) modifications.optionIngenieur = optionIngenieur?.trim() || undefined;
    if (specialiteLicencePro !== undefined) modifications.specialiteLicencePro = specialiteLicencePro?.trim() || undefined;
    if (optionLicencePro !== undefined) modifications.optionLicencePro = optionLicencePro?.trim() || undefined;
    if (specialiteMasterPro !== undefined) modifications.specialiteMasterPro = specialiteMasterPro?.trim() || undefined;
    if (optionMasterPro !== undefined) modifications.optionMasterPro = optionMasterPro?.trim() || undefined;
    
    if (imagePath !== undefined) modifications.image = imagePath;

    if (motDePasse !== undefined && motDePasse !== null && motDePasse.trim() !== '') {
      if (motDePasse.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      const hashedPassword = await bcrypt.hash(motDePasse.trim(), 10);
      modifications.motDePasse = hashedPassword;
    }

    if (modifications.pourcentageBourse !== undefined && modifications.pourcentageBourse !== null) {
      if (modifications.pourcentageBourse < 0 || modifications.pourcentageBourse > 100) {
        return res.status(400).json({ message: 'Le pourcentage de bourse doit être entre 0 et 100' });
      }
    }

    if (modePaiement === 'annuel' && paye === undefined) {
      modifications.paye = true;
    }

    const documentsExistants = etudiantExistant.documents || {};
    const nouveauxDocuments = {};

    const typesDocuments = [
      { key: 'cin', fileField: 'documentCin', commentField: 'commentaireCin' },
      { key: 'bacCommentaire', fileField: 'documentBacCommentaire', commentField: 'commentaireBacCommentaire' },
      { key: 'releveNoteBac', fileField: 'documentReleveNoteBac', commentField: 'commentaireReleveNoteBac' },
      { key: 'diplomeCommentaire', fileField: 'documentDiplomeCommentaire', commentField: 'commentaireDiplomeCommentaire' },
      { key: 'attestationReussiteCommentaire', fileField: 'documentAttestationReussiteCommentaire', commentField: 'commentaireAttestationReussiteCommentaire' },
      { key: 'releveNotesFormationCommentaire', fileField: 'documentReleveNotesFormationCommentaire', commentField: 'commentaireReleveNotesFormationCommentaire' },
      { key: 'passeport', fileField: 'documentPasseport', commentField: 'commentairePasseport' },
      { key: 'bacOuAttestationBacCommentaire', fileField: 'documentBacOuAttestationBacCommentaire', commentField: 'commentaireBacOuAttestationBacCommentaire' },
      { key: 'authentificationBac', fileField: 'documentAuthentificationBac', commentField: 'commentaireAuthentificationBac' },
      { key: 'authenticationDiplome', fileField: 'documentAuthenticationDiplome', commentField: 'commentaireAuthenticationDiplome' },
      { key: 'engagementCommentaire', fileField: 'documentEngagementCommentaire', commentField: 'commentaireEngagementCommentaire' }
    ];

    typesDocuments.forEach(type => {
      const documentExistant = documentsExistants[type.key] || {};
      const nouveauFichier = getDocumentPath(type.fileField);
      const nouveauCommentaire = req.body[type.commentField];

      nouveauxDocuments[type.key] = {
        fichier: nouveauFichier !== undefined ? nouveauFichier : documentExistant.fichier || '',
        commentaire: nouveauCommentaire !== undefined ? nouveauCommentaire : documentExistant.commentaire || ''
      };
    });

    modifications.documents = nouveauxDocuments;

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

    const etudiantResponse = etudiantMiseAJour.toObject();
    delete etudiantResponse.motDePasse;

    res.status(200).json({
      message: 'Étudiant mis à jour avec succès',
      data: etudiantResponse
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
// ===== NOUVELLE ROUTE POUR STATISTIQUES DÉTAILLÉES =====
app.get('/api/statistiques', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/etudiants', authAdmin, async (req, res) => {
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
app.get('/api/etudiant', authAdminOrPaiementManager, async (req, res) => {
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
app.patch('/api/etudiants/:id/actif', authAdmin, async (req, res) => {
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
app.put('/api/evenements/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/evenements/:id', authAdminOrPaiementManager, async (req, res) => {
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
// Remove both routes and replace with this single corrected one
app.get('/api/professeur/presences', authProfesseur, async (req, res) => {
  try {
    const data = await Presence.find({ creePar: req.professeurId })
      .populate('etudiant', 'prenom nomDeFamille telephone')
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
    const { 
      etudiant, cours, seanceId, dateSession, present, absent, retard,
      retardMinutes, remarque, heure, periode, matiere, nomProfesseur
    } = req.body;

    console.log('=== DÉBOGAGE CRÉATION PRÉSENCE ===');
    console.log('etudiant:', etudiant);
    console.log('cours:', cours);
    console.log('seanceId:', seanceId);
    console.log('dateSession:', dateSession);
    console.log('matiere reçue:', matiere);

    // Validations de base
    if (!etudiant || !cours || !dateSession) {
      return res.status(400).json({ 
        message: 'Champs requis manquants' 
      });
    }

    // Validation seanceId obligatoire pour éviter les conflits
    if (!seanceId) {
      return res.status(400).json({ 
        message: 'seanceId est requis pour identifier la séance spécifique' 
      });
    }

    // Récupérer professeur avec ses cours enseignés
    const prof = await Professeur.findById(req.professeurId).lean();
    if (!prof) {
      return res.status(404).json({ 
        message: 'Professeur non trouvé' 
      });
    }

    // Vérification des permissions (ancienne et nouvelle méthode)
    const aAcces = prof.cours.includes(cours) || 
                   (prof.coursEnseignes && prof.coursEnseignes.some(c => c.nomCours === cours));
    
    if (!aAcces) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez pas marquer la présence pour ce cours.' 
      });
    }

    // Déterminer les statuts
    let presentStatus = present || false;
    let absentStatus = absent || false;
    let retardStatus = retard || false;
    let retardMinutesValue = retardStatus ? (parseInt(retardMinutes) || 0) : 0;

    // Déterminer la matière avec priorité aux données reçues
    let matiereFinale = 'Matière non spécifiée';
    
    // Priorité 1: Matière explicitement fournie dans la requête
    if (matiere && matiere.trim() !== '' && matiere !== 'Séance manuelle') {
      matiereFinale = matiere;
      console.log('✅ Matière utilisée depuis requête:', matiereFinale);
    }
    // Priorité 2: Si on a un seanceId, récupérer la matière de la séance
    else if (seanceId) {
      try {
        const seanceDoc = await Seance.findById(seanceId).lean();
        if (seanceDoc && seanceDoc.matiere && seanceDoc.matiere.trim() !== '') {
          matiereFinale = seanceDoc.matiere;
          console.log('✅ Matière trouvée dans la séance:', matiereFinale);
        } else {
          // Fallback sur le professeur
          const coursEnseigneProfesseur = prof.coursEnseignes && 
            prof.coursEnseignes.find(c => c.nomCours === cours);
          
          if (coursEnseigneProfesseur && coursEnseigneProfesseur.matiere) {
            matiereFinale = coursEnseigneProfesseur.matiere;
            console.log('✅ Matière trouvée via prof.coursEnseignes:', matiereFinale);
          } else if (prof.matiere) {
            matiereFinale = prof.matiere;
            console.log('✅ Matière trouvée via prof.matiere:', matiereFinale);
          } else {
            matiereFinale = cours; // Utiliser le nom du cours
            console.log('⚠️ Fallback sur nom du cours:', matiereFinale);
          }
        }
      } catch (seanceError) {
        console.warn('Erreur récupération séance:', seanceError.message);
        matiereFinale = prof.matiere || cours;
      }
    }
    // Priorité 3: Utiliser la matière du professeur
    else {
      const coursEnseigneProfesseur = prof.coursEnseignes && 
        prof.coursEnseignes.find(c => c.nomCours === cours);
      
      if (coursEnseigneProfesseur && coursEnseigneProfesseur.matiere) {
        matiereFinale = coursEnseigneProfesseur.matiere;
        console.log('✅ Matière prof coursEnseignes:', matiereFinale);
      } else if (prof.matiere) {
        matiereFinale = prof.matiere;
        console.log('✅ Matière prof générale:', matiereFinale);
      } else {
        matiereFinale = cours;
        console.log('⚠️ Dernier fallback sur cours:', matiereFinale);
      }
    }
    
    console.log('Matière finale utilisée:', matiereFinale);

    // CORRECTION PRINCIPALE: Chercher par etudiant + seanceId au lieu de etudiant + cours + date
    const existingPresence = await Presence.findOne({
      etudiant: etudiant,
      seanceId: seanceId
    });

    console.log('Présence existante trouvée:', existingPresence ? 'OUI' : 'NON');
    if (existingPresence) {
      console.log('ID présence existante:', existingPresence._id);
    }

    if (existingPresence) {
      // Mise à jour de la présence existante pour cette séance spécifique
      existingPresence.present = presentStatus;
      existingPresence.absent = absentStatus;
      existingPresence.retard = retardStatus;
      existingPresence.retardMinutes = retardMinutesValue;
      existingPresence.remarque = remarque || '';
      existingPresence.matiere = matiereFinale;
      existingPresence.heure = heure || '';
      existingPresence.periode = periode || 'matin';
      existingPresence.nomProfesseur = nomProfesseur || prof.nom;
      
      await existingPresence.save();
      
      console.log('✅ Présence mise à jour pour seanceId:', seanceId);
      console.log('Matière mise à jour:', matiereFinale);
      
      return res.status(200).json({
        message: 'Présence mise à jour',
        presence: existingPresence
      });
    }

    // Création d'une nouvelle présence
    const presence = new Presence({
      etudiant, 
      cours, 
      seanceId: seanceId,
      dateSession: new Date(dateSession),
      present: presentStatus, 
      absent: absentStatus, 
      retard: retardStatus,
      retardMinutes: retardMinutesValue,
      remarque: remarque || '', 
      heure: heure || '', 
      periode: periode || 'matin',
      matiere: matiereFinale,
      nomProfesseur: nomProfesseur || prof.nom,
      creePar: req.professeurId
    });

    await presence.save();
    
    console.log('✅ Nouvelle présence créée pour seanceId:', seanceId);
    console.log('Matière enregistrée:', matiereFinale);
    console.log('==================================');
    
    res.status(201).json({
      message: 'Présence enregistrée avec succès',
      presence
    });

  } catch (err) {
    console.error('Erreur création présence:', err);
    
    // Gérer l'erreur de duplication d'index unique
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: 'Présence déjà enregistrée pour cet étudiant et cette séance',
        error: 'Duplicate entry'
      });
    }
    
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Route pour enregistrer plusieurs présences en une fois (bulk)
app.post('/api/presences/bulk', authProfesseur, async (req, res) => {
  try {
    const { presences } = req.body;

    if (!presences || !Array.isArray(presences)) {
      return res.status(400).json({
        message: '❌ Format invalide: "presences" doit être un tableau'
      });
    }

    const prof = await Professeur.findById(req.professeurId);
    if (!prof) {
      return res.status(404).json({ message: '❌ Professeur non trouvé.' });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < presences.length; i++) {
      try {
        const presenceData = presences[i];
        const { 
          etudiant, 
          cours, 
          seanceId,
          dateSession, 
          statut, // 'present', 'absent', 'retard'
          retardMinutes,
          remarque, 
          heure, 
          periode,
          matiere,
          nomProfesseur
        } = presenceData;

        // Validation
        if (!etudiant || !cours || !dateSession || !statut) {
          errors.push({
            index: i,
            error: 'Champs requis manquants'
          });
          continue;
        }

        // Vérifier le cours
        if (!prof.cours.includes(cours)) {
          errors.push({
            index: i,
            error: 'Cours non autorisé pour ce professeur'
          });
          continue;
        }

        // Définir les statuts
        const present = statut === 'present';
        const absent = statut === 'absent';
        const retard = statut === 'retard';
        const retardMinutesValue = retard ? (parseInt(retardMinutes) || 0) : 0;

        // Validation retard
        if (retard && retardMinutesValue <= 0) {
          errors.push({
            index: i,
            error: 'Temps de retard invalide'
          });
          continue;
        }

        // Vérifier si existe déjà
        const existingPresence = await Presence.findOne({
          etudiant,
          cours,
          dateSession: new Date(dateSession)
        });

        if (existingPresence) {
          // Mise à jour
          existingPresence.present = present;
          existingPresence.absent = absent;
          existingPresence.retard = retard;
          existingPresence.retardMinutes = retardMinutesValue;
          existingPresence.remarque = remarque || '';
          existingPresence.heure = heure || '';
          existingPresence.periode = periode || 'matin';
          existingPresence.seanceId = seanceId || null;
          existingPresence.matiere = matiere || prof.matiere || '';
          existingPresence.nomProfesseur = nomProfesseur || prof.nom || '';
          existingPresence.modifiePar = req.professeurId;
          existingPresence.dateModification = new Date();

          await existingPresence.save();
          results.push({
            index: i,
            action: 'updated',
            presence: existingPresence
          });
        } else {
          // Création
          const newPresence = new Presence({
            etudiant,
            cours,
            seanceId: seanceId || null,
            dateSession: new Date(dateSession),
            present,
            absent,
            retard,
            retardMinutes: retardMinutesValue,
            remarque: remarque || '',
            heure: heure || '',
            periode: periode || 'matin',
            matiere: matiere || prof.matiere || '',
            nomProfesseur: nomProfesseur || prof.nom || '',
            creePar: req.professeurId,
            dateCreation: new Date()
          });

          await newPresence.save();
          results.push({
            index: i,
            action: 'created',
            presence: newPresence
          });
        }

      } catch (itemError) {
        errors.push({
          index: i,
          error: itemError.message
        });
      }
    }

    res.status(200).json({
      message: `✅ Traitement terminé: ${results.length} succès, ${errors.length} erreurs`,
      results,
      errors,
      summary: {
        total: presences.length,
        success: results.length,
        failed: errors.length
      }
    });

  } catch (err) {
    console.error('❌ Erreur lors de l\'enregistrement en lot:', err);
    res.status(500).json({ 
      message: '❌ Erreur serveur lors de l\'enregistrement en lot',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  }
});
// Ajoutez ces routes à votre app.js après les routes existantes

// ✅ Route pour récupérer toutes les notifications
// 🔧 API de notifications corrigée avec debug



// 🔧 Route de débogage spéciale
app.get('/api/debug/notifications', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/dashboard/stats', authAdminOrPaiementManager, async (req, res) => {
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














// ===== BACKEND CORRIGÉ POUR INCLURE DIMANCHE =====

// Route pour récupérer le profil du professeur connecté
app.get('/api/professeurs/mon-profil', authProfesseur, async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.professeurId)
      .select('nom email estPermanent tarifHoraire actif cours coursEnseignes matiere');
    
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    res.json({
      _id: professeur._id,
      nom: professeur.nom,
      email: professeur.email,
      estPermanent: professeur.estPermanent,
      tarifHoraire: professeur.tarifHoraire,
      actif: professeur.actif,
      cours: professeur.cours,
      coursEnseignes: professeur.coursEnseignes,
      matiere: professeur.matiere
    });

  } catch (err) {
    console.error('Erreur récupération profil professeur:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Modification de votre route existante pour supporter le paramètre semaine
// Fonction pour fusionner les doublons (même date + même horaire)
function fusionnerDoublons(seances) {
  const groupes = {};

  seances.forEach(seance => {
    // Créer une clé unique basée sur: date + jour + horaire
    const dateStr = seance.dateSeance ? seance.dateSeance.toISOString().split('T')[0] : '';
    const cle = `${dateStr}-${seance.jour}-${seance.heureDebut}-${seance.heureFin}`;

    if (!groupes[cle]) {
      // Première séance de ce créneau
      groupes[cle] = {
        ...seance.toObject ? seance.toObject() : seance,
        coursMultiples: [seance.coursId?.nom || seance.cours || 'Cours'],
        matieresMultiples: [seance.matiere].filter(Boolean),
        sallesMultiples: [seance.salle].filter(Boolean),
        estFusionne: false
      };
    } else {
      // Doublon détecté - fusionner les informations
      groupes[cle].estFusionne = true;
      
      // Ajouter le cours si différent
      const nouveauCours = seance.coursId?.nom || seance.cours;
      if (nouveauCours && !groupes[cle].coursMultiples.includes(nouveauCours)) {
        groupes[cle].coursMultiples.push(nouveauCours);
      }
      
      // Ajouter la matière si différente
      if (seance.matiere && !groupes[cle].matieresMultiples.includes(seance.matiere)) {
        groupes[cle].matieresMultiples.push(seance.matiere);
      }
      
      // Ajouter la salle si différente
      if (seance.salle && !groupes[cle].sallesMultiples.includes(seance.salle)) {
        groupes[cle].sallesMultiples.push(seance.salle);
      }
    }
  });

  // Convertir les groupes fusionnés en tableau
  return Object.values(groupes).map(groupe => {
    // Créer un objet avec les informations fusionnées
    const seanceFusionnee = {
      ...groupe,
      cours: groupe.coursMultiples.join(' + '),
      matiere: groupe.matieresMultiples.join(' / ') || null,
      salle: groupe.sallesMultiples.join(' / ') || null,
      nombreCoursSimultanes: groupe.coursMultiples.length
    };

    // Supprimer les propriétés temporaires
    delete seanceFusionnee.coursMultiples;
    delete seanceFusionnee.matieresMultiples;
    delete seanceFusionnee.sallesMultiples;

    return seanceFusionnee;
  });
}

// Route pour récupérer les séances d'une semaine avec fusion des doublons
app.get('/api/seances/professeur/semaine/:lundiSemaine', authProfesseur, async (req, res) => {
  try {
    const { lundiSemaine } = req.params;
    
    const dateLundi = new Date(lundiSemaine);
    const dateDimanche = new Date(dateLundi.getTime() + 6 * 24 * 60 * 60 * 1000);
    dateDimanche.setHours(23, 59, 59, 999);

    console.log(`Recherche séances professeur ${req.professeurId} pour semaine ${lundiSemaine}`);

    const seances = await Seance.find({
      professeur: req.professeurId,
      typeSeance: { $in: ['reelle', 'exception', 'rattrapage'] },
      dateSeance: {
        $gte: dateLundi,
        $lte: dateDimanche
      },
      actif: true
    })
    .populate('professeur', 'nom estPermanent tarifHoraire')
    .populate('coursId', 'nom')
    .sort({ dateSeance: 1, heureDebut: 1 });

    console.log(`${seances.length} séances brutes trouvées avant fusion`);

    // FUSIONNER LES DOUBLONS
    const seancesFusionnees = fusionnerDoublons(seances);

    console.log(`${seancesFusionnees.length} séances après fusion des doublons`);

    // Ajouter les calculs (une seule fois par créneau unique)
    const seancesAvecCalculs = await Promise.all(
      seancesFusionnees.map(async (seance) => {
        // Recréer un objet Seance-like pour utiliser la méthode calculerDureeEtMontant
        if (seance.calculerDureeEtMontant) {
          const calculs = await seance.calculerDureeEtMontant();
          return {
            ...seance,
            dureeHeures: calculs.dureeHeures,
            montant: calculs.montant
          };
        } else {
          // Calcul manuel si la méthode n'est pas disponible
          const dureeHeures = calculerDureeSeance(seance.heureDebut, seance.heureFin);
          const professeur = seance.professeur;
          const montant = professeur && !professeur.estPermanent && professeur.tarifHoraire
            ? dureeHeures * professeur.tarifHoraire
            : 0;
          
          return {
            ...seance,
            dureeHeures: Math.round(dureeHeures * 100) / 100,
            montant: Math.round(montant * 100) / 100
          };
        }
      })
    );

    res.json(seancesAvecCalculs);

  } catch (err) {
    console.error('Erreur récupération séances semaine:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour récupérer les séances avec paramètre semaine
app.get('/api/seances/professeur', authProfesseur, async (req, res) => {
  try {
    const { semaine } = req.query;
    
    let dateFilter = {};
    if (semaine) {
      const lundiSemaine = new Date(semaine);
      const dimancheSemaine = new Date(lundiSemaine.getTime() + 6 * 24 * 60 * 60 * 1000);
      dimancheSemaine.setHours(23, 59, 59, 999);
      
      dateFilter = {
        dateSeance: {
          $gte: lundiSemaine,
          $lte: dimancheSemaine
        }
      };
    }
    
    const seances = await Seance.find({
      professeur: req.professeurId,
      typeSeance: { $in: ['reelle', 'exception', 'rattrapage'] },
      actif: true,
      ...dateFilter
    })
    .populate('professeur', 'nom estPermanent tarifHoraire')
    .populate('coursId', 'nom')
    .sort({ dateSeance: 1, heureDebut: 1 });
    
    // FUSIONNER LES DOUBLONS
    const seancesFusionnees = fusionnerDoublons(seances);

    // Ajouter les calculs
    const seancesAvecCalculs = await Promise.all(
      seancesFusionnees.map(async (seance) => {
        if (seance.calculerDureeEtMontant) {
          const calculs = await seance.calculerDureeEtMontant();
          return {
            ...seance,
            dureeHeures: calculs.dureeHeures,
            montant: calculs.montant
          };
        } else {
          const dureeHeures = calculerDureeSeance(seance.heureDebut, seance.heureFin);
          const professeur = seance.professeur;
          const montant = professeur && !professeur.estPermanent && professeur.tarifHoraire
            ? dureeHeures * professeur.tarifHoraire
            : 0;
          
          return {
            ...seance,
            dureeHeures: Math.round(dureeHeures * 100) / 100,
            montant: Math.round(montant * 100) / 100
          };
        }
      })
    );
    
    res.json(seancesAvecCalculs);
  } catch (err) {
    console.error('Erreur récupération séances professeur:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Fonction de calcul des statistiques avec fusion des doublons
function calculerStatistiquesProfesseur(seances, professeur) {
  // D'abord fusionner les doublons
  const seancesFusionnees = fusionnerDoublons(seances);
  
  const stats = {
    totalSeances: seancesFusionnees.length, // Nombre de créneaux uniques
    totalHeures: 0,
    coursUniques: 0,
    moyenneHeuresParJour: 0,
    totalAPayer: 0,
    repartitionJours: {}
  };

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  jours.forEach(jour => {
    stats.repartitionJours[jour] = 0;
  });

  const coursSet = new Set();
  seancesFusionnees.forEach(seance => {
    // Durée de la séance (comptée une seule fois même si plusieurs cours)
    const duree = calculerDureeSeance(seance.heureDebut, seance.heureFin);
    stats.totalHeures += duree;
    
    // Répartition par jour
    if (stats.repartitionJours[seance.jour] !== undefined) {
      stats.repartitionJours[seance.jour] += duree;
    }
    
    // Cours uniques (compte tous les cours même fusionnés)
    if (seance.nombreCoursSimultanes > 1) {
      seance.cours.split(' + ').forEach(c => coursSet.add(c.trim()));
    } else if (seance.cours) {
      coursSet.add(seance.cours);
    }
    
    // Montant à payer (une seule fois par créneau, même si plusieurs cours)
    if (!professeur.estPermanent && professeur.tarifHoraire) {
      stats.totalAPayer += duree * professeur.tarifHoraire;
    }
  });

  stats.coursUniques = coursSet.size;
  stats.totalHeures = Math.round(stats.totalHeures * 100) / 100;
  stats.totalAPayer = Math.round(stats.totalAPayer * 100) / 100;
  
  const joursTravaills = Object.values(stats.repartitionJours).filter(h => h > 0).length;
  stats.moyenneHeuresParJour = joursTravaills > 0 
    ? Math.round((stats.totalHeures / joursTravaills) * 100) / 100 
    : 0;

  return stats;
}

// Fonction de calcul de durée
function calculerDureeSeance(heureDebut, heureFin) {
  const [heureD, minuteD] = heureDebut.split(':').map(Number);
  const [heureF, minuteF] = heureFin.split(':').map(Number);
  
  const minutesDebut = heureD * 60 + minuteD;
  const minutesFin = heureF * 60 + minuteF;
  
  return (minutesFin - minutesDebut) / 60;
}

app.get('/api/professeurs/mon-rapport', authProfesseur, async (req, res) => {
  try {
    const { mois, annee } = req.query;
    
    const professeur = await Professeur.findById(req.professeurId);
    if (!professeur) {
      return res.status(404).json({ message: 'Professeur non trouvé' });
    }

    let dateFilter = {};
    if (mois && annee) {
      const startDate = new Date(annee, mois - 1, 1);
      const endDate = new Date(annee, mois, 0, 23, 59, 59);
      dateFilter = { dateSeance: { $gte: startDate, $lte: endDate } };
    } else if (annee) {
      const startDate = new Date(annee, 0, 1);
      const endDate = new Date(annee, 11, 31, 23, 59, 59);
      dateFilter = { dateSeance: { $gte: startDate, $lte: endDate } };
    } else {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = { dateSeance: { $gte: startDate, $lte: endDate } };
    }

    const seances = await Seance.find({
      professeur: req.professeurId,
      typeSeance: { $in: ['reelle', 'exception', 'rattrapage'] },
      actif: true,
      ...dateFilter
    })
    .populate('coursId', 'nom')
    .sort({ dateSeance: 1, heureDebut: 1 });

    // Calculer les statistiques AVEC fusion (pour éviter double comptage)
    const statistiques = calculerStatistiquesProfesseur(seances, professeur);

    // Retourner les séances SANS fusion pour affichage détaillé
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
      statistiques, // Stats avec fusion
      seances: seances.map(seance => ({ // Séances SANS fusion
        jour: seance.jour,
        heureDebut: seance.heureDebut,
        heureFin: seance.heureFin,
        cours: seance.cours || seance.coursId?.nom,
        coursId: seance.coursId,
        matiere: seance.matiere, // Matière individuelle, pas fusionnée
        salle: seance.salle,
        dateSeance: seance.dateSeance,
        typeSeance: seance.typeSeance,
        dureeHeures: calculerDureeSeance(seance.heureDebut, seance.heureFin)
      }))
    });

  } catch (err) {
    console.error('Erreur rapport professeur:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
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
// Route pour sauvegarder les templates jour par jour
app.post('/api/pedagogique/cours/:coursId/templates-planning', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { coursId } = req.params;
    const { planningCreneaux } = req.body; // { "Lundi": [...], "Mardi": [...] }
    
    console.log(`📅 Création templates pour cours ${coursId}`);
    
    // Vérifier que le cours existe
    const cours = await Cours.findById(coursId);
    if (!cours) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }
    
    // Supprimer les anciens templates de ce cours
    await Seance.deleteMany({
      typeSeance: 'template',
      coursId: coursId
    });
    
    const nouveauxTemplates = [];
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    for (const jour of jours) {
      const creneauxJour = planningCreneaux[jour] || [];
      
      for (const creneau of creneauxJour) {
        // Créer un template pour chaque créneau
        const template = new Seance({
          typeSeance: 'template',
          jour: jour,
          heureDebut: creneau.debut,
          heureFin: creneau.fin,
          cours: cours.nom,
          coursId: coursId,
          
          // Professeur par défaut (vous devrez l'adapter selon votre logique)
          professeur: null, // À définir lors de la génération des séances réelles
          matiere: '',
          salle: '',
          
          // Période de validité du template
          dateDebutTemplate: new Date(), // À partir d'aujourd'hui
          dateFinTemplate: null, // Pas de fin = permanent
          
          actif: true,
          
          // Traçabilité
          lastActionById: req.user.id,
          lastActionByName: req.userInfo?.nom || 'Pédagogique',
          lastActionByEmail: req.userInfo?.email || '',
          lastActionByRole: req.userInfo?.role || 'pedagogique',
          lastActionType: 'creation',
          lastActionAt: new Date()
        });
        
        await template.save();
        nouveauxTemplates.push(template);
        
        console.log(`✅ Template créé: ${cours.nom} - ${jour} ${creneau.debut}-${creneau.fin}`);
      }
    }
    
    console.log(`🎉 ${nouveauxTemplates.length} templates créés pour ${cours.nom}`);
    
    res.json({
      ok: true,
      message: `${nouveauxTemplates.length} templates créés avec succès`,
      templates: nouveauxTemplates.length,
      coursNom: cours.nom
    });
    
  } catch (error) {
    console.error('❌ Erreur création templates:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la création des templates',
      details: error.message
    });
  }
});

// Route pour récupérer les templates d'un cours
app.get('/api/pedagogique/cours/:coursId/templates-planning', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { coursId } = req.params;
    
    // Récupérer tous les templates de ce cours
    const templates = await Seance.find({
      typeSeance: 'template',
      coursId: coursId,
      actif: true
    }).sort({ jour: 1, heureDebut: 1 });
    
    // Organiser par jour
    const planningCreneaux = {};
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    jours.forEach(jour => {
      planningCreneaux[jour] = [];
    });
    
    templates.forEach(template => {
      if (planningCreneaux[template.jour]) {
        planningCreneaux[template.jour].push({
          id: template._id,
          debut: template.heureDebut,
          fin: template.heureFin,
          professeur: template.professeur,
          matiere: template.matiere,
          salle: template.salle
        });
      }
    });
    
    const cours = await Cours.findById(coursId);
    const totalCreneaux = templates.length;
    
    res.json({
      ok: true,
      coursNom: cours?.nom || 'Cours inconnu',
      planningCreneaux,
      totalCreneaux,
      templates: templates
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération templates:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération des templates'
    });
  }
});

// Route pour générer les séances réelles à partir des templates
app.post('/api/pedagogique/generer-semaine-depuis-templates', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { lundiSemaine, coursId } = req.body;
    
    console.log(`🔄 Génération séances depuis templates pour ${coursId}, semaine ${lundiSemaine}`);
    
    const dateLundi = new Date(lundiSemaine);
    const dateDimanche = new Date(dateLundi.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    // Vérifier si les séances existent déjà
    const seancesExistantes = await Seance.find({
      typeSeance: 'reelle',
      coursId: coursId,
      dateSeance: {
        $gte: dateLundi,
        $lte: dateDimanche
      }
    });
    
    if (seancesExistantes.length > 0) {
      return res.json({
        ok: true,
        message: `${seancesExistantes.length} séances déjà générées pour cette semaine`,
        seancesGenerees: seancesExistantes.length,
        nouvelles: 0
      });
    }
    
    // Récupérer les templates du cours
    const templates = await Seance.find({
      typeSeance: 'template',
      coursId: coursId,
      actif: true
    }).populate('professeur');
    
    console.log(`📋 ${templates.length} templates trouvés pour le cours`);
    
    const nouvellesSeances = [];
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    for (const template of templates) {
      const jourIndex = jours.indexOf(template.jour);
      if (jourIndex === -1) continue;
      
      const dateSeance = new Date(dateLundi.getTime() + jourIndex * 24 * 60 * 60 * 1000);
      
      // Vérifier s'il y a une exception pour cette date
      const exception = await Seance.findOne({
        typeSeance: 'exception',
        templateOriginal: template._id,
        dateSeance: dateSeance
      });
      
      if (exception) {
        nouvellesSeances.push(exception);
        console.log(`🔄 Exception utilisée: ${template.cours} - ${template.jour}`);
        continue;
      }
      
      // Créer la séance réelle
      const nouvelleSeance = new Seance({
        typeSeance: 'reelle',
        dateSeance,
        jour: template.jour,
        heureDebut: template.heureDebut,
        heureFin: template.heureFin,
        cours: template.cours,
        coursId: template.coursId,
        professeur: template.professeur, // Peut être null, à assigner manuellement
        matiere: template.matiere,
        salle: template.salle,
        actif: true,
        payee: false,
        statutPaiement: 'en_attente',
        
        // Traçabilité
        lastActionById: req.user.id,
        lastActionByName: req.userInfo?.nom || 'Système',
        lastActionByEmail: req.userInfo?.email || '',
        lastActionByRole: req.userInfo?.role || 'pedagogique',
        lastActionType: 'creation',
        lastActionAt: new Date()
      });
      
      await nouvelleSeance.save();
      nouvellesSeances.push(nouvelleSeance);
      
      console.log(`✅ Séance créée: ${template.cours} - ${template.jour} ${template.heureDebut}-${template.heureFin}`);
    }
    
    console.log(`🎉 ${nouvellesSeances.length} séances générées`);
    
    res.json({
      ok: true,
      message: `${nouvellesSeances.length} séances générées avec succès`,
      seancesGenerees: nouvellesSeances.length,
      nouvelles: nouvellesSeances.length,
      semaine: lundiSemaine
    });
    
  } catch (error) {
    console.error('❌ Erreur génération depuis templates:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération des séances',
      details: error.message
    });
  }
});

// Route pour supprimer tous les templates d'un cours
app.delete('/api/pedagogique/cours/:coursId/templates', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { coursId } = req.params;
    
    const result = await Seance.deleteMany({
      typeSeance: 'template',
      coursId: coursId
    });
    
    console.log(`🗑️ ${result.deletedCount} templates supprimés pour le cours ${coursId}`);
    
    res.json({
      ok: true,
      message: `${result.deletedCount} templates supprimés`,
      supprimés: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression templates:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression des templates'
    });
  }
});

// Route pour obtenir tous les cours avec leurs templates
app.get('/api/pedagogique/cours-avec-templates', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Récupérer tous les cours
    const cours = await Cours.find({ actif: { $ne: false } }).select('nom filiere');
    
    // Pour chaque cours, compter ses templates
    const coursAvecTemplates = [];
    
    for (const coursItem of cours) {
      const countTemplates = await Seance.countDocuments({
        typeSeance: 'template',
        coursId: coursItem._id,
        actif: true
      });
      
      coursAvecTemplates.push({
        _id: coursItem._id,
        nom: coursItem.nom,
        filiere: coursItem.filiere,
        nombreTemplates: countTemplates,
        hasTemplates: countTemplates > 0
      });
    }
    
    res.json({
      ok: true,
      cours: coursAvecTemplates,
      totalCours: coursAvecTemplates.length,
      coursAvecTemplates: coursAvecTemplates.filter(c => c.hasTemplates).length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération cours avec templates:', error);
    res.status(500).json({
      error: 'Erreur serveur'
    });
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
app.delete('/api/cours/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/admin/contact-messages', authAdminOrPaiementManager, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ date: -1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error('❌ Erreur récupération messages:', err);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
});
app.delete('/api/admin/contact-messages/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/admin/qr-day-delete', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/admin/qr-day-sessions', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/admin/qr-session/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/admin/qr-session/:id', authAdminOrPaiementManager, async (req, res) => {
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

// APIs de gestion des paiements - À ajouter dans votre fichier routes

// 1. API pour créer/récupérer un paiement
app.post('/api/finance/paiements/creer-ou-recuperer', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId, mois, annee } = req.body;

    if (!professeurId || !mois || !annee) {
      return res.status(400).json({ error: 'Professeur, mois et année requis' });
    }

    // Vérifier que le professeur existe
    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ error: 'Professeur non trouvé' });
    }

    if (professeur.estPermanent) {
      return res.status(400).json({ error: 'Les paiements ne concernent que les entrepreneurs' });
    }

    // Vérifier si un paiement existe déjà
    let paiement = await PaiementProfesseur.findOne({
      professeur: professeurId,
      mois: parseInt(mois),
      annee: parseInt(annee)
    }).populate('professeur').populate('valideePar').populate('payePar');

    if (paiement) {
      return res.json({
        message: 'Paiement existant récupéré',
        paiement
      });
    }

    // Créer un nouveau paiement basé sur les séances du mois
    const dateDebut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
    const dateFin = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);

    // Récupérer les séances du mois
    const seances = await Seance.find({
      professeur: professeurId,
      dateSeance: { $gte: dateDebut, $lte: dateFin },
      actif: true,
      typeSeance: { $ne: 'rattrapage' }
    }).populate('coursId', 'nom').lean();

    if (seances.length === 0) {
      return res.status(400).json({ error: 'Aucune séance trouvée pour cette période' });
    }

    // Calculer les montants
    let montantBrut = 0;
    const seancesIncluses = [];

    for (const seance of seances) {
      const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
      const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
      const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;
      
      const montantSeance = dureeHeures * (professeur.tarifHoraire || 0);
      montantBrut += montantSeance;

      // Résoudre le nom du cours
      let nomCours = 'Cours non spécifié';
      if (seance.coursId && seance.coursId.nom) {
        nomCours = seance.coursId.nom;
      } else if (seance.cours) {
        nomCours = seance.cours;
      }

      seancesIncluses.push({
        seanceId: seance._id,
        cours: nomCours,
        date: seance.dateSeance,
        heures: Math.round(dureeHeures * 100) / 100,
        montant: Math.round(montantSeance * 100) / 100
      });
    }

    // Vérifier s'il y a des pénalités/ajustements
    let ajustements = 0;
    const penalitesAppliquees = [];
    
    const penalite = await PenaliteProfesseur.findOne({
      professeur: professeurId,
      mois: parseInt(mois),
      annee: parseInt(annee),
      actif: true
    });

    if (penalite) {
      ajustements = montantBrut - penalite.montantAjuste;
      penalitesAppliquees.push({
        penaliteId: penalite._id,
        motif: penalite.motif,
        montant: ajustements
      });
    }

    // Créer le nouveau paiement
    const nouveauPaiement = new PaiementProfesseur({
      professeur: professeurId,
      mois: parseInt(mois),
      annee: parseInt(annee),
      montantBrut: Math.round(montantBrut * 100) / 100,
      ajustements: Math.round(ajustements * 100) / 100,
      montantNet: Math.round((montantBrut - ajustements) * 100) / 100,
      seancesIncluses,
      penalitesAppliquees,
      creeParAdmin: req.adminId
    });

    await nouveauPaiement.save();
    
    // Populate les références pour la réponse
    await nouveauPaiement.populate('professeur');
    await nouveauPaiement.populate('creeParAdmin', 'nom email');

    res.json({
      message: 'Nouveau paiement créé avec succès',
      paiement: nouveauPaiement
    });

  } catch (error) {
    console.error('Erreur création/récupération paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 2. API pour valider un paiement
app.post('/api/finance/paiements/valider', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { paiementId, notes } = req.body;

    const paiement = await PaiementProfesseur.findById(paiementId);
    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (paiement.statut === 'valide' || paiement.statut === 'paye') {
      return res.status(400).json({ error: 'Ce paiement est déjà validé ou payé' });
    }

    // Valider le paiement
    paiement.valider(req.adminId);
    if (notes) {
      paiement.notes = notes;
    }
    
    await paiement.save();
    await paiement.populate('professeur');
    await paiement.populate('valideePar', 'nom email');

    res.json({
      message: 'Paiement validé avec succès',
      paiement
    });

  } catch (error) {
    console.error('Erreur validation paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 3. API pour marquer un paiement comme payé
app.post('/api/finance/paiements/marquer-paye', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { paiementId, methodePaiement, referencePaiement, notes } = req.body;

    if (!methodePaiement) {
      return res.status(400).json({ error: 'Méthode de paiement requise' });
    }

    const paiement = await PaiementProfesseur.findById(paiementId);
    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (paiement.statut !== 'valide') {
      return res.status(400).json({ error: 'Le paiement doit être validé avant d\'être marqué comme payé' });
    }

    // Marquer comme payé
    paiement.marquerPaye(req.adminId, methodePaiement, referencePaiement || '');
    if (notes) {
      paiement.notes += (paiement.notes ? '\n' : '') + `Paiement: ${notes}`;
    }
    
    await paiement.save();
    await paiement.populate('professeur');
    await paiement.populate('payePar', 'nom email');

    res.json({
      message: 'Paiement marqué comme payé avec succès',
      paiement
    });

  } catch (error) {
    console.error('Erreur marquage paiement payé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 4. API pour annuler un paiement
app.post('/api/finance/paiements/annuler', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { paiementId, motifAnnulation } = req.body;

    const paiement = await PaiementProfesseur.findById(paiementId);
    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (paiement.statut === 'paye') {
      return res.status(400).json({ error: 'Impossible d\'annuler un paiement déjà effectué' });
    }

    paiement.statut = 'annule';
    paiement.notes += (paiement.notes ? '\n' : '') + `Annulé le ${new Date().toLocaleDateString('fr-FR')}: ${motifAnnulation || 'Aucun motif spécifié'}`;
    
    await paiement.save();
    await paiement.populate('professeur');

    res.json({
      message: 'Paiement annulé avec succès',
      paiement
    });

  } catch (error) {
    console.error('Erreur annulation paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. API pour récupérer l'historique des paiements d'un professeur
app.get('/api/finance/paiements/historique/:professeurId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;
    const { limit = 12 } = req.query;

    const paiements = await PaiementProfesseur.find({
      professeur: professeurId,
      actif: true
    })
    .populate('professeur', 'nom email')
    .populate('valideePar', 'nom email')
    .populate('payePar', 'nom email')
    .sort({ annee: -1, mois: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json({
      paiements,
      total: paiements.length
    });

  } catch (error) {
    console.error('Erreur historique paiements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 6. API pour récupérer tous les paiements en attente
app.get('/api/finance/paiements/en-attente', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { mois, annee } = req.query;

    let filter = {
      statut: 'en_attente',
      actif: true
    };

    if (mois && annee) {
      filter.mois = parseInt(mois);
      filter.annee = parseInt(annee);
    }

    const paiements = await PaiementProfesseur.find(filter)
      .populate('professeur', 'nom email tarifHoraire')
      .populate('creeParAdmin', 'nom email')
      .sort({ annee: -1, mois: -1, createdAt: -1 })
      .lean();

    res.json({
      paiements,
      total: paiements.length
    });

  } catch (error) {
    console.error('Erreur paiements en attente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 7. API pour les statistiques de paiements
app.get('/api/finance/paiements/statistiques', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { mois, annee } = req.query;

    let matchFilter = { actif: true };
    if (mois && annee) {
      matchFilter.mois = parseInt(mois);
      matchFilter.annee = parseInt(annee);
    }

    const stats = await PaiementProfesseur.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          totalMontant: { $sum: '$montantNet' }
        }
      }
    ]);

    const statistiques = {
      enAttente: { count: 0, montant: 0 },
      valide: { count: 0, montant: 0 },
      paye: { count: 0, montant: 0 },
      annule: { count: 0, montant: 0 }
    };

    stats.forEach(stat => {
      if (statistiques[stat._id]) {
        statistiques[stat._id] = {
          count: stat.count,
          montant: Math.round(stat.totalMontant * 100) / 100
        };
      }
    });

    res.json({ statistiques });

  } catch (error) {
    console.error('Erreur statistiques paiements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});





// API pour rapport individuel mensuel - Correction pour les noms de cours
app.get('/api/professeurs/:id/rapport', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { mois, annee } = req.query;
    const professeurId = req.params.id;

    if (!mois || !annee) {
      return res.status(400).json({ error: 'Mois et année requis' });
    }

    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ error: 'Professeur non trouvé' });
    }

    const dateDebut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
    const dateFin = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);

    // ✅ CORRECTION: Récupérer les séances avec populate du cours
    const seances = await Seance.find({
      professeur: professeurId,
      dateSeance: { $gte: dateDebut, $lte: dateFin },
      actif: true,
      typeSeance: { $ne: 'rattrapage' }
    })
    .populate('coursId', 'nom') // ✅ AJOUT: Populate le cours
    .lean();

    const seancesAvecNoms = [];
    const statistiques = {
      totalHeures: 0,
      totalSeances: seances.length,
      totalAPayer: 0,
      tarifHoraire: professeur.tarifHoraire || 0,
      coursUniques: new Set(),
      matieresUniques: new Set()
    };

    for (const seance of seances) {
      // ✅ CORRECTION: Résoudre le nom du cours comme dans l'API mensuelle
      let nomCours = 'Cours non spécifié';
      
      if (seance.coursId && seance.coursId.nom) {
        nomCours = seance.coursId.nom;
      } else if (seance.cours && !seance.cours.match(/^[0-9a-fA-F]{24}$/)) {
        nomCours = seance.cours;
      } else if (seance.cours) {
        try {
          const coursDoc = await mongoose.model('Cours').findById(seance.cours);
          if (coursDoc) {
            nomCours = coursDoc.nom;
          }
        } catch (err) {
          console.warn('Erreur recherche cours par ID:', err.message);
        }
      }

      // Calculer la durée
      const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
      const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
      const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;

      seancesAvecNoms.push({
        ...seance,
        cours: nomCours, // ✅ Nom résolu
        dureeHeures: Math.round(dureeHeures * 100) / 100
      });

      // Mettre à jour les statistiques
      statistiques.totalHeures += dureeHeures;
      statistiques.coursUniques.add(nomCours);
      if (seance.matiere) {
        statistiques.matieresUniques.add(seance.matiere);
      }

      // Calculer montant pour entrepreneurs
      if (!professeur.estPermanent && professeur.tarifHoraire) {
        statistiques.totalAPayer += dureeHeures * professeur.tarifHoraire;
      }
    }

    // Finaliser les statistiques
    statistiques.totalHeures = Math.round(statistiques.totalHeures * 100) / 100;
    statistiques.totalAPayer = Math.round(statistiques.totalAPayer * 100) / 100;
    statistiques.coursUniques = statistiques.coursUniques.size;
    statistiques.matieresUniques = statistiques.matieresUniques.size;

    res.json({
      professeur,
      seances: seancesAvecNoms, // ✅ Séances avec noms de cours corrects
      statistiques,
      periode: {
        mois: parseInt(mois),
        annee: parseInt(annee),
        nomMois: [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ][parseInt(mois) - 1]
      }
    });

  } catch (error) {
    console.error('Erreur rapport individuel:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// API pour rapport annuel - Correction pour les noms de cours
app.get('/api/professeurs/:id/rapport/annuel', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { annee } = req.query;
    const professeurId = req.params.id;

    if (!annee) {
      return res.status(400).json({ error: 'Année requise' });
    }

    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ error: 'Professeur non trouvé' });
    }

    const rapportsMensuels = [];
    const totauxAnnuels = {
      totalHeures: 0,
      totalSeances: 0,
      totalAPayer: 0
    };

    // Générer rapport pour chaque mois
    for (let mois = 1; mois <= 12; mois++) {
      const dateDebut = new Date(parseInt(annee), mois - 1, 1);
      const dateFin = new Date(parseInt(annee), mois, 0, 23, 59, 59);

      // ✅ CORRECTION: Même logique avec populate
      const seances = await Seance.find({
        professeur: professeurId,
        dateSeance: { $gte: dateDebut, $lte: dateFin },
        actif: true,
        typeSeance: { $ne: 'rattrapage' }
      })
      .populate('coursId', 'nom')
      .lean();

      if (seances.length > 0) {
        let totalHeuresMois = 0;
        let totalAPayerMois = 0;

        for (const seance of seances) {
          // Résoudre le nom du cours
          let nomCours = 'Cours non spécifié';
          
          if (seance.coursId && seance.coursId.nom) {
            nomCours = seance.coursId.nom;
          } else if (seance.cours && !seance.cours.match(/^[0-9a-fA-F]{24}$/)) {
            nomCours = seance.cours;
          } else if (seance.cours) {
            try {
              const coursDoc = await mongoose.model('Cours').findById(seance.cours);
              if (coursDoc) {
                nomCours = coursDoc.nom;
              }
            } catch (err) {
              console.warn('Erreur recherche cours par ID:', err.message);
            }
          }

          // Calculer durée
          const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
          const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
          const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;

          totalHeuresMois += dureeHeures;

          if (!professeur.estPermanent && professeur.tarifHoraire) {
            totalAPayerMois += dureeHeures * professeur.tarifHoraire;
          }
        }

        const rapportMois = {
          mois,
          nomMois: [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
          ][mois - 1],
          nombreSeances: seances.length,
          statistiques: {
            totalHeures: Math.round(totalHeuresMois * 100) / 100,
            totalAPayer: Math.round(totalAPayerMois * 100) / 100,
            tarifHoraire: professeur.tarifHoraire || 0
          }
        };

        rapportsMensuels.push(rapportMois);

        // Ajouter aux totaux annuels
        totauxAnnuels.totalHeures += totalHeuresMois;
        totauxAnnuels.totalSeances += seances.length;
        totauxAnnuels.totalAPayer += totalAPayerMois;
      }
    }

    // Finaliser les totaux
    totauxAnnuels.totalHeures = Math.round(totauxAnnuels.totalHeures * 100) / 100;
    totauxAnnuels.totalAPayer = Math.round(totauxAnnuels.totalAPayer * 100) / 100;

    res.json({
      professeur,
      annee: parseInt(annee),
      rapportsMensuels,
      totauxAnnuels
    });

  } catch (error) {
    console.error('Erreur rapport annuel:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// API pour les rattrapages - Correction pour les noms de cours
app.get('/api/professeurs/:id/rattrapages', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { mois, annee } = req.query;
    const professeurId = req.params.id;

    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ error: 'Professeur non trouvé' });
    }

    let dateDebut, dateFin;

    if (mois && annee) {
      // Mode mensuel
      dateDebut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
      dateFin = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);
    } else if (annee) {
      // Mode annuel
      dateDebut = new Date(parseInt(annee), 0, 1);
      dateFin = new Date(parseInt(annee), 11, 31, 23, 59, 59);
    } else {
      return res.status(400).json({ error: 'Mois et année ou année requis' });
    }

    // ✅ CORRECTION: Récupérer les rattrapages avec populate
    const rattrapages = await Seance.find({
      professeur: professeurId,
      dateSeance: { $gte: dateDebut, $lte: dateFin },
      typeSeance: 'rattrapage',
      actif: true
    })
    .populate('coursId', 'nom')
    .lean();

    const rattrapagesAvecNoms = [];
    let totalHeuresRattrapage = 0;

    for (const rattrapage of rattrapages) {
      // ✅ CORRECTION: Résoudre le nom du cours
      let nomCours = 'Cours non spécifié';
      
      if (rattrapage.coursId && rattrapage.coursId.nom) {
        nomCours = rattrapage.coursId.nom;
      } else if (rattrapage.cours && !rattrapage.cours.match(/^[0-9a-fA-F]{24}$/)) {
        nomCours = rattrapage.cours;
      } else if (rattrapage.cours) {
        try {
          const coursDoc = await mongoose.model('Cours').findById(rattrapage.cours);
          if (coursDoc) {
            nomCours = coursDoc.nom;
          }
        } catch (err) {
          console.warn('Erreur recherche cours par ID:', err.message);
        }
      }

      // Calculer durée
      const [heureD, minuteD] = rattrapage.heureDebut.split(':').map(Number);
      const [heureF, minuteF] = rattrapage.heureFin.split(':').map(Number);
      const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;

      rattrapagesAvecNoms.push({
        ...rattrapage,
        cours: nomCours, // ✅ Nom résolu
        dureeHeures: Math.round(dureeHeures * 100) / 100
      });

      totalHeuresRattrapage += dureeHeures;
    }

    res.json({
      professeur,
      rattrapages: rattrapagesAvecNoms, // ✅ Rattrapages avec noms corrects
      statistiquesRattrapages: {
        totalRattrapages: rattrapages.length,
        totalHeuresRattrapage: Math.round(totalHeuresRattrapage * 100) / 100
      },
      periode: mois ? {
        mois: parseInt(mois),
        annee: parseInt(annee),
        nomMois: [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ][parseInt(mois) - 1]
      } : {
        annee: parseInt(annee)
      }
    });

  } catch (error) {
    console.error('Erreur rattrapages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 2. API POUR APPLIQUER UNE PÉNALITÉ
app.post('/api/finance/appliquer-penalite', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId, mois, annee, type, valeur, motif, appliquePour } = req.body;

    if (!professeurId || !mois || !annee || !type || valeur === undefined || !motif) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
    }

    if (!['pourcentage', 'montant_fixe'].includes(type)) {
      return res.status(400).json({ error: 'Type de pénalité invalide' });
    }

    if (type === 'pourcentage' && (valeur < -100 || valeur > 100)) {
      return res.status(400).json({ error: 'Le pourcentage doit être entre -100 et 100' });
    }

    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ error: 'Professeur non trouvé' });
    }

    if (professeur.estPermanent) {
      return res.status(400).json({ error: 'Les pénalités ne s\'appliquent qu\'aux entrepreneurs' });
    }

    const dateDebut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
    const dateFin = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);

    const seances = await Seance.find({
      professeur: professeurId,
      dateSeance: { $gte: dateDebut, $lte: dateFin },
      actif: true,
      typeSeance: { $ne: 'rattrapage' }
    });

    let montantOriginal = 0;
    for (const seance of seances) {
      const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
      const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
      const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;
      
      if (professeur.tarifHoraire) {
        montantOriginal += dureeHeures * professeur.tarifHoraire;
      }
    }

    if (montantOriginal === 0) {
      return res.status(400).json({ error: 'Aucune activité trouvée pour ce professeur ce mois-ci' });
    }

    let ajustement = 0;
    if (type === 'pourcentage') {
      ajustement = (montantOriginal * parseFloat(valeur)) / 100;
    } else {
      ajustement = parseFloat(valeur);
    }

    const montantAjuste = montantOriginal - ajustement;

    const penaliteExistante = await PenaliteProfesseur.findOne({
      professeur: professeurId,
      mois: parseInt(mois),
      annee: parseInt(annee)
    });

    const userId = req.adminId || req.userId || req.user?._id;

    if (penaliteExistante) {
      penaliteExistante.type = type;
      penaliteExistante.valeur = parseFloat(valeur);
      penaliteExistante.montantOriginal = Math.round(montantOriginal * 100) / 100;
      penaliteExistante.montantAjuste = Math.round(montantAjuste * 100) / 100;
      penaliteExistante.motif = motif;
      penaliteExistante.appliquePour = appliquePour;
      penaliteExistante.appliquePar = userId;
      penaliteExistante.dateApplication = new Date();
      
      await penaliteExistante.save();
      
      res.json({
        message: 'Pénalité mise à jour avec succès',
        penalite: penaliteExistante,
        montantOriginal: Math.round(montantOriginal * 100) / 100,
        ajustement: Math.round(ajustement * 100) / 100,
        nouveauMontant: Math.round(montantAjuste * 100) / 100
      });
    } else {
      const nouvellePenalite = new PenaliteProfesseur({
        professeur: professeurId,
        mois: parseInt(mois),
        annee: parseInt(annee),
        type,
        valeur: parseFloat(valeur),
        montantOriginal: Math.round(montantOriginal * 100) / 100,
        montantAjuste: Math.round(montantAjuste * 100) / 100,
        motif,
        appliquePour,
        appliquePar: userId
      });

      await nouvellePenalite.save();

      res.json({
        message: 'Pénalité appliquée avec succès',
        penalite: nouvellePenalite,
        montantOriginal: Math.round(montantOriginal * 100) / 100,
        ajustement: Math.round(ajustement * 100) / 100,
        nouveauMontant: Math.round(montantAjuste * 100) / 100
      });
    }

  } catch (error) {
    console.error('Erreur application pénalité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// CORRECTION pour votre app.js/server.js - SANS les méthodes de schéma

// 1. API CORRIGÉE pour récupération des rapports financiers


// 2. API CORRIGÉE pour validation par Finance


app.post('/api/admin/cycles/payer', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Autoriser admin OU paiement_manager
    if (req.userType !== 'admin' && req.userType !== 'paiement_manager' && req.userRole !== 'admin' && req.userRole !== 'paiement_manager') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs ou gestionnaires de paiement' });
    }

    const { cycleId, methodePaiement, referencePaiement, notes } = req.body;

    if (!cycleId || !methodePaiement) {
      return res.status(400).json({ error: 'ID du cycle et méthode de paiement requis' });
    }

    const cycle = await CyclePaiement.findById(cycleId).populate('professeur');
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle non trouvé' });
    }

    if (cycle.statut !== 'valide_finance') {
      return res.status(400).json({ error: 'Ce cycle doit être validé par Finance avant le paiement' });
    }

    // Utiliser req.adminId OU req.managerId selon qui fait l'action
    const userId = req.adminId || req.managerId || req.userId;

    // 1. Marquer le cycle comme payé
    cycle.statut = 'paye_admin';
    cycle.payeParAdmin = userId;
    cycle.datePaiementAdmin = new Date();
    cycle.methodePaiement = methodePaiement;
    cycle.referencePaiement = referencePaiement || '';
    cycle.notesAdmin = notes || '';
    cycle.dateFin = new Date();
    
    await cycle.save();

    // 2. Marquer toutes les séances comme payées
    const seanceIds = cycle.seancesIncluses.map(s => s.seanceId);
    
    await Seance.updateMany(
      { _id: { $in: seanceIds } },
      { 
        payee: true,
        statutPaiement: 'paye_admin',
        datePaiement: new Date(),
        cyclePaiementId: cycle._id
      }
    );

    // 3. IMPORTANT: Désactiver les pénalités "mois_actuel"
    await PenaliteProfesseur.updateMany(
      {
        professeur: cycle.professeur._id,
        appliquePour: 'mois_actuel',
        actif: true
      },
      {
        actif: false,
        dateDesactivation: new Date(),
        motifDesactivation: 'Cycle payé'
      }
    );

    // 4. Créer automatiquement le nouveau cycle
    const dernierCycle = await CyclePaiement.findOne({
      professeur: cycle.professeur._id
    }).sort({ numeroCycle: -1 });
    
    const nouveauNumero = dernierCycle ? dernierCycle.numeroCycle + 1 : 1;
    
    const nouveauCycle = new CyclePaiement({
      professeur: cycle.professeur._id,
      numeroCycle: nouveauNumero,
      dateDebut: new Date(),
      creeParAdmin: userId
    });
    
    await nouveauCycle.save();
    
    console.log(`✅ Cycle ${cycle.numeroCycle} payé pour ${cycle.professeur.nom}, nouveau cycle ${nouveauCycle.numeroCycle} créé`);

    res.json({
      message: 'Paiement effectué avec succès',
      cyclePayé: {
        id: cycle._id,
        numero: cycle.numeroCycle,
        montant: cycle.montantNet,
        professeur: cycle.professeur.nom
      },
      nouveauCycle: {
        id: nouveauCycle._id,
        numeroCycle: nouveauCycle.numeroCycle,
        dateDebut: nouveauCycle.dateDebut
      }
    });

  } catch (error) {
    console.error('Erreur paiement Admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 4. API utilitaire pour créer un cycle manquant
app.post('/api/admin/cycles/creer-manquant/:professeurId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;

    // Vérifier s'il y a déjà un cycle en cours
    let cycleEnCours = await CyclePaiement.findOne({
      professeur: professeurId,
      statut: 'en_cours',
      actif: true
    });
    
    if (cycleEnCours) {
      return res.json({
        message: 'Un cycle en cours existe déjà',
        cycle: cycleEnCours
      });
    }

    // Créer un nouveau cycle
    const dernierCycle = await CyclePaiement.findOne({
      professeur: professeurId
    }).sort({ numeroCycle: -1 });
    
    const nouveauNumero = dernierCycle ? dernierCycle.numeroCycle + 1 : 1;
    
    const nouveauCycle = new CyclePaiement({
      professeur: professeurId,
      numeroCycle: nouveauNumero,
      dateDebut: new Date(),
      creeParAdmin: req.adminId
    });
    
    await nouveauCycle.save();
    await nouveauCycle.populate('professeur', 'nom email');

    res.json({
      message: 'Nouveau cycle créé avec succès',
      cycle: nouveauCycle
    });

  } catch (error) {
    console.error('Erreur création cycle manquant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. API de diagnostic pour vérifier l'état des cycles
app.get('/api/admin/cycles/diagnostic/:professeurId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;

    const tousLesCycles = await CyclePaiement.find({
      professeur: professeurId,
      actif: true
    }).sort({ numeroCycle: 1 }).lean();

    const cycleEnCours = await CyclePaiement.findOne({
      professeur: professeurId,
      statut: 'en_cours',
      actif: true
    });
    
    const seancesNonPayees = await Seance.countDocuments({
      professeur: professeurId,
      actif: true,
      payee: { $ne: true }
    });

    const diagnostic = {
      professeurId,
      totalCycles: tousLesCycles.length,
      cycleEnCoursExiste: !!cycleEnCours,
      cycleEnCours: cycleEnCours ? {
        id: cycleEnCours._id,
        numero: cycleEnCours.numeroCycle,
        statut: cycleEnCours.statut,
        montantNet: cycleEnCours.montantNet
      } : null,
      seancesNonPayees,
      derniersCycles: tousLesCycles.map(c => ({
        numero: c.numeroCycle,
        statut: c.statut,
        montantNet: c.montantNet,
        dateCreation: c.createdAt
      }))
    };

    res.json({ diagnostic });

  } catch (error) {
    console.error('Erreur diagnostic cycles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// SOLUTION SIMPLE : Utiliser directement les cycles payés pour l'historique

// 1. API pour historique d'un professeur (utilise les cycles existants)
app.get('/api/professeurs/:id/historique-paiements', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, annee } = req.query;
    
    // Construire le filtre pour les cycles payés
    const filtre = { 
      professeur: id, 
      statut: 'paye_admin',  // Seulement les cycles payés
      actif: true 
    };
    
    if (annee) {
      const debutAnnee = new Date(`${annee}-01-01`);
      const finAnnee = new Date(`${annee}-12-31`);
      filtre.datePaiementAdmin = { $gte: debutAnnee, $lte: finAnnee };
    }
    
    // Récupérer les cycles payés avec pagination
    const cyclesPayes = await CyclePaiement.find(filtre)
      .populate('professeur', 'nom email tarifHoraire')
      .populate('valideParFinance', 'nom email')
      .populate('payeParAdmin', 'nom email')
      .sort({ datePaiementAdmin: -1, numeroCycle: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await CyclePaiement.countDocuments(filtre);
    
    // Transformer les données pour l'affichage
    const historiques = cyclesPayes.map(cycle => ({
      _id: cycle._id,
      professeur: cycle.professeur,
      numeroCycle: cycle.numeroCycle,
      periodeDebut: cycle.dateDebut,
      periodeFin: cycle.dateFin,
      nombreSeances: cycle.seancesIncluses ? cycle.seancesIncluses.length : 0,
      totalHeures: cycle.seancesIncluses ? 
        cycle.seancesIncluses.reduce((acc, s) => acc + (s.heures || 0), 0) : 0,
      tarifHoraire: cycle.professeur?.tarifHoraire || 0,
      montantBrut: cycle.montantBrut || 0,
      totalAjustements: cycle.ajustements || 0,
      montantNet: cycle.montantNet || 0,
      methodePaiement: cycle.methodePaiement,
      referencePaiement: cycle.referencePaiement,
      datePaiement: cycle.datePaiementAdmin,
      valideParFinance: cycle.valideParFinance,
      dateValidationFinance: cycle.dateValidationFinance,
      payeParAdmin: cycle.payeParAdmin,
      notesFinance: cycle.notesFinance,
      notesAdmin: cycle.notesAdmin,
      seancesPayees: cycle.seancesIncluses || [],
      ajustementsAppliques: cycle.penalitesAppliquees || []
    }));
    
    // Calculer les statistiques
    const statistiques = {
      totalPaiements: historiques.length,
      totalMontantBrut: historiques.reduce((acc, h) => acc + h.montantBrut, 0),
      totalAjustements: historiques.reduce((acc, h) => acc + h.totalAjustements, 0),
      totalMontantNet: historiques.reduce((acc, h) => acc + h.montantNet, 0),
      totalHeures: historiques.reduce((acc, h) => acc + h.totalHeures, 0),
      totalSeances: historiques.reduce((acc, h) => acc + h.nombreSeances, 0)
    };
    
    res.json({
      historiques,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statistiques
    });
    
  } catch (error) {
    console.error('Erreur historique paiements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 2. API pour historique global (tous professeurs)
app.get('/api/admin/historique-paiements-global', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { page = 1, limit = 20, annee, mois, professeurId } = req.query;
    
    // Construire le filtre
    const filtre = { 
      statut: 'paye_admin',  // Seulement les cycles payés
      actif: true 
    };
    
    if (professeurId) {
      filtre.professeur = professeurId;
    }
    
    if (annee) {
      const debutAnnee = new Date(`${annee}-01-01`);
      const finAnnee = new Date(`${annee}-12-31`);
      filtre.datePaiementAdmin = { $gte: debutAnnee, $lte: finAnnee };
    }
    
    if (mois && annee) {
      const debut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
      const fin = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);
      filtre.datePaiementAdmin = { $gte: debut, $lte: fin };
    }
    
    // Récupérer les cycles payés
    const cyclesPayes = await CyclePaiement.find(filtre)
      .populate('professeur', 'nom email tarifHoraire estPermanent')
      .populate('valideParFinance', 'nom email')
      .populate('payeParAdmin', 'nom email')
      .sort({ datePaiementAdmin: -1, numeroCycle: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await CyclePaiement.countDocuments(filtre);
    
    // Transformer les données
    const historiques = cyclesPayes.map(cycle => ({
      _id: cycle._id,
      professeur: cycle.professeur,
      numeroCycle: cycle.numeroCycle,
      periodeDebut: cycle.dateDebut,
      periodeFin: cycle.dateFin,
      nombreSeances: cycle.seancesIncluses ? cycle.seancesIncluses.length : 0,
      totalHeures: cycle.seancesIncluses ? 
        cycle.seancesIncluses.reduce((acc, s) => acc + (s.heures || 0), 0) : 0,
      tarifHoraire: cycle.professeur?.tarifHoraire || 0,
      montantBrut: cycle.montantBrut || 0,
      totalAjustements: cycle.ajustements || 0,
      montantNet: cycle.montantNet || 0,
      methodePaiement: cycle.methodePaiement,
      referencePaiement: cycle.referencePaiement,
      datePaiement: cycle.datePaiementAdmin,
      valideParFinance: cycle.valideParFinance,
      dateValidationFinance: cycle.dateValidationFinance,
      payeParAdmin: cycle.payeParAdmin,
      notesFinance: cycle.notesFinance,
      notesAdmin: cycle.notesAdmin,
      seancesPayees: cycle.seancesIncluses || [],
      ajustementsAppliques: cycle.penalitesAppliquees || []
    }));
    
    // Statistiques globales
    const stats = {
      totalPaiements: historiques.length,
      totalMontantBrut: historiques.reduce((acc, h) => acc + h.montantBrut, 0),
      totalAjustements: historiques.reduce((acc, h) => acc + h.totalAjustements, 0),
      totalMontantNet: historiques.reduce((acc, h) => acc + h.montantNet, 0),
      totalHeures: historiques.reduce((acc, h) => acc + h.totalHeures, 0),
      totalSeances: historiques.reduce((acc, h) => acc + h.nombreSeances, 0),
      nombreProfesseurs: [...new Set(historiques.map(h => h.professeur._id))].length
    };
    
    res.json({
      historiques,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statistiques: stats
    });
    
  } catch (error) {
    console.error('Erreur historique global:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 3. API pour détail d'un paiement
app.get('/api/admin/historique-paiements/:id/detail', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    const cycle = await CyclePaiement.findById(id)
      .populate('professeur', 'nom email tarifHoraire estPermanent')
      .populate('valideParFinance', 'nom email')
      .populate('payeParAdmin', 'nom email')
      .lean();
    
    if (!cycle || cycle.statut !== 'paye_admin') {
      return res.status(404).json({ error: 'Historique de paiement non trouvé' });
    }
    
    // Transformer en format historique
    const historique = {
      _id: cycle._id,
      professeur: cycle.professeur,
      numeroCycle: cycle.numeroCycle,
      periodeDebut: cycle.dateDebut,
      periodeFin: cycle.dateFin,
      nombreSeances: cycle.seancesIncluses ? cycle.seancesIncluses.length : 0,
      totalHeures: cycle.seancesIncluses ? 
        cycle.seancesIncluses.reduce((acc, s) => acc + (s.heures || 0), 0) : 0,
      tarifHoraire: cycle.professeur?.tarifHoraire || 0,
      montantBrut: cycle.montantBrut || 0,
      totalAjustements: cycle.ajustements || 0,
      montantNet: cycle.montantNet || 0,
      methodePaiement: cycle.methodePaiement,
      referencePaiement: cycle.referencePaiement,
      datePaiement: cycle.datePaiementAdmin,
      valideParFinance: cycle.valideParFinance,
      dateValidationFinance: cycle.dateValidationFinance,
      payeParAdmin: cycle.payeParAdmin,
      notesFinance: cycle.notesFinance,
      notesAdmin: cycle.notesAdmin,
      seancesPayees: cycle.seancesIncluses || [],
      ajustementsAppliques: cycle.penalitesAppliquees || []
    };
    
    res.json({ historique });
    
  } catch (error) {
    console.error('Erreur détail historique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 4. API pour créer des données de test (optionnel - pour tester)
app.post('/api/admin/test-paiement/:professeurId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;
    
    // Vérifier s'il y a un cycle en cours
    let cycle = await CyclePaiement.findOne({
      professeur: professeurId,
      statut: 'en_cours',
      actif: true
    });
    
    if (!cycle) {
      // Créer un cycle de test
      const dernierCycle = await CyclePaiement.findOne({
        professeur: professeurId
      }).sort({ numeroCycle: -1 });
      
      const nouveauNumero = dernierCycle ? dernierCycle.numeroCycle + 1 : 1;
      
      cycle = new CyclePaiement({
        professeur: professeurId,
        numeroCycle: nouveauNumero,
        dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Il y a 30 jours
        montantBrut: 1500,
        ajustements: 100,
        montantNet: 1400,
        seancesIncluses: [
          {
            seanceId: new mongoose.Types.ObjectId(),
            cours: 'Cours Test',
            date: new Date(),
            heures: 3,
            montant: 750
          },
          {
            seanceId: new mongoose.Types.ObjectId(),
            cours: 'Cours Test 2',
            date: new Date(),
            heures: 3,
            montant: 750
          }
        ],
        creeParAdmin: req.adminId
      });
      
      await cycle.save();
    }
    
    // Simuler la validation et le paiement
    cycle.statut = 'paye_admin';
    cycle.valideParFinance = req.adminId;
    cycle.dateValidationFinance = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // Il y a 2 jours
    cycle.payeParAdmin = req.adminId;
    cycle.datePaiementAdmin = new Date();
    cycle.methodePaiement = 'virement';
    cycle.referencePaiement = 'TEST-' + Date.now();
    cycle.notesFinance = 'Test de validation';
    cycle.notesAdmin = 'Test de paiement';
    cycle.dateFin = new Date();
    
    await cycle.save();
    
    res.json({
      message: 'Cycle de test créé et payé',
      cycle: cycle
    });
    
  } catch (error) {
    console.error('Erreur test paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
const dedupliquerSeancesPartagees = (seances) => {
  const seancesMap = new Map();
  
  seances.forEach(seance => {
    try {
      // Validation des données essentielles
      if (!seance.dateSeance || !seance.heureDebut || !seance.heureFin || !seance.professeur) {
        console.warn('⚠️ Séance incomplète ignorée:', seance._id);
        return;
      }

      // Extraire l'ID du professeur (peut être un ObjectId ou un objet populé)
      const profId = seance.professeur._id 
        ? seance.professeur._id.toString() 
        : seance.professeur.toString();

      // Date au format YYYY-MM-DD
      const dateStr = new Date(seance.dateSeance).toISOString().split('T')[0];
      
      // CLÉ UNIQUE : professeur + date + heure début + heure fin
      // Cette clé ignore le cours/matière - si même prof, même moment = 1 séance
      const cle = `${profId}_${dateStr}_${seance.heureDebut}_${seance.heureFin}`;
      
      if (!seancesMap.has(cle)) {
        // Première séance pour ce professeur à ce créneau
        const nomCours = (seance.coursId && seance.coursId.nom) || seance.cours || 'Cours non spécifié';
        
        seancesMap.set(cle, {
          ...seance,
          coursGroupe: [nomCours],
          matieresGroupe: seance.matiere ? [seance.matiere] : [],
          nombreGroupes: 1,
          estCoursMultiple: false
        });
        
      } else {
        // DOUBLON DÉTECTÉ - même professeur au même moment
        const seanceExistante = seancesMap.get(cle);
        const nomCours = (seance.coursId && seance.coursId.nom) || seance.cours || 'Cours non spécifié';
        
        // Ajouter le cours s'il n'est pas déjà dans la liste
        if (!seanceExistante.coursGroupe.includes(nomCours)) {
          seanceExistante.coursGroupe.push(nomCours);
          seanceExistante.nombreGroupes++;
          seanceExistante.estCoursMultiple = true;
        }
        
        // Ajouter la matière si elle existe et n'est pas déjà listée
        if (seance.matiere && !seanceExistante.matieresGroupe.includes(seance.matiere)) {
          seanceExistante.matieresGroupe.push(seance.matiere);
        }
        
        // Log pour traçabilité
        const profNom = seance.professeur.nom || profId;
        console.log(`🔄 Doublon fusionné: ${profNom} - ${dateStr} ${seance.heureDebut}-${seance.heureFin}`);
        console.log(`   Cours: ${seanceExistante.coursGroupe.join(' + ')}`);
      }
      
    } catch (err) {
      console.error('❌ Erreur lors de la déduplication:', err.message, seance._id);
    }
  });
  
  const resultat = Array.from(seancesMap.values());
  const doublonsSupprimes = seances.length - resultat.length;
  
  if (doublonsSupprimes > 0) {
    console.log(`✅ Déduplication terminée: ${seances.length} séances → ${resultat.length} séances uniques`);
    console.log(`   ${doublonsSupprimes} doublon(s) supprimé(s)`);
  } else {
    console.log(`✅ Aucun doublon détecté: ${seances.length} séances uniques`);
  }
  
  return resultat;
};
app.get('/api/professeur/rapports/mensuel', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { mois, annee } = req.query;
    
    if (!mois || !annee) {
      return res.status(400).json({ error: 'Mois et année requis' });
    }

    const dateDebut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
    const dateFin = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);

    // 1. Récupérer les séances
    let seances = await Seance.find({
      dateSeance: { $gte: dateDebut, $lte: dateFin },
      actif: true,
      typeSeance: { $ne: 'rattrapage' }
    })
    .populate('professeur', 'nom email estPermanent tarifHoraire')
    .populate('coursId', 'nom')
    .lean();

    // *** AJOUT : Dédupliquer les séances partagées ***
    seances = dedupliquerSeancesPartagees(seances);
    console.log(`📊 Séances après déduplication: ${seances.length}`);

    // 2. Récupérer les pénalités
    const penalites = await PenaliteProfesseur.find({
      mois: parseInt(mois),
      annee: parseInt(annee),
      actif: true
    }).lean();

    console.log(`🎯 PÉNALITÉS TROUVÉES: ${penalites.length}`);

    // 3. Créer un map des pénalités
    const penalitesMap = new Map();
    penalites.forEach(penalite => {
      penalitesMap.set(penalite.professeur.toString(), penalite);
    });

    // 4. Grouper par professeur
    const rapportsMap = new Map();
    
    for (const seance of seances) {
      if (!seance.professeur) continue;
      const profId = seance.professeur._id.toString();
      
      if (!rapportsMap.has(profId)) {
        rapportsMap.set(profId, {
          professeur: seance.professeur,
          seances: [],
          statistiques: {
            totalHeures: 0,
            totalSeances: 0,
            totalAPayer: 0,
            totalAPayerOriginal: 0,
            penaliteAppliquee: 0,
            tarifHoraire: seance.professeur.tarifHoraire || 0,
            coursUniques: new Set(),
            matieresUniques: new Set()
          },
          penaliteInfo: null
        });
      }

      const rapport = rapportsMap.get(profId);
      
      // Calculer durée et montant
      const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
      const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
      const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;

      rapport.statistiques.totalHeures += dureeHeures;
      rapport.statistiques.totalSeances += 1;

      if (!seance.professeur.estPermanent && seance.professeur.tarifHoraire) {
        const montantSeance = dureeHeures * seance.professeur.tarifHoraire;
        rapport.statistiques.totalAPayerOriginal += montantSeance;
      }

      // *** AJOUT : Garder l'info des groupes ***
      rapport.seances.push({
        ...seance,
        coursGroupe: seance.coursGroupe,
        nombreGroupes: seance.nombreGroupes
      });
    }

    // 5. Appliquer les pénalités
    const rapports = Array.from(rapportsMap.values()).map(rapport => {
      const profId = rapport.professeur._id.toString();
      const penalite = penalitesMap.get(profId);
      
      if (penalite && !rapport.professeur.estPermanent) {
        rapport.statistiques.penaliteAppliquee = rapport.statistiques.totalAPayerOriginal - penalite.montantAjuste;
        rapport.statistiques.totalAPayer = penalite.montantAjuste;
        rapport.penaliteInfo = {
          type: penalite.type,
          valeur: penalite.valeur,
          motif: penalite.motif,
          dateApplication: penalite.dateApplication
        };
      } else {
        rapport.statistiques.totalAPayer = rapport.statistiques.totalAPayerOriginal;
        rapport.statistiques.penaliteAppliquee = 0;
      }

      return {
        ...rapport,
        nombreSeances: rapport.seances.length,
        statistiques: {
          ...rapport.statistiques,
          totalHeures: Math.round(rapport.statistiques.totalHeures * 100) / 100,
          totalAPayerOriginal: Math.round(rapport.statistiques.totalAPayerOriginal * 100) / 100,
          totalAPayer: Math.round(rapport.statistiques.totalAPayer * 100) / 100,
          penaliteAppliquee: Math.round(rapport.statistiques.penaliteAppliquee * 100) / 100,
          coursUniques: rapport.statistiques.coursUniques.size,
          matieresUniques: rapport.statistiques.matieresUniques.size
        }
      };
    });

    res.json({
      rapports,
      periode: {
        mois: parseInt(mois),
        annee: parseInt(annee),
        nomMois: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][parseInt(mois) - 1]
      },
      totalProfesseurs: rapports.length
    });

  } catch (error) {
    console.error('Erreur rapports mensuels:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.get('/api/professeurs/rapports/mensuel', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { mois, annee } = req.query;
    
    if (!mois || !annee) {
      return res.status(400).json({ error: 'Mois et année requis' });
    }

    console.log(`Rapports pour ${mois}/${annee}`);

    const userId = req.adminId || req.userId || req.user?.id || req.user?._id;

    const professeurs = await Professeur.find({ 
      estPermanent: false, 
      actif: true 
    }).lean();

    console.log(`${professeurs.length} entrepreneurs trouves`);

    const rapports = [];

    for (const professeur of professeurs) {
      try {
        // Chercher le cycle en cours
        let cycleEnCours = await CyclePaiement.findOne({
          professeur: professeur._id,
          statut: 'en_cours',
          actif: true
        });
        
        // Si pas de cycle en cours, créer un nouveau
        if (!cycleEnCours) {
          console.log(`Creation cycle pour ${professeur.nom}`);
          
          const dernierCycle = await CyclePaiement.findOne({
            professeur: professeur._id
          }).sort({ numeroCycle: -1 });
          
          const nouveauNumero = dernierCycle ? dernierCycle.numeroCycle + 1 : 1;
          
          cycleEnCours = new CyclePaiement({
            professeur: professeur._id,
            numeroCycle: nouveauNumero,
            dateDebut: new Date(),
            statut: 'en_cours',
            actif: true,
            montantBrut: 0,
            ajustements: 0,
            montantNet: 0,
            seancesIncluses: [],
            creeParAdmin: userId
          });
          
          await cycleEnCours.save();
          console.log(`Cycle ${nouveauNumero} cree`);
        }

        // Récupérer SEULEMENT les séances non payées ET non validées
        let seancesNonPayees = await Seance.find({
          professeur: professeur._id,
          actif: true,
          payee: { $ne: true },
          typeSeance: { $ne: 'rattrapage' },
          $or: [
            { statutPaiement: { $exists: false } },
            { statutPaiement: null },
            { statutPaiement: 'en_attente' }
          ]
        }).populate('coursId', 'nom').lean();

        console.log(`${seancesNonPayees.length} seances non validees pour ${professeur.nom}`);

        // Si aucune séance non validée, passer au suivant
        if (seancesNonPayees.length === 0) {
          console.log(`Aucune seance a afficher pour ${professeur.nom}`);
          continue;
        }

        // Dédupliquer
        if (seancesNonPayees.length > 0) {
          seancesNonPayees = dedupliquerSeancesPartagees(seancesNonPayees);
        }

        // Calculer le montant brut
        let montantBrut = 0;
        let totalHeures = 0;
        const seancesIncluses = [];

        for (const seance of seancesNonPayees) {
          const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
          const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
          const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;
          
          const montantSeance = dureeHeures * (professeur.tarifHoraire || 0);
          montantBrut += montantSeance;
          totalHeures += dureeHeures;

          let nomCours = 'Cours non specifie';
          if (seance.coursId && seance.coursId.nom) {
            nomCours = seance.coursId.nom;
          } else if (seance.cours) {
            nomCours = seance.cours;
          }

          if (seance.nombreGroupes > 1) {
            nomCours = `${nomCours} (${seance.nombreGroupes} groupes)`;
          }
          
          seancesIncluses.push({
            seanceId: seance._id,
            cours: nomCours,
            coursGroupe: seance.coursGroupe,
            nombreGroupes: seance.nombreGroupes,
            date: seance.dateSeance,
            heures: Math.round(dureeHeures * 100) / 100,
            montant: Math.round(montantSeance * 100) / 100
          });
        }

        // Récupérer les pénalités actives
        const penalitesActives = await PenaliteProfesseur.find({
          professeur: professeur._id,
          actif: true,
          $or: [
            { 
              appliquePour: 'mois_actuel',
              mois: parseInt(mois),
              annee: parseInt(annee)
            },
            { appliquePour: 'permanent' }
          ]
        }).lean();

        let totalAjustements = 0;
        let penaliteInfo = null;

        for (const penalite of penalitesActives) {
          let ajustement = 0;
          if (penalite.type === 'pourcentage') {
            ajustement = (montantBrut * penalite.valeur) / 100;
          } else {
            ajustement = penalite.valeur;
          }
          
          totalAjustements += ajustement;
          
          if (!penaliteInfo) {
            penaliteInfo = {
              type: penalite.type,
              valeur: penalite.valeur,
              motif: penalite.motif,
              dateApplication: penalite.dateApplication
            };
          }
        }

        // Mettre à jour le cycle
        await CyclePaiement.findByIdAndUpdate(cycleEnCours._id, {
          montantBrut: Math.round(montantBrut * 100) / 100,
          ajustements: Math.round(totalAjustements * 100) / 100,
          montantNet: Math.round((montantBrut - totalAjustements) * 100) / 100,
          seancesIncluses: seancesIncluses,
          updatedAt: new Date()
        });

        // Construire le rapport
        const rapport = {
          professeur: {
            _id: professeur._id,
            nom: professeur.nom,
            email: professeur.email,
            estPermanent: false,
            tarifHoraire: professeur.tarifHoraire
          },
          seances: [],
          statistiques: {
            totalHeures: Math.round(totalHeures * 100) / 100,
            totalSeances: seancesNonPayees.length,
            totalAPayerOriginal: Math.round(montantBrut * 100) / 100,
            totalAPayer: Math.round((montantBrut - totalAjustements) * 100) / 100,
            penaliteAppliquee: Math.round(totalAjustements * 100) / 100,
            tarifHoraire: professeur.tarifHoraire || 0,
            coursUniques: new Set(seancesIncluses.map(s => s.cours)).size,
            matieresUniques: 1,
            
            cycleId: cycleEnCours._id,
            numeroCycle: cycleEnCours.numeroCycle,
            statutCycle: cycleEnCours.statut,
            dateValidationFinance: cycleEnCours.dateValidationFinance,
            datePaiementAdmin: cycleEnCours.datePaiementAdmin
          },
          penaliteInfo
        };

        console.log(`${professeur.nom}: ${rapport.statistiques.totalSeances} seances`);
        rapports.push(rapport);

      } catch (profError) {
        console.error(`Erreur ${professeur.nom}:`, profError);
        continue;
      }
    }

    console.log(`Total: ${rapports.length} rapports`);

    res.json({
      rapports,
      periode: {
        mois: parseInt(mois),
        annee: parseInt(annee),
        nomMois: ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'][parseInt(mois) - 1]
      },
      totalProfesseurs: rapports.length
    });

  } catch (error) {
    console.error('Erreur rapports mensuels:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.post('/api/finance/cycles/valider', authAdminOrPaiementManager, async (req, res) => {
  try {
    console.log('🟢 BACKEND: Route appelée');
    console.log('🟢 BACKEND: professeurId:', req.body.professeurId);
    console.log('🟢 BACKEND: userType:', req.userType);
    
    const { professeurId, notes } = req.body;

    if (!professeurId) {
      return res.status(400).json({ error: 'ID du professeur requis' });
    }

    // Trouver le cycle en cours
    let cycle = await CyclePaiement.findOne({
      professeur: professeurId,
      statut: 'en_cours',
      actif: true
    });
    
    if (!cycle) {
      const dernierCycle = await CyclePaiement.findOne({
        professeur: professeurId
      }).sort({ numeroCycle: -1 });
      
      const nouveauNumero = dernierCycle ? dernierCycle.numeroCycle + 1 : 1;
      
      cycle = new CyclePaiement({
        professeur: professeurId,
        numeroCycle: nouveauNumero,
        dateDebut: new Date(),
        statut: 'en_cours',
        actif: true,
        montantBrut: 0,
        ajustements: 0,
        montantNet: 0,
        seancesIncluses: [],
        creeParAdmin: req.adminId || req.userId
      });
      
      await cycle.save();
    }

    console.log('🟢 BACKEND: Cycle trouvé/créé:', cycle._id);

    // Récupérer les séances NON validées
    const seancesNonValidees = await Seance.find({
      professeur: professeurId,
      actif: true,
      payee: { $ne: true },
      typeSeance: { $ne: 'rattrapage' },
      $or: [
        { statutPaiement: { $exists: false } },
        { statutPaiement: null },
        { statutPaiement: 'en_attente' }
      ]
    });

    console.log('🟢 BACKEND:', seancesNonValidees.length, 'séances non validées trouvées');

    if (seancesNonValidees.length === 0) {
      return res.status(400).json({ error: 'Aucune séance à valider' });
    }

    // Calculer le montant brut
    const professeur = await Professeur.findById(professeurId);
    let montantBrut = 0;
    const seancesIncluses = [];

    for (const seance of seancesNonValidees) {
      const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
      const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
      const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;
      
      if (professeur && professeur.tarifHoraire) {
        const montant = dureeHeures * professeur.tarifHoraire;
        montantBrut += montant;
        
        seancesIncluses.push({
          seanceId: seance._id,
          cours: seance.cours || 'Non spécifié',
          date: seance.dateSeance,
          heures: Math.round(dureeHeures * 100) / 100,
          montant: Math.round(montant * 100) / 100
        });
      }
    }

    console.log('🟢 BACKEND: Montant brut calculé:', montantBrut);

    // Récupérer et appliquer les pénalités/ajustements
    let ajustements = 0;
    const penalites = await PenaliteProfesseur.find({
      professeur: professeurId,
      actif: true,
      $or: [
        { appliquePour: 'permanent' },
        { 
          appliquePour: 'mois_actuel',
          mois: new Date().getMonth() + 1,
          annee: new Date().getFullYear()
        }
      ]
    });

    console.log('🟢 BACKEND:', penalites.length, 'pénalités trouvées');

    for (const penalite of penalites) {
      let ajustement = 0;
      if (penalite.type === 'pourcentage') {
        ajustement = (montantBrut * penalite.valeur) / 100;
      } else {
        ajustement = penalite.valeur;
      }
      ajustements += ajustement;
      console.log('🟢 BACKEND: Pénalité appliquée:', penalite.motif, '=', ajustement, 'DH');
    }

    // Mettre à jour le cycle avec les ajustements
    cycle.montantBrut = Math.round(montantBrut * 100) / 100;
    cycle.ajustements = Math.round(ajustements * 100) / 100;
    cycle.montantNet = Math.round((montantBrut - ajustements) * 100) / 100;
    cycle.seancesIncluses = seancesIncluses;

    console.log('🟢 BACKEND: Montant brut:', cycle.montantBrut);
    console.log('🟢 BACKEND: Ajustements:', cycle.ajustements);
    console.log('🟢 BACKEND: Montant net:', cycle.montantNet);

    if (cycle.montantNet <= 0) {
      return res.status(400).json({ 
        error: 'Impossible de valider un cycle avec un montant négatif ou nul' 
      });
    }

    // Valider le cycle
    cycle.statut = 'valide_finance';
    cycle.valideParFinance = req.adminId || req.userId;
    cycle.dateValidationFinance = new Date();
    cycle.notesFinance = notes || '';
    
    await cycle.save();
    console.log('🟢 BACKEND: Cycle validé');

    // MARQUER LES SÉANCES
    const seanceIds = seancesIncluses.map(s => s.seanceId);
    
    if (seanceIds.length > 0) {
      const result = await Seance.updateMany(
        { _id: { $in: seanceIds } },
        { 
          $set: {
            statutPaiement: 'valide_finance',
            cycleValidationId: cycle._id,
            dateValidation: new Date()
          }
        }
      );
      
      console.log('✅ BACKEND:', result.modifiedCount, 'séances marquées sur', seanceIds.length);
    }

    await cycle.populate('professeur', 'nom email tarifHoraire');

    res.json({
      message: 'Cycle validé par Finance',
      cycle: cycle
    });

  } catch (error) {
    console.error('❌ BACKEND: Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});
// 3. CORRIGER l'API de paiement par Admin - AVEC CRÉATION AUTOMATIQUE DU NOUVEAU CYCLE
app.post('/api/admin/cycles/payer', authAdminOrPaiementManager, async (req, res) => {
  try {
    if (req.userType !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }

    const { cycleId, methodePaiement, referencePaiement, notes } = req.body;

    if (!cycleId || !methodePaiement) {
      return res.status(400).json({ error: 'ID du cycle et méthode de paiement requis' });
    }

    const cycle = await CyclePaiement.findById(cycleId).populate('professeur');
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle non trouvé' });
    }

    if (cycle.statut !== 'valide_finance') {
      return res.status(400).json({ error: 'Ce cycle doit être validé par Finance avant le paiement' });
    }

    // 1. Marquer le cycle comme payé
    cycle.payerParAdmin(req.adminId, methodePaiement, referencePaiement || '', notes || '');
    await cycle.save();

    // 2. IMPORTANT: Marquer toutes les séances incluses comme payées
    const seanceIds = cycle.seancesIncluses.map(s => s.seanceId);
    
    await Seance.updateMany(
      { _id: { $in: seanceIds } },
      { 
        payee: true,
        statutPaiement: 'paye_admin',
        datePaiement: new Date(),
        cyclePaiementId: cycle._id
      }
    );

    // 3. CRÉER AUTOMATIQUEMENT LE NOUVEAU CYCLE - CORRECTION CRITIQUE
    const nouveauCycle = await CyclePaiement.creerNouveauCycle(cycle.professeur._id, req.adminId);
    
    console.log(`✅ Cycle ${cycle.numeroCycle} payé pour ${cycle.professeur.nom}, nouveau cycle ${nouveauCycle.numeroCycle} créé`);

    res.json({
      message: 'Paiement effectué avec succès',
      cyclePayé: {
        id: cycle._id,
        numero: cycle.numeroCycle,
        montant: cycle.montantNet,
        professeur: cycle.professeur.nom
      },
      nouveauCycle: {
        id: nouveauCycle._id,
        numero: nouveauCycle.numeroCycle,
        dateDebut: nouveauCycle.dateDebut
      }
    });

  } catch (error) {
    console.error('Erreur paiement Admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 4. API pour forcer la création d'un cycle manquant (utilitaire de débogage)
app.post('/api/admin/cycles/creer-manquant/:professeurId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;

    // Vérifier s'il y a déjà un cycle en cours
    let cycleEnCours = await CyclePaiement.getCycleEnCours(professeurId);
    
    if (cycleEnCours) {
      return res.json({
        message: 'Un cycle en cours existe déjà',
        cycle: cycleEnCours
      });
    }

    // Créer un nouveau cycle
    const nouveauCycle = await CyclePaiement.creerNouveauCycle(professeurId, req.adminId);
    
    await nouveauCycle.populate('professeur', 'nom email');

    res.json({
      message: 'Nouveau cycle créé avec succès',
      cycle: nouveauCycle
    });

  } catch (error) {
    console.error('Erreur création cycle manquant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. API de diagnostic pour vérifier l'état des cycles d'un professeur
app.get('/api/admin/cycles/diagnostic/:professeurId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;

    const tousLesCycles = await CyclePaiement.find({
      professeur: professeurId,
      actif: true
    }).sort({ numeroCycle: 1 }).lean();

    const cycleEnCours = await CyclePaiement.getCycleEnCours(professeurId);
    
    const seancesNonPayees = await Seance.countDocuments({
      professeur: professeurId,
      actif: true,
      payee: { $ne: true }
    });

    const diagnostic = {
      professeurId,
      totalCycles: tousLesCycles.length,
      cycleEnCoursExiste: !!cycleEnCours,
      cycleEnCours: cycleEnCours ? {
        id: cycleEnCours._id,
        numero: cycleEnCours.numeroCycle,
        statut: cycleEnCours.statut,
        montantNet: cycleEnCours.montantNet
      } : null,
      seancesNonPayees,
      derniersCycles: tousLesCycles.map(c => ({
        numero: c.numeroCycle,
        statut: c.statut,
        montantNet: c.montantNet,
        dateCreation: c.createdAt
      }))
    };

    res.json({ diagnostic });

  } catch (error) {
    console.error('Erreur diagnostic cycles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ASSUREZ-VOUS aussi que le modèle PenaliteProfesseur est bien importé en haut du fichier :
// const PenaliteProfesseur = require('./models/PenaliteProfesseur');

// 4. API POUR RÉCUPÉRER L'HISTORIQUE DES PÉNALITÉS
app.get('/api/finance/penalites/historique/:professeurId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;
    
    const penalites = await PenaliteProfesseur.find({
      professeur: professeurId,
      actif: true
    })
    .populate('appliquePar', 'nom email')
    .sort({ dateApplication: -1 })
    .lean();

    res.json({
      professeurId,
      penalites,
      total: penalites.length
    });

  } catch (error) {
    console.error('Erreur historique pénalités:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. API POUR SUPPRIMER/DÉSACTIVER UNE PÉNALITÉ
app.delete('/api/finance/penalites/:penaliteId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { penaliteId } = req.params;
    
    const penalite = await PenaliteProfesseur.findById(penaliteId);
    if (!penalite) {
      return res.status(404).json({ error: 'Pénalité non trouvée' });
    }

    // Désactiver au lieu de supprimer (pour garder l'historique)
    penalite.actif = false;
    await penalite.save();

    res.json({
      message: 'Pénalité supprimée avec succès',
      penalite
    });

  } catch (error) {
    console.error('Erreur suppression pénalité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
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
app.post('/api/seances', authAdminOrPaiementManager, async (req, res) => {
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
app.post('/api/seances/template', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/seances/templates', authAdminOrPaiementManager, async (req, res) => {
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
app.post('/api/seances/generer/:nbSemaines', authAdminOrPaiementManager, async (req, res) => {
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
app.post('/api/seances/template/exception', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/professeurs/:id/calculs/:annee/:mois', authAdminOrPaiementManager, async (req, res) => {
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


// Route pour récupérer toutes les séances (pour admin) - INCHANGÉE
app.get('/api/seances', authAdminOrPaiementManager, async (req, res) => {
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

// إضافة هذا Route في ملف routes الخاص بك
app.get('/api/professeurs/periodes-disponibles', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/professeurs/verifier-periode/:annee/:mois', authAdminOrPaiementManager, async (req, res) => {
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

app.get('/api/seances/semaine/:lundiSemaine', authAdminOrPaiementManager, async (req, res) => {
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

// Route pour la validation pédagogique des étudiants
app.put('/api/etudiants/:id/validation-pedagogique', authPedagogique, async (req, res) => {
  try {
    const { statut, commentaire } = req.body;
    const etudiantId = req.params.id;
    
    // Vérifier que le statut est valide
    const statutsValides = ['En attente', 'En cours', 'Validé', 'Pas Validé'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ 
        ok: false,
        error: 'Statut de validation invalide' 
      });
    }

    console.log(`📋 Validation pédagogique demandée par ${req.user.nom}:`, {
      etudiantId,
      statut,
      commentaire: commentaire || 'Aucun commentaire'
    });

    // Chercher l'étudiant
    const etudiant = await Etudiant.findById(etudiantId);
    
    if (!etudiant) {
      return res.status(404).json({ 
        ok: false,
        error: 'Étudiant non trouvé' 
      });
    }

    // Mettre à jour la validation pédagogique
    etudiant.validationPedagogique = {
      statut: statut,
      commentaire: commentaire || '',
      validePar: req.user._id,
      dateValidation: new Date()
    };

    await etudiant.save();

    console.log(`✅ Validation pédagogique mise à jour:`, {
      etudiant: `${etudiant.prenom} ${etudiant.nomDeFamille}`,
      statut,
      par: req.user.nom
    });
    
    res.json({ 
      ok: true,
      message: 'Validation mise à jour avec succès',
      validation: etudiant.validationPedagogique,
      etudiant: {
        nom: `${etudiant.prenom} ${etudiant.nomDeFamille}`,
        id: etudiant._id
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la validation pédagogique:', error);
    res.status(500).json({ 
      ok: false,
      error: 'Erreur interne lors de la validation',
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


// Route pour obtenir les semaines disponibles (optionnel)
app.get('/api/seances/semaines-disponibles', authAdminOrPaiementManager, async (req, res) => {
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

  // ✅ NOUVEAU : Essayer comme partenaire
  const partner = await Partner.findOne({ email });
  if (partner && await partner.comparePassword(motDePasse)) {
    if (!partner.active) {
      return res.status(403).json({ message: '⛔️ Votre compte partenaire est inactif.' });
    }
    
    // Mettre à jour la dernière connexion
    partner.lastLogin = new Date();
    await partner.save();
    
    const token = jwt.sign({ 
      id: partner._id, 
      type: 'partner', // Important : type partner pour le middleware
      role: 'partner',
      nomPartner: partner.nomPartner
    }, 'jwt_secret_key', { expiresIn: '7d' });
    
    return res.json({ 
      user: {
        id: partner._id,
        nomPartner: partner.nomPartner,
        email: partner.email,
        telephone: partner.telephone,
        role: 'partner'
      }, 
      token, 
      role: 'partner' 
    });
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

// ============================================
// ROUTES PÉDAGOGIQUES - Gestion des cours
// ============================================

// 1️⃣ GET - Liste des étudiants accessibles au pédagogue
// Route pour "Gestion des Étudiants"

// Route pour "Gestion des Cours"
app.get('/api/pedagogique/mes-etudiants', authPedagogique, async (req, res) => {
  try {
    const estGeneral = req.user.estGeneral;
    
    let query = {
      anneeScolaire: '2025/2026',
      prixTotal: { 
        $exists: true,  // Le champ existe
        $ne: null,      // N'est pas null
        $gt: 0          // Strictement supérieur à 0
      }
    };
    
    if (!estGeneral) {
      query.filiere = req.user.filiere;
    }
    
    const etudiants = await Etudiant.find(query)
      .populate('commercial', 'nom nomComplet')
      .sort({ createdAt: -1 });

    console.log(`📚 Gestion Cours - ${etudiants.length} étudiants (2025/2026, prix > 0)`);
    
    res.json(etudiants);
  } catch (error) {
    console.error('Erreur récupération étudiants:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// 2️⃣ GET - Détails d'un étudiant (pédagogue)
app.get('/api/pedagogique/mes-etudiants/:id', authPedagogique, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id);
    
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    // Vérifier les permissions
    if (!req.user.estGeneral && req.user.filiere !== etudiant.filiere) {
      return res.status(403).json({ 
        message: `Vous n'avez pas accès aux étudiants de la filière ${etudiant.filiere}` 
      });
    }

    res.json(etudiant);
  } catch (error) {
    console.error('Erreur récupération étudiant:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 3️⃣ GET - Cours compatibles pour un étudiant
app.get('/api/pedagogique/mes-etudiants/:id/cours-compatibles', authPedagogique, async (req, res) => {
  try {
    console.log('🔍 Recherche cours compatibles pour étudiant:', req.params.id);
    console.log('👤 Pédagogique:', req.user);

    const etudiant = await Etudiant.findById(req.params.id);
    
    if (!etudiant) {
      console.log('❌ Étudiant non trouvé');
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    console.log('📚 Étudiant trouvé:', {
      nom: `${etudiant.prenom} ${etudiant.nomDeFamille}`,
      filiere: etudiant.filiere,
      niveau: etudiant.niveau,
      specialite: etudiant.specialite || etudiant.specialiteIngenieur
    });

    // Vérifier les permissions
    if (!req.user.estGeneral && req.user.filiere !== etudiant.filiere) {
      console.log('❌ Accès refusé - filière incompatible');
      return res.status(403).json({ 
        message: `Vous n'avez pas accès aux étudiants de la filière ${etudiant.filiere}` 
      });
    }

    // Construire la requête de recherche
    let searchQuery = {};
    
    if (etudiant.filiere === 'CYCLE_INGENIEUR') {
      if (etudiant.niveau >= 1 && etudiant.niveau <= 2) {
        searchQuery.nom = { 
          $regex: `Classes Préparatoires ${etudiant.niveau} Année`, 
          $options: 'i' 
        };
      } else if (etudiant.specialiteIngenieur) {
        searchQuery.nom = { 
          $regex: `${etudiant.specialiteIngenieur} ${etudiant.niveau} Année`, 
          $options: 'i' 
        };
      }
    } 
    else if (etudiant.filiere === 'LICENCE_PRO' && etudiant.specialiteLicencePro) {
      searchQuery.nom = { 
        $regex: `Licence Pro ${etudiant.specialiteLicencePro}`, 
        $options: 'i' 
      };
    } 
    else if (etudiant.filiere === 'MASTER_PRO' && etudiant.specialiteMasterPro) {
      searchQuery.nom = { 
        $regex: `Master Pro ${etudiant.specialiteMasterPro}`, 
        $options: 'i' 
      };
    } 
    else if (etudiant.filiere === 'IRM' || etudiant.filiere === 'MASI') {
      if (etudiant.niveau <= 2) {
        searchQuery.nom = { 
          $regex: `${etudiant.filiere} ${etudiant.niveau} Année`, 
          $options: 'i' 
        };
      } else if (etudiant.specialite) {
        searchQuery.nom = { 
          $regex: `${etudiant.filiere} ${etudiant.specialite} ${etudiant.niveau} Année`, 
          $options: 'i' 
        };
      }
    }

    console.log('🔎 Requête MongoDB:', JSON.stringify(searchQuery));

    // Récupérer les cours compatibles
    const coursCompatibles = await Cours.find(searchQuery).sort({ nom: 1 });

    console.log(`✅ ${coursCompatibles.length} cours compatibles trouvés`);
    
    res.json({
      etudiant: {
        id: etudiant._id,
        nom: `${etudiant.prenom} ${etudiant.nomDeFamille}`,
        filiere: etudiant.filiere,
        niveau: etudiant.niveau,
        specialite: etudiant.specialite || etudiant.specialiteIngenieur || etudiant.specialiteLicencePro || etudiant.specialiteMasterPro
      },
      coursActuels: etudiant.cours || [],
      coursCompatibles: coursCompatibles.map(c => ({
        _id: c._id,
        nom: c.nom,
        professeur: c.professeur
      }))
    });

  } catch (error) {
    console.error('❌ Erreur récupération cours compatibles:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// 4️⃣ PUT - Modifier les cours d'un étudiant (VERSION OPTIMISÉE)
app.put('/api/pedagogique/mes-etudiants/:id/cours', authPedagogique, async (req, res) => {
  try {
    const { cours: nouveauxCours } = req.body;

    if (!Array.isArray(nouveauxCours)) {
      return res.status(400).json({ 
        message: 'Le champ "cours" doit être un tableau' 
      });
    }

    const etudiant = await Etudiant.findById(req.params.id);
    
    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    // Vérifier les permissions
    if (!req.user.estGeneral && req.user.filiere !== etudiant.filiere) {
      return res.status(403).json({ 
        message: `Vous n'avez pas accès aux étudiants de la filière ${etudiant.filiere}` 
      });
    }

    // Validation stricte
    const erreursValidation = [];
    
    for (const nomCours of nouveauxCours) {
      const coursExiste = await Cours.findOne({ nom: nomCours });
      
      if (!coursExiste) {
        erreursValidation.push(`Le cours "${nomCours}" n'existe pas`);
        continue;
      }

      const estCompatible = validerCompatibiliteCours(etudiant, nomCours);
      
      if (!estCompatible) {
        erreursValidation.push(
          `Le cours "${nomCours}" n'est pas compatible avec la formation de l'étudiant`
        );
      }
    }

    if (erreursValidation.length > 0) {
      return res.status(400).json({ 
        message: 'Certains cours ne sont pas compatibles',
        erreurs: erreursValidation
      });
    }

    // ✅ Mise à jour directe sans déclencher la validation complète
    await Etudiant.findByIdAndUpdate(
      req.params.id,
      { $set: { cours: nouveauxCours } },
      { runValidators: false }
    );

    console.log(`✅ Cours modifiés pour ${etudiant.prenom} ${etudiant.nomDeFamille}`);

    res.json({
      message: 'Cours modifiés avec succès',
      etudiant: {
        id: etudiant._id,
        nom: `${etudiant.prenom} ${etudiant.nomDeFamille}`,
        nouveauxCours: nouveauxCours
      }
    });

  } catch (error) {
    console.error('❌ Erreur modification cours:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});
// ============================================
// FONCTION DE VALIDATION
// ============================================

function validerCompatibiliteCours(etudiant, nomCours) {
  const coursLower = nomCours.toLowerCase();
  
  if (etudiant.filiere === 'CYCLE_INGENIEUR') {
    if (etudiant.niveau >= 1 && etudiant.niveau <= 2) {
      return coursLower.includes('classes préparatoires') && 
             coursLower.includes(`${etudiant.niveau} année`);
    }
    
    if (etudiant.specialiteIngenieur) {
      return coursLower.includes(etudiant.specialiteIngenieur.toLowerCase()) &&
             coursLower.includes(`${etudiant.niveau} année`);
    }
  }
  
  else if (etudiant.filiere === 'LICENCE_PRO') {
    return coursLower.includes('licence pro') && 
           etudiant.specialiteLicencePro &&
           coursLower.includes(etudiant.specialiteLicencePro.toLowerCase());
  }
  
  else if (etudiant.filiere === 'MASTER_PRO') {
    return coursLower.includes('master pro') &&
           etudiant.specialiteMasterPro &&
           coursLower.includes(etudiant.specialiteMasterPro.toLowerCase());
  }
  
  else if (etudiant.filiere === 'IRM' || etudiant.filiere === 'MASI') {
    if (etudiant.niveau <= 2) {
      return coursLower.includes(etudiant.filiere.toLowerCase()) &&
             coursLower.includes(`${etudiant.niveau} année`);
    }
    
    if (etudiant.specialite) {
      return coursLower.includes(etudiant.filiere.toLowerCase()) &&
             coursLower.includes(etudiant.specialite.toLowerCase()) &&
             coursLower.includes(`${etudiant.niveau} année`);
    }
  }

  return false;
}

app.get('/api/etudiants/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id);
    if (!etudiant) return res.status(404).json({ message: "Étudiant introuvable" });
    res.json(etudiant);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});
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
app.get('/api/administratifs', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/administratifs/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.post('/api/administratifs', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/administratifs/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/administratifs/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.patch('/api/administratifs/:id/actif', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/administratifs/stats/dashboard', authAdminOrPaiementManager, async (req, res) => {
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
app.post('/api/actualites', authAdminOrPaiementManager, upload.single('image'), async (req, res) => {
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
app.delete('/api/actualites/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/actualites/:id', authAdminOrPaiementManager, upload.single('image'), async (req, res) => {
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

app.get('/api/revenus/previsions/:anneeScolaire', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/notifications/stats-absences', authAdminOrPaiementManager, async (req, res) => {
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



// ===== CRUD ROUTES POUR PARTNER =====

// 📊 GET - Statistiques partners (DOIT ÊTRE EN PREMIER - ROUTES SPÉCIFIQUES)
app.get('/api/partners/stats', authAdminOrPaiementManager, async (req, res) => {
  try {
    const [totalPartners, partnersActifs, partnersInactifs] = await Promise.all([
      Partner.countDocuments({}),
      Partner.countDocuments({ active: true }),
      Partner.countDocuments({ active: false })
    ]);
    
    res.json({
      success: true,
      data: {
        partners: {
          total: totalPartners,
          actifs: partnersActifs,
          inactifs: partnersInactifs
        },
        etudiants: [] // Temporairement vide
      }
    });
    
  } catch (err) {
    console.error('❌ Erreur stats partners:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 📋 GET - Obtenir partners actifs pour select (ROUTES SPÉCIFIQUES AVANT /:id)
app.get('/api/partners/active-list', authCommercial, async (req, res) => {
  try {
    const partners = await Partner.getPartnersActifs();
    
    // Format spécial pour les selects
    const partnersList = partners.map(partner => ({
      value: partner._id,
      label: partner.nomPartner,
      id: partner._id,
      nom: partner.nomPartner,
      email: partner.email
    }));
    
    res.json({
      success: true,
      data: partnersList
    });
    
  } catch (err) {
    console.error('❌ Erreur liste partners actifs:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 🔐 POST - Connexion partner (ROUTES SPÉCIFIQUES AVANT /:id)
app.post('/api/partners/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    // Chercher le partner par email
    const partner = await Partner.findOne({ 
      email: email.toLowerCase(),
      active: true 
    });
    
    if (!partner) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await partner.comparePassword(motDePasse);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: partner._id, 
        email: partner.email,
        role: 'partner',
        nomPartner: partner.nomPartner
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      partner: {
        id: partner._id,
        nomPartner: partner.nomPartner,
        email: partner.email,
        role: 'partner'
      }
    });
    
  } catch (err) {
    console.error('❌ Erreur connexion partner:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 📊 GET - Obtenir tous les partners (ROUTES GÉNÉRALES)
app.get('/api/partners', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { active } = req.query;
    
    let filter = {};
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    const partners = await Partner.find(filter).sort({ nomPartner: 1 });
    
    res.json({
      success: true,
      data: partners,
      count: partners.length
    });
    
  } catch (err) {
    console.error('❌ Erreur récupération partners:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ➕ POST - Créer un nouveau partner
app.post('/api/partners', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { nomPartner, email, motDePasse, active } = req.body;
    
    // Validation
    if (!nomPartner || nomPartner.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le nom du partner est obligatoire'
      });
    }
    
    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'L\'email du partner est obligatoire'
      });
    }
    
    if (!motDePasse || motDePasse.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Vérifier si le partner existe déjà (nom ou email)
    const existingPartner = await Partner.findOne({ 
      $or: [
        { nomPartner: nomPartner.trim() },
        { email: email.trim().toLowerCase() }
      ]
    });
    
    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message: existingPartner.nomPartner === nomPartner.trim() 
          ? 'Ce nom de partner existe déjà'
          : 'Cet email est déjà utilisé'
      });
    }
    
    const partner = new Partner({
      nomPartner: nomPartner.trim(),
      email: email.trim().toLowerCase(),
      motDePasse: motDePasse,
      active: active !== undefined ? active : true
    });
    
    await partner.save();
    
    res.status(201).json({
      success: true,
      message: 'Partner créé avec succès',
      data: partner
    });
    
  } catch (err) {
    console.error('❌ Erreur création partner:', err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'email' 
        ? 'Cet email est déjà utilisé'
        : 'Ce nom de partner existe déjà';
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 🔍 GET - Obtenir un partner par ID (DOIT ÊTRE APRÈS LES ROUTES SPÉCIFIQUES)
app.get('/api/partners/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partner invalide'
      });
    }
    
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: partner
    });
    
  } catch (err) {
    console.error('❌ Erreur récupération partner:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ✏️ PUT - Modifier un partner
app.put('/api/partners/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partner invalide'
      });
    }
    
    const { nomPartner, email, motDePasse, active } = req.body;
    
    // Validation
    if (!nomPartner || nomPartner.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le nom du partner est obligatoire'
      });
    }
    
    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'L\'email du partner est obligatoire'
      });
    }
    
    // Vérifier si un autre partner a déjà ce nom ou cet email
    const existingPartner = await Partner.findOne({ 
      $or: [
        { nomPartner: nomPartner.trim() },
        { email: email.trim().toLowerCase() }
      ],
      _id: { $ne: req.params.id }
    });
    
    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message: existingPartner.nomPartner === nomPartner.trim()
          ? 'Ce nom de partner est déjà utilisé'
          : 'Cet email est déjà utilisé'
      });
    }
    
    const updateData = {
      nomPartner: nomPartner.trim(),
      email: email.trim().toLowerCase(),
      active: active !== undefined ? active : true
    };
    
    // Si un nouveau mot de passe est fourni
    if (motDePasse && motDePasse.trim() !== '') {
      if (motDePasse.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }
      updateData.motDePasse = motDePasse;
    }
    
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Partner modifié avec succès',
      data: partner
    });
    
  } catch (err) {
    console.error('❌ Erreur modification partner:', err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'email' 
        ? 'Cet email est déjà utilisé'
        : 'Ce nom de partner existe déjà';
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 🔄 PATCH - Toggle actif/inactif
app.patch('/api/partners/:id/toggle', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partner invalide'
      });
    }
    
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner non trouvé'
      });
    }
    
    await partner.toggleActive();
    
    res.json({
      success: true,
      message: `Partner ${partner.active ? 'activé' : 'désactivé'} avec succès`,
      data: partner
    });
    
  } catch (err) {
    console.error('❌ Erreur toggle partner:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 🔑 PATCH - Changer le mot de passe
app.patch('/api/partners/:id/change-password', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partner invalide'
      });
    }
    
    const { nouveauMotDePasse } = req.body;
    
    if (!nouveauMotDePasse || nouveauMotDePasse.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner non trouvé'
      });
    }
    
    await partner.changerMotDePasse(nouveauMotDePasse);
    
    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
    
  } catch (err) {
    console.error('❌ Erreur changement mot de passe:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 🗑️ DELETE - Supprimer un partner
app.delete('/api/partners/:id', authAdminOrPaiementManager, async (req, res) => {
  try {
    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partner invalide'
      });
    }
    
    // Vérifier si des étudiants utilisent ce partner
    const etudiantsUtilisant = await Etudiant.countDocuments({ 
      nomPartner: req.params.id 
    });
    
    if (etudiantsUtilisant > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce partner car ${etudiantsUtilisant} étudiant(s) l'utilisent encore`
      });
    }
    
    const partner = await Partner.findByIdAndDelete(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Partner supprimé avec succès',
      data: partner
    });
    
  } catch (err) {
    console.error('❌ Erreur suppression partner:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
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
app.post('/api/vie-scolaire', authAdminOrPaiementManager, uploadVieScolaire.array('images', 10), async (req, res) => {
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
app.post('/api/commerciaux', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/commerciaux/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/commerciaux/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/commerciaux/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/commerciaux/statistiques', authAdminOrPaiementManager, async (req, res) => {
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
app.patch('/api/commerciaux/:id/actif', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/commerciaux/statistiques', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/vie-scolaire/:id', authAdminOrPaiementManager, uploadVieScolaire.array('images', 10), async (req, res) => {
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
app.delete('/api/vie-scolaire/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/vie-scolaire/:id/images/:imageIndex', authAdminOrPaiementManager, async (req, res) => {
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

app.put('/update-profil', authAdminOrPaiementManager, async (req, res) => {
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




const addUserInfo = (data, userInfo, action) => {
  console.log('=== DEBUG addUserInfo ===');
  console.log('userInfo reçu:', userInfo);
  console.log('userInfo type:', typeof userInfo);
  console.log('userInfo existe:', !!userInfo);
  
  if (!userInfo) {
    console.log('ERREUR: userInfo est undefined ou null');
    return {
      ...data,
      lastActionByName: 'Erreur utilisateur',
      lastActionByEmail: 'erreur@system.com',
      lastActionByRole: 'admin',
      lastActionType: action,
      lastActionAt: new Date()
    };
  }

  console.log('Propriétés userInfo:', Object.keys(userInfo));
  console.log('userInfo.nom:', userInfo.nom);
  console.log('userInfo.email:', userInfo.email);
  console.log('userInfo.role:', userInfo.role);

  const result = {
    ...data,
    lastActionById: userInfo.id,
    lastActionByName: userInfo.nom,
    lastActionByEmail: userInfo.email,
    lastActionByRole: userInfo.role,
    lastActionType: action,
    lastActionAt: new Date()
  };

  console.log('Résultat addUserInfo:', {
    lastActionByName: result.lastActionByName,
    lastActionByEmail: result.lastActionByEmail,
    lastActionByRole: result.lastActionByRole
  });
  console.log('========================');

  return result;
};
// Route historique général
// Corrigez les deux routes d'historique :
// Route historique général - AVEC DEBUG COMPLET
app.get('/api/seances/historique', authAdmin, async (req, res) => {
  try {
    console.log('=== DEBUG HISTORIQUE GÉNÉRAL ===');
    console.log('Début récupération historique...');

    const seances = await Seance.find({})
.select('cours coursId professeur matiere salle dateSeance jour heureDebut heureFin lastActionById lastActionByName lastActionByEmail lastActionByRole lastActionType lastActionAt createdAt updatedAt typeSeance actif')
      .populate('professeur', 'nom')
      .populate('coursId', 'nom')
      .sort({ lastActionAt: -1, createdAt: -1 })
      .limit(50);

    console.log(`Total séances trouvées: ${seances.length}`);

    // DEBUG: Afficher les 5 premières séances avec détails complets
    console.log('=== TOP 5 SÉANCES ===');
    seances.slice(0, 5).forEach((seance, index) => {
      console.log(`Séance ${index + 1}:`, {
        _id: seance._id,
        cours: seance.cours,
        lastActionByName: seance.lastActionByName,
        lastActionByEmail: seance.lastActionByEmail,
        lastActionByRole: seance.lastActionByRole,
        lastActionType: seance.lastActionType,
        lastActionAt: seance.lastActionAt,
        createdAt: seance.createdAt,
        updatedAt: seance.updatedAt
      });
    });
    console.log('========================');

    const historique = seances.map(seance => {
      let nomCours = 'Cours non défini';
      if (seance.coursId && seance.coursId.nom) {
        nomCours = seance.coursId.nom;
      } else if (seance.cours) {
        nomCours = seance.cours;
      }

      console.log(`Mapping séance ${seance._id}:`, {
        lastActionByName_original: seance.lastActionByName,
        lastActionByName_final: seance.lastActionByName || 'Système automatique'
      });

      return {
        id: seance._id,
        cours: nomCours,
        professeur: seance.professeur?.nom,
        matiere: seance.matiere,
        salle: seance.salle,
        dateSeance: seance.dateSeance,
        jour: seance.jour,
        heureDebut: seance.heureDebut,
        heureFin: seance.heureFin,
        derniereAction: {
          utilisateur: seance.lastActionByName || 'Système automatique',
          email: seance.lastActionByEmail || 'system@auto.com',
          role: seance.lastActionByRole || 'admin',
          action: seance.lastActionType || 'creation',
          date: seance.lastActionAt || seance.createdAt
        },
        dateCreation: seance.createdAt,
        derniereMiseAJour: seance.updatedAt,
        typeSeance: seance.typeSeance,
        actif: seance.actif
      };
    });

    console.log('=== PREMIÈRE SÉANCE MAPPÉE ===');
    if (historique.length > 0) {
      console.log('Première séance retournée:', {
        id: historique[0].id,
        utilisateur: historique[0].derniereAction.utilisateur,
        email: historique[0].derniereAction.email,
        role: historique[0].derniereAction.role
      });
    }
    console.log('===============================');

    res.json(historique);
  } catch (err) {
    console.error('Erreur historique:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route historique spécifique - AVEC DEBUG COMPLET
app.get('/api/seances/historique/:id', authAdmin, async (req, res) => {
  try {
    console.log('=== DEBUG HISTORIQUE SPÉCIFIQUE ===');
    console.log('ID recherché:', req.params.id);

    const seance = await Seance.findById(req.params.id)
.select('cours coursId professeur matiere salle dateSeance jour heureDebut heureFin lastActionById lastActionByName lastActionByEmail lastActionByRole lastActionType lastActionAt createdAt updatedAt typeSeance actif')
      .populate('professeur', 'nom')
      .populate('coursId', 'nom');

    if (!seance) {
      console.log('SÉANCE NON TROUVÉE');
      return res.status(404).json({ error: 'Séance non trouvée' });
    }

    console.log('SÉANCE TROUVÉE - DONNÉES BRUTES:', {
      _id: seance._id,
      lastActionByName: seance.lastActionByName,
      lastActionByEmail: seance.lastActionByEmail,
      lastActionByRole: seance.lastActionByRole,
      lastActionType: seance.lastActionType,
      lastActionAt: seance.lastActionAt,
      createdAt: seance.createdAt,
      updatedAt: seance.updatedAt
    });

    let nomCours = 'Cours non défini';
    if (seance.coursId && seance.coursId.nom) {
      nomCours = seance.coursId.nom;
    } else if (seance.cours) {
      nomCours = seance.cours;
    }

    const utilisateurFinal = seance.lastActionByName || 'Système automatique';
    console.log('UTILISATEUR FINAL CALCULÉ:', utilisateurFinal);

    const historique = [{
      id: seance._id,
      cours: nomCours,
      professeur: seance.professeur?.nom,
      matiere: seance.matiere,
      salle: seance.salle,
      dateSeance: seance.dateSeance,
      jour: seance.jour,
      heureDebut: seance.heureDebut,
      heureFin: seance.heureFin,
      derniereAction: {
        utilisateur: utilisateurFinal,
        email: seance.lastActionByEmail || 'system@auto.com',
        role: seance.lastActionByRole || 'admin',
        action: seance.lastActionType || 'creation',
        date: seance.lastActionAt || seance.createdAt
      },
      dateCreation: seance.createdAt,
      derniereMiseAJour: seance.updatedAt,
      typeSeance: seance.typeSeance,
      actif: seance.actif
    }];

    console.log('HISTORIQUE FINAL RETOURNÉ:', {
      utilisateur: historique[0].derniereAction.utilisateur,
      email: historique[0].derniereAction.email,
      role: historique[0].derniereAction.role
    });
    console.log('===================================');

    res.json(historique);
  } catch (err) {
    console.error('Erreur historique spécifique:', err);
    res.status(500).json({ error: err.message });
  }
});
// Route POST - Création avec traçabilité
app.post('/api/seances/exception', authAdmin, async (req, res) => {
  console.log('=== DEBUG TRAÇABILITÉ COMPLET ===');
  console.log('req.userInfo:', JSON.stringify(req.userInfo, null, 2));
  
  try {
    const { cours, professeur, matiere, salle, dateSeance, jour, heureDebut, heureFin } = req.body;

    if (!dateSeance) {
      return res.status(400).json({ ok: false, error: 'La date de séance est obligatoire' });
    }

    const q = { 
      cours,
      dateSeance: new Date(dateSeance),
      heureDebut,
      heureFin,
      typeSeance: 'exception'
    };

    const update = addUserInfo({
      cours,
      coursId: cours,
      professeur,
      matiere,
      salle,
      jour,
      dateSeance: new Date(dateSeance),
      typeSeance: 'exception',
      actif: true
    }, req.userInfo, 'creation');

    console.log('UPDATE OBJECT COMPLET:', JSON.stringify(update, null, 2));

    const doc = await Seance.findOneAndUpdate(q, { $set: update }, { new: true, upsert: true });

    console.log('DOCUMENT APRÈS SAUVEGARDE:', {
      _id: doc._id,
      lastActionByName: doc.lastActionByName,
      lastActionByEmail: doc.lastActionByEmail,
      lastActionByRole: doc.lastActionByRole,
      lastActionType: doc.lastActionType,
      lastActionAt: doc.lastActionAt
    });

    // Vérifier immédiatement en base
    const verification = await Seance.findById(doc._id);
    console.log('VÉRIFICATION IMMÉDIATE BDD:', {
      lastActionByName: verification.lastActionByName,
      lastActionByEmail: verification.lastActionByEmail,
      lastActionByRole: verification.lastActionByRole
    });

    return res.json({ ok: true, seance: doc });

  } catch (err) {
    console.error('Erreur exception:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
app.put('/api/seances/:id', authAdmin, async (req, res) => {
  console.log('=== DEBUG MODIFICATION SÉANCE ===');
  console.log('ID séance:', req.params.id);
  console.log('req.userInfo:', JSON.stringify(req.userInfo, null, 2));
  console.log('Body reçu:', JSON.stringify(req.body, null, 2));

  try {
    const { id } = req.params;
    const { 
      cours, 
      professeur, 
      matiere, 
      salle, 
      dateSeance, 
      jour, 
      heureDebut, 
      heureFin,
      actif,
      notes 
    } = req.body;

    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('ERREUR: ID invalide');
      return res.status(400).json({ ok: false, error: 'ID de séance invalide' });
    }

    // Vérifier que la séance existe
    const seanceExistante = await Seance.findById(id);
    if (!seanceExistante) {
      console.log('ERREUR: Séance non trouvée');
      return res.status(404).json({ ok: false, error: 'Séance non trouvée' });
    }

    console.log('SÉANCE EXISTANTE TROUVÉE:', seanceExistante._id);

    // Validation des champs obligatoires
    if (!professeur) {
      return res.status(400).json({ ok: false, error: 'Le professeur est obligatoire' });
    }

    if (!matiere) {
      return res.status(400).json({ ok: false, error: 'La matière est obligatoire' });
    }

    // Vérifier que le professeur existe
    const professeurDoc = await Professeur.findById(professeur);
    if (!professeurDoc) {
      return res.status(400).json({ ok: false, error: 'Professeur non trouvé' });
    }

    // Construire l'objet de mise à jour AVEC votre fonction addUserInfo
    const updateFields = {
      professeur,
      matiere,
      salle: salle || '',
      actif: actif !== undefined ? actif : true,
      notes: notes || ''
    };

    // Ajouter les champs optionnels s'ils sont fournis
    if (cours) updateFields.cours = cours;
    if (dateSeance) updateFields.dateSeance = new Date(dateSeance);
    if (jour) updateFields.jour = jour;
    if (heureDebut) updateFields.heureDebut = heureDebut;
    if (heureFin) updateFields.heureFin = heureFin;

    // Gérer le coursId si un cours est fourni
    if (cours) {
      const coursDoc = await Cours.findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(cours) ? cours : null },
          { nom: cours }
        ]
      });
      
      if (coursDoc) {
        updateFields.coursId = coursDoc._id;
        updateFields.cours = coursDoc.nom;
      } else {
        updateFields.cours = cours;
        updateFields.coursId = null;
      }
    }

    // UTILISER VOTRE FONCTION addUserInfo pour la traçabilité
    const updateData = addUserInfo(updateFields, req.userInfo, 'modification');

    console.log('UPDATE DATA COMPLET:', JSON.stringify(updateData, null, 2));

    // Mettre à jour la séance
    const seanceMiseAJour = await Seance.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate('professeur', 'nom email estPermanent tarifHoraire')
    .populate('coursId', 'nom');

    console.log('SÉANCE APRÈS MISE À JOUR:', {
      _id: seanceMiseAJour._id,
      lastActionByName: seanceMiseAJour.lastActionByName,
      lastActionByEmail: seanceMiseAJour.lastActionByEmail,
      lastActionByRole: seanceMiseAJour.lastActionByRole,
      lastActionType: seanceMiseAJour.lastActionType,
      lastActionAt: seanceMiseAJour.lastActionAt
    });

    // Vérification immédiate en base
    const verification = await Seance.findById(id);
    console.log('VÉRIFICATION IMMÉDIATE BDD:', {
      lastActionByName: verification.lastActionByName,
      lastActionByEmail: verification.lastActionByEmail,
      lastActionByRole: verification.lastActionByRole
    });

    console.log(`Séance ${id} mise à jour par:`, req.userInfo.nom, '(', req.userInfo.role, ')');

    // Calculer la durée et le montant si nécessaire
    let calculs = null;
    if (seanceMiseAJour.calculerDureeEtMontant) {
      calculs = await seanceMiseAJour.calculerDureeEtMontant();
    }

    // Retourner la réponse dans votre format
    const response = {
      ...seanceMiseAJour.toObject(),
      ...(calculs && { dureeHeures: calculs.dureeHeures, montant: calculs.montant })
    };

    console.log('=================================');

    res.json({
      ok: true,
      message: 'Séance mise à jour avec succès',
      seance: response
    });

  } catch (err) {
    console.error('ERREUR mise à jour séance:', err);
    
    // Gestion des erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        ok: false,
        error: 'Erreur de validation', 
        details: errors 
      });
    }

    // Erreur de cast (mauvais ObjectId)
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        ok: false,
        error: 'Format d\'ID invalide' 
      });
    }

    res.status(500).json({ 
      ok: false,
      error: 'Erreur serveur lors de la mise à jour',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


// Route DELETE - Suppression avec traçabilité
app.delete('/api/seances/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const seance = await Seance.findById(id);
    
    if (!seance) {
      return res.status(404).json({ ok: false, message: 'Séance introuvable' });
    }

    const updateData = addUserInfo({
      actif: false
    }, req.userInfo, 'suppression');

    await Seance.findByIdAndUpdate(id, updateData);

    console.log('Séance supprimée par:', req.userInfo.nom, '(', req.userInfo.role, ')');
    return res.json({ ok: true, deletedId: id, message: 'Séance supprimée avec succès' });
    
  } catch (err) {
    console.error('Erreur suppression:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// REMPLACEZ par cette route simple :
app.put('/api/seances/exception/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      cours, 
      professeur, 
      matiere, 
      salle, 
      dateSeance, 
      jour, 
      heureDebut, 
      heureFin 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'ID de séance invalide' });
    }

    const seanceExistante = await Seance.findById(id);
    if (!seanceExistante) {
      return res.status(404).json({ ok: false, error: 'Séance non trouvée' });
    }

    // Utiliser votre pattern addUserInfo
    const updateFields = {
      professeur,
      matiere,
      salle: salle || ''
    };

    const updateData = addUserInfo(updateFields, req.userInfo, 'modification');

    const seanceMiseAJour = await Seance.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('professeur', 'nom').populate('coursId', 'nom');

    return res.json({
      ok: true,
      message: 'Exception mise à jour avec succès',
      seance: seanceMiseAJour
    });

  } catch (err) {
    console.error('Erreur modification exception:', err);
    res.status(500).json({ 
      ok: false,
      error: 'Erreur serveur lors de la modification de l\'exception' 
    });
  }
});




app.delete('/api/seances/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const seance = await Seance.findById(id);
    
    if (!seance) {
      return res.status(404).json({ ok: false, message: 'Séance introuvable' });
    }

    const updateData = addUserInfo({
      actif: false // IMPORTANT : Marquer comme inactif
    }, req.userInfo, 'suppression');

    // NOUVEAU : Utiliser $set pour s'assurer de la mise à jour
    const updatedSeance = await Seance.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true }
    );

    console.log('Séance supprimée par:', req.userInfo.nom, '(', req.userInfo.role, ')');
    console.log('Séance après suppression - actif:', updatedSeance.actif); // Debug

    return res.json({ 
      ok: true, 
      deletedId: id, 
      message: 'Séance supprimée avec succès',
      seance: updatedSeance 
    });
    
  } catch (err) {
    console.error('Erreur suppression:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});


app.get('/api/seances/etudiant', authEtudiant, async (req, res) => {
  try {
    const { semaine } = req.query;
    const etudiant = await Etudiant.findById(req.etudiantId);
    const coursNoms = etudiant.cours;

    // Trouver les IDs des cours correspondants
    const coursObjects = await Cours.find({ nom: { $in: coursNoms } });
    const coursIds = coursObjects.map(c => c._id.toString());

    console.log('DEBUG - Cours étudiant:', coursNoms);
    console.log('DEBUG - IDs cours trouvés:', coursIds);

    let dateFilter = {};
    if (semaine) {
      const lundiSemaine = new Date(semaine);
      const dimancheSemaine = new Date(lundiSemaine.getTime() + 6 * 24 * 60 * 60 * 1000);
      dimancheSemaine.setHours(23, 59, 59, 999);
      
      dateFilter = {
        dateSeance: {
          $gte: lundiSemaine,
          $lte: dimancheSemaine
        }
      };
      console.log('DEBUG - Filtre de date:', dateFilter);
    }

    const seances = await Seance.find({ 
      $or: [
        { cours: { $in: coursNoms } },
        { cours: { $in: coursIds } },
        { coursId: { $in: coursIds } }
      ],
      actif: true,
      typeSeance: { $in: ['reelle', 'exception', 'rattrapage'] },
      ...dateFilter
    })
    .populate('professeur', 'nom')
    .populate('coursId', 'nom')
    .sort({ dateSeance: 1, heureDebut: 1 });

    // Correction et normalisation des séances
    const seancesCorrigees = seances.map(seance => {
      const seanceObj = seance.toObject();
      
      // S'assurer que actif est true par défaut
      if (seanceObj.actif === undefined || seanceObj.actif === null) {
        seanceObj.actif = true;
      }
      
      // Normaliser le typeSeance
      if (!seanceObj.typeSeance) {
        seanceObj.typeSeance = 'reelle';
      }
      
      // Corriger le nom du cours
      if (seanceObj.coursId && seanceObj.coursId.nom) {
        seanceObj.cours = seanceObj.coursId.nom;
      } else if (coursIds.includes(seanceObj.cours)) {
        const coursCorrespondant = coursObjects.find(c => c._id.toString() === seanceObj.cours);
        if (coursCorrespondant) {
          seanceObj.cours = coursCorrespondant.nom;
        }
      }
      
      // Calculer le jour de la semaine en français
      if (seanceObj.dateSeance) {
        const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        seanceObj.jour = joursSemaine[new Date(seanceObj.dateSeance).getDay()];
      }
      
      return seanceObj;
    });

    console.log('DEBUG - Séances trouvées et corrigées:', seancesCorrigees.length);
    seancesCorrigees.forEach((seance, index) => {
      console.log(`${index + 1}. Cours: "${seance.cours}", Jour: ${seance.jour}, Actif: ${seance.actif}, Type: ${seance.typeSeance}, Heure: ${seance.heureDebut}-${seance.heureFin}`);
    });

    res.json(seancesCorrigees);
  } catch (err) {
    console.error('Erreur séances étudiant:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
app.put('/api/pedagogique/seances/:id/rattrapage', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Tentative rattrapage:', id, 'par:', req.userInfo.nom);

    const seance = await Seance.findById(id);
    if (!seance) {
      return res.status(404).json({ error: 'Séance non trouvée' });
    }

    // Vos vérifications de permissions existantes...
    // (garder votre code de permissions)

    const updateData = addUserInfo({
      typeSeance: 'rattrapage',
      actif: true, // IMPORTANT : Les rattrapages restent actifs
      modifieParPedagogique: req.userInfo.id,
      notes: `Rattrapage le ${new Date().toLocaleString('fr-FR')} par ${req.userInfo.nom}`
    }, req.userInfo, 'rattrapage');

    const updatedSeance = await Seance.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true }
    );

    console.log('Rattrapage marqué par:', req.userInfo.nom, '(', req.userInfo.role, ')');
    console.log('Séance après rattrapage - typeSeance:', updatedSeance.typeSeance); // Debug
    
    res.json({ 
      ok: true, 
      message: 'Séance marquée en rattrapage', 
      seance: updatedSeance 
    });

  } catch (error) {
    console.error('Erreur rattrapage:', error);
    res.status(500).json({ error: 'Erreur serveur lors du marquage rattrapage' });
  }
});
// Route pour les statistiques de rattrapages - VERSION CORRIGÉE AVEC PERMISSIONS
app.get('/api/pedagogique/rattrapages/statistiques', authAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.userType; // 'admin', 'finance_prof', 'pedagogique'
    
    console.log(`📊 Calcul statistiques rattrapages pour user: ${userId}, type: ${userType}`);
    
    let userInfo = null;
    let pipeline = [];
    
    // DÉTERMINER LE TYPE D'UTILISATEUR ET SES PERMISSIONS
    if (userType === 'admin' || userType === 'finance_prof') {
      console.log(`👑 Utilisateur ${userType} - Accès à tous les rattrapages`);
      // Admin et Finance_prof voient TOUT
      userInfo = { nom: 'Administrateur', filiere: 'TOUTES' };
    } else {
      // Pédagogique - Récupérer ses informations
      userInfo = await Pedagogique.findById(userId);
      if (!userInfo) {
        return res.status(404).json({ error: 'Utilisateur pédagogique non trouvé' });
      }
      
      console.log(`👤 Pédagogique: ${userInfo.nom}, filière: ${userInfo.filiere}`);
      
      // Si pédagogique général, voir tout
      if (userInfo.filiere !== 'GENERAL') {
        console.log(`🎯 Filtre pour filière spécifique: ${userInfo.filiere}`);
        
        // Récupérer les cours de la filière du pédagogique
        const coursDeFiliere = await Cours.find({ filiere: userInfo.filiere }).select('_id nom');
        let idsCoursFiliere = coursDeFiliere.map(c => c._id);
        
        console.log(`📚 Cours de la filière trouvés (${coursDeFiliere.length}):`, 
          coursDeFiliere.map(c => ({ id: c._id.toString(), nom: c.nom })));
        
        // Si pas de cours avec filiere explicite, chercher par les étudiants
        if (idsCoursFiliere.length === 0) {
          console.log(`⚠️ Recherche via les étudiants de ${userInfo.filiere}...`);
          
          const etudiantsFiliere = await Etudiant.find({ 
            filiere: userInfo.filiere,
            actif: true 
          }).select('cours');
          
          const nomsCoursEtudiants = [...new Set(etudiantsFiliere.flatMap(e => e.cours || []))];
          console.log(`🎓 Cours des étudiants ${userInfo.filiere}:`, nomsCoursEtudiants);
          
          // Convertir les noms en ObjectId
          const coursParNomsEtudiants = await Cours.find({
            nom: { $in: nomsCoursEtudiants }
          }).select('_id nom');
          
          idsCoursFiliere.push(...coursParNomsEtudiants.map(c => c._id));
          console.log(`📚 ObjectId des cours étudiants (${coursParNomsEtudiants.length}):`, 
            coursParNomsEtudiants.map(c => ({ id: c._id.toString(), nom: c.nom })));
        }
        
        if (idsCoursFiliere.length > 0) {
          // Créer les conditions pour STRING et ObjectId
          const coursStringIds = idsCoursFiliere.map(id => id.toString());
          
          pipeline.push({
            $match: {
              $or: [
                { cours: { $in: idsCoursFiliere } },  // Pour les ObjectId
                { cours: { $in: coursStringIds } },   // Pour les strings
                { coursId: { $in: idsCoursFiliere } } // Pour coursId aussi
              ]
            }
          });
          
          console.log(`🔍 Filtre appliqué pour ${userInfo.filiere} avec ${idsCoursFiliere.length} cours`);
        }
      } else {
        console.log(`📊 Pédagogique général - Accès à toutes les filières`);
      }
    }
    
    // PIPELINE PRINCIPAL - Filtrer les séances actives
    pipeline.push(
      {
        $match: {
          $or: [
            { actif: { $ne: false } },
            { actif: { $exists: false } }
          ]
        }
      }
    );
    
    // Vérifier qu'on a des données
    const totalSeances = await Seance.countDocuments({
      $and: pipeline.map(stage => stage.$match)
    });
    
    console.log(`📈 Total séances trouvées: ${totalSeances}`);
    
    if (totalSeances === 0) {
      return res.json({ 
        ok: true, 
        statistiques: [], 
        filiere: userInfo.filiere,
        userType: userType,
        totalProfesseurs: 0,
        totalRattrapages: 0,
        totalSeances: 0,
        message: userType === 'admin' || userType === 'finance_prof' ? 
          'Aucune séance trouvée dans le système' : 
          `Aucune séance trouvée pour ${userInfo.filiere === 'GENERAL' ? 'toutes les filières' : 'la filière ' + userInfo.filiere}`
      });
    }
    
    // PIPELINE COMPLET POUR LES STATISTIQUES
    const fullPipeline = [
      ...pipeline,
      
      // Ajouter un champ de debug
      {
        $addFields: {
          debug_professeur: { $toString: "$professeur" },
          debug_cours: { $toString: "$cours" },
          debug_typeSeance: { $ifNull: ["$typeSeance", "normale"] },
          debug_actif: { $ifNull: ["$actif", true] }
        }
      },
      
      // Lookup pour récupérer les infos du professeur
      {
        $lookup: {
          from: 'professeurs',
          localField: 'professeur',
          foreignField: '_id',
          as: 'prof'
        }
      },
      { 
        $unwind: {
          path: '$prof',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Lookup pour récupérer les infos du cours
      {
        $lookup: {
          from: 'cours',
          localField: 'cours',
          foreignField: '_id',
          as: 'coursInfo'
        }
      },
      {
        $addFields: {
          nomCours: {
            $cond: [
              { $eq: [{ $type: '$coursInfo' }, 'array'] },
              {
                $cond: [
                  { $eq: [{ $size: '$coursInfo' }, 0] },
                  { $toString: '$cours' },
                  { $arrayElemAt: ['$coursInfo.nom', 0] }
                ]
              },
              { $toString: '$cours' }
            ]
          },
          nomProfesseurDebug: { $ifNull: ['$prof.nom', 'Professeur inconnu'] }
        }
      },
      
      // Grouper par professeur avec comptage détaillé
      {
        $group: {
          _id: '$professeur',
          nomProfesseur: { $first: { $ifNull: ['$prof.nom', 'Professeur inconnu'] } },
          
          // Compteurs principaux
          totalSeances: { $sum: 1 },
          
          seancesNormales: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $ne: ['$typeSeance', 'rattrapage'] },
                    { $ne: ['$actif', false] }
                  ]
                },
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
          
          seancesAnnulees: {
            $sum: {
              $cond: [
                { $eq: ['$actif', false] },
                1,
                0
              ]
            }
          },
          
          // Détails des cours enseignés (pour validation)
          coursEnseignes: { $addToSet: '$nomCours' },
          
          // Détails des rattrapages avec informations complètes
          detailsRattrapages: {
            $push: {
              $cond: [
                { $eq: ['$typeSeance', 'rattrapage'] },
                {
                  seanceId: '$_id',
                  cours: '$nomCours',
                  matiere: '$matiere',
                  salle: '$salle',
                  jour: '$jour',
                  heureDebut: '$heureDebut',
                  heureFin: '$heureFin',
                  dateSeance: '$dateSeance',
                  notes: '$notes',
                  marqueParNom: '$lastActionByName',
                  marqueParRole: '$lastActionByRole',
                  marqueParEmail: '$lastActionByEmail',
                  dateRattrapage: '$lastActionAt'
                },
                null
              ]
            }
          }
        }
      },
      
      // Nettoyer les détails et ajouter les calculs
      {
        $addFields: {
          detailsRattrapages: {
            $filter: {
              input: '$detailsRattrapages',
              cond: { $ne: ['$$this', null] }
            }
          },
          tauxPresence: {
            $cond: [
              { $eq: ['$totalSeances', 0] },
              0,
              { 
                $round: [
                  { 
                    $multiply: [
                      { $divide: ['$seancesNormales', '$totalSeances'] }, 
                      100
                    ]
                  }, 
                  1
                ]
              }
            ]
          },
          // Ajouter le pourcentage de rattrapages
          pourcentageRattrapages: {
            $cond: [
              { $eq: ['$totalSeances', 0] },
              0,
              { 
                $round: [
                  { 
                    $multiply: [
                      { $divide: ['$seancesRattrapage', '$totalSeances'] }, 
                      100
                    ]
                  }, 
                  1
                ]
              }
            ]
          }
        }
      },
      
      // Trier par nombre de rattrapages décroissant, puis par nom
      { 
        $sort: { 
          seancesRattrapage: -1, 
          seancesAnnulees: -1,
          nomProfesseur: 1 
        } 
      }
    ];
    
    console.log(`🔄 Exécution du pipeline d'agrégation avec ${fullPipeline.length} étapes...`);
    
    const stats = await Seance.aggregate(fullPipeline);
    
    console.log(`📊 Statistiques calculées: ${stats.length} professeurs`);
    
    // Log détaillé des premiers résultats
    if (stats.length > 0) {
      console.log('🔍 Premiers résultats:', stats.slice(0, 3).map(s => ({
        professeur: s.nomProfesseur,
        total: s.totalSeances,
        normales: s.seancesNormales,
        rattrapages: s.seancesRattrapage,
        annulees: s.seancesAnnulees || 0,
        cours: s.coursEnseignes
      })));
    }
    
    // Calculer les totaux globaux
    const totaux = stats.reduce((acc, s) => ({
      totalSeances: acc.totalSeances + s.totalSeances,
      totalNormales: acc.totalNormales + s.seancesNormales,
      totalRattrapages: acc.totalRattrapages + s.seancesRattrapage,
      totalAnnulees: acc.totalAnnulees + (s.seancesAnnulees || 0)
    }), { totalSeances: 0, totalNormales: 0, totalRattrapages: 0, totalAnnulees: 0 });
    
    console.log(`📈 Totaux calculés:`, totaux);
    
    res.json({ 
      ok: true, 
      statistiques: stats, 
      filiere: userInfo.filiere,
      userType: userType,
      userNom: userInfo.nom,
      totalProfesseurs: stats.length,
      totalRattrapages: totaux.totalRattrapages,
      totalSeances: totaux.totalSeances,
      totalSeancesNormales: totaux.totalNormales,
      totalSeancesAnnulees: totaux.totalAnnulees,
      tauxGlobalPresence: totaux.totalSeances > 0 ? 
        Math.round((totaux.totalNormales / totaux.totalSeances) * 100) : 0,
      tauxGlobalRattrapages: totaux.totalSeances > 0 ? 
        Math.round((totaux.totalRattrapages / totaux.totalSeances) * 100) : 0,
      message: stats.length === 0 ? 
        'Aucune statistique disponible' : 
        `${stats.length} professeur(s) avec séances programmées`,
      scope: userType === 'admin' || userType === 'finance_prof' ? 
        'Toutes les filières et professeurs' :
        userInfo.filiere === 'GENERAL' ? 
          'Toutes les filières (pédagogique général)' : 
          `Filière ${userInfo.filiere} uniquement`
    });
    
  } catch (error) {
    console.error('❌ Erreur stats rattrapages:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du calcul des statistiques',
      details: error.message 
    });
  }
});

// Route spécifique pour Admin et Finance_prof - Toutes les statistiques
app.get('/api/admin/rattrapages/statistiques', authAdmin, async (req, res) => {
  try {
    // Vérifier que l'utilisateur a les bonnes permissions
    if (req.userType !== 'admin' && req.userType !== 'finance_prof') {
      return res.status(403).json({ 
        error: 'Accès réservé aux administrateurs et responsables finance/professeur' 
      });
    }
    
    console.log(`👑 Admin/Finance_prof ${req.user.id} - Statistiques complètes`);
    
    const pipeline = [
      // Inclure toutes les séances actives
      {
        $match: {
          $or: [
            { actif: { $ne: false } },
            { actif: { $exists: false } }
          ]
        }
      },
      
      // Lookup professeur
      {
        $lookup: {
          from: 'professeurs',
          localField: 'professeur',
          foreignField: '_id',
          as: 'prof'
        }
      },
      { 
        $unwind: {
          path: '$prof',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Lookup cours
      {
        $lookup: {
          from: 'cours',
          localField: 'cours',
          foreignField: '_id',
          as: 'coursInfo'
        }
      },
      {
        $addFields: {
          nomCours: {
            $cond: [
              { $eq: [{ $type: '$coursInfo' }, 'array'] },
              {
                $cond: [
                  { $eq: [{ $size: '$coursInfo' }, 0] },
                  { $toString: '$cours' },
                  { $arrayElemAt: ['$coursInfo.nom', 0] }
                ]
              },
              { $toString: '$cours' }
            ]
          }
        }
      },
      
      // Grouper par professeur
      {
        $group: {
          _id: '$professeur',
          nomProfesseur: { $first: { $ifNull: ['$prof.nom', 'Professeur inconnu'] } },
          emailProfesseur: { $first: '$prof.email' },
          typeProfesseur: { $first: { $cond: ['$prof.estPermanent', 'Permanent', 'Entrepreneur'] } },
          
          totalSeances: { $sum: 1 },
          
          seancesNormales: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $ne: ['$typeSeance', 'rattrapage'] },
                    { $ne: ['$actif', false] }
                  ]
                },
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
          
          seancesAnnulees: {
            $sum: {
              $cond: [
                { $eq: ['$actif', false] },
                1,
                0
              ]
            }
          },
          
          coursEnseignes: { $addToSet: '$nomCours' },
          filieresConcernees: { $addToSet: '$coursInfo.filiere' },
          
          detailsRattrapages: {
            $push: {
              $cond: [
                { $eq: ['$typeSeance', 'rattrapage'] },
                {
                  seanceId: '$_id',
                  cours: '$nomCours',
                  matiere: '$matiere',
                  salle: '$salle',
                  jour: '$jour',
                  heureDebut: '$heureDebut',
                  heureFin: '$heureFin',
                  dateSeance: '$dateSeance',
                  marqueParNom: '$lastActionByName',
                  marqueParRole: '$lastActionByRole',
                  dateRattrapage: '$lastActionAt'
                },
                null
              ]
            }
          }
        }
      },
      
      // Nettoyer et calculer
      {
        $addFields: {
          detailsRattrapages: {
            $filter: {
              input: '$detailsRattrapages',
              cond: { $ne: ['$$this', null] }
            }
          },
          tauxPresence: {
            $cond: [
              { $eq: ['$totalSeances', 0] },
              0,
              { 
                $round: [
                  { 
                    $multiply: [
                      { $divide: ['$seancesNormales', '$totalSeances'] }, 
                      100
                    ]
                  }, 
                  1
                ]
              }
            ]
          },
          pourcentageRattrapages: {
            $cond: [
              { $eq: ['$totalSeances', 0] },
              0,
              { 
                $round: [
                  { 
                    $multiply: [
                      { $divide: ['$seancesRattrapage', '$totalSeances'] }, 
                      100
                    ]
                  }, 
                  1
                ]
              }
            ]
          }
        }
      },
      
      // Trier par nombre de rattrapages (les plus problématiques en premier)
      { 
        $sort: { 
          seancesRattrapage: -1,
          seancesAnnulees: -1,
          nomProfesseur: 1 
        } 
      }
    ];
    
    const stats = await Seance.aggregate(pipeline);
    
    // Calculer les totaux
    const totaux = stats.reduce((acc, s) => ({
      totalSeances: acc.totalSeances + s.totalSeances,
      totalNormales: acc.totalNormales + s.seancesNormales,
      totalRattrapages: acc.totalRattrapages + s.seancesRattrapage,
      totalAnnulees: acc.totalAnnulees + (s.seancesAnnulees || 0)
    }), { totalSeances: 0, totalNormales: 0, totalRattrapages: 0, totalAnnulees: 0 });
    
    // Statistiques par filière
    const statsParFiliere = await Seance.aggregate([
      {
        $match: {
          $or: [
            { actif: { $ne: false } },
            { actif: { $exists: false } }
          ]
        }
      },
      {
        $lookup: {
          from: 'cours',
          localField: 'cours',
          foreignField: '_id',
          as: 'coursInfo'
        }
      },
      {
        $unwind: {
          path: '$coursInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$coursInfo.filiere',
          totalSeances: { $sum: 1 },
          seancesRattrapage: {
            $sum: {
              $cond: [
                { $eq: ['$typeSeance', 'rattrapage'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { seancesRattrapage: -1 }
      }
    ]);
    
    console.log(`📊 Admin - ${stats.length} professeurs analysés, ${totaux.totalRattrapages} rattrapages`);
    
    res.json({
      ok: true,
      statistiques: stats,
      statsParFiliere: statsParFiliere,
      userType: req.userType,
      totalProfesseurs: stats.length,
      totaux: totaux,
      tauxGlobalPresence: totaux.totalSeances > 0 ? 
        Math.round((totaux.totalNormales / totaux.totalSeances) * 100) : 0,
      tauxGlobalRattrapages: totaux.totalSeances > 0 ? 
        Math.round((totaux.totalRattrapages / totaux.totalSeances) * 100) : 0,
      scope: 'Vue administrative complète - Toutes filières',
      professeursPlusRattrapages: stats.filter(s => s.seancesRattrapage > 0).length,
      professeursSansRattrapages: stats.filter(s => s.seancesRattrapage === 0).length
    });
    
  } catch (error) {
    console.error('❌ Erreur stats admin:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du calcul des statistiques administrateur',
      details: error.message 
    });
  }
});




// ===== ROUTE PUT - MODIFICATION D'ÉTUDIANT PAR COMMERCIAL =====
// ===== ROUTE PUT - MODIFICATION D'ÉTUDIANT PAR COMMERCIAL (avec logique de copie) =====

app.get('/api/seances/periodes-disponibles', authAdmin, async (req, res) => {
  try {
    // Récupérer toutes les dates distinctes des séances
    const dates = await Seance.distinct('dateSeance', { actif: true });
    
    const annees = [...new Set(dates.map(date => new Date(date).getFullYear()))].sort();
    const moisParAnnee = {};
    
    annees.forEach(annee => {
      const moisDeCetteAnnee = [...new Set(
        dates
          .filter(date => new Date(date).getFullYear() === annee)
          .map(date => new Date(date).getMonth() + 1)
      )].sort();
      
      moisParAnnee[annee] = moisDeCetteAnnee;
    });

    res.json({
      annees,
      moisParAnnee
    });
  } catch (error) {
    console.error('Erreur périodes disponibles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
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
app.post('/api/admin/paiement-managers', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/admin/paiement-managers', authAdminOrPaiementManager, async (req, res) => {
  try {
    const managers = await PaiementManager.find({}, { motDePasse: 0 });
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 3. Lire un gestionnaire spécifique (GET)
app.get('/api/admin/paiement-managers/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/admin/paiement-managers/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/admin/paiement-managers/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.patch('/api/admin/paiement-managers/:id/toggle-active', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/admin/profile', authAdminOrPaiementManager, async (req, res) => {
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



// 2. API pour récupérer les cycles validés par Finance (pour Admin)
// 2. API pour récupérer les cycles validés par Finance
app.get('/api/admin/cycles/valides-finance', authAdminOrPaiementManager, async (req, res) => {
  try {
    // SUPPRIMER CETTE VÉRIFICATION qui bloque paiement_manager
    // if (req.userType !== 'admin') {
    //   return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    // }

    const cycles = await CyclePaiement.find({
      statut: 'valide_finance',
      actif: true
    })
    .populate('professeur', 'nom email tarifHoraire')
    .populate('valideParFinance', 'nom email')
    .sort({ dateValidationFinance: -1 })
    .lean();

    res.json({
      cycles,
      total: cycles.length
    });

  } catch (error) {
    console.error('Erreur récupération cycles validés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 3. API pour qu'ADMIN paie un cycle
app.post('/api/admin/cycles/payer', authAdminOrPaiementManager, async (req, res) => {
  try {
    // SUPPRIMER CETTE VÉRIFICATION
    // if (req.userType !== 'admin') {
    //   return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    // }

    const { cycleId, methodePaiement, referencePaiement, notes } = req.body;

    if (!cycleId || !methodePaiement) {
      return res.status(400).json({ error: 'ID du cycle et méthode de paiement requis' });
    }

    const cycle = await CyclePaiement.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle non trouvé' });
    }

    if (cycle.statut !== 'valide_finance') {
      return res.status(400).json({ error: 'Ce cycle doit être validé par Finance avant le paiement' });
    }

    // Utiliser req.userId au lieu de req.adminId pour supporter les deux rôles
    const userId = req.adminId || req.paiementManagerId || req.userId;
    
    cycle.payerParAdmin(userId, methodePaiement, referencePaiement || '', notes || '');
    await cycle.save();

    const Seance = mongoose.model('Seance');
    const seanceIds = cycle.seancesIncluses.map(s => s.seanceId);
    
    await Seance.updateMany(
      { _id: { $in: seanceIds } },
      { 
        payee: true,
        datePaiement: new Date(),
        cyclePaiementId: cycle._id
      }
    );

    const nouveauCycle = await CyclePaiement.creerNouveauCycle(cycle.professeur, userId);

    await cycle.populate('professeur', 'nom email');
    await cycle.populate('payeParAdmin', 'nom email');

    res.json({
      message: 'Paiement effectué avec succès',
      cyclePayé: cycle,
      nouveauCycle: {
        id: nouveauCycle._id,
        numero: nouveauCycle.numeroCycle,
        dateDebut: nouveauCycle.dateDebut
      }
    });

  } catch (error) {
    console.error('Erreur paiement Admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// 4. API pour récupérer les détails d'un cycle spécifique
app.get('/api/cycles/:cycleId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { cycleId } = req.params;

    const cycle = await CyclePaiement.findById(cycleId)
      .populate('professeur', 'nom email tarifHoraire')
      .populate('valideParFinance', 'nom email')
      .populate('payeParAdmin', 'nom email')
      .lean();

    if (!cycle) {
      return res.status(404).json({ error: 'Cycle non trouvé' });
    }

    res.json({ cycle });

  } catch (error) {
    console.error('Erreur récupération cycle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. API pour récupérer le cycle en cours d'un professeur
app.get('/api/cycles/professeur/:professeurId/en-cours', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;

    let cycle = await CyclePaiement.getCycleEnCours(professeurId);
    
    if (!cycle) {
      // Créer un nouveau cycle si aucun n'existe
      cycle = await CyclePaiement.creerNouveauCycle(professeurId, req.adminId);
    }

    // Calculer les montants actuels
    cycle = await CyclePaiement.calculerCycle(professeurId, cycle._id);

    await cycle.populate('professeur', 'nom email tarifHoraire');

    res.json({ cycle });

  } catch (error) {
    console.error('Erreur récupération cycle en cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 6. API pour l'historique des cycles d'un professeur
app.get('/api/cycles/professeur/:professeurId/historique', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;
    const { limit = 10 } = req.query;

    const cycles = await CyclePaiement.find({
      professeur: professeurId,
      actif: true
    })
    .populate('valideParFinance', 'nom email')
    .populate('payeParAdmin', 'nom email')
    .sort({ numeroCycle: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json({
      cycles,
      total: cycles.length
    });

  } catch (error) {
    console.error('Erreur historique cycles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 7. API pour annuler un cycle (avant paiement)
app.post('/api/cycles/:cycleId/annuler', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { cycleId } = req.params;
    const { motif } = req.body;

    const cycle = await CyclePaiement.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle non trouvé' });
    }

    if (cycle.statut === 'paye_admin') {
      return res.status(400).json({ error: 'Impossible d\'annuler un cycle déjà payé' });
    }

    // Remettre le cycle en cours
    cycle.statut = 'en_cours';
    cycle.valideParFinance = null;
    cycle.dateValidationFinance = null;
    cycle.notesFinance += (cycle.notesFinance ? '\n' : '') + `Annulé le ${new Date().toLocaleDateString('fr-FR')}: ${motif || 'Aucun motif'}`;
    
    await cycle.save();

    res.json({
      message: 'Cycle annulé avec succès',
      cycle
    });

  } catch (error) {
    console.error('Erreur annulation cycle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 8. API pour les statistiques des cycles
app.get('/api/cycles/statistiques', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { mois, annee } = req.query;

    let matchFilter = { actif: true };
    if (mois && annee) {
      const dateDebut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
      const dateFin = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);
      matchFilter.createdAt = { $gte: dateDebut, $lte: dateFin };
    }

    const stats = await CyclePaiement.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          totalMontant: { $sum: '$montantNet' }
        }
      }
    ]);

    const statistiques = {
      en_cours: { count: 0, montant: 0 },
      valide_finance: { count: 0, montant: 0 },
      paye_admin: { count: 0, montant: 0 },
      archive: { count: 0, montant: 0 }
    };

    stats.forEach(stat => {
      if (statistiques[stat._id]) {
        statistiques[stat._id] = {
          count: stat.count,
          montant: Math.round(stat.totalMontant * 100) / 100
        };
      }
    });

    res.json({ statistiques });

  } catch (error) {
    console.error('Erreur statistiques cycles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 9. API pour récupérer tous les cycles à différents statuts (dashboard)
app.get('/api/cycles/dashboard', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { statut } = req.query;

    let matchFilter = { actif: true };
    if (statut) {
      matchFilter.statut = statut;
    }

    const cycles = await CyclePaiement.find(matchFilter)
      .populate('professeur', 'nom email')
      .populate('valideParFinance', 'nom email')
      .populate('payeParAdmin', 'nom email')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    // Grouper par statut pour le dashboard
    const cyclesParStatut = {
      en_cours: cycles.filter(c => c.statut === 'en_cours'),
      valide_finance: cycles.filter(c => c.statut === 'valide_finance'),
      paye_admin: cycles.filter(c => c.statut === 'paye_admin'),
      archive: cycles.filter(c => c.statut === 'archive')
    };

    res.json({
      cyclesParStatut,
      totalCycles: cycles.length
    });

  } catch (error) {
    console.error('Erreur dashboard cycles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


app.put('/api/admin/profile', authAdminOrPaiementManager, async (req, res) => {
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
app.post('/api/pedagogiques', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/pedagogiques', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/pedagogiques/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/pedagogiques/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/pedagogiques/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.patch('/api/pedagogiques/:id/toggle-actif', authAdminOrPaiementManager, async (req, res) => {
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
// ===== ROUTE GET - RÉCUPÉRER TOUS LES PROFESSEURS =====
app.get('/api/pedagogique/mes-professeurs', 
  authPedagogique,
  async (req, res) => {
    try {
      // Récupérer TOUS les professeurs sans filtre
      const professeurs = await Professeur.find({})
        .select('-motDePasse')
        .sort({ createdAt: -1 });

      res.json(professeurs);
    } catch (err) {
      console.error('Erreur récupération professeurs:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
);

// ===== ROUTE POST - CRÉER PROFESSEUR =====
app.post('/api/professeurs',  
  authAdminOrPedagogique,
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

      console.log('Données reçues:', { nom, email, genre, estPermanent, tarifHoraire, coursEnseignes });
      console.log('Utilisateur créateur:', req.user);

      // Validations
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

      const existe = await Professeur.findOne({ email });
      if (existe) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      const actifBool = actif === 'true' || actif === true;
      const estPermanentBool = estPermanent === 'true' || estPermanent === true;

      if (!estPermanentBool) {
        if (!tarifHoraire || parseFloat(tarifHoraire) <= 0) {
          return res.status(400).json({ 
            message: 'Le tarif horaire est obligatoire pour les entrepreneurs et doit être supérieur à 0' 
          });
        }
      }

      // Traitement des cours enseignés
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

      // Traitement des fichiers
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

      // Création du professeur avec traçabilité
      const professeurData = {
        nom: nom.trim(),
        email: email.toLowerCase().trim(),
        motDePasse: motDePasse,
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

      // Traçabilité - qui a créé ce professeur
      if (req.user.role === 'pedagogique') {
        professeurData.creeParPedagogique = req.user.id;
        professeurData.typeDeCree = 'pedagogique';
      } else if (req.user.role === 'admin') {
        professeurData.creeParAdmin = req.user.id;
        professeurData.typeDeCree = 'admin';
      }

      if (!estPermanentBool && tarifHoraire) {
        professeurData.tarifHoraire = parseFloat(tarifHoraire);
      }

      const professeur = new Professeur(professeurData);
      await professeur.save();

      // Mise à jour des cours
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

// ===== ROUTE PUT - MODIFIER PROFESSEUR (SANS VÉRIFICATION DE PROPRIÉTÉ) =====
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
        motDePasse,
        actif,
        estPermanent,
        tarifHoraire,
        coursEnseignes,
        notes,
      } = req.body;

      // Récupérer le professeur
      const prof = await Professeur.findById(professeurId);
      if (!prof) {
        return res.status(404).json({ message: 'Professeur introuvable' });
      }

      // PLUS DE VÉRIFICATION DE PROPRIÉTÉ
      // Tous les pédagogiques et admins peuvent modifier tous les professeurs

      // Vérification unicité email
      if (email && email.toLowerCase().trim() !== (prof.email || '').toLowerCase()) {
        const emailExiste = await Professeur.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: professeurId },
        });
        if (emailExiste) {
          return res.status(400).json({ message: 'Email déjà utilisé' });
        }
      }

      // Fonctions utilitaires
      const toBool = (v) => v === true || v === 'true';
      const toFloat = (v) => (v === undefined || v === '' ? undefined : parseFloat(v));
      const toDate = (v) => (v ? new Date(v) : undefined);

      const estPermanentBool = estPermanent !== undefined ? toBool(estPermanent) : prof.estPermanent;
      const actifBool = actif !== undefined ? toBool(actif) : prof.actif;
      const tarifNum = toFloat(tarifHoraire);

      // Parse coursEnseignes
      let coursEnseignesArray = prof.coursEnseignes || [];
      if (coursEnseignes !== undefined) {
        try {
          const parsed = typeof coursEnseignes === 'string' ? JSON.parse(coursEnseignes) : coursEnseignes;
          coursEnseignesArray = Array.isArray(parsed) ? parsed : [];
          coursEnseignesArray = coursEnseignesArray.filter(
            (c) => c && c.nomCours && c.nomCours.trim() !== '' && c.matiere && c.matiere.trim() !== ''
          );
        } catch (e) {
          console.error('Erreur parsing coursEnseignes:', e.message);
          coursEnseignesArray = prof.coursEnseignes || [];
        }
      }

      // Gestion des fichiers
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

      // Mise à jour des champs
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

      // Gestion du tarif horaire
      if (prof.estPermanent) {
        prof.tarifHoraire = undefined;
      } else {
        if (tarifNum !== undefined) {
          if (isNaN(tarifNum) || tarifNum <= 0) {
            return res.status(400).json({
              message: 'Le tarif horaire doit être supérieur à 0 pour les entrepreneurs',
            });
          }
          prof.tarifHoraire = tarifNum;
        } else if (!prof.tarifHoraire || prof.tarifHoraire <= 0) {
          return res.status(400).json({
            message: 'Le tarif horaire est obligatoire pour les entrepreneurs et doit être supérieur à 0',
          });
        }
      }

      // Mot de passe
      if (motDePasse && motDePasse.trim() !== '') {
        prof.motDePasse = motDePasse.trim();
      }

      // Synchronisation des cours
      const anciensCours = [...new Set((prof.coursEnseignes || []).map((c) => c.nomCours))];
      const nouveauxCours = [...new Set(coursEnseignesArray.map((c) => c.nomCours))];
      const coursSupprimes = anciensCours.filter((c) => !nouveauxCours.includes(c));
      const coursAjoutes = nouveauxCours.filter((c) => !anciensCours.includes(c));
      prof.coursEnseignes = coursEnseignesArray;

      await prof.save();

      // Mise à jour collection Cours
      for (const nomCours of coursSupprimes) {
        await Cours.updateOne({ nom: nomCours }, { $pull: { professeur: prof.nom } });
      }
      for (const nomCours of coursAjoutes) {
        await Cours.updateOne({ nom: nomCours }, { $addToSet: { professeur: prof.nom } });
      }

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

// ===== ROUTE DELETE - SUPPRIMER PROFESSEUR (SANS VÉRIFICATION DE PROPRIÉTÉ) =====
app.delete('/api/professeurs/:id', 
  authAdminOrPedagogique, 
  async (req, res) => {
    try {
      const professeurId = req.params.id;
      
      const professeur = await Professeur.findById(professeurId);
      if (!professeur) {
        return res.status(404).json({ message: "Professeur introuvable" });
      }

      // PLUS DE VÉRIFICATION DE PROPRIÉTÉ
      // Tous les pédagogiques et admins peuvent supprimer tous les professeurs

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

// ===== ROUTE PATCH - TOGGLE ACTIF =====
app.patch('/api/professeurs/:id/actif',
  authAdminOrPedagogique,
  async (req, res) => {
    try {
      const professeur = await Professeur.findById(req.params.id);
      
      if (!professeur) {
        return res.status(404).json({ message: 'Professeur introuvable' });
      }

      // PLUS DE VÉRIFICATION DE PROPRIÉTÉ
      
      professeur.actif = !professeur.actif;
      await professeur.save();
      
      const profObj = professeur.toObject();
      delete profObj.motDePasse;
      
      res.json(profObj);
    } catch (err) {
      console.error('Erreur toggle actif:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
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
app.get('/api/etudiants-evaluation', authAdminOrPaiementManager, async (req, res) => {
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
app.post('/api/evaluations/:etudiantId', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/evaluation/:evaluationId', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/evaluation/:evaluationId', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/evaluation/:evaluationId/finaliser', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/evaluations', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/evaluation/:evaluationId', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/professeurs/stats/dashboard', authAdminOrPaiementManager, async (req, res) => {
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
app.post('/api/admin/financeprofs', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/admin/financeprofs', authAdminOrPaiementManager, async (req, res) => {
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
app.get('/api/admin/financeprofs/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.put('/api/admin/financeprofs/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.delete('/api/admin/financeprofs/:id', authAdminOrPaiementManager, async (req, res) => {
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
app.patch('/api/admin/financeprofs/:id/toggle-status', authAdminOrPaiementManager, async (req, res) => {
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

// API pour invalider un paiement - À ajouter dans votre fichier routes

// 8. API pour invalider un paiement validé
app.post('/api/finance/paiements/invalider', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId, mois, annee, motifInvalidation } = req.body;

    if (!professeurId || !mois || !annee) {
      return res.status(400).json({ error: 'Professeur, mois et année requis' });
    }

    // Trouver le paiement existant
    const paiement = await PaiementProfesseur.findOne({
      professeur: professeurId,
      mois: parseInt(mois),
      annee: parseInt(annee)
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (paiement.statut === 'paye') {
      return res.status(400).json({ 
        error: 'Impossible d\'invalider un paiement déjà effectué. Veuillez d\'abord annuler le paiement.' 
      });
    }

    if (paiement.statut === 'en_attente') {
      return res.status(400).json({ error: 'Ce paiement n\'est pas encore validé' });
    }

    // Invalider le paiement
    paiement.statut = 'en_attente';
    paiement.valideePar = null;
    paiement.dateValidation = null;
    
    // Ajouter une note d'invalidation
    const noteInvalidation = `Invalidé le ${new Date().toLocaleDateString('fr-FR')} par ${req.userInfo?.displayName || 'Admin'}`;
    if (motifInvalidation) {
      paiement.notes += (paiement.notes ? '\n' : '') + `${noteInvalidation}: ${motifInvalidation}`;
    } else {
      paiement.notes += (paiement.notes ? '\n' : '') + noteInvalidation;
    }
    
    await paiement.save();
    await paiement.populate('professeur');

    res.json({
      message: 'Paiement invalidé avec succès',
      paiement
    });

  } catch (error) {
    console.error('Erreur invalidation paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 9. API pour récupérer le statut des paiements pour le rapport mensuel
app.get('/api/finance/paiements/statuts-mensuels', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { mois, annee } = req.query;

    if (!mois || !annee) {
      return res.status(400).json({ error: 'Mois et année requis' });
    }

    // Récupérer tous les paiements pour la période
    const paiements = await PaiementProfesseur.find({
      mois: parseInt(mois),
      annee: parseInt(annee),
      actif: true
    })
    .populate('professeur', 'nom email')
    .select('professeur statut montantNet dateValidation datePaiement')
    .lean();

    // Créer un map des statuts par professeur
    const statutsMap = new Map();
    paiements.forEach(paiement => {
      if (paiement.professeur) {
        statutsMap.set(paiement.professeur._id.toString(), {
          statut: paiement.statut,
          montantNet: paiement.montantNet,
          dateValidation: paiement.dateValidation,
          datePaiement: paiement.datePaiement,
          paiementValide: paiement.statut === 'valide' || paiement.statut === 'paye'
        });
      }
    });

    res.json({ statutsMap: Object.fromEntries(statutsMap) });

  } catch (error) {
    console.error('Erreur statuts mensuels:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 10. API pour créer automatiquement les paiements du mois suivant
app.post('/api/finance/paiements/generer-mois-suivant', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { moisActuel, anneeActuelle } = req.body;

    if (!moisActuel || !anneeActuelle) {
      return res.status(400).json({ error: 'Mois et année actuels requis' });
    }

    // Calculer le mois suivant
    let moisSuivant = parseInt(moisActuel) + 1;
    let anneeSuivante = parseInt(anneeActuelle);
    
    if (moisSuivant > 12) {
      moisSuivant = 1;
      anneeSuivante += 1;
    }

    // Vérifier si des paiements existent déjà pour le mois suivant
    const paiementsExistants = await PaiementProfesseur.find({
      mois: moisSuivant,
      annee: anneeSuivante,
      actif: true
    });

    if (paiementsExistants.length > 0) {
      return res.json({
        message: `${paiementsExistants.length} paiements existent déjà pour ${moisSuivant}/${anneeSuivante}`,
        paiementsExistants: paiementsExistants.length
      });
    }

    // Récupérer les entrepreneurs actifs
    const entrepreneursActifs = await Professeur.find({
      estPermanent: false,
      actif: true
    }).select('_id nom email tarifHoraire');

    if (entrepreneursActifs.length === 0) {
      return res.json({
        message: 'Aucun entrepreneur actif trouvé',
        nouveauxPaiements: 0
      });
    }

    // Calculer les dates pour le mois suivant
    const dateDebut = new Date(anneeSuivante, moisSuivant - 1, 1);
    const dateFin = new Date(anneeSuivante, moisSuivant, 0, 23, 59, 59);

    let nouveauxPaiements = 0;
    const resultats = [];

    for (const entrepreneur of entrepreneursActifs) {
      // Récupérer les séances pour le mois suivant
      const seances = await Seance.find({
        professeur: entrepreneur._id,
        dateSeance: { $gte: dateDebut, $lte: dateFin },
        actif: true,
        typeSeance: { $ne: 'rattrapage' }
      }).populate('coursId', 'nom').lean();

      if (seances.length > 0) {
        // Calculer les montants
        let montantBrut = 0;
        const seancesIncluses = [];

        for (const seance of seances) {
          const [heureD, minuteD] = seance.heureDebut.split(':').map(Number);
          const [heureF, minuteF] = seance.heureFin.split(':').map(Number);
          const dureeHeures = ((heureF * 60 + minuteF) - (heureD * 60 + minuteD)) / 60;
          
          const montantSeance = dureeHeures * (entrepreneur.tarifHoraire || 0);
          montantBrut += montantSeance;

          // Résoudre le nom du cours
          let nomCours = 'Cours non spécifié';
          if (seance.coursId && seance.coursId.nom) {
            nomCours = seance.coursId.nom;
          } else if (seance.cours) {
            nomCours = seance.cours;
          }

          seancesIncluses.push({
            seanceId: seance._id,
            cours: nomCours,
            date: seance.dateSeance,
            heures: Math.round(dureeHeures * 100) / 100,
            montant: Math.round(montantSeance * 100) / 100
          });
        }

        // Vérifier s'il y a des pénalités permanentes à appliquer
        let ajustements = 0;
        const penalitesAppliquees = [];
        
        const penalitePermanente = await PenaliteProfesseur.findOne({
          professeur: entrepreneur._id,
          appliquePour: 'permanent',
          actif: true
        });

        if (penalitePermanente) {
          if (penalitePermanente.type === 'pourcentage') {
            ajustements = (montantBrut * penalitePermanente.valeur) / 100;
          } else {
            ajustements = penalitePermanente.valeur;
          }

          penalitesAppliquees.push({
            penaliteId: penalitePermanente._id,
            motif: `${penalitePermanente.motif} (Pénalité permanente)`,
            montant: ajustements
          });
        }

        // Créer le nouveau paiement
        const nouveauPaiement = new PaiementProfesseur({
          professeur: entrepreneur._id,
          mois: moisSuivant,
          annee: anneeSuivante,
          montantBrut: Math.round(montantBrut * 100) / 100,
          ajustements: Math.round(ajustements * 100) / 100,
          montantNet: Math.round((montantBrut - ajustements) * 100) / 100,
          seancesIncluses,
          penalitesAppliquees,
          creeParAdmin: req.adminId,
          notes: 'Généré automatiquement pour le nouveau cycle de paiement'
        });

        await nouveauPaiement.save();
        nouveauxPaiements++;

        resultats.push({
          professeur: entrepreneur.nom,
          montantNet: nouveauPaiement.montantNet,
          nombreSeances: seances.length
        });
      }
    }

    res.json({
      message: `${nouveauxPaiements} nouveaux paiements créés pour ${moisSuivant}/${anneeSuivante}`,
      nouveauxPaiements,
      periode: {
        mois: moisSuivant,
        annee: anneeSuivante
      },
      resultats
    });

  } catch (error) {
    console.error('Erreur génération mois suivant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.post('/api/finance/paiements/creer-ou-recuperer', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId, mois, annee } = req.body;

    if (!professeurId || !mois || !annee) {
      return res.status(400).json({ error: 'Professeur, mois et année requis' });
    }

    // Vérifier que le professeur existe
    const professeur = await Professeur.findById(professeurId);
    if (!professeur) {
      return res.status(404).json({ error: 'Professeur non trouvé' });
    }

    // Pour l'instant, on retourne juste une confirmation
    // Plus tard, vous pourrez implémenter la logique complète du modèle PaiementProfesseur
    res.json({
      message: 'Données de paiement préparées',
      professeur: professeur,
      periode: { mois: parseInt(mois), annee: parseInt(annee) }
    });

  } catch (error) {
    console.error('Erreur création paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Dans votre fichier de routes backend, ajoutez cette API :
app.get('/api/finance/penalites/professeur/:professeurId', authAdminOrPaiementManager, async (req, res) => {
  try {
    const { professeurId } = req.params;
    const { mois, annee } = req.query;

    if (!mois || !annee) {
      return res.status(400).json({ error: 'Mois et année requis' });
    }

    const penalite = await PenaliteProfesseur.findOne({
      professeur: professeurId,
      mois: parseInt(mois),
      annee: parseInt(annee),
      actif: true
    }).populate('appliquePar', 'nom email');

    if (penalite) {
      res.json({ penalite });
    } else {
      res.json({ penalite: null });
    }

  } catch (error) {
    console.error('Erreur récupération pénalité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
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
app.get('/api/etudiant/presences', authEtudiant, async (req, res) => {
  try {
    const presences = await Presence.find({
      etudiant: req.etudiantId,
      present: true,
      retard: false  // Exclure les retards
    })
    .populate('etudiant', 'nomComplet prenom nomDeFamille')
    .sort({ dateSession: -1 });

    res.json(presences);
  } catch (err) {
    console.error('Erreur lors de la récupération des présences:', err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/etudiant/absences', authEtudiant, async (req, res) => {
  try {
    const absences = await Presence.find({
      etudiant: req.etudiantId,
      absent: true
    })
    .populate('etudiant', 'nomComplet prenom nomDeFamille')
    .sort({ dateSession: -1 });

    res.json(absences);
  } catch (err) {
    console.error('Erreur lors de la récupération des absences:', err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/etudiant/retards', authEtudiant, async (req, res) => {
  try {
    // Récupérer les présences où l'étudiant est en retard
    const retards = await Presence.find({
      etudiant: req.etudiantId,
      retard: true
    })
    .populate('etudiant', 'nomComplet prenom nomDeFamille')
    .sort({ dateSession: -1 }); // Tri par date décroissante

    res.json(retards);
  } catch (err) {
    console.error('Erreur lors de la récupération des retards:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/seances/actuelle', authProfesseur, async (req, res) => {
  try {
    console.log('Recherche de la prochaine séance pour professeur:', req.professeurId);
    
    const maintenant = new Date();
    const dateAujourdhui = new Date();
    dateAujourdhui.setHours(0, 0, 0, 0);
    
    // Récupérer avec populate complet du professeur
    const seancesAujourdhui = await Seance.find({
      professeur: req.professeurId,
      dateSeance: {
        $gte: dateAujourdhui,
        $lt: new Date(dateAujourdhui.getTime() + 24 * 60 * 60 * 1000)
      },
      actif: true
    })
    .populate('professeur', 'nom prenom matiere coursEnseignes')
    .populate('coursId', 'nom')
    .sort({ heureDebut: 1 })
    .lean();

    console.log(`Séances trouvées aujourd'hui: ${seancesAujourdhui.length}`);
    
    if (seancesAujourdhui.length === 0) {
      return res.status(404).json({
        error: 'Aucune séance programmée aujourd\'hui'
      });
    }

    // Chercher la première séance SANS présences
    let prochainerSeance = null;
    
    for (const seance of seancesAujourdhui) {
      const presencesCount = await Presence.countDocuments({
        seanceId: seance._id
      });
      
      console.log(`Séance ${seance.cours} (${seance.heureDebut}-${seance.heureFin}): ${presencesCount} présences`);
      
      // Si cette séance n'a pas de présences, c'est celle qu'on veut
      if (presencesCount === 0) {
        prochainerSeance = seance;
        console.log('✅ Séance trouvée sans présences:', seance.heureDebut + '-' + seance.heureFin);
        break;
      }
    }
    
    // ✅ CORRECTION: Si aucune séance sans présences, retourner 404
    if (!prochainerSeance) {
      console.log('❌ Toutes les séances du jour ont déjà des présences enregistrées');
      return res.status(404).json({
        error: 'Toutes les séances du jour sont terminées',
        message: 'Aucune séance en attente de présences pour aujourd\'hui'
      });
    }
    
    // Déterminer le nom du cours correctement
    let nomCours = 'Cours non spécifié';
    
    if (prochainerSeance.coursId && prochainerSeance.coursId.nom) {
      nomCours = prochainerSeance.coursId.nom;
      console.log('✅ Nom du cours trouvé via coursId:', nomCours);
    } else if (prochainerSeance.cours && !prochainerSeance.cours.match(/^[0-9a-fA-F]{24}$/)) {
      nomCours = prochainerSeance.cours;
      console.log('✅ Nom du cours trouvé directement:', nomCours);
    } else if (prochainerSeance.cours) {
      try {
        const Cours = mongoose.model('Cours');
        const coursDoc = await Cours.findById(prochainerSeance.cours);
        if (coursDoc) {
          nomCours = coursDoc.nom;
          console.log('✅ Nom du cours trouvé par recherche ID:', nomCours);
        }
      } catch (err) {
        console.warn('Erreur recherche cours par ID:', err.message);
      }
    }
    
    // Déterminer la matière
    let matiereNom = 'Matière non spécifiée';
    
    console.log('=== DÉBOGAGE MATIÈRE ===');
    console.log('Séance matiere:', prochainerSeance.matiere);
    console.log('Professeur:', prochainerSeance.professeur);
    console.log('Nom cours déterminé:', nomCours);
    
    if (prochainerSeance.matiere && prochainerSeance.matiere.trim() !== '') {
      matiereNom = prochainerSeance.matiere;
      console.log('✅ Matière trouvée dans séance:', matiereNom);
    } else if (prochainerSeance.professeur && prochainerSeance.professeur.coursEnseignes) {
      const coursProfesseur = prochainerSeance.professeur.coursEnseignes.find(
        c => c.nomCours === nomCours
      );
      if (coursProfesseur && coursProfesseur.matiere) {
        matiereNom = coursProfesseur.matiere;
        console.log('✅ Matière trouvée via coursEnseignes:', matiereNom);
      }
    } else if (prochainerSeance.professeur && prochainerSeance.professeur.matiere) {
      matiereNom = prochainerSeance.professeur.matiere;
      console.log('✅ Matière trouvée via professeur.matiere:', matiereNom);
    } else if (nomCours) {
      matiereNom = nomCours;
      console.log('⚠️ Utilisation du nom du cours comme matière:', matiereNom);
    }
    
    console.log('Matière finale déterminée:', matiereNom);
    
    const seanceComplete = {
      _id: prochainerSeance._id,
      cours: nomCours,
      dateSeance: prochainerSeance.dateSeance,
      heureDebut: prochainerSeance.heureDebut,
      heureFin: prochainerSeance.heureFin,
      matiere: matiereNom,
      professeur: prochainerSeance.professeur,
      nomProfesseur: prochainerSeance.professeur ? 
        `${prochainerSeance.professeur.prenom || ''} ${prochainerSeance.professeur.nom || ''}`.trim() :
        'Professeur non spécifié',
      salle: prochainerSeance.salle || 'Salle non spécifiée',
      type: 'Séance programmée',
      periode: prochainerSeance.heureDebut ? 
        (parseInt(prochainerSeance.heureDebut.split(':')[0]) < 12 ? 'Matin' : 'Soir') : 
        'Non définie'
    };
    
    console.log('=== SÉANCE RETOURNÉE ===');
    console.log('Cours:', seanceComplete.cours);
    console.log('Matière:', seanceComplete.matiere);
    console.log('Heure:', seanceComplete.heureDebut + '-' + seanceComplete.heureFin);
    console.log('========================');
    
    res.json(seanceComplete);
    
  } catch (error) {
    console.error('Erreur lors de la récupération de la séance actuelle:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
app.post('/api/presences', authProfesseur, async (req, res) => {
  try {
    const { 
      etudiant, cours, seanceId, dateSession, present, absent, retard,
      retardMinutes, remarque, heure, periode, matiere, nomProfesseur
    } = req.body;

    console.log('=== DÉBOGAGE CRÉATION PRÉSENCE ===');
    console.log('matiere reçue:', matiere);
    console.log('seanceId:', seanceId);
    console.log('cours:', cours);

    // Validations de base
    if (!etudiant || !cours || !dateSession) {
      return res.status(400).json({ 
        message: 'Champs requis manquants' 
      });
    }

    // Récupérer professeur avec ses cours enseignés
    const prof = await Professeur.findById(req.professeurId).lean();
    if (!prof) {
      return res.status(404).json({ 
        message: 'Professeur non trouvé' 
      });
    }

    // Vérification des permissions (ancienne et nouvelle méthode)
    const aAcces = prof.cours.includes(cours) || 
                   (prof.coursEnseignes && prof.coursEnseignes.some(c => c.nomCours === cours));
    
    if (!aAcces) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez pas marquer la présence pour ce cours.' 
      });
    }

    // Déterminer les statuts
    let presentStatus = present || false;
    let absentStatus = absent || false;
    let retardStatus = retard || false;
    let retardMinutesValue = retardStatus ? (parseInt(retardMinutes) || 0) : 0;

    // ✅ CORRECTION: Déterminer la matière avec priorité aux données reçues
    let matiereFinale = 'Matière non spécifiée';
    
    // Priorité 1: Matière explicitement fournie dans la requête
    if (matiere && matiere.trim() !== '' && matiere !== 'Séance manuelle') {
      matiereFinale = matiere;
      console.log('✅ Matière utilisée depuis requête:', matiereFinale);
    }
    // Priorité 2: Si on a un seanceId, récupérer la matière de la séance
    else if (seanceId) {
      try {
        const seanceDoc = await Seance.findById(seanceId).lean();
        if (seanceDoc && seanceDoc.matiere && seanceDoc.matiere.trim() !== '') {
          matiereFinale = seanceDoc.matiere;
          console.log('✅ Matière trouvée dans la séance:', matiereFinale);
        } else {
          // Fallback sur le professeur
          const coursEnseigneProfesseur = prof.coursEnseignes && 
            prof.coursEnseignes.find(c => c.nomCours === cours);
          
          if (coursEnseigneProfesseur && coursEnseigneProfesseur.matiere) {
            matiereFinale = coursEnseigneProfesseur.matiere;
            console.log('✅ Matière trouvée via prof.coursEnseignes:', matiereFinale);
          } else if (prof.matiere) {
            matiereFinale = prof.matiere;
            console.log('✅ Matière trouvée via prof.matiere:', matiereFinale);
          } else {
            matiereFinale = cours; // Utiliser le nom du cours
            console.log('⚠️ Fallback sur nom du cours:', matiereFinale);
          }
        }
      } catch (seanceError) {
        console.warn('Erreur récupération séance:', seanceError.message);
        matiereFinale = prof.matiere || cours;
      }
    }
    // Priorité 3: Utiliser la matière du professeur
    else {
      const coursEnseigneProfesseur = prof.coursEnseignes && 
        prof.coursEnseignes.find(c => c.nomCours === cours);
      
      if (coursEnseigneProfesseur && coursEnseigneProfesseur.matiere) {
        matiereFinale = coursEnseigneProfesseur.matiere;
        console.log('✅ Matière prof coursEnseignes:', matiereFinale);
      } else if (prof.matiere) {
        matiereFinale = prof.matiere;
        console.log('✅ Matière prof générale:', matiereFinale);
      } else {
        matiereFinale = cours;
        console.log('⚠️ Dernier fallback sur cours:', matiereFinale);
      }
    }
    
    console.log('Matière finale utilisée:', matiereFinale);

    // Vérifier si présence existe déjà
    const existingPresence = await Presence.findOne({
      etudiant, cours, dateSession: new Date(dateSession)
    });

    if (existingPresence) {
      // Mise à jour
      existingPresence.present = presentStatus;
      existingPresence.absent = absentStatus;
      existingPresence.retard = retardStatus;
      existingPresence.retardMinutes = retardMinutesValue;
      existingPresence.remarque = remarque || '';
      existingPresence.matiere = matiereFinale;
      
      await existingPresence.save();
      
      console.log('✅ Présence mise à jour avec matière:', matiereFinale);
      
      return res.status(200).json({
        message: 'Présence mise à jour',
        presence: existingPresence
      });
    }

    // Création nouvelle présence
    const presence = new Presence({
      etudiant, 
      cours, 
      seanceId: seanceId || null,
      dateSession: new Date(dateSession),
      present: presentStatus, 
      absent: absentStatus, 
      retard: retardStatus,
      retardMinutes: retardMinutesValue,
      remarque: remarque || '', 
      heure: heure || '', 
      periode: periode || 'matin',
      matiere: matiereFinale, // ✅ Matière correctement déterminée
      nomProfesseur: nomProfesseur || prof.nom,
      creePar: req.professeurId
    });

    await presence.save();
    
    console.log('✅ Nouvelle présence créée avec matière:', matiereFinale);
    console.log('==================================');
    
    res.status(201).json({
      message: 'Présence enregistrée avec succès',
      presence
    });

  } catch (err) {
    console.error('Erreur création présence:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
app.get('/api/seances/:seanceId/etudiants', authProfesseur, async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.seanceId);
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }
    
    // Récupérer les étudiants qui ont ce cours
    const etudiants = await Etudiant.find({ 
      cours: { $in: [seance.cours] },
      actif: { $ne: false }
    }).select('nomComplet email cours');
    
    res.json(etudiants);
  } catch (err) {
    console.error('❌ Erreur récupération étudiants:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/professeur/profil', authProfesseur, async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.professeurId).select('-motDePasse');
    if (!professeur) return res.status(404).json({ message: 'Professeur introuvable' });
    res.json(professeur);
  } catch (err) {
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