const jwt = require('jsonwebtoken');
const PaiementManager = require('../models/paiementManagerModel');

const authPaiementManager = async (req, res, next) => {
  try {
    // 1. VÃ©rifier la prÃ©sence du token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    // 2. VÃ©rifier et dÃ©coder le token
    const decoded = jwt.verify(token, 'jwt_secret_key');
    console.log('Token dÃ©codÃ©:', decoded); // Debug

    // 3. Chercher le gestionnaire dans la base
    const manager = await PaiementManager.findById(decoded.id);
    if (!manager) {
      console.log('Gestionnaire non trouvÃ© pour ID:', decoded.id); // Debug
      return res.status(404).json({ message: 'Gestionnaire de paiement non trouvÃ©' });
    }

    // 4. VÃ©rifier si le compte est actif
    if (!manager.actif) {
      console.log('Compte gestionnaire inactif:', manager.email); // Debug
      return res.status(403).json({ message: 'â›” Compte gestionnaire inactif' });
    }

    // 5. Attacher les informations Ã  la requÃªte
    req.managerId = manager._id;
    req.manager = manager;
    req.userRole = 'paiement_manager';
    
    console.log('Authentification rÃ©ussie pour:', manager.email); // Debug
    next();
    
  } catch (err) {
    console.error('Erreur authPaiementManager:', err); // Debug dÃ©taillÃ©
    res.status(401).json({ 
      message: 'Token invalide ou expirÃ©', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = authPaiementManager;






