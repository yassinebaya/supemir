const jwt = require('jsonwebtoken');
const Professeur = require('../models/professeurModel');

const authProfesseur = async (req, res, next) => {
  try {
    // 1. Vérifier la présence du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Accès refusé. Token manquant ou format invalide.' 
      });
    }

    // 2. Extraire le token
    const token = authHeader.split(' ')[1];
    
    // 3. Vérifier que le token n'est pas vide ou corrompu
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ 
        message: 'Token vide ou invalide.' 
      });
    }

    // 4. Vérifier le format JWT (3 parties)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({ 
        message: 'Format de token invalide. Veuillez vous reconnecter.',
        code: 'MALFORMED_TOKEN'
      });
    }

    // 5. Décoder et vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, 'jwt_secret_key');
    } catch (jwtError) {
      console.log('Erreur JWT professeur:', jwtError.name, jwtError.message);
      
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

    // 6. Vérifier le rôle (accepter 'professeur' et 'prof' pour compatibilité)
    if (decoded.role !== 'professeur' && decoded.role !== 'prof') {
      return res.status(403).json({ 
        message: 'Accès non autorisé. Rôle professeur requis.' 
      });
    }

    // 7. Vérifier que le professeur existe dans la base de données
    const professeur = await Professeur.findById(decoded.id);
    if (!professeur) {
      return res.status(404).json({ 
        message: 'Professeur non trouvé.' 
      });
    }

    // 8. Vérifier que le compte professeur est actif
    if (!professeur.actif) {
      return res.status(403).json({ 
        message: 'Votre compte est inactif. Veuillez contacter l\'administration.' 
      });
    }

    // 9. Mettre à jour la dernière connexion
    try {
      professeur.lastSeen = new Date();
      await professeur.save();
    } catch (updateError) {
      // Ne pas bloquer la requête si la mise à jour échoue
      console.warn('Erreur mise à jour lastSeen professeur:', updateError);
    }

    // 10. Ajouter les informations du professeur à la requête
    req.professeurId = decoded.id;
    req.professeur = professeur;
    req.user = { 
      id: professeur._id, 
      role: 'professeur',
      nom: professeur.nom,
      email: professeur.email
    };

    console.log('Authentification professeur réussie pour:', professeur.email);
    
    // 11. Passer au middleware suivant
    next();

  } catch (error) {
    console.error('Erreur authProfesseur:', error);
    res.status(500).json({ 
      message: 'Erreur interne d\'authentification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

module.exports = authProfesseur;