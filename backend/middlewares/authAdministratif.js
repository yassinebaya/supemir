// middlewares/authAdministratif.js

const jwt = require('jsonwebtoken');
const Administratif = require('../models/administratifModel');

const authAdministratif = async (req, res, next) => {
  try {
    // 1. Vérifier la présence du token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, 'jwt_secret_key');
    console.log('Token décodé pour Administratif:', decoded);

    // 3. Chercher l'utilisateur administratif
    const administratif = await Administratif.findById(decoded.id);
    if (!administratif) {
      return res.status(404).json({ message: 'Utilisateur administratif non trouvé' });
    }

    // 4. Vérifier si le compte est actif
    if (!administratif.actif) {
      return res.status(403).json({ message: 'Compte administratif inactif' });
    }

    // 5. Ajouter les informations à la requête
    req.userId = administratif._id;
    req.user = administratif;
    req.userRole = 'administratif';
    req.administratifId = administratif._id;

    console.log('✅ Authentification Administratif réussie pour:', administratif.email);
    
    // 6. Continuer vers la route suivante
    next();
    
  } catch (err) {
    console.error('❌ Erreur authAdministratif:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    
    return res.status(500).json({ 
      message: 'Erreur serveur lors de l\'authentification',
      error: err.message
    });
  }
};

module.exports = authAdministratif;