const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const PaiementManager = require('../models/paiementManagerModel');
const Pedagogique = require('../models/Pedagogique');
const Administratif = require('../models/Administratif'); // ✅ Ajout du modèle Administratif

const authAdminOrPaiementManagerOrPedagogique = async (req, res, next) => {
  try {
    // 1. Vérifier la présence du token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, 'jwt_secret_key');
    console.log('Token décodé:', decoded);

    // 3. Essayer de trouver un Admin d'abord
    const admin = await Admin.findById(decoded.id);
    if (admin && admin.actif) {
      req.userId = admin._id;
      req.user = admin;
      req.userRole = 'admin';
      req.adminId = admin._id; // Pour compatibilité
      console.log('Authentification Admin réussie pour:', admin.email);
      return next();
    }

    // 4. Si pas d'admin, essayer de trouver un Administratif ✅
    const administratif = await Administratif.findById(decoded.id);
    if (administratif && administratif.actif) {
      req.userId = administratif._id;
      req.user = administratif;
      req.userRole = 'administratif';
      req.administratifId = administratif._id; // ID spécifique
      console.log('Authentification Administratif réussie pour:', administratif.email);
      return next();
    }

    // 5. Si ni admin ni administratif, essayer de trouver un PaiementManager
    const manager = await PaiementManager.findById(decoded.id);
    if (manager && manager.actif) {
      req.userId = manager._id;
      req.user = manager;
      req.userRole = 'paiement_manager';
      req.managerId = manager._id; // Pour compatibilité
      console.log('Authentification PaiementManager réussie pour:', manager.email);
      return next();
    }

    // 6. Si aucun des précédents, essayer de trouver un Pédagogique
    const pedagogique = await Pedagogique.findById(decoded.id);
    if (pedagogique && pedagogique.actif) {
      req.userId = pedagogique._id;
      req.user = {
        ...pedagogique.toObject(),
        filiere: pedagogique.filiere
      };
      req.userRole = 'pedagogique';
      console.log('Authentification Pédagogique réussie pour:', pedagogique.email, 'Filière:', pedagogique.filiere);
      return next();
    }

    // 7. Aucun utilisateur valide trouvé
    return res.status(404).json({ 
      message: 'Utilisateur non trouvé ou compte inactif' 
    });
    
  } catch (err) {
    console.error('Erreur authAdminOrPaiementManagerOrPedagogique:', err);
    res.status(401).json({ 
      message: 'Token invalide ou expiré', 
      error: err.message
    });
  }
};

module.exports = authAdminOrPaiementManagerOrPedagogique;