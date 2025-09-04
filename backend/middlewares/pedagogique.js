const jwt = require('jsonwebtoken');

// Import du modèle Pedagogique
let Pedagogique;
try {
  Pedagogique = require('../models/Pedagogique');
} catch (error) {
  console.error('Modèle Pedagogique non trouvé');
}

// ===== MIDDLEWARE D'AUTHENTIFICATION PÉDAGOGIQUE =====
const authPedagogique = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, 'jwt_secret_key');
    
    if (decoded.role !== 'pedagogique') {
      return res.status(403).json({ message: 'Accès refusé - Rôle pédagogique requis' });
    }

    // Vérification avec le modèle Pedagogique
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
      // Fallback si le modèle n'est pas disponible
      req.user = {
        id: decoded.id,
        role: 'pedagogique',
        filiere: decoded.filiere,
        nom: decoded.nom,
        estGeneral: decoded.filiere === 'GENERAL'
      };
    }

    next();
  } catch (error) {
    console.error('Erreur auth pédagogique:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = {
  authPedagogique
};