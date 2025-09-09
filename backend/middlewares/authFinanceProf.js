const jwt = require('jsonwebtoken');
const FinanceProf = require('../models/financeProfModel');

const authFinanceProf = async (req, res, next) => {
  try {
    // 1. Vérifier la présence du token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, 'jwt_secret_key');
    console.log('Token décodé:', decoded); // Debug

    // 3. Chercher le professeur dans la base
    const prof = await FinanceProf.findById(decoded.id);
    if (!prof) {
      console.log('Professeur non trouvé pour ID:', decoded.id); // Debug
      return res.status(404).json({ message: 'Professeur de finance non trouvé' });
    }

    // 4. Vérifier si le compte est actif
    if (!prof.actif) {
      console.log('Compte professeur inactif:', prof.email); // Debug
      return res.status(403).json({ message: '⛔ Compte professeur inactif' });
    }

    // 5. Attacher les informations à la requête
    req.profId = prof._id;
    req.prof = prof;
    req.userRole = 'finance_prof';
    
    console.log('Authentification réussie pour:', prof.email); // Debug
    next();
    
  } catch (err) {
    console.error('Erreur authFinanceProf:', err); // Debug détaillé
    res.status(401).json({ 
      message: 'Token invalide ou expiré', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = authFinanceProf;