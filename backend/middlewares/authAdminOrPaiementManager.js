const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const PaiementManager = require('../models/paiementManagerModel');
const Pedagogique = require('../models/Pedagogique');
const Administratif = require('../models/Administratif');
const FinanceProf = require('../models/financeProfModel');

const authAdminOrPaiementManagerOrPedagogique = async (req, res, next) => {
  try {
    // IGNORER la route de login pour éviter les conflits
    if (req.path === '/api/login' || req.url === '/api/login') {
      return next();
    }

    // 1. Vérifier la présence du token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant ou format invalide' });
    }

    const token = authHeader.split(' ')[1];
    
    // 2. Vérifier que le token n'est pas vide ou corrompu
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Token vide' });
    }

    // 3. Vérifier le format JWT (3 parties)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('Token malformé détecté:', token.substring(0, 20) + '...');
      return res.status(401).json({ 
        message: 'Token malformé. Veuillez vous reconnecter.',
        code: 'MALFORMED_TOKEN'
      });
    }

    // 4. Décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, 'jwt_secret_key');
    } catch (jwtError) {
      console.log('Erreur JWT:', jwtError.name, jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expiré. Veuillez vous reconnecter.',
          code: 'EXPIRED_TOKEN'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Token invalide. Veuillez vous reconnecter.',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({ 
        message: 'Erreur de token',
        code: 'TOKEN_ERROR'
      });
    }

    console.log('Token décodé:', decoded);

    // 5. Essayer de trouver un Admin d'abord
    const admin = await Admin.findById(decoded.id);
    if (admin && admin.actif) {
      req.userId = admin._id;
      req.user = { ...admin.toObject(), role: 'admin', id: admin._id };
      req.userRole = 'admin';
      req.adminId = admin._id;
      console.log('Authentification Admin réussie pour:', admin.email);
      return next();
    }

    // 6. Si pas d'admin, essayer de trouver un Administratif
    const administratif = await Administratif.findById(decoded.id);
    if (administratif && administratif.actif) {
      req.userId = administratif._id;
      req.user = { ...administratif.toObject(), role: 'administratif', id: administratif._id };
      req.userRole = 'administratif';
      req.administratifId = administratif._id;
      console.log('Authentification Administratif réussie pour:', administratif.email);
      return next();
    }

    // 7. Si ni admin ni administratif, essayer de trouver un PaiementManager
    const manager = await PaiementManager.findById(decoded.id);
    if (manager && manager.actif) {
      req.userId = manager._id;
      req.user = { ...manager.toObject(), role: 'paiement_manager', id: manager._id };
      req.userRole = 'paiement_manager';
      req.managerId = manager._id;
      console.log('Authentification PaiementManager réussie pour:', manager.email);
      return next();
    }

    // 8. Si aucun des précédents, essayer de trouver un FinanceProf
    const financeProf = await FinanceProf.findById(decoded.id);
    if (financeProf && financeProf.actif) {
      req.userId = financeProf._id;
      req.user = { ...financeProf.toObject(), role: 'finance_prof', id: financeProf._id };
      req.userRole = 'finance_prof';
      req.profId = financeProf._id;
      req.prof = financeProf;
      console.log('Authentification FinanceProf réussie pour:', financeProf.email);
      return next();
    }

    // 9. Si aucun des précédents, essayer de trouver un Pédagogique
    const pedagogique = await Pedagogique.findById(decoded.id);
    if (pedagogique && pedagogique.actif) {
      req.userId = pedagogique._id;
      req.user = {
        ...pedagogique.toObject(),
        role: 'pedagogique',
        id: pedagogique._id,
        filiere: pedagogique.filiere
      };
      req.userRole = 'pedagogique';
      console.log('Authentification Pédagogique réussie pour:', pedagogique.email, 'Filière:', pedagogique.filiere);
      return next();
    }

    // 10. Aucun utilisateur valide trouvé
    return res.status(404).json({ 
      message: 'Utilisateur non trouvé ou compte inactif' 
    });
    
  } catch (err) {
    console.error('Erreur authAdminOrPaiementManagerOrPedagogique:', err);
    res.status(401).json({ 
      message: 'Erreur d\'authentification', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Token invalide'
    });
  }
};

module.exports = authAdminOrPaiementManagerOrPedagogique;