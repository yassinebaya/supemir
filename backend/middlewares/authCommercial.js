const jwt = require('jsonwebtoken');
const Commercial = require('../models/commercialModel');
const Partner = require('../models/partner');
const Admin = require('../models/adminModel');

const authCommercial = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    const decoded = jwt.verify(token, 'jwt_secret_key');
    console.log('Token décodé:', decoded); // Pour debug
    
    // Check token type and handle accordingly
    if (decoded.type === 'partner') {
      // Handle partner authentication
      const partner = await Partner.findById(decoded.id);

      if (!partner) {
        return res.status(404).json({ message: 'Partner non trouvé' });
      }

      if (!partner.active) {
        return res.status(403).json({ message: '⛔ Compte partner inactif' });
      }

      console.log('Authentification Partner réussie pour:', partner.email);

      // Set partner-specific request properties
      req.partnerId = partner._id;        // IMPORTANT: Pour les opérations partner
      req.commercial = partner;           // Keep for compatibility
      req.isPartner = true;              // Flag pour identifier un partner
      req.isAdmin = false;               // Pas un admin
      req.user = partner;                // Référence générique
      
    } else if (decoded.type === 'admin') {
      // Handle admin authentication
      const admin = await Admin.findById(decoded.id);

      if (!admin) {
        return res.status(404).json({ message: 'Admin non trouvé' });
      }

      if (!admin.actif) {
        return res.status(403).json({ message: '⛔ Compte admin inactif' });
      }

      console.log('Authentification Admin réussie pour:', admin.email);

      // Set admin-specific request properties
      req.adminId = admin._id;
      req.commercial = admin;            // Keep for compatibility
      req.isPartner = false;
      req.isAdmin = true;                // Flag pour identifier un admin
      req.user = admin;
      
    } else {
      // Handle commercial authentication (comportement par défaut)
      const commercial = await Commercial.findById(decoded.id);

      if (!commercial) {
        return res.status(404).json({ message: 'Commercial non trouvé' });
      }

      if (!commercial.actif) {
        return res.status(403).json({ message: '⛔ Compte commercial inactif' });
      }

      console.log('Authentification Commercial réussie pour:', commercial.email);

      // Set commercial-specific request properties
      req.commercialId = commercial._id;
      req.commercial = commercial;
      req.isPartner = false;
      req.isAdmin = false;
      req.user = commercial;
    }
    
    next();
  } catch (err) {
    console.error('Erreur middleware auth:', err);
    res.status(401).json({ 
      message: 'Token invalide ou expiré', 
      error: err.message 
    });
  }
};

module.exports = authCommercial;