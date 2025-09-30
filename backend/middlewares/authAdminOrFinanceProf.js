const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const FinanceProf = require('../models/financeProfModel');

const authAdminOrFinanceProf = async (req, res, next) => {
  try {
    // 1. Vérifier la présence du token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, 'jwt_secret_key');
    console.log('Token décodé:', decoded); // Debug

    // 3. D'abord chercher dans les admins
    let user = await Admin.findById(decoded.id);
    if (user) {
      req.adminId = decoded.id;
      req.admin = user;
      req.userRole = 'admin';
      req.userType = 'admin';
      console.log('Admin authentifié:', user.email);
      return next();
    }

    // 4. Si pas trouvé dans les admins, chercher dans les professeurs
    user = await FinanceProf.findById(decoded.id);
    if (user) {
      // Vérifier si le compte professeur est actif
      if (!user.actif) {
        console.log('Compte professeur inactif:', user.email);
        return res.status(403).json({ message: '⛔ Compte professeur inactif' });
      }
      
      req.profId = decoded.id;
      req.prof = user;
      req.userRole = 'finance_prof';
      req.userType = 'finance_prof';
      console.log('Professeur authentifié:', user.email);
      return next();
    }

    // 5. Si aucun utilisateur trouvé
    console.log('Aucun utilisateur trouvé pour ID:', decoded.id);
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
  } catch (err) {
    console.error('Erreur authAdminOrFinanceProf:', err);
    res.status(401).json({ 
      message: 'Token invalide ou expiré', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = authAdminOrFinanceProf;