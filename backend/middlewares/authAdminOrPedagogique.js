// 1. CORRECTION DU MIDDLEWARE authAdminOrPedagogique.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Pedagogique = require('../models/Pedagogique');

const authAdminOrPedagogique = async (req, res, next) => {
  try {
    console.log('🔍 Middleware authAdminOrPedagogique appelé');
    console.log('📍 URL:', req.originalUrl);
    console.log('📍 Method:', req.method);
    console.log('📍 Headers Authorization:', req.headers.authorization);
    
    // Vérifier la présence du token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token manquant ou format invalide');
      return res.status(401).json({ 
        message: 'Accès non autorisé - Token manquant',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token reçu:', token ? 'Présent' : 'Absent');
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Token vide:', token);
      return res.status(401).json({ 
        message: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }

    // Vérifier le format du token JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('❌ Token mal formé, parties:', tokenParts.length);
      return res.status(401).json({ 
        message: 'Token mal formé. Veuillez vous reconnecter.',
        code: 'MALFORMED_TOKEN'
      });
    }

    // Décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, 'jwt_secret_key');
      console.log('✅ Token décodé:', {
        id: decoded.id,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000)
      });
    } catch (jwtError) {
      console.log('❌ Erreur JWT:', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expiré. Veuillez vous reconnecter.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Token invalide. Veuillez vous reconnecter.',
          code: 'INVALID_SIGNATURE'
        });
      }
      return res.status(401).json({ 
        message: 'Erreur de vérification du token',
        code: 'JWT_ERROR'
      });
    }

    // Vérifier que les champs requis sont présents
    if (!decoded.id || !decoded.role) {
      console.log('❌ Token incomplet:', decoded);
      return res.status(401).json({ 
        message: 'Token incomplet',
        code: 'INCOMPLETE_TOKEN'
      });
    }

    console.log('🔑 Recherche utilisateur avec role:', decoded.role, 'et ID:', decoded.id);

    // Vérifier si c'est un admin
    if (decoded.role === 'admin') {
      console.log('🔍 Recherche Admin...');
      const admin = await Admin.findById(decoded.id);
      console.log('👤 Admin trouvé:', admin ? 'Oui' : 'Non');
      
      if (admin) {
        console.log('📝 Admin actif:', admin.actif);
        if (admin.actif) {
          req.userId = admin._id;
          req.user = { 
            ...admin.toObject(), 
            role: 'admin', 
            id: admin._id.toString()
          };
          req.userRole = 'admin';
          console.log('✅ Admin authentifié:', admin.email);
          return next();
        } else {
          return res.status(403).json({ 
            message: 'Compte administrateur inactif',
            code: 'ACCOUNT_INACTIVE'
          });
        }
      }
    }

    // Vérifier si c'est un pédagogique
    if (decoded.role === 'pedagogique') {
      console.log('🔍 Recherche Pédagogique...');
      const pedagogique = await Pedagogique.findById(decoded.id);
      console.log('👤 Pédagogique trouvé:', pedagogique ? 'Oui' : 'Non');
      
      if (pedagogique) {
        console.log('📝 Pédagogique actif:', pedagogique.actif);
        if (pedagogique.actif) {
          req.userId = pedagogique._id;
          req.user = { 
            ...pedagogique.toObject(), 
            role: 'pedagogique', 
            id: pedagogique._id.toString(),
            filiere: pedagogique.filiere 
          };
          req.userRole = 'pedagogique';
          console.log('✅ Pédagogique authentifié:', pedagogique.email);
          return next();
        } else {
          return res.status(403).json({ 
            message: 'Compte pédagogique inactif',
            code: 'ACCOUNT_INACTIVE'
          });
        }
      }
    }

    console.log('❌ Aucun utilisateur trouvé ou rôle non autorisé');
    console.log('🔍 Role recherché:', decoded.role);
    console.log('🔍 ID recherché:', decoded.id);
    
    return res.status(404).json({ 
      message: 'Utilisateur non trouvé ou rôle non autorisé pour cette action',
      code: 'USER_NOT_FOUND',
      debug: {
        role: decoded.role,
        id: decoded.id
      }
    });
    
  } catch (err) {
    console.error('❌ Erreur authAdminOrPedagogique:', err);
    res.status(500).json({ 
      message: 'Erreur interne d\'authentification', 
      code: 'INTERNAL_ERROR',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur serveur'
    });
  }
};

module.exports = authAdminOrPedagogique;