const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const PaiementManager = require('../models/paiementManagerModel');
const Pedagogique = require('../models/Pedagogique');
const Administratif = require('../models/Administratif');
const FinanceProf = require('../models/financeProfModel');
const Partner = require('../models/partner');

const authAdminOrPaiementManagerOrPedagogique = async (req, res, next) => {
  try {
    if (req.path === '/api/login' || req.url === '/api/login') {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant ou format invalide' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Token vide' });
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('Token malformé détecté:', token.substring(0, 20) + '...');
      return res.status(401).json({ 
        message: 'Token malformé. Veuillez vous reconnecter.',
        code: 'MALFORMED_TOKEN'
      });
    }

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

    // Partner
    if (decoded.type === 'partner') {
      const partner = await Partner.findById(decoded.id);

      if (!partner) {
        return res.status(404).json({ message: 'Partner non trouvé' });
      }

      if (!partner.active) {
        return res.status(403).json({ message: '⛔ Compte partner inactif' });
      }

      req.userId = partner._id;
      req.user = { ...partner.toObject(), role: 'partner', id: partner._id };
      req.userRole = 'partner';
      req.userType = 'partner'; // ✅ AJOUT
      req.commercialId = partner._id;
      req.commercial = partner;
      req.isPartner = true;
      
      console.log('Authentification Partner réussie pour:', partner.email || partner.nom);
      return next();
    }

    // Admin
    const admin = await Admin.findById(decoded.id);
    if (admin && admin.actif) {
      req.userId = admin._id;
      req.user = { ...admin.toObject(), role: 'admin', id: admin._id };
      req.userRole = 'admin';
      req.userType = 'admin'; // ✅ AJOUT
      req.adminId = admin._id;
      console.log('Authentification Admin réussie pour:', admin.email);
      return next();
    }

    // Administratif
    const administratif = await Administratif.findById(decoded.id);
    if (administratif && administratif.actif) {
      req.userId = administratif._id;
      req.user = { ...administratif.toObject(), role: 'administratif', id: administratif._id };
      req.userRole = 'administratif';
      req.userType = 'administratif'; // ✅ AJOUT
      req.administratifId = administratif._id;
      console.log('Authentification Administratif réussie pour:', administratif.email);
      return next();
    }

    // PaiementManager
    const manager = await PaiementManager.findById(decoded.id);
    if (manager && manager.actif) {
      req.userId = manager._id;
      req.user = { ...manager.toObject(), role: 'paiement_manager', id: manager._id };
      req.userRole = 'paiement_manager';
      req.userType = 'paiement_manager'; // ✅ AJOUT
      req.managerId = manager._id;
      console.log('Authentification PaiementManager réussie pour:', manager.email);
      return next();
    }

    // FinanceProf
    const financeProf = await FinanceProf.findById(decoded.id);
    if (financeProf && financeProf.actif) {
      req.userId = financeProf._id;
      req.user = { ...financeProf.toObject(), role: 'finance_prof', id: financeProf._id };
      req.userRole = 'finance_prof';
      req.userType = 'finance_prof'; // ✅ AJOUT
      req.profId = financeProf._id;
      req.prof = financeProf;
      console.log('Authentification FinanceProf réussie pour:', financeProf.email);
      return next();
    }

    // Pédagogique
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
      req.userType = 'pedagogique'; // ✅ AJOUT
      console.log('Authentification Pédagogique réussie pour:', pedagogique.email, 'Filière:', pedagogique.filiere);
      return next();
    }

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