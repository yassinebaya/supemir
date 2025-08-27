// Middleware combinÃ© pour Admin OU PaiementManager
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const PaiementManager = require('../models/paiementManagerModel');

const authAdminOrPaiementManager = async (req, res, next) => {
  try {
    // 1. VÃ©rifier la prÃ©sence du token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    // 2. VÃ©rifier et dÃ©coder le token
    const decoded = jwt.verify(token, 'jwt_secret_key');
    console.log('Token dÃ©codÃ©:', decoded);

    // 3. Essayer de trouver un Admin d'abord
    const admin = await Admin.findById(decoded.id);
    if (admin && admin.actif) {
      req.userId = admin._id;
      req.user = admin;
      req.userRole = 'admin';
      console.log('Authentification Admin rÃ©ussie pour:', admin.email);
      return next();
    }

    // 4. Si pas d'admin, essayer de trouver un PaiementManager
    const manager = await PaiementManager.findById(decoded.id);
    if (manager && manager.actif) {
      req.userId = manager._id;
      req.user = manager;
      req.userRole = 'paiement_manager';
      console.log('Authentification PaiementManager rÃ©ussie pour:', manager.email);
      return next();
    }

    // 5. Aucun utilisateur valide trouvÃ©
    return res.status(404).json({ 
      message: 'Utilisateur non trouvÃ© ou compte inactif' 
    });
    
  } catch (err) {
    console.error('Erreur authAdminOrPaiementManager:', err);
    res.status(401).json({ 
      message: 'Token invalide ou expirÃ©', 
      error: err.message
    });
  }
};

module.exports = authAdminOrPaiementManager;






